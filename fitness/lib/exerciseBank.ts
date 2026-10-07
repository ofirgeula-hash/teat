'use client';
import { useEffect, useState } from 'react';
import type { EquipmentType, ExerciseLibraryItem, MuscleGroup } from '@/types';
import { useStore } from '@/store';

/** One exercise of the bundled bank, built by scripts/build-exercise-bank.mjs. */
export interface BankExercise {
  id: string;
  /** English name, as in free-exercise-db; also used for YouTube searches. */
  name: string;
  nameHe: string;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  equipment: EquipmentType;
  category: 'strength' | 'stretching' | 'cardio';
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic?: 'compound' | 'isolation';
  force?: 'push' | 'pull' | 'static';
  steps: string[];
}

export const CATEGORY_LABELS: Record<BankExercise['category'], string> = {
  strength: 'כוח',
  stretching: 'מתיחות',
  cardio: 'אירובי',
};
export const LEVEL_LABELS: Record<BankExercise['level'], string> = {
  beginner: 'מתחיל',
  intermediate: 'בינוני',
  expert: 'מתקדם',
};
export const MECHANIC_LABELS: Record<NonNullable<BankExercise['mechanic']>, string> = {
  compound: 'מורכב',
  isolation: 'מבודד',
};
export const FORCE_LABELS: Record<NonNullable<BankExercise['force']>, string> = {
  push: 'דחיפה',
  pull: 'משיכה',
  static: 'סטטי',
};

// Pinned to the same upstream commit as the build script, so ids and images always match.
const BANK_IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises';

/** Every bank exercise has two photos: 0 = start position, 1 = end position. */
export function bankImage(id: string, frame: 0 | 1 = 0): string {
  return `${BANK_IMAGE_BASE}/${encodeURIComponent(id)}/${frame}.jpg`;
}

/** Cardio and stretching are added to workouts without weight × reps. */
export function isUntracked(e: Pick<BankExercise, 'category'>): boolean {
  return e.category !== 'strength';
}

let bankPromise: Promise<BankExercise[]> | null = null;

/** The bank is ~320 KB, so it's a separate chunk loaded on first use rather than part of every page. */
export function loadBank(): Promise<BankExercise[]> {
  bankPromise ??= import('@/data/exerciseBank.json').then((m) => m.default as BankExercise[]);
  return bankPromise;
}

/** The bank once loaded (null until then). */
export function useBank(): BankExercise[] | null {
  const [bank, setBank] = useState<BankExercise[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadBank().then((b) => { if (alive) setBank(b); });
    return () => { alive = false; };
  }, []);
  return bank;
}

export function bankToLibraryItem(e: BankExercise): Omit<ExerciseLibraryItem, 'id'> {
  return {
    name: e.name,
    nameHe: e.nameHe,
    muscleGroup: e.primary[0],
    equipment: [e.equipment],
    bankId: e.id,
    ...(isUntracked(e) ? { untracked: true } : {}),
  };
}

// Photos of saved ("★") exercises are kept on the device so they show without reception.
// public/sw.js serves this cache before going to the network.
const IMAGE_CACHE = 'exercise-images-v1';

export async function keepImagesOffline(id: string): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(IMAGE_CACHE);
    await cache.addAll([bankImage(id, 0), bankImage(id, 1)]);
  } catch {
    // Offline or storage full: the photos still load from the network when there's reception.
  }
}

export async function dropOfflineImages(id: string): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(IMAGE_CACHE);
    await Promise.all([cache.delete(bankImage(id, 0)), cache.delete(bankImage(id, 1))]);
  } catch {
    // Nothing to clean up.
  }
}

/** Adds a bank exercise to "my exercises" (★), or returns it if it's already there. */
export function saveBankExercise(e: BankExercise): ExerciseLibraryItem {
  const { exerciseLibrary, addExerciseLibraryItem } = useStore.getState();
  const existing = exerciseLibrary.find((item) => item.bankId === e.id);
  if (existing) return existing;
  const item: ExerciseLibraryItem = { ...bankToLibraryItem(e), id: crypto.randomUUID() };
  addExerciseLibraryItem(item);
  void keepImagesOffline(e.id);
  return item;
}

/** Removes a bank exercise from "my exercises". Plans that use it keep their copy. */
export function unsaveBankExercise(bankId: string): void {
  const { exerciseLibrary, deleteExerciseLibraryItem, locationPlans } = useStore.getState();
  exerciseLibrary.filter((item) => item.bankId === bankId).forEach((item) => deleteExerciseLibraryItem(item.id));
  // A workout plan still using it should keep showing its photos offline.
  if (!locationPlans.some((p) => p.exercises.some((ex) => ex.bankId === bankId))) void dropOfflineImages(bankId);
}
