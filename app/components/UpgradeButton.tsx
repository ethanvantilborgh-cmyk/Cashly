"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function UpgradeButton({ label, className }: { label: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Erreur inconnue");
        setLoading(false);
      }
    } catch (e) {
      setError("Impossible de contacter le serveur");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleUpgrade} disabled={loading}
        className={`flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {label}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  );
}
