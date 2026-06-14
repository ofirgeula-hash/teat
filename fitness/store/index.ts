'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkoutType,
  Location,
  LocationWorkoutPlan,
  PlanExercise,
  PlanSet,
  WorkoutSession,
  SessionSet,
  BodyWeightLog,
  AppSettings,
  WorkoutNote,
  EquipmentType,
  ExerciseLibraryItem,
} from '@/types';

interface AppState {
  workoutTypes: WorkoutType[];
  locations: Location[];
  locationPlans: LocationWorkoutPlan[];
  sessions: WorkoutSession[];
  bodyWeightLogs: BodyWeightLog[];
  settings: AppSettings;
  activeSession: WorkoutSession | null;
  workoutNotes: WorkoutNote[];
  exerciseLibrary: ExerciseLibraryItem[];

  addWorkoutType: (wt: WorkoutType) => void;
  updateWorkoutType: (id: string, updates: Partial<WorkoutType>) => void;
  deleteWorkoutType: (id: string) => void;

  addLocation: (location: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  upsertPlan: (locationId: string, workoutTypeId: string, exercises: PlanExercise[]) => void;

  startSession: (workoutTypeId: string, locationId: string) => void;
  addSet: (set: Omit<SessionSet, 'id' | 'completedAt'>) => void;
  updateSet: (setId: string, updates: Partial<SessionSet>) => void;
  removeSet: (setId: string) => void;
  finishSession: () => void;
  cancelSession: () => void;

  addBodyWeight: (log: BodyWeightLog) => void;
  deleteBodyWeight: (id: string) => void;

  updateSettings: (updates: Partial<AppSettings>) => void;

  addWorkoutNote: (note: WorkoutNote) => void;
  updateWorkoutNote: (id: string, updates: Partial<WorkoutNote>) => void;
  deleteWorkoutNote: (id: string) => void;

  addExerciseLibraryItem: (item: ExerciseLibraryItem) => void;
  updateExerciseLibraryItem: (id: string, updates: Partial<ExerciseLibraryItem>) => void;
  deleteExerciseLibraryItem: (id: string) => void;
}

function s(reps: number, weight: number, rest: number): PlanSet {
  return { reps, weight, restSeconds: rest };
}

function s3(r: number, w: number, rest: number): PlanSet[] {
  return [s(r, w, rest), s(r, w, rest), s(r, w, rest)];
}

function ex(
  id: string,
  name: string,
  equipment: EquipmentType[],
  notes: string[],
  sets: PlanSet[],
  variantsOrMuscle?: PlanExercise['variants'] | import('@/types').MuscleGroup,
  muscle?: import('@/types').MuscleGroup,
): PlanExercise {
  const variants = typeof variantsOrMuscle === 'object' ? variantsOrMuscle : undefined;
  const muscleGroup = typeof variantsOrMuscle === 'string' ? variantsOrMuscle : muscle;
  return { id, name, equipment, notes, sets, ...(variants ? { variants } : {}), ...(muscleGroup ? { muscleGroup } : {}) };
}

const defaultWorkoutTypes: WorkoutType[] = [
  { id: 'wt1', name: 'חזה + יד אחורית', emoji: '💪', color: '#3b82f6' },
  { id: 'wt2', name: 'גב + יד קדמית', emoji: '🦾', color: '#10b981' },
  { id: 'wt3', name: 'כתפיים', emoji: '🏔️', color: '#f59e0b' },
  { id: 'wt4', name: 'רגליים + בטן', emoji: '🦵', color: '#ef4444' },
];

const defaultLocations: Location[] = [
  { id: 'loc1', name: 'פרופיט נס ציונה' },
  { id: 'loc2', name: 'בית' },
];

// ─── Plan data for loc1 (פרופיט נס ציונה) ────────────────────────────────────

const loc1Plans: LocationWorkoutPlan[] = [
  {
    locationId: 'loc1', workoutTypeId: 'wt1',
    exercises: [
      ex('l1w1e1', 'פרפר במכונה', ['machine'], [], [
        s(8, 68, 90), s(6, 64, 90), s(8, 59, 90),
      ], 'chest'),
      ex('l1w1e2', 'לחיצת חזה שיפוע עליון בסמית', ['machine'],
        ['30 מעלות - להחזיק \\ /', 'https://vt.tiktok.com/ZSxGpSMxe - ממליץ לעבור לסמית'],
        [s(12, 20, 90), s(8, 22.5, 90), s(6, 22.5, 90)], 'chest',
      ),
      ex('l1w1e3', 'מקבילים', ['machine'],
        ['שיפוע גוף קדימה', 'מרפקים פונים לצדדים. לדחוף גב למעלה. רגליים אחורה. לדחוס בטן פנימה.'],
        [s(9, 0, 90), s(9, 0, 90), s(7, 0, 90)], 'chest',
      ),
      ex('l1w1e4', 'חזה עליון בסמית', ['machine'],
        ['מיקום כיסא בשביל 45 מעלות זרוע-גוף', 'בנסצי על 10-15'],
        [s(9, 15, 90), s(10, 15, 90), s(7, 15, 90)], 'chest',
      ),
      ex('l1w1e5', 'פולי עליון עם חבל', ['machine'], [],
        [s(8, 17.5, 60), s(7, 17.5, 60), s(6, 17.5, 60)], 'chest',
      ),
      ex('l1w1e6', 'פשיטת מרפקים מעבר לראש בפולי עם חבל', ['machine'],
        ['גובה אמצע המכשיר'],
        [s(10, 7.5, 60), s(14, 7.5, 60), s(8, 10, 60)], 'triceps',
      ),
      ex('l1w1e7', 'פולי עליון עם מוט', ['machine'], [],
        [s(8, 22, 90), s(7, 22, 90), s(8, 20, 90)], 'triceps',
      ),
    ],
  },
  {
    locationId: 'loc1', workoutTypeId: 'wt2',
    exercises: [
      ex('l1w2e1', 'מתח', ['machine'], ['עד כשל'],
        [s(10, 0, 90), s(8, 0, 90), s(6, 0, 90)], 'back',
      ),
      ex('l1w2e2', 'טי-באר', ['plates'],
        ['https://vt.tiktok.com/ZSxEdLCy6/', '2 סטים טווח תנועה מלא (45 קג), 2 סטים טווח חלקי (25 קג)', 'https://vt.tiktok.com/ZSxoMg2b6/'],
        [s(10, 45, 90), s(10, 45, 90), s(10, 25, 90), s(10, 25, 90)], 'back',
      ),
      ex('l1w2e3', 'חתירה בישיבה - מכונה', ['machine'],
        ['כף היד פונה מטה. מרחק כיסא 7 (נסצי)', 'זוית 45-60 בין הגוף ליד', 'להיות זקוף, חזה בולט', 'תחילת תנועה שכמות מתוחות, בסוף - כיווץ'],
        [s(12, 55, 90), s(10, 55, 90), s(9, 55, 90)], 'back',
      ),
      ex('l1w2e4', 'חתירה יד-יד עם פלטות', ['plates'],
        ['בנסצי - כיסא הכי גבוה, היד מושכת מהמרפק', 'חזה בחוץ, הגוף יציב ולא מסתובב'],
        [s(15, 30, 90), s(17, 30, 90), s(15, 30, 90)], 'back',
      ),
      ex('l1w2e5', 'כפיפות לגב תחתון', ['machine'],
        ['גובה המכשיר ממש על המותן', 'https://vt.tiktok.com/ZSxooXsDj/'],
        [s(12, 0, 60), s(12, 5, 60), s(12, 10, 60)], 'back',
      ),
      ex('l1w2e6', 'כפיפות בפריצר', ['plates', 'machine'],
        ['עם משקולת יד: להתחיל עם 12.5', 'טווח תנועה: מכמעט ישור מלא, ועד כיווץ חזק'],
        [],
        {
          plates: { notes: [], sets: [s(10, 30, 60), s(9, 30, 60), s(8, 30, 60)] },
          machine: { notes: [], sets: [s(12, 36, 60), s(12, 36, 60), s(12, 36, 60)] },
        },
        'biceps',
      ),
      ex('l1w2e7', 'כפיפת יד-יד בפולי תחתון', ['machine'],
        ['ידית יוצאת מפולי תחתון, מרפק מאחורי הגוף', 'בנסצי - להתחיל ממשקל 3'],
        [s(10, 9, 60), s(12, 14, 60), s(10, 14, 60)], 'biceps',
      ),
      ex('l1w2e8', 'פטישים בישיבה', ['dumbbells'], [],
        [s(10, 10, 60), s(8, 10, 60)], 'biceps',
      ),
    ],
  },
  {
    locationId: 'loc1', workoutTypeId: 'wt3',
    exercises: [
      ex('l1w3e1', 'לחיצת כתף בישיבה', ['machine'],
        ['https://vt.tiktok.com/ZSxcGrcRx/', 'גובה מושב - 75 מעלות (חור שני מלמטה)'],
        [s(8, 20, 90), s(9, 17.5, 90), s(8, 17.5, 90)], 'shoulders',
      ),
      ex('l1w3e2', 'הרחקת כתפיים עם דאמבלים', ['dumbbells'], [],
        [s(13, 8, 60), s(10, 8, 60), s(8, 8, 60)], 'shoulders',
      ),
      ex('l1w3e3', 'כתף אחורית בפרפר', ['machine'],
        ['https://vt.tiktok.com/ZSxWfab7e/', 'מרפק מוביל'],
        [s(10, 41, 90), s(10, 41, 90), s(8, 41, 90)], 'rear_delts',
      ),
      ex('l1w3e4', 'טרפזים', ['dumbbells'],
        ['משיכה של הכתפיים אנכית בלבד', 'עם רצועות בסט 2/3', 'להעלות משקל!'],
        [s(22, 25, 60), s(18, 25, 60), s(15, 25, 60)], 'traps',
      ),
      ex('l1w3e5', 'לחיצת כתפיים בסמית', ['machine'],
        ['אפשר מכונה אם תפוס. משקל 36', 'סוף הכיסא עוקב בעובי רגל את הקרוס', 'משקל = כל צד'],
        [s(7, 15, 90), s(8, 12.5, 90), s(7, 12.5, 90)], 'shoulders',
      ),
    ],
  },
  {
    locationId: 'loc1', workoutTypeId: 'wt4',
    exercises: [
      ex('l1w4e1', 'פשיטת רגליים במכונה', ['machine'], [],
        [s(12, 82, 90), s(11, 82, 90), s(10, 82, 90)], 'quads',
      ),
      ex('l1w4e2', 'פרונט סקוואט בסמית', ['machine'],
        ['משקל לכל צד (פלטות) - התחלתי ב-5, עברתי ל-7.5. לעשות חימום!'],
        [s(11, 17.5, 120), s(10, 20, 120), s(9, 20, 120)], 'quads',
      ),
      ex('l1w4e3', 'מכרעיים עם משקולות', ['dumbbells'], [],
        [s(10, 15, 90), s(10, 15, 90)], 'quads',
      ),
      ex('l1w4e4', 'כפיפת רגליים במכונה', ['plates'], ['פרופיט/מיקדו'],
        [s(12, 16.25, 90), s(12, 16.25, 90), s(12, 16.25, 90)], 'hamstrings',
      ),
      ex('l1w4e5', 'סגירת רגליים במכונה', ['machine'], [],
        [s(12, 36, 60), s(13, 41, 60)], 'adductors',
      ),
      ex('l1w4e6', 'מכשיר תאומים בישיבה', ['plates'], ['המשקל = פלטות'],
        [s(15, 22.5, 60), s(12, 20, 60), s(12, 20, 60)], 'calves',
      ),
      ex('l1w4e7', 'כפיפות בטן', [], [],
        [s(12, 0, 60), s(12, 0, 60), s(12, 0, 60)], 'abs',
      ),
    ],
  },
];

const defaultPlans: LocationWorkoutPlan[] = [
  ...loc1Plans,
  {
    locationId: 'loc2', workoutTypeId: 'wt1',
    exercises: [
      ex('l2w1e1', 'שכיבות סמיכה', [], [], s3(15, 0, 60), 'chest'),
      ex('l2w1e2', 'שכיבות סמיכה צרות (טריצפס)', [], [], s3(12, 0, 60), 'triceps'),
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt2',
    exercises: [
      ex('l2w2e1', 'מתח', [], [], s3(8, 0, 90), 'back'),
      ex('l2w2e2', 'כפיפת יד עם משקולות', [], [], s3(12, 10, 60), 'biceps'),
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt3',
    exercises: [
      ex('l2w3e1', 'לחיצת כתפיים במשקולות', [], [], s3(12, 10, 60), 'shoulders'),
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt4',
    exercises: [
      ex('l2w4e1', 'סקוואט', [], [], s3(15, 0, 90), 'quads'),
      ex('l2w4e2', "לאנג'", [], [], s3(12, 0, 60), 'quads'),
    ],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      workoutTypes: defaultWorkoutTypes,
      locations: defaultLocations,
      locationPlans: defaultPlans,
      sessions: [],
      bodyWeightLogs: [],
      activeSession: null,
      settings: { defaultRestSeconds: 90 },
      workoutNotes: [],
      exerciseLibrary: [],

      addWorkoutType: (wt) => set((s) => ({ workoutTypes: [...s.workoutTypes, wt] })),
      updateWorkoutType: (id, updates) =>
        set((s) => ({ workoutTypes: s.workoutTypes.map((w) => (w.id === id ? { ...w, ...updates } : w)) })),
      deleteWorkoutType: (id) =>
        set((s) => ({ workoutTypes: s.workoutTypes.filter((w) => w.id !== id) })),

      addLocation: (location) => set((s) => ({ locations: [...s.locations, location] })),
      updateLocation: (id, updates) =>
        set((s) => ({ locations: s.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),
      deleteLocation: (id) =>
        set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),

      upsertPlan: (locationId, workoutTypeId, exercises) =>
        set((s) => {
          const existing = s.locationPlans.find(
            (p) => p.locationId === locationId && p.workoutTypeId === workoutTypeId
          );
          if (existing) {
            return {
              locationPlans: s.locationPlans.map((p) =>
                p.locationId === locationId && p.workoutTypeId === workoutTypeId
                  ? { ...p, exercises }
                  : p
              ),
            };
          }
          return { locationPlans: [...s.locationPlans, { locationId, workoutTypeId, exercises }] };
        }),

      startSession: (workoutTypeId, locationId) => {
        const session: WorkoutSession = {
          id: crypto.randomUUID(),
          workoutTypeId,
          locationId,
          startedAt: new Date().toISOString(),
          endedAt: null,
          sets: [],
          notes: '',
        };
        set({ activeSession: session });
      },

      addSet: (setData) => {
        const newSet: SessionSet = {
          ...setData,
          id: crypto.randomUUID(),
          completedAt: new Date().toISOString(),
        };
        set((s) => ({
          activeSession: s.activeSession
            ? { ...s.activeSession, sets: [...s.activeSession.sets, newSet] }
            : null,
        }));
      },

      updateSet: (setId, updates) =>
        set((s) => ({
          activeSession: s.activeSession
            ? {
                ...s.activeSession,
                sets: s.activeSession.sets.map((st) => (st.id === setId ? { ...st, ...updates } : st)),
              }
            : null,
        })),

      removeSet: (setId) =>
        set((s) => ({
          activeSession: s.activeSession
            ? { ...s.activeSession, sets: s.activeSession.sets.filter((st) => st.id !== setId) }
            : null,
        })),

      finishSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        const finished = { ...activeSession, endedAt: new Date().toISOString() };
        set((s) => ({ sessions: [finished, ...s.sessions], activeSession: null }));
      },

      cancelSession: () => set({ activeSession: null }),

      addBodyWeight: (log) =>
        set((s) => ({
          bodyWeightLogs: [...s.bodyWeightLogs, log].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        })),
      deleteBodyWeight: (id) =>
        set((s) => ({ bodyWeightLogs: s.bodyWeightLogs.filter((l) => l.id !== id) })),

      updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),

      addWorkoutNote: (note) => set((s) => ({ workoutNotes: [note, ...s.workoutNotes] })),
      updateWorkoutNote: (id, updates) =>
        set((s) => ({
          workoutNotes: s.workoutNotes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
      deleteWorkoutNote: (id) =>
        set((s) => ({ workoutNotes: s.workoutNotes.filter((n) => n.id !== id) })),

      addExerciseLibraryItem: (item) =>
        set((s) => ({ exerciseLibrary: [...s.exerciseLibrary, item] })),
      updateExerciseLibraryItem: (id, updates) =>
        set((s) => ({
          exerciseLibrary: s.exerciseLibrary.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteExerciseLibraryItem: (id) =>
        set((s) => ({ exerciseLibrary: s.exerciseLibrary.filter((e) => e.id !== id) })),
    }),
    {
      name: 'fitness-store-v2',
      version: 5,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as AppState;

        // v0→v1: normalize notes from string to string[]
        if (version < 1) {
          state.locationPlans = (state.locationPlans ?? []).map((plan) => ({
            ...plan,
            exercises: (plan.exercises ?? []).map((exItem) => ({
              ...exItem,
              notes: Array.isArray(exItem.notes)
                ? exItem.notes
                : exItem.notes
                ? [exItem.notes as unknown as string]
                : [],
            })),
          }));
        }

        // v1→v2: rename workout types, rename loc1, replace loc1 plans, add equipment field
        if (version < 2) {
          const nameMap: Record<string, string> = {
            wt1: 'חזה + יד אחורית',
            wt2: 'גב + יד קדמית',
            wt3: 'כתפיים',
            wt4: 'רגליים + בטן',
          };
          state.workoutTypes = (state.workoutTypes ?? defaultWorkoutTypes).map((wt) =>
            nameMap[wt.id] ? { ...wt, name: nameMap[wt.id] } : wt
          );

          state.locations = (state.locations ?? defaultLocations).map((loc) =>
            loc.id === 'loc1' ? { ...loc, name: 'פרופיט נס ציונה' } : loc
          );

          const loc2Plans = (state.locationPlans ?? []).filter((p) => p.locationId !== 'loc1');
          state.locationPlans = [
            ...loc1Plans,
            ...loc2Plans.map((plan) => ({
              ...plan,
              exercises: plan.exercises.map((exItem) => ({
                ...exItem,
                equipment: exItem.equipment ?? ([] as import('@/types').EquipmentType[]),
              })),
            })),
          ];

          state.workoutNotes = state.workoutNotes ?? [];
        }

        // v2→v3: ensure every exercise has notes:[] (guards against undefined from old toggleEquipment code)
        if (version < 3) {
          state.locationPlans = (state.locationPlans ?? []).map((plan) => ({
            ...plan,
            exercises: (plan.exercises ?? []).map((exItem) => ({
              ...exItem,
              notes: Array.isArray(exItem.notes) ? exItem.notes : [],
            })),
          }));
        }

        // v3→v4: backfill muscleGroup on known exercise IDs
        if (version < 4) {
          const muscleMap: Record<string, import('@/types').MuscleGroup> = {
            l1w1e1: 'chest', l1w1e2: 'chest', l1w1e3: 'chest', l1w1e4: 'chest',
            l1w1e5: 'chest', l1w1e6: 'triceps', l1w1e7: 'triceps',
            l1w2e1: 'back', l1w2e2: 'back', l1w2e3: 'back', l1w2e4: 'back',
            l1w2e5: 'back', l1w2e6: 'biceps', l1w2e7: 'biceps', l1w2e8: 'biceps',
            l1w3e1: 'shoulders', l1w3e2: 'shoulders', l1w3e3: 'rear_delts',
            l1w3e4: 'traps', l1w3e5: 'shoulders',
            l1w4e1: 'quads', l1w4e2: 'quads', l1w4e3: 'quads',
            l1w4e4: 'hamstrings', l1w4e5: 'adductors', l1w4e6: 'calves', l1w4e7: 'abs',
            l2w1e1: 'chest', l2w1e2: 'triceps',
            l2w2e1: 'back', l2w2e2: 'biceps',
            l2w3e1: 'shoulders',
            l2w4e1: 'quads', l2w4e2: 'quads',
          };
          state.locationPlans = (state.locationPlans ?? []).map((plan) => ({
            ...plan,
            exercises: (plan.exercises ?? []).map((exItem) => ({
              ...exItem,
              muscleGroup: exItem.muscleGroup ?? muscleMap[exItem.id],
            })),
          }));
        }

        // v4→v5: add exerciseLibrary
        if (version < 5) {
          state.exerciseLibrary = state.exerciseLibrary ?? [];
        }

        return state;
      },
    }
  )
);

export function getLastSessionSets(
  sessions: WorkoutSession[],
  workoutTypeId: string,
  exerciseId: string,
  equipment?: import('@/types').EquipmentType,
): SessionSet[] {
  const last = sessions.find((s) => s.workoutTypeId === workoutTypeId && s.endedAt);
  if (!last) return [];
  return last.sets.filter(
    (s) => s.exerciseId === exerciseId && (!equipment || s.equipment === equipment)
  );
}

export function calcVolume(sets: SessionSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}
