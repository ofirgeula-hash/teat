'use client';
import { useStore } from '@/store';
import { useState } from 'react';
import type { Location, WorkoutType, PlanExercise, PlanSet } from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';

type Tab = 'תוכנית' | 'כללי';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('תוכנית');

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
      </div>

      <div className="flex gap-2">
        {(['תוכנית', 'כללי'] as Tab[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {tab === 'תוכנית' && <PlanSection />}
      {tab === 'כללי' && <GeneralSection />}
    </div>
  );
}

// ─── Plan Section ─────────────────────────────────────────────────────────────

function PlanSection() {
  const { locations, workoutTypes, locationPlans, addLocation, updateLocation, deleteLocation, upsertPlan, addWorkoutType, updateWorkoutType, deleteWorkoutType } = useStore();
  const [newLocName, setNewLocName] = useState('');
  const [editLocId, setEditLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [newWtForm, setNewWtForm] = useState(false);
  const [newWtName, setNewWtName] = useState('');
  const [newWtEmoji, setNewWtEmoji] = useState('🏋️');

  function addLoc() {
    if (!newLocName.trim()) return;
    addLocation({ id: crypto.randomUUID(), name: newLocName.trim() });
    setNewLocName('');
  }

  function saveLoc() {
    if (!editLocId || !editLocName.trim()) return;
    updateLocation(editLocId, { name: editLocName.trim() });
    setEditLocId(null);
  }

  function addWt() {
    if (!newWtName.trim()) return;
    addWorkoutType({
      id: crypto.randomUUID(),
      name: newWtName.trim(),
      emoji: newWtEmoji,
      color: '#6b7280',
    });
    setNewWtName('');
    setNewWtEmoji('🏋️');
    setNewWtForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Locations + Plans */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">📍 מיקומים ותוכניות</h2>

        {locations.map((loc) => (
          <div key={loc.id} className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              {editLocId === loc.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <button onClick={saveLoc} className="text-green-400">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditLocId(null)} className="text-gray-500">
                    <X size={16} />
                  </button>
                  <input
                    value={editLocName}
                    onChange={(e) => setEditLocName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveLoc()}
                    className="flex-1 bg-gray-800 rounded px-2 py-1 text-white text-sm border border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditLocId(loc.id);
                        setEditLocName(loc.name);
                      }}
                      className="text-gray-400"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteLocation(loc.id)} className="text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="font-medium text-white">{loc.name}</span>
                </>
              )}
            </div>

            {/* Plans per workout type */}
            <div className="border-t border-gray-800">
              {workoutTypes.map((wt) => {
                const plan = locationPlans.find(
                  (p) => p.locationId === loc.id && p.workoutTypeId === wt.id
                );
                return (
                  <WorkoutTypeAccordion
                    key={wt.id}
                    wt={wt}
                    exercises={plan?.exercises ?? []}
                    onSave={(exs) => upsertPlan(loc.id, wt.id, exs)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            value={newLocName}
            onChange={(e) => setNewLocName(e.target.value)}
            placeholder="שם מיקום חדש"
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addLoc()}
          />
          <button onClick={addLoc} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Workout Types */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">🏋️ סוגי אימון</h2>

        {workoutTypes.map((wt) => (
          <WorkoutTypeRow
            key={wt.id}
            wt={wt}
            onUpdate={(u) => updateWorkoutType(wt.id, u)}
            onDelete={() => deleteWorkoutType(wt.id)}
          />
        ))}

        {newWtForm ? (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={newWtEmoji}
                onChange={(e) => setNewWtEmoji(e.target.value)}
                className="w-14 bg-gray-800 rounded-lg px-2 py-2 text-white text-center text-lg border border-gray-700 focus:outline-none"
                maxLength={2}
              />
              <input
                value={newWtName}
                onChange={(e) => setNewWtName(e.target.value)}
                placeholder="שם סוג אימון"
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNewWtForm(false)} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg text-sm">
                ביטול
              </button>
              <button onClick={addWt} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">
                הוסף
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setNewWtForm(true)}
            className="w-full border border-dashed border-gray-700 rounded-xl p-3 text-gray-400 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} /> הוסף סוג אימון
          </button>
        )}
      </div>
    </div>
  );
}

function WorkoutTypeRow({ wt, onUpdate, onDelete }: { wt: WorkoutType; onUpdate: (u: Partial<WorkoutType>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(wt.name);
  const [emoji, setEmoji] = useState(wt.emoji);

  function save() {
    onUpdate({ name: name.trim() || wt.name, emoji: emoji || wt.emoji });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-2">
        <button onClick={save} className="text-green-400"><Check size={16} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-500"><X size={16} /></button>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-10 bg-gray-800 rounded px-1 py-1 text-white text-center border border-gray-700 focus:outline-none" maxLength={2} />
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} className="flex-1 bg-gray-800 rounded px-2 py-1 text-white text-sm border border-blue-500 focus:outline-none" autoFocus />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="text-gray-400"><Edit2 size={16} /></button>
        <button onClick={onDelete} className="text-red-400"><Trash2 size={16} /></button>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">{wt.name}</span>
        <span className="text-xl">{wt.emoji}</span>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wt.color }} />
      </div>
    </div>
  );
}

// ─── WorkoutType Accordion (exercises per location×type) ─────────────────────

function WorkoutTypeAccordion({ wt, exercises, onSave }: {
  wt: WorkoutType;
  exercises: PlanExercise[];
  onSave: (exercises: PlanExercise[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localExs, setLocalExs] = useState<PlanExercise[]>(exercises);

  // Sync from store when closed and then reopened
  function toggle() {
    if (!open) setLocalExs(exercises);
    setOpen((v) => !v);
  }

  function save() {
    onSave(localExs);
  }

  function updateExercise(idx: number, updates: Partial<PlanExercise>) {
    setLocalExs((list) => list.map((e, i) => (i === idx ? { ...e, ...updates } : e)));
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof PlanSet, val: string) {
    setLocalExs((list) =>
      list.map((e, i) =>
        i === exIdx
          ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, [field]: parseFloat(val) || 0 } : s)) }
          : e
      )
    );
  }

  function addSet(exIdx: number) {
    setLocalExs((list) =>
      list.map((e, i) => {
        if (i !== exIdx) return e;
        const last = e.sets[e.sets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 };
        return { ...e, sets: [...e.sets, { ...last }] };
      })
    );
  }

  function removeSet(exIdx: number, setIdx: number) {
    setLocalExs((list) =>
      list.map((e, i) =>
        i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e
      )
    );
  }

  function addExercise() {
    setLocalExs((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        name: '',
        notes: '',
        sets: [{ reps: 10, weight: 0, restSeconds: 90 }],
      },
    ]);
  }

  function removeExercise(idx: number) {
    setLocalExs((list) => list.filter((_, i) => i !== idx));
  }

  function moveExercise(idx: number, dir: -1 | 1) {
    const next = [...localExs];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocalExs(next);
  }

  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        className="w-full px-4 py-3 flex items-center justify-between text-right"
        onClick={toggle}
      >
        <div className="flex items-center gap-2 text-gray-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="text-xs">{open ? localExs.length : exercises.length} תרגילים</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{wt.name}</span>
          <span>{wt.emoji}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {localExs.map((ex, exIdx) => (
            <div key={ex.id} className="bg-gray-800 rounded-xl p-3 space-y-2">
              {/* Exercise header */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveExercise(exIdx, -1)} disabled={exIdx === 0} className="text-gray-500 disabled:opacity-30 text-xs leading-none">▲</button>
                  <button onClick={() => moveExercise(exIdx, 1)} disabled={exIdx === localExs.length - 1} className="text-gray-500 disabled:opacity-30 text-xs leading-none">▼</button>
                </div>
                <input
                  value={ex.name}
                  onChange={(e) => updateExercise(exIdx, { name: e.target.value })}
                  placeholder="שם תרגיל"
                  className="flex-1 bg-gray-700 rounded px-2 py-1.5 text-white text-sm border border-gray-600 focus:border-blue-500 focus:outline-none text-right"
                />
                <button onClick={() => removeExercise(exIdx)} className="text-red-400 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Notes */}
              <textarea
                value={ex.notes}
                onChange={(e) => updateExercise(exIdx, { notes: e.target.value })}
                placeholder="הערות (אופציונלי)"
                rows={2}
                className="w-full bg-gray-700 rounded px-2 py-1.5 text-gray-300 text-xs border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              />

              {/* Sets */}
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                  <div>סט</div><div>ק״ג</div><div>חז'</div><div>מנוחה</div><div></div>
                </div>
                {ex.sets.map((s, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-5 gap-1 items-center">
                    <div className="text-xs text-gray-500 text-center">{setIdx + 1}</div>
                    {(['weight', 'reps', 'restSeconds'] as const).map((field) => (
                      <input
                        key={field}
                        type="number"
                        value={s[field]}
                        onChange={(e) => updateSet(exIdx, setIdx, field, e.target.value)}
                        className="bg-gray-700 rounded px-1 py-1 text-white text-center text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    ))}
                    {ex.sets.length > 1 ? (
                      <button onClick={() => removeSet(exIdx, setIdx)} className="text-red-400 flex justify-center">
                        <X size={12} />
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
                <button onClick={() => addSet(exIdx)} className="text-blue-400 text-xs flex items-center gap-1 mt-1">
                  <Plus size={12} /> הוסף סט
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addExercise}
            className="w-full border border-dashed border-gray-700 rounded-lg py-2 text-gray-400 text-sm flex items-center justify-center gap-1"
          >
            <Plus size={16} /> הוסף תרגיל
          </button>

          <button
            onClick={save}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold"
          >
            שמור שינויים
          </button>
        </div>
      )}
    </div>
  );
}

// ─── General Section ──────────────────────────────────────────────────────────

function GeneralSection() {
  const { settings, updateSettings, sessions, bodyWeightLogs, workoutTypes, locations, locationPlans } = useStore();

  function doExport() {
    const data = {
      sessions,
      bodyWeightLogs,
      workoutTypes,
      locations,
      locationPlans,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="text-sm font-medium text-white mb-3">זמן מנוחה ברירת מחדל</div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={settings.defaultRestSeconds}
            onChange={(e) => updateSettings({ defaultRestSeconds: parseInt(e.target.value) || 90 })}
            className="w-24 bg-gray-800 rounded-lg px-3 py-2 text-white text-center border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">שניות</span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4">
        <div className="font-medium text-white mb-1 text-sm">יצוא נתונים</div>
        <div className="text-xs text-gray-500 mb-3">ייצא את כל הנתונים כ-JSON</div>
        <button onClick={doExport} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
          ייצא JSON
        </button>
      </div>
    </div>
  );
}
