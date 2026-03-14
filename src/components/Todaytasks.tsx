"use client";
import { Card } from "@/components/ui";

const C = {
  accent: "#6ee7b7",
  text: "#f0f0ff",
  muted: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.1)",
};

interface Task {
  name: string;
  count: number;
  total: number;
}

interface Props {
  tasks: Task[];
}

export function TodayTasks({ tasks }: Props) {
  return (
    <Card>
      {tasks.length === 0 ? (
        <p style={{ fontSize: 14, color: C.muted }}>Aucune tâche aujourd'hui</p>
      ) : (
        tasks.map((t, i) => (
          <div key={t.name} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 0",
            borderBottom: i < tasks.length - 1 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{ flex: 1, fontSize: 14, color: C.text, fontWeight: 500 }}>
              {t.name.replace(/_/g, " ")}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>×{t.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.accent, background: "rgba(110,231,183,0.12)", padding: "4px 10px", borderRadius: 8 }}>
              +{t.total} min
            </span>
          </div>
        ))
      )}
    </Card>
  );
}