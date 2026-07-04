function neighborsOf(idx, size) {
  const r = Math.floor(idx / size);
  const c = idx % size;
  const res = [];
  if (r > 0) res.push(idx - size);
  if (r < size - 1) res.push(idx + size);
  if (c > 0) res.push(idx - 1);
  if (c < size - 1) res.push(idx + 1);
  return res;
}

function edgeKey(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

// Validates that `submittedPath` is a genuine solution for `level`:
// visits every cell exactly once, only moves between grid-adjacent cells,
// never crosses a wall, and hits every checkpoint in the correct order.
function validateSolution(level, submittedPath) {
  const total = level.size * level.size;

  if (!Array.isArray(submittedPath) || submittedPath.length !== total) {
    return { valid: false, reason: "Path does not cover the whole board" };
  }

  const seen = new Set();
  for (const idx of submittedPath) {
    if (typeof idx !== "number" || idx < 0 || idx >= total) {
      return { valid: false, reason: "Path contains an out-of-range cell" };
    }
    if (seen.has(idx)) {
      return { valid: false, reason: "Path visits a cell more than once" };
    }
    seen.add(idx);
  }

  const wallSet = new Set(level.walls);
  const checkpoints = level.checkpoints instanceof Map
    ? level.checkpoints
    : new Map(Object.entries(level.checkpoints).map(([k, v]) => [k, v]));

  let expectedCheckpoint = 1;
  const totalCheckpoints = checkpoints.size;

  for (let i = 0; i < submittedPath.length; i++) {
    const cell = submittedPath[i];

    const ck = checkpoints.get(String(cell));
    if (ck !== undefined) {
      if (ck !== expectedCheckpoint) {
        return { valid: false, reason: "Checkpoints visited out of order" };
      }
      expectedCheckpoint++;
    }

    if (i > 0) {
      const prev = submittedPath[i - 1];
      if (!neighborsOf(prev, level.size).includes(cell)) {
        return { valid: false, reason: "Path makes a non-adjacent jump" };
      }
      if (wallSet.has(edgeKey(prev, cell))) {
        return { valid: false, reason: "Path crosses a blocked edge" };
      }
    }
  }

  if (expectedCheckpoint - 1 !== totalCheckpoints) {
    return { valid: false, reason: "Not all checkpoints were visited" };
  }

  return { valid: true };
}

module.exports = { validateSolution, neighborsOf, edgeKey };
