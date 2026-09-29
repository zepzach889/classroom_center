/* Classroom Suite — shared data + helpers.
   Everything is stored in this browser's localStorage under keys starting with "suite:".
   No student data is ever written into the website's files. */
(function () {
  'use strict';
  const PREFIX = 'suite:';
  const PALETTE = ['#24405E', '#C99A3E', '#B84A32', '#5E806B', '#6A5577', '#3F7F8A', '#8A6A3E', '#4A5663'];
  const OLD_PALETTE = ['#2E6378', '#B7924A', '#6B7F3A', '#7A2E4F', '#4F5D8A', '#A0643A', '#3F7F74', '#8A5A83'];
  // [id, name, seats, row, spot] — spot = position from the left, matching the room
  const DEFAULT_TABLES = [['sequoyah', 'Sequoyah', 8, 1, 1], ['delmarva', 'Delmarva', 6, 1, 2], ['franklin', 'Franklin', 6, 1, 3], ['jefferson', 'Jefferson', 6, 2, 2], ['metropotamia', 'Metropotamia', 6, 2, 3]];
  // Flip "soon" to false as each page is added to the site.
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', href: 'index.html', soon: false },
    { id: 'tracker', label: 'Table points', href: 'tracker.html', soon: false },
    { id: 'spinner', label: 'Name spinner', href: 'spinner.html', soon: false },
    { id: 'topics', label: 'Topic picker', href: 'topics.html', soon: false },
    { id: 'settings', label: 'Classes & settings', href: 'settings.html', soon: false }
  ];

  const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const emit = detail => window.dispatchEvent(new CustomEvent('suite:change', { detail }));
  const VERSION = '2026-09-29a';   // bump with every build; pages check they match
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

  /* ---------- classes & tables ---------- */
  S.defaultTables = () => DEFAULT_TABLES.map(([id, name, seats, row, col], i) => ({ id, name, seats, open: true, color: PALETTE[i % PALETTE.length], row, col }));
  // Where each table sits in the room. Tables without a spot get the default for their name,
  // or the next free spot. Returns { cols, rows, at: { tableId: { row, col } } }.
  S.roomLayout = tables => {
    const known = {}; DEFAULT_TABLES.forEach(d => { known[d[1].toLowerCase()] = { row: d[3], col: d[4] }; });
    const at = {}, used = new Set(), key = (r, c) => r + ',' + c;
    const want = t => (t.row && t.col) ? { row: +t.row, col: +t.col } : known[String(t.name).trim().toLowerCase()] || null;
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
  S.getSchedule = () => {
    const s = S.get('schedule', null) || clone(DEFAULT_SCHEDULE);
    s.schedules = s.schedules || []; s.weekdays = s.weekdays || {}; s.special = s.special || [];
    s.passingMinutes = s.passingMinutes || 4;
    return s;
  };
  S.saveSchedule = s => S.set('schedule', s);
  S.scheduleFor = date => {
    const s = S.getSchedule();
    const sp = s.special.find(x => x.date === S.dateKey(date));
    const wd = date.getDay();
    const id = sp ? sp.scheduleId : (wd === 0 || wd === 6 ? 'none' : (s.weekdays[wd] || 'none'));
    if (id === 'none') return { periods: [], label: sp ? (sp.label || 'No school') : (wd === 0 || wd === 6 ? 'Weekend' : 'No school'), special: !!sp };
    const sc = s.schedules.find(x => x.id === id) || s.schedules[0];
    if (!sc) return { periods: [], label: 'No schedule set up', special: false };
    return { periods: sc.periods.slice().sort((a, b) => toMin(a.start) - toMin(b.start)), label: (sp && sp.label) || sc.name, special: !!sp };
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
    delete data.meta; delete data.theme;
    return data;
  };
  S.exportBackup = () => {
    const payload = { app: 'classroom-suite', version: 1, exported: new Date().toISOString(), data: S.allData() };
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
    if (d && d.app === 'classroom-suite' && d.data) return { data: d.data, exported: d.exported || null };
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
  S.restore = data => {
    S.clearAll(true);
    Object.entries(data).forEach(([k, v]) => rawSet(k, v));
    rawSet('meta', { lastChange: Date.now(), lastBackup: Date.now() });
    emit({ key: '*' });
  };
  S.clearAll = keepTheme => { allKeys(keepTheme).forEach(k => localStorage.removeItem(k)); emit({ key: '*' }); };
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

  /* ---------- theme ---------- */
  const THEMES = ['auto', 'light', 'dark'];
  function applyTheme() { const t = S.get('theme', 'auto'); if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
  applyTheme();

  /* ---------- navigation bar ---------- */
  S.mountNav = current => {
    const el = document.getElementById('suite-nav');
    if (!el) return;
    const draw = () => {
      const b = S.backupStatus();
      const theme = S.get('theme', 'auto');
      el.innerHTML = `<div class="nav-inner">
        <a class="wordmark" href="index.html">Classroom Suite <span class="speed" aria-hidden="true"><i></i><i></i><i></i></span></a>
        <nav aria-label="Tools"><ul>${NAV.map(n => `<li>${n.soon
          ? `<span class="soon" title="Coming soon">${S.esc(n.label)}</span>`
          : `<a href="${n.href}"${n.id === current ? ' aria-current="page"' : ''}>${S.esc(n.label)}</a>`}</li>`).join('')}</ul></nav>
        <button class="btn quiet theme-btn" data-suite="theme">Theme: ${theme[0].toUpperCase() + theme.slice(1)}</button>
      </div>${window.PAGE_VERSION !== VERSION ? `<div class="backup-banner" role="alert"><b>This page is out of date.</b> Press Ctrl+Shift+R (Cmd+Shift+R on a Mac) to load the newest version.</div>` : ''}${b.due && current !== 'settings' ? `<div class="backup-banner">You haven't backed up ${b.last ? 'in ' + b.days + ' days' : 'yet'}. <a href="settings.html#backup">Back up now</a></div>` : ''}`;
    };
    draw();
    window.addEventListener('suite:change', draw);
    el.addEventListener('click', e => {
      if (!e.target.closest('[data-suite="theme"]')) return;
      const t = S.get('theme', 'auto');
      S.set('theme', THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
      applyTheme();
    });
  };

  window.Suite = S;
})();
