"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthContext } from "@/app/providers";
import { useSettings } from "@/hooks";
import { AppShell } from "@/components/layout/AppShell";
import { Card, Button, Toggle, Slider, DayPicker, FilterChip, Toast, ErrorState, Skeleton } from "@/components/ui";
import { cn } from "@/utils/helpers";
import { events } from "@/utils/analytics";
import { JOB_TYPE_CONFIG, STOCKHOLM_ZONES, LANGUAGES, SKILLS } from "@/types";

export default function SettingsPage() {
  const { cleaner } = useAuthContext();
  const { settings, loading, saving, saveSection } = useSettings(cleaner?.id);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Local state mirrors
  const [days, setDays] = useState<Record<string, boolean>>({});
  const [maxRadius, setMaxRadius] = useState(5);
  const [zones, setZones] = useState<string[]>([]);
  const [maxJobs, setMaxJobs] = useState(4);
  const [breakMin, setBreakMin] = useState(30);
  const [minPay, setMinPay] = useState(800);
  const [minPayH, setMinPayH] = useState(350);
  const [elevator, setElevator] = useState("prefer");
  const [pets, setPets] = useState("some");
  const [materials, setMaterials] = useState("both");
  const [jobTypes, setJobTypes] = useState<Record<string, boolean>>({});
  const [languages, setLanguages] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // Init from settings
  useEffect(() => {
    if (!settings) return;
    setDays({
      mon: settings.availability?.day_mon ?? true, tue: settings.availability?.day_tue ?? true,
      wed: settings.availability?.day_wed ?? true, thu: settings.availability?.day_thu ?? true,
      fri: settings.availability?.day_fri ?? true, sat: settings.availability?.day_sat ?? false,
      sun: settings.availability?.day_sun ?? false,
    });
    setMaxRadius(settings.zones?.max_radius_km ?? 5);
    setZones(settings.preferred_zones?.map(z => z.zone_name) || []);
    setMaxJobs(settings.availability?.max_jobs_per_day ?? 4);
    setBreakMin(settings.availability?.break_between_min ?? 30);
    setMinPay(settings.cleaner?.min_pay_per_job ?? 800);
    setMinPayH(settings.cleaner?.min_pay_per_hour ?? 350);
    setElevator(settings.cleaner?.elevator_pref ?? "prefer");
    setPets(settings.cleaner?.pet_pref ?? "some");
    setMaterials(settings.cleaner?.material_pref ?? "both");
    const jt: Record<string, boolean> = {};
    settings.job_types?.forEach(t => { jt[t.job_type] = t.enabled; });
    setJobTypes(jt);
    setLanguages(settings.languages || []);
    setSkills(settings.skills || []);
  }, [settings]);

  // Match score calc
  const matchScore = useMemo(() => {
    const daysActive = Object.values(days).filter(Boolean).length;
    const typesActive = Object.values(jobTypes).filter(Boolean).length;
    const factors = [daysActive >= 3, maxRadius >= 3, minPayH <= 400, typesActive >= 2, pets !== "none", zones.length >= 2];
    return Math.round((factors.filter(Boolean).length / factors.length) * 100);
  }, [days, maxRadius, minPayH, jobTypes, pets, zones]);

  const handleSave = async () => {
    const scoreBefore = matchScore;
    // Save all sections
    await Promise.all([
      saveSection("availability", { day_mon: days.mon, day_tue: days.tue, day_wed: days.wed, day_thu: days.thu, day_fri: days.fri, day_sat: days.sat, day_sun: days.sun, max_jobs_per_day: maxJobs, break_between_min: breakMin }),
      saveSection("zones", { max_radius_km: maxRadius, preferred_zones: zones }),
      saveSection("job_types", { types: jobTypes }),
      saveSection("conditions", { elevator_pref: elevator, pet_pref: pets, material_pref: materials }),
      saveSection("economy", { min_pay_per_job: minPay, min_pay_per_hour: minPayH }),
      saveSection("personal", { languages, skills }),
    ]);
    events.settingsSaved(6, scoreBefore, matchScore);
    setToast("Inställningar sparade – matchningen uppdateras nu");
    setDirty(false);
    setTimeout(() => setToast(null), 3000);
  };

  const markDirty = () => setDirty(true);

  if (loading) return <AppShell><div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="w-full h-40 rounded-card" />)}</div></AppShell>;
  if (!settings) return <AppShell><ErrorState /></AppShell>;

  const radioGroup = (label: string, value: string, setValue: (v: string) => void, options: { v: string; emoji: string; l: string }[]) => (
    <div className="mb-4">
      <div className="text-sm font-semibold text-sand-700 mb-2">{label}</div>
      <div className="flex gap-2">
        {options.map(o => (
          <button key={o.v} onClick={() => { setValue(o.v); markDirty(); }} className={cn(
            "flex-1 py-3 rounded-tag text-sm text-center transition-all",
            value === o.v ? "border-2 border-spick bg-spick-light text-spick-dark font-bold" : "border border-sand-300 text-sand-700"
          )}>
            <div className="text-xl mb-0.5">{o.emoji}</div>{o.l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-5">
        <h1 className="font-display text-2xl font-bold">Arbetsinställningar</h1>
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={!dirty}>
          {saving ? "Sparar..." : "Spara"}
        </Button>
      </div>

      {/* Match score */}
      <Card className="mb-5 bg-gradient-to-br from-sand-50 to-sand-100 border-sand-300">
        <div className="flex items-center gap-3 mb-2.5">
          <span className="text-xl">🎯</span>
          <div className="flex-1">
            <div className="text-sm font-bold">Matchningspotential</div>
            <div className="h-2 rounded-full bg-sand-200 mt-1.5 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", matchScore >= 80 ? "bg-spick" : matchScore >= 50 ? "bg-accent-warn" : "bg-accent-red")} style={{ width: `${matchScore}%` }} />
            </div>
          </div>
          <span className={cn("text-2xl font-extrabold font-display", matchScore >= 80 ? "text-spick" : matchScore >= 50 ? "text-accent-warn" : "text-accent-red")}>{matchScore}%</span>
        </div>
        <p className="text-xs text-sand-600">
          {matchScore >= 80 ? "🟢 Bra! Du ser de flesta jobb." : matchScore >= 50 ? "🟡 Du missar en del jobb." : "🔴 Väldigt snävt – du riskerar missa många jobb."}
        </p>
      </Card>

      {/* ── Tillgänglighet ── */}
      <Card className="mb-4">
        <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">🕐 Tillgänglighet</h2>
        <div className="text-sm font-semibold mb-2">Arbetsdagar</div>
        <DayPicker days={days} onChange={v => { setDays(v); markDirty(); }} />
        <div className="mt-5">
          <Slider label="Max jobb per dag" min={1} max={6} value={maxJobs} onChange={v => { setMaxJobs(v); markDirty(); }} unit="jobb" />
          <Slider label="Paus mellan jobb" min={0} max={60} value={breakMin} onChange={v => { setBreakMin(v); markDirty(); }} unit="min" step={15} />
        </div>
      </Card>

      {/* ── Arbetsområde ── */}
      <Card className="mb-4">
        <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">📍 Arbetsområde</h2>
        <Slider label="Max resradie" min={1} max={15} value={maxRadius} onChange={v => { setMaxRadius(v); markDirty(); }} unit="km" />
        <div className="text-sm font-semibold mb-2">Föredragna zoner</div>
        <div className="flex flex-wrap gap-2">
          {STOCKHOLM_ZONES.map(z => (
            <FilterChip key={z} label={z} active={zones.includes(z)} onClick={() => {
              setZones(zones.includes(z) ? zones.filter(x => x !== z) : [...zones, z]);
              markDirty();
            }} />
          ))}
        </div>
      </Card>

      {/* ── Jobbtyper ── */}
      <Card className="mb-4">
        <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">🧹 Jobbtyper</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.entries(JOB_TYPE_CONFIG) as [string, typeof JOB_TYPE_CONFIG[keyof typeof JOB_TYPE_CONFIG]][]).map(([key, config]) => (
            <button key={key} onClick={() => { setJobTypes(p => ({ ...p, [key]: !p[key] })); markDirty(); }} className={cn(
              "p-3.5 rounded-tag flex items-center gap-2.5 text-left transition-all",
              jobTypes[key] ? "border-2" : "border border-sand-300",
            )} style={jobTypes[key] ? { borderColor: config.color, background: config.color + "10" } : {}}>
              <span className="text-2xl">{config.emoji}</span>
              <div>
                <div className={cn("text-sm", jobTypes[key] ? "font-bold" : "font-medium")} style={jobTypes[key] ? { color: config.color } : {}}>{config.label}</div>
                <div className="text-2xs text-sand-500">{jobTypes[key] ? "Aktiv" : "Av"}</div>
              </div>
              {jobTypes[key] && <span className="ml-auto font-extrabold" style={{ color: config.color }}>✓</span>}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Arbetsvillkor ── */}
      <Card className="mb-4">
        <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">⚙️ Arbetsvillkor</h2>
        {radioGroup("Hiss", elevator, setElevator, [
          { v: "require", emoji: "🛗", l: "Kräver" }, { v: "prefer", emoji: "👍", l: "Föredrar" }, { v: "any", emoji: "💪", l: "Okej" },
        ])}
        {radioGroup("Husdjur", pets, setPets, [
          { v: "none", emoji: "🚫", l: "Inga" }, { v: "some", emoji: "🐱", l: "Vissa" }, { v: "any", emoji: "🐾", l: "Alla" },
        ])}
        {radioGroup("Material", materials, setMaterials, [
          { v: "client", emoji: "🏠", l: "Kundens" }, { v: "own", emoji: "🧴", l: "Eget" }, { v: "both", emoji: "✓", l: "Båda" },
        ])}
      </Card>

      {/* ── Ersättning ── */}
      <Card className="mb-4">
        <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">💰 Ersättning</h2>
        <Slider label="Min betalning per jobb" min={400} max={3000} value={minPay} onChange={v => { setMinPay(v); markDirty(); }} unit="kr" step={50} />
        <Slider label="Min timpeng" min={250} max={700} value={minPayH} onChange={v => { setMinPayH(v); markDirty(); }} unit="kr/h" step={10} />
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          💡 Snitt i Stockholm: 380–450 kr/h
        </div>
      </Card>

      {/* ── Personligt ── */}
      <Card className="mb-4">
        <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">👤 Personligt</h2>
        <div className="text-sm font-semibold mb-2">Språk</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {LANGUAGES.map(l => (
            <FilterChip key={l} label={l} active={languages.includes(l)} onClick={() => {
              setLanguages(languages.includes(l) ? languages.filter(x => x !== l) : [...languages, l]);
              markDirty();
            }} />
          ))}
        </div>
        <div className="text-sm font-semibold mb-2">Specialkompetenser</div>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map(s => (
            <FilterChip key={s} label={s} active={skills.includes(s)} onClick={() => {
              setSkills(skills.includes(s) ? skills.filter(x => x !== s) : [...skills, s]);
              markDirty();
            }} />
          ))}
        </div>
      </Card>

      <Toast text={toast || ""} visible={!!toast} />
    </AppShell>
  );
}
