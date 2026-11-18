import { escapeHTML as e } from '../utils.js';
import { lumiSVG } from '../lumi.js';
import {
  answerState,
  difficulty,
  due,
  evidence,
  finished,
  freshReview,
  labels,
  localDay,
  mastery,
  recommendation,
  SHOP,
  stats,
} from './progress.js';

export function indexCatalog(catalog) {
  const areas = catalog.areas,
    tracks = [],
    lessons = [],
    questions = new Map();
  for (const area of areas)
    for (const t of area.tracks) {
      tracks.push({ ...t, area: area.id });
      for (const l of t.lessons) {
        lessons.push({ ...l, area: area.id, track: t.id });
        for (const q of l.questions) questions.set(q.id, q);
      }
    }
  return { areas, tracks, lessons, questions };
}
const path = (route, id = '') =>
  '#/' + route + (id ? '/' + encodeURIComponent(id) : '');
const link = (route, id, label, cls = 'secondary') =>
  `<a class="hub-btn ${cls}" href="${path(route, id)}">${e(label)}</a>`;
const action = (id, value, label, cls = 'secondary') =>
  `<button type="button" class="hub-btn ${cls}" data-hub="${id}" data-value="${e(value)}">${e(label)}</button>`;
const head = (over, title, lead = '') =>
  `<header class="hub-head"><span class="kicker">${e(over)}</span><h1>${e(title)}</h1>${lead ? `<p>${e(lead)}</p>` : ''}</header>`;
const box = (html) => `<section class="hub-shell">${html}</section>`;
const byId = (items, id) => items.find((x) => x.id === id);
const missing = () =>
  box(
    head('Lacuna', 'Caminho não encontrado') +
      link('explorar', '', 'Explorar áreas'),
  );
const choices = (rows, value) =>
  rows
    .map(
      ([k, v]) =>
        `<option value="${e(k)}" ${String(value) === String(k) ? 'selected' : ''}>${e(v)}</option>`,
    )
    .join('');
const countDone = (h, lessons) =>
  lessons.filter((l) => finished(h, 'lesson_completed', l.id)).length;
const runLink = (run) =>
  link('atividade', run.key, 'Continuar atividade', 'primary');
const readyReviews = (h, idx, session) =>
  idx.lessons.filter(
    (l) => due(h, l.id, Date.now(), session) && freshReview(h, l),
  );
function tile(area, h) {
  const lessons = area.tracks.flatMap((t) => t.lessons);
  return `<a class="area-tile" href="${path('area', area.id)}"><span class="area-mark" aria-hidden="true">${e(area.symbol)}</span><strong>${e(area.title)}</strong><small>${area.tracks.length} trilhas · ${countDone(h, lessons)}/${lessons.length} aulas</small></a>`;
}
function dashboard(h, idx, s, session) {
  const r = recommendation(h, idx.lessons, Date.now(), session),
    m = stats(h);
  const resumable = h.runs[h.resume];
  const classic = !resumable && s.active;
  return box(
    head(
      'Meu painel',
      h.name ? 'Oi, ' + h.name + '.' : 'Seu espaço de estudo.',
    ) +
      `
  <div class="hub-feature"><div><span class="kicker">${resumable || classic ? 'De onde você parou' : 'Sugestão do Lumi'}</span><h2>${e(resumable ? targetTitle(resumable, idx) : classic ? 'Matemática · atividade em andamento' : r.lesson.title)}</h2><p>${e(resumable || classic ? 'Sua atividade está salva neste navegador.' : r.reason)}</p>
  ${resumable ? runLink(resumable) : classic ? link('diagnostico', '', 'Retomar atividade', 'primary') : r.review ? action('review', r.lesson.id, 'Abrir revisão', 'primary') : link('licao', r.lesson.id, 'Abrir microaula', 'primary')}
  ${link('explorar', '', 'Escolher uma área')}</div><div class="feature-lumi">${lumiSVG(s.lumi, 'happy')}</div></div>
  <div class="hub-grid two"><article class="hub-card"><span class="kicker">Seu progresso</span><h2>Nível ${m.level} · ${m.xp} XP</h2><p>${m.lessons}/${idx.lessons.length} aulas concluídas · ${m.coins} moedas</p>${link('perfil', '', 'Ver perfil')}</article>
  <article class="hub-card"><span class="kicker">Missão de hoje</span><h2>Praticar três questões novas</h2><progress max="3" value="${Math.min(m.daily, 3)}"></progress><p>${Math.min(m.daily, 3)}/3 acertos inéditos hoje · ${m.streak} dia(s) de sequência</p>${link('colecao', '', 'Missões e coleção')}</article></div>
  <h2>Continuar aprendendo</h2><div class="hub-actions">${link('revisoes', '', 'Revisões (' + readyReviews(h, idx, session).length + ')')}${link('laboratorio', '', 'Abrir laboratório')}${link('classico', '', s.active ? 'Retomar matemática clássica' : 'Meu acervo de matemática')}</div>
  <h2>Áreas de interesse</h2><div class="area-grid">${idx.areas
    .filter((a) => !h.interests.length || h.interests.includes(a.id))
    .map((a) => tile(a, h))
    .join('')}</div>`,
  );
}
function targetTitle(run, idx) {
  return (
    byId(idx.lessons, run.target)?.title ||
    byId(idx.tracks, run.target)?.title ||
    byId(idx.areas, run.target)?.title ||
    'Atividade'
  );
}
function profileForm(h, idx) {
  return `<form id="hub-profile" class="hub-card hub-form"><label>Como quer ser chamado?<input name="name" maxlength="28" value="${e(h.name)}" placeholder="Apelido opcional" autocomplete="off"></label><label>Avatar<select name="avatar">${choices(
    [
      ['🌱', 'Broto'],
      ['🌙', 'Lua'],
      ['🎵', 'Nota'],
      ['🪐', 'Planeta'],
    ],
    h.avatar,
  )}</select></label>
  <fieldset><legend>Áreas de interesse</legend><div class="interest-list">${idx.areas.map((a) => `<label><input type="checkbox" name="interest" value="${a.id}" ${h.interests.includes(a.id) ? 'checked' : ''}> ${e(a.title)}</label>`).join('')}</div></fieldset><button class="hub-btn primary">Salvar preferências</button></form>`;
}
function profile(h, idx, s) {
  const m = stats(h),
    ev = h.events.filter((x) => x.type === 'question_answered'),
    started = idx.tracks.filter((t) =>
      t.lessons.some((l) =>
        h.events.some((x) => x.lesson === l.id || x.target === l.id),
      ),
    );
  return box(
    head(
      'Perfil local',
      h.avatar + ' ' + (h.name || 'Meu perfil') + (h.decoration ? ' ★' : ''),
    ) +
      `<p>Nível ${m.level} · ${m.xp} XP · ${m.coins} moedas</p><p>${ev.filter((x) => x.independent).length}/${ev.length} primeiras respostas independentes nas atividades do hub.</p><p>${s.sessions.length} sessões no acervo anterior. ${link('classico', '', 'Ver histórico clássico')}</p><h2>Trilhas em andamento</h2><ul>${
        started
          .filter((t) => !finished(h, 'checkpoint_completed', t.id))
          .map(
            (t) =>
              `<li><a href="${path('trilha', t.id)}">${e(t.title)}</a> · ${countDone(h, t.lessons)}/${t.lessons.length} aulas</li>`,
          )
          .join('') ||
        '<li>Comece uma microaula para registrar uma trilha.</li>'
      }</ul><h2>Calendário de estudo</h2><div class="study-days">${
        m.days
          .slice(-60)
          .map(
            (d) =>
              `<time datetime="${e(d)}">${e(d.split('-').reverse().join('/'))}</time>`,
          )
          .join('') || 'O primeiro dia aparece ao responder uma questão.'
      }</div><h2>Últimas atividades</h2><ul>${
        ev
          .slice(-8)
          .reverse()
          .map(
            (x) =>
              `<li>${e(byId(idx.lessons, x.lesson)?.title)} · ${e(x.day)} · ${x.independent ? 'acerto independente' : x.correct ? 'acerto com pista' : 'primeira tentativa registrada'}</li>`,
          )
          .join('') || '<li>Ainda sem respostas.</li>'
      }</ul>${link('colecao', '', 'Medalhas e coleção')}<h2>Meu perfil e interesses</h2>${profileForm(h, idx)}`,
  );
}
function areaPage(a, h) {
  if (!a) return missing();
  return box(
    link('explorar', '', '← Todas as áreas') +
      head('Área de conhecimento', a.title) +
      action('diagnostic', a.id, 'Fazer diagnóstico opcional', 'primary') +
      `<div class="hub-grid two">${a.tracks.map((t) => `<article class="hub-card"><span class="kicker">${countDone(h, t.lessons)} de ${t.lessons.length} aulas</span><h2>${e(t.title)}</h2><p>${e(t.goal)}</p>${link('trilha', t.id, 'Ver trilha')}</article>`).join('')}</div>`,
  );
}
function trackPage(t, h, idx) {
  if (!t) return missing();
  const done = countDone(h, t.lessons);
  return box(
    link('area', t.area, '← ' + byId(idx.areas, t.area).title) +
      head('Trilha', t.title, t.goal) +
      `<div class="hub-actions">${action('view', 'map', 'Mapa de habilidades', h.preferences.view === 'map' ? 'selected' : 'secondary')}${action('view', 'list', 'Lista', h.preferences.view === 'list' ? 'selected' : 'secondary')}</div>
  <ol class="skill-path ${h.preferences.view === 'map' ? 'map' : ''}">${t.lessons.map((l, i) => `<li><span class="node-index">${i + 1}</span><div><a href="${path('licao', l.id)}">${e(l.title)}</a><p>${e(l.objective)}</p><small>${finished(h, 'lesson_completed', l.id) ? 'Aula concluída' : 'Aula disponível'} · ${labels[mastery(h, l.id)]} · ${evidence(h, l.id).length} evidência(s) distinta(s)</small><p class="pre">Base sugerida · ${e(l.prerequisites.map((id) => byId(idx.lessons, id).title).join(', ') || 'Pode começar aqui')}</p></div></li>`).join('')}</ol>
  <article class="hub-card"><h2>Verificação da trilha</h2><p>${done}/${t.lessons.length} aulas concluídas. ${finished(h, 'checkpoint_completed', t.id) ? 'Verificação concluída.' : 'Ao finalizar as aulas, resolva um novo desafio de aplicação.'}</p>${done === t.lessons.length ? action('checkpoint', t.id, 'Abrir desafio final', 'primary') : ''}</article>`,
  );
}
function lessonPage(l, h, idx) {
  if (!l) return missing();
  const diagram = l.example.includes(' → ')
    ? l.example.split(' → ')
    : [l.example];
  return box(
    link('trilha', l.track, '← ' + byId(idx.tracks, l.track).title) +
      head('Microaula', l.title, l.objective) +
      `
  <article class="hub-card lesson-reading"><h2>Observe</h2><p>${e(l.steps[0])}</p><figure class="example-flow"><figcaption>Exemplo guiado <span class="lumi-perch" data-lumi-anchor aria-hidden="true"></span></figcaption><div>${diagram.map((term) => `<span>${e(term)}</span>`).join('<b aria-hidden="true">→</b>')}</div></figure>
  <p>${e(l.steps[1])}</p><fieldset class="mini-task"><legend>${e(l.mini.prompt)}</legend><div class="hub-actions">${l.mini.options.map((v) => action('mini', v, v)).join('')}</div><p id="mini-that" role="status"></p></fieldset></article><div class="hub-actions">${action('lesson', l.id, 'Começar prática', 'primary')}${['musica', 'cubo', 'fisica'].includes(l.area) ? link('laboratorio', l.id, 'Experimentar no laboratório') : ''}</div><p>Três questões com correção. Você pode usar pistas e retomar depois.</p>`,
  );
}
function inputFor(q, a) {
  const val = a.draft;
  if (q.format === 'order') {
    const items = Array.isArray(val) ? val : q.options;
    return `<fieldset><legend>Organize de cima para baixo</legend><ol class="order-items">${items.map((x, i) => `<li draggable="true" data-index="${i}"><span>${e(x)}</span><button type="button" data-shift="-1" aria-label="Subir ${e(x)}" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" data-shift="1" aria-label="Descer ${e(x)}" ${i === items.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('')}</ol></fieldset>`;
  }
  if (q.options.length)
    return `<fieldset><legend>${q.format === 'match' ? 'Associe à categoria correta' : q.format === 'visual' ? 'Selecione a representação' : 'Escolha uma resposta'}</legend>${q.format === 'match' ? '<span class="match-token" draggable="true" data-match-token>Arrastar para uma categoria</span><small>Você também pode selecionar a categoria diretamente.</small>' : ''}<div class="answer-choices ${q.format === 'visual' ? 'visual' : ''}">${q.options.map((x) => `<label><input name="answer" type="radio" required value="${e(x)}" ${val === x ? 'checked' : ''}><span>${e(x)}</span></label>`).join('')}</div></fieldset>`;
  return `<label class="hub-label">${q.format === 'blank' ? 'Preencha a lacuna' : 'Sua resposta'}<input name="answer" required maxlength="${q.format === 'numeric' ? 40 : 220}" value="${e(val)}" autocomplete="off"></label>`;
}
function activity(run, h, idx) {
  if (!run) return missing();
  if (run.index >= run.ids.length) {
    const right = Object.values(run.answers).filter(
      (a) => a.independent,
    ).length;
    return box(
      head(
        'Sessão concluída',
        targetTitle(run, idx),
        right +
          ' de ' +
          run.ids.length +
          ' respostas independentes na primeira tentativa.',
      ) +
        link('painel', '', 'Ver recomendação', 'primary') +
        ' ' +
        (run.mode === 'diagnostic'
          ? link('area', run.target, 'Explorar a área')
          : link(
              'trilha',
              run.mode === 'checkpoint'
                ? run.target
                : byId(idx.lessons, run.target)?.track,
              'Voltar à trilha',
            )),
    );
  }
  const q = idx.questions.get(run.ids[run.index]);
  if (!q) return missing();
  const a = answerState(run, q.id),
    l = byId(idx.lessons, q.concept_id);
  return box(
    head(
      {
        lesson: 'Prática',
        review: 'Revisão espaçada',
        diagnostic: 'Diagnóstico opcional',
        checkpoint: 'Desafio da trilha',
      }[run.mode] +
        ' · ' +
        (run.index + 1) +
        ' de ' +
        run.ids.length,
      q.prompt,
    ) +
      `<progress value="${run.index}" max="${run.ids.length}" aria-label="Questões concluídas"></progress>
  <div class="hub-card"><p class="kicker">${e(l.title)} · dificuldade ${q.difficulty}/3</p>
  ${!a.correct ? `<form id="hub-answer">${inputFor(q, a)}<button class="hub-btn primary" type="submit">Conferir resposta</button></form>` : ''}
  ${a.feedback ? `<div tabindex="-1" class="hub-feedback" role="status"><strong>${a.correct ? 'Acertou!' : 'Vamos tentar por outro caminho.'}</strong><p>${e(a.feedback)}</p>${!a.correct ? link('licao', l.id, 'Rever o exemplo') : ''}</div>` : ''}
  ${a.hints.map((v, i) => `<p class="hint-line"><b>Pista ${i + 1}.</b> ${e(v)}</p>`).join('')}
  <div class="hub-actions">${!a.correct && a.hints.length < 2 ? action('hint', '', 'Pedir pista') : ''}${a.correct || (run.mode === 'diagnostic' && a.tries) ? action('advance', '', run.index + 1 === run.ids.length ? 'Concluir' : 'Próxima questão', 'primary') : ''}</div>
  <p id="hub-error" role="alert"></p></div><p>${link('painel', '', 'Pausar e voltar ao painel')}</p>`,
  );
}
export function prefs(h) {
  const p = h.preferences;
  const select = (key, label, rows) =>
    `<label>${e(label)}<select data-setting="${key}">${choices(rows, p[key])}</select></label>`;
  return `<section class="hub-shell"><h2>Preferências do hub</h2><div class="hub-card hub-form">
  ${select('theme', 'Tema', [
    ['auto', 'Automático'],
    ['light', 'Claro'],
    ['dark', 'Escuro'],
  ])}
  ${select('level', 'Dificuldade inicial da prática', [
    ['auto', 'Adaptativa'],
    ['1', 'Começar pelo básico'],
    ['2', 'Começar pela aplicação'],
    ['3', 'Começar pelo desafio'],
  ])}
  ${select('interval', 'Intervalo de revisão em dias', [
    [1, '1 dia'],
    [2, '2 dias'],
    [7, '7 dias'],
  ])}
  <label>Cor livre do Lumi e dos destaques<input type="color" value="${/^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : '#9080dc'}" data-setting="accent"></label>
  ${[
    ['customAccent', 'Usar minha cor personalizada'],
    ['large', 'Texto ampliado'],
    ['contrast', 'Alto contraste'],
    ['mute', 'Silenciar sons'],
  ]
    .map(
      ([k, v]) =>
        `<label><input type="checkbox" data-setting="${k}" ${p[k] ? 'checked' : ''}> ${v}</label>`,
    )
    .join('')}
  ${action('home-lumi', '', 'Centralizar Lumi na faixa segura')}</div></section>`;
}
function collection(h) {
  const m = stats(h),
    days = m.days.length;
  return box(
    head('Coleção', 'Oficina do Lumi', m.coins + ' moedas disponíveis') +
      `<p>Prática inédita correta rende 5 XP e 1 moeda. Concluir uma microaula pela primeira vez rende 10 XP e 2 moedas. Reconfirmar domínio rende 10 XP. Cada 60 XP abrem um nível.</p>
 <h2>Missões de hoje</h2><ul><li>Praticar três itens inéditos · ${Math.min(3, m.daily)}/3</li><li>Concluir uma microaula · ${h.events.some((x) => x.type === 'lesson_completed' && x.day === localDay(Date.now())) ? '1' : '0'}/1</li></ul>
 <h2>Medalhas</h2><ul>${[
   [m.lessons > 0, 'Primeira aula'],
   [days >= 3, 'Três dias de descoberta'],
   [m.reviews > 0, 'Memória em ação'],
 ]
   .map(
     ([on, title]) =>
       `<li>${on ? '★ Conquistada' : '☆ A conquistar'} · ${title}</li>`,
   )
   .join('')}</ul>
 <h2>Personalização</h2><div class="hub-grid">${Object.entries(SHOP)
   .map(
     ([id, item]) =>
       `<article class="hub-card"><h3>${item.name}</h3><p>${item.price} moedas</p>${h.owned.includes(id) ? action('equip', id, (id === 'star' ? h.decoration : id === 'observatorio' ? h.observatory : id === 'salto' ? h.celebration : h.outfit === id) ? 'Retirar' : 'Equipar') : m.coins >= item.price ? action('buy', id, 'Adquirir') : 'Continue praticando para adquirir.'}</article>`,
   )
   .join(
     '',
   )}</div><p>${link('lumi', '', 'Cor, acessórios e personalidade')}</p>`,
  );
}
export function hubView(route, param, state, idx, session) {
  const h = state.hub;
  switch (route) {
    case 'painel':
      return dashboard(h, idx, state, session);
    case 'boas-vindas':
      return box(
        head(
          'Primeiros passos',
          'Aprenda com o Lumi.',
          'Escolha o que desperta sua curiosidade. Depois você pode experimentar um diagnóstico por área ou entrar direto em uma aula.',
        ) +
          link('explorar', '', 'Pular e explorar', 'primary') +
          profileForm(h, idx),
      );
    case 'explorar':
      return box(
        head(
          'Catálogo',
          'Explore as áreas.',
          'Escolha uma trilha. Os pré-requisitos servem de orientação e todas as aulas podem ser abertas.',
        ) +
          `<div class="area-grid">${idx.areas.map((a) => tile(a, h)).join('')}</div><p>${link('classico', '', 'Abrir acervo clássico')}</p>`,
      );
    case 'area':
      return areaPage(byId(idx.areas, param), h);
    case 'trilha':
      return trackPage(byId(idx.tracks, param), h, idx);
    case 'licao':
      return lessonPage(byId(idx.lessons, param), h, idx);
    case 'atividade':
      return activity(
        Object.hasOwn(h.runs, param) ? h.runs[param] : null,
        h,
        idx,
      );
    case 'perfil':
      return profile(h, idx, state);
    case 'colecao':
      return collection(h);
    case 'revisoes': {
      const ready = readyReviews(h, idx, session);
      const completed = idx.lessons.filter((l) =>
        finished(h, 'lesson_completed', l.id),
      );
      return box(
        head(
          'Prática espaçada',
          'Revisões',
          `Intervalo atual de ${h.preferences.interval} dia(s). Cada revisão usa um item ainda sem evidência.`,
        ) +
          (ready.length
            ? ready
                .map(
                  (l) =>
                    `<article class="hub-card"><h2>${e(l.title)}</h2>${action('review', l.id, 'Começar revisão', 'primary')}</article>`,
                )
                .join('')
            : '<p>Nenhuma revisão pendente.</p>') +
          '<h2>Agenda</h2><ul>' +
          completed
            .map((l) => {
              const last = h.events
                .filter(
                  (x) =>
                    x.lesson === l.id &&
                    ['review_completed', 'lesson_completed'].includes(x.type),
                )
                .at(-1);
              return `<li>${e(l.title)} · ${freshReview(h, l) ? new Date(last.at + Number(h.preferences.interval) * 86400000).toLocaleDateString('pt-BR') : 'Banco de revisão concluído'}</li>`;
            })
            .join('') +
          '</ul>' +
          link('explorar', '', 'Explorar áreas'),
      );
    }
    default:
      return null;
  }
}
