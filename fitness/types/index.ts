export type EquipmentType = 'machine' | 'dumbbells' | 'plates';

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  machine: 'מכונה',
  dumbbells: 'דאמבל',
  plates: 'פלטות',
};

export interface WorkoutType {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface PlanSet {
  reps: number;
  weight: number;
  restSeconds: number;
}

export interface ExerciseVariantData {
  notes: string[];
  sets: PlanSet[];
}

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'rear_delts' | 'traps'
  | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'calves'
  | 'adductors' | 'abs' | 'other';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'חזה',
  back: 'גב',
  shoulders: 'כתפיים',
  rear_delts: 'כתף אחורית',
  traps: 'טרפזים',
  biceps: 'ביצפס',
  triceps: 'טריצפס',
  quads: 'קוואדריספס',
  hamstrings: 'ביצפס ירך',
  calves: 'תאומים',
  adductors: 'אדוקטורים',
  abs: 'בטן',
  other: 'אחר',
};

export interface PlanExercise {
  id: string;
  name: string;
  notes: string[];
  sets: PlanSet[];
  equipment: EquipmentType[];
  variants?: Partial<Record<EquipmentType, ExerciseVariantData>>;
  muscleGroup?: MuscleGroup;
  libraryId?: string;
}

export interface LocationWorkoutPlan {
  locationId: string;
  workoutTypeId: string;
  exercises: PlanExercise[];
}

export interface SessionSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  completedAt: string;
  equipment?: EquipmentType;
  muscleGroup?: MuscleGroup;
}

export interface WorkoutSession {
  id: string;
  workoutTypeId: string;
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
  workoutXApiKey?: string;
}

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  nameHe?: string;
  muscleGroup?: MuscleGroup;
  subMuscle?: string;
  equipment: EquipmentType[];
  gifUrl?: string;
  instructions?: string[];
  keyPoints?: string;
}

export interface WorkoutNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
