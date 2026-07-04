import React from "react";
import { Link } from "react-router-dom";
import { Lock, Star } from "lucide-react";

const DIFFICULTY_COLOR = {
  easy: "text-emerald-300 border-emerald-500/40",
  medium: "text-amber-300 border-amber-500/40",
  hard: "text-orange-300 border-orange-500/40",
  expert: "text-rose-300 border-rose-500/40",
};

export default function LevelCard({ level }) {
  const colorClass = DIFFICULTY_COLOR[level.difficulty] || "text-slate-300 border-slate-500/40";

  if (!level.unlocked) {
    return (
      <div className="bg-[#0F1626] border border-[#1E2A44] rounded-xl p-4 flex flex-col items-center justify-center opacity-50 aspect-square">
        <Lock size={20} className="text-slate-600 mb-1" />
        <div className="font-mono text-xs text-slate-600">LVL {level.levelNumber}</div>
      </div>
    );
  }

  return (
    <Link
      to={`/game/${level.levelNumber}`}
      className={`bg-[#0F1626] border ${colorClass} rounded-xl p-4 flex flex-col items-center justify-center aspect-square hover:bg-[#131D30] transition-colors`}
    >
      <div className="font-mono text-lg font-bold text-slate-200">{level.levelNumber}</div>
      <div className="font-mono text-[10px] text-slate-500 truncate w-full text-center px-1">{level.title}</div>
      <div className={`font-mono text-[9px] uppercase tracking-widest mt-0.5 ${colorClass.split(" ")[0]}`}>
        {level.difficulty}
      </div>
      <div className="flex items-center gap-0.5 mt-1.5">
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            size={12}
            className={n <= level.stars ? "text-amber-300 fill-amber-300" : "text-slate-700"}
          />
        ))}
      </div>
    </Link>
  );
}