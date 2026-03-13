"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useScreenData } from "@/hooks/useScreenData";
import { WeekChart } from "@/components/WeekChart";
import {
  Card,
  SectionLabel,
  StatTile,
  ProgressBar,
  AlertBanner,
  StatusDot,
} from "@/components/ui";
import { RefreshCw, Settings } from "lucide-react";
import Link from "next/link";

const C = {
  accent: "#6ee7b7",
  accentB: "#3b82f6",
  danger: "#ff6b8a",
  warn: "#fbbf24",
  text: "#f0f0ff",
  muted: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.1)",
};

export default function DashboardPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);
  const { data, loading, error, lastUpdate, refetch, budget } = useScreenData(
    user?.id ?? null,
  );
  if (authLoading || !user) return null;

  const spent = data?.spent ?? 0;
  const pct = Math.min(Math.round((spent / budget) * 100), 100);
  const pctColor = pct >= 100 ? C.danger : pct >= 75 ? C.warn : C.accent;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)",
        padding: "32px 16px 80px",
        maxWidth: 680,
        margin: "0 auto",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "5%",
          right: "5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          left: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Header ── */}
        <div
          className="fade-up"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.muted,
                marginBottom: 6,
              }}
            >
              Gamification
            </p>
            <h1
              style={{
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1,
                color: C.text,
                margin: 0,
              }}
            >
              Screen
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentB})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Time
              </span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={refetch}
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "8px 12px",
                cursor: "pointer",
                color: C.muted,
              }}
            >
              <RefreshCw
                size={15}
                style={{
                  display: "block",
                  animation: loading ? "spin 0.8s linear infinite" : "none",
                }}
              />
            </button>
            <Link
              href="/settings"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "8px 12px",
                color: C.muted,
                textDecoration: "none",
              }}
            >
              <Settings size={15} />
            </Link>
          </div>
        </div>

        {/* ── Status ── */}
        <div
          className="fade-up s1"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: C.muted,
            marginBottom: 24,
          }}
        >
          <StatusDot status={loading ? "loading" : error ? "error" : "ok"} />
          <span>
            {loading
              ? "Chargement…"
              : error
                ? `Erreur : ${error}`
                : `${data?.raw.length ?? 0} logs · ${lastUpdate}`}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11 }}>{user.email}</span>
        </div>

        {/* ── Alerts ── */}
        {data && spent >= budget && (
          <div className="fade-up s2">
            <AlertBanner
              type="danger"
              title="Budget dépassé !"
              message={`${spent} min consommées sur ${budget} min. Fais une tâche pour recharger.`}
            />
          </div>
        )}
        {data && spent >= budget * 0.75 && spent < budget && (
          <div className="fade-up s2">
            <AlertBanner
              type="warn"
              title="Budget bientôt épuisé"
              message={`Il te reste ${budget - spent} min. Pense à accomplir une tâche.`}
            />
          </div>
        )}

        {/* ── Solde ── */}
        <div className="fade-up s2" style={{ marginBottom: 12 }}>
          <Card
            style={{
              background:
                "linear-gradient(135deg, rgba(110,231,183,0.1), rgba(59,130,246,0.08))",
              border: "1px solid rgba(110,231,183,0.2)",
              position: "relative",
              overflow: "hidden",
              padding: "28px 24px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(110,231,183,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.muted,
                marginBottom: 16,
              }}
            >
              Solde du jour
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 96,
                  fontWeight: 800,
                  lineHeight: 0.9,
                  background: !data
                    ? "none"
                    : data.solde >= 0
                      ? `linear-gradient(135deg, ${C.accent}, ${C.accentB})`
                      : "linear-gradient(135deg, #ff6b8a, #ff2d55)",
                  WebkitBackgroundClip: data ? "text" : "unset",
                  WebkitTextFillColor: data ? "transparent" : C.muted,
                  color: data ? "transparent" : C.muted,
                }}
              >
                {data ? data.solde : "—"}
              </span>
              {data && (
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: C.muted,
                    paddingBottom: 10,
                  }}
                >
                  min
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(110,231,183,0.08)",
                  border: "1px solid rgba(110,231,183,0.15)",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                  ⚡ Gagné
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>
                  {data?.earned ?? "—"}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,107,138,0.08)",
                  border: "1px solid rgba(255,107,138,0.15)",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                  📱 Dépensé
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>
                  {data?.spent ?? "—"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Budget ── */}
        <div className="fade-up s3" style={{ marginBottom: 12 }}>
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
                Budget consommé
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: pctColor }}>{spent}</span>
                <span style={{ color: C.muted }}> / {budget} min</span>
              </span>
            </div>
            <ProgressBar value={spent} max={budget} />
            <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
              {pct}% utilisé
            </p>
          </Card>
        </div>

        {/* ── Stats 2×2 ── */}
        <div
          className="fade-up s3"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <StatTile icon="⚡" value={data?.earned ?? "—"} label="min gagnées" accent />
          <StatTile icon="📱" value={data?.spent ?? "—"} label="min dépensées" />
          <StatTile icon="✅" value={data?.tasksDone ?? "—"} label="tâches aujourd'hui" />
          <StatTile icon="🔥" value={data?.streak ?? "—"} label="jours de streak" />
        </div>

        {/* ── Chart ── */}
        <SectionLabel>7 derniers jours</SectionLabel>
        <div className="fade-up s4">
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
                Gagné vs Dépensé
              </span>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  ["#6ee7b7", "⚡ Gagné"],
                  ["#ff6b8a", "📱 Dépensé"],
                ].map(([c, l]) => (
                  <span
                    key={l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: C.muted,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 3,
                        background: c,
                        display: "inline-block",
                      }}
                    />
                    {l}
                  </span>
                ))}
              </div>
            </div>
            {data ? (
              <WeekChart days={data.weekDays} />
            ) : (
              <div
                style={{
                  height: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                Pas de données
              </div>
            )}
          </Card>
        </div>

        {/* ── Tâches ── */}
        <SectionLabel>Tâches accomplies aujourd'hui</SectionLabel>
        <div className="fade-up s5">
          <Card>
            {!data || data.todayTasks.length === 0 ? (
              <p style={{ fontSize: 14, color: C.muted }}>
                Aucune tâche aujourd'hui
              </p>
            ) : (
              data.todayTasks.map((t, i) => (
                <div
                  key={t.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom:
                      i < data.todayTasks.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14, color: C.text, fontWeight: 500 }}>
                    {t.name.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 12, color: C.muted }}>×{t.count}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.accent,
                      background: "rgba(110,231,183,0.12)",
                      padding: "4px 10px",
                      borderRadius: 8,
                    }}
                  >
                    +{t.total} min
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* ── Historique ── */}
        <SectionLabel>Historique récent</SectionLabel>
        <div className="fade-up s6">
          <Card>
            {!data ? (
              <p style={{ fontSize: 14, color: C.muted }}>Pas de données</p>
            ) : (
              data.recent.map((r, i) => {
                const spend = r.nom_task.trim() === "Consommation temps";
                // Date déjà en DD/MM/YYYY, affichage direct
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "76px 46px 1fr 52px",
                      gap: 8,
                      padding: "10px 0",
                      alignItems: "center",
                      borderBottom:
                        i < data.recent.length - 1
                          ? `1px solid ${C.border}`
                          : "none",
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {r.date}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {r.heure.slice(0, 5)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: C.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.nom_task.trim().replace(/_/g, " ")}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "right",
                        color: spend ? C.danger : C.accent,
                      }}
                    >
                      {spend ? `−${r.time}` : `+${r.time}`}
                    </span>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}