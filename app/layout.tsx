import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LangProvider } from "./context/LangContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Cashly — Comptabilité simplifiée",
  description: "Gérez vos factures, dépenses et rapports financiers en un seul endroit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900" style={{ fontFamily: "var(--font-geist, system-ui, sans-serif)" }}>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
