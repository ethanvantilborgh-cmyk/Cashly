"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, ArrowRight, Building2, CreditCard, Sparkles,
  FileText, Users, Check,
} from "lucide-react";
import Link from "next/link";
import { useLang } from "../context/LangContext";
import { getProfile, saveProfile } from "../lib/db";
import type { CompanySettings } from "../settings/page";

const EMPTY: CompanySettings = {
  name: "", address: "", city: "", country: "", vat: "",
  phone: "", email: "", iban: "",
  invoicePrefix: "INV", paymentDays: "30", invoiceNotes: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { tr } = useLang();
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<CompanySettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then(p => {
        // Already configured → skip onboarding
        if (p.name) { router.replace("/dashboard"); return; }
        setForm(f => ({ ...f, ...p }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function step1Submit(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function step2Submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveProfile(form);
    setSaving(false);
    setStep(3);
  }

  function inp(
    key: keyof CompanySettings,
    label: string,
    type = "text",
    placeholder = "",
    required = false,
  ) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}{required && " *"}
        </label>
        <input
          type={type}
          required={required}
          value={form[key] as string}
          placeholder={placeholder}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-8 h-8 gradient-btn rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Cashly</span>
          </Link>
          {/* Step bar */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-emerald-500 w-12" : "bg-slate-200 w-8"
                  }`}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            {step < 3 ? `Étape ${step}/2` : ""}
          </p>
        </div>

        {/* ── Step 1: Company info ── */}
        {step === 1 && (
          <div className="card p-8 shadow-lg shadow-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{tr("onboardingWelcome")}</h1>
                <p className="text-sm text-slate-500">{tr("onboardingStep1Sub")}</p>
              </div>
            </div>
            <form onSubmit={step1Submit} className="space-y-4">
              {inp("name",    "Nom de l'entreprise", "text", "Acme SRL", true)}
              {inp("email",   "Email professionnel", "email", "contact@acme.be")}
              {inp("phone",   "Téléphone",           "tel",   "+32 2 123 45 67")}
              {inp("address", "Adresse",             "text",  "Rue de la Paix 10")}
              <div className="grid grid-cols-2 gap-3">
                {inp("city",    "Ville",   "text", "Bruxelles")}
                {inp("country", "Pays",    "text", "Belgique")}
              </div>
              {inp("vat", "Numéro TVA", "text", "BE0123456789")}
              <button
                type="submit"
                className="gradient-btn w-full font-semibold py-3 rounded-xl text-white flex items-center justify-center gap-2 mt-2"
              >
                {tr("onboardingContinue")} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Billing settings ── */}
        {step === 2 && (
          <div className="card p-8 shadow-lg shadow-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{tr("onboardingStep2Title")}</h2>
                <p className="text-sm text-slate-500">{tr("onboardingStep2Sub")}</p>
              </div>
            </div>
            <form onSubmit={step2Submit} className="space-y-4">
              {inp("iban", "IBAN (virement bancaire)", "text", "BE68 5390 0754 7034")}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Préfixe des factures
                  </label>
                  <input
                    value={form.invoicePrefix}
                    onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value }))}
                    placeholder="INV"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <p className="text-xs text-slate-400 mt-1">ex: INV-001, FAC-001</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Délai de paiement (jours)
                  </label>
                  <input
                    type="number"
                    value={form.paymentDays}
                    onChange={e => setForm(f => ({ ...f, paymentDays: e.target.value }))}
                    placeholder="30"
                    min="0"
                    max="365"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mention bas de facture
                </label>
                <textarea
                  value={form.invoiceNotes}
                  onChange={e => setForm(f => ({ ...f, invoiceNotes: e.target.value }))}
                  rows={3}
                  placeholder="Merci de votre confiance. Tout retard de paiement entraîne des pénalités..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 resize-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 font-semibold py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {tr("onboardingBack")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 gradient-btn font-semibold py-3 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? "..." : (<>{tr("onboardingFinish")} <Check className="w-4 h-4" /></>)}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: Done! ── */}
        {step === 3 && (
          <div className="card p-8 shadow-lg shadow-slate-100 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{tr("onboardingDoneTitle")}</h2>
            <p className="text-slate-500 text-sm mb-8">{tr("onboardingDoneSub")}</p>
            <div className="space-y-3">
              <Link
                href="/invoices"
                className="gradient-btn w-full font-semibold py-3 rounded-xl text-white flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> {tr("onboardingCreateInvoice")}
              </Link>
              <Link
                href="/clients"
                className="w-full border border-slate-200 font-semibold py-3 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Users className="w-4 h-4" /> {tr("onboardingAddClient")}
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-slate-400 hover:text-slate-600 block py-2 transition-colors"
              >
                {tr("onboardingGoToDashboard")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
