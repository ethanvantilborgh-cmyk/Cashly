// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "paid" | "pending" | "overdue";
export type RecurringFreq  = "none" | "monthly" | "quarterly" | "yearly";
export type QuoteStatus    = "draft" | "sent" | "accepted" | "refused";

export type Invoice = {
  id: string;
  client: string;
  email: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  due: string;
  vatRate: number;
  recurring: RecurringFreq;
};

export type Expense = {
  id: number;
  label: string;
  amount: number;
  category: string;
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

// ─── Keys ─────────────────────────────────────────────────────────────────────

const INVOICES_KEY = "cashly_invoices";
const EXPENSES_KEY = "cashly_expenses";
const QUOTES_KEY   = "cashly_quotes";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_INVOICES: Invoice[] = [
  { id: "INV-001", client: "Acme Corp",      email: "contact@acme.com",  amount: 2400, status: "paid",    date: "2025-04-28", due: "2025-05-28", vatRate: 21, recurring: "none" },
  { id: "INV-002", client: "StartupXYZ",     email: "hello@startup.xyz", amount: 1800, status: "pending", date: "2025-04-25", due: "2025-05-25", vatRate: 21, recurring: "monthly" },
  { id: "INV-003", client: "Design Studio",  email: "info@design.fr",    amount: 950,  status: "overdue", date: "2025-04-10", due: "2025-04-25", vatRate: 21, recurring: "none" },
  { id: "INV-004", client: "Tech Agency",    email: "billing@tech.io",   amount: 3200, status: "paid",    date: "2025-04-05", due: "2025-05-05", vatRate: 0,  recurring: "quarterly" },
  { id: "INV-005", client: "Cloud Services", email: "finance@cloud.net", amount: 780,  status: "pending", date: "2025-03-30", due: "2025-04-30", vatRate: 6,  recurring: "none" },
];

const SEED_EXPENSES: Expense[] = [
  { id: 1, label: "Adobe Creative Cloud",     amount: 54.99,  category: "Logiciels",      date: "2025-04-30", note: "" },
  { id: 2, label: "Déplacement client Paris", amount: 87.50,  category: "Transport",       date: "2025-04-28", note: "TGV A/R" },
  { id: 3, label: "Hébergement serveur",       amount: 29.00,  category: "Infrastructure", date: "2025-04-27", note: "Vercel Pro" },
  { id: 4, label: "Google Ads",               amount: 150.00, category: "Marketing",       date: "2025-04-25", note: "" },
  { id: 5, label: "Imprimante cartouches",    amount: 34.90,  category: "Fournitures",     date: "2025-04-20", note: "" },
  { id: 6, label: "Formation UX Design",      amount: 299.00, category: "Formation",       date: "2025-04-15", note: "Udemy" },
];

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function getInvoices(): Invoice[] {
  if (typeof window === "undefined") return SEED_INVOICES;
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(SEED_INVOICES));
      return SEED_INVOICES;
    }
    return JSON.parse(raw);
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
    if (!raw) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(SEED_EXPENSES));
      return SEED_EXPENSES;
    }
    return JSON.parse(raw);
  } catch { return SEED_EXPENSES; }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export function getQuotes(): Quote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveQuotes(quotes: Quote[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export function getDashboardStats() {
  const invoices = getInvoices();
  const expenses = getExpenses();

  const thisMonth = new Date().toISOString().slice(0, 7); // "2025-04"

  const revenue  = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = revenue - totalExp;
  const unpaidAmt = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const unpaidCount = invoices.filter(i => i.status !== "paid").length;

  const recentInvoices = [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return { revenue, totalExp, netProfit, unpaidAmt, unpaidCount, recentInvoices, recentExpenses, thisMonth };
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
  const newDate = addMonths(inv.date, months);
  const newDue  = addMonths(inv.due, months);
  const num     = allInvoices.length + 1;
  return {
    ...inv,
    id: `INV-${String(num).padStart(3, "0")}`,
    date: newDate,
    due: newDue,
    status: "pending",
  };
}
