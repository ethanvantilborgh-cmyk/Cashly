"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff, Check, Mail } from "lucide-react";
import { useLang } from "../../context/LangContext";
import { useAuth } from "../../context/AuthContext";

export default function SignupPage() {
  const { tr } = useLang();
  const { signUp } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [company,   setCompany]   = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signUp(email, password, { firstName, lastName, company });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.needsConfirmation) {
      setNeedsConfirmation(true);
    } else {
      router.push("/onboarding");
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="card p-10 shadow-lg">
            <Mail className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">{tr("checkYourEmail")}</h2>
            <p className="text-slate-500 text-sm">{tr("confirmationSent")} <strong>{email}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 gradient-btn rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Cashly</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{tr("createAccount")}</h1>
          <p className="text-slate-500">{tr("signupSub")}</p>
        </div>

        <div className="card p-8 shadow-lg shadow-slate-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fname" className="block text-sm font-medium text-slate-700 mb-2">{tr("firstName")}</label>
                <input id="fname" type="text" required autoComplete="given-name"
                  placeholder={tr("exampleFirstName")}
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
              </div>
              <div>
                <label htmlFor="lname" className="block text-sm font-medium text-slate-700 mb-2">{tr("lastName")}</label>
                <input id="lname" type="text" required autoComplete="family-name"
                  placeholder={tr("exampleLastName")}
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
              </div>
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">{tr("company")}</label>
              <input id="company" type="text" placeholder={tr("exampleCompanyType")}
                value={company} onChange={e => setCompany(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
            </div>
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
                <input id="password" type={showPass ? "text" : "password"} required minLength={8}
                  autoComplete="new-password" placeholder={tr("passwordMinChars")}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label={tr("showPassword")}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="gradient-btn w-full font-semibold py-3 rounded-xl text-white disabled:opacity-60">
              {loading ? tr("creating") : tr("createFree")}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            {[tr("perk1"), tr("perk2"), tr("perk3")].map(p => (
              <div key={p} className="flex items-center gap-2 text-sm text-slate-500">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {p}
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          {tr("alreadyAccount")}{" "}
          <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">{tr("connect")}</Link>
        </p>
      </div>
    </div>
  );
}
