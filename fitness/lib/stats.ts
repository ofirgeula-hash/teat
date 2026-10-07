import type { EquipmentType, SessionSet, WorkoutSession } from '@/types';

export function setVolume(s: Pick<SessionSet, 'weight' | 'reps'>): number {
  return s.weight * s.reps;
}

export function sessionVolume(session: WorkoutSession): number {
  return session.sets.reduce((sum, s) => sum + setVolume(s), 0);
}

export function sessionMinutes(session: WorkoutSession): number {
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(session.startedAt).getTime()) / 60000));
}

export function finishedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions
    .filter((s) => s.endedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

function sameExercise(a: string, b: string) {
  return a.trim() === b.trim();
}

/**
 * Sets of the most recent finished session (other than `excludeSessionId`) that
 * contains this exercise. Matching is by name so the same exercise is found
 * across locations, where plan exercise ids differ.
 */
export function getPreviousSets(
  sessions: WorkoutSession[],
  exerciseName: string,
  equipment?: EquipmentType,
  excludeSessionId?: string,
): SessionSet[] {
  for (const session of finishedSessions(sessions)) {
    if (session.id === excludeSessionId) continue;
    const sets = session.sets
      .filter((s) => sameExercise(s.exerciseName, exerciseName) && (!equipment || !s.equipment || s.equipment === equipment))
      .sort((a, b) => a.setNumber - b.setNumber);
    if (sets.length > 0) return sets;
  }
  return [];
}

/** Heaviest weight ever lifted for this exercise before `before` (ISO date), or null. */
export function bestWeightBefore(sessions: WorkoutSession[], exerciseName: string, before: string): number | null {
  let best: number | null = null;
  const cutoff = new Date(before).getTime();
  for (const session of sessions) {
    if (!session.endedAt || new Date(session.startedAt).getTime() >= cutoff) continue;
    for (const s of session.sets) {
      if (sameExercise(s.exerciseName, exerciseName) && s.reps > 0 && (best === null || s.weight > best)) best = s.weight;
    }
  }
  return best;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  previousBest: number;
}

/** Exercises in `session` whose top weight beats every earlier session. First-ever exercises don't count. */
export function sessionRecords(sessions: WorkoutSession[], session: WorkoutSession): PersonalRecord[] {
  const byName = new Map<string, SessionSet>();
  for (const s of session.sets) {
    if (s.reps <= 0) continue;
    const cur = byName.get(s.exerciseName);
    if (!cur || s.weight > cur.weight) byName.set(s.exerciseName, s);
  }
  const records: PersonalRecord[] = [];
  for (const [name, top] of byName) {
    const prev = bestWeightBefore(sessions, name, session.startedAt);
    if (prev !== null && top.weight > prev) {
      records.push({ exerciseName: name, weight: top.weight, reps: top.reps, previousBest: prev });
    }
  }
  return records;
}

export interface ExerciseSummary {
  name: string;
  sets: SessionSet[];
  volume: number;
  previousVolume: number | null;
}

export function summarizeExercises(sessions: WorkoutSession[], session: WorkoutSession): ExerciseSummary[] {
  const order: string[] = [];
  const groups = new Map<string, SessionSet[]>();
  for (const s of [...session.sets].sort((a, b) => a.completedAt.localeCompare(b.completedAt))) {
    if (!groups.has(s.exerciseName)) {
      groups.set(s.exerciseName, []);
      order.push(s.exerciseName);
    }
    groups.get(s.exerciseName)!.push(s);
  }
  const earlier = sessions.filter((s) => new Date(s.startedAt) < new Date(session.startedAt));
  return order.map((name) => {
    const sets = groups.get(name)!.sort((a, b) => a.setNumber - b.setNumber);
    const prev = getPreviousSets(earlier, name);
    return {
      name,
      sets,
      volume: sets.reduce((sum, s) => sum + setVolume(s), 0),
      previousVolume: prev.length ? prev.reduce((sum, s) => sum + setVolume(s), 0) : null,
    };
  });
}

/** Sunday-based week start (Israeli week), local time. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function workoutsThisWeek(sessions: WorkoutSession[], now: number): number {
  const start = weekStart(new Date(now)).getTime();
  return finishedSessions(sessions).filter((s) => new Date(s.startedAt).getTime() >= start).length;
}

/** Consecutive completed weeks (not counting the current one) that met the goal. */
export function weekStreak(sessions: WorkoutSession[], goal: number, now: number): number {
  const counts = new Map<number, number>();
  for (const s of finishedSessions(sessions)) {
    const k = weekStart(new Date(s.startedAt)).getTime();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let streak = 0;
  const cursor = weekStart(new Date(now));
  // The current week counts once its goal is met; otherwise start from last week.
  if ((counts.get(cursor.getTime()) ?? 0) >= goal) streak++;
  for (;;) {
    cursor.setDate(cursor.getDate() - 7);
    if ((counts.get(cursor.getTime()) ?? 0) >= goal) streak++;
    else break;
  }
  return streak;
}

export function formatKg(n: number): string {
  return n.toLocaleString('he-IL', { maximumFractionDigits: 1 });
}
