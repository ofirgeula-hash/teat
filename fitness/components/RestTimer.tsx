'use client';
import { useEffect, useState } from 'react';

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-[28px] p-8 flex flex-col items-center gap-6 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm text-muted">מנוחה</div>
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#2a2a2e" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={remaining > 0 ? '#ff6b1a' : '#4ade80'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold font-num">{fmt(remaining)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => addTime(-15)} className="bg-surface-2 px-4 h-11 rounded-full text-sm font-medium">-15</button>
          <button onClick={() => addTime(15)} className="bg-surface-2 px-4 h-11 rounded-full text-sm font-medium">+15</button>
          <button onClick={() => addTime(30)} className="bg-surface-2 px-4 h-11 rounded-full text-sm font-medium">+30</button>
        </div>
        <button onClick={onClose} className="text-muted text-sm">דלג</button>
      </div>
    </div>
  );
}
