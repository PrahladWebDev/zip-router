import React, { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

function formatTime(ms) {
  if (ms == null) return "--:--";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RANK_COLOR = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-orange-400",
};

export default function Leaderboard() {
  const [levels, setLevels] = useState([]);
  const [selected, setSelected] = useState("global");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api
      .get("/levels")
      .then(({ data }) => setLevels(data.levels))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setErrorMsg("");
    const url = selected === "global" ? "/progress/leaderboard" : `/progress/leaderboard/${selected}`;
    api
      .get(url)
      .then(({ data }) => setEntries(data.leaderboard))
      .catch((err) => setErrorMsg(err.response?.data?.message || "Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-amber-300" size={22} />
          <h1 className="font-mono text-lg font-bold text-cyan-300">LEADERBOARD</h1>
        </div>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full mb-4 bg-[#0F1626] border border-[#1E2A44] text-slate-200 font-mono text-xs rounded-lg px-3 py-2"
        >
          <option value="global">GLOBAL &middot; TOTAL STARS</option>
          {levels.map((l) => (
            <option key={l.levelNumber} value={l.levelNumber}>
              LEVEL {l.levelNumber} &middot; {l.title}
            </option>
          ))}
        </select>

        {loading && <p className="font-mono text-xs text-slate-500">loading...</p>}
        {errorMsg && <p className="font-mono text-xs text-rose-400">{errorMsg}</p>}

        {!loading && !errorMsg && (
          <div className="bg-[#0B1120] border border-[#1E2A44] rounded-2xl divide-y divide-[#1E2A44]">
            {entries.length === 0 && (
              <div className="px-4 py-6 text-center font-mono text-xs text-slate-500">
                No entries yet - be the first!
              </div>
            )}
            {entries.map((e) => (
              <div key={e.rank} className="flex items-center justify-between px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-5 text-sm font-bold ${RANK_COLOR[e.rank] || "text-slate-500"}`}>
                    {e.rank}
                  </span>
                  <Medal size={14} className={RANK_COLOR[e.rank] || "text-slate-700"} />
                  <span className="text-slate-200">{e.name}</span>
                </div>
                <div className="text-cyan-300">
                  {selected === "global" ? `${e.totalStars} \u2605` : formatTime(e.bestTimeMs)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
