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

  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [pathLen, setPathLen] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null); // { stars, bestTimeMs, isNewBest, nextLevelNumber }
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setPathLen(0);
    setElapsed(0);
    startTimeRef.current = null;
    (async () => {
      try {
        const { data } = await api.get(`/levels/${levelNumber}`);
        setPuzzle(data.puzzle);
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

  useEffect(() => {
    if (pathLen === 1 && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    if (pathLen === 0) startTimeRef.current = null;
  }, [pathLen]);

  useEffect(() => {
    if (result || startTimeRef.current === null) return;
    const id = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 250);
    return () => clearInterval(id);
  }, [result, pathLen]);

  const handleWin = useCallback(
    async (userPath) => {
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
    boardRef.current?.reset();
    setResetToken((n) => n + 1);
    setResult(null);
    setSubmitError("");
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
            onPathChange={(p) => setPathLen(p.length)}
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
                  <button onClick={handleReset} className="flex items-center gap-1.5 bg-[#0F1626] border border-[#1E2A44] text-slate-300 font-mono text-xs rounded-lg px-3 py-2 hover:border-cyan-400 hover:text-cyan-300 transition-colors">
                    <RotateCcw size={14} /> REPLAY
                  </button>
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