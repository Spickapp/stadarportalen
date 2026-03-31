# Spick Städarportalen

Städarportalen är Spicks portal för städare – designad helt ur städarens perspektiv med fokus på trygghet, lönsamhet och kontroll.

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Typografi:** Fraunces (rubriker) + DM Sans (brödtext)
- **Analytics:** PostHog
- **Felspårning:** Sentry
- **Tester:** Playwright

## Kom igång

### Förutsättningar

- Node.js 18.17+
- npm eller yarn
- Supabase CLI (`npm install -g supabase`)
- Ett Supabase-projekt (gratis på supabase.com)

### 1. Klona och installera

```bash
git clone https://github.com/spick/stadarportalen.git
cd stadarportalen
npm install
```

### 2. Sätt upp miljövariabler

```bash
cp .env.example .env.local
```

Fyll i dina Supabase-uppgifter i `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` – Finns under Settings → API i Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key (hemlig!)

### 3. Sätt upp databasen

```bash
# Länka till ditt Supabase-projekt
supabase link --project-ref YOUR_PROJECT_REF

# Kör databasschema
psql $DATABASE_URL -f stadarportalen-database-schema.sql

# Kör cron-jobb setup
psql $DATABASE_URL -f stadarportalen-cron-jobs.sql

# Ladda testdata
psql $DATABASE_URL -f stadarportalen-seed-data.sql
```

Alternativt via Supabase SQL Editor – klistra in och kör filerna i ordning.

### 4. Deploya Edge Functions

```bash
supabase functions deploy accept-job
supabase functions deploy decline-job
supabase functions deploy complete-onboarding
supabase functions deploy recalculate-matches
supabase functions deploy update-settings
supabase functions deploy send-notification
```

### 5. Starta utvecklingsservern

```bash
npm run dev
```

Öppna http://localhost:3000

## Projektstruktur

```
src/
├── components/
│   ├── ui/           # Bas-komponenter (Button, Card, Badge, Toggle, Slider...)
│   ├── layout/       # Shell, TopBar, BottomNav, PageContainer
│   ├── dashboard/    # Dashboard-specifika komponenter
│   ├── jobs/         # Jobbmatchning-komponenter (JobCard, FilterPanel...)
│   ├── calendar/     # Kalender-komponenter (WeekGrid, DayView, BlockModal...)
│   ├── settings/     # Inställnings-sektioner
│   ├── earnings/     # Historik & Ekonomi-komponenter
│   └── onboarding/   # Wizard-steg
├── pages/            # Next.js pages (eller app/ om App Router)
│   ├── index.tsx     # → Dashboard
│   ├── jobs.tsx      # → Jobbmatchning
│   ├── calendar.tsx  # → Kalender
│   ├── earnings.tsx  # → Historik & Ekonomi
│   ├── settings.tsx  # → Inställningar
│   └── onboarding.tsx
├── hooks/
│   └── index.ts      # Alla custom hooks (useAuth, useDashboard, useJobs...)
├── lib/
│   └── supabase.ts   # Supabase client & helpers
├── types/
│   └── index.ts      # Alla TypeScript types
├── utils/
│   ├── analytics.ts  # PostHog event tracking
│   └── helpers.ts    # cn(), formatCurrency(), etc.
└── styles/
    └── globals.css   # Tailwind + font imports
```

## Designsystem

Se `stadarportalen-designsystem.jsx` för interaktiv komponentkatalog.

### Färger
| Token | Hex | Användning |
|-------|-----|------------|
| `spick` | #2D9F83 | Primär – CTA, accept, positiva |
| `spick-dark` | #1A6B57 | Rubriker, gradienter |
| `job-hem` | #2D9F83 | Hemstädning |
| `job-flytt` | #E07B4C | Flyttstädning |
| `job-stor` | #7B68D9 | Storstädning |
| `job-kontor` | #4C8FE0 | Kontorsstädning |

### Typografi
- **Rubriker:** `font-display` (Fraunces, serif)
- **Brödtext:** `font-sans` (DM Sans)
- **Kod:** `font-mono` (DM Mono)

## Scripts

```bash
npm run dev          # Utvecklingsserver
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript kontroll
npm run test         # Playwright E2E-tester
npm run db:reset     # Nollställ databas
npm run db:seed      # Ladda testdata
```

## Dokumentation

| Fil | Innehåll |
|-----|----------|
| `stadarportalen-ux-spec.docx` | Komplett UX-specifikation |
| `stadarportalen-api-spec.md` | API-endpoints & Edge Functions |
| `stadarportalen-testspec.md` | 156 tester, 51 kritiska |
| `stadarportalen-database-schema.sql` | Databasschema |
| `stadarportalen-seed-data.sql` | Testdata |
| `stadarportalen-cron-jobs.sql` | Schemalagda jobb |
| `stadarportalen-edge-functions.ts` | Serverless funktioner |

## Prototyper

Öppna `.jsx`-filerna i Claude.ai artifacts för interaktiva prototyper:
- `stadarportalen-komplett-app.jsx` – Hela appen (desktop)
- `stadarportalen-mobil.jsx` – Mobilversion
- Se individuella vyer för detaljerade interaktioner
