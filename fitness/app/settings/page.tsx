'use client';
import { useStore } from '@/store';
import { useState } from 'react';
import { Plus, Edit2, Check, X, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
      </div>
      <LocationsManager />
      <GeneralSection />
    </div>
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
