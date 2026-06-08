'use client';
import { useStore } from '@/store';
import { useState } from 'react';
import type { Location, Equipment, Exercise, WorkoutTemplate, TemplateExercise } from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, X } from 'lucide-react';

const ALL_EQUIPMENT: Equipment[] = [
  'מוט_ישר', 'משקולות_יד', 'כבלים', 'לג_פרס', 'מכונה', 'מקבילים', 'מתח', 'משקל_גוף', 'סמית', 'EZ',
];

const equipmentLabel: Record<Equipment, string> = {
  מוט_ישר: 'מוט ישר',
  משקולות_יד: 'משקולות יד',
  כבלים: 'כבלים',
  לג_פרס: 'לג פרס',
  מכונה: 'מכונה',
  מקבילים: 'מקבילים',
  מתח: 'מתח',
  משקל_גוף: 'משקל גוף',
  סמית: 'סמית',
  EZ: 'EZ',
};

type Section = 'מיקומים' | 'תרגילים' | 'תוכניות' | 'כללי';

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('מיקומים');

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['מיקומים', 'תרגילים', 'תוכניות', 'כללי'] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              section === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {section === 'מיקומים' && <LocationsSection />}
      {section === 'תרגילים' && <ExercisesSection />}
      {section === 'תוכניות' && <ProgramsSection />}
      {section === 'כללי' && <GeneralSection />}
    </div>
  );
}

function LocationsSection() {
  const { locations, addLocation, updateLocation, deleteLocation } = useStore();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  function add() {
    if (!newName.trim()) return;
    addLocation({ id: crypto.randomUUID(), name: newName.trim(), availableEquipment: [] });
    setNewName('');
  }

  return (
    <div className="space-y-3">
      {locations.map((loc) => (
        <LocationCard
          key={loc.id}
          location={loc}
          onUpdate={(u) => updateLocation(loc.id, u)}
          onDelete={() => deleteLocation(loc.id)}
        />
      ))}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="שם מיקום חדש"
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function LocationCard({ location, onUpdate, onDelete }: { location: Location; onUpdate: (u: Partial<Location>) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  function toggleEquipment(eq: Equipment) {
    const has = location.availableEquipment.includes(eq);
    onUpdate({
      availableEquipment: has
        ? location.availableEquipment.filter((e) => e !== eq)
        : [...location.availableEquipment, eq],
    });
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded((e) => !e)} className="text-gray-400">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={onDelete} className="text-red-400">
            <Trash2 size={16} />
          </button>
        </div>
        <span className="font-medium text-white">{location.name}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-400 mb-2">ציוד זמין:</div>
          <div className="flex flex-wrap gap-2">
            {ALL_EQUIPMENT.map((eq) => {
              const active = location.availableEquipment.includes(eq);
              return (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {equipmentLabel[eq]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ExercisesSection() {
  const { exercises, addExercise, updateExercise, deleteExercise } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', muscleGroup: 'חזה', notes: ['', '', ''] });

  function save() {
    if (!form.name.trim()) return;
    const notes = form.notes.filter((n) => n.trim());
    if (editId) {
      updateExercise(editId, { name: form.name, muscleGroup: form.muscleGroup as any, notes });
      setEditId(null);
    } else {
      addExercise({
        id: crypto.randomUUID(),
        name: form.name,
        muscleGroup: form.muscleGroup as any,
        requiredEquipment: [],
        alternativeIds: [],
        notes,
      });
    }
    setForm({ name: '', muscleGroup: 'חזה', notes: ['', '', ''] });
    setShowAdd(false);
  }

  function startEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      notes: [...ex.notes, '', '', ''].slice(0, 3),
    });
    setEditId(ex.id);
    setShowAdd(true);
  }

  return (
    <div className="space-y-3">
      {exercises.map((ex) => (
        <div key={ex.id} className="bg-gray-900 rounded-xl p-4 flex items-start justify-between">
          <div className="flex gap-2">
            <button onClick={() => startEdit(ex)} className="text-gray-400">
              <Edit2 size={16} />
            </button>
            <button onClick={() => deleteExercise(ex.id)} className="text-red-400">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="text-right">
            <div className="font-medium text-white">{ex.name}</div>
            <div className="text-xs text-gray-400">{ex.muscleGroup.replace('_', ' ')}</div>
            {ex.notes.map((n, i) => <div key={i} className="text-xs text-gray-500 italic">• {n}</div>)}
          </div>
        </div>
      ))}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full border border-dashed border-gray-700 rounded-xl p-4 text-gray-400 text-sm flex items-center justify-center gap-2"
        >
          <Plus size={18} /> הוסף תרגיל
        </button>
      ) : (
        <div className="bg-gray-900 rounded-xl p-4 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="שם תרגיל"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={form.muscleGroup}
            onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700"
          >
            {['חזה', 'גב', 'כתפיים', 'יד_קדמית', 'יד_אחורית', 'רגליים', 'בטן', 'אחר'].map((mg) => (
              <option key={mg} value={mg}>{mg.replace('_', ' ')}</option>
            ))}
          </select>
          {form.notes.map((n, i) => (
            <input
              key={i}
              value={n}
              onChange={(e) => setForm((f) => { const notes = [...f.notes]; notes[i] = e.target.value; return { ...f, notes }; })}
              placeholder={`הערה ${i + 1} (אופציונלי)`}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          ))}
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); setEditId(null); }} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg text-sm">
              ביטול
            </button>
            <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">
              שמור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramsSection() {
  const { templates, exercises, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [editId, setEditId] = useState<string | null>(null);

  const editTemplate = editId ? templates.find((t) => t.id === editId) : null;

  if (editTemplate) {
    return (
      <TemplateEditor
        template={editTemplate}
        exercises={exercises}
        onSave={(updates) => { updateTemplate(editId!, updates); setEditId(null); }}
        onCancel={() => setEditId(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((tpl) => (
        <div key={tpl.id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setEditId(tpl.id)} className="text-blue-400">
              <Edit2 size={16} />
            </button>
            <button onClick={() => deleteTemplate(tpl.id)} className="text-red-400">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="text-right">
            <div className="font-medium text-white">{tpl.name}</div>
            <div className="text-xs text-gray-400">{tpl.exercises.length} תרגילים</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplateEditor({
  template,
  exercises,
  onSave,
  onCancel,
}: {
  template: WorkoutTemplate;
  exercises: Exercise[];
  onSave: (u: Partial<WorkoutTemplate>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [exList, setExList] = useState<TemplateExercise[]>(template.exercises);

  function updateSet(exIdx: number, setIdx: number, field: 'reps' | 'weight' | 'restSeconds', val: string) {
    setExList((list) => {
      const next = list.map((e, i) =>
        i === exIdx
          ? { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: parseFloat(val) || 0 } : s) }
          : e
      );
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExList((list) =>
      list.map((e, i) =>
        i === exIdx
          ? { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1] ?? { reps: 10, weight: 0, restSeconds: 90 } }] }
          : e
      )
    );
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExList((list) =>
      list.map((e, i) =>
        i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e
      )
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none font-bold text-base"
      />

      {exList.map((tplEx, exIdx) => {
        const ex = exercises.find((e) => e.id === tplEx.exerciseId);
        return (
          <div key={tplEx.exerciseId} className="bg-gray-900 rounded-xl p-4 space-y-2">
            <div className="font-medium text-white text-sm">{ex?.name ?? tplEx.exerciseId}</div>
            <div className="grid grid-cols-4 gap-1 text-xs text-gray-500 text-center">
              <div>סט</div><div>ק״ג</div><div>חז'</div><div>מנוחה</div>
            </div>
            {tplEx.sets.map((s, setIdx) => (
              <div key={setIdx} className="grid grid-cols-4 gap-1 items-center">
                <div className="text-xs text-gray-500 text-center">{setIdx + 1}</div>
                {(['weight', 'reps', 'restSeconds'] as const).map((field) => (
                  <input
                    key={field}
                    type="number"
                    value={s[field]}
                    onChange={(e) => updateSet(exIdx, setIdx, field, e.target.value)}
                    className="bg-gray-800 rounded px-1 py-1.5 text-white text-center text-xs border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                ))}
                <button onClick={() => removeSet(exIdx, setIdx)} className="text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => addSet(exIdx)} className="text-blue-400 text-xs flex items-center gap-1">
              <Plus size={14} /> הוסף סט
            </button>
          </div>
        );
      })}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl text-sm">
          ביטול
        </button>
        <button
          onClick={() => onSave({ name, exercises: exList })}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold"
        >
          שמור תוכנית
        </button>
      </div>
    </div>
  );
}

function GeneralSection() {
  const { settings, updateSettings } = useStore();

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

      <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-400">
        <div className="font-medium text-white mb-1">יצוא נתונים</div>
        <div className="text-xs text-gray-500 mb-3">ייצא את כל האימונים כ-JSON</div>
        <ExportButton />
      </div>
    </div>
  );
}

function ExportButton() {
  const store = useStore();

  function doExport() {
    const data = {
      sessions: store.sessions,
      bodyWeightLogs: store.bodyWeightLogs,
      exercises: store.exercises,
      templates: store.templates,
      locations: store.locations,
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
    <button onClick={doExport} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
      ייצא JSON
    </button>
  );
}

