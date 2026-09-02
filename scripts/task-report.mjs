#!/usr/bin/env node
/**
 * Builds a plain, readable HTML summary of everything in the "קניות ומשימות" app
 * (Firestore collections `items` + `stores`) and writes it to a file.
 *
 * Usage:  node scripts/task-report.mjs [outputPath]
 * Prints the suggested email subject line to stdout.
 *
 * The API key below is the same public web key already shipped in index.html.
 */

const PROJECT_ID = 'shopping-list-db6a8';
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyB-sa9xR6DxdYv6DCAUn1Ze1Kzb6TMuxzA';
const OUT = process.argv[2] || 'task-report.html';
const TZ = 'Asia/Jerusalem';
const RECENT_DAYS = 2; // window for the "completed recently" section

// Stores whose items Ofir does not want in the report at all — not listed, not counted.
const EXCLUDED_STORE_NAMES = ['ירקות', 'רשימה קבועה לסופר'];

const LISTS = [
  { id: 'ofir', title: 'משימות אופיר' },
  { id: 'yarin', title: 'משימות ירין' },
];

const C = {
  bg: '#eef2f7', surface: '#ffffff', accent: '#4a7db8', danger: '#d94f4f',
  success: '#2e9e6a', text: '#1c2b3a', muted: '#6a8099', border: '#cdd8e6',
};

async function fetchCollection(name) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${name}?key=${API_KEY}&pageSize=1000`;
  const docs = [];
  let pageToken;
  do {
    const res = await fetch(pageToken ? `${url}&pageToken=${pageToken}` : url);
    if (!res.ok) throw new Error(`Firestore ${name}: ${res.status} ${await res.text()}`);
    const body = await res.json();
    for (const doc of body.documents || []) {
      docs.push({ id: doc.name.split('/').pop(), updateTime: doc.updateTime, ...decode(doc.fields) });
    }
    pageToken = body.nextPageToken;
  } while (pageToken);
  return docs;
}

function decode(fields = {}) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if ('stringValue' in value) out[key] = value.stringValue;
    else if ('booleanValue' in value) out[key] = value.booleanValue;
    else if ('integerValue' in value) out[key] = Number(value.integerValue);
    else if ('doubleValue' in value) out[key] = value.doubleValue;
    else if ('nullValue' in value) out[key] = null;
  }
  return out;
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// urgent first, then the app's own order (newest first)
const sortItems = list =>
  [...list].sort((a, b) => (b.urgent === true) - (a.urgent === true) || (b.order || 0) - (a.order || 0));

function row(item) {
  const bullet = item.urgent
    ? `<span style="color:${C.danger};font-weight:700;">!</span>`
    : `<span style="color:${C.border};">•</span>`;
  const weight = item.urgent ? '600' : '400';
  const color = item.urgent ? C.danger : C.text;
  return `<tr>
      <td style="width:18px;padding:7px 0 7px 8px;vertical-align:top;font-size:15px;line-height:1.5;">${bullet}</td>
      <td style="padding:7px 0;font-size:15px;line-height:1.5;font-weight:${weight};color:${color};">${esc(item.text)}</td>
    </tr>`;
}

function group(title, items, { count = true } = {}) {
  if (!items.length) return '';
  return `<div style="margin:0 0 18px;">
      <div style="font-size:13px;font-weight:600;color:${C.muted};padding:0 0 6px;border-bottom:1px solid ${C.border};">
        ${esc(title)}${count ? ` <span style="font-weight:400;">(${items.length})</span>` : ''}
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        ${sortItems(items).map(row).join('')}
      </table>
    </div>`;
}

function section(title, inner, emptyText) {
  return `<div style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;padding:18px 20px;margin:0 0 16px;">
      <h2 style="margin:0 0 14px;font-size:18px;font-weight:700;color:${C.accent};">${esc(title)}</h2>
      ${inner || `<div style="font-size:14px;color:${C.muted};">${esc(emptyText)}</div>`}
    </div>`;
}

function build(items, stores) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('he-IL', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
  const normalized = items.map(i => ({ ...i, listType: i.listType || 'shopping' }));
  const open = normalized.filter(i => !i.done);
  const urgent = open.filter(i => i.urgent === true);
  const since = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const doneRecently = normalized.filter(i => i.done && i.updateTime && new Date(i.updateTime) >= since);

  const stat = (value, label, color) => `<td style="text-align:center;padding:0 6px;">
      <div style="font-size:26px;font-weight:700;color:${color};line-height:1.2;">${value}</div>
      <div style="font-size:12px;color:${C.muted};">${esc(label)}</div>
    </td>`;

  const summary = `<div style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;padding:18px 20px;margin:0 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          ${stat(open.length, 'משימות פתוחות', C.text)}
          ${stat(urgent.length, 'דחופות', C.danger)}
          ${stat(doneRecently.length, 'הושלמו ביומיים האחרונים', C.success)}
        </tr>
      </table>
    </div>`;

  const personal = LISTS.map(list => {
    const listOpen = open.filter(i => i.listType === list.id);
    const table = listOpen.length
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        ${sortItems(listOpen).map(row).join('')}
      </table>`
      : '';
    return section(list.title, table, 'אין משימות פתוחות ✓');
  }).join('');

  const shoppingOpen = open.filter(i => i.listType === 'shopping');
  const byStore = stores
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(store => group(store.name, shoppingOpen.filter(i => i.storeId === store.id)))
    .join('');
  const storeIds = new Set(stores.map(s => s.id));
  const unassigned = group('ללא חנות', shoppingOpen.filter(i => !i.storeId || !storeIds.has(i.storeId)));
  const shopping = section('רשימת קניות', byStore + unassigned, 'הרשימה ריקה ✓');

  const completed = doneRecently.length
    ? `<div style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;padding:18px 20px;margin:0 0 16px;">
        <h2 style="margin:0 0 10px;font-size:16px;font-weight:700;color:${C.success};">הושלם ביומיים האחרונים</h2>
        <div style="font-size:14px;line-height:1.9;color:${C.muted};">
          ${doneRecently.map(i => esc(i.text)).join(' · ')}
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8" /><title>דוח משימות</title></head>
<body style="margin:0;padding:20px 12px;background:${C.bg};font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:${C.text};" dir="rtl">
  <div style="max-width:600px;margin:0 auto;">
    <div style="padding:0 4px 16px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${C.text};">דוח משימות</h1>
      <div style="font-size:13px;color:${C.muted};margin-top:4px;">${esc(dateLabel)} · קניות ומשימות</div>
    </div>
    ${summary}
    ${personal}
    ${shopping}
    ${completed}
    <div style="text-align:center;font-size:12px;color:${C.muted};padding:8px 0 4px;">
      דוח אוטומטי, נשלח כל יומיים
    </div>
  </div>
</body>
</html>`;
}

const [allItems, allStores] = await Promise.all([fetchCollection('items'), fetchCollection('stores')]);

const excludedStoreIds = new Set(
  allStores.filter(s => EXCLUDED_STORE_NAMES.includes(s.name)).map(s => s.id)
);
const stores = allStores.filter(s => !excludedStoreIds.has(s.id));
const items = allItems.filter(i => !excludedStoreIds.has(i.storeId));

const html = build(items, stores);
await (await import('node:fs/promises')).writeFile(OUT, html, 'utf8');

const openCount = items.filter(i => !i.done).length;
const urgentCount = items.filter(i => !i.done && i.urgent === true).length;
const today = new Date().toLocaleDateString('he-IL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
console.log(`דוח משימות · ${today} · ${openCount} פתוחות${urgentCount ? `, ${urgentCount} דחופות` : ''}`);
