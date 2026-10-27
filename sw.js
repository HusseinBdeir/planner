/* Planner — Standalone Executive & Personal PWA for Planning, Tasks, Delegation, 100% Score & Shia Prayer Times (Service Worker v23) */
const CACHE_NAME = 'bhf-planner-v23';
const NAV_CACHE = 'theo-cmd-nav-handoff-v1';
const PENDING_NAV_URL = './__theo_cmd_pending_nav.json';
const UNREAD_NOTIFS_URL = './__theo_cmd_unread_notifs.json';
const APP_SHELL = [
  './',
  './index.html',
  './css/command.css?v=23',
  './js/endpoints.js?v=23',
  './js/app.js?v=23',
  './manifest.json?v=23',
  './icon.svg?v=23',
  './icon-180.png?v=23',
  './icon-192.png?v=23',
  './icon-512.png?v=23'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.all(APP_SHELL.map((u) => cache.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME && k !== NAV_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function normalizeCmdTab(rawTab) {
  const t = String(rawTab || '').trim().toLowerCase();
  if (t === 'radar' || t === 'board' || t === 'planning') return 'planning';
  if (t === 'timers' || t === 'tasks' || t === 'discipline') return 'tasks';
  if (t === 'delegated' || t === 'delegation') return 'delegated';
  if (t === 'score') return 'score';
  if (t === 'prayers' || t === 'prayer') return 'prayers';
  return '';
}

function buildCmdDeepLink(d) {
  const openPrayer = Boolean(
    d.openPrayer ||
      d.tab === 'prayers' ||
      d.tab === 'prayer' ||
      (d.tag && String(d.tag).includes('prayer'))
  );
  const taskId = String(d.taskId || d.reminderId || '').trim();
  const normalizedTab = openPrayer
    ? 'prayers'
    : normalizeCmdTab(d.tab) || (taskId ? 'tasks' : 'planning');

  let url = d.url && d.url !== './' ? String(d.url) : '';
  if (!url || url.includes('?prayer=1') || url.includes('tab=discipline')) {
    if (openPrayer) {
      url = './?tab=prayers';
    } else if (taskId) {
      url = `./?tab=${encodeURIComponent(normalizedTab)}&taskId=${encodeURIComponent(taskId)}`;
    } else {
      url = `./?tab=${encodeURIComponent(normalizedTab)}`;
    }
  }
  return {
    url,
    tab: normalizedTab,
    taskId,
    openPrayer,
    ts: Date.now()
  };
}

function buildNotifOptions(d, isRepeat = false) {
  const nav = buildCmdDeepLink(d);
  return {
    body: d.body || 'Tap to open Planner.',
    icon: './icon-192.png?v=21',
    badge: './icon-192.png?v=21',
    tag: d.tag || 'theo-cmd-notif',
    renotify: !isRepeat,
    silent: Boolean(isRepeat),
    requireInteraction: Boolean(d.requireInteraction) && !isRepeat,
    vibrate: isRepeat ? [] : [180, 80, 180, 80, 260],
    data: nav
  };
}

async function readUnreadNotifsFromCache() {
  try {
    const cache = await caches.open(NAV_CACHE);
    const res = await cache.match(UNREAD_NOTIFS_URL);
    if (!res) return [];
    const parsed = await res.json();
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
    return list.filter((x) => x && typeof x === 'object');
  } catch {
    return [];
  }
}

async function writeUnreadNotifsToCache(items) {
  const clean = Array.isArray(items) ? items.slice(0, 60) : [];
  try {
    const cache = await caches.open(NAV_CACHE);
    await cache.put(
      UNREAD_NOTIFS_URL,
      new Response(JSON.stringify({ updatedAt: Date.now(), items: clean }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      })
    );
  } catch {}
  return clean;
}

async function applySwAppBadge(count) {
  const n = Math.max(0, Math.floor(Number(count || 0)));
  try {
    if (self.navigator) {
      if (n > 0 && typeof self.navigator.setAppBadge === 'function') {
        await self.navigator.setAppBadge(n);
      } else if (n === 0 && typeof self.navigator.clearAppBadge === 'function') {
        await self.navigator.clearAppBadge();
      } else if (n === 0 && typeof self.navigator.setAppBadge === 'function') {
        await self.navigator.setAppBadge(0);
      }
    }
  } catch {}
}

async function upsertSwUnreadNotif(d, nav) {
  const tag = String(d.tag || `theo-cmd-notif-${Date.now()}`);
  const id = String(d.id || tag);
  const item = {
    id,
    tag,
    title: String(d.title || 'Planner'),
    body: String(d.body || 'Tap to open Planner.'),
    tab: nav.tab || 'planning',
    taskId: nav.taskId || '',
    openPrayer: Boolean(nav.openPrayer),
    url: nav.url || './',
    ts: Number(d.ts || Date.now()),
    checked: false
  };
  const existing = await readUnreadNotifsFromCache();
  const filtered = existing.filter((x) => x && x.id !== id && x.tag !== tag);
  const next = [item, ...filtered].slice(0, 60);
  await writeUnreadNotifsToCache(next);
  let unreadCount = next.filter((x) => !x.checked).length;
  if (Number(d.badgeCount || d.badge || 0) > unreadCount) {
    unreadCount = Number(d.badgeCount || d.badge || 0);
  }
  await applySwAppBadge(Math.max(1, unreadCount));
  return { item, items: next, unreadCount: Math.max(1, unreadCount) };
}

function isCommandClientUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.origin !== self.location.origin) return false;
    return u.pathname.includes('/planner') || u.pathname.includes('/command');
  } catch {
    return false;
  }
}

const recentDeliveredByKey = new Map();
const recentCanonicalTagByTitle = new Map();
let pushHandlingChain = Promise.resolve();

function checkAndMarkInMemoryNotif(tag, title = '') {
  const cleanTag = String(tag || '').trim();
  const cleanTitle = String(title || '').trim();
  const now = Date.now();
  for (const [k, ts] of recentDeliveredByKey.entries()) {
    if (now - ts > 15 * 60 * 1000) recentDeliveredByKey.delete(k);
  }
  let hit = false;
  if (cleanTag) {
    const prevTagTs = recentDeliveredByKey.get(`tag:${cleanTag}`) || 0;
    if (prevTagTs && now - prevTagTs < 10 * 60 * 1000) hit = true;
    recentDeliveredByKey.set(`tag:${cleanTag}`, now);
  }
  if (cleanTitle) {
    const prevTitleTs = recentDeliveredByKey.get(`title:${cleanTitle}`) || 0;
    if (prevTitleTs && now - prevTitleTs < 90 * 1000) hit = true;
    recentDeliveredByKey.set(`title:${cleanTitle}`, now);
    if (!hit && cleanTag) {
      recentCanonicalTagByTitle.set(cleanTitle, cleanTag);
    }
  }
  return hit;
}

async function isTagRecentlyDelivered(tag, title = '') {
  const cleanTag = String(tag || '').trim();
  const cleanTitle = String(title || '').trim();
  const now = Date.now();
  try {
    if (self.registration && typeof self.registration.getNotifications === 'function') {
      const active = await self.registration.getNotifications(cleanTag ? { tag: cleanTag } : undefined);
      if (Array.isArray(active) && active.some((n) => (cleanTag && n.tag === cleanTag) || (cleanTitle && n.title === cleanTitle))) {
        return true;
      }
    }
  } catch {}
  try {
    const existing = await readUnreadNotifsFromCache();
    return existing.some(
      (x) =>
        x &&
        now - Number(x.ts || 0) < 10 * 60 * 1000 &&
        ((cleanTag && (x.tag === cleanTag || x.id === cleanTag)) ||
          (cleanTitle && x.title === cleanTitle && now - Number(x.ts || 0) < 90 * 1000))
    );
  } catch {
    return false;
  }
}

self.addEventListener('push', (event) => {
  let d = {};
  if (event.data) {
    try {
      d = event.data.json();
    } catch {
      try {
        d = { title: 'Planner', body: event.data.text() };
      } catch {}
    }
  }
  const title = d.title || 'Planner';
  const syncRepeat = checkAndMarkInMemoryNotif(d.tag, title);
  const runTask = async () => {
    const cacheRepeat = syncRepeat || (await isTagRecentlyDelivered(d.tag, title));
    const canonicalTag =
      (cacheRepeat && recentCanonicalTagByTitle.get(String(title).trim())) ||
      d.tag ||
      'theo-cmd-notif';
    const opts = buildNotifOptions({ ...d, tag: canonicalTag }, cacheRepeat);
    const { item, unreadCount } = await upsertSwUnreadNotif({ ...d, tag: canonicalTag }, opts.data);
    if (!cacheRepeat) {
      const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      list.filter((c) => isCommandClientUrl(c.url)).forEach((c) => {
        try {
          c.postMessage({
            type: 'theo-command-push',
            payload: d,
            item,
            unreadCount
          });
        } catch {}
      });
    }
    // Always call showNotification on push (never return early on iOS webpushd), coalescing silently onto canonicalTag if repeat
    await self.registration.showNotification(title, opts);
  };
  pushHandlingChain = pushHandlingChain.then(runTask, runTask);
  event.waitUntil(pushHandlingChain);
});

self.addEventListener('message', (event) => {
  const m = event.data;
  if (!m) return;
  if (m.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (m.type === 'sync-unread-notifs') {
    event.waitUntil(
      (async () => {
        const items = Array.isArray(m.items) ? m.items : await readUnreadNotifsFromCache();
        await writeUnreadNotifsToCache(items);
        const unreadCount =
          typeof m.unreadCount === 'number'
            ? Math.max(0, Math.floor(m.unreadCount))
            : items.filter((x) => x && !x.checked).length;
        await applySwAppBadge(unreadCount);
        if (m.closeOsNotifications && self.registration && typeof self.registration.getNotifications === 'function') {
          try {
            const activeNotifs = await self.registration.getNotifications();
            const checkedTags = Array.isArray(m.checkedTags) ? new Set(m.checkedTags) : null;
            for (const n of activeNotifs) {
              if (!checkedTags || unreadCount === 0 || checkedTags.has(n.tag)) {
                n.close();
              }
            }
          } catch {}
        }
      })()
    );
    return;
  }
  if (m.type === 'show-notification') {
    const d = m.payload || {};
    const title = d.title || 'Planner';
    const syncRepeat = checkAndMarkInMemoryNotif(d.tag, title);
    event.waitUntil(
      (async () => {
        const isRepeat = syncRepeat || (await isTagRecentlyDelivered(d.tag, title));
        const opts = buildNotifOptions(d, isRepeat);
        if (!m.skipUnread) {
          await upsertSwUnreadNotif(d, opts.data);
        }
        if (isRepeat) return;
        await self.registration.showNotification(title, opts);
      })()
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  const clickedTag = String(event.notification?.tag || '');
  event.notification.close();
  const data = buildCmdDeepLink(event.notification.data || {});
  data.checkedTag = clickedTag;
  event.waitUntil(
    (async () => {
      let unreadCount = 0;
      try {
        const items = await readUnreadNotifsFromCache();
        for (const it of items) {
          if (!it) continue;
          if (
            (clickedTag && (it.tag === clickedTag || it.id === clickedTag)) ||
            (data.taskId && it.taskId === data.taskId) ||
            (data.openPrayer && it.openPrayer)
          ) {
            it.checked = true;
          }
        }
        await writeUnreadNotifsToCache(items);
        unreadCount = items.filter((x) => x && !x.checked).length;
        await applySwAppBadge(unreadCount);
      } catch {}
      try {
        const cache = await caches.open(NAV_CACHE);
        await cache.put(
          PENDING_NAV_URL,
          new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
        );
      } catch {}
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const cmdClients = clientList.filter((c) => isCommandClientUrl(c.url));
      for (const client of cmdClients) {
        try {
          client.postMessage({ type: 'theo-command-nav', data, checkedTag: clickedTag, unreadCount });
        } catch {}
        if ('focus' in client) {
          try {
            const focused = await client.focus();
            try {
              (focused || client).postMessage({
                type: 'theo-command-nav',
                data,
                checkedTag: clickedTag,
                unreadCount
              });
            } catch {}
            setTimeout(() => {
              try {
                (focused || client).postMessage({
                  type: 'theo-command-nav',
                  data,
                  checkedTag: clickedTag,
                  unreadCount
                });
              } catch {}
            }, 250);
            return focused;
          } catch {}
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(data.url || './');
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  const isCodeOrHtml =
    req.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  if (isCodeOrHtml) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
