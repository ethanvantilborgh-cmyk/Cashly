import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LangProvider } from "./context/LangContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import GlobalSearch from "./components/GlobalSearch";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Cashly — Simple bookkeeping for freelancers & SMEs",
  description: "Manage your invoices, expenses and financial reports in one place. FR · EN · NL",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Cashly" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900" style={{ fontFamily: "var(--font-geist, system-ui, sans-serif)" }}>
        <ThemeProvider>
          <AuthProvider>
            <LangProvider>
              <GlobalSearch />
              {children}
            </LangProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
