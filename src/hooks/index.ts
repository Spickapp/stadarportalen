import { useState, useEffect, useCallback } from "react";
import { getSupabase, callEdgeFunction } from "@/lib/supabase";
import type {
  Job, MatchedJob, Notification, Cleaner, BlockedTime,
  AllSettings, DashboardData, WeekStats, EarningsSummary,
  CleanerCustomerRelation, OnboardingData,
} from "@/types";
import { startOfWeek, endOfWeek, format } from "date-fns";

// ── Auth ──

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useCleanerProfile() {
  const [cleaner, setCleaner] = useState<Cleaner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("cleaners")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error) setError(error.message);
      else setCleaner(data);
      setLoading(false);
    }
    fetch();
  }, []);

  return { cleaner, loading, error };
}

// ── Dashboard ──

export function useDashboard(cleanerId: string | undefined) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cleanerId) return;
    setLoading(true);

    try {
      const supabase = getSupabase();
      const today = format(new Date(), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const [cleanerRes, todayRes, availableRes, weekRes, notifsRes] = await Promise.all([
        supabase.from("cleaners").select("first_name, avg_rating, total_jobs, total_earned").eq("id", cleanerId).single(),
        supabase.from("jobs").select("*, customers(name, address, area, has_elevator, has_pets, pet_type)").eq("cleaner_id", cleanerId).eq("scheduled_date", today).in("status", ["accepted", "confirmed", "pending"]).order("start_time"),
        supabase.from("v_available_jobs_with_match").select("*").eq("cleaner_id", cleanerId).order("match_score", { ascending: false }).limit(4),
        supabase.from("jobs").select("pay_amount, start_time, end_time").eq("cleaner_id", cleanerId).eq("status", "completed").gte("scheduled_date", weekStart).lte("scheduled_date", weekEnd),
        supabase.from("notifications").select("*").eq("cleaner_id", cleanerId).order("created_at", { ascending: false }).limit(5),
      ]);

      // Calculate week stats
      const weekJobs = weekRes.data || [];
      const totalEarned = weekJobs.reduce((s, j) => s + j.pay_amount, 0);
      const totalHours = weekJobs.reduce((s, j) => {
        const [sh, sm] = j.start_time.split(":").map(Number);
        const [eh, em] = j.end_time.split(":").map(Number);
        return s + (eh + em / 60) - (sh + sm / 60);
      }, 0);

      const weekStats: WeekStats = {
        earned: totalEarned,
        jobs: weekJobs.length,
        hours: Math.round(totalHours * 10) / 10,
        avg_per_hour: totalHours > 0 ? Math.round(totalEarned / totalHours) : 0,
      };

      setData({
        cleaner: cleanerRes.data!,
        today_jobs: (todayRes.data || []) as any,
        available_jobs: (availableRes.data || []) as MatchedJob[],
        week_stats: weekStats,
        notifications: (notifsRes.data || []) as Notification[],
        unread_count: (notifsRes.data || []).filter((n: any) => !n.read).length,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cleanerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}

// ── Jobs ──

export function useAvailableJobs(cleanerId: string | undefined) {
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cleanerId) return;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("v_available_jobs_with_match")
      .select("*")
      .eq("cleaner_id", cleanerId)
      .order("match_score", { ascending: false });

    if (error) setError(error.message);
    else setJobs(data as MatchedJob[]);
    setLoading(false);
  }, [cleanerId]);

  useEffect(() => { refresh(); }, [refresh]);

  const acceptJob = async (jobId: string) => {
    const result = await callEdgeFunction("accept-job", { job_id: jobId, cleaner_id: cleanerId });
    if (!result.error) {
      setJobs(prev => prev.filter(j => j.id !== jobId));
    }
    return result;
  };

  const declineJob = async (jobId: string) => {
    const supabase = getSupabase();
    await supabase.from("job_matches").update({ response: "declined", responded_at: new Date().toISOString() }).eq("job_id", jobId).eq("cleaner_id", cleanerId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  return { jobs, loading, error, refresh, acceptJob, declineJob };
}

// ── Calendar ──

export function useCalendar(cleanerId: string | undefined, weekStart: string, weekEnd: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [blocked, setBlocked] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cleanerId) return;
    const supabase = getSupabase();

    Promise.all([
      supabase.from("jobs").select("*, customers(name, address, area)").eq("cleaner_id", cleanerId).gte("scheduled_date", weekStart).lte("scheduled_date", weekEnd).in("status", ["accepted", "confirmed", "pending", "completed"]).order("start_time"),
      supabase.from("blocked_times").select("*").eq("cleaner_id", cleanerId).gte("blocked_date", weekStart).lte("blocked_date", weekEnd),
    ]).then(([jobsRes, blockedRes]) => {
      setJobs((jobsRes.data || []) as Job[]);
      setBlocked((blockedRes.data || []) as BlockedTime[]);
      setLoading(false);
    });
  }, [cleanerId, weekStart, weekEnd]);

  const blockTime = async (data: Omit<BlockedTime, "id" | "created_at" | "cleaner_id">) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("blocked_times").insert({ ...data, cleaner_id: cleanerId });
    if (!error) {
      const { data: updated } = await supabase.from("blocked_times").select("*").eq("cleaner_id", cleanerId).gte("blocked_date", weekStart).lte("blocked_date", weekEnd);
      setBlocked((updated || []) as BlockedTime[]);
    }
    return { error };
  };

  return { jobs, blocked, loading, blockTime };
}

// ── Settings ──

export function useSettings(cleanerId: string | undefined) {
  const [settings, setSettings] = useState<AllSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cleanerId) return;
    const supabase = getSupabase();

    Promise.all([
      supabase.from("cleaners").select("*").eq("id", cleanerId).single(),
      supabase.from("cleaner_availability").select("*").eq("cleaner_id", cleanerId).single(),
      supabase.from("cleaner_zones").select("*").eq("cleaner_id", cleanerId).single(),
      supabase.from("cleaner_preferred_zones").select("*").eq("cleaner_id", cleanerId),
      supabase.from("cleaner_job_types").select("*").eq("cleaner_id", cleanerId),
      supabase.from("cleaner_pet_prefs").select("*").eq("cleaner_id", cleanerId),
      supabase.from("cleaner_languages").select("language").eq("cleaner_id", cleanerId),
      supabase.from("cleaner_skills").select("skill").eq("cleaner_id", cleanerId),
      supabase.from("cleaner_avoid_types").select("avoid_type").eq("cleaner_id", cleanerId),
      supabase.from("cleaner_booking_prefs").select("*").eq("cleaner_id", cleanerId).single(),
    ]).then(([c, a, z, pz, jt, pp, la, sk, av, bp]) => {
      setSettings({
        cleaner: c.data!,
        availability: a.data!,
        zones: z.data!,
        preferred_zones: pz.data || [],
        job_types: jt.data || [],
        pet_prefs: pp.data || [],
        languages: (la.data || []).map((l: any) => l.language),
        skills: (sk.data || []).map((s: any) => s.skill),
        avoid_types: (av.data || []).map((a: any) => a.avoid_type),
        accepts_recurring: bp.data?.accepts_recurring ?? true,
        accepts_one_time: bp.data?.accepts_one_time ?? true,
      });
      setLoading(false);
    });
  }, [cleanerId]);

  const saveSection = async (section: string, data: Record<string, unknown>) => {
    setSaving(true);
    const result = await callEdgeFunction("update-settings", { cleaner_id: cleanerId, section, data });
    setSaving(false);
    return result;
  };

  return { settings, loading, saving, saveSection };
}

// ── Earnings ──

export function useEarnings(cleanerId: string | undefined, periodType: "week" | "month" = "month") {
  const [data, setData] = useState<EarningsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cleanerId) return;
    const supabase = getSupabase();
    supabase.from("earnings_summary").select("*").eq("cleaner_id", cleanerId).eq("period_type", periodType).order("period_start", { ascending: false }).limit(6)
      .then(({ data }) => { setData((data || []) as EarningsSummary[]); setLoading(false); });
  }, [cleanerId, periodType]);

  return { data, loading };
}

export function useJobHistory(cleanerId: string | undefined, jobType?: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchPage = useCallback(async (pageNum: number) => {
    if (!cleanerId) return;
    const supabase = getSupabase();
    let query = supabase.from("jobs").select("*, customers(name, area), ratings(rating, comment)", { count: "exact" }).eq("cleaner_id", cleanerId).eq("status", "completed").order("completed_at", { ascending: false }).range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (jobType && jobType !== "Alla") {
      const typeMap: Record<string, string> = { "Hemstädning": "hemstadning", "Flyttstädning": "flyttstadning", "Storstädning": "storstadning", "Kontorsstädning": "kontorsstadning" };
      query = query.eq("job_type", typeMap[jobType] || jobType);
    }

    const { data, count } = await query;
    if (pageNum === 0) setJobs(data as Job[]);
    else setJobs(prev => [...prev, ...(data as Job[])]);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }, [cleanerId, jobType]);

  useEffect(() => { setPage(0); fetchPage(0); }, [fetchPage]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchPage(next); };

  return { jobs, loading, hasMore, loadMore };
}

export function useTopClients(cleanerId: string | undefined) {
  const [clients, setClients] = useState<CleanerCustomerRelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cleanerId) return;
    const supabase = getSupabase();
    supabase.from("cleaner_customer_relations").select("*, customers(name, area)").eq("cleaner_id", cleanerId).order("total_earned", { ascending: false }).limit(5)
      .then(({ data }) => { setClients((data || []) as any); setLoading(false); });
  }, [cleanerId]);

  return { clients, loading };
}

// ── Notifications ──

export function useNotifications(cleanerId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!cleanerId) return;
    const supabase = getSupabase();

    // Initial fetch
    supabase.from("notifications").select("*").eq("cleaner_id", cleanerId).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => {
        const notifs = (data || []) as Notification[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      });

    // Realtime subscription
    const channel = supabase.channel("notifications").on("postgres_changes", {
      event: "INSERT", schema: "public", table: "notifications", filter: `cleaner_id=eq.${cleanerId}`,
    }, (payload) => {
      const newNotif = payload.new as Notification;
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cleanerId]);

  const markAsRead = async (notifId: string) => {
    const supabase = getSupabase();
    await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).eq("id", notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const supabase = getSupabase();
    await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).eq("cleaner_id", cleanerId).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllRead };
}

// ── Realtime: New job matches ──

export function useJobMatchSubscription(cleanerId: string | undefined, onNewMatch: () => void) {
  useEffect(() => {
    if (!cleanerId) return;
    const supabase = getSupabase();

    const channel = supabase.channel("job-matches").on("postgres_changes", {
      event: "INSERT", schema: "public", table: "job_matches", filter: `cleaner_id=eq.${cleanerId}`,
    }, () => {
      onNewMatch();
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cleanerId, onNewMatch]);
}

// ── Onboarding ──

export function useOnboarding(cleanerId: string | undefined) {
  const [saving, setSaving] = useState(false);

  const complete = async (data: OnboardingData) => {
    setSaving(true);
    const result = await callEdgeFunction("complete-onboarding", { cleaner_id: cleanerId, data });
    setSaving(false);
    return result;
  };

  return { complete, saving };
}
