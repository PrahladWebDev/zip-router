// Same generation logic as the client-side prototype, ported to Node so
// levels can be pre-generated once and stored permanently in MongoDB.

function edgeKey(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateHamiltonianPath(size) {
  const total = size * size;
  const maxAttempts = 60;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const visited = new Array(total).fill(false);
    const path = [];
    const start = Math.floor(Math.random() * total);
    visited[start] = true;
    path.push(start);
    let budget = total * 80;

    const dfs = (current) => {
      if (path.length === total) return true;
      let nbs = shuffle(neighborsOf(current, size)).filter((n) => !visited[n]);
      nbs.sort((a, b) => {
        const da = neighborsOf(a, size).filter((n) => !visited[n]).length;
        const db = neighborsOf(b, size).filter((n) => !visited[n]).length;
        return da - db;
      });
      for (const n of nbs) {
        budget--;
        if (budget <= 0) return false;
        visited[n] = true;
        path.push(n);
        if (dfs(n)) return true;
        path.pop();
        visited[n] = false;
      }
      return false;
    };

    if (dfs(start) && path.length === total) return path;
  }

  const fallback = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) fallback.push(r * size + c);
    } else {
      for (let c = size - 1; c >= 0; c--) fallback.push(r * size + c);
    }
  }
  return fallback;
}

function generatePuzzle({ size, numCheckpoints, wallRatio = 0.08 }) {
  const total = size * size;
  const path = generateHamiltonianPath(size);

  const numCk = Math.min(numCheckpoints, total);
  const positions = new Set([0, total - 1]);
  while (positions.size < numCk) {
    positions.add(Math.floor(Math.random() * total));
  }
  const sortedPositions = Array.from(positions).sort((a, b) => a - b);

  const checkpoints = {};
  sortedPositions.forEach((pos, i) => {
    checkpoints[path[pos]] = i + 1;
  });

  const pathEdges = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    pathEdges.add(edgeKey(path[i], path[i + 1]));
  }

  const wallCandidates = [];
  for (let idx = 0; idx < total; idx++) {
    for (const n of neighborsOf(idx, size)) {
      if (n > idx && !pathEdges.has(edgeKey(idx, n))) {
        wallCandidates.push(edgeKey(idx, n));
      }
    }
  }
  const wallCount = Math.floor(wallCandidates.length * wallRatio);
  const walls = shuffle(wallCandidates).slice(0, wallCount);

  return {
    size,
    path,
    checkpoints,
    walls,
    numCheckpoints: sortedPositions.length,
  };
}

module.exports = { generatePuzzle, generateHamiltonianPath, neighborsOf, edgeKey };
