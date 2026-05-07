import Sidebar from "../components/Sidebar";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-8">
          <Settings className="w-6 h-6 text-slate-500" /> Paramètres
        </h1>
        <div className="card p-6 max-w-xl">
          <p className="text-slate-500 text-sm">Les paramètres avancés arrivent bientôt.</p>
        </div>
      </main>
    </div>
  );
}
