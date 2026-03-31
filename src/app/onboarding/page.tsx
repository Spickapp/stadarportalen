"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/providers";
import { useOnboarding } from "@/hooks";
import { Button, DayPicker, Slider, FilterChip } from "@/components/ui";
import { cn } from "@/utils/helpers";
import { events } from "@/utils/analytics";
import { STOCKHOLM_ZONES, LANGUAGES, SKILLS, JOB_TYPE_CONFIG } from "@/types";
import type { OnboardingData, ExperienceLevel, ElevatorPref, PetPref, MaterialPref } from "@/types";

const STEPS = ["Välkommen", "Profil", "Tillgänglighet", "Område", "Jobbtyper", "Villkor", "Ersättning", "Klart!"];

export default function OnboardingPage() {
  const router = useRouter();
  const { cleaner } = useAuthContext();
  const { complete, saving } = useOnboarding(cleaner?.id);
  const [step, setStep] = useState(0);
  const startTime = Date.now();

  // Form state
  const [firstName, setFirstName] = useState(cleaner?.first_name || "");
  const [langs, setLangs] = useState<string[]>(["Svenska"]);
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [days, setDays] = useState({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
  const [startT, setStartT] = useState("08:00");
  const [endT, setEndT] = useState("18:00");
  const [maxJobs, setMaxJobs] = useState(4);
  const [breakMin, setBreakMin] = useState(30);
  const [address, setAddress] = useState("");
  const [maxRadius, setMaxRadius] = useState(5);
  const [zones, setZones] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>(["hem"]);
  const [bookingTypes, setBookingTypes] = useState<string[]>(["recurring", "oneTime"]);
  const [elevator, setElevator] = useState<ElevatorPref>("prefer");
  const [pets, setPets] = useState<PetPref>("some");
  const [materials, setMaterials] = useState<MaterialPref>("both");
  const [minPay, setMinPay] = useState(800);
  const [minPayH, setMinPayH] = useState(350);

  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return firstName.length > 0 && experience !== "";
    if (step === 2) return Object.values(days).some(Boolean);
    if (step === 3) return zones.length > 0;
    if (step === 4) return jobTypes.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      events.onboardingStepCompleted(step, STEPS[step]);
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    const data: OnboardingData = {
      profile: { first_name: firstName, languages: langs, experience: experience as ExperienceLevel, skills: selectedSkills },
      availability: { days, start_time: startT, end_time: endT, max_jobs: maxJobs, break_min: breakMin },
      area: { address, max_radius: maxRadius, zones },
      job_types: { types: jobTypes, booking_types: bookingTypes },
      conditions: { elevator, pets, materials },
      economy: { min_pay: minPay, min_pay_per_hour: minPayH },
    };

    const result = await complete(data);
    if (!result.error) {
      events.onboardingCompleted(Math.round((Date.now() - startTime) / 1000));
      router.push("/dashboard");
    }
  };

  const handleSkip = () => {
    events.onboardingSkipped(step);
    setStep(STEPS.length - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-100 to-sand-200 flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-spick to-spick-dark flex items-center justify-center text-white font-bold text-sm font-display">S</div>
          <span className="font-display text-lg font-bold">Spick</span>
        </div>
        {step > 0 && step < 7 && (
          <button onClick={handleSkip} className="text-sm text-sand-600">Hoppa över</button>
        )}
      </div>

      {/* Progress */}
      {step > 0 && step < 7 && (
        <div className="max-w-[500px] w-full mx-auto px-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-sand-200 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-spick to-spick-400 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-sand-500">{step}/{STEPS.length - 1}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="max-w-[500px] w-full">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center animate-fade-up">
              <div className="text-7xl mb-4">🌟</div>
              <h2 className="font-display text-3xl font-bold mb-3">Välkommen till Spick!</h2>
              <p className="text-md text-sand-700 mb-6 leading-relaxed">Vi hjälper dig sätta upp din profil så du får jobb som passar just dig. Det tar ungefär <strong>3 minuter</strong>.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {[{ e: "🎯", t: "Matchas med rätt jobb" }, { e: "💰", t: "Sätt dina villkor" }, { e: "📍", t: "Välj ditt område" }, { e: "🕐", t: "Styr din tid" }].map((f, i) => (
                  <span key={i} className="bg-spick-light text-spick-dark text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">{f.e} {f.t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="animate-fade-up">
              <div className="text-center mb-6">
                <span className="text-4xl">👤</span>
                <h2 className="font-display text-2xl font-bold mt-2">Berätta om dig</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-sand-700 mb-1">Förnamn</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ditt förnamn" className="w-full px-4 py-3 rounded-btn border border-sand-300 text-sm outline-none focus:border-spick" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-sand-700 mb-2">Erfarenhet</label>
                  <div className="flex gap-2.5">
                    {[{ v: "new", e: "🌱", l: "Ny" }, { v: "some", e: "📋", l: "1–2 år" }, { v: "experienced", e: "⭐", l: "3+ år" }, { v: "pro", e: "🏆", l: "Proffs" }].map(o => (
                      <button key={o.v} onClick={() => setExperience(o.v as ExperienceLevel)} className={cn(
                        "flex-1 py-3 rounded-tag text-center text-sm",
                        experience === o.v ? "border-2 border-spick bg-spick-light text-spick-dark font-bold" : "border border-sand-300 text-sand-700"
                      )}>
                        <div className="text-xl mb-0.5">{o.e}</div>{o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-sand-700 mb-2">Språk</label>
                  <div className="flex flex-wrap gap-2">{LANGUAGES.map(l => <FilterChip key={l} label={l} active={langs.includes(l)} onClick={() => setLangs(langs.includes(l) ? langs.filter(x => x !== l) : [...langs, l])} />)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Availability */}
          {step === 2 && (
            <div className="animate-fade-up">
              <div className="text-center mb-6"><span className="text-4xl">🕐</span><h2 className="font-display text-2xl font-bold mt-2">När kan du jobba?</h2></div>
              <div className="text-center mb-5"><DayPicker days={days} onChange={setDays} /></div>
              <div className="flex gap-5 justify-center mb-6">
                <div><label className="text-xs font-semibold text-sand-600 mb-1 block">Från</label><input type="time" value={startT} onChange={e => setStartT(e.target.value)} className="px-4 py-3 rounded-btn border border-sand-300 text-base font-bold w-[120px]" /></div>
                <div className="flex items-end pb-3 text-xl text-sand-300">→</div>
                <div><label className="text-xs font-semibold text-sand-600 mb-1 block">Till</label><input type="time" value={endT} onChange={e => setEndT(e.target.value)} className="px-4 py-3 rounded-btn border border-sand-300 text-base font-bold w-[120px]" /></div>
              </div>
              <Slider label="Max jobb per dag" min={1} max={6} value={maxJobs} onChange={setMaxJobs} unit="jobb" />
              <Slider label="Paus mellan jobb" min={0} max={60} value={breakMin} onChange={setBreakMin} unit="min" step={15} />
            </div>
          )}

          {/* Step 3: Area */}
          {step === 3 && (
            <div className="animate-fade-up">
              <div className="text-center mb-6"><span className="text-4xl">📍</span><h2 className="font-display text-2xl font-bold mt-2">Var vill du jobba?</h2></div>
              <div className="mb-5">
                <label className="text-sm font-semibold text-sand-700 mb-1 block">Hemadress</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="T.ex. Sveavägen 52, Stockholm" className="w-full px-4 py-3 rounded-btn border border-sand-300 text-sm outline-none focus:border-spick" />
              </div>
              <Slider label="Max resradie" min={1} max={20} value={maxRadius} onChange={setMaxRadius} unit="km" />
              <div className="text-sm font-semibold text-sand-700 mb-2 text-center">Föredragna områden</div>
              <div className="flex flex-wrap gap-2 justify-center">{STOCKHOLM_ZONES.map(z => <FilterChip key={z} label={z} active={zones.includes(z)} onClick={() => setZones(zones.includes(z) ? zones.filter(x => x !== z) : [...zones, z])} />)}</div>
            </div>
          )}

          {/* Step 4: Job types */}
          {step === 4 && (
            <div className="animate-fade-up">
              <div className="text-center mb-6"><span className="text-4xl">🧹</span><h2 className="font-display text-2xl font-bold mt-2">Vad vill du städa?</h2></div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(Object.entries(JOB_TYPE_CONFIG) as [string, any][]).map(([key, c]) => {
                  const shortKey = key.replace("stadning", "").replace("kontors", "kontor");
                  const active = jobTypes.includes(shortKey) || jobTypes.includes(key);
                  return (
                    <button key={key} onClick={() => {
                      const k = shortKey;
                      setJobTypes(active ? jobTypes.filter(x => x !== k && x !== key) : [...jobTypes, k]);
                    }} className={cn("p-5 rounded-2xl flex flex-col items-center gap-2 text-center transition-all", active ? "border-2 shadow-md" : "border border-sand-300")} style={active ? { borderColor: c.color, background: c.color + "10" } : {}}>
                      <span className="text-3xl">{c.emoji}</span>
                      <span className={cn("text-sm", active ? "font-bold" : "font-medium")} style={active ? { color: c.color } : {}}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Conditions */}
          {step === 5 && (
            <div className="animate-fade-up">
              <div className="text-center mb-6"><span className="text-4xl">⚙️</span><h2 className="font-display text-2xl font-bold mt-2">Arbetsvillkor</h2></div>
              {[
                { label: "Hiss", value: elevator, set: (v: string) => setElevator(v as ElevatorPref), opts: [{ v: "require", e: "🛗", l: "Kräver" }, { v: "prefer", e: "👍", l: "Föredrar" }, { v: "any", e: "💪", l: "Okej" }] },
                { label: "Husdjur", value: pets, set: (v: string) => setPets(v as PetPref), opts: [{ v: "none", e: "🚫", l: "Inga" }, { v: "some", e: "🐱", l: "Vissa" }, { v: "any", e: "🐾", l: "Alla" }] },
                { label: "Material", value: materials, set: (v: string) => setMaterials(v as MaterialPref), opts: [{ v: "client", e: "🏠", l: "Kundens" }, { v: "own", e: "🧴", l: "Eget" }, { v: "both", e: "✓", l: "Båda" }] },
              ].map(g => (
                <div key={g.label} className="mb-5">
                  <div className="text-sm font-bold text-sand-800 text-center mb-2.5">{g.label}</div>
                  <div className="flex gap-2.5 justify-center">
                    {g.opts.map(o => (
                      <button key={o.v} onClick={() => g.set(o.v)} className={cn(
                        "flex-1 max-w-[140px] py-3.5 rounded-tag text-sm text-center",
                        g.value === o.v ? "border-2 border-spick bg-spick-light text-spick-dark font-bold" : "border border-sand-300 text-sand-700"
                      )}>
                        <div className="text-xl mb-0.5">{o.e}</div>{o.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 6: Economy */}
          {step === 6 && (
            <div className="animate-fade-up">
              <div className="text-center mb-6"><span className="text-4xl">💰</span><h2 className="font-display text-2xl font-bold mt-2">Dina ekonomiska krav</h2></div>
              <Slider label="Min betalning per jobb" min={400} max={3000} value={minPay} onChange={setMinPay} unit="kr" step={50} />
              <Slider label="Min timpeng" min={250} max={700} value={minPayH} onChange={setMinPayH} unit="kr/h" step={10} />
              <div className="p-4 rounded-tag bg-amber-50 border border-amber-200 text-sm text-amber-800 text-center">
                💡 Snitt i Stockholm: <strong>380–450 kr/h</strong>
              </div>
            </div>
          )}

          {/* Step 7: Done */}
          {step === 7 && (
            <div className="text-center animate-fade-up">
              <div className="text-7xl mb-3">🎉</div>
              <h2 className="font-display text-3xl font-bold mb-2">Du är redo, {firstName}!</h2>
              <p className="text-md text-sand-700 mb-6">Din profil är klar. Vi söker redan efter jobb som matchar dig!</p>
              <div className="bg-white rounded-2xl p-5 border border-sand-200 text-left max-w-sm mx-auto mb-6">
                {[
                  { l: "Dagar", v: Object.entries(days).filter(([, v]) => v).length + "/7" },
                  { l: "Radie", v: `${maxRadius} km` },
                  { l: "Zoner", v: `${zones.length} st` },
                  { l: "Jobbtyper", v: `${jobTypes.length} st` },
                  { l: "Min timpeng", v: `${minPayH} kr/h` },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-sand-100 last:border-0 text-sm">
                    <span className="text-sand-600">{s.l}</span>
                    <span className="font-semibold">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 pt-4 max-w-[500px] w-full mx-auto flex gap-3">
        {step > 0 && step < 7 && (
          <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Tillbaka</Button>
        )}
        {step < 7 ? (
          <Button variant="primary" size="lg" className="flex-1" onClick={handleNext} disabled={!canProceed()}>
            {step === 0 ? "Kom igång →" : step === 6 ? "Slutför ✓" : "Fortsätt →"}
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="flex-1" onClick={handleComplete} loading={saving}>
            Gå till Dashboard →
          </Button>
        )}
      </div>
    </div>
  );
}
