'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { getPreviousSets, formatKg } from '@/lib/stats';
import { useEffect, useState } from 'react';
import type { SessionSet, PlanExercise, PlanSet, EquipmentType, MuscleGroup } from '@/types';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '@/types';
import RestTimer from '@/components/RestTimer';
import ExerciseListPicker from '@/components/ExerciseListPicker';
import { ChevronLeft, ChevronRight, ExternalLink, Edit2, Check, X, Plus, Minus, Trash2, Timer } from 'lucide-react';

function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

function isUrl(text: string) {
  return text.startsWith('http://') || text.startsWith('https://');
}

const ALL_EQUIPMENT: EquipmentType[] = ['machine', 'dumbbells', 'plates'];

const MUSCLE_KEYWORDS: Array<{ keywords: string[]; group: MuscleGroup }> = [
  { keywords: ['חזה', 'פרפר', 'מקבילים', 'שכיבות סמיכה', 'bench', 'פולי עליון עם חבל', 'סמית'], group: 'chest' },
  { keywords: ['גב', 'מתח', 'חתירה', 'טי-באר', 'לט', 'פולי', 'רוביט', 'seated row'], group: 'back' },
  { keywords: ['כפיפות לגב תחתון', 'גב תחתון', 'hyperextension'], group: 'back' },
  { keywords: ['כתף', 'הרחקת', 'lateral', 'overhead press', 'לחיצת כתף', 'לחיצת כתפיים'], group: 'shoulders' },
  { keywords: ['כתף אחורית', 'rear delt', 'face pull', 'פרפר הפוך'], group: 'rear_delts' },
  { keywords: ['טרפזים', 'shrug', 'שראג'], group: 'traps' },
  { keywords: ['ביצפס', 'כפיפות', 'curl', 'פטישים', 'hammer', 'יד קדמית'], group: 'biceps' },
  { keywords: ['טריצפס', 'פשיטת מרפקים', 'tricep', 'דיפס', 'יד אחורית', 'pushdown', 'צרות'], group: 'triceps' },
  { keywords: ['סקוואט', 'לאנג', 'ראנג', 'פשיטת רגליים', 'leg press', 'מכרעיים', 'quad', 'פרונט'], group: 'quads' },
  { keywords: ['כפיפת רגליים', 'leg curl', 'ביצפס ירך', 'hamstring', 'deadlift', 'סטיף'], group: 'hamstrings' },
  { keywords: ['תאומים', 'calf', 'עגל'], group: 'calves' },
  { keywords: ['סגירת רגליים', 'אדוקטור', 'adductor', 'inner thigh'], group: 'adductors' },
  { keywords: ['בטן', 'כפיפות בטן', 'ab', 'plank', 'crunch'], group: 'abs' },
];

function guessMuscleGroup(name: string): MuscleGroup | undefined {
  const lower = name.toLowerCase();
  for (const { keywords, group } of MUSCLE_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) return group;
  }
  return undefined;
}

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const { workoutTypes, locations, locationPlans, sessions, activeSession, settings, exerciseLibrary } = store;

  const workoutType = workoutTypes.find((w) => w.id === id);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [currentExId, setCurrentExId] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<Record<string, number>>({});
  const [extraSets, setExtraSets] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, { weight: string; reps: string }>>({});
  const [showFinish, setShowFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [activeEquipment, setActiveEquipment] = useState<Record<string, EquipmentType>>({});

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [localExs, setLocalExs] = useState<PlanExercise[]>([]);
  const [activeVariantTab, setActiveVariantTab] = useState<Record<number, EquipmentType>>({});
  const [confirmDeleteEx, setConfirmDeleteEx] = useState<number | null>(null);
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<string | null>(null);
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showExPicker, setShowExPicker] = useState(false);

  // Inline notes editing in view mode
  const [editingNotesExId, setEditingNotesExId] = useState<string | null>(null);
  const [inlineNotes, setInlineNotes] = useState<string[]>([]);
  const [newLocName, setNewLocName] = useState('');

  // Runs client-side after the persisted store is available, so it can't be a
  // lazy useState initializer without a server/client hydration mismatch.
  useEffect(() => {
    const state = useStore.getState();

    if (state.activeSession?.workoutTypeId === id) {
      const locId = state.activeSession.locationId;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLocationId(locId);
      const plan = state.locationPlans.find(
        (p) => p.locationId === locId && p.workoutTypeId === id
      );
      if (plan) {
        initEquipment(plan.exercises);
      }
      return;
    }

    const firstLocId = state.locations[0]?.id ?? '';
    setSelectedLocationId(firstLocId);
    if (firstLocId) {
      state.startSession(id, firstLocId);
      const plan = state.locationPlans.find(
        (p) => p.locationId === firstLocId && p.workoutTypeId === id
      );
      if (plan) {
        initEquipment(plan.exercises);
      }
    }
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function initEquipment(exercises: PlanExercise[]) {
    setActiveEquipment((prev) => {
      const next = { ...prev };
      exercises.forEach((ex) => {
        if ((ex.equipment?.length ?? 0) >= 2 && !next[ex.id]) {
          next[ex.id] = ex.equipment[0];
        }
      });
      return next;
    });
  }

  if (!workoutType) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-muted text-center">אימון לא נמצא</div>
        <button
          onClick={() => { store.cancelSession(); router.push('/'); }}
          className="bg-surface-2 text-white px-6 py-3 rounded-xl text-sm font-medium"
        >
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  const currentPlan = locationPlans.find(
    (p) => p.locationId === selectedLocationId && p.workoutTypeId === id
  );
  const exercises = currentPlan?.exercises ?? [];

  function enterEditMode() {
    setEditName(workoutType!.name);
    setLocalExs(exercises);
    setActiveVariantTab({});
    setConfirmDeleteEx(null);
    setConfirmDeleteLoc(null);
    setIsEditing(true);
  }

  function saveEdit() {
    store.updateWorkoutType(id, { name: editName.trim() || workoutType!.name });
    store.upsertPlan(selectedLocationId, id, localExs);
    setIsEditing(false);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  function handleLocationChange(locId: string) {
    if (isEditing) {
      store.upsertPlan(selectedLocationId, id, localExs);
      const plan = locationPlans.find((p) => p.locationId === locId && p.workoutTypeId === id);
      setLocalExs(plan?.exercises ?? []);
      setActiveVariantTab({});
    }
    setSelectedLocationId(locId);
    setCurrentExId(null);
    const plan = locationPlans.find((p) => p.locationId === locId && p.workoutTypeId === id);
    if (plan) initEquipment(plan.exercises);
  }

  function addLocation() {
    if (!newLocName.trim()) return;
    const newId = crypto.randomUUID();
    store.addLocation({ id: newId, name: newLocName.trim() });
    setNewLocName('');
    setShowAddLoc(false);
    setSelectedLocationId(newId);
    setLocalExs([]);
    setActiveVariantTab({});
  }

  function deleteLocation(locId: string) {
    store.deleteLocation(locId);
    setConfirmDeleteLoc(null);
    const remaining = locations.filter((l) => l.id !== locId);
    const nextLoc = remaining[0]?.id ?? '';
    if (nextLoc) handleLocationChange(nextLoc);
  }

  // ── Edit mode: exercise manipulation ──────────────────────────────────────

  function updateExercise(idx: number, updates: Partial<PlanExercise>) {
    setLocalExs((list) => list.map((e, i) => (i === idx ? { ...e, ...updates } : e)));
  }

  function getActiveVariantTab(exIdx: number, ex: PlanExercise): EquipmentType {
    return activeVariantTab[exIdx] ?? ex.equipment?.[0] ?? 'machine';
  }

  function toggleEquipment(exIdx: number, eq: EquipmentType) {
    const ex = localExs[exIdx];
    const current = ex.equipment ?? [];
    let next: EquipmentType[];
    if (current.includes(eq)) {
      next = current.filter((e) => e !== eq);
    } else {
      if (current.length >= 2) return;
      next = [...current, eq];
    }
    const variants = { ...(ex.variants ?? {}) };
    if (next.length === 2) {
      if (!variants[next[0]]) variants[next[0]] = { notes: [...(ex.notes ?? [])], sets: [...(ex.sets ?? [])] };
      if (!variants[next[1]]) variants[next[1]] = { notes: [...(ex.notes ?? [])], sets: [...(ex.sets ?? [])] };
    }
    const sets = next.length <= 1 ? (variants[next[0]]?.sets ?? ex.sets ?? []) : ex.sets;
    const notes = next.length <= 1 ? (variants[next[0]]?.notes ?? ex.notes ?? []) : ex.notes;
    updateExercise(exIdx, { equipment: next, sets, notes, variants });
    if (next.length === 2) setActiveVariantTab((prev) => ({ ...prev, [exIdx]: next[0] }));
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof PlanSet, val: string) {
    const ex = localExs[exIdx];
    if ((ex.equipment?.length ?? 0) >= 2) {
      const tab = getActiveVariantTab(exIdx, ex);
      const variantSets = (ex.variants?.[tab]?.sets ?? []).map((s, j) =>
        j === setIdx ? { ...s, [field]: parseFloat(val) || 0 } : s
      );
      updateExercise(exIdx, { variants: { ...ex.variants, [tab]: { ...ex.variants?.[tab], notes: ex.variants?.[tab]?.notes ?? [], sets: variantSets } } });
    } else {
      setLocalExs((list) =>
        list.map((e, i) =>
          i === exIdx ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, [field]: parseFloat(val) || 0 } : s)) } : e
        )
      );
    }
  }

  function addSet(exIdx: number) {
    const ex = localExs[exIdx];
    if ((ex.equipment?.length ?? 0) >= 2) {
      const tab = getActiveVariantTab(exIdx, ex);
      const variantSets = ex.variants?.[tab]?.sets ?? [];
      const last = variantSets[variantSets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 };
      updateExercise(exIdx, { variants: { ...ex.variants, [tab]: { ...ex.variants?.[tab], notes: ex.variants?.[tab]?.notes ?? [], sets: [...variantSets, { ...last }] } } });
    } else {
      setLocalExs((list) =>
        list.map((e, i) => {
          if (i !== exIdx) return e;
          const last = e.sets[e.sets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 };
          return { ...e, sets: [...e.sets, { ...last }] };
        })
      );
    }
  }

  function removeSet(exIdx: number, setIdx: number) {
    const ex = localExs[exIdx];
    if ((ex.equipment?.length ?? 0) >= 2) {
      const tab = getActiveVariantTab(exIdx, ex);
      const variantSets = (ex.variants?.[tab]?.sets ?? []).filter((_, j) => j !== setIdx);
      updateExercise(exIdx, { variants: { ...ex.variants, [tab]: { ...ex.variants?.[tab], notes: ex.variants?.[tab]?.notes ?? [], sets: variantSets } } });
    } else {
      setLocalExs((list) =>
        list.map((e, i) => i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e)
      );
    }
  }

  function updateNote(exIdx: number, noteIdx: number, val: string) {
    const ex = localExs[exIdx];
    if ((ex.equipment?.length ?? 0) >= 2) {
      const tab = getActiveVariantTab(exIdx, ex);
      const notes = [...(ex.variants?.[tab]?.notes ?? [])];
      notes[noteIdx] = val;
      updateExercise(exIdx, { variants: { ...ex.variants, [tab]: { sets: ex.variants?.[tab]?.sets ?? [], notes } } });
    } else {
      const notes = [...(ex.notes ?? [])];
      notes[noteIdx] = val;
      updateExercise(exIdx, { notes });
    }
  }

  function addNote(exIdx: number) {
    const ex = localExs[exIdx];
    if ((ex.equipment?.length ?? 0) >= 2) {
      const tab = getActiveVariantTab(exIdx, ex);
      updateExercise(exIdx, { variants: { ...ex.variants, [tab]: { sets: ex.variants?.[tab]?.sets ?? [], notes: [...(ex.variants?.[tab]?.notes ?? []), ''] } } });
    } else {
      updateExercise(exIdx, { notes: [...(ex.notes ?? []), ''] });
    }
  }

  function removeNote(exIdx: number, noteIdx: number) {
    const ex = localExs[exIdx];
    if ((ex.equipment?.length ?? 0) >= 2) {
      const tab = getActiveVariantTab(exIdx, ex);
      const notes = (ex.variants?.[tab]?.notes ?? []).filter((_, i) => i !== noteIdx);
      updateExercise(exIdx, { variants: { ...ex.variants, [tab]: { sets: ex.variants?.[tab]?.sets ?? [], notes } } });
    } else {
      updateExercise(exIdx, { notes: (ex.notes ?? []).filter((_, i) => i !== noteIdx) });
    }
  }

  function addExercise() {
    if (exerciseLibrary.length > 0) {
      setShowExPicker(true);
    } else {
      setLocalExs((list) => [...list, { id: crypto.randomUUID(), name: '', notes: [], sets: [{ reps: 10, weight: 0, restSeconds: 90 }], equipment: [] }]);
    }
  }

  function addExerciseFromLibrary(libItem: import('@/types').ExerciseLibraryItem) {
    setLocalExs((list) => [...list, {
      id: crypto.randomUUID(),
      name: libItem.nameHe || libItem.name,
      notes: [],
      sets: [{ reps: 10, weight: 0, restSeconds: settings.defaultRestSeconds }],
      equipment: libItem.equipment,
      muscleGroup: libItem.muscleGroup,
      libraryId: libItem.id,
    }]);
    setShowExPicker(false);
  }

  function removeExercise(idx: number) {
    setLocalExs((list) => list.filter((_, i) => i !== idx));
    setConfirmDeleteEx(null);
  }

  function moveExercise(idx: number, dir: -1 | 1) {
    const next = [...localExs];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocalExs(next);
  }

  // ── Inline notes editing (view mode) ─────────────────────────────────────

  function openInlineNotes(ex: PlanExercise) {
    setEditingNotesExId(ex.id);
    setInlineNotes([...getExNotes(ex)]);
  }

  function saveInlineNotes(ex: PlanExercise) {
    const filtered = inlineNotes.filter((n) => n.trim());
    const hasDual = (ex.equipment?.length ?? 0) >= 2;
    const eq = getActiveEquipment(ex);
    const updated = exercises.map((e) => {
      if (e.id !== ex.id) return e;
      if (hasDual && eq && e.variants?.[eq]) {
        return { ...e, variants: { ...e.variants, [eq]: { ...e.variants[eq]!, notes: filtered } } };
      }
      return { ...e, notes: filtered };
    });
    store.upsertPlan(selectedLocationId, id, updated);
    setEditingNotesExId(null);
  }

  function cancelInlineNotes() {
    setEditingNotesExId(null);
    setInlineNotes([]);
  }

  // ── Normal mode helpers ───────────────────────────────────────────────────

  function getActiveEquipment(ex: PlanExercise): EquipmentType | undefined {
    if (!ex.equipment?.length) return undefined;
    if (ex.equipment.length === 1) return ex.equipment[0];
    return activeEquipment[ex.id] ?? ex.equipment[0];
  }

  function getExNotes(ex: PlanExercise): string[] {
    const eq = getActiveEquipment(ex);
    const hasDual = (ex.equipment?.length ?? 0) >= 2;
    const raw = hasDual && eq && ex.variants?.[eq] ? ex.variants[eq]!.notes : ex.notes;
    return Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
  }

  function getExSets(ex: PlanExercise): PlanSet[] {
    const eq = getActiveEquipment(ex);
    if ((ex.equipment?.length ?? 0) >= 2 && eq && ex.variants?.[eq]) {
      return ex.variants[eq]!.sets;
    }
    return ex.sets ?? [];
  }

  function getSetsForExercise(ex: PlanExercise, equipment?: EquipmentType): Map<number, SessionSet> {
    const map = new Map<number, SessionSet>();
    if (!activeSession) return map;
    for (const s of activeSession.sets) {
      if (s.exerciseId === ex.id && (!equipment || s.equipment === equipment)) map.set(s.setNumber, s);
    }
    return map;
  }

  /** Everything the workout view needs about one exercise, derived from the plan and the live session. */
  function exerciseState(ex: PlanExercise) {
    const hasDual = (ex.equipment?.length ?? 0) >= 2;
    const eq = getActiveEquipment(ex);
    const done = getSetsForExercise(ex, hasDual ? eq : undefined);
    const planSets = getExSets(ex);
    const maxDoneIdx = Math.max(-1, ...done.keys());
    const total = Math.max(planSets.length, maxDoneIdx + 1, extraSets[ex.id] ?? 0, 1);
    let firstOpen = -1;
    for (let i = 0; i < total; i++) {
      if (!done.has(i)) { firstOpen = i; break; }
    }
    const previous = getPreviousSets(sessions, ex.name, hasDual ? eq : undefined, activeSession?.id);
    return { hasDual, eq, done, planSets, total, firstOpen, complete: firstOpen === -1, previous };
  }

  function defaultsFor(ex: PlanExercise, idx: number, st: ReturnType<typeof exerciseState>) {
    const saved = st.done.get(idx);
    if (saved) return { weight: saved.weight, reps: saved.reps };
    const prev = st.previous[idx];
    const plan = st.planSets[idx] ?? st.planSets[st.planSets.length - 1];
    const lastDone = st.done.get(idx - 1);
    return {
      // A weight change earlier in this session carries forward to the next set.
      weight: lastDone?.weight ?? prev?.weight ?? plan?.weight ?? 0,
      reps: prev?.reps ?? lastDone?.reps ?? plan?.reps ?? 10,
    };
  }

  function draftKey(ex: PlanExercise, eq: EquipmentType | undefined, idx: number) {
    return `${ex.id}|${eq ?? ''}|${idx}`;
  }

  function saveCurrentSet() {
    if (!activeSession || !currentEx || !current) return;
    const idx = currentSetIdx;
    const key = draftKey(currentEx, current.eq, idx);
    const weight = parseFloat(draftWeight) || 0;
    const reps = parseInt(draftReps) || 0;
    if (reps <= 0) return;
    const existing = current.done.get(idx);
    const equipment = current.hasDual ? current.eq : getActiveEquipment(currentEx);
    if (existing) {
      store.updateSet(existing.id, { weight, reps });
    } else {
      store.addSet({ exerciseId: currentEx.id, exerciseName: currentEx.name, setNumber: idx, weight, reps, rpe: null, equipment, muscleGroup: currentEx.muscleGroup });
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });

    // Advance: next open set in this exercise, else the next unfinished exercise.
    const doneNow = new Set([...current.done.keys(), idx]);
    let nextIdx = -1;
    for (let i = 0; i < current.total; i++) {
      if (!doneNow.has(i)) { nextIdx = i; break; }
    }
    if (nextIdx !== -1) {
      setSelectedSet((s) => ({ ...s, [currentEx.id]: nextIdx }));
      return;
    }
    setSelectedSet((s) => {
      const next = { ...s };
      delete next[currentEx.id];
      return next;
    });
    const order = exercises.findIndex((e) => e.id === currentEx.id);
    const rest = [...exercises.slice(order + 1), ...exercises.slice(0, order)];
    const nextEx = rest.find((e) => !exerciseState(e).complete);
    if (nextEx) setCurrentExId(nextEx.id);
  }

  function setDraft(field: 'weight' | 'reps', value: string) {
    if (!currentEx || !current) return;
    const key = draftKey(currentEx, current.eq, currentSetIdx);
    setDrafts((d) => ({
      ...d,
      [key]: { weight: d[key]?.weight ?? draftWeight, reps: d[key]?.reps ?? draftReps, [field]: value },
    }));
  }

  function step(field: 'weight' | 'reps', dir: 1 | -1) {
    const cur = parseFloat(field === 'weight' ? draftWeight : draftReps) || 0;
    const inc = field === 'reps' ? 1 : current?.eq === 'dumbbells' ? 1 : 2.5;
    const next = Math.max(0, Math.round((cur + dir * inc) * 10) / 10);
    setDraft(field, String(next));
  }

  function addExtraSet(ex: PlanExercise, st: ReturnType<typeof exerciseState>) {
    setExtraSets((e) => ({ ...e, [ex.id]: st.total + 1 }));
    setSelectedSet((s) => ({ ...s, [ex.id]: st.total }));
  }

  function finish() {
    const finishedId = store.finishSession();
    router.push(finishedId ? `/summary/${finishedId}` : '/');
  }

  function discard() {
    store.cancelSession();
    router.push('/');
  }

  // ── Derived view state ────────────────────────────────────────────────────
  const states = new Map(exercises.map((e) => [e.id, exerciseState(e)]));
  const currentEx =
    exercises.find((e) => e.id === currentExId) ??
    exercises.find((e) => !states.get(e.id)!.complete) ??
    exercises[0];
  const current = currentEx ? states.get(currentEx.id)! : undefined;
  const currentSetIdx = currentEx && current
    ? Math.min(selectedSet[currentEx.id] ?? (current.firstOpen === -1 ? current.total - 1 : current.firstOpen), current.total - 1)
    : 0;
  const currentDefaults = currentEx && current ? defaultsFor(currentEx, currentSetIdx, current) : { weight: 0, reps: 0 };
  const currentDraft = currentEx && current ? drafts[draftKey(currentEx, current.eq, currentSetIdx)] : undefined;
  const draftWeight = currentDraft?.weight ?? String(currentDefaults.weight);
  const draftReps = currentDraft?.reps ?? String(currentDefaults.reps);
  const totalSets = exercises.reduce((n, e) => n + states.get(e.id)!.total, 0);
  const doneSetCount = exercises.reduce((n, e) => n + states.get(e.id)!.done.size, 0);
  const elapsed = activeSession ? Math.max(0, Math.floor((now - new Date(activeSession.startedAt).getTime()) / 1000)) : 0;
  const currentRest = current?.planSets[currentSetIdx]?.restSeconds ?? settings.defaultRestSeconds;
  const locationName = locations.find((l) => l.id === selectedLocationId)?.name ?? '';

  return (
    <div className="min-h-screen bg-ink" style={{ paddingBottom: isEditing ? '2rem' : '7.5rem' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/')}
            aria-label="חזרה לדף הבית"
            className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-white shrink-0"
          >
            <ChevronRight size={20} />
          </button>
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              aria-label="שם האימון"
              className="flex-1 min-w-0 bg-surface-2 rounded-xl px-3 py-2 text-white font-bold text-lg border border-accent focus:outline-none"
            />
          ) : (
            <div className="flex-1 min-w-0 text-center">
              <div className="font-bold text-white text-base truncate">{workoutType.name}</div>
              <div className="text-xs text-muted">
                {locationName}
                {activeSession && <> · <span className="font-num text-sm tracking-wide">{formatClock(elapsed)}</span></>}
              </div>
            </div>
          )}
          <button
            onClick={isEditing ? cancelEdit : enterEditMode}
            aria-label={isEditing ? 'ביטול עריכה' : 'עריכת תוכנית'}
            className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-white shrink-0"
          >
            {isEditing ? <X size={18} /> : <Edit2 size={17} />}
          </button>
        </div>

        {(isEditing || locations.length > 1) && (
        <div className="flex gap-2 flex-wrap justify-center">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-1">
              <button
                onClick={() => handleLocationChange(loc.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedLocationId === loc.id ? 'bg-white text-ink' : 'bg-surface text-muted'
                }`}
              >
                {loc.name}
              </button>
              {isEditing && (
                confirmDeleteLoc === loc.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => deleteLocation(loc.id)} className="text-red-400 text-xs font-medium">כן</button>
                    <button onClick={() => setConfirmDeleteLoc(null)} className="text-muted text-xs">ביטול</button>
                  </div>
                ) : (
                  locations.length > 1 && (
                    <button onClick={() => setConfirmDeleteLoc(loc.id)} className="text-faint active:text-red-400">
                      <X size={14} />
                    </button>
                  )
                )
              )}
            </div>
          ))}
          {isEditing && (
            showAddLoc ? (
              <div className="flex items-center gap-1">
                <input
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                  placeholder="שם מיקום"
                  autoFocus
                  className="bg-surface-2 rounded-lg px-2 py-1 text-white text-xs border border-accent focus:outline-none w-24"
                />
                <button onClick={addLocation} className="text-good"><Check size={14} /></button>
                <button onClick={() => { setShowAddLoc(false); setNewLocName(''); }} className="text-muted"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLoc(true)}
                className="px-2 py-1.5 rounded-lg bg-surface-2 text-muted active:text-[#d4d4d8]"
              >
                <Plus size={14} />
              </button>
            )
          )}
        </div>
        )}

        {!isEditing && exercises.length > 0 && (
          <div className="flex gap-1" aria-hidden="true">
            {exercises.map((ex) => {
              const st = states.get(ex.id)!;
              const isCurrent = ex.id === currentEx?.id;
              return (
                <div
                  key={ex.id}
                  className={`flex-1 h-1 rounded-full ${st.complete ? 'bg-accent' : st.done.size > 0 || isCurrent ? 'bg-accent/45' : 'bg-surface-3'}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {isEditing ? (
          // ── Edit mode ──────────────────────────────────────────────────────
          <>
            {localExs.length === 0 && (
              <div className="text-center py-8 text-faint text-sm">אין תרגילים — הוסף את הראשון</div>
            )}
            {localExs.map((ex, exIdx) => {
              const hasDual = (ex.equipment?.length ?? 0) >= 2;
              const activeTab = getActiveVariantTab(exIdx, ex);
              const currentNotes = hasDual ? (ex.variants?.[activeTab]?.notes ?? []) : (ex.notes ?? []);
              const currentSets = hasDual ? (ex.variants?.[activeTab]?.sets ?? []) : (ex.sets ?? []);

              return (
                <div key={ex.id} className="bg-surface rounded-xl p-3 space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveExercise(exIdx, -1)} disabled={exIdx === 0} className="text-muted disabled:opacity-30 text-xs leading-none">▲</button>
                      <button onClick={() => moveExercise(exIdx, 1)} disabled={exIdx === localExs.length - 1} className="text-muted disabled:opacity-30 text-xs leading-none">▼</button>
                    </div>
                    <input
                      value={ex.name}
                      onChange={(e) => updateExercise(exIdx, { name: e.target.value })}
                      onBlur={(e) => {
                        if (!ex.muscleGroup) {
                          const guess = guessMuscleGroup(e.target.value);
                          if (guess) updateExercise(exIdx, { muscleGroup: guess });
                        }
                      }}
                      placeholder="שם תרגיל"
                      className="flex-1 bg-surface-2 rounded px-2 py-1.5 text-white text-sm border border-line focus:border-accent focus:outline-none text-right"
                    />
                    {confirmDeleteEx === exIdx ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-red-400 text-xs">מחק?</span>
                        <button onClick={() => removeExercise(exIdx)} className="text-red-400 text-xs font-medium">כן</button>
                        <button onClick={() => setConfirmDeleteEx(null)} className="text-muted text-xs">ביטול</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteEx(exIdx)} className="text-red-400 shrink-0">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Muscle group */}
                  <div className="flex justify-end">
                    <select
                      value={ex.muscleGroup ?? ''}
                      onChange={(e) => updateExercise(exIdx, { muscleGroup: (e.target.value as MuscleGroup) || undefined })}
                      className="bg-surface-2 rounded px-2 py-1 text-[#d4d4d8] text-xs border border-line focus:border-accent focus:outline-none"
                    >
                      <option value="">קבוצת שריר...</option>
                      {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((mg) => (
                        <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Equipment toggles */}
                  <div className="flex gap-1.5 justify-end">
                    {ALL_EQUIPMENT.map((eq) => {
                      const selected = ex.equipment?.includes(eq) ?? false;
                      const disabled = !selected && (ex.equipment?.length ?? 0) >= 2;
                      return (
                        <button
                          key={eq}
                          onClick={() => !disabled && toggleEquipment(exIdx, eq)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            selected ? 'bg-accent text-ink' : disabled ? 'bg-surface-2 text-faint' : 'bg-surface-2 text-muted active:bg-surface-3'
                          }`}
                        >
                          {EQUIPMENT_LABELS[eq]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Variant tabs */}
                  {hasDual && (
                    <div className="flex gap-1.5 justify-end">
                      {ex.equipment.map((eq) => (
                        <button
                          key={eq}
                          onClick={() => setActiveVariantTab((prev) => ({ ...prev, [exIdx]: eq }))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === eq ? 'bg-surface-3 text-white' : 'bg-surface-2 text-muted'
                          }`}
                        >
                          {EQUIPMENT_LABELS[eq]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-1">
                    {currentNotes.map((note, ni) => (
                      <div key={ni} className="flex items-center gap-1">
                        <input
                          value={note}
                          onChange={(e) => updateNote(exIdx, ni, e.target.value)}
                          placeholder="הערה..."
                          className="flex-1 bg-surface-2 rounded px-2 py-1 text-[#d4d4d8] text-xs border border-line focus:border-accent focus:outline-none"
                        />
                        <button onClick={() => removeNote(exIdx, ni)} className="text-faint active:text-red-400 shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addNote(exIdx)} className="flex items-center gap-1 text-faint text-xs">
                      <Plus size={10} /> הוסף הערה
                    </button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-1 text-xs text-muted text-center">
                      <div>סט</div><div>ק״ג</div><div>חז&apos;</div><div>מנוחה</div><div></div>
                    </div>
                    {currentSets.map((s, setIdx) => (
                      <div key={setIdx} className="grid grid-cols-5 gap-1 items-center">
                        <div className="text-xs text-muted text-center">{setIdx + 1}</div>
                        {(['weight', 'reps', 'restSeconds'] as const).map((field) => (
                          <input
                            key={field}
                            type="number"
                            value={s[field]}
                            onChange={(e) => updateSet(exIdx, setIdx, field, e.target.value)}
                            className="bg-surface-2 rounded px-1 py-1 text-white text-center text-xs border border-line focus:border-accent focus:outline-none"
                          />
                        ))}
                        {currentSets.length > 1 ? (
                          <button onClick={() => removeSet(exIdx, setIdx)} className="text-red-400 flex justify-center"><X size={12} /></button>
                        ) : <div />}
                      </div>
                    ))}
                    <button onClick={() => addSet(exIdx)} className="text-accent text-xs flex items-center gap-1 mt-1">
                      <Plus size={12} /> הוסף סט
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={addExercise}
              className="w-full border border-dashed border-line rounded-xl py-3 text-muted text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> הוסף תרגיל
            </button>

            <button
              onClick={saveEdit}
              className="w-full bg-accent text-ink py-3 rounded-xl font-bold text-sm"
            >
              שמור שינויים
            </button>
          </>
        ) : (
          // ── Workout mode ───────────────────────────────────────────────────
          <>
            {exercises.length === 0 && (
              <div className="text-center py-16 text-muted">
                <div className="text-base font-medium text-white mb-1">אין תרגילים במיקום הזה</div>
                <div className="text-sm">לחץ על העיפרון למעלה כדי לבנות את התוכנית</div>
              </div>
            )}

            {exercises.map((ex, exIdx) => {
              const st = states.get(ex.id)!;
              if (ex.id !== currentEx?.id) {
                const lastDone = st.done.size ? [...st.done.values()].sort((a, b) => b.setNumber - a.setNumber)[0] : null;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setCurrentExId(ex.id)}
                    className="w-full bg-surface rounded-2xl px-4 py-3.5 flex items-center gap-3 text-right active:bg-surface-2"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        st.complete ? 'bg-accent text-ink' : 'bg-surface-3 text-muted'
                      }`}
                    >
                      {st.complete ? <Check size={16} strokeWidth={3} /> : exIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${st.complete ? 'text-muted' : 'text-white'}`}>{ex.name}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {st.done.size}/{st.total} סטים
                        {lastDone && <> · אחרון {formatKg(lastDone.weight)}×{lastDone.reps}</>}
                      </div>
                    </div>
                    <ChevronLeft size={18} className="text-faint shrink-0" />
                  </button>
                );
              }

              const notes = getExNotes(ex);
              const libItem = ex.libraryId ? exerciseLibrary.find((l) => l.id === ex.libraryId) : undefined;
              const prevSet = st.previous[currentSetIdx];
              const savedHere = st.done.get(currentSetIdx);
              const weightNum = parseFloat(draftWeight) || 0;
              const diff = prevSet ? Math.round((weightNum - prevSet.weight) * 10) / 10 : null;

              return (
                <section key={ex.id} aria-label={ex.name} className="bg-surface rounded-[28px] p-5 space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted font-medium">תרגיל {exIdx + 1} מתוך {exercises.length}</div>
                    <h2 className="text-2xl font-extrabold leading-tight text-white">{ex.name}</h2>
                  </div>

                  {st.hasDual && (
                    <div className="flex gap-2">
                      {ex.equipment.map((eq) => (
                        <button
                          key={eq}
                          onClick={() => setActiveEquipment((prev) => ({ ...prev, [ex.id]: eq }))}
                          className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${
                            st.eq === eq ? 'bg-white text-ink' : 'bg-surface-2 text-muted'
                          }`}
                        >
                          {EQUIPMENT_LABELS[eq]}
                        </button>
                      ))}
                    </div>
                  )}

                  {libItem?.gifUrl && (
                    <div className="flex justify-center">
                      <img src={libItem.gifUrl} alt={libItem.name} className="w-44 h-44 object-contain rounded-2xl bg-white" />
                    </div>
                  )}

                  {editingNotesExId === ex.id ? (
                    <div className="space-y-2">
                      {inlineNotes.map((note, ni) => (
                        <div key={ni} className="flex items-center gap-2">
                          <input
                            value={note}
                            onChange={(e) => setInlineNotes((prev) => prev.map((n, i) => i === ni ? e.target.value : n))}
                            placeholder="דגש לתרגיל..."
                            aria-label={`דגש ${ni + 1}`}
                            className="flex-1 bg-surface-2 rounded-xl px-3 py-2 text-white text-sm border border-line focus:border-accent focus:outline-none"
                          />
                          <button onClick={() => setInlineNotes((prev) => prev.filter((_, i) => i !== ni))} aria-label="מחק דגש" className="text-faint active:text-red-400 shrink-0 p-1">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setInlineNotes((prev) => [...prev, ''])} className="flex items-center gap-1 text-muted text-sm">
                        <Plus size={14} /> הוסף דגש
                      </button>
                      <div className="flex gap-2 pt-1">
                        <button onClick={cancelInlineNotes} className="flex-1 bg-surface-2 text-muted py-2.5 rounded-xl text-sm">ביטול</button>
                        <button onClick={() => saveInlineNotes(ex)} className="flex-1 bg-white text-ink py-2.5 rounded-xl text-sm font-bold">שמור</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => openInlineNotes(ex)} className="w-full text-right bg-surface-2/60 rounded-2xl px-4 py-3 space-y-1">
                      {notes.length > 0 ? (
                        notes.map((note, ni) =>
                          isUrl(note) ? (
                            <a
                              key={ni}
                              href={note}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-accent text-sm truncate"
                            >
                              <ExternalLink size={13} className="shrink-0" />
                              <span className="truncate">{note}</span>
                            </a>
                          ) : (
                            <div key={ni} className="text-sm text-[#d4d4d8] leading-snug">• {note}</div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-faint">+ הוסף דגשים לתרגיל</div>
                      )}
                    </button>
                  )}

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-base font-bold text-white">
                      סט {currentSetIdx + 1} <span className="text-muted font-medium">מתוך {st.total}</span>
                    </div>
                    <div className="text-sm text-muted">
                      {prevSet ? <>בפעם הקודמת: <span className="text-white font-medium">{formatKg(prevSet.weight)} × {prevSet.reps}</span></> : 'פעם ראשונה'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <NumberStepper
                      label="ק״ג"
                      value={draftWeight}
                      accent
                      decimal
                      onChange={(v) => setDraft('weight', v)}
                      onStep={(d) => step('weight', d)}
                    />
                    <NumberStepper
                      label="חזרות"
                      value={draftReps}
                      onChange={(v) => setDraft('reps', v)}
                      onStep={(d) => step('reps', d)}
                    />
                  </div>

                  {diff !== null && (
                    <div className={`text-center text-sm font-medium ${diff > 0 ? 'text-accent' : 'text-muted'}`}>
                      {diff > 0 ? `▲ ${formatKg(diff)} ק״ג מהפעם הקודמת` : diff < 0 ? `▼ ${formatKg(-diff)} ק״ג מהפעם הקודמת` : 'אותו משקל כמו בפעם הקודמת'}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({ length: st.total }).map((_, i) => {
                      const d = st.done.get(i);
                      const selected = i === currentSetIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedSet((s) => ({ ...s, [ex.id]: i }))}
                          aria-label={`סט ${i + 1}`}
                          aria-pressed={selected}
                          className={`h-9 px-3 rounded-full text-sm font-medium flex items-center gap-1 border ${
                            selected
                              ? 'border-accent text-white bg-surface-2'
                              : d
                              ? 'border-transparent bg-surface-2 text-[#d4d4d8]'
                              : 'border-dashed border-line text-faint'
                          }`}
                        >
                          {d ? <><Check size={13} strokeWidth={3} className="text-accent" /> {formatKg(d.weight)}×{d.reps}</> : `סט ${i + 1}`}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => addExtraSet(ex, st)}
                      aria-label="הוסף סט"
                      className="h-9 w-9 rounded-full border border-dashed border-line text-faint flex items-center justify-center"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  {savedHere && (
                    <div className="text-center text-xs text-faint">הסט הזה כבר נשמר — שינוי יעדכן אותו</div>
                  )}
                </section>
              );
            })}

            {exercises.length > 0 && (
              <button
                onClick={() => setShowFinish(true)}
                className="w-full bg-surface text-white py-4 rounded-2xl font-bold text-base mt-2"
              >
                סיים אימון
              </button>
            )}
          </>
        )}
      </div>

      {/* Primary action bar */}
      {!isEditing && currentEx && (
        <div
          className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-ink via-ink to-transparent pt-6"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-lg mx-auto px-4 flex gap-3">
            <button
              onClick={saveCurrentSet}
              className="flex-1 h-16 rounded-full bg-accent text-ink text-lg font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Check size={22} strokeWidth={3} />
              {current?.done.has(currentSetIdx) ? 'עדכן סט' : 'סיימתי סט'}
            </button>
            <button
              onClick={() => setRestTimer({ seconds: currentRest })}
              aria-label="טיימר מנוחה"
              className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-white"
            >
              <Timer size={24} />
            </button>
          </div>
        </div>
      )}

      {showFinish && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => { setShowFinish(false); setConfirmDiscard(false); }}>
          <div
            className="w-full max-w-lg mx-auto bg-surface rounded-t-[28px] p-6 space-y-4"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-extrabold">לסיים את האימון?</div>
            <div className="text-muted text-sm">
              השלמת <span className="text-white font-bold">{doneSetCount}</span> מתוך {totalSets} סטים
              {activeSession && <> · {formatClock(elapsed)}</>}
            </div>
            <button onClick={finish} className="w-full h-14 rounded-full bg-accent text-ink font-extrabold text-base">
              {doneSetCount > 0 ? 'סיים ושמור' : 'סיים (לא נשמרו סטים)'}
            </button>
            <button onClick={() => setShowFinish(false)} className="w-full h-12 rounded-full bg-surface-2 text-white font-medium">
              המשך להתאמן
            </button>
            {confirmDiscard ? (
              <button onClick={discard} className="w-full text-red-400 text-sm font-medium py-2">
                בטוח? כל הסטים של האימון הזה יימחקו
              </button>
            ) : (
              <button onClick={() => setConfirmDiscard(true)} className="w-full text-faint text-sm py-2">
                בטל אימון בלי לשמור
              </button>
            )}
          </div>
        </div>
      )}

      {restTimer && (
        <RestTimer seconds={restTimer.seconds} onClose={() => setRestTimer(null)} />
      )}

      {showExPicker && (
        <ExerciseListPicker
          items={exerciseLibrary}
          title="בחר תרגיל"
          showEquipmentFilter
          isUsed={(item) => localExs.some((e) => e.libraryId === item.id)}
          onSelect={addExerciseFromLibrary}
          headerAction={{
            label: '+ ידני',
            onClick: () => {
              setLocalExs((list) => [...list, { id: crypto.randomUUID(), name: '', notes: [], sets: [{ reps: 10, weight: 0, restSeconds: settings.defaultRestSeconds }], equipment: [] }]);
              setShowExPicker(false);
            },
          }}
          onClose={() => setShowExPicker(false)}
        />
      )}
    </div>
  );
}


interface NumberStepperProps {
  label: string;
  value: string;
  accent?: boolean;
  decimal?: boolean;
  onChange: (value: string) => void;
  onStep: (dir: 1 | -1) => void;
}

function NumberStepper({ label, value, accent, decimal, onChange, onStep }: NumberStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="flex flex-col items-center gap-1 w-full">
        <span className="text-xs text-muted font-medium">{label}</span>
        <input
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          onFocus={(e) => e.target.select()}
          className={`w-full bg-transparent text-center font-num font-bold text-[76px] leading-none focus:outline-none ${accent ? 'text-accent' : 'text-white'}`}
        />
      </label>
      <div className="flex gap-2">
        <button onClick={() => onStep(-1)} aria-label={`הורד ${label}`} className="w-14 h-11 rounded-2xl bg-surface-2 text-white flex items-center justify-center active:bg-surface-3">
          <Minus size={20} />
        </button>
        <button onClick={() => onStep(1)} aria-label={`הוסף ${label}`} className="w-14 h-11 rounded-2xl bg-surface-2 text-white flex items-center justify-center active:bg-surface-3">
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
