"use client";
import { StatTile } from "@/components/ui";

interface Props {
  earned:    number | string;
  spent:     number | string;
  tasksDone: number | string;
  streak:    number | string;
}

export function StatsGrid({ earned, spent, tasksDone, streak }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <StatTile  value={earned}    label="min gagnées"       accent />
      <StatTile  value={spent}     label="min dépensées"            />
      <StatTile  value={tasksDone} label="tâches aujourd'hui"       />
      <StatTile  value={streak}    label="jours de streak"          />
    </div>
  );
}