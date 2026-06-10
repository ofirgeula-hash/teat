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

export interface PlanExercise {
  id: string;
  name: string;
  notes: string[];
  sets: PlanSet[];
  equipment: EquipmentType[];
  variants?: Partial<Record<EquipmentType, ExerciseVariantData>>;
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
}

export interface WorkoutNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
