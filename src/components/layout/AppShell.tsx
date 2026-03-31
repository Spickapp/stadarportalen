"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/app/providers";
import { useNotifications } from "@/hooks";
import { cn } from "@/utils/helpers";
import { Home, Briefcase, Calendar, Wallet, Settings, Bell } from "lucide-react";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Hem", icon: Home },
  { href: "/jobs", label: "Jobb", icon: Briefcase },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/earnings", label: "Inkomst", icon: Wallet },
  { href: "/settings", label: "Inst.", icon: Settings },
];

// ── TopBar ──
function TopBar() {
  const { cleaner } = useAuthContext();
  const { unreadCount } = useNotifications(cleaner?.id);

  return (
    <div className="bg-white border-b border-sand-200 px-5 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-spick to-spick-dark flex items-center justify-center text-white font-bold text-md font-display">
          S
        </div>
        <span className="font-display text-lg font-bold tracking-tight">Spick</span>
      </div>
      <div className="flex items-center gap-3.5">
        <button className="relative p-1.5 text-sand-600">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-orange text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-sm font-semibold text-amber-800">
          {cleaner?.first_name?.[0] || "?"}
        </div>
      </div>
    </div>
  );
}

// ── BottomNav ──
function BottomNav({ jobCount }: { jobCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-sand-200 pb-safe-bottom pt-1.5 pb-2.5 flex justify-center z-50">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        const showBadge = item.href === "/jobs" && jobCount && jobCount > 0;

        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex-1 max-w-[85px] flex flex-col items-center gap-0.5 text-[10px] py-1 relative transition-colors",
              active ? "text-spick font-bold" : "text-sand-500"
            )}
          >
            {active && <div className="absolute -top-[1px] w-5 h-[3px] rounded-full bg-spick" />}
            <span className={cn("relative transition-transform", active && "scale-110")}>
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {showBadge && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-spick text-white text-[9px] font-bold flex items-center justify-center">
                  {jobCount}
                </span>
              )}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Shell ──
export function AppShell({ children, jobCount }: { children: ReactNode; jobCount?: number }) {
  const { cleaner, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-spick border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-100">
      <TopBar />
      <main className="max-w-[960px] mx-auto px-5 py-5 pb-24">
        {children}
      </main>
      <BottomNav jobCount={jobCount} />
    </div>
  );
}
