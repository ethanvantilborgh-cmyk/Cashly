"use client";
import Link from "next/link";
import { useState } from "react";
import { TrendingUp, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 gradient-btn rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Cashly</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bon retour 👋</h1>
          <p className="text-slate-500">Connectez-vous à votre espace</p>
        </div>

        <div className="card p-8 shadow-lg shadow-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input id="email" type="email" required autoComplete="email" placeholder="vous@exemple.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <input id="password" type={showPass ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Afficher">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs text-emerald-600 hover:text-emerald-700">Mot de passe oublié ?</a>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="gradient-btn w-full font-semibold py-3 rounded-xl text-white disabled:opacity-60">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold">S&apos;inscrire</Link>
        </p>
      </div>
    </div>
  );
}
