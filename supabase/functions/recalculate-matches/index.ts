import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, corsHeaders, err, ok } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { cleaner_id } = await req.json();
    if (!cleaner_id) return err("VALIDATION_ERROR", "cleaner_id required", 422);

    const { data: cleaner } = await supabaseAdmin.from("cleaners").select("*").eq("id", cleaner_id).single();
    const { data: avail } = await supabaseAdmin.from("cleaner_availability").select("*").eq("cleaner_id", cleaner_id).single();
    const { data: zones } = await supabaseAdmin.from("cleaner_zones").select("*").eq("cleaner_id", cleaner_id).single();
    const { data: prefZones } = await supabaseAdmin.from("cleaner_preferred_zones").select("zone_name").eq("cleaner_id", cleaner_id);
    const { data: jobTypes } = await supabaseAdmin.from("cleaner_job_types").select("*").eq("cleaner_id", cleaner_id);
    const { data: petPrefs } = await supabaseAdmin.from("cleaner_pet_prefs").select("*").eq("cleaner_id", cleaner_id);
    const { data: jobs } = await supabaseAdmin.from("jobs").select("*").eq("status", "available");

    if (!jobs?.length) return ok({ recalculated: 0 });

    const enabled = (jobTypes || []).filter(t => t.enabled).map(t => t.job_type);
    const zoneNames = (prefZones || []).map(z => z.zone_name);
    const maxR = zones?.max_radius_km || 5;

    const matches = jobs.map((j: any) => {
      let score = 0, total = 0;
      const f: Record<string, boolean> = {};

      total += 20; f.job_type_ok = enabled.includes(j.job_type); if (f.job_type_ok) score += 20;
      total += 20; f.distance_ok = (j.distance_km || 0) <= maxR; if (f.distance_ok) score += 20; else if ((j.distance_km || 0) <= maxR * 1.2) score += 10;
      total += 15; f.time_ok = !avail || (j.start_time >= avail.start_time && j.end_time <= avail.end_time); if (f.time_ok) score += 15;
      total += 10; f.elevator_ok = cleaner.elevator_pref === "any" || j.has_elevator; if (f.elevator_ok) score += 10; else if (cleaner.elevator_pref === "prefer") score += 5;
      total += 10;
      if (cleaner.pet_pref === "any" || !j.has_pets) { f.pets_ok = true; score += 10; }
      else if (cleaner.pet_pref === "some") { f.pets_ok = !!(petPrefs || []).find((p: any) => p.pet_type === j.pet_type && p.allowed); score += f.pets_ok ? 10 : 3; }
      else f.pets_ok = false;
      total += 10; f.materials_ok = cleaner.material_pref === "both" || (cleaner.material_pref === "client" && j.materials === "client") || (cleaner.material_pref === "own" && j.materials === "own"); if (f.materials_ok) score += 10;
      total += 10; if (zoneNames.includes(j.area)) score += 10;
      total += 5; f.client_rating_ok = j.pay_amount >= (cleaner.min_pay_per_job || 0) && (j.pay_per_hour || 0) >= (cleaner.min_pay_per_hour || 0); if (f.client_rating_ok) score += 5;

      const ms = total > 0 ? Math.round((score / total) * 100) : 0;
      return { job_id: j.id, cleaner_id, match_score: ms, ...f, distance_km: j.distance_km, travel_time_min: j.travel_time_min, presented: ms >= 50 };
    });

    for (const m of matches) {
      await supabaseAdmin.from("job_matches").upsert(m, { onConflict: "job_id,cleaner_id" });
    }

    return ok({ recalculated: matches.length, avg_score: Math.round(matches.reduce((s: number, m: any) => s + m.match_score, 0) / matches.length) });
  } catch (e) {
    console.error("recalculate-matches:", e);
    return err("SERVER_ERROR", "Internt fel", 500);
  }
});
