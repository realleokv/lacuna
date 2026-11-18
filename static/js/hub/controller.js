import { api } from '../utils.js';
import {
  advanceRun,
  answerState,
  buy,
  difficulty,
  due,
  emit,
  finished,
  freshReview,
  startRun,
  submitResult,
} from './progress.js';
import { indexCatalog, hubView, prefs } from './views.js';

export function createHub({ state, save, render, go, main, notify, session }) {
  let idx,
    pending = false,
    dragIndex = null;
  const h = () => state().hub;
  const route = () => location.hash.slice(2).split('/');
  const run = () =>
    route()[0] === 'atividade' && Object.hasOwn(h().runs, route()[1])
      ? h().runs[route()[1]]
      : undefined;
  const q = () => idx.questions.get(run()?.ids[run().index]);
  const context = () => [run(), q(), location.hash];
  const isCurrent = ([r, item, hash]) =>
    hash === location.hash && r === run() && item === q();
  function rerender(focus) {
    save();
    render();
    if (focus) main.querySelector(focus)?.focus();
  }
  function begin(mode, target) {
    const l = idx.lessons.find((l) => l.id === target),
      t = idx.tracks.find((t) => t.id === target),
      a = idx.areas.find((a) => a.id === target);
    let items;
    if (mode === 'lesson' && l) {
      const level = difficulty(h(), l.id);
      items = l.questions
        .filter((q) => q.role === 'practice')
        .sort(
          (a, b) =>
            Math.abs(a.difficulty - level) - Math.abs(b.difficulty - level),
        );
    }
    if (mode === 'diagnostic' && a)
      items = a.tracks.flatMap((t) =>
        t.lessons.flatMap((l) =>
          l.questions.filter((q) => q.role === 'diagnostic'),
        ),
      );
    if (
      mode === 'checkpoint' &&
      t &&
      t.lessons.every((l) => finished(h(), 'lesson_completed', l.id))
    )
      items = t.lessons.flatMap((l) =>
        l.questions.filter((q) => q.role === 'checkpoint'),
      );
    if (mode === 'review' && l && due(h(), l.id, Date.now(), session)) {
      const existing = h().runs['review~' + target];
      const item = freshReview(h(), l);
      items =
        existing && existing.index < existing.ids.length
          ? existing.ids.map((id) => idx.questions.get(id))
          : item
            ? [item]
            : [];
    }
    if (!items?.length) return;
    const r = startRun(h(), mode, target, items, session);
    save();
    go('#/atividade/' + r.key);
  }
  async function guarded(task) {
    if (pending) return;
    pending = true;
    try {
      await task();
    } catch (err) {
      const el = main.querySelector('#hub-error');
      if (el) el.textContent = err.message;
      else notify(err.message);
    } finally {
      pending = false;
    }
  }
  async function onSubmit(event) {
    if (event.target.id === 'hub-profile') {
      event.preventDefault();
      const data = new FormData(event.target);
      h().name = String(data.get('name')).trim().slice(0, 28);
      h().avatar = data.get('avatar');
      h().interests = data.getAll('interest');
      state().onboarded = true;
      save();
      go('#/explorar');
      return;
    }
    if (event.target.id !== 'hub-answer' || !q()) return;
    event.preventDefault();
    const ctx = context(),
      [r, item] = ctx;
    const value =
      item.format === 'order'
        ? [...event.target.querySelectorAll('[data-index] span')].map(
            (el) => el.textContent,
          )
        : new FormData(event.target).get('answer');
    await guarded(async () => {
      const result = await api('hub/check', { id: item.id, answer: value });
      if (!isCurrent(ctx)) return;
      submitResult(h(), r, item, value, result);
      rerender('.hub-feedback');
      document.dispatchEvent(
        new CustomEvent('lumi-say', {
          detail: {
            mood: result.correct ? 'happy' : 'thinking',
            text: result.correct
              ? 'Boa! Você conectou a ideia.'
              : item.format === 'numeric'
                ? 'Vamos conferir a unidade e a operação.'
                : result.text,
          },
        }),
      );
    });
  }
  async function hint() {
    const ctx = context(),
      [r, item] = ctx;
    if (!item) return;
    const a = answerState(r, item.id);
    if (a.correct || a.hints.length >= 2) return;
    await guarded(async () => {
      const level = a.hints.length + 1;
      const result = await api('hub/hint', { id: item.id, level });
      if (!isCurrent(ctx)) return;
      a.hints.push(result.text);
      emit(h(), 'hint_requested', r.id + '.hint.' + item.id + '.' + level, {
        lesson: item.concept_id,
        question: item.id,
      });
      rerender('[data-hub="hint"]');
      notify(result.text);
    });
  }
  function reorder(from, to) {
    const a = answerState(run(), q().id),
      items = Array.isArray(a.draft) ? [...a.draft] : [...q().options];
    if (from < 0 || to < 0 || from >= items.length || to >= items.length)
      return;
    items.splice(to, 0, items.splice(from, 1)[0]);
    a.draft = items;
    rerender();
    main.querySelector(`[data-index="${to}"] button:not([disabled])`)?.focus();
  }
  main.addEventListener('submit', onSubmit);
  main.addEventListener('input', (ev) => {
    if (
      ev.target.closest('#hub-answer') &&
      q() &&
      ev.target.name === 'answer'
    ) {
      answerState(run(), q().id).draft = ev.target.value;
      save();
    }
  });
  main.addEventListener('change', (ev) => {
    const k = ev.target.dataset.setting;
    if (!k) return;
    h().preferences[k] =
      ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
    save();
    apply();
  });
  let matching = false;
  main.addEventListener('dragstart', (ev) => {
    matching = !!ev.target.closest('[data-match-token]');
    if (matching) ev.dataTransfer.setData('text/plain', 'categoria');
  });
  main.addEventListener('dragover', (ev) => {
    if (matching && ev.target.closest('.answer-choices label'))
      ev.preventDefault();
  });
  main.addEventListener('drop', (ev) => {
    const target = ev.target.closest('.answer-choices label');
    if (matching && target) {
      ev.preventDefault();
      target.querySelector('input').click();
    }
    matching = false;
  });
  main.addEventListener('dragend', () => {
    matching = false;
  });
  main.addEventListener('dragstart', (ev) => {
    const li = ev.target.closest('.order-items li');
    if (li) dragIndex = Number(li.dataset.index);
  });
  main.addEventListener('dragover', (ev) => {
    if (dragIndex !== null && ev.target.closest('.order-items'))
      ev.preventDefault();
  });
  main.addEventListener('drop', (ev) => {
    const li = ev.target.closest('.order-items li');
    if (li && dragIndex !== null) {
      ev.preventDefault();
      reorder(dragIndex, Number(li.dataset.index));
    }
    dragIndex = null;
  });
  main.addEventListener('dragend', () => {
    dragIndex = null;
  });
  main.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-hub],[data-shift]');
    if (!b || pending) return;
    if (b.dataset.shift) {
      const i = Number(b.closest('li').dataset.index);
      reorder(i, i + Number(b.dataset.shift));
      return;
    }
    const { hub: act, value } = b.dataset;
    if (['lesson', 'review', 'diagnostic', 'checkpoint'].includes(act)) {
      begin(act, value);
      return;
    }
    if (act === 'mini') {
      const l = idx.lessons.find((l) => l.id === route()[1]);
      const status = main.querySelector('#mini-that');
      if (l && status)
        status.textContent =
          (value === l.mini.solution ? 'Isso! ' : 'Confira o exemplo. ') +
          l.mini.explanation;
    }
    if (act === 'hint') await hint();
    if (act === 'advance' && run()) {
      if (advanceRun(h(), run(), idx.questions)) {
        const last = run().index === run().ids.length;
        rerender();
        main.focus();
        if (last)
          document.dispatchEvent(
            new CustomEvent('lumi-say', {
              detail: {
                mood: 'happy',
                text: 'Sessão concluída. Seu próximo passo já está no painel.',
              },
            }),
          );
      }
    }
    if (act === 'view') {
      h().preferences.view = value;
      rerender('[data-value="' + value + '"]');
    }
    if (act === 'buy') {
      if (buy(h(), value)) rerender();
    }
    if (act === 'equip' && h().owned.includes(value)) {
      if (value === 'star') h().decoration = !h().decoration;
      else if (value === 'observatorio') h().observatory = !h().observatory;
      else if (value === 'salto') h().celebration = !h().celebration;
      else h().outfit = h().outfit === value ? '' : value;
      rerender();
    }
    if (act === 'home-lumi') {
      h().position = 0.5;
      rerender();
      notify('Lumi voltou ao centro da faixa.');
    }
  });
  function apply() {
    const p = h().preferences,
      b = document.body;
    b.dataset.theme =
      p.theme === 'auto'
        ? matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : p.theme;
    b.dataset.outfit = h().outfit;
    b.dataset.observatory = String(!!h().observatory);
    b.dataset.celebration = String(!!h().celebration);
    b.dataset.customAccent = String(p.customAccent === true);
    b.style.setProperty(
      '--custom-lumi',
      /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : '#9080dc',
    );
    b.dataset.large = p.large === true;
    b.dataset.contrast = p.contrast === true;
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  return {
    load: async () => {
      idx = indexCatalog(await api('hub/catalog'));
    },
    view: (r, p) => (idx ? hubView(r, p, state(), idx, session) : null),
    prefs: () => prefs(h()),
    apply,
    hint,
    getIndex: () => idx,
    session,
  };
}
