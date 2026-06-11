'use client';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import type { WorkoutSession, WorkoutType } from '@/types';
import { Weight, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useState } from 'react';

function weeklyCount(sessions: WorkoutSession[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return sessions.filter((s) => new Date(s.startedAt) > weekAgo && s.endedAt).length;
}

export default function HomePage() {
  const { workoutTypes, sessions, addWorkoutType } = useStore();
  const router = useRouter();
  const count = weeklyCount(sessions);
  const [showAddWt, setShowAddWt] = useState(false);
  const [newWtName, setNewWtName] = useState('');
  const [newWtEmoji, setNewWtEmoji] = useState('🏋️');

  function addWt() {
    if (!newWtName.trim()) return;
    addWorkoutType({ id: crypto.randomUUID(), name: newWtName.trim(), emoji: newWtEmoji, color: '#6b7280' });
    setNewWtName('');
    setNewWtEmoji('🏋️');
    setShowAddWt(false);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ראשי</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl px-4 py-2 text-center min-w-[60px]">
          <div className="text-blue-400 font-bold text-xl">{count}</div>
          <div className="text-gray-500 text-xs">השבוע</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm text-gray-400 font-medium mb-3">בחר אימון</h2>
        <div className="grid grid-cols-2 gap-3">
          {workoutTypes.map((wt) => {
            const lastSession = sessions.find((s) => s.workoutTypeId === wt.id && s.endedAt);
            const daysAgo = lastSession
              ? Math.floor((Date.now() - new Date(lastSession.startedAt).getTime()) / 86400000)
              : null;
            return (
              <WorkoutCard
                key={wt.id}
                wt={wt}
                daysAgo={daysAgo}
                onPress={() => router.push(`/workout/${wt.id}`)}
              />
            );
          })}

          {/* Add workout type card */}
          {showAddWt ? (
            <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-2 col-span-2">
              <div className="flex gap-2">
                <input
                  value={newWtEmoji}
                  onChange={(e) => setNewWtEmoji(e.target.value)}
                  className="w-12 bg-gray-800 rounded-lg px-1 py-2 text-white text-center text-lg border border-gray-700 focus:outline-none"
                  maxLength={2}
                />
                <input
                  value={newWtName}
                  onChange={(e) => setNewWtName(e.target.value)}
                  placeholder="שם סוג אימון"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addWt()}
                  className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddWt(false)} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg text-sm">ביטול</button>
                <button onClick={addWt} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">הוסף</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddWt(true)}
              className="bg-gray-900 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-600 border border-dashed border-gray-800 active:bg-gray-800 min-h-[100px]"
            >
              <Plus size={24} />
              <span className="text-xs">הוסף אימון</span>
            </button>
          )}
        </div>
      </div>

      <LocationsManager />
      <BodyWeightQuickAdd />
    </div>
  );
}

function WorkoutCard({ wt, daysAgo, onPress }: { wt: WorkoutType; daysAgo: number | null; onPress: () => void }) {
  const { updateWorkoutType, deleteWorkoutType } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(wt.name);
  const [emoji, setEmoji] = useState(wt.emoji);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    updateWorkoutType(wt.id, { name: name.trim() || wt.name, emoji: emoji || wt.emoji });
    setEditing(false);
    setConfirmDelete(false);
  }

  function cancelEdit() {
    setName(wt.name);
    setEmoji(wt.emoji);
    setEditing(false);
    setConfirmDelete(false);
  }

  if (editing) {
    return (
      <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-2" style={{ borderTop: `3px solid ${wt.color}` }}>
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-10 bg-gray-800 rounded px-1 py-1 text-white text-center border border-gray-700 focus:outline-none"
            maxLength={2}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            autoFocus
            className="flex-1 bg-gray-800 rounded px-2 py-1 text-white text-sm border border-blue-500 focus:outline-none"
          />
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-red-400 text-xs">מחק את &apos;{wt.name}&apos;?</span>
            <button onClick={() => deleteWorkoutType(wt.id)} className="text-red-400 text-xs font-medium">כן</button>
            <button onClick={() => setConfirmDelete(false)} className="text-gray-400 text-xs">ביטול</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(true)} className="text-red-400"><Trash2 size={14} /></button>
            <div className="flex-1" />
            <button onClick={cancelEdit} className="text-gray-500"><X size={16} /></button>
            <button onClick={save} className="text-green-400"><Check size={16} /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onPress}
      className="bg-gray-900 rounded-xl p-4 text-right flex flex-col gap-3 active:scale-95 transition-transform relative"
      style={{ borderTop: `3px solid ${wt.color}` }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="absolute top-2 left-2 text-gray-600 active:text-gray-300 p-1"
      >
        <Edit2 size={13} />
      </button>
      <div className="text-3xl">{wt.emoji}</div>
      <div className="font-semibold text-white text-sm leading-tight">{wt.name}</div>
      <div className="text-xs text-gray-600">
        {daysAgo === null ? 'אף פעם' : daysAgo === 0 ? 'היום' : `לפני ${daysAgo} ימים`}
      </div>
    </button>
  );
}

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

function BodyWeightQuickAdd() {
  const { addBodyWeight } = useStore();
  const [val, setVal] = useState('');
  const [saved, setSaved] = useState(false);

  function save() {
    const w = parseFloat(val);
    if (!w || w < 20 || w > 300) return;
    addBodyWeight({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), weightKg: w });
    setVal('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Weight size={18} className="text-orange-400" />
        <span className="text-sm font-medium">הזן משקל גוף</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder='ק"ג'
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
          step="0.1"
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button
          onClick={save}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium active:bg-blue-700"
        >
          {saved ? '✓' : 'שמור'}
        </button>
      </div>
    </div>
  );
}
