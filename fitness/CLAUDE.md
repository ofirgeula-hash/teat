@AGENTS.md

# Fitness Tracker — Project Context

## What this is
Personal fitness PWA for iPhone use. Deployed at `teat-flax.vercel.app`.
Monorepo: shopping-list app at repo root (GitHub Pages), fitness app in `fitness/` subdirectory.
GitHub: `ofirgeula-hash/teat`, deploy branch: `main` (auto-deploys to Vercel).

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS (dark theme, RTL Hebrew)
- Zustand with `persist` middleware (localStorage key: `'fitness-store-v2'`)
- Recharts for graphs, Lucide icons
- All state is localStorage only — no backend

## Key paths
- `fitness/types/index.ts` — all TypeScript types
- `fitness/store/index.ts` — Zustand store + helper functions
- `fitness/app/page.tsx` — Home (4 workout type cards)
- `fitness/app/workout/[id]/page.tsx` — Active workout (id = workoutTypeId)
- `fitness/app/settings/page.tsx` — Settings (Plan + General tabs)
- `fitness/app/analytics/page.tsx` — Charts
- `fitness/components/BottomNav.tsx` — 3 tabs: Home, Charts, Settings
- `fitness/components/RestTimer.tsx` — Rest timer overlay

## Data model (V2)

```typescript
WorkoutType { id, name, emoji, color }               // 4 global types
Location    { id, name }                              // gym / home
LocationWorkoutPlan { locationId, workoutTypeId, exercises: PlanExercise[] }
PlanExercise { id, name, notes: string[], sets: PlanSet[] }
PlanSet      { reps, weight, restSeconds }
WorkoutSession { id, workoutTypeId, locationId, startedAt, endedAt, sets[], notes }
SessionSet { id, exerciseId, exerciseName, setNumber, weight, reps, rpe, completedAt }
BodyWeightLog { id, date, weightKg }
AppSettings { defaultRestSeconds }
```

## Workout flow
1. Home: tap a workout type card → navigate to `/workout/${workoutTypeId}`
2. Workout page: session starts automatically with first location
3. Location toggle at top (chips) changes which exercises are shown
4. Each exercise: notes textarea (auto-saves on blur via `upsertPlan`), set rows (weight/reps/RPE/checkmark)
5. After checkmark: RestTimer overlay
6. "סיים אימון" → `finishSession()` → navigate to `/`

## Store actions
- workoutTypes: add/update/delete
- locations: add/update/delete  
- `upsertPlan(locationId, workoutTypeId, exercises[])` — create or replace plan
- sessions: startSession / addSet / finishSession / cancelSession
- bodyWeightLogs: add/delete
- updateSettings

## Vercel build settings (monorepo override)
- Build Command: `cd fitness && npm run build`
- Output Directory: `fitness/.next`
- Install Command: `cd fitness && npm install`
