"use client";
import { Card } from "@/components/ui";
import { LogRow } from "@/hooks/useScreenData";

const C = {
  accent: "#6ee7b7",
  danger: "#ff6b8a",
  text: "#f0f0ff",
  muted: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.1)",
};

interface Props {
  rows: LogRow[];
}

export function HistoriqueRecent({ rows }: Props) {
  return (
    <Card>
      {rows.length === 0 ? (
        <p style={{ fontSize: 14, color: C.muted }}>Pas de données</p>
      ) : (
        rows.map((r, i) => {
          const spend = r.nom_task.trim() === "Consommation temps";
          return (
            <div key={r.id} style={{
              display: "grid",
              gridTemplateColumns: "76px 46px 1fr 52px",
              gap: 8, padding: "10px 0", alignItems: "center",
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ fontSize: 12, color: C.muted }}>{r.date}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{r.heure.slice(0, 5)}</span>
              <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.nom_task.trim().replace(/_/g, " ")}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: spend ? C.danger : C.accent }}>
                {spend ? `−${r.time}` : `+${r.time}`}
              </span>
            </div>
          );
        })
      )}
    </Card>
  );
}