"use client";

import { useState, useMemo } from "react";
import { useAuthContext } from "@/app/providers";
import { useCalendar } from "@/hooks";
import { AppShell } from "@/components/layout/AppShell";
import { Card, StatCard, Button, ErrorState, Skeleton } from "@/components/ui";
import { formatCurrency, formatTime, cn } from "@/utils/helpers";
import { events } from "@/utils/analytics";
import { JOB_TYPE_CONFIG } from "@/types";
import { format, startOfWeek, endOfWeek, addWeeks, isToday } from "date-fns";
import { sv } from "date-fns/locale";

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 11 }, (_, i) => i + 7);
const DAY_NAMES = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

export default function CalendarPage() {
  const { cleaner } = useAuthContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const [blockModal, setBlockModal] = useState<Date | null>(null);
  const [blockReason, setBlockReason] = useState("day_off");

  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const { jobs, blocked, loading, blockTime } = useCalendar(cleaner?.id, weekStartStr, weekEndStr);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekLabel = `${format(weekDates[0], "d MMM", { locale: sv })} – ${format(weekDates[6], "d MMM yyyy", { locale: sv })}`;

  // Week stats
  const weekStats = useMemo(() => {
    const totalPay = jobs.reduce((s, j) => s + j.pay_amount, 0);
    const totalHours = jobs.reduce((s, j) => {
      const [sh, sm] = j.start_time.split(":").map(Number);
      const [eh, em] = j.end_time.split(":").map(Number);
      return s + (eh + em / 60) - (sh + sm / 60);
    }, 0);
    return { jobs: jobs.length, pay: totalPay, hours: Math.round(totalHours * 10) / 10 };
  }, [jobs]);

  const handleBlock = async () => {
    if (!blockModal) return;
    await blockTime({
      blocked_date: format(blockModal, "yyyy-MM-dd"),
      start_time: "08:00",
      end_time: "18:00",
      all_day: true,
      reason: blockReason as any,
      notes: null,
    });
    events.timeBlocked(blockReason, true);
    setBlockModal(null);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl font-bold">Kalender</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-lg border border-sand-300 bg-white flex items-center justify-center text-sand-700">←</button>
          <span className="text-sm font-semibold">{weekLabel}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-lg border border-sand-300 bg-white flex items-center justify-center text-sand-700">→</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1 rounded-lg bg-spick-light text-spick-dark text-xs font-bold">Idag</button>
          )}
        </div>
      </div>

      {/* Week stats */}
      <div className="flex gap-3 mb-4">
        <StatCard label="Jobb" value={weekStats.jobs} icon="📋" />
        <StatCard label="Timmar" value={`${weekStats.hours}h`} icon="⏱" />
        <StatCard label="Intäkt" value={formatCurrency(weekStats.pay)} icon="💰" />
      </div>

      {/* Calendar grid */}
      <Card className="p-0 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-sand-200">
          <div className="p-2" />
          {weekDates.map((d, i) => {
            const today = isToday(d);
            return (
              <div key={i} className={cn("py-2.5 text-center", today && "bg-spick-50 border-b-[3px] border-spick")}>
                <div className={cn("text-2xs font-semibold", today ? "text-spick-dark" : "text-sand-600")}>{DAY_NAMES[i]}</div>
                <div className={cn("text-lg font-bold font-display", today ? "text-spick-dark" : "text-sand-800")}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="overflow-y-auto max-h-[480px]">
          <div className="grid grid-cols-[50px_repeat(7,1fr)] relative" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
            {/* Hour labels */}
            <div className="relative">
              {HOURS.map(h => (
                <div key={h} className="absolute w-full flex items-start justify-center pt-0.5 text-2xs text-sand-400" style={{ top: (h - 7) * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((d, dayIdx) => {
              const dateStr = format(d, "yyyy-MM-dd");
              const dayJobs = jobs.filter(j => j.scheduled_date === dateStr);
              const dayBlocked = blocked.filter(b => b.blocked_date === dateStr);

              return (
                <div key={dayIdx} className="relative border-l border-sand-100" onDoubleClick={() => setBlockModal(d)}>
                  {/* Hour lines */}
                  {HOURS.map(h => (
                    <div key={h} className="absolute inset-x-0 border-t border-sand-100" style={{ top: (h - 7) * HOUR_HEIGHT }} />
                  ))}

                  {/* Blocked slots */}
                  {dayBlocked.map((slot, i) => {
                    const [sh] = slot.start_time.split(":").map(Number);
                    const [eh] = slot.end_time.split(":").map(Number);
                    const top = (sh - 7) * HOUR_HEIGHT;
                    const height = (eh - sh) * HOUR_HEIGHT - 2;
                    return (
                      <div key={`b${i}`} className="absolute left-1 right-1 rounded-lg bg-[repeating-linear-gradient(135deg,#f0ede8,#f0ede8_6px,#f8f6f2_6px,#f8f6f2_12px)] border border-sand-300 flex items-center justify-center text-xs text-sand-500 font-semibold z-[1]" style={{ top, height }}>
                        🚫 {slot.reason === "day_off" ? "Ledig" : slot.reason}
                      </div>
                    );
                  })}

                  {/* Job blocks */}
                  {dayJobs.map(job => {
                    const [sh, sm] = job.start_time.split(":").map(Number);
                    const [eh, em] = job.end_time.split(":").map(Number);
                    const startH = sh + sm / 60;
                    const endH = eh + em / 60;
                    const top = (startH - 7) * HOUR_HEIGHT;
                    const height = (endH - startH) * HOUR_HEIGHT - 2;
                    const config = JOB_TYPE_CONFIG[job.job_type];

                    return (
                      <div
                        key={job.id}
                        className="absolute left-1 right-1 rounded-lg p-1.5 overflow-hidden cursor-pointer z-[2] transition-shadow hover:shadow-md"
                        style={{
                          top, height,
                          backgroundColor: config.color + "18",
                          borderLeft: `4px solid ${config.color}`,
                          border: `1px solid ${config.color}30`,
                          borderLeftWidth: 4,
                        }}
                      >
                        <div className="text-[10px] font-bold" style={{ color: config.color }}>{formatTime(job.start_time)}</div>
                        {height > 30 && <div className="text-[10px] font-semibold text-sand-800 truncate">{(job as any).customer?.name || job.area}</div>}
                        {height > 50 && <div className="text-[10px] font-bold mt-0.5" style={{ color: config.color }}>{formatCurrency(job.pay_amount)}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      <p className="text-center text-xs text-sand-400 mt-2">Dubbelklicka på en dag för att blockera tid</p>

      {/* Block modal */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setBlockModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-[90%] shadow-modal animate-modal-in">
            <h3 className="font-display text-lg font-bold mb-1">Blockera tid</h3>
            <p className="text-sm text-sand-600 mb-4">{format(blockModal, "EEEE d MMMM", { locale: sv })}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { v: "day_off", l: "Ledig dag" },
                { v: "private", l: "Privat" },
                { v: "sick", l: "Sjuk" },
                { v: "vacation", l: "Semester" },
              ].map(r => (
                <button key={r.v} onClick={() => setBlockReason(r.v)} className={cn(
                  "px-4 py-2 rounded-badge text-sm",
                  blockReason === r.v ? "border-2 border-spick bg-spick-light text-spick-dark font-bold" : "border border-sand-300 text-sand-700"
                )}>
                  {r.l}
                </button>
              ))}
            </div>
            <div className="flex gap-2.5">
              <Button variant="primary" className="flex-1" onClick={handleBlock}>Blockera</Button>
              <Button variant="secondary" onClick={() => setBlockModal(null)}>Avbryt</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
