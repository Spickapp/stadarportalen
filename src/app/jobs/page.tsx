"use client";

import { useState, useMemo } from "react";
import { useAuthContext } from "@/app/providers";
import { useAvailableJobs } from "@/hooks";
import { AppShell } from "@/components/layout/AppShell";
import { FilterChip, Skeleton, EmptyState, ErrorState, Toast, Button } from "@/components/ui";
import { JobCard } from "@/components/jobs/JobCard";
import { formatCurrency, cn } from "@/utils/helpers";
import { events } from "@/utils/analytics";
import { JOB_TYPE_CONFIG } from "@/types";
import type { MatchedJob, JobType } from "@/types";

const SORT_OPTIONS = [
  { value: "match", label: "Bäst matchning" },
  { value: "pay", label: "Högst betalt" },
  { value: "payH", label: "Bäst timpeng" },
  { value: "distance", label: "Närmast" },
  { value: "date", label: "Snarast" },
];

const JOB_TYPES: (JobType | "all")[] = ["all", "hemstadning", "flyttstadning", "storstadning", "kontorsstadning"];

export default function JobsPage() {
  const { cleaner } = useAuthContext();
  const { jobs, loading, error, refresh, acceptJob, declineJob } = useAvailableJobs(cleaner?.id);
  const [typeFilter, setTypeFilter] = useState<JobType | "all">("all");
  const [sortBy, setSortBy] = useState("match");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "decline" } | null>(null);

  const filtered = useMemo(() => {
    let result = typeFilter === "all" ? jobs : jobs.filter(j => j.job_type === typeFilter);
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "match": return b.match_score - a.match_score;
        case "pay": return b.pay_amount - a.pay_amount;
        case "payH": return (b.pay_per_hour || 0) - (a.pay_per_hour || 0);
        case "distance": return (a.match_distance || 99) - (b.match_distance || 99);
        case "date": return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        default: return 0;
      }
    });
    return result;
  }, [jobs, typeFilter, sortBy]);

  const stats = useMemo(() => ({
    count: filtered.length,
    totalPay: filtered.reduce((s, j) => s + j.pay_amount, 0),
    avgPayH: filtered.length ? Math.round(filtered.reduce((s, j) => s + (j.pay_per_hour || 0), 0) / filtered.length) : 0,
    bestMatch: filtered.length ? Math.max(...filtered.map(j => j.match_score)) : 0,
  }), [filtered]);

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

  if (error) return <AppShell><ErrorState title="Kunde inte ladda jobb" message={error} onRetry={refresh} /></AppShell>;

  return (
    <AppShell jobCount={jobs.length}>
      <h1 className="font-display text-2xl font-bold mb-4">Hitta jobb</h1>

      {/* Type filter chips */}
      <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1">
        {JOB_TYPES.map(t => {
          const config = t === "all" ? null : JOB_TYPE_CONFIG[t];
          const count = t === "all" ? undefined : jobs.filter(j => j.job_type === t).length;
          return (
            <FilterChip
              key={t}
              label={t === "all" ? "Alla typer" : `${config!.emoji} ${config!.label}`}
              active={typeFilter === t}
              onClick={() => {
                setTypeFilter(t);
                events.jobFilterUsed("type", t);
              }}
              count={count}
            />
          );
        })}
      </div>

      {/* Sort + count */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-sand-600">{filtered.length} jobb</span>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); events.jobSortChanged(e.target.value); }}
          className="ml-auto px-3 py-1.5 rounded-lg border border-sand-300 text-sm font-medium bg-white cursor-pointer outline-none focus:border-spick"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      {!loading && filtered.length > 0 && (
        <div className="flex gap-4 mb-4 px-4 py-2.5 bg-white rounded-xl border border-sand-200 text-xs text-sand-600">
          <span><strong className="text-sand-800">{stats.count}</strong> jobb</span>
          <span className="text-sand-300">·</span>
          <span>Totalt <strong className="text-spick">{formatCurrency(stats.totalPay)}</strong></span>
          <span className="text-sand-300">·</span>
          <span>Snitt <strong className="text-sand-800">{stats.avgPayH} kr/h</strong></span>
          <span className="text-sand-300">·</span>
          <span>Bäst: <strong className="text-spick-dark">{stats.bestMatch}%</strong></span>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-card p-4 border border-sand-200">
              <div className="flex justify-between mb-2.5">
                <div className="flex gap-1.5"><Skeleton className="w-12 h-5" /><Skeleton className="w-24 h-5" /></div>
                <Skeleton className="w-16 h-6" />
              </div>
              <Skeleton className="w-3/4 h-3.5 mb-1.5" />
              <Skeleton className="w-1/2 h-3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        typeFilter !== "all" ? (
          <EmptyState
            emoji="🔍"
            title="Inga jobb matchar filtret"
            description="Prova ett annat filter eller sortering."
            action={<Button variant="primary" size="sm" onClick={() => setTypeFilter("all")}>Visa alla</Button>}
          />
        ) : (
          <EmptyState emoji="🎉" title="Alla jobb hanterade!" description="Vi meddelar dig när nya dyker upp." />
        )
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(job => (
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
          ))}
        </div>
      )}

      <Toast text={toast?.text || ""} type={toast?.type} visible={!!toast} />
    </AppShell>
  );
}
