"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Users, Plus, Search, X, Check, Building2, Mail, Phone, MapPin, Hash, Pencil, Trash2 } from "lucide-react";
import { useLang } from "../context/LangContext";

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  vat: string;
};

export const CLIENTS_KEY = "cashly_clients";

export function getSavedClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveClients(clients: Client[]) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

const EMPTY_FORM = { name: "", company: "", email: "", phone: "", address: "", vat: "" };

export default function ClientsPage() {
  const { tr } = useLang();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setClients(getSavedClients()); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c: Client) {
    setEditId(c.id);
    setForm({ name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, vat: c.vat });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let updated: Client[];
    if (editId) {
      updated = clients.map(c => c.id === editId ? { ...c, ...form } : c);
    } else {
      const newClient: Client = { id: Date.now().toString(), ...form };
      updated = [newClient, ...clients];
    }
    setClients(updated);
    saveClients(updated);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleDelete(id: string) {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    saveClients(updated);
  }

  function inp(key: keyof typeof EMPTY_FORM, label: string, type = "text", placeholder = "") {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <input type={type} value={form[key]} placeholder={placeholder}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {saved && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {tr("clientCreated")}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" /> {tr("clientsTitle")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("clientsSub")}</p>
          </div>
          <button onClick={openCreate} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("newClient")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">{tr("totalClients")}</p>
            <p className="text-xl font-bold text-slate-900">{clients.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">{tr("clientsWithVAT")}</p>
            <p className="text-xl font-bold text-emerald-600">{clients.filter(c => c.vat).length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">{tr("clientsCompanies")}</p>
            <p className="text-xl font-bold text-sky-600">{clients.filter(c => c.company).length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tr("search")}
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
        </div>

        {/* Client grid */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">{tr("noClient")}</p>
            <button onClick={openCreate} className="mt-4 gradient-btn text-sm font-semibold px-5 py-2 rounded-xl text-white inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> {tr("newClient")}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 gradient-btn rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-0.5">{c.name}</h3>
                {c.company && <p className="text-xs text-slate-400 mb-3 flex items-center gap-1"><Building2 className="w-3 h-3" /> {c.company}</p>}
                <div className="space-y-1.5 mt-2">
                  {c.email && <p className="text-xs text-slate-500 flex items-center gap-2"><Mail className="w-3 h-3 text-slate-300" /> {c.email}</p>}
                  {c.phone && <p className="text-xs text-slate-500 flex items-center gap-2"><Phone className="w-3 h-3 text-slate-300" /> {c.phone}</p>}
                  {c.address && <p className="text-xs text-slate-500 flex items-center gap-2"><MapPin className="w-3 h-3 text-slate-300" /> {c.address}</p>}
                  {c.vat && <p className="text-xs text-emerald-600 flex items-center gap-2 font-medium"><Hash className="w-3 h-3" /> {c.vat}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editId ? tr("editClient") : tr("newClientTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {inp("name", tr("clientName") + " *", "text", "Jean Dupont")}
              {inp("company", tr("clientCompany"), "text", "Acme SRL")}
              {inp("email", tr("clientEmail"), "email", "jean@acme.be")}
              {inp("phone", tr("clientPhone"), "tel", "+32 2 123 45 67")}
              {inp("address", tr("clientAddress"), "text", "Rue de la Paix 10, 1000 Bruxelles")}
              {inp("vat", tr("clientVat"), "text", "BE0123456789")}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">{tr("cancel")}</button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">
                  {editId ? tr("saveChanges") : tr("addClient")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
