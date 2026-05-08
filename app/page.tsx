"use client";
import Link from "next/link";
import { TrendingUp, FileText, PieChart, Shield, Zap, Globe, Check, ArrowRight, Star } from "lucide-react";
import UpgradeButton from "./components/UpgradeButton";
import { useLang } from "./context/LangContext";

export default function Home() {
  const { tr } = useLang();

  const STATUS_MAP: Record<string, string> = {
    paid: "status-paid",
    pending: "status-pending",
    overdue: "status-overdue",
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 gradient-btn rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Cashly</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">{tr("navFeatures")}</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">{tr("navPricing")}</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">
              {tr("navLogin")}
            </Link>
            <Link href="/auth/signup" className="gradient-btn text-sm font-semibold px-4 py-2 rounded-lg text-white">
              {tr("freeTrialShort")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-emerald-50 via-white to-sky-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-sm text-emerald-700 font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            {tr("heroTag")}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-slate-900">
            {tr("heroTitle1")}{" "}
            <span className="gradient-text">{tr("heroTitle2")}</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {tr("heroSub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="gradient-btn font-semibold px-8 py-4 rounded-xl text-white text-lg inline-flex items-center gap-2 justify-center shadow-lg shadow-emerald-200">
              {tr("startFree")} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="bg-white border border-slate-200 font-semibold px-8 py-4 rounded-xl text-slate-700 text-lg hover:border-slate-300 transition-colors">
              {tr("seeDemo")}
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-4">{tr("freePlanNote")}</p>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <span className="font-medium text-slate-700">4.9/5</span> {tr("reviewsNote")}
            </div>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <span className="text-sm text-slate-500">{tr("usedInCountries")}</span>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <span className="text-sm text-slate-500">{tr("vatCompliance")}</span>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-4xl mx-auto mt-16 card shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-slate-400 text-xs ml-2">cashly.app/dashboard</span>
          </div>
          <div className="p-6 bg-slate-50 grid grid-cols-3 gap-4">
            {[
              { label: tr("revenueThisMonth"), value: "12 450 €", change: "+18%", color: "text-emerald-600" },
              { label: tr("expensesLabel"),    value: "3 280 €",  change: "+5%",  color: "text-red-500" },
              { label: tr("netProfit"),        value: "9 170 €",  change: "+24%", color: "text-sky-600" },
            ].map(({ label, value, change, color }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{change} {tr("vsLastMonth")}</p>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{tr("recentInvoices")}</p>
            <div className="space-y-2">
              {[
                { client: "Acme Corp",     amount: "2 400 €", status: "paid" },
                { client: "StartupXYZ",    amount: "1 800 €", status: "pending" },
                { client: "Design Studio", amount: "950 €",   status: "overdue" },
              ].map(({ client, amount, status }) => (
                <div key={client} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-700">{client}</span>
                  <span className="text-sm font-semibold text-slate-900">{amount}</span>
                  <span className={`badge ${STATUS_MAP[status]}`}>{tr(status as "paid" | "pending" | "overdue")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{tr("featuresTitle")}</h2>
          <p className="text-slate-500 text-center mb-16 text-lg">{tr("featuresSub")}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: tr("feat1Title"), desc: tr("feat1Desc"), color: "bg-emerald-50 text-emerald-600" },
              { icon: PieChart, title: tr("feat2Title"), desc: tr("feat2Desc"), color: "bg-sky-50 text-sky-600" },
              { icon: TrendingUp, title: tr("feat3Title"), desc: tr("feat3Desc"), color: "bg-violet-50 text-violet-600" },
              { icon: Globe, title: tr("feat4Title"), desc: tr("feat4Desc"), color: "bg-amber-50 text-amber-600" },
              { icon: Shield, title: tr("feat5Title"), desc: tr("feat5Desc"), color: "bg-rose-50 text-rose-600" },
              { icon: Zap, title: tr("feat6Title"), desc: tr("feat6Desc"), color: "bg-emerald-50 text-emerald-600" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card card-hover p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{tr("testimonialsTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: tr("t1Name"), role: tr("t1Role"), text: tr("t1Text"), stars: 5 },
              { name: tr("t2Name"), role: tr("t2Role"), text: tr("t2Text"), stars: 5 },
              { name: tr("t3Name"), role: tr("t3Role"), text: tr("t3Text"), stars: 5 },
            ].map(({ name, role, text, stars }) => (
              <div key={name} className="card p-6">
                <div className="flex mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{name}</p>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{tr("pricingTitle")}</h2>
          <p className="text-slate-500 text-center mb-16 text-lg">{tr("pricingSub")}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-8">
              <h3 className="text-xl font-semibold mb-1">Starter</h3>
              <div className="text-4xl font-bold my-4 text-slate-900">0€<span className="text-lg text-slate-400 font-normal">/mois</span></div>
              <p className="text-slate-400 text-sm mb-6">{tr("starterPlanDesc")}</p>
              <ul className="space-y-3 mb-8">
                {[tr("starterF1"), tr("starterF2"), tr("starterF3"), tr("starterF4")].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block text-center border border-slate-200 font-semibold px-6 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
                {tr("startFree")}
              </Link>
            </div>
            <div className="card p-8 border-emerald-200 shadow-lg shadow-emerald-100 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="gradient-btn text-xs font-semibold px-4 py-1 rounded-full text-white">{tr("recommended")}</span>
              </div>
              <h3 className="text-xl font-semibold mb-1">Pro</h3>
              <div className="text-4xl font-bold my-4 text-slate-900">19€<span className="text-lg text-slate-400 font-normal">/mois</span></div>
              <p className="text-slate-400 text-sm mb-6">{tr("proPlanDesc")}</p>
              <ul className="space-y-3 mb-8">
                {[tr("proF1"), tr("proF2"), tr("proF3"), tr("proF4"), tr("proF5"), tr("proF6")].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <UpgradeButton label={tr("startProButton")} className="gradient-btn w-full font-semibold px-6 py-3 rounded-xl text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center card p-12 shadow-xl shadow-emerald-100 border-emerald-100">
          <TrendingUp className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">{tr("ctaTitle")}</h2>
          <p className="text-slate-500 mb-8">{tr("ctaDesc")}</p>
          <Link href="/auth/signup" className="gradient-btn inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl text-white text-lg shadow-lg shadow-emerald-200">
            {tr("createFree")} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 gradient-btn rounded flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold gradient-text">Cashly</span>
          </div>
          <p className="text-slate-400 text-sm">{tr("copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
