import React, { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";

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

function wallLineCoords(a, b, size) {
  const ra = Math.floor(a / size), ca = a % size;
  const rb = Math.floor(b / size), cb = b % size;
  if (ra === rb) {
    const x = Math.max(ca, cb);
    return { x1: x, y1: ra, x2: x, y2: ra + 1 };
  }
  const y = Math.max(ra, rb);
  return { x1: ca, y1: y, x2: ca + 1, y2: y };
}

/**
 * puzzle: { size, total, checkpoints: {cellIndex: order}, walls: string[], path: number[] }
 * onWin(userPath) is called once when the board is fully and correctly filled.
 */
const ZipBoard = forwardRef(function ZipBoard(
  { puzzle, onWin, onPathChange, resetToken, showSolution, initialPath },
  ref
) {
  const [userPath, setUserPath] = useState(() => (initialPath && initialPath.length ? initialPath : []));
  const [isDragging, setIsDragging] = useState(false);
  const [invalidPulse, setInvalidPulse] = useState(0);
  const containerRef = useRef(null);
  const wonRef = useRef(false);

  const size = puzzle.size;
  const total = puzzle.total;
  const walls = useMemo(() => new Set(puzzle.walls), [puzzle.walls]);
  const checkpointMap = puzzle.checkpoints;

  // The cell holding the final (highest-numbered) checkpoint. The path must
  // end here for the board to count as complete - simply filling every
  // remaining cell after passing the last number should NOT win the game.
  const lastCheckpointCell = useMemo(() => {
    const entries = Object.entries(checkpointMap);
    if (entries.length === 0) return null;
    let bestCell = null;
    let bestOrder = -Infinity;
    for (const [cellStr, order] of entries) {
      if (order > bestOrder) {
        bestOrder = order;
        bestCell = Number(cellStr);
      }
    }
    return bestCell;
  }, [checkpointMap]);

  // New level loaded - seed with any saved in-progress path (resume), or start empty.
  useEffect(() => {
    setUserPath(initialPath && initialPath.length ? initialPath : []);
    setIsDragging(false);
    wonRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // Manual RESET button - always clears fully, ignoring any saved path.
  const isFirstResetToken = useRef(true);
  useEffect(() => {
    if (isFirstResetToken.current) {
      isFirstResetToken.current = false;
      return;
    }
    setUserPath([]);
    setIsDragging(false);
    wonRef.current = false;
  }, [resetToken]);

  useImperativeHandle(ref, () => ({
    undo: () => setUserPath((prev) => (wonRef.current ? prev : prev.slice(0, -1))),
    reset: () => {
      wonRef.current = false;
      setUserPath([]);
    },
  }));

  useEffect(() => {
    onPathChange?.(userPath);
  }, [userPath, onPathChange]);

  const flashInvalid = () => setInvalidPulse((n) => n + 1);

  const getCellFromEvent = useCallback(
    (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x / rect.width) * size);
      const row = Math.floor((y / rect.height) * size);
      if (row < 0 || row >= size || col < 0 || col >= size) return null;
      return row * size + col;
    },
    [size]
  );

  const tryExtend = useCallback(
    (prev, idx) => {
      if (prev.length === 0) {
        if (checkpointMap[idx] === 1) return [idx];
        flashInvalid();
        return prev;
      }
      const last = prev[prev.length - 1];
      if (idx === last) return prev;
      if (prev.length >= 2 && idx === prev[prev.length - 2]) return prev.slice(0, -1);
      if (prev.includes(idx)) return prev;
      if (!neighborsOf(last, size).includes(idx)) return prev;
      if (walls.has(edgeKey(last, idx))) {
        flashInvalid();
        return prev;
      }
      const ck = checkpointMap[idx];
      if (ck !== undefined) {
        const visitedCount = prev.filter((p) => checkpointMap[p] !== undefined).length;
        if (ck !== visitedCount + 1) {
          flashInvalid();
          return prev;
        }
      }
      return [...prev, idx];
    },
    [checkpointMap, size, walls]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (wonRef.current) return;
      const idx = getCellFromEvent(e);
      if (idx === null) return;
      e.preventDefault();
      setUserPath((prev) => {
        if (prev.length === 0) {
          if (checkpointMap[idx] === 1) {
            setIsDragging(true);
            return [idx];
          }
          flashInvalid();
          return prev;
        }
        const existing = prev.indexOf(idx);
        if (existing !== -1) {
          setIsDragging(true);
          return prev.slice(0, existing + 1);
        }
        setIsDragging(true);
        return tryExtend(prev, idx);
      });
    },
    [getCellFromEvent, checkpointMap, tryExtend]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || wonRef.current) return;
      const idx = getCellFromEvent(e);
      if (idx === null) return;
      setUserPath((prev) => tryExtend(prev, idx));
    },
    [isDragging, getCellFromEvent, tryExtend]
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    const boardFilled = userPath.length === total;
    const endsOnLastCheckpoint =
      lastCheckpointCell !== null && userPath[userPath.length - 1] === lastCheckpointCell;
    if (boardFilled && endsOnLastCheckpoint && !wonRef.current) {
      wonRef.current = true;
      onWin?.(userPath);
    }
  }, [userPath, total, onWin, lastCheckpointCell]);

  const pathPoints = useMemo(
    () =>
      userPath
        .map((idx) => `${(idx % size) + 0.5},${Math.floor(idx / size) + 0.5}`)
        .join(" "),
    [userPath, size]
  );

  const solutionPath = puzzle.path || [];

  const won =
    userPath.length === total &&
    lastCheckpointCell !== null &&
    userPath[userPath.length - 1] === lastCheckpointCell;

  // LinkedIn-Zip-style hint: only reveal the single next step from wherever the
  // player currently is, not the whole route. We locate the player's last cell
  // within the stored solution and point to the cell right after it.
  const hintTarget = useMemo(() => {
    if (!showSolution || won || solutionPath.length === 0) return null;

    if (userPath.length === 0) {
      return { fromCell: null, toCell: solutionPath[0] };
    }

    const currentCell = userPath[userPath.length - 1];
    const currentPos = solutionPath.indexOf(currentCell);

    // Player's current cell is still on the solution route - hint the next
    // forward step as usual.
    if (currentPos !== -1) {
      if (currentPos + 1 >= solutionPath.length) return null; // already at the end
      const nextCell = solutionPath[currentPos + 1];
      if (userPath.includes(nextCell)) return null; // that cell is already occupied elsewhere
      return { fromCell: currentCell, toCell: nextCell, backtrack: false };
    }

    // Player has strayed off the solution route. Instead of silently pointing
    // further ahead as if nothing happened, tell them to go BACK to the last
    // cell in their own path that is still on the route.
    for (let i = userPath.length - 2; i >= 0; i--) {
      if (solutionPath.includes(userPath[i])) {
        return { fromCell: currentCell, toCell: userPath[i], backtrack: true };
      }
    }

    return null;
  }, [showSolution, won, userPath, solutionPath]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "none" }}
      key={invalidPulse}
      className={`relative w-full aspect-square select-none rounded-lg overflow-hidden ${
        invalidPulse ? "zip-shake" : ""
      }`}
    >
      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -8; } }
        @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-3px);} 75%{transform:translateX(3px);} }
        @keyframes hintPulse { 0%,100%{opacity:0.55;} 50%{opacity:1;} }
        .zip-shake { animation: shake 0.18s ease-in-out; }
        .zip-flow { animation: dashflow 0.6s linear infinite; }
      `}</style>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full block">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.09" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: total }).map((_, idx) => {
          const r = Math.floor(idx / size);
          const c = idx % size;
          const inPath = userPath.includes(idx);
          return (
            <rect
              key={idx}
              x={c + 0.03}
              y={r + 0.03}
              width={0.94}
              height={0.94}
              rx={0.14}
              fill={inPath ? "#0E2A3D" : "#111a2c"}
              stroke="#1f2b45"
              strokeWidth={0.02}
            />
          );
        })}

        {hintTarget && (() => {
          const toR = Math.floor(hintTarget.toCell / size) + 0.5;
          const toC = (hintTarget.toCell % size) + 0.5;
          let angle = 0;
          if (hintTarget.fromCell !== null) {
            const fromR = Math.floor(hintTarget.fromCell / size);
            const fromC = hintTarget.fromCell % size;
            const toRi = Math.floor(hintTarget.toCell / size);
            const toCi = hintTarget.toCell % size;
            angle = Math.atan2(toRi - fromR, toCi - fromC) * (180 / Math.PI);
          }
          const hintColor = hintTarget.backtrack ? "#F87171" : "#FBBF24";
          return (
            <g style={{ animation: "hintPulse 1s ease-in-out infinite" }}>
              <circle cx={toC} cy={toR} r={0.3} fill="none" stroke={hintColor} strokeWidth={0.05} opacity={0.85} />
              {hintTarget.fromCell !== null && (
                <polygon
                  points="-0.15,-0.12 0.15,0 -0.15,0.12"
                  fill={hintColor}
                  transform={`translate(${toC} ${toR}) rotate(${angle})`}
                />
              )}
            </g>
          );
        })()}

        {Array.from(walls).map((wkey) => {
          const [a, b] = wkey.split("_").map(Number);
          const { x1, y1, x2, y2 } = wallLineCoords(a, b, size);
          return (
            <line
              key={wkey}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#fb4570"
              strokeWidth={0.09}
              strokeLinecap="round"
            />
          );
        })}

        {userPath.length > 1 && (
          <>
            <polyline
              points={pathPoints}
              fill="none"
              stroke="#22D3EE"
              strokeWidth={0.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            <polyline
              points={pathPoints}
              fill="none"
              stroke="#bff8ff"
              strokeWidth={0.05}
              strokeDasharray="0.22 0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="zip-flow"
              opacity={0.9}
            />
          </>
        )}

        {Object.entries(checkpointMap).map(([idxStr, num]) => {
          const idx = Number(idxStr);
          const r = Math.floor(idx / size) + 0.5;
          const c = (idx % size) + 0.5;
          const visited = userPath.includes(idx);
          return (
            <g key={idx}>
              <circle
                cx={c}
                cy={r}
                r={0.33}
                fill={visited ? "#FBBF24" : "#17233a"}
                stroke={visited ? "#fde68a" : "#fbbf24"}
                strokeWidth={0.045}
                filter={visited ? "url(#glow)" : undefined}
              />
              <text
                x={c}
                y={r + 0.02}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={0.36}
                fontWeight="700"
                fontFamily="monospace"
                fill={visited ? "#1c1508" : "#fbbf24"}
              >
                {num}
              </text>
            </g>
          );
        })}

        {userPath.length > 0 && !won && (() => {
          const idx = userPath[userPath.length - 1];
          const r = Math.floor(idx / size) + 0.5;
          const c = (idx % size) + 0.5;
          return <circle cx={c} cy={r} r={0.1} fill="#ffffff" filter="url(#glow)" />;
        })()}
      </svg>
    </div>
  );
});

export default ZipBoard;
