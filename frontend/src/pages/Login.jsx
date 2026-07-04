import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(form.email, form.password);
    setSubmitting(false);
    if (ok) navigate("/levels");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070B14] p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#0F1626] border border-[#1E2A44] rounded-2xl p-6">
        <h1 className="font-mono text-xl font-bold text-cyan-300 mb-1">ZIP::ROUTER</h1>
        <p className="text-xs text-slate-500 font-mono mb-5">sign in to continue your progress</p>

        {error && <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono rounded-lg p-2 mb-4">{error}</div>}

        <label className="block text-[11px] font-mono text-slate-500 mb-1">EMAIL</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-[#111A2C] border border-[#1E2A44] rounded-lg px-3 py-2 text-sm text-slate-200 mb-3 outline-none focus:border-cyan-400"
        />

        <label className="block text-[11px] font-mono text-slate-500 mb-1">PASSWORD</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-[#111A2C] border border-[#1E2A44] rounded-lg px-3 py-2 text-sm text-slate-200 mb-5 outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cyan-400 text-[#07121a] font-mono font-bold text-sm rounded-lg py-2 hover:bg-cyan-300 transition-colors disabled:opacity-50"
        >
          {submitting ? "SIGNING IN..." : "SIGN IN"}
        </button>

        <p className="text-xs text-slate-500 font-mono text-center mt-4">
          no account? <Link to="/register" className="text-cyan-300 hover:underline">register</Link>
        </p>
      </form>
    </div>
  );
}
