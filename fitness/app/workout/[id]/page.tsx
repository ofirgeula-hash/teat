'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStore, getLastSessionSets } from '@/store';
import { useEffect, useState } from 'react';
import type { SessionSet, PlanExercise, PlanSet, EquipmentType, MuscleGroup } from '@/types';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '@/types';
import RestTimer from '@/components/RestTimer';
import { ChevronDown, ChevronUp, ExternalLink, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';

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
  const { workoutTypes, locations, locationPlans, sessions, activeSession, settings } = store;

  const workoutType = workoutTypes.find((w) => w.id === id);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [activeEquipment, setActiveEquipment] = useState<Record<string, EquipmentType>>({});

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [localExs, setLocalExs] = useState<PlanExercise[]>([]);
  const [activeVariantTab, setActiveVariantTab] = useState<Record<number, EquipmentType>>({});
  const [confirmDeleteEx, setConfirmDeleteEx] = useState<number | null>(null);
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<string | null>(null);
  const [showAddLoc, setShowAddLoc] = useState(false);

  // Inline notes editing in view mode
  const [editingNotesExId, setEditingNotesExId] = useState<string | null>(null);
  const [inlineNotes, setInlineNotes] = useState<string[]>([]);
  const [newLocName, setNewLocName] = useState('');

  useEffect(() => {
    const state = useStore.getState();

    if (state.activeSession?.workoutTypeId === id) {
      const locId = state.activeSession.locationId;
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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-gray-400 text-center">אימון לא נמצא</div>
        <button
          onClick={() => { store.cancelSession(); router.push('/'); }}
          className="bg-gray-800 text-white px-6 py-3 rounded-xl text-sm font-medium"
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
    setExpandedEx(new Set());
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
    setLocalExs((list) => [...list, { id: crypto.randomUUID(), name: '', notes: [], sets: [{ reps: 10, weight: 0, restSeconds: 90 }], equipment: [] }]);
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

  function getSetsForExercise(exId: string, equipment?: EquipmentType): SessionSet[] {
    if (!activeSession) return [];
    return activeSession.sets.filter(
      (s) => s.exerciseId === exId && (!equipment || s.equipment === equipment)
    );
  }

  function getDefaultSet(ex: PlanExercise, setIdx: number, equipment?: EquipmentType) {
    const lastSets = getLastSessionSets(
      sessions.filter((s) => s.endedAt && s.id !== activeSession?.id),
      id,
      ex.id,
      equipment,
    );
    const last = lastSets[setIdx];
    const planSets = getExSets(ex);
    const planSet = planSets[setIdx] ?? planSets[planSets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 };
    return {
      weight: last?.weight ?? planSet.weight,
      reps: last?.reps ?? planSet.reps,
      restSeconds: planSet.restSeconds,
    };
  }

  function handleAutoSave(ex: PlanExercise, weight: number, reps: number, rpe: number | null, setIdx: number, existingSetId: string | undefined) {
    if (!activeSession) return;
    const equipment = getActiveEquipment(ex);
    if (existingSetId) {
      store.updateSet(existingSetId, { weight, reps, rpe });
    } else {
      store.addSet({ exerciseId: ex.id, exerciseName: ex.name, setNumber: setIdx, weight, reps, rpe, equipment, muscleGroup: ex.muscleGroup });
      const planSets = getExSets(ex);
      const rest = planSets[setIdx]?.restSeconds ?? settings.defaultRestSeconds;
      setRestTimer({ seconds: rest });
    }
  }

  function finish() {
    store.finishSession();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 space-y-2"
        style={{ borderBottom: `2px solid ${workoutType.color}` }}
      >
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-white font-bold text-lg border border-blue-500 focus:outline-none ml-2"
            />
          ) : (
            <div className="font-bold text-white text-lg flex-1">
              {workoutType.emoji} {workoutType.name}
            </div>
          )}
          <button
            onClick={isEditing ? cancelEdit : enterEditMode}
            className={`p-2 rounded-lg ${isEditing ? 'text-gray-400 active:text-white' : 'text-gray-500 active:text-gray-300'}`}
          >
            {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          </button>
        </div>

        {/* Location tabs */}
        <div className="flex gap-2 flex-wrap">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-1">
              <button
                onClick={() => handleLocationChange(loc.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedLocationId === loc.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {loc.name}
              </button>
              {isEditing && (
                confirmDeleteLoc === loc.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => deleteLocation(loc.id)} className="text-red-400 text-xs font-medium">כן</button>
                    <button onClick={() => setConfirmDeleteLoc(null)} className="text-gray-500 text-xs">ביטול</button>
                  </div>
                ) : (
                  locations.length > 1 && (
                    <button onClick={() => setConfirmDeleteLoc(loc.id)} className="text-gray-600 active:text-red-400">
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
                  className="bg-gray-800 rounded-lg px-2 py-1 text-white text-xs border border-blue-500 focus:outline-none w-24"
                />
                <button onClick={addLocation} className="text-green-400"><Check size={14} /></button>
                <button onClick={() => { setShowAddLoc(false); setNewLocName(''); }} className="text-gray-500"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLoc(true)}
                className="px-2 py-1.5 rounded-lg bg-gray-800 text-gray-500 active:text-gray-300"
              >
                <Plus size={14} />
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isEditing ? (
          // ── Edit mode ──────────────────────────────────────────────────────
          <>
            {localExs.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">אין תרגילים — הוסף את הראשון</div>
            )}
            {localExs.map((ex, exIdx) => {
              const hasDual = (ex.equipment?.length ?? 0) >= 2;
              const activeTab = getActiveVariantTab(exIdx, ex);
              const currentNotes = hasDual ? (ex.variants?.[activeTab]?.notes ?? []) : (ex.notes ?? []);
              const currentSets = hasDual ? (ex.variants?.[activeTab]?.sets ?? []) : (ex.sets ?? []);

              return (
                <div key={ex.id} className="bg-gray-900 rounded-xl p-3 space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveExercise(exIdx, -1)} disabled={exIdx === 0} className="text-gray-500 disabled:opacity-30 text-xs leading-none">▲</button>
                      <button onClick={() => moveExercise(exIdx, 1)} disabled={exIdx === localExs.length - 1} className="text-gray-500 disabled:opacity-30 text-xs leading-none">▼</button>
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
                      className="flex-1 bg-gray-800 rounded px-2 py-1.5 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none text-right"
                    />
                    {confirmDeleteEx === exIdx ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-red-400 text-xs">מחק?</span>
                        <button onClick={() => removeExercise(exIdx)} className="text-red-400 text-xs font-medium">כן</button>
                        <button onClick={() => setConfirmDeleteEx(null)} className="text-gray-400 text-xs">ביטול</button>
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
                      className="bg-gray-800 rounded px-2 py-1 text-gray-300 text-xs border border-gray-700 focus:border-blue-500 focus:outline-none"
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
                            selected ? 'bg-blue-600 text-white' : disabled ? 'bg-gray-800 text-gray-600' : 'bg-gray-800 text-gray-400 active:bg-gray-700'
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
                            activeTab === eq ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
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
                          className="flex-1 bg-gray-800 rounded px-2 py-1 text-gray-300 text-xs border border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                        <button onClick={() => removeNote(exIdx, ni)} className="text-gray-600 active:text-red-400 shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addNote(exIdx)} className="flex items-center gap-1 text-gray-600 text-xs">
                      <Plus size={10} /> הוסף הערה
                    </button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                      <div>סט</div><div>ק״ג</div><div>חז&apos;</div><div>מנוחה</div><div></div>
                    </div>
                    {currentSets.map((s, setIdx) => (
                      <div key={setIdx} className="grid grid-cols-5 gap-1 items-center">
                        <div className="text-xs text-gray-500 text-center">{setIdx + 1}</div>
                        {(['weight', 'reps', 'restSeconds'] as const).map((field) => (
                          <input
                            key={field}
                            type="number"
                            value={s[field]}
                            onChange={(e) => updateSet(exIdx, setIdx, field, e.target.value)}
                            className="bg-gray-800 rounded px-1 py-1 text-white text-center text-xs border border-gray-700 focus:border-blue-500 focus:outline-none"
                          />
                        ))}
                        {currentSets.length > 1 ? (
                          <button onClick={() => removeSet(exIdx, setIdx)} className="text-red-400 flex justify-center"><X size={12} /></button>
                        ) : <div />}
                      </div>
                    ))}
                    <button onClick={() => addSet(exIdx)} className="text-blue-400 text-xs flex items-center gap-1 mt-1">
                      <Plus size={12} /> הוסף סט
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={addExercise}
              className="w-full border border-dashed border-gray-700 rounded-xl py-3 text-gray-400 text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> הוסף תרגיל
            </button>

            <button
              onClick={saveEdit}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm"
            >
              שמור שינויים
            </button>
          </>
        ) : (
          // ── Normal workout mode ────────────────────────────────────────────
          <>
            {exercises.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-sm">אין תרגילים במיקום זה</div>
                <div className="text-xs mt-1">לחץ על ✏️ כדי לערוך את התוכנית</div>
              </div>
            )}

            {exercises.map((ex) => {
              const isExpanded = expandedEx.has(ex.id);
              const hasDualEquipment = (ex.equipment?.length ?? 0) >= 2;
              const currentEq = getActiveEquipment(ex);
              const doneSets = getSetsForExercise(ex.id, hasDualEquipment ? currentEq : undefined);
              const notes = getExNotes(ex);
              const planSets = getExSets(ex);

              return (
                <div key={ex.id} className="bg-gray-900 rounded-xl overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center justify-between"
                    onClick={() =>
                      setExpandedEx((prev) => {
                        const next = new Set(prev);
                        next.has(ex.id) ? next.delete(ex.id) : next.add(ex.id);
                        return next;
                      })
                    }
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      <span className="font-semibold text-white">{ex.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ex.equipment?.length === 1 && (
                        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                          {EQUIPMENT_LABELS[ex.equipment[0]]}
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <>
                      {hasDualEquipment && (
                        <div className="px-4 pb-2 flex gap-2 justify-end">
                          {ex.equipment.map((eq) => (
                            <button
                              key={eq}
                              onClick={() => setActiveEquipment((prev) => ({ ...prev, [ex.id]: eq }))}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                currentEq === eq ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              {EQUIPMENT_LABELS[eq]}
                            </button>
                          ))}
                        </div>
                      )}

                      {editingNotesExId === ex.id ? (
                        <div className="px-4 pb-3 space-y-2">
                          {inlineNotes.map((note, ni) => (
                            <div key={ni} className="flex items-center gap-1">
                              <input
                                value={note}
                                onChange={(e) => setInlineNotes((prev) => prev.map((n, i) => i === ni ? e.target.value : n))}
                                placeholder="הערה..."
                                className="flex-1 bg-gray-800 rounded px-2 py-1 text-gray-300 text-xs border border-gray-700 focus:border-blue-500 focus:outline-none"
                              />
                              <button onClick={() => setInlineNotes((prev) => prev.filter((_, i) => i !== ni))} className="text-gray-600 active:text-red-400 shrink-0">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => setInlineNotes((prev) => [...prev, ''])} className="flex items-center gap-1 text-gray-600 text-xs">
                            <Plus size={10} /> הוסף הערה
                          </button>
                          <div className="flex gap-2 pt-1">
                            <button onClick={cancelInlineNotes} className="flex-1 bg-gray-800 text-gray-400 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1">
                              <X size={12} /> ביטול
                            </button>
                            <button onClick={() => saveInlineNotes(ex)} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                              <Check size={12} /> שמור
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 pb-2">
                          {notes.length > 0 && (
                            <div className="space-y-1 mb-1">
                              {notes.map((note, noteIdx) => (
                                <div key={noteIdx} className="flex items-start gap-2">
                                  <span className="text-gray-600 text-xs shrink-0 mt-0.5">•</span>
                                  {isUrl(note) ? (
                                    <a href={note} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 text-xs active:text-blue-300 truncate">
                                      <ExternalLink size={10} className="shrink-0" />
                                      <span className="truncate">{note}</span>
                                    </a>
                                  ) : (
                                    <span className="text-gray-500 text-xs">{note}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => openInlineNotes(ex)} className="flex items-center gap-1 text-gray-600 active:text-gray-400 text-xs">
                            <Edit2 size={11} /> {notes.length > 0 ? 'ערוך הערות' : 'הוסף הערה'}
                          </button>
                        </div>
                      )}

                      <div className="px-4 pb-4 space-y-2">
                        <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 text-center mb-1">
                          <div className="col-span-1">סט</div>
                          <div className="col-span-5">ק״ג</div>
                          <div className="col-span-4">חז&apos;</div>
                          <div className="col-span-2">RPE</div>
                        </div>

                        {Array.from({ length: Math.max(planSets.length, doneSets.length) }).map((_, setIdx) => {
                          const def = getDefaultSet(ex, setIdx, hasDualEquipment ? currentEq : undefined);
                          const done = doneSets[setIdx];
                          return (
                            <SetRow
                              key={`${ex.id}-${currentEq ?? 'none'}-${setIdx}`}
                              setIdx={setIdx + 1}
                              defaultWeight={def.weight}
                              defaultReps={def.reps}
                              savedSet={done}
                              onSave={(w, r, rpe) => handleAutoSave(ex, w, r, rpe, setIdx, done?.id)}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <button
              onClick={finish}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base mt-4"
            >
              סיים אימון
            </button>
          </>
        )}
      </div>

      {restTimer && (
        <RestTimer seconds={restTimer.seconds} onClose={() => setRestTimer(null)} />
      )}
    </div>
  );
}

interface SetRowProps {
  setIdx: number;
  defaultWeight: number;
  defaultReps: number;
  savedSet?: SessionSet;
  onSave: (weight: number, reps: number, rpe: number | null) => void;
}

function SetRow({ setIdx, defaultWeight, defaultReps, savedSet, onSave }: SetRowProps) {
  const [weight, setWeight] = useState(String(savedSet?.weight ?? defaultWeight));
  const [reps, setReps] = useState(String(savedSet?.reps ?? defaultReps));
  const [rpe, setRpe] = useState(savedSet?.rpe != null ? String(savedSet.rpe) : '');

  const isDone = !!savedSet;

  function handleBlur() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (r > 0) {
      onSave(w, r, rpe ? parseInt(rpe) : null);
    }
  }

  const inputClass = (done: boolean) =>
    `w-full bg-gray-800 rounded-lg px-2 py-2 text-center text-sm border focus:outline-none font-mono ${
      done ? 'text-green-400 border-green-900 focus:border-green-600' : 'text-white border-gray-700 focus:border-blue-500'
    }`;

  return (
    <div className="grid grid-cols-12 gap-1 items-center">
      <div className={`col-span-1 text-center text-xs font-medium ${isDone ? 'text-green-500' : 'text-gray-500'}`}>
        {setIdx}
      </div>
      <div className="col-span-5">
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} onBlur={handleBlur} className={inputClass(isDone)} step="0.5" />
      </div>
      <div className="col-span-4">
        <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} onBlur={handleBlur} className={inputClass(isDone)} />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          onBlur={handleBlur}
          placeholder="—"
          min="1"
          max="10"
          className={`w-full bg-gray-800 rounded-lg px-1 py-2 text-center text-xs border focus:outline-none ${
            isDone ? 'text-gray-500 border-green-900' : 'text-white border-gray-700 focus:border-blue-500'
          }`}
        />
      </div>
    </div>
  );
}
