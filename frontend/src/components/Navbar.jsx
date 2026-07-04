import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Grid3x3, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-[#1E2A44] bg-[#0B1120]/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/levels" className="font-mono text-lg font-bold text-cyan-300 tracking-tight"
          style={{ textShadow: "0 0 14px rgba(34,211,238,0.4)" }}>
          ZIP<span className="text-slate-500">::</span>ROUTER
        </Link>
        {user && (
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link to="/levels" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
              <Grid3x3 size={14} /> LEVELS
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
              <Trophy size={14} /> LEADERBOARD
            </Link>
            <Link to="/profile" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
              <User size={14} /> {user.name}
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
