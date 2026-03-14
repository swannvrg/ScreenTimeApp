"use client";
import { Card, ProgressBar } from "@/components/ui";

const C = {
  accent: "#6ee7b7",
  danger: "#ff6b8a",
  warn: "#fbbf24",
  muted: "rgba(255,255,255,0.4)",
};

interface Props {
  spent: number;
  budget: number;
}

export function BudgetCard({ spent, budget }: Props) {
  const pct = Math.min(Math.round((spent / budget) * 100), 100);
  const pctColor = pct >= 100 ? C.danger : pct >= 75 ? C.warn : C.accent;
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Budget consommé</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: pctColor }}>{spent}</span>
          <span style={{ color: C.muted }}> / {budget} min</span>
        </span>
      </div>
      <ProgressBar value={spent} max={budget} />
      <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{pct}% utilisé</p>
    </Card>
  );
}