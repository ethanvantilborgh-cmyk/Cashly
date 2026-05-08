// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "paid" | "pending" | "overdue";
export type RecurringFreq  = "none" | "monthly" | "quarterly" | "yearly";
export type QuoteStatus    = "draft" | "sent" | "accepted" | "refused";

export type InvoiceLine = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
};

export type Invoice = {
  id: string;
  client: string;
  email: string;
  lines: InvoiceLine[];
  amount: number;        // total HT (computed from lines)
  status: InvoiceStatus;
  date: string;
  due: string;
  vatRate: number;       // default vat for display
  recurring: RecurringFreq;
};

export type Expense = {
  id: number;
  label: string;
  amount: number;
  category: string;      // language-agnostic code: "software", "transport", etc.
  date: string;
  note: string;
};

export type Quote = {
  id: string;
  client: string;
  email: string;
  amount: number;
  status: QuoteStatus;
  date: string;
  due: string;
  vatRate: number;
  description: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  vatRate: number;
  unit: string;          // language-agnostic code: "hour", "day", "package", "unit", "month"
};

// ─── Keys ─────────────────────────────────────────────────────────────────────

const INVOICES_KEY = "cashly_invoices";
const EXPENSES_KEY = "cashly_expenses";
const QUOTES_KEY   = "cashly_quotes";
const SERVICES_KEY = "cashly_services";

// ─── Migration maps ───────────────────────────────────────────────────────────

const LEGACY_CAT_TO_CODE: Record<string, string> = {
  // FR
  Logiciels: "software", Transport: "transport", Infrastructure: "infrastructure",
  Marketing: "marketing", Fournitures: "supplies", Formation: "training",
  Repas: "meals", Autre: "other",
  // EN
  Software: "software", Supplies: "supplies", Training: "training",
  Meals: "meals", Other: "other",
  // NL
  Infrastructuur: "infrastructure", Benodigdheden: "supplies",
  Opleiding: "training", Maaltijden: "meals", Overig: "other",
};

const LEGACY_UNIT_TO_CODE: Record<string, string> = {
  // FR
  heure: "hour", jour: "day", forfait: "package", "unité": "unit", mois: "month",
  // EN
  hour: "hour", day: "day", package: "package", unit: "unit", month: "month",
  // NL
  uur: "hour", dag: "day", eenheid: "unit", maand: "month",
};

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function makeLine(desc: string, qty: number, price: number, vat: number): InvoiceLine {
  return { id: Math.random().toString(36).slice(2), description: desc, qty, unitPrice: price, vatRate: vat };
}

// ─── Seed data (English — language-neutral) ───────────────────────────────────

const SEED_INVOICES: Invoice[] = [
  { id: "INV-001", client: "Acme Corp",      email: "contact@acme.com",  lines: [makeLine("Web development", 1, 2400, 21)], amount: 2400, status: "paid",    date: "2025-04-28", due: "2025-05-28", vatRate: 21, recurring: "none" },
  { id: "INV-002", client: "StartupXYZ",     email: "hello@startup.xyz", lines: [makeLine("UI/UX Design", 3, 400, 21), makeLine("Integration", 2, 300, 21)], amount: 1800, status: "pending", date: "2025-04-25", due: "2025-05-25", vatRate: 21, recurring: "monthly" },
  { id: "INV-003", client: "Design Studio",  email: "info@design.studio", lines: [makeLine("Consulting", 5, 190, 21)], amount: 950, status: "overdue", date: "2025-04-10", due: "2025-04-25", vatRate: 21, recurring: "none" },
  { id: "INV-004", client: "Tech Agency",    email: "billing@tech.io",   lines: [makeLine("API Development", 1, 3200, 0)], amount: 3200, status: "paid", date: "2025-04-05", due: "2025-05-05", vatRate: 0,  recurring: "quarterly" },
  { id: "INV-005", client: "Cloud Services", email: "finance@cloud.net", lines: [makeLine("Monthly maintenance", 1, 780, 6)], amount: 780, status: "pending", date: "2025-03-30", due: "2025-04-30", vatRate: 6, recurring: "none" },
];

const SEED_EXPENSES: Expense[] = [
  { id: 1, label: "Adobe Creative Cloud",  amount: 54.99,  category: "software",       date: "2025-04-30", note: "" },
  { id: 2, label: "Client trip Paris",      amount: 87.50,  category: "transport",      date: "2025-04-28", note: "Train round-trip" },
  { id: 3, label: "Server hosting",         amount: 29.00,  category: "infrastructure", date: "2025-04-27", note: "Vercel Pro" },
  { id: 4, label: "Google Ads",            amount: 150.00, category: "marketing",      date: "2025-04-25", note: "" },
  { id: 5, label: "Printer cartridges",    amount: 34.90,  category: "supplies",       date: "2025-04-20", note: "" },
  { id: 6, label: "UX Design Training",    amount: 299.00, category: "training",       date: "2025-04-15", note: "Udemy" },
];

const SEED_SERVICES: Service[] = [
  { id: "s1", name: "Web development",  description: "Front/back development",    unitPrice: 800,  vatRate: 21, unit: "day" },
  { id: "s2", name: "UI/UX Design",     description: "Wireframes and prototypes", unitPrice: 600,  vatRate: 21, unit: "day" },
  { id: "s3", name: "Consulting",       description: "Advice and strategy",       unitPrice: 190,  vatRate: 21, unit: "hour" },
  { id: "s4", name: "Maintenance",      description: "Support and maintenance",   unitPrice: 350,  vatRate: 21, unit: "package" },
  { id: "s5", name: "Training",         description: "Custom training sessions",  unitPrice: 1200, vatRate: 21, unit: "day" },
];

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function getInvoices(): Invoice[] {
  if (typeof window === "undefined") return SEED_INVOICES;
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) { localStorage.setItem(INVOICES_KEY, JSON.stringify(SEED_INVOICES)); return SEED_INVOICES; }
    // Migrate old invoices without lines
    const parsed: Invoice[] = JSON.parse(raw);
    return parsed.map(inv => ({
      ...inv,
      lines: inv.lines ?? [makeLine("", 1, inv.amount, inv.vatRate)],
      recurring: inv.recurring ?? "none",
    }));
  } catch { return SEED_INVOICES; }
}

export function saveInvoices(invoices: Invoice[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return SEED_EXPENSES;
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) { localStorage.setItem(EXPENSES_KEY, JSON.stringify(SEED_EXPENSES)); return SEED_EXPENSES; }
    const parsed: Expense[] = JSON.parse(raw);
    // Migrate old language-specific category strings to neutral codes
    return parsed.map(exp => ({
      ...exp,
      category: LEGACY_CAT_TO_CODE[exp.category] ?? exp.category,
    }));
  } catch { return SEED_EXPENSES; }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export function getQuotes(): Quote[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(QUOTES_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}

export function saveQuotes(quotes: Quote[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

// ─── Services ─────────────────────────────────────────────────────────────────

export function getServices(): Service[] {
  if (typeof window === "undefined") return SEED_SERVICES;
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (!raw) { localStorage.setItem(SERVICES_KEY, JSON.stringify(SEED_SERVICES)); return SEED_SERVICES; }
    const parsed: Service[] = JSON.parse(raw);
    // Migrate old language-specific unit strings to neutral codes
    return parsed.map(s => ({
      ...s,
      unit: LEGACY_UNIT_TO_CODE[s.unit] ?? s.unit,
    }));
  } catch { return SEED_SERVICES; }
}

export function saveServices(services: Service[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
}

// ─── Line helpers ─────────────────────────────────────────────────────────────

export function newLine(vatRate = 21): InvoiceLine {
  return { id: Date.now().toString(), description: "", qty: 1, unitPrice: 0, vatRate };
}

export function lineHT(line: InvoiceLine)  { return line.qty * line.unitPrice; }
export function lineTVA(line: InvoiceLine) { return lineHT(line) * line.vatRate / 100; }
export function lineTTC(line: InvoiceLine) { return lineHT(line) + lineTVA(line); }

export function invoiceTotalHT(lines: InvoiceLine[])  { return lines.reduce((s, l) => s + lineHT(l), 0); }
export function invoiceTotalTVA(lines: InvoiceLine[]) { return lines.reduce((s, l) => s + lineTVA(l), 0); }
export function invoiceTotalTTC(lines: InvoiceLine[]) { return lines.reduce((s, l) => s + lineTTC(l), 0); }

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export function getDashboardStats() {
  const invoices = getInvoices();
  const expenses = getExpenses();
  const revenue   = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalExp  = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = revenue - totalExp;
  const unpaidAmt   = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const unpaidCount = invoices.filter(i => i.status !== "paid").length;
  const recentInvoices = [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return { revenue, totalExp, netProfit, unpaidAmt, unpaidCount, recentInvoices, recentExpenses };
}

// ─── VAT report ───────────────────────────────────────────────────────────────

export type VatQuarter = {
  quarter: number;       // 1–4
  year: number;
  vatCollected: number;
  vatDeductible: number;
  vatDue: number;
  revenueHT: number;
  expensesHT: number;
};

export function getVatReport(): VatQuarter[] {
  const invoices = getInvoices();
  const expenses = getExpenses();

  const quarters: Record<string, VatQuarter> = {};

  invoices.filter(i => i.status === "paid").forEach(inv => {
    const d = new Date(inv.date);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const year = d.getFullYear();
    const key = `${year}-Q${q}`;
    if (!quarters[key]) quarters[key] = { quarter: q, year, vatCollected: 0, vatDeductible: 0, vatDue: 0, revenueHT: 0, expensesHT: 0 };
    const vatAmt = inv.lines.reduce((s, l) => s + lineTVA(l), 0);
    quarters[key].vatCollected += vatAmt;
    quarters[key].revenueHT   += inv.amount;
  });

  expenses.forEach(exp => {
    const d = new Date(exp.date);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const year = d.getFullYear();
    const key = `${year}-Q${q}`;
    if (!quarters[key]) quarters[key] = { quarter: q, year, vatCollected: 0, vatDeductible: 0, vatDue: 0, revenueHT: 0, expensesHT: 0 };
    quarters[key].vatDeductible += exp.amount * 0.21;
    quarters[key].expensesHT   += exp.amount;
  });

  return Object.values(quarters)
    .map(q => ({ ...q, vatDue: Math.max(0, q.vatCollected - q.vatDeductible) }))
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter - b.quarter);
}

// ─── Recurring helpers ────────────────────────────────────────────────────────

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export function nextRecurringDate(inv: Invoice): string | null {
  if (inv.recurring === "none" || !inv.recurring) return null;
  const months = inv.recurring === "monthly" ? 1 : inv.recurring === "quarterly" ? 3 : 12;
  return addMonths(inv.due, months);
}

export function generateNextInvoice(inv: Invoice, allInvoices: Invoice[]): Invoice {
  const months = inv.recurring === "monthly" ? 1 : inv.recurring === "quarterly" ? 3 : 12;
  const nums = allInvoices.map(i => parseInt(i.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const maxId = nums.length ? Math.max(...nums) : 0;
  return {
    ...inv,
    id: `INV-${String(maxId + 1).padStart(3, "0")}`,
    date: addMonths(inv.date, months),
    due:  addMonths(inv.due,  months),
    status: "pending",
  };
}
