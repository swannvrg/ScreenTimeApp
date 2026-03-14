"use client";

const C = {
  accent: "#6ee7b7",
  accentB: "#3b82f6",
  danger: "#ff6b8a",
  muted: "rgba(255,255,255,0.4)",
};

interface Props {
  solde: number | null;
  earned: number | null;
  spent: number | null;
}

export function SoldeCard({ solde, earned, spent }: Props) {
  const hasData = solde !== null;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(110,231,183,0.1), rgba(59,130,246,0.08))",
      border: "1px solid rgba(110,231,183,0.2)",
      borderRadius: 20,
      position: "relative",
      overflow: "hidden",
      padding: "28px 24px",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,231,183,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>
        Solde du jour
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
        <span style={{
          fontSize: 96, fontWeight: 800, lineHeight: 0.9,
          background: !hasData ? "none" : solde! >= 0
            ? `linear-gradient(135deg, ${C.accent}, ${C.accentB})`
            : "linear-gradient(135deg, #ff6b8a, #ff2d55)",
          WebkitBackgroundClip: hasData ? "text" : "unset",
          WebkitTextFillColor: hasData ? "transparent" : C.muted,
          color: hasData ? "transparent" : C.muted,
        }}>
          {hasData ? solde : "—"}
        </span>
        {hasData && <span style={{ fontSize: 22, fontWeight: 600, color: C.muted, paddingBottom: 10 }}>min</span>}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, padding: "10px 14px" }}>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Gagné</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{earned ?? "—"}</p>
        </div>
        <div style={{ flex: 1, background: "rgba(255,107,138,0.08)", border: "1px solid rgba(255,107,138,0.15)", borderRadius: 12, padding: "10px 14px" }}>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Dépensé</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>{spent ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}