'use client';
import { useStore } from '@/store';
import { useState } from 'react';
import { Plus, Edit2, Check, X, Trash2, Search, Loader2 } from 'lucide-react';
import type { ExerciseLibraryItem, MuscleGroup, EquipmentType } from '@/types';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '@/types';

type SettingsTab = 'כללי' | 'תרגילים';

const ALL_MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
const ALL_EQUIPMENT: EquipmentType[] = ['machine', 'dumbbells', 'plates'];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('כללי');
  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
      </div>
      <div className="flex gap-2">
        {(['כללי', 'תרגילים'] as SettingsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'כללי' && (
        <>
          <LocationsManager />
          <GeneralSection />
        </>
      )}
      {tab === 'תרגילים' && <ExerciseLibrarySection />}
    </div>
  );
}

// ─── Locations ────────────────────────────────────────────────────────────────

function LocationsManager() {
  const { locations, addLocation, updateLocation, deleteLocation } = useStore();
  const [newLocName, setNewLocName] = useState('');
  const [editLocId, setEditLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<string | null>(null);

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

  return (
    <div className="space-y-2">
      <h2 className="text-sm text-gray-400 font-medium">מיקומי אימון</h2>
      <div className="bg-gray-900 rounded-xl divide-y divide-gray-800 overflow-hidden">
        {locations.map((loc) => (
          <div key={loc.id} className="px-4 py-3 flex items-center justify-between">
            {editLocId === loc.id ? (
              <div className="flex items-center gap-2 flex-1">
                <button onClick={saveLoc} className="text-green-400"><Check size={15} /></button>
                <button onClick={() => setEditLocId(null)} className="text-gray-500"><X size={15} /></button>
                <input
                  value={editLocName}
                  onChange={(e) => setEditLocName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveLoc()}
                  autoFocus
                  className="flex-1 bg-gray-800 rounded px-2 py-1 text-white text-sm border border-blue-500 focus:outline-none"
                />
              </div>
            ) : confirmDeleteLoc === loc.id ? (
              <div className="flex items-center gap-2 flex-1 justify-between">
                <div className="flex gap-2">
                  <button onClick={() => { deleteLocation(loc.id); setConfirmDeleteLoc(null); }} className="text-red-400 text-xs font-medium">כן</button>
                  <button onClick={() => setConfirmDeleteLoc(null)} className="text-gray-400 text-xs">ביטול</button>
                </div>
                <span className="text-red-400 text-xs">מחק את &apos;{loc.name}&apos;?</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {locations.length > 1 && (
                    <button onClick={() => setConfirmDeleteLoc(loc.id)} className="text-gray-600 active:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button onClick={() => { setEditLocId(loc.id); setEditLocName(loc.name); }} className="text-gray-500 active:text-gray-300">
                    <Edit2 size={14} />
                  </button>
                </div>
                <span className="text-white text-sm">{loc.name}</span>
              </>
            )}
          </div>
        ))}
        <div className="px-4 py-3 flex gap-2">
          <button onClick={addLoc} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /></button>
          <input
            value={newLocName}
            onChange={(e) => setNewLocName(e.target.value)}
            placeholder="מיקום חדש"
            onKeyDown={(e) => e.key === 'Enter' && addLoc()}
            className="flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── General ──────────────────────────────────────────────────────────────────

function GeneralSection() {
  const { settings, updateSettings, sessions, bodyWeightLogs, workoutTypes, locations, locationPlans } = useStore();

  function doExport() {
    const data = { sessions, bodyWeightLogs, workoutTypes, locations, locationPlans, exportedAt: new Date().toISOString() };
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

      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div>
          <div className="text-sm font-medium text-white mb-1">WorkoutX API Key</div>
          <div className="text-xs text-gray-500 mb-2">להפעלת אנימציות ומילוי אוטומטי. הירשם בworkoutxapp.com</div>
          <input
            value={settings.workoutXApiKey ?? ''}
            onChange={(e) => updateSettings({ workoutXApiKey: e.target.value.trim() })}
            placeholder="הכנס API Key..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none font-mono"
          />
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

// ─── Exercise Library ─────────────────────────────────────────────────────────

function ExerciseLibrarySection() {
  const { exerciseLibrary, addExerciseLibraryItem, updateExerciseLibraryItem, deleteExerciseLibraryItem, importExercisesFromPlans, settings } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState('');

  function handleImport() {
    const count = importExercisesFromPlans();
    setImportMsg(count > 0 ? `יובאו ${count} תרגילים חדשים` : 'כל התרגילים כבר בספרייה');
    setTimeout(() => setImportMsg(''), 3000);
  }

  const grouped = ALL_MUSCLE_GROUPS.reduce<Record<MuscleGroup, ExerciseLibraryItem[]>>((acc, mg) => {
    acc[mg] = exerciseLibrary.filter((e) => e.muscleGroup === mg);
    return acc;
  }, {} as Record<MuscleGroup, ExerciseLibraryItem[]>);
  const ungrouped = exerciseLibrary.filter((e) => !e.muscleGroup);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => { setShowAddForm(true); setEditId(null); }}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> הוסף תרגיל
        </button>
        <button
          onClick={handleImport}
          className="flex-1 bg-gray-700 text-gray-200 py-2.5 rounded-xl text-sm font-medium"
          title="ייבא תרגילים קיימים מהתוכניות"
        >
          ייבא מהתוכניות
        </button>
      </div>
      {importMsg && <div className="text-center text-green-400 text-sm">{importMsg}</div>}

      {(showAddForm && !editId) && (
        <ExerciseForm
          apiKey={settings.workoutXApiKey}
          onSave={(item) => { addExerciseLibraryItem({ ...item, id: crypto.randomUUID() }); setShowAddForm(false); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {ALL_MUSCLE_GROUPS.map((mg) => grouped[mg].length > 0 && (
        <div key={mg}>
          <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{MUSCLE_GROUP_LABELS[mg]}</h3>
          <div className="space-y-2">
            {grouped[mg].map((item) => editId === item.id ? (
              <ExerciseForm
                key={item.id}
                initial={item}
                apiKey={settings.workoutXApiKey}
                onSave={(updates) => { updateExerciseLibraryItem(item.id, updates); setEditId(null); }}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <ExerciseLibraryCard key={item.id} item={item} apiKey={settings.workoutXApiKey} onEdit={() => setEditId(item.id)} onDelete={() => deleteExerciseLibraryItem(item.id)} />
            ))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">ללא קבוצת שריר</h3>
          <div className="space-y-2">
            {ungrouped.map((item) => editId === item.id ? (
              <ExerciseForm
                key={item.id}
                initial={item}
                apiKey={settings.workoutXApiKey}
                onSave={(updates) => { updateExerciseLibraryItem(item.id, updates); setEditId(null); }}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <ExerciseLibraryCard key={item.id} item={item} apiKey={settings.workoutXApiKey} onEdit={() => setEditId(item.id)} onDelete={() => deleteExerciseLibraryItem(item.id)} />
            ))}
          </div>
        </div>
      )}

      {exerciseLibrary.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-sm">הספרייה ריקה — הוסף תרגיל ראשון</div>
        </div>
      )}
    </div>
  );
}

function ExerciseLibraryCard({
  item, onEdit, onDelete, apiKey,
}: {
  item: ExerciseLibraryItem;
  onEdit: () => void;
  onDelete: () => void;
  apiKey?: string;
}) {
  const { updateExerciseLibraryItem } = useStore();
  const [confirmDel, setConfirmDel] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  async function fetchGif() {
    const query = item.nameHe ? item.name : item.name;
    if (!apiKey) { setFetchError('נדרש API Key'); return; }
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch(`https://api.workoutxapp.com/v1/exercises?query=${encodeURIComponent(query)}`, {
        headers: { 'X-WorkoutX-Key': apiKey },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const hit = Array.isArray(data) ? data[0] : data?.exercises?.[0];
      if (!hit?.gifUrl) { setFetchError('לא נמצאה אנימציה'); return; }
      updateExerciseLibraryItem(item.id, { gifUrl: hit.gifUrl });
    } catch {
      setFetchError('שגיאת חיבור');
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {confirmDel ? (
            <>
              <button onClick={onDelete} className="text-red-400 text-xs font-medium">מחק</button>
              <button onClick={() => setConfirmDel(false)} className="text-gray-500 text-xs">ביטול</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDel(true)} className="text-gray-600 active:text-red-400"><Trash2 size={14} /></button>
              <button onClick={onEdit} className="text-gray-500 active:text-gray-300"><Edit2 size={14} /></button>
              {!item.gifUrl && (
                <button onClick={fetchGif} disabled={fetching} className="text-gray-600 active:text-blue-400 disabled:opacity-40" title="שלוף אנימציה מ-WorkoutX">
                  {fetching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                </button>
              )}
            </>
          )}
        </div>
        <div className="text-right flex-1">
          <div className="font-medium text-white text-sm">{item.nameHe || item.name}</div>
          {item.nameHe && <div className="text-gray-600 text-xs">{item.name}</div>}
          {item.subMuscle && <div className="text-gray-500 text-xs">{item.subMuscle}</div>}
          {item.equipment.length > 0 && (
            <div className="text-gray-600 text-xs mt-0.5">{item.equipment.map((e) => EQUIPMENT_LABELS[e]).join(' · ')}</div>
          )}
          {fetchError && <div className="text-red-400 text-xs mt-1">{fetchError}</div>}
        </div>
        {item.gifUrl ? (
          <img src={item.gifUrl} alt={item.name} className="w-12 h-12 rounded-lg object-contain bg-white shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-800 shrink-0 flex items-center justify-center text-gray-600 text-xs">GIF</div>
        )}
      </div>
      {item.keyPoints && (
        <div className="text-gray-500 text-xs mt-2 text-right">{item.keyPoints}</div>
      )}
    </div>
  );
}

function ExerciseForm({
  initial,
  apiKey,
  onSave,
  onCancel,
}: {
  initial?: Partial<ExerciseLibraryItem>;
  apiKey?: string;
  onSave: (item: Omit<ExerciseLibraryItem, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [nameHe, setNameHe] = useState(initial?.nameHe ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>(initial?.muscleGroup ?? '');
  const [subMuscle, setSubMuscle] = useState(initial?.subMuscle ?? '');
  const [equipment, setEquipment] = useState<EquipmentType[]>(initial?.equipment ?? []);
  const [gifUrl, setGifUrl] = useState(initial?.gifUrl ?? '');
  const [keyPoints, setKeyPoints] = useState(initial?.keyPoints ?? '');
  const [instructions, setInstructions] = useState<string[]>(initial?.instructions ?? []);
  const [loading, setLoading] = useState(false);
  const [autoFillError, setAutoFillError] = useState('');

  function toggleEquipment(eq: EquipmentType) {
    setEquipment((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);
  }

  async function autoFill() {
    if (!name.trim()) return;
    if (!apiKey) { setAutoFillError('נדרש WorkoutX API Key בהגדרות כללי'); return; }
    setLoading(true);
    setAutoFillError('');
    try {
      const res = await fetch(`https://api.workoutxapp.com/v1/exercises?query=${encodeURIComponent(name.trim())}`, {
        headers: { 'X-WorkoutX-Key': apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hit = Array.isArray(data) ? data[0] : data?.exercises?.[0];
      if (!hit) { setAutoFillError('לא נמצא תרגיל'); return; }

      if (hit.gifUrl) setGifUrl(hit.gifUrl);
      if (hit.instructions?.length) setInstructions(hit.instructions);
      if (hit.target || hit.bodyPart) {
        const raw = (hit.target ?? hit.bodyPart ?? '').toLowerCase();
        const map: Record<string, MuscleGroup> = {
          chest: 'chest', back: 'back', shoulders: 'shoulders', biceps: 'biceps',
          triceps: 'triceps', quads: 'quads', hamstrings: 'hamstrings', calves: 'calves',
          abs: 'abs', core: 'abs', abductors: 'adductors', adductors: 'adductors', traps: 'traps',
        };
        const mg = map[raw];
        if (mg) setMuscleGroup(mg);
        if (hit.target && hit.bodyPart && hit.target !== hit.bodyPart) setSubMuscle(hit.target);
      }
      if (hit.equipment) {
        const eqMap: Record<string, EquipmentType> = { machine: 'machine', dumbbell: 'dumbbells', barbell: 'plates', 'ez barbell': 'plates' };
        const mapped = (Array.isArray(hit.equipment) ? hit.equipment : [hit.equipment])
          .map((e: string) => eqMap[e.toLowerCase()])
          .filter(Boolean) as EquipmentType[];
        if (mapped.length) setEquipment([...new Set(mapped)]);
      }
    } catch {
      setAutoFillError('שגיאה בחיבור ל-WorkoutX');
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      nameHe: nameHe.trim() || undefined,
      muscleGroup: muscleGroup || undefined,
      subMuscle: subMuscle.trim() || undefined,
      equipment,
      gifUrl: gifUrl.trim() || undefined,
      keyPoints: keyPoints.trim() || undefined,
      instructions: instructions.length ? instructions : undefined,
    });
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם באנגלית (Bench Press...)"
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          dir="ltr"
        />
        <button
          onClick={autoFill}
          disabled={loading || !name.trim()}
          className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-40"
          title="מלא אוטומטית מ-WorkoutX"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>

      {autoFillError && <div className="text-red-400 text-xs text-right">{autoFillError}</div>}

      <input
        value={nameHe}
        onChange={(e) => setNameHe(e.target.value)}
        placeholder="שם בעברית (אופציונלי)"
        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
      />

      <div className="flex gap-2">
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup | '')}
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">קבוצת שריר...</option>
          {ALL_MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>)}
        </select>
        <input
          value={subMuscle}
          onChange={(e) => setSubMuscle(e.target.value)}
          placeholder="תת-קבוצה"
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-1.5 justify-end">
        {ALL_EQUIPMENT.map((eq) => (
          <button
            key={eq}
            onClick={() => toggleEquipment(eq)}
            className={`px-2 py-1 rounded-full text-xs font-medium ${equipment.includes(eq) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            {EQUIPMENT_LABELS[eq]}
          </button>
        ))}
      </div>

      <input
        value={gifUrl}
        onChange={(e) => setGifUrl(e.target.value)}
        placeholder="URL של אנימציה (GIF)"
        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-xs"
        dir="ltr"
      />
      {gifUrl && (
        <img src={gifUrl} alt="preview" className="w-24 h-24 rounded-lg object-contain bg-white mx-auto" />
      )}

      <textarea
        value={keyPoints}
        onChange={(e) => setKeyPoints(e.target.value)}
        placeholder="דגשים מרכזיים (אופציונלי)"
        rows={2}
        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
      />

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-lg text-sm">ביטול</button>
        <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">שמור</button>
      </div>
    </div>
  );
}
