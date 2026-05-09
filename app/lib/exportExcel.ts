import * as XLSX from "xlsx";
import type { Invoice, Expense } from "./storage";
import { invoiceTotalHT, invoiceTotalTVA, invoiceTotalTTC } from "./storage";

export function exportInvoicesToExcel(invoices: Invoice[], filename = "factures-cashly") {
  const rows = invoices.map(inv => ({
    "Référence":     inv.id,
    "Client":        inv.client,
    "Email":         inv.email,
    "Date":          inv.date,
    "Échéance":      inv.due,
    "Statut":        inv.status === "paid" ? "Payée" : inv.status === "pending" ? "En attente" : "En retard",
    "Total HT (€)":  invoiceTotalHT(inv.lines),
    "TVA (€)":       invoiceTotalTVA(inv.lines),
    "Total TTC (€)": invoiceTotalTTC(inv.lines),
    "Récurrent":     inv.recurring !== "none" ? inv.recurring : "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [14, 20, 24, 12, 12, 12, 14, 12, 14, 10].map(w => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Factures");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportExpensesToExcel(expenses: Expense[], filename = "depenses-cashly") {
  const rows = expenses.map(exp => ({
    "Date":        exp.date,
    "Libellé":     exp.label,
    "Catégorie":   exp.category,
    "Montant (€)": exp.amount,
    "Note":        exp.note,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [12, 28, 16, 14, 30].map(w => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dépenses");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportFullReport(invoices: Invoice[], expenses: Expense[], filename = "rapport-cashly") {
  const invRows = invoices.map(inv => ({
    "Type": "Facture",
    "Référence": inv.id,
    "Client / Libellé": inv.client,
    "Date": inv.date,
    "Statut": inv.status === "paid" ? "Payée" : inv.status === "pending" ? "En attente" : "En retard",
    "Montant HT (€)": invoiceTotalHT(inv.lines),
    "TVA (€)": invoiceTotalTVA(inv.lines),
    "Montant TTC (€)": invoiceTotalTTC(inv.lines),
  }));

  const expRows = expenses.map(exp => ({
    "Type": "Dépense",
    "Référence": "",
    "Client / Libellé": exp.label,
    "Date": exp.date,
    "Statut": exp.category,
    "Montant HT (€)": -exp.amount,
    "TVA (€)": 0,
    "Montant TTC (€)": -exp.amount,
  }));

  const allRows = [...invRows, ...expRows].sort((a, b) => a["Date"] > b["Date"] ? -1 : 1);

  const ws = XLSX.utils.json_to_sheet(allRows);
  ws["!cols"] = [10, 12, 28, 12, 14, 16, 12, 16].map(w => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rapport complet");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportCSV(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}
