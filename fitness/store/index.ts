'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkoutType,
  Location,
  LocationWorkoutPlan,
  PlanExercise,
  WorkoutSession,
  SessionSet,
  BodyWeightLog,
  AppSettings,
} from '@/types';

interface AppState {
  workoutTypes: WorkoutType[];
  locations: Location[];
  locationPlans: LocationWorkoutPlan[];
  sessions: WorkoutSession[];
  bodyWeightLogs: BodyWeightLog[];
  settings: AppSettings;
  activeSession: WorkoutSession | null;

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
}

function s3(r: number, w: number, rest: number): import('@/types').PlanSet[] {
  return [
    { reps: r, weight: w, restSeconds: rest },
    { reps: r, weight: w, restSeconds: rest },
    { reps: r, weight: w, restSeconds: rest },
  ];
}

const defaultWorkoutTypes: WorkoutType[] = [
  { id: 'wt1', name: 'חזה + טריצפס', emoji: '💪', color: '#3b82f6' },
  { id: 'wt2', name: 'גב + ביצפס', emoji: '🦾', color: '#10b981' },
  { id: 'wt3', name: 'כתפיים', emoji: '🏔️', color: '#f59e0b' },
  { id: 'wt4', name: 'רגליים', emoji: '🦵', color: '#ef4444' },
];

const defaultLocations: Location[] = [
  { id: 'loc1', name: 'חדר כושר' },
  { id: 'loc2', name: 'בית' },
];

const defaultPlans: LocationWorkoutPlan[] = [
  {
    locationId: 'loc1', workoutTypeId: 'wt1',
    exercises: [
      { id: 'l1w1e1', name: 'לחיצת חזה', notes: '', sets: s3(10, 60, 90) },
      { id: 'l1w1e2', name: 'לחיצת חזה במשקולות', notes: '', sets: s3(12, 20, 60) },
      { id: 'l1w1e3', name: 'פשיטת חזה בכבלים', notes: '', sets: s3(15, 15, 60) },
      { id: 'l1w1e4', name: 'פשיטת יד בכבל (טריצפס)', notes: '', sets: s3(12, 30, 60) },
    ],
  },
  {
    locationId: 'loc1', workoutTypeId: 'wt2',
    exercises: [
      { id: 'l1w2e1', name: 'מתח', notes: '', sets: s3(8, 0, 90) },
      { id: 'l1w2e2', name: 'חתירה בכבל', notes: '', sets: s3(12, 50, 60) },
      { id: 'l1w2e3', name: 'כפיפת יד עם מוט', notes: '', sets: s3(12, 30, 60) },
    ],
  },
  {
    locationId: 'loc1', workoutTypeId: 'wt3',
    exercises: [
      { id: 'l1w3e1', name: 'לחיצת כתפיים', notes: '', sets: s3(10, 40, 90) },
      { id: 'l1w3e2', name: 'לחיצת כתפיים במשקולות', notes: '', sets: s3(12, 14, 60) },
    ],
  },
  {
    locationId: 'loc1', workoutTypeId: 'wt4',
    exercises: [
      { id: 'l1w4e1', name: 'סקוואט', notes: '', sets: s3(8, 80, 120) },
      { id: 'l1w4e2', name: 'לג פרס', notes: '', sets: s3(12, 100, 90) },
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt1',
    exercises: [
      { id: 'l2w1e1', name: 'שכיבות סמיכה', notes: '', sets: s3(15, 0, 60) },
      { id: 'l2w1e2', name: 'שכיבות סמיכה צרות (טריצפס)', notes: '', sets: s3(12, 0, 60) },
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt2',
    exercises: [
      { id: 'l2w2e1', name: 'מתח', notes: '', sets: s3(8, 0, 90) },
      { id: 'l2w2e2', name: 'כפיפת יד עם משקולות', notes: '', sets: s3(12, 10, 60) },
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt3',
    exercises: [
      { id: 'l2w3e1', name: 'לחיצת כתפיים במשקולות', notes: '', sets: s3(12, 10, 60) },
    ],
  },
  {
    locationId: 'loc2', workoutTypeId: 'wt4',
    exercises: [
      { id: 'l2w4e1', name: 'סקוואט', notes: '', sets: s3(15, 0, 90) },
      { id: 'l2w4e2', name: "לאנג'", notes: '', sets: s3(12, 0, 60) },
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
    }),
    { name: 'fitness-store-v2' }
  )
);

export function getLastSessionSets(
  sessions: WorkoutSession[],
  workoutTypeId: string,
  exerciseId: string
): SessionSet[] {
  const last = sessions.find((s) => s.workoutTypeId === workoutTypeId && s.endedAt);
  if (!last) return [];
  return last.sets.filter((s) => s.exerciseId === exerciseId);
}

export function calcVolume(sets: SessionSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}
