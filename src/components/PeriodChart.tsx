"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LogRow } from "@/hooks/useScreenData";

const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAYS_LONG  = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function dateToStr(d: Date) { return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; }
function isTask(r: LogRow)  { return r.nom_task && r.nom_task.trim() !== "Consommation temps" && r.nom_task.trim() !== ""; }
function isSpend(r: LogRow) { return r.nom_task.trim() === "Consommation temps"; }

type Mode = "week" | "month";

interface DayData {
  label: string;
  labelLong: string;
  dateStr: string;
  earned: number;
  spent: number;
  isToday: boolean;
  tasks: { name: string; count: number; total: number }[];
}

interface Props { raw: LogRow[]; }

export function PeriodChart({ raw }: Props) {
  const [mode, setMode]           = useState<Mode>("week");
  const [offset, setOffset]       = useState(0);
  const [expandedDay, setExpanded] = useState<string | null>(null);

  const weekDays = useMemo((): DayData[] => {
    const today = new Date();
    const dow = today.getDay();
    const fromMon = dow === 0 ? 6 : dow - 1;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - fromMon + i + offset * 7);
      const ds = dateToStr(d);
      const rows = raw.filter(r => r.date === ds);
      const taskRows = rows.filter(isTask);
      const counts: Record<string, { count: number; total: number }> = {};
      taskRows.forEach(r => {
        const k = r.nom_task.trim();
        if (!counts[k]) counts[k] = { count: 0, total: 0 };
        counts[k].count++;
        counts[k].total += r.time;
      });
      return {
        label:    DAYS_SHORT[d.getDay()],
        labelLong: DAYS_LONG[d.getDay()],
        dateStr:  ds,
        earned:   taskRows.reduce((s, r) => s + r.time, 0),
        spent:    rows.filter(isSpend).reduce((s, r) => s + r.time, 0),
        isToday:  ds === dateToStr(today),
        tasks:    Object.entries(counts).map(([name, v]) => ({ name, ...v })).sort((a,b) => b.total - a.total),
      };
    });
  }, [raw, offset]);

  const monthDays = useMemo((): DayData[] => {
    const today = new Date();
    const ref   = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(ref.getFullYear(), ref.getMonth(), i + 1);
      const ds = dateToStr(d);
      const rows = raw.filter(r => r.date === ds);
      const taskRows = rows.filter(isTask);
      const counts: Record<string, { count: number; total: number }> = {};
      taskRows.forEach(r => {
        const k = r.nom_task.trim();
        if (!counts[k]) counts[k] = { count: 0, total: 0 };
        counts[k].count++;
        counts[k].total += r.time;
      });
      return {
        label:    `${i+1}`,
        labelLong: `${DAYS_LONG[d.getDay()]} ${i+1} ${MONTHS_FR[d.getMonth()]}`,
        dateStr:  ds,
        earned:   taskRows.reduce((s, r) => s + r.time, 0),
        spent:    rows.filter(isSpend).reduce((s, r) => s + r.time, 0),
        isToday:  ds === dateToStr(today),
        tasks:    Object.entries(counts).map(([name, v]) => ({ name, ...v })).sort((a,b) => b.total - a.total),
      };
    });
  }, [raw, offset]);

  const days        = mode === "week" ? weekDays : monthDays;
  const hasData     = days.some(d => d.earned > 0 || d.spent > 0);
  const maxVal      = Math.max(...days.map(d => Math.max(d.earned, d.spent)), 1);
  const totalEarned = days.reduce((s, d) => s + d.earned, 0);
  const totalSpent  = days.reduce((s, d) => s + d.spent, 0);
  const daysActive  = days.filter(d => d.earned > 0 || d.spent > 0).length;
  const avgSolde    = daysActive > 0 ? Math.round(days.reduce((s, d) => s + (d.earned - d.spent), 0) / daysActive) : 0;

  const periodLabel = useMemo(() => {
    if (mode === "week") {
      if (offset === 0)  return "Cette semaine";
      if (offset === -1) return "Semaine dernière";
      return `${weekDays[0]?.dateStr} – ${weekDays[6]?.dateStr}`;
    } else {
      const today = new Date();
      const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return `${MONTHS_FR[ref.getMonth()]} ${ref.getFullYear()}`;
    }
  }, [mode, offset, weekDays]);

  const expandedData = expandedDay ? days.find(d => d.dateStr === expandedDay) : null;

  const barW = mode === "month" ? 5 : 12;

  return (
    <div>
      {/* ── Toggle + Navigation ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["week", "month"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setOffset(0); setExpanded(null); }} style={{
              padding: "4px 14px", borderRadius: 8,
              border: `1px solid ${mode === m ? "#1D9E75" : "rgba(255,255,255,0.1)"}`,
              background: mode === m ? "rgba(29,158,117,0.12)" : "rgba(255,255,255,0.04)",
              color: mode === m ? "#6ee7b7" : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {m === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => { setOffset(o => o - 1); setExpanded(null); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 2 }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#f0f0ff", minWidth: 120, textAlign: "center" }}>{periodLabel}</span>
          <button onClick={() => { setOffset(o => Math.min(o + 1, 0)); setExpanded(null); }} disabled={offset >= 0} style={{ background: "none", border: "none", color: offset >= 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)", cursor: offset >= 0 ? "default" : "pointer", padding: 2 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats 3 métriques ── */}
      {hasData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Gagné", value: `+${totalEarned}`, color: "#6ee7b7" },
            { label: "Dépensé", value: `-${totalSpent}`, color: "#ff6b8a" },
            { label: "Solde moy/j", value: `${avgSolde >= 0 ? "+" : ""}${avgSolde}`, color: avgSolde >= 0 ? "#6ee7b7" : "#ff6b8a" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>{s.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color, margin: "0 0 1px" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>min</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Graphe ── */}
      {!hasData ? (
        <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          Pas de données
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: mode === "month" ? 2 : 6, height: 90, marginBottom: 4 }}>
          {days.map(day => {
            const eH = Math.round((day.earned / maxVal) * 72);
            const sH = Math.round((day.spent  / maxVal) * 72);
            const isExp = expandedDay === day.dateStr;
            return (
              <div key={day.dateStr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
                onClick={() => setExpanded(isExp ? null : day.dateStr)}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 72 }}>
                  <div style={{ width: barW, height: eH || (day.earned > 0 ? 2 : 0), background: day.isToday ? "#6ee7b7" : "rgba(110,231,183,0.5)", borderRadius: 3, transition: "height 0.2s" }} />
                  <div style={{ width: barW, height: sH || (day.spent  > 0 ? 2 : 0), background: day.isToday ? "#ff6b8a" : "rgba(255,107,138,0.45)", borderRadius: 3, transition: "height 0.2s" }} />
                </div>
                <span style={{ fontSize: mode === "month" ? 8 : 10, color: isExp ? "#f0f0ff" : day.isToday ? "#6ee7b7" : "rgba(255,255,255,0.35)", fontWeight: isExp || day.isToday ? 700 : 400 }}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Légende */}
      {hasData && (
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#6ee7b7", display: "inline-block" }} />Gagné
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ff6b8a", display: "inline-block" }} />Dépensé
          </span>
        </div>
      )}

      {/* ── Détail jour expandé ── */}
      {expandedData && (
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0ff", margin: "0 0 2px" }}>{expandedData.labelLong}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {expandedData.tasks.length > 0 ? `${expandedData.tasks.length} tâche${expandedData.tasks.length > 1 ? "s" : ""} · solde ${expandedData.earned - expandedData.spent >= 0 ? "+" : ""}${expandedData.earned - expandedData.spent} min` : "Aucune tâche"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 1px" }}>gagné</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#6ee7b7", margin: 0 }}>+{expandedData.earned}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 1px" }}>dépensé</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#ff6b8a", margin: 0 }}>-{expandedData.spent}</p>
              </div>
            </div>
          </div>

          {/* Barre solde */}
          {(expandedData.earned > 0 || expandedData.spent > 0) && (() => {
            const total = expandedData.earned + expandedData.spent;
            const pct   = total > 0 ? Math.round((expandedData.earned / total) * 100) : 0;
            return (
              <div style={{ background: "rgba(255,107,138,0.2)", borderRadius: 4, height: 4, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ height: 4, width: `${pct}%`, background: "#6ee7b7", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            );
          })()}

          {/* Tâches */}
          {expandedData.tasks.length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>Aucune tâche ce jour</p>
          ) : (
            expandedData.tasks.map((t, i) => (
              <div key={t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < expandedData.tasks.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <span style={{ fontSize: 13, color: "#f0f0ff" }}>{t.name.replace(/_/g, " ")}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>×{t.count}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6ee7b7", background: "rgba(110,231,183,0.1)", padding: "2px 8px", borderRadius: 6 }}>+{t.total} min</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}