// Builds data/exerciseBank.json from free-exercise-db (https://github.com/yuhonas/free-exercise-db,
// Unlicense / public domain) plus our Hebrew names and cues in data/exercise-bank-he.json.
//
//   node scripts/build-exercise-bank.mjs
//
// Not part of `npm run build`: the output is committed. Re-run after editing the Hebrew file
// or bumping UPSTREAM_SHA (keep it in sync with BANK_IMAGE_BASE in lib/exerciseBank.ts).
import { readFileSync, writeFileSync } from 'node:fs';

const UPSTREAM_SHA = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const UPSTREAM_URL = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${UPSTREAM_SHA}/dist/exercises.json`;

const root = new URL('..', import.meta.url);
const HE_PATH = new URL('data/exercise-bank-he.json', root);
const OUT_PATH = new URL('data/exerciseBank.json', root);

// Gym-goer exercises only: no Olympic lifting, strongman, kettlebell sport or field drills.
const CATEGORIES = new Set(['strength', 'stretching', 'cardio']);
const EXTRA = new Set([
  // powerlifting
  'Barbell_Glute_Bridge', 'Barbell_Hip_Thrust', 'Box_Squat', 'Deficit_Deadlift', 'Dumbbell_Floor_Press',
  'Floor_Press', 'Glute_Ham_Raise', 'Good_Morning', 'Rack_Pulls', 'Seated_Good_Mornings', 'Sumo_Deadlift',
  'Kneeling_Squat', 'Band_Good_Morning', 'Hip_Lift_with_Band',
  // plyometrics
  'Front_Box_Jump', 'Knee_Tuck_Jump', 'Mountain_Climbers', 'Split_Jump', 'Star_Jump', 'Standing_Long_Jump',
  'Lateral_Box_Jump', 'Overhead_Slam', 'Plyo_Push-up', 'Medicine_Ball_Chest_Pass', 'Bench_Jump',
]);
const EXCLUDE_NAMES = [
  /clean/i, /jerk/i, /snatch/i, /^sled /i, /jammer/i, /chains/i, /kipping/i, /pirate ships/i,
  /spell caster/i, /^prowler/i, /^skating$/i, /^trail running/i, /^bicycling$/i, /^wind sprints$/i,
];

const MUSCLES = {
  abdominals: 'abs', abductors: 'abductors', adductors: 'adductors', biceps: 'biceps', calves: 'calves',
  chest: 'chest', forearms: 'forearms', glutes: 'glutes', hamstrings: 'hamstrings', lats: 'lats',
  'lower back': 'lower_back', 'middle back': 'middle_back', neck: 'neck', quadriceps: 'quads',
  shoulders: 'shoulders', traps: 'traps', triceps: 'triceps',
};
const EQUIPMENT = {
  barbell: 'barbell', 'e-z curl bar': 'barbell', dumbbell: 'dumbbells', machine: 'machine', cable: 'cable',
  kettlebells: 'kettlebell', bands: 'bands', 'body only': 'bodyweight',
  'medicine ball': 'other', 'exercise ball': 'other', 'foam roll': 'other', other: 'other',
};
const CATEGORY = { strength: 'strength', powerlifting: 'strength', plyometrics: 'strength', stretching: 'stretching', cardio: 'cardio' };

const upstream = await (await fetch(UPSTREAM_URL)).json();
const he = JSON.parse(readFileSync(HE_PATH, 'utf8'));

const muscles = (list) => [...new Set(list.map((m) => {
  if (!MUSCLES[m]) throw new Error(`Unknown muscle "${m}"`);
  return MUSCLES[m];
}))];

const bank = upstream
  .filter((e) => (CATEGORIES.has(e.category) || EXTRA.has(e.id)) && e.images.length >= 2)
  .filter((e) => !EXCLUDE_NAMES.some((re) => re.test(e.name)))
  .map((e) => {
    const t = he[e.id];
    const primary = muscles(e.primaryMuscles);
    return {
      id: e.id,
      name: e.name,
      nameHe: t?.n ?? e.name,
      primary,
      secondary: muscles(e.secondaryMuscles).filter((m) => !primary.includes(m)),
      // No equipment listed is almost always a bodyweight stretch or drill.
      equipment: e.equipment ? EQUIPMENT[e.equipment] : 'bodyweight',
      category: CATEGORY[e.category],
      level: e.level,
      ...(e.mechanic ? { mechanic: e.mechanic } : {}),
      ...(e.force ? { force: e.force } : {}),
      steps: t?.s ?? e.instructions,
      ...(t ? {} : { untranslated: true }),
    };
  });

// Strength first, then stretching and cardio; alphabetical (Hebrew) within each.
const ORDER = ['strength', 'stretching', 'cardio'];
bank.sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category) || a.nameHe.localeCompare(b.nameHe, 'he'));

for (const e of bank) if (!e.equipment) throw new Error(`Unmapped equipment for ${e.id}`);
const missing = bank.filter((e) => e.untranslated).length;
for (const e of bank) delete e.untranslated;
writeFileSync(OUT_PATH, JSON.stringify(bank) + '\n');
console.log(`${bank.length} exercises written, ${missing} still without Hebrew`);
