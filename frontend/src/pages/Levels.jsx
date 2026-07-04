import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LevelCard from "../components/LevelCard";
import api from "../api/axios";
import { Star, Sparkles } from "lucide-react";

export default function Levels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/levels");
        setLevels(data.levels);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Failed to load levels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalStars = levels.reduce((sum, l) => sum + l.stars, 0);
  const maxStars = levels.length * 3;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-200">SELECT LEVEL</h2>
            <p className="text-xs text-slate-500 font-mono">trace the full circuit, in order, without crossing walls</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm text-amber-300">
            <Star size={16} className="fill-amber-300" /> {totalStars}/{maxStars}
          </div>
        </div>

        {loading && <div className="text-slate-500 font-mono text-sm">loading levels...</div>}
        {errorMsg && <div className="text-rose-400 font-mono text-sm">{errorMsg}</div>}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {levels.map((level) => (
            <LevelCard key={level.levelNumber} level={level} />
          ))}
          {!loading && !errorMsg && (
            <div className="bg-[#0F1626] border border-dashed border-[#1E2A44] rounded-xl p-4 flex flex-col items-center justify-center aspect-square text-slate-600">
              <Sparkles size={18} className="mb-1" />
              <div className="font-mono text-[10px] text-center leading-tight">
                MORE
                <br />
                COMING
                <br />
                SOON
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}