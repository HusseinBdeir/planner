'use strict';
// Headless CDP verification of Planner device pairing (v31) and the keyless staff portal.
// Every request to the Edge relay is intercepted and answered by a mock: nothing reaches the live store.
// Run: node scripts/verify_pairing.cjs
const assert = require('assert');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const RELAY = 'https://theo-edge-relay.husseinbdeir.workers.dev';
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const EDGE_KEY = 'ab'.repeat(32);
const EXPECTED_STORE_KEY = crypto.createHash('sha256').update(`theo-edge-v1:${EDGE_KEY}`, 'utf8').digest('hex');
const GOOD_CODE = '482913';

function findBrowser() {
  for (const p of [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ]) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('msedge.exe / chrome.exe not found');
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

function startStatic(root) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(root, rel);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const h of this.handlers) h(msg);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  on(fn) {
    this.handlers.push(fn);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browserExe = findBrowser();
  const cdpPort = await freePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-pair-verify-'));
  const { srv, port } = await startStatic(REPO_ROOT);
  const base = `http://127.0.0.1:${port}`;
  const proc = spawn(
    browserExe,
    ['--headless=new', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDataDir}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio', 'about:blank'],
    { stdio: 'ignore', windowsHide: true }
  );
  let cdp;
  try {
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      await sleep(250);
      try {
        version = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
      } catch {}
    }
    assert.ok(version, 'browser CDP endpoint did not come up');
    cdp = new Cdp(version.webSocketDebuggerUrl);
    await cdp.ready;

    // One scenario = one isolated browser context (fresh storage).
    async function scenario(name, { width, height, mobile, preScript, url }, body) {
      const { browserContextId } = await cdp.send('Target.createBrowserContext');
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
      const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      const S = (m, p) => cdp.send(m, p, sessionId);
      const relayRequests = [];
      const consoleErrors = [];
      const exceptions = [];
      let mockMode = { claim: 'good', taskStatus: 'sent' };
      cdp.on(async (msg) => {
        if (msg.sessionId !== sessionId) return;
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
          consoleErrors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
        } else if (msg.method === 'Runtime.exceptionThrown') {
          exceptions.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
        } else if (msg.method === 'Fetch.requestPaused') {
          const req = msg.params.request;
          const u = new URL(req.url);
          let bodyObj = null;
          try {
            bodyObj = JSON.parse(req.postData || 'null');
          } catch {}
          if (u.hostname !== new URL(RELAY).hostname) {
            // any other external host (fonts, push services) is cut off cleanly
            await S('Fetch.failRequest', { requestId: msg.params.requestId, errorReason: 'BlockedByClient' }).catch(() => {});
            return;
          }
          relayRequests.push({ path: u.pathname, method: req.method, body: bodyObj, host: u.hostname });
          let status = 200;
          let payload = { ok: true };
          if (req.method === 'GET') {
            status = 404;
            payload = {};
          } else if (req.method === 'OPTIONS') {
            status = 204;
            payload = null;
          } else if (u.pathname === '/pair/claim') {
            if (bodyObj?.code === GOOD_CODE && mockMode.claim === 'good') {
              const bundle = Buffer.from(JSON.stringify({ v: 1, e: EDGE_KEY, r: 'wss://theo-edge-relay.husseinbdeir.workers.dev/ws', u: '', k: '', p: 4318 })).toString('base64url');
              payload = { ok: true, bundle };
            } else {
              status = 401;
              payload = { ok: false, error: 'Invalid or expired 6-digit code.' };
            }
          } else if (u.pathname === '/store') {
            const op = bodyObj?.op;
            const task = {
              id: 'rem_1',
              token: 'tok-aabbccddeeff0011',
              title: 'Inspect the filter press cloths',
              assigneeName: 'Ali',
              delegationStatus: mockMode.taskStatus,
              staffNote: '',
              staffUpdatedAt: '',
              checklist: [],
              ownerPushTargets: [{ id: 'cmd', endpoint: 'https://web.push.apple.com/owner-device', keys: mockMode.ownerKeys, vapid: 'vapid t=x', expSec: 0 }],
              pushOnDone: null
            };
            if (op === 'delegate_get' || op === 'delegate_update') {
              if (bodyObj.taskId === 'rem_1' && bodyObj.token === 'tok-aabbccddeeff0011') {
                if (op === 'delegate_update') {
                  mockMode.taskStatus = bodyObj.status;
                  task.delegationStatus = bodyObj.status;
                  task.staffUpdatedAt = new Date().toISOString();
                }
                payload = { ok: true, task };
              } else {
                status = 403;
                payload = { ok: false, error: 'Invalid or expired task link' };
              }
            } else if (bodyObj?.key === EXPECTED_STORE_KEY) {
              payload = op === 'patch' ? { ok: true, serverTime: new Date().toISOString() } : { ok: true, serverTime: new Date().toISOString(), docs: {} };
            } else if (op === 'push' && bodyObj?.taskId === 'rem_1' && bodyObj?.token === 'tok-aabbccddeeff0011') {
              payload = { ok: true, pushStatus: 201 };
            } else {
              status = 401;
              payload = { ok: false, error: 'bad key' };
            }
          }
          const origin = req.headers.Origin || req.headers.origin || base;
          await S('Fetch.fulfillRequest', {
            requestId: msg.params.requestId,
            responseCode: status,
            responseHeaders: [
              { name: 'Content-Type', value: 'application/json' },
              { name: 'Access-Control-Allow-Origin', value: origin },
              { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
              { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' }
            ],
            body: Buffer.from(payload === null ? '' : JSON.stringify(payload)).toString('base64')
          }).catch(() => {});
        }
      });
      await S('Runtime.enable');
      await S('Page.enable');
      await S('Fetch.enable', { patterns: [{ urlPattern: 'https://*' }] });
      await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: Boolean(mobile) });
      await S('Page.addScriptToEvaluateOnNewDocument', {
        source: `window.__PLANNER_ALLOW_PAIR_MOCK_FETCH = true; ${preScript || ''}`
      });
      const ev = async (expr) => {
        const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(`evaluate failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
        return r.result.value;
      };
      const waitFor = async (expr, label, timeoutMs = 12000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < timeoutMs) {
          try {
            if (await ev(expr)) return;
          } catch {}
          await sleep(120);
        }
        throw new Error(`${name}: timed out waiting for ${label}`);
      };
      await S('Page.navigate', { url: `${base}/${url || ''}` });
      await waitFor('document.readyState === "complete"', 'page load');
      await sleep(900);
      try {
        await body({ S, ev, waitFor, relayRequests, consoleErrors, exceptions, setMock: (m) => Object.assign(mockMode, m), screenshot: async (file) => {
          const shot = await S('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        } });
        const realErrors = consoleErrors.filter((e) => !/Failed to load resource|net::ERR_|favicon/i.test(e));
        assert.deepStrictEqual(realErrors, [], `${name}: console errors`);
        assert.deepStrictEqual(exceptions, [], `${name}: uncaught exceptions`);
        console.log(`[PASS] ${name}`);
      } finally {
        await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
      }
    }

    const GEOM = `(() => {
      const b = document.getElementById('planner-pair-banner');
      const r = b.getBoundingClientRect();
      const inp = document.getElementById('planner-pair-code');
      const btn = document.getElementById('btn-pair-device');
      const ir = inp.getBoundingClientRect(), br = btn.getBoundingClientRect();
      return {
        hidden: b.hidden, left: r.left, right: r.right, height: r.height, vw: window.innerWidth,
        scrollW: document.documentElement.scrollWidth,
        inputFont: parseFloat(getComputedStyle(inp).fontSize), inputRight: ir.right, inputW: ir.width, btnRight: br.right, btnH: br.height,
        titleAttrs: b.querySelectorAll('[title]').length,
        storedKey: localStorage.getItem('theo_cmd_store_key_v1')
      };
    })()`;
    const shotDir = process.env.PLANNER_SHOT_DIR || '';

    // 1. Unpaired phone: banner visible, laid out inside 390 px, wrong code refused, right code pairs and survives the reload.
    await scenario('Unpaired phone 390x844: banner layout, wrong code refused, 6-digit pairing stores the derived key', { width: 390, height: 844, mobile: true }, async (t) => {
      let g = await t.ev(GEOM);
      assert.strictEqual(g.hidden, false, 'pair banner must show on an unpaired device');
      assert.strictEqual(g.storedKey, null);
      assert.ok(g.scrollW <= 390, `no horizontal overflow (scrollWidth ${g.scrollW})`);
      assert.ok(g.left >= 0 && g.right <= 390.5, `banner inside the viewport (${g.left}..${g.right})`);
      assert.ok(g.btnRight <= g.right + 0.5 && g.inputRight < g.btnRight, 'code field and Pair button stay inside the banner');
      assert.ok(g.inputFont >= 16, `16px input stops iOS focus zoom (got ${g.inputFont})`);
      assert.ok(g.inputW >= 96, `code field wide enough for 6 digits (got ${g.inputW})`);
      assert.strictEqual(g.titleAttrs, 0, 'no native title tooltips');
      if (shotDir) await t.screenshot(path.join(shotDir, 'planner-unpaired-390.png'));
      assert.strictEqual(t.relayRequests.filter((r) => r.host === new URL(RELAY).hostname).length, 0, 'an unpaired device sends nothing to the relay');

      // short code: no request at all
      await t.ev(`(() => { const i = document.getElementById('planner-pair-code'); i.value = '123'; document.getElementById('planner-pair-form').requestSubmit(); })()`);
      await sleep(400);
      assert.strictEqual(t.relayRequests.filter((r) => r.path === '/pair/claim').length, 0, 'a short code is rejected locally');

      // wrong code
      await t.ev(`(() => { const i = document.getElementById('planner-pair-code'); i.value = '000000'; document.getElementById('planner-pair-form').requestSubmit(); })()`);
      await t.waitFor(`!document.getElementById('btn-pair-device').disabled`, 'claim to settle');
      await sleep(300);
      g = await t.ev(GEOM);
      assert.strictEqual(g.storedKey, null, 'a refused code stores nothing');
      assert.strictEqual(g.hidden, false);
      assert.strictEqual(t.relayRequests.filter((r) => r.path === '/store').length, 0, 'the store is not contacted after a refused code');

      // right code (typed with a dash, as THEO displays it)
      await t.ev(`(() => { const i = document.getElementById('planner-pair-code'); i.value = '482-913'; document.getElementById('planner-pair-form').requestSubmit(); })()`);
      await t.waitFor(`localStorage.getItem('theo_cmd_store_key_v1') === '${EXPECTED_STORE_KEY}'`, 'derived store key to be saved');
      const claim = t.relayRequests.filter((r) => r.path === '/pair/claim').pop();
      assert.deepStrictEqual(claim.body, { code: GOOD_CODE }, 'claim sends the 6 digits only');
      const probe = t.relayRequests.find((r) => r.path === '/store');
      assert.strictEqual(probe.body.key, EXPECTED_STORE_KEY, 'store key = SHA-256("theo-edge-v1:" + edge key)');
      assert.ok(!JSON.stringify(t.relayRequests).includes(EDGE_KEY), 'the raw edge key is never sent anywhere');
      await sleep(1600); // reload after pairing
      await t.waitFor('document.readyState === "complete" && !!document.getElementById("planner-pair-banner")', 'reload');
      g = await t.ev(GEOM);
      assert.strictEqual(g.hidden, true, 'banner is gone once paired');
      assert.strictEqual(g.storedKey, EXPECTED_STORE_KEY, 'pairing survives a reload');
      assert.ok(!(await t.ev(`JSON.stringify(Object.assign({}, localStorage))`)).includes(EDGE_KEY), 'the raw edge key is not kept in Planner storage');
    });

    // 2. Desktop: layout, and a browser that already runs a paired THEO Remote pairs with no code.
    await scenario('Unpaired desktop 1280x800: banner layout', { width: 1280, height: 800 }, async (t) => {
      const g = await t.ev(GEOM);
      assert.strictEqual(g.hidden, false);
      assert.ok(g.scrollW <= 1280 && g.right <= 1280.5, 'no overflow on desktop');
      if (shotDir) await t.screenshot(path.join(shotDir, 'planner-unpaired-1280.png'));
    });
    await scenario(
      'Same browser as a paired THEO Remote: paired automatically, no banner',
      { width: 1280, height: 800, preScript: `try { localStorage.setItem('theo_remote_prefs_v1', JSON.stringify({ edgeAccessKey: '${EDGE_KEY}' })); } catch (e) {}` },
      async (t) => {
        const g = await t.ev(GEOM);
        assert.strictEqual(g.hidden, true);
        assert.strictEqual(g.storedKey, EXPECTED_STORE_KEY);
      }
    );
    await scenario(
      'Malformed stored key is ignored (banner shows)',
      { width: 390, height: 844, mobile: true, preScript: `try { localStorage.setItem('theo_cmd_store_key_v1', 'not-a-key<script>'); } catch (e) {}` },
      async (t) => {
        const g = await t.ev(GEOM);
        assert.strictEqual(g.hidden, false);
      }
    );

    // 3. Staff portal: works with no key on the device and never sends one.
    const ownerKeys = await (async () => {
      const kp = crypto.createECDH('prime256v1');
      kp.generateKeys();
      return { p256dh: kp.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') };
    })();
    await scenario('Staff task link: loads, updates status and notifies the owner without any store key', { width: 390, height: 844, mobile: true, url: '?task=rem_1&token=tok-aabbccddeeff0011' }, async (t) => {
      t.setMock({ ownerKeys });
      await t.ev('location.reload()').catch(() => {});
      await sleep(600);
      await t.waitFor(`!!document.querySelector('[data-staff-status="working"]')`, 'staff task to render');
      assert.ok((await t.ev('document.getElementById("staff-portal-root").innerText')).includes('Inspect the filter press cloths'));
      assert.strictEqual(await t.ev('document.getElementById("owner-app-shell").hidden'), true, 'owner shell stays hidden in staff mode');
      await t.ev(`document.querySelector('[data-staff-status="working"]').click()`);
      await t.waitFor(`true`, 'tick');
      const t0 = Date.now();
      while (Date.now() - t0 < 10000 && !t.relayRequests.some((r) => r.body?.op === 'push')) await sleep(150);
      const update = t.relayRequests.find((r) => r.body?.op === 'delegate_update');
      assert.ok(update, 'status update was sent');
      assert.deepStrictEqual(Object.keys(update.body).sort(), ['op', 'staffNote', 'status', 'taskId', 'token']);
      const push = t.relayRequests.find((r) => r.body?.op === 'push');
      assert.ok(push, 'owner push was sent through the store');
      assert.strictEqual(push.body.taskId, 'rem_1');
      assert.strictEqual(push.body.token, 'tok-aabbccddeeff0011');
      assert.strictEqual(push.body.endpoint, 'https://web.push.apple.com/owner-device');
      for (const r of t.relayRequests) {
        assert.ok(!r.body || !('key' in r.body), `staff mode must never send a store key (${r.body?.op})`);
      }
      assert.strictEqual(await t.ev(`localStorage.getItem('theo_cmd_store_key_v1')`), null);
      if (shotDir) await t.screenshot(path.join(shotDir, 'planner-staff-390.png'));
    });

    // 4. Static: nothing secret in the public bootstrap file; version lockstep.
    const endpoints = fs.readFileSync(path.join(REPO_ROOT, 'js', 'endpoints.js'), 'utf8');
    assert.ok(!/[A-Za-z0-9+/=_-]{40,}/.test(endpoints.replace(/https:\/\/[^\s"]+/g, '')), 'js/endpoints.js must not contain a key or encoded endpoint');
    assert.ok(/u:\s*""/.test(endpoints) && /k:\s*""/.test(endpoints));
    const appJs = fs.readFileSync(path.join(REPO_ROOT, 'js', 'app.js'), 'utf8');
    assert.ok(!/logic\.azure\.com|powerplatform\.com|dynamics\.com/i.test(appJs + endpoints), 'no Microsoft endpoint left in the shipped JavaScript');
    const sw = fs.readFileSync(path.join(REPO_ROOT, 'sw.js'), 'utf8');
    const ver = sw.match(/CACHE_NAME\s*=\s*'bhf-planner-v(\d+)'/)[1];
    for (const [label, src] of [['index.html', fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8')], ['sw.js', sw], ['manifest.json', fs.readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf8')], ['js/app.js', appJs]]) {
      const found = [...src.matchAll(/\?v=(\d+)/g)].map((m) => m[1]);
      assert.ok(found.length > 0 && found.every((v) => v === ver), `${label}: every ?v= must be ${ver} (found ${[...new Set(found)].join(',')})`);
    }
    console.log(`[PASS] Static: no secret in js/endpoints.js, no Microsoft endpoint, ?v=${ver} lockstep`);
    console.log('ALL_PLANNER_PAIRING_CHECKS_PASSED');
  } finally {
    try {
      cdp?.ws.close();
    } catch {}
    proc.kill();
    srv.close();
    await sleep(400);
    fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
