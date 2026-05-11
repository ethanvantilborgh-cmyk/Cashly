/**
 * db.ts – all Supabase CRUD operations for Cashly.
 * Pages import from here instead of localStorage storage.ts helpers.
 */
import { getSupabase } from "./supabase";
import type {
  Invoice, InvoiceLine, Expense, Quote, Service,
  InvoiceStatus, RecurringFreq, QuoteStatus,
} from "./storage";
import type { CompanySettings } from "../settings/page";
import type { Client } from "../clients/page";

// ── Helpers ────────────────────────────────────────────────────────────────

async function uid(): Promise<string> {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    client: r.client,
    email: r.email ?? "",
    lines: (r.lines ?? []) as InvoiceLine[],
    amount: Number(r.amount),
    status: r.status as InvoiceStatus,
    date: r.date,
    due: r.due,
    vatRate: Number(r.vat_rate),
    recurring: r.recurring as RecurringFreq,
  };
}

// ── Invoices ───────────────────────────────────────────────────────────────

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToInvoice);
}

export async function upsertInvoice(inv: Invoice): Promise<void> {
  const userId = await uid();
  const { error } = await getSupabase().from("invoices").upsert({
    id: inv.id, user_id: userId,
    client: inv.client, email: inv.email,
    lines: inv.lines, amount: inv.amount,
    status: inv.status, date: inv.date, due: inv.due,
    vat_rate: inv.vatRate, recurring: inv.recurring,
  });
  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await getSupabase().from("invoices").delete().eq("id", id);
  if (error) throw error;
}

// ── Expenses ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExpense(r: any): Expense {
  return {
    id: r.id as string,
    label: r.label, amount: Number(r.amount),
    category: r.category, date: r.date, note: r.note ?? "",
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function upsertExpense(exp: Expense): Promise<Expense> {
  const userId = await uid();
  const row = {
    user_id: userId,
    label: exp.label, amount: exp.amount,
    category: exp.category, date: exp.date, note: exp.note,
  };
  // Include id only when updating an existing row
  const payload = exp.id ? { ...row, id: exp.id } : row;
  const { data, error } = await supabase
    .from("expenses")
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return rowToExpense(data);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await getSupabase().from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// ── Quotes ─────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id, client: r.client, email: r.email ?? "",
    amount: Number(r.amount), status: r.status as QuoteStatus,
    date: r.date, due: r.due,
    vatRate: Number(r.vat_rate), description: r.description ?? "",
  }));
}

export async function upsertQuote(q: Quote): Promise<void> {
  const userId = await uid();
  const { error } = await getSupabase().from("quotes").upsert({
    id: q.id, user_id: userId,
    client: q.client, email: q.email,
    amount: q.amount, status: q.status,
    date: q.date, due: q.due,
    vat_rate: q.vatRate, description: q.description,
  });
  if (error) throw error;
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await getSupabase().from("quotes").delete().eq("id", id);
  if (error) throw error;
}

// ── Services ───────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id, name: r.name, description: r.description ?? "",
    unitPrice: Number(r.unit_price), vatRate: Number(r.vat_rate), unit: r.unit,
  }));
}

export async function upsertService(s: Service): Promise<void> {
  const userId = await uid();
  const { error } = await getSupabase().from("services").upsert({
    id: s.id, user_id: userId,
    name: s.name, description: s.description,
    unit_price: s.unitPrice, vat_rate: s.vatRate, unit: s.unit,
  });
  if (error) throw error;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await getSupabase().from("services").delete().eq("id", id);
  if (error) throw error;
}

// ── Clients ────────────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id, name: r.name, company: r.company ?? "",
    email: r.email ?? "", phone: r.phone ?? "",
    address: r.address ?? "", vat: r.vat ?? "",
  }));
}

export async function upsertClient(c: Client): Promise<void> {
  const userId = await uid();
  const { error } = await getSupabase().from("clients").upsert({
    id: c.id, user_id: userId,
    name: c.name, company: c.company,
    email: c.email, phone: c.phone,
    address: c.address, vat: c.vat,
  });
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await getSupabase().from("clients").delete().eq("id", id);
  if (error) throw error;
}

// ── Profile ────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: CompanySettings & { plan: string; lang: string } = {
  name: "", address: "", city: "", country: "", vat: "",
  phone: "", email: "", iban: "", invoicePrefix: "INV",
  paymentDays: "30", invoiceNotes: "",
  plan: "free", lang: "fr",
};

export async function getProfile(): Promise<CompanySettings & { plan: string; lang: string }> {
  const { data, error } = await supabase
    .from("profiles").select("*").single();
  if (error || !data) return DEFAULT_PROFILE;
  return {
    name: data.company_name ?? "",
    address: data.company_address ?? "",
    city: data.company_city ?? "",
    country: data.company_country ?? "",
    vat: data.company_vat ?? "",
    phone: data.company_phone ?? "",
    email: data.company_email ?? "",
    iban: data.company_iban ?? "",
    invoicePrefix: data.invoice_prefix ?? "INV",
    paymentDays: String(data.payment_days ?? 30),
    invoiceNotes: data.invoice_notes ?? "",
    plan: data.plan ?? "free",
    lang: data.lang ?? "fr",
  };
}

export async function saveProfile(settings: CompanySettings): Promise<void> {
  const userId = await uid();
  const { error } = await getSupabase().from("profiles").upsert({
    id: userId,
    company_name: settings.name,
    company_address: settings.address,
    company_city: settings.city,
    company_country: settings.country,
    company_vat: settings.vat,
    company_phone: settings.phone,
    company_email: settings.email,
    company_iban: settings.iban,
    invoice_prefix: settings.invoicePrefix,
    payment_days: parseInt(settings.paymentDays) || 30,
    invoice_notes: settings.invoiceNotes,
  });
  if (error) throw error;
}

export async function saveLang(lang: string): Promise<void> {
  const userId = await uid();
  await getSupabase().from("profiles").upsert({ id: userId, lang });
}

export async function isPro(): Promise<boolean> {
  const { data } = await supabase
    .from("profiles").select("plan").single();
  return data?.plan === "pro";
}

export async function activatePro(): Promise<void> {
  const userId = await uid();
  await getSupabase().from("profiles").upsert({ id: userId, plan: "pro" });
}

// ── Seed (called once after signup) ───────────────────────────────────────

export async function seedUserData(userId: string, companyName = ""): Promise<void> {
  // Mark seeded to avoid double-seeding
  await getSupabase().from("profiles").upsert({
    id: userId, company_name: companyName, seeded: true,
  });

  const today = new Date().toISOString().split("T")[0];
  const m = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  };

  const rnd = () => Math.random().toString(36).slice(2);

  // Invoices
  await getSupabase().from("invoices").insert([
    { id: "INV-001", user_id: userId, client: "Acme Corp",      email: "contact@acme.com",   lines: [{ id: rnd(), description: "Web development", qty: 1, unitPrice: 2400, vatRate: 21 }], amount: 2400, status: "paid",    date: m(-10), due: m(20),  vat_rate: 21, recurring: "none" },
    { id: "INV-002", user_id: userId, client: "StartupXYZ",     email: "hello@startup.xyz",  lines: [{ id: rnd(), description: "UI/UX Design", qty: 3, unitPrice: 400, vatRate: 21 }, { id: rnd(), description: "Integration", qty: 2, unitPrice: 300, vatRate: 21 }], amount: 1800, status: "pending", date: m(-5),  due: m(25),  vat_rate: 21, recurring: "monthly" },
    { id: "INV-003", user_id: userId, client: "Design Studio",  email: "info@design.studio", lines: [{ id: rnd(), description: "Consulting", qty: 5, unitPrice: 190, vatRate: 21 }], amount: 950,  status: "overdue", date: m(-30), due: m(-15), vat_rate: 21, recurring: "none" },
    { id: "INV-004", user_id: userId, client: "Tech Agency",    email: "billing@tech.io",    lines: [{ id: rnd(), description: "API Development", qty: 1, unitPrice: 3200, vatRate: 0 }], amount: 3200, status: "paid",    date: m(-35), due: m(0),   vat_rate: 0,  recurring: "quarterly" },
    { id: "INV-005", user_id: userId, client: "Cloud Services", email: "finance@cloud.net",  lines: [{ id: rnd(), description: "Monthly maintenance", qty: 1, unitPrice: 780, vatRate: 6 }], amount: 780,  status: "pending", date: m(-40), due: m(-10), vat_rate: 6,  recurring: "none" },
  ]);

  // Expenses
  await getSupabase().from("expenses").insert([
    { user_id: userId, label: "Adobe Creative Cloud", amount: 54.99,  category: "software",       date: m(-2),  note: "" },
    { user_id: userId, label: "Client trip Paris",     amount: 87.50,  category: "transport",      date: m(-4),  note: "Train round-trip" },
    { user_id: userId, label: "Server hosting",        amount: 29.00,  category: "infrastructure", date: m(-5),  note: "Vercel Pro" },
    { user_id: userId, label: "Google Ads",            amount: 150.00, category: "marketing",      date: m(-7),  note: "" },
    { user_id: userId, label: "Printer cartridges",    amount: 34.90,  category: "supplies",       date: m(-12), note: "" },
    { user_id: userId, label: "UX Design Training",    amount: 299.00, category: "training",       date: m(-15), note: "Udemy" },
  ]);

  // Services
  await getSupabase().from("services").insert([
    { id: "s1", user_id: userId, name: "Web development",  description: "Front/back development",    unit_price: 800,  vat_rate: 21, unit: "day" },
    { id: "s2", user_id: userId, name: "UI/UX Design",     description: "Wireframes and prototypes", unit_price: 600,  vat_rate: 21, unit: "day" },
    { id: "s3", user_id: userId, name: "Consulting",       description: "Advice and strategy",       unit_price: 190,  vat_rate: 21, unit: "hour" },
    { id: "s4", user_id: userId, name: "Maintenance",      description: "Support and maintenance",   unit_price: 350,  vat_rate: 21, unit: "package" },
    { id: "s5", user_id: userId, name: "Training",         description: "Custom training sessions",  unit_price: 1200, vat_rate: 21, unit: "day" },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _today = today; // keep linter happy
}
