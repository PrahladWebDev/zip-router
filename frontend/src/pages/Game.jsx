import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { RotateCcw, Undo2, Sparkles, Trophy, ArrowLeft, ArrowRight, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import ZipBoard from "../components/ZipBoard";
import api from "../api/axios";

const DIFFICULTY_COLOR = {
  easy: "text-emerald-300 border-emerald-500/40",
  medium: "text-amber-300 border-amber-500/40",
  hard: "text-orange-300 border-orange-500/40",
  expert: "text-rose-300 border-rose-500/40",
};

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Game() {
  const { levelNumber } = useParams();
  const navigate = useNavigate();
  const boardRef = useRef(null);
  const startTimeRef = useRef(null);
  const pathRef = useRef([]);
  const elapsedRef = useRef(0);
  const saveTimeoutRef = useRef(null);

  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [path, setPath] = useState([]);
  const [initialPath, setInitialPath] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null); // { stars, bestTimeMs, isNewBest, nextLevelNumber }
  const [submitError, setSubmitError] = useState("");
  const [alreadyCleared, setAlreadyCleared] = useState(null); // { stars, bestTimeMs, nextLevelNumber } | null

  const pathLen = path.length;

  useEffect(() => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setPath([]);
    setInitialPath([]);
    setAlreadyCleared(null);
    startTimeRef.current = null;
    (async () => {
      try {
        const { data } = await api.get(`/levels/${levelNumber}`);
        setPuzzle(data.puzzle);

        if (data.progress?.completed) {
          // Already solved before - no replay, just show what was earned.
          setAlreadyCleared({
            stars: data.progress.stars,
            bestTimeMs: data.progress.bestTimeMs,
            nextLevelNumber: data.nextLevelNumber,
          });
          setElapsed(data.progress.bestTimeMs || 0);
        } else {
          // Resume any unfinished attempt from exactly where it was left off,
          // with the same elapsed time - and start the clock immediately.
          const resumedPath = data.progress?.savedPath || [];
          const resumedElapsed = data.progress?.savedElapsedMs || 0;
          setInitialPath(resumedPath);
          setPath(resumedPath);
          setElapsed(resumedElapsed);
          startTimeRef.current = Date.now() - resumedElapsed;
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setErrorMsg("That level is locked - finish the previous one first.");
        } else {
          setErrorMsg(err.response?.data?.message || "Failed to load level");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [levelNumber]);

  // Timer runs continuously as soon as the level is open (already resumed-adjusted
  // above), stopping only once the level is won or already-cleared. `loading` is
  // in the deps so this re-fires the moment startTimeRef gets set after the
  // level finishes loading (mutating a ref alone wouldn't re-trigger the effect).
  useEffect(() => {
    if (loading || result || alreadyCleared || startTimeRef.current === null) return;
    const id = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 250);
    return () => clearInterval(id);
  }, [loading, result, alreadyCleared]);

  // Keep refs in sync so the debounced/unmount/hide autosave below always
  // reads the latest path and elapsed time, not a stale closure.
  useEffect(() => {
    pathRef.current = path;
  }, [path]);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const saveNow = useCallback(() => {
    if (alreadyCleared || result) return;
    api.put(`/progress/${levelNumber}/save`, { path: pathRef.current, elapsedMs: elapsedRef.current }).catch(() => {});
  }, [levelNumber, alreadyCleared, result]);

  // Autosave shortly after every move, so a halfway-solved level can be
  // resumed later from exactly where it was left off.
  useEffect(() => {
    if (alreadyCleared || result || loading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveNow, 600);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [path, elapsed, alreadyCleared, result, loading, saveNow]);

  // Also save when the tab is hidden or the page is closed/navigated away from.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) saveNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", saveNow);
    return () => {
      saveNow();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", saveNow);
    };
  }, [saveNow]);

  const handleWin = useCallback(
    async (userPath) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const timeMs = Date.now() - startTimeRef.current;
      try {
        const { data } = await api.post(`/progress/${levelNumber}/complete`, {
          timeMs,
          path: userPath,
        });
        setResult(data);
      } catch (err) {
        setSubmitError(err.response?.data?.message || "Could not save your completion");
      }
    },
    [levelNumber]
  );

  const handleReset = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    boardRef.current?.reset();
    setResetToken((n) => n + 1);
    setResult(null);
    setSubmitError("");
    setPath([]);
    api.put(`/progress/${levelNumber}/save`, { path: [], elapsedMs: elapsedRef.current }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-400">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-10 font-mono text-sm">loading level {levelNumber}...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-400">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-10 text-center">
          <p className="font-mono text-sm text-rose-400 mb-4">{errorMsg}</p>
          <Link to="/levels" className="font-mono text-sm text-cyan-300 hover:underline">
            &larr; back to levels
          </Link>
        </div>
      </div>
    );
  }

  if (alreadyCleared) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-200">
        <Navbar />
        <div className="max-w-[560px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <Link to="/levels" className="flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-cyan-300 transition-colors">
              <ArrowLeft size={14} /> LEVELS
            </Link>
            <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
              LEVEL {levelNumber}
              <span
                className={`px-1.5 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${
                  DIFFICULTY_COLOR[puzzle.difficulty] || "text-slate-300 border-slate-500/40"
                }`}
              >
                {puzzle.difficulty}
              </span>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-[#1E2A44] rounded-2xl py-14 flex items-center justify-center">
            <div className="text-center px-6">
              <Trophy className="mx-auto mb-3 text-amber-300" size={40} style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.6))" }} />
              <div className="font-mono text-cyan-300 text-lg font-bold">LEVEL CLEARED</div>
              <div className="flex justify-center gap-1 mt-2 mb-2">
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={20} className={n <= alreadyCleared.stars ? "text-amber-300 fill-amber-300" : "text-slate-700"} />
                ))}
              </div>
              <div className="font-mono text-slate-400 text-xs">best time {formatTime(alreadyCleared.bestTimeMs)}</div>
              <p className="font-mono text-slate-600 text-[11px] mt-3">Already completed levels can't be replayed.</p>
              <div className="flex items-center gap-2 mt-4 justify-center">
                {alreadyCleared.nextLevelNumber ? (
                  <button
                    onClick={() => navigate(`/game/${alreadyCleared.nextLevelNumber}`)}
                    className="flex items-center gap-1.5 bg-cyan-400 text-[#07121a] font-mono font-bold text-xs rounded-lg px-3 py-2 hover:bg-cyan-300 transition-colors"
                  >
                    NEXT LEVEL <ArrowRight size={14} />
                  </button>
                ) : (
                  <Link to="/levels" className="flex items-center gap-1.5 bg-cyan-400 text-[#07121a] font-mono font-bold text-xs rounded-lg px-3 py-2 hover:bg-cyan-300 transition-colors">
                    ALL LEVELS <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200">
      <Navbar />
      <div className="max-w-[560px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-3">
          <Link to="/levels" className="flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-cyan-300 transition-colors">
            <ArrowLeft size={14} /> LEVELS
          </Link>
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
            LEVEL {levelNumber}
            <span
              className={`px-1.5 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${
                DIFFICULTY_COLOR[puzzle.difficulty] || "text-slate-300 border-slate-500/40"
              }`}
            >
              {puzzle.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-[#0F1626] border border-[#1E2A44] rounded-lg px-3 py-2 flex items-center justify-between font-mono">
            <div className="text-[11px] text-slate-500 tracking-widest">TIME</div>
            <div className="text-cyan-300 text-sm" style={{ textShadow: "0 0 8px rgba(34,211,238,0.5)" }}>
              {formatTime(elapsed)}
            </div>
          </div>
          <div className="flex-1 bg-[#0F1626] border border-[#1E2A44] rounded-lg px-3 py-2 flex items-center justify-between font-mono">
            <div className="text-[11px] text-slate-500 tracking-widest">CELLS</div>
            <div className="text-amber-300 text-sm">{pathLen}/{puzzle.total}</div>
          </div>
        </div>

        <div className="relative bg-[#0B1120] border border-[#1E2A44] rounded-2xl p-3 sm:p-4">
          <ZipBoard
            ref={boardRef}
            puzzle={puzzle}
            onWin={handleWin}
            onPathChange={(p) => setPath(p)}
            initialPath={initialPath}
            resetToken={resetToken}
            showSolution={showSolution}
          />

          {result && (
            <div className="absolute inset-0 bg-[#070B14]/90 flex items-center justify-center rounded-2xl">
              <div className="text-center px-6">
                <Trophy className="mx-auto mb-3 text-amber-300" size={40} style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.6))" }} />
                <div className="font-mono text-cyan-300 text-lg font-bold">LEVEL CLEARED</div>
                <div className="flex justify-center gap-1 mt-2 mb-2">
                  {[1, 2, 3].map((n) => (
                    <Star key={n} size={20} className={n <= result.stars ? "text-amber-300 fill-amber-300" : "text-slate-700"} />
                  ))}
                </div>
                <div className="font-mono text-slate-400 text-xs">
                  time {formatTime(result.bestTimeMs)} {result.isNewBest && <span className="text-amber-300">&middot; new best</span>}
                </div>
                <div className="flex items-center gap-2 mt-4 justify-center">
                  {result.nextLevelNumber ? (
                    <button
                      onClick={() => navigate(`/game/${result.nextLevelNumber}`)}
                      className="flex items-center gap-1.5 bg-cyan-400 text-[#07121a] font-mono font-bold text-xs rounded-lg px-3 py-2 hover:bg-cyan-300 transition-colors"
                    >
                      NEXT LEVEL <ArrowRight size={14} />
                    </button>
                  ) : (
                    <Link to="/levels" className="flex items-center gap-1.5 bg-cyan-400 text-[#07121a] font-mono font-bold text-xs rounded-lg px-3 py-2 hover:bg-cyan-300 transition-colors">
                      ALL LEVELS <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {submitError && <p className="text-rose-400 font-mono text-xs mt-2">{submitError}</p>}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => boardRef.current?.undo()}
            className="flex items-center gap-1.5 bg-[#0F1626] border border-[#1E2A44] text-slate-300 font-mono text-xs rounded-lg px-3 py-2 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Undo2 size={14} /> UNDO
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 bg-[#0F1626] border border-[#1E2A44] text-slate-300 font-mono text-xs rounded-lg px-3 py-2 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <RotateCcw size={14} /> RESET
          </button>
          <button
            onClick={() => setShowSolution((s) => !s)}
            className={`flex items-center gap-1.5 border font-mono text-xs rounded-lg px-3 py-2 transition-colors ${
              showSolution ? "bg-slate-500/20 border-slate-400 text-slate-200" : "bg-[#0F1626] border-[#1E2A44] text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
            }`}
          >
            <Sparkles size={14} /> HINT PATH
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 font-mono flex-wrap">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> port &middot; visit in order</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded bg-rose-500 inline-block" /> blocked edge</div>
        </div>
      </div>
    </div>
  );
}
