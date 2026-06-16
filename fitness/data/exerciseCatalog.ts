import type { ExerciseLibraryItem } from '@/types';

export type CatalogExercise = Omit<ExerciseLibraryItem, 'id'>;

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // ── חזה (chest) ──────────────────────────────────────────────────────────
  { name: 'Bench Press', nameHe: 'לחיצת חזה במוט', muscleGroup: 'chest', subMuscle: 'חזה אמצעי', equipment: ['plates'], keyPoints: 'מרפקים בזווית 45 מעלות לגוף, להוריד עד מגע קל בחזה' },
  { name: 'Incline Barbell Press', nameHe: 'לחיצת חזה עליון במוט', muscleGroup: 'chest', subMuscle: 'חזה עליון', equipment: ['plates'], keyPoints: 'שיפוע מושב 30-45 מעלות, לא לנעול מרפקים בלחיצה' },
  { name: 'Incline Dumbbell Press', nameHe: 'לחיצת חזה עליון עם דאמבלים', muscleGroup: 'chest', subMuscle: 'חזה עליון', equipment: ['dumbbells'], keyPoints: 'טווח תנועה מלא, לא להכביד מדי על שמירת היציבה' },
  { name: 'Decline Press', nameHe: 'לחיצת חזה תחתון', muscleGroup: 'chest', subMuscle: 'חזה תחתון', equipment: ['plates', 'machine'], keyPoints: 'להוריד את המוט לכיוון החזה התחתון, לא לבטן' },
  { name: 'Chest Press Machine', nameHe: 'לחיצת חזה במכונה', muscleGroup: 'chest', equipment: ['machine'], keyPoints: 'גב צמוד למשענת, לא לנעול מרפקים בקצה' },
  { name: 'Chest Fly Machine', nameHe: 'פרפר במכונה', muscleGroup: 'chest', equipment: ['machine'], keyPoints: 'תנועה מבוקרת, כיווץ קל בסוף הטווח' },
  { name: 'Cable Crossover', nameHe: 'פולי תחתון-עליון לחזה', muscleGroup: 'chest', equipment: ['machine'], keyPoints: 'שיפוע גוף קל קדימה, לסגור ידיים מול החזה' },
  { name: 'Push-Up', nameHe: 'שכיבות סמיכה', muscleGroup: 'chest', equipment: [], keyPoints: 'גוף ישר מקצה לקצה, לדחוס בטן' },
  { name: 'Dips', nameHe: 'מקבילים', muscleGroup: 'chest', subMuscle: 'חזה תחתון', equipment: [], keyPoints: 'גוף נוטה קדימה להעמסת חזה, לא לרדת עמוק מדי על הכתפיים' },

  // ── גב (back) ────────────────────────────────────────────────────────────
  { name: 'Deadlift', nameHe: 'דדליפט', muscleGroup: 'back', subMuscle: 'גב תחתון', equipment: ['plates'], keyPoints: 'גב ישר לכל אורך התנועה, המוט קרוב לגוף' },
  { name: 'Pull-Up', nameHe: 'מתח', muscleGroup: 'back', equipment: [], keyPoints: 'למשוך מהשכמות, לא רק מהידיים' },
  { name: 'Lat Pulldown', nameHe: 'פולי עליון לגב', muscleGroup: 'back', equipment: ['machine'], keyPoints: 'אחיזה רחבה, למשוך עד החזה העליון' },
  { name: 'Seated Cable Row', nameHe: 'חתירה בישיבה בפולי', muscleGroup: 'back', equipment: ['machine'], keyPoints: 'גב זקוף, למשוך מרפקים אחורה ולא למעלה' },
  { name: 'T-Bar Row', nameHe: 'חתירה בטי-בר', muscleGroup: 'back', equipment: ['plates'], keyPoints: 'גב ישר וקבוע, לא לסחוט עם הגוף' },
  { name: 'Bent-Over Row', nameHe: 'חתירה בכפיפת גב במוט', muscleGroup: 'back', equipment: ['plates'], keyPoints: 'ברכיים מעט כפופות, גב ניטרלי לכל אורך הסט' },
  { name: 'One-Arm Dumbbell Row', nameHe: 'חתירה ביד עם דאמבל', muscleGroup: 'back', equipment: ['dumbbells'], keyPoints: 'גב ניטרלי, למשוך עד הצלעות התחתונות' },
  { name: 'Back Extension', nameHe: 'כפיפות לגב תחתון', muscleGroup: 'back', subMuscle: 'גב תחתון', equipment: ['machine'], keyPoints: 'לא לקמר יתר על המידה בקצה העליון' },

  // ── כתפיים (shoulders) ───────────────────────────────────────────────────
  { name: 'Overhead Press', nameHe: 'לחיצת כתפיים בעמידה', muscleGroup: 'shoulders', equipment: ['plates'], keyPoints: 'ליישר את המוט מעל הראש, לא לקמר גב תחתון' },
  { name: 'Seated Shoulder Press', nameHe: 'לחיצת כתפיים בישיבה', muscleGroup: 'shoulders', equipment: ['dumbbells', 'machine'], keyPoints: 'גב צמוד למשענת, לא לנעול מרפקים בקצה' },
  { name: 'Lateral Raise', nameHe: 'הרחקת כתפיים לצד', muscleGroup: 'shoulders', equipment: ['dumbbells'], keyPoints: 'מרפק מוביל מעל היד, לא להרים מעל קו הכתף' },
  { name: 'Front Raise', nameHe: 'הרחקת כתפיים לפנים', muscleGroup: 'shoulders', equipment: ['dumbbells', 'plates'], keyPoints: 'תנועה מבוקרת בלי תנופה' },
  { name: 'Arnold Press', nameHe: 'לחיצת ארנולד', muscleGroup: 'shoulders', equipment: ['dumbbells'], keyPoints: 'סבב פרק כף היד בעלייה מבטן לחוץ' },
  { name: 'Cable Lateral Raise', nameHe: 'הרחקת כתפיים בפולי', muscleGroup: 'shoulders', equipment: ['machine'], keyPoints: 'מתח קבוע על השריר לכל אורך הטווח' },

  // ── כתף אחורית (rear_delts) ──────────────────────────────────────────────
  { name: 'Face Pull', nameHe: 'פייס פול', muscleGroup: 'rear_delts', equipment: ['machine'], keyPoints: 'למשוך לכיוון הפנים, מרפקים גבוהים' },
  { name: 'Reverse Pec Deck', nameHe: 'כתף אחורית בפרפר הפוך', muscleGroup: 'rear_delts', equipment: ['machine'], keyPoints: 'מרפק מוביל את התנועה, לא הידיים' },
  { name: 'Bent-Over Rear Delt Fly', nameHe: 'פרפר אחורי בכפיפת גב', muscleGroup: 'rear_delts', equipment: ['dumbbells'], keyPoints: 'גב ישר וקבוע, תנועה מבוקרת לצדדים' },
  { name: 'Cable Rear Delt Fly', nameHe: 'פרפר אחורי בפולי', muscleGroup: 'rear_delts', equipment: ['machine'], keyPoints: 'ידיים חצי כפופות, למשוך לצדדים ולא לאחור' },

  // ── טרפזים (traps) ───────────────────────────────────────────────────────
  { name: 'Barbell Shrug', nameHe: 'שראג במוט', muscleGroup: 'traps', equipment: ['plates'], keyPoints: 'להרים כתפיים ישר למעלה, לא לסבב' },
  { name: 'Dumbbell Shrug', nameHe: 'שראג עם דאמבלים', muscleGroup: 'traps', equipment: ['dumbbells'], keyPoints: 'להחזיק רגע בכיווץ מלא בחלק העליון' },
  { name: 'Cable Shrug', nameHe: 'שראג בפולי', muscleGroup: 'traps', equipment: ['machine'], keyPoints: 'תנועה איטית ומבוקרת, להימנע מתנופה' },
  { name: 'Upright Row', nameHe: 'משיכה לסנטר', muscleGroup: 'traps', equipment: ['plates', 'dumbbells'], keyPoints: 'מרפקים מובילים מעל פרקי הידיים' },

  // ── ביצפס (biceps) ───────────────────────────────────────────────────────
  { name: 'Barbell Curl', nameHe: 'כפיפת מרפקים במוט', muscleGroup: 'biceps', equipment: ['plates'], keyPoints: 'מרפקים קבועים לצד הגוף, בלי תנופה' },
  { name: 'Dumbbell Curl', nameHe: 'כפיפת מרפקים עם דאמבלים', muscleGroup: 'biceps', equipment: ['dumbbells'], keyPoints: 'סבב פרק כף היד החוצה בעלייה' },
  { name: 'Hammer Curl', nameHe: 'פטישים', muscleGroup: 'biceps', equipment: ['dumbbells'], keyPoints: 'אחיזה ניטרלית לכל אורך התנועה' },
  { name: 'Cable Curl', nameHe: 'כפיפת מרפקים בפולי', muscleGroup: 'biceps', equipment: ['machine'], keyPoints: 'מתח קבוע על השריר, לא לנעול מרפקים בתחתית' },
  { name: 'Preacher Curl', nameHe: 'כפיפת מרפקים בסקוט', muscleGroup: 'biceps', equipment: ['dumbbells', 'plates'], keyPoints: 'יד צמודה לכרית, להוריד לטווח מלא בלי לנעול' },
  { name: 'Concentration Curl', nameHe: 'כפיפת מרפקים בריכוז', muscleGroup: 'biceps', equipment: ['dumbbells'], keyPoints: 'מרפק נשען על הירך, תנועה איטית ומבוקרת' },

  // ── טריצפס (triceps) ─────────────────────────────────────────────────────
  { name: 'Triceps Pushdown', nameHe: 'פשיטת מרפקים בפולי עליון', muscleGroup: 'triceps', equipment: ['machine'], keyPoints: 'מרפקים קבועים לצד הגוף, לפשוט עד הסוף' },
  { name: 'Rope Pushdown', nameHe: 'פולי עליון עם חבל לטריצפס', muscleGroup: 'triceps', equipment: ['machine'], keyPoints: 'לפתוח את החבל בקצה התנועה' },
  { name: 'Skull Crusher', nameHe: 'פשיטת מרפקים בשכיבה', muscleGroup: 'triceps', equipment: ['plates', 'dumbbells'], keyPoints: 'מרפקים קבועים מעל הראש, לא לזוז קדימה' },
  { name: 'Close-Grip Bench Press', nameHe: 'לחיצת חזה צרה לטריצפס', muscleGroup: 'triceps', equipment: ['plates'], keyPoints: 'אחיזה צרה מרוחק כתפיים, מרפקים קרובים לגוף' },
  { name: 'Overhead Triceps Extension', nameHe: 'פשיטת מרפקים מעל הראש', muscleGroup: 'triceps', equipment: ['dumbbells'], keyPoints: 'מרפקים קבועים קרוב לראש, לא לפתוח לצדדים' },
  { name: 'Triceps Dip', nameHe: 'דיפס לטריצפס', muscleGroup: 'triceps', equipment: [], keyPoints: 'גוף זקוף, מרפקים קרובים לגוף ולא לצדדים' },

  // ── קוואדריספס (quads) ───────────────────────────────────────────────────
  { name: 'Back Squat', nameHe: 'סקוואט', muscleGroup: 'quads', equipment: ['plates'], keyPoints: 'ברכיים בקו עם כפות הרגליים, ירידה עד מקבילי לרצפה' },
  { name: 'Front Squat', nameHe: 'סקוואט פרונטלי', muscleGroup: 'quads', equipment: ['plates'], keyPoints: 'מרפקים גבוהים, גב עליון זקוף' },
  { name: 'Leg Press', nameHe: 'לחיצת רגליים', muscleGroup: 'quads', equipment: ['machine'], keyPoints: 'לא לנעול ברכיים בקצה העליון' },
  { name: 'Walking Lunge', nameHe: 'לאנג הליכה', muscleGroup: 'quads', equipment: ['dumbbells'], keyPoints: 'ברך קדמית לא חורגת מקצות האצבעות' },
  { name: 'Bulgarian Split Squat', nameHe: 'סקוואט בולגרי', muscleGroup: 'quads', equipment: ['dumbbells'], keyPoints: 'משקל על הרגל הקדמית, גוף זקוף' },
  { name: 'Leg Extension', nameHe: 'פשיטת רגליים במכונה', muscleGroup: 'quads', equipment: ['machine'], keyPoints: 'תנועה מבוקרת, לא לנעול ברכיים בקצה' },
  { name: 'Hack Squat', nameHe: 'האק סקוואט', muscleGroup: 'quads', equipment: ['machine'], keyPoints: 'גב צמוד למשענת לכל אורך התנועה' },

  // ── ביצפס ירך (hamstrings) ───────────────────────────────────────────────
  { name: 'Romanian Deadlift', nameHe: 'דדליפט רומני', muscleGroup: 'hamstrings', equipment: ['plates'], keyPoints: 'ברכיים כמעט נעולות, להרגיש מתיחה בירך האחורית' },
  { name: 'Leg Curl', nameHe: 'כפיפת רגליים במכונה', muscleGroup: 'hamstrings', equipment: ['machine'], keyPoints: 'אגן צמוד למשענת, תנועה מבוקרת' },
  { name: 'Stiff-Leg Deadlift', nameHe: 'דדליפט סטיף', muscleGroup: 'hamstrings', equipment: ['plates', 'dumbbells'], keyPoints: 'המוט קרוב לרגליים, גב ישר' },
  { name: 'Good Morning', nameHe: 'גוד מורנינג', muscleGroup: 'hamstrings', equipment: ['plates'], keyPoints: 'ירך נע אחורה תחילה, גב ישר לכל אורך התנועה' },
  { name: 'Glute Bridge', nameHe: 'הרמת אגן', muscleGroup: 'hamstrings', subMuscle: 'גלוטאוס', equipment: [], keyPoints: 'כיווץ עכוזים מלא בקצה העליון' },

  // ── תאומים (calves) ──────────────────────────────────────────────────────
  { name: 'Standing Calf Raise', nameHe: 'תאומים בעמידה', muscleGroup: 'calves', equipment: ['machine'], keyPoints: 'טווח תנועה מלא, להחזיק רגע בכיווץ' },
  { name: 'Seated Calf Raise', nameHe: 'תאומים בישיבה', muscleGroup: 'calves', equipment: ['machine'], keyPoints: 'לרדת לעומק מתיחה מלא בכל חזרה' },
  { name: 'Leg Press Calf Raise', nameHe: 'תאומים במכונת לחיצת רגליים', muscleGroup: 'calves', equipment: ['machine'], keyPoints: 'אצבעות בלבד על המשענת, טווח מלא' },
  { name: 'Donkey Calf Raise', nameHe: 'תאומים בכפיפת גוף', muscleGroup: 'calves', equipment: ['machine'], keyPoints: 'גוף כפוף קדימה, תנועה איטית ומבוקרת' },

  // ── אדוקטורים (adductors) ────────────────────────────────────────────────
  { name: 'Hip Adduction Machine', nameHe: 'סגירת רגליים במכונה', muscleGroup: 'adductors', equipment: ['machine'], keyPoints: 'תנועה מבוקרת, לא להיעזר בתנופה' },
  { name: 'Hip Abduction Machine', nameHe: 'הרחקת רגליים במכונה', muscleGroup: 'adductors', equipment: ['machine'], keyPoints: 'גב צמוד למשענת, תנועה איטית' },
  { name: 'Cable Hip Adduction', nameHe: 'סגירת רגל בפולי', muscleGroup: 'adductors', equipment: ['machine'], keyPoints: 'גוף יציב, תנועה מבוקרת מהירך' },
  { name: 'Sumo Squat', nameHe: 'סקוואט סומו', muscleGroup: 'adductors', equipment: ['plates', 'dumbbells'], keyPoints: 'רגליים פתוחות רחב, בהונות פונות לצדדים' },

  // ── בטן (abs) ─────────────────────────────────────────────────────────────
  { name: 'Plank', nameHe: 'פלאנק', muscleGroup: 'abs', equipment: [], keyPoints: 'גוף ישר, לדחוס בטן ולא להחזיק נשימה' },
  { name: 'Crunch', nameHe: 'כפיפות בטן', muscleGroup: 'abs', equipment: [], keyPoints: 'להרים חזה לכיוון הברכיים, לא למשוך בצוואר' },
  { name: 'Hanging Leg Raise', nameHe: 'הרמת רגליים בתלייה', muscleGroup: 'abs', equipment: [], keyPoints: 'תנועה מבוקרת, לא להיעזר בתנופה' },
  { name: 'Cable Crunch', nameHe: 'כפיפות בטן בפולי', muscleGroup: 'abs', equipment: ['machine'], keyPoints: 'לכפוף מהבטן ולא מהירכיים' },
  { name: 'Russian Twist', nameHe: 'סיבובי רוסים', muscleGroup: 'abs', subMuscle: 'אלכסונים', equipment: [], keyPoints: 'גב זקוף ומורם, תנועה מבוקרת לצדדים' },
  { name: 'Ab Wheel Rollout', nameHe: 'גלגל בטן', muscleGroup: 'abs', equipment: [], keyPoints: 'אגן נעול, לא לקמר גב תחתון' },
];
