import type { MuscleGroup } from '@/types';
import { BODY_BACK, BODY_FRONT, type BodyPart, type BodyShape } from '@/data/bodyMap';

const PARTS: Record<MuscleGroup, BodyPart[]> = {
  chest: ['chest'],
  lats: ['upper-back'],
  middle_back: ['upper-back'],
  lower_back: ['lower-back'],
  back: ['upper-back', 'lower-back'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  rear_delts: ['back-deltoids'],
  traps: ['trapezius'],
  neck: ['neck'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abs: ['abs', 'obliques'],
  glutes: ['gluteal'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  // The outline's inner-thigh shape is called "abductors" on the front and "adductor" on the back.
  adductors: ['abductors', 'adductor'],
  abductors: ['gluteal'],
  calves: ['calves', 'left-soleus', 'right-soleus'],
  other: [],
};

const COLOR_PRIMARY = '#ff6b1a';
const COLOR_SECONDARY = '#ffb37a';
const COLOR_REST = '#3a3a40';

function partsOf(groups: MuscleGroup[]): Set<BodyPart> {
  return new Set(groups.flatMap((g) => PARTS[g]));
}

function Figure({ shapes, primary, secondary, className, label }: {
  shapes: BodyShape[];
  primary: Set<BodyPart>;
  secondary: Set<BodyPart>;
  className?: string;
  label?: string;
}) {
  return (
    <svg viewBox="0 0 100 200" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {shapes.flatMap((s) =>
        s.polygons.map((points, i) => (
          <polygon
            key={`${s.muscle}-${i}`}
            points={points}
            fill={primary.has(s.muscle) ? COLOR_PRIMARY : secondary.has(s.muscle) ? COLOR_SECONDARY : COLOR_REST}
          />
        )),
      )}
    </svg>
  );
}

/** Front and back figures with the exercise's primary muscles in orange and secondary ones in light orange. */
export default function BodyMap({ primary, secondary = [], className = 'w-28 h-56' }: {
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  className?: string;
}) {
  const p = partsOf(primary);
  const s = partsOf(secondary);
  return (
    <div className="flex justify-center gap-8" dir="ltr">
      <Figure shapes={BODY_FRONT} primary={p} secondary={s} className={className} label="מבט מלפנים" />
      <Figure shapes={BODY_BACK} primary={p} secondary={s} className={className} label="מבט מאחור" />
    </div>
  );
}

/** A single small figure for a muscle-group filter chip, facing whichever side shows the group. */
export function MuscleIcon({ group, className = 'w-7 h-12' }: { group: MuscleGroup | null; className?: string }) {
  const p = group ? partsOf([group]) : new Set<BodyPart>();
  const onFront = BODY_FRONT.some((shape) => p.has(shape.muscle));
  const onBack = BODY_BACK.some((shape) => p.has(shape.muscle));
  const shapes = onBack && !onFront ? BODY_BACK : BODY_FRONT;
  return <Figure shapes={shapes} primary={p} secondary={new Set()} className={className} />;
}
