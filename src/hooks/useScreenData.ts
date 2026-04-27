"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface LogRow {
  id: string;
  user_id: string;
  date: string;
  heure: string;
  nom_task: string;
  time: number;
  solde: number;
}

export interface DayStats {
  label: string;
  dateStr: string;
  earned: number;
  spent: number;
  isToday: boolean;
}

export interface DashboardData {
  earned: number;
  spent: number;
  solde: number;
  tasksDone: number;
  streak: number;
  todayTasks: { name: string; count: number; total: number }[];
  weekDays: DayStats[];
  recent: LogRow[];
  raw: LogRow[];
}

const BUDGET = 45;
const SOLDE_DEPART = 10;
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Format DD/MM/YYYY
function todayStr() {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function dateToStr(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v) return "";

  const slash = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[1]}/${slash[2]}/${slash[3]}`;

  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  return v;
}

function normalizeHeure(dateValue: unknown, heureValue: unknown) {
  if (typeof heureValue === "string" && heureValue.trim()) {
    const h = heureValue.trim();
    const hm = h.match(/^(\d{2}:\d{2})(:\d{2})?/);
    if (hm) return hm[1] + (hm[2] ?? ":00");
  }

  if (typeof dateValue === "string") {
    const fromIso = dateValue.match(/T(\d{2}:\d{2}:\d{2})/);
    if (fromIso) return fromIso[1];
  }

  return "00:00:00";
}

function parseDateTime(dateStr: string, heureStr: string) {
  const [dd, mm, yyyy] = dateStr.split("/").map((x) => Number(x));
  const [hh, mi, ss] = heureStr.split(":").map((x) => Number(x));
  if (!dd || !mm || !yyyy) return 0;
  const d = new Date(yyyy, mm - 1, dd, hh || 0, mi || 0, ss || 0);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function isTask(r: LogRow) {
  return r.nom_task !== "" && r.nom_task !== "Consommation temps";
}
function isSpend(r: LogRow) {
  return r.nom_task === "Consommation temps";
}

function computeStreak(data: LogRow[]): number {
  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 60; i++) {
    const ds = dateToStr(check);
    const rows = data.filter((r) => r.date === ds);
    if (rows.filter(isTask).length > 0) {
      streak++;
    } else if (i > 0) break;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export function useScreenData(userId: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [seededDemo, setSeededDemo] = useState(false);

  const seedDemoIfNeeded = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email?.toLowerCase().includes("demo@demo.fr")) return;

      const { data: rows } = await supabase
        .from("logs")
        .select("date")
        .eq("user_id", userId)
        .eq("date", todayStr())
        .limit(1);

      if (!rows || rows.length === 0) {
        const token = session.access_token;
        await fetch("/api/demo-seed-session", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSeededDemo(true);
      }
    } catch (e) {
      console.error("Demo seed failed:", e);
    }
  }, [userId]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      if (!seededDemo) {
        await seedDemoIfNeeded();
      }

      const { data: rows, error: err } = await supabase
        .from("logs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .order("heure", { ascending: true });

      if (err) throw new Error(err.message);

      const allRows = ((rows ?? []) as Partial<LogRow>[])
        .map((r, i) => ({
          id: typeof r.id === "string" ? r.id : `log-${i}`,
          user_id: typeof r.user_id === "string" ? r.user_id : userId,
          date: normalizeDate(r.date),
          heure: normalizeHeure(r.date, r.heure),
          nom_task: safeText(r.nom_task),
          time: typeof r.time === "number" ? r.time : Number(r.time) || 0,
          solde: typeof r.solde === "number" ? r.solde : Number(r.solde) || 0,
        }))
        .sort((a, b) => parseDateTime(a.date, a.heure) - parseDateTime(b.date, b.heure));
      const today = todayStr();
      const todayRows = allRows.filter((r) => r.date === today);

      const earned = todayRows.filter(isTask).reduce((s, r) => s + r.time, 0);
      const spent = todayRows.filter(isSpend).reduce((s, r) => s + r.time, 0);
      const tasksDone = todayRows.filter(isTask).length;

      const lastRow = allRows[allRows.length - 1];
      const lastRowIsToday = lastRow?.date === today;
      const solde = !lastRow ? SOLDE_DEPART : lastRowIsToday ? lastRow.solde : SOLDE_DEPART;

      const counts: Record<string, { count: number; total: number }> = {};
      todayRows.filter(isTask).forEach((r) => {
        if (!counts[r.nom_task]) counts[r.nom_task] = { count: 0, total: 0 };
        counts[r.nom_task].count++;
        counts[r.nom_task].total += r.time;
      });
      const todayTasks = Object.entries(counts)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total);

      const weekDays: DayStats[] = [];
      const todayDow = new Date().getDay();
      const daysFromMonday = todayDow === 0 ? 6 : todayDow - 1;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - daysFromMonday + (6 - i));
        const ds = dateToStr(d);
        const r = allRows.filter((x) => x.date === ds);
        weekDays.push({
          label: DAYS[d.getDay()],
          dateStr: ds,
          earned: r.filter(isTask).reduce((s, x) => s + x.time, 0),
          spent: r.filter(isSpend).reduce((s, x) => s + x.time, 0),
          isToday: ds === today,
        });
      }

      setData({
        earned,
        spent,
        solde,
        tasksDone,
        streak: computeStreak(allRows),
        todayTasks,
        weekDays,
        recent: [...allRows].reverse().slice(0, 40),
        raw: allRows,
      });
      setLastUpdate(new Date().toLocaleTimeString("fr"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [userId, seededDemo, seedDemoIfNeeded]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 120_000);
    return () => clearInterval(id);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchData,
    budget: BUDGET,
  };
}