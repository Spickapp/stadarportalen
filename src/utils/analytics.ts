// ═══════════════════════════════════════════
// Analytics & Tracking
// PostHog event tracking for Städarportalen
// ═══════════════════════════════════════════

type EventProps = Record<string, string | number | boolean | null>;

let posthogLoaded = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (posthogLoaded) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com";

  if (!key) {
    console.warn("[Analytics] No PostHog key found, tracking disabled");
    return;
  }

  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // We handle this manually
      persistence: "localStorage",
    });
    posthogLoaded = true;
  });
}

export function track(event: string, props?: EventProps) {
  if (typeof window === "undefined") return;

  const enrichedProps = {
    ...props,
    timestamp: new Date().toISOString(),
    platform: window.innerWidth < 768 ? "mobile" : "desktop",
    page: window.location.pathname,
  };

  // PostHog
  if (posthogLoaded) {
    import("posthog-js").then(({ default: posthog }) => {
      posthog.capture(event, enrichedProps);
    });
  }

  // Console in dev
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, enrichedProps);
  }
}

export function identify(userId: string, traits?: EventProps) {
  if (typeof window === "undefined" || !posthogLoaded) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.identify(userId, traits);
  });
}

export function pageView(pageName: string) {
  track("page_viewed", { page: pageName });
}

// Pre-defined event helpers
export const events = {
  // Onboarding
  onboardingStarted: () => track("onboarding_started"),
  onboardingStepCompleted: (step: number, stepName: string) => track("onboarding_step_completed", { step, step_name: stepName }),
  onboardingSkipped: (atStep: number) => track("onboarding_skipped", { at_step: atStep }),
  onboardingCompleted: (durationSec: number) => track("onboarding_completed", { duration_seconds: durationSec }),

  // Jobs
  jobViewed: (jobId: string, matchScore: number, jobType: string) => track("job_viewed", { job_id: jobId, match_score: matchScore, job_type: jobType }),
  jobAccepted: (jobId: string, matchScore: number, pay: number, payPerHour: number, distanceKm: number) => track("job_accepted", { job_id: jobId, match_score: matchScore, pay, pay_per_hour: payPerHour, distance_km: distanceKm }),
  jobDeclined: (jobId: string, matchScore: number) => track("job_declined", { job_id: jobId, match_score: matchScore }),
  jobFilterUsed: (filterType: string, filterValue: string) => track("job_filter_used", { filter_type: filterType, filter_value: filterValue }),
  jobSortChanged: (sortBy: string) => track("job_sort_changed", { sort_by: sortBy }),

  // Settings
  settingsOpened: () => track("settings_opened"),
  settingsSaved: (changedCount: number, scoreBefore: number, scoreAfter: number) => track("settings_saved", { changed_count: changedCount, match_score_before: scoreBefore, match_score_after: scoreAfter }),

  // Calendar
  calendarViewed: (viewMode: string) => track("calendar_viewed", { view_mode: viewMode }),
  timeBlocked: (reason: string, allDay: boolean) => track("calendar_time_blocked", { reason, all_day: allDay }),

  // Earnings
  earningsViewed: (tab: string) => track("earnings_viewed", { tab }),

  // Errors
  errorOccurred: (errorType: string, message: string) => track("error_occurred", { error_type: errorType, message }),
};
