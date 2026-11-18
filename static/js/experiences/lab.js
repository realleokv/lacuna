import { escapeHTML as e } from '../utils.js';
import { emit } from '../hub/progress.js';
import { faces, isSolved, moveCube, readFaces, solvedCube } from './cube.js';

const modules = {
  ritmo: {
    title: 'Estúdio de pulsação',
    area: 'musica',
    lesson: 'mus-pulso',
    goal: 'Marque quatro pulsos e compare seu intervalo com o andamento escolhido.',
  },
  notas: {
    title: 'Escada de notas',
    area: 'musica',
    lesson: 'mus-altura',
    goal: 'Compare duas alturas pela frequência e pela posição na escala.',
  },
  cubo: {
    title: 'Bancada do cubo',
    area: 'cubo',
    lesson: 'cub-inversa',
    goal: 'Restaure o cubo após R U. Observe como uma jogada afeta também as faces vizinhas.',
  },
  movimento: {
    title: 'Trilho de movimento',
    area: 'fisica',
    lesson: 'fis-grafico',
    goal: 'Mude a velocidade e o instante para prever a posição de um carrinho.',
  },
};
const colorNames = {
  U: 'branco',
  D: 'amarelo',
  F: 'verde',
  B: 'azul',
  R: 'vermelho',
  L: 'laranja',
};
const noteData = [
  ['Dó', 261.63],
  ['Ré', 293.66],
  ['Mi', 329.63],
  ['Fá', 349.23],
  ['Sol', 392],
  ['Lá', 440],
  ['Si', 493.88],
  ['Dó agudo', 523.25],
];
const button = (id, value, label) =>
  `<button class="hub-btn secondary" type="button" data-lab="${id}" data-value="${e(value)}">${e(label)}</button>`;
const range = (key, title, min, max, value) =>
  `<label class="range-label">${title}<input type="range" data-range="${key}" min="${min}" max="${max}" value="${value}"><output>${value}</output></label>`;
const origin = (mod, lid) =>
  modules[mod].area === 'musica'
    ? lid.startsWith('mus-')
    : modules[mod].area === 'cubo'
      ? lid.startsWith('cub-')
      : lid.startsWith('fis-');
export function createLab({ state, save, main }) {
  let active = null,
    interval = null,
    ctx = null,
    cube = solvedCube(),
    moves = [],
    goal = false,
    three = false,
    inverse = false,
    taps = [],
    bpm = 80,
    beat = 0,
    lastNote = null;
  const stop = () => {
    clearInterval(interval);
    interval = null;
  };
  const quiet = () => state().hub.preferences.mute;
  function sound(hz, len = 0.09) {
    if (quiet()) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    ctx ??= new Audio();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.085, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + len);
  }
  function cards(lid) {
    return `<section class="hub-shell"><header class="hub-head"><span class="kicker">Laboratório</span><h1>Aprenda experimentando.</h1><p>Experiências livres com retorno à microaula. As explorações ficam fora do cálculo de domínio.</p></header><div class="hub-grid two">${Object.entries(
      modules,
    )
      .map(
        ([id, m]) =>
          `<article class="hub-card"><span class="kicker">Disponível · ${e(m.area === 'cubo' ? 'Cubo mágico' : m.area === 'musica' ? 'Música' : 'Física')}</span><h2>${m.title}</h2><p>${m.goal}</p><a class="hub-btn primary" href="#/experiencia/${id}~${origin(id, lid) ? e(lid) : m.lesson}">Abrir experiência</a></article>`,
      )
      .join('')}</div></section>`;
  }
  const cubeMarkup =
    () => `<div class="cube-stage ${three ? 'space' : 'net'}" role="img" aria-label="Estado do cubo. Leia as cores, por face e por linha, na descrição abaixo."><div class="cube-layout">${Object.entries(
      readFaces(cube),
    )
      .map(
        ([f, cells]) =>
          `<div class="cube-face f-${f}" aria-hidden="true">${cells.map((c) => `<span class="sticker s-${c}">${c}</span>`).join('')}</div>`,
      )
      .join('')}</div></div>
 <details><summary>Ler as seis faces em texto</summary>${Object.entries(
   readFaces(cube),
 )
   .map(
     ([f, cells]) =>
       `<p><b>${f}</b> · ${[0, 3, 6]
         .map((i) =>
           cells
             .slice(i, i + 3)
             .map((c) => colorNames[c])
             .join(', '),
         )
         .join(' / ')}</p>`,
   )
   .join('')}</details>`;
  function contents(id) {
    if (id === 'cubo')
      return `<p>U cima · D baixo · F frente · B trás · R direita · L esquerda. As letras nos adesivos indicam a face de origem da cor.</p><div id="cube-viz">${cubeMarkup()}</div>
   <div class="hub-actions">${Object.keys(faces)
     .map((f) => button('turn', f, f))
     .join(
       '',
     )}</div><div class="hub-actions">${button('inverse', '', 'Alternar sentido')}${button('case', '', 'Preparar treino R U')}${button('cube-view', '', 'Alternar 2D / 3D')}${button('reset-cube', '', 'Restaurar cubo')}</div><p id="cube-state" role="status">Sentido horário · cubo resolvido.</p>`;
    if (id === 'ritmo')
      return (
        range('bpm', 'Andamento em BPM', 40, 160, bpm) +
        `<div id="pulse-lights" class="pulse-lights" aria-hidden="true">${[1, 2, 3, 4].map((n) => `<b>${n}</b>`).join('')}</div><p>O realce marca os pulsos de 1 a 4. Acione “Bater” com toque, Enter ou espaço. A medida usa o tempo entre batidas.</p><div class="hub-actions">${button('metro', '', 'Iniciar metrônomo')}${button('tap', '', 'Bater')}${button('clear-taps', '', 'Zerar batidas')}</div><p id="tap-result" role="status">Aguardando quatro batidas.</p>`
      );
    if (id === 'notas')
      return `<div class="note-keys">${noteData.map(([label, hz], i) => button('note', String(i), label)).join('')}</div><p id="note-readout" role="status">Toque em duas notas. O texto e a barra mostram a mudança de altura.</p><meter id="note-meter" aria-label="Altura em hertz" min="250" max="530" value="261.63"></meter>`;
    return (
      range('vel', 'Velocidade (m/s)', -4, 4, 2) +
      range('tempo', 'Tempo (s)', 0, 10, 3) +
      `<div class="motion-track" aria-hidden="true"><div class="motion-cart">●</div></div><p id="motion-value" role="status"></p><p>O carrinho parte de 0 m. Uma velocidade negativa indica deslocamento para a esquerda.</p>`
    );
  }
  function view(route, param = '', idx) {
    if (route !== 'experiencia') {
      if (active) {
        stop();
        active = null;
      }
      return route === 'laboratorio'
        ? cards(idx.lessons.some((l) => l.id === param) ? param : '')
        : null;
    }
    const [id, requested] = String(param).split('~');
    if (!Object.hasOwn(modules, id)) return null;
    const m = modules[id],
      lid = idx.lessons.some((l) => l.id === requested && l.area === m.area)
        ? requested
        : m.lesson;
    if (active !== param) {
      stop();
      cube = solvedCube();
      moves = [];
      goal = false;
      three = false;
      inverse = false;
      taps = [];
      lastNote = null;
      active = param;
      emit(state().hub, 'lab_experience_started', 'lab.' + id, { target: id });
      save();
    }
    const audio = ['ritmo', 'notas'].includes(id);
    return `<section class="hub-shell"><a href="#/laboratorio/${e(lid)}">← Laboratório</a><header class="hub-head"><span class="kicker">Experiência livre</span><h1>${m.title}</h1><p>${m.goal}</p></header><article class="hub-card">${contents(id)}${audio ? `<div class="hub-actions">${button('sound', '', quiet() ? 'Ativar som' : 'Silenciar')}</div><small>O som é opcional. As indicações visuais funcionam sem microfone ou câmera.</small>` : ''}</article><p><a class="hub-btn primary" href="#/licao/${e(lid)}">Voltar à microaula</a></p></section>`;
  }
  function motion() {
    const out = main.querySelector('#motion-value');
    if (!out) return;
    const v = Number(main.querySelector('[data-range=vel]').value),
      t = Number(main.querySelector('[data-range=tempo]').value);
    main.querySelector('.motion-cart').style.left = 50 + v * t * 1.15 + '%';
    out.textContent = `Posição: ${v} m/s × ${t} s = ${v * t} m. Origem: 0 m.`;
  }
  function pulse() {
    beat = (beat + 1) % 4;
    main
      .querySelectorAll('#pulse-lights b')
      .forEach((el, i) => el.classList.toggle('lit', i === beat));
    sound(beat === 0 ? 880 : 580);
  }
  function stopMetro() {
    stop();
    main.querySelectorAll('.lit').forEach((el) => el.classList.remove('lit'));
  }
  function metronome(b) {
    if (interval) {
      stopMetro();
      b.textContent = 'Iniciar metrônomo';
      return;
    }
    beat = 3;
    pulse();
    interval = setInterval(pulse, 60000 / bpm);
    b.textContent = 'Parar metrônomo';
  }
  main.addEventListener('input', (ev) => {
    const k = ev.target.dataset.range;
    if (!k) return;
    ev.target.nextElementSibling.value = ev.target.value;
    if (k === 'bpm') {
      bpm = Number(ev.target.value);
      taps = [];
      main.querySelector('#tap-result').textContent =
        'Novo andamento. Marque quatro batidas.';
      if (interval) {
        stop();
        interval = setInterval(pulse, 60000 / bpm);
      }
    } else motion();
  });
  main.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-lab]');
    if (!b) return;
    const { lab: act, value } = b.dataset;
    if (act === 'sound') {
      state().hub.preferences.mute = !quiet();
      save();
      b.textContent = quiet() ? 'Ativar som' : 'Silenciar';
      if (!quiet()) sound(440);
    }
    if (act === 'metro') metronome(b);
    if (act === 'tap') {
      taps.push(performance.now());
      if (taps.length > 4) taps.shift();
      sound(220);
      const target = 60000 / bpm;
      const error =
        taps.length === 4
          ? taps
              .slice(1)
              .reduce((n, t, i) => n + Math.abs(t - taps[i] - target), 0) / 3
          : 0;
      main.querySelector('#tap-result').textContent =
        taps.length < 4
          ? `${taps.length}/4 batidas. Continue no seu ritmo.`
          : `Diferença média para o intervalo-alvo de ${Math.round(target)} ms: ${Math.round(error)} ms, nos três últimos intervalos.`;
    }
    if (act === 'clear-taps') {
      taps = [];
      main.querySelector('#tap-result').textContent =
        'Aguardando quatro batidas.';
    }
    if (act === 'note') {
      const n = Number(value),
        [label, hz] = noteData[n];
      sound(hz, 0.3);
      main.querySelector('#note-readout').textContent =
        `${label} · ${hz.toLocaleString('pt-BR')} Hz. ${lastNote === null ? 'Escolha outra nota.' : n > lastNote ? 'A altura subiu.' : n < lastNote ? 'A altura desceu.' : 'A altura se manteve.'}`;
      lastNote = n;
      main.querySelector('#note-meter').value = hz;
    }
    if (!['turn', 'case', 'inverse', 'cube-view', 'reset-cube'].includes(act))
      return;
    if (act === 'case') {
      cube = moveCube(moveCube(solvedCube(), 'R'), 'U');
      moves = ['R', 'U'];
      goal = true;
      inverse = false;
    }
    if (act === 'turn') {
      const move = value + (inverse ? "'" : '');
      cube = moveCube(cube, move);
      moves.push(move);
    }
    if (act === 'inverse') inverse = !inverse;
    if (act === 'cube-view') three = !three;
    if (act === 'reset-cube') {
      cube = solvedCube();
      moves = [];
      goal = false;
      inverse = false;
    }
    main.querySelector('#cube-viz').innerHTML = cubeMarkup();
    main.querySelector('#cube-state').textContent =
      (inverse ? 'Sentido anti-horário. ' : 'Sentido horário. ') +
      (isSolved(cube)
        ? goal
          ? 'Treino concluído: as seis faces voltaram à posição inicial.'
          : 'Cubo resolvido.'
        : 'Cubo em movimento. ') +
      (moves.length ? ' Sequência: ' + moves.slice(-16).join(' ') : '');
  });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && interval) {
      stopMetro();
      const b = main.querySelector('[data-lab=metro]');
      if (b) b.textContent = 'Iniciar metrônomo';
    }
  });
  return { view, afterRender: motion };
}
