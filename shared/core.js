/* Classroom Suite — shared data + helpers.
   Everything is stored in this browser's localStorage under keys starting with "suite:".
   No student data is ever written into the website's files. */
(function () {
  'use strict';
  const PREFIX = 'suite:';
  const PALETTE = ['#2E6378', '#B7924A', '#6B7F3A', '#7A2E4F', '#4F5D8A', '#A0643A', '#3F7F74', '#8A5A83'];
  const DEFAULT_TABLES = [['sequoyah', 'Sequoyah', 8], ['delmarva', 'Delmarva', 6], ['franklin', 'Franklin', 6], ['jefferson', 'Jefferson', 6], ['metropotamia', 'Metropotamia', 6]];
  // Flip "soon" to false as each page is added to the site.
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', href: 'index.html', soon: true },
    { id: 'tracker', label: 'Table points', href: 'tracker.html', soon: false },
    { id: 'spinner', label: 'Name spinner', href: 'spinner.html', soon: true },
    { id: 'topics', label: 'Topic picker', href: 'topics.html', soon: true },
    { id: 'settings', label: 'Classes & settings', href: 'settings.html', soon: false }
  ];

  const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const emit = detail => window.dispatchEvent(new CustomEvent('suite:change', { detail }));
  const S = { PALETTE, NAV };

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
  S.defaultTables = () => DEFAULT_TABLES.map(([id, name, seats], i) => ({ id, name, seats, open: true, color: PALETTE[i % PALETTE.length] }));
  S.classes = () => S.get('classes', []);
  S.saveClasses = list => S.set('classes', list);
  S.newClass = (name, template) => ({
    id: S.uid(), name,
    tables: clone(template && template.tables && template.tables.length ? template.tables : S.defaultTables()),
    students: []
  });
  S.nextColor = tables => { const used = new Set(tables.map(t => t.color)); return PALETTE.find(c => !used.has(c)) || PALETTE[tables.length % PALETTE.length]; };
  S.activeTables = cls => (cls ? cls.tables.filter(t => t.open) : []);

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
  S.dialog = o => new Promise(resolve => {
    const hasInput = o.input !== undefined;
    const back = document.createElement('div');
    back.className = 'suite-dialog-back';
    back.innerHTML = `<div class="suite-dialog" role="dialog" aria-modal="true" aria-labelledby="sd-title">
      <h2 id="sd-title">${S.esc(o.title)}</h2>${o.body ? `<p>${S.esc(o.body)}</p>` : ''}
      ${hasInput ? `<input class="field" id="sd-input" value="${S.esc(o.input)}" aria-label="${S.esc(o.title)}">` : ''}
      <div class="suite-dialog-actions">${o.alert ? '' : `<button class="btn" data-r="no">${S.esc(o.cancel || 'Cancel')}</button>`}
      <button class="btn ${o.danger ? 'danger-fill' : 'primary'}" data-r="yes">${S.esc(o.ok || 'OK')}</button></div></div>`;
    const prevFocus = document.activeElement;
    document.body.appendChild(back);
    const inp = back.querySelector('#sd-input');
    (inp || back.querySelector('[data-r="yes"]')).focus();
    if (inp) inp.select();
    const done = v => { back.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
    const yes = () => done(hasInput ? (inp.value.trim() || null) : true);
    const no = () => done(hasInput ? null : false);
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
        <a class="wordmark" href="${NAV[0].soon ? 'settings.html' : NAV[0].href}">Classroom Suite</a>
        <nav aria-label="Tools"><ul>${NAV.map(n => `<li>${n.soon
          ? `<span class="soon" title="Coming soon">${S.esc(n.label)}</span>`
          : `<a href="${n.href}"${n.id === current ? ' aria-current="page"' : ''}>${S.esc(n.label)}</a>`}</li>`).join('')}</ul></nav>
        <button class="btn quiet theme-btn" data-suite="theme">Theme: ${theme[0].toUpperCase() + theme.slice(1)}</button>
      </div>${b.due && current !== 'settings' ? `<div class="backup-banner">You haven't backed up ${b.last ? 'in ' + b.days + ' days' : 'yet'}. <a href="settings.html#backup">Back up now</a></div>` : ''}`;
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
