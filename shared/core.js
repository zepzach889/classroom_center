/* Classroom Suite — shared data + helpers.
   Everything is stored in this browser's localStorage under keys starting with "suite:".
   No student data is ever written into the website's files. */
(function () {
  'use strict';
  const PREFIX = 'suite:';
  const PALETTE = ['#24405E', '#C99A3E', '#B84A32', '#5E806B', '#6A5577', '#3F7F8A', '#8A6A3E', '#4A5663'];
  const OLD_PALETTE = ['#2E6378', '#B7924A', '#6B7F3A', '#7A2E4F', '#4F5D8A', '#A0643A', '#3F7F74', '#8A5A83'];
  const DEFAULT_TABLE_COUNT = 5, DEFAULT_SEATS = 6;
  // Flip "soon" to false as each page is added to the site.
  // Menu: a few everyday links, a Tools menu, and setup under the gear.
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', href: 'index.html' },
    { id: 'today', label: 'Today', href: 'today.html', beta: true },
    { id: 'tracker', label: 'Table points', href: 'tracker.html', feature: 'points' },
    { id: 'seating', label: 'Seating', href: 'seating.html' },
    { id: 'planner', label: 'Planner', href: 'planner.html' },
    { id: 'tools', label: 'Tools', menu: [
      { id: 'spinner', label: 'Name spinner', href: 'spinner.html', feature: 'spinner' },
      { id: 'topics', label: 'Topic picker', href: 'topics.html', feature: 'topics' },
      { id: 'act-game', label: 'Review game', href: 'activities.html#tool=game', feature: 'game' },
      { id: 'act-stations', label: 'Stations', href: 'activities.html#tool=stations', feature: 'stations' },
      { id: 'act-tally', label: 'Tally', href: 'activities.html#tool=tally', feature: 'tally' },
      { id: 'act-groups', label: 'Partners and groups', href: 'activities.html#tool=groups', feature: 'groups' },
      { id: 'noise', label: 'Noise meter', href: 'noise.html', feature: 'noise' },
      { id: 'grader', label: 'Easy grader', href: 'grader.html', feature: 'grader' }
    ] }
  ];
  const GEAR_MENU = [
    { id: 'settings', label: 'Classes and rosters', href: 'settings.html#classes' },
    { id: 'sub', label: 'Substitute page', href: 'sub.html' },
    { id: 'general', label: 'General settings', href: 'settings.html#general' },
    { id: 'help', label: 'Help and tour', href: 'help.html' }
  ];
  const TOOL_PAGES = ['spinner', 'topics', 'activities', 'noise', 'grader'];
  const GEAR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

  const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const emit = detail => window.dispatchEvent(new CustomEvent('suite:change', { detail }));
  const VERSION = '2026-10-11a';   // bump with every build; pages check they match
  const S = { PALETTE, NAV, VERSION };

  S.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  S.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  S.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- storage ---------- */
  function rawSet(k, v) { localStorage.setItem(PREFIX + k, JSON.stringify(v)); }
  S.get = (k, def) => {
    try { const raw = localStorage.getItem(PREFIX + k); return raw == null ? clone(def) : JSON.parse(raw); }
    catch (e) { return clone(def); }
  };
  S.set = (k, v) => {
    try {
      rawSet(k, v);
      if (k !== 'meta' && k !== 'theme') { const m = S.get('meta', {}); m.lastChange = Date.now(); rawSet('meta', m); }
      emit({ key: k });
      return true;
    } catch (e) { S.toast('Could not save. Browser storage may be full or blocked.'); return false; }
  };
  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith(PREFIX)) emit({ key: e.key.slice(PREFIX.length), external: true });
  });


  /* ---------- this user's words and tools ---------- */
  const FEATURE_DEFAULTS = { points: true, captains: true, goals: true, seating: true, spinner: true, topics: true, game: true, stations: true, tally: true, groups: true, noise: true, present: true, grader: true };
  S.prefs = () => { const p = S.get('prefs', {}); return { words: Object.assign({ team: 'table', lead: 'captain' }, p.words || {}), features: Object.assign({}, FEATURE_DEFAULTS, p.features || {}) }; };
  S.feature = f => S.prefs().features[f] !== false;
  // S.word('team') -> "table"; S.word('team', { plural: true, cap: true }) -> "Tables"
  S.word = (k, o) => {
    o = o || {}; let w = S.prefs().words[k] || k;
    if (o.plural) w = /s$/.test(w) ? w : w + 's';
    return o.cap ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  };

  /* ---------- classes & tables ---------- */
  S.defaultTables = () => Array.from({ length: DEFAULT_TABLE_COUNT }, (_, i) => ({ id: 't' + (i + 1) + '-' + S.uid().slice(0, 4), name: S.word('team', { cap: true }) + ' ' + (i + 1), seats: DEFAULT_SEATS, open: true, color: PALETTE[i % PALETTE.length] }));
  // Where each table sits in the room. Tables without a spot get the default for their name,
  // or the next free spot. Returns { cols, rows, at: { tableId: { row, col } } }.
  S.roomLayout = tables => {
    // Tables with a set spot keep it. The rest fill rows of three, and a partial last row lines up on the right.
    const at = {}, used = new Set(), key = (r, c) => r + ',' + c;
    const loose = tables.filter(t => !(t.row && t.col)), auto = {};
    loose.forEach((t, i) => { const r = Math.floor(i / 3), inRow = Math.min(3, loose.length - r * 3); auto[t.id] = { row: r + 1, col: (i % 3) + 1 + (3 - inRow) }; });
    const want = t => (t.row && t.col) ? { row: +t.row, col: +t.col } : auto[t.id];
    const later = [];
    tables.forEach(t => { const w = want(t); if (w && !used.has(key(w.row, w.col))) { at[t.id] = w; used.add(key(w.row, w.col)); } else later.push(t); });
    let cols = Math.max(3, ...Object.values(at).map(p => p.col), 1);
    later.forEach(t => { for (let r = 1; ; r++) { let placed = false; for (let c = 1; c <= cols; c++) { if (!used.has(key(r, c))) { at[t.id] = { row: r, col: c }; used.add(key(r, c)); placed = true; break; } } if (placed) break; } });
    const rows = Math.max(1, ...Object.values(at).map(p => p.row));
    return { cols, rows, at };
  };
  S.classes = () => S.get('classes', []);
  S.saveClasses = list => S.set('classes', list);
  S.newClass = (name, template) => ({
    id: S.uid(), name,
    tables: clone(template && template.tables && template.tables.length ? template.tables : S.defaultTables()),
    students: []
  });
  S.nextColor = tables => { const used = new Set(tables.map(t => t.color)); return PALETTE.find(c => !used.has(c)) || PALETTE[tables.length % PALETTE.length]; };
  S.textOn = hex => {
    const h = String(hex || '').replace('#', ''); if (h.length !== 6) return '#FFFFFF';
    const lum = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
    const L = .2126 * lum[0] + .7152 * lum[1] + .0722 * lum[2];
    return L > .3 ? '#1C2B3A' : '#FFFFFF';
  };
  // How a table's seats are arranged: a number of columns, with as many rows as the seats need.
  // Two columns face each other across the table (surface down the middle); two rows face across it (surface across the middle).
  S.seatLayout = t => {
    const n = Math.max(1, t.seats || 1);
    const cols = Math.max(1, Math.min(n, t.seatCols || Math.ceil(n / 2))), rows = Math.ceil(n / cols);
    const surface = rows === 2 && cols > 1 ? 'h' : cols === 2 && rows > 1 ? 'v' : null;
    const pos = i => surface === 'v' ? { r: i % rows, c: Math.floor(i / rows) } : { r: Math.floor(i / cols), c: i % cols };
    return { cols, rows, surface, pos };
  };
  S.seatOptions = n => {
    n = Math.max(1, n || 1);
    const seen = new Set(), out = [];
    [2, Math.ceil(n / 2), 3, 4, 1, n].forEach(c => {
      if (c < 1 || c > n || seen.has(c)) return;
      const r = Math.ceil(n / c);
      if (c * r - n >= Math.min(c, r) || r > 12) return;
      seen.add(c);
      out.push({ cols: c, label: c === 1 ? 'One column' : r === 1 ? 'One row' : c + ' columns, ' + r + ' rows' });
    });
    return out;
  };
  // Spread students across the tables in use, in proportion to seats, honoring keep-apart pairs and stay-put students.
  // Shuffle a class into new groups and seats. Keep-apart rules are [a, b, kind]:
  // 'group' = not in the same group (and not right next to each other), 'near' = not right next to each other.
  S.proposeSeats = c => {
    const shuf = arr => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
    const tables = c.tables.filter(t => t.open), pinned = new Set(c.pinned || []);
    const rules = (c.apart || []).map(p => ({ a: p[0], b: p[1], kind: p[2] === 'near' ? 'near' : 'group' }));
    const byId = Object.fromEntries(tables.map(t => [t.id, t])), lay = S.roomLayout(c.tables);
    const seatPos = (t, i) => S.seatLayout(t).pos(i);
    // are two seats right next to each other? (same table: touching seats; rows of desks: also the desk in front or behind)
    const near = (t1, i1, t2, i2) => {
      if (t1.id === t2.id) { const p = seatPos(t1, i1), q = seatPos(t2, i2); return Math.abs(p.r - q.r) <= 1 && Math.abs(p.c - q.c) <= 1; }
      const L1 = S.seatLayout(t1), L2 = S.seatLayout(t2), a = lay.at[t1.id], b = lay.at[t2.id];
      return L1.rows === 1 && L2.rows === 1 && a && b && a.col === b.col && Math.abs(a.row - b.row) === 1 && Math.abs(i1 - i2) <= 1;
    };
    let best = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      // 1) groups
      const assign = {}, count = {}; tables.forEach(t => { count[t.id] = 0; });
      c.students.forEach(s => { if (pinned.has(s.id) && count[s.tableId] != null) { assign[s.id] = s.tableId; count[s.tableId]++; } });
      const inRule = s => rules.some(r => r.a === s.id || r.b === s.id);
      const movers = shuf(c.students.filter(s => !(s.id in assign))).sort((a, b) => inRule(b) - inRule(a));
      const clash = (sid, tid) => rules.some(r => r.kind === 'group' && ((r.a === sid && assign[r.b] === tid) || (r.b === sid && assign[r.a] === tid)));
      movers.forEach(s => {
        let open = tables.filter(t => count[t.id] < t.seats); if (!open.length) open = tables.slice();
        let cand = open.filter(t => !clash(s.id, t.id)); if (!cand.length) cand = open;
        if (!cand.length) return;
        const fill = t => count[t.id] / Math.max(1, t.seats), low = Math.min(...cand.map(fill));
        const pick = cand.filter(t => fill(t) === low), t = pick[Math.floor(Math.random() * pick.length)];
        assign[s.id] = t.id; count[t.id]++;
      });
      // 2) seats within each group (pinned students keep their seat)
      const seats = {};
      tables.forEach(t => {
        const members = c.students.filter(s => assign[s.id] === t.id), taken = new Set();
        members.forEach(s => { if (pinned.has(s.id) && s.tableId === t.id && Number.isInteger(s.seat) && s.seat < t.seats && !taken.has(s.seat)) { seats[s.id] = s.seat; taken.add(s.seat); } });
        const free = shuf(Array.from({ length: t.seats }, (_, i) => i).filter(i => !taken.has(i)));
        shuf(members.filter(s => !(s.id in seats))).forEach(s => { if (free.length) seats[s.id] = free.shift(); });
      });
      // 3) score: every rule that isn't met
      const broken = rules.filter(r => {
        const ta = byId[assign[r.a]], tb = byId[assign[r.b]]; if (!ta || !tb) return false;
        if (r.kind === 'group' && ta.id === tb.id) return true;
        return seats[r.a] != null && seats[r.b] != null && near(ta, seats[r.a], tb, seats[r.b]);
      }).length;
      if (!best || broken < best.conflicts) best = { assign, seats, conflicts: broken };
      if (!broken) break;
    }
    return Object.assign(best || { assign: {}, seats: {}, conflicts: 0 }, { over: c.students.length > tables.reduce((n, t) => n + t.seats, 0) });
  };
  // The class in session right now (or about to start, during passing time). null when no class is scheduled.
  S.classNow = () => {
    const now = new Date(), P = S.scheduleFor(now).periods, st = S.periodStatus(P, now), list = S.classes();
    const cur = st.cur >= 0 && !S.isPassing(P[st.cur]) ? P[st.cur] : null;
    let c = cur ? S.classForPeriod(cur, list) : null;
    if (!c && (st.cur < 0 || S.isPassing(P[st.cur]))) { const from = st.cur >= 0 ? st.cur + 1 : st.next; for (let i = from; from >= 0 && i < P.length; i++) if (!S.isPassing(P[i])) { c = S.classForPeriod(P[i], list); break; } }
    return c ? c.id : null;
  };
  // Auto mode for a page's class picker: on by default, remembered per window.
  S.autoClass = page => { const k = 'suite:auto:' + page; return { get on(){ try { return sessionStorage.getItem(k) !== 'off'; } catch (e) { return true; } }, set(v){ try { sessionStorage.setItem(k, v ? 'on' : 'off'); } catch (e) {} } }; };
  // Import a room pack (rooms with text spots, bitmojis, and a flag background) into this browser's Today screen.
  S.importRoomPack = async file => {
    const pack = JSON.parse(await file.text());
    if (!pack || pack.app !== 'classroom-suite-room-pack') throw new Error("That file isn't a room pack");
    const T = Object.assign({ rows: {}, days: {}, custom: {}, bitmojis: {}, bmAdj: {} }, S.get('today', {}));
    const toFile = async (dataUrl, name) => new File([await (await fetch(dataUrl)).blob()], name);
    const lookMap = {}, bmMap = {};
    for (const r of pack.rooms || []) { const meta = await S.files.put(await toFile(r.image, r.name + '.jpg')), id = 'room-' + S.uid(); T.custom[id] = { name: r.name, fileId: meta.id, layout: r.layout }; if (r.replaces) lookMap[r.replaces] = id; }
    for (const b of pack.bitmojis || []) { const meta = await S.files.put(await toFile(b.image, b.name + '.webp')), id = 'bm-' + S.uid(); T.bitmojis[id] = { name: b.name, fileId: meta.id }; if (b.adj) T.bmAdj[id] = b.adj; if (b.replaces) bmMap[b.replaces] = id; }
    if (pack.flagBackground) { const meta = await S.files.put(await toFile(pack.flagBackground, 'flag-background.jpg')); T.flagBg = meta.id; }
    const fix = o => { if (!o) return; if (lookMap[o.look]) o.look = lookMap[o.look]; if (bmMap[o.bitmoji]) o.bitmoji = bmMap[o.bitmoji]; };
    Object.values(T.rows).forEach(u => { const had = !!lookMap[u.look]; fix(u); (u.schedule || []).forEach(fix); if (had && !u.bitmoji && pack.defaultBitmoji && bmMap[pack.defaultBitmoji]) u.bitmoji = bmMap[pack.defaultBitmoji]; });
    Object.values(T.days).forEach(day => Object.values(day).forEach(fix));
    Object.keys(T.bmAdj).forEach(k => { if (bmMap[k]) { T.bmAdj[bmMap[k]] = T.bmAdj[bmMap[k]] || T.bmAdj[k]; delete T.bmAdj[k]; } });
    S.set('today', T);
    return { rooms: (pack.rooms || []).length, bitmojis: (pack.bitmojis || []).length };
  };
  S.activeTables = cls => (cls ? cls.tables.filter(t => t.open) : []);


  /* ---------- bell schedule ---------- */
  const P = (name, start, end, isBreak) => ({ name, start, end, isBreak: !!isBreak, classId: '' });
  const DEFAULT_SCHEDULE = {
    schedules: [
      { id: 'regular', name: 'Regular day', periods: [
        P('Homeroom', '08:19', '08:25'), P('Period 2', '08:29', '09:11'), P('Period 3', '09:15', '09:57'),
        P('Break', '09:58', '10:08', true), P('Period 4', '10:11', '10:53'), P('Period 5', '10:57', '11:39'),
        P('Lunch', '11:39', '12:11', true), P('Period 6', '12:15', '12:57'), P('Period 7', '13:01', '13:43'),
        P('Period 8', '13:47', '14:29'), P('Period 9', '14:33', '15:15'), P('Homeroom', '15:15', '15:19') ] },
      { id: 'wednesday', name: 'Wednesday', periods: [
        P('Homeroom', '08:19', '09:04'), P('Period 2', '09:08', '09:33'), P('Period 3', '09:37', '10:02'),
        P('Break', '10:02', '10:12', true), P('Period 4', '10:16', '10:41'), P('Period 5', '10:45', '11:10'),
        P('Lunch', '11:10', '11:42', true), P('Period 6', '11:46', '12:11'), P('Period 7', '12:15', '12:40'),
        P('Period 8', '12:44', '13:09'), P('Period 9', '13:13', '13:39'), P('Homeroom', '13:43', '13:49') ] }
    ],
    weekdays: { 1: 'regular', 2: 'regular', 3: 'wednesday', 4: 'regular', 5: 'regular' },
    special: [],
    passingMinutes: 4
  };
  const toMin = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  S.toMin = toMin;
  S.fromMin = m => { m = Math.max(0, Math.min(1439, Math.round(m))); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  // Reads times the way people type them: "9:57", "957", "9:57 am", "13:01".
  // With no AM/PM, 1:00-6:59 are treated as afternoon, since school runs during the day.
  S.parseTime = str => {
    const m = String(str || '').trim().toLowerCase().replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').match(/^(\d{1,2}):?(\d{2})?\s*([ap])?\.?\s*m?\.?$/);
    if (!m) return null;
    let h = parseInt(m[1], 10); const min = m[2] ? parseInt(m[2], 10) : 0;
    if (min > 59 || h > 23) return null;
    if (m[3]) { if (h < 1 || h > 12) return null; if (m[3] === 'p' && h < 12) h += 12; if (m[3] === 'a' && h === 12) h = 0; }
    else if (h >= 1 && h <= 6) h += 12;
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  };
  S.isPassing = p => !!p && (p.passing || /^passing/i.test(String(p.name || '').trim()));
  S.sortPeriods = list => list.sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));
  // Adds a passing period in every gap between periods, sized to the real gap.
  S.fillPassing = periods => {
    S.sortPeriods(periods);
    const add = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const a = periods[i], b = periods[i + 1];
      const gap = toMin(b.start) - toMin(a.end);
      if (gap > 0 && gap <= 15 && !S.isPassing(a) && !S.isPassing(b)) add.push({ name: 'Passing', start: a.end, end: b.start, isBreak: true, passing: true, classId: '' });
    }
    periods.push(...add);
    S.sortPeriods(periods);
    return add.length;
  };
  S.fmt12 = t => { let [h, m] = String(t).split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
  S.dateKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  /* ---------- school bell-schedule presets (official printed times) ---------- */
  const R = (name, start, end, kind) => ({ name, start, end, isBreak: kind === 'break' || kind === 'pass' || kind === 'staff', passing: kind === 'pass', staff: kind === 'staff', classId: '' });
  const LUNCH = {
    regular:  { six: [R('Lunch (6th grade)', '10:53', '11:25', 'break'), R('Period 4', '11:29', '12:01')], upper: [R('Period 4', '10:57', '11:29'), R('Lunch (7th/8th grade)', '11:29', '12:01', 'break')] },
    early:    { six: [R('Lunch (6th grade)', '10:50', '11:22', 'break'), R('Period 4', '11:26', '11:58')], upper: [R('Period 4', '10:54', '11:26'), R('Lunch (7th/8th grade)', '11:26', '11:58', 'break')] },
    delayed:  { six: [R('Lunch (6th grade)', '11:20', '11:52', 'break'), R('Period 4', '11:56', '12:28')], upper: [R('Period 4', '11:24', '11:56'), R('Lunch (7th/8th grade)', '11:56', '12:28', 'break')] }
  };
  S.PRESETS = {
    school2627: {
      name: 'Our school: 2026–27',
      note: 'Official printed times. The bells currently ring 1 minute early; use the offset to match them.',
      suggestedOffset: -1,
      tracks: { six: '6th grade lunch', upper: '7th/8th grade lunch' },
      build(track, staff){
        const L = k => LUNCH[k][track];
        const withStaff = (rows, before, after) => (staff ? (before ? [R('Before school (staff)', before[0], before[1], 'staff')] : []) : []).concat(rows, staff && after ? [R('After school (staff)', after[0], after[1], 'staff')] : []);
        const regular = withStaff([R('Passing', '08:15', '08:20', 'pass'), R('Period 1', '08:20', '09:09'), R('Period 2', '09:13', '09:57'), R('Break', '09:57', '10:05', 'break'), R('Period 3', '10:09', '10:53')]
          .concat(L('regular'), [R('Period 5', '12:05', '12:49'), R('Period 6', '12:53', '13:37'), R('Period 7', '13:41', '14:25'), R('Period 8', '14:29', '15:20')]), ['07:45', '08:15'], ['15:20', '15:45']);
        const early = withStaff([R('Passing', '08:15', '08:20', 'pass'), R('Period 1', '08:20', '08:55'), R('Period 2', '08:59', '09:30'), R('Break', '09:30', '09:38', 'break'), R('Period 3', '09:42', '10:14'), R('Period 5', '10:18', '10:50')]
          .concat(L('early'), [R('Period 6', '12:02', '12:34'), R('Period 7', '12:38', '13:10'), R('Period 8', '13:14', '13:50')]), ['07:45', '08:15'], ['13:50', '15:45']);
        const delayed = withStaff([R('Passing', '10:15', '10:20', 'pass'), R('Period 1', '10:20', '10:48'), R('Period 2', '10:52', '11:20')]
          .concat(L('delayed'), [R('Period 3', '12:32', '13:00'), R('Period 5', '13:04', '13:32'), R('Period 6', '13:36', '14:04'), R('Break', '14:04', '14:12', 'break'), R('Period 7', '14:16', '14:44'), R('Period 8', '14:48', '15:20')]), null, ['15:20', '15:45']);
        const out = {
          schedules: [
            { id: 'regular', name: 'Regular day', periods: regular },
            { id: 'wednesday', name: 'Early release (Wednesday)', periods: early },
            { id: 'delayed', name: 'Delayed start (snow day)', periods: delayed }
          ],
          weekdays: { 1: 'regular', 2: 'regular', 3: 'wednesday', 4: 'regular', 5: 'regular' },
          special: [], passingMinutes: 4, offset: 0
        };
        out.schedules.forEach(sc => S.fillPassing(sc.periods));
        return out;
      }
    }
  };

  S.getSchedule = () => {
    const s = S.get('schedule', null) || S.PRESETS.school2627.build('six', false);
    s.schedules = s.schedules || []; s.weekdays = s.weekdays || {}; s.special = s.special || [];
    s.passingMinutes = s.passingMinutes || 4; s.offset = Number(s.offset) || 0;
    return s;
  };
  S.saveSchedule = s => S.set('schedule', s);
  const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  S.scheduleFor = date => {
    const s = S.getSchedule();
    const sp = s.special.find(x => x.date === S.dateKey(date));
    const wd = date.getDay();
    const id = sp ? sp.scheduleId : (wd === 0 || wd === 6 ? 'none' : (s.weekdays[wd] || 'none'));
    const why = sp ? 'Special day' + (sp.label ? '' : '') : wd === 0 || wd === 6 ? '' : 'Set for ' + DAY_NAMES[wd];
    if (id === 'none') return { periods: [], label: sp ? (sp.label || 'No school') : (wd === 0 || wd === 6 ? 'Weekend' : 'No school'), special: !!sp, why };
    const sc = s.schedules.find(x => x.id === id) || s.schedules[0];
    if (!sc) return { periods: [], label: 'No schedule set up', special: false, why: '' };
    // the offset shifts every bell (e.g. -1 when the bells ring a minute early)
    const off = s.offset || 0;
    const shift = t => S.fromMin(toMin(t) + off);
    const periods = sc.periods.map(p => off ? Object.assign({}, p, { start: shift(p.start), end: shift(p.end) }) : p).sort((a, b) => toMin(a.start) - toMin(b.start));
    return { periods, label: (sp && sp.label) || sc.name, scheduleName: sc.name, special: !!sp, why: sp ? 'Special day: ' + sc.name : why, offset: off };
  };
  S.periodStatus = (periods, now) => {
    const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let cur = -1, next = -1;
    periods.forEach((p, i) => { const a = toMin(p.start) * 60, b = toMin(p.end) * 60; if (cur < 0 && sec >= a && sec < b) cur = i; if (next < 0 && a > sec) next = i; });
    return { cur, next, sec };
  };
  S.classForPeriod = (p, classes) => {
    if (!p || p.isBreak || p.classId === 'none') return null;
    if (p.classId) return classes.find(c => c.id === p.classId) || null;
    const n = String(p.name).trim().toLowerCase();
    return classes.find(c => c.name.trim().toLowerCase() === n) || null;
  };


  /* ---------- attached files (sub-page materials), stored in IndexedDB ---------- */
  const FILE_DB = 'classroom-suite-files', MAX_FILE = 10 * 1024 * 1024;
  function idb(){ return new Promise((res, rej) => { const r = indexedDB.open(FILE_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  async function fstore(mode, fn){ const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('files', mode), st = t.objectStore('files'); const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); }
  S.MAX_FILE = MAX_FILE;
  S.files = {
    put: async file => {
      if (file.size > MAX_FILE) throw new Error(file.name + ' is larger than 10 MB.');
      const rec = { id: S.uid(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, blob: file };
      await fstore('readwrite', st => st.put(rec));
      return { id: rec.id, name: rec.name, type: rec.type, size: rec.size };
    },
    get: id => fstore('readonly', st => st.get(id)),
    del: id => fstore('readwrite', st => st.delete(id)),
    all: () => fstore('readonly', st => st.getAll()),
    clear: () => fstore('readwrite', st => st.clear())
  };
  const blobToDataUrl = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
  const dataUrlToBlob = async u => (await fetch(u)).blob();

  /* ---------- backup ---------- */
  function allKeys(keepTheme) {
    const ks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && !(keepTheme && k === PREFIX + 'theme')) ks.push(k);
    }
    return ks;
  }
  S.allData = () => {
    const data = {};
    allKeys(false).forEach(k => { try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {} });
    delete data.meta; delete data.theme; delete data.timer;
    return data;
  };
  S.exportBackup = async () => {
    const payload = { app: 'classroom-suite', version: 1, exported: new Date().toISOString(), data: S.allData() };
    try { const all = await S.files.all(); if (all.length) payload.files = await Promise.all(all.map(async f => ({ id: f.id, name: f.name, type: f.type, size: f.size, data: await blobToDataUrl(f.blob) }))); } catch (e) {}
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'classroom-suite-backup-' + S.today() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    const m = S.get('meta', {}); m.lastBackup = Date.now(); rawSet('meta', m); emit({ key: 'meta' });
  };
  // Accepts a Classroom Suite backup, or a backup copied from the earlier single-page tracker.
  S.parseBackup = text => {
    let d;
    try { d = JSON.parse(text); } catch (e) { throw new Error("That file isn't a backup file."); }
    if (d && d.app === 'classroom-suite' && d.data) return { data: d.data, exported: d.exported || null, files: d.files || [] };
    if (d && Array.isArray(d.classes) && d.classes.some(c => Array.isArray(c.tables))) return { data: fromTracker(d), exported: null };
    throw new Error("That file isn't a Classroom Suite backup.");
  };
  function fromTracker(d) {
    const tracker = { quarter: d.quarter || 1, week: d.week || 1, menu: d.menu || '', log: Array.isArray(d.log) ? d.log : [], goals: {}, streaks: {}, captains: {} };
    const classes = d.classes.filter(c => Array.isArray(c.tables)).map(c => {
      tracker.goals[c.id] = c.goals || {}; tracker.streaks[c.id] = c.streaks || {}; tracker.captains[c.id] = {};
      const tables = c.tables.map((t, i) => { tracker.captains[c.id][t.id] = t.cap || ''; return { id: t.id, name: t.name, seats: t.seats || 6, open: t.open !== false, color: PALETTE[i % PALETTE.length] }; });
      return { id: c.id, name: c.name, tables, students: (c.students || []).map(s => ({ id: s.id || S.uid(), name: s.name, tableId: s.t || '' })) };
    });
    return { classes, tracker };
  }
  S.restoreFiles = async files => {
    try {
      await S.files.clear();
      for (const f of files || []) { const blob = await dataUrlToBlob(f.data); await fstore('readwrite', st => st.put({ id: f.id, name: f.name, type: f.type, size: f.size, blob })); }
    } catch (e) {}
  };
  S.restore = data => {
    S.clearAll(true);
    Object.entries(data).forEach(([k, v]) => rawSet(k, v));
    rawSet('meta', { lastChange: Date.now(), lastBackup: Date.now() });
    emit({ key: '*' });
  };
  S.clearAll = (keepTheme, keepFiles) => { allKeys(keepTheme).forEach(k => localStorage.removeItem(k)); if (!keepFiles) S.files.clear().catch(() => {}); emit({ key: '*' }); };
  S.backupStatus = () => {
    const m = S.get('meta', {});
    const hasData = S.classes().length > 0;
    const unsaved = hasData && (!m.lastBackup || (m.lastChange || 0) > m.lastBackup);
    const days = m.lastBackup ? Math.floor((Date.now() - m.lastBackup) / 86400000) : null;
    return { last: m.lastBackup || null, days, unsaved, due: unsaved && (days === null || days >= 7) };
  };

  /* ---------- dialog + toast (in-page, so they work everywhere) ---------- */
  // items: [{ value, label, group? }] — items sharing a group label become an <optgroup>
  function selectHtml(items){
    let html = '', open = null;
    items.forEach(x => {
      if ((x.group || null) !== open) { if (open) html += '</optgroup>'; open = x.group || null; if (open) html += `<optgroup label="${S.esc(open)}">`; }
      html += `<option value="${S.esc(x.value)}">${S.esc(x.label)}</option>`;
    });
    return html + (open ? '</optgroup>' : '');
  }
  S.dialog = o => new Promise(resolve => {
    const hasInput = o.input !== undefined;
    const back = document.createElement('div');
    back.className = 'suite-dialog-back';
    back.innerHTML = `<div class="suite-dialog" role="dialog" aria-modal="true" aria-labelledby="sd-title">
      <h2 id="sd-title">${S.esc(o.title)}</h2>${o.body ? `<p>${S.esc(o.body)}</p>` : ''}
      ${hasInput ? `<input class="field" id="sd-input" value="${S.esc(o.input)}" aria-label="${S.esc(o.title)}">` : ''}
      ${o.select ? `<select class="field" id="sd-select" aria-label="${S.esc(o.title)}" style="width:100%">${selectHtml(o.select)}</select>` : ''}
      <div class="suite-dialog-actions">${o.alert ? '' : `<button class="btn" data-r="no">${S.esc(o.cancel || 'Cancel')}</button>`}
      <button class="btn ${o.danger ? 'danger-fill' : 'primary'}" data-r="yes">${S.esc(o.ok || 'OK')}</button></div></div>`;
    const prevFocus = document.activeElement;
    document.body.appendChild(back);
    const inp = back.querySelector('#sd-input'), sel = back.querySelector('#sd-select');
    (inp || sel || back.querySelector('[data-r="yes"]')).focus();
    if (inp) inp.select();
    const done = v => { back.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
    const yes = () => done(sel ? sel.value : hasInput ? (inp.value.trim() || null) : true);
    const no = () => done(hasInput || sel ? null : false);
    const onKey = e => { if (e.key === 'Escape') no(); else if (e.key === 'Enter' && inp && document.activeElement === inp) { e.preventDefault(); yes(); } };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', e => { if (e.target === back) return no(); const r = e.target.closest('[data-r]'); if (r) (r.dataset.r === 'yes' ? yes() : no()); });
  });
  S.toast = msg => {
    const t = document.createElement('div');
    t.className = 'suite-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  };

  (function paletteV2(){
    try {
      const m = S.get('meta', {}); if (m.palette2) return;
      const list = S.get('classes', null);
      if (list) { list.forEach(c => (c.tables || []).forEach(t => { const i = OLD_PALETTE.indexOf(String(t.color).toUpperCase()); if (i > -1) t.color = PALETTE[i]; })); rawSet('classes', list); }
      m.palette2 = true; rawSet('meta', m);
    } catch (e) {}
  })();


  /* ---------- timer: floats over every page and keeps running between pages ---------- */
  const TIMER_DEF = { state: 'idle', end: 0, left: 300000, total: 300000, last: 300000, sound: true };
  const tget = () => Object.assign({}, TIMER_DEF, S.get('timer', {}));
  const tsave = v => { rawSet('timer', v); emit({ key: 'timer' }); };   // not "data", so it doesn't trigger backup reminders
  const tleft = t => t.state === 'running' ? Math.max(0, t.end - Date.now()) : t.state === 'done' ? 0 : t.left;
  S.fmtDuration = ms => {
    const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0') : m + ':' + String(r).padStart(2, '0');
  };
  // "5" = 5 minutes, "1:30", "90s", "2m", "1:00:00"
  S.parseDuration = str => {
    const v = String(str || '').trim().toLowerCase().replace(/\s+/g, '');
    let m;
    if ((m = v.match(/^(\d+):(\d{1,2}):(\d{2})$/))) return ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000;
    if ((m = v.match(/^(\d+):(\d{2})$/))) return (+m[1] * 60 + +m[2]) * 1000;
    if ((m = v.match(/^(\d+(?:\.\d+)?)s(ec(onds?)?)?$/))) return Math.round(+m[1] * 1000);
    if ((m = v.match(/^(\d+(?:\.\d+)?)(m|min|mins|minutes?)?$/))) return Math.round(+m[1] * 60000);
    return null;
  };
  let audio = null;
  const wakeAudio = () => { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} };
  document.addEventListener('pointerdown', wakeAudio, true);
  function chime(){
    try {
      wakeAudio(); if (!audio) return;
      const t0 = audio.currentTime + .05;
      [[0, 880], [.38, 1108.7], [.76, 1318.5], [1.5, 1318.5]].forEach(([d, f]) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t0 + d); g.gain.exponentialRampToValueAtTime(.35, t0 + d + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + 1.3);
        o.connect(g); g.connect(audio.destination); o.start(t0 + d); o.stop(t0 + d + 1.4);
      });
    } catch (e) {}
  }
  S.chime = chime;
  const PRESETS = [1, 2, 3, 5, 10, 15];
  let tEl = null, tOpen = false;
  function timerMarkup(){
    const w = document.createElement('div');
    w.id = 'suite-timer'; w.hidden = true;
    w.innerHTML = `<div class="st-panel" role="dialog" aria-modal="true" aria-label="Timer">
      <div class="st-top"><span class="st-title">Timer</span><button class="btn" data-t="hide">Hide timer</button></div>
      <div class="st-time" id="st-time">5:00</div>
      <div class="st-status" id="st-status" aria-live="polite"></div>
      <div class="st-bar" aria-hidden="true"><span id="st-bar"></span></div>
      <div class="st-controls">
        <button class="btn primary st-go" data-t="go" id="st-go">Start</button>
        <button class="btn" data-t="reset">Reset</button>
        <button class="btn" data-t="add" data-ms="30000">+30 sec</button>
        <button class="btn" data-t="add" data-ms="60000">+1 min</button>
      </div>
      <div class="st-presets">
        ${PRESETS.map(n => `<button class="btn" data-t="preset" data-ms="${n * 60000}">${n} min</button>`).join('')}
        <span class="st-custom"><label class="visually-hidden" for="st-in">Custom time</label>
          <input class="field" id="st-in" placeholder="e.g. 7 or 1:30" autocomplete="off">
          <button class="btn" data-t="custom">Start</button></span>
      </div>
      <div class="st-foot"><label><input type="checkbox" id="st-sound"> Chime when time's up</label>
        <span class="muted small">Space starts or pauses. R resets. Esc hides.</span></div>
    </div>`;
    document.body.appendChild(w);
    return w;
  }
  function timerDraw(){
    const t = tget(), left = tleft(t);
    const pill = document.getElementById('st-pill');
    if (pill) {
      pill.textContent = t.state === 'idle' ? 'Timer' : t.state === 'done' ? "Time's up" : 'Timer ' + S.fmtDuration(left);
      pill.classList.toggle('on', t.state !== 'idle');
      pill.classList.toggle('done', t.state === 'done');
    }
    if (!tEl || !tOpen) return;
    tEl.classList.toggle('is-done', t.state === 'done');
    tEl.classList.toggle('is-low', t.state === 'running' && left <= 10000);
    document.getElementById('st-time').textContent = S.fmtDuration(left);
    document.getElementById('st-status').textContent = t.state === 'done' ? "Time's up!" : t.state === 'paused' ? 'Paused' : '';
    document.getElementById('st-bar').style.width = (t.total ? Math.max(0, Math.min(100, left / t.total * 100)) : 0).toFixed(2) + '%';
    const go = document.getElementById('st-go');
    go.textContent = t.state === 'running' ? 'Pause' : t.state === 'paused' ? 'Resume' : 'Start';
    const snd = document.getElementById('st-sound'); if (snd.checked !== t.sound) snd.checked = t.sound;
  }
  S.openTimer = () => { if (!tEl) tEl = timerMarkup(); tEl.hidden = false; tOpen = true; document.body.classList.add('timer-open'); timerDraw(); const g = document.getElementById('st-go'); if (g) g.focus(); };
  S.hideTimer = () => { if (tEl) tEl.hidden = true; tOpen = false; document.body.classList.remove('timer-open'); timerDraw(); };
  S.timerStart = ms => tStart(ms); S.timerToggle = () => tToggle(); S.timerState = () => { const t = tget(); return { state: t.state, left: tleft(t), total: t.total || 0 }; };
  function tStart(ms){ wakeAudio(); const t = tget(); t.total = ms; t.last = ms; t.left = ms; t.end = Date.now() + ms; t.state = 'running'; tsave(t); timerDraw(); }
  function tToggle(){
    const t = tget();
    if (t.state === 'running') { t.left = Math.max(0, t.end - Date.now()); t.state = 'paused'; tsave(t); }
    else if (t.state === 'paused') { wakeAudio(); t.end = Date.now() + t.left; t.state = 'running'; tsave(t); }
    else tStart(t.state === 'done' ? t.last : t.left || t.last);
    timerDraw();
  }
  function tReset(){ const t = tget(); t.state = 'idle'; t.left = t.total = t.last; tsave(t); timerDraw(); }
  function tAdd(ms){
    const t = tget();
    if (t.state === 'running') { t.end += ms; t.total += ms; }
    else if (t.state === 'paused') { t.left += ms; t.total += ms; }
    else if (t.state === 'done') { return tStart(ms); }
    else { t.left += ms; t.total = t.last = t.left; }
    tsave(t); timerDraw();
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-suite="timer"]')) { S.openTimer(); return; }
    const b = e.target.closest('[data-t]'); if (!b || !tEl || !tEl.contains(b)) return;
    const k = b.dataset.t;
    if (k === 'hide') S.hideTimer();
    else if (k === 'go') tToggle();
    else if (k === 'reset') tReset();
    else if (k === 'add') tAdd(+b.dataset.ms);
    else if (k === 'preset') tStart(+b.dataset.ms);
    else if (k === 'custom') {
      const inp = document.getElementById('st-in'), ms = S.parseDuration(inp.value);
      if (!ms || ms > 24 * 3600000) { S.toast('Try a time like 7, 1:30, or 90s'); inp.focus(); return; }
      inp.value = ''; tStart(ms); document.getElementById('st-go').focus();
    }
  });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'st-sound') { const t = tget(); t.sound = e.target.checked; tsave(t); } });
  // While the timer is open, its keys win over the page's own shortcuts.
  document.addEventListener('keydown', e => {
    if (!tOpen || document.querySelector('.suite-dialog')) return;
    const typing = e.target && e.target.id === 'st-in';
    if (typing) { if (e.key === 'Enter') { e.preventDefault(); document.querySelector('#suite-timer [data-t="custom"]').click(); } else if (e.key === 'Escape') S.hideTimer(); e.stopImmediatePropagation(); return; }
    if (e.key === 'Escape') { S.hideTimer(); }
    else if (e.code === 'Space') { e.preventDefault(); tToggle(); }
    else if (e.key === 'r' || e.key === 'R') tReset();
    else if (/^[0-9+=\-]$/.test(e.key) || /^[a-z]$/i.test(e.key)) { /* swallow page shortcuts */ }
    else return;
    e.stopImmediatePropagation();
  }, true);
  setInterval(() => {
    const t = tget();
    if (t.state === 'running' && Date.now() >= t.end) {
      t.state = 'done'; t.left = 0; tsave(t);
      if (document.visibilityState === 'visible') { S.openTimer(); if (t.sound) chime(); }
    }
    timerDraw();
  }, 250);
  window.addEventListener('suite:change', e => { if (e.detail && (e.detail.key === 'timer' || e.detail.key === '*')) timerDraw(); });


  /* ---------- daily agenda (learning target, steps, homework) per class per date ---------- */
  S.agendaAll = () => S.get('agenda', {});
  // Courses group sections that share a plan (e.g. all 6th grade periods). A period's own plan, if any, wins.
  S.courses = () => S.get('courses', []);
  S.saveCourses = list => S.set('courses', list);
  S.courseOf = classId => S.courses().find(c => (c.classIds || []).includes(classId)) || null;
  const CK = id => 'course:' + id;
  S.courseKey = CK;
  S.agendaFor = (dateKey, classId) => {
    const day = S.agendaAll()[dateKey] || {};
    if (day[classId]) return day[classId];
    const co = S.courseOf(classId);
    return co ? day[CK(co.id)] || null : null;
  };
  // School-wide events (dress-up days, testing, field trips). Each has a start and end date.
  S.events = () => S.get('events', []);
  S.saveEvents = list => S.set('events', list);
  S.eventsOn = dateKey => S.events().filter(e => e.start <= dateKey && dateKey <= (e.end || e.start)).sort((a, b) => a.title.localeCompare(b.title));
  // Is an attached file still used by any plan or the sub page? (Checked before deleting it.)
  S.fileInUse = (id, except) => {
    const hit = m => m && m.file && m.file.id === id && m !== except;
    const A = S.agendaAll();
    if (Object.values(A).some(day => Object.values(day).some(e => (e.materials || []).some(hit)))) return true;
    const sub = S.get('sub', {});
    return Object.values((sub && sub.materials) || {}).some(list => (list || []).some(hit));
  };
  // Older plans saved per period before courses existed: merge the ones that match into the course plan.
  S.mergeIntoCourses = () => {
    const A = S.agendaAll(), cos = S.courses(), same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    let merged = 0;
    Object.keys(A).forEach(d => cos.forEach(co => {
      const day = A[d], ids = (co.classIds || []).filter(id => day[id]); if (!ids.length) return;
      const ck = CK(co.id);
      if (!day[ck]) {   // pick the plan most periods share as the course plan
        const counts = {}; ids.forEach(id => { const k = JSON.stringify(day[id]); counts[k] = (counts[k] || 0) + 1; });
        day[ck] = JSON.parse(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
      }
      ids.forEach(id => { if (same(day[id], day[ck])) { delete day[id]; merged++; } });
    }));
    S.set('agenda', A);
    return merged;
  };
  S.unmergedDays = () => { const A = S.agendaAll(), cos = S.courses(); return Object.keys(A).filter(d => cos.some(co => (co.classIds || []).some(id => A[d][id]))).length; };
  // true when a period has its own plan on that day, different from its course
  S.agendaIsOwn = (dateKey, classId) => !!((S.agendaAll()[dateKey] || {})[classId]) && !!S.courseOf(classId);
  // Move a row's plans (a course with its sections' own plans, or one class) forward by n school days, from a date on.
  S.shiftPlans = (keys, fromKey, n) => {
    const a = S.agendaAll();
    const isSchool = k => { const [y, m, d] = k.split('-').map(Number); return S.scheduleFor(new Date(y, m - 1, d, 12)).periods.length > 0; };
    const step = (k, dir) => { const [y, m, d] = k.split('-').map(Number); const dt = new Date(y, m - 1, d, 12); do { dt.setDate(dt.getDate() + dir); } while (!isSchool(S.dateKey(dt))); return S.dateKey(dt); };
    const moveBy = (k, count) => { let out = k; for (let i = 0; i < Math.abs(count); i++) out = step(out, count > 0 ? 1 : -1); return out; };
    const moved = [];
    keys.forEach(key => Object.keys(a).filter(d => d >= fromKey && a[d][key]).forEach(d => { moved.push({ key, from: d, entry: a[d][key] }); delete a[d][key]; }));
    moved.forEach(m => { const to = moveBy(m.from, n); (a[to] = a[to] || {})[m.key] = m.entry; });
    Object.keys(a).forEach(d => { if (!Object.keys(a[d]).length) delete a[d]; });
    S.set('agenda', a);
    return moved.length;
  };
  // Most recent plan for a class before a date, to start from when a lesson runs several days.
  S.lastAgenda = (dateKey, classId) => {
    const a = S.agendaAll(); const days = Object.keys(a).filter(k => k < dateKey && a[k][classId]).sort();
    return days.length ? a[days[days.length - 1]][classId] : null;
  };
  S.saveAgenda = (dateKey, classIds, entry) => {
    const a = S.agendaAll(), day = a[dateKey] = a[dateKey] || {};
    classIds.forEach(id => { if (entry) day[id] = JSON.parse(JSON.stringify(entry)); else delete day[id]; });
    if (!Object.keys(day).length) delete a[dateKey];
    const cut = new Date(); cut.setDate(cut.getDate() - 180); const ck = S.dateKey(cut);   // keep about a semester
    Object.keys(a).forEach(k => { if (k < ck) delete a[k]; });
    S.set('agenda', a);
  };


  /* ---------- pop-out mini windows ---------- */
  const POP_SIZES = { timer: [360, 300], points: [420, 460], name: [380, 300] };
  S.popOut = async kind => {
    const [w0, h0] = POP_SIZES[kind];
    let w, onTop = true;
    try {
      if ('documentPictureInPicture' in window) w = await documentPictureInPicture.requestWindow({ width: w0, height: h0 });
    } catch (e) { w = null; }
    if (!w) {
      onTop = false;
      w = window.open('', 'suite-pop-' + kind, `popup,width=${w0},height=${h0}`);
      if (!w) { S.toast('This browser blocked the pop-out window. Allow pop-ups for this site and try again.'); return; }
      w.document.open(); w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + S.esc(S.suiteName()) + '</title></head><body></body></html>'); w.document.close();
    }
    const d = w.document;
    document.querySelectorAll('link[rel="stylesheet"]').forEach(n => { const l = d.createElement('link'); l.rel = 'stylesheet'; l.href = n.href; d.head.appendChild(l); });
    const th = document.documentElement.getAttribute('data-theme'); if (th) d.documentElement.setAttribute('data-theme', th);
    S.applyAppearance(d);
    d.body.className = 'pop pop-' + kind;
    const st = d.createElement('style'); st.textContent = POP_CSS; d.head.appendChild(st);
    const state = { cls: null, name: '', used: new Set() };
    const draw = () => { try { POP_RENDER[kind](d, state); } catch (e) {} };
    draw();
    const iv = setInterval(draw, 400);
    w.addEventListener('pagehide', () => clearInterval(iv));
    d.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { POP_ACT[kind](b, state, d); draw(); } });
    d.addEventListener('change', e => { if (e.target.dataset.p === 'cls') { state.cls = e.target.value; state.name = ''; state.used = new Set(); draw(); } });
    if (!onTop) S.toast("This browser can't keep the window on top of other windows. Chrome or Edge can.");
  };
  const POP_CSS = `
body.pop{margin:0;padding:12px 14px;background:var(--paper);font-family:var(--sans);color:var(--ink)}
.pop .ph{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.pop .ph b{font-family:var(--serif);font-weight:400;font-size:20px}
.pop select{font:inherit;font-size:14px;padding:3px 6px;border-radius:8px;border:1.5px solid var(--rule);background:var(--sheet);color:var(--ink);max-width:170px}
.pop .big{font-family:var(--serif);font-size:72px;line-height:1;text-align:center;font-variant-numeric:tabular-nums;margin:6px 0 10px}
.pop .big.done{color:var(--land)}
.pop .row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:6px}
.pop button{font:inherit;font-weight:700;font-size:14px;border:2px solid var(--edge);border-radius:999px;background:var(--sheet);color:var(--ink);padding:5px 12px;cursor:pointer}
.pop button.pri{background:var(--sea);border-color:var(--sea);color:var(--on-sea)}
.pop button.neg{color:var(--plum);border-color:var(--plum)}
.pop .tbl{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:6px;padding:5px 0;border-top:1px solid var(--rule)}
.pop .tbl:first-of-type{border-top:0}
.pop .tn{display:flex;align-items:center;gap:8px;font-weight:600;font-size:15px}
.pop .dot{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--ink);flex:none}
.pop .pts{font-family:var(--serif);font-size:24px;min-width:40px;text-align:right}
.pop .who{font-family:var(--serif);font-size:44px;text-align:center;min-height:56px;margin:10px 0}
.pop .note{font-size:12px;color:var(--ink-2);text-align:center;margin-top:8px}`;
  const tracker = () => Object.assign({ quarter: 1, week: 1, log: [], double: false }, S.get('tracker', {}));
  const popClass = st => { const l = S.classes(); const T = tracker(); return l.find(c => c.id === (st.cls || T.cur)) || l[0] || null; };
  const classSelect = (st, c) => { const l = S.classes(); return l.length > 1 ? `<select data-p="cls">${l.map(k => `<option value="${S.esc(k.id)}"${c && k.id === c.id ? ' selected' : ''}>${S.esc(k.name)}</option>`).join('')}</select>` : (c ? `<span class="small">${S.esc(c.name)}</span>` : ''); };
  const POP_RENDER = {
    timer(d){
      const t = tget(), left = tleft(t);
      const key = t.state + '|' + Math.ceil(left / 1000);
      if (d.body.dataset.k === key) return; d.body.dataset.k = key;
      d.body.innerHTML = `<div class="ph"><b>Timer</b></div>
        <div class="big${t.state === 'done' ? ' done' : ''}">${t.state === 'done' ? "Time's up" : S.fmtDuration(left)}</div>
        <div class="row"><button class="pri" data-p="go">${t.state === 'running' ? 'Pause' : t.state === 'paused' ? 'Resume' : 'Start'}</button><button data-p="reset">Reset</button><button data-p="add">+1 min</button></div>
        <div class="row">${[1, 2, 3, 5, 10].map(n => `<button data-p="pre" data-ms="${n * 60000}">${n} min</button>`).join('')}</div>`;
    },
    points(d, st){
      const c = popClass(st), T = tracker();
      if (!c) { d.body.innerHTML = '<p>Add a class in settings first.</p>'; return; }
      const lay = S.roomLayout(c.tables), act = S.activeTables(c).slice().sort((a, b) => lay.at[a.id].row - lay.at[b.id].row || lay.at[a.id].col - lay.at[b.id].col);
      const pts = id => T.log.reduce((n, e) => n + (e.c === c.id && e.t === id && e.q === T.quarter && e.w === T.week ? e.d : 0), 0);
      const key = c.id + '|' + T.log.length + '|' + T.week + '|' + T.double + '|' + S.classes().length;
      if (d.body.dataset.k === key) return; d.body.dataset.k = key;
      d.body.innerHTML = `<div class="ph"><b>Table points</b>${classSelect(st, c)}</div>
        ${act.map(t => `<div class="tbl"><span class="tn"><span class="dot" style="background:${S.esc(t.color)}"></span>${S.esc(t.name)}</span><span class="pts">${pts(t.id)}</span>
          <button class="pri" data-p="aw" data-t="${S.esc(t.id)}" data-d="1">+1</button><button class="neg" data-p="aw" data-t="${S.esc(t.id)}" data-d="-1">−1</button></div>`).join('')}
        <div class="note">Week ${T.week}${T.double ? ' · Double points on' : ''}. Points save to the Table points page.</div>`;
    },
    name(d, st){
      const c = popClass(st);
      if (!c) { d.body.innerHTML = '<p>Add a class in settings first.</p>'; return; }
      const key = c.id + '|' + st.name + '|' + st.used.size + '|' + c.students.length;
      if (d.body.dataset.k === key) return; d.body.dataset.k = key;
      d.body.innerHTML = `<div class="ph"><b>Name picker</b>${classSelect(st, c)}</div>
        <div class="who">${st.name ? S.esc(st.name) : '&nbsp;'}</div>
        <div class="row"><button class="pri" data-p="pick">Pick a name</button><button data-p="again">Start over</button></div>
        <div class="note">${c.students.length ? `${Math.max(0, pickable(c).length - st.used.size)} of ${pickable(c).length} left before names repeat.` : 'No students in this class yet.'}</div>`;
    }
  };
  const pickable = c => { const sp = S.get('spinner', {}), a = sp.absent && sp.absent[c.id]; const away = a && a.date === S.dateKey(new Date()) ? new Set(a.ids) : new Set(); return c.students.filter(s => !away.has(s.id)); };
  const POP_ACT = {
    timer(b){ const k = b.dataset.p; if (k === 'go') tToggle(); else if (k === 'reset') tReset(); else if (k === 'add') tAdd(60000); else if (k === 'pre') tStart(+b.dataset.ms); },
    points(b, st){
      if (b.dataset.p !== 'aw') return;
      const c = popClass(st); if (!c) return;
      const T = tracker(); let d = +b.dataset.d, note = 'Pop-out';
      if (T.double && d > 0) { d *= 2; note = 'Pop-out, double'; }
      T.log.push({ id: S.uid(), c: c.id, t: b.dataset.t, d, w: T.week, q: T.quarter, note });
      S.set('tracker', T); emit({ key: 'tracker', external: true });
    },
    name(b, st){
      const c = popClass(st); if (!c) return;
      if (b.dataset.p === 'again') { st.used = new Set(); st.name = ''; return; }
      let pool = pickable(c).filter(s => !st.used.has(s.id));
      if (!pool.length) { st.used = new Set(); pool = pickable(c); }
      if (!pool.length) return;
      const s = pool[Math.floor(Math.random() * pool.length)]; st.used.add(s.id); st.name = s.name;
    }
  };

  /* ---------- countdowns ---------- */
  S.countdowns = () => S.get('countdowns', []);
  // Days from today to dateStr. schoolOnly counts only days with bells (skips weekends and "No school" days).
  // The moment a countdown ends: its time on that date, or the start of the day if no time was set.
  S.countdownEnd = cd => {
    const [y, m, d] = String(cd.date || '').split('-').map(Number); if (!y) return null;
    const [hh, mm] = cd.time ? cd.time.split(':').map(Number) : [0, 0];
    return new Date(y, m - 1, d, hh || 0, mm || 0);
  };
  // Still showing? Timed ones end at their time; untimed ones stay through their day.
  S.countdownLive = (cd, now) => {
    const end = S.countdownEnd(cd); if (!end || !cd.label) return false;
    if (cd.time) return end > now;
    return cd.date >= S.dateKey(now);
  };
  S.daysUntil = (dateStr, schoolOnly) => {
    const [y, m, d] = String(dateStr).split('-').map(Number); if (!y) return null;
    const target = new Date(y, m - 1, d), today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    if (diff <= 0 || !schoolOnly) return diff;
    let n = 0; const cur = new Date(today);
    for (let i = 0; i < diff && i < 400; i++) { cur.setDate(cur.getDate() + 1); if (S.scheduleFor(cur).periods.length) n++; }
    return n;
  };


  /* ---------- appearance (colors, fonts, name), per browser ---------- */
  S.THEMES = {
    streamline: { name: 'Streamline: navy and coral', main: '#1C2B3A', accent: '#B84A32', paper: '#EFEDE6', sheet: '#FAF8F3', display: 'Limelight', body: 'Jost' },
    emerald:    { name: 'Emerald deco: green and gold', main: '#1F4536', accent: '#A87A24', paper: '#F1EEE4', sheet: '#FBF9F2', display: 'Limelight', body: 'Jost' },
    seaside:    { name: 'Seaside: teal and sunset', main: '#1E4F5A', accent: '#C8602F', paper: '#EDF1EF', sheet: '#FAFBF9', display: 'Playfair Display', body: 'Jost' },
    berry:      { name: 'Berry: plum and rose', main: '#3B2745', accent: '#B8436A', paper: '#F2EDF0', sheet: '#FBF8FA', display: 'Playfair Display', body: 'Jost' },
    simple:     { name: 'Simple: slate and blue', main: '#233040', accent: '#2C68A8', paper: '#F1F3F5', sheet: '#FFFFFF', display: 'Poppins', body: 'Atkinson Hyperlegible' }
  };
  S.DISPLAY_FONTS = { 'Limelight': 'Deco (Limelight)', 'Playfair Display': 'Classic serif (Playfair)', 'Poppins': 'Modern (Poppins)', 'Jost': 'Clean (Jost)' };
  S.BODY_FONTS = { 'Jost': 'Jost', 'Atkinson Hyperlegible': 'Atkinson Hyperlegible (extra readable)', 'system': "This computer's default" };
  S.appearance = () => Object.assign({ theme: 'emerald', main: '', accent: '', display: '', body: '', name: '' }, S.get('appearance', {}));
  (function keepExistingLook(){
    // runs once: anyone already set up before Emerald became the default keeps Streamline
    try {
      if (localStorage.getItem('suite:look2')) return;
      if (!localStorage.getItem('suite:appearance') && localStorage.getItem('suite:classes')) localStorage.setItem('suite:appearance', JSON.stringify({ theme: 'streamline' }));
      localStorage.setItem('suite:look2', '1');
    } catch (e) {}
  })();
  S.suiteName = () => S.appearance().name.trim() || 'Classroom Suite';
  const lumOf = hex => { const h = String(hex).replace('#', ''); if (h.length !== 6) return 0; return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0); };
  S.applyAppearance = (doc) => {
    doc = doc || document;
    const a = S.appearance(), t = S.THEMES[a.theme] || S.THEMES.emerald;
    const main = a.main || t.main, accent = a.accent || t.accent, display = a.display || t.display, body = a.body || t.body;
    const ink = lumOf(main) < .08 ? main : '#1C2B3A';
    const stack = f => f === 'system' ? 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' : `"${f}",${f === 'Limelight' || f === 'Playfair Display' ? 'Georgia,serif' : 'system-ui,sans-serif'}`;
    let st = doc.getElementById('suite-appearance');
    if (!st) { st = doc.createElement('style'); st.id = 'suite-appearance'; doc.head.appendChild(st); }
    st.textContent = `:root{--serif:${stack(display)};--sans:${stack(body)}}
:root:not([data-theme="dark"]){--sea:${main};--bar:${main};--edge:${ink};--ink:${ink};--land:${accent};--on-land:${S.textOn(accent)};--paper:${t.paper};--sheet:${t.sheet}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bar:#0B1119;--ink:#ECE9E1;--edge:#3C4B5C;--sea:#ECE9E1;--paper:#111A24;--sheet:#1A2532}}`;
    const need = [display, body].filter(f => f !== 'system' && f !== 'Limelight' && f !== 'Jost');
    let fl = doc.getElementById('suite-appearance-fonts');
    if (need.length) {
      const href = 'https://fonts.googleapis.com/css2?' + need.map(f => 'family=' + f.replace(/ /g, '+') + ':wght@400;600;700').join('&') + '&display=swap';
      if (!fl) { fl = doc.createElement('link'); fl.id = 'suite-appearance-fonts'; fl.rel = 'stylesheet'; doc.head.appendChild(fl); }
      if (fl.href !== href) fl.href = href;
    } else if (fl) fl.remove();
  };
  S.applyAppearance();
  window.addEventListener('suite:change', e => { if (e.detail && (e.detail.key === 'appearance' || e.detail.key === '*')) S.applyAppearance(); });

  // Pages opened inside the Present page (or a pop-out) hide the menu bar.
  const QS = new URLSearchParams(location.search);
  S.embedded = QS.has('embed');
  S.startInProjector = QS.has('proj');
  if (S.embedded) document.documentElement.classList.add('embed');
  if (S.embedded) document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || document.querySelector('.suite-dialog') || document.body.classList.contains('timer-open') || document.querySelector('.qview') || document.getElementById('report')) return;
    e.stopImmediatePropagation();
    try { parent.postMessage({ suite: 'close' }, location.origin); } catch (x) {}
  }, true);

  /* ---------- theme ---------- */
  const THEMES = ['auto', 'light', 'dark'];
  function applyTheme() { const t = S.get('theme', 'auto'); if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
  applyTheme();
  window.addEventListener('suite:change', e => { if (e.detail && (e.detail.key === 'theme' || e.detail.key === '*')) applyTheme(); });

  /* ---------- navigation bar ---------- */
  S.loadGuide = () => new Promise(res => {
    if (window.SuiteGuide) return res(window.SuiteGuide);
    const sc = document.createElement('script');
    const me = [...document.scripts].find(x => /shared\/core\.js/.test(x.src));
    sc.src = me ? me.src.replace(/core\.js/, 'guide.js') : 'shared/guide.js?v=' + VERSION;
    sc.onload = () => res(window.SuiteGuide || null); sc.onerror = () => res(null);
    document.head.appendChild(sc);
  });
  S.mountNav = current => {
    const el = document.getElementById('suite-nav');
    if (!el) return;
    const draw = () => {
      const b = S.backupStatus();
      const actTool = current === 'activities' ? 'act-' + ((location.hash.match(/tool=(\w+)/) || [])[1] || 'game') : null;
      const isHere = id => id === current || id === actTool;
      const on = n => !n.feature || S.feature(n.feature);
      const label = n => n.id === 'tracker' ? S.word('team', { cap: true }) + ' points' : n.label;
      const link = n => `<a href="${n.href}"${isHere(n.id) ? ' aria-current="page"' : ''}>${S.esc(label(n))}${n.beta ? '<span class="beta" title="Still being refined">Beta</span>' : ''}</a>`;
      const toolItems = NAV.find(n => n.menu).menu.filter(on);
      const menu = (key, items, title) => `<div class="ddmenu" data-ddm="${key}" hidden role="menu"${title ? ` aria-label="${S.esc(title)}"` : ''}>${items.map(n => n.pop
        ? `<button role="menuitem" data-pop="${n.pop}">${S.esc(n.label)}</button>`
        : `<a role="menuitem" href="${n.href}"${isHere(n.id) ? ' aria-current="page"' : ''}>${S.esc(n.label)}</a>`).join('')}${key === 'pop' ? '<span class="ddnote">Floats on top of Google Slides in Chrome or Edge.</span>' : ''}</div>`;
      el.innerHTML = `<div class="nav-inner">
        <a class="wordmark" href="index.html">${S.esc(S.suiteName())} <span class="speed" aria-hidden="true"><i></i><i></i><i></i></span></a>
        <nav aria-label="Main"><ul>${NAV.filter(n => n.menu ? toolItems.length : on(n)).map(n => n.menu
          ? `<li><button class="ddbtn${TOOL_PAGES.includes(current) ? ' here' : ''}" data-dd="${n.id}" aria-expanded="false" aria-haspopup="true">${S.esc(n.label)}<i class="caret" aria-hidden="true"></i></button></li>`
          : `<li>${link(n)}</li>`).join('')}</ul></nav>
        <button class="btn timer-pill" data-suite="timer" id="st-pill">Timer</button>
        <button class="gear" data-dd="pop" aria-label="Pop out a mini window" title="Pop out a mini window that floats over your slides" aria-expanded="false" aria-haspopup="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M14 3h7v7M21 3l-9 9"/></svg></button>
        <button class="gear${current === 'settings' || current === 'sub' || current === 'help' ? ' on' : ''}" data-dd="gear" aria-label="Setup: classes, substitute page, and settings" title="Setup" aria-expanded="false" aria-haspopup="true">${GEAR}</button>
        ${menu('tools', toolItems, 'Tools')}
        ${menu('pop', [{ pop: 'timer', label: 'Timer' }].concat(S.feature('points') ? [{ pop: 'points', label: S.word('team', { cap: true }) + ' points' }] : [], [{ pop: 'name', label: 'Name picker' }]), 'Pop out a mini window')}
        ${menu('gear', GEAR_MENU, 'Setup')}
      </div>${window.PAGE_VERSION !== VERSION ? `<div class="backup-banner" role="alert"><b>This page is out of date.</b> Press Ctrl+Shift+R (Cmd+Shift+R on a Mac) to load the newest version.</div>` : ''}${b.due && current !== 'settings' ? `<div class="backup-banner">You haven't backed up ${b.last ? 'in ' + b.days + ' days' : 'yet'}. <a href="settings.html#backup">Back up now</a></div>` : ''}`;
    };
    draw(); timerDraw();
    // First visit in this browser (no classes yet): open the welcome and setup guide.
    if (!S.embedded && !S.get('welcomed', false) && !S.classes().length && current !== 'help') S.loadGuide().then(g => g && g.welcome());
    else if (!S.embedded && sessionStorage.getItem('suite:tour')) S.loadGuide();   // the tour picks up after setup
    // keep the page's pinned pieces clear of the menu, and slim the menu once you scroll
    const setH = () => document.documentElement.style.setProperty('--navh', el.offsetHeight + 'px');
    if (window.ResizeObserver) new ResizeObserver(setH).observe(el); setH();
    let slim = false;
    const onScroll = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight;
      const want = room > 160 && (slim ? window.scrollY > 8 : window.scrollY > 48);
      if (want !== slim) { slim = want; el.classList.toggle('slim', slim); }
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    window.addEventListener('suite:change', e => { if (!e.detail || e.detail.key !== 'timer') { draw(); timerDraw(); } });
    const closeMenus = () => { el.querySelectorAll('.ddmenu').forEach(m => { m.hidden = true; }); el.querySelectorAll('[data-dd]').forEach(b => b.setAttribute('aria-expanded', 'false')); };
    el.addEventListener('click', e => {
      const dd = e.target.closest('[data-dd]'), po = e.target.closest('[data-pop]');
      if (dd) {
        const m = el.querySelector(`[data-ddm="${dd.dataset.dd}"]`), open = m.hidden;
        closeMenus();
        if (open) {
          m.hidden = false; dd.setAttribute('aria-expanded', 'true');
          const r = dd.getBoundingClientRect(), w = m.offsetWidth;
          m.style.top = (r.bottom + 6) + 'px';
          m.style.left = Math.max(8, Math.min(dd.dataset.dd === 'tools' ? r.left : r.right - w, window.innerWidth - w - 8)) + 'px';
          const first = m.querySelector('a,button'); if (first) first.focus();
        }
        return;
      }
      if (po) { closeMenus(); S.popOut(po.dataset.pop); return; }
      if (e.target.closest('.ddmenu a')) closeMenus();
    });
    document.addEventListener('click', e => { if (!e.target.closest('#suite-nav')) closeMenus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.querySelector('.ddmenu:not([hidden])')) { closeMenus(); e.stopPropagation(); } }, true);
    window.addEventListener('scroll', closeMenus, { passive: true });
    window.addEventListener('resize', closeMenus);
  };

  window.Suite = S;
})();
