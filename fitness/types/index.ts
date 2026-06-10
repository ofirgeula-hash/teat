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

export interface PlanExercise {
  id: string;
  name: string;
  notes: string[];
  sets: PlanSet[];
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
