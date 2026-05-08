"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Settings, Building2, CreditCard, Check, Save } from "lucide-react";
import { useLang } from "../context/LangContext";

export const STORAGE_KEY = "cashly_company";

export type CompanySettings = {
  name: string;
  address: string;
  city: string;
  country: string;
  vat: string;
  phone: string;
  email: string;
  iban: string;
  invoicePrefix: string;
  paymentDays: string;
  invoiceNotes: string;
};

export const DEFAULT_COMPANY: CompanySettings = {
  name: "", address: "", city: "", country: "", vat: "",
  phone: "", email: "", iban: "", invoicePrefix: "INV",
  paymentDays: "30", invoiceNotes: "",
};

export function getCompanySettings(): CompanySettings {
  if (typeof window === "undefined") return DEFAULT_COMPANY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_COMPANY, ...JSON.parse(raw) } : DEFAULT_COMPANY;
  } catch { return DEFAULT_COMPANY; }
}

export default function SettingsPage() {
  const { tr } = useLang();
  const [form, setForm] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(getCompanySettings()); }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function field(key: keyof CompanySettings, label: string, type = "text", placeholder = "") {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <input
          type={type}
          value={form[key]}
          placeholder={placeholder}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {saved && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {tr("settingsSaved")}
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 gradient-btn rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tr("settingsTitle")}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{tr("settingsSub")}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-slate-900">{tr("profileSection")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">{field("name", tr("companyName"), "text", "Acme SRL")}</div>
              <div className="col-span-2">{field("address", tr("companyAddress"), "text", "Rue de la Paix 10")}</div>
              <div>{field("city", tr("companyCity"), "text", "1000 Bruxelles")}</div>
              <div>{field("country", tr("companyCountry"), "text", "Belgique")}</div>
              <div>{field("vat", tr("companyVat"), "text", "BE0123456789")}</div>
              <div>{field("phone", tr("companyPhone"), "tel", "+32 2 123 45 67")}</div>
              <div className="col-span-2">{field("email", tr("companyEmail"), "email", "factures@acme.be")}</div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-4 h-4 text-sky-500" />
              <h2 className="font-semibold text-slate-900">{tr("billingSection")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">{field("iban", tr("companyIban"), "text", "BE68 5390 0754 7034")}</div>
              <div>{field("invoicePrefix", tr("invoicePrefix"), "text", "INV")}</div>
              <div>{field("paymentDays", tr("paymentDays"), "number", "30")}</div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("invoiceNotes")}</label>
                <textarea
                  value={form.invoiceNotes}
                  placeholder={tr("invoiceNotesPlaceholder")}
                  rows={3}
                  onChange={e => setForm({ ...form, invoiceNotes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="gradient-btn font-semibold px-8 py-3 rounded-xl text-white flex items-center gap-2">
            <Save className="w-4 h-4" /> {tr("saveSettings")}
          </button>
        </form>
      </main>
    </div>
  );
}
