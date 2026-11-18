"""Smoke/E2E sobre Waitress e assets reais. Run via --help for optional environments."""

import argparse
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import time
import tempfile
from urllib.request import build_opener, ProxyHandler
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PACKS = [
    json.loads(p.read_text()) for p in sorted((ROOT / "data/subjects").glob("*.json"))
]
BANK = {
    q["id"]: q
    for a in PACKS
    for t in a["tracks"]
    for l in t["lessons"]
    for q in l["questions"]
}
parser = argparse.ArgumentParser()
parser.add_argument(
    "--browser", choices=["chromium", "firefox", "webkit"], default="chromium"
)
parser.add_argument("--width", type=int, default=390)
parser.add_argument("--height", type=int, default=844)
parser.add_argument(
    "--sweep",
    action="store_true",
    help="Percorre todas as práticas e conclusões de trilha.",
)
parser.add_argument(
    "--audit",
    action="store_true",
    help="Verifica contraste e reflow nas telas do hub e do acervo.",
)
parser.add_argument("--axe", type=Path, help="Caminho para axe.min.js, opcional.")
parser.add_argument(
    "--reopen",
    action="store_true",
    help="Valida reinício real do navegador, preservação do acervo, corrupção e recuperação HTTP.",
)
parser.add_argument("--port", type=int, default=5260)
args = parser.parse_args()
ROOT_URL = f"http://127.0.0.1:{args.port}"
STORE = "JSON.parse(localStorage.getItem('lacuna:v1'))"
server = subprocess.Popen(
    [os.environ.get("LACUNA_TEST_PYTHON", sys.executable), "serve.py"],
    cwd=ROOT,
    env={**os.environ, "PORT": str(args.port)},
    stdout=subprocess.DEVNULL,
)
errors = []


def start():
    for _ in range(80):
        try:
            with build_opener(ProxyHandler({})).open(
                ROOT_URL + "/api/health", timeout=0.5
            ) as r:
                if r.status == 200:
                    return
        except OSError:
            time.sleep(0.08)
    raise RuntimeError("O servidor de teste não abriu.")


def nav(page, route):
    page.goto(ROOT_URL + "/#/" + route)
    expect(page.locator("#main")).to_have_attribute("data-view", route)
    page.locator("#main h1").first.wait_for()


def current(page):
    return page.evaluate(
        f"""() => {{const h={STORE}.hub, r=h.runs[location.hash.split('/')[2]];return r?.ids[r.index]}}"""
    )


def answer(page, q, value=None):
    v = q["validator"] if value is None else value
    form = page.locator("#hub-answer")
    if q["format"] == "order":
        for target, label in enumerate(v):
            items = form.locator(".order-items li")
            ix = items.locator("span").all_text_contents().index(label)
            while ix > target:
                items.nth(ix).locator('[data-shift="-1"]').click()
                ix -= 1
    elif q["options"]:
        form.get_by_label(v, exact=True).check()
    else:
        form.locator("[name=answer]").fill(v)
    form.get_by_role("button", name="Conferir resposta").click()
    expect(page.locator(".hub-feedback")).to_be_visible()


def finish(page):
    page.wait_for_url("**/#/atividade/*")
    page.locator("#hub-answer, [data-hub=advance]").first.wait_for()
    n = 0
    while (
        page.locator("[data-hub=advance]").count()
        or page.locator("#hub-answer").count()
    ):
        q = BANK[current(page)]
        if page.locator("#hub-answer").count():
            answer(page, q)
        page.locator("[data-hub=advance]").click()
        n += 1
        assert n <= 8
    return n


def audit(page, label):
    overflow = page.evaluate("document.documentElement.scrollWidth-innerWidth")
    assert overflow <= 1, (label, "overflow", overflow)
    if args.axe:
        page.evaluate(args.axe.read_text())
        found = page.evaluate(
            """async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))"""
        )
        print(f"axe {label}: {json.dumps(found, ensure_ascii=False)}", flush=True)
        assert not found, (label, found)


def journey(page):
    page.add_init_script("""() => {
      window.mediaRequests=0;
      if (navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices,'getUserMedia',{
        value: async () => { window.mediaRequests++; throw new DOMException('Permission denied','NotAllowedError'); }
      });
    }""")
    nav(page, "")
    page.get_by_role("link", name="Começar a aprender").click()
    page.get_by_role("link", name="Pular e explorar").click()
    expect(page.locator(".area-tile")).to_have_count(10)
    audit(page, "explorar")
    bot = page.locator("#lumi-handle")
    handle = bot.bounding_box()
    rail = page.locator(".lumi-rail").bounding_box()
    page.mouse.move(handle["x"] + 23, handle["y"] + 23)
    page.mouse.down()
    page.mouse.move(rail["x"] + rail["width"] - 20, handle["y"] + 23, steps=8)
    page.mouse.up()
    assert page.evaluate(f"{STORE}.hub.position") > 0.65
    bot.press("Home")
    assert page.evaluate(f"{STORE}.hub.position") == 0.5
    # Access the main heading and radios through browser accessibility semantics.
    assert "Explore as áreas" in page.locator("#main").aria_snapshot()

    page.locator('a[href="#/area/matematica"]').click()
    page.locator("[data-hub=diagnostic]").click()
    assert finish(page) == 6
    page.get_by_role("link", name="Ver recomendação").click()
    audit(page, "painel")
    nav(page, "trilha/mat-bases")
    page.get_by_role("button", name="Lista", exact=True).press("Enter")
    expect(page.locator("ol.skill-path")).not_to_have_class("skill-path map")
    page.get_by_role("link", name="Repartir em grupos").press("Enter")
    page.locator("[data-hub=mini]").first.click()
    expect(page.locator("#mini-that")).not_to_be_empty()
    page.locator("[data-hub=lesson]").click()
    q = BANK[current(page)]
    if q["options"]:
        wrong = next(o for o in q["options"] if o != q["validator"])
    else:
        wrong = "999"
    answer(page, q, wrong)
    page.locator("#lumi-handle").click()
    page.locator("[data-talk=hint]").click()
    expect(page.locator(".hint-line")).to_have_count(1)
    page.reload()
    expect(page.locator(".hint-line")).to_have_count(1)
    audit(page, "atividade-com-pista")
    assert finish(page) == 3
    nav(page, "perfil")
    page.locator("[name=name]").fill("Leo <3")
    page.get_by_label("Música e instrumentos", exact=True).check()
    page.get_by_role("button", name="Salvar preferências").click()
    nav(page, "colecao")
    page.locator("[data-hub=buy][data-value=scarf]").click()
    page.locator("[data-hub=equip][data-value=scarf]").click()
    nav(page, "lumi")
    page.locator("label.swatch-option").filter(has_text="Menta").click()
    expect(page.locator("input[name=color][value=mint]")).to_be_checked()
    page.locator("#lumi-name").fill("Órbita")
    page.locator("#lumi-form button[type=submit]").click()
    nav(page, "configuracoes")
    page.locator("[data-setting=theme]").select_option("dark")
    page.locator("[data-setting=large]").check()
    page.locator("[data-setting=contrast]").check()
    page.locator("#reduce-motion").check()
    page.reload()
    expect(page.locator("body")).to_have_attribute("data-theme", "dark")
    nav(page, "perfil")
    expect(page.get_by_role("heading", name="🌱 Leo <3")).to_be_visible()
    audit(page, "perfil-escuro-ampliado")
    # local test clock: no change to records or reward balances.
    page.clock.install()
    page.clock.set_system_time(
        page.evaluate("new Date(Date.now()+3*86400000).toISOString()")
    )
    nav(page, "revisoes")
    page.locator("[data-hub=review]").first.click()
    assert finish(page) == 1
    assert (
        page.evaluate(
            f"{STORE}.hub.events.filter(e=>e.type==='review_completed').length"
        )
        == 1
    )
    nav(page, "experiencia/ritmo~mus-pulso")
    page.locator("[data-lab=metro]").click()
    for _ in range(4):
        page.locator("[data-lab=tap]").press("Enter")
    expect(page.locator("#tap-result")).to_contain_text("Diferença média")
    page.locator("[data-lab=metro]").click()
    page.locator("[data-lab=sound]").click()
    assert page.evaluate("window.mediaRequests") == 0
    nav(page, "experiencia/notas~mus-altura")
    page.locator("[data-lab=note]").nth(0).click()
    page.locator("[data-lab=note]").nth(2).click()
    expect(page.locator("#note-readout")).to_contain_text("subiu")
    nav(page, "experiencia/movimento~fis-grafico")
    page.locator("[data-range=vel]").fill("-2")
    expect(page.locator("#motion-value")).to_contain_text("= -6 m")
    nav(page, "experiencia/cubo~cub-inversa")
    page.locator("[data-lab=case]").click()
    page.locator("[data-lab=inverse]").click()
    for f in ["U", "R"]:
        page.locator(f"[data-lab=turn][data-value={f}]").press("Enter")
    expect(page.locator("#cube-state")).to_contain_text("Treino concluído")
    page.locator("[data-lab=cube-view]").click()
    audit(page, "cubo-3d")
    page.get_by_role("link", name="Voltar à microaula").click()
    expect(page.locator("h1")).to_have_text("Desfazer uma sequência")
    # Confirm v1 read, current customisation and local data after another navigation.
    nav(page, "classico")
    expect(page.locator(".knowledge-graph svg")).to_be_visible()
    assert page.evaluate(f"{STORE}.lumi.color") == "mint"
    assert page.evaluate(f"{STORE}.hub.outfit") == "scarf"
    print("Jornada completa:", args.browser, args.width, args.height, flush=True)


def sweep(page):
    n = 0
    for area in PACKS:
        for track in area["tracks"]:
            nav(page, "trilha/" + track["id"])
            for l in track["lessons"]:
                page.get_by_role("link", name=l["title"], exact=True).click()
                page.locator("[data-hub=lesson]").click()
                assert finish(page) == 3
                n += 3
                page.get_by_role("link", name="Voltar à trilha").click()
            page.locator("[data-hub=checkpoint]").click()
            n += finish(page)
        print("Percurso completo:", area["title"], flush=True)
    assert n == 200
    assert (
        page.evaluate(
            f"{STORE}.hub.events.filter(e=>e.type==='lesson_completed').length"
        )
        == 60
    )
    print("60 microaulas, 180 práticas e 20 verificações finais aprovadas.", flush=True)
    for area in PACKS:
        nav(page, "area/" + area["id"])
        page.locator("[data-hub=diagnostic]").click()
        assert finish(page) == 6
    page.clock.install()
    for number in (1, 2):
        page.clock.set_system_time(
            page.evaluate("new Date(Date.now()+3*86400000).toISOString()")
        )
        for area in PACKS:
            for track in area["tracks"]:
                for lesson in track["lessons"]:
                    nav(page, "revisoes")
                    page.locator(
                        '[data-hub=review][data-value="' + lesson["id"] + '"]'
                    ).click()
                    assert finish(page) == 1
        print("Rodada de 60 revisões", number, flush=True)
    nav(page, "revisoes")
    assert not page.locator("[data-hub=review]").count()
    assert (
        page.evaluate(
            f"{STORE}.hub.events.filter(x=>x.type==='practice_correct').length"
        )
        == 380
    )
    print("380 itens distintos percorridos pela interface.", flush=True)


def screens(page):
    routes = [
        "",
        "boas-vindas",
        "trilha/mat-bases",
        "licao/mat-grupos",
        "classico",
        "aula/N16",
        "lumi",
        "diagnostico",
        "configuracoes",
        "revisoes",
        "colecao",
        "laboratorio",
        "experiencia/ritmo",
        "experiencia/cubo",
    ]
    for theme in ["light", "dark"]:
        nav(page, "configuracoes")
        page.locator("[data-setting=theme]").select_option(theme)
        for route in routes:
            nav(page, route)
            audit(page, theme + " " + route)
    # 640 CSS pixels at 200% page zoom correspond to 320 CSS pixels of reflow.
    page.set_viewport_size({"width": 320, "height": 650})
    for route in routes:
        nav(page, route)
        overflow = page.evaluate("document.documentElement.scrollWidth-innerWidth")
        assert overflow <= 1, (route, "320 CSS px", overflow)
    print("14 rotas em dois temas e reflow a 320 CSS px.", flush=True)


def reopen(browser_type, launch):
    with tempfile.TemporaryDirectory(prefix="lacuna-e2e-") as profile:

        def session():
            ctx = browser_type.launch_persistent_context(
                profile,
                viewport={"width": 820, "height": 1024},
                reduced_motion="reduce",
                **launch,
            )
            page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            return ctx, page

        ctx, page = session()
        nav(page, "classico")
        old = page.evaluate(STORE)
        old.pop("hub")
        old["lumi"]["name"] = "Lume"
        old["lessons"] = [
            {
                "concept_id": "N20",
                "session_id": "v1-old",
                "completed_at": "2026-01-10T11:15:00Z",
            }
        ]
        page.evaluate("(raw)=>localStorage.setItem('lacuna:v1',raw)", json.dumps(old))
        page.reload()
        nav(page, "classico")
        expect(page.locator(".knowledge-graph")).to_be_visible()
        assert page.evaluate(f"{STORE}.lessons[0].concept_id") == "N20"
        nav(page, "licao/mat-grupos")
        page.locator("[data-hub=lesson]").click()
        q = BANK[current_after_open(page)]
        value = q["validator"]
        page.locator("input[name=answer]").fill(value)
        page.locator("[data-hub=hint]").click()
        expect(page.locator(".hint-line")).to_have_count(1)
        ctx.close()
        ctx, page = session()
        nav(page, "painel")
        page.get_by_role("link", name="Continuar atividade", exact=True).click()
        expect(page.locator("input[name=answer]")).to_have_value(value)
        expect(page.locator(".hint-line")).to_have_count(1)
        page.route("**/api/hub/check", lambda route: route.abort())
        page.get_by_role("button", name="Conferir resposta").click()
        expect(page.locator("#hub-error")).not_to_be_empty()
        assert not page.evaluate(
            f"{STORE}.hub.events.some(x=>x.type==='practice_correct')"
        )
        page.unroute("**/api/hub/check")
        assert finish(page) == 3
        assert (
            page.evaluate(
                f"{STORE}.hub.events.filter(x=>x.type==='lesson_completed').length"
            )
            == 1
        )
        original = '{"broken":'
        page.evaluate("(raw)=>localStorage.setItem('lacuna:v1',raw)", original)
        page.reload()
        nav(page, "configuracoes")
        expect(page.locator("#storage-warning")).to_be_visible()
        expect(page.locator("[data-action=export-original]")).to_be_visible()
        assert page.evaluate("localStorage.getItem('lacuna:v1')") == original
        ctx.close()
        print(
            "Reabertura real, migração N20, pista, rascunho, falha HTTP e preservação do original aprovados.",
            flush=True,
        )


def current_after_open(page):
    page.wait_for_url("**/#/atividade/*")
    page.locator("#hub-answer").wait_for()
    return current(page)


try:
    start()
    with sync_playwright() as p:
        kw = {}
        if os.getenv("LACUNA_BROWSER_EXE"):
            kw["executable_path"] = os.environ["LACUNA_BROWSER_EXE"]
        if os.getenv("LACUNA_BROWSER_ARGS"):
            kw["args"] = shlex.split(os.environ["LACUNA_BROWSER_ARGS"])
        if args.reopen:
            reopen(getattr(p, args.browser), kw)
            assert not errors, errors
            sys.exit(0)
        browser = getattr(p, args.browser).launch(**kw)
        page = browser.new_page(
            viewport=dict(width=args.width, height=args.height), reduced_motion="reduce"
        )
        page.set_default_timeout(7000)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        if args.audit:
            screens(page)
        elif args.sweep:
            sweep(page)
        else:
            journey(page)
        assert not errors, errors
        browser.close()
finally:
    server.terminate()
    server.wait()
