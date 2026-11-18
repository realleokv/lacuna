import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initialHub,
  validateHub,
  answerState,
  advanceRun,
  buy,
  difficulty,
  due,
  emit,
  evidence,
  finished,
  freshReview,
  localDay,
  mastery,
  recommendation,
  RULES,
  startRun,
  stats,
  submitResult,
} from '../static/js/hub/progress.js';
import {
  ProgressStore,
  STORAGE_KEY,
  emptyState,
} from '../static/js/storage.js';
import {
  solvedCube,
  moveCube,
  readFaces,
  isSolved,
} from '../static/js/experiences/cube.js';

const pack = JSON.parse(
  readFileSync(new URL('../data/subjects/matematica.json', import.meta.url)),
);
const lessons = pack.tracks[0].lessons;
const lesson = lessons[0],
  id = lesson.id,
  practice = lesson.questions.filter((q) => q.role === 'practice');
const bank = new Map(lesson.questions.map((q) => [q.id, q]));
const t = new Date(2026, 5, 18, 10).getTime();
function complete(h, errors = [], hints = []) {
  const r = startRun(h, 'lesson', id, practice, 's1', t);
  for (let i = 0; i < practice.length; i++) {
    const q = bank.get(r.ids[r.index]),
      a = answerState(r, q.id);
    if (hints.includes(i)) a.hints.push('pista');
    if (errors.includes(i))
      submitResult(
        h,
        r,
        q,
        'erro',
        { correct: false, text: 'Veja o exemplo.' },
        t,
      );
    submitResult(h, r, q, 'resposta', { correct: true, text: 'Certo.' }, t);
    assert.ok(advanceRun(h, r, bank, t));
  }
  return r;
}
function review(h, now, independent = true) {
  const q = freshReview(h, lesson);
  const r = startRun(h, 'review', id, [q], 'outra', now);
  if (!independent) answerState(r, q.id).hints.push('pista');
  submitResult(h, r, q, 'x', { correct: true, text: 'ok' }, now);
  return advanceRun(h, r, bank, now);
}
test('remembers first error, assisted credit, exact mastery window and stable XP on repeated practice', () => {
  const h = initialHub();
  complete(h, [0], [1]);
  assert.equal(mastery(h, id), 'learning');
  assert.equal(stats(h).xp, 25);
  complete(h);
  assert.equal(stats(h).xp, 25);
  assert.equal(evidence(h, id).length, 3);
  assert.equal(evidence(h, id).filter((x) => x.independent).length, 1);
  assert.equal(stats(h).coins, 5);
});
test('two independent answers in three, then a distinct delayed review confirms, with a finite reserve', () => {
  const h = initialHub();
  complete(h);
  assert.equal(mastery(h, id), 'provisional');
  assert.equal(due(h, id, t + 1000, 'other'), false);
  assert.ok(due(h, id, t + 2 * RULES.dayMs, 's1'));
  review(h, t + 2 * RULES.dayMs);
  assert.equal(mastery(h, id), 'confirmed');
  assert.equal(stats(h).xp, 40);
  review(h, t + 4 * RULES.dayMs);
  assert.equal(mastery(h, id), 'confirmed');
  assert.equal(freshReview(h, lesson), undefined);
});
test('review neither premature nor assisted awards confirmation', () => {
  for (const [offset, help] of [
    [100, false],
    [3 * RULES.dayMs, true],
  ]) {
    const h = initialHub();
    complete(h);
    review(h, t + offset, !help);
    assert.equal(stats(h).reviews, 0);
    assert.notEqual(mastery(h, id), 'confirmed');
  }
});
test('bad clock uses a distinct session; manual difficulty leaves evidence unchanged', () => {
  const h = initialHub();
  complete(h);
  assert.equal(due(h, id, t - 60, 's1'), false);
  assert.equal(due(h, id, t - 60, 'other'), true);
  assert.equal(difficulty(h, id), 3);
  h.preferences.level = '1';
  assert.equal(difficulty(h, id), 1);
  assert.equal(mastery(h, id), 'provisional');
});
test('repeated events, purchases and advancement after completion are idempotent', () => {
  const h = initialHub();
  assert.equal(buy(h, 'jacket'), false);
  const r = complete(h);
  assert.equal(advanceRun(h, r, bank), false);
  assert.ok(buy(h, 'scarf'));
  assert.equal(buy(h, 'scarf'), false);
  assert.equal(stats(h).coins, 2);
  assert.equal(buy(h, 'constructor'), false);
});
test('resumes the same question after a hint, reload and pause', () => {
  const h = initialHub(),
    r = startRun(h, 'lesson', id, practice, 's1', t);
  const a = answerState(r, practice[0].id);
  a.hints.push('pista');
  a.draft = 'abc';
  const h2 = validateHub(JSON.parse(JSON.stringify(h)));
  const r2 = startRun(h2, 'lesson', id, practice, 's2', t);
  assert.equal(r.id, r2.id);
  assert.equal(r2.answers[practice[0].id].draft, 'abc');
  assert.equal(r2.answers[practice[0].id].hints.length, 1);
  assert.equal(advanceRun(h2, r2, bank), false);
});
test('weak prerequisite guides recommendation; interval and preferred areas matter', () => {
  const h = initialHub(),
    ls = lessons.map((l) => ({ ...l, area: 'matematica' }));
  const weak = ls[1];
  const q = weak.questions[0];
  emit(
    h,
    'question_answered',
    'first',
    { lesson: weak.id, question: q.id, correct: false, independent: false },
    t,
  );
  assert.equal(recommendation(h, ls, t, 's').lesson.id, id);
  complete(h);
  assert.ok(recommendation(h, ls, t + 2 * RULES.dayMs, 'other').review);
});
test('local calendar counts today or yesterday once, ignores future dates for streak', () => {
  const h = initialHub();
  for (const delta of [-2, -1, 0, 0, 5])
    emit(
      h,
      'question_answered',
      String(delta),
      { lesson: id, question: 'q' },
      t + delta * RULES.dayMs,
    );
  assert.equal(stats(h, t).streak, 3);
  assert.equal(stats(h, t + RULES.dayMs).streak, 3);
  assert.equal(stats(h, t + 2 * RULES.dayMs).streak, 0);
  assert.equal(localDay(t), '2026-06-18');
});
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test('migrates authentic v1 including N20, preserves original on future or malformed hub', () => {
  const storage = memory(),
    old = emptyState();
  delete old.hub;
  old.lumi.name = 'Fagulha';
  old.lessons = [{ concept_id: 'N20' }];
  storage.setItem(STORAGE_KEY, JSON.stringify(old));
  const p = new ProgressStore(storage);
  assert.equal(p.locked, false);
  assert.equal(p.state.hub.version, 1);
  assert.equal(p.state.lumi.name, 'Fagulha');
  assert.deepEqual(p.state.lessons, old.lessons);
  assert.ok(p.save());
  for (const hub of [{ version: 99 }, { ...initialHub(), runs: { bad: {} } }]) {
    const raw = JSON.stringify({ ...old, hub });
    storage.setItem(STORAGE_KEY, raw);
    const s = new ProgressStore(storage);
    assert.equal(s.save(), false);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
    assert.equal(s.original, raw);
  }
});
test('stale tab cannot overwrite a newer save', () => {
  const storage = memory(),
    s1 = new ProgressStore(storage),
    s2 = new ProgressStore(storage);
  s1.state.hub.name = 'Primeira';
  assert.ok(s1.save());
  s2.state.hub.name = 'Segunda';
  assert.equal(s2.save(), false);
  assert.equal(new ProgressStore(storage).state.hub.name, 'Primeira');
  assert.match(s2.exportText(), /Segunda/);
});
test('cube has 54 stickers and legal turns: adjacent strips move, centers stay, inverses undo', () => {
  const original = solvedCube();
  for (const face of 'UDFBLR') {
    const c = moveCube(original, face),
      viz = readFaces(c);
    assert.equal(isSolved(c), false);
    assert.equal(c.length, 54);
    assert.equal(
      Object.values(viz)
        .flat()
        .filter((x) => x === face).length,
      9,
    );
    assert.equal(
      Object.entries(viz).filter(([f, cells]) => cells.some((x) => x !== f))
        .length,
      4,
    );
    for (const [f, cells] of Object.entries(viz)) {
      assert.equal(cells[4], f);
      assert.equal(cells.length, 9);
    }
    assert.ok(isSolved(moveCube(c, face + "'")));
    assert.ok(isSolved(moveCube(moveCube(c, face), face + '2')));
  }
  const start = moveCube(moveCube(original, 'R'), 'U');
  assert.ok(isSolved(moveCube(moveCube(start, "U'"), "R'")));
  assert.equal(isSolved(moveCube(moveCube(start, "R'"), "U'")), false);
});
