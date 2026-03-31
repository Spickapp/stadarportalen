import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, corsHeaders, err, ok } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { cleaner_id, title, body, data: payload } = await req.json();
    if (!cleaner_id || !title) return err("VALIDATION_ERROR", "cleaner_id and title required", 422);

    // Get FCM token (add fcm_token column to cleaners table if using push)
    const { data: cleaner } = await supabaseAdmin
      .from("cleaners").select("id").eq("id", cleaner_id).single();

    if (!cleaner) return ok({ sent: false, reason: "cleaner_not_found" });

    const fcmKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmKey) return ok({ sent: false, reason: "no_fcm_key" });

    // For now, just log – actual FCM integration when fcm_token exists
    console.log(`[PUSH] To: ${cleaner_id} | ${title} | ${body}`);

    return ok({ sent: true });
  } catch (e) {
    console.error("send-notification:", e);
    return err("SERVER_ERROR", "Internt fel", 500);
  }
});
