"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "@/app/providers";
import { useDashboard, useAvailableJobs, useJobMatchSubscription } from "@/hooks";
import { AppShell } from "@/components/layout/AppShell";
import { Card, StatCard, Badge, JobTypeBadge, Skeleton, EmptyState, ErrorState, Toast } from "@/components/ui";
import { JobCard } from "@/components/jobs/JobCard";
import { formatCurrency, formatTime, cn } from "@/utils/helpers";
import { events } from "@/utils/analytics";
import { useRouter } from "next/navigation";
import { JOB_TYPE_CONFIG } from "@/types";
import type { Job, Customer } from "@/types";

// ── Today Job Card ──
function TodayJobCard({ job, isNext }: { job: Job & { customer?: Customer }; isNext: boolean }) {
  const typeConfig = JOB_TYPE_CONFIG[job.job_type];

  return (
    <div className={cn(
      "rounded-tag p-4 transition-transform hover:-translate-y-0.5 cursor-pointer",
      isNext
        ? "bg-gradient-to-br from-spick to-spick-dark text-white shadow-job-next"
        : "bg-white border border-sand-200 shadow-card text-sand-800"
    )}>
      {isNext && (
        <span className="inline-block text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-md mb-1.5 backdrop-blur-sm">
          NÄSTA
        </span>
      )}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm font-bold">{formatTime(job.start_time)}</span>
        <span className="text-xs opacity-60">– {formatTime(job.end_time)}</span>
        <JobTypeBadge type={job.job_type} />
      </div>
      <div className="text-sm font-semibold mb-0.5">{job.customer?.name || "Kund"}</div>
      <div className="flex justify-between text-xs">
        <span className={isNext ? "opacity-70" : "text-sand-500"}>{job.area}</span>
        <span className={cn("font-bold text-sm", isNext ? "text-white" : "text-spick")}>
          {formatCurrency(job.pay_amount)}
        </span>
      </div>
    </div>
  );
}

// ── Notification Item ──
function NotifItem({ type, title, body, time, unread }: { type: string; title: string; body?: string; time: string; unread: boolean }) {
  const icons: Record<string, string> = { new_job: "💼", booking_change: "🔄", rating: "⭐", system: "🔔", reminder: "⏰" };
  return (
    <div className={cn(
      "flex gap-2.5 px-4 py-3 items-start border-b border-sand-100",
      unread && "bg-spick-50"
    )}>
      <span className="text-base flex-shrink-0">{icons[type] || "🔔"}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {body && <div className="text-xs text-sand-500 mt-0.5 truncate">{body}</div>}
        <div className="text-2xs text-sand-400 mt-0.5">{time}</div>
      </div>
      {unread && <div className="w-2 h-2 rounded-full bg-spick flex-shrink-0 mt-1.5" />}
    </div>
  );
}

// ── Skeleton ──
function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="w-56 h-7 mb-1.5" />
      <Skeleton className="w-72 h-4 mb-5" />
      <div className="flex gap-3 mb-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="flex-1 min-w-[140px]">
            <Skeleton className="w-16 h-3 mb-2" />
            <Skeleton className="w-24 h-6 mb-1.5" />
            <Skeleton className="w-20 h-3" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Skeleton className="w-32 h-5 mb-3" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-24 mb-2 rounded-tag" />)}
        </div>
        <div>
          <Skeleton className="w-28 h-5 mb-3" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-28 mb-2 rounded-card" />)}
        </div>
      </div>
    </div>
  );
}

// ── Page ──
export default function DashboardPage() {
  const { cleaner } = useAuthContext();
  const { data, loading, error, refresh } = useDashboard(cleaner?.id);
  const { jobs, acceptJob, declineJob } = useAvailableJobs(cleaner?.id);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "decline" } | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const router = useRouter();

  // Realtime subscription for new matches
  const handleNewMatch = useCallback(() => {
    refresh();
  }, [refresh]);
  useJobMatchSubscription(cleaner?.id, handleNewMatch);

  const showToast = (text: string, type: "success" | "decline") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAccept = async (jobId: string) => {
    setAcceptingId(jobId);
    const job = jobs.find(j => j.id === jobId);
    const result = await acceptJob(jobId);
    setAcceptingId(null);
    setExpandedJob(null);

    if (!result.error && job) {
      showToast(`Accepterat: ${JOB_TYPE_CONFIG[job.job_type].label} i ${job.area}`, "success");
      events.jobAccepted(jobId, job.match_score, job.pay_amount, job.pay_per_hour || 0, job.match_distance || 0);
      refresh();
    }
  };

  const handleDecline = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    await declineJob(jobId);
    setExpandedJob(null);
    if (job) {
      showToast(`Avvisat: ${JOB_TYPE_CONFIG[job.job_type].label} i ${job.area}`, "decline");
      events.jobDeclined(jobId, job.match_score);
    }
  };

  if (loading) return <AppShell><DashboardSkeleton /></AppShell>;
  if (error) return <AppShell><ErrorState title="Kunde inte ladda Dashboard" message={error} onRetry={refresh} /></AppShell>;
  if (!data) return <AppShell><ErrorState onRetry={refresh} /></AppShell>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "God morgon" : hour < 17 ? "God eftermiddag" : "God kväll";

  return (
    <AppShell jobCount={jobs.length}>
      {/* Greeting */}
      <div className="mb-5 animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {greeting}, {data.cleaner.first_name} 👋
        </h1>
        <p className="text-sm text-sand-600 mt-1">
          Du har <strong className="text-sand-800">{data.today_jobs.length} jobb</strong> idag
          {jobs.length > 0 && <> och <strong className="text-spick">{jobs.length} nya</strong> som matchar dig</>}.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6 overflow-x-auto">
        <StatCard label="VECKA" value={formatCurrency(data.week_stats.earned)} sub={`${data.week_stats.jobs} jobb · ${data.week_stats.hours}h`} icon="💰" />
        <StatCard label="SNITT/H" value={`${data.week_stats.avg_per_hour} kr`} sub="Denna vecka" icon="⏱" />
        <StatCard label="BETYG" value={String(data.cleaner.avg_rating)} sub={`${data.cleaner.total_jobs} jobb`} icon="⭐" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Today + Notifications */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-lg font-bold">Dagens schema</h2>
            <button onClick={() => router.push("/calendar")} className="text-xs text-spick font-semibold">Kalender →</button>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {data.today_jobs.length === 0 ? (
              <EmptyState emoji="☀️" title="Ledig dag" description="Inga jobb bokade idag." />
            ) : (
              data.today_jobs.map((job, i) => (
                <TodayJobCard key={job.id} job={job} isNext={i === 0} />
              ))
            )}
          </div>

          {/* Notifications */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-lg font-bold">
              Notiser
              {data.unread_count > 0 && <Badge bg="#E07B4C" color="white" className="ml-2">{data.unread_count}</Badge>}
            </h2>
          </div>
          <Card className="p-0 overflow-hidden">
            {data.notifications.length === 0 ? (
              <EmptyState emoji="🔔" title="Inga notiser" description="Du är helt i kapp!" />
            ) : (
              data.notifications.map(n => (
                <NotifItem
                  key={n.id}
                  type={n.type}
                  title={n.title}
                  body={n.body || undefined}
                  time={new Date(n.created_at).toLocaleString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                  unread={!n.read}
                />
              ))
            )}
          </Card>
        </div>

        {/* Right: Available jobs */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-lg font-bold">
              Lediga jobb
              {jobs.length > 0 && <Badge className="ml-2">{jobs.length}</Badge>}
            </h2>
            <button onClick={() => router.push("/jobs")} className="text-xs text-spick font-semibold">Alla jobb →</button>
          </div>
          <div className="flex flex-col gap-2">
            {jobs.length === 0 ? (
              <EmptyState emoji="🎉" title="Alla jobb hanterade!" description="Vi meddelar dig när nya dyker upp." />
            ) : (
              jobs.slice(0, 4).map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  expanded={expandedJob === job.id}
                  onToggle={() => {
                    setExpandedJob(expandedJob === job.id ? null : job.id);
                    if (expandedJob !== job.id) events.jobViewed(job.id, job.match_score, job.job_type);
                  }}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  acceptLoading={acceptingId === job.id}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Toast text={toast?.text || ""} type={toast?.type} visible={!!toast} />
    </AppShell>
  );
}
