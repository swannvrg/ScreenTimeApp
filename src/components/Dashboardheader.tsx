"use client";
import { RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { StatusDot } from "@/components/ui";

const C = {
  accent: "#6ee7b7",
  accentB: "#3b82f6",
  muted: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.1)",
  text: "#f0f0ff",
};

interface Props {
  loading: boolean;
  error: string | null;
  logCount: number;
  lastUpdate: string | null;
  email: string;
  onRefresh: () => void;
}

export function DashboardHeader({ loading, error, logCount, lastUpdate, email, onRefresh }: Props) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
            Gamification
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: C.text, margin: 0 }}>
            Screen
            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Time
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onRefresh} disabled={loading} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: C.muted }}>
            <RefreshCw size={15} style={{ display: "block", animation: loading ? "spin 0.8s linear infinite" : "none" }} />
          </button>
          <Link href="/settings" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", color: C.muted, textDecoration: "none" }}>
            <Settings size={15} />
          </Link>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.muted, marginBottom: 24 }}>
        <StatusDot status={loading ? "loading" : error ? "error" : "ok"} />
        <span>
          {loading ? "Chargement…" : error ? `Erreur : ${error}` : `${logCount} logs · ${lastUpdate}`}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11 }}>{email}</span>
      </div>
    </>
  );
}