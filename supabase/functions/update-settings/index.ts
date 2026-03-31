import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, corsHeaders, err, ok } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { cleaner_id, section, data } = await req.json();
    if (!cleaner_id || !section || !data) return err("VALIDATION_ERROR", "Missing fields", 422);

    switch (section) {
      case "availability":
        await supabaseAdmin.from("cleaner_availability").upsert({ cleaner_id, ...data }, { onConflict: "cleaner_id" });
        break;
      case "zones":
        await supabaseAdmin.from("cleaner_zones").upsert({ cleaner_id, max_radius_km: data.max_radius_km }, { onConflict: "cleaner_id" });
        await supabaseAdmin.from("cleaner_preferred_zones").delete().eq("cleaner_id", cleaner_id);
        if (data.preferred_zones?.length) {
          await supabaseAdmin.from("cleaner_preferred_zones").insert(data.preferred_zones.map((z: string) => ({ cleaner_id, zone_name: z })));
        }
        break;
      case "job_types":
        for (const [type, enabled] of Object.entries(data.types || {})) {
          await supabaseAdmin.from("cleaner_job_types").upsert({ cleaner_id, job_type: type, enabled }, { onConflict: "cleaner_id,job_type" });
        }
        break;
      case "conditions":
        await supabaseAdmin.from("cleaners").update({ ...data, updated_at: new Date().toISOString() }).eq("id", cleaner_id);
        break;
      case "economy":
        await supabaseAdmin.from("cleaners").update({ ...data, updated_at: new Date().toISOString() }).eq("id", cleaner_id);
        break;
      case "personal":
        if (data.languages) {
          await supabaseAdmin.from("cleaner_languages").delete().eq("cleaner_id", cleaner_id);
          if (data.languages.length) await supabaseAdmin.from("cleaner_languages").insert(data.languages.map((l: string) => ({ cleaner_id, language: l })));
        }
        if (data.skills) {
          await supabaseAdmin.from("cleaner_skills").delete().eq("cleaner_id", cleaner_id);
          if (data.skills.length) await supabaseAdmin.from("cleaner_skills").insert(data.skills.map((s: string) => ({ cleaner_id, skill: s })));
        }
        if (data.avoid_types) {
          await supabaseAdmin.from("cleaner_avoid_types").delete().eq("cleaner_id", cleaner_id);
          if (data.avoid_types.length) await supabaseAdmin.from("cleaner_avoid_types").insert(data.avoid_types.map((a: string) => ({ cleaner_id, avoid_type: a })));
        }
        break;
      default:
        return err("VALIDATION_ERROR", `Unknown section: ${section}`, 422);
    }

    // Trigger re-matching
    const reUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/recalculate-matches`;
    await fetch(reUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ cleaner_id }),
    });

    return ok({ section, saved: true });
  } catch (e) {
    console.error("update-settings:", e);
    return err("SERVER_ERROR", "Internt fel", 500);
  }
});
