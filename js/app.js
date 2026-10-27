/* ============================================================================
   PLANNER — ZERO-SCROLL EXECUTIVE RADAR, TASKS, DELEGATION, 100% SCORE & PRAYERS PWA
   ============================================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'theo_command_state_v1';
  const LEGACY_LEDGER_KEY = 'theo_personal_ledger_v1';
  const PUSH_REG_KEY = 'theo_command_push_v1';
  const CLOUD_PUSH_DEVS_KEY = 'theo_cmd_cloud_push_devs_v1';
  const PRAYER_SCHED_KEY = 'theo_cmd_scheduled_prayers_v1';
  const PRAYER_ALERTED_KEY = 'theo_cmd_alerted_prayers_v1';
  const TASK_SCHED_KEY = 'theo_cmd_scheduled_tasks_v1';
  const TASK_ALERTED_KEY = 'theo_cmd_alerted_tasks_v1';
  const NOTIF_PREFS_KEY = 'theo_cmd_notif_prefs_v1';
  const NOTIF_INBOX_KEY = 'theo_cmd_notif_inbox_v1';
  const NOTIF_CHECKED_KEY = 'theo_cmd_notif_checked_v1';
  const PUSH_BANNER_DISMISSED_KEY = 'theo_cmd_push_banner_dismissed_v1';

  function isHeadlessQuarantine() {
    return Boolean(
      (typeof navigator !== 'undefined' && navigator.webdriver) ||
        (typeof window !== 'undefined' && window.__PLANNER_HEADLESS_TEST)
    );
  }

  const DEFAULT_NOTIF_PREFS = {
    enabled: true,
    prayers: true,
    tasks: true,
    timers: true,
    delegations: true,
    score: true,
    morningHour: 8,
    eveningHour: 21,
    chime: true
  };

  const SHIA_METHODS = [
    {
      id: 'jafari_leva',
      label: "Ja'fari Standard (Qum / Najaf — Fajr 16°, Maghrib 4°)",
      short: "Ja'fari (16° / 4°)",
      fajrAngle: 16,
      maghribAngle: 4,
      dhuhrMin: 1
    },
    {
      id: 'jafari_lebanon',
      label: "Ja'fari Lebanon (High Shia Council — Fajr 18°, Maghrib 4°)",
      short: 'Lebanon Shia (18° / 4°)',
      fajrAngle: 18,
      maghribAngle: 4,
      dhuhrMin: 1
    },
    {
      id: 'jafari_tehran',
      label: 'Tehran Geophysics (Fajr 17.7°, Maghrib 4.5°)',
      short: 'Tehran (17.7° / 4.5°)',
      fajrAngle: 17.7,
      maghribAngle: 4.5,
      dhuhrMin: 1
    }
  ];

  const PRAYER_LOCATION_PRESETS = [
    { id: 'beirut', label: 'Beirut, Lebanon', short: '🇱🇧 Beirut', lat: 33.8938, lng: 35.5018, timeZone: 'Asia/Beirut' },
    { id: 'tyre', label: 'South Lebanon (Tyre)', short: '🇱🇧 South (Tyre)', lat: 33.2705, lng: 35.2038, timeZone: 'Asia/Beirut' },
    { id: 'nabatieh', label: 'Nabatieh, Lebanon', short: '🇱🇧 Nabatieh', lat: 33.3779, lng: 35.4836, timeZone: 'Asia/Beirut' },
    { id: 'najaf', label: 'Najaf, Iraq', short: '🇮🇶 Najaf', lat: 31.9959, lng: 44.3146, timeZone: 'Asia/Baghdad' },
    { id: 'karbala', label: 'Karbala, Iraq', short: '🇮🇶 Karbala', lat: 32.616, lng: 44.0249, timeZone: 'Asia/Baghdad' },
    { id: 'london', label: 'London, UK', short: '🇬🇧 London', lat: 51.5074, lng: -0.1278, timeZone: 'Europe/London' },
    { id: 'paris', label: 'Paris, France', short: '🇫🇷 Paris', lat: 48.8566, lng: 2.3522, timeZone: 'Europe/Paris' },
    { id: 'dubai', label: 'Dubai, UAE', short: '🇦🇪 Dubai', lat: 25.2048, lng: 55.2708, timeZone: 'Asia/Dubai' },
    { id: 'riyadh', label: 'Riyadh, Saudi Arabia', short: '🇸🇦 Riyadh', lat: 24.7136, lng: 46.6753, timeZone: 'Asia/Riyadh' },
    { id: 'antigua', label: "St. John's, Antigua", short: '🇦🇬 Antigua', lat: 17.1274, lng: -61.8468, timeZone: 'America/Antigua' }
  ];

  const DEFAULT_PRAYER_CONFIG = {
    enabled: true,
    method: 'jafari_leva',
    locationName: 'Beirut, Lebanon',
    lat: 33.8938,
    lng: 35.5018,
    timeZone: 'Asia/Beirut',
    autoGps: true,
    notifyFajr: true,
    notifyDhuhr: true,
    notifyMaghrib: true,
    preRemindMin: 0,
    fajrOffsetMin: 0,
    dhuhrOffsetMin: 0,
    maghribOffsetMin: 0,
    chime: true,
    updatedAt: 0
  };

  const VAPID_PUBLIC_B64 =
    'BKAC6gWORFSoi6Yf7XuS3voZnBgflXmG1GzW0K1pt4hcNoY7FNYPK-Jn-gAghKvphbSM_-ieA6U8w0E9yEgKB68';
  const VAPID_PRIVATE_JWK = {
    kty: 'EC',
    crv: 'P-256',
    x: 'oALqBY5EVKiLph_te5Le-hmcGB-VeYbUbNbQrWm3iFw',
    y: 'NoY7FNYPK-Jn-gAghKvphbSM_-ieA6U8w0E9yEgKB68',
    d: 'MS5ta1KAESpycusDW8d1NMaj3fxc_oNO_F0V23oh5aA',
    ext: true
  };

  const DAILY_DOS = [
    { id: 'wake', label: 'Waking up early', short: 'Wake', icon: '☀️', sub: 'Up on time & morning routine' },
    { id: 'work', label: 'Work', short: 'Work', icon: '💼', sub: 'Focused executive & ops output' },
    { id: 'skills', label: 'Skills', short: 'Skills', icon: '🧠', sub: 'Deliberate learning & craft' },
    { id: 'fitness', label: 'Fitness', short: 'Fit', icon: '💪', sub: 'Gym, calisthenics, football or padel' },
    { id: 'socializing', label: 'Socializing', short: 'Social', icon: '🤝', sub: 'Meaningful connection & presence' }
  ];

  const DAILY_DONTS = [
    { id: 'videogames', label: 'Video games', short: 'Games', icon: '🎮', sub: '10% held intact when avoided' },
    { id: 'series', label: 'Series', short: 'Series', icon: '📺', sub: '10% held intact when avoided' },
    { id: 'music', label: 'Music', short: 'Music', icon: '🎧', sub: '10% held intact when avoided' },
    { id: 'socialmedia', label: 'Social media', short: 'Social', icon: '📱', sub: '10% held intact when avoided' },
    { id: 'adult18', label: '18+ things', short: '18+', icon: '🔞', sub: '10% held intact when avoided' }
  ];

  const CLUSTER_SVGS = {
    people: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="5.8" r="2.5"/><path d="M2 14.8c0-2.4 2-4.2 4.5-4.2s4.5 1.8 4.5 4.2"/><circle cx="12.8" cy="6.4" r="2"/><path d="M12.2 10.6c2 .3 3.6 1.7 3.6 3.8"/></svg>`,
    verify: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.2"/><path d="M12 12l3.8 3.8"/><path d="M5.8 8.1l1.5 1.5 3-3.1"/></svg>`,
    shipping: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.2L15.2 5.6v6.8L9 15.8 2.8 12.4V5.6L9 2.2z"/><path d="M2.8 5.6L9 9l6.2-3.4M9 9v6.8"/></svg>`,
    work: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="5" width="13.6" height="10.2" rx="1.8"/><path d="M6.2 5V3.6A1.4 1.4 0 0 1 7.6 2.2h2.8a1.4 1.4 0 0 1 1.4 1.4V5M2.2 9.4h13.6"/></svg>`,
    payments: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="1.8"/><path d="M2 7.6h14M5.5 11.2h2.5"/></svg>`,
    family: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.2L9 2.8l6.5 5.4"/><path d="M4.2 6.8v8.2h9.6V6.8"/><path d="M7.4 15v-4.2h3.2V15"/></svg>`,
    want_to_do: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><polygon points="9 2.2 11.1 6.5 15.8 7.2 12.4 10.5 13.2 15.2 9 13 4.8 15.2 5.6 10.5 2.2 7.2 6.9 6.5 9 2.2"/></svg>`,
    ideas: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 13.2h5M7.2 15.5h3.6"/><path d="M5.6 10.6A5 5 0 1 1 12.4 10.6c-.6.6-1 1.3-1.1 2.1H6.7c-.1-.8-.5-1.5-1.1-2.1z"/></svg>`
  };

  const CLUSTERS = [
    {
      id: 'people',
      label: 'People & Follow-Ups',
      shortLabel: 'People',
      icon: '🗣️',
      svg: CLUSTER_SVGS.people,
      sub: 'Calls, check-ins & delegated follow-ups',
      templates: ['@Ali Follow up on site status tomorrow', 'Call accountant re monthly closing']
    },
    {
      id: 'verify',
      label: 'Verify / App Sync',
      shortLabel: 'Verify / App',
      icon: '🔍',
      svg: CLUSTER_SVGS.verify,
      sub: 'Paid & waiting to show up on app / bank',
      templates: ['Verify Whish / bank transfer cleared in 24h', 'Check Meta Ads balance reflected']
    },
    {
      id: 'shipping',
      label: 'Shipping & Orders',
      shortLabel: 'Shipping',
      icon: '📦',
      svg: CLUSTER_SVGS.shipping,
      sub: 'Packages, spare parts & arrival timers',
      templates: ['Track Shacman spare parts shipment in 5 days', 'Confirm WTC plant part delivery']
    },
    {
      id: 'work',
      label: 'Work & BUs',
      shortLabel: 'Work',
      icon: '💼',
      svg: CLUSTER_SVGS.work,
      sub: 'Resorts, WTC, Korri, Real Estate, Ins, Holding',
      templates: ['Review WTC daily batch & tonnage report', 'Audit Resort SOA journal entries']
    },
    {
      id: 'payments',
      label: 'Payments & Holds',
      shortLabel: 'Payments',
      icon: '💸',
      svg: CLUSTER_SVGS.payments,
      sub: 'Wait-to-pay cooling-off holds & wires',
      templates: ['Hold supplier wire $2,500 for 4d cooling-off', 'Schedule monthly rent / lease settlement']
    },
    {
      id: 'family',
      label: 'Family & Home',
      shortLabel: 'Family',
      icon: '👨‍👩‍👧',
      svg: CLUSTER_SVGS.family,
      sub: 'Family plans, parents & home errands',
      templates: ['Dinner with parents tonight 20:00', 'Check home maintenance & utilities']
    },
    {
      id: 'want_to_do',
      label: 'Want To Do',
      shortLabel: 'Want to Do',
      icon: '🌟',
      svg: CLUSTER_SVGS.want_to_do,
      sub: 'Personal plans, places & weekend list',
      templates: ['Book padel court for weekend', 'Plan weekend coastal drive']
    },
    {
      id: 'ideas',
      label: 'Ideas for Later',
      shortLabel: 'Ideas',
      icon: '💡',
      svg: CLUSTER_SVGS.ideas,
      sub: 'Product concepts & future automations',
      templates: ['Automation concept: WhatsApp daily plant brief', 'New ISABI dashboard module idea']
    }
  ];

  const BHFIRMS_BUS = [
    { id: 'hospitality', label: 'Hospitality (Resorts)', short: 'Resorts', sub: 'Blanca · La Una · Palms · Voile · Platinum' },
    { id: 'manufacturing', label: 'Manufacturing (WTC / BBC / Lions)', short: 'WTC · Mfg', sub: 'Concrete · Quarry · Transport' },
    { id: 'trading', label: 'Trading (Korri / Shacman)', short: 'Korri · Trading', sub: 'Heavy Trucks · Parts · Workshop' },
    { id: 'realestate_ins', label: 'Real Estate & Insurance', short: 'RE · Ins', sub: 'Properties · Brokerage · Policies' },
    { id: 'holding', label: 'Holding & Finance', short: 'Holding', sub: 'Bdeir Holding · SOA · Tax & Audit' },
    { id: 'tech', label: 'Platform & Tech (THEO)', short: 'Tech', sub: 'ISABI Systems · PWAs · Automations' }
  ];

  const PRIORITY_LEVELS = [
    { id: 'p1', label: 'P1 · Critical' },
    { id: 'p2', label: 'P2 · High' },
    { id: 'p3', label: 'P3 · Normal' }
  ];

  const DEFAULT_TEAM_ROSTER = [];

  const PURGED_DEMO_IDS = [
    'tm_rami',
    'tm_nadine',
    'tm_jad',
    'tm_karim',
    'tm_maya',
    'rem_1792434196959_1u79',
    'rem_1792434196958_ar52',
    'rem_1792434196957_72fe',
    'rem_1792434196957_ynbs',
    'rem_1792434196955_f5yu',
    'rem_1792434196955_0h5v',
    'rem_1792434196954_908z',
    'rem_1792434196947_4xuc',
    'rem_1792434196946_xlrd',
    'rem_1792434196946_1scv'
  ];

  const PURGED_DEMO_TITLES = new Set([
    'idea for later: automated whatsapp daily briefing',
    'want to play padel in batroun this weekend',
    'family dinner with mom tonight',
    'hold wtc supplier wire $6,500',
    'review q4 bhfirms insurance renewal schedule',
    'shipping time for shacman brake pads order in 5 days',
    "paid $120 on whish for electricity and it didn't show up on the app",
    'check korri shacman customs clearance documents',
    'reconcile blanca resort october soa journal',
    'inspect wtc filter press cloths and send pressure reading tomorrow'
  ]);

  const cfg = window.THEO_CLOUD_CFG || {};
  const CLOUD_URL = cfg.u ? atob(cfg.u) : '';
  const CLOUD_KEY = cfg.k ? atob(cfg.k) : '';
  const BRIDGE_PORT = cfg.port || 4318;

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function randomToken(len = 16) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtInt(n) {
    const v = Number(n || 0);
    return Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
  }

  const state = {
    theme: localStorage.getItem('theo_cmd_theme_v2') === 'dark' ? 'dark' : 'light',
    activeTab: 'planning', // 'planning' | 'tasks' | 'delegated' | 'score' | 'prayers'
    planningMode: 'radar', // 'radar' | 'horizon' | 'bus' | 'clusters' | 'subtopics'
    selectedPlanDate: '', // '' or 'YYYY-MM-DD'
    scoreDate: todayIso(),
    boardFilter: 'all',
    boardGroupBy: 'cluster',
    taskFilter: 'all',
    timerFilter: 'all',
    delegatedViewMode: 'pipeline', // 'pipeline' | 'people' | 'list'
    delegatedBuFilter: 'all',
    delegatedStatusFilter: 'all',
    showInlineNewPerson: false,
    fastDelPersonId: '',
    expandedRowId: '',
    activeInlineClusterId: '',
    openClusterSheetId: '',
    openTaskWorkbenchId: '',
    openSheetKind: '', // '' | 'cluster' | 'roster' | 'notifications' | 'workbench' | 'new_plan'
    newPlanForm: null,
    sheetOpenedWithUnreadIds: [],
    recentlyCompletedUntil: {},
    completedSectionOpen: false,
    pushBannerDismissed: localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === '1',
    rosterSheetOpts: {
      pickForDraft: false,
      existingTaskId: '',
      showAddForm: false,
      manageMode: false,
      editMemberId: '',
      submitAction: 'assign'
    },
    bridgeOrigin: '',
    syncMode: 'cloud',
    reminders: [],
    deletedIds: [],
    dailyScores: {},
    teamRoster: [...DEFAULT_TEAM_ROSTER],
    prayerConfig: { ...DEFAULT_PRAYER_CONFIG },
    notifPrefs: { ...DEFAULT_NOTIF_PREFS },
    notifications: [],
    checkedNotifKeys: [],
    cloudPushDevices: [],
    delegatedCloudMap: {},
    updatedAt: 0,
    draft: {
      text: '',
      waitChoice: 'auto',
      horizon: 'auto', // 'auto' | 'today' | 'tomorrow' | 'week' | 'backlog'
      priority: '', // '' | 'p1' | 'p2' | 'p3'
      clusterOverride: '',
      customGroup: '',
      assigneeId: '',
      assigneeName: '',
      assigneeBu: '',
      notes: '',
      checklistRaw: '',
      recur: 'none'
    }
  };

  /* ============================================================================
     LOCAL PERSISTENCE & LEGACY MIGRATION
     ============================================================================ */
  function normalizeDayScoreRecord(rec, iso = '') {
    if (!rec || typeof rec !== 'object') {
      return { date: iso, dos: {}, donts: {}, updatedAt: 0 };
    }
    const rawDos = rec.dos && typeof rec.dos === 'object' ? rec.dos : {};
    const rawDonts = rec.donts && typeof rec.donts === 'object' ? rec.donts : {};

    const normDo = (v) => (v === 'full' || v === 'half' ? v : 'none');
    const normDontCmd = (v) => {
      if (v === 'slip' || v === 'broken') return 'slip';
      if (v === 'half') return 'half';
      return 'intact';
    };
    const toTheoDont = (cmdVal) =>
      cmdVal === 'slip' ? 'broken' : cmdVal === 'half' ? 'half' : 'clean';

    const socialVal = normDo(
      rawDos.socializing && rawDos.socializing !== 'none' ? rawDos.socializing : rawDos.social
    );
    const dos = {
      ...rawDos,
      wake: normDo(rawDos.wake),
      work: normDo(rawDos.work),
      skills: normDo(rawDos.skills),
      fitness: normDo(rawDos.fitness),
      social: socialVal,
      socializing: socialVal
    };

    const gamesCmd = normDontCmd(
      rawDonts.videogames && rawDonts.videogames !== 'intact' && rawDonts.videogames !== 'clean'
        ? rawDonts.videogames
        : rawDonts.games || rawDonts.videogames
    );
    const seriesCmd = normDontCmd(rawDonts.series);
    const musicCmd = normDontCmd(rawDonts.music);
    const socialmediaCmd = normDontCmd(rawDonts.socialmedia);
    const adultCmd = normDontCmd(
      rawDonts.adult18 && rawDonts.adult18 !== 'intact' && rawDonts.adult18 !== 'clean'
        ? rawDonts.adult18
        : rawDonts.nsfw || rawDonts.adult18
    );

    const donts = {
      ...rawDonts,
      videogames: gamesCmd,
      games: toTheoDont(gamesCmd),
      series: seriesCmd,
      music: musicCmd,
      socialmedia: socialmediaCmd,
      adult18: adultCmd,
      nsfw: toTheoDont(adultCmd)
    };

    return {
      ...rec,
      date: rec.date || iso,
      dos,
      donts,
      updatedAt: Number(rec.updatedAt || 0)
    };
  }

  function normalizeChecklistArray(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList
      .map((st, idx) => {
        if (!st) return null;
        if (typeof st === 'string') {
          const txt = st.trim();
          return txt ? { id: `st_${idx}_${txt.slice(0, 8).replace(/\W/g, '')}`, text: txt, done: false } : null;
        }
        const txt = String(st.text || st.title || '').trim();
        if (!txt) return null;
        return {
          id: String(st.id || `st_${idx}`),
          text: txt,
          done: Boolean(st.done || st.completed)
        };
      })
      .filter(Boolean);
  }

  function parseChecklistStepsFromText(rawStr) {
    if (!rawStr || typeof rawStr !== 'string') return [];
    return rawStr
      .split(/[\n|;]+/)
      .map((s) => s.replace(/^[-*•☐✓\d.)\s]+/, '').trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `st_${Date.now().toString(36)}_${idx}`,
        text,
        done: false
      }));
  }

  function normalizeReminderItem(rem) {
    if (!rem || typeof rem !== 'object') return rem;
    const completed = Boolean(rem.completed || rem.status === 'done');
    const subTag =
      rem.subTag ||
      rem.subGroup ||
      rem.customGroup ||
      (rem.assigneeName ? `@${rem.assigneeName}` : '');
    const planDate =
      typeof rem.planDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rem.planDate)
        ? rem.planDate
        : '';
    const hasAlarm = Boolean(rem.hasAlarm);
    const isParkedIdea =
      (rem.category === 'ideas' || rem.category === 'want_to_do') &&
      !planDate &&
      !hasAlarm &&
      !rem.matureAt &&
      rem.kind !== 'wait' &&
      rem.horizon !== 'today' &&
      rem.horizon !== 'tomorrow';
    const rawPri = String(rem.priority || '').toLowerCase();
    const priority = rawPri === 'p1' || rawPri === 'p2' || rawPri === 'p3' ? rawPri : 'p3';
    const rawHor = String(rem.horizon || '').toLowerCase();
    const horizon = ['today', 'tomorrow', 'week', 'backlog'].includes(rawHor) ? rawHor : '';
    const checklist = normalizeChecklistArray(rem.checklist);
    return {
      ...rem,
      completed,
      status: completed ? 'done' : 'open',
      priority,
      horizon,
      planDate,
      hasAlarm,
      notes: String(rem.notes || '').trim(),
      checklist,
      subTag,
      subGroup: rem.subGroup || subTag,
      kind: isParkedIdea ? 'parked' : rem.kind || 'task',
      dueAt: isParkedIdea ? 0 : Number(rem.dueAt || 0),
      matureAt: Number(rem.matureAt || 0),
      recur: isParkedIdea ? 'none' : rem.recur || 'none'
    };
  }

  function normalizePrayerConfig(raw) {
    const base = { ...DEFAULT_PRAYER_CONFIG };
    if (!raw || typeof raw !== 'object') return base;
    const lat = Number(raw.lat);
    const lng = Number(raw.lng);
    return {
      enabled: raw.enabled !== false,
      method: SHIA_METHODS.some((m) => m.id === raw.method) ? raw.method : 'jafari_leva',
      locationName: String(raw.locationName || base.locationName).trim() || base.locationName,
      lat: Number.isFinite(lat) && lat >= -66 && lat <= 66 ? lat : base.lat,
      lng: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : base.lng,
      timeZone: String(raw.timeZone || base.timeZone).trim() || base.timeZone,
      autoGps: raw.autoGps !== false,
      notifyFajr: raw.notifyFajr !== false,
      notifyDhuhr: raw.notifyDhuhr !== false,
      notifyMaghrib: raw.notifyMaghrib !== false,
      preRemindMin: [0, 5, 10, 15, 20].includes(Number(raw.preRemindMin))
        ? Number(raw.preRemindMin)
        : 0,
      fajrOffsetMin: Math.max(-20, Math.min(20, Math.round(Number(raw.fajrOffsetMin || 0)))),
      dhuhrOffsetMin: Math.max(-20, Math.min(20, Math.round(Number(raw.dhuhrOffsetMin || 0)))),
      maghribOffsetMin: Math.max(-20, Math.min(20, Math.round(Number(raw.maghribOffsetMin || 0)))),
      chime: raw.chime !== false,
      updatedAt: Number(raw.updatedAt || 0)
    };
  }

  function normalizeNotifPrefs(raw) {
    const base = { ...DEFAULT_NOTIF_PREFS };
    if (!raw || typeof raw !== 'object') return base;
    return {
      enabled: raw.enabled !== false,
      prayers: raw.prayers !== false,
      tasks: raw.tasks !== false,
      timers: raw.timers !== false,
      delegations: raw.delegations !== false,
      score: raw.score !== false,
      morningHour: Number.isFinite(Number(raw.morningHour))
        ? Math.max(5, Math.min(12, Math.round(Number(raw.morningHour))))
        : 8,
      eveningHour: Number.isFinite(Number(raw.eveningHour))
        ? Math.max(17, Math.min(23, Math.round(Number(raw.eveningHour))))
        : 21,
      chime: raw.chime !== false
    };
  }

  function loadLocalState() {
    try {
      const savedPrefs = JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || 'null');
      if (savedPrefs && typeof savedPrefs === 'object') {
        state.notifPrefs = normalizeNotifPrefs(savedPrefs);
      }
    } catch {}
    try {
      const savedDevs = JSON.parse(localStorage.getItem(CLOUD_PUSH_DEVS_KEY) || 'null');
      if (Array.isArray(savedDevs)) {
        state.cloudPushDevices = savedDevs;
      }
    } catch {}
    try {
      const savedChecked = JSON.parse(localStorage.getItem(NOTIF_CHECKED_KEY) || 'null');
      if (Array.isArray(savedChecked)) {
        state.checkedNotifKeys = savedChecked.filter(Boolean).slice(-250);
      }
    } catch {}
    try {
      const savedInbox = JSON.parse(localStorage.getItem(NOTIF_INBOX_KEY) || 'null');
      if (Array.isArray(savedInbox)) {
        const checkedSet = new Set(state.checkedNotifKeys);
        state.notifications = savedInbox
          .filter((x) => x && typeof x === 'object' && (x.id || x.tag))
          .map((x) => ({
            ...x,
            checked: Boolean(x.checked || checkedSet.has(x.id) || (x.tag && checkedSet.has(x.tag)))
          }))
          .slice(0, 60);
      }
    } catch {}
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        mergeIncomingLedger(raw, false);
      }
      // Also merge any items saved in theo_personal_ledger_v1 on same origin
      const legacy = JSON.parse(localStorage.getItem(LEGACY_LEDGER_KEY) || 'null');
      if (legacy && typeof legacy === 'object') {
        mergeIncomingLedger(legacy, false);
      }
    } catch {}
  }

  function saveLocalState() {
    state.updatedAt = Date.now();
    for (const [iso, rec] of Object.entries(state.dailyScores)) {
      state.dailyScores[iso] = normalizeDayScoreRecord(rec, iso);
    }
    state.prayerConfig = normalizePrayerConfig(state.prayerConfig);
    state.notifPrefs = normalizeNotifPrefs(state.notifPrefs);
    try {
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(state.notifPrefs));
    } catch {}
    const payload = JSON.stringify({
      reminders: state.reminders,
      deletedIds: state.deletedIds.slice(-400),
      dailyScores: state.dailyScores,
      teamRoster: state.teamRoster,
      prayerConfig: state.prayerConfig,
      notifPrefs: state.notifPrefs,
      updatedAt: state.updatedAt
    });
    try {
      localStorage.setItem(STORAGE_KEY, payload);
      localStorage.setItem(LEGACY_LEDGER_KEY, payload);
    } catch {}
  }

  function mergeIncomingLedger(incoming, renderAfter = true) {
    if (!incoming || typeof incoming !== 'object') return false;
    let changed = false;

    const delSet = new Set([...(state.deletedIds || []), ...PURGED_DEMO_IDS]);
    if (Array.isArray(incoming.deletedIds)) {
      for (const dId of incoming.deletedIds) {
        if (dId && !delSet.has(dId)) {
          delSet.add(dId);
          changed = true;
        }
      }
    }

    const isDemoRem = (r) => {
      if (!r || !r.id) return false;
      if (delSet.has(r.id)) return true;
      const t = String(r.title || '').trim().toLowerCase();
      return PURGED_DEMO_TITLES.has(t);
    };

    for (const r of state.reminders) {
      if (r && r.id && (r.deleted || isDemoRem(r)) && !delSet.has(r.id)) {
        delSet.add(r.id);
        changed = true;
      }
    }
    if (Array.isArray(incoming.reminders)) {
      for (const r of incoming.reminders) {
        if (r && r.id && (r.deleted || isDemoRem(r)) && !delSet.has(r.id)) {
          delSet.add(r.id);
          changed = true;
        }
      }
    }

    const beforeCount = state.reminders.length;
    state.reminders = state.reminders
      .filter((r) => r && r.id && !r.deleted && !delSet.has(r.id) && !isDemoRem(r))
      .map((r) => normalizeReminderItem(r));
    if (state.reminders.length !== beforeCount) changed = true;

    if (Array.isArray(incoming.reminders)) {
      const map = new Map();
      for (const r of state.reminders) {
        if (r && r.id && !delSet.has(r.id) && !isDemoRem(r)) map.set(r.id, r);
      }
      for (const rawRem of incoming.reminders) {
        if (!rawRem || !rawRem.id || rawRem.deleted || delSet.has(rawRem.id) || isDemoRem(rawRem)) continue;
        const rem = normalizeReminderItem(rawRem);
        const cur = map.get(rem.id);
        if (!cur || Number(rem.updatedAt || 0) >= Number(cur.updatedAt || 0)) {
          map.set(rem.id, rem);
          changed = true;
        }
      }
      // Deduplicate active items with identical normalized title
      const seenActiveTitle = new Map();
      const deduped = [];
      const sorted = Array.from(map.values()).sort(
        (a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)
      );
      for (const item of sorted) {
        if (!item.completed) {
          const normTitle = String(item.title || '').trim().toLowerCase();
          if (seenActiveTitle.has(normTitle)) {
            delSet.add(item.id);
            changed = true;
            continue;
          }
          seenActiveTitle.set(normTitle, item.id);
        }
        deduped.push(item);
      }
      state.reminders = deduped.sort(
        (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
      );
    }

    state.deletedIds = Array.from(delSet).slice(-400);

    for (const [iso, curRec] of Object.entries(state.dailyScores)) {
      state.dailyScores[iso] = normalizeDayScoreRecord(curRec, iso);
    }

    if (incoming.dailyScores && typeof incoming.dailyScores === 'object') {
      for (const [iso, rec] of Object.entries(incoming.dailyScores)) {
        if (!rec || typeof rec !== 'object') continue;
        const normInc = normalizeDayScoreRecord(rec, iso);
        const cur = state.dailyScores[iso];
        if (!cur || Number(normInc.updatedAt || 0) >= Number(cur.updatedAt || 0)) {
          state.dailyScores[iso] = normInc;
          changed = true;
        }
      }
    }

    const beforeRosterLen = state.teamRoster.length;
    state.teamRoster = state.teamRoster.filter((m) => m && m.id && !delSet.has(m.id));
    if (state.teamRoster.length !== beforeRosterLen) changed = true;

    if (Array.isArray(incoming.teamRoster)) {
      const rMap = new Map();
      for (const m of state.teamRoster) {
        if (m && m.id && !delSet.has(m.id)) rMap.set(m.id, m);
      }
      for (const m of incoming.teamRoster) {
        if (m && m.id && !delSet.has(m.id)) {
          const prev = rMap.get(m.id);
          if (!prev || JSON.stringify(prev) !== JSON.stringify(m)) {
            rMap.set(m.id, m);
            changed = true;
          }
        }
      }
      state.teamRoster = Array.from(rMap.values());
    }

    if (incoming.prayerConfig && typeof incoming.prayerConfig === 'object') {
      const incP = normalizePrayerConfig(incoming.prayerConfig);
      const curP = normalizePrayerConfig(state.prayerConfig);
      if (incP.updatedAt >= curP.updatedAt && (incP.updatedAt > 0 || curP.updatedAt === 0)) {
        const sigBefore = JSON.stringify(curP);
        const sigAfter = JSON.stringify(incP);
        if (sigBefore !== sigAfter) {
          state.prayerConfig = incP;
          changed = true;
        }
      }
    }

    if (changed) {
      saveLocalState();
      if (renderAfter) requestBackgroundRender();
    }
    return changed;
  }

  function getAlertedTasksSet() {
    try {
      const arr = JSON.parse(localStorage.getItem(TASK_ALERTED_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function saveAlertedTasksSet(set) {
    try {
      localStorage.setItem(TASK_ALERTED_KEY, JSON.stringify(Array.from(set).slice(-160)));
    } catch {}
  }

  function mergeDelegatedCloudStatus(delegatedMap) {
    if (!delegatedMap || typeof delegatedMap !== 'object') return;
    state.delegatedCloudMap = delegatedMap;
    let changed = false;
    const alerted = getAlertedTasksSet();
    let alertedChanged = false;

    for (const rem of state.reminders) {
      if (!rem || !rem.id) continue;
      const dTask = delegatedMap[rem.id];
      if (!dTask) continue;
      const staffTs = dTask.staffUpdatedAt ? new Date(dTask.staffUpdatedAt).getTime() : 0;
      const prevStatus = rem.delegationStatus || 'assigned';
      const prevNote = rem.staffNote || '';
      const nextStatus = dTask.delegationStatus || prevStatus;
      const nextNote = dTask.staffNote || prevNote;
      const statusChanged =
        Boolean(dTask.delegationStatus) &&
        nextStatus !== prevStatus &&
        staffTs >= Number(rem.ownerStatusAt || 0);
      const noteChanged = Boolean(dTask.staffNote) && nextNote !== prevNote;

      if (statusChanged || noteChanged) {
        rem.delegationStatus = nextStatus;
        rem.staffNote = nextNote;
        rem.staffUpdatedAt = dTask.staffUpdatedAt || rem.staffUpdatedAt || '';
        if (Array.isArray(dTask.checklist) && dTask.checklist.length > 0) {
          rem.checklist = normalizeChecklistArray(dTask.checklist);
        }
        rem.updatedAt = Math.max(Number(rem.updatedAt || 0), staffTs || Date.now());
        changed = true;

        if (
          state.notifPrefs.enabled !== false &&
          state.notifPrefs.delegations !== false &&
          (nextStatus === 'seen' ||
            nextStatus === 'working' ||
            nextStatus === 'blocked' ||
            nextStatus === 'done' ||
            noteChanged) &&
          staffTs > 0 &&
          Date.now() - staffTs < 12 * 3600 * 1000
        ) {
          const alertKey = `del_${rem.id}_${nextStatus}_${staffTs || nextNote.slice(0, 16)}`;
          if (!alerted.has(alertKey)) {
            alerted.add(alertKey);
            alertedChanged = true;
            const who = rem.assigneeName || dTask.assigneeName || 'Team';
            const stTitles = {
              seen: `👀 ${who} saw task`,
              working: `⚙️ ${who} is working on task`,
              blocked: `⚠️ ${who} flagged task blocked`,
              done: `✅ ${who} completed task`
            };
            const title = stTitles[nextStatus] || `👤 ${who} updated task`;
            const body = `${rem.title}${nextNote ? ` · 💬 "${nextNote}"` : ''}`;
            playTaskChime();
            showToast(`${title}: ${rem.title.slice(0, 36)}`);
            showLocalSwNotification({
              title,
              body,
              tag: `cmd-del-${rem.id}-${nextStatus}`,
              tab: 'delegated',
              taskId: rem.id,
              url: `./?tab=delegated&taskId=${encodeURIComponent(rem.id)}`,
              requireInteraction: nextStatus === 'done' || nextStatus === 'blocked'
            });
          }
        }
      }
    }
    if (alertedChanged) {
      saveAlertedTasksSet(alerted);
    }
    if (changed) {
      saveLocalState();
      requestBackgroundRender();
    }
  }

  /* ============================================================================
     DAILY 100-POINT PERSONAL DISCIPLINE ENGINE (50% BASELINE + 5 DO'S - 5 DON'TS)
     ============================================================================ */
  function getDayRecord(iso = state.scoreDate, createIfMissing = false) {
    if (state.dailyScores[iso]) {
      return normalizeDayScoreRecord(state.dailyScores[iso], iso);
    }
    const empty = normalizeDayScoreRecord({ date: iso, dos: {}, donts: {}, updatedAt: 0 }, iso);
    if (createIfMissing) {
      state.dailyScores[iso] = empty;
    }
    return empty;
  }

  function computeDayScore(iso = state.scoreDate) {
    const rec = getDayRecord(iso, false);
    let doEarned = 0;
    let dontLost = 0;
    for (const d of DAILY_DOS) {
      const v = rec.dos?.[d.id] || 'none';
      if (v === 'full') doEarned += 10;
      else if (v === 'half') doEarned += 5;
    }
    for (const dn of DAILY_DONTS) {
      const v = rec.donts?.[dn.id] || 'intact';
      if (v === 'slip' || v === 'broken') dontLost += 10;
      else if (v === 'half') dontLost += 5;
    }
    const total = Math.max(0, Math.min(100, 50 + doEarned - dontLost));
    return {
      baseline: 50,
      doEarned,
      dontLost,
      dontKept: 50 - dontLost,
      total,
      netDelta: doEarned - dontLost
    };
  }

  function cycleHabitQuick(group, habitId, iso = todayIso()) {
    const rec = getDayRecord(iso, true);
    if (group === 'do') {
      const cur = rec.dos[habitId] || 'none';
      const next = cur === 'none' ? 'half' : cur === 'half' ? 'full' : 'none';
      rec.dos[habitId] = next;
      if (habitId === 'socializing' || habitId === 'social') {
        rec.dos.socializing = next;
        rec.dos.social = next;
      }
    } else {
      const cur = rec.donts[habitId] || 'intact';
      const next = cur === 'intact' || cur === 'clean' ? 'half' : cur === 'half' ? 'slip' : 'intact';
      rec.donts[habitId] = next;
      if (habitId === 'videogames' || habitId === 'games') {
        rec.donts.videogames = next;
        rec.donts.games = next === 'slip' ? 'broken' : next === 'half' ? 'half' : 'clean';
      } else if (habitId === 'adult18' || habitId === 'nsfw') {
        rec.donts.adult18 = next;
        rec.donts.nsfw = next === 'slip' ? 'broken' : next === 'half' ? 'half' : 'clean';
      }
    }
    rec.updatedAt = Date.now();
    state.dailyScores[iso] = normalizeDayScoreRecord(rec, iso);
    saveLocalState();
    renderAll();
    syncAll().catch(() => {});
  }

  function setHabitState(group, habitId, val, iso = state.scoreDate) {
    const rec = getDayRecord(iso, true);
    if (group === 'do') {
      rec.dos[habitId] = val;
      if (habitId === 'socializing' || habitId === 'social') {
        rec.dos.socializing = val;
        rec.dos.social = val;
      }
    } else {
      rec.donts[habitId] = val;
      if (habitId === 'videogames' || habitId === 'games') {
        rec.donts.videogames = val;
        rec.donts.games = val === 'slip' ? 'broken' : val === 'half' ? 'half' : 'clean';
      } else if (habitId === 'adult18' || habitId === 'nsfw') {
        rec.donts.adult18 = val;
        rec.donts.nsfw = val === 'slip' ? 'broken' : val === 'half' ? 'half' : 'clean';
      }
    }
    rec.updatedAt = Date.now();
    state.dailyScores[iso] = normalizeDayScoreRecord(rec, iso);
    saveLocalState();
    renderAll();
    syncAll().catch(() => {});
  }

  /* ============================================================================
     NATURAL-LANGUAGE SMART CLASSIFIER, CONTEXT TAGS & @PERSON DELEGATION PARSER
     ============================================================================ */
  function extractSmartContext(rawText = '') {
    const text = String(rawText || '').trim();
    const s = text.toLowerCase();

    // 1. Check explicit @Person or "delegate to / tell / ask / talk to [Name]"
    let assigneeName = '';
    let assigneeId = '';
    let assigneeBu = '';
    let isDelegation = false;

    const atMatch = text.match(/@([A-Za-z][A-Za-z0-9_]{1,18})/);
    if (atMatch && atMatch[1]) {
      assigneeName = atMatch[1].charAt(0).toUpperCase() + atMatch[1].slice(1);
      isDelegation = true;
    } else {
      const delMatch = text.match(
        /\b(?:delegate to|assign to|tell|have|ask)\s+([A-Z][a-z]{2,15})\s+(?:to\b|about\b)/
      );
      if (delMatch && delMatch[1]) {
        assigneeName = delMatch[1];
        isDelegation = true;
      } else {
        const talkMatch = text.match(
          /\b(?:talk to|call|text|whatsapp|message|ping|check with|follow up with|remind)\s+([A-Z][a-z]{2,15})\b/
        );
        const STOP = new Set(['The', 'And', 'For', 'About', 'Tomorrow', 'Today', 'Tonight', 'Work', 'App', 'Bank', 'Mom', 'Dad']);
        if (talkMatch && talkMatch[1] && !STOP.has(talkMatch[1])) {
          assigneeName = talkMatch[1];
        }
      }
    }

    // Match against BHFIRMS Team Roster
    if (!assigneeName) {
      for (const m of state.teamRoster) {
        const rx = new RegExp(`\\b${m.name}\\b`, 'i');
        if (rx.test(text)) {
          assigneeName = m.name;
          assigneeId = m.id;
          assigneeBu = m.bu;
          if (/\b(check|prepare|send|fix|inspect|verify|handle|complete|follow up|update|review)\b/i.test(s)) {
            isDelegation = true;
          }
          break;
        }
      }
    } else {
      const found = state.teamRoster.find(
        (m) => m.name.toLowerCase() === assigneeName.toLowerCase()
      );
      if (found) {
        assigneeId = found.id;
        assigneeName = found.name;
        assigneeBu = found.bu;
      }
    }

    // 2. Detect Business Unit (BU)
    let buId = assigneeBu || '';
    let buTag = '';
    const buRules = [
      { id: 'hospitality', tag: 'Resorts', rx: /\b(blanca|la\s*una|palms|voile|platinum|resort|hospitality|beach|cabana|kitchen|pos)\b/i },
      { id: 'manufacturing', tag: 'WTC · Mfg', rx: /\b(wtc|bbc|bbconstruction|lions|concrete|batch|cement|quarry|filter\s*press|mixer|manufacturing|plant)\b/i },
      { id: 'trading', tag: 'Korri · Trading', rx: /\b(korri|shacman|truck|vin|customs|spare\s*part|workshop|trading)\b/i },
      { id: 'realestate_ins', tag: 'RE · Ins', rx: /\b(real\s*estate|tenant|lease|rent|unit|insurance|policy|brokerage|claim|underwrit)\b/i },
      { id: 'holding', tag: 'Holding', rx: /\b(holding|vat|tax|audit|coa|payroll|accounting|journal|soa)\b/i },
      { id: 'tech', tag: 'Tech', rx: /\b(theo|claude|antigravity|pwa|flow|power\s*automate|script|github|vscode)\b/i }
    ];
    for (const r of buRules) {
      if (r.rx.test(text)) {
        buId = r.id;
        buTag = r.tag;
        break;
      }
    }
    if (!buTag && buId) {
      const bMeta = BHFIRMS_BUS.find((b) => b.id === buId);
      if (bMeta) buTag = bMeta.short;
    }

    // 3. Detect App / Bank Tag
    let appTag = '';
    const appRules = [
      { label: 'Whish', rx: /\b(whish|wish money)\b/i },
      { label: 'OMT', rx: /\b(omt)\b/i },
      { label: 'Bank', rx: /\b(bank|audi|blom|byblos|fransabank|neo|statement|wire)\b/i },
      { label: 'Stripe/Wise', rx: /\b(stripe|paypal|wise|revolut)\b/i },
      { label: 'App Sync', rx: /\b(on the app|certain app|in the app|show up|didn'?t show|not showing)\b/i }
    ];
    for (const a of appRules) {
      if (a.rx.test(text)) {
        appTag = a.label;
        break;
      }
    }

    // 4. Extract Dollar Amount
    let amount = 0;
    const amtMatch =
      text.match(/\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/) ||
      text.match(/\b([0-9]+(?:,[0-9]{3})*)\s*(?:usd|dollars|\$)\b/i);
    if (amtMatch && amtMatch[1]) {
      amount = Number(amtMatch[1].replace(/,/g, '')) || 0;
    }

    // 5. Detect Priority
    let priority = 'p3';
    if (/\b(p1|urgent|critical|asap|immediately|emergency)\b/i.test(text)) {
      priority = 'p1';
    } else if (/\b(p2|important|high priority|must do)\b/i.test(text)) {
      priority = 'p2';
    }

    return {
      assigneeId,
      assigneeName,
      buId,
      buTag,
      appTag,
      amount,
      priority,
      isDelegation
    };
  }

  function detectCluster(text = '', override = '') {
    if (override) {
      return CLUSTERS.find((c) => c.id === override) || CLUSTERS[0];
    }
    const s = String(text || '').toLowerCase();
    const hasBu = Boolean(extractSmartContext(text).buId);
    // 1. Ideas for later & Want to do (unless explicitly @Person delegated or BHFIRMS BU matched)
    if (
      !/^@[A-Za-z]/.test(text) &&
      /\b(idea|concept|maybe build|brainstorm|feature idea|automation idea|side project|someday|what if|prototype|experiment|for later)\b/i.test(s)
    ) {
      return CLUSTERS.find((c) => c.id === 'ideas');
    }
    if (
      !hasBu &&
      !/^@[A-Za-z]/.test(text) &&
      /\b(want to|wanna|bucket list|try out|visit|travel|trip|watch|read|buy for myself|weekend|hobby|learn|explore|plan to do|things to do|padel)\b/i.test(s)
    ) {
      return CLUSTERS.find((c) => c.id === 'want_to_do');
    }
    // 2. Explicit @Person delegation or talking to someone
    if (
      /@[A-Za-z]/.test(text) ||
      /\b(talk to|call|text|message|follow up|reach out|check in with|speak with|speak to|ask |meet with|remind |reply to|contact |delegate to|tell )\b/i.test(s)
    ) {
      return CLUSTERS.find((c) => c.id === 'people');
    }
    // 3. App Sync / Verification ("paid and didn't show up on app")
    if (
      /\b(didn'?t show|did not show|not showing|show up|showed up|on the app|in the app|certain app|pending transaction|verify|reconcile|cleared|reflected|refund)\b/i.test(s) ||
      (/\b(paid|sent|transferred)\b/i.test(s) && /\b(app|account|show|check|pending|yet|still|whish|omt)\b/i.test(s))
    ) {
      return CLUSTERS.find((c) => c.id === 'verify');
    }
    // 4. Shipping & Orders
    if (
      /\b(ship|shipping|shipment|delivery|deliver|package|parcel|courier|tracking|dhl|aramex|fedex|cargo|container|arrival|arrive|ordered|order status|freight|transit)\b/i.test(s)
    ) {
      return CLUSTERS.find((c) => c.id === 'shipping');
    }
    // 5. Family & Home
    if (
      /\b(family|mom|mother|dad|father|parents|wife|kids|brother|sister|uncle|aunt|cousin|home|house|groceries|dinner|lunch with|birthday|doctor|dentist|school|pharmacy|gift)\b/i.test(s)
    ) {
      return CLUSTERS.find((c) => c.id === 'family');
    }
    // 6. Payments & Wait Holds
    if (
      /\b(pay|payment|invoice|supplier|vendor|installment|transfer|settle|wire|deposit|cheque|hold payment|wait to pay)\b/i.test(s)
    ) {
      return CLUSTERS.find((c) => c.id === 'payments');
    }
    return CLUSTERS.find((c) => c.id === 'work');
  }

  function epochToIsoLocal(ms) {
    const t = Number(ms || 0);
    if (!t) return '';
    const d = new Date(t);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatIsoFriendly(iso, includeWeekday = true) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const tIso = todayIso();
    const tomIso = shiftIsoDate(tIso, 1);
    const [yy, mm, dd] = iso.split('-').map(Number);
    const dObj = new Date(yy, (mm || 1) - 1, dd || 1, 12, 0, 0);
    const shortMd = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (iso === tIso) return `Today, ${shortMd}`;
    if (iso === tomIso) return `Tomorrow, ${shortMd}`;
    if (!includeWeekday) return shortMd;
    const wk = dObj.toLocaleDateString('en-US', { weekday: 'short' });
    return `${wk}, ${shortMd}`;
  }

  function horizonFromIso(iso) {
    if (!iso) return 'backlog';
    const tIso = todayIso();
    const tomIso = shiftIsoDate(tIso, 1);
    if (iso <= tIso) return 'today';
    if (iso === tomIso) return 'tomorrow';
    return 'week';
  }

  function isHoldOrTimerCategory(cat) {
    return cat === 'verify' || cat === 'shipping' || cat === 'payments';
  }

  function isHoldOrTimerRecord(r) {
    if (!r) return false;
    return Boolean(
      Number(r.matureAt || 0) > 0 ||
        r.kind === 'wait' ||
        r.kind === 'payment' ||
        isHoldOrTimerCategory(r.category)
    );
  }

  function parseExplicitClockTime(text = '') {
    const s = String(text || '').toLowerCase();
    const ampm = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (ampm) {
      let hr = Number(ampm[1]);
      const mn = Number(ampm[2] || 0);
      if (ampm[3] === 'pm' && hr < 12) hr += 12;
      if (ampm[3] === 'am' && hr === 12) hr = 0;
      if (hr >= 0 && hr <= 23 && mn >= 0 && mn <= 59) return { hr, mn };
    }
    const at24 = s.match(/\b(?:at|@)\s*(\d{1,2}):(\d{2})\b/);
    if (at24) {
      const hr = Number(at24[1]);
      const mn = Number(at24[2]);
      if (hr >= 0 && hr <= 23 && mn >= 0 && mn <= 59) return { hr, mn };
    }
    return null;
  }

  function parseNaturalTiming(text = '', clusterId = 'work', amount = 0, horizonOverride = '') {
    const s = String(text || '').toLowerCase();
    const now = Date.now();
    const tIso = todayIso();
    const tomIso = shiftIsoDate(tIso, 1);
    const explicitClock = parseExplicitClockTime(text);

    // 1. Explicit relative countdowns ("in 30m", "in 3h", "in 5 days")
    const minM = s.match(/\b(?:in|wait|for|after)\s+(\d{1,3})\s*(?:m|min|mins|minute|minutes)\b/);
    if (minM) {
      const m = Number(minM[1]);
      const targetAt = now + m * 60000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: `In ${m}m`, isHold: true, recur: 'none', horizon: 'today' };
    }
    const hrM = s.match(/\b(?:in|wait|for|after)\s+(\d{1,3})\s*(?:h|hr|hrs|hour|hours)\b/);
    if (hrM) {
      const h = Number(hrM[1]);
      const targetAt = now + h * 3600000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: `In ${h}h`, isHold: true, recur: 'none', horizon: h <= 12 ? 'today' : 'tomorrow' };
    }
    const dayM = s.match(/\b(?:in|wait|for|after|shipping|delivery|takes?)\s+(\d{1,3})\s*(?:d|day|days)\b/);
    if (dayM) {
      const d = Number(dayM[1]);
      const targetAt = now + d * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: `${d}d Timer`, isHold: true, recur: 'none', horizon: d <= 1 ? 'tomorrow' : 'week' };
    }

    // 2. Recurring keywords
    if (/\b(every day|daily)\b/.test(s)) {
      const targetAt = now + 86400000;
      return { targetAt, planDate: tIso, hasAlarm: true, label: 'Daily', isHold: false, recur: 'daily', horizon: 'today' };
    }
    if (/\b(every week|weekly)\b/.test(s)) {
      const targetAt = now + 7 * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: 'Weekly', isHold: false, recur: 'weekly', horizon: 'week' };
    }

    // 3. Explicit horizon overrides from UI controls
    if (horizonOverride === 'backlog') {
      return { targetAt: 0, planDate: '', hasAlarm: false, label: 'Someday', isHold: false, recur: 'none', horizon: 'backlog' };
    }
    if (horizonOverride === 'today' || horizonOverride === 'tomorrow' || horizonOverride === 'week') {
      const baseDate =
        horizonOverride === 'today'
          ? tIso
          : horizonOverride === 'tomorrow'
            ? tomIso
            : shiftIsoDate(tIso, 3);
      if (explicitClock) {
        const [yy, mm, dd] = baseDate.split('-').map(Number);
        const dt = new Date(yy, mm - 1, dd, explicitClock.hr, explicitClock.mn, 0, 0);
        return {
          targetAt: dt.getTime(),
          planDate: baseDate,
          hasAlarm: true,
          label: `${horizonOverride === 'today' ? 'Today' : horizonOverride === 'tomorrow' ? 'Tomorrow' : formatIsoFriendly(baseDate, false)} ${String(explicitClock.hr).padStart(2, '0')}:${String(explicitClock.mn).padStart(2, '0')}`,
          isHold: false,
          recur: 'none',
          horizon: horizonOverride
        };
      }
      if (isHoldOrTimerCategory(clusterId)) {
        if (clusterId === 'verify') {
          const targetAt = now + 24 * 3600000;
          return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '24h Verify Wait', isHold: true, recur: 'none', horizon: horizonOverride };
        }
        if (clusterId === 'shipping') {
          const targetAt = now + 5 * 86400000;
          return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '5d Shipping Timer', isHold: true, recur: 'none', horizon: 'week' };
        }
        if (clusterId === 'payments') {
          const days = amount >= 15000 ? 10 : amount >= 5000 ? 7 : amount >= 1000 ? 4 : 2;
          const targetAt = now + days * 86400000;
          return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: `${days}d Payment Hold`, isHold: true, recur: 'none', horizon: 'week' };
        }
      }
      return {
        targetAt: 0,
        planDate: baseDate,
        hasAlarm: false,
        label: horizonOverride === 'today' ? 'Today' : horizonOverride === 'tomorrow' ? 'Tomorrow' : 'This Week',
        isHold: false,
        recur: 'none',
        horizon: horizonOverride
      };
    }

    // 4. Natural timing words in text
    if (/\b(tonight|this evening)\b/.test(s)) {
      const t = new Date();
      t.setHours(explicitClock ? explicitClock.hr : 20, explicitClock ? explicitClock.mn : 0, 0, 0);
      if (t.getTime() <= now) t.setTime(now + 2 * 3600000);
      return { targetAt: t.getTime(), planDate: epochToIsoLocal(t.getTime()), hasAlarm: true, label: 'Tonight 20:00', isHold: false, recur: 'none', horizon: 'today' };
    }
    if (/\b(tomorrow)\b/.test(s)) {
      if (explicitClock) {
        const [yy, mm, dd] = tomIso.split('-').map(Number);
        const dt = new Date(yy, mm - 1, dd, explicitClock.hr, explicitClock.mn, 0, 0);
        return { targetAt: dt.getTime(), planDate: tomIso, hasAlarm: true, label: `Tomorrow ${String(explicitClock.hr).padStart(2, '0')}:${String(explicitClock.mn).padStart(2, '0')}`, isHold: false, recur: 'none', horizon: 'tomorrow' };
      }
      return { targetAt: 0, planDate: tomIso, hasAlarm: false, label: 'Tomorrow', isHold: false, recur: 'none', horizon: 'tomorrow' };
    }
    if (/\b(next week|this week)\b/.test(s)) {
      const wkIso = shiftIsoDate(tIso, 3);
      return { targetAt: 0, planDate: wkIso, hasAlarm: false, label: 'This Week', isHold: false, recur: 'none', horizon: 'week' };
    }
    if (explicitClock) {
      const [yy, mm, dd] = tIso.split('-').map(Number);
      const dt = new Date(yy, mm - 1, dd, explicitClock.hr, explicitClock.mn, 0, 0);
      if (dt.getTime() <= now) dt.setDate(dt.getDate() + 1);
      const pIso = epochToIsoLocal(dt.getTime());
      return { targetAt: dt.getTime(), planDate: pIso, hasAlarm: true, label: `${pIso === tIso ? 'Today' : 'Tomorrow'} ${String(explicitClock.hr).padStart(2, '0')}:${String(explicitClock.mn).padStart(2, '0')}`, isHold: false, recur: 'none', horizon: horizonFromIso(pIso) };
    }

    // 5. Category defaults
    if (clusterId === 'ideas' || clusterId === 'want_to_do') {
      return { targetAt: 0, planDate: '', hasAlarm: false, label: 'Someday', isHold: false, recur: 'none', horizon: 'backlog' };
    }
    if (clusterId === 'verify') {
      const targetAt = now + 24 * 3600000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '24h Verify Wait', isHold: true, recur: 'none', horizon: 'tomorrow' };
    }
    if (clusterId === 'shipping') {
      const targetAt = now + 5 * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '5d Shipping Timer', isHold: true, recur: 'none', horizon: 'week' };
    }
    if (clusterId === 'payments') {
      const days = amount >= 15000 ? 10 : amount >= 5000 ? 7 : amount >= 1000 ? 4 : 2;
      const targetAt = now + days * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: `${days}d Payment Hold`, isHold: true, recur: 'none', horizon: 'week' };
    }

    // Default ordinary plan: scheduled cleanly for Today (or active date) with zero fake overdue timer
    const activeFilterIso =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : tIso;
    return {
      targetAt: 0,
      planDate: activeFilterIso,
      hasAlarm: false,
      label: activeFilterIso === tIso ? 'Today' : formatIsoFriendly(activeFilterIso, false),
      isHold: false,
      recur: 'none',
      horizon: horizonFromIso(activeFilterIso)
    };
  }

  function resolveTimingFromChoice(choice, text, clusterId, amount, horizonOverride = '') {
    const now = Date.now();
    const tIso = todayIso();
    const tomIso = shiftIsoDate(tIso, 1);
    if (choice === 'park' || choice === 'backlog') {
      return { targetAt: 0, planDate: '', hasAlarm: false, label: 'Someday', isHold: false, horizon: 'backlog' };
    }
    if (choice === 'plan_today') {
      return { targetAt: 0, planDate: tIso, hasAlarm: false, label: 'Today', isHold: false, horizon: 'today' };
    }
    if (choice === 'plan_tomorrow') {
      return { targetAt: 0, planDate: tomIso, hasAlarm: false, label: 'Tomorrow', isHold: false, horizon: 'tomorrow' };
    }
    if (choice === 'plan_week') {
      const wkIso = shiftIsoDate(tIso, 3);
      return { targetAt: 0, planDate: wkIso, hasAlarm: false, label: 'This Week', isHold: false, horizon: 'week' };
    }
    if (choice && /^\d{4}-\d{2}-\d{2}$/.test(choice)) {
      return {
        targetAt: 0,
        planDate: choice,
        hasAlarm: false,
        label: formatIsoFriendly(choice, false),
        isHold: false,
        horizon: horizonFromIso(choice)
      };
    }
    if (choice === 'today') {
      const t = new Date(now);
      t.setHours(18, 0, 0, 0);
      if (t.getTime() <= now) t.setTime(now + 2 * 3600000);
      return { targetAt: t.getTime(), planDate: epochToIsoLocal(t.getTime()), hasAlarm: true, label: 'Today 18:00', isHold: false, horizon: 'today' };
    }
    if (choice === '3h') {
      const targetAt = now + 3 * 3600000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: 'In 3h', isHold: true, horizon: 'today' };
    }
    if (choice === 'tonight') {
      const t = new Date();
      t.setHours(20, 30, 0, 0);
      if (t.getTime() <= now) t.setTime(now + 3 * 3600000);
      return { targetAt: t.getTime(), planDate: epochToIsoLocal(t.getTime()), hasAlarm: true, label: 'Tonight 20:30', isHold: false, horizon: 'today' };
    }
    if (choice === 'tomorrow') {
      const t = new Date(now + 86400000);
      t.setHours(10, 0, 0, 0);
      return { targetAt: t.getTime(), planDate: tomIso, hasAlarm: true, label: 'Tomorrow 10:00', isHold: false, horizon: 'tomorrow' };
    }
    if (choice === '1d') {
      const targetAt = now + 24 * 3600000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '+24h Wait', isHold: true, horizon: 'tomorrow' };
    }
    if (choice === '2d') {
      const targetAt = now + 2 * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '2d Wait', isHold: true, horizon: 'week' };
    }
    if (choice === '4d') {
      const targetAt = now + 4 * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '4d Wait', isHold: true, horizon: 'week' };
    }
    if (choice === '5d') {
      const targetAt = now + 5 * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '5d Shipping', isHold: true, horizon: 'week' };
    }
    if (choice === '7d') {
      const targetAt = now + 7 * 86400000;
      return { targetAt, planDate: epochToIsoLocal(targetAt), hasAlarm: true, label: '7d Wait', isHold: true, horizon: 'week' };
    }
    return parseNaturalTiming(text, clusterId, amount, horizonOverride);
  }

  function itemIsoDate(item) {
    if (item?.planDate && /^\d{4}-\d{2}-\d{2}$/.test(item.planDate)) {
      return item.planDate;
    }
    const t = Number(item?.matureAt || item?.dueAt || 0);
    if (!t) return '';
    return epochToIsoLocal(t);
  }

  function getEffectiveHorizon(item, now = Date.now()) {
    if (!item) return 'backlog';
    const t = Number(item.matureAt || item.dueAt || 0);
    if (item.delegationStatus === 'done') return 'today';
    if (isHoldOrTimerRecord(item) && t > 0 && now >= t) return 'today';
    if (item.planDate && /^\d{4}-\d{2}-\d{2}$/.test(item.planDate)) {
      return horizonFromIso(item.planDate);
    }
    if (item.horizon === 'today' || item.horizon === 'tomorrow' || item.horizon === 'week' || item.horizon === 'backlog') {
      return item.horizon;
    }
    if (item.priority === 'p1') return 'today';
    if (t > 0) {
      return horizonFromIso(epochToIsoLocal(t));
    }
    if (item.category === 'ideas' || item.category === 'want_to_do' || item.kind === 'parked') {
      return 'backlog';
    }
    return 'today';
  }

  function matchesPlanDateFilter(r, targetIso, now = Date.now()) {
    if (!targetIso || targetIso === 'all') return true;
    const baseIso = todayIso();
    const tomorrowIso = shiftIsoDate(baseIso, 1);
    const rIso = itemIsoDate(r);
    if (rIso === targetIso) return true;
    if (targetIso === baseIso) {
      if (rIso && rIso < baseIso && getEffectiveHorizon(r, now) === 'today') return true;
      if (!rIso && getEffectiveHorizon(r, now) === 'today') return true;
    }
    if (targetIso === tomorrowIso && !rIso && getEffectiveHorizon(r, now) === 'tomorrow') {
      return true;
    }
    return false;
  }

  function formatCountdown(targetAt, now = Date.now()) {
    if (!targetAt) return 'Parked';
    const diff = targetAt - now;
    if (diff <= 0) return 'Ready Now';
    const mins = Math.ceil(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 48) {
      const remM = Math.floor((diff % 3600000) / 60000);
      return remM > 0 ? `${hrs}h ${remM}m` : `${hrs}h`;
    }
    const days = Math.floor(diff / 86400000);
    const remH = Math.floor((diff % 86400000) / 3600000);
    return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
  }

  /* ============================================================================
     RFC 8291 (aes128gcm) + RFC 8292 (VAPID) WEB PUSH ENGINE
     ============================================================================ */
  function b64UrlToU8(b64u) {
    const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
    const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function u8ToB64Url(u8) {
    let bin = '';
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function u8ToB64(u8) {
    let bin = '';
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    return btoa(bin);
  }

  function concatU8(...arrays) {
    const total = arrays.reduce((acc, a) => acc + a.length, 0);
    const res = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) {
      res.set(a, off);
      off += a.length;
    }
    return res;
  }

  async function signVapid(endpoint, customExpSec = 0) {
    const u = new URL(endpoint);
    const aud = `${u.protocol}//${u.host}`;
    const exp = customExpSec > 0 ? Math.floor(customExpSec) : Math.floor(Date.now() / 1000) + 12 * 3600;
    const enc = new TextEncoder();
    const hdr = u8ToB64Url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const pay = u8ToB64Url(
      enc.encode(JSON.stringify({ aud, exp, sub: 'mailto:hussein@bhfirms.com' }))
    );
    const unsigned = `${hdr}.${pay}`;
    const key = await crypto.subtle.importKey(
      'jwk',
      VAPID_PRIVATE_JWK,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    const sig = new Uint8Array(
      await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        enc.encode(unsigned)
      )
    );
    return `vapid t=${unsigned}.${u8ToB64Url(sig)}, k=${VAPID_PUBLIC_B64}`;
  }

  async function hkdfExtractAndExpand(salt, ikm, info, len) {
    const keyHmac = await crypto.subtle.importKey(
      'raw',
      salt,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const prk = new Uint8Array(await crypto.subtle.sign('HMAC', keyHmac, ikm));
    const prkKey = await crypto.subtle.importKey(
      'raw',
      prk,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const out = new Uint8Array(
      await crypto.subtle.sign('HMAC', prkKey, concatU8(info, new Uint8Array([1])))
    );
    return out.slice(0, len);
  }

  async function encryptWebPush(subKeys, payloadObj) {
    const enc = new TextEncoder();
    const uaPub = b64UrlToU8(subKeys.p256dh);
    const authSecret = b64UrlToU8(subKeys.auth);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const asKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    const asPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey));
    const uaPubKey = await crypto.subtle.importKey(
      'raw',
      uaPub,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const sharedSecret = new Uint8Array(
      await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPubKey }, asKeyPair.privateKey, 256)
    );
    const keyInfo = concatU8(enc.encode('WebPush: info\0'), uaPub, asPubRaw);
    const ikm = await hkdfExtractAndExpand(authSecret, sharedSecret, keyInfo, 32);
    const cek = await hkdfExtractAndExpand(
      salt,
      ikm,
      enc.encode('Content-Encoding: aes128gcm\0'),
      16
    );
    const nonce = await hkdfExtractAndExpand(
      salt,
      ikm,
      enc.encode('Content-Encoding: nonce\0'),
      12
    );
    const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, [
      'encrypt'
    ]);
    const plain = concatU8(enc.encode(JSON.stringify(payloadObj)), new Uint8Array([2]));
    const cipher = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plain)
    );
    const rs = new Uint8Array(4);
    new DataView(rs.buffer).setUint32(0, 4096, false);
    const idlen = new Uint8Array([asPubRaw.length]);
    return u8ToB64(concatU8(salt, rs, idlen, asPubRaw, cipher));
  }

  function getSavedPushSub() {
    try {
      return JSON.parse(localStorage.getItem(PUSH_REG_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function computeCmdDeviceId(endpoint) {
    const ep = String(endpoint || '').trim();
    if (!ep) return 'cmd_dev';
    const h = Math.abs(
      Array.from(ep).reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    ).toString(36);
    return `cmd_dev_${h}`;
  }

  function getDevicePlatformClass(ua) {
    const s = String(ua || '').toLowerCase();
    if (!s) return '';
    if (s.includes('iphone')) return 'iphone';
    if (s.includes('ipad')) return 'ipad';
    if (s.includes('android')) return 'android';
    if (s.includes('macintosh') || s.includes('mac os')) return 'mac';
    if (s.includes('windows')) return 'windows';
    if (s.includes('linux')) return 'linux';
    return s.slice(0, 32);
  }

  function normalizePushSubEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const endpoint = String(raw.endpoint || raw.subscription?.endpoint || '').trim();
    const p256dh = String(raw.keys?.p256dh || raw.p256dh || raw.subscription?.keys?.p256dh || '').trim();
    const auth = String(raw.keys?.auth || raw.auth || raw.subscription?.keys?.auth || '').trim();
    if (!endpoint || !p256dh || !auth) return null;
    const app = String(raw.app || '').trim();
    const rawId = String(raw.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const isCmd =
      !app ||
      app === 'command' ||
      app === 'planner' ||
      rawId.startsWith('cmd_') ||
      rawId.startsWith('pln_');
    const id = isCmd
      ? rawId.startsWith('cmd_') || rawId.startsWith('pln_')
        ? rawId
        : computeCmdDeviceId(endpoint)
      : rawId || computeCmdDeviceId(endpoint);
    return {
      id: id || 'cmd_dev',
      app: app || undefined,
      endpoint,
      p256dh,
      auth,
      keys: { p256dh, auth },
      ua: String(raw.ua || '').slice(0, 140),
      updatedAt: String(raw.updatedAt || '')
    };
  }

  function isPlannerSubDevice(raw) {
    if (!raw || typeof raw !== 'object') return false;
    const app = String(raw.app || '').trim().toLowerCase();
    const id = String(raw.id || '').trim().toLowerCase();
    return app === 'command' || app === 'planner' || id.startsWith('cmd_') || id.startsWith('pln_');
  }

  function isThisDevicePushEnabled() {
    return Boolean(normalizePushSubEntry(getSavedPushSub()));
  }

  function getAllActivePushSubscriptions() {
    const byEndpoint = new Map();
    const localSub = normalizePushSubEntry(getSavedPushSub());
    const localPlatform = getDevicePlatformClass(navigator.userAgent || '');
    if (localSub) {
      localSub.app = 'command';
      localSub.ua = String(navigator.userAgent || '').slice(0, 140);
      localSub.updatedAt = new Date().toISOString();
      byEndpoint.set(localSub.endpoint, localSub);
    }
    const cloudList = Array.isArray(state.cloudPushDevices) ? state.cloudPushDevices : [];
    // Strictly filter to Planner ('command' / 'planner') subscriptions — NEVER fall back to THEO workbench devices
    const cmdCloud = cloudList.filter((d) => isPlannerSubDevice(d) && d.prefs?.enabled !== false);
    for (const d of cmdCloud) {
      const norm = normalizePushSubEntry(d);
      if (norm && !byEndpoint.has(norm.endpoint)) {
        norm.app = 'command';
        byEndpoint.set(norm.endpoint, norm);
      }
    }
    // Deduplicate by platform class (e.g. one active iPhone subscription) so rotated endpoints don't double-push
    const byPlatform = new Map();
    const unclassed = [];
    for (const sub of byEndpoint.values()) {
      const plat = getDevicePlatformClass(sub.ua);
      if (!plat) {
        if (localSub && localPlatform && sub.endpoint !== localSub.endpoint) continue;
        unclassed.push(sub);
        continue;
      }
      if (localSub && plat === localPlatform && sub.endpoint !== localSub.endpoint) {
        continue;
      }
      const prev = byPlatform.get(plat);
      if (!prev) {
        byPlatform.set(plat, sub);
      } else {
        const prevTs = Date.parse(prev.updatedAt || '') || 0;
        const curTs = Date.parse(sub.updatedAt || '') || 0;
        if (curTs >= prevTs) {
          byPlatform.set(plat, sub);
        }
      }
    }
    return [...byPlatform.values(), ...unclassed];
  }

  const CMD_UNREAD_NOTIFS_URL = './__theo_cmd_unread_notifs.json';

  function formatRelativeNotifTime(ts) {
    const ms = Number(ts || 0);
    if (!ms) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  function saveNotificationInboxState() {
    try {
      localStorage.setItem(
        NOTIF_INBOX_KEY,
        JSON.stringify((state.notifications || []).slice(0, 60))
      );
      localStorage.setItem(
        NOTIF_CHECKED_KEY,
        JSON.stringify((state.checkedNotifKeys || []).slice(-250))
      );
    } catch {}
  }

  function getUncheckedNotifications() {
    return (state.notifications || []).filter((n) => n && !n.checked);
  }

  function syncUnreadCacheToSw(closeOsNotifications = false, checkedTags = []) {
    const items = (state.notifications || []).slice(0, 60);
    const unreadCount = items.filter((n) => n && !n.checked).length;
    try {
      if ('caches' in window) {
        caches
          .open('theo-cmd-nav-handoff-v1')
          .then((cache) =>
            cache.put(
              CMD_UNREAD_NOTIFS_URL,
              new Response(JSON.stringify({ updatedAt: Date.now(), items }), {
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store'
                }
              })
            )
          )
          .catch(() => {});
      }
    } catch {}
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'sync-unread-notifs',
          items,
          unreadCount,
          closeOsNotifications: Boolean(closeOsNotifications),
          checkedTags: Array.isArray(checkedTags) ? checkedTags : []
        });
      }
    } catch {}
  }

  function updateAppBadgeCount(closeOsNotifications = false, checkedTags = []) {
    const unchecked = getUncheckedNotifications();
    const count = unchecked.length;

    const badgeEl = document.getElementById('push-count-badge');
    const pushBtn = document.getElementById('btn-push-toggle');
    const pDot = document.getElementById('push-dot');
    const thisArmed = isThisDevicePushEnabled();
    const totalArmed = getAllActivePushSubscriptions().length;

    if (badgeEl) {
      if (count > 0) {
        badgeEl.hidden = false;
        badgeEl.textContent = count > 99 ? '99+' : String(count);
      } else {
        badgeEl.hidden = true;
        badgeEl.textContent = '0';
      }
    }
    if (pushBtn) {
      pushBtn.classList.toggle('has-unread-notifs', count > 0);
      pushBtn.title =
        count > 0
          ? `🔴 ${count} Unchecked Notification${count === 1 ? '' : 's'} — Tap to view & clear`
          : thisArmed
            ? `🔔 Planner Push Active on this device (${totalArmed} Planner device${totalArmed === 1 ? '' : 's'} armed) — Tap for Notification Center`
            : '🔕 Tap to enable Planner Lock-Screen Push Notifications on this device';
    }
    if (pDot) {
      pDot.hidden = count > 0 || totalArmed === 0;
      pDot.style.background = thisArmed ? 'var(--emerald)' : 'var(--brass)';
    }

    const baseTitle = 'Planner — Planning, Tasks, Delegation, Score & Prayer Times';
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;

    // Native iOS Home Screen / Android / Desktop App Icon Red Badge (W3C Badging API)
    try {
      if (typeof navigator !== 'undefined') {
        if (count > 0 && typeof navigator.setAppBadge === 'function') {
          navigator.setAppBadge(count).catch(() => {});
        } else if (count === 0 && typeof navigator.clearAppBadge === 'function') {
          navigator.clearAppBadge().catch(() => {});
        } else if (count === 0 && typeof navigator.setAppBadge === 'function') {
          navigator.setAppBadge(0).catch(() => {});
        }
      }
    } catch {}

    syncUnreadCacheToSw(closeOsNotifications, checkedTags);
  }

  function recordNotificationItem(rawPayload, opts = {}) {
    if (!rawPayload || typeof rawPayload !== 'object') return null;
    const tag = String(rawPayload.tag || rawPayload.id || `theo-cmd-notif-${Date.now()}`).trim();
    const id = String(rawPayload.id || tag).trim();
    const isPrayer = Boolean(
      rawPayload.openPrayer ||
        rawPayload.tab === 'prayers' ||
        rawPayload.tab === 'prayer' ||
        tag.includes('prayer')
    );
    const taskId = String(rawPayload.taskId || rawPayload.reminderId || '').trim();
    const tab = isPrayer
      ? 'prayers'
      : normalizeCommandTab(rawPayload.tab || (taskId ? 'tasks' : 'planning'));
    const url =
      rawPayload.url && rawPayload.url !== './'
        ? String(rawPayload.url)
        : isPrayer
          ? './?tab=prayers'
          : taskId
            ? `./?tab=${encodeURIComponent(tab)}&taskId=${encodeURIComponent(taskId)}`
            : `./?tab=${encodeURIComponent(tab)}`;

    const checked = Boolean(opts.checked);
    const item = {
      id,
      tag,
      alertKey: String(rawPayload.alertKey || id),
      title: String(rawPayload.title || 'Planner'),
      body: String(rawPayload.body || 'Tap to open in Planner.'),
      tab,
      taskId,
      openPrayer: isPrayer,
      url,
      ts: Number(rawPayload.ts || Date.now()),
      checked
    };

    if (!checked && Array.isArray(state.checkedNotifKeys)) {
      // If a brand-new notification fires with this id/tag, un-suppress it
      state.checkedNotifKeys = state.checkedNotifKeys.filter(
        (k) => k !== item.id && k !== item.tag && k !== item.alertKey
      );
    }

    const filtered = (state.notifications || []).filter(
      (x) => x && x.id !== item.id && x.tag !== item.tag
    );
    state.notifications = [item, ...filtered].slice(0, 60);
    saveNotificationInboxState();
    updateAppBadgeCount(false);
    return item;
  }

  function markNotificationsChecked(predicate, closeOs = true) {
    if (typeof predicate !== 'function') return 0;
    const checkedSet = new Set(state.checkedNotifKeys || []);
    const checkedTags = [];
    let markedCount = 0;

    for (const n of state.notifications || []) {
      if (!n) continue;
      if (predicate(n)) {
        if (!n.checked) {
          n.checked = true;
          markedCount++;
        }
        if (n.id) checkedSet.add(n.id);
        if (n.tag) {
          checkedSet.add(n.tag);
          checkedTags.push(n.tag);
        }
        if (n.alertKey) checkedSet.add(n.alertKey);
      }
    }

    state.checkedNotifKeys = Array.from(checkedSet).slice(-250);
    saveNotificationInboxState();
    const remainingUnread = getUncheckedNotifications().length;
    updateAppBadgeCount(closeOs || remainingUnread === 0, checkedTags);
    return markedCount;
  }

  function markAllNotificationsChecked() {
    const checkedSet = new Set(state.checkedNotifKeys || []);
    const checkedTags = [];
    for (const n of state.notifications || []) {
      if (!n) continue;
      n.checked = true;
      if (n.id) checkedSet.add(n.id);
      if (n.tag) {
        checkedSet.add(n.tag);
        checkedTags.push(n.tag);
      }
      if (n.alertKey) checkedSet.add(n.alertKey);
    }
    state.checkedNotifKeys = Array.from(checkedSet).slice(-250);
    state.sheetOpenedWithUnreadIds = [];
    saveNotificationInboxState();
    updateAppBadgeCount(true, checkedTags);
  }

  function clearNotificationHistory() {
    const checkedSet = new Set(state.checkedNotifKeys || []);
    for (const n of state.notifications || []) {
      if (!n) continue;
      if (n.id) checkedSet.add(n.id);
      if (n.tag) checkedSet.add(n.tag);
      if (n.alertKey) checkedSet.add(n.alertKey);
    }
    state.checkedNotifKeys = Array.from(checkedSet).slice(-250);
    state.notifications = [];
    state.sheetOpenedWithUnreadIds = [];
    saveNotificationInboxState();
    updateAppBadgeCount(true);
  }

  function seedUncheckedDueNotifications() {
    const nowMs = Date.now();
    const checkedSet = new Set(state.checkedNotifKeys || []);
    const existingIds = new Set(
      (state.notifications || [])
        .flatMap((n) => (n ? [n.id, n.tag, n.alertKey] : []))
        .filter(Boolean)
    );
    let added = false;

    for (const item of state.reminders || []) {
      if (!item || !item.id || item.completed || item.deleted) continue;

      // 1. Matured / Due Wait Timers & Explicit Alarms within the last 48h
      const targetAt = Number(item.matureAt || item.dueAt || 0);
      const isActionableDue = isHoldOrTimerRecord(item) || Boolean(item.hasAlarm);
      if (isActionableDue && targetAt > 0 && nowMs >= targetAt && nowMs - targetAt < 48 * 3600 * 1000) {
        const alertKey = `due_${item.id}_${targetAt}`;
        const tag = `cmd-timer-${item.id}`;
        if (!checkedSet.has(alertKey) && !checkedSet.has(tag) && !existingIds.has(alertKey) && !existingIds.has(tag)) {
          const payload = buildTaskNotificationPayload(item);
          state.notifications.unshift({
            id: alertKey,
            tag: payload.tag || tag,
            alertKey,
            title: payload.title,
            body: payload.body,
            tab: payload.tab || 'tasks',
            taskId: item.id,
            openPrayer: false,
            url: payload.url || `./?tab=tasks&taskId=${encodeURIComponent(item.id)}`,
            ts: targetAt,
            checked: false
          });
          existingIds.add(alertKey);
          existingIds.add(tag);
          added = true;
        }
      }

      // 2. Staff Delegation Updates (Seen / Working / Done) within the last 48h
      const st = item.delegationStatus || '';
      const staffTs = item.staffUpdatedAt ? new Date(item.staffUpdatedAt).getTime() : 0;
      if (
        (st === 'seen' || st === 'working' || st === 'done') &&
        staffTs > 0 &&
        nowMs - staffTs < 48 * 3600 * 1000
      ) {
        const alertKey = `del_${item.id}_${st}_${staffTs}`;
        const tag = `cmd-del-live-${item.id}-${st}`;
        if (!checkedSet.has(alertKey) && !checkedSet.has(tag) && !existingIds.has(alertKey) && !existingIds.has(tag)) {
          const who = item.assigneeName || 'Team';
          const stTitles = {
            seen: `👀 ${who} saw task`,
            working: `⚙️ ${who} is working on task`,
            done: `✅ ${who} completed task`
          };
          state.notifications.unshift({
            id: alertKey,
            tag,
            alertKey,
            title: stTitles[st] || `👤 ${who} updated task`,
            body: `${item.title}${item.staffNote ? ` · 💬 "${item.staffNote}"` : ''}`,
            tab: 'delegated',
            taskId: item.id,
            openPrayer: false,
            url: `./?tab=delegated&taskId=${encodeURIComponent(item.id)}`,
            ts: staffTs,
            checked: false
          });
          existingIds.add(alertKey);
          existingIds.add(tag);
          added = true;
        }
      }
    }

    // 3. Today's Shia Prayer Times that entered within the last 6h while offline/suspended
    const pCfg = normalizePrayerConfig(state.prayerConfig);
    if (pCfg.enabled && state.notifPrefs.enabled !== false && state.notifPrefs.prayers !== false) {
      const todayStr = todayIso();
      const sched = computeShiaPrayerTimesForDate(todayStr, pCfg);
      for (const p of sched.prayers || []) {
        if (!p.enabled) continue;
        if (nowMs >= p.epochMs && nowMs - p.epochMs < 6 * 3600 * 1000) {
          const tag = `prayer-${todayStr}-${p.id}`;
          const alertKey = `prayer_${todayStr}_${p.id}`;
          if (!checkedSet.has(alertKey) && !checkedSet.has(tag) && !existingIds.has(alertKey) && !existingIds.has(tag)) {
            state.notifications.unshift({
              id: alertKey,
              tag,
              alertKey,
              title: `🕌 ${p.label} Prayer Time · ${p.time24} (${p.arabic})`,
              body: `${p.label} entered at ${p.time24} in ${pCfg.locationName}. ${p.windowNote}.`,
              tab: 'prayers',
              taskId: '',
              openPrayer: true,
              url: './?tab=prayers',
              ts: p.epochMs,
              checked: false
            });
            existingIds.add(alertKey);
            existingIds.add(tag);
            added = true;
          }
        }
      }
    }

    if (added) {
      state.notifications = state.notifications
        .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
        .slice(0, 60);
      saveNotificationInboxState();
      updateAppBadgeCount(false);
    }
  }

  async function syncNotificationsWithSwCache() {
    const checkedSet = new Set(state.checkedNotifKeys || []);
    const byKey = new Map();
    for (const n of state.notifications || []) {
      if (n && (n.id || n.tag)) {
        byKey.set(n.tag || n.id, n);
      }
    }
    let changed = false;

    try {
      if ('caches' in window) {
        const cache = await caches.open('theo-cmd-nav-handoff-v1');
        const res = await cache.match(CMD_UNREAD_NOTIFS_URL);
        if (res) {
          const parsed = await res.json().catch(() => null);
          const list = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.items)
              ? parsed.items
              : [];
          for (const raw of list) {
            if (!raw || typeof raw !== 'object') continue;
            const k = String(raw.tag || raw.id || '').trim();
            if (!k) continue;
            const existing = byKey.get(k);
            const isChecked = Boolean(
              raw.checked || checkedSet.has(raw.id) || checkedSet.has(raw.tag)
            );
            if (!existing) {
              byKey.set(k, {
                id: String(raw.id || k),
                tag: String(raw.tag || k),
                alertKey: String(raw.alertKey || raw.id || k),
                title: String(raw.title || 'Planner'),
                body: String(raw.body || 'Tap to open in Planner.'),
                tab: normalizeCommandTab(raw.tab || (raw.openPrayer ? 'prayers' : 'planning')),
                taskId: String(raw.taskId || ''),
                openPrayer: Boolean(raw.openPrayer),
                url: String(raw.url || './'),
                ts: Number(raw.ts || Date.now()),
                checked: isChecked
              });
              changed = true;
            } else if (Number(raw.ts || 0) > Number(existing.ts || 0) && !raw.checked) {
              existing.ts = Number(raw.ts);
              existing.title = String(raw.title || existing.title);
              existing.body = String(raw.body || existing.body);
              existing.checked = false;
              changed = true;
            }
          }
        }
      }
    } catch {}

    // Also inspect any active OS notifications currently shown by the Service Worker
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.getNotifications === 'function') {
          const activeOs = await reg.getNotifications();
          for (const osNotif of activeOs) {
            const k = String(osNotif.tag || '').trim();
            if (!k || byKey.has(k) || checkedSet.has(k)) continue;
            const d = osNotif.data || {};
            byKey.set(k, {
              id: k,
              tag: k,
              alertKey: k,
              title: String(osNotif.title || 'Planner'),
              body: String(osNotif.body || 'Tap to open in Planner.'),
              tab: normalizeCommandTab(d.tab || (d.openPrayer ? 'prayers' : 'planning')),
              taskId: String(d.taskId || ''),
              openPrayer: Boolean(d.openPrayer),
              url: String(d.url || './'),
              ts: Number(d.ts || Date.now()),
              checked: false
            });
            changed = true;
          }
        }
      }
    } catch {}

    if (changed) {
      state.notifications = Array.from(byKey.values())
        .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
        .slice(0, 60);
      saveNotificationInboxState();
    }
    updateAppBadgeCount(false);
  }

  function updatePushHudState() {
    const thisArmed = isThisDevicePushEnabled();
    const banner = document.getElementById('planner-push-banner');
    if (banner) {
      banner.hidden = thisArmed || Boolean(state.pushBannerDismissed);
    }
    updateAppBadgeCount(false);
  }

  function buildTaskNotificationPayload(item) {
    const isDel = Boolean(item.isDelegated || item.assigneeName || item.category === 'people');
    const cat = String(item.category || 'work');
    const isHold = Boolean(
      item.matureAt > 0 ||
        item.kind === 'wait' ||
        cat === 'verify' ||
        cat === 'shipping' ||
        cat === 'payments'
    );
    let prefix = '⏰ Task Due';
    if (cat === 'verify') prefix = '🔍 Verify on App';
    else if (cat === 'shipping') prefix = '📦 Shipping Timer Ready';
    else if (cat === 'payments') prefix = '💸 Payment Hold Matured';
    else if (isDel) prefix = `👤 Follow-Up Due (${item.assigneeName || 'Team'})`;
    else if (isHold) prefix = '⏳ Wait Timer Ready';
    else if (item.recur && item.recur !== 'none') {
      prefix = `🔁 ${item.recur === 'weekly' ? 'Weekly' : 'Daily'} Task Due`;
    }

    const targetTab = isDel ? 'delegated' : 'tasks';
    const amtStr = Number(item.amount || 0) > 0 ? `$${fmtInt(item.amount)} · ` : '';
    const subStr = item.subTag ? `${item.subTag} · ` : '';
    return {
      title: `${prefix} — ${String(item.title || 'Task').slice(0, 44)}`,
      body: `${amtStr}${subStr}Tap to open in Planner.`,
      tag: `cmd-timer-${item.id}`,
      tab: targetTab,
      taskId: item.id,
      url: `./?tab=${targetTab}&taskId=${encodeURIComponent(item.id)}`,
      requireInteraction: true
    };
  }

  async function buildOwnerPushTargets(customExpSec = 0) {
    const subs = getAllActivePushSubscriptions();
    if (!subs.length) return [];
    const expSec = customExpSec > 0 ? customExpSec : Math.floor(Date.now() / 1000) + 23 * 3600;
    const out = [];
    for (const sub of subs) {
      if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) continue;
      try {
        const vapid = await signVapid(sub.endpoint, expSec);
        out.push({
          id: sub.id || 'cmd',
          endpoint: sub.endpoint,
          keys: sub.keys,
          vapid,
          expSec
        });
      } catch {}
    }
    return out;
  }

  async function buildPreSignedOwnerPush(title, body, tab = 'delegated', taskId = '', customExpSec = 0) {
    const subs = getAllActivePushSubscriptions();
    const sub = subs[0];
    if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return null;
    try {
      const expSec = customExpSec > 0 ? customExpSec : Math.floor(Date.now() / 1000) + 23 * 3600;
      const vapid = await signVapid(sub.endpoint, expSec);
      const bodyB64 = await encryptWebPush(sub.keys, {
        title,
        body,
        tag: `cmd-del-${taskId || Date.now()}`,
        tab,
        taskId,
        url: `./?tab=${encodeURIComponent(tab)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ''}`,
        requireInteraction: true
      });
      return {
        endpoint: sub.endpoint,
        vapid,
        bodyB64,
        expSec
      };
    } catch {
      return null;
    }
  }

  function loadLocalTaskSchedMap() {
    try {
      return JSON.parse(localStorage.getItem(TASK_SCHED_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function loadLocalPrayerSchedMap() {
    try {
      return JSON.parse(localStorage.getItem(PRAYER_SCHED_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveLocalTaskSchedMap(map) {
    try {
      const entries = Object.entries(map || {}).slice(-180);
      localStorage.setItem(TASK_SCHED_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }

  function hasValidArmedTimerExp(storedDoc, targetMs = 0) {
    if (!targetMs) return true;
    if (!storedDoc || typeof storedDoc !== 'object') return false;
    const expSec = Number(storedDoc.expSec || 0);
    const baseSec = Math.floor(Number(targetMs) / 1000);
    if (!baseSec || !expSec) return false;
    return expSec >= baseSec + 600 && expSec <= baseSec + 23 * 3600 + 1800;
  }

  function matchesArmedTimerSpec(storedIdOrDoc, specPrefix, targetMs = 0) {
    const isDoc = storedIdOrDoc && typeof storedIdOrDoc === 'object';
    const storedId = isDoc ? String(storedIdOrDoc.id || '') : String(storedIdOrDoc || '');
    if (!storedId || !specPrefix) return false;
    if (storedId === 'cancelled' || storedId.startsWith('fired_') || storedId.startsWith('failed_')) return false;
    if (storedId.startsWith(`sending_${specPrefix}`)) return true;
    const idOk = storedId === specPrefix || storedId.startsWith(`${specPrefix}__`);
    if (!idOk) return false;
    if (isDoc && targetMs > 0) {
      return hasValidArmedTimerExp(storedIdOrDoc, targetMs);
    }
    return true;
  }

  async function fetchCloudDocsSnapshot() {
    if (isHeadlessQuarantine() || !CLOUD_URL || !CLOUD_KEY) return null;
    try {
      const r = await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ key: CLOUD_KEY, op: 'get_control' })
      });
      if (!r.ok) return null;
      const store = await r.json();
      return store?.docs || store || null;
    } catch {
      return null;
    }
  }

  const inFlightItemTimers = new Set();
  async function scheduleCloudTimerPush(item, cloudDocs = null, forceReschedule = false) {
    if (isHeadlessQuarantine()) return false;
    if (!item || !item.id || item.completed || item.deleted) return false;
    if (inFlightItemTimers.has(item.id)) return false;
    if (state.notifPrefs.enabled === false) return false;
    const isHold = Boolean(
      item.matureAt > 0 ||
        item.kind === 'wait' ||
        item.category === 'verify' ||
        item.category === 'shipping' ||
        item.category === 'payments'
    );
    if (isHold && state.notifPrefs.timers === false) return false;
    if (!isHold && state.notifPrefs.tasks === false) return false;

    const subs = getAllActivePushSubscriptions();
    if (!subs.length || !CLOUD_URL || !CLOUD_KEY) return false;
    const targetAt = Number(item.matureAt || item.dueAt || 0);
    if (!targetAt) return false;
    const delaySec = Math.round((targetAt - Date.now()) / 1000);
    if (delaySec < 5 || delaySec > 25 * 86400) return false;

    inFlightItemTimers.add(item.id);
    try {
      if (!cloudDocs) {
        cloudDocs = await fetchCloudDocsSnapshot();
      }

      const expSec = Math.floor(targetAt / 1000) + 12 * 3600;
      const payload = buildTaskNotificationPayload(item);
      const localMap = loadLocalTaskSchedMap();
      let armedAny = false;

      // Cancel legacy bare timer_${item.id} key if present so it never double-fires alongside canonical timer_${item.id}_${devShort}
      const legacyBareKey = `timer_${item.id}`;
      if (localMap[legacyBareKey] || (cloudDocs && cloudDocs[legacyBareKey] && cloudDocs[legacyBareKey].id !== 'cancelled')) {
        delete localMap[legacyBareKey];
        fetch(CLOUD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
            key: CLOUD_KEY,
            op: 'patch',
            patch: { [legacyBareKey]: { id: 'cancelled', updatedAt: new Date().toISOString() } }
          })
        }).catch(() => {});
      }

      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i];
        const devShort = String(sub.id || computeCmdDeviceId(sub.endpoint))
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(-10);
        const timerKey = `timer_${item.id}_${devShort}`;
        const specPrefix = `${item.id}_${targetAt}_${devShort}`;
        const cloudDoc = cloudDocs?.[timerKey];
        const cloudId = cloudDoc?.id;
        const localId = localMap[timerKey];
        const alreadyInCloud = !forceReschedule && matchesArmedTimerSpec(cloudDoc, specPrefix, targetAt);
        const alreadyInLocal = !forceReschedule && !cloudDocs && matchesArmedTimerSpec(localId, specPrefix);
        if (alreadyInCloud || alreadyInLocal) {
          localMap[timerKey] = cloudId || localId || specPrefix;
          armedAny = true;
          continue;
        }
        const timerId = `${specPrefix}__${randomToken(6)}`;
        try {
          const vapid = await signVapid(sub.endpoint, expSec);
          const bodyB64 = await encryptWebPush(sub.keys, payload);
          const r = await fetch(CLOUD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({
              key: CLOUD_KEY,
              op: 'push_delay',
              timerKey,
              timerId,
              expSec,
              delaySec,
              endpoint: sub.endpoint,
              vapid,
              bodyB64
            })
          });
          if (r.ok) {
            localMap[timerKey] = timerId;
            if (cloudDocs) cloudDocs[timerKey] = { id: timerId, expSec };
            armedAny = true;
          }
        } catch {}
      }
      saveLocalTaskSchedMap(localMap);
      return armedAny;
    } finally {
      inFlightItemTimers.delete(item.id);
    }
  }

  async function cancelCloudTimerPush(itemId) {
    if (isHeadlessQuarantine() || !itemId) return;
    const localMap = loadLocalTaskSchedMap();
    const keysToCancel = [`timer_${itemId}`];
    for (const k of Object.keys(localMap)) {
      if (k === `timer_${itemId}` || k.startsWith(`timer_${itemId}_`)) {
        if (!keysToCancel.includes(k)) keysToCancel.push(k);
        delete localMap[k];
      }
    }
    saveLocalTaskSchedMap(localMap);
    if (!CLOUD_URL || !CLOUD_KEY) return;
    const patch = {};
    for (const k of keysToCancel) {
      patch[k] = { id: 'cancelled', updatedAt: new Date().toISOString() };
    }
    try {
      await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({
          key: CLOUD_KEY,
          op: 'patch',
          patch
        })
      });
    } catch {}
  }

  let taskScheduleInFlight = false;
  async function scheduleAllActiveTaskCloudPushes(cloudDocs = null, forceReschedule = false) {
    if (isHeadlessQuarantine()) return 0;
    if (taskScheduleInFlight) return 0;
    if (state.notifPrefs.enabled === false || !CLOUD_URL || !CLOUD_KEY) return 0;
    const subs = getAllActivePushSubscriptions();
    if (!subs.length) return 0;
    taskScheduleInFlight = true;
    let count = 0;
    try {
      if (!cloudDocs) {
        cloudDocs = await fetchCloudDocsSnapshot();
      }
      const now = Date.now();
      const candidates = state.reminders.filter((r) => {
        if (!r || !r.id || r.completed || r.deleted) return false;
        const t = Number(r.matureAt || r.dueAt || 0);
        return t > now + 5000 && t - now <= 25 * 86400 * 1000;
      });
      for (const item of candidates.slice(0, 35)) {
        const ok = await scheduleCloudTimerPush(item, cloudDocs, forceReschedule);
        if (ok) count++;
      }
    } catch {} finally {
      taskScheduleInFlight = false;
    }
    return count;
  }

  async function buildPlannerPushSlots(subEntry, daysAhead = 5) {
    if (!subEntry || !subEntry.endpoint || !subEntry.keys?.p256dh || !subEntry.keys?.auth) {
      return {};
    }
    if (state.notifPrefs.enabled === false || state.notifPrefs.score === false) {
      return {};
    }
    const slots = {};
    const mHour = Number(state.notifPrefs.morningHour || 8);
    const eHour = Number(state.notifPrefs.eveningHour || 21);
    const activeTasks = state.reminders.filter(
      (r) => r && !r.completed && !r.deleted && r.category !== 'ideas' && r.category !== 'want_to_do'
    );
    const delCount = activeTasks.filter((r) => r.isDelegated || r.assigneeName).length;
    const baseIso = todayIso();

    for (let d = 0; d < daysAhead; d++) {
      const iso = shiftIsoDate(baseIso, d);
      const [yy, mm, dd] = iso.split('-').map(Number);
      const pSched = computeShiaPrayerTimesForDate(iso);

      // 1. Morning Executive & Prayer Brief (UTC slot matching Power Automate utcNow('yyyy-MM-ddTHH'))
      const mLocal = new Date(yy, mm - 1, dd, mHour, 0, 0);
      if (mLocal.getTime() > Date.now() - 3600000) {
        const mUtcKey = mLocal.toISOString().slice(0, 13);
        const mExp = Math.floor(mLocal.getTime() / 1000) + 18 * 3600;
        try {
          const vapid = await signVapid(subEntry.endpoint, mExp);
          const bodyB64 = await encryptWebPush(subEntry.keys, {
            title: `☀️ Morning Executive & Prayer Brief — Planner`,
            body: `${activeTasks.length} active tasks (${delCount} delegated) · Fajr ${pSched.fajr.time24} · Dohor ${pSched.dhuhr.time24} · Maghrib ${pSched.maghrib.time24}`,
            tag: `cmd-morning-${iso}`,
            tab: 'planning',
            url: './?tab=planning'
          });
          slots[mUtcKey] = { vapid, bodyB64 };
        } catch {}
      }

      // 2. Evening 100% Discipline Scorecard Check-In
      const eLocal = new Date(yy, mm - 1, dd, eHour, 0, 0);
      if (eLocal.getTime() > Date.now() - 3600000) {
        const eUtcKey = eLocal.toISOString().slice(0, 13);
        const eExp = Math.floor(eLocal.getTime() / 1000) + 18 * 3600;
        try {
          const vapid = await signVapid(subEntry.endpoint, eExp);
          const bodyB64 = await encryptWebPush(subEntry.keys, {
            title: `🛡️ Evening 100% Score Check-In — Planner`,
            body: "Log today's 5 Do's (+50%) & 5 Don'ts (50% baseline) and review tomorrow's timers.",
            tag: `cmd-evening-${iso}`,
            tab: 'score',
            url: './?tab=score'
          });
          slots[eUtcKey] = { vapid, bodyB64 };
        } catch {}
      }
    }
    return slots;
  }

  /* ============================================================================
     SHIA MUSLIM (JA'FARI) ASTRONOMICAL PRAYER TIMES & NOTIFICATION ENGINE
     Computes Fajr (الصبح), Dohor (الظهرين), and Maghrib (المغربين) based on:
     1) Location (Latitude φ, Longitude λ, IANA Timezone Z)
     2) Day of the Year (Julian Date, Solar Declination δ, Equation of Time EoT)
     ============================================================================ */
  const deg2rad = (d) => (d * Math.PI) / 180;
  const rad2deg = (r) => (r * 180) / Math.PI;

  function shiftIsoDate(iso, deltaDays) {
    const [y, m, d] = String(iso || todayIso())
      .split('-')
      .map(Number);
    const dt = new Date(y, (m || 1) - 1, (d || 1) + Number(deltaDays || 0));
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  function getTimezoneOffsetHoursForDate(year, month, day, timeZone) {
    const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (timeZone) {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).formatToParts(utcNoon);
        const map = {};
        for (const p of parts) map[p.type] = p.value;
        const hr = Number(map.hour === '24' ? 0 : map.hour);
        const asUtc = Date.UTC(
          Number(map.year),
          Number(map.month) - 1,
          Number(map.day),
          hr,
          Number(map.minute),
          Number(map.second)
        );
        return (asUtc - utcNoon.getTime()) / 3600000;
      } catch {}
    }
    const localNoon = new Date(year, month - 1, day, 12, 0, 0);
    return -localNoon.getTimezoneOffset() / 60;
  }

  function computeShiaPrayerTimesForDate(isoDate = todayIso(), customCfg = null) {
    const cfg = normalizePrayerConfig(customCfg || state.prayerConfig);
    const [year, month, day] = String(isoDate || todayIso())
      .split('-')
      .map(Number);
    const lat = Number(cfg.lat);
    const lng = Number(cfg.lng);
    const methodMeta =
      SHIA_METHODS.find((m) => m.id === cfg.method) || SHIA_METHODS[0];
    const tzOffsetHours = getTimezoneOffsetHoursForDate(year, month, day, cfg.timeZone);

    // Day of the year (1..365/366)
    const startOfYearUtc = Date.UTC(year, 0, 0);
    const curDateUtc = Date.UTC(year, month - 1, day);
    const dayOfYear = Math.floor((curDateUtc - startOfYearUtc) / 86400000);
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInYear = isLeapYear ? 366 : 365;

    // Julian Date at 00:00 UTC on (year, month, day)
    let Y = year;
    let M = month;
    const D = day;
    if (M <= 2) {
      Y -= 1;
      M += 12;
    }
    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD =
      Math.floor(365.25 * (Y + 4716)) +
      Math.floor(30.6001 * (M + 1)) +
      D +
      B -
      1524.5;

    const sunPositionAtJd = (jd) => {
      const n = jd - 2451545.0;
      const g = deg2rad((357.529 + 0.98560028 * n) % 360);
      const q = (280.459 + 0.98564736 * n) % 360;
      const L = deg2rad((q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360);
      const e = deg2rad(23.439 - 0.00000036 * n);
      const ra = rad2deg(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))) / 15;
      const decl = rad2deg(Math.asin(Math.sin(e) * Math.sin(L)));
      let eqt = q / 15 - ((ra + 24) % 24);
      if (eqt > 12) eqt -= 24;
      if (eqt < -12) eqt += 24;
      return { decl, eqt };
    };

    const baseJd = JD - lng / 360;
    const spNoon = sunPositionAtJd(baseJd + 0.5);
    const noonUtc = 12 - spNoon.eqt - lng / 15;

    const calcHourAngle = (angleDeg, declDeg, fallbackNightHours = 10) => {
      const num =
        -Math.sin(deg2rad(angleDeg)) -
        Math.sin(deg2rad(lat)) * Math.sin(deg2rad(declDeg));
      const den = Math.cos(deg2rad(lat)) * Math.cos(deg2rad(declDeg));
      if (!den || Math.abs(num / den) > 1) {
        // High-latitude angle-based portion fallback
        return (angleDeg / 60) * fallbackNightHours;
      }
      return rad2deg(Math.acos(num / den)) / 15;
    };

    // Sunrise & Sunset first (0.833° horizon depression for refraction + solar radius)
    const spRise = sunPositionAtJd(
      baseJd + (noonUtc - calcHourAngle(0.833, spNoon.decl)) / 24
    );
    const sunriseUtc =
      12 - spRise.eqt - lng / 15 - calcHourAngle(0.833, spRise.decl);

    const spSet = sunPositionAtJd(
      baseJd + (noonUtc + calcHourAngle(0.833, spNoon.decl)) / 24
    );
    const sunsetUtc =
      12 - spSet.eqt - lng / 15 + calcHourAngle(0.833, spSet.decl);

    const nightDurationHrs = Math.max(4, Math.min(20, 24 - (sunsetUtc - sunriseUtc)));

    // 1. Fajr (True Dawn — Subh Sadiq at methodMeta.fajrAngle, e.g. 16° Ja'fari)
    const spFajr = sunPositionAtJd(
      baseJd +
        (noonUtc - calcHourAngle(methodMeta.fajrAngle, spNoon.decl, nightDurationHrs)) /
          24
    );
    const fajrUtc =
      12 -
      spFajr.eqt -
      lng / 15 -
      calcHourAngle(methodMeta.fajrAngle, spFajr.decl, nightDurationHrs) +
      cfg.fajrOffsetMin / 60;

    // 2. Dohor / Dhuhr (Solar Noon / Zawal + precaution minute + user offset)
    const dhuhrUtc =
      noonUtc + (methodMeta.dhuhrMin + cfg.dhuhrOffsetMin) / 60;

    // 3. Maghrib (Shia Ja'fari — Eastern Redness passing overhead at methodMeta.maghribAngle, e.g. 4°)
    const spMag = sunPositionAtJd(
      baseJd +
        (noonUtc +
          calcHourAngle(methodMeta.maghribAngle, spNoon.decl, nightDurationHrs)) /
          24
    );
    const maghribUtc =
      12 -
      spMag.eqt -
      lng / 15 +
      calcHourAngle(methodMeta.maghribAngle, spMag.decl, nightDurationHrs) +
      cfg.maghribOffsetMin / 60;

    // Shia Islamic Midnight (Muntasaf al-Layl = midpoint between Astronomical Sunset and Fajr)
    const midnightUtc = sunsetUtc + 0.5 * (fajrUtc + 24 - sunsetUtc);

    const buildSlotTime = (utcHours, allowNextDay = false) => {
      const rawLocalMin = Math.round((utcHours + tzOffsetHours) * 60);
      const dayShift = allowNextDay && rawLocalMin >= 1440 ? 1 : 0;
      const wrappedMin = ((rawLocalMin % 1440) + 1440) % 1440;
      const hh24 = Math.floor(wrappedMin / 60);
      const mm = wrappedMin % 60;
      const time24 = `${String(hh24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const period = hh24 >= 12 ? 'PM' : 'AM';
      const hh12 = hh24 % 12 || 12;
      const time12 = `${hh12}:${String(mm).padStart(2, '0')} ${period}`;
      const epochMs =
        Date.UTC(year, month - 1, day + dayShift, 0, 0, 0) +
        Math.round((wrappedMin - tzOffsetHours * 60) * 60000);
      return { time24, time12, epochMs, totalLocalMin: wrappedMin };
    };

    const fajrT = buildSlotTime(fajrUtc, false);
    const sunriseT = buildSlotTime(sunriseUtc, false);
    const dhuhrT = buildSlotTime(dhuhrUtc, false);
    const sunsetT = buildSlotTime(sunsetUtc, false);
    const maghribT = buildSlotTime(maghribUtc, false);
    const midnightT = buildSlotTime(midnightUtc, true);

    const prayers = [
      {
        id: 'fajr',
        label: 'Fajr',
        arabic: 'صلاة الصبح',
        icon: '🌅',
        time24: fajrT.time24,
        time12: fajrT.time12,
        epochMs: fajrT.epochMs,
        windowEnd24: sunriseT.time24,
        windowEndMs: sunriseT.epochMs,
        windowNote: `True Dawn (${methodMeta.fajrAngle}°) · Sunrise (الشروق) at ${sunriseT.time24}`,
        enabled: Boolean(cfg.notifyFajr),
        offsetMin: cfg.fajrOffsetMin
      },
      {
        id: 'dhuhr',
        label: 'Dohor',
        arabic: 'صلاة الظهرين',
        icon: '☀️',
        time24: dhuhrT.time24,
        time12: dhuhrT.time12,
        epochMs: dhuhrT.epochMs,
        windowEnd24: sunsetT.time24,
        windowEndMs: sunsetT.epochMs,
        windowNote: `Solar Noon (Zawal · Dhuhr & Asr) · Sunset at ${sunsetT.time24}`,
        enabled: Boolean(cfg.notifyDhuhr),
        offsetMin: cfg.dhuhrOffsetMin
      },
      {
        id: 'maghrib',
        label: 'Maghrib',
        arabic: 'صلاة المغربين',
        icon: '🌙',
        time24: maghribT.time24,
        time12: maghribT.time12,
        epochMs: maghribT.epochMs,
        windowEnd24: midnightT.time24,
        windowEndMs: midnightT.epochMs,
        windowNote: `Eastern Redness (${methodMeta.maghribAngle}° after Sunset ${sunsetT.time24}) · Midnight ${midnightT.time24}`,
        enabled: Boolean(cfg.notifyMaghrib),
        offsetMin: cfg.maghribOffsetMin
      }
    ];

    return {
      isoDate,
      dayOfYear,
      daysInYear,
      tzOffsetHours,
      declinationDeg: Number(spNoon.decl.toFixed(2)),
      eqtMinutes: Number((spNoon.eqt * 60).toFixed(1)),
      method: methodMeta,
      locationName: cfg.locationName,
      lat,
      lng,
      timeZone: cfg.timeZone,
      fajr: prayers[0],
      sunrise: sunriseT,
      dhuhr: prayers[1],
      sunset: sunsetT,
      maghrib: prayers[2],
      midnight: midnightT,
      prayers
    };
  }

  function getNextShiaPrayerStatus(nowMs = Date.now()) {
    const todayStr = todayIso();
    const tomorrowStr = shiftIsoDate(todayStr, 1);
    const todaySched = computeShiaPrayerTimesForDate(todayStr);
    const tomorrowSched = computeShiaPrayerTimesForDate(tomorrowStr);

    let justEntered = null;
    let currentWindow = null;
    for (const p of todaySched.prayers) {
      if (nowMs >= p.epochMs && nowMs - p.epochMs <= 25 * 60000) {
        justEntered = { ...p, isoDate: todayStr };
      }
      if (nowMs >= p.epochMs && nowMs < p.windowEndMs) {
        currentWindow = { ...p, isoDate: todayStr };
      }
    }

    let nextPrayer = todaySched.prayers.find((p) => p.epochMs > nowMs);
    let nextIsTomorrow = false;
    if (!nextPrayer) {
      nextPrayer = { ...tomorrowSched.fajr, isoDate: tomorrowStr, isTomorrow: true };
      nextIsTomorrow = true;
    } else {
      nextPrayer = { ...nextPrayer, isoDate: todayStr, isTomorrow: false };
    }

    return {
      todaySched,
      tomorrowSched,
      justEntered,
      currentWindow,
      nextPrayer,
      nextIsTomorrow
    };
  }

  // Shared Web Audio Context (unlocked on user tap per PWA.md §4.4)
  let sharedAudioCtx = null;
  function ensureAudioUnlocked() {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return null;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
      return sharedAudioCtx;
    } catch {
      return null;
    }
  }

  function playPrayerChime() {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    if (state.prayerConfig && state.prayerConfig.chime === false) return;
    if (state.notifPrefs && state.notifPrefs.chime === false) return;
    try {
      const ctx = ensureAudioUnlocked();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Gentle, resonantHijaz/spiritual chord progression (D4 - F#4 - A4 - D5)
      const notes = [293.66, 369.99, 440.0, 587.33];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.14);
        gain.gain.setValueAtTime(0.08, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.58);
      });
    } catch {}
  }

  function playTaskChime() {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    if (state.notifPrefs && state.notifPrefs.chime === false) return;
    try {
      const ctx = ensureAudioUnlocked();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Crisp executive 2-tone chime (C5 -> G5)
      const notes = [523.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);
        gain.gain.setValueAtTime(0.08, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.38);
      });
    } catch {}
  }

  function showLocalSwNotification(payload, opts = {}) {
    try {
      recordNotificationItem(payload, { checked: false });
      // When Web Push is active on this device, OS banners arrive via the Service Worker push event.
      // Never fire a second local SW OS notification on top of Web Push unless explicitly forced.
      if (isThisDevicePushEnabled() && !opts.forceLocal) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'show-notification',
          payload,
          skipUnread: true
        });
      } else if (navigator.serviceWorker) {
        navigator.serviceWorker.ready
          .then((reg) => {
            const isPrayer = Boolean(payload.openPrayer || payload.tab === 'prayers');
            reg.showNotification(payload.title || 'Planner', {
              body: payload.body || '',
              icon: './icon-192.png?v=26',
              badge: './icon-192.png?v=26',
              tag: payload.tag || 'theo-cmd-notif',
              renotify: false,
              requireInteraction: Boolean(payload.requireInteraction),
              data: {
                url: payload.url || (isPrayer ? './?tab=prayers' : './'),
                tab: payload.tab || (isPrayer ? 'prayers' : 'planning'),
                taskId: payload.taskId || '',
                openPrayer: isPrayer
              }
            });
          })
          .catch(() => {});
      }
    } catch {}
  }

  function getAlertedPrayersSet() {
    try {
      const arr = JSON.parse(localStorage.getItem(PRAYER_ALERTED_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function saveAlertedPrayersSet(set) {
    try {
      localStorage.setItem(PRAYER_ALERTED_KEY, JSON.stringify(Array.from(set).slice(-80)));
    } catch {}
  }

  function checkLivePrayerNotificationsTick() {
    const cfg = normalizePrayerConfig(state.prayerConfig);
    renderPrayerHudPill();
    if (!cfg.enabled || state.notifPrefs.enabled === false || state.notifPrefs.prayers === false) return;

    const nowMs = Date.now();
    const todayStr = todayIso();
    const sched = computeShiaPrayerTimesForDate(todayStr, cfg);
    const alerted = getAlertedPrayersSet();
    let changed = false;

    for (const p of sched.prayers) {
      if (!p.enabled) continue;

      // 1. Optional pre-prayer reminder
      if (cfg.preRemindMin > 0) {
        const preMs = p.epochMs - cfg.preRemindMin * 60000;
        const preKey = `pre_${todayStr}_${p.id}_${cfg.preRemindMin}`;
        if (nowMs >= preMs && nowMs < p.epochMs && nowMs - preMs < 10 * 60000 && !alerted.has(preKey)) {
          alerted.add(preKey);
          changed = true;
          const title = `${p.icon} ${p.label} in ${cfg.preRemindMin} min · ${p.time24}`;
          const body = `${p.arabic} at ${p.time24} in ${cfg.locationName}. ${p.windowNote}`;
          playPrayerChime();
          showToast(`${title} (${cfg.locationName})`);
          showLocalSwNotification({
            title,
            body,
            tag: `prayer-${todayStr}-${p.id}-pre`,
            tab: 'prayers',
            openPrayer: true,
            url: './?tab=prayers'
          });
        }
      }

      // 2. Exact prayer entry notification
      const mainKey = `main_${todayStr}_${p.id}_${p.time24}`;
      if (nowMs >= p.epochMs && nowMs - p.epochMs < 20 * 60000 && !alerted.has(mainKey)) {
        alerted.add(mainKey);
        changed = true;
        const title = `🕌 ${p.label} Prayer Time · ${p.time24} (${p.arabic})`;
        const body = `${p.label} has entered in ${cfg.locationName}. ${p.windowNote}. Hayya 'ala Khayr al-'Amal.`;
        playPrayerChime();
        showToast(`🕌 ${p.label} Prayer Time (${p.time24}) — ${cfg.locationName}`);
        showLocalSwNotification({
          title,
          body,
          tag: `prayer-${todayStr}-${p.id}`,
          tab: 'prayers',
          openPrayer: true,
          url: './?tab=prayers',
          requireInteraction: true
        });
      }
    }

    if (changed) {
      saveAlertedPrayersSet(alerted);
      requestBackgroundRender();
    }
  }

  function checkLiveTaskNotificationsTick() {
    if (state.notifPrefs.enabled === false) return;
    const nowMs = Date.now();
    const alerted = getAlertedTasksSet();
    let changed = false;

    for (const item of state.reminders) {
      if (!item || !item.id || item.completed || item.deleted) continue;
      const targetAt = Number(item.matureAt || item.dueAt || 0);
      if (!targetAt || nowMs < targetAt) continue;
      if (nowMs - targetAt > 12 * 3600 * 1000) continue;

      const isHold = Boolean(
        item.matureAt > 0 ||
          item.kind === 'wait' ||
          item.category === 'verify' ||
          item.category === 'shipping' ||
          item.category === 'payments'
      );
      const isDel = Boolean(item.isDelegated || item.assigneeName || item.category === 'people');
      if (isHold && state.notifPrefs.timers === false) continue;
      if (isDel && state.notifPrefs.delegations === false) continue;
      if (!isHold && !isDel && state.notifPrefs.tasks === false) continue;

      const alertKey = `due_${item.id}_${targetAt}`;
      if (alerted.has(alertKey)) continue;
      alerted.add(alertKey);
      changed = true;

      const notif = buildTaskNotificationPayload(item);
      playTaskChime();
      showToast(notif.title);
      showLocalSwNotification(notif);
    }

    // Also check daily 08:00 Morning Radar & 21:00 Evening 100% Score Check-In while app is open
    if (state.notifPrefs.score !== false) {
      const nowLocal = new Date(nowMs);
      const iso = todayIso();
      const hr = nowLocal.getHours();
      const mn = nowLocal.getMinutes();
      if (hr === Number(state.notifPrefs.morningHour || 8) && mn < 20) {
        const mKey = `score_morning_${iso}`;
        if (!alerted.has(mKey)) {
          alerted.add(mKey);
          changed = true;
          const openTasks = state.reminders.filter(
            (r) => r && !r.completed && !r.deleted && r.category !== 'ideas' && r.category !== 'want_to_do'
          );
          playTaskChime();
          showLocalSwNotification({
            title: '☀️ Morning Executive & Prayer Brief — Planner',
            body: `${openTasks.length} active items on radar. Start at 50% discipline baseline.`,
            tag: `cmd-morning-${iso}`,
            tab: 'planning',
            url: './?tab=planning'
          });
        }
      } else if (hr === Number(state.notifPrefs.eveningHour || 21) && mn < 20) {
        const eKey = `score_evening_${iso}`;
        if (!alerted.has(eKey)) {
          alerted.add(eKey);
          changed = true;
          const sc = computeDayScore(iso);
          playTaskChime();
          showLocalSwNotification({
            title: `🛡️ Evening 100% Score Check-In (${sc.total}%)`,
            body: "Tap to log today's 5 Do's & 5 Don'ts and review tomorrow's timers.",
            tag: `cmd-evening-${iso}`,
            tab: 'score',
            url: './?tab=score'
          });
        }
      }
    }

    if (changed) {
      saveAlertedTasksSet(alerted);
      requestBackgroundRender();
    }
  }

  let prayerScheduleInFlight = false;
  async function scheduleUpcomingPrayerCloudPushes(cloudDocs = null, forceReschedule = false) {
    if (isHeadlessQuarantine() || prayerScheduleInFlight) return 0;
    const cfg = normalizePrayerConfig(state.prayerConfig);
    if (!cfg.enabled || state.notifPrefs.enabled === false || state.notifPrefs.prayers === false || !CLOUD_URL || !CLOUD_KEY) return 0;
    const subs = getAllActivePushSubscriptions();
    if (!subs.length) return 0;

    prayerScheduleInFlight = true;
    let scheduledCount = 0;
    try {
      if (!cloudDocs) {
        cloudDocs = await fetchCloudDocsSnapshot();
      }
      let prevLocalMap = {};
      if (!forceReschedule) {
        try {
          prevLocalMap = JSON.parse(localStorage.getItem(PRAYER_SCHED_KEY) || '{}') || {};
        } catch {
          prevLocalMap = {};
        }
      }
      const nextLocalMap = {};

      const nowMs = Date.now();
      const baseIso = todayIso();

      // Schedule upcoming Fajr, Dohor, and Maghrib over today + next 3 full days (4 distinct dow slots)
      for (let d = 0; d < 4; d++) {
        const iso = shiftIsoDate(baseIso, d);
        const [yy, mm, dd] = iso.split('-').map(Number);
        const dow = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay(); // 0..6
        const sched = computeShiaPrayerTimesForDate(iso, cfg);

        for (const p of sched.prayers) {
          for (const sub of subs) {
            const devShort = String(sub.id || sub.endpoint.slice(-12))
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(-12);

            const preTimerKey = `prayer_d${dow}_pre_${p.id}_${devShort}`;
            const timerKey = `prayer_d${dow}_${p.id}_${devShort}`;

            if (!p.enabled) {
              const cancelPatch = {};
              if (cloudDocs?.[preTimerKey]?.id && cloudDocs[preTimerKey].id !== 'cancelled') {
                cancelPatch[preTimerKey] = { id: 'cancelled', updatedAt: new Date().toISOString() };
              }
              if (cloudDocs?.[timerKey]?.id && cloudDocs[timerKey].id !== 'cancelled') {
                cancelPatch[timerKey] = { id: 'cancelled', updatedAt: new Date().toISOString() };
              }
              if (Object.keys(cancelPatch).length > 0) {
                fetch(CLOUD_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                  body: JSON.stringify({ key: CLOUD_KEY, op: 'patch', ackOnly: true, patch: cancelPatch })
                }).catch(() => {});
              }
              continue;
            }

            // A) Optional Pre-Prayer Reminder
            if (cfg.preRemindMin > 0 && p.enabled) {
              const preTargetMs = p.epochMs - cfg.preRemindMin * 60000;
              const preDelaySec = Math.round((preTargetMs - nowMs) / 1000);
              const preSpecPrefix = `${iso}_pre_${p.id}_${preTargetMs}`;
              const cloudPreDoc = cloudDocs?.[preTimerKey];
              const cloudPreId = cloudPreDoc?.id;
              const localPreId = prevLocalMap[preTimerKey];
              if (preDelaySec >= 10 && preDelaySec <= 4 * 86400) {
                const alreadyInCloud = !forceReschedule && matchesArmedTimerSpec(cloudPreDoc, preSpecPrefix, preTargetMs);
                const alreadyInLocal = !forceReschedule && !cloudDocs && matchesArmedTimerSpec(localPreId, preSpecPrefix);
                if (!alreadyInCloud && !alreadyInLocal) {
                  const preTimerId = `${preSpecPrefix}__${randomToken(6)}`;
                  const expSec = Math.floor(preTargetMs / 1000) + 12 * 3600;
                  const vapid = await signVapid(sub.endpoint, expSec);
                  const bodyB64 = await encryptWebPush(sub.keys, {
                    title: `${p.icon} ${p.label} in ${cfg.preRemindMin} min · ${p.time24}`,
                    body: `${p.arabic} at ${p.time24} in ${cfg.locationName}. ${p.windowNote}`,
                    tag: `prayer-${iso}-${p.id}-pre`,
                    tab: 'prayers',
                    openPrayer: true,
                    url: './?tab=prayers'
                  });
                  const r = await fetch(CLOUD_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: JSON.stringify({
                      key: CLOUD_KEY,
                      op: 'push_delay',
                      timerKey: preTimerKey,
                      timerId: preTimerId,
                      expSec,
                      delaySec: preDelaySec,
                      endpoint: sub.endpoint,
                      vapid,
                      bodyB64
                    })
                  });
                  if (r.ok) {
                    nextLocalMap[preTimerKey] = preTimerId;
                    if (cloudDocs) cloudDocs[preTimerKey] = { id: preTimerId, expSec };
                    scheduledCount++;
                    try {
                      localStorage.setItem(PRAYER_SCHED_KEY, JSON.stringify(nextLocalMap));
                    } catch {}
                    await new Promise((res) => setTimeout(res, 250));
                  }
                } else {
                  nextLocalMap[preTimerKey] = cloudPreId || localPreId || preSpecPrefix;
                  scheduledCount++;
                }
              } else if (cloudPreId && String(cloudPreId).startsWith(`fired_${preSpecPrefix}`)) {
                nextLocalMap[preTimerKey] = cloudPreId;
              }
            }

            // B) Exact Prayer Time Notification
            const delaySec = Math.round((p.epochMs - nowMs) / 1000);
            const specPrefix = `${iso}_${p.id}_${p.epochMs}`;
            const cloudDoc = cloudDocs?.[timerKey];
            const cloudId = cloudDoc?.id;
            const localId = prevLocalMap[timerKey];
            if (delaySec >= 5 && delaySec <= 4 * 86400 && p.enabled) {
              const alreadyInCloud = !forceReschedule && matchesArmedTimerSpec(cloudDoc, specPrefix, p.epochMs);
              const alreadyInLocal = !forceReschedule && !cloudDocs && matchesArmedTimerSpec(localId, specPrefix);

              if (!alreadyInCloud && !alreadyInLocal) {
                const timerId = `${specPrefix}__${randomToken(6)}`;
                const expSec = Math.floor(p.epochMs / 1000) + 12 * 3600;
                const vapid = await signVapid(sub.endpoint, expSec);
                const bodyB64 = await encryptWebPush(sub.keys, {
                  title: `🕌 ${p.label} Prayer Time · ${p.time24} (${p.arabic})`,
                  body: `${p.label} has entered in ${cfg.locationName}. ${p.windowNote}. Hayya 'ala Khayr al-'Amal.`,
                  tag: `prayer-${iso}-${p.id}`,
                  tab: 'prayers',
                  openPrayer: true,
                  url: './?tab=prayers'
                });
                const r = await fetch(CLOUD_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                  body: JSON.stringify({
                    key: CLOUD_KEY,
                    op: 'push_delay',
                    timerKey,
                    timerId,
                    expSec,
                    delaySec,
                    endpoint: sub.endpoint,
                    vapid,
                    bodyB64
                  })
                });
                if (r.ok) {
                  nextLocalMap[timerKey] = timerId;
                  if (cloudDocs) cloudDocs[timerKey] = { id: timerId, expSec };
                  scheduledCount++;
                  try {
                    localStorage.setItem(PRAYER_SCHED_KEY, JSON.stringify(nextLocalMap));
                  } catch {}
                  await new Promise((res) => setTimeout(res, 250));
                }
              } else {
                nextLocalMap[timerKey] = cloudId || localId || specPrefix;
                scheduledCount++;
              }
            } else if (cloudId && String(cloudId).startsWith(`fired_${specPrefix}`)) {
              nextLocalMap[timerKey] = cloudId;
            }
          }
        }
      }

      try {
        localStorage.setItem(PRAYER_SCHED_KEY, JSON.stringify(nextLocalMap));
      } catch {}
    } catch {} finally {
      prayerScheduleInFlight = false;
    }
    return scheduledCount;
  }

  async function sendChannelTestPush(channel = 'prayers') {
    ensureAudioUnlocked();
    if (channel === 'prayers') {
      playPrayerChime();
    } else {
      playTaskChime();
    }

    const status = getNextShiaPrayerStatus();
    const s = status.todaySched;
    const nxt = status.nextPrayer;
    const cd = formatCountdown(nxt.epochMs, Date.now());
    const sc = computeDayScore(todayIso());

    const msgByChannel = {
      prayers: {
        title: `🕌 Shia Prayer Alerts Active · ${s.locationName}`,
        body: `Day ${s.dayOfYear}: Fajr ${s.fajr.time24} · Dohor ${s.dhuhr.time24} · Maghrib ${s.maghrib.time24}. Next: ${nxt.label} (${nxt.time24}) in ${cd}.`,
        tag: `theo-prayer-test-${Date.now()}`,
        tab: 'prayers',
        openPrayer: true,
        url: './?tab=prayers'
      },
      tasks: {
        title: `⏰ Task & Reminder Alerts Active — Planner`,
        body: `All due tasks, recurring items & follow-ups notify directly on Planner.`,
        tag: `cmd-test-tasks-${Date.now()}`,
        tab: 'tasks',
        url: './?tab=tasks'
      },
      timers: {
        title: `⏳ Smart Wait Timers Active — Planner`,
        body: `Verify on App (24h), Shipping countdowns (5d) & Payment holds are armed.`,
        tag: `cmd-test-timers-${Date.now()}`,
        tab: 'tasks',
        url: './?tab=tasks'
      },
      delegations: {
        title: `✅ BHFIRMS Delegation Alerts Active — Planner`,
        body: `Instant lock-screen push when @Team marks a task 👀 Seen, ⚙️ Working, or ✅ Completed.`,
        tag: `cmd-test-del-${Date.now()}`,
        tab: 'delegated',
        url: './?tab=delegated'
      },
      score: {
        title: `🛡️ 100% Discipline Scorecard (${sc.total}% Today)`,
        body: `Start 50% · Do's +${sc.doEarned}% · Don'ts -${sc.dontLost}%. Morning (08:00) & Evening (21:00) briefs armed.`,
        tag: `cmd-test-score-${Date.now()}`,
        tab: 'score',
        url: './?tab=score'
      }
    };

    const msg = msgByChannel[channel] || msgByChannel.prayers;
    showLocalSwNotification(msg);

    const subs = getAllActivePushSubscriptions();
    if (!subs.length || !CLOUD_URL || !CLOUD_KEY) {
      showToast('🔔 Local notification shown! Tap "Enable Push on This Device" for lock-screen push.');
      return;
    }

    showToast('Sending lock-screen Web Push via Planner…');
    let sentOk = 0;
    for (const sub of subs) {
      try {
        const vapid = await signVapid(sub.endpoint);
        const bodyB64 = await encryptWebPush(sub.keys, msg);
        const r = await fetch(CLOUD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
            key: CLOUD_KEY,
            op: 'push',
            endpoint: sub.endpoint,
            vapid,
            bodyB64,
            ttl: '3600'
          })
        });
        if (r.ok) sentOk++;
      } catch {}
    }
    if (channel === 'prayers') {
      await scheduleUpcomingPrayerCloudPushes(null, true);
    } else {
      await scheduleAllActiveTaskCloudPushes(null, true);
    }
    showToast(
      sentOk > 0
        ? `🔔 Planner Web Push delivered (${sentOk} device${sentOk === 1 ? '' : 's'}) & cloud timers armed!`
        : '🔔 Local notification displayed & schedule updated.'
    );
  }

  async function sendTestPrayerPush() {
    return sendChannelTestPush('prayers');
  }

  function findNearestPresetCity(lat, lng) {
    let best = null;
    let bestDistKm = Infinity;
    for (const p of PRAYER_LOCATION_PRESETS) {
      const dLat = deg2rad(p.lat - lat);
      const dLng = deg2rad(p.lng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat)) * Math.cos(deg2rad(p.lat)) * Math.sin(dLng / 2) ** 2;
      const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distKm < bestDistKm) {
        bestDistKm = distKm;
        best = p;
      }
    }
    return bestDistKm <= 42 ? best : null;
  }

  function detectPrayerLocationGps(silent = false) {
    if (!('geolocation' in navigator)) {
      if (!silent) showToast('Geolocation is not available in this browser');
      return;
    }
    if (!silent) showToast('📍 Detecting your GPS coordinates for prayer times…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        const browserTz =
          Intl.DateTimeFormat().resolvedOptions().timeZone || state.prayerConfig.timeZone || 'Asia/Beirut';
        const nearest = findNearestPresetCity(lat, lng);
        let locationName = nearest
          ? `${nearest.label} (GPS)`
          : `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
        const timeZone = nearest ? nearest.timeZone : browserTz;

        // Optional lightweight reverse-geocode if not near a preset city
        if (!nearest) {
          try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 2500);
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
              { signal: ctrl.signal }
            );
            clearTimeout(t);
            if (r.ok) {
              const j = await r.json();
              const city =
                j?.address?.city ||
                j?.address?.town ||
                j?.address?.municipality ||
                j?.address?.state ||
                '';
              const country = j?.address?.country || '';
              if (city) {
                locationName = country ? `${city}, ${country} (GPS)` : `${city} (GPS)`;
              }
            }
          } catch {}
        }

        updatePrayerConfig({
          lat,
          lng,
          timeZone,
          locationName,
          autoGps: true
        });
        if (!silent) {
          showToast(`📍 Prayer location updated: ${locationName}`);
        }
      },
      () => {
        if (!silent) {
          showToast('Could not read GPS location — select a city preset or enter coordinates below.');
        }
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 600000 }
    );
  }

  function buildPrayerScheduleSignature(cfg) {
    const c = normalizePrayerConfig(cfg);
    const s = computeShiaPrayerTimesForDate(todayIso(), c);
    return [
      c.enabled ? '1' : '0',
      c.method,
      c.timeZone,
      c.preRemindMin,
      c.notifyFajr ? '1' : '0',
      c.notifyDhuhr ? '1' : '0',
      c.notifyMaghrib ? '1' : '0',
      s.fajr?.time24 || '',
      s.dhuhr?.time24 || '',
      s.maghrib?.time24 || ''
    ].join('|');
  }

  function updatePrayerConfig(patch) {
    const prevSig = buildPrayerScheduleSignature(state.prayerConfig);
    const nextCfg = normalizePrayerConfig({
      ...state.prayerConfig,
      ...patch,
      updatedAt: Date.now()
    });
    const nextSig = buildPrayerScheduleSignature(nextCfg);
    state.prayerConfig = nextCfg;
    saveLocalState();
    renderAll();
    if (prevSig !== nextSig) {
      scheduleUpcomingPrayerCloudPushes(null, false).catch(() => {});
    }
    syncAll().catch(() => {});
  }

  /* ============================================================================
     ADD / UPDATE / DELEGATE TASK ACTIONS
     ============================================================================ */
  function resolveDraftWhenSelection() {
    const selEl = document.getElementById('draft-when-select');
    const rawVal = selEl ? selEl.value : state.draft.whenSelect || 'auto';
    const selIso =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : '';
    if (rawVal === 'today') return { choice: 'auto', horizonHint: 'today' };
    if (rawVal === 'tomorrow') return { choice: 'auto', horizonHint: 'tomorrow' };
    if (rawVal === 'week') return { choice: 'auto', horizonHint: 'week' };
    if (rawVal === 'backlog') return { choice: 'park', horizonHint: 'backlog' };
    if (rawVal === '1d') return { choice: '1d', horizonHint: 'tomorrow' };
    if (rawVal === '5d') return { choice: '5d', horizonHint: 'week' };
    if (selIso) return { choice: selIso, horizonHint: horizonFromIso(selIso) };
    const h = state.draft.horizon && state.draft.horizon !== 'auto' ? state.draft.horizon : '';
    return { choice: state.draft.waitChoice || 'auto', horizonHint: h };
  }

  async function addTaskFromDraft(sendWhatsAppImmediately = false, keepFocus = false) {
    const capDomVal = document.getElementById('capture-input')?.value || '';
    if (capDomVal && !state.draft.text) {
      state.draft.text = capDomVal;
    }
    const rawText = state.draft.text.trim();
    if (!rawText) {
      openNewPlanSheet();
      return;
    }

    const clusterSelEl = document.getElementById('draft-cluster-select');
    if (clusterSelEl && clusterSelEl.value && !state.draft.clusterOverride) {
      state.draft.clusterOverride = clusterSelEl.value;
    }

    const ctx = extractSmartContext(rawText);
    const cluster = detectCluster(rawText, state.draft.clusterOverride);
    const { choice, horizonHint } = resolveDraftWhenSelection();
    const timing = resolveTimingFromChoice(
      choice,
      rawText,
      cluster.id,
      ctx.amount,
      horizonHint
    );

    const assigneeName = state.draft.assigneeName || ctx.assigneeName || '';
    const assigneeId = state.draft.assigneeId || ctx.assigneeId || '';
    const buId = state.draft.assigneeBu || ctx.buId || '';
    const buMeta = BHFIRMS_BUS.find((b) => b.id === buId);
    const subTag =
      state.draft.customGroup ||
      (assigneeName ? `${assigneeName}` : '') ||
      ctx.appTag ||
      ctx.buTag ||
      (buMeta ? buMeta.short : '');

    const cleanTitle = rawText.replace(/^@[A-Za-z0-9_]+\s*[:,-]?\s*/, '').trim() || rawText;
    const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const isDelegated = Boolean(assigneeName);
    const taskToken = isDelegated ? randomToken(12) : '';
    const priority = state.draft.priority || ctx.priority || 'p3';
    const effectiveHorizon =
      horizonHint ||
      timing.horizon ||
      (cluster.id === 'ideas' || cluster.id === 'want_to_do' ? 'backlog' : 'today');
    const checklist = parseChecklistStepsFromText(state.draft.checklistRaw || '');
    const notes = String(state.draft.notes || '').trim();
    const planDate = timing.planDate || '';
    const dueAt = Number(timing.targetAt || 0);
    const isHold = Boolean(timing.isHold);
    const isParked = effectiveHorizon === 'backlog' && !planDate && !dueAt;

    const newItem = {
      id,
      title: cleanTitle,
      category: isDelegated && !state.draft.clusterOverride ? 'people' : cluster.id,
      customGroup: state.draft.customGroup || '',
      subTag,
      buId,
      amount: ctx.amount || 0,
      priority,
      horizon: effectiveHorizon,
      planDate,
      hasAlarm: Boolean(timing.hasAlarm),
      notes,
      checklist,
      kind: isParked ? 'parked' : isHold ? 'wait' : 'task',
      recur: timing.recur || 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueAt,
      matureAt: isHold ? dueAt : 0,
      completed: false,
      isDelegated,
      assigneeId,
      assigneeName,
      delegationStatus: isDelegated ? 'assigned' : '',
      taskToken,
      staffNote: '',
      staffUpdatedAt: ''
    };

    if (assigneeName && !state.teamRoster.some((m) => m.name.toLowerCase() === assigneeName.toLowerCase())) {
      state.teamRoster.push({
        id: `tm_${Date.now().toString(36)}`,
        name: assigneeName,
        role: 'Team Member',
        bu: buId || 'holding',
        phone: ''
      });
    }

    state.reminders.unshift(newItem);
    state.draft = {
      text: '',
      waitChoice: 'auto',
      whenSelect: 'auto',
      horizon: 'auto',
      priority: '',
      clusterOverride: '',
      customGroup: '',
      assigneeId: '',
      assigneeName: '',
      assigneeBu: '',
      notes: '',
      checklistRaw: '',
      recur: 'none'
    };
    const inp = document.getElementById('capture-input');
    if (inp) inp.value = '';
    if (clusterSelEl) clusterSelEl.value = '';
    const whenSelEl = document.getElementById('draft-when-select');
    if (whenSelEl) whenSelEl.value = 'auto';

    saveLocalState();
    renderAll();

    if (keepFocus && inp) {
      inp.focus({ preventScroll: true });
    }

    if (newItem.matureAt || newItem.dueAt) {
      scheduleCloudTimerPush(newItem).catch(() => {});
    }
    syncAll(newItem).catch(() => {});

    const targetCluster = CLUSTERS.find((c) => c.id === newItem.category) || cluster;
    const whenSummary = planDate ? ` · ${formatIsoFriendly(planDate, false)}` : timing.label ? ` · ${timing.label}` : '';
    if (sendWhatsAppImmediately && isDelegated) {
      dispatchWhatsAppDelegation(newItem.id);
    } else {
      showToast(
        isDelegated
          ? `Assigned to ${assigneeName} (${targetCluster.shortLabel}${whenSummary})`
          : `Added to ${targetCluster.shortLabel}${whenSummary}`
      );
    }
  }

  async function addQuickInlineTask(opts = {}) {
    const rawText = String(opts.title || '').trim();
    if (!rawText) {
      showToast('Enter a plan title first');
      return null;
    }
    const ctx = extractSmartContext(rawText);
    const cluster = detectCluster(rawText, opts.clusterId || '');
    const activeSelIso =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : '';

    let timing;
    if (opts.explicitTiming) {
      timing = opts.explicitTiming;
    } else if (opts.planDate && /^\d{4}-\d{2}-\d{2}$/.test(opts.planDate)) {
      timing = resolveTimingFromChoice(opts.planDate, rawText, cluster.id, ctx.amount, opts.horizon || '');
    } else if (!opts.waitChoice && !opts.horizon && activeSelIso && cluster.id !== 'ideas') {
      timing = resolveTimingFromChoice(activeSelIso, rawText, cluster.id, ctx.amount, horizonFromIso(activeSelIso));
    } else {
      const horizonHint = opts.horizon || '';
      const waitChoice = opts.waitChoice || 'auto';
      timing = resolveTimingFromChoice(waitChoice, rawText, cluster.id, ctx.amount, horizonHint);
    }

    let assigneeName = opts.assigneeName || ctx.assigneeName || '';
    let assigneeId = opts.assigneeId || ctx.assigneeId || '';
    let buId = opts.buId || ctx.buId || '';
    if (assigneeId && !assigneeName) {
      const m = state.teamRoster.find((x) => x.id === assigneeId);
      if (m) {
        assigneeName = m.name;
        if (!buId) buId = m.bu || '';
      }
    } else if (assigneeName && !assigneeId) {
      const m = state.teamRoster.find((x) => x.name.toLowerCase() === assigneeName.toLowerCase());
      if (m) {
        assigneeId = m.id;
        assigneeName = m.name;
        if (!buId) buId = m.bu || '';
      }
    }

    const buMeta = BHFIRMS_BUS.find((b) => b.id === buId);
    const subTag =
      (assigneeName ? `${assigneeName}` : '') ||
      ctx.appTag ||
      ctx.buTag ||
      (buMeta ? buMeta.short : '');

    const cleanTitle = rawText.replace(/^@[A-Za-z0-9_]+\s*[:,-]?\s*/, '').trim() || rawText;
    const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const isDelegated = Boolean(assigneeName) || Boolean(opts.forceDelegated);
    const taskToken = isDelegated ? randomToken(12) : '';
    const priority = opts.priority || ctx.priority || 'p3';
    const planDate = timing.planDate || '';
    const dueAt = Number(timing.targetAt || 0);
    const isHold = Boolean(timing.isHold);
    const effectiveHorizon =
      opts.horizon ||
      timing.horizon ||
      (planDate ? horizonFromIso(planDate) : cluster.id === 'ideas' || cluster.id === 'want_to_do' ? 'backlog' : 'today');
    const checklist = Array.isArray(opts.checklist)
      ? normalizeChecklistArray(opts.checklist)
      : parseChecklistStepsFromText(opts.checklistRaw || '');
    const notes = String(opts.notes || '').trim();
    const isParked = effectiveHorizon === 'backlog' && !planDate && !dueAt;

    const newItem = {
      id,
      title: cleanTitle,
      category: isDelegated && !opts.clusterId ? 'people' : cluster.id,
      customGroup: '',
      subTag,
      buId,
      amount: ctx.amount || 0,
      priority,
      horizon: effectiveHorizon,
      planDate,
      hasAlarm: Boolean(timing.hasAlarm),
      notes,
      checklist,
      kind: isParked ? 'parked' : isHold ? 'wait' : 'task',
      recur: timing.recur || 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueAt,
      matureAt: isHold ? dueAt : 0,
      completed: false,
      isDelegated,
      assigneeId,
      assigneeName,
      delegationStatus: isDelegated ? 'assigned' : '',
      taskToken,
      staffNote: '',
      staffUpdatedAt: ''
    };

    if (assigneeName && !state.teamRoster.some((m) => m.name.toLowerCase() === assigneeName.toLowerCase())) {
      state.teamRoster.push({
        id: `tm_${Date.now().toString(36)}`,
        name: assigneeName,
        role: opts.assigneeRole || 'Team Member',
        bu: buId || 'holding',
        phone: opts.assigneePhone || ''
      });
    }

    state.reminders.unshift(newItem);
    saveLocalState();
    if (!opts.skipRender) {
      renderAll();
    }

    if (newItem.matureAt || newItem.dueAt) {
      scheduleCloudTimerPush(newItem).catch(() => {});
    }
    syncAll(newItem).catch(() => {});

    if (opts.sendWhatsApp && isDelegated) {
      dispatchWhatsAppDelegation(newItem.id);
    } else if (!opts.silentToast) {
      const targetCluster = CLUSTERS.find((c) => c.id === newItem.category) || cluster;
      const whenSummary = planDate ? ` · ${formatIsoFriendly(planDate, false)}` : '';
      showToast(
        isDelegated
          ? `Assigned to ${assigneeName}${whenSummary}`
          : `Added to ${targetCluster.shortLabel}${whenSummary}`
      );
    }
    return newItem;
  }

  function autoPlanTodayHorizon() {
    const now = Date.now();
    const tIso = todayIso();
    let promoted = 0;
    for (const r of state.reminders) {
      if (!r || r.completed || r.deleted) continue;
      if (r.category === 'ideas' || r.category === 'want_to_do') continue;
      const targetAt = Number(r.matureAt || r.dueAt || 0);
      const isReady = (isHoldOrTimerRecord(r) && targetAt > 0 && now >= targetAt) || r.delegationStatus === 'done';
      const isDueToday = itemIsoDate(r) === tIso;
      const isHighPri = r.priority === 'p1' || r.priority === 'p2';
      if ((isReady || isDueToday || isHighPri) && r.horizon !== 'today') {
        r.horizon = 'today';
        r.planDate = tIso;
        r.updatedAt = now;
        promoted++;
      }
    }
    // If still fewer than 3 items in Today's focus, promote top active work/verify/people items
    const todayCount = state.reminders.filter(
      (r) => !r.completed && !r.deleted && getEffectiveHorizon(r, now) === 'today'
    ).length;
    if (todayCount < 3) {
      for (const r of state.reminders) {
        if (!r || r.completed || r.deleted) continue;
        if (r.category === 'ideas' || r.category === 'want_to_do') continue;
        if (getEffectiveHorizon(r, now) !== 'today') {
          r.horizon = 'today';
          r.planDate = tIso;
          r.updatedAt = now;
          promoted++;
          if (todayCount + promoted >= 4) break;
        }
      }
    }
    saveLocalState();
    state.planningMode = 'horizon';
    renderAll();
    syncAll().catch(() => {});
    showToast(
      promoted > 0
        ? `Moved ${promoted} priority item${promoted === 1 ? '' : 's'} into Today`
        : `Today's timeline is already aligned with your top priorities`
    );
  }

  function getDelegationMagicUrl(item) {
    const base = 'https://husseinbdeir.github.io/planner/';
    return `${base}?task=${encodeURIComponent(item.id)}&token=${encodeURIComponent(item.taskToken || '')}`;
  }

  function dispatchWhatsAppDelegation(remId, isNudge = false) {
    const item = state.reminders.find((r) => r.id === remId);
    if (!item) return;
    if (!item.taskToken) {
      item.taskToken = randomToken(12);
    }
    item.isDelegated = true;
    if (!item.delegationStatus || item.delegationStatus === 'assigned') {
      item.delegationStatus = 'sent';
    }
    item.ownerStatusAt = Date.now();
    item.updatedAt = Date.now();
    saveLocalState();
    renderAll();
    syncAll(item).catch(() => {});

    const member = state.teamRoster.find(
      (m) =>
        (item.assigneeId && m.id === item.assigneeId) ||
        (item.assigneeName && m.name.toLowerCase() === item.assigneeName.toLowerCase())
    );
    const phone = (member?.phone || '').replace(/[^0-9]/g, '');
    const buMeta = BHFIRMS_BUS.find((b) => b.id === (item.buId || member?.bu));
    const priMeta = PRIORITY_LEVELS.find((p) => p.id === item.priority);
    const targetStr =
      item.dueAt || item.matureAt
        ? new Date(item.dueAt || item.matureAt).toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Today / As soon as possible';

    const stepsBlock =
      Array.isArray(item.checklist) && item.checklist.length > 0
        ? `\n\n*Deliverable Steps:*\n${item.checklist
            .map((s, i) => `${s.done ? '☑' : '☐'} ${i + 1}. ${s.text}`)
            .join('\n')}`
        : '';
    const notesBlock = item.notes ? `\n• *Instructions:* ${item.notes}` : '';
    const priBlock =
      item.priority === 'p1' || item.priority === 'p2'
        ? `\n• *Priority:* ${priMeta ? priMeta.label : item.priority.toUpperCase()}`
        : '';

    const link = getDelegationMagicUrl(item);
    const msg = isNudge
      ? `🔔 *Follow-Up — Hussein Bdeir (BHFIRMS)*\nHi ${item.assigneeName || 'team'}, please update the live status on:\n• *${item.title}*${stepsBlock}\n\n👇 *Tap to mark Seen / Working / Done:*\n${link}`
      : `📋 *Task Assignment — Hussein Bdeir (BHFIRMS)*\n• *Task:* ${item.title}${buMeta ? `\n• *Unit:* ${buMeta.short}` : ''}${priBlock}\n• *Target:* ${targetStr}${notesBlock}${stepsBlock}\n\n👇 *Tap to update live status (Seen / Working / Done):*\n${link}`;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener');
  }

  function dispatchPersonDigestWhatsApp(personName) {
    const cleanPerson = String(personName || '').trim();
    if (!cleanPerson) return;
    const member = state.teamRoster.find(
      (m) => m.name.toLowerCase() === cleanPerson.toLowerCase() || m.id === cleanPerson
    );
    const targetName = member ? member.name : cleanPerson;
    const items = state.reminders.filter(
      (r) =>
        !r.completed &&
        !r.deleted &&
        isDelegatedItem(r) &&
        String(r.assigneeName || '').toLowerCase() === targetName.toLowerCase()
    );
    if (!items.length) {
      showToast(`No active tasks assigned to ${targetName}`);
      return;
    }

    const now = Date.now();
    for (const it of items) {
      if (!it.taskToken) it.taskToken = randomToken(12);
      if (!it.delegationStatus || it.delegationStatus === 'assigned') {
        it.delegationStatus = 'sent';
      }
      it.ownerStatusAt = now;
      it.updatedAt = now;
    }
    saveLocalState();
    renderAll();
    syncAll(items[0]).catch(() => {});

    const phone = (member?.phone || '').replace(/[^0-9]/g, '');
    const lines = items.map((it, idx) => {
      const link = getDelegationMagicUrl(it);
      const stLabel =
        it.delegationStatus === 'done'
          ? '✅ Done (Pending Verify)'
          : it.delegationStatus === 'working'
            ? '⚙️ Working'
            : it.delegationStatus === 'seen'
              ? '👀 Seen'
              : '📨 Open';
      const priTag = it.priority === 'p1' ? ' [P1 URGENT]' : it.priority === 'p2' ? ' [P2 HIGH]' : '';
      return `*${idx + 1}. ${it.title}*${priTag} (${stLabel})\n   ↳ Status Link: ${link}`;
    });

    const msg =
      `📋 *BHFIRMS Active Task Digest — ${targetName}*\n` +
      `Hi ${targetName}, here are your *${items.length}* active item${items.length === 1 ? '' : 's'} with Hussein Bdeir:\n\n` +
      lines.join('\n\n') +
      `\n\n👇 *Tap each link as you start (Working) or finish (Completed).*`;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener');
  }

  /* ============================================================================
     CLOUD RELAY & WORKSTATION BRIDGE SYNC
     ============================================================================ */
  async function probeBridge() {
    if (isHeadlessQuarantine()) {
      state.bridgeOrigin = '';
      state.syncMode = 'cloud';
      return '';
    }
    const isMobileDevice =
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '') ||
      (typeof window !== 'undefined' && window.innerWidth <= 820 && location.port !== String(BRIDGE_PORT));
    if (isMobileDevice) {
      state.bridgeOrigin = '';
      state.syncMode = 'cloud';
      return '';
    }
    const origins = [];
    if (location.port === String(BRIDGE_PORT)) {
      origins.push(location.origin);
    } else {
      origins.push(`http://127.0.0.1:${BRIDGE_PORT}`);
    }
    for (const orig of origins) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 500);
        const r = await fetch(`${orig}/api/ping`, { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) {
          state.bridgeOrigin = orig;
          state.syncMode = 'bridge';
          return orig;
        }
      } catch {}
    }
    state.bridgeOrigin = '';
    state.syncMode = 'cloud';
    return '';
  }

  let syncInFlight = false;
  let syncPending = false;
  let pendingDelegatedItem = null;

  async function syncAll(newlyDelegatedItem = null) {
    if (newlyDelegatedItem) pendingDelegatedItem = newlyDelegatedItem;
    if (syncInFlight) {
      syncPending = true;
      return;
    }
    syncInFlight = true;
    try {
      do {
        syncPending = false;
        const delItem = pendingDelegatedItem;
        pendingDelegatedItem = null;
        await runSingleSync(delItem);
      } while (syncPending);
    } finally {
      syncInFlight = false;
    }
  }

  async function runSingleSync(newlyDelegatedItem = null) {
    const syncBtn = document.getElementById('btn-sync-now');
    const dot = document.getElementById('sync-dot');
    const lbl = document.getElementById('sync-label');
    if (isHeadlessQuarantine()) {
      if (syncBtn) syncBtn.hidden = true;
      return;
    }
    let syncedOk = false;

    // 1. Try Local Bridge if reachable
    if (!state.bridgeOrigin) {
      await probeBridge();
    }
    if (state.bridgeOrigin) {
      try {
        const res = await fetch(`${state.bridgeOrigin}/api/personal-ledger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalLedger: {
              reminders: state.reminders,
              deletedIds: state.deletedIds.slice(-300),
              dailyScores: state.dailyScores,
              teamRoster: state.teamRoster,
              prayerConfig: state.prayerConfig,
              updatedAt: state.updatedAt
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.personalLedger) {
            mergeIncomingLedger(data.personalLedger, true);
          }
          syncedOk = true;
          if (syncBtn) syncBtn.hidden = true;
          if (dot) dot.className = 'sync-dot';
          if (lbl) lbl.textContent = 'Bridge';
        }
      } catch {
        state.bridgeOrigin = '';
      }
    }

    // 2. Sync with Dataverse Cloud Relay (including delegated_tasks, push_registry & prayer timers!)
    if (!CLOUD_URL || !CLOUD_KEY) {
      if (syncBtn) syncBtn.hidden = true;
      return;
    }
    try {
      const getRes = await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ key: CLOUD_KEY, op: 'get_control' })
      });
      if (getRes.ok) {
        const store = await getRes.json();
        const docs = store?.docs || store || {};
        if (docs.personal_ledger) {
          mergeIncomingLedger(docs.personal_ledger, false);
        }
        if (docs.delegated_tasks && typeof docs.delegated_tasks === 'object') {
          mergeDelegatedCloudStatus(docs.delegated_tasks);
        }
        if (docs.push_registry && Array.isArray(docs.push_registry.items)) {
          state.cloudPushDevices = docs.push_registry.items.filter(
            (d) => normalizePushSubEntry(d) !== null
          );
          try {
            localStorage.setItem(CLOUD_PUSH_DEVS_KEY, JSON.stringify(state.cloudPushDevices));
          } catch {}
        }

        // Arm exact-second serverless Web Push notifications FIRST so armedPrayers/armedTimers in push_registry are fresh & pruned
        await scheduleUpcomingPrayerCloudPushes(docs).catch(() => {});
        await scheduleAllActiveTaskCloudPushes(docs).catch(() => {});
        seedUncheckedDueNotifications();

        // Ensure local browser Web Push subscription is also registered in shared push_registry
        const localSub = normalizePushSubEntry(getSavedPushSub());
        let nextPushRegistry = docs.push_registry;
        if (localSub && localSub.endpoint) {
          const rawExisting = Array.isArray(docs.push_registry?.items)
            ? [...docs.push_registry.items]
            : [];
          const curUa = String(navigator.userAgent || '').slice(0, 140);
          const curPlat = getDevicePlatformClass(curUa);
          const prevEntry =
            rawExisting.find(
              (d) => (d?.endpoint || d?.subscription?.endpoint) === localSub.endpoint
            ) ||
            rawExisting.find(
              (d) => isPlannerSubDevice(d) && curPlat && getDevicePlatformClass(d?.ua) === curPlat
            ) ||
            {};
          // Keep all non-Planner entries + Planner entries from other platforms; replace any stale Planner entry for this same platform/endpoint
          const filteredItems = rawExisting.filter((d) => {
            if (!d) return false;
            const ep = d.endpoint || d.subscription?.endpoint || '';
            if (ep === localSub.endpoint) return false;
            if (isPlannerSubDevice(d) && curPlat && getDevicePlatformClass(d.ua) === curPlat) {
              return false;
            }
            return true;
          });
          const slots = await buildPlannerPushSlots(localSub, 5);
          const devEntry = {
            ...prevEntry,
            id: computeCmdDeviceId(localSub.endpoint),
            app: 'command',
            endpoint: localSub.endpoint,
            p256dh: localSub.p256dh,
            auth: localSub.auth,
            keys: localSub.keys,
            prefs: normalizeNotifPrefs(state.notifPrefs),
            slots,
            armedPrayers: loadLocalPrayerSchedMap(),
            armedTimers: loadLocalTaskSchedMap(),
            ua: curUa,
            updatedAt: new Date().toISOString()
          };
          filteredItems.push(devEntry);
          state.cloudPushDevices = filteredItems;
          try {
            localStorage.setItem(CLOUD_PUSH_DEVS_KEY, JSON.stringify(state.cloudPushDevices));
          } catch {}
          nextPushRegistry = {
            items: filteredItems,
            updatedAt: new Date().toISOString()
          };
        }

        updatePushHudState();

        // Build updated delegated_tasks map so staff links work 100% serverlessly with 7-day instant push targets
        const nextDelMap = { ...(docs.delegated_tasks || {}) };
        const nowSec = Math.floor(Date.now() / 1000);
        const ownerPushTargets = await buildOwnerPushTargets(nowSec + 7 * 86400);
        for (const rem of state.reminders) {
          if (!rem || (!rem.isDelegated && !rem.assigneeName) || !rem.id) continue;
          rem.isDelegated = true;
          if (!rem.taskToken) rem.taskToken = randomToken(12);
          const existing = nextDelMap[rem.id] || {};
          nextDelMap[rem.id] = {
            id: rem.id,
            token: rem.taskToken,
            title: rem.title,
            assigneeName: rem.assigneeName || '',
            assigneeBu: rem.buId || '',
            subTag: rem.subTag || '',
            priority: rem.priority || 'p3',
            horizon: rem.horizon || 'today',
            notes: rem.notes || '',
            checklist: Array.isArray(rem.checklist) ? rem.checklist : [],
            dueAt: rem.dueAt || rem.matureAt || 0,
            delegationStatus: rem.delegationStatus || existing.delegationStatus || 'sent',
            staffNote: rem.staffNote || existing.staffNote || '',
            staffUpdatedAt: rem.staffUpdatedAt || existing.staffUpdatedAt || '',
            ownerPushTargets,
            pushOnDone: null
          };
        }

        const patchPayload = {
          personal_ledger: {
            reminders: state.reminders,
            deletedIds: state.deletedIds.slice(-300),
            dailyScores: state.dailyScores,
            teamRoster: state.teamRoster,
            prayerConfig: state.prayerConfig,
            notifPrefs: state.notifPrefs,
            updatedAt: state.updatedAt
          },
          delegated_tasks: nextDelMap
        };
        if (nextPushRegistry) {
          patchPayload.push_registry = nextPushRegistry;
        }

        await fetch(CLOUD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
            key: CLOUD_KEY,
            op: 'patch',
            ackOnly: true,
            patch: patchPayload
          })
        });

        syncedOk = true;
        if (syncBtn) syncBtn.hidden = true;
        if (dot) dot.className = state.bridgeOrigin ? 'sync-dot' : 'sync-dot cloud';
        if (lbl) lbl.textContent = state.bridgeOrigin ? 'Bridge+Cloud' : 'Cloud Live';
        requestBackgroundRender();
      }
    } catch {}

    if (!syncedOk && !navigator.webdriver) {
      if (syncBtn) syncBtn.hidden = false;
      if (dot) dot.className = 'sync-dot warn';
      if (lbl) lbl.textContent = 'Offline';
    }
  }

  /* ============================================================================
     RENDERING: TOP HUD RIBBON + LIVE ADVISOR + 5 ARCHITECTURAL VIEWS
     ============================================================================ */
  function renderPrayerHudPill() {
    const btn = document.getElementById('btn-prayer-hud');
    const nameEl = document.getElementById('prayer-hud-name');
    const timeEl = document.getElementById('prayer-hud-time');
    const cdEl = document.getElementById('prayer-hud-cd');
    const dockPrayerBadge = document.getElementById('dock-badge-prayers');
    const topPrayerBadge = document.getElementById('top-badge-prayers');
    if (!btn || !nameEl || !timeEl) return;

    const now = Date.now();
    const status = getNextShiaPrayerStatus(now);
    const nxt = status.nextPrayer;
    const today = status.todaySched;
    if (nxt) {
      const cd = formatCountdown(nxt.epochMs, now);
      const isImminent = Boolean(status.justEntered) || (nxt.epochMs - now <= 20 * 60000 && nxt.epochMs >= now);
      nameEl.textContent = nxt.label;
      timeEl.textContent = nxt.time24;
      if (cdEl) cdEl.textContent = `in ${cd}`;
      if (dockPrayerBadge) {
        dockPrayerBadge.hidden = false;
        dockPrayerBadge.textContent = nxt.time24;
        dockPrayerBadge.className = `dock-pill ${isImminent ? 'emerald' : 'steel'} tabular`;
      }
      if (topPrayerBadge) {
        topPrayerBadge.hidden = false;
        topPrayerBadge.textContent = `${nxt.label} ${nxt.time24}`;
        topPrayerBadge.className = `hud-nav-badge ${isImminent ? 'emerald' : 'steel'} tabular`;
      }
      btn.classList.toggle('imminent', isImminent);
      btn.title = `Shia Prayer Times (${today.locationName} · Day #${today.dayOfYear})\nFajr: ${today.fajr.time24}  |  Dohor: ${today.dhuhr.time24}  |  Maghrib: ${today.maghrib.time24}\nNext: ${nxt.label} (${nxt.arabic}) at ${nxt.time24} (in ${cd})\nClick to open Prayer Times tab`;
    }
  }

  function renderHudRibbon() {
    renderPrayerHudPill();
    const todaySc = computeDayScore(todayIso());
    const scoreValEl = document.getElementById('hud-score-val');
    const scoreDeltaEl = document.getElementById('hud-score-delta');
    const dockScoreEl = document.getElementById('dock-badge-score');
    const topScoreEl = document.getElementById('top-badge-score');

    if (scoreValEl) {
      scoreValEl.textContent = `${todaySc.total}%`;
      scoreValEl.style.color =
        todaySc.total >= 75
          ? 'var(--emerald)'
          : todaySc.total >= 50
            ? 'var(--brass-bright)'
            : 'var(--crimson)';
    }
    if (scoreDeltaEl) {
      const sign = todaySc.netDelta >= 0 ? `+${todaySc.netDelta}%` : `${todaySc.netDelta}%`;
      scoreDeltaEl.textContent = `50% ${sign}`;
    }
    if (dockScoreEl) {
      dockScoreEl.textContent = `${todaySc.total}%`;
    }
    if (topScoreEl) {
      topScoreEl.textContent = `${todaySc.total}%`;
    }
  }

  function renderLiveAdvisorDrawer() {
    const drawer = document.getElementById('live-advisor-drawer');
    const delGroup = document.getElementById('capture-delegate-group');
    const delBtn = document.getElementById('btn-pick-assignee');
    const delLbl = document.getElementById('capture-assignee-label');
    const delClearBtn = document.getElementById('btn-clear-assignee');
    const submitBtn = document.getElementById('capture-submit-btn');
    const clusterSel = document.getElementById('draft-cluster-select');
    const clusterAutoOpt = document.getElementById('draft-cluster-auto-opt');
    const whenSel = document.getElementById('draft-when-select');
    const whenAutoOpt = document.getElementById('draft-when-auto-opt');

    const text = state.draft.text.trim();
    const ctx = extractSmartContext(text);
    const activeAssignee = state.draft.assigneeName || ctx.assigneeName || '';
    const detectedCluster = detectCluster(text, '');
    const effectiveCluster = detectCluster(text, state.draft.clusterOverride);
    const selIso =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : '';

    if (clusterAutoOpt) {
      clusterAutoOpt.textContent = text
        ? `Auto · ${detectedCluster.shortLabel}`
        : 'Category: Auto';
    }
    if (clusterSel && document.activeElement !== clusterSel) {
      clusterSel.value = state.draft.clusterOverride || '';
      clusterSel.classList.toggle('is-customized', Boolean(state.draft.clusterOverride));
    }

    if (whenAutoOpt) {
      if (selIso) {
        whenAutoOpt.textContent = `When: ${formatIsoFriendly(selIso, false)}`;
      } else if (effectiveCluster.id === 'ideas' || effectiveCluster.id === 'want_to_do') {
        whenAutoOpt.textContent = 'When: Someday';
      } else {
        whenAutoOpt.textContent = 'When: Today';
      }
    }
    if (whenSel && document.activeElement !== whenSel) {
      const wVal = state.draft.whenSelect || 'auto';
      whenSel.value = wVal;
      whenSel.classList.toggle('is-customized', wVal !== 'auto' || Boolean(selIso));
    }

    if (delGroup && delBtn && delLbl) {
      if (activeAssignee) {
        delGroup.hidden = false;
        delBtn.classList.add('active');
        delLbl.textContent = `@${activeAssignee}`;
        if (delClearBtn) delClearBtn.hidden = false;
      } else {
        delGroup.hidden = true;
        delBtn.classList.remove('active');
        delLbl.textContent = 'Delegate';
        if (delClearBtn) delClearBtn.hidden = true;
      }
    }

    if (submitBtn) {
      submitBtn.textContent = activeAssignee ? 'Assign Plan' : 'Add Plan';
    }

    if (!drawer) return;

    const { choice, horizonHint } = resolveDraftWhenSelection();
    const timing = resolveTimingFromChoice(
      choice,
      text,
      effectiveCluster.id,
      ctx.amount,
      horizonHint
    );

    // Only surface the compact 1-line helper strip when @Assignee delegation or $Amount / Wait Timer is detected
    const showContextStrip = Boolean(
      activeAssignee || (text && (ctx.amount > 0 || timing.isHold))
    );
    if (!showContextStrip) {
      drawer.hidden = true;
      drawer.innerHTML = '';
      return;
    }

    drawer.hidden = false;
    drawer.innerHTML = `
      <div class="advisor-detected-badges">
        <span class="t-pill" style="border-color:var(--border-mid);color:var(--text-primary)">
          ${esc(effectiveCluster.label)}
        </span>
        ${
          activeAssignee
            ? `<span class="t-pill person">Delegating to ${esc(activeAssignee)}</span>`
            : ''
        }
        ${ctx.buTag ? `<span class="t-pill">${esc(ctx.buTag)}</span>` : ''}
        ${ctx.amount > 0 ? `<span class="t-pill amt">$${fmtInt(ctx.amount)}</span>` : ''}
        ${
          timing.label
            ? `<span class="t-pill ${timing.isHold ? 'timer' : ''}">${esc(timing.label)}</span>`
            : ''
        }
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${
          activeAssignee
            ? `<button type="button" class="mini-chip wa-btn" id="btn-add-and-whatsapp">📲 Assign &amp; WhatsApp</button>`
            : ''
        }
        <button type="button" class="mini-chip" id="btn-advisor-open-details">Add steps or exact time…</button>
      </div>
    `;
  }

  /* ============================================================================
     EXECUTIVE TICKER ROW RENDERER (WITH CHECKLIST, PRIORITY & DELEGATION OVERRIDE)
     ============================================================================ */
  function renderTickerRowHtml(item, now = Date.now()) {
    const cluster = CLUSTERS.find((c) => c.id === item.category) || CLUSTERS[3];
    const targetAt = Number(item.matureAt || item.dueAt || 0);
    const isHold = isHoldOrTimerRecord(item);
    const isMatured = !item.completed && targetAt > 0 && now >= targetAt && isHold;
    const isOverdue = !item.completed && Boolean(item.hasAlarm) && targetAt > 0 && now >= targetAt && !isHold;
    const isHolding = !item.completed && targetAt > now && isHold;
    const isExpanded = state.expandedRowId === item.id;
    const pri = item.priority || 'p3';

    const rowCls = [
      'ticker-row-card',
      item.completed
        ? 'completed'
        : isMatured
          ? 'matured'
          : isOverdue
            ? 'overdue'
            : isHolding
              ? 'holding'
              : '',
      !item.completed && pri === 'p1' ? 'priority-p1' : !item.completed && pri === 'p2' ? 'priority-p2' : '',
      isExpanded ? 'expanded' : ''
    ]
      .filter(Boolean)
      .join(' ');

    const countdown = formatCountdown(targetAt, now);
    let progressPct = 0;
    if (isHold && !item.completed && item.createdAt && targetAt > item.createdAt) {
      progressPct = Math.max(
        4,
        Math.min(100, Math.round(((now - item.createdAt) / (targetAt - item.createdAt)) * 100))
      );
    }

    const steps = Array.isArray(item.checklist) ? item.checklist : [];
    const doneSteps = steps.filter((s) => s.done).length;
    const stepsBadge =
      steps.length > 0
        ? `<span class="t-pill steps tabular" title="Deliverable steps">${doneSteps}/${steps.length} steps</span>`
        : '';

    const priBadge =
      pri === 'p1'
        ? `<span class="t-pill p1">P1</span>`
        : pri === 'p2'
          ? `<span class="t-pill p2">P2</span>`
          : '';

    const buMeta = BHFIRMS_BUS.find((b) => b.id === item.buId);
    const buBadge = buMeta ? `<span class="t-pill">${esc(buMeta.short)}</span>` : '';

    let delBadge = '';
    if (item.isDelegated) {
      const st = item.delegationStatus || 'assigned';
      const stMap = {
        assigned: { lbl: `${item.assigneeName || 'Team'} · Assigned`, cls: 'person' },
        sent: { lbl: `${item.assigneeName} · Dispatched`, cls: 'person' },
        seen: { lbl: `${item.assigneeName} · Seen`, cls: 'person' },
        working: { lbl: `${item.assigneeName} · Working`, cls: 'timer' },
        blocked: { lbl: `${item.assigneeName} · Blocked`, cls: 'p1' },
        done: { lbl: `${item.assigneeName} · Verify`, cls: 'matured' },
        verified: { lbl: `${item.assigneeName} · Verified`, cls: 'matured' }
      };
      const meta = stMap[st] || stMap.assigned;
      delBadge = `<span class="t-pill ${meta.cls}">${esc(meta.lbl)}</span>`;
    } else if (item.subTag) {
      delBadge = `<span class="t-pill">${esc(item.subTag)}</span>`;
    }

    const doneVerb =
      item.delegationStatus === 'done'
        ? '✓ Verify & Close'
        : cluster.id === 'verify'
          ? '✓ Verified'
          : cluster.id === 'shipping'
            ? '✓ Received'
            : cluster.id === 'people'
              ? '✓ Completed'
              : cluster.id === 'payments'
                ? '✓ Paid'
                : '✓ Done';

    const checklistDrawerHtml = `
      <div class="checklist-drawer-box">
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">
          <span>Deliverable Checklist (${doneSteps}/${steps.length})</span>
          <button type="button" class="mini-chip" data-act="open-workbench" data-id="${esc(item.id)}">✎ Full Task Workbench</button>
        </div>
        ${steps
          .map(
            (st) => `
          <div class="checklist-step-row ${st.done ? 'done' : ''}" data-act="toggle-step" data-id="${esc(item.id)}" data-step-id="${esc(st.id)}" style="cursor:pointer">
            <button type="button" class="checklist-step-check" data-act="toggle-step" data-id="${esc(item.id)}" data-step-id="${esc(st.id)}">${st.done ? '✓' : ''}</button>
            <span style="flex:1">${esc(st.text)}</span>
            <button type="button" class="mini-chip" data-act="delete-step" data-id="${esc(item.id)}" data-step-id="${esc(st.id)}" style="padding:1px 5px;font-size:10px" title="Remove step">✕</button>
          </div>
        `
          )
          .join('')}
        <div style="display:flex;gap:5px;margin-top:3px">
          <input
            type="text"
            class="bento-inline-input"
            enterkeyhint="done"
            data-step-input-for="${esc(item.id)}"
            placeholder="+ Add deliverable step or checkpoint…"
          >
          <button type="button" class="bento-inline-btn" data-act="add-step" data-id="${esc(item.id)}">+ Step</button>
        </div>
      </div>
    `;

    const completedTimeBadge =
      item.completed
        ? `<span class="t-pill matured">✓ Completed${
            item.completedAt || item.updatedAt
              ? ` · ${esc(
                  new Date(Number(item.completedAt || item.updatedAt)).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                )}`
              : ''
          }</span>
          <button type="button" class="mini-chip" data-act="toggle-done" data-id="${esc(item.id)}" style="padding:2px 7px;font-size:10px" title="Reopen task">↺ Reopen</button>`
        : '';

    const delegationStageOverrideHtml = item.isDelegated
      ? `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;padding:6px 8px;border-radius:6px;background:var(--bg-elevated);border:1px solid var(--border-subtle)">
          <span style="font-size:10.5px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">
            Stage (${esc(item.assigneeName || 'Staff')}):
          </span>
          <div class="del-stage-stepper">
            ${['assigned', 'sent', 'seen', 'working', 'done']
              .map(
                (stKey) => `
              <button
                type="button"
                class="del-stage-pill ${(item.delegationStatus || 'assigned') === stKey ? `active-${stKey}` : ''}"
                data-act="set-del-stage"
                data-id="${esc(item.id)}"
                data-stage="${stKey}"
              >${stKey === 'assigned' ? 'Assigned' : stKey === 'sent' ? 'Sent' : stKey === 'seen' ? 'Seen' : stKey === 'working' ? 'Working' : 'Done'}</button>
            `
              )
              .join('')}
          </div>
        </div>
      `
      : '';

    return `
      <div class="${rowCls}" data-row-id="${esc(item.id)}">
        <div class="ticker-main-line" data-row-toggle="${esc(item.id)}">
          <button
            type="button"
            class="ticker-check-btn"
            data-act="toggle-done"
            data-id="${esc(item.id)}"
            title="${esc(doneVerb)}"
          >✓</button>
          <span class="ticker-title">${esc(item.title)}</span>
          <div class="ticker-pills">
            ${completedTimeBadge}
            ${priBadge}
            ${stepsBadge}
            ${buBadge}
            ${delBadge}
            ${item.amount > 0 ? `<span class="t-pill amt">$${fmtInt(item.amount)}</span>` : ''}
            ${
              !item.completed && targetAt > 0 && (targetAt > now || isMatured || isOverdue)
                ? `<span class="t-pill ${
                    isMatured || item.delegationStatus === 'done'
                      ? 'matured'
                      : isOverdue
                        ? 'p1'
                        : 'timer'
                  } tabular">${isMatured ? 'Ready' : isOverdue ? 'Due' : esc(countdown)}</span>`
                : !item.completed && item.planDate
                  ? `<span class="t-pill tabular">${esc(formatIsoFriendly(item.planDate, false))}</span>`
                  : ''
            }
          </div>
        </div>

        ${
          item.notes && !isExpanded
            ? `<div style="padding:0 12px 5px 38px;font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">📋 ${esc(
                item.notes
              )}</div>`
            : ''
        }

        ${
          item.staffNote
            ? `<div style="padding:0 12px 6px 38px;font-size:11.5px;color:var(--emerald)">💬 <strong>${esc(
                item.assigneeName || 'Staff'
              )}:</strong> ${esc(item.staffNote)}</div>`
            : ''
        }

        <div class="ticker-action-drawer" ${isExpanded ? '' : 'hidden'}>
          ${
            item.notes
              ? `<div style="padding:7px 9px;border-radius:6px;background:var(--bg-card);border:1px solid var(--border-subtle);font-size:11.5px;color:var(--text-secondary)"><strong>Instructions / Notes:</strong> ${esc(
                  item.notes
                )}</div>`
              : ''
          }
          ${delegationStageOverrideHtml}
          ${checklistDrawerHtml}
          <div class="ticker-act-btns">
            ${
              !item.completed
                ? `
              <button type="button" class="t-act-btn primary" data-act="toggle-done" data-id="${esc(item.id)}">${esc(doneVerb)}</button>
              <button type="button" class="t-act-btn" data-act="open-workbench" data-id="${esc(item.id)}">✎ Edit / Plan</button>
              <button type="button" class="t-act-btn wa" data-act="whatsapp" data-id="${esc(item.id)}">
                📲 ${item.isDelegated ? `WhatsApp ${esc(item.assigneeName)}` : 'Delegate / WhatsApp'}
              </button>
              ${
                item.isDelegated
                  ? `<button type="button" class="t-act-btn" data-act="copy-link" data-id="${esc(item.id)}">🔗 Copy Link</button>`
                  : ''
              }
              <button type="button" class="t-act-btn" data-act="set-horizon" data-id="${esc(item.id)}" data-horizon="today">Today</button>
              <button type="button" class="t-act-btn" data-act="set-horizon" data-id="${esc(item.id)}" data-horizon="tomorrow">Tomorrow</button>
              <button type="button" class="t-act-btn" data-act="snooze-1d" data-id="${esc(item.id)}">+24h</button>
              <button type="button" class="t-act-btn" data-act="snooze-3d" data-id="${esc(item.id)}">+3d</button>
              ${
                isHolding
                  ? `<button type="button" class="t-act-btn" data-act="release-now" data-id="${esc(item.id)}">Ready Now</button>`
                  : ''
              }
              <button type="button" class="t-act-btn" data-act="move-cluster" data-id="${esc(item.id)}">Cluster</button>
            `
                : `
              <button type="button" class="t-act-btn" data-act="toggle-done" data-id="${esc(item.id)}">↺ Reopen</button>
            `
            }
            <button type="button" class="t-act-btn danger" data-act="delete" data-id="${esc(item.id)}">✕</button>
          </div>
        </div>

        ${
          isHold && !item.completed && targetAt > 0
            ? `<div class="ticker-progress-bar"><div class="ticker-progress-fill" style="width:${progressPct}%;background:${
                isMatured ? 'var(--emerald)' : 'var(--brass)'
              }"></div></div>`
            : ''
        }
      </div>
    `;
  }

  /* ============================================================================
     TAB 1: EXECUTIVE PLANNING (7-DAY STRIP + 2X4 MATRIX + HORIZON BOARD + BU BOARD)
     ============================================================================ */
  function buildSevenDayHorizonStripHtml(activeItems, now = Date.now()) {
    const baseIso = todayIso();
    const selDate =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : 'all';
    const dayCells = [];

    for (let i = 0; i < 7; i++) {
      const iso = shiftIsoDate(baseIso, i);
      const [yy, mm, dd] = iso.split('-').map(Number);
      const dObj = new Date(yy, mm - 1, dd, 12, 0, 0);
      const dayName =
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : dObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dateShort = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayCount = activeItems.filter((r) => matchesPlanDateFilter(r, iso, now)).length;

      dayCells.push(`
        <button type="button" class="horizon-day-cell ${selDate === iso ? 'active' : ''} ${i === 0 ? 'is-today-cell' : ''}" data-plan-date="${iso}" title="Plan or view items for ${esc(dayName)} (${esc(dateShort)})">
          <div class="horizon-day-top">
            <span class="horizon-day-name">${esc(dayName)}</span>
            ${
              dayCount > 0
                ? `<span class="horizon-day-count has-items tabular">${dayCount}</span>`
                : `<span class="horizon-day-count tabular" style="opacity:0.42">0</span>`
            }
          </div>
          <div class="horizon-day-meta">${esc(dateShort)}</div>
        </button>
      `);
    }

    return `
      <div class="horizon-week-strip">
        <button type="button" class="horizon-day-cell ${selDate === 'all' ? 'active' : ''}" data-plan-date="all" title="Show all active plans across every date">
          <div class="horizon-day-top">
            <span class="horizon-day-name">All Plans</span>
            <span class="horizon-day-count ${activeItems.length > 0 ? 'has-items' : ''} tabular">${activeItems.length}</span>
          </div>
          <div class="horizon-day-meta">All active dates</div>
        </button>
        ${dayCells.join('')}
      </div>
    `;
  }

  function isRecentlyCompleted(r, now = Date.now()) {
    return Boolean(
      r &&
        r.completed &&
        state.recentlyCompletedUntil &&
        Number(state.recentlyCompletedUntil[r.id] || 0) > now
    );
  }

  function buildCompletedArchiveSectionHtml(completedItems, now = Date.now()) {
    const sorted = [...(completedItems || [])].sort(
      (a, b) =>
        Number(b.completedAt || b.updatedAt || b.createdAt || 0) -
        Number(a.completedAt || a.updatedAt || a.createdAt || 0)
    );
    const isOpen = Boolean(state.completedSectionOpen);
    return `
      <div class="completed-archive-card" id="completed-archive-card">
        <div class="completed-archive-head" data-act="toggle-completed-archive">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:var(--emerald-soft);color:var(--emerald);font-weight:900;font-size:12px">✓</span>
            <div>
              <div style="font-size:12.5px;font-weight:800;color:var(--text-primary)">
                Previously Completed Tasks (${sorted.length})
              </div>
              <div style="font-size:11px;color:var(--text-muted)">
                ${
                  sorted.length > 0
                    ? 'Tap to view completed history or ↺ reopen any task'
                    : 'Tasks you check off are saved here so you can review or reopen them anytime'
                }
              </div>
            </div>
          </div>
          <button type="button" class="mini-chip ${isOpen ? 'active' : ''}" data-act="toggle-completed-archive">
            ${isOpen ? '▲ Hide Completed' : `▼ Show Completed (${sorted.length})`}
          </button>
        </div>
        ${
          isOpen
            ? `
          <div class="completed-archive-body">
            ${
              sorted.length > 0
                ? sorted.map((it) => renderTickerRowHtml(it, now)).join('')
                : `<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:12px">No completed tasks yet. Check off any task and it will appear here.</div>`
            }
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  function renderPlanningView() {
    const root = document.getElementById('view-planning');
    if (!root) return;
    const now = Date.now();
    const allActive = state.reminders.filter((r) => !r.completed && !r.deleted);
    const completed = state.reminders
      .filter((r) => r.completed && !r.deleted)
      .sort(
        (a, b) =>
          Number(b.completedAt || b.updatedAt || b.createdAt || 0) -
          Number(a.completedAt || a.updatedAt || a.createdAt || 0)
      );

    const selDate =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : 'all';
    const baseIso = todayIso();
    const active =
      selDate === 'all'
        ? allActive
        : allActive.filter((r) => matchesPlanDateFilter(r, selDate, now));

    const isRadarMode = state.planningMode === 'radar';
    root.classList.toggle('is-radar-mode', isRadarMode);

    const urgentItems = allActive.filter((r) => isReadyNowItem(r, now));
    const todayFocusCount = allActive.filter((r) => matchesPlanDateFilter(r, baseIso, now)).length;

    const toolbarHtml = `
      <div class="planning-toolbar">
        <div class="planning-mode-seg" role="tablist" aria-label="Planning View Mode">
          <button type="button" class="planning-mode-btn ${state.planningMode === 'radar' ? 'active' : ''}" data-planning-mode="radar">
            Categories
          </button>
          <button type="button" class="planning-mode-btn ${state.planningMode === 'horizon' ? 'active' : ''}" data-planning-mode="horizon">
            Timeline (${todayFocusCount} Today)
          </button>
          <button type="button" class="planning-mode-btn ${state.planningMode === 'bus' ? 'active' : ''}" data-planning-mode="bus">
            Business Units
          </button>
          <button type="button" class="planning-mode-btn ${state.planningMode === 'clusters' ? 'active' : ''}" data-planning-mode="clusters">
            List (${active.length})
          </button>
          <button type="button" class="planning-mode-btn ${state.planningMode === 'completed' ? 'active' : ''}" data-planning-mode="completed">
            Completed (${completed.length})
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <button type="button" class="mini-chip" id="btn-auto-plan-today" title="Promote matured holds, urgent items & due-today items into Today">
            Auto-Focus Today
          </button>
          <button type="button" class="mini-chip" id="btn-goto-delegation-studio">
            Delegate
          </button>
          ${
            urgentItems.length > 0
              ? `<button type="button" class="mini-chip active" data-goto-tasks-filter="ready" style="border-color:var(--emerald);color:var(--emerald)">${urgentItems.length} Ready to Verify →</button>`
              : ''
          }
        </div>
      </div>
    `;

    const weekStripHtml = buildSevenDayHorizonStripHtml(allActive, now);
    const activeDateBarHtml =
      selDate !== 'all'
        ? `
      <div class="active-date-context-bar">
        <span>Planning for <strong>${esc(formatIsoFriendly(selDate, true))}</strong> · ${active.length} planned</span>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <button type="button" class="bento-inline-btn" data-open-new-plan-date="${esc(selDate)}">
            + Add Plan for ${esc(formatIsoFriendly(selDate, false))}
          </button>
          <button type="button" class="mini-chip" data-plan-date="all">Show All Dates ✕</button>
        </div>
      </div>
    `
        : '';

    // MODE E: DEDICATED COMPLETED TASKS HISTORY VIEW
    if (state.planningMode === 'completed') {
      root.innerHTML = `
        ${weekStripHtml}
        ${activeDateBarHtml}
        ${toolbarHtml}
        <div class="completed-archive-card" style="margin-top:0">
          <div class="completed-archive-head" style="cursor:default">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:var(--emerald-soft);color:var(--emerald);font-weight:900;font-size:13px">✓</span>
              <div>
                <div style="font-size:13.5px;font-weight:800;color:var(--text-primary)">
                  Previously Completed Plans (${completed.length})
                </div>
                <div style="font-size:11px;color:var(--text-muted)">
                  Tap the green ✓ or <strong>↺ Reopen</strong> on any item to move it back to active plans
                </div>
              </div>
            </div>
            <button type="button" class="mini-chip" data-planning-mode="radar">← Back to Categories</button>
          </div>
          <div class="completed-archive-body" style="max-height:none">
            ${
              completed.length > 0
                ? completed.map((it) => renderTickerRowHtml(it, now)).join('')
                : `<div style="padding:28px;text-align:center;color:var(--text-muted)">No completed plans yet. Check off any plan and it will be archived here.</div>`
            }
          </div>
        </div>
      `;
      return;
    }

    // MODE B: 4-COLUMN EXECUTIVE HORIZON PLAN (Today / Tomorrow / This Week / Backlog)
    if (state.planningMode === 'horizon') {
      const cols = [
        {
          id: 'today',
          title: 'Today',
          sub: 'Execute or verify today'
        },
        {
          id: 'tomorrow',
          title: 'Tomorrow',
          sub: 'Planned for tomorrow'
        },
        {
          id: 'week',
          title: 'This Week & Holds',
          sub: 'Upcoming dates & active timers'
        },
        {
          id: 'backlog',
          title: 'Someday & Ideas',
          sub: 'Unscheduled plans & concepts'
        }
      ];

      const colsHtml = cols
        .map((col) => {
          const colItems = active
            .filter((r) => getEffectiveHorizon(r, now) === col.id)
            .sort((a, b) => {
              const pOrder = { p1: 0, p2: 1, p3: 2 };
              const pa = pOrder[a.priority || 'p3'] ?? 2;
              const pb = pOrder[b.priority || 'p3'] ?? 2;
              if (pa !== pb) return pa - pb;
              return Number(a.matureAt || a.dueAt || a.createdAt || 0) - Number(b.matureAt || b.dueAt || b.createdAt || 0);
            });

          const cardsHtml = colItems.length
            ? colItems
                .map((it) => {
                  const cl = CLUSTERS.find((c) => c.id === it.category) || CLUSTERS[3];
                  const t = Number(it.matureAt || it.dueAt || 0);
                  const isReady = isReadyNowItem(it, now);
                  const steps = Array.isArray(it.checklist) ? it.checklist : [];
                  const doneSteps = steps.filter((s) => s.done).length;
                  const buMeta = BHFIRMS_BUS.find((b) => b.id === it.buId);

                  return `
                    <div class="horizon-task-card" data-open-workbench="${esc(it.id)}">
                      <div class="horizon-task-top">
                        <button type="button" class="bento-micro-check" data-act="toggle-done" data-id="${esc(it.id)}" title="Complete">✓</button>
                        <div class="horizon-task-title">${esc(it.title)}</div>
                      </div>
                      ${
                        it.notes
                          ? `<div style="font-size:11px;color:var(--text-secondary);line-height:1.35">${esc(it.notes.slice(0, 90))}</div>`
                          : ''
                      }
                      <div class="horizon-task-foot">
                        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                          ${it.priority === 'p1' ? `<span class="t-pill p1">P1</span>` : it.priority === 'p2' ? `<span class="t-pill p2">P2</span>` : ''}
                          <span class="t-pill">${esc(cl.shortLabel)}</span>
                          ${buMeta ? `<span class="t-pill">${esc(buMeta.short)}</span>` : ''}
                          ${it.assigneeName ? `<span class="t-pill person">${esc(it.assigneeName)}</span>` : ''}
                          ${steps.length > 0 ? `<span class="t-pill steps tabular">${doneSteps}/${steps.length}</span>` : ''}
                          ${
                            t > 0 && (t > now || isReady || (Boolean(it.hasAlarm) && now >= t))
                              ? `<span class="t-pill ${isReady ? 'matured' : now >= t ? 'p1' : 'timer'} tabular">${
                                  isReady ? 'Ready' : now >= t ? 'Due' : esc(formatCountdown(t, now))
                                }</span>`
                              : it.planDate
                                ? `<span class="t-pill tabular">${esc(formatIsoFriendly(it.planDate, false))}</span>`
                                : ''
                          }
                        </div>
                        <div style="display:flex;align-items:center;gap:3px">
                          ${
                            col.id !== 'today'
                              ? `<button type="button" class="mini-chip" data-act="set-horizon" data-id="${esc(it.id)}" data-horizon="today" style="padding:2px 6px;font-size:10px" title="Move to Today">Today</button>`
                              : `<button type="button" class="mini-chip" data-act="set-horizon" data-id="${esc(it.id)}" data-horizon="tomorrow" style="padding:2px 6px;font-size:10px" title="Defer to Tomorrow">→ Tmrw</button>`
                          }
                          <button type="button" class="mini-chip" data-act="open-workbench" data-id="${esc(it.id)}" style="padding:2px 6px;font-size:10px">✎</button>
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join('')
            : `<div style="padding:18px 12px;text-align:center;color:var(--text-muted);font-size:11.5px;border:1px dashed var(--border-subtle);border-radius:7px">${esc(col.sub)}</div>`;

          return `
            <div class="horizon-col">
              <div class="horizon-col-head">
                <div>
                  <div class="horizon-col-title">${esc(col.title)}</div>
                  <div style="font-size:10.5px;color:var(--text-muted)">${esc(col.sub)}</div>
                </div>
                <span class="bento-count ${colItems.length ? 'active' : ''} tabular">${colItems.length}</span>
              </div>
              <form class="bento-inline-form" data-inline-horizon-form="${col.id}" style="padding:4px 0 6px 0;border-bottom:1px solid var(--border-subtle)">
                <input type="text" class="bento-inline-input" enterkeyhint="done" placeholder="+ Add to ${esc(col.title)}…" required>
                <button type="submit" class="bento-inline-btn">Add</button>
              </form>
              <div class="horizon-col-body">
                ${cardsHtml}
              </div>
            </div>
          `;
        })
        .join('');

      root.innerHTML = `
        ${weekStripHtml}
        ${activeDateBarHtml}
        ${toolbarHtml}
        <div class="horizon-board-grid">
          ${colsHtml}
        </div>
        ${buildCompletedArchiveSectionHtml(completed, now)}
      `;
      return;
    }

    // MODE C: 6-CARD BHFIRMS BUSINESS UNIT PORTFOLIO BOARD
    if (state.planningMode === 'bus') {
      const buCards = [
        { id: 'hospitality', title: 'Hospitality & Resorts', sub: 'Blanca · La Una · Palms · Voile · Platinum' },
        { id: 'manufacturing', title: 'Manufacturing & Construction', sub: 'WTC · BBConstruction · Lions Transport' },
        { id: 'trading', title: 'Trading Operations', sub: 'Korri Auto · Shacman Trucks & Parts' },
        { id: 'realestate_ins', title: 'Real Estate & Insurance', sub: 'Properties Portfolio · Insurance Brokerage' },
        { id: 'holding', title: 'Bdeir Holding & Finance', sub: 'Corporate · Treasury · Payments · Tech' },
        { id: 'personal', title: 'Personal, Family & Ideas', sub: 'Home · Verify Checks · Strategic Concepts' }
      ];

      const cardsHtml = buCards
        .map((bu) => {
          const buItems = active.filter((r) => {
            if (bu.id === 'personal') {
              return !r.buId && (r.category === 'family' || r.category === 'ideas' || r.category === 'want_to_do' || r.category === 'verify' || r.category === 'shipping');
            }
            if (bu.id === 'holding') {
              return r.buId === 'holding' || r.buId === 'tech' || (!r.buId && (r.category === 'work' || r.category === 'payments' || r.category === 'people'));
            }
            return r.buId === bu.id;
          });
          const delCount = buItems.filter((r) => r.isDelegated).length;

          return `
            <div class="bu-plan-card">
              <div class="bu-plan-head">
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${esc(bu.title)}</div>
                  <div style="font-size:10.5px;color:var(--text-muted)">${esc(bu.sub)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:4px">
                  ${delCount > 0 ? `<span class="t-pill person tabular">${delCount} delegated</span>` : ''}
                  <span class="bento-count ${buItems.length ? 'active' : ''} tabular">${buItems.length}</span>
                </div>
              </div>
              <form class="bento-inline-form" data-inline-bu-form="${bu.id}" style="padding:4px 0 6px 0;border-bottom:1px solid var(--border-subtle)">
                <input type="text" class="bento-inline-input" enterkeyhint="done" placeholder="+ Add plan for ${esc(bu.title.split('&')[0].trim())}…" required>
                <button type="submit" class="bento-inline-btn">Add</button>
              </form>
              <div class="bu-plan-body">
                ${
                  buItems.length
                    ? buItems.map((it) => renderTickerRowHtml(it, now)).join('')
                    : `<div style="padding:18px 10px;text-align:center;color:var(--text-muted);font-size:11.5px">No active plans for ${esc(bu.title)}</div>`
                }
              </div>
            </div>
          `;
        })
        .join('');

      root.innerHTML = `
        ${weekStripHtml}
        ${activeDateBarHtml}
        ${toolbarHtml}
        <div class="bu-board-grid">
          ${cardsHtml}
        </div>
        ${buildCompletedArchiveSectionHtml(completed, now)}
      `;
      return;
    }

    // MODE D: STRUCTURED REGISTER (CLUSTERS / SUBTOPICS)
    if (state.planningMode !== 'radar') {
      const filtered =
        state.boardFilter === 'completed'
          ? completed
          : state.boardFilter === 'all'
            ? active
            : active.filter((r) => (r.category || 'work') === state.boardFilter);

      let listHtml = '';
      if (state.boardFilter === 'all') {
        const groups = new Map();
        for (const c of CLUSTERS) {
          const cItems = active.filter((r) => (r.category || 'work') === c.id);
          if (cItems.length) {
            groups.set(c.label, cItems);
          }
        }
        listHtml = Array.from(groups.entries())
          .map(
            ([gName, items]) => `
            <div class="ticker-group-header">
              <span>${esc(gName)}</span>
              <span>${items.length}</span>
            </div>
            ${items.map((it) => renderTickerRowHtml(it, now)).join('')}
          `
          )
          .join('');
      } else {
        listHtml = filtered.map((it) => renderTickerRowHtml(it, now)).join('');
      }

      root.innerHTML = `
        ${weekStripHtml}
        ${activeDateBarHtml}
        ${toolbarHtml}
        <div class="view-filter-bar">
          <div class="horiz-pill-strip">
            <button type="button" class="filter-pill ${state.boardFilter === 'all' ? 'active' : ''}" data-board-filter="all">
              All Active (${active.length})
            </button>
            <button type="button" class="filter-pill ${state.boardFilter === 'completed' ? 'active' : ''}" data-board-filter="completed">
              Completed (${completed.length})
            </button>
            ${CLUSTERS.map((c) => {
              const cnt = active.filter((r) => (r.category || 'work') === c.id).length;
              return `
                <button type="button" class="filter-pill ${state.boardFilter === c.id ? 'active' : ''}" data-board-filter="${c.id}">
                  ${esc(c.shortLabel)} (${cnt})
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="ticker-list">
          ${
            listHtml ||
            `<div style="padding:28px;text-align:center;color:var(--text-muted)">No plans in this category filter yet.</div>`
          }
        </div>
        ${state.boardFilter === 'all' ? buildCompletedArchiveSectionHtml(completed, now) : ''}
      `;
      return;
    }

    // MODE A: CALM 2X4 CATEGORY MATRIX
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 720;
    const maxPreviewRows = isMobileViewport ? 8 : 5;

    // Include items checked within the last 2.2s so checking multiple tasks in a group on iPhone never shifts or collapses the list mid-check
    const getClusterDisplayItems = (clusterId) =>
      state.reminders.filter((r) => {
        if (!r || r.deleted) return false;
        if ((r.category || 'work') !== clusterId) return false;
        if (!r.completed) {
          return selDate === 'all' ? true : matchesPlanDateFilter(r, selDate, now);
        }
        return isRecentlyCompleted(r, now);
      });

    const orderedClusters = isMobileViewport
      ? [...CLUSTERS].sort((a, b) => {
          const aHas = getClusterDisplayItems(a.id).length > 0 ? 1 : 0;
          const bHas = getClusterDisplayItems(b.id).length > 0 ? 1 : 0;
          return bHas - aHas;
        })
      : CLUSTERS;

    const tilesHtml = orderedClusters.map((c) => {
      const items = getClusterDisplayItems(c.id);
      const activeCount = items.filter((r) => !r.completed).length;
      const isComposerOpen = state.activeInlineClusterId === c.id;
      const tileCls = ['bento-tile', items.length === 0 ? 'is-empty-mobile' : '']
        .filter(Boolean)
        .join(' ');

      const topRows = items.slice(0, maxPreviewRows).map((it) => {
        const isChecked = Boolean(it.completed);
        const t = Number(it.matureAt || it.dueAt || 0);
        const isReady = !isChecked && isReadyNowItem(it, now);
        const steps = Array.isArray(it.checklist) ? it.checklist : [];
        const doneSteps = steps.filter((s) => s.done).length;
        const buMeta = BHFIRMS_BUS.find((b) => b.id === it.buId);
        const rIso = itemIsoDate(it);
        const priDot =
          !isChecked && it.priority === 'p1'
            ? `<span style="width:6px;height:6px;border-radius:50%;background:var(--crimson);flex-shrink:0" title="P1 Critical"></span>`
            : !isChecked && it.priority === 'p2'
              ? `<span style="width:6px;height:6px;border-radius:50%;background:var(--amber);flex-shrink:0" title="P2 High"></span>`
              : '';

        let tagTxt = '';
        let tagCls = '';
        if (isChecked) {
          tagTxt = '✓ Done';
          tagCls = 'matured';
        } else if (it.delegationStatus === 'done') {
          tagTxt = 'Verify';
          tagCls = 'matured';
        } else if (isReady) {
          tagTxt = 'Ready';
          tagCls = 'matured';
        } else if (it.assigneeName) {
          tagTxt = it.assigneeName;
          tagCls = 'person';
        } else if (steps.length > 0) {
          tagTxt = `${doneSteps}/${steps.length}`;
        } else if (t > now) {
          tagTxt = formatCountdown(t, now);
          tagCls = 'timer';
        } else if (rIso && rIso > baseIso) {
          tagTxt = rIso === shiftIsoDate(baseIso, 1) ? 'Tomorrow' : formatIsoFriendly(rIso, false);
        } else if (buMeta) {
          tagTxt = buMeta.short;
        }

        return `
          <div class="bento-micro-row ${isChecked ? 'is-checked' : ''}" data-open-workbench="${esc(it.id)}" title="Tap circle to complete or tap title to edit">
            <button
              type="button"
              class="bento-micro-check ${isChecked ? 'checked' : ''}"
              data-act="toggle-done"
              data-id="${esc(it.id)}"
              title="${isChecked ? 'Undo complete' : 'Complete'}"
            >✓</button>
            ${priDot}
            <span class="bento-micro-text">${esc(it.title)}</span>
            ${
              tagTxt
                ? `<span class="bento-micro-tag ${tagCls} tabular">${esc(tagTxt)}</span>`
                : ''
            }
          </div>
        `;
      });

      const emptyStateHtml = `
        <div class="bento-empty">
          <div class="bento-empty-desc">${esc(c.sub)}</div>
          ${
            !isComposerOpen
              ? `<button type="button" class="bento-empty-add-btn" data-toggle-card-add="${c.id}">+ Add plan</button>`
              : ''
          }
        </div>
      `;

      const composerHtml = isComposerOpen
        ? `
          <div class="bento-card-composer">
            <form class="bento-inline-form" data-inline-cluster-form="${c.id}">
              <input
                type="text"
                class="bento-inline-input"
                enterkeyhint="done"
                name="inlineTitle"
                data-card-inline-input="${c.id}"
                placeholder="Add plan to ${esc(c.shortLabel)}… (Enter to save)"
                autocomplete="off"
              >
              <button type="submit" class="bento-inline-btn">Add</button>
              <button type="button" class="bento-inline-btn ghost" data-card-open-details="${c.id}" title="Open full composer with date, time & checklist">Details</button>
              <button type="button" class="bento-inline-btn ghost" data-close-card-add="${c.id}" aria-label="Close" style="padding:0 7px">✕</button>
            </form>
          </div>
        `
        : '';

      const svgIcon = CLUSTER_SVGS[c.id] || c.icon;

      return `
        <div class="${tileCls}" data-cluster-id="${c.id}">
          <div class="bento-head">
            <div class="bento-title-wrap" data-open-cluster="${c.id}" title="View all ${esc(c.label)} items">
              <span class="bento-icon">${svgIcon}</span>
              <div class="bento-title">${esc(isMobileViewport ? c.shortLabel : c.label)}</div>
            </div>
            <div class="bento-count-wrap">
              <span class="bento-count ${activeCount ? 'active' : ''} tabular">${activeCount}</span>
              <button
                type="button"
                class="bento-add-icon-btn ${isComposerOpen ? 'is-open' : ''}"
                data-toggle-card-add="${c.id}"
                title="Add plan to ${esc(c.label)}"
                aria-label="Add plan to ${esc(c.label)}"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>

          <div class="bento-items">
            ${topRows.length ? topRows.join('') : emptyStateHtml}
            ${
              items.length > maxPreviewRows
                ? `<button type="button" class="mini-chip" data-open-cluster="${c.id}" style="align-self:flex-start;font-size:10.5px;margin-top:4px">+${items.length - maxPreviewRows} more →</button>`
                : ''
            }
          </div>

          ${composerHtml}
        </div>
      `;
    }).join('');

    root.innerHTML = `
      ${weekStripHtml}
      ${activeDateBarHtml}
      ${toolbarHtml}
      <div class="bento-radar-grid">
        ${tilesHtml}
      </div>
      ${buildCompletedArchiveSectionHtml(completed, now)}
    `;
  }

  /* ============================================================================
     TAB 2: TASKS & WAIT TIMERS (READY NOW, ACTION TASKS, VERIFY, SHIPPING, HOLDS)
     ============================================================================ */
  function isTimerItem(r) {
    if (!r || r.completed || r.deleted) return false;
    if (r.category === 'ideas' || r.category === 'want_to_do') return Boolean(r.matureAt > 0);
    return Boolean(
      r.matureAt > 0 ||
        r.kind === 'wait' ||
        r.kind === 'payment' ||
        r.category === 'verify' ||
        r.category === 'shipping' ||
        r.category === 'payments'
    );
  }

  function isDelegatedItem(r) {
    if (!r || r.completed || r.deleted) return false;
    if (r.category === 'ideas' || r.category === 'want_to_do') return Boolean(r.isDelegated || r.assigneeName);
    return Boolean(r.isDelegated || r.assigneeName || r.category === 'people');
  }

  function isReadyNowItem(r, now = Date.now()) {
    if (!r || r.completed || r.deleted) return false;
    if (r.delegationStatus === 'done') return true;
    if (!isHoldOrTimerRecord(r)) return false;
    const t = Number(r.matureAt || r.dueAt || 0);
    return t > 0 && now >= t;
  }

  function isActionTaskItem(r) {
    if (!r || r.completed || r.deleted) return false;
    if (r.category === 'ideas' || r.category === 'want_to_do') return false;
    return !isTimerItem(r);
  }

  function renderTasksView() {
    const root = document.getElementById('view-tasks');
    if (!root) return;
    const now = Date.now();
    const active = state.reminders.filter((r) => !r.completed && !r.deleted);
    const completed = state.reminders
      .filter((r) => r.completed && !r.deleted)
      .sort(
        (a, b) =>
          Number(b.completedAt || b.updatedAt || b.createdAt || 0) -
          Number(a.completedAt || a.updatedAt || a.createdAt || 0)
      );
    const readyList = active.filter((r) => isReadyNowItem(r, now));
    const actionList = active.filter(isActionTaskItem);
    const timerList = active.filter(isTimerItem);
    const verifyList = active.filter((r) => r.category === 'verify');
    const shippingList = active.filter((r) => r.category === 'shipping');
    const paymentList = active.filter((r) => r.category === 'payments');
    const recurList = active.filter((r) => r.recur && r.recur !== 'none');
    const ideasList = active.filter((r) => r.category === 'ideas' || r.category === 'want_to_do' || r.kind === 'parked');

    const filters = [
      { id: 'all', lbl: `All Active (${active.length})` },
      { id: 'done', lbl: `✓ Completed (${completed.length})` },
      { id: 'ready', lbl: `Ready Now (${readyList.length})` },
      { id: 'action', lbl: `Action Tasks (${actionList.length})` },
      { id: 'timers', lbl: `Wait Timers (${timerList.length})` },
      { id: 'verify', lbl: `Verify / App (${verifyList.length})` },
      { id: 'shipping', lbl: `Shipping (${shippingList.length})` },
      { id: 'payments', lbl: `Payment Holds (${paymentList.length})` },
      { id: 'recurring', lbl: `Recurring (${recurList.length})` },
      { id: 'ideas', lbl: `Ideas & Parked (${ideasList.length})` }
    ];

    const fId = state.taskFilter || 'all';
    let contentHtml = '';

    if (fId === 'all') {
      const sections = [
        {
          title: `Ready Now & Matured Holds`,
          items: readyList
        },
        {
          title: `Action Tasks & Executive Follow-Ups`,
          items: actionList.filter((r) => !isReadyNowItem(r, now))
        },
        {
          title: `Active Wait Timers (Verify, Shipping & Payment Holds)`,
          items: timerList
            .filter((r) => !isReadyNowItem(r, now))
            .sort((a, b) => Number(a.matureAt || a.dueAt || 0) - Number(b.matureAt || b.dueAt || 0))
        },
        {
          title: `Want To Do & Strategic Ideas`,
          items: active.filter(
            (r) =>
              (r.category === 'ideas' || r.category === 'want_to_do') &&
              !isReadyNowItem(r, now) &&
              !isTimerItem(r)
          )
        }
      ].filter((s) => s.items.length > 0);

      contentHtml = sections.length
        ? sections
            .map(
              (s) => `
            <div class="ticker-group-header">
              <span>${esc(s.title)}</span>
              <span>${s.items.length}</span>
            </div>
            ${s.items.map((it) => renderTickerRowHtml(it, now)).join('')}
          `
            )
            .join('')
        : `<div style="padding:28px;text-align:center;color:var(--text-muted)">All clear! Capture a task, @Person delegation, verify check, shipping countdown, or payment hold in the bar above.</div>`;
    } else {
      const mapByFilter = {
        ready: readyList,
        action: actionList,
        timers: timerList.sort((a, b) => Number(a.matureAt || a.dueAt || 0) - Number(b.matureAt || b.dueAt || 0)),
        verify: verifyList,
        shipping: shippingList,
        payments: paymentList,
        recurring: recurList,
        ideas: ideasList,
        done: completed
      };
      const rows = mapByFilter[fId] || active;
      contentHtml = rows.length
        ? rows.map((it) => renderTickerRowHtml(it, now)).join('')
        : `<div style="padding:28px;text-align:center;color:var(--text-muted)">No items in this filter right now.</div>`;
    }

    root.innerHTML = `
      <div class="view-filter-bar">
        <div class="horiz-pill-strip">
          ${filters
            .map(
              (f) => `
            <button type="button" class="filter-pill ${fId === f.id ? 'active' : ''}" data-task-filter="${f.id}">
              ${esc(f.lbl)}
            </button>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="ticker-list">
        ${contentHtml}
      </div>
      ${fId === 'all' ? buildCompletedArchiveSectionHtml(completed, now) : ''}
    `;
  }

  /* ============================================================================
     TAB 3: BHFIRMS DELEGATION STUDIO, 4-STAGE PIPELINE & WORKLOAD MATRIX
     ============================================================================ */
  function renderDelegatedCardHtml(it, now = Date.now()) {
    const buMeta = BHFIRMS_BUS.find((b) => b.id === it.buId);
    const t = Number(it.dueAt || it.matureAt || 0);
    const isOverdue = Boolean(it.hasAlarm) && t > 0 && now > t && it.delegationStatus !== 'done';
    const steps = Array.isArray(it.checklist) ? it.checklist : [];
    const doneSteps = steps.filter((s) => s.done).length;
    const curStage = it.delegationStatus || 'assigned';

    return `
      <div class="del-card" data-del-card-id="${esc(it.id)}">
        <div class="del-card-top">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0">
            <span class="t-pill person">👤 ${esc(it.assigneeName || 'Unassigned')}</span>
            ${buMeta ? `<span class="t-pill">${esc(buMeta.short)}</span>` : ''}
            ${it.priority === 'p1' ? `<span class="t-pill p1">P1</span>` : it.priority === 'p2' ? `<span class="t-pill p2">P2</span>` : ''}
            ${steps.length > 0 ? `<span class="t-pill steps tabular">${doneSteps}/${steps.length} steps</span>` : ''}
          </div>
          ${
            t > 0 && (t > now || isOverdue)
              ? `<span class="t-pill ${isOverdue ? 'p1' : 'timer'} tabular">${
                  isOverdue ? 'Due' : esc(formatCountdown(t, now))
                }</span>`
              : it.planDate
                ? `<span class="t-pill tabular">${esc(formatIsoFriendly(it.planDate, false))}</span>`
                : ''
          }
        </div>

        <div class="del-card-title" data-act="open-workbench" data-id="${esc(it.id)}" style="cursor:pointer" title="Click to open Task Workbench">
          ${esc(it.title)}
        </div>

        ${
          it.notes
            ? `<div style="font-size:11px;color:var(--text-secondary);line-height:1.35">${esc(it.notes.slice(0, 110))}</div>`
            : ''
        }

        ${
          it.staffNote
            ? `<div style="padding:5px 8px;border-radius:6px;background:var(--emerald-soft);border:1px solid rgba(16,185,129,0.3);font-size:11px;color:var(--emerald)">
                💬 <strong>${esc(it.assigneeName || 'Staff')}:</strong> ${esc(it.staffNote)}
              </div>`
            : ''
        }

        <div class="del-card-foot">
          <div class="del-stage-stepper">
            ${['assigned', 'sent', 'seen', 'working', 'done']
              .map(
                (stKey) => `
              <button
                type="button"
                class="del-stage-pill ${curStage === stKey ? `active-${stKey}` : ''}"
                data-act="set-del-stage"
                data-id="${esc(it.id)}"
                data-stage="${stKey}"
                title="Set stage to ${stKey}"
              >${stKey === 'assigned' ? 'Assigned' : stKey === 'sent' ? 'Sent' : stKey === 'seen' ? 'Seen' : stKey === 'working' ? 'Working' : 'Done'}</button>
            `
              )
              .join('')}
          </div>

          <div style="display:flex;align-items:center;gap:4px">
            <button type="button" class="mini-chip wa-btn" data-act="whatsapp" data-id="${esc(it.id)}" style="padding:3px 7px;font-size:10.5px">
              📲 ${curStage === 'assigned' ? 'Send' : 'Nudge'}
            </button>
            <button type="button" class="mini-chip" data-act="open-workbench" data-id="${esc(it.id)}" style="padding:3px 7px;font-size:10.5px" title="Edit task & steps">✎</button>
            <button type="button" class="mini-chip active" data-act="toggle-done" data-id="${esc(it.id)}" style="padding:3px 7px;font-size:10.5px;border-color:var(--emerald);color:var(--emerald)" title="Verify & Complete">✓ Verify</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDelegatedView() {
    const root = document.getElementById('view-delegated');
    if (!root) return;
    const now = Date.now();
    const delegated = state.reminders.filter(isDelegatedItem);
    const completedDelegated = state.reminders
      .filter(
        (r) =>
          r &&
          r.completed &&
          !r.deleted &&
          (r.isDelegated || r.assigneeName || r.category === 'people')
      )
      .sort(
        (a, b) =>
          Number(b.completedAt || b.updatedAt || b.createdAt || 0) -
          Number(a.completedAt || a.updatedAt || a.createdAt || 0)
      );
    const viewMode = state.delegatedViewMode || 'pipeline';

    const filtered = delegated.filter((r) => {
      if (state.delegatedBuFilter !== 'all' && r.buId !== state.delegatedBuFilter) return false;
      if (state.delegatedStatusFilter === 'waiting') {
        return !r.delegationStatus || r.delegationStatus === 'assigned' || r.delegationStatus === 'sent';
      }
      if (state.delegatedStatusFilter !== 'all' && r.delegationStatus !== state.delegatedStatusFilter) {
        return false;
      }
      return true;
    });

    // Collect all known team members (from roster + any active delegated tasks)
    const rosterPeople = [...state.teamRoster];
    for (const r of delegated) {
      const nm = String(r.assigneeName || '').trim();
      if (nm && !rosterPeople.some((m) => m.name.toLowerCase() === nm.toLowerCase())) {
        rosterPeople.push({
          id: `inferred_${nm.toLowerCase()}`,
          name: nm,
          role: 'Team Member',
          bu: r.buId || 'holding',
          phone: ''
        });
      }
    }

    const selectedStudioPerson = state.studioAssigneeName || state.draft.assigneeName || (rosterPeople[0]?.name || '');
    const selectedStudioBu = state.studioAssigneeBu || state.draft.assigneeBu || (rosterPeople[0]?.bu || '');

    // Fast Delegation Composer Deck
    const composerDeckHtml = `
      <div class="del-command-deck">
        <div class="del-deck-top">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="del-deck-title">Executive Delegation Studio</span>
            <span style="font-size:11px;color:var(--text-muted)">Assign a task with deliverable checkpoints &amp; dispatch a live status link via WhatsApp</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <button type="button" class="mini-chip" id="btn-manage-roster">
              👥 Team Roster (${state.teamRoster.length})
            </button>
            <button type="button" class="mini-chip" id="btn-quick-add-person">
              + Add Person
            </button>
          </div>
        </div>

        <div class="horiz-pill-strip" style="padding-bottom:2px">
          <span style="font-size:11px;font-weight:700;color:var(--text-secondary);flex-shrink:0">Assign to:</span>
          ${
            rosterPeople.length > 0
              ? rosterPeople
                  .map((m) => {
                    const isSel = selectedStudioPerson.toLowerCase() === m.name.toLowerCase();
                    const bMeta = BHFIRMS_BUS.find((b) => b.id === m.bu);
                    return `
                      <button
                        type="button"
                        class="mini-chip ${isSel ? 'active' : ''}"
                        data-studio-pick-person="${esc(m.name)}"
                        data-studio-pick-bu="${esc(m.bu || '')}"
                      >
                        👤 ${esc(m.name)}${bMeta ? ` · ${esc(bMeta.short)}` : ''}
                      </button>
                    `;
                  })
                  .join('')
              : `<span style="font-size:11px;color:var(--text-muted)">Type a person's name below (they will be saved to your Team Roster automatically)</span>`
          }
        </div>

        <form id="del-studio-form" style="display:flex;flex-direction:column;gap:6px" autocomplete="off">
          <div class="del-composer-row">
            <input
              type="text"
              id="del-studio-person"
              class="del-composer-input"
              style="flex:0 0 155px"
              value="${esc(selectedStudioPerson)}"
              placeholder="Assignee (e.g. Ali)"
              required
            >
            <input
              type="text"
              id="del-studio-title"
              class="del-composer-input"
              placeholder="What needs to be delivered? (e.g. Inspect filter press pressure & send photo)"
              required
            >
            <select id="del-studio-bu" class="del-composer-select">
              <option value="">Unit (Auto)</option>
              ${BHFIRMS_BUS.map(
                (b) => `<option value="${b.id}" ${selectedStudioBu === b.id ? 'selected' : ''}>${esc(b.short)}</option>`
              ).join('')}
            </select>
            <select id="del-studio-priority" class="del-composer-select">
              <option value="p2">P2 · High</option>
              <option value="p1">P1 · Critical</option>
              <option value="p3">P3 · Normal</option>
            </select>
            <select id="del-studio-wait" class="del-composer-select">
              <option value="today">Today 18:00</option>
              <option value="1d">+24h SLA</option>
              <option value="tonight">Tonight 20:30</option>
              <option value="2d">+48h SLA</option>
              <option value="7d">In 7 Days</option>
              <option value="park">No Timer</option>
            </select>
          </div>

          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <input
              type="text"
              id="del-studio-steps"
              class="del-composer-input"
              style="font-size:11.5px;padding:6px 10px"
              placeholder="Deliverable steps or instructions (optional, separate steps with | e.g. Check invoice | Confirm bank transfer | Upload receipt)"
            >
            <button type="submit" class="t-act-btn primary" data-studio-submit="assign" style="padding:7px 12px;flex-shrink:0">
              ✓ Assign &amp; Track
            </button>
            <button type="submit" class="t-act-btn wa" data-studio-submit="whatsapp" style="padding:7px 12px;flex-shrink:0">
              📲 Assign &amp; WhatsApp
            </button>
          </div>
        </form>
      </div>
    `;

    const toolbarHtml = `
      <div class="planning-toolbar">
        <div class="planning-mode-seg" role="tablist">
          <button type="button" class="planning-mode-btn ${viewMode === 'pipeline' ? 'active' : ''}" data-del-view-mode="pipeline">
            4-Stage Pipeline (${filtered.length})
          </button>
          <button type="button" class="planning-mode-btn ${viewMode === 'people' ? 'active' : ''}" data-del-view-mode="people">
            By Person &amp; Digest (${rosterPeople.length})
          </button>
          <button type="button" class="planning-mode-btn ${viewMode === 'list' ? 'active' : ''}" data-del-view-mode="list">
            Full Register
          </button>
          <button type="button" class="planning-mode-btn ${viewMode === 'completed' ? 'active' : ''}" data-del-view-mode="completed">
            ✓ Completed (${completedDelegated.length})
          </button>
        </div>

        <div class="horiz-pill-strip">
          <button type="button" class="filter-pill ${state.delegatedBuFilter === 'all' ? 'active' : ''}" data-del-bu="all">
            All BUs (${delegated.length})
          </button>
          ${BHFIRMS_BUS.map(
            (b) => `
            <button type="button" class="filter-pill ${state.delegatedBuFilter === b.id ? 'active' : ''}" data-del-bu="${b.id}">
              ${esc(b.short)}
            </button>
          `
          ).join('')}
        </div>
      </div>
    `;

    // VIEW 4: COMPLETED DELEGATIONS
    if (viewMode === 'completed') {
      root.innerHTML = `
        ${composerDeckHtml}
        ${toolbarHtml}
        <div class="ticker-list">
          ${
            completedDelegated.length
              ? completedDelegated.map((it) => renderTickerRowHtml(it, now)).join('')
              : `<div style="padding:28px;text-align:center;color:var(--text-muted)">No completed delegated tasks yet.</div>`
          }
        </div>
      `;
      return;
    }

    // VIEW 1: 4-STAGE ACCOUNTABILITY PIPELINE
    if (viewMode === 'pipeline') {
      const stages = [
        {
          id: 'assigned',
          title: '1. Assigned · To Dispatch',
          sub: 'Ready to send via WhatsApp',
          accent: 'var(--text-muted)',
          items: filtered.filter((r) => !r.delegationStatus || r.delegationStatus === 'assigned')
        },
        {
          id: 'sent',
          title: '2. Dispatched · Awaiting Seen',
          sub: 'Link sent, waiting for staff open',
          accent: 'var(--brass)',
          items: filtered.filter((r) => r.delegationStatus === 'sent')
        },
        {
          id: 'working',
          title: '3. Seen & In Progress',
          sub: 'Staff acknowledged or working',
          accent: 'var(--steel)',
          items: filtered.filter(
            (r) =>
              r.delegationStatus === 'seen' ||
              r.delegationStatus === 'working' ||
              r.delegationStatus === 'blocked'
          )
        },
        {
          id: 'done',
          title: '4. Staff Completed · Verify',
          sub: 'Ready for your sign-off',
          accent: 'var(--emerald)',
          items: filtered.filter((r) => r.delegationStatus === 'done')
        }
      ];

      const colsHtml = stages
        .map(
          (st) => `
        <div class="del-stage-col">
          <div class="del-stage-head">
            <div>
              <div class="del-stage-title">${esc(st.title)}</div>
              <div style="font-size:10px;color:var(--text-muted)">${esc(st.sub)}</div>
            </div>
            <span class="bento-count ${st.items.length ? 'active' : ''} tabular">${st.items.length}</span>
          </div>
          <div class="del-stage-body">
            ${
              st.items.length
                ? st.items.map((it) => renderDelegatedCardHtml(it, now)).join('')
                : `<div style="padding:18px 10px;text-align:center;color:var(--text-muted);font-size:11px;border:1px dashed var(--border-subtle);border-radius:7px">No tasks in this stage</div>`
            }
          </div>
        </div>
      `
        )
        .join('');

      root.innerHTML = `
        ${composerDeckHtml}
        ${toolbarHtml}
        <div class="del-pipeline-grid">
          ${colsHtml}
        </div>
      `;
      return;
    }

    // VIEW 2: TEAM WORKLOAD & CONSOLIDATED DIGEST MATRIX
    if (viewMode === 'people') {
      const peopleCardsHtml = rosterPeople.length
        ? rosterPeople
            .map((m) => {
              const pItems = filtered.filter(
                (r) => String(r.assigneeName || '').toLowerCase() === m.name.toLowerCase()
              );
              const waitingCnt = pItems.filter(
                (r) => !r.delegationStatus || r.delegationStatus === 'assigned' || r.delegationStatus === 'sent'
              ).length;
              const workingCnt = pItems.filter(
                (r) => r.delegationStatus === 'seen' || r.delegationStatus === 'working'
              ).length;
              const verifyCnt = pItems.filter((r) => r.delegationStatus === 'done').length;
              const buMeta = BHFIRMS_BUS.find((b) => b.id === m.bu);
              const initial = String(m.name || '?')
                .trim()
                .charAt(0)
                .toUpperCase();

              return `
                <div class="person-workload-card">
                  <div class="person-workload-head">
                    <div style="display:flex;align-items:center;gap:9px">
                      <div class="delegate-member-avatar">${esc(initial)}</div>
                      <div>
                        <div style="font-size:13.5px;font-weight:800;color:var(--text-primary)">${esc(m.name)}</div>
                        <div style="font-size:11px;color:var(--text-muted)">
                          ${buMeta ? esc(buMeta.short) : 'BHFIRMS'}${m.role ? ` · ${esc(m.role)}` : ''}${
                            m.phone ? ` · 📱 ${esc(m.phone)}` : ''
                          }
                        </div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px">
                      ${
                        pItems.length > 0
                          ? `<button type="button" class="mini-chip wa-btn" data-act="person-digest" data-person="${esc(m.name)}" title="Send 1 consolidated WhatsApp message with all ${pItems.length} active tasks">
                              📲 Digest (${pItems.length})
                            </button>`
                          : ''
                      }
                    </div>
                  </div>

                  <div class="person-workload-kpis">
                    <div class="person-kpi-cell">
                      <div class="person-kpi-num tabular">${pItems.length}</div>
                      <div class="person-kpi-lbl">Active</div>
                    </div>
                    <div class="person-kpi-cell">
                      <div class="person-kpi-num tabular" style="color:var(--brass-bright)">${waitingCnt}</div>
                      <div class="person-kpi-lbl">Awaiting</div>
                    </div>
                    <div class="person-kpi-cell">
                      <div class="person-kpi-num tabular" style="color:var(--steel)">${workingCnt}</div>
                      <div class="person-kpi-lbl">Working</div>
                    </div>
                    <div class="person-kpi-cell">
                      <div class="person-kpi-num tabular" style="color:var(--emerald)">${verifyCnt}</div>
                      <div class="person-kpi-lbl">To Verify</div>
                    </div>
                  </div>

                  <form class="bento-inline-form" data-inline-person-form="${esc(m.name)}" data-inline-person-bu="${esc(m.bu || '')}" style="padding:6px 10px;border-top:none;border-bottom:1px solid var(--border-subtle)">
                    <input type="text" class="bento-inline-input" placeholder="+ Assign task to ${esc(m.name)}…" required>
                    <button type="submit" class="bento-inline-btn">+ Assign</button>
                  </form>

                  <div style="padding:8px;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto">
                    ${
                      pItems.length
                        ? pItems.map((it) => renderDelegatedCardHtml(it, now)).join('')
                        : `<div style="padding:14px;text-align:center;color:var(--text-muted);font-size:11.5px">No active tasks assigned to ${esc(m.name)}</div>`
                    }
                  </div>
                </div>
              `;
            })
            .join('')
        : `<div style="padding:28px;text-align:center;color:var(--text-muted)">Add your first team member using the studio above or tap <strong>👥 Team Roster</strong>.</div>`;

      root.innerHTML = `
        ${composerDeckHtml}
        ${toolbarHtml}
        <div class="people-matrix-grid">
          ${peopleCardsHtml}
        </div>
      `;
      return;
    }

    // VIEW 3: FULL DELEGATION REGISTER
    const byPerson = new Map();
    for (const r of filtered) {
      const inferred =
        r.assigneeName ||
        (r.subTag ? r.subTag.replace(/^👤\s*/, '').trim() : '') ||
        extractSmartContext(r.title).assigneeName ||
        'General Follow-Up';
      if (!byPerson.has(inferred)) byPerson.set(inferred, []);
      byPerson.get(inferred).push(r);
    }

    root.innerHTML = `
      ${composerDeckHtml}
      ${toolbarHtml}
      <div class="ticker-list">
        ${
          byPerson.size
            ? Array.from(byPerson.entries())
                .map(([person, items]) => {
                  const member = state.teamRoster.find(
                    (m) => m.name.toLowerCase() === person.toLowerCase()
                  );
                  const buMeta = BHFIRMS_BUS.find((b) => b.id === member?.bu);
                  return `
                  <div class="ticker-group-header">
                    <span>👤 ${esc(person)} ${buMeta ? `· ${esc(buMeta.short)}` : ''} ${member?.role ? `(${esc(member.role)})` : ''}</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      <button type="button" class="mini-chip wa-btn" data-act="person-digest" data-person="${esc(person)}" style="padding:2px 7px;font-size:10px">📲 Send Digest (${items.length})</button>
                      <span>${items.length} task${items.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                  ${items.map((it) => renderTickerRowHtml(it, now)).join('')}
                `;
                })
                .join('')
            : `<div style="padding:28px;text-align:center;color:var(--text-muted)">No delegated tasks in this filter yet. Use the <strong>Executive Delegation Studio</strong> above to assign and track a task.</div>`
        }
      </div>
    `;
  }

  /* ============================================================================
     TAB 4: THE SCORE (DAILY 100-POINT PERSONAL DISCIPLINE LEDGER)
     ============================================================================ */
  function renderScoreView() {
    const root = document.getElementById('view-score');
    if (!root) return;

    const sc = computeDayScore(state.scoreDate);
    const rec = getDayRecord(state.scoreDate);
    const scoreColor =
      sc.total >= 75 ? 'var(--emerald)' : sc.total >= 50 ? 'var(--brass-bright)' : 'var(--crimson)';

    // Last 7 days strip
    const days = [];
    const baseD = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseD.getTime() - i * 86400000);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const daySc = computeDayScore(iso);
      days.push({
        iso,
        lbl: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: daySc.total
      });
    }

    root.innerHTML = `
      <div class="score-summary-card">
        <div class="score-top-row">
          <div style="display:flex;align-items:baseline;gap:10px">
            <span class="score-big-num tabular" style="color:${scoreColor}">${sc.total}%</span>
            <span style="font-size:12px;color:var(--text-secondary)">
              Start <strong>50%</strong> · Do's <strong style="color:var(--emerald)">+${sc.doEarned}%</strong> · Don'ts <strong style="color:var(--crimson)">-${sc.dontLost}%</strong> (${sc.dontKept}% kept)
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <button type="button" class="mini-chip" id="btn-score-today">Today (${todayIso()})</button>
            <button type="button" class="mini-chip" id="btn-score-reset">Reset to 50%</button>
          </div>
        </div>

        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${sc.total}%;background:${scoreColor}"></div>
        </div>

        <div class="score-week-strip">
          ${days
            .map(
              (dy) => `
            <div class="week-day-pill ${dy.iso === state.scoreDate ? 'active' : ''}" data-score-date="${dy.iso}">
              <div style="font-size:10px;color:var(--text-muted)">${esc(dy.lbl)}</div>
              <div class="tabular" style="font-size:12.5px;font-weight:800;color:${
                dy.total >= 75 ? 'var(--emerald)' : dy.total >= 50 ? 'var(--brass-bright)' : 'var(--crimson)'
              }">${dy.total}%</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="score-two-col">
        <div class="habit-col-box">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:800;color:var(--emerald)">
            <span>✅ 5 Daily Do's (+10% Full · +5% Half)</span>
            <span class="tabular">+${sc.doEarned}% / 50%</span>
          </div>
          ${DAILY_DOS.map((d) => {
            const val = rec.dos?.[d.id] || 'none';
            return `
              <div class="habit-compact-row">
                <div>
                  <div style="font-size:13px;font-weight:700">${d.icon} ${esc(d.label)}</div>
                  <div style="font-size:10.5px;color:var(--text-muted)">${esc(d.sub)}</div>
                </div>
                <div class="habit-seg-btns">
                  <button type="button" class="h-seg-btn ${val === 'none' ? 'active-amber' : ''}" data-set-habit="do:${d.id}:none">0%</button>
                  <button type="button" class="h-seg-btn ${val === 'half' ? 'active-amber' : ''}" data-set-habit="do:${d.id}:half">+5%</button>
                  <button type="button" class="h-seg-btn ${val === 'full' ? 'active-emerald' : ''}" data-set-habit="do:${d.id}:full">+10%</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="habit-col-box">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:800;color:var(--crimson)">
            <span>🛡️ 5 Daily Don'ts (Start 50% · -5% · -10%)</span>
            <span class="tabular">${sc.dontKept}% / 50% Kept</span>
          </div>
          ${DAILY_DONTS.map((dn) => {
            const val = rec.donts?.[dn.id] || 'intact';
            return `
              <div class="habit-compact-row">
                <div>
                  <div style="font-size:13px;font-weight:700">${dn.icon} ${esc(dn.label)}</div>
                  <div style="font-size:10.5px;color:var(--text-muted)">${esc(dn.sub)}</div>
                </div>
                <div class="habit-seg-btns">
                  <button type="button" class="h-seg-btn ${val === 'intact' ? 'active-emerald' : ''}" data-set-habit="dont:${dn.id}:intact">10% Kept</button>
                  <button type="button" class="h-seg-btn ${val === 'half' ? 'active-amber' : ''}" data-set-habit="dont:${dn.id}:half">-5%</button>
                  <button type="button" class="h-seg-btn ${val === 'slip' ? 'active-crimson' : ''}" data-set-habit="dont:${dn.id}:slip">-10%</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ============================================================================
     TAB 5: PRAYING TIMES (SHIA JA'FARI: FAJR, DOHOR, MAGHRIB + GPS & 7-DAY TABLE)
     ============================================================================ */
  function buildPrayerDashboardHtml(now = Date.now()) {
    const cfg = normalizePrayerConfig(state.prayerConfig);
    const status = getNextShiaPrayerStatus(now);
    const today = status.todaySched;
    const nxt = status.nextPrayer;
    const cd = nxt ? formatCountdown(nxt.epochMs, now) : '';
    const activeSubsCount = getAllActivePushSubscriptions().length;

    const slots = today.prayers;
    const cardsHtml = slots
      .map((p) => {
        const isNext = nxt && nxt.id === p.id && !nxt.isTomorrow;
        const pEnabled = cfg.enabled && p.enabled;
        const adj = Number(p.offsetMin || 0);
        const adjSign = adj > 0 ? `+${adj}m` : `${adj}m`;
        return `
          <div class="prayer-detail-card ${isNext ? 'is-next' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
              <div>
                <div style="font-size:13.5px;font-weight:800">${p.icon} ${esc(p.label)}</div>
                <div style="font-size:12px;color:var(--brass-bright);font-weight:700">${esc(p.arabic)}</div>
              </div>
              <button
                type="button"
                class="mini-chip ${pEnabled ? 'active' : ''}"
                data-prayer-toggle="${p.id}"
                title="Toggle notifications for ${esc(p.label)}"
              >${pEnabled ? '🔔 On' : '🔕 Muted'}</button>
            </div>

            <div class="prayer-detail-time tabular">${esc(p.time24)}</div>
            <div style="font-size:10.5px;color:var(--text-secondary)">${esc(p.time12)} · Window until ${esc(p.windowEnd24)}</div>
            <div style="font-size:10px;color:var(--text-muted)">${esc(p.windowNote)}</div>

            <div class="prayer-adj-row">
              <span style="color:var(--text-muted)">Offset: <strong class="tabular">${adjSign}</strong></span>
              <div style="display:flex;gap:4px">
                <button type="button" class="prayer-adj-btn" data-prayer-adj="${p.id}:-1" title="-1 minute">-1m</button>
                <button type="button" class="prayer-adj-btn" data-prayer-adj="${p.id}:1" title="+1 minute">+1m</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Build 7-day Shia timetable to show day-of-year progression
    const weekRows = [];
    const baseIso = todayIso();
    for (let i = 0; i < 7; i++) {
      const iso = shiftIsoDate(baseIso, i);
      const sch = computeShiaPrayerTimesForDate(iso, cfg);
      const [yy, mm, dd] = iso.split('-').map(Number);
      const dObj = new Date(yy, mm - 1, dd, 12, 0, 0);
      const dayLabel =
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : dObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
      weekRows.push({
        dayLabel,
        dateIso: sch.isoDate,
        dayOfYear: sch.dayOfYear,
        decl: sch.declinationDeg,
        fajr: sch.fajr.time24,
        sunrise: sch.sunrise.time24,
        dohor: sch.dhuhr.time24,
        sunset: sch.sunset.time24,
        maghrib: sch.maghrib.time24,
        isToday: i === 0
      });
    }

    const preOptions = [0, 5, 10, 15, 20];

    return `
      <div class="prayer-sheet-hero">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;width:100%">
          <div>
            <div style="font-size:11px;font-weight:800;color:var(--brass-bright);text-transform:uppercase;letter-spacing:0.06em">
              🕌 Next Shia Prayer · ${esc(today.locationName)}
            </div>
            <div style="font-size:20px;font-weight:800;margin-top:2px">
              ${nxt ? `${nxt.icon} ${esc(nxt.label)} — ${esc(nxt.arabic)} at <span class="tabular" style="color:var(--emerald)">${esc(nxt.time24)}</span>` : 'Calculating…'}
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">
              ⏳ Countdown: <strong class="tabular" style="color:var(--text-primary)">in ${esc(cd)}</strong>
              · Sunrise <span class="tabular">${esc(today.sunrise.time24)}</span>
              · Sunset <span class="tabular">${esc(today.sunset.time24)}</span>
              · Midnight <span class="tabular">${esc(today.midnight.time24)}</span>
            </div>
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="mini-chip ${cfg.enabled ? 'active' : ''}" id="btn-prayer-master-toggle">
              ${cfg.enabled ? '🔔 Master Alerts: ON' : '🔕 Master Alerts: OFF'}
            </button>
            <button type="button" class="mini-chip ${cfg.chime ? 'active' : ''}" id="btn-prayer-sound-toggle">
              ${cfg.chime ? '🔊 Chime: ON' : '🔇 Chime: OFF'}
            </button>
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);padding-top:4px;border-top:1px solid var(--border-subtle);width:100%">
          <span>📅 Date: <strong class="tabular">${esc(today.isoDate)}</strong> (Day <strong>#${today.dayOfYear}/${today.daysInYear}</strong>)</span>
          <span>☀️ Solar Declination δ: <strong class="tabular">${today.declinationDeg >= 0 ? '+' : ''}${today.declinationDeg}°</strong></span>
          <span>⏱️ Equation of Time: <strong class="tabular">${today.eqtMinutes >= 0 ? '+' : ''}${today.eqtMinutes}m</strong></span>
          <span>📱 Push Devices Armed: <strong style="color:var(--emerald)">${activeSubsCount}</strong></span>
        </div>
      </div>

      <div class="prayer-cards-grid">
        ${cardsHtml}
      </div>

      <div class="prayer-loc-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <div>
            <div style="font-size:12.5px;font-weight:800">📍 Location, GPS &amp; Push Delivery</div>
            <div style="font-size:11px;color:var(--text-muted)">
              Active: <strong>${esc(cfg.locationName)}</strong> (<span class="tabular">${cfg.lat.toFixed(4)}°, ${cfg.lng.toFixed(4)}°</span> · ${esc(cfg.timeZone)})
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="t-act-btn primary" id="btn-prayer-gps">📍 Auto-Detect GPS</button>
            <button type="button" class="t-act-btn wa" id="btn-prayer-test-push">📲 Send Test Prayer Push</button>
            <button type="button" class="t-act-btn" id="btn-prayer-sub-device">🔔 Enable This Device</button>
          </div>
        </div>

        <div style="font-size:11px;color:var(--text-secondary);font-weight:700">Quick City Presets:</div>
        <div class="horiz-pill-strip" style="flex-wrap:wrap">
          ${PRAYER_LOCATION_PRESETS.map((p) => {
            const isMatch = Math.abs(p.lat - cfg.lat) < 0.03 && Math.abs(p.lng - cfg.lng) < 0.03;
            return `
              <button type="button" class="mini-chip ${isMatch ? 'active' : ''}" data-prayer-preset="${p.id}">
                ${esc(p.short)}
              </button>
            `;
          }).join('')}
        </div>

        <form id="prayer-custom-loc-form" class="prayer-loc-form-grid">
          <input type="text" id="prayer-loc-label" value="${esc(cfg.locationName)}" placeholder="City / Label" style="min-width:0;padding:6px 8px;border-radius:7px;background:var(--bg-ink);border:1px solid var(--border-subtle);font-size:12px">
          <input type="number" step="0.0001" id="prayer-loc-lat" value="${cfg.lat}" placeholder="Lat" required style="min-width:0;padding:6px 8px;border-radius:7px;background:var(--bg-ink);border:1px solid var(--border-subtle);font-size:12px">
          <input type="number" step="0.0001" id="prayer-loc-lng" value="${cfg.lng}" placeholder="Lng" required style="min-width:0;padding:6px 8px;border-radius:7px;background:var(--bg-ink);border:1px solid var(--border-subtle);font-size:12px">
          <input type="text" id="prayer-loc-tz" value="${esc(cfg.timeZone)}" placeholder="Timezone (e.g. Asia/Beirut)" required style="min-width:0;padding:6px 8px;border-radius:7px;background:var(--bg-ink);border:1px solid var(--border-subtle);font-size:12px">
          <button type="submit" class="capture-submit-btn" style="padding:6px 10px;font-size:11.5px">Save</button>
        </form>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding-top:4px;border-top:1px solid var(--border-subtle)">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary)">Shia Angle Method:</span>
            ${SHIA_METHODS.map(
              (m) => `
              <button type="button" class="mini-chip ${cfg.method === m.id ? 'active' : ''}" data-prayer-method="${m.id}" title="${esc(m.label)}">
                ${esc(m.short)}
              </button>
            `
            ).join('')}
          </div>

          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary)">Pre-Reminder:</span>
            ${preOptions
              .map(
                (mins) => `
              <button type="button" class="mini-chip ${cfg.preRemindMin === mins ? 'active' : ''}" data-prayer-pre="${mins}">
                ${mins === 0 ? 'Exact Only' : `${mins}m before`}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="prayer-loc-box" style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:800">📅 7-Day Shia Prayer Schedule (Day-of-Year Solar Progression)</div>
        <div style="overflow-x:auto">
          <table class="prayer-week-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Day #</th>
                <th>🌅 Fajr</th>
                <th>🌄 Sunrise</th>
                <th>☀️ Dohor</th>
                <th>🌇 Sunset</th>
                <th>🌙 Maghrib</th>
              </tr>
            </thead>
            <tbody>
              ${weekRows
                .map(
                  (r) => `
                <tr class="${r.isToday ? 'today-row' : ''}">
                  <td>${esc(r.dayLabel)}</td>
                  <td class="tabular">#${r.dayOfYear} (${r.decl >= 0 ? '+' : ''}${r.decl}°)</td>
                  <td class="tabular" style="color:var(--emerald)">${esc(r.fajr)}</td>
                  <td class="tabular" style="color:var(--text-muted)">${esc(r.sunrise)}</td>
                  <td class="tabular" style="color:var(--brass-bright)">${esc(r.dohor)}</td>
                  <td class="tabular" style="color:var(--text-muted)">${esc(r.sunset)}</td>
                  <td class="tabular" style="color:var(--emerald)">${esc(r.maghrib)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPrayersView() {
    const root = document.getElementById('view-prayers');
    if (!root) return;
    root.innerHTML = buildPrayerDashboardHtml(Date.now());
  }

  function openPrayerSheet() {
    state.openClusterSheetId = '';
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.hidden = true;
    state.activeTab = 'prayers';
    renderAll();
  }

  /* ============================================================================
     SLIDE-UP SHEETS: CLUSTER DRILLDOWN & BHFIRMS TEAM ROSTER MANAGER
     ============================================================================ */
  function openClusterSheet(clusterId) {
    state.openClusterSheetId = clusterId;
    state.openSheetKind = 'cluster';
    document.getElementById('sheet-dialog')?.classList.remove('is-composer-sheet');
    const cluster = CLUSTERS.find((c) => c.id === clusterId) || CLUSTERS[0];
    const backdrop = document.getElementById('sheet-backdrop');
    const titleWrap = document.getElementById('sheet-title-wrap');
    const body = document.getElementById('sheet-body');
    if (!backdrop || !titleWrap || !body) return;

    const now = Date.now();
    const items = state.reminders.filter(
      (r) => !r.completed && !r.deleted && (r.category || 'work') === clusterId
    );
    const completedInCluster = state.reminders
      .filter((r) => r.completed && !r.deleted && (r.category || 'work') === clusterId)
      .sort(
        (a, b) =>
          Number(b.completedAt || b.updatedAt || b.createdAt || 0) -
          Number(a.completedAt || a.updatedAt || a.createdAt || 0)
      );
    const svgIcon = CLUSTER_SVGS[cluster.id] || cluster.icon;

    titleWrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span class="bento-icon">${svgIcon}</span>
        <div>
          <strong style="font-size:15px">${esc(cluster.label)} (${items.length} active${completedInCluster.length ? ` · ${completedInCluster.length} done` : ''})</strong>
          <div style="font-size:11px;color:var(--text-muted)">${esc(cluster.sub)}</div>
        </div>
      </div>
    `;

    body.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <input
          type="text"
          id="sheet-quick-input"
          enterkeyhint="done"
          class="capture-input"
          style="flex:1;min-width:180px;padding:8px 10px;border-radius:9px;background:var(--bg-card);border:1px solid var(--border-strong)"
          placeholder="Add plan to ${esc(cluster.shortLabel)}… (Enter to save)"
        >
        <button type="button" class="capture-submit-btn" id="sheet-quick-add" data-cluster="${cluster.id}">Add</button>
        <button type="button" class="capture-details-btn" data-open-new-plan-cluster="${cluster.id}">+ Details</button>
      </div>
      <div class="ticker-list" style="max-height:62vh">
        ${
          items.length
            ? items.map((it) => renderTickerRowHtml(it, now)).join('')
            : `<div style="padding:20px;text-align:center;color:var(--text-muted)">No active items in ${esc(cluster.label)}.</div>`
        }
        ${
          completedInCluster.length
            ? `
          <div class="ticker-group-header" style="margin-top:8px">
            <span>✓ Previously Completed in ${esc(cluster.shortLabel)}</span>
            <span>${completedInCluster.length}</span>
          </div>
          ${completedInCluster.map((it) => renderTickerRowHtml(it, now)).join('')}
        `
            : ''
        }
      </div>
    `;
    backdrop.hidden = false;
  }

  function assignExistingTaskToMember(taskId, mem, sendWhatsApp = false) {
    const item = state.reminders.find((r) => r.id === taskId);
    if (!item || !mem) return false;
    item.assigneeId = mem.id || '';
    item.assigneeName = mem.name;
    item.buId = mem.bu || item.buId || '';
    item.subTag = `👤 ${mem.name}`;
    item.subGroup = item.subTag;
    item.isDelegated = true;
    if (!item.delegationStatus) item.delegationStatus = 'assigned';
    if (!item.taskToken) item.taskToken = randomToken(12);
    item.updatedAt = Date.now();
    saveLocalState();
    renderAll();
    syncAll(item).catch(() => {});
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.hidden = true;
    if (sendWhatsApp) {
      dispatchWhatsAppDelegation(item.id);
    } else {
      showToast(`Assigned to 👤 ${mem.name}`);
    }
    return true;
  }

  function openTeamRosterSheet(rawOpts = false) {
    const backdrop = document.getElementById('sheet-backdrop');
    const titleWrap = document.getElementById('sheet-title-wrap');
    const body = document.getElementById('sheet-body');
    if (!backdrop || !titleWrap || !body) return;

    const opts =
      typeof rawOpts === 'boolean'
        ? {
            pickForDraft: rawOpts,
            existingTaskId: '',
            showAddForm: state.teamRoster.length === 0,
            manageMode: false,
            editMemberId: '',
            submitAction: 'assign'
          }
        : {
            pickForDraft: Boolean(rawOpts.pickForDraft),
            existingTaskId: String(rawOpts.existingTaskId || ''),
            showAddForm:
              rawOpts.showAddForm !== undefined
                ? Boolean(rawOpts.showAddForm)
                : state.teamRoster.length === 0 || Boolean(rawOpts.editMemberId),
            manageMode: Boolean(rawOpts.manageMode),
            editMemberId: String(rawOpts.editMemberId || ''),
            submitAction: String(rawOpts.submitAction || 'assign')
          };

    state.rosterSheetOpts = opts;
    state.openClusterSheetId = '';
    state.openSheetKind = 'roster';
    document.getElementById('sheet-dialog')?.classList.remove('is-composer-sheet');

    const existingTask = opts.existingTaskId
      ? state.reminders.find((r) => r.id === opts.existingTaskId)
      : null;
    const isDelegatingFlow = opts.pickForDraft || Boolean(existingTask);
    const hasRoster = state.teamRoster.length > 0;
    const editingMember = opts.editMemberId
      ? state.teamRoster.find((m) => m.id === opts.editMemberId)
      : null;
    const showForm = !hasRoster || opts.showAddForm || Boolean(editingMember);

    titleWrap.innerHTML = `
      <div>
        <strong style="font-size:15.5px">${
          existingTask
            ? '📲 Delegate Task'
            : opts.pickForDraft
              ? '👥 Delegate Task'
              : '👥 Team Roster & Delegation'
        }</strong>
        <div style="font-size:11.5px;color:var(--text-muted)">${
          existingTask
            ? 'Pick who handles this task or send a 1-tap WhatsApp tracking link'
            : hasRoster
              ? 'Tap any team member to assign in 1 tap, or send directly on WhatsApp'
              : 'Add a person below to delegate tasks & send live WhatsApp status links'
        }</div>
      </div>
    `;

    const timeChips = [
      { k: 'auto', lbl: '✨ Auto (24h)' },
      { k: 'tonight', lbl: '🌙 Tonight' },
      { k: '1d', lbl: '🌅 Tomorrow' },
      { k: '2d', lbl: '⏳ In 2d' },
      { k: '7d', lbl: '📅 In 7d' },
      { k: 'park', lbl: '📌 No Timer' }
    ];

    const taskCardHtml = existingTask
      ? `
        <div class="delegate-sheet-task-card">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:var(--brass)">Task to Delegate</div>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${esc(existingTask.title)}</div>
        </div>
      `
      : opts.pickForDraft
        ? `
        <div class="delegate-sheet-task-card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
            <label for="delegate-sheet-task-input" style="font-size:11.5px;font-weight:800;color:var(--brass-bright)">
              📋 What needs to be done?
            </label>
            ${
              state.draft.assigneeName
                ? `<span class="t-pill person">Selected: 👤 ${esc(state.draft.assigneeName)}</span>`
                : `<span style="font-size:11px;color:var(--text-muted)">Step 1: Task · Step 2: Tap Person</span>`
            }
          </div>
          <input
            type="text"
            id="delegate-sheet-task-input"
            class="delegate-sheet-input"
            value="${esc(state.draft.text)}"
            placeholder="Type task here (or leave empty to just select @Person)…"
          >
          <div class="horiz-pill-strip" style="flex-wrap:wrap">
            ${timeChips
              .map(
                (c) => `
              <button type="button" class="mini-chip ${state.draft.waitChoice === c.k ? 'active' : ''}" data-sheet-wait-chip="${c.k}">
                ${esc(c.lbl)}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `
        : '';

    const sectionBarHtml = hasRoster
      ? `
        <div class="delegate-section-bar">
          <span class="delegate-section-title">Your Team (${state.teamRoster.length})</span>
          <div style="display:flex;align-items:center;gap:6px">
            <button type="button" class="mini-chip ${showForm && !editingMember ? 'active' : ''}" id="btn-toggle-roster-add">
              ${showForm && !editingMember ? '✕ Hide Form' : '+ Add Person'}
            </button>
            <button type="button" class="mini-chip ${opts.manageMode ? 'active' : ''}" id="btn-toggle-roster-manage">
              ${opts.manageMode ? '✓ Done Editing' : '✎ Edit List'}
            </button>
          </div>
        </div>
      `
      : '';

    const formCardHtml = showForm
      ? `
        <form id="roster-add-form" class="roster-form-card" autocomplete="off">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <strong style="font-size:13px;color:var(--text-primary)">
              ${editingMember ? `✎ Edit ${esc(editingMember.name)}` : '👤 Add Team Member'}
            </strong>
            ${
              hasRoster
                ? `<button type="button" class="mini-chip" id="btn-cancel-roster-form">Cancel</button>`
                : `<span style="font-size:11px;color:var(--text-muted)">Saved for 1-tap future delegation</span>`
            }
          </div>

          <input
            type="text"
            id="roster-name"
            class="roster-field"
            placeholder="Person's name (required, e.g. Ali)"
            value="${esc(editingMember ? editingMember.name : '')}"
            required
          >

          <input
            type="tel"
            id="roster-phone"
            class="roster-field"
            placeholder="WhatsApp number (optional, e.g. +961 3 123 456)"
            value="${esc(editingMember ? editingMember.phone || '' : '')}"
          >

          <div class="roster-form-grid-2">
            <select id="roster-bu" class="roster-field">
              ${BHFIRMS_BUS.map(
                (b) =>
                  `<option value="${b.id}" ${(editingMember?.bu || 'holding') === b.id ? 'selected' : ''}>${esc(
                    b.short
                  )} — ${esc(b.label.replace(/^[^\s]+\s*/, ''))}</option>`
              ).join('')}
            </select>
            <input
              type="text"
              id="roster-role"
              class="roster-field"
              placeholder="Role / Title (optional)"
              value="${esc(editingMember ? editingMember.role || '' : '')}"
            >
          </div>

          <div class="roster-form-actions">
            ${
              editingMember
                ? `<button type="submit" class="delegate-btn-assign primary" data-roster-submit="save">✓ Save Changes</button>`
                : isDelegatingFlow
                  ? `
                    <button type="submit" class="delegate-btn-assign primary" data-roster-submit="assign">
                      ✓ Save &amp; Assign
                    </button>
                    <button type="submit" class="delegate-btn-wa" data-roster-submit="whatsapp">
                      📲 Save &amp; WhatsApp
                    </button>
                  `
                  : `<button type="submit" class="delegate-btn-assign primary" data-roster-submit="save">+ Add to Team</button>`
            }
          </div>
        </form>
      `
      : '';

    const memberRowsHtml = hasRoster
      ? `
        <div class="delegate-member-list">
          ${state.teamRoster
            .map((m) => {
              const buMeta = BHFIRMS_BUS.find((b) => b.id === m.bu);
              const initial = String(m.name || '?')
                .trim()
                .charAt(0)
                .toUpperCase();
              const isSelected =
                state.draft.assigneeId === m.id ||
                (state.draft.assigneeName &&
                  state.draft.assigneeName.toLowerCase() === String(m.name || '').toLowerCase());
              const hasDraftText = Boolean(state.draft.text.trim()) || Boolean(existingTask);

              return `
                <div class="delegate-member-card ${isSelected ? 'is-selected' : ''}">
                  <div class="delegate-member-main" data-pick-member="${esc(m.id)}" title="Tap to assign to ${esc(m.name)}">
                    <div class="delegate-member-avatar">${esc(initial)}</div>
                    <div class="delegate-member-info">
                      <div class="delegate-member-name-row">
                        <span>${esc(m.name)}</span>
                        <span class="t-pill">${esc(buMeta ? buMeta.short : m.bu)}</span>
                      </div>
                      <div class="delegate-member-sub">
                        ${m.role ? `${esc(m.role)} · ` : ''}${
                          m.phone
                            ? `<span style="color:var(--emerald)">📱 ${esc(m.phone)}</span>`
                            : 'No WhatsApp number set'
                        }
                      </div>
                    </div>
                  </div>
                  <div class="delegate-member-actions">
                    ${
                      opts.manageMode
                        ? `
                          <button type="button" class="t-act-btn" data-edit-member="${esc(m.id)}">✎ Edit</button>
                          <button type="button" class="t-act-btn danger" data-del-member="${esc(m.id)}">🗑️ Remove</button>
                        `
                        : `
                          <button type="button" class="delegate-btn-assign ${hasDraftText ? 'primary' : ''}" data-pick-member="${esc(m.id)}">
                            ${hasDraftText ? '✓ Assign' : '✓ Select'}
                          </button>
                          <button type="button" class="delegate-btn-wa" data-wa-member="${esc(m.id)}" title="Assign &amp; send via WhatsApp">
                            📲 WhatsApp
                          </button>
                        `
                    }
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `
      : '';

    body.innerHTML = `
      ${taskCardHtml}
      ${sectionBarHtml}
      ${formCardHtml}
      ${memberRowsHtml}
    `;
    backdrop.hidden = false;

    const sheetTaskInp = document.getElementById('delegate-sheet-task-input');
    if (sheetTaskInp) {
      sheetTaskInp.addEventListener('input', () => {
        state.draft.text = sheetTaskInp.value;
        const mainInp = document.getElementById('capture-input');
        if (mainInp) mainInp.value = sheetTaskInp.value;
        renderLiveAdvisorDrawer();
        const hasTxt = Boolean(state.draft.text.trim());
        body.querySelectorAll('.delegate-btn-assign[data-pick-member]').forEach((btn) => {
          btn.textContent = hasTxt ? '✓ Assign' : '✓ Select';
          btn.classList.toggle('primary', hasTxt);
        });
      });
    }
  }

  function closeActiveSheet() {
    const backdrop = document.getElementById('sheet-backdrop');
    if (
      state.openSheetKind === 'notifications' &&
      Array.isArray(state.sheetOpenedWithUnreadIds) &&
      state.sheetOpenedWithUnreadIds.length > 0
    ) {
      const viewedIds = new Set(state.sheetOpenedWithUnreadIds);
      state.sheetOpenedWithUnreadIds = [];
      markNotificationsChecked((n) => n && viewedIds.has(n.id), true);
    }
    state.openClusterSheetId = '';
    state.openTaskWorkbenchId = '';
    state.openSheetKind = '';
    state.newPlanForm = null;
    document.getElementById('sheet-dialog')?.classList.remove('is-composer-sheet');
    if (backdrop) backdrop.hidden = true;
  }

  function syncNewPlanDomFieldsToState() {
    const f = state.newPlanForm;
    if (!f) return;
    const tEl = document.getElementById('np-title');
    if (tEl) f.title = tEl.value;
    const dEl = document.getElementById('np-plan-date');
    if (dEl) f.planDate = dEl.value;
    const tmEl = document.getElementById('np-plan-time');
    if (tmEl) f.planTime = tmEl.value;
    const recEl = document.getElementById('np-recur');
    if (recEl) f.recur = recEl.value;
    const priEl = document.getElementById('np-priority');
    if (priEl) f.priority = priEl.value;
    const buEl = document.getElementById('np-bu');
    if (buEl) f.buId = buEl.value;
    const asgEl = document.getElementById('np-assignee');
    if (asgEl) f.assigneeName = asgEl.value;
    const ntEl = document.getElementById('np-notes');
    if (ntEl) f.notes = ntEl.value;
    const stEl = document.getElementById('np-step-input');
    if (stEl) f.pendingStep = stEl.value;
  }

  function renderNewPlanSheetBody(focusSelector = '') {
    const f = state.newPlanForm;
    const body = document.getElementById('sheet-body');
    const titleWrap = document.getElementById('sheet-title-wrap');
    if (!f || !body || !titleWrap) return;

    titleWrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
        <div>
          <strong style="font-size:15.5px">New Plan</strong>
          <div style="font-size:11.5px;color:var(--text-muted)">Set when, category &amp; optional checklist — or use <strong>+ Save &amp; Add Another</strong> for multiple plans</div>
        </div>
      </div>
    `;

    const baseIso = todayIso();
    const tomIso = shiftIsoDate(baseIso, 1);
    const whenPills = [
      { k: 'today', lbl: 'Today' },
      { k: 'tomorrow', lbl: 'Tomorrow' },
      { k: 'week', lbl: 'This Week' },
      { k: 'date', lbl: 'Pick Date' },
      { k: 'timer', lbl: 'Wait Timer' },
      { k: 'backlog', lbl: 'Someday' }
    ];

    const holdPills = [
      { k: '3h', lbl: '+3 Hours' },
      { k: '1d', lbl: '+24 Hours' },
      { k: '2d', lbl: '+2 Days' },
      { k: '5d', lbl: '+5 Days (Shipping)' },
      { k: '7d', lbl: '+7 Days' }
    ];

    let scheduleDetailHtml = '';
    if (f.whenMode === 'timer') {
      scheduleDetailHtml = `
        <div class="np-when-pills" style="margin-top:4px">
          ${holdPills
            .map(
              (hp) => `
            <button type="button" class="mini-chip ${f.holdChoice === hp.k ? 'active' : ''}" data-np-hold="${hp.k}">
              ${esc(hp.lbl)}
            </button>
          `
            )
            .join('')}
        </div>
      `;
    } else if (f.whenMode === 'backlog') {
      scheduleDetailHtml = `
        <div style="font-size:11.5px;color:var(--text-muted);padding:4px 2px">
          Saved to Someday / Ideas with no date or alarm until you schedule it.
        </div>
      `;
    } else {
      const effectiveIso =
        f.planDate ||
        (f.whenMode === 'tomorrow' ? tomIso : f.whenMode === 'week' ? shiftIsoDate(baseIso, 3) : baseIso);
      scheduleDetailHtml = `
        <div class="np-datetime-grid">
          <div class="np-field-wrap">
            <label class="np-sublabel" for="np-plan-date">Date</label>
            <input type="date" id="np-plan-date" class="np-input" value="${esc(effectiveIso)}">
          </div>
          <div class="np-field-wrap">
            <label class="np-sublabel" for="np-plan-time">Reminder Time (Optional)</label>
            <input type="time" id="np-plan-time" class="np-input" value="${esc(f.planTime || '')}">
          </div>
          <div class="np-field-wrap">
            <label class="np-sublabel" for="np-recur">Repeat</label>
            <select id="np-recur" class="np-input">
              <option value="none" ${(!f.recur || f.recur === 'none') ? 'selected' : ''}>One-time</option>
              <option value="daily" ${f.recur === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${f.recur === 'weekly' ? 'selected' : ''}>Weekly</option>
            </select>
          </div>
        </div>
      `;
    }

    const activeClusterId = f.clusterId || detectCluster(f.title || '', '').id;
    const steps = Array.isArray(f.checklist) ? f.checklist : [];
    const hasAssignee = Boolean(String(f.assigneeName || '').trim());

    body.innerHTML = `
      <form id="new-plan-form" class="np-form" autocomplete="off">
        <div class="np-section">
          <label class="np-label" for="np-title">
            <span>What are you planning?</span>
          </label>
          <input
            type="text"
            id="np-title"
            class="np-title-input"
            value="${esc(f.title || '')}"
            placeholder="e.g. Review Q4 plant maintenance, Order spare parts, Weekend trip…"
            required
          >
        </div>

        <div class="np-section">
          <div class="np-label">
            <span>When</span>
            <span id="np-when-summary" style="text-transform:none;letter-spacing:0;font-weight:600;color:var(--text-secondary)">
              ${
                f.whenMode === 'backlog'
                  ? 'Someday (unscheduled)'
                  : f.whenMode === 'timer'
                    ? 'Active countdown timer'
                    : esc(formatIsoFriendly(f.planDate || baseIso, true))
              }
            </span>
          </div>
          <div class="np-when-pills">
            ${whenPills
              .map(
                (wp) => `
              <button type="button" class="np-pill-btn ${f.whenMode === wp.k ? 'active' : ''}" data-np-when="${wp.k}">
                ${esc(wp.lbl)}
              </button>
            `
              )
              .join('')}
          </div>
          ${scheduleDetailHtml}
        </div>

        <div class="np-section">
          <div class="np-label">
            <span>Category</span>
            <span id="np-cat-hint" style="text-transform:none;letter-spacing:0;font-weight:500">${
              f.manualCluster ? 'Selected' : 'Auto-detected as you type'
            }</span>
          </div>
          <div class="np-cat-grid">
            ${CLUSTERS.map((c) => {
              const svg = CLUSTER_SVGS[c.id] || '';
              return `
                <button
                  type="button"
                  class="np-cat-btn ${activeClusterId === c.id ? 'active' : ''}"
                  data-np-cat="${c.id}"
                >
                  ${svg}
                  <span>${esc(c.shortLabel)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="np-section">
          <div class="np-label">
            <span>Checklist Steps (Optional)</span>
            <span style="text-transform:none;letter-spacing:0;font-weight:500">${steps.length} step${steps.length === 1 ? '' : 's'}</span>
          </div>
          <div class="checklist-drawer-box" style="background:var(--bg-subtle)">
            ${steps
              .map(
                (st, idx) => `
              <div class="checklist-step-row">
                <span class="checklist-step-check" style="font-size:9px;color:var(--text-muted)">${idx + 1}</span>
                <span style="flex:1">${esc(st.text)}</span>
                <button type="button" class="mini-chip" data-np-del-step="${idx}" style="padding:1px 6px;font-size:10px" title="Remove step">✕</button>
              </div>
            `
              )
              .join('')}
            <div style="display:flex;gap:6px">
              <input
                type="text"
                id="np-step-input"
                class="bento-inline-input"
                enterkeyhint="done"
                value="${esc(f.pendingStep || '')}"
                placeholder="+ Type a step and press Enter…"
              >
              <button type="button" class="bento-inline-btn ghost" id="btn-np-add-step">+ Add</button>
            </div>
          </div>
        </div>

        <div class="np-section">
          <div class="np-label"><span>Details &amp; Delegation (Optional)</span></div>
          <div class="np-meta-grid-3">
            <div class="np-field-wrap">
              <label class="np-sublabel" for="np-priority">Priority</label>
              <select id="np-priority" class="np-input">
                <option value="p3" ${(!f.priority || f.priority === 'p3') ? 'selected' : ''}>Normal</option>
                <option value="p2" ${f.priority === 'p2' ? 'selected' : ''}>P2 · High</option>
                <option value="p1" ${f.priority === 'p1' ? 'selected' : ''}>P1 · Critical</option>
              </select>
            </div>
            <div class="np-field-wrap">
              <label class="np-sublabel" for="np-bu">Business Unit</label>
              <select id="np-bu" class="np-input">
                <option value="">Personal / General</option>
                ${BHFIRMS_BUS.map(
                  (b) => `<option value="${b.id}" ${f.buId === b.id ? 'selected' : ''}>${esc(b.short)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="np-field-wrap">
              <label class="np-sublabel" for="np-assignee">Delegate To (@Staff)</label>
              <input
                type="text"
                id="np-assignee"
                class="np-input"
                value="${esc(f.assigneeName || '')}"
                placeholder="Just me (or type name)"
              >
            </div>
          </div>
          ${
            state.teamRoster.length > 0
              ? `
            <div class="horiz-pill-strip" style="padding-top:2px">
              <span style="font-size:10.5px;color:var(--text-muted);flex-shrink:0">Team:</span>
              ${state.teamRoster
                .map(
                  (m) => `
                <button type="button" class="mini-chip ${(f.assigneeName || '').toLowerCase() === m.name.toLowerCase() ? 'active' : ''}" data-np-pick-person="${esc(m.name)}" data-np-pick-bu="${esc(m.bu || '')}">
                  ${esc(m.name)}
                </button>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
          <textarea
            id="np-notes"
            class="np-input"
            rows="2"
            placeholder="Optional notes, links, amounts, or context…"
            style="margin-top:2px"
          >${esc(f.notes || '')}</textarea>
        </div>

        <div class="np-footer">
          <button type="button" class="np-btn-secondary" data-np-cancel="1">Cancel</button>
          <div class="np-footer-right">
            <button type="submit" class="np-btn-secondary" data-np-submit="another" title="Save this plan and immediately add another one">
              + Save &amp; Add Another
            </button>
            <button
              type="submit"
              id="btn-np-submit-wa"
              class="delegate-btn-wa"
              data-np-submit="whatsapp"
              style="padding:8.5px 13px;border-radius:8px;font-size:12px;font-weight:700;${hasAssignee ? '' : 'display:none'}"
            >
              📲 Assign &amp; WhatsApp
            </button>
            <button type="submit" class="np-btn-primary" data-np-submit="save">
              Add Plan
            </button>
          </div>
        </div>
      </form>
    `;

    if (focusSelector) {
      setTimeout(() => {
        const el = document.querySelector(focusSelector);
        if (el && typeof el.focus === 'function') {
          el.focus();
          if (focusSelector === '#np-plan-date' && typeof el.showPicker === 'function') {
            try { el.showPicker(); } catch {}
          }
        }
      }, 25);
    }
  }

  function openNewPlanSheet(prefillOpts = {}) {
    const backdrop = document.getElementById('sheet-backdrop');
    const dialog = document.getElementById('sheet-dialog');
    if (!backdrop) return;

    state.openClusterSheetId = '';
    state.openTaskWorkbenchId = '';
    state.openSheetKind = 'new_plan';
    dialog?.classList.add('is-composer-sheet');

    const baseIso = todayIso();
    const tomIso = shiftIsoDate(baseIso, 1);
    const selIso =
      state.selectedPlanDate && state.selectedPlanDate !== 'all' ? state.selectedPlanDate : '';

    const capVal = document.getElementById('capture-input')?.value?.trim() || '';
    const initTitle =
      prefillOpts.title !== undefined
        ? String(prefillOpts.title)
        : prefillOpts.fromDraft || capVal
          ? capVal || state.draft.text || ''
          : '';

    const draftCatSel = document.getElementById('draft-cluster-select')?.value || state.draft.clusterOverride || '';
    const manualCluster = Boolean(prefillOpts.manualCluster || prefillOpts.clusterId || draftCatSel);
    const clusterId =
      prefillOpts.clusterId ||
      draftCatSel ||
      detectCluster(initTitle, '').id;

    let whenMode = prefillOpts.whenMode || '';
    let planDate = prefillOpts.planDate || '';
    let holdChoice = '1d';

    if (!whenMode) {
      const draftWhen = document.getElementById('draft-when-select')?.value || state.draft.whenSelect || 'auto';
      if (draftWhen === 'tomorrow') {
        whenMode = 'tomorrow';
        planDate = tomIso;
      } else if (draftWhen === 'week') {
        whenMode = 'week';
        planDate = shiftIsoDate(baseIso, 3);
      } else if (draftWhen === 'backlog') {
        whenMode = 'backlog';
        planDate = '';
      } else if (draftWhen === '1d' || draftWhen === '5d') {
        whenMode = 'timer';
        holdChoice = draftWhen;
      } else if (selIso) {
        whenMode = selIso === baseIso ? 'today' : selIso === tomIso ? 'tomorrow' : 'date';
        planDate = selIso;
      } else if (clusterId === 'ideas' || clusterId === 'want_to_do') {
        whenMode = 'backlog';
        planDate = '';
      } else {
        whenMode = 'today';
        planDate = baseIso;
      }
    } else if (!planDate && whenMode !== 'backlog' && whenMode !== 'timer') {
      planDate =
        whenMode === 'tomorrow'
          ? tomIso
          : whenMode === 'week'
            ? shiftIsoDate(baseIso, 3)
            : baseIso;
    }

    const ctx = extractSmartContext(initTitle);

    state.newPlanForm = {
      title: initTitle,
      whenMode,
      planDate,
      planTime: prefillOpts.planTime || '',
      holdChoice,
      recur: prefillOpts.recur || state.draft.recur || 'none',
      clusterId,
      manualCluster,
      priority: prefillOpts.priority || state.draft.priority || ctx.priority || 'p3',
      buId: prefillOpts.buId || state.draft.assigneeBu || ctx.buId || '',
      assigneeName: prefillOpts.assigneeName || state.draft.assigneeName || ctx.assigneeName || '',
      notes: prefillOpts.notes || state.draft.notes || '',
      checklist: Array.isArray(prefillOpts.checklist)
        ? [...prefillOpts.checklist]
        : parseChecklistStepsFromText(state.draft.checklistRaw || ''),
      pendingStep: ''
    };

    backdrop.hidden = false;
    renderNewPlanSheetBody(prefillOpts.focusDate ? '#np-plan-date' : '#np-title');
  }

  async function submitNewPlanForm(submitMode = 'save') {
    syncNewPlanDomFieldsToState();
    const f = state.newPlanForm;
    if (!f) return;
    const rawTitle = String(f.title || '').trim();
    if (!rawTitle) {
      showToast('Enter what you are planning first');
      document.getElementById('np-title')?.focus();
      return;
    }

    const steps = Array.isArray(f.checklist) ? [...f.checklist] : [];
    const pending = String(f.pendingStep || '').trim();
    if (pending) {
      steps.push({
        id: `st_${Date.now().toString(36)}_${steps.length}`,
        text: pending,
        done: false
      });
    }

    const baseIso = todayIso();
    const tomIso = shiftIsoDate(baseIso, 1);
    const chosenCluster = f.manualCluster
      ? f.clusterId || 'work'
      : detectCluster(rawTitle, '').id;

    let explicitTiming = null;
    let horizon = 'today';

    if (f.whenMode === 'backlog') {
      explicitTiming = {
        targetAt: 0,
        planDate: '',
        hasAlarm: false,
        label: 'Someday',
        isHold: false,
        horizon: 'backlog',
        recur: 'none'
      };
      horizon = 'backlog';
    } else if (f.whenMode === 'timer') {
      const ctx = extractSmartContext(rawTitle);
      explicitTiming = resolveTimingFromChoice(
        f.holdChoice || '1d',
        rawTitle,
        chosenCluster,
        ctx.amount,
        ''
      );
      horizon = explicitTiming.horizon || 'tomorrow';
    } else {
      const targetIso =
        f.planDate && /^\d{4}-\d{2}-\d{2}$/.test(f.planDate)
          ? f.planDate
          : f.whenMode === 'tomorrow'
            ? tomIso
            : f.whenMode === 'week'
              ? shiftIsoDate(baseIso, 3)
              : baseIso;
      horizon = horizonFromIso(targetIso);
      let targetAt = 0;
      let hasAlarm = false;
      if (f.planTime && /^\d{1,2}:\d{2}$/.test(f.planTime)) {
        const [yy, mm, dd] = targetIso.split('-').map(Number);
        const [hh, mi] = f.planTime.split(':').map(Number);
        targetAt = new Date(yy, mm - 1, dd, hh, mi, 0, 0).getTime();
        hasAlarm = true;
      } else if (f.recur === 'daily' || f.recur === 'weekly') {
        const [yy, mm, dd] = targetIso.split('-').map(Number);
        targetAt = new Date(yy, mm - 1, dd, 9, 0, 0, 0).getTime();
        hasAlarm = true;
      }
      explicitTiming = {
        targetAt,
        planDate: targetIso,
        hasAlarm,
        label: formatIsoFriendly(targetIso, false),
        isHold: isHoldOrTimerCategory(chosenCluster) && targetAt > 0,
        horizon,
        recur: f.recur || 'none'
      };
    }

    // Clear top draft if it was prefilled into the modal
    state.draft.text = '';
    state.draft.notes = '';
    state.draft.checklistRaw = '';
    const capInp = document.getElementById('capture-input');
    if (capInp) capInp.value = '';

    await addQuickInlineTask({
      title: rawTitle,
      clusterId: chosenCluster,
      horizon,
      explicitTiming,
      priority: f.priority || 'p3',
      buId: f.buId || '',
      assigneeName: String(f.assigneeName || '').trim(),
      notes: f.notes || '',
      checklist: steps,
      sendWhatsApp: submitMode === 'whatsapp',
      silentToast: submitMode === 'another'
    });

    if (submitMode === 'another') {
      state.newPlanForm = {
        ...f,
        title: '',
        planTime: '',
        notes: '',
        checklist: [],
        pendingStep: ''
      };
      renderNewPlanSheetBody('#np-title');
      showToast('✓ Saved! Add your next plan');
      return;
    }

    closeActiveSheet();
    renderAll();
  }

  function openTaskWorkbenchSheet(taskId) {
    const item = state.reminders.find((r) => r.id === taskId);
    if (!item) return;
    state.openClusterSheetId = '';
    state.openTaskWorkbenchId = taskId;
    state.openSheetKind = 'workbench';
    document.getElementById('sheet-dialog')?.classList.add('is-composer-sheet');

    const backdrop = document.getElementById('sheet-backdrop');
    const titleWrap = document.getElementById('sheet-title-wrap');
    const body = document.getElementById('sheet-body');
    if (!backdrop || !titleWrap || !body) return;

    const cluster = CLUSTERS.find((c) => c.id === item.category) || CLUSTERS[3];
    const steps = Array.isArray(item.checklist) ? item.checklist : [];
    const doneSteps = steps.filter((s) => s.done).length;
    const targetAt = Number(item.dueAt || item.matureAt || 0);
    const planDateVal = itemIsoDate(item);
    let planTimeVal = '';
    if (targetAt > 0 && (item.hasAlarm || isHoldOrTimerRecord(item))) {
      const d = new Date(targetAt);
      const pad = (n) => String(n).padStart(2, '0');
      planTimeVal = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    titleWrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
        <div>
          <strong style="font-size:15px">Edit Plan</strong>
          <div style="font-size:11px;color:var(--text-muted)">${esc(cluster.label)} · Schedule, checklist steps &amp; delegation</div>
        </div>
      </div>
    `;

    body.innerHTML = `
      <form id="workbench-save-form" class="roster-form-card" style="gap:10px" autocomplete="off">
        <input type="hidden" id="wb-task-id" value="${esc(item.id)}">

        <div>
          <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Plan Title</label>
          <input type="text" id="wb-title" class="roster-field" value="${esc(item.title)}" required style="margin-top:4px;font-weight:700">
        </div>

        <div class="roster-form-grid-2">
          <div>
            <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Planned Date</label>
            <input type="date" id="wb-plan-date" class="roster-field" value="${esc(planDateVal)}" style="margin-top:4px;width:100%">
          </div>

          <div>
            <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Reminder Time (Optional)</label>
            <input type="time" id="wb-plan-time" class="roster-field" value="${esc(planTimeVal)}" style="margin-top:4px;width:100%">
          </div>
        </div>

        <div class="roster-form-grid-2">
          <div>
            <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Timeline Bucket</label>
            <select id="wb-horizon" class="roster-field" style="margin-top:4px;width:100%">
              <option value="today" ${(item.horizon || 'today') === 'today' ? 'selected' : ''}>Today</option>
              <option value="tomorrow" ${item.horizon === 'tomorrow' ? 'selected' : ''}>Tomorrow</option>
              <option value="week" ${item.horizon === 'week' ? 'selected' : ''}>This Week &amp; Holds</option>
              <option value="backlog" ${item.horizon === 'backlog' ? 'selected' : ''}>Someday / Ideas</option>
            </select>
          </div>

          <div>
            <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Priority</label>
            <select id="wb-priority" class="roster-field" style="margin-top:4px;width:100%">
              <option value="p3" ${(!item.priority || item.priority === 'p3') ? 'selected' : ''}>Normal</option>
              <option value="p2" ${item.priority === 'p2' ? 'selected' : ''}>P2 · High</option>
              <option value="p1" ${item.priority === 'p1' ? 'selected' : ''}>P1 · Critical</option>
            </select>
          </div>
        </div>

        <div class="roster-form-grid-2">
          <div>
            <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Category</label>
            <select id="wb-cluster" class="roster-field" style="margin-top:4px;width:100%">
              ${CLUSTERS.map(
                (c) => `<option value="${c.id}" ${item.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`
              ).join('')}
            </select>
          </div>

          <div>
            <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Business Unit</label>
            <select id="wb-bu" class="roster-field" style="margin-top:4px;width:100%">
              <option value="">Personal / General</option>
              ${BHFIRMS_BUS.map(
                (b) => `<option value="${b.id}" ${item.buId === b.id ? 'selected' : ''}>${esc(b.short)} — ${esc(b.label.replace(/^[^\s]+\s*/, ''))}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div>
          <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Delegate To (@Staff)</label>
          <input type="text" id="wb-assignee" class="roster-field" value="${esc(item.assigneeName || '')}" placeholder="Just me (or type staff name)" style="margin-top:4px;width:100%">
        </div>

        ${
          state.teamRoster.length > 0
            ? `
          <div class="horiz-pill-strip">
            <span style="font-size:10.5px;color:var(--text-muted);flex-shrink:0">Quick Pick:</span>
            ${state.teamRoster
              .map(
                (m) => `
              <button type="button" class="mini-chip" data-wb-pick-person="${esc(m.name)}" data-wb-pick-bu="${esc(m.bu || '')}">
                ${esc(m.name)}
              </button>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div>
          <label style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">Notes &amp; Context</label>
          <textarea id="wb-notes" class="roster-field" rows="2" placeholder="Add context, links, amounts, or delegation instructions…" style="margin-top:4px;width:100%">${esc(item.notes || '')}</textarea>
        </div>

        <div class="checklist-drawer-box">
          <div style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">
            Checklist Steps (${doneSteps}/${steps.length} completed)
          </div>
          ${steps
            .map(
              (st) => `
            <div class="checklist-step-row ${st.done ? 'done' : ''}">
              <button type="button" class="checklist-step-check" data-act="toggle-step" data-id="${esc(item.id)}" data-step-id="${esc(st.id)}">${st.done ? '✓' : ''}</button>
              <span style="flex:1">${esc(st.text)}</span>
              <button type="button" class="mini-chip" data-act="delete-step" data-id="${esc(item.id)}" data-step-id="${esc(st.id)}" style="padding:1px 6px;font-size:10px">✕</button>
            </div>
          `
            )
            .join('')}
          <div style="display:flex;gap:6px;margin-top:4px">
            <input type="text" class="bento-inline-input" data-step-input-for="${esc(item.id)}" placeholder="+ Type a step and press Enter…">
            <button type="button" class="bento-inline-btn" data-act="add-step" data-id="${esc(item.id)}">+ Add</button>
          </div>
        </div>

        <div class="roster-form-actions">
          <button type="submit" class="delegate-btn-assign primary" data-wb-submit="save">✓ Save Plan</button>
          <button type="submit" class="delegate-btn-wa" data-wb-submit="whatsapp">📲 Save &amp; WhatsApp</button>
          <button type="button" class="t-act-btn danger" data-act="delete" data-id="${esc(item.id)}">✕ Delete</button>
        </div>
      </form>
    `;

    backdrop.hidden = false;
  }

  function openNotificationCenterSheet(preserveViewedSnapshot = false) {
    state.openClusterSheetId = '';
    state.openSheetKind = 'notifications';
    document.getElementById('sheet-dialog')?.classList.remove('is-composer-sheet');
    const backdrop = document.getElementById('sheet-backdrop');
    const titleWrap = document.getElementById('sheet-title-wrap');
    const body = document.getElementById('sheet-body');
    if (!backdrop || !titleWrap || !body) return;

    seedUncheckedDueNotifications();
    const unchecked = getUncheckedNotifications();
    if (!preserveViewedSnapshot) {
      state.sheetOpenedWithUnreadIds = unchecked.map((n) => n.id);
    }

    const prefs = normalizeNotifPrefs(state.notifPrefs);
    const pCfg = normalizePrayerConfig(state.prayerConfig);
    const thisArmed = isThisDevicePushEnabled();
    const subs = getAllActivePushSubscriptions();
    const activeTasksWithTimers = state.reminders.filter(
      (r) => !r.completed && !r.deleted && Number(r.matureAt || r.dueAt || 0) > Date.now()
    ).length;
    const delegatedCount = state.reminders.filter(isDelegatedItem).length;

    titleWrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
        <div>
          <strong style="font-size:15px">🔔 Planner Notifications &amp; Control Center</strong>
          <div style="font-size:11px;color:var(--text-muted)">Unchecked alerts show a red badge on the top-right bell &amp; Home Screen icon</div>
        </div>
      </div>
    `;

    const allNotifs = (state.notifications || []).slice(0, 18);
    const inboxHtml = `
      <div class="notif-inbox-box ${unchecked.length > 0 ? 'has-unread' : ''}" id="notif-inbox-box">
        <div class="notif-inbox-head">
          <div style="display:flex;align-items:center;gap:7px">
            ${
              unchecked.length > 0
                ? `<span class="notif-inbox-badge-red tabular">${unchecked.length}</span>
                   <strong style="font-size:13px;color:var(--text-primary)">Unchecked Notification${unchecked.length === 1 ? '' : 's'}</strong>`
                : `<span style="font-size:12.5px;font-weight:800;color:var(--emerald)">✓ All Notifications Checked (0 Unread)</span>`
            }
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${
              unchecked.length > 0
                ? `<button type="button" class="t-act-btn primary" id="btn-notif-mark-all-read">✓ Mark All Checked (${unchecked.length})</button>`
                : ''
            }
            ${
              allNotifs.length > 0
                ? `<button type="button" class="mini-chip" id="btn-notif-clear-history">Clear History</button>`
                : ''
            }
          </div>
        </div>

        ${
          allNotifs.length > 0
            ? `
          <div class="notif-inbox-list">
            ${allNotifs
              .map(
                (n) => `
              <div class="notif-inbox-item ${!n.checked ? 'is-unchecked' : 'is-checked'}" data-notif-open="${esc(n.id)}">
                ${
                  !n.checked
                    ? `<span class="notif-unread-dot" title="Unchecked notification"></span>`
                    : `<span class="notif-checked-mark" title="Checked">✓</span>`
                }
                <div style="min-width:0;flex:1">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                    <strong style="font-size:12.5px;color:var(--text-primary)">${esc(n.title)}</strong>
                    <span class="tabular" style="font-size:10.5px;color:var(--text-muted);flex-shrink:0">${esc(
                      formatRelativeNotifTime(n.ts)
                    )}</span>
                  </div>
                  <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px">${esc(n.body)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                  ${
                    !n.checked
                      ? `<button type="button" class="mini-chip active" data-notif-check-one="${esc(n.id)}" title="Mark as checked">✓</button>`
                      : ''
                  }
                  <button type="button" class="mini-chip" data-notif-open="${esc(n.id)}">Open →</button>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : `<div style="font-size:11.5px;color:var(--text-muted);padding:4px 0">No unread notifications right now. When a Prayer time, Task, Wait Timer, or Delegation update fires, a red number badge appears on the top-right bell and on your Home Screen Planner icon until you check it.</div>`
        }
      </div>
    `;

    const channels = [
      {
        id: 'prayers',
        icon: '🕌',
        title: `Shia Prayer Times (${pCfg.locationName})`,
        sub: `Fajr, Dohor & Maghrib${pCfg.preRemindMin > 0 ? ` + ${pCfg.preRemindMin}m pre-reminder` : ''} · 3-day exact-second cloud schedule`,
        enabled: prefs.enabled && prefs.prayers && pCfg.enabled
      },
      {
        id: 'tasks',
        icon: '⏰',
        title: `Tasks & Due Reminders (${activeTasksWithTimers} scheduled)`,
        sub: `Work/BU tasks, Family, People follow-ups & Daily/Weekly recurring tasks`,
        enabled: prefs.enabled && prefs.tasks
      },
      {
        id: 'timers',
        icon: '⏳',
        title: `Smart Wait Timers & Cooling-Off Holds`,
        sub: `Verify on App (24h), Shipping countdowns (5d) & Payment cooling-off timers`,
        enabled: prefs.enabled && prefs.timers
      },
      {
        id: 'delegations',
        icon: '👥',
        title: `BHFIRMS Team Delegations (${delegatedCount} active)`,
        sub: `Instant push when @Staff marks a task 👀 Seen, ⚙️ Working, or ✅ Completed + note`,
        enabled: prefs.enabled && prefs.delegations
      },
      {
        id: 'score',
        icon: '🛡️',
        title: `Daily 100% Discipline Scorecard & Briefs`,
        sub: `08:00 Morning Executive & Prayer Brief + 21:00 Evening 100% Score Check-In`,
        enabled: prefs.enabled && prefs.score
      }
    ];

    body.innerHTML = `
      ${inboxHtml}
      <div class="prayer-loc-box" style="border-color:${thisArmed ? 'var(--emerald)' : 'var(--brass)'}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <div>
            <div style="font-size:13px;font-weight:800;color:${thisArmed ? 'var(--emerald)' : 'var(--brass-bright)'}">
              ${thisArmed ? '✅ This Device is Subscribed to Planner Web Push' : '⚠️ This Device is Not Subscribed Yet'}
            </div>
            <div style="font-size:11px;color:var(--text-muted)">
              Planner Devices Armed: <strong>${subs.length}</strong> · Sound Chime: <strong>${prefs.chime ? 'ON' : 'Muted'}</strong> · THEO Prayer Fallback: <strong>Disabled (Moved to Planner)</strong>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="t-act-btn primary" id="btn-notif-enable-device">
              ${thisArmed ? '🔄 Refresh This Device Push' : '🔔 Enable Push on This Device'}
            </button>
            <button type="button" class="t-act-btn" id="btn-notif-rearm-all">⚡ Re-Arm All Timers</button>
            <button type="button" class="t-act-btn" data-notif-toggle="chime">
              ${prefs.chime ? '🔊 Chime: ON' : '🔇 Chime: OFF'}
            </button>
          </div>
        </div>
      </div>

      <div class="ticker-list">
        ${channels
          .map(
            (ch) => `
          <div class="notif-channel-card">
            <div style="min-width:0;flex:1">
              <div style="font-size:13px;font-weight:800">${ch.icon} ${esc(ch.title)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${esc(ch.sub)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <button type="button" class="mini-chip ${ch.enabled ? 'active' : ''}" data-notif-toggle="${ch.id}">
                ${ch.enabled ? '🔔 ON' : '🔕 OFF'}
              </button>
              <button type="button" class="t-act-btn wa" data-notif-test="${ch.id}">📲 Test Push</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    backdrop.hidden = false;
  }

  function updateDockBadges() {
    const active = state.reminders.filter((r) => !r.completed && !r.deleted);
    const delCnt = state.reminders.filter(isDelegatedItem).length;

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (count > 0) {
        el.hidden = false;
        el.textContent = String(count);
      } else {
        el.hidden = true;
      }
    };
    setBadge('dock-badge-planning', active.length);
    setBadge('dock-badge-tasks', active.length);
    setBadge('dock-badge-delegated', delCnt);
    setBadge('top-badge-planning', active.length);
    setBadge('top-badge-tasks', active.length);
    setBadge('top-badge-delegated', delCnt);
  }

  function normalizeCommandTab(rawTab) {
    const t = String(rawTab || '').trim().toLowerCase();
    if (t === 'radar' || t === 'board' || t === 'planning') return 'planning';
    if (t === 'timers' || t === 'tasks' || t === 'discipline') return 'tasks';
    if (t === 'delegated' || t === 'delegation') return 'delegated';
    if (t === 'score') return 'score';
    if (t === 'prayers' || t === 'prayer') return 'prayers';
    return 'planning';
  }

  let pendingBackgroundRender = false;
  let recentlyCompletedTimer = null;

  function captureScrollPositions() {
    const snap = {
      windowY: typeof window !== 'undefined' ? window.scrollY || 0 : 0,
      stageTop: document.getElementById('cmd-stage')?.scrollTop || 0,
      sheetTop: document.getElementById('sheet-body')?.scrollTop || 0,
      clusters: {}
    };
    document.querySelectorAll('.bento-tile[data-cluster-id]').forEach((tile) => {
      const cid = tile.getAttribute('data-cluster-id');
      const itemsBox = tile.querySelector('.bento-items');
      if (cid && itemsBox) {
        snap.clusters[cid] = itemsBox.scrollTop || 0;
      }
    });
    return snap;
  }

  function restoreScrollPositions(snap) {
    if (!snap) return;
    const stage = document.getElementById('cmd-stage');
    if (stage && snap.stageTop > 0) stage.scrollTop = snap.stageTop;
    const sheet = document.getElementById('sheet-body');
    if (sheet && snap.sheetTop > 0) sheet.scrollTop = snap.sheetTop;
    if (snap.clusters) {
      for (const [cid, top] of Object.entries(snap.clusters)) {
        if (top > 0) {
          const box = document.querySelector(`.bento-tile[data-cluster-id="${cid}"] .bento-items`);
          if (box) box.scrollTop = top;
        }
      }
    }
  }

  function captureActiveInputState() {
    const el = document.activeElement;
    if (!el) return null;
    const tag = (el.tagName || '').toUpperCase();
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return null;
    let selector = '';
    if (el.id) {
      selector = `#${CSS.escape(el.id)}`;
    } else if (el.getAttribute('data-card-inline-input')) {
      selector = `[data-card-inline-input="${CSS.escape(el.getAttribute('data-card-inline-input'))}"]`;
    } else if (el.getAttribute('data-step-input-for')) {
      selector = `[data-step-input-for="${CSS.escape(el.getAttribute('data-step-input-for'))}"]`;
    } else if (el.closest('[data-inline-cluster-form]')) {
      const cId = el.closest('[data-inline-cluster-form]').getAttribute('data-inline-cluster-form');
      selector = `[data-inline-cluster-form="${CSS.escape(cId)}"] input`;
    } else if (el.closest('[data-inline-horizon-form]')) {
      const hId = el.closest('[data-inline-horizon-form]').getAttribute('data-inline-horizon-form');
      selector = `[data-inline-horizon-form="${CSS.escape(hId)}"] input`;
    } else if (el.closest('[data-inline-bu-form]')) {
      const bId = el.closest('[data-inline-bu-form]').getAttribute('data-inline-bu-form');
      selector = `[data-inline-bu-form="${CSS.escape(bId)}"] input`;
    } else if (el.closest('[data-inline-person-form]')) {
      const pName = el.closest('[data-inline-person-form]').getAttribute('data-inline-person-form');
      selector = `[data-inline-person-form="${CSS.escape(pName)}"] input`;
    }
    if (!selector) return null;
    let selStart = null;
    let selEnd = null;
    try {
      selStart = el.selectionStart;
      selEnd = el.selectionEnd;
    } catch {}
    return {
      selector,
      value: el.value,
      selStart,
      selEnd
    };
  }

  function restoreActiveInputState(snap) {
    if (!snap || !snap.selector) return;
    try {
      const nextEl = document.querySelector(snap.selector);
      if (!nextEl) return;
      if (typeof snap.value === 'string' && nextEl.value !== snap.value && snap.value !== '') {
        nextEl.value = snap.value;
      }
      if (document.activeElement !== nextEl) {
        nextEl.focus({ preventScroll: true });
      }
      if (typeof snap.selStart === 'number' && typeof nextEl.setSelectionRange === 'function') {
        const len = (nextEl.value || '').length;
        nextEl.setSelectionRange(Math.min(snap.selStart, len), Math.min(snap.selEnd ?? snap.selStart, len));
      }
    } catch {}
  }

  function requestBackgroundRender() {
    if (isFormControlFocused()) {
      pendingBackgroundRender = true;
      renderHudRibbon();
      updateDockBadges();
      updatePushHudState();
      return;
    }
    pendingBackgroundRender = false;
    renderAll();
  }

  function renderAll() {
    const scrollSnap = captureScrollPositions();
    const inputSnap = captureActiveInputState();

    state.activeTab = normalizeCommandTab(state.activeTab);
    document.documentElement.setAttribute('data-theme', state.theme);
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', state.theme === 'light' ? '#F6F4EF' : '#09101E');
    }
    renderHudRibbon();
    renderLiveAdvisorDrawer();
    updateDockBadges();
    updatePushHudState();

    const capWrap = document.getElementById('capture-bar-wrap');
    if (capWrap) {
      capWrap.hidden = state.activeTab !== 'planning' && state.activeTab !== 'tasks';
    }

    for (const v of document.querySelectorAll('.cmd-view')) {
      const isMatch = v.getAttribute('data-view') === state.activeTab;
      v.hidden = !isMatch;
      v.classList.toggle('active', isMatch);
    }
    for (const b of document.querySelectorAll('.cmd-dock-btn, .hud-nav-btn')) {
      b.classList.toggle('active', b.getAttribute('data-tab') === state.activeTab);
    }

    if (state.activeTab === 'planning') renderPlanningView();
    else if (state.activeTab === 'tasks') renderTasksView();
    else if (state.activeTab === 'delegated') renderDelegatedView();
    else if (state.activeTab === 'score') renderScoreView();
    else if (state.activeTab === 'prayers') renderPrayersView();

    if (state.openClusterSheetId && !document.getElementById('sheet-backdrop')?.hidden) {
      openClusterSheet(state.openClusterSheetId);
    } else if (state.openTaskWorkbenchId && state.openSheetKind === 'workbench' && !document.getElementById('sheet-backdrop')?.hidden) {
      openTaskWorkbenchSheet(state.openTaskWorkbenchId);
    }

    restoreScrollPositions(scrollSnap);
    restoreActiveInputState(inputSnap);
  }

  let toastClearTimer = null;
  function showToast(msg) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    if (toastClearTimer) clearTimeout(toastClearTimer);
    stack.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.textContent = msg;
    stack.appendChild(el);
    toastClearTimer = setTimeout(() => {
      el.remove();
      toastClearTimer = null;
    }, 2000);
  }

  /* ============================================================================
     ISOLATED STAFF DELEGATION PORTAL (?task=<id>&token=<tok>)
     ============================================================================ */
  async function bootStaffPortalMode(taskId, token) {
    const staffRoot = document.getElementById('staff-portal-root');
    const ownerShell = document.getElementById('owner-app-shell');
    const bottomDock = document.getElementById('cmd-bottom-dock');
    if (ownerShell) ownerShell.hidden = true;
    if (bottomDock) bottomDock.style.display = 'none';
    if (!staffRoot) return;
    staffRoot.hidden = false;

    staffRoot.innerHTML = `
      <div class="staff-card">
        <div style="display:flex;align-items:center;gap:10px">
          <img src="icon.svg" alt="BHFIRMS" style="width:34px;height:34px;border-radius:8px">
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:0.06em;color:var(--brass);text-transform:uppercase">BHFIRMS Executive Task Portal</div>
            <div style="font-size:13px;color:var(--text-secondary)">Loading assigned task…</div>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ op: 'delegate_get', taskId, token })
      });
      const data = await res.json();
      let taskObj = res.ok && data?.ok && data?.task ? data.task : null;
      if (!taskObj) {
        try {
          const loc = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
          const found = (loc?.reminders || []).find((r) => r.id === taskId && r.taskToken === token);
          if (found) {
            taskObj = {
              id: found.id,
              token: found.taskToken,
              title: found.title,
              assigneeName: found.assigneeName || 'Team',
              assigneeBu: found.buId || '',
              subTag: found.subTag || '',
              priority: found.priority || 'p3',
              notes: found.notes || '',
              checklist: Array.isArray(found.checklist) ? found.checklist : [],
              dueAt: found.dueAt || found.matureAt || 0,
              delegationStatus: found.delegationStatus || 'sent',
              staffNote: found.staffNote || ''
            };
          }
        } catch {}
      }
      if (!taskObj) {
        staffRoot.innerHTML = `
          <div class="staff-card">
            <strong style="font-size:16px;color:var(--crimson)">Task Link Expired or Invalid</strong>
            <p style="font-size:13px;color:var(--text-secondary)">Please ask Hussein Bdeir for an updated task link.</p>
          </div>
        `;
        return;
      }

      const renderStaffTask = (t) => {
        const st = t.delegationStatus || 'sent';
        const targetStr = t.dueAt
          ? new Date(Number(t.dueAt)).toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Today / As soon as possible';
        const steps = Array.isArray(t.checklist) ? t.checklist : [];

        staffRoot.innerHTML = `
          <div class="staff-card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <div style="display:flex;align-items:center;gap:10px">
                <img src="icon.svg" alt="BHFIRMS" style="width:34px;height:34px;border-radius:8px">
                <div>
                  <div style="font-size:10.5px;font-weight:800;letter-spacing:0.06em;color:var(--brass);text-transform:uppercase">BHFIRMS · Assigned by Hussein Bdeir</div>
                  <div style="font-size:13px;font-weight:700">👤 Assigned to: ${esc(t.assigneeName || 'Team')}</div>
                </div>
              </div>
              <div style="display:flex;gap:4px">
                ${t.priority === 'p1' ? `<span class="t-pill p1">P1 CRITICAL</span>` : t.priority === 'p2' ? `<span class="t-pill p2">P2 HIGH</span>` : ''}
                ${t.subTag ? `<span class="t-pill">${esc(t.subTag)}</span>` : ''}
              </div>
            </div>

            <div style="padding:14px;border-radius:10px;background:var(--bg-ink);border:1px solid var(--border-subtle)">
              <div style="font-size:16px;font-weight:800;line-height:1.4">${esc(t.title)}</div>
              <div style="margin-top:8px;font-size:12px;color:var(--text-secondary)">⏰ Target: <strong>${esc(targetStr)}</strong></div>
              ${
                t.notes
                  ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-subtle);font-size:12.5px;color:var(--text-secondary)">📋 <strong>Instructions:</strong> ${esc(
                      t.notes
                    )}</div>`
                  : ''
              }
            </div>

            ${
              steps.length > 0
                ? `
              <div class="checklist-drawer-box">
                <div style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em">
                  Deliverable Steps (Tap to check off)
                </div>
                ${steps
                  .map(
                    (s, idx) => `
                  <label class="checklist-step-row ${s.done ? 'done' : ''}" style="cursor:pointer">
                    <input type="checkbox" data-staff-step-idx="${idx}" ${s.done ? 'checked' : ''} style="accent-color:var(--emerald)">
                    <span>${esc(s.text)}</span>
                  </label>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:11.5px;font-weight:700;color:var(--text-secondary)">Update Note / Completion Details:</label>
              <textarea
                id="staff-note-input"
                rows="2"
                placeholder="Add a quick note (e.g. Done, pressure checked at 14 bar)…"
                style="padding:9px 11px;border-radius:8px;background:var(--bg-ink);border:1px solid var(--border-subtle);font-size:13px"
              >${esc(t.staffNote || '')}</textarea>
            </div>

            <div class="staff-status-grid">
              <button type="button" class="staff-status-btn ${st === 'seen' ? 'active-seen' : ''}" data-staff-status="seen">
                <span>👀 Seen / Acknowledged</span>
                <span>${st === 'seen' ? '✓ Current' : 'Tap'}</span>
              </button>
              <button type="button" class="staff-status-btn ${st === 'working' ? 'active-working' : ''}" data-staff-status="working">
                <span>⚙️ Working On It</span>
                <span>${st === 'working' ? '✓ Current' : 'Tap'}</span>
              </button>
              <button type="button" class="staff-status-btn ${st === 'blocked' ? 'active-seen' : ''}" data-staff-status="blocked">
                <span>⚠️ Need Input / Blocked</span>
                <span>${st === 'blocked' ? '✓ Current' : 'Tap'}</span>
              </button>
              <button type="button" class="staff-status-btn ${st === 'done' ? 'active-done' : ''}" data-staff-status="done">
                <span>✅ Completed</span>
                <span>${st === 'done' ? '✓ Notified Hussein' : 'Tap to Complete'}</span>
              </button>
            </div>

            <div id="staff-feedback-msg" style="font-size:12px;text-align:center;color:var(--emerald)"></div>
          </div>
        `;

        staffRoot.querySelectorAll('[data-staff-step-idx]').forEach((cb) => {
          cb.addEventListener('change', () => {
            const idx = Number(cb.getAttribute('data-staff-step-idx'));
            if (Array.isArray(taskObj.checklist) && taskObj.checklist[idx]) {
              taskObj.checklist[idx].done = cb.checked;
            }
          });
        });

        staffRoot.querySelectorAll('[data-staff-status]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const newStatus = btn.getAttribute('data-staff-status');
            let noteVal = document.getElementById('staff-note-input')?.value?.trim() || '';
            if (Array.isArray(taskObj.checklist) && taskObj.checklist.length > 0) {
              const doneCnt = taskObj.checklist.filter((s) => s.done).length;
              const prefix = `[${doneCnt}/${taskObj.checklist.length} steps]`;
              noteVal = noteVal.replace(/^\[\d+\/\d+\s+steps\]\s*/i, '').trim();
              noteVal = noteVal ? `${prefix} ${noteVal}` : prefix;
            }
            const fb = document.getElementById('staff-feedback-msg');
            if (fb) fb.textContent = 'Saving status update…';
            try {
              const uRes = await fetch(CLOUD_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify({
                  op: 'delegate_update',
                  taskId,
                  token,
                  status: newStatus,
                  staffNote: noteVal
                })
              });
              const uData = await uRes.json();
              if (uData?.ok && uData?.task) {
                taskObj = { ...taskObj, ...uData.task };
                renderStaffTask(taskObj);
                const fb2 = document.getElementById('staff-feedback-msg');
                if (fb2) fb2.textContent = '✓ Status updated and notified Hussein Bdeir on Planner!';

                const targets = Array.isArray(taskObj.ownerPushTargets) ? taskObj.ownerPushTargets : [];
                if (targets.length > 0 && !(newStatus === 'done' && taskObj.pushOnDone && !noteVal)) {
                  const who = taskObj.assigneeName || 'Team';
                  const stMap = {
                    seen: `👀 ${who} saw task — Planner`,
                    working: `⚙️ ${who} is working on task — Planner`,
                    blocked: `⚠️ ${who} needs input on task — Planner`,
                    done: `✅ ${who} completed task — Planner`
                  };
                  const pushPayload = {
                    title: stMap[newStatus] || `👤 ${who} updated task — Planner`,
                    body: `${taskObj.title}${noteVal ? ` · 💬 "${noteVal}"` : ''}`,
                    tag: `cmd-del-${taskId}-${newStatus}`,
                    tab: 'delegated',
                    taskId,
                    url: `./?tab=delegated&taskId=${encodeURIComponent(taskId)}`,
                    requireInteraction: newStatus === 'done' || newStatus === 'blocked'
                  };
                  for (const tgt of targets) {
                    if (!tgt || !tgt.endpoint || !tgt.keys) continue;
                    try {
                      const freshVapid = await signVapid(tgt.endpoint).catch(() => tgt.vapid);
                      if (!freshVapid) continue;
                      const bodyB64 = await encryptWebPush(tgt.keys, pushPayload);
                      await fetch(CLOUD_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                        body: JSON.stringify({
                          key: CLOUD_KEY,
                          op: 'push',
                          endpoint: tgt.endpoint,
                          vapid: freshVapid,
                          bodyB64,
                          ttl: '14400'
                        })
                      });
                    } catch {}
                  }
                }
              }
            } catch {}
          });
        });
      };

      renderStaffTask(taskObj);
    } catch {
      staffRoot.innerHTML = `<div class="staff-card">Could not reach BHFIRMS Cloud Relay. Check your connection.</div>`;
    }
  }

  async function subscribeCurrentBrowserPush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      showToast('Add Planner to your Home Screen first to enable iOS Web Push');
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      showToast('Notification permission not granted');
      return false;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64UrlToU8(VAPID_PUBLIC_B64)
    });
    localStorage.setItem(PUSH_REG_KEY, JSON.stringify(sub.toJSON()));
    updatePushHudState();
    showToast('🔔 Planner Lock-Screen Web Push Active! Arming Prayers, Tasks & Timers…');
    await syncAll().catch(() => {});
    scheduleUpcomingPrayerCloudPushes(null, true).catch(() => {});
    scheduleAllActiveTaskCloudPushes(null, true).catch(() => {});
    return true;
  }

  /* ============================================================================
     EVENT BINDINGS & INITIALIZATION
     ============================================================================ */
  function bindOwnerEvents() {
    // Top HUD Score button -> switch to 100% Score tab
    document.getElementById('hud-score-btn')?.addEventListener('click', () => {
      state.activeTab = 'score';
      markNotificationsChecked((n) => n && n.tab === 'score');
      renderAll();
    });

    // Top HUD Shia Prayer Pill -> switch to Prayers tab
    document.getElementById('btn-prayer-hud')?.addEventListener('click', () => {
      state.activeTab = 'prayers';
      markNotificationsChecked((n) => n && (n.openPrayer || n.tab === 'prayers'));
      renderAll();
    });

    // Sync, Push, Theme buttons
    document.getElementById('btn-sync-now')?.addEventListener('click', () => {
      showToast('Syncing with Cloud Relay & Bridge…');
      syncAll();
    });

    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theo_cmd_theme_v2', state.theme);
      renderAll();
    });

    document.getElementById('btn-push-toggle')?.addEventListener('click', async () => {
      if (!isThisDevicePushEnabled()) {
        await subscribeCurrentBrowserPush();
      }
      openNotificationCenterSheet();
    });

    document.getElementById('btn-banner-enable-push')?.addEventListener('click', async () => {
      await subscribeCurrentBrowserPush();
      renderAll();
    });

    document.getElementById('btn-banner-notif-center')?.addEventListener('click', () => {
      openNotificationCenterSheet();
    });

    document.getElementById('btn-banner-dismiss-push')?.addEventListener('click', () => {
      state.pushBannerDismissed = true;
      try {
        localStorage.setItem(PUSH_BANNER_DISMISSED_KEY, '1');
      } catch {}
      updatePushHudState();
    });

    document.getElementById('btn-open-new-plan')?.addEventListener('click', () => {
      openNewPlanSheet();
    });

    document.getElementById('btn-draft-details')?.addEventListener('click', () => {
      openNewPlanSheet({ fromDraft: true });
    });

    // Capture Bar input, Category/When selectors & submit
    const capInp = document.getElementById('capture-input');
    const capShell = document.getElementById('capture-input-shell');

    document.getElementById('draft-cluster-select')?.addEventListener('change', (e) => {
      state.draft.clusterOverride = e.target.value || '';
      renderLiveAdvisorDrawer();
      capInp?.focus({ preventScroll: true });
    });

    document.getElementById('draft-when-select')?.addEventListener('change', (e) => {
      const val = e.target.value || 'auto';
      if (val === 'custom') {
        e.target.value = state.draft.whenSelect || 'auto';
        openNewPlanSheet({ fromDraft: true, whenMode: 'date', focusDate: true });
        return;
      }
      state.draft.whenSelect = val;
      renderLiveAdvisorDrawer();
      capInp?.focus({ preventScroll: true });
    });

    // Global Escape & keyboard shortcut ('n' opens New Plan when not typing)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const bd = document.getElementById('sheet-backdrop');
        if (bd && !bd.hidden) {
          e.preventDefault();
          closeActiveSheet();
          return;
        }
        if (state.activeInlineClusterId) {
          e.preventDefault();
          state.activeInlineClusterId = '';
          renderPlanningView();
        }
        return;
      }
      if (
        e.key === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isFormControlFocused() &&
        document.getElementById('sheet-backdrop')?.hidden !== false &&
        (state.activeTab === 'planning' || state.activeTab === 'tasks')
      ) {
        e.preventDefault();
        openNewPlanSheet();
      }
    });

    // Flush any deferred background render once user finishes typing in any input
    document.addEventListener('focusout', () => {
      setTimeout(() => {
        if (pendingBackgroundRender && !isFormControlFocused()) {
          pendingBackgroundRender = false;
          renderAll();
        }
      }, 150);
    });

    capShell?.addEventListener('click', (e) => {
      if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select')) {
        capInp?.focus();
      }
    });

    capInp?.addEventListener('input', () => {
      state.draft.text = capInp.value;
      renderLiveAdvisorDrawer();
    });

    capInp?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        state.draft.text = capInp.value;
        addTaskFromDraft(false, true);
      }
    });

    document.getElementById('btn-draft-horizon')?.addEventListener('click', () => {
      const order = ['auto', 'today', 'tomorrow', 'week', 'backlog'];
      const cur = state.draft.horizon || 'auto';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      state.draft.horizon = next;
      renderLiveAdvisorDrawer();
      capInp?.focus({ preventScroll: true });
    });

    document.getElementById('btn-draft-priority')?.addEventListener('click', () => {
      const order = ['', 'p1', 'p2', 'p3'];
      const cur = state.draft.priority || '';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      state.draft.priority = next;
      renderLiveAdvisorDrawer();
      capInp?.focus({ preventScroll: true });
    });

    document.getElementById('capture-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (capInp) state.draft.text = capInp.value;
      addTaskFromDraft(false);
    });

    document.getElementById('btn-pick-assignee')?.addEventListener('click', () => {
      openTeamRosterSheet({ pickForDraft: true });
    });

    document.getElementById('btn-clear-assignee')?.addEventListener('click', (e) => {
      e.stopPropagation();
      state.draft.assigneeId = '';
      state.draft.assigneeName = '';
      state.draft.assigneeBu = '';
      if (state.draft.text) {
        state.draft.text = state.draft.text.replace(/^@[A-Za-z0-9_]+\s*[:,-]?\s*/, '');
        const inp = document.getElementById('capture-input');
        if (inp) inp.value = state.draft.text;
      }
      renderLiveAdvisorDrawer();
      capInp?.focus({ preventScroll: true });
      showToast('Cleared assignee');
    });

    // Live Advisor Drawer clicks & inputs
    const advDrawer = document.getElementById('live-advisor-drawer');
    advDrawer?.addEventListener('input', (e) => {
      if (e.target.id === 'draft-steps-input') {
        state.draft.checklistRaw = e.target.value;
      } else if (e.target.id === 'draft-notes-input') {
        state.draft.notes = e.target.value;
      }
    });

    advDrawer?.addEventListener('keydown', (e) => {
      if (
        (e.target.id === 'draft-steps-input' || e.target.id === 'draft-notes-input') &&
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.isComposing
      ) {
        e.preventDefault();
        if (e.target.id === 'draft-steps-input') state.draft.checklistRaw = e.target.value;
        if (e.target.id === 'draft-notes-input') state.draft.notes = e.target.value;
        addTaskFromDraft(false);
      }
    });

    advDrawer?.addEventListener('click', (e) => {
      const hChip = e.target.closest('[data-horizon-chip]');
      if (hChip) {
        state.draft.horizon = hChip.getAttribute('data-horizon-chip') || 'auto';
        renderLiveAdvisorDrawer();
        capInp?.focus({ preventScroll: true });
        return;
      }
      const pChip = e.target.closest('[data-priority-chip]');
      if (pChip) {
        const pVal = pChip.getAttribute('data-priority-chip') || '';
        state.draft.priority = state.draft.priority === pVal ? '' : pVal;
        renderLiveAdvisorDrawer();
        capInp?.focus({ preventScroll: true });
        return;
      }
      const wChip = e.target.closest('[data-wait-chip]');
      if (wChip) {
        state.draft.waitChoice = wChip.getAttribute('data-wait-chip');
        renderLiveAdvisorDrawer();
        capInp?.focus({ preventScroll: true });
        return;
      }
      const cChip = e.target.closest('[data-cluster-chip]');
      if (cChip) {
        state.draft.clusterOverride = cChip.getAttribute('data-cluster-chip');
        renderLiveAdvisorDrawer();
        capInp?.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('#btn-advisor-open-details')) {
        openNewPlanSheet({ fromDraft: true });
        return;
      }
      if (e.target.closest('#btn-add-and-whatsapp')) {
        addTaskFromDraft(true);
      }
    });

    // Shared Tab Switcher (Desktop Header Nav + Mobile Bottom Dock)
    const handleTabNavClick = (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      state.activeTab = normalizeCommandTab(btn.getAttribute('data-tab'));
      if (state.activeTab === 'prayers') {
        markNotificationsChecked((n) => n && (n.openPrayer || n.tab === 'prayers'));
      } else if (state.activeTab === 'score') {
        markNotificationsChecked((n) => n && n.tab === 'score');
      }
      renderAll();
    };
    document.getElementById('cmd-bottom-dock')?.addEventListener('click', handleTabNavClick);
    document.getElementById('hud-desktop-nav')?.addEventListener('click', handleTabNavClick);

    // Shared Prayer Controls handler (synchronous so task/sheet clicks never yield a microtask before handling)
    const handlePrayerControlClick = (e) => {
      if (e.target.closest('#btn-prayer-master-toggle')) {
        const nextEnabled = !state.prayerConfig.enabled;
        updatePrayerConfig({ enabled: nextEnabled });
        showToast(nextEnabled ? '🕌 Shia Prayer Notifications Enabled' : '🔕 Shia Prayer Notifications Paused');
        return true;
      }
      if (e.target.closest('#btn-prayer-sound-toggle')) {
        const nextSound = !state.prayerConfig.chime;
        if (nextSound) playPrayerChime();
        updatePrayerConfig({ chime: nextSound });
        showToast(nextSound ? '🔊 Spiritual Prayer Chime On' : '🔇 Prayer Chime Muted');
        return true;
      }
      if (e.target.closest('#btn-prayer-gps')) {
        detectPrayerLocationGps(false);
        return true;
      }
      if (e.target.closest('#btn-prayer-test-push')) {
        sendTestPrayerPush().catch(() => {});
        return true;
      }
      if (e.target.closest('#btn-prayer-sub-device')) {
        subscribeCurrentBrowserPush()
          .then(() => renderAll())
          .catch(() => {});
        return true;
      }
      const pToggle = e.target.closest('[data-prayer-toggle]');
      if (pToggle) {
        const pId = pToggle.getAttribute('data-prayer-toggle');
        const keyMap = { fajr: 'notifyFajr', dhuhr: 'notifyDhuhr', maghrib: 'notifyMaghrib' };
        const cfgKey = keyMap[pId] || 'notifyFajr';
        const cur = state.prayerConfig[cfgKey] !== false;
        updatePrayerConfig({
          enabled: true,
          [cfgKey]: !cur
        });
        showToast(`${!cur ? '🔔 Enabled' : '🔕 Muted'} ${pId.toUpperCase()} prayer alert`);
        return true;
      }
      const pAdj = e.target.closest('[data-prayer-adj]');
      if (pAdj) {
        const [pId, deltaStr] = pAdj.getAttribute('data-prayer-adj').split(':');
        const delta = Number(deltaStr) || 0;
        const offMap = { fajr: 'fajrOffsetMin', dhuhr: 'dhuhrOffsetMin', maghrib: 'maghribOffsetMin' };
        const offKey = offMap[pId] || 'fajrOffsetMin';
        const cur = Number(state.prayerConfig[offKey] || 0);
        const nextVal = Math.max(-20, Math.min(20, cur + delta));
        updatePrayerConfig({
          [offKey]: nextVal
        });
        return true;
      }
      const pPreset = e.target.closest('[data-prayer-preset]');
      if (pPreset) {
        const prId = pPreset.getAttribute('data-prayer-preset');
        const found = PRAYER_LOCATION_PRESETS.find((p) => p.id === prId);
        if (found) {
          updatePrayerConfig({
            lat: found.lat,
            lng: found.lng,
            locationName: found.label,
            timeZone: found.timeZone,
            autoGps: false
          });
          showToast(`📍 Prayer location set to ${found.label}`);
        }
        return true;
      }
      const pMethod = e.target.closest('[data-prayer-method]');
      if (pMethod) {
        const mId = pMethod.getAttribute('data-prayer-method');
        const foundM = SHIA_METHODS.find((m) => m.id === mId);
        if (foundM) {
          updatePrayerConfig({ method: foundM.id });
          showToast(`🕌 Calculation set to ${foundM.short}`);
        }
        return true;
      }
      const pPre = e.target.closest('[data-prayer-pre]');
      if (pPre) {
        const mins = Number(pPre.getAttribute('data-prayer-pre')) || 0;
        updatePrayerConfig({ preRemindMin: mins });
        showToast(mins > 0 ? `⏳ Pre-reminder set to ${mins}m before prayer` : '🕌 Exact prayer time alerts only');
        return true;
      }
      return false;
    };

    const handleStageFormSubmit = async (e) => {
      if (e.target.id === 'prayer-custom-loc-form') {
        e.preventDefault();
        const label = document.getElementById('prayer-loc-label')?.value?.trim() || 'Custom Location';
        const lat = Number(document.getElementById('prayer-loc-lat')?.value);
        const lng = Number(document.getElementById('prayer-loc-lng')?.value);
        const tz = document.getElementById('prayer-loc-tz')?.value?.trim() || 'Asia/Beirut';
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          showToast('Please enter valid Latitude and Longitude coordinates');
          return true;
        }
        updatePrayerConfig({
          locationName: label,
          lat: Number(lat.toFixed(4)),
          lng: Number(lng.toFixed(4)),
          timeZone: tz,
          autoGps: false
        });
        showToast(`📍 Saved custom location: ${label} (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`);
        return true;
      }

      const inlineClusterForm = e.target.closest('[data-inline-cluster-form]');
      if (inlineClusterForm) {
        e.preventDefault();
        const cId = inlineClusterForm.getAttribute('data-inline-cluster-form') || 'work';
        const inp = inlineClusterForm.querySelector('input');
        const val = inp?.value?.trim() || '';
        if (val) {
          if (inp) inp.value = '';
          state.activeInlineClusterId = cId;
          await addQuickInlineTask({
            title: val,
            clusterId: cId,
            horizon:
              state.selectedPlanDate && state.selectedPlanDate !== 'all'
                ? ''
                : cId === 'ideas' || cId === 'want_to_do'
                  ? 'backlog'
                  : 'today'
          });
          const nextInp = document.querySelector(`[data-card-inline-input="${CSS.escape(cId)}"]`);
          if (nextInp) nextInp.focus({ preventScroll: true });
        }
        return true;
      }

      const inlineHorizonForm = e.target.closest('[data-inline-horizon-form]');
      if (inlineHorizonForm) {
        e.preventDefault();
        const hId = inlineHorizonForm.getAttribute('data-inline-horizon-form') || 'today';
        const inp = inlineHorizonForm.querySelector('input');
        const val = inp?.value?.trim() || '';
        if (val) {
          if (inp) inp.value = '';
          await addQuickInlineTask({
            title: val,
            horizon: hId
          });
        }
        return true;
      }

      const inlineBuForm = e.target.closest('[data-inline-bu-form]');
      if (inlineBuForm) {
        e.preventDefault();
        const bId = inlineBuForm.getAttribute('data-inline-bu-form') || '';
        const inp = inlineBuForm.querySelector('input');
        const val = inp?.value?.trim() || '';
        if (val) {
          if (inp) inp.value = '';
          await addQuickInlineTask({
            title: val,
            buId: bId === 'personal' ? '' : bId,
            clusterId: bId === 'personal' ? 'family' : 'work',
            horizon: 'today'
          });
        }
        return true;
      }

      const inlinePersonForm = e.target.closest('[data-inline-person-form]');
      if (inlinePersonForm) {
        e.preventDefault();
        const personName = inlinePersonForm.getAttribute('data-inline-person-form') || '';
        const personBu = inlinePersonForm.getAttribute('data-inline-person-bu') || '';
        const inp = inlinePersonForm.querySelector('input');
        const val = inp?.value?.trim() || '';
        if (val && personName) {
          if (inp) inp.value = '';
          await addQuickInlineTask({
            title: val,
            assigneeName: personName,
            buId: personBu,
            clusterId: 'people',
            forceDelegated: true,
            horizon: 'today'
          });
        }
        return true;
      }

      if (e.target.id === 'del-studio-form') {
        e.preventDefault();
        const person = document.getElementById('del-studio-person')?.value?.trim() || '';
        const title = document.getElementById('del-studio-title')?.value?.trim() || '';
        const buId = document.getElementById('del-studio-bu')?.value || '';
        const priority = document.getElementById('del-studio-priority')?.value || 'p2';
        const waitChoice = document.getElementById('del-studio-wait')?.value || 'today';
        const stepsRaw = document.getElementById('del-studio-steps')?.value?.trim() || '';
        const subAct = e.submitter?.getAttribute?.('data-studio-submit') || 'assign';
        if (!person || !title) {
          showToast('Enter both Assignee and Task Title');
          return true;
        }
        state.studioAssigneeName = person;
        state.studioAssigneeBu = buId;
        await addQuickInlineTask({
          title,
          assigneeName: person,
          buId,
          priority,
          waitChoice,
          checklistRaw: stepsRaw,
          clusterId: 'people',
          forceDelegated: true,
          horizon: 'today',
          sendWhatsApp: subAct === 'whatsapp'
        });
        const tInp = document.getElementById('del-studio-title');
        const sInp = document.getElementById('del-studio-steps');
        if (tInp) tInp.value = '';
        if (sInp) sInp.value = '';
        return true;
      }

      if (e.target.id === 'workbench-save-form') {
        e.preventDefault();
        const taskId = document.getElementById('wb-task-id')?.value || '';
        const item = state.reminders.find((r) => r.id === taskId);
        if (!item) return true;

        const newTitle = document.getElementById('wb-title')?.value?.trim() || item.title;
        const newHorizon = document.getElementById('wb-horizon')?.value || 'today';
        const newPriority = document.getElementById('wb-priority')?.value || 'p3';
        const newCluster = document.getElementById('wb-cluster')?.value || item.category;
        const newBu = document.getElementById('wb-bu')?.value || '';
        const newAssignee = document.getElementById('wb-assignee')?.value?.trim() || '';
        const wbPlanDate = document.getElementById('wb-plan-date')?.value?.trim() || '';
        const wbPlanTime = document.getElementById('wb-plan-time')?.value?.trim() || '';
        const newNotes = document.getElementById('wb-notes')?.value?.trim() || '';
        const pendingStepInp = document.querySelector(`[data-step-input-for="${CSS.escape(item.id)}"]`);
        const pendingStepTxt = pendingStepInp?.value?.trim() || '';
        const subAct = e.submitter?.getAttribute?.('data-wb-submit') || 'save';

        item.title = newTitle;
        item.horizon = newHorizon;
        item.priority = newPriority;
        item.category = newCluster;
        item.buId = newBu;
        item.notes = newNotes;

        if (pendingStepTxt) {
          if (!Array.isArray(item.checklist)) item.checklist = [];
          item.checklist.push({
            id: `st_${Date.now().toString(36)}_${item.checklist.length}`,
            text: pendingStepTxt,
            done: false
          });
        }

        if (wbPlanDate && /^\d{4}-\d{2}-\d{2}$/.test(wbPlanDate)) {
          item.planDate = wbPlanDate;
          if (wbPlanTime && /^\d{1,2}:\d{2}$/.test(wbPlanTime)) {
            const [yy, mm, dd] = wbPlanDate.split('-').map(Number);
            const [hh, mi] = wbPlanTime.split(':').map(Number);
            const parsedMs = new Date(yy, mm - 1, dd, hh, mi, 0, 0).getTime();
            if (Number.isFinite(parsedMs) && parsedMs > 0) {
              item.dueAt = parsedMs;
              item.hasAlarm = true;
              if (item.matureAt || isHoldOrTimerCategory(newCluster)) item.matureAt = parsedMs;
            }
          } else {
            item.hasAlarm = false;
            item.dueAt = 0;
            item.matureAt = 0;
          }
          item.horizon = horizonFromIso(wbPlanDate);
          if (item.kind === 'parked') item.kind = 'task';
        } else {
          item.planDate = '';
          item.hasAlarm = false;
          item.dueAt = 0;
          item.matureAt = 0;
          if (newHorizon === 'backlog') item.kind = 'parked';
        }

        if (newAssignee) {
          item.assigneeName = newAssignee;
          item.isDelegated = true;
          item.subTag = newAssignee;
          if (!item.delegationStatus) item.delegationStatus = 'assigned';
          if (!item.taskToken) item.taskToken = randomToken(12);
          if (!state.teamRoster.some((m) => m.name.toLowerCase() === newAssignee.toLowerCase())) {
            state.teamRoster.push({
              id: `tm_${Date.now().toString(36)}`,
              name: newAssignee,
              role: 'Team Member',
              bu: newBu || 'holding',
              phone: ''
            });
          }
        } else {
          item.assigneeName = '';
          item.assigneeId = '';
          item.isDelegated = false;
        }

        item.updatedAt = Date.now();
        saveLocalState();
        closeActiveSheet();
        renderAll();
        if (item.matureAt || item.dueAt) {
          scheduleCloudTimerPush(item, null, true).catch(() => {});
        } else {
          cancelCloudTimerPush(item.id).catch(() => {});
        }
        syncAll(item).catch(() => {});

        if (subAct === 'whatsapp' && item.isDelegated) {
          dispatchWhatsAppDelegation(item.id);
        } else {
          showToast('✓ Saved plan updates');
        }
        return true;
      }

      return false;
    };

    // Delegated clicks inside Main Stage & Slide-Up Sheet
    const handleTaskInteraction = (e) => {
      if (handlePrayerControlClick(e)) return;

      const openPrayerTrigger = e.target.closest('[data-open-prayer]');
      if (openPrayerTrigger) {
        state.activeTab = 'prayers';
        renderAll();
        return;
      }

      const openNewPlanDateBtn = e.target.closest('[data-open-new-plan-date]');
      if (openNewPlanDateBtn) {
        const dIso = openNewPlanDateBtn.getAttribute('data-open-new-plan-date') || '';
        const baseIso = todayIso();
        const tomIso = shiftIsoDate(baseIso, 1);
        const wm = dIso === baseIso ? 'today' : dIso === tomIso ? 'tomorrow' : 'date';
        openNewPlanSheet({ whenMode: wm, planDate: dIso });
        return;
      }

      const openNewPlanClusterBtn = e.target.closest('[data-open-new-plan-cluster]');
      if (openNewPlanClusterBtn) {
        const cId = openNewPlanClusterBtn.getAttribute('data-open-new-plan-cluster') || 'work';
        const qVal = document.getElementById('sheet-quick-input')?.value?.trim() || '';
        openNewPlanSheet({ title: qVal, clusterId: cId, manualCluster: true });
        return;
      }

      if (e.target.closest('[data-open-new-plan]')) {
        openNewPlanSheet();
        return;
      }

      const toggleCardAddBtn = e.target.closest('[data-toggle-card-add]');
      if (toggleCardAddBtn) {
        e.stopPropagation();
        const cId = toggleCardAddBtn.getAttribute('data-toggle-card-add') || '';
        state.activeInlineClusterId = state.activeInlineClusterId === cId ? '' : cId;
        renderPlanningView();
        if (state.activeInlineClusterId) {
          setTimeout(() => {
            const inp = document.querySelector(`[data-card-inline-input="${CSS.escape(cId)}"]`);
            if (inp) inp.focus({ preventScroll: true });
          }, 15);
        }
        return;
      }

      const closeCardAddBtn = e.target.closest('[data-close-card-add]');
      if (closeCardAddBtn) {
        e.stopPropagation();
        state.activeInlineClusterId = '';
        renderPlanningView();
        return;
      }

      const cardDetailsBtn = e.target.closest('[data-card-open-details]');
      if (cardDetailsBtn) {
        e.stopPropagation();
        const cId = cardDetailsBtn.getAttribute('data-card-open-details') || 'work';
        const inp = document.querySelector(`[data-card-inline-input="${CSS.escape(cId)}"]`);
        const curVal = inp?.value?.trim() || '';
        state.activeInlineClusterId = '';
        renderPlanningView();
        openNewPlanSheet({ title: curVal, clusterId: cId, manualCluster: true });
        return;
      }

      const planDateCell = e.target.closest('[data-plan-date]');
      if (planDateCell) {
        const dIso = planDateCell.getAttribute('data-plan-date') || 'all';
        const nextDate = state.selectedPlanDate === dIso && dIso !== 'all' ? '' : dIso === 'all' ? '' : dIso;
        state.selectedPlanDate = nextDate;
        renderLiveAdvisorDrawer();
        renderPlanningView();
        return;
      }

      if (e.target.closest('#btn-auto-plan-today')) {
        autoPlanTodayHorizon();
        return;
      }

      if (e.target.closest('#btn-goto-delegation-studio')) {
        state.activeTab = 'delegated';
        renderAll();
        setTimeout(() => document.getElementById('del-studio-title')?.focus(), 40);
        return;
      }

      const planModeBtn = e.target.closest('[data-planning-mode]');
      if (planModeBtn) {
        state.planningMode = planModeBtn.getAttribute('data-planning-mode') || 'radar';
        renderPlanningView();
        return;
      }

      const delViewModeBtn = e.target.closest('[data-del-view-mode]');
      if (delViewModeBtn) {
        state.delegatedViewMode = delViewModeBtn.getAttribute('data-del-view-mode') || 'pipeline';
        renderDelegatedView();
        return;
      }

      const studioPickPerson = e.target.closest('[data-studio-pick-person]');
      if (studioPickPerson) {
        const pName = studioPickPerson.getAttribute('data-studio-pick-person') || '';
        const pBu = studioPickPerson.getAttribute('data-studio-pick-bu') || '';
        state.studioAssigneeName = pName;
        if (pBu) state.studioAssigneeBu = pBu;
        const pInp = document.getElementById('del-studio-person');
        const bSel = document.getElementById('del-studio-bu');
        if (pInp) pInp.value = pName;
        if (bSel && pBu) bSel.value = pBu;
        document.querySelectorAll('[data-studio-pick-person]').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-studio-pick-person') === pName);
        });
        document.getElementById('del-studio-title')?.focus();
        return;
      }

      if (e.target.closest('#btn-quick-add-person')) {
        openTeamRosterSheet({ showAddForm: true, manageMode: false });
        return;
      }

      const wbPickPerson = e.target.closest('[data-wb-pick-person]');
      if (wbPickPerson) {
        const pName = wbPickPerson.getAttribute('data-wb-pick-person') || '';
        const pBu = wbPickPerson.getAttribute('data-wb-pick-bu') || '';
        const aInp = document.getElementById('wb-assignee');
        const bSel = document.getElementById('wb-bu');
        if (aInp) aInp.value = pName;
        if (bSel && pBu) bSel.value = pBu;
        return;
      }

      const tplChip = e.target.closest('[data-template-cluster]');
      if (tplChip) {
        e.stopPropagation();
        const cId = tplChip.getAttribute('data-template-cluster') || 'work';
        const tplText = tplChip.getAttribute('data-template-text') || '';
        const cardForm = document.querySelector(`[data-inline-cluster-form="${cId}"] input`);
        if (cardForm) {
          cardForm.value = tplText;
          cardForm.focus();
        } else {
          state.draft.text = tplText;
          state.draft.clusterOverride = cId;
          const cap = document.getElementById('capture-input');
          if (cap) {
            cap.value = tplText;
            cap.focus();
          }
          renderLiveAdvisorDrawer();
        }
        return;
      }

      const gotoTasksBtn = e.target.closest('[data-goto-tasks-filter]');
      if (gotoTasksBtn) {
        state.taskFilter = gotoTasksBtn.getAttribute('data-goto-tasks-filter') || 'all';
        state.activeTab = 'tasks';
        renderAll();
        return;
      }

      const taskFilterBtn = e.target.closest('[data-task-filter]');
      if (taskFilterBtn) {
        state.taskFilter = taskFilterBtn.getAttribute('data-task-filter') || 'all';
        renderTasksView();
        return;
      }

      const actBtn = e.target.closest('[data-act]');
      if (actBtn) {
        e.stopPropagation();
        const act = actBtn.getAttribute('data-act');
        if (act === 'toggle-completed-archive') {
          state.completedSectionOpen = !state.completedSectionOpen;
          renderAll();
          if (state.completedSectionOpen) {
            setTimeout(() => {
              document
                .getElementById('completed-archive-card')
                ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 40);
          }
          return;
        }
        if (act === 'person-digest') {
          const person = actBtn.getAttribute('data-person') || '';
          dispatchPersonDigestWhatsApp(person);
          return;
        }

        const id = actBtn.getAttribute('data-id');
        if (id) {
          markNotificationsChecked((n) => n && n.taskId === id);
        }
        const item = state.reminders.find((r) => r.id === id);
        if (!item) return;

        if (act === 'open-workbench') {
          openTaskWorkbenchSheet(item.id);
          return;
        }
        if (act === 'set-horizon') {
          const hVal = actBtn.getAttribute('data-horizon') || 'today';
          item.horizon = hVal;
          const baseIso = todayIso();
          if (hVal === 'today') {
            item.planDate = baseIso;
            if (item.kind === 'parked') item.kind = 'task';
            if (item.hasAlarm && item.dueAt) {
              const d = new Date(item.dueAt);
              const [yy, mm, dd] = baseIso.split('-').map(Number);
              item.dueAt = new Date(yy, mm - 1, dd, d.getHours(), d.getMinutes(), 0, 0).getTime();
            }
          } else if (hVal === 'tomorrow') {
            const tomIso = shiftIsoDate(baseIso, 1);
            item.planDate = tomIso;
            if (item.kind === 'parked') item.kind = 'task';
            if (item.hasAlarm && item.dueAt) {
              const d = new Date(item.dueAt);
              const [yy, mm, dd] = tomIso.split('-').map(Number);
              item.dueAt = new Date(yy, mm - 1, dd, d.getHours(), d.getMinutes(), 0, 0).getTime();
            }
          } else if (hVal === 'week') {
            item.planDate = shiftIsoDate(baseIso, 3);
            if (item.kind === 'parked') item.kind = 'task';
          } else if (hVal === 'backlog') {
            item.planDate = '';
            item.hasAlarm = false;
            item.dueAt = 0;
            item.matureAt = 0;
            item.kind = 'parked';
          }
          item.updatedAt = Date.now();
          saveLocalState();
          renderAll();
          syncAll().catch(() => {});
          showToast(`Moved to ${hVal === 'backlog' ? 'Someday' : hVal.charAt(0).toUpperCase() + hVal.slice(1)}`);
          return;
        }
        if (act === 'set-del-stage') {
          const stKey = actBtn.getAttribute('data-stage') || 'assigned';
          item.delegationStatus = stKey;
          item.isDelegated = true;
          item.ownerStatusAt = Date.now();
          item.updatedAt = Date.now();
          saveLocalState();
          renderAll();
          syncAll(item).catch(() => {});
          showToast(`Updated ${item.assigneeName || 'task'} stage → ${stKey.toUpperCase()}`);
          return;
        }
        if (act === 'toggle-step') {
          const stepId = actBtn.getAttribute('data-step-id');
          if (Array.isArray(item.checklist)) {
            const st = item.checklist.find((s) => s.id === stepId);
            if (st) {
              st.done = !st.done;
              item.updatedAt = Date.now();
              saveLocalState();
              renderAll();
              syncAll(item).catch(() => {});
            }
          }
          return;
        }
        if (act === 'delete-step') {
          const stepId = actBtn.getAttribute('data-step-id');
          if (Array.isArray(item.checklist)) {
            item.checklist = item.checklist.filter((s) => s.id !== stepId);
            item.updatedAt = Date.now();
            saveLocalState();
            renderAll();
            syncAll(item).catch(() => {});
          }
          return;
        }
        if (act === 'add-step') {
          const container = actBtn.parentElement;
          const inp = container?.querySelector(`[data-step-input-for="${item.id}"]`);
          const txt = inp?.value?.trim() || '';
          if (txt) {
            if (!Array.isArray(item.checklist)) item.checklist = [];
            item.checklist.push({
              id: `st_${Date.now().toString(36)}_${item.checklist.length}`,
              text: txt,
              done: false
            });
            if (inp) inp.value = '';
            item.updatedAt = Date.now();
            saveLocalState();
            renderAll();
            syncAll(item).catch(() => {});
          }
          return;
        }
        if (act === 'toggle-done') {
          if (!item.completed && (item.recur === 'daily' || item.recur === 'weekly')) {
            const deltaMs = item.recur === 'weekly' ? 7 * 86400000 : 86400000;
            const base = Math.max(Date.now(), Number(item.dueAt || item.matureAt || Date.now()));
            item.dueAt = base + deltaMs;
            if (item.matureAt) item.matureAt = base + deltaMs;
            item.completed = false;
            item.updatedAt = Date.now();
            saveLocalState();
            renderAll();
            scheduleCloudTimerPush(item, null, true).catch(() => {});
            syncAll().catch(() => {});
            showToast(`🔁 Completed today · Rolled forward (${item.recur === 'weekly' ? '+7d' : '+24h'})`);
            return;
          }
          const nowTs = Date.now();
          item.completed = !item.completed;
          if (item.completed) {
            item.completedAt = nowTs;
            if (item.isDelegated) {
              item.delegationStatus = 'verified';
            }
            // Keep checked task visible in-place on the group card for 2.2s (and extend any other recently checked tasks) so checking multiple tasks in a group on iPhone never shifts rows under your thumb
            if (!state.recentlyCompletedUntil) state.recentlyCompletedUntil = {};
            const graceUntil = nowTs + 2200;
            for (const k of Object.keys(state.recentlyCompletedUntil)) {
              if (Number(state.recentlyCompletedUntil[k] || 0) > nowTs) {
                state.recentlyCompletedUntil[k] = graceUntil;
              } else {
                delete state.recentlyCompletedUntil[k];
              }
            }
            state.recentlyCompletedUntil[item.id] = graceUntil;
            if (recentlyCompletedTimer) clearTimeout(recentlyCompletedTimer);
            recentlyCompletedTimer = setTimeout(() => {
              const tNow = Date.now();
              if (state.recentlyCompletedUntil) {
                for (const k of Object.keys(state.recentlyCompletedUntil)) {
                  if (Number(state.recentlyCompletedUntil[k] || 0) <= tNow) {
                    delete state.recentlyCompletedUntil[k];
                  }
                }
              }
              requestBackgroundRender();
            }, 2260);
          } else {
            item.completedAt = 0;
            if (state.recentlyCompletedUntil) {
              delete state.recentlyCompletedUntil[item.id];
            }
          }
          item.updatedAt = nowTs;
          saveLocalState();
          renderAll();
          if (item.completed) {
            cancelCloudTimerPush(item.id).catch(() => {});
          } else if (item.matureAt || item.dueAt) {
            scheduleCloudTimerPush(item, null, true).catch(() => {});
          }
          syncAll().catch(() => {});
          showToast(item.completed ? '✓ Marked complete (saved in ✓ Completed)' : '↺ Reopened task');
          return;
        }
        if (act === 'whatsapp') {
          if (!item.assigneeName) {
            openTeamRosterSheet({
              pickForDraft: false,
              existingTaskId: item.id,
              showAddForm: state.teamRoster.length === 0
            });
            return;
          }
          dispatchWhatsAppDelegation(item.id);
          return;
        }
        if (act === 'copy-link') {
          if (!item.taskToken) item.taskToken = randomToken(12);
          const url = getDelegationMagicUrl(item);
          navigator.clipboard?.writeText(url);
          saveLocalState();
          syncAll(item).catch(() => {});
          showToast('🔗 Private staff status link copied!');
          return;
        }
        if (act === 'snooze-1d' || act === 'snooze-3d') {
          const addMs = act === 'snooze-1d' ? 86400000 : 3 * 86400000;
          const base = Math.max(Date.now(), Number(item.matureAt || item.dueAt || Date.now()));
          if (item.matureAt) item.matureAt = base + addMs;
          else item.dueAt = base + addMs;
          item.updatedAt = Date.now();
          saveLocalState();
          renderAll();
          scheduleCloudTimerPush(item, null, true).catch(() => {});
          syncAll().catch(() => {});
          showToast(`⏳ Snoozed ${act === 'snooze-1d' ? '+24h' : '+3d'} & cloud alarm updated`);
          return;
        }
        if (act === 'release-now') {
          item.matureAt = Date.now() - 1000;
          item.dueAt = Date.now() - 1000;
          item.horizon = 'today';
          item.updatedAt = Date.now();
          saveLocalState();
          renderAll();
          cancelCloudTimerPush(item.id).catch(() => {});
          syncAll().catch(() => {});
          showToast('Marked Ready Now');
          return;
        }
        if (act === 'move-cluster') {
          const idx = CLUSTERS.findIndex((c) => c.id === item.category);
          const next = CLUSTERS[(idx + 1) % CLUSTERS.length];
          item.category = next.id;
          item.updatedAt = Date.now();
          saveLocalState();
          renderAll();
          syncAll().catch(() => {});
          showToast(`Moved to ${next.shortLabel}`);
          return;
        }
        if (act === 'delete') {
          if (!state.deletedIds.includes(id)) {
            state.deletedIds.push(id);
          }
          state.reminders = state.reminders.filter((r) => r.id !== id);
          if (state.openTaskWorkbenchId === id) {
            closeActiveSheet();
          }
          saveLocalState();
          renderAll();
          cancelCloudTimerPush(id).catch(() => {});
          syncAll().catch(() => {});
          showToast('Removed item');
          return;
        }
      }

      // Open Task Workbench from micro-row or horizon card click (if tap was near left checkbox edge on mobile, toggle complete instead)
      const openWbRow = e.target.closest('[data-open-workbench]');
      if (openWbRow && !e.target.closest('button') && !e.target.closest('input')) {
        if (openWbRow.classList.contains('bento-micro-row') && typeof e.clientX === 'number' && e.clientX > 0) {
          const rect = openWbRow.getBoundingClientRect();
          if (e.clientX - rect.left <= 44) {
            const checkBtn = openWbRow.querySelector('[data-act="toggle-done"]');
            if (checkBtn) {
              checkBtn.click();
              return;
            }
          }
        }
        const wId = openWbRow.getAttribute('data-open-workbench');
        if (wId) {
          openTaskWorkbenchSheet(wId);
          return;
        }
      }

      // Expand / collapse ticker row
      const rowToggle = e.target.closest('[data-row-toggle]');
      if (rowToggle) {
        const rId = rowToggle.getAttribute('data-row-toggle');
        if (rId) {
          markNotificationsChecked((n) => n && n.taskId === rId);
        }
        state.expandedRowId = state.expandedRowId === rId ? '' : rId;
        renderAll();
        return;
      }

      // Open Bento Cluster Sheet (when clicking card header or "+N more")
      const tile = e.target.closest('[data-open-cluster]');
      if (tile) {
        openClusterSheet(tile.getAttribute('data-open-cluster'));
        return;
      }

      // Filter pills
      const dbu = e.target.closest('[data-del-bu]');
      if (dbu) {
        state.delegatedBuFilter = dbu.getAttribute('data-del-bu');
        renderDelegatedView();
        return;
      }
      const dst = e.target.closest('[data-del-status]');
      if (dst) {
        state.delegatedStatusFilter = dst.getAttribute('data-del-status');
        renderDelegatedView();
        return;
      }
      const bf = e.target.closest('[data-board-filter]');
      if (bf) {
        state.boardFilter = bf.getAttribute('data-board-filter');
        renderPlanningView();
        return;
      }
      if (e.target.closest('#btn-manage-roster')) {
        openTeamRosterSheet(false);
        return;
      }

      // 100% Score tab controls
      const sh = e.target.closest('[data-set-habit]');
      if (sh) {
        const [grp, hId, val] = sh.getAttribute('data-set-habit').split(':');
        setHabitState(grp, hId, val);
        return;
      }
      const sd = e.target.closest('[data-score-date]');
      if (sd) {
        state.scoreDate = sd.getAttribute('data-score-date');
        renderScoreView();
        return;
      }
      if (e.target.closest('#btn-score-today')) {
        state.scoreDate = todayIso();
        renderScoreView();
        return;
      }
      if (e.target.closest('#btn-score-reset')) {
        state.dailyScores[state.scoreDate] = {
          date: state.scoreDate,
          dos: {},
          donts: {},
          updatedAt: Date.now()
        };
        saveLocalState();
        renderAll();
        syncAll().catch(() => {});
        showToast('Reset day to 50% baseline');
      }
    };

    document.getElementById('cmd-stage')?.addEventListener('click', handleTaskInteraction);
    document.getElementById('cmd-stage')?.addEventListener('submit', handleStageFormSubmit);
    document.getElementById('cmd-stage')?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      const target = e.target;
      if (!target || (target.tagName || '').toUpperCase() !== 'INPUT') return;
      const stepTaskId = target.getAttribute('data-step-input-for');
      if (stepTaskId) {
        e.preventDefault();
        e.stopPropagation();
        const addBtn = target.parentElement?.querySelector(`[data-act="add-step"][data-id="${stepTaskId}"]`);
        if (addBtn) addBtn.click();
        return;
      }
      const form = target.closest('form');
      if (form) {
        e.preventDefault();
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    });

    // Sheet interactions
    const backdrop = document.getElementById('sheet-backdrop');
    document.getElementById('sheet-close-btn')?.addEventListener('click', () => {
      closeActiveSheet();
    });
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeActiveSheet();
      }
    });

    document.getElementById('sheet-body')?.addEventListener('click', async (e) => {
      if (handlePrayerControlClick(e)) return;

      if (e.target.closest('#btn-notif-mark-all-read')) {
        markAllNotificationsChecked();
        openNotificationCenterSheet(true);
        showToast('✓ All notifications marked as checked');
        return;
      }
      if (e.target.closest('#btn-notif-clear-history')) {
        clearNotificationHistory();
        openNotificationCenterSheet(true);
        showToast('Cleared notification history');
        return;
      }
      const checkOneBtn = e.target.closest('[data-notif-check-one]');
      if (checkOneBtn) {
        e.stopPropagation();
        const nId = checkOneBtn.getAttribute('data-notif-check-one');
        if (nId) {
          markNotificationsChecked((n) => n && (n.id === nId || n.tag === nId));
          openNotificationCenterSheet(true);
        }
        return;
      }
      const openNotifEl = e.target.closest('[data-notif-open]');
      if (openNotifEl) {
        const nId = openNotifEl.getAttribute('data-notif-open');
        const found = (state.notifications || []).find((n) => n && (n.id === nId || n.tag === nId));
        if (found) {
          markNotificationsChecked((n) => n && (n.id === found.id || n.tag === found.tag));
          state.sheetOpenedWithUnreadIds = [];
          closeActiveSheet();
          applyCommandNotificationNav(found);
        }
        return;
      }

      if (e.target.closest('#btn-notif-enable-device')) {
        await subscribeCurrentBrowserPush();
        openNotificationCenterSheet(true);
        return;
      }
      if (e.target.closest('#btn-notif-rearm-all')) {
        showToast('⚡ Re-arming all Prayer, Task & Timer cloud pushes…');
        await syncAll();
        const pCnt = await scheduleUpcomingPrayerCloudPushes(null, true);
        const tCnt = await scheduleAllActiveTaskCloudPushes(null, true);
        showToast(`✅ Armed ${pCnt} prayer slots & ${tCnt} task/timer alarms in Cloud Relay!`);
        openNotificationCenterSheet(true);
        return;
      }
      const nToggle = e.target.closest('[data-notif-toggle]');
      if (nToggle) {
        const ch = nToggle.getAttribute('data-notif-toggle');
        if (ch === 'prayers') {
          const nextP = !(state.notifPrefs.prayers !== false && state.prayerConfig.enabled !== false);
          state.notifPrefs.prayers = nextP;
          updatePrayerConfig({ enabled: nextP });
        } else if (ch && ch in state.notifPrefs) {
          state.notifPrefs[ch] = !state.notifPrefs[ch];
          if (ch === 'chime') {
            state.prayerConfig.chime = state.notifPrefs.chime;
            if (state.notifPrefs.chime) playTaskChime();
          }
          saveLocalState();
          syncAll().catch(() => {});
        }
        openNotificationCenterSheet(true);
        return;
      }
      const nTest = e.target.closest('[data-notif-test]');
      if (nTest) {
        const ch = nTest.getAttribute('data-notif-test') || 'prayers';
        await sendChannelTestPush(ch);
        if (state.openSheetKind === 'notifications' && !backdrop?.hidden) {
          openNotificationCenterSheet(true);
        }
        return;
      }

      const quickAdd = e.target.closest('#sheet-quick-add');
      if (quickAdd) {
        const cId = quickAdd.getAttribute('data-cluster');
        const qInp = document.getElementById('sheet-quick-input');
        if (qInp && qInp.value.trim()) {
          state.draft.text = qInp.value.trim();
          state.draft.clusterOverride = cId;
          addTaskFromDraft(false);
        }
        return;
      }
      const sheetWaitChip = e.target.closest('[data-sheet-wait-chip]');
      if (sheetWaitChip) {
        state.draft.waitChoice = sheetWaitChip.getAttribute('data-sheet-wait-chip') || 'auto';
        renderLiveAdvisorDrawer();
        openTeamRosterSheet(state.rosterSheetOpts);
        return;
      }

      if (e.target.closest('#btn-toggle-roster-add')) {
        const cur = state.rosterSheetOpts || {};
        openTeamRosterSheet({
          ...cur,
          showAddForm: !cur.showAddForm,
          editMemberId: ''
        });
        return;
      }

      if (e.target.closest('#btn-cancel-roster-form')) {
        const cur = state.rosterSheetOpts || {};
        openTeamRosterSheet({
          ...cur,
          showAddForm: false,
          editMemberId: ''
        });
        return;
      }

      if (e.target.closest('#btn-toggle-roster-manage')) {
        const cur = state.rosterSheetOpts || {};
        openTeamRosterSheet({
          ...cur,
          manageMode: !cur.manageMode,
          editMemberId: ''
        });
        return;
      }

      const rosterSubmitBtn = e.target.closest('[data-roster-submit]');
      if (rosterSubmitBtn) {
        state.rosterSheetOpts.submitAction =
          rosterSubmitBtn.getAttribute('data-roster-submit') || 'assign';
      }

      const editM = e.target.closest('[data-edit-member]');
      if (editM) {
        const mId = editM.getAttribute('data-edit-member');
        openTeamRosterSheet({
          ...(state.rosterSheetOpts || {}),
          showAddForm: true,
          editMemberId: mId
        });
        return;
      }

      const waM = e.target.closest('[data-wa-member]');
      if (waM) {
        const mId = waM.getAttribute('data-wa-member');
        const mem = state.teamRoster.find((m) => m.id === mId);
        if (mem) {
          const exId = state.rosterSheetOpts?.existingTaskId;
          if (exId) {
            assignExistingTaskToMember(exId, mem, true);
            return;
          }
          state.draft.assigneeId = mem.id;
          state.draft.assigneeName = mem.name;
          state.draft.assigneeBu = mem.bu;
          if (state.draft.text.trim()) {
            if (backdrop) backdrop.hidden = true;
            await addTaskFromDraft(true);
          } else {
            openTeamRosterSheet(state.rosterSheetOpts);
            const tInp = document.getElementById('delegate-sheet-task-input');
            if (tInp) tInp.focus();
            showToast(`Selected 👤 ${mem.name} — type the task above, then tap 📲 WhatsApp`);
          }
        }
        return;
      }

      const pickM = e.target.closest('[data-pick-member]');
      if (pickM) {
        const mId = pickM.getAttribute('data-pick-member');
        const mem = state.teamRoster.find((m) => m.id === mId);
        if (mem) {
          const exId = state.rosterSheetOpts?.existingTaskId;
          if (exId) {
            assignExistingTaskToMember(exId, mem, false);
            return;
          }
          state.draft.assigneeId = mem.id;
          state.draft.assigneeName = mem.name;
          state.draft.assigneeBu = mem.bu;
          if (state.draft.text.trim()) {
            if (backdrop) backdrop.hidden = true;
            await addTaskFromDraft(false);
          } else {
            if (backdrop) backdrop.hidden = true;
            renderLiveAdvisorDrawer();
            document.getElementById('capture-input')?.focus();
            showToast(`Delegating to 👤 ${mem.name} — type your task & tap + Assign`);
          }
        }
        return;
      }
      const delM = e.target.closest('[data-del-member]');
      if (delM) {
        const mId = delM.getAttribute('data-del-member');
        if (mId && !state.deletedIds.includes(mId)) {
          state.deletedIds.push(mId);
        }
        state.teamRoster = state.teamRoster.filter((m) => m.id !== mId);
        saveLocalState();
        openTeamRosterSheet({
          ...(state.rosterSheetOpts || {}),
          editMemberId: ''
        });
        syncAll().catch(() => {});
        showToast('Removed from team roster');
        return;
      }
      handleTaskInteraction(e);
    });

    // Dedicated New Plan Composer interactions inside #sheet-body
    document.getElementById('sheet-body')?.addEventListener('click', (e) => {
      if (state.openSheetKind !== 'new_plan' || !state.newPlanForm) return;
      if (e.target.closest('[data-np-cancel]')) {
        closeActiveSheet();
        return;
      }
      const whenBtn = e.target.closest('[data-np-when]');
      if (whenBtn) {
        syncNewPlanDomFieldsToState();
        const wm = whenBtn.getAttribute('data-np-when') || 'today';
        const baseIso = todayIso();
        state.newPlanForm.whenMode = wm;
        if (wm === 'today') state.newPlanForm.planDate = baseIso;
        else if (wm === 'tomorrow') state.newPlanForm.planDate = shiftIsoDate(baseIso, 1);
        else if (wm === 'week') state.newPlanForm.planDate = shiftIsoDate(baseIso, 3);
        else if (wm === 'date' && !state.newPlanForm.planDate) state.newPlanForm.planDate = baseIso;
        else if (wm === 'backlog') state.newPlanForm.planDate = '';
        renderNewPlanSheetBody(wm === 'date' ? '#np-plan-date' : '');
        return;
      }
      const holdBtn = e.target.closest('[data-np-hold]');
      if (holdBtn) {
        syncNewPlanDomFieldsToState();
        state.newPlanForm.holdChoice = holdBtn.getAttribute('data-np-hold') || '1d';
        renderNewPlanSheetBody();
        return;
      }
      const catBtn = e.target.closest('[data-np-cat]');
      if (catBtn) {
        syncNewPlanDomFieldsToState();
        state.newPlanForm.clusterId = catBtn.getAttribute('data-np-cat') || 'work';
        state.newPlanForm.manualCluster = true;
        document.querySelectorAll('[data-np-cat]').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-np-cat') === state.newPlanForm.clusterId);
        });
        const hintEl = document.getElementById('np-cat-hint');
        if (hintEl) hintEl.textContent = 'Selected';
        return;
      }
      const pickPersonBtn = e.target.closest('[data-np-pick-person]');
      if (pickPersonBtn) {
        syncNewPlanDomFieldsToState();
        const pName = pickPersonBtn.getAttribute('data-np-pick-person') || '';
        const pBu = pickPersonBtn.getAttribute('data-np-pick-bu') || '';
        state.newPlanForm.assigneeName = state.newPlanForm.assigneeName === pName ? '' : pName;
        if (state.newPlanForm.assigneeName && pBu) state.newPlanForm.buId = pBu;
        if (state.newPlanForm.assigneeName && !state.newPlanForm.manualCluster) {
          state.newPlanForm.clusterId = 'people';
        }
        renderNewPlanSheetBody();
        return;
      }
      if (e.target.closest('#btn-np-add-step')) {
        syncNewPlanDomFieldsToState();
        const stepTxt = String(state.newPlanForm.pendingStep || '').trim();
        if (stepTxt) {
          state.newPlanForm.checklist.push({
            id: `st_${Date.now().toString(36)}_${state.newPlanForm.checklist.length}`,
            text: stepTxt,
            done: false
          });
          state.newPlanForm.pendingStep = '';
          renderNewPlanSheetBody('#np-step-input');
        } else {
          document.getElementById('np-step-input')?.focus();
        }
        return;
      }
      const delStepBtn = e.target.closest('[data-np-del-step]');
      if (delStepBtn) {
        syncNewPlanDomFieldsToState();
        const idx = Number(delStepBtn.getAttribute('data-np-del-step'));
        if (Number.isInteger(idx) && idx >= 0) {
          state.newPlanForm.checklist.splice(idx, 1);
          renderNewPlanSheetBody('#np-step-input');
        }
      }
    });

    document.getElementById('sheet-body')?.addEventListener('submit', async (e) => {
      if (e.target.id === 'new-plan-form') {
        e.preventDefault();
        const subMode = e.submitter?.getAttribute?.('data-np-submit') || 'save';
        await submitNewPlanForm(subMode);
        return;
      }
      if (await handleStageFormSubmit(e)) return;
      if (e.target.id === 'roster-add-form') {
        e.preventDefault();
        const name = document.getElementById('roster-name')?.value?.trim();
        const role = document.getElementById('roster-role')?.value?.trim() || '';
        const bu = document.getElementById('roster-bu')?.value || 'holding';
        const phone = document.getElementById('roster-phone')?.value?.trim() || '';
        if (!name) return;

        const opts = state.rosterSheetOpts || {};
        const subAct = e.submitter?.getAttribute?.('data-roster-submit') || opts.submitAction || 'assign';
        let savedMember = null;

        if (opts.editMemberId) {
          const idx = state.teamRoster.findIndex((m) => m.id === opts.editMemberId);
          if (idx >= 0) {
            state.teamRoster[idx] = {
              ...state.teamRoster[idx],
              name,
              role,
              bu,
              phone
            };
            savedMember = state.teamRoster[idx];
          }
        }
        if (!savedMember) {
          savedMember = {
            id: `tm_${Date.now().toString(36)}`,
            name,
            role,
            bu,
            phone
          };
          state.teamRoster.push(savedMember);
        }

        saveLocalState();
        renderAll();
        syncAll().catch(() => {});

        if (opts.existingTaskId && (subAct === 'assign' || subAct === 'whatsapp')) {
          assignExistingTaskToMember(opts.existingTaskId, savedMember, subAct === 'whatsapp');
          return;
        }

        if (opts.pickForDraft && (subAct === 'assign' || subAct === 'whatsapp')) {
          state.draft.assigneeId = savedMember.id;
          state.draft.assigneeName = savedMember.name;
          state.draft.assigneeBu = savedMember.bu;
          if (state.draft.text.trim()) {
            if (backdrop) backdrop.hidden = true;
            await addTaskFromDraft(subAct === 'whatsapp');
          } else {
            if (backdrop) backdrop.hidden = true;
            renderLiveAdvisorDrawer();
            document.getElementById('capture-input')?.focus();
            showToast(`Added & selected 👤 ${savedMember.name}`);
          }
          return;
        }

        openTeamRosterSheet({
          ...opts,
          showAddForm: false,
          editMemberId: ''
        });
        showToast(opts.editMemberId ? `Updated 👤 ${name}` : `Added 👤 ${name} to Team Roster`);
      }
    });

    document.getElementById('sheet-body')?.addEventListener('input', (e) => {
      if (e.target.id === 'delegate-sheet-task-input') {
        state.draft.text = e.target.value;
        return;
      }
      if (state.openSheetKind === 'new_plan' && state.newPlanForm) {
        if (e.target.id === 'np-title') {
          state.newPlanForm.title = e.target.value;
          if (!state.newPlanForm.manualCluster) {
            const autoC = detectCluster(state.newPlanForm.title, '').id;
            state.newPlanForm.clusterId = autoC;
            document.querySelectorAll('[data-np-cat]').forEach((b) => {
              b.classList.toggle('active', b.getAttribute('data-np-cat') === autoC);
            });
          }
          const ctx = extractSmartContext(state.newPlanForm.title);
          if (ctx.assigneeName) {
            const asgEl = document.getElementById('np-assignee');
            if (asgEl && !asgEl.value) {
              asgEl.value = ctx.assigneeName;
              state.newPlanForm.assigneeName = ctx.assigneeName;
              const waBtn = document.getElementById('btn-np-submit-wa');
              if (waBtn) waBtn.style.display = '';
            }
          }
          return;
        }
        if (e.target.id === 'np-assignee') {
          state.newPlanForm.assigneeName = e.target.value;
          const waBtn = document.getElementById('btn-np-submit-wa');
          if (waBtn) waBtn.style.display = e.target.value.trim() ? '' : 'none';
          return;
        }
        if (e.target.id === 'np-plan-date') {
          const val = e.target.value;
          state.newPlanForm.planDate = val;
          const baseIso = todayIso();
          const tomIso = shiftIsoDate(baseIso, 1);
          const nextMode = val === baseIso ? 'today' : val === tomIso ? 'tomorrow' : 'date';
          state.newPlanForm.whenMode = nextMode;
          document.querySelectorAll('[data-np-when]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-np-when') === nextMode);
          });
          const sumEl = document.getElementById('np-when-summary');
          if (sumEl && val) sumEl.textContent = formatIsoFriendly(val, true);
          return;
        }
        syncNewPlanDomFieldsToState();
      }
    });

    document.getElementById('sheet-body')?.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      const target = e.target;
      if (!target || (target.tagName || '').toUpperCase() !== 'INPUT') return;

      if (target.id === 'np-step-input') {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('btn-np-add-step')?.click();
        return;
      }

      if (target.id === 'sheet-quick-input') {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('sheet-quick-add')?.click();
        return;
      }

      if (target.id === 'delegate-sheet-task-input') {
        e.preventDefault();
        e.stopPropagation();
        state.draft.text = target.value;
        if (state.draft.text.trim() && state.draft.assigneeName) {
          if (backdrop) backdrop.hidden = true;
          await addTaskFromDraft(false);
        } else if (state.draft.text.trim() && state.teamRoster.length === 1) {
          const mem = state.teamRoster[0];
          state.draft.assigneeId = mem.id;
          state.draft.assigneeName = mem.name;
          state.draft.assigneeBu = mem.bu;
          if (backdrop) backdrop.hidden = true;
          await addTaskFromDraft(false);
        } else {
          showToast('Tap a team member below to assign this task');
        }
        return;
      }

      const stepTaskId = target.getAttribute('data-step-input-for');
      if (stepTaskId) {
        e.preventDefault();
        e.stopPropagation();
        const addBtn = target.parentElement?.querySelector(`[data-act="add-step"][data-id="${stepTaskId}"]`);
        if (addBtn) addBtn.click();
      }
    });
  }

  function isStandalone() {
    return Boolean(
      (window.navigator && window.navigator.standalone) ||
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    );
  }

  function isFormControlFocused() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  const CMD_NAV_CACHE = 'theo-cmd-nav-handoff-v1';
  const CMD_PENDING_NAV_URL = './__theo_cmd_pending_nav.json';

  function applyCommandNotificationNav(raw) {
    const data = raw && typeof raw.data === 'object' ? raw.data : raw;
    if (!data || typeof data !== 'object') return false;
    const checkedTag = String(raw?.checkedTag || data.checkedTag || data.tag || data.id || '').trim();
    if (data.openPrayer || data.tab === 'prayers' || data.tab === 'prayer') {
      state.activeTab = 'prayers';
      markNotificationsChecked((n) => n && (n.openPrayer || n.tab === 'prayers' || (checkedTag && (n.tag === checkedTag || n.id === checkedTag))));
    } else if (data.tab) {
      state.activeTab = normalizeCommandTab(data.tab);
    } else if (data.taskId) {
      state.activeTab = 'tasks';
    }
    if (data.taskId) {
      state.expandedRowId = String(data.taskId);
      markNotificationsChecked((n) => n && (n.taskId === String(data.taskId) || (checkedTag && (n.tag === checkedTag || n.id === checkedTag))));
    } else if (checkedTag) {
      markNotificationsChecked((n) => n && (n.tag === checkedTag || n.id === checkedTag));
    }
    renderAll();
    if (data.taskId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-row-id="${CSS.escape(String(data.taskId))}"]`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
    }
    syncAll().catch(() => {});
    return true;
  }

  async function consumePendingCommandNav() {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CMD_NAV_CACHE);
        const res = await cache.match(CMD_PENDING_NAV_URL);
        if (res) {
          await cache.delete(CMD_PENDING_NAV_URL);
          const pending = await res.json().catch(() => null);
          if (pending && Date.now() - Number(pending.ts || 0) < 10 * 60 * 1000) {
            return applyCommandNotificationNav(pending);
          }
        }
      }
    } catch {}
    return false;
  }

  async function init() {
    if (isStandalone()) {
      document.documentElement.classList.add('ios-standalone');
    }

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      let refreshingSw = false;
      const hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || refreshingSw) return;
        refreshingSw = true;
        location.reload();
      });
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (!e.data) return;
        if (e.data.type === 'theo-command-nav') {
          applyCommandNotificationNav(e.data);
        } else if (e.data.type === 'theo-command-push') {
          const item = e.data.item || e.data.payload;
          if (item) {
            recordNotificationItem(item, { checked: false });
            if (
              state.openSheetKind === 'notifications' &&
              !document.getElementById('sheet-backdrop')?.hidden
            ) {
              openNotificationCenterSheet(true);
            }
          }
        }
      });
      navigator.serviceWorker
        .register('./sw.js?v=26', { updateViaCache: 'none' })
        .then(async (reg) => {
          reg.update().catch(() => {});
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
          await syncNotificationsWithSwCache();
          consumePendingCommandNav();
          try {
            const existingSub = await reg.pushManager.getSubscription();
            if (existingSub) {
              localStorage.setItem(PUSH_REG_KEY, JSON.stringify(existingSub.toJSON()));
              updatePushHudState();
            }
          } catch {}
        })
        .catch(() => {});
    }

    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('task');
    const token = params.get('token');
    if (taskId && token) {
      await bootStaffPortalMode(taskId, token);
      return;
    }

    loadLocalState();
    seedUncheckedDueNotifications();

    const initTab = params.get('tab');
    const navTaskId = params.get('taskId') || params.get('rem');
    const prayerParam = params.get('prayer');
    if (prayerParam === '1') {
      state.activeTab = 'prayers';
      markNotificationsChecked((n) => n && (n.openPrayer || n.tab === 'prayers'));
    } else if (initTab) {
      state.activeTab = normalizeCommandTab(initTab);
    } else if (navTaskId) {
      state.activeTab = 'tasks';
    }
    if (navTaskId) {
      state.expandedRowId = navTaskId;
      markNotificationsChecked((n) => n && n.taskId === navTaskId);
    }
    if (initTab || navTaskId || prayerParam) {
      try {
        history.replaceState(null, '', window.location.pathname + (window.location.hash || ''));
      } catch {}
    }

    window.addEventListener('resize', () => {
      if (state.activeTab === 'planning' && !isFormControlFocused()) renderPlanningView();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_LEDGER_KEY || e.key === NOTIF_INBOX_KEY) {
        loadLocalState();
        requestBackgroundRender();
      }
    });
    window.addEventListener('focus', () => {
      if (!isFormControlFocused()) loadLocalState();
      syncNotificationsWithSwCache().finally(() => {
        consumePendingCommandNav().finally(() => {
          seedUncheckedDueNotifications();
          requestBackgroundRender();
          checkLivePrayerNotificationsTick();
          checkLiveTaskNotificationsTick();
          syncAll().catch(() => {});
        });
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!isFormControlFocused()) loadLocalState();
        syncNotificationsWithSwCache().finally(() => {
          consumePendingCommandNav().finally(() => {
            seedUncheckedDueNotifications();
            requestBackgroundRender();
            checkLivePrayerNotificationsTick();
            checkLiveTaskNotificationsTick();
            syncAll().catch(() => {});
          });
        });
      }
    });
    window.addEventListener('offline', () => {
      const syncBtn = document.getElementById('btn-sync-now');
      const dot = document.getElementById('sync-dot');
      const lbl = document.getElementById('sync-label');
      if (syncBtn) syncBtn.hidden = false;
      if (dot) dot.className = 'sync-dot warn';
      if (lbl) lbl.textContent = 'Offline';
    });
    window.addEventListener('online', () => {
      syncAll().catch(() => {});
    });
    updatePushHudState();
    bindOwnerEvents();
    renderAll();

    await syncNotificationsWithSwCache();
    await consumePendingCommandNav();

    // Silent GPS refresh if geolocation permission is already granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((res) => {
          if (res.state === 'granted' && state.prayerConfig.autoGps !== false) {
            try {
              detectPrayerLocationGps(true);
            } catch {}
          }
        })
        .catch(() => {});
    }

    checkLivePrayerNotificationsTick();
    checkLiveTaskNotificationsTick();
    await syncAll();
    seedUncheckedDueNotifications();
    setInterval(() => {
      checkLivePrayerNotificationsTick();
      checkLiveTaskNotificationsTick();
      seedUncheckedDueNotifications();
      if (!isFormControlFocused()) renderAll();
    }, 15000);
    setInterval(() => {
      if (!isFormControlFocused()) syncAll().catch(() => {});
    }, 18000);
  }

  init();
})();
