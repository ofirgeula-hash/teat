const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Clear localStorage before each test for a clean slate
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ── Adding items ──────────────────────────────────────────────────────────────

test('מציג מצב ריק בטעינה ראשונה', async ({ page }) => {
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('#stat-total')).toHaveText('0');
  await expect(page.locator('#stat-remaining')).toHaveText('0');
  await expect(page.locator('#stat-done')).toHaveText('0');
});

test('מוסיף פריט חדש לרשימה', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');

  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#list li .item-text')).toHaveText('חלב');
  await expect(page.locator('#stat-total')).toHaveText('1');
  await expect(page.locator('#stat-remaining')).toHaveText('1');
  await expect(page.locator('#empty-state')).not.toBeVisible();
});

test('מוסיף פריט עם לחיצת Enter', async ({ page }) => {
  await page.fill('#item-input', 'לחם');
  await page.press('#item-input', 'Enter');

  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#list li .item-text')).toHaveText('לחם');
});

test('מנקה את שדה הקלט לאחר הוספה', async ({ page }) => {
  await page.fill('#item-input', 'ביצים');
  await page.click('#add-btn');

  await expect(page.locator('#item-input')).toHaveValue('');
});

test('לא מוסיף פריט ריק', async ({ page }) => {
  await page.fill('#item-input', '   ');
  await page.click('#add-btn');

  await expect(page.locator('#list li')).toHaveCount(0);
  await expect(page.locator('#empty-state')).toBeVisible();
});

test('מוסיף מספר פריטים ומציג אותם לפי סדר הוספה (האחרון ראשון)', async ({ page }) => {
  for (const item of ['חלב', 'לחם', 'גבינה']) {
    await page.fill('#item-input', item);
    await page.click('#add-btn');
  }

  const texts = await page.locator('#list li .item-text').allTextContents();
  expect(texts).toEqual(['גבינה', 'לחם', 'חלב']);
  await expect(page.locator('#stat-total')).toHaveText('3');
});

// ── Checking off items ────────────────────────────────────────────────────────

test('מסמן פריט כבוצע', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');

  await page.locator('#list li .checkbox').click();

  await expect(page.locator('#list li')).toHaveClass(/done/);
  await expect(page.locator('#stat-done')).toHaveText('1');
  await expect(page.locator('#stat-remaining')).toHaveText('0');
});

test('מבטל סימון של פריט בוצע', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');

  await page.locator('#list li .checkbox').click(); // mark done
  await page.locator('#list li .checkbox').click(); // unmark

  await expect(page.locator('#list li')).not.toHaveClass(/done/);
  await expect(page.locator('#stat-done')).toHaveText('0');
  await expect(page.locator('#stat-remaining')).toHaveText('1');
});

// ── Deleting items ────────────────────────────────────────────────────────────

test('מוחק פריט מהרשימה', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');
  await page.fill('#item-input', 'לחם');
  await page.click('#add-btn');

  await page.locator('#list li').first().locator('.delete-btn').click();
  await page.waitForTimeout(300); // animation

  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#stat-total')).toHaveText('1');
});

test('מוחק את הפריט האחרון ומציג מצב ריק', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');

  await page.locator('#list li .delete-btn').click();
  await page.waitForTimeout(300);

  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('#stat-total')).toHaveText('0');
});

// ── Clear done ────────────────────────────────────────────────────────────────

test('כפתור "מחק שהושלמו" מופיע רק כשיש פריטים מסומנים', async ({ page }) => {
  await expect(page.locator('#clear-done')).not.toBeVisible();

  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');
  await expect(page.locator('#clear-done')).not.toBeVisible();

  await page.locator('#list li .checkbox').click();
  await expect(page.locator('#clear-done')).toBeVisible();
});

test('מוחק את כל הפריטים שהושלמו', async ({ page }) => {
  for (const item of ['חלב', 'לחם', 'גבינה']) {
    await page.fill('#item-input', item);
    await page.click('#add-btn');
  }

  // Mark first two as done
  const checkboxes = page.locator('#list li .checkbox');
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();

  await page.click('#clear-done');
  await page.waitForTimeout(100);

  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#stat-total')).toHaveText('1');
});

// ── Filters ───────────────────────────────────────────────────────────────────

test('פילטר "פעיל" מציג רק פריטים לא מסומנים', async ({ page }) => {
  for (const item of ['חלב', 'לחם']) {
    await page.fill('#item-input', item);
    await page.click('#add-btn');
  }
  await page.locator('#list li').first().locator('.checkbox').click();

  await page.click('[data-filter="active"]');

  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#list li .item-text')).toHaveText('חלב');
});

test('פילטר "הושלם" מציג רק פריטים מסומנים', async ({ page }) => {
  for (const item of ['חלב', 'לחם']) {
    await page.fill('#item-input', item);
    await page.click('#add-btn');
  }
  await page.locator('#list li').first().locator('.checkbox').click();

  await page.click('[data-filter="done"]');

  await expect(page.locator('#list li')).toHaveCount(1);
  await expect(page.locator('#list li .item-text')).toHaveText('לחם');
});

test('פילטר "הכל" מחזיר לתצוגה המלאה', async ({ page }) => {
  for (const item of ['חלב', 'לחם', 'גבינה']) {
    await page.fill('#item-input', item);
    await page.click('#add-btn');
  }
  await page.locator('#list li').first().locator('.checkbox').click();

  await page.click('[data-filter="done"]');
  await page.click('[data-filter="all"]');

  await expect(page.locator('#list li')).toHaveCount(3);
});

// ── localStorage persistence ──────────────────────────────────────────────────

test('שומר פריטים ב-localStorage ומחזיר אותם לאחר רענון', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');
  await page.fill('#item-input', 'לחם');
  await page.click('#add-btn');

  await page.reload();

  await expect(page.locator('#list li')).toHaveCount(2);
  await expect(page.locator('#stat-total')).toHaveText('2');
});

test('שומר מצב "בוצע" לאחר רענון', async ({ page }) => {
  await page.fill('#item-input', 'חלב');
  await page.click('#add-btn');
  await page.locator('#list li .checkbox').click();

  await page.reload();

  await expect(page.locator('#list li')).toHaveClass(/done/);
  await expect(page.locator('#stat-done')).toHaveText('1');
});

// ── PWA basics ────────────────────────────────────────────────────────────────

test('מניפסט PWA נטען בהצלחה', async ({ page }) => {
  const response = await page.request.get('/manifest.json');
  expect(response.status()).toBe(200);

  const manifest = await response.json();
  expect(manifest.name).toBe('רשימת קניות');
  expect(manifest.display).toBe('standalone');
  expect(manifest.lang).toBe('he');
  expect(manifest.dir).toBe('rtl');
});

test('service worker נרשם בהצלחה', async ({ page }) => {
  await page.waitForTimeout(1000);
  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.length > 0;
  });
  expect(swRegistered).toBe(true);
});

test('כיוון RTL מוגדר נכון', async ({ page }) => {
  const dir = await page.locator('html').getAttribute('dir');
  expect(dir).toBe('rtl');
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBe('he');
});
