/* Classroom Suite: first-visit welcome, setup guide, and menu tour.
   Loaded on demand by core.js. Nothing here stores student data outside this browser. */
(function () {
  'use strict';
  const S = window.Suite, esc = S.esc;
  const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Teal', 'Pink', 'Gray', 'Brown', 'Navy', 'Gold'];
  const TOOLS = [['points', 'Team points and weekly prizes'], ['captains', 'Captains or leaders'], ['goals', 'Weekly team goals'], ['spinner', 'Name spinner'], ['topics', 'Topic picker'], ['game', 'Review game'], ['stations', 'Stations'], ['tally', 'Tally'], ['groups', 'Partners and groups'], ['noise', 'Noise meter'], ['present', 'Present (Google Slides)']];

  const G = {
    step: 0,
    count: 6, names: '',
    room: 'tables', tables: 5, naming: 'numbers', custom: '', seats: 6, seatCols: 2, rows: 5, perRow: 6,
    team: 'table', lead: 'captain', features: Object.fromEntries(TOOLS.map(([k]) => [k, true])),
    sched: 'preset', track: 'six', staff: true, offset: true,
    rosters: {}, spread: true
  };
  const classNames = () => G.names.split('\n').map(x => x.trim()).filter(Boolean);
  const defaultNames = n => Array.from({ length: n }, (_, i) => 'Period ' + (i + 1)).join('\n');
  G.names = defaultNames(G.count);
  function tableNames(){
    const n = G.tables, word = (G.team.charAt(0).toUpperCase() + G.team.slice(1));
    if (G.naming === 'colors') return COLORS.slice(0, n).concat(Array.from({ length: Math.max(0, n - COLORS.length) }, (_, i) => word + ' ' + (COLORS.length + i + 1)));
    if (G.naming === 'custom') { const c = G.custom.split('\n').map(x => x.trim()).filter(Boolean); return Array.from({ length: n }, (_, i) => c[i] || word + ' ' + (i + 1)); }
    return Array.from({ length: n }, (_, i) => word + ' ' + (i + 1));
  }

  /* ---------- the guide window ---------- */
  let box = null;
  const STEPS = ['welcome', 'classes', 'room', 'words', 'schedule', 'rosters', 'done'];
  function open(){
    if (!box) { box = document.createElement('div'); box.className = 'guide-back'; box.innerHTML = '<div class="guide" role="dialog" aria-modal="true" aria-labelledby="g-title"></div>'; document.body.appendChild(box); wire(); }
    injectCss(); draw();
  }
  function close(){ if (box) { box.remove(); box = null; } }
  function dots(){ return `<div class="g-dots" aria-hidden="true">${STEPS.slice(1, -1).map((s, i) => `<i class="${i + 1 === G.step ? 'on' : i + 1 < G.step ? 'done' : ''}"></i>`).join('')}</div>`; }
  const nav = (next, back) => `<div class="g-nav">${back !== false ? '<button class="btn" data-g="back">Back</button>' : '<span></span>'}<button class="btn primary" data-g="next">${next || 'Next'}</button></div>`;

  function draw(){
    const g = box.querySelector('.guide'), step = STEPS[G.step];
    let h = '';
    if (step === 'welcome') {
      h = `<h1 id="g-title">Welcome to ${esc(S.suiteName())}</h1>
        <p class="g-lead">Classroom tools in one place: a bell-schedule dashboard, team points, seating charts, a name spinner, timers, review games, and more.</p>
        <p>A quick setup, about three minutes, gets your classes, room, and bell schedule ready in one go. You can change anything later.</p>
        <p class="g-note">Everything you enter stays in this browser on this computer. Nothing goes into the website itself.</p>
        <div class="g-nav"><span class="bar"><button class="btn quiet" data-g="skip">Skip for now</button><button class="btn quiet" data-g="restore">Restore a backup instead</button></span><button class="btn primary" data-g="next">Start setup</button></div>`;
    }
    else if (step === 'classes') {
      h = `${dots()}<h2 id="g-title">Your classes</h2>
        <label class="g-l">How many classes (periods) do you teach?<input class="field num" type="number" min="1" max="12" data-k="count" value="${G.count}"></label>
        <label class="g-l">Their names <span class="muted small">(one per line; "Period 3" matches the bell schedule automatically)</span><textarea rows="7" data-k="names">${esc(G.names)}</textarea></label>
        ${nav()}`;
    }
    else if (step === 'room') {
      const opts = S.seatOptions(G.seats);
      if (!opts.some(o => o.cols === G.seatCols)) G.seatCols = opts[0].cols;
      h = `${dots()}<h2 id="g-title">Your room</h2>
        <div class="g-choice">
          <label class="${G.room === 'tables' ? 'on' : ''}"><input type="radio" name="room" data-k="room" value="tables"${G.room === 'tables' ? ' checked' : ''}><b>Tables or groups</b><span>Students sit together, and groups can earn points.</span></label>
          <label class="${G.room === 'desks' ? 'on' : ''}"><input type="radio" name="room" data-k="room" value="desks"${G.room === 'desks' ? ' checked' : ''}><b>Rows of desks</b><span>Students sit in rows. Team points start turned off.</span></label>
        </div>
        ${G.room === 'tables' ? `<div class="g-grid">
            <label class="g-l">How many tables?<input class="field num" type="number" min="1" max="12" data-k="tables" value="${G.tables}"></label>
            <label class="g-l">Seats at each<input class="field num" type="number" min="1" max="12" data-k="seats" value="${G.seats}"></label>
            <label class="g-l">Seat arrangement<select data-k="seatCols">${opts.map(o => `<option value="${o.cols}"${o.cols === G.seatCols ? ' selected' : ''}>${o.label}</option>`).join('')}</select></label>
            <label class="g-l">Names<select data-k="naming">
              <option value="numbers"${G.naming === 'numbers' ? ' selected' : ''}>Numbers (Table 1, Table 2...)</option>
              <option value="colors"${G.naming === 'colors' ? ' selected' : ''}>Colors (Red, Blue...)</option>
              <option value="custom"${G.naming === 'custom' ? ' selected' : ''}>My own names</option></select></label>
          </div>
          ${G.naming === 'custom' ? `<label class="g-l">Your names, one per line<textarea rows="4" data-k="custom">${esc(G.custom)}</textarea></label>` : ''}
          <p class="g-note">Tables: ${esc(tableNames().join(', '))}. You can rename them, change seats, and arrange them like your room later.</p>`
        : `<div class="g-grid"><label class="g-l">How many rows?<input class="field num" type="number" min="1" max="12" data-k="rows" value="${G.rows}"></label>
            <label class="g-l">Desks in each row<input class="field num" type="number" min="1" max="12" data-k="perRow" value="${G.perRow}"></label></div>`}
        ${nav()}`;
    }
    else if (step === 'words') {
      h = `${dots()}<h2 id="g-title">Words and tools</h2>
        ${G.room === 'tables' ? `<div class="g-grid">
          <label class="g-l">Each group is called a<select data-k="team">${['table', 'team', 'group', 'pod', 'crew'].map(w => `<option${G.team === w ? ' selected' : ''}>${w}</option>`).join('')}</select></label>
          <label class="g-l">The person in charge is the<select data-k="lead">${['captain', 'leader', 'manager', 'chair'].map(w => `<option${G.lead === w ? ' selected' : ''}>${w}</option>`).join('')}</select></label></div>` : ''}
        <p class="g-l" style="margin-bottom:4px">Which tools do you want in your menu?</p>
        <div class="g-tools">${TOOLS.filter(([k]) => G.room === 'tables' || !['captains', 'goals'].includes(k)).map(([k, l]) => `<label><input type="checkbox" data-f="${k}"${G.features[k] ? ' checked' : ''}> ${esc(l)}</label>`).join('')}</div>
        <p class="g-note">Anything you turn off just hides. You can turn it back on in General settings.</p>
        ${nav()}`;
    }
    else if (step === 'schedule') {
      const P = S.PRESETS.school2627;
      h = `${dots()}<h2 id="g-title">Bell schedule</h2>
        <div class="g-choice">
          <label class="${G.sched === 'preset' ? 'on' : ''}"><input type="radio" name="sched" data-k="sched" value="preset"${G.sched === 'preset' ? ' checked' : ''}><b>${esc(P.name)}</b><span>Regular, Wednesday early release, and delayed start, with passing periods.</span></label>
          <label class="${G.sched === 'blank' ? 'on' : ''}"><input type="radio" name="sched" data-k="sched" value="blank"${G.sched === 'blank' ? ' checked' : ''}><b>Start blank</b><span>Enter your own bell times later.</span></label>
        </div>
        ${G.sched === 'preset' ? `<div class="g-grid">
          <label class="g-l">Which lunch does your day follow?<select data-k="track">${Object.entries(P.tracks).map(([k, l]) => `<option value="${k}"${G.track === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
          <label class="g-check"><input type="checkbox" data-k="staff"${G.staff ? ' checked' : ''}> Show staff time before and after the student day (7:45 to 3:45)</label>
          <label class="g-check"><input type="checkbox" data-k="offset"${G.offset ? ' checked' : ''}> Our bells currently ring 1 minute early; match them</label>` : ''}
        ${nav()}`;
    }
    else if (step === 'rosters') {
      const names = classNames();
      h = `${dots()}<h2 id="g-title">Student names <span class="muted small">(optional)</span></h2>
        <p>Paste each class's names, one per line, or skip this and add them later in Classes and rosters.</p>
        <div class="g-rosters">${names.map((n, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(n)}<span class="muted small">${(G.rosters[i] || '').split('\n').filter(x => x.trim()).length || ''}</span></summary><textarea rows="6" data-r="${i}" placeholder="One name per line">${esc(G.rosters[i] || '')}</textarea></details>`).join('')}</div>
        ${G.room === 'tables' ? `<label class="g-check"><input type="checkbox" data-k="spread"${G.spread ? ' checked' : ''}> Spread students across the ${esc(G.team)}s at random (you can rearrange later)</label>` : ''}
        ${nav('Finish setup')}`;
    }
    else if (step === 'done') {
      h = `<h1 id="g-title">You're set up</h1>
        <p class="g-lead">Your classes, room, and bell schedule are ready.</p>
        <p>Want a quick look at where everything is? The tour takes about a minute. You can replay it any time from the gear menu, under Help and tour.</p>
        <div class="g-nav"><button class="btn" data-g="close">Go to my dashboard</button><button class="btn primary" data-g="tour">Take the tour</button></div>`;
    }
    g.innerHTML = h;
    const f = g.querySelector('[data-g="next"], [data-g="tour"]'); if (f && G.step === 0) f.focus();
  }

  function apply(){
    const names = classNames().length ? classNames() : ['Period 1'];
    const P = S.PRESETS.school2627;
    let tables;
    if (G.room === 'tables') {
      const tn = tableNames();
      tables = tn.map((name, i) => {
        const t = { id: S.uid(), name, seats: G.seats, open: true, color: S.PALETTE[i % S.PALETTE.length], seatCols: G.seatCols };
        return t;
      });
    } else {
      tables = Array.from({ length: G.rows }, (_, i) => ({ id: S.uid(), name: 'Row ' + (i + 1), seats: G.perRow, open: true, color: S.PALETTE[i % S.PALETTE.length], seatCols: G.perRow, row: i + 1, col: 1 }));
    }
    const classes = names.map((n, ci) => {
      const ts = JSON.parse(JSON.stringify(tables));
      const kids = (G.rosters[ci] || '').split('\n').map(x => x.trim()).filter(Boolean);
      const students = kids.map((k, i) => ({ id: S.uid(), name: k, tableId: G.spread || G.room === 'desks' ? ts[i % ts.length].id : '' }));
      if (G.spread && G.room === 'tables') {   // random, but balanced
        const order = students.slice().sort(() => Math.random() - .5);
        order.forEach((s, i) => { s.tableId = ts[i % ts.length].id; });
      }
      return { id: S.uid(), name: n, tables: ts, students };
    });
    S.saveClasses(classes);
    const features = Object.assign({}, G.features);
    if (G.room === 'desks') { features.captains = false; features.goals = false; }
    S.set('prefs', { words: { team: G.room === 'desks' ? 'row' : G.team, lead: G.lead }, features });
    if (G.sched === 'preset') { const sc = P.build(G.track, G.staff); sc.offset = G.offset ? P.suggestedOffset : 0; S.saveSchedule(sc); }
    else S.saveSchedule({ schedules: [{ id: 'regular', name: 'Regular day', periods: [] }], weekdays: { 1: 'regular', 2: 'regular', 3: 'regular', 4: 'regular', 5: 'regular' }, special: [], passingMinutes: 4, offset: 0 });
    S.set('welcomed', true);
  }

  function wire(){
    box.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.r != null) { G.rosters[t.dataset.r] = t.value; return; }
      const k = t.dataset.k; if (!k || t.type === 'radio' || t.type === 'checkbox' || t.tagName === 'SELECT') return;
      if (k === 'names' || k === 'custom') { G[k] = t.value; return; }
    });
    box.addEventListener('change', e => {
      const t = e.target, k = t.dataset.k;
      if (t.dataset.f) { G.features[t.dataset.f] = t.checked; return; }
      if (!k) return;
      if (t.type === 'checkbox') G[k] = t.checked;
      else if (t.type === 'number') {
        const v = Math.max(+t.min || 1, Math.min(+t.max || 99, parseInt(t.value, 10) || 1)); G[k] = v;
        if (k === 'count') { const cur = classNames(); G.names = cur.length === v ? G.names : Array.from({ length: v }, (_, i) => cur[i] || 'Period ' + (i + 1)).join('\n'); }
      }
      else if (k === 'seatCols') G[k] = +t.value;
      else G[k] = t.value;
      if (k === 'room') { G.features.points = t.value === 'tables'; }
      if (['room', 'naming', 'seats', 'sched', 'count', 'tables'].includes(k)) draw();
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      const g = b.dataset.g;
      if (g === 'next') {
        const f = box.querySelector('textarea[data-k="names"]'); if (f) G.names = f.value;
        if (STEPS[G.step] === 'rosters') { apply(); G.step++; draw(); return; }
        G.step = Math.min(STEPS.length - 1, G.step + 1); draw();
      }
      else if (g === 'back') { G.step = Math.max(0, G.step - 1); draw(); }
      else if (g === 'skip') { S.set('welcomed', true); close(); }
      else if (g === 'restore') { S.set('welcomed', true); close(); location.href = 'settings.html#backup'; }
      else if (g === 'close') { close(); location.href = 'index.html'; }
      else if (g === 'tour') { close(); if (!/index\.html$|\/$/.test(location.pathname)) { sessionStorage.setItem('suite:tour', '1'); location.href = 'index.html'; } else tour(); }
    });
  }

  /* ---------- the menu tour ---------- */
  function tour(){
    injectCss();
    const steps = [
      ['.nav-inner a[href="index.html"]:not(.wordmark)', 'Dashboard', 'The clock, today\'s bells, the class in session, today\'s plan, and countdowns. It follows your bell schedule automatically.'],
      ['.nav-inner a[href="today.html"]', 'Today', 'Your start-of-class screen: the date, Have Out list, and a few boards you step through (welcome, warm-up, agenda, and more), with a warm-up timer and your lesson slides at the end. Use Edit day to fill it in, and Move text to arrange it.'],
      ['.nav-inner a[href="tracker.html"]', 'Points', 'Give points to each ' + S.word('team') + ' with one tap (or the number keys). Weekly winners, streaks, and ' + S.word('lead', { plural: true }) + ' are tracked for you.'],
      ['.nav-inner a[href="seating.html"]', 'Seating', 'Your room as a seating chart. Drag names onto seats, then print it on one page or show it on the projector.'],
      ['.nav-inner a[href="planner.html"]', 'Planner', 'Plan each day for a week at a glance. Group sections into courses to plan once for all of them, attach slides and files, add school events, and shift plans when a snow day hits.'],
      ['[data-dd="tools"]', 'Tools', 'Name spinner, topic picker, review game, stations, tally, partners and groups, and the noise meter.'],
      ['.nav-inner a[href="present.html"]', 'Present', 'Show your published Google Slides here, with the timer, spinner, and points one click away on top of them.'],
      ['#st-pill', 'Timer', 'A big countdown for the whole class. It keeps running while you move between pages and chimes when time is up.'],
      ['[data-dd="pop"]', 'Pop out', 'A small window with the timer, points, or a name picker that floats on top of Google Slides (in Chrome or Edge).'],
      ['[data-dd="gear"]', 'Setup', 'Classes and rosters, the substitute page, bell schedule, countdowns, appearance, backups, and this tour.']
    ].filter(([sel]) => document.querySelector(sel));
    if (!steps.length) return;
    let i = 0;
    const ring = document.createElement('div'); ring.className = 'tour-ring';
    const tip = document.createElement('div'); tip.className = 'tour-tip'; tip.setAttribute('role', 'dialog'); tip.setAttribute('aria-live', 'polite');
    document.body.append(ring, tip);
    const end = () => { ring.remove(); tip.remove(); window.removeEventListener('resize', show); document.removeEventListener('keydown', key, true); };
    function show(){
      const [sel, title, text] = steps[i], el = document.querySelector(sel), r = el.getBoundingClientRect();
      ring.style.cssText = `top:${r.top - 6}px;left:${r.left - 6}px;width:${r.width + 12}px;height:${r.height + 12}px`;
      tip.innerHTML = `<div class="tt-count">${i + 1} of ${steps.length}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>
        <div class="tt-nav"><button class="btn quiet" data-t="end">${i === steps.length - 1 ? 'Close' : 'Skip tour'}</button><span class="bar">${i ? '<button class="btn" data-t="back">Back</button>' : ''}<button class="btn primary" data-t="next">${i === steps.length - 1 ? 'Done' : 'Next'}</button></span></div>`;
      const w = Math.min(340, window.innerWidth - 24);
      tip.style.width = w + 'px';
      tip.style.left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12)) + 'px';
      tip.style.top = (r.bottom + 16) + 'px';
      tip.querySelector('[data-t="next"]').focus();
    }
    const key = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); end(); } };
    tip.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; if (t === 'end') end(); else if (t === 'back') { i--; show(); } else if (++i >= steps.length) end(); else show(); });
    window.addEventListener('resize', show); document.addEventListener('keydown', key, true);
    window.scrollTo(0, 0); show();
  }

  function injectCss(){
    if (document.getElementById('guide-css')) return;
    const st = document.createElement('style'); st.id = 'guide-css';
    st.textContent = `
.guide-back{position:fixed;inset:0;z-index:120;background:rgba(12,20,30,.6);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
.guide{background:var(--sheet);color:var(--ink);border:2px solid var(--edge);border-radius:24px;padding:26px 28px;width:100%;max-width:640px;max-height:calc(100vh - 32px);overflow:auto}
.guide h1{font-size:34px;margin-bottom:8px}.guide h2{font-size:28px;margin:6px 0 12px}
.g-lead{font-size:19px}.g-note{font-size:14px;color:var(--ink-2)}
.g-l{display:flex;flex-direction:column;gap:5px;font-weight:600;font-size:15px;margin:10px 0}
.g-l .field,.g-l textarea,.g-l select{width:100%;font-weight:400}.g-l .field.num{width:90px}
.g-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 16px}
.g-choice{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 10px}
.g-choice label{display:flex;flex-direction:column;gap:3px;border:2px solid var(--rule);border-radius:16px;padding:12px 14px;cursor:pointer}
.g-choice label.on{border-color:var(--land);background:var(--wash)}
.g-choice input{position:absolute;opacity:0;pointer-events:none}
.g-choice span{font-size:14px;color:var(--ink-2)}
.g-choice label:focus-within{outline:3px solid var(--land);outline-offset:2px}
.g-tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 14px}
.g-tools label,.g-check{display:flex;gap:7px;align-items:center;font-size:15px}.g-check{margin:8px 0}
.g-rosters details{border:1.5px solid var(--rule);border-radius:12px;padding:8px 12px;margin-bottom:8px}
.g-rosters summary{cursor:pointer;font-weight:700;display:flex;justify-content:space-between}
.g-rosters textarea{width:100%;margin-top:8px}
.g-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px;flex-wrap:wrap}
.g-dots{display:flex;gap:6px;margin-bottom:4px}.g-dots i{width:28px;height:6px;border-radius:3px;background:var(--rule)}.g-dots i.on{background:var(--land)}.g-dots i.done{background:var(--sea)}
@media (max-width:560px){.g-choice{grid-template-columns:1fr}}
.tour-ring{position:fixed;z-index:130;border-radius:14px;box-shadow:0 0 0 4px var(--land),0 0 0 9999px rgba(12,20,30,.55);pointer-events:none;transition:all .2s}
.tour-tip{position:fixed;z-index:131;background:var(--sheet);color:var(--ink);border:2px solid var(--edge);border-radius:18px;padding:14px 16px}
.tour-tip h3{font-size:22px;margin:2px 0 6px}.tour-tip p{font-size:15px;margin:0 0 12px}
.tt-count{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.tt-nav{display:flex;justify-content:space-between;align-items:center;gap:8px}`;
    document.head.appendChild(st);
  }

  window.SuiteGuide = { welcome(){ G.step = 0; open(); }, tour };
  // arriving on the dashboard right after setup
  if (sessionStorage.getItem('suite:tour')) { sessionStorage.removeItem('suite:tour'); setTimeout(tour, 300); }
})();
