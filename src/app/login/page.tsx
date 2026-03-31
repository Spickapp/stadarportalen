"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      // Create cleaner profile
      if (data.user) {
        await supabase.from("cleaners").insert({
          auth_user_id: data.user.id,
          first_name: firstName || "Ny städare",
          onboarding_completed: false,
          onboarding_step: 0,
        });
      }
      router.push("/onboarding");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }

      // Check onboarding status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: cleaner } = await supabase.from("cleaners").select("onboarding_completed").eq("auth_user_id", user.id).single();
        router.push(cleaner?.onboarding_completed ? "/dashboard" : "/onboarding");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-spick to-spick-dark flex items-center justify-center text-white font-bold text-3xl font-display mx-auto mb-4">
            S
          </div>
          <h1 className="font-display text-3xl font-bold">Spick</h1>
          <p className="text-sm text-sand-600 mt-1">Städarportalen</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-sand-200">
          <h2 className="font-display text-xl font-bold mb-4">{isSignUp ? "Skapa konto" : "Logga in"}</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-sand-700 mb-1">Förnamn</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Ditt förnamn"
                  required
                  className="w-full px-4 py-3 rounded-btn border border-sand-300 text-sm outline-none focus:border-spick transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-sand-700 mb-1">E-post</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="din@email.se"
                required
                className="w-full px-4 py-3 rounded-btn border border-sand-300 text-sm outline-none focus:border-spick transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-sand-700 mb-1">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-btn border border-sand-300 text-sm outline-none focus:border-spick transition-colors"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              {isSignUp ? "Skapa konto →" : "Logga in →"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-sm text-spick font-semibold"
            >
              {isSignUp ? "Har redan konto? Logga in" : "Ny här? Skapa konto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
