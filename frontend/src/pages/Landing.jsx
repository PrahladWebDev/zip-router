import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Trophy, Zap } from "lucide-react";

// Fixed 4x4 demo path just for the animated preview - purely decorative.
const DEMO_SIZE = 4;
const PATH = [0, 4, 8, 12, 13, 9, 5, 1, 2, 6, 10, 14, 15, 11, 7, 3];
const CHECKPOINTS = { 0: 1, 15: 2 };

function demoPoints() {
  return PATH.map((idx) => `${(idx % DEMO_SIZE) + 0.5},${Math.floor(idx / DEMO_SIZE) + 0.5}`).join(" ");
}

const FEATURES = [
  {
    icon: Zap,
    title: "QUICK PUZZLES",
    desc: "Bite-sized grid puzzles you can finish on a coffee break, from easy to expert.",
  },
  {
    icon: Sparkles,
    title: "HAND-CRAFTED LEVELS",
    desc: "Every level is a real single continuous path - no filler, no guesswork.",
  },
  {
    icon: Trophy,
    title: "CLIMB THE BOARD",
    desc: "Race the clock, earn stars, and see how your best times stack up globally.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 overflow-hidden relative">
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(30px,-20px);} }
        @keyframes float2 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-25px,25px);} }
        @keyframes fadeUp {
          0% { opacity:0; transform:translateY(14px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes drawPath {
          0%   { stroke-dashoffset: 34; opacity: 1; }
          65%  { stroke-dashoffset: 0;  opacity: 1; }
          82%  { stroke-dashoffset: 0;  opacity: 0; }
          83%  { stroke-dashoffset: 34; opacity: 0; }
          100% { stroke-dashoffset: 34; opacity: 0; }
        }
        @keyframes dashflow { to { stroke-dashoffset: -8; } }
        @keyframes popCk {
          0%,55% { opacity:0.35; }
          65%,80% { opacity:1; }
          82%,100% { opacity:0.35; }
        }
        .fade-up { opacity:0; animation: fadeUp 0.7s ease-out forwards; }
        .blob { filter: blur(70px); position:absolute; border-radius:9999px; pointer-events:none; }
        .zip-flow { animation: dashflow 0.6s linear infinite; }
      `}</style>

      {/* ambient background blobs */}
      <div className="blob w-72 h-72 bg-cyan-500/20 top-[-4rem] left-[-3rem]" style={{ animation: "float1 9s ease-in-out infinite" }} />
      <div className="blob w-80 h-80 bg-fuchsia-500/10 bottom-[-5rem] right-[-4rem]" style={{ animation: "float2 11s ease-in-out infinite" }} />
      <div className="blob w-56 h-56 bg-amber-400/10 top-1/3 right-1/4" style={{ animation: "float1 13s ease-in-out infinite" }} />

      {/* top bar */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="font-mono text-lg font-bold text-cyan-300 tracking-tight" style={{ textShadow: "0 0 14px rgba(34,211,238,0.4)" }}>
          ZIP<span className="text-slate-500">::</span>ROUTER
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link to="/login" className="px-3 py-2 text-slate-400 hover:text-cyan-300 transition-colors">
            SIGN IN
          </Link>
          <Link to="/register" className="px-3 py-2 rounded-lg bg-cyan-400 text-[#07121a] font-bold hover:bg-cyan-300 transition-colors">
            REGISTER
          </Link>
        </div>
      </div>

      {/* hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-10 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div
            className="fade-up inline-block font-mono text-[11px] tracking-widest text-cyan-300 border border-cyan-500/30 bg-cyan-500/5 rounded-full px-3 py-1 mb-5"
            style={{ animationDelay: "0.05s" }}
          >
            ONE LINE. EVERY CELL. NO CROSSING.
          </div>
          <h1
            className="fade-up font-mono text-4xl sm:text-5xl font-bold leading-tight mb-4"
            style={{ animationDelay: "0.15s" }}
          >
            Draw the <span className="text-cyan-300" style={{ textShadow: "0 0 20px rgba(34,211,238,0.5)" }}>one path</span>
            <br /> that fills the grid.
          </h1>
          <p className="fade-up text-slate-400 text-sm sm:text-base mb-8 max-w-md" style={{ animationDelay: "0.25s" }}>
            Connect the numbers in order, cover every square, avoid the walls - all in a single
            unbroken route. Simple to learn, brutal to master.
          </p>
          <div className="fade-up flex items-center gap-3" style={{ animationDelay: "0.35s" }}>
            <Link
              to="/register"
              className="flex items-center gap-1.5 bg-cyan-400 text-[#07121a] font-mono font-bold text-sm rounded-lg px-5 py-2.5 hover:bg-cyan-300 transition-colors"
            >
              PLAY NOW <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-[#0F1626] border border-[#1E2A44] text-slate-300 font-mono text-sm rounded-lg px-5 py-2.5 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
            >
              I HAVE AN ACCOUNT
            </Link>
          </div>
        </div>

        {/* animated demo board */}
        <div className="fade-up flex justify-center" style={{ animationDelay: "0.2s" }}>
          <div className="w-full max-w-[300px] aspect-square bg-[#0B1120] border border-[#1E2A44] rounded-2xl p-4">
            <svg viewBox={`0 0 ${DEMO_SIZE} ${DEMO_SIZE}`} className="w-full h-full block">
              {Array.from({ length: DEMO_SIZE * DEMO_SIZE }).map((_, idx) => {
                const r = Math.floor(idx / DEMO_SIZE);
                const c = idx % DEMO_SIZE;
                return (
                  <rect
                    key={idx}
                    x={c + 0.03}
                    y={r + 0.03}
                    width={0.94}
                    height={0.94}
                    rx={0.14}
                    fill="#111a2c"
                    stroke="#1f2b45"
                    strokeWidth={0.02}
                  />
                );
              })}

              <polyline
                points={demoPoints()}
                fill="none"
                stroke="#22D3EE"
                strokeWidth={0.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="34"
                style={{ animation: "drawPath 3.2s ease-in-out infinite" }}
              />
              <polyline
                points={demoPoints()}
                fill="none"
                stroke="#bff8ff"
                strokeWidth={0.05}
                strokeDasharray="0.22 0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="zip-flow"
                opacity={0.8}
              />

              {Object.entries(CHECKPOINTS).map(([idxStr, num]) => {
                const idx = Number(idxStr);
                const r = Math.floor(idx / DEMO_SIZE) + 0.5;
                const c = (idx % DEMO_SIZE) + 0.5;
                return (
                  <g key={idx} style={{ animation: "popCk 3.2s ease-in-out infinite" }}>
                    <circle cx={c} cy={r} r={0.33} fill="#FBBF24" stroke="#fde68a" strokeWidth={0.045} />
                    <text
                      x={c}
                      y={r + 0.02}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={0.36}
                      fontWeight="700"
                      fontFamily="monospace"
                      fill="#1c1508"
                    >
                      {num}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* features */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20 grid sm:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="fade-up bg-[#0F1626] border border-[#1E2A44] rounded-2xl p-5"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <Icon className="text-cyan-300 mb-3" size={20} />
            <div className="font-mono text-xs font-bold text-slate-200 tracking-wide mb-1.5">{title}</div>
            <div className="font-mono text-xs text-slate-500 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
