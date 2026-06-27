const { test, expect } = require('@playwright/test');

// Minimal in-memory Firestore-compat mock, backed by sessionStorage so data
// survives page.reload() within a single test (like a real backend would),
// but starts fresh for every test (each Playwright test gets its own
// browsing context). Collection-name-agnostic: works for both `items` and
// `stores` without any changes here.
const FIREBASE_MOCK = `
(function(){
  function loadAll() {
    try { return JSON.parse(sessionStorage.getItem('__mock_firestore__')) || {}; } catch (e) { return {}; }
  }
  function saveAll(all) {
    try { sessionStorage.setItem('__mock_firestore__', JSON.stringify(all)); } catch (e) {}
  }
  function makeId(prefix) { return prefix + '_' + Math.random().toString(36).slice(2) + Date.now(); }

  var all = loadAll();
  var seed = window.__FIRESTORE_SEED__;
  if (seed && !window.__FIRESTORE_SEEDED__) {
    window.__FIRESTORE_SEEDED__ = true;
    Object.keys(seed).forEach(function(name) {
      all[name] = all[name] || {};
      seed[name].forEach(function(data) { all[name][makeId('seed')] = data; });
    });
    saveAll(all);
  }

  function getStore(name) {
    all[name] = all[name] || {};
    return all[name];
  }

  function makeDocRef(name, id) {
    return {
      id: id,
      get: function() {
        var data = getStore(name)[id];
        return Promise.resolve({ exists: !!data, id: id, data: function() { return data; } });
      },
      set: function(data) { getStore(name)[id] = Object.assign({}, data); saveAll(all); return Promise.resolve(); },
      update: function(data) { var store = getStore(name); store[id] = Object.assign({}, store[id] || {}, data); saveAll(all); return Promise.resolve(); },
      delete: function() { delete getStore(name)[id]; saveAll(all); return Promise.resolve(); },
    };
  }

  function makeCollection(name) {
    var orderField = null, orderDir = 'asc';
    var colObj = {
      doc: function(id) { return makeDocRef(name, id || makeId('doc')); },
      add: function(data) {
        var id = makeId('doc');
        getStore(name)[id] = Object.assign({}, data);
        saveAll(all);
        return Promise.resolve({ id: id });
      },
      orderBy: function(field, dir) { orderField = field; orderDir = dir || 'asc'; return colObj; },
      get: function() {
        var store = getStore(name);
        var entries = Object.keys(store).map(function(id) { return [id, store[id]]; });
        if (orderField) {
          entries.sort(function(a, b) {
            var av = a[1][orderField] || 0, bv = b[1][orderField] || 0;
            return orderDir === 'desc' ? (bv - av) : (av - bv);
          });
        }
        return Promise.resolve({ docs: entries.map(function(e) { return { id: e[0], data: function() { return e[1]; } }; }) });
      },
    };
    return colObj;
  }

  var dbInstance = {
    collection: makeCollection,
    batch: function() {
      var ops = [];
      return {
        delete: function(ref) { ops.push(function() { return ref.delete(); }); },
        update: function(ref, data) { ops.push(function() { return ref.update(data); }); },
        set: function(ref, data) { ops.push(function() { return ref.set(data); }); },
        commit: function() {
          return ops.reduce(function(p, op) { return p.then(op); }, Promise.resolve());
        },
      };
    },
  };

  window.firebase = {
    initializeApp: function() {},
    firestore: function() { return dbInstance; },
  };
})();
`;

async function mockFirebase(page) {
  await page.route('**/firebasejs/**', route => {
    route.fulfill({ contentType: 'application/javascript', body: FIREBASE_MOCK });
  });
}

function items(page) {
  return page.locator('#list li:not(.add-row)');
}

async function addItem(page, text) {
  await page.locator('.add-row').click();
  const input = page.locator('.add-row-input');
  await input.fill(text);
  await input.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await mockFirebase(page);
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
});

// ── Basic CRUD (shopping tab, the default) ─────────────────────────────────

test('מציג מצב ריק בטעינה ראשונה', async ({ page }) => {
  // the "active" tab always shows the inline add-row instead of the empty
  // state, even with zero items — empty state is only for an empty "done" list
  await page.click('[data-filter="done"]');
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(items(page)).toHaveCount(0);
});

test('מוסיף פריט חדש לרשימה', async ({ page }) => {
  await addItem(page, 'חלב');

  await expect(items(page)).toHaveCount(1);
  await expect(items(page).locator('.item-text')).toHaveText('חלב');
  await expect(page.locator('#empty-state')).not.toBeVisible();
});

test('לא מוסיף פריט ריק', async ({ page }) => {
  await addItem(page, '   ');
  await expect(items(page)).toHaveCount(0);
});

test('מוסיף מספר פריטים ומציג אותם לפי סדר הוספה (האחרון ראשון)', async ({ page }) => {
  await addItem(page, 'חלב');
  await addItem(page, 'לחם');
  await addItem(page, 'גבינה');

  const texts = await items(page).locator('.item-text').allTextContents();
  expect(texts).toEqual(['גבינה', 'לחם', 'חלב']);
});

test('מסמן פריט כבוצע', async ({ page }) => {
  await addItem(page, 'חלב');
  await page.locator('.checkbox').click();

  await expect(items(page).first()).toHaveClass(/done/);
});

test('מבטל סימון של פריט בוצע', async ({ page }) => {
  await addItem(page, 'חלב');
  await page.locator('.checkbox').click();
  await page.locator('.checkbox').click();

  await expect(items(page).first()).not.toHaveClass(/done/);
});

test('מוחק פריט שהושלם', async ({ page }) => {
  await addItem(page, 'חלב');
  await page.locator('.checkbox').click(); // mark done
  await page.locator('.delete-btn').click(); // real delete (item is done)

  await expect(items(page)).toHaveCount(0);
});

test('כפתור "מחק שהושלמו" מופיע רק כשיש פריטים מסומנים', async ({ page }) => {
  await expect(page.locator('#clear-done')).not.toBeVisible();
  await addItem(page, 'חלב');
  await expect(page.locator('#clear-done')).not.toBeVisible();
  await page.locator('.checkbox').click();
  await expect(page.locator('#clear-done')).toBeVisible();
});

test('פילטר "פעיל"/"הושלם" מציגים את הפריטים הנכונים', async ({ page }) => {
  test.setTimeout(20000);
  await addItem(page, 'חלב');
  await addItem(page, 'לחם');
  await items(page).nth(1).locator('.checkbox').click(); // mark חלב done

  await page.click('[data-filter="done"]');
  await expect(items(page)).toHaveCount(0); // still within grace window

  await page.click('[data-filter="active"]');
  await page.waitForTimeout(5500);

  await expect(items(page)).toHaveCount(1);
  await expect(items(page).locator('.item-text')).toHaveText('לחם');

  await page.click('[data-filter="done"]');
  await expect(items(page)).toHaveCount(1);
  await expect(items(page).locator('.item-text')).toHaveText('חלב');
});

test('שומר פריטים ב-localStorage/Firestore ומחזיר אותם לאחר רענון', async ({ page }) => {
  await addItem(page, 'חלב');
  await addItem(page, 'לחם');

  await page.reload();

  await expect(items(page)).toHaveCount(2);
});

// ── Bottom tab bar / multi-list feature ─────────────────────────────────────

test('פריט שנוסף בטאב ירין לא מופיע בטאבים אחרים', async ({ page }) => {
  await page.click('.nav-tab[data-tab="yarin"]');
  await addItem(page, 'לקנות מתנה');
  await expect(items(page)).toHaveCount(1);

  await page.click('.nav-tab[data-tab="shopping"]');
  await expect(items(page)).toHaveCount(0);

  await page.click('.nav-tab[data-tab="ofir"]');
  await expect(items(page)).toHaveCount(0);

  await page.click('.nav-tab[data-tab="yarin"]');
  await expect(items(page)).toHaveCount(1);
  await expect(items(page).locator('.item-text')).toHaveText('לקנות מתנה');
});

test('ממשק החנויות מוצג רק בטאב קניות', async ({ page }) => {
  await expect(page.locator('.store-tabs-wrap')).toBeVisible();
  await expect(page.locator('.add-store-section')).toBeVisible();

  await page.click('.nav-tab[data-tab="yarin"]');
  await expect(page.locator('.store-tabs-wrap')).toBeHidden();
  await expect(page.locator('.add-store-section')).toBeHidden();

  await page.click('.nav-tab[data-tab="ofir"]');
  await expect(page.locator('.store-tabs-wrap')).toBeHidden();

  await page.click('.nav-tab[data-tab="shopping"]');
  await expect(page.locator('.store-tabs-wrap')).toBeVisible();
  await expect(page.locator('.add-store-section')).toBeVisible();
});

test('חלון החסד (5 שניות) עובד גם בטאב משימות', async ({ page }) => {
  test.setTimeout(20000);
  await page.click('.nav-tab[data-tab="ofir"]');
  await addItem(page, 'לשטוף את האוטו');
  await page.locator('.checkbox').click();

  await page.click('[data-filter="done"]');
  await expect(items(page)).toHaveCount(0); // still within grace window

  await page.click('[data-filter="active"]');
  await page.waitForTimeout(5500);

  await page.click('[data-filter="done"]');
  await expect(items(page)).toHaveCount(1);
});

test('ניקוי פריטים שהושלמו וביטול לא משפיעים על טאבים אחרים', async ({ page }) => {
  test.setTimeout(20000);
  await addItem(page, 'פריט קניות'); // sentinel on shopping tab

  await page.click('.nav-tab[data-tab="yarin"]');
  await addItem(page, 'משימה 1');
  await addItem(page, 'משימה 2');

  const checkboxes = page.locator('.checkbox');
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.waitForTimeout(5500);

  await page.click('[data-filter="done"]');
  await expect(items(page)).toHaveCount(2);

  await page.click('#clear-done');
  await expect(items(page)).toHaveCount(0);
  await expect(page.locator('#undo-toast')).toHaveClass(/visible/);

  await page.click('#undo-toast-btn');
  await expect(items(page)).toHaveCount(2);

  await page.click('.nav-tab[data-tab="shopping"]');
  await page.click('[data-filter="active"]'); // filter state is global, not per-tab; back to the default view
  await expect(items(page)).toHaveCount(1);
  await expect(items(page).locator('.item-text')).toHaveText('פריט קניות');
});

test('שמירת הטאב הפעיל ושינוי הכותרת לאחר רענון', async ({ page }) => {
  await page.click('.nav-tab[data-tab="ofir"]');
  await expect(page.locator('.header-text h1')).toHaveText('משימות אופיר');

  await page.reload();

  await expect(page.locator('.nav-tab[data-tab="ofir"]')).toHaveClass(/active/);
  await expect(page.locator('.header-text h1')).toHaveText('משימות אופיר');
});

test('פריט ישן בלי listType מוצג כברירת מחדל בטאב קניות', async ({ page }) => {
  await page.addInitScript(() => {
    window.__FIRESTORE_SEED__ = {
      items: [{ text: 'פריט ישן', done: false, order: 1, storeId: null }],
    };
  });
  await page.reload();

  await expect(page.locator('.nav-tab[data-tab="shopping"]')).toHaveClass(/active/);
  await expect(items(page)).toHaveCount(1);
  await expect(items(page).locator('.item-text')).toHaveText('פריט ישן');

  await page.click('.nav-tab[data-tab="yarin"]');
  await expect(items(page)).toHaveCount(0);
});

// ── PWA basics ────────────────────────────────────────────────────────────────

test('מניפסט PWA משקף את שם האפליקציה החדש', async ({ page }) => {
  const response = await page.request.get('/manifest.json');
  expect(response.status()).toBe(200);

  const manifest = await response.json();
  expect(manifest.name).toBe('קניות ומשימות');
  expect(manifest.display).toBe('standalone');
  expect(manifest.lang).toBe('he');
  expect(manifest.dir).toBe('rtl');
});

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('service worker נרשם בהצלחה', async ({ page }) => {
    await page.waitForTimeout(1000);
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });
    expect(swRegistered).toBe(true);
  });
});

test('כיוון RTL מוגדר נכון', async ({ page }) => {
  const dir = await page.locator('html').getAttribute('dir');
  expect(dir).toBe('rtl');
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBe('he');
});
