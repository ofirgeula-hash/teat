interface WeekRingProps {
  value: number;
  goal: number;
  size?: number;
}

/** Apple-Fitness-style progress ring: workouts this week against the weekly goal. */
export default function WeekRing({ value, goal, size = 112 }: WeekRingProps) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value} מתוך ${goal} אימונים השבוע`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3a1c0c" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ff6b1a"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-num font-bold text-4xl leading-none">{value}<span className="text-muted text-2xl">/{goal}</span></span>
        <span className="text-[11px] text-muted mt-0.5">אימונים</span>
      </div>
    </div>
  );
}
