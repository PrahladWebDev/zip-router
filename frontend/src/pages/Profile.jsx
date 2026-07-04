import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Star, CheckCircle2 } from "lucide-react";

function formatTime(ms) {
  if (ms == null) return "--:--";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Profile() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/progress/summary");
        setSummary(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="font-mono text-lg font-bold mb-1">{user?.name}</h2>
        <p className="text-xs text-slate-500 font-mono mb-5">{user?.email}</p>

        {loading && <div className="text-slate-500 font-mono text-sm">loading stats...</div>}

        {summary && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#0F1626] border border-[#1E2A44] rounded-xl p-4 text-center">
                <div className="font-mono text-2xl text-cyan-300">{summary.completedCount}/{summary.totalLevels}</div>
                <div className="font-mono text-[11px] text-slate-500 mt-1">LEVELS CLEARED</div>
              </div>
              <div className="bg-[#0F1626] border border-[#1E2A44] rounded-xl p-4 text-center">
                <div className="font-mono text-2xl text-amber-300 flex items-center justify-center gap-1">
                  <Star size={18} className="fill-amber-300" /> {summary.totalStars}
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-1">/ {summary.maxStars} STARS</div>
              </div>
              <div className="bg-[#0F1626] border border-[#1E2A44] rounded-xl p-4 text-center">
                <div className="font-mono text-2xl text-emerald-300">
                  {summary.totalLevels ? Math.round((summary.completedCount / summary.totalLevels) * 100) : 0}%
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-1">PROGRESS</div>
              </div>
            </div>

            <div className="bg-[#0F1626] border border-[#1E2A44] rounded-xl overflow-hidden">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-[#1E2A44]">
                    <th className="text-left px-3 py-2">LEVEL</th>
                    <th className="text-left px-3 py-2">STATUS</th>
                    <th className="text-left px-3 py-2">STARS</th>
                    <th className="text-left px-3 py-2">BEST TIME</th>
                    <th className="text-left px-3 py-2">ATTEMPTS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.levels.map((l) => (
                    <tr key={l.levelNumber} className="border-b border-[#141d33] last:border-0">
                      <td className="px-3 py-2 text-slate-300">{l.levelNumber}</td>
                      <td className="px-3 py-2">
                        {l.completed ? (
                          <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 size={12} /> cleared</span>
                        ) : (
                          <span className="text-slate-600">in progress</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-amber-300">{l.stars}/3</td>
                      <td className="px-3 py-2 text-cyan-300">{formatTime(l.bestTimeMs)}</td>
                      <td className="px-3 py-2 text-slate-500">{l.attempts}</td>
                    </tr>
                  ))}
                  {summary.levels.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-600">no attempts yet - go play level 1</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
