import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Grid3x3, Trophy, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/levels", label: "LEVELS", icon: Grid3x3 },
  { to: "/leaderboard", label: "LEADERBOARD", icon: Trophy },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="border-b border-[#1E2A44] bg-[#0B1120]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/levels"
            className="font-mono text-lg font-bold text-cyan-300 tracking-tight"
            style={{ textShadow: "0 0 14px rgba(34,211,238,0.4)" }}
          >
            ZIP<span className="text-slate-500">::</span>ROUTER
          </Link>

          {user && (
            <>
              {/* Desktop nav */}
              <div className="hidden sm:flex items-center gap-3 font-mono text-xs">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    <Icon size={14} /> {label}
                  </Link>
                ))}
                <Link to="/profile" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
                  <User size={14} /> {user.name}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors">
                  <LogOut size={14} />
                </button>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="sm:hidden flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile sidebar */}
      {user && (
        <div
          className={`sm:hidden fixed inset-0 z-20 transition-opacity ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={`absolute top-0 right-0 h-full w-64 bg-[#0B1120] border-l border-[#1E2A44] flex flex-col p-4 gap-1 font-mono text-sm transition-transform duration-200 ${
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-xs tracking-widest">MENU</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-cyan-300 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 hover:bg-[#0F1626] rounded-lg px-3 py-2.5 transition-colors"
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 hover:bg-[#0F1626] rounded-lg px-3 py-2.5 transition-colors"
            >
              <User size={16} /> {user.name}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-rose-400 hover:bg-[#0F1626] rounded-lg px-3 py-2.5 transition-colors mt-2"
            >
              <LogOut size={16} /> LOGOUT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
