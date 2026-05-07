"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function UpgradeButton({ label, className }: { label: string; className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleUpgrade} disabled={loading}
      className={`flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      {label}
    </button>
  );
}
