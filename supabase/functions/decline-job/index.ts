import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, corsHeaders, err, ok } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { job_id, cleaner_id } = await req.json();
    if (!job_id || !cleaner_id) return err("VALIDATION_ERROR", "job_id and cleaner_id required", 422);

    const { error } = await supabaseAdmin.from("job_matches").update({
      response: "declined", responded_at: new Date().toISOString(),
    }).eq("job_id", job_id).eq("cleaner_id", cleaner_id).is("response", null);

    if (error) return err("UPDATE_FAILED", "Kunde inte avvisa", 400);
    return ok({ job_id, status: "declined" });
  } catch (e) {
    console.error("decline-job:", e);
    return err("SERVER_ERROR", "Internt fel", 500);
  }
});
