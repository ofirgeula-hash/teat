export type MuscleGroup = 'חזה' | 'גב' | 'כתפיים' | 'יד_קדמית' | 'יד_אחורית' | 'רגליים' | 'בטן' | 'אחר';

export type Equipment =
  | 'מוט_ישר'
  | 'משקולות_יד'
  | 'כבלים'
  | 'לג_פרס'
  | 'מכונה'
  | 'מקבילים'
  | 'מתח'
  | 'משקל_גוף'
  | 'סמית'
  | 'EZ';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  requiredEquipment: Equipment[];
  alternativeIds: string[];
  notes: string[];
}

export interface TemplateSet {
  reps: number;
  weight: number;
  restSeconds: number;
}

export interface TemplateExercise {
  exerciseId: string;
  sets: TemplateSet[];
}

export type SplitName = 'חזה_טריצפס' | 'גב_ביצפס' | 'כתפיים' | 'רגליים';

export interface WorkoutTemplate {
  id: string;
  name: string;
  splitName: SplitName;
  exercises: TemplateExercise[];
}

export interface Location {
  id: string;
  name: string;
  availableEquipment: Equipment[];
}

export interface SessionSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  notes: string;
  completedAt: string;
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  locationId: string;
  startedAt: string;
  endedAt: string | null;
  sets: SessionSet[];
  notes: string;
}

export interface BodyWeightLog {
  id: string;
  date: string;
  weightKg: number;
}

export interface AppSettings {
  defaultRestSeconds: number;
  reminderEnabled: boolean;
  reminderDays: number[];
  reminderTime: string;
}

export interface ExerciseLastValues {
  [exerciseId: string]: {
    weight: number;
    reps: number;
    sets: number;
    restSeconds: number;
  };
}
