export type EquipmentType =
  | 'barbell' | 'dumbbells' | 'machine' | 'cable' | 'plates'
  | 'kettlebell' | 'bands' | 'bodyweight' | 'other';

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: 'מוט',
  dumbbells: 'דאמבל',
  machine: 'מכונה',
  cable: 'כבל',
  plates: 'פלטות',
  kettlebell: 'קטלבל',
  bands: 'גומיות',
  bodyweight: 'משקל גוף',
  other: 'אחר',
};

export const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as EquipmentType[];

export type WorkoutKind = 'full' | 'split';

export interface WorkoutType {
  id: string;
  name: string;
  emoji: string;
  /** Used for the calendar and charts. */
  color: string;
  /** Full-body vs. split; drives the launch chooser. Missing means split. */
  kind?: WorkoutKind;
}

/** Distinct, dark-theme-friendly colors handed out to workout types. */
export const WORKOUT_COLORS = ['#ff6b1a', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ec4899', '#14b8a6', '#ef4444'];

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
  | 'chest' | 'lats' | 'middle_back' | 'lower_back' | 'back'
  | 'shoulders' | 'rear_delts' | 'traps' | 'neck'
  | 'biceps' | 'triceps' | 'forearms' | 'abs'
  | 'glutes' | 'quads' | 'hamstrings' | 'adductors' | 'abductors' | 'calves'
  | 'other';

/** Key order is display order (pickers, filters). `back` is the pre-split catch-all, kept for old data. */
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'חזה',
  lats: 'גב רחב',
  middle_back: 'גב אמצעי',
  lower_back: 'גב תחתון',
  back: 'גב',
  shoulders: 'כתפיים',
  rear_delts: 'כתף אחורית',
  traps: 'טרפזים',
  neck: 'צוואר',
  biceps: 'ביצפס',
  triceps: 'טריצפס',
  forearms: 'אמות',
  abs: 'בטן',
  glutes: 'ישבן',
  quads: 'קוואדריספס',
  hamstrings: 'ביצפס ירך',
  adductors: 'מקרבים',
  abductors: 'מרחיקים',
  calves: 'תאומים',
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
  /** Bank exercise this entry came from, for its photos and info page (survives un-saving it). */
  bankId?: string;
  /** Cardio/stretching: no weight × reps, just "done" plus an optional note. */
  untracked?: boolean;
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
  /** Marks an untracked exercise (cardio/stretching) as done; weight and reps are 0. */
  untracked?: boolean;
  note?: string;
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
  weeklyGoal?: number;
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
  /** Id in the bundled exercise bank (`data/exerciseBank.json`) this item was saved from. */
  bankId?: string;
  untracked?: boolean;
}

export interface WorkoutNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
