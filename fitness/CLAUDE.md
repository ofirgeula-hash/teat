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
- `fitness/data/exerciseCatalog.ts` — bundled, static catalog (~70 exercises) used to seed the exercise library with auto-filled metadata, no API key needed
- `fitness/app/page.tsx` — Home (4 workout type cards)
- `fitness/app/workout/[id]/page.tsx` — Active workout (id = workoutTypeId)
- `fitness/app/settings/page.tsx` — Settings (כללי/General + תרגילים/Exercises tabs)
- `fitness/app/analytics/page.tsx` — Charts
- `fitness/components/BottomNav.tsx` — 3 tabs: Home, Charts, Settings
- `fitness/components/RestTimer.tsx` — Rest timer overlay
- `fitness/components/ExerciseListPicker.tsx` — shared full-screen search/grouped-by-muscle picker, used both for browsing the exercise library (in-workout "add exercise") and the built-in catalog (Settings → תרגילים)

## Data model (V2)

```typescript
WorkoutType { id, name, emoji, color }               // 4 global types
Location    { id, name }                              // gym / home
LocationWorkoutPlan { locationId, workoutTypeId, exercises: PlanExercise[] }
PlanExercise { id, name, notes: string[], sets: PlanSet[], equipment, muscleGroup?, libraryId? }
PlanSet      { reps, weight, restSeconds }
WorkoutSession { id, workoutTypeId, locationId, startedAt, endedAt, sets[], notes }
SessionSet { id, exerciseId, exerciseName, setNumber, weight, reps, rpe, completedAt }
BodyWeightLog { id, date, weightKg }
AppSettings { defaultRestSeconds, workoutXApiKey? }
ExerciseLibraryItem { id, name, nameHe?, muscleGroup?, subMuscle?, equipment, gifUrl?, instructions?, keyPoints? }
```

`exerciseLibrary: ExerciseLibraryItem[]` is the user's personal exercise bank (Settings →
תרגילים tab). It can be grown three ways: manual entry, importing exercises already used
in existing plans, or one-tap copying an entry from the bundled `EXERCISE_CATALOG`
(`fitness/data/exerciseCatalog.ts`) — the catalog entry's fields (name, muscle group,
equipment, key cues) are copied in as-is, with a fresh id; it is not a live link. An
optional WorkoutX API key (Settings → General) can additionally auto-fetch a `gifUrl`
for any library item, but the catalog itself never depends on that API.

## Workout flow
1. Home: tap a workout type card → navigate to `/workout/${workoutTypeId}`
2. Workout page: session starts automatically with first location
3. Location toggle at top (chips) changes which exercises are shown
4. Each exercise: notes textarea (auto-saves on blur via `upsertPlan`), set rows (weight/reps/RPE/checkmark)
5. After checkmark: RestTimer overlay
6. "סיים אימון" → `finishSession()` → navigate to `/`
7. Adding an exercise to a plan (new or existing — same flow either way) happens via "add exercise" in edit mode, which opens `ExerciseListPicker` over `exerciseLibrary`

## Store actions
- workoutTypes: add/update/delete
- locations: add/update/delete  
- `upsertPlan(locationId, workoutTypeId, exercises[])` — create or replace plan
- sessions: startSession / addSet / finishSession / cancelSession
- bodyWeightLogs: add/delete
- exerciseLibrary: addExerciseLibraryItem / updateExerciseLibraryItem / deleteExerciseLibraryItem / `importExercisesFromPlans()` (dedupes by name against existing plans)
- updateSettings

## Git workflow (mandatory)
After every task: build → commit → push → open PR → squash-merge to main. Do all steps automatically without asking. Never leave work unmerged.

## Vercel build settings (monorepo override)
- Build Command: `cd fitness && npm run build`
- Output Directory: `fitness/.next`
- Install Command: `cd fitness && npm install`
