"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, LayoutDashboard, FileText, Receipt, BarChart2, Settings, LogOut } from "lucide-react";
import { useLang } from "../context/LangContext";
import { Lang } from "../lib/translations";

const LANGS: { value: Lang; flag: string; label: string }[] = [
  { value: "fr", flag: "🇫🇷", label: "FR" },
  { value: "en", flag: "🇬🇧", label: "EN" },
  { value: "nl", flag: "🇳🇱", label: "NL" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { lang, setLang, tr } = useLang();

  const NAV = [
    { href: "/dashboard", icon: LayoutDashboard, label: tr("dashboard") },
    { href: "/invoices",  icon: FileText,         label: tr("invoices") },
    { href: "/expenses",  icon: Receipt,           label: tr("expenses") },
    { href: "/reports",   icon: BarChart2,         label: tr("reports") },
  ];

  return (
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col">
      <div className="px-4 h-16 flex items-center gap-2 border-b border-slate-100">
        <div className="w-7 h-7 gradient-btn rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg gradient-text">Cashly</span>
      </div>

      {/* Language switcher */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {LANGS.map(l => (
            <button key={l.value} onClick={() => setLang(l.value)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === l.value ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}>
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`sidebar-link ${pathname === href ? "active" : ""}`}>
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link href="/settings" className="sidebar-link">
          <Settings className="w-4 h-4" /> {tr("settings")}
        </Link>
        <Link href="/" className="sidebar-link" style={{ color: "#f87171" }}>
          <LogOut className="w-4 h-4" /> {tr("logout")}
        </Link>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-emerald-700 mb-1">{tr("freePlan")}</p>
          <p className="text-xs text-emerald-600">3/5 {tr("invoices").toLowerCase()}</p>
          <div className="mt-2 h-1.5 bg-emerald-100 rounded-full">
            <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: "60%" }} />
          </div>
          <button className="mt-2 gradient-btn w-full text-center text-xs font-semibold py-1.5 rounded-lg text-white">
            {tr("upgradePro")}
          </button>
        </div>
      </div>
    </aside>
  );
}
