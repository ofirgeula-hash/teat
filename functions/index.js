const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');

admin.initializeApp();
const db = admin.firestore();

/* ─────────────────────────────────────────────────────────────
   DAILY BACKUP  –  runs every night at 03:00 Israel time
   Saves items + stores as JSON to Cloud Storage (free tier).
   Keeps the last 30 days; older backups are deleted automatically.
   File path inside the bucket:  backups/YYYY-MM-DD.json
   ───────────────────────────────────────────────────────────── */
exports.dailyBackup = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'Asia/Jerusalem' },
  async () => {
    const bucket = admin.storage().bucket();

    const [itemsSnap, storesSnap] = await Promise.all([
      db.collection('items').get(),
      db.collection('stores').get(),
    ]);

    function serializeDoc(doc) {
      const out = { _id: doc.id };
      for (const [k, v] of Object.entries(doc.data())) {
        // Convert Firestore Timestamps to ISO strings so the JSON is human-readable
        out[k] = v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v;
      }
      return out;
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      projectId:  'shopping-list-db6a8',
      collections: {
        items:  itemsSnap.docs.map(serializeDoc),
        stores: storesSnap.docs.map(serializeDoc),
      },
    };

    // YYYY-MM-DD in Israel timezone
    const dateStr = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Jerusalem' });
    const filename = `backups/${dateStr}.json`;

    await bucket.file(filename).save(JSON.stringify(backup, null, 2), {
      contentType: 'application/json',
    });

    // Prune backups older than 30 days
    const [files] = await bucket.getFiles({ prefix: 'backups/' });
    const cutoff  = Date.now() - 30 * 24 * 60 * 60 * 1000;
    await Promise.all(
      files
        .filter(f => new Date(f.metadata.timeCreated).getTime() < cutoff)
        .map(f => f.delete())
    );

    console.log(
      `Backup → ${filename}` +
      ` (${backup.collections.items.length} items, ${backup.collections.stores.length} stores)`
    );
  }
);

/* ─────────────────────────────────────────────────────────────
   LIST BACKUPS  –  returns available backup dates
   Called by Claude when restore is requested.
   ───────────────────────────────────────────────────────────── */
exports.listBackups = onCall({ cors: true }, async () => {
  const [files] = await admin.storage().bucket().getFiles({ prefix: 'backups/' });
  return files
    .map(f => ({
      name:      f.name,
      date:      f.name.replace('backups/', '').replace('.json', ''),
      createdAt: f.metadata.timeCreated,
      sizeBytes: parseInt(f.metadata.size || '0'),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
});

/* ─────────────────────────────────────────────────────────────
   RESTORE  –  replaces Firestore data from a backup file
   Usage: call with { date: "YYYY-MM-DD" }
   IMPORTANT: deletes ALL current items & stores before restoring.
   ───────────────────────────────────────────────────────────── */
exports.restoreBackup = onCall({ cors: true }, async (request) => {
  const date = (request.data && request.data.date) || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');

  const file = admin.storage().bucket().file(`backups/${date}.json`);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`No backup found for ${date}`);

  const [contents] = await file.download();
  const backup = JSON.parse(contents.toString());

  const batch1 = db.batch();
  const batch2 = db.batch();

  // Delete existing data
  const [oldItems, oldStores] = await Promise.all([
    db.collection('items').get(),
    db.collection('stores').get(),
  ]);
  oldItems.docs.forEach(d => batch1.delete(d.ref));
  oldStores.docs.forEach(d => batch1.delete(d.ref));
  await batch1.commit();

  // Re-insert from backup (restore original doc IDs)
  for (const item of backup.collections.items) {
    const { _id, ...data } = item;
    batch2.set(db.collection('items').doc(_id), data);
  }
  for (const store of backup.collections.stores) {
    const { _id, ...data } = store;
    batch2.set(db.collection('stores').doc(_id), data);
  }
  await batch2.commit();

  return {
    restored: date,
    items:  backup.collections.items.length,
    stores: backup.collections.stores.length,
  };
});

exports.sendDailyNotifications = onSchedule(
  { schedule: 'every 15 minutes', timeZone: 'Asia/Jerusalem' },
  async () => {
    // Current time in Israel timezone
    const israelTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })
    );
    const currentHour    = israelTime.getHours();
    const currentMinute  = israelTime.getMinutes();
    const currentDay     = israelTime.getDay(); // 0=Sun … 6=Sat
    const currentMinutes = currentHour * 60 + currentMinute;

    const devicesSnap = await db.collection('devices').get();
    if (devicesSnap.empty) return;

    const messaging = admin.messaging();

    for (const doc of devicesSnap.docs) {
      const device = doc.data();
      if (!device.notifyEnabled) continue;

      // Day filter
      const notifyDays = Array.isArray(device.notifyDays) ? device.notifyDays : [0,1,2,3,4,5,6];
      if (!notifyDays.includes(currentDay)) continue;

      // Time window: ±15 min of target
      const [h, m] = (device.notifyTime || '08:00').split(':').map(Number);
      const targetMinutes = h * 60 + m;
      if (Math.abs(currentMinutes - targetMinutes) >= 15) continue;

      // Count open tasks for this user
      const userId = device.userId; // 'ofir' | 'yarin'
      if (!userId) continue;

      const itemsSnap = await db.collection('items')
        .where('listType', '==', userId)
        .get();

      const openCount = itemsSnap.docs.filter(d => !d.data().done).length;
      if (openCount === 0 && !device.notifyIfEmpty) continue;

      const name  = userId === 'ofir' ? 'אופיר' : 'ירין';
      const title = `משימות ${name} 📋`;
      const body  = openCount === 0
        ? 'כל המשימות הושלמו ✅'
        : `יש ${openCount} משימ${openCount === 1 ? 'ה' : 'ות'} פתוח${openCount === 1 ? 'ה' : 'ות'}`;

      try {
        await messaging.send({
          token: doc.id,
          notification: { title, body },
          webpush: {
            notification: {
              icon:  'https://ofirgeula-hash.github.io/teat/icon-192.png',
              badge: 'https://ofirgeula-hash.github.io/teat/icon-192.png',
              dir:   'rtl',
              lang:  'he',
            },
            fcmOptions: { link: 'https://ofirgeula-hash.github.io/teat/' },
          },
        });
      } catch (e) {
        if (
          e.code === 'messaging/registration-token-not-registered' ||
          e.code === 'messaging/invalid-registration-token'
        ) {
          await doc.ref.delete(); // stale token — clean up
        } else {
          console.error('FCM send failed for', doc.id.slice(0, 12), e.message);
        }
      }
    }
  }
);
