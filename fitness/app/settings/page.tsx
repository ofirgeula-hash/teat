'use client';
import { useStore } from '@/store';

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
      </div>
      <GeneralSection />
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
