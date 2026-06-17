'use client';
import { useEffect, useState, useCallback } from 'react';

interface RestTimerProps {
  seconds: number;
  onClose: () => void;
}

export default function RestTimer({ seconds, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const pct = Math.max(0, remaining / (seconds + extra));
  const circumference = 2 * Math.PI * 44;

  function addTime(s: number) {
    setRemaining((r) => r + s);
    setExtra((e) => e + s);
  }

  const fmt = (s: number) => {
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.abs(s) % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-6 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm text-gray-400">מנוחה</div>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={remaining > 0 ? '#3b82f6' : '#10b981'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold font-mono">{fmt(remaining)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => addTime(-15)} className="bg-gray-800 px-3 py-2 rounded-lg text-sm">-15</button>
          <button onClick={() => addTime(15)} className="bg-gray-800 px-3 py-2 rounded-lg text-sm">+15</button>
          <button onClick={() => addTime(30)} className="bg-gray-800 px-3 py-2 rounded-lg text-sm">+30</button>
        </div>
        <button onClick={onClose} className="text-gray-400 text-sm">דלג</button>
      </div>
    </div>
  );
}
