"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useScreenData } from "@/hooks/useScreenData";
import { DashboardHeader } from "../components/Dashboardheader";
import { SoldeCard } from "../components/Soldecard";
import { BudgetCard } from "../components/Budgetcard";
import { StatsGrid } from "../components/Statsgrid";
import { PeriodChart } from "../components/PeriodChart";
import { TodayTasks } from "../components/Todaytasks";
import { HistoriqueRecent } from "../components/Historiquerecent";
import { SectionLabel, AlertBanner } from "../components/ui";

export default function DashboardPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const { data, loading, error, lastUpdate, refetch, budget } = useScreenData(user?.id ?? null);

  if (authLoading || !user) return null;

  const spent = data?.spent ?? 0;

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)",
      padding: "32px 16px 80px",
      maxWidth: 680,
      margin: "0 auto",
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Glow bg */}
      <div style={{ position: "fixed", top: "5%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        <div className="fade-up">
          <DashboardHeader
            loading={loading}
            error={error}
            logCount={data?.raw.length ?? 0}
            lastUpdate={lastUpdate}
            email={user.email ?? ""}
            onRefresh={refetch}
          />
        </div>

        {/* Alerts */}
        {data && spent >= budget && (
          <div className="fade-up s2">
            <AlertBanner type="danger" title="Budget dépassé !" message={`${spent} min consommées sur ${budget} min. Fais une tâche pour recharger.`} />
          </div>
        )}
        {data && spent >= budget * 0.75 && spent < budget && (
          <div className="fade-up s2">
            <AlertBanner type="warn" title="Budget bientôt épuisé" message={`Il te reste ${budget - spent} min. Pense à accomplir une tâche.`} />
          </div>
        )}

        <div className="fade-up s2" style={{ marginBottom: 12 }}>
          <SoldeCard solde={data?.solde ?? null} earned={data?.earned ?? null} spent={data?.spent ?? null} />
        </div>

        <div className="fade-up s3" style={{ marginBottom: 12 }}>
          <BudgetCard spent={spent} budget={budget} />
        </div>

        <div className="fade-up s3" style={{ marginBottom: 4 }}>
          <StatsGrid
            earned={data?.earned ?? "—"}
            spent={data?.spent ?? "—"}
            tasksDone={data?.tasksDone ?? "—"}
            streak={data?.streak ?? "—"}
          />
        </div>

        <SectionLabel>Statistiques</SectionLabel>
        <div className="fade-up s4" style={{ marginBottom: 12 }}>
          <PeriodChart raw={data?.raw ?? []} />
        </div>

        <SectionLabel>Tâches accomplies aujourd'hui</SectionLabel>
        <div className="fade-up s5" style={{ marginBottom: 12 }}>
          <TodayTasks tasks={data?.todayTasks ?? []} />
        </div>

        <SectionLabel>Historique récent</SectionLabel>
        <div className="fade-up s6">
          <HistoriqueRecent rows={data?.recent ?? []} />
        </div>

      </div>
    </main>
  );
}