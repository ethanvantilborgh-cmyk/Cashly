"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useLang } from "../../context/LangContext";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { tr } = useLang();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{tr("welcome")}</h1>
          <p className="text-slate-500">{tr("loginSub")}</p>
        </div>

        <div className="card p-8 shadow-lg shadow-slate-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">{tr("email")}</label>
              <input id="email" type="email" required autoComplete="email"
                placeholder={tr("exampleEmail")}
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">{tr("password")}</label>
              <div className="relative">
                <input id="password" type={showPass ? "text" : "password"} required
                  autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label={tr("showPassword")}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs text-emerald-600 hover:text-emerald-700">{tr("forgotPassword")}</a>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="gradient-btn w-full font-semibold py-3 rounded-xl text-white disabled:opacity-60">
              {loading ? tr("loginLoading") : tr("login")}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          {tr("noAccount")}{" "}
          <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold">{tr("signup")}</Link>
        </p>
      </div>
    </div>
  );
}
