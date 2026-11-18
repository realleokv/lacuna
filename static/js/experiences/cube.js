// Each sticker has a position on the cubie and an outward normal.
// basis = [normal, right from the viewer, up from the viewer].
export const faces = {
  U: [
    [0, 1, 0],
    [1, 0, 0],
    [0, 0, -1],
  ],
  D: [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
  ],
  F: [
    [0, 0, 1],
    [1, 0, 0],
    [0, 1, 0],
  ],
  B: [
    [0, 0, -1],
    [-1, 0, 0],
    [0, 1, 0],
  ],
  R: [
    [1, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ],
  L: [
    [-1, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
  ],
};
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function solvedCube() {
  const stickers = [];
  for (const [face, [normal, right, up]] of Object.entries(faces)) {
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++)
        stickers.push({
          face,
          normal: [...normal],
          position: normal.map(
            (v, i) => v + (col - 1) * right[i] + (1 - row) * up[i],
          ),
        });
  }
  return stickers;
}
function rotate(vector, axis) {
  const parallel = dot(axis, vector),
    perpendicular = cross(axis, vector);
  return axis.map((v, i) => v * parallel - perpendicular[i]);
}
export function moveCube(cube, move) {
  if (!/^[UDFBRL]('|2)?$/.test(move)) throw Error('Movimento inválido');
  const normal = faces[move[0]][0],
    turns = move.endsWith("'") ? 3 : move.endsWith('2') ? 2 : 1;
  return cube.map((sticker) => {
    if (dot(sticker.position, normal) !== 1) return sticker;
    let { position, normal: orientation } = sticker;
    for (let t = 0; t < turns; t++) {
      position = rotate(position, normal);
      orientation = rotate(orientation, normal);
    }
    return { ...sticker, position, normal: orientation };
  });
}
export function readFaces(cube) {
  const out = {};
  for (const [name, [normal, right, up]] of Object.entries(faces)) {
    const cells = Array(9);
    for (const s of cube.filter((s) => dot(s.normal, normal) === 1)) {
      const row = 1 - dot(s.position, up),
        col = 1 + dot(s.position, right);
      cells[row * 3 + col] = s.face;
    }
    out[name] = cells;
  }
  return out;
}
export function isSolved(cube) {
  return Object.entries(readFaces(cube)).every(([f, cells]) =>
    cells.every((c) => c === f),
  );
}
