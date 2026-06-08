'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Exercise,
  WorkoutTemplate,
  Location,
  WorkoutSession,
  BodyWeightLog,
  AppSettings,
  SplitName,
  SessionSet,
} from '@/types';

interface AppState {
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  locations: Location[];
  sessions: WorkoutSession[];
  bodyWeightLogs: BodyWeightLog[];
  settings: AppSettings;
  activeSession: WorkoutSession | null;

  // Exercise actions
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;

  // Template actions
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (id: string, updates: Partial<WorkoutTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Location actions
  addLocation: (location: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // Session actions
  startSession: (templateId: string, locationId: string) => void;
  addSet: (set: Omit<SessionSet, 'id' | 'completedAt'>) => void;
  updateSet: (setId: string, updates: Partial<SessionSet>) => void;
  removeSet: (setId: string) => void;
  finishSession: () => void;
  cancelSession: () => void;

  // Body weight
  addBodyWeight: (log: BodyWeightLog) => void;
  deleteBodyWeight: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const defaultExercises: Exercise[] = [
  { id: 'ex1', name: 'לחיצת חזה', muscleGroup: 'חזה', requiredEquipment: ['מוט_ישר'], alternativeIds: ['ex2'], notes: [] },
  { id: 'ex2', name: 'לחיצת חזה במשקולות', muscleGroup: 'חזה', requiredEquipment: ['משקולות_יד'], alternativeIds: ['ex1'], notes: [] },
  { id: 'ex3', name: 'פשיטת חזה בכבלים', muscleGroup: 'חזה', requiredEquipment: ['כבלים'], alternativeIds: [], notes: [] },
  { id: 'ex4', name: 'לחיצת כתפיים', muscleGroup: 'כתפיים', requiredEquipment: ['מוט_ישר'], alternativeIds: ['ex5'], notes: [] },
  { id: 'ex5', name: 'לחיצת כתפיים במשקולות', muscleGroup: 'כתפיים', requiredEquipment: ['משקולות_יד'], alternativeIds: ['ex4'], notes: [] },
  { id: 'ex6', name: 'מתח', muscleGroup: 'גב', requiredEquipment: ['מתח'], alternativeIds: ['ex7'], notes: [] },
  { id: 'ex7', name: 'חתירה בכבל', muscleGroup: 'גב', requiredEquipment: ['כבלים'], alternativeIds: ['ex6'], notes: [] },
  { id: 'ex8', name: 'סקוואט', muscleGroup: 'רגליים', requiredEquipment: ['מוט_ישר'], alternativeIds: ['ex9'], notes: [] },
  { id: 'ex9', name: 'לג פרס', muscleGroup: 'רגליים', requiredEquipment: ['לג_פרס'], alternativeIds: ['ex8'], notes: [] },
  { id: 'ex10', name: 'כפיפת יד עם מוט', muscleGroup: 'יד_קדמית', requiredEquipment: ['מוט_ישר'], alternativeIds: ['ex11'], notes: [] },
  { id: 'ex11', name: 'כפיפת יד עם משקולות', muscleGroup: 'יד_קדמית', requiredEquipment: ['משקולות_יד'], alternativeIds: ['ex10'], notes: [] },
  { id: 'ex12', name: 'פשיטת יד בכבל', muscleGroup: 'יד_אחורית', requiredEquipment: ['כבלים'], alternativeIds: ['ex13'], notes: [] },
  { id: 'ex13', name: 'שכיבות סמיכה צרות', muscleGroup: 'יד_אחורית', requiredEquipment: ['משקל_גוף'], alternativeIds: ['ex12'], notes: [] },
];

const defaultTemplates: WorkoutTemplate[] = [
  {
    id: 'tpl1',
    name: 'חזה + טריצפס',
    splitName: 'חזה_טריצפס',
    exercises: [
      { exerciseId: 'ex1', sets: [{ reps: 10, weight: 60, restSeconds: 90 }, { reps: 10, weight: 60, restSeconds: 90 }, { reps: 10, weight: 60, restSeconds: 90 }] },
      { exerciseId: 'ex2', sets: [{ reps: 12, weight: 20, restSeconds: 60 }, { reps: 12, weight: 20, restSeconds: 60 }, { reps: 12, weight: 20, restSeconds: 60 }] },
      { exerciseId: 'ex3', sets: [{ reps: 15, weight: 15, restSeconds: 60 }, { reps: 15, weight: 15, restSeconds: 60 }, { reps: 15, weight: 15, restSeconds: 60 }] },
      { exerciseId: 'ex12', sets: [{ reps: 12, weight: 30, restSeconds: 60 }, { reps: 12, weight: 30, restSeconds: 60 }, { reps: 12, weight: 30, restSeconds: 60 }] },
    ],
  },
  {
    id: 'tpl2',
    name: 'גב + ביצפס',
    splitName: 'גב_ביצפס',
    exercises: [
      { exerciseId: 'ex6', sets: [{ reps: 8, weight: 0, restSeconds: 90 }, { reps: 8, weight: 0, restSeconds: 90 }, { reps: 8, weight: 0, restSeconds: 90 }] },
      { exerciseId: 'ex7', sets: [{ reps: 12, weight: 50, restSeconds: 60 }, { reps: 12, weight: 50, restSeconds: 60 }, { reps: 12, weight: 50, restSeconds: 60 }] },
      { exerciseId: 'ex10', sets: [{ reps: 12, weight: 30, restSeconds: 60 }, { reps: 12, weight: 30, restSeconds: 60 }, { reps: 12, weight: 30, restSeconds: 60 }] },
    ],
  },
  {
    id: 'tpl3',
    name: 'כתפיים',
    splitName: 'כתפיים',
    exercises: [
      { exerciseId: 'ex4', sets: [{ reps: 10, weight: 40, restSeconds: 90 }, { reps: 10, weight: 40, restSeconds: 90 }, { reps: 10, weight: 40, restSeconds: 90 }] },
      { exerciseId: 'ex5', sets: [{ reps: 12, weight: 14, restSeconds: 60 }, { reps: 12, weight: 14, restSeconds: 60 }, { reps: 12, weight: 14, restSeconds: 60 }] },
    ],
  },
  {
    id: 'tpl4',
    name: 'רגליים',
    splitName: 'רגליים',
    exercises: [
      { exerciseId: 'ex8', sets: [{ reps: 8, weight: 80, restSeconds: 120 }, { reps: 8, weight: 80, restSeconds: 120 }, { reps: 8, weight: 80, restSeconds: 120 }] },
      { exerciseId: 'ex9', sets: [{ reps: 12, weight: 100, restSeconds: 90 }, { reps: 12, weight: 100, restSeconds: 90 }, { reps: 12, weight: 100, restSeconds: 90 }] },
    ],
  },
];

const defaultLocations: Location[] = [
  {
    id: 'loc1',
    name: 'חדר כושר',
    availableEquipment: ['מוט_ישר', 'משקולות_יד', 'כבלים', 'לג_פרס', 'מכונה', 'מקבילים', 'מתח', 'סמית', 'EZ'],
  },
  {
    id: 'loc2',
    name: 'בית',
    availableEquipment: ['משקולות_יד', 'משקל_גוף', 'מקבילים'],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      exercises: defaultExercises,
      templates: defaultTemplates,
      locations: defaultLocations,
      sessions: [],
      bodyWeightLogs: [],
      activeSession: null,
      settings: {
        defaultRestSeconds: 90,
        reminderEnabled: false,
        reminderDays: [],
        reminderTime: '18:00',
      },

      addExercise: (exercise) =>
        set((s) => ({ exercises: [...s.exercises, exercise] })),
      updateExercise: (id, updates) =>
        set((s) => ({
          exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteExercise: (id) =>
        set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) })),

      addTemplate: (template) =>
        set((s) => ({ templates: [...s.templates, template] })),
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addLocation: (location) =>
        set((s) => ({ locations: [...s.locations, location] })),
      updateLocation: (id, updates) =>
        set((s) => ({
          locations: s.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
      deleteLocation: (id) =>
        set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),

      startSession: (templateId, locationId) => {
        const session: WorkoutSession = {
          id: crypto.randomUUID(),
          templateId,
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
                sets: s.activeSession.sets.map((st) =>
                  st.id === setId ? { ...st, ...updates } : st
                ),
              }
            : null,
        })),

      removeSet: (setId) =>
        set((s) => ({
          activeSession: s.activeSession
            ? {
                ...s.activeSession,
                sets: s.activeSession.sets.filter((st) => st.id !== setId),
              }
            : null,
        })),

      finishSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        const finished = { ...activeSession, endedAt: new Date().toISOString() };
        set((s) => ({
          sessions: [finished, ...s.sessions],
          activeSession: null,
        }));
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

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
    }),
    { name: 'fitness-store' }
  )
);

// Derived helpers
export function getLastSessionSets(
  sessions: WorkoutSession[],
  templateId: string,
  exerciseId: string
): SessionSet[] {
  const last = sessions.find((s) => s.templateId === templateId);
  if (!last) return [];
  return last.sets.filter((s) => s.exerciseId === exerciseId);
}

export function calcVolume(sets: SessionSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function splitLabel(split: SplitName): string {
  const map: Record<SplitName, string> = {
    חזה_טריצפס: 'חזה + טריצפס',
    גב_ביצפס: 'גב + ביצפס',
    כתפיים: 'כתפיים',
    רגליים: 'רגליים',
  };
  return map[split];
}

export function splitColor(split: SplitName): string {
  const map: Record<SplitName, string> = {
    חזה_טריצפס: '#3b82f6',
    גב_ביצפס: '#10b981',
    כתפיים: '#f59e0b',
    רגליים: '#ef4444',
  };
  return map[split];
}
