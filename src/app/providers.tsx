"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { initAnalytics, identify } from "@/utils/analytics";
import type { Cleaner } from "@/types";

// ── Auth Context ──
interface AuthContextType {
  user: { id: string; email: string } | null;
  cleaner: Cleaner | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  cleaner: null,
  loading: true,
  signOut: async () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

// ── Provider ──
export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [cleaner, setCleaner] = useState<Cleaner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();

    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email! };
        setUser(u);
        identify(u.id, { email: u.email });

        // Fetch cleaner profile
        const { data } = await supabase
          .from("cleaners")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single();

        if (data) setCleaner(data as Cleaner);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email! };
        setUser(u);

        const { data } = await supabase
          .from("cleaners")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single();

        if (data) setCleaner(data as Cleaner);
      } else {
        setUser(null);
        setCleaner(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setUser(null);
    setCleaner(null);
  };

  return (
    <AuthContext.Provider value={{ user, cleaner, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
