import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, corsHeaders, json, err, ok } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { job_id, cleaner_id } = await req.json();
    if (!job_id || !cleaner_id) return err("VALIDATION_ERROR", "job_id and cleaner_id required", 422);

    // 1. Check job still available
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs").select("id, status, job_type, area, pay_amount")
      .eq("id", job_id).single();

    if (jobErr || !job) return err("NOT_FOUND", "Jobbet hittades inte", 404);
    if (job.status !== "available") return err("JOB_ALREADY_TAKEN", "Jobbet är inte längre tillgängligt", 409);

    // 2. Check match exists
    const { data: match } = await supabaseAdmin
      .from("job_matches").select("id, response")
      .eq("job_id", job_id).eq("cleaner_id", cleaner_id).single();

    if (!match) return err("MATCH_NOT_FOUND", "Ingen matchning hittades", 404);
    if (match.response) return err("ALREADY_RESPONDED", "Du har redan svarat", 409);

    // 3. Update job (optimistic lock on status)
    const { error: updateErr } = await supabaseAdmin
      .from("jobs").update({
        cleaner_id, status: "confirmed",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", job_id).eq("status", "available");

    if (updateErr) return err("JOB_ALREADY_TAKEN", "En annan städare hann före", 409);

    // 4. Mark match as accepted
    await supabaseAdmin.from("job_matches").update({
      response: "accepted", responded_at: new Date().toISOString(),
    }).eq("job_id", job_id).eq("cleaner_id", cleaner_id);

    // 5. Auto-decline other matches
    await supabaseAdmin.from("job_matches").update({
      response: "auto_declined", responded_at: new Date().toISOString(),
    }).eq("job_id", job_id).neq("cleaner_id", cleaner_id).is("response", null);

    // 6. Create notification
    await supabaseAdmin.from("notifications").insert({
      cleaner_id, type: "system", title: "Jobb bekräftat",
      body: `${job.job_type} i ${job.area} – ${job.pay_amount} kr`,
      job_id,
    });

    return ok({ job_id, status: "confirmed" });
  } catch (e) {
    console.error("accept-job:", e);
    return err("SERVER_ERROR", "Internt fel", 500);
  }
});
