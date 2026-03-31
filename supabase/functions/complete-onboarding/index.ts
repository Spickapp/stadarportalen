import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, corsHeaders, err, ok } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { cleaner_id, data } = await req.json();
    if (!cleaner_id || !data) return err("VALIDATION_ERROR", "cleaner_id and data required", 422);

    const { profile, availability, area, job_types, conditions, economy } = data;

    // 1. Update cleaner
    await supabaseAdmin.from("cleaners").update({
      first_name: profile.first_name,
      experience: profile.experience,
      home_address: area.address,
      home_lat: area.lat || null, home_lng: area.lng || null,
      min_pay_per_job: economy.min_pay, min_pay_per_hour: economy.min_pay_per_hour,
      elevator_pref: conditions.elevator, pet_pref: conditions.pets, material_pref: conditions.materials,
      onboarding_completed: true, onboarding_step: 8, updated_at: new Date().toISOString(),
    }).eq("id", cleaner_id);

    // 2. Availability
    const d = availability.days;
    await supabaseAdmin.from("cleaner_availability").upsert({
      cleaner_id,
      day_mon: d.mon ?? true, day_tue: d.tue ?? true, day_wed: d.wed ?? true,
      day_thu: d.thu ?? true, day_fri: d.fri ?? true, day_sat: d.sat ?? false, day_sun: d.sun ?? false,
      start_time: availability.start_time, end_time: availability.end_time,
      max_jobs_per_day: availability.max_jobs, break_between_min: availability.break_min,
    }, { onConflict: "cleaner_id" });

    // 3. Zones
    await supabaseAdmin.from("cleaner_zones").upsert({ cleaner_id, max_radius_km: area.max_radius }, { onConflict: "cleaner_id" });
    await supabaseAdmin.from("cleaner_preferred_zones").delete().eq("cleaner_id", cleaner_id);
    if (area.zones?.length) {
      await supabaseAdmin.from("cleaner_preferred_zones").insert(area.zones.map((z: string) => ({ cleaner_id, zone_name: z })));
    }

    // 4. Job types
    const typeMap: Record<string, string> = { hem: "hemstadning", flytt: "flyttstadning", stor: "storstadning", kontor: "kontorsstadning" };
    const allTypes = ["hemstadning", "flyttstadning", "storstadning", "kontorsstadning"];
    await supabaseAdmin.from("cleaner_job_types").delete().eq("cleaner_id", cleaner_id);
    await supabaseAdmin.from("cleaner_job_types").insert(
      allTypes.map(t => ({ cleaner_id, job_type: t, enabled: job_types.types.some((x: string) => typeMap[x] === t || x === t) }))
    );

    // 5. Booking prefs
    await supabaseAdmin.from("cleaner_booking_prefs").upsert({
      cleaner_id,
      accepts_recurring: job_types.booking_types?.includes("recurring") ?? true,
      accepts_one_time: job_types.booking_types?.includes("oneTime") ?? true,
    }, { onConflict: "cleaner_id" });

    // 6. Languages
    await supabaseAdmin.from("cleaner_languages").delete().eq("cleaner_id", cleaner_id);
    if (profile.languages?.length) {
      await supabaseAdmin.from("cleaner_languages").insert(profile.languages.map((l: string) => ({ cleaner_id, language: l })));
    }

    // 7. Skills
    await supabaseAdmin.from("cleaner_skills").delete().eq("cleaner_id", cleaner_id);
    if (profile.skills?.length) {
      await supabaseAdmin.from("cleaner_skills").insert(profile.skills.map((s: string) => ({ cleaner_id, skill: s })));
    }

    // 8. Welcome notification
    await supabaseAdmin.from("notifications").insert({
      cleaner_id, type: "system", title: "Välkommen till Spick!",
      body: "Din profil är klar – vi söker redan efter jobb som matchar dig!",
    });

    return ok({ cleaner_id, onboarding_completed: true });
  } catch (e) {
    console.error("complete-onboarding:", e);
    return err("SERVER_ERROR", "Internt fel", 500);
  }
});
