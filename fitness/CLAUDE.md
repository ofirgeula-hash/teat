@AGENTS.md

# Fitness Tracker — Project Context

## What this is
Personal fitness PWA for iPhone use. Deployed at `teat-flax.vercel.app`.
Monorepo: shopping-list app at repo root (GitHub Pages), fitness app in `fitness/` subdirectory.
GitHub: `ofirgeula-hash/teat`, deploy branch: `main` (auto-deploys to Vercel).

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4 (dark theme, RTL Hebrew)
- Zustand with `persist` middleware (localStorage key: `'fitness-store-v2'`)
- Recharts for graphs, Lucide icons
- Fonts self-hosted via `@fontsource` (Rubik for text, Barlow Condensed for numbers — `font-num`)
- Theme tokens in `app/globals.css` `@theme`: `ink`/`surface`/`surface-2`/`surface-3`/`line`/`muted`/`faint`,
  one accent `accent` (#ff6b1a). Text on accent fills is `text-ink` (white on orange fails contrast).
- localStorage is the source of truth; Firebase (same project as the shopping list) is an optional
  cloud backup — see "Backup" below

## Key paths
- `fitness/types/index.ts` — all TypeScript types
- `fitness/store/index.ts` — Zustand store + helper functions
- `fitness/data/exerciseCatalog.ts` — bundled, static catalog (~70 exercises) used to seed the exercise library with auto-filled metadata, no API key needed
- `fitness/app/page.tsx` — Home: weekly goal ring + streak, active-workout banner, workout type cards
- `fitness/app/workout/[id]/page.tsx` — Active workout (id = workoutTypeId): whole plan always listed,
  current exercise expanded with big weight/reps steppers and "previous time" per set
- `fitness/app/history/page.tsx`, `history/[id]` — past workouts; `summary/[id]` — shown after finishing.
  Both detail views render `components/SessionReport.tsx`
- `fitness/lib/stats.ts` — volume, previous sets (matched by exercise name), personal records, week streak
- `fitness/lib/cloudBackup.ts` + `components/BackupSync.tsx` + `components/CloudBackupCard.tsx` — Firebase backup
- `fitness/app/settings/page.tsx` — Settings (כללי/General + תרגילים/Exercises tabs)
- `fitness/app/analytics/page.tsx` — Charts
- `fitness/components/BottomNav.tsx` — 4 tabs: Home, History, Charts, Settings (hidden on `/workout`)
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
AppSettings { defaultRestSeconds, weeklyGoal?, workoutXApiKey? }
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
3. Location chips (shown when there are 2+ locations) change which exercises are shown
4. All exercises are listed; the current one is expanded. Defaults per set: weight carried from the
   previous set this session, else the last session's same set, else the plan. RPE is no longer collected.
5. Fixed bottom bar: "סיימתי סט" saves the selected set and advances; timer button opens RestTimer (manual)
6. "סיים אימון" → bottom sheet → `finishSession()` (returns the id, or null and discards an empty
   session) → `/summary/{id}`
7. Adding an exercise to a plan (new or existing — same flow either way) happens via "add exercise" in edit mode, which opens `ExerciseListPicker` over `exerciseLibrary`

## Backup
- File: Settings → "גיבוי לקובץ" exports/imports `exportData()` / `importData()` (all `BACKUP_KEYS`).
- Cloud: Google sign-in (Firebase Auth) → `fitness/{uid}` holds everything except sessions;
  `fitness/{uid}/sessions/{id}` holds each finished session. Changes auto-sync 3 s after they happen.
  A device that has never synced with an existing cloud copy must choose restore vs overwrite first.
- Sign-in uses this domain as `authDomain`, proxied to `shopping-list-db6a8.firebaseapp.com` by the
  `/__/auth` rewrites in `next.config.ts` (needed for iOS Safari / home-screen apps).
- Required Firebase setup (console, not code): Google provider enabled; `teat-flax.vercel.app` in
  Auth → Authorized domains; `https://teat-flax.vercel.app/__/auth/handler` as an authorized redirect
  URI on the Web OAuth client; Firestore rule
  `match /fitness/{uid}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == uid; }`

## Store actions
- workoutTypes: add/update/delete
- locations: add/update/delete  
- `upsertPlan(locationId, workoutTypeId, exercises[])` — create or replace plan
- sessions: startSession / addSet / updateSet / finishSession / cancelSession / deleteSession
- bodyWeightLogs: add/delete
- exerciseLibrary: addExerciseLibraryItem / updateExerciseLibraryItem / deleteExerciseLibraryItem / `importExercisesFromPlans()` (dedupes by name against existing plans)
- updateSettings
- `importData(data)` — replaces everything with a backup (file or cloud)

## Git workflow (mandatory)
After every task: build → commit → push → open PR → squash-merge to main. Do all steps automatically without asking. Never leave work unmerged.

## Vercel build settings
- The Vercel project's Root Directory is `fitness/`; the Next.js preset runs `npm install` and `next build` here.
- All Vercel config belongs in `fitness/vercel.json` — never at the repo root (see the root `CLAUDE.md`).
- `ignoreCommand` skips builds for commits that don't change `fitness/`.
