"use client";

import { useState } from "react";
import { useAuthContext } from "@/app/providers";
import { useEarnings, useJobHistory, useTopClients } from "@/hooks";
import { AppShell } from "@/components/layout/AppShell";
import { Card, StatCard, Badge, JobTypeBadge, Button, Skeleton, EmptyState } from "@/components/ui";
import { formatCurrency, cn } from "@/utils/helpers";
import { events } from "@/utils/analytics";
import { JOB_TYPE_CONFIG } from "@/types";

export default function EarningsPage() {
  const { cleaner } = useAuthContext();
  const [tab, setTab] = useState<"overview" | "history" | "clients">("overview");
  const [typeFilter, setTypeFilter] = useState("Alla");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const { data: earnings, loading: earningsLoading } = useEarnings(cleaner?.id, "month");
  const { jobs: historyJobs, loading: historyLoading, hasMore, loadMore } = useJobHistory(cleaner?.id, typeFilter === "Alla" ? undefined : typeFilter);
  const { clients, loading: clientsLoading } = useTopClients(cleaner?.id);

  const current = earnings[0];
  const prev = earnings[1];
  const trend = current && prev ? Math.round(((current.total_earned - prev.total_earned) / (prev.total_earned || 1)) * 100) : 0;
  const maxEarning = Math.max(...earnings.map(e => e.total_earned), 1);

  const tabs = [
    { id: "overview" as const, label: "📊 Översikt" },
    { id: "history" as const, label: "📋 Historik" },
    { id: "clients" as const, label: "👥 Kunder" },
  ];

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold mb-4">Inkomst & Historik</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); events.earningsViewed(t.id); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-spick-light text-spick-dark font-bold" : "text-sand-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <>
          <div className="flex gap-3 mb-5">
            <StatCard label="MARS" value={current ? formatCurrency(current.total_earned) : "–"} trend={`${Math.abs(trend)}%`} trendUp={trend >= 0} sub="vs föreg. månad" />
            <StatCard label="JOBB" value={current?.total_jobs || 0} sub={`${current?.total_hours || 0}h totalt`} />
            <StatCard label="SNITT/H" value={`${current?.avg_per_hour || 0} kr`} icon="⏱" />
            <StatCard label="BETYG" value={cleaner?.avg_rating || "–"} sub={`${cleaner?.total_ratings || 0} omd.`} icon="⭐" />
          </div>

          {/* Bar chart */}
          <Card className="mb-5">
            <h3 className="font-display text-base font-bold mb-3.5">Intäktsutveckling</h3>
            <div className="flex items-end gap-2 h-[160px] px-1">
              {[...earnings].reverse().map((e, i) => {
                const h = (e.total_earned / maxEarning) * 130;
                const isLast = i === earnings.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className={cn("text-[10px] font-semibold", isLast ? "text-spick" : "text-sand-500")}>
                      {(e.total_earned / 1000).toFixed(0)}k
                    </span>
                    <div
                      className={cn("w-full max-w-[40px] rounded-lg transition-all", isLast ? "bg-gradient-to-t from-spick/90 to-spick" : "bg-spick/20")}
                      style={{ height: h }}
                    />
                    <span className="text-[10px] text-sand-500">{e.period_start.slice(5, 7)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Type breakdown */}
          <Card>
            <h3 className="font-display text-base font-bold mb-3">Per jobbtyp</h3>
            {current && (
              <div className="flex gap-3">
                {(["hemstadning", "flyttstadning", "storstadning", "kontorsstadning"] as const).map(type => {
                  const config = JOB_TYPE_CONFIG[type];
                  const jobCount = current[`${type.replace("stadning", "").replace("kontors", "kontor")}_jobs` as keyof typeof current] as number || 0;
                  const earned = current[`${type.replace("stadning", "").replace("kontors", "kontor")}_earned` as keyof typeof current] as number || 0;
                  return (
                    <div key={type} className="flex-1 p-3.5 rounded-xl" style={{ border: `1.5px solid ${config.color}20`, background: `${config.color}06` }}>
                      <span className="text-2xl">{config.emoji}</span>
                      <div className="text-xs font-bold mt-1" style={{ color: config.color }}>{config.label}</div>
                      <div className="text-xs text-sand-700">{jobCount} jobb</div>
                      <div className="text-sm font-bold mt-1">{formatCurrency(earned)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {["Alla", "Hemstädning", "Flyttstädning", "Storstädning", "Kontorsstädning"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn(
                "px-3.5 py-1.5 rounded-badge text-xs whitespace-nowrap",
                typeFilter === t ? "border-2 border-spick bg-spick-light text-spick-dark font-bold" : "border border-sand-300 text-sand-700"
              )}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {historyLoading ? (
              [1, 2, 3, 4].map(i => <Skeleton key={i} className="w-full h-20 rounded-card" />)
            ) : historyJobs.length === 0 ? (
              <EmptyState emoji="📋" title="Ingen historik" description="Genomförda jobb visas här." />
            ) : (
              historyJobs.map(job => {
                const rating = (job as any).ratings?.[0];
                const config = JOB_TYPE_CONFIG[job.job_type];
                return (
                  <Card key={job.id} className="p-0 overflow-hidden cursor-pointer" onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}>
                    <div className="p-3.5 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-sand-100 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-semibold text-sand-500">{new Date(job.completed_at || job.scheduled_date).toLocaleString("sv", { month: "short" })}</span>
                        <span className="text-lg font-bold font-display leading-none">{new Date(job.completed_at || job.scheduled_date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <JobTypeBadge type={job.job_type} />
                        <div className="text-sm font-semibold mt-0.5">{(job as any).customers?.name || "Kund"}</div>
                        <div className="text-xs text-sand-500">{(job as any).customers?.area || job.area}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-bold text-spick">{formatCurrency(job.pay_amount)}</div>
                        {rating && (
                          <div className="flex gap-px justify-end mt-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <span key={i} className={cn("text-xs", i <= rating.rating ? "text-accent-gold" : "text-sand-300")}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {expandedJob === job.id && rating?.comment && (
                      <div className="border-t border-sand-100 px-3.5 py-2.5 bg-sand-50">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 italic">
                          "{rating.comment}"
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
            {hasMore && <Button variant="secondary" onClick={loadMore} className="mx-auto">Visa fler ↓</Button>}
          </div>
        </>
      )}

      {/* ── Clients ── */}
      {tab === "clients" && (
        <>
          <Card className="p-0 overflow-hidden mb-5">
            <div className="px-5 pt-4 pb-2">
              <h3 className="font-display text-base font-bold">Dina bästa kunder</h3>
            </div>
            {clientsLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="w-full h-16 mx-4 mb-2 rounded-lg" />)
            ) : clients.length === 0 ? (
              <EmptyState emoji="👥" title="Inga kunder ännu" description="Genomför ditt första jobb!" />
            ) : (
              clients.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-t border-sand-100">
                  <span className="text-lg w-6 text-center">{["🥇", "🥈", "🥉"][i] || `${i + 1}.`}</span>
                  <div className="w-9 h-9 rounded-xl bg-spick/15 flex items-center justify-center text-sm font-bold text-spick">{(c as any).customers?.name?.[0] || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{(c as any).customers?.name}</div>
                    <div className="text-xs text-sand-500">{(c as any).customers?.area} · {c.total_jobs} jobb</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-spick">{formatCurrency(c.total_earned)}</div>
                    <div className="text-2xs text-sand-500">{c.avg_rating} ★</div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
