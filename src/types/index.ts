// ═══════════════════════════════════════════
// STÄDARPORTALEN – TypeScript Types
// All data models matching Supabase schema
// ═══════════════════════════════════════════

// ── Enums ──

export type JobType = "hemstadning" | "flyttstadning" | "storstadning" | "kontorsstadning";
export type JobStatus = "available" | "pending" | "accepted" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type BookingType = "recurring" | "one_time";
export type ElevatorPref = "require" | "prefer" | "any";
export type PetPref = "none" | "some" | "any";
export type MaterialPref = "own" | "client" | "both";
export type ExperienceLevel = "new" | "some" | "experienced" | "pro";
export type NotificationType = "new_job" | "booking_change" | "rating" | "system" | "reminder";
export type BlockReason = "day_off" | "private" | "sick" | "vacation" | "other";
export type PetType = "cat" | "small_dog" | "large_dog" | "other";

// ── Core Models ──

export interface Cleaner {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  experience: ExperienceLevel;
  bio: string | null;
  home_address: string | null;
  home_lat: number | null;
  home_lng: number | null;
  min_pay_per_job: number;
  min_pay_per_hour: number;
  elevator_pref: ElevatorPref;
  pet_pref: PetPref;
  material_pref: MaterialPref;
  works_alone: boolean;
  works_team: boolean;
  prefer_same_clients: boolean;
  total_jobs: number;
  avg_rating: number;
  total_ratings: number;
  total_earned: number;
  member_since: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  area: string;
  lat: number | null;
  lng: number | null;
  floor: number | null;
  sqm: number | null;
  has_elevator: boolean;
  has_pets: boolean;
  pet_type: PetType | null;
  has_own_materials: boolean;
  special_notes: string | null;
  total_bookings: number;
  avg_rating_given: number;
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  cleaner_id: string | null;
  job_type: JobType;
  booking_type: BookingType;
  recurring_freq: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  address: string;
  area: string;
  sqm: number | null;
  has_elevator: boolean;
  has_pets: boolean;
  pet_type: PetType | null;
  materials: string;
  special_notes: string | null;
  pay_amount: number;
  pay_per_hour: number | null;
  status: JobStatus;
  match_score: number | null;
  distance_km: number | null;
  travel_time_min: number | null;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  customer?: Customer;
  ratings?: Rating[];
}

export interface JobMatch {
  id: string;
  job_id: string;
  cleaner_id: string;
  match_score: number;
  distance_ok: boolean;
  job_type_ok: boolean;
  time_ok: boolean;
  elevator_ok: boolean;
  pets_ok: boolean;
  materials_ok: boolean;
  client_rating_ok: boolean;
  distance_km: number | null;
  travel_time_min: number | null;
  presented: boolean;
  response: "accepted" | "declined" | "auto_declined" | "expired" | null;
  responded_at: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  job_id: string;
  cleaner_id: string;
  customer_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  cleaner_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  job_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface BlockedTime {
  id: string;
  cleaner_id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  reason: BlockReason;
  notes: string | null;
  created_at: string;
}

// ── Settings Models ──

export interface CleanerAvailability {
  cleaner_id: string;
  day_mon: boolean;
  day_tue: boolean;
  day_wed: boolean;
  day_thu: boolean;
  day_fri: boolean;
  day_sat: boolean;
  day_sun: boolean;
  start_time: string;
  end_time: string;
  evenings_ok: boolean;
  weekends_ok: boolean;
  max_jobs_per_day: number;
  max_hours_per_day: number;
  break_between_min: number;
  min_lead_time_hours: number;
  min_job_length_hours: number;
  preferred_start_time: string;
}

export interface CleanerZones {
  cleaner_id: string;
  max_radius_km: number;
}

export interface CleanerPreferredZone {
  cleaner_id: string;
  zone_name: string;
  priority: number;
}

export interface CleanerJobType {
  cleaner_id: string;
  job_type: JobType;
  enabled: boolean;
}

export interface CleanerPetPref {
  cleaner_id: string;
  pet_type: PetType;
  allowed: boolean;
}

export interface EarningsSummary {
  id: string;
  cleaner_id: string;
  period_type: "week" | "month";
  period_start: string;
  period_end: string;
  total_earned: number;
  total_jobs: number;
  total_hours: number;
  avg_per_hour: number;
  avg_rating: number;
  hem_jobs: number;
  hem_earned: number;
  flytt_jobs: number;
  flytt_earned: number;
  stor_jobs: number;
  stor_earned: number;
  kontor_jobs: number;
  kontor_earned: number;
  created_at: string;
}

export interface CleanerCustomerRelation {
  cleaner_id: string;
  customer_id: string;
  total_jobs: number;
  total_earned: number;
  avg_rating: number;
  first_job_at: string | null;
  last_job_at: string | null;
  is_recurring: boolean;
  customer?: Customer;
}

// ── Composite/View Types ──

export interface MatchedJob extends Job {
  customer_name: string;
  customer_area: string;
  customer_elevator: boolean;
  customer_pets: boolean;
  customer_pet_type: PetType | null;
  customer_materials: boolean;
  customer_notes: string | null;
  customer_total_bookings: number;
  customer_avg_rating: number;
  match_score: number;
  match_distance: number;
  match_travel_time: number;
  distance_ok: boolean;
  job_type_ok: boolean;
  time_ok: boolean;
  elevator_ok: boolean;
  pets_ok: boolean;
  materials_ok: boolean;
  client_rating_ok: boolean;
}

export interface DashboardData {
  cleaner: Pick<Cleaner, "first_name" | "avg_rating" | "total_jobs" | "total_earned">;
  today_jobs: (Job & { customer: Customer })[];
  available_jobs: MatchedJob[];
  week_stats: WeekStats;
  notifications: Notification[];
  unread_count: number;
}

export interface WeekStats {
  earned: number;
  jobs: number;
  hours: number;
  avg_per_hour: number;
}

export interface AllSettings {
  cleaner: Cleaner;
  availability: CleanerAvailability;
  zones: CleanerZones;
  preferred_zones: CleanerPreferredZone[];
  job_types: CleanerJobType[];
  pet_prefs: CleanerPetPref[];
  languages: string[];
  skills: string[];
  avoid_types: string[];
  accepts_recurring: boolean;
  accepts_one_time: boolean;
}

// ── Onboarding Data ──

export interface OnboardingData {
  profile: {
    first_name: string;
    languages: string[];
    experience: ExperienceLevel;
    skills: string[];
  };
  availability: {
    days: Record<string, boolean>;
    start_time: string;
    end_time: string;
    max_jobs: number;
    break_min: number;
  };
  area: {
    address: string;
    lat?: number;
    lng?: number;
    max_radius: number;
    zones: string[];
  };
  job_types: {
    types: string[];
    booking_types: string[];
  };
  conditions: {
    elevator: ElevatorPref;
    pets: PetPref;
    pet_types?: Record<PetType, boolean>;
    materials: MaterialPref;
  };
  economy: {
    min_pay: number;
    min_pay_per_hour: number;
  };
}

// ── UI Helper Types ──

export type MatchLevel = "top" | "good" | "ok" | "weak";

export function getMatchLevel(score: number): MatchLevel {
  if (score >= 90) return "top";
  if (score >= 75) return "good";
  if (score >= 60) return "ok";
  return "weak";
}

export const JOB_TYPE_CONFIG: Record<JobType, { label: string; emoji: string; color: string }> = {
  hemstadning: { label: "Hemstädning", emoji: "🏠", color: "#2D9F83" },
  flyttstadning: { label: "Flyttstädning", emoji: "📦", color: "#E07B4C" },
  storstadning: { label: "Storstädning", emoji: "✨", color: "#7B68D9" },
  kontorsstadning: { label: "Kontorsstädning", emoji: "🏢", color: "#4C8FE0" },
};

export const STOCKHOLM_ZONES = [
  "Vasastan", "Kungsholmen", "Östermalm", "Norrmalm", "Södermalm",
  "City", "Hägersten", "Bromma", "Solna", "Sundbyberg",
  "Lidingö", "Nacka", "Hammarby", "Gärdet", "Djurgården",
] as const;

export const LANGUAGES = [
  "Svenska", "Engelska", "Arabiska", "Persiska", "Spanska",
  "Polska", "Somaliska", "Tigrinja", "Turkiska",
] as const;

export const SKILLS = [
  "Fönsterputs", "Strykning", "Ekologiska produkter",
  "Allergivänlig städning", "Golvvård", "Balkong/uteplats",
  "Garderober & förråd", "Tvätthantering",
] as const;
