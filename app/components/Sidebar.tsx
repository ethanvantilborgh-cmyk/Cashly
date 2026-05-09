"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  TrendingUp, LayoutDashboard, FileText, Receipt, BarChart2,
  Settings, LogOut, Crown, Users, ClipboardList, Package,
  Moon, Sun, Menu, X, Search,
} from "lucide-react";
import { useLang } from "../context/LangContext";
import { Lang } from "../lib/translations";
import UpgradeButton from "./UpgradeButton";
import NotificationBell from "./NotificationBell";
import { useState, useEffect } from "react";
import { isPro as dbIsPro } from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FREE_INVOICE_LIMIT } from "../lib/pro";
import { getInvoices } from "../lib/db";

const LANGS: { value: Lang; flag: string; label: string }[] = [
  { value: "fr", flag: "🇫🇷", label: "FR" },
  { value: "en", flag: "🇬🇧", label: "EN" },
  { value: "nl", flag: "🇳🇱", label: "NL" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { lang, setLang, tr } = useLang();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [pro, setPro]               = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    dbIsPro().then(setPro).catch(() => setPro(false));
    getInvoices().then(invs => setInvoiceCount(invs.length)).catch(() => setInvoiceCount(0));
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const NAV = [
    { href: "/dashboard", icon: LayoutDashboard, label: tr("dashboard") },
    { href: "/invoices",  icon: FileText,         label: tr("invoices") },
    { href: "/quotes",    icon: ClipboardList,    label: tr("quotes") },
    { href: "/clients",   icon: Users,            label: tr("clients") },
    { href: "/expenses",  icon: Receipt,          label: tr("expenses") },
    { href: "/services",  icon: Package,          label: tr("services") },
    { href: "/reports",   icon: BarChart2,        label: tr("reports") },
  ];

  const sidebarInner = (
    <aside
      className={[
        "w-64 md:w-56 h-screen flex flex-col border-r",
        // Mobile: fixed overlay, toggled; Desktop: sticky
        "fixed top-0 left-0 z-40 transition-transform duration-200 ease-in-out",
        "md:sticky md:z-auto md:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
      ].join(" ")}
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--card-border)" }}
    >
      {/* Header */}
      <div
        className="px-4 h-16 flex items-center justify-between border-b flex-shrink-0"
        style={{ borderColor: "var(--card-border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 gradient-btn rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Cashly</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          {/* Close btn — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search hint (⌘K) */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            setMobileOpen(false);
            // Fire Ctrl+K programmatically
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-300 hover:text-slate-600 transition-all"
          style={{ background: "var(--card-bg)" }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">{tr("search")}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-400">⌘K</kbd>
        </button>
      </div>

      {/* Language switcher */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {LANGS.map(l => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === l.value ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${pathname === href ? "active" : ""}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t space-y-0.5 flex-shrink-0" style={{ borderColor: "var(--card-border)" }}>
        <Link
          href="/settings"
          className={`sidebar-link ${pathname === "/settings" ? "active" : ""}`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" /> {tr("settings")}
        </Link>
        <button onClick={toggleTheme} className="sidebar-link w-full text-left">
          {theme === "dark"
            ? <Sun className="w-4 h-4 flex-shrink-0" />
            : <Moon className="w-4 h-4 flex-shrink-0" />}
          {theme === "dark" ? tr("lightMode") : tr("darkMode")}
        </button>
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-left"
          style={{ color: "#f87171" }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" /> {tr("logout")}
        </button>
      </div>

      {/* Pro / Free plan card */}
      <div className="p-4 border-t flex-shrink-0" style={{ borderColor: "var(--card-border)" }}>
        {pro ? (
          <div className="bg-gradient-to-br from-emerald-500 to-sky-500 rounded-xl p-3 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-3.5 h-3.5" />
              <p className="text-xs font-bold">{tr("proPlan")}</p>
            </div>
            <p className="text-xs opacity-90">{tr("unlimitedInvoices")}</p>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-emerald-700 mb-1">{tr("freePlan")}</p>
            <p className="text-xs text-emerald-600">
              {invoiceCount}/{FREE_INVOICE_LIMIT} {tr("invoices").toLowerCase()}
            </p>
            <div className="mt-2 h-1.5 bg-emerald-100 rounded-full">
              <div
                className="h-1.5 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min((invoiceCount / FREE_INVOICE_LIMIT) * 100, 100)}%` }}
              />
            </div>
            <UpgradeButton
              label={tr("upgradePro")}
              className="mt-2 gradient-btn w-full text-xs font-semibold py-1.5 rounded-lg text-white"
            />
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger — shown only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden w-10 h-10 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Backdrop — mobile only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {sidebarInner}
    </>
  );
}
