const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

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
