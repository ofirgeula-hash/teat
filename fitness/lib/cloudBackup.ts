'use client';
import { create } from 'zustand';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useStore, exportData, BACKUP_KEYS } from '@/store';
import type { WorkoutSession } from '@/types';

// Same Firebase project as the shopping list (repo root). The web config is public by design;
// access is enforced by Firestore rules that only let a signed-in user touch fitness/{their uid}.
const firebaseConfig = {
  apiKey: 'AIzaSyB-sa9xR6DxdYv6DCAUn1Ze1Kzb6TMuxzA',
  projectId: 'shopping-list-db6a8',
  storageBucket: 'shopping-list-db6a8.firebasestorage.app',
  messagingSenderId: '722011046106',
  appId: '1:722011046106:web:0734fe777690e1270265e3',
};

export type BackupStatus =
  | 'loading'        // Firebase not initialised yet
  | 'signed-out'
  | 'checking'       // signed in, comparing with the cloud copy
  | 'needs-decision' // the cloud has a backup this device hasn't been linked to yet
  | 'syncing'
  | 'synced'
  | 'error';

interface BackupState {
  status: BackupStatus;
  email: string | null;
  lastBackupAt: string | null;
  cloudUpdatedAt: string | null;
  cloudSessionCount: number | null;
  error: string | null;
}

export const useBackup = create<BackupState>(() => ({
  status: 'loading',
  email: null,
  lastBackupAt: null,
  cloudUpdatedAt: null,
  cloudSessionCount: null,
  error: null,
}));

let fb: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

async function getFirebase() {
  if (fb) return fb;
  const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  // On the deployed site, sign-in runs through this domain's /__/auth proxy (see next.config.ts)
  // so iOS Safari and home-screen apps don't hit third-party storage blocking.
  const host = window.location.hostname;
  const authDomain = host === 'localhost' || host === '127.0.0.1' ? 'shopping-list-db6a8.firebaseapp.com' : window.location.host;
  const app = initializeApp({ ...firebaseConfig, authDomain });
  fb = { app, auth: getAuth(app), db: getFirestore(app) };
  return fb;
}

const linkedKey = (uid: string) => `fitness-backup-linked-${uid}`;
const syncedKey = (uid: string) => `fitness-backup-synced-${uid}`;

function readSynced(uid: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(syncedKey(uid)) ?? '[]'));
  } catch {
    return new Set();
  }
}

function writeSynced(uid: string, ids: Iterable<string>) {
  try {
    localStorage.setItem(syncedKey(uid), JSON.stringify([...ids]));
  } catch {}
}

function isLinked(uid: string) {
  try {
    return localStorage.getItem(linkedKey(uid)) === '1';
  } catch {
    return false;
  }
}

function setLinked(uid: string) {
  try {
    localStorage.setItem(linkedKey(uid), '1');
  } catch {}
}

/** Firestore rejects `undefined`; a JSON round-trip drops those fields. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

let lastSignature = '';
let currentUser: User | null = null;

function backupPayload() {
  const all = exportData(useStore.getState());
  const { sessions, ...rest } = all;
  const finished = (sessions as WorkoutSession[]).filter((s) => s.endedAt);
  return { rest, finished };
}

/** Pushes local data to the cloud: one doc for settings/plans/etc, one doc per finished session. */
export async function backupNow(force = false) {
  const user = currentUser;
  if (!user) return;
  const { db } = await getFirebase();
  const { doc, writeBatch } = await import('firebase/firestore');
  const { rest, finished } = backupPayload();
  const signature = JSON.stringify(rest) + finished.map((s) => s.id).join(',');
  if (!force && signature === lastSignature) return;

  useBackup.setState({ status: 'syncing', error: null });
  try {
    const synced = readSynced(user.uid);
    const localIds = new Set(finished.map((s) => s.id));
    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
    for (const s of finished) {
      if (force || !synced.has(s.id)) ops.push((b) => b.set(doc(db, 'fitness', user.uid, 'sessions', s.id), clean(s)));
    }
    for (const id of synced) {
      if (!localIds.has(id)) ops.push((b) => b.delete(doc(db, 'fitness', user.uid, 'sessions', id)));
    }
    const now = new Date().toISOString();
    ops.push((b) =>
      b.set(doc(db, 'fitness', user.uid), clean({ data: rest, updatedAt: now, sessionCount: finished.length }))
    );
    // Firestore batches hold at most 500 writes.
    for (let i = 0; i < ops.length; i += 450) {
      const batch = writeBatch(db);
      ops.slice(i, i + 450).forEach((op) => op(batch));
      await batch.commit();
    }
    writeSynced(user.uid, localIds);
    lastSignature = signature;
    useBackup.setState({ status: 'synced', lastBackupAt: now, cloudUpdatedAt: now, cloudSessionCount: finished.length });
  } catch (e) {
    useBackup.setState({ status: 'error', error: describeError(e) });
  }
}

/** Replaces this device's data with the cloud copy. */
export async function restoreFromCloud() {
  const user = currentUser;
  if (!user) return;
  const { db } = await getFirebase();
  const { doc, getDoc, getDocs, collection } = await import('firebase/firestore');
  useBackup.setState({ status: 'syncing', error: null });
  try {
    const meta = await getDoc(doc(db, 'fitness', user.uid));
    if (!meta.exists()) {
      useBackup.setState({ status: 'error', error: 'אין גיבוי בענן' });
      return;
    }
    const snap = await getDocs(collection(db, 'fitness', user.uid, 'sessions'));
    const sessions = snap.docs
      .map((d) => d.data() as WorkoutSession)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const data = { ...(meta.data().data ?? {}), sessions };
    if (!useStore.getState().importData(data)) {
      useBackup.setState({ status: 'error', error: 'הגיבוי בענן לא תקין' });
      return;
    }
    setLinked(user.uid);
    writeSynced(user.uid, sessions.map((s) => s.id));
    lastSignature = '';
    await backupNow();
    useBackup.setState({ status: 'synced' });
  } catch (e) {
    useBackup.setState({ status: 'error', error: describeError(e) });
  }
}

/** Keeps this device's data and overwrites the cloud copy with it. */
export async function keepThisDeviceData() {
  const user = currentUser;
  if (!user) return;
  setLinked(user.uid);
  await backupNow(true);
}

async function checkCloud(user: User) {
  const { db } = await getFirebase();
  const { doc, getDoc } = await import('firebase/firestore');
  useBackup.setState({ status: 'checking' });
  try {
    const meta = await getDoc(doc(db, 'fitness', user.uid));
    if (!meta.exists()) {
      setLinked(user.uid);
      await backupNow(true);
      return;
    }
    const m = meta.data();
    useBackup.setState({ cloudUpdatedAt: m.updatedAt ?? null, cloudSessionCount: m.sessionCount ?? null });
    if (isLinked(user.uid)) {
      useBackup.setState({ lastBackupAt: m.updatedAt ?? null });
      await backupNow();
      if (useBackup.getState().status === 'checking') useBackup.setState({ status: 'synced' });
    } else {
      // A backup exists but this device has never synced with it: don't overwrite it silently.
      useBackup.setState({ status: 'needs-decision' });
    }
  } catch (e) {
    useBackup.setState({ status: 'error', error: describeError(e) });
  }
}

let started = false;

/** Starts listening for sign-in and auto-backing-up local changes. Safe to call more than once. */
export async function startBackupSync() {
  if (started) return;
  started = true;
  const { auth } = await getFirebase();
  const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
  getRedirectResult(auth).catch((e) => useBackup.setState({ status: 'error', error: describeError(e) }));
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    lastSignature = '';
    if (!user) {
      useBackup.setState({ status: 'signed-out', email: null, lastBackupAt: null, cloudUpdatedAt: null, cloudSessionCount: null });
      return;
    }
    useBackup.setState({ email: user.email });
    void checkCloud(user);
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  useStore.subscribe((state, prev) => {
    if (!currentUser || !isLinked(currentUser.uid)) return;
    if (!BACKUP_KEYS.some((k) => state[k] !== prev[k])) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void backupNow(), 3000);
  });
}

export async function signInWithGoogle() {
  const { auth } = await getFirebase();
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (code === 'auth/popup-closed-by-user') return;
    useBackup.setState({ status: 'error', error: describeError(e) });
  }
}

export async function signOutOfBackup() {
  const { auth } = await getFirebase();
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

function describeError(e: unknown): string {
  const code = (e as { code?: string }).code ?? '';
  if (code === 'permission-denied' || code === 'firestore/permission-denied') return 'אין הרשאה לכתוב לענן — צריך לעדכן את כללי Firestore';
  if (code === 'auth/unauthorized-domain') return 'הדומיין לא מאושר ב-Firebase Authentication';
  if (code === 'auth/operation-not-allowed') return 'התחברות עם Google לא מופעלת ב-Firebase';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'אין חיבור לאינטרנט — ננסה שוב בשינוי הבא';
  return `שגיאה בגיבוי${code ? ` (${code})` : ''}`;
}
