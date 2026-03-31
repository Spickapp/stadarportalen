"use client";

import { useState } from "react";
import { Badge, MatchBadge, JobTypeBadge, Button } from "@/components/ui";
import { cn, formatCurrency, formatTime } from "@/utils/helpers";
import { MapPin, Clock, Route } from "lucide-react";
import type { MatchedJob } from "@/types";

interface JobCardProps {
  job: MatchedJob;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
  acceptLoading?: boolean;
}

export function JobCard({ job, onAccept, onDecline, expanded, onToggle, acceptLoading }: JobCardProps) {
  const isNewClient = !job.customer_total_bookings || job.customer_total_bookings === 0;

  return (
    <div className={cn(
      "bg-white rounded-card border border-sand-200 overflow-hidden transition-shadow",
      expanded && "shadow-card-hover"
    )}>
      {/* Compact header - always visible */}
      <div onClick={onToggle} className="p-4 cursor-pointer hover:bg-sand-50 transition-colors">
        {/* Top row: badges + price */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-wrap gap-1.5">
            <MatchBadge score={job.match_score} />
            <JobTypeBadge type={job.job_type} />
            {job.booking_type === "recurring" && (
              <Badge bg="#F0E6FF" color="#7B68D9">🔁 {job.recurring_freq || "Återkom."}</Badge>
            )}
            {isNewClient && (
              <Badge bg="#FFF3E0" color="#E07B4C">✦ Ny kund</Badge>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-xl font-bold text-spick">{formatCurrency(job.pay_amount)}</div>
            {job.pay_per_hour && (
              <div className="text-2xs text-sand-500">{job.pay_per_hour} kr/h</div>
            )}
          </div>
        </div>

        {/* Middle row: date/time + location */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-sand-800">
            {job.scheduled_date} {formatTime(job.start_time)}–{formatTime(job.end_time)}
          </span>
          <span className="flex items-center gap-1 text-sand-600 text-xs">
            <MapPin size={13} /> {job.area} · {job.match_distance || job.distance_km} km
          </span>
          <span className="flex items-center gap-1 text-sand-600 text-xs">
            <Clock size={13} /> {job.match_travel_time || job.travel_time_min} min
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-sand-200 p-4 bg-sand-50 animate-slide-down">
          {/* Detail grid */}
          <div className="grid grid-cols-3 gap-x-5 gap-y-2 text-sm text-sand-700 mb-4">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-sand-500" /> {job.address}
            </span>
            <span>📐 {job.sqm} m²</span>
            <span>{job.has_elevator ? "🛗 Hiss finns" : "🚶 Ingen hiss"}</span>
            <span>{job.has_pets ? `🐾 ${job.pet_type || "Husdjur"}` : "🚫 Inga husdjur"}</span>
            <span>🧴 {job.materials === "client" || job.customer_materials ? "Kundens" : "Eget"} material</span>
            {job.customer_avg_rating ? (
              <span className="flex items-center gap-1">
                <span className="text-accent-gold">⭐</span> {job.customer_avg_rating} · {job.customer_total_bookings} jobb
              </span>
            ) : (
              <span className="text-accent-orange font-semibold">✦ Ny kund – 0 jobb</span>
            )}
          </div>

          {/* Special notes */}
          {(job.special_notes || job.customer_notes) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 text-sm text-amber-800 mb-4">
              💬 {job.special_notes || job.customer_notes}
            </div>
          )}

          {/* Match breakdown */}
          <div className="bg-sand-100 rounded-xl p-3.5 mb-4">
            <div className="text-2xs font-bold text-sand-600 tracking-wider mb-2">MATCHNINGSDETALJER</div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Avstånd", ok: job.distance_ok },
                { label: "Jobbtyp", ok: job.job_type_ok },
                { label: "Tidspassning", ok: job.time_ok },
                { label: "Hiss", ok: job.elevator_ok },
                { label: "Husdjur", ok: job.pets_ok },
                { label: "Material", ok: job.materials_ok },
                { label: "Kundbetyg", ok: job.client_rating_ok },
              ].map((m) => (
                <span key={m.label} className={cn("text-xs flex items-center gap-1", m.ok ? "text-spick" : "text-accent-warn")}>
                  {m.ok ? "✓" : "⚠"} {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => onAccept(job.id)}
              loading={acceptLoading}
            >
              ✓ Acceptera
            </Button>
            <Button
              variant="secondary"
              onClick={() => onDecline(job.id)}
            >
              ✕ Avvisa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
