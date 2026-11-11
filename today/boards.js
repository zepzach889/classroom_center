/* Today page, part 1 of 7: The boards themselves: the saved data, which class and day are showing, what each board says, drawing them, the lesson deck, the warm-up timer, and the control rail.
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  const $ = q => document.querySelector(q);
  const esc = Suite.esc;
  const clone = x => JSON.parse(JSON.stringify(x));

  /* ---------- backgrounds and where the text goes (measured on 1920x1080) ---------- */
  // Built-in backgrounds are plain and neutral. Every piece of text can be moved, per background.
  const LOOKS = {
    paper: { name: 'Paper', bgStyle: 'paper' },
    chalk: { name: 'Chalkboard', bgStyle: 'chalk', dark: true },
    cork:  { name: 'Corkboard', bgStyle: 'cork' },
    solid: { name: 'Solid color', bgStyle: 'solid' }
  };
  const NEUTRAL = { date: [460, 40, 1000, 100], board: [440, 170, 1040, 600], cork: [1540, 170, 330, 600], timer: [760, 800, 400, 190], bm: [60, 250, 360, 800], pic: [980, 320, 470, 420], bell: [1400, 30, 480, 130], events: [460, 140, 1000, 54], eq: [440, 985, 1040, 70] };
  const NEUTRAL_PANELS = {};
  const PANELS = ['none', 'card', 'dark'], PANEL_NAMES = { none: 'No box', card: 'White card', dark: 'Dark card' };
  const BITMOJI = {};
  const BOARDS = {
    welcome:  { label: 'Welcome', heading: 'WELCOME!' },
    warmup:   { label: 'Warm-up', heading: 'WARM-UP' },
    returned: { label: 'Returned work', heading: 'Returned Work' },
    due:      { label: 'Things that are due', heading: 'THINGS THAT ARE DUE' },
    agenda:   { label: "Today's agenda", heading: "TODAY'S AGENDA" }
  };
  const isCustom = t => t === 'custom' || /^c-|^L-/.test(t);
  const boardOf = (rec, t) => (rec.boards || {})[t] || (String(t).startsWith('L-') && ((T.library || []).find(x => 'L-' + x.id === t) || {}).board) || { heading: BOARDS[t] ? BOARDS[t].heading : 'MY BOARD', lines: [] };
  const plainOf = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
  const boardLabel = (rec, t) => BOARDS[t] ? BOARDS[t].label : (boardOf(rec, t).name || plainOf(boardOf(rec, t).heading) || 'Custom board');
  const STARTER_LINES = [
    { color: 'blue', level: 0, text: 'Find your seat and get settled.' },
    { color: 'blue', level: 0, text: 'Get out the materials listed under Have Out.' },
    { color: 'green', level: 0, text: 'Start the warm-up when you are ready.' }];
  const COMMON = ['Pen or pencil', 'Notebook', 'Binder', 'Textbook', 'Laptop', 'Planner', 'Colored pencils', 'Calculator'];
  const INK = { blue: 'var(--ink-blue)', red: 'var(--ink-red)', green: 'var(--ink-green)' }, INK_ORDER = ['blue', 'red', 'green'];

  const BLANK = { mode: 'auto', rows: {}, days: {}, flags: {}, flagBg: null, custom: {}, bitmojis: {}, bmAdj: {}, layouts: {}, bell: null, library: [] };
  let T = Object.assign(clone(BLANK), Suite.get('today', {}));
  T.layouts = T.layouts || {};
  // linked boards live in My boards (T.library); any edited copy in a day or usual setup is moved back there when saving
  function moveLinked(){
    const lib = T.library || []; lib.forEach(x => { if (!x.id) x.id = Suite.uid(); });
    const take = recx => { if (!recx || !recx.boards) return; Object.keys(recx.boards).forEach(k => { if (!k.startsWith('L-')) return; const it = lib.find(x => 'L-' + x.id === k); if (it) { it.board = recx.boards[k]; const nm = it.board.name || String(it.board.heading || '').replace(/<[^>]+>/g, '').trim(); if (nm) it.name = nm; } delete recx.boards[k]; }); };
    Object.values(T.days || {}).forEach(day => Object.values(day).forEach(take)); Object.values(T.rows || {}).forEach(take);
  }
  let undoStack = [], lastSaved = null, undoing = false;
  function undo(){
    if (!undoStack.length) { Suite.toast('Nothing to undo'); return; }
    const prev = undoStack.pop(); T = JSON.parse(prev); lastSaved = prev; undoing = true; save(); undoing = false; render(); if (editing) renderDrawer(); Suite.toast('Undone');
  }
  const save = () => { if (STUDIO && STUDIO.peek) return;
    if (editMode && !undoing) { const now = JSON.stringify(T); if (lastSaved && now !== lastSaved) { undoStack.push(lastSaved); if (undoStack.length > 25) undoStack.shift(); } lastSaved = now; } if (STUDIO) studioSync(); moveLinked(); const sb = T.days[SBOX]; delete T.days[SBOX]; Suite.set('today', T); if (sb) T.days[SBOX] = sb; };
  let viewDate = Suite.dateKey(new Date()), boardNo = 0, reveal = 0, lesson = false, full = false, editing = false;
  let editMode = false;   // editing right on the screen
  const urls = {};
  async function fileUrl(id){ if (!id) return null; if (urls[id]) return urls[id]; const r = await Suite.files.get(id); return r && r.blob ? (urls[id] = URL.createObjectURL(r.blob)) : null; }

  /* ---------- classes, courses, and each row's usual setup ---------- */
  const classes = () => Suite.classes();
  const rowKeyOf = cid => { const co = Suite.courseOf(cid); return co ? Suite.courseKey(co.id) : cid; };
  const rowName = cid => { const co = Suite.courseOf(cid); return co ? co.name : (classes().find(c => c.id === cid) || {}).name || ''; };
  function usual(cid){
    const key = rowKeyOf(cid);
    if (!T.rows[key]) {
      T.rows[key] = {
        look: 'paper', bgColor: '#dfe8ee', bitmoji: 'none', schedule: [], deckUrl: '', timer: { on: false, min: 3, auto: false, style: 'digital', color: '#2f6fd0' },
        lineup: ['welcome', 'agenda'],
        haveOut: ['Pen or pencil', 'Notebook'],
        boards: {
          welcome: { heading: BOARDS.welcome.heading, lines: clone(STARTER_LINES) },
          warmup: { heading: BOARDS.warmup.heading, lines: [] },
          returned: { heading: BOARDS.returned.heading, lines: [] },
          due: { heading: BOARDS.due.heading, source: 'plan', lines: [] },
          agenda: { heading: BOARDS.agenda.heading, source: 'plan', lines: [] }
        }
      };
      save();
    }
    return T.rows[key];
  }
  // the day's setup for a class: its own (one period), else its course's, else the usual
  function dayFor(date, cid){
    const d = T.days[date] || {}, own = d[cid], co = d[rowKeyOf(cid)];
    const u = usual(cid), rec = own || co;
    const base = !rec ? { lineup: u.lineup, haveOut: u.haveOut, haveOutFmt: u.haveOutFmt, boards: u.boards, slideLink: '' }
      : Object.assign({}, { lineup: u.lineup, haveOut: u.haveOut, haveOutFmt: u.haveOutFmt, slideLink: '' }, rec, { boards: Object.assign({}, u.boards, rec.boards || {}) });
    return date === SBOX ? base : withLinked(withRepeats(base, date, cid));
  }
  function withLinked(rec){
    if (!(rec.lineup || []).some(t => t.startsWith('L-'))) return rec;
    const out = Object.assign({}, rec, { boards: Object.assign({}, rec.boards) });
    out.lineup = rec.lineup.filter(t => { if (!t.startsWith('L-')) return true; const it = (T.library || []).find(x => 'L-' + x.id === t); if (it) { out.boards[t] = it.board; return true; } return false; });
    return out;
  }
  // saved boards set to repeat (My boards → Repeat) join the lineup on matching days
  function withRepeats(rec, date, cid){
    const wd = new Date(date + 'T12:00').getDay(), keys = [cid, rowKeyOf(cid)];
    const reps = (T.library || []).filter(x => x.repeat && x.repeat.on && (x.repeat.days || []).includes(wd) && (!x.repeat.from || x.repeat.from <= date) && (!x.repeat.to || date <= x.repeat.to)
      && (!(x.repeat.keys || []).length || x.repeat.keys.some(k => keys.includes(k))));
    if (!reps.length) return rec;
    const out = Object.assign({}, rec, { lineup: (rec.lineup || []).slice(), boards: Object.assign({}, rec.boards) });
    reps.forEach(x => { const id = 'c-rep-' + String(x.from || x.name || 'board').replace(/[^\w-]+/g, '-').slice(0, 40); if (out.lineup.includes(id)) return; if (!out.boards[id]) out.boards[id] = JSON.parse(JSON.stringify(x.board));
      const at = x.repeat.first ? Math.max(0, out.lineup.indexOf('welcome') + 1) : out.lineup.length; out.lineup.splice(at, 0, id); });
    return out;
  }
  let scope = 'course';   // edit for the course, or just this period
  function editable(date, cid){
    const key = scope === 'period' ? cid : rowKeyOf(cid);
    T.days[date] = T.days[date] || {};
    if (!T.days[date][key]) { const cur = dayFor(date, cid); T.days[date][key] = clone({ lineup: cur.lineup, haveOut: cur.haveOut, haveOutFmt: cur.haveOutFmt || {}, boards: cur.boards, slideLink: cur.slideLink || '' }); }
    return T.days[date][key];
  }

  /* ---------- which class is on screen ---------- */
  function autoPick(){
    const now = new Date(), day = Suite.scheduleFor(now), P = day.periods, st = Suite.periodStatus(P, now), list = classes();
    const real = i => { for (let k = i; k >= 0 && k < P.length; k++) if (!Suite.isPassing(P[k]) && !P[k].isBreak) return P[k]; return null; };
    // a break or lunch gets the between-classes screen (passing time still shows the class about to start)
    if (st.cur >= 0 && P[st.cur].isBreak && !Suite.isPassing(P[st.cur])) return { cid: (list[0] || {}).id, text: P[st.cur].name, period: null, idle: true };
    const cur = st.cur >= 0 && !Suite.isPassing(P[st.cur]) && !P[st.cur].isBreak ? P[st.cur] : null;
    const p = cur || (st.next >= 0 ? real(st.next) : null) || (st.cur >= 0 ? real(st.cur + 1) : null);
    const c = p ? Suite.classForPeriod(p, list) : null;
    const same = c && c.name.trim().toLowerCase() === (p ? p.name : '').trim().toLowerCase();
    const ncr = c ? Suite.noClassFor(Suite.dateKey(now), c.id) : null;
    if (ncr) return { cid: c.id, text: `no class (${ncr}), so the between-classes screen is up`, period: null, idle: true };
    if (c) return { cid: c.id, text: cur ? `${same ? '' : p.name + ' '}until ${Suite.fmt12(p.end)}` : `up next${same ? '' : ': ' + p.name} at ${Suite.fmt12(p.start)}`, period: p };
    return { cid: (list[0] || {}).id, text: 'no class right now, so the between-classes screen is up. Pick a class above to plan for it', period: null, idle: true };
  }
  function idleInfo(){
    const now = new Date(), day = Suite.scheduleFor(now), P = day.periods, st = Suite.periodStatus(P, now), list = classes();
    const curP = st.cur >= 0 ? P[st.cur] : null;
    const ncC = curP && !Suite.isPassing(curP) ? Suite.classForPeriod(curP, list) : null, ncR = ncC ? Suite.noClassFor(Suite.dateKey(now), ncC.id) : null;
    const label = !P.length ? (day.label || 'No school today') : ncR ? 'No class: ' + ncR : curP ? (Suite.isPassing(curP) ? 'Passing period' : curP.name) : st.next >= 0 ? 'Before school' : 'After school';
    const endHM = curP ? curP.end : st.next >= 0 ? P[st.next].start : null;
    let nx = null; const from = curP ? st.cur + 1 : st.next; for (let i = from; from >= 0 && i < P.length; i++) if (!Suite.isPassing(P[i]) && Suite.classForPeriod(P[i], list) && !Suite.noClassFor(Suite.dateKey(now), Suite.classForPeriod(P[i], list).id)) { nx = P[i]; break; }
    let left = null; if (endHM) { const [h, m] = endHM.split(':').map(Number), e = new Date(now); e.setHours(h, m, 0, 0); left = e - now; }
    const kind = !P.length ? 'none' : !curP ? (st.next >= 0 ? 'before' : 'after') : Suite.isPassing(curP) ? 'passing' : curP.staff ? 'staff' : curP.isBreak ? (/lunch/i.test(curP.name) ? 'lunch' : 'break') : /lunch/i.test(curP.name) ? 'lunch' : 'other';
    // go-home reminder: after the time you set, count up how long you've stayed (off unless turned on)
    const G = idleCfg().goHome; let over = null;
    if (G.on && P.length && G.time && !(curP && !curP.staff && !['after'].includes(kind) && kind !== 'staff')) { const [gh, gm] = G.time.split(':').map(Number), g = new Date(now); g.setHours(gh, gm, 0, 0); if (now >= g) over = now - g; }
    return { label, endHM, left, nx, kind, over };
  }
  const IDLE0 = { style: 'dashboard', color: '', messages: {}, goHome: { on: false, time: '15:45', text: 'Time to head home!' } };
  function idleCfg(){ const c = Object.assign({}, IDLE0, T.idle || {}); c.messages = Object.assign({}, c.messages || {}); c.goHome = Object.assign({}, IDLE0.goHome, c.goHome || {}); return c; }
  const isIdle = () => !STUDIO && MODE === 'auto' && !editMode && viewDate === Suite.dateKey(new Date()) && autoPick().idle;
  function idleHtml(){
    const I = idleInfo(), C = idleCfg(), msg = (C.messages[I.kind] || '').trim();
    const style = `st-${C.style || 'dashboard'}`, accent = C.color ? `--ia:${esc(C.color)};` : '';
    if (I.over != null) return `<div class="idle ${style}" style="${accent}"><div class="i-date">${esc(longDate(viewDate))}</div><div class="i-now">${esc(C.goHome.text || 'Time to head home!')}</div>
      <div class="i-left"><span>You've stayed</span> <b id="idleOver">${fmtLeft(I.over)}</b> <span>past ${Suite.fmt12(C.goHome.time)}</span></div></div>`;
    return `<div class="idle ${style}" style="${accent}"><div class="i-date">${esc(longDate(viewDate))}</div><div class="i-now">${esc(I.label)}</div>
      ${msg ? `<div class="i-msg">${esc(msg)}</div>` : ''}
      ${I.left != null && I.left > 0 ? `<div class="i-left"><span>ends in</span> <b id="idleLeft">${fmtLeft(I.left)}</b> <span>at ${Suite.fmt12(I.endHM)}</span></div>` : ''}
      ${I.nx ? `<div class="i-next">Next: ${esc(I.nx.name)} at ${Suite.fmt12(I.nx.start)}</div>` : ''}</div>`;
  }
  const fmtLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s % 60).padStart(2, '0'); };
  // keep the between-classes screen current: redraw when what's happening changes (Advisory → teacher time), otherwise just tick the countdown
  function updateIdle(){
    const now = document.querySelector('#stage .idle .i-now'); if (!now) return;
    const I = idleInfo();
    const showingOver = !!document.getElementById('idleOver');
    if (showingOver !== (I.over != null) || (!showingOver && (now.textContent !== I.label || !!document.getElementById('idleLeft') !== (I.left != null && I.left > 0)))) { render(); return; }
    if (showingOver) { document.getElementById('idleOver').textContent = fmtLeft(I.over); return; }
    const el = document.getElementById('idleLeft'); if (el && I.left != null) el.textContent = fmtLeft(I.left);
  }
  // Which class this window shows belongs to this window only, so a planning window can't change a live display.
  let MODE = (() => { try { return sessionStorage.getItem('suite:today-mode') || 'auto'; } catch (e) { return 'auto'; } })();
  const setMode = m => { MODE = m; try { sessionStorage.setItem('suite:today-mode', m); } catch (e) {} };
  const activeId = () => STUDIO ? STUDIO.cid : MODE === 'auto' ? autoPick().cid : (classes().some(c => c.id === MODE) ? MODE : autoPick().cid);

  /* ---------- which boards show, and their content ---------- */
  function boardLines(date, cid, type, rec){
    const b = (rec.boards || {})[type] || {};
    if ((type === 'due' || type === 'agenda') && b.source !== 'custom') {
      const plan = Suite.agendaFor(date, cid) || {};
      if (type === 'agenda') return (plan.items || []).map(t => ({ text: t, color: 'blue', level: 0 }));
      return plan.homework ? plan.homework.split('\n').filter(x => x.trim()).map(t => ({ text: t, color: 'blue', level: 0 })) : [];
    }
    return (b.lines || []).filter(l => (l.text || '').trim() || (l.html && l.html.replace(/<[^>]+>/g, '').trim()));
  }
  function screens(date, cid){
    const rec = dayFor(date, cid);
    return rec.lineup.filter(t => {
      if (!BOARDS[t] && !isCustom(t)) return false;            // retired boards (like the old Flag of the Week) are skipped
      if (editMode || t === 'welcome') return true;            // while editing, every board shows so you can type into it
      if (isCustom(t)) return true;
      return boardLines(date, cid, t, rec).length;
    });
  }
  const hiddenCount = (date, cid, type) => editMode ? 0 : boardLines(date, cid, type, dayFor(date, cid)).filter(l => l.reveal).length;

  /* ---------- drawing ---------- */
  const place = box => box ? `left:${box[0] / 19.2}%;top:${box[1] / 10.8}%;width:${box[2] / 19.2}%;height:${box[3] / 10.8}%` : 'display:none';
  const inkOf = c => INK[c] || (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : INK.blue);
  const lineHtml = (l, hidden) => `<li class="lv${Math.min(2, l.level || 0)}${hidden ? ' hide' : ''}${editMode && l.reveal ? ' rv' : ''}" data-c="${esc(l.color || 'blue')}" data-reveal="${l.reveal ? 1 : 0}" style="color:${inkOf(l.color)}">${lineInner(l)}</li>`;
  const DATE_FORMATS = { long: 'Thursday, October 1st, 2026', medium: 'Thursday, Oct. 1', short: '10/1/2026', weekday: 'Thursday' };
  function fmtDate(k, f){
    const [y, m, d] = k.split('-').map(Number), x = new Date(y, m - 1, d), wd = x.toLocaleDateString('en-US', { weekday: 'long' });
    if (f === 'medium') return `${wd}, ${x.toLocaleDateString('en-US', { month: 'short' })}${m === 5 ? '' : '.'} ${d}`;
    if (f === 'short') return `${m}/${d}/${y}`;
    if (f === 'weekday') return wd;
    return longDate(k);
  }
  // a box's text style: font, size, and color, saved per background
  const JUST = { left: 'start', center: 'center', right: 'end' };
  const boxStyle = (L, k) => { const st = (L.styles || {})[k] || {}; return `${st.font ? `--bf:${st.font};` : ''}${st.size ? `--sz:${st.size};` : ''}${st.color ? `--bc:${st.color};` : ''}${st.align ? `--ta:${st.align};--tj:${JUST[st.align]};` : ''}${st.halign ? `--hta:${st.halign};` : ''}`; };
  const ordinal = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const longDate = k => { const [y, m, d] = k.split('-').map(Number), x = new Date(y, m - 1, d); return `${x.toLocaleDateString('en-US', { weekday: 'long' })}, ${x.toLocaleDateString('en-US', { month: 'long' })} ${ordinal(d)}, ${y}`; };
  function roomFor(date, cid){
    const u = usual(cid), d = T.days[date] || {}, own = d[cid] || d[rowKeyOf(cid)] || {};
    const pu = Suite.unitFor(cid, date);   // a unit from the Planner sets the look while it runs
    const unit = (u.schedule || []).filter(x => x.from && x.from <= date).sort((a, b) => a.from < b.from ? -1 : 1).pop();
    const sl = seasonLook(date, cid);
    const look = own.look || sl.look || (pu && pu.look) || (unit && unit.look) || u.look;
    const lk = fixLook(look);
    return { look: LOOKS[lk] || T.custom[lk] ? lk : 'paper', bitmoji: own.bitmoji || sl.bitmoji || (pu && pu.bitmoji) || (unit && unit.bitmoji) || u.bitmoji || 'none', unit, pu };
  }
  const fixLook = id => id === 'basic' ? 'paper' : id;
  // a custom board's own layout: its background's layout, plus anything moved on that board
  const boardKey = id => String(id).startsWith('board:') ? id.slice(6) : null;
  function boardLookOf(t){ const r = dayFor(viewDate, activeId()), b = boardOf(r, t); return b.look || roomFor(viewDate, activeId()).look; }
  function getLayout(id){
    const bk = boardKey(id);
    if (bk) { const base = getLayout(boardLookOf(bk)), own = boardOf(dayFor(viewDate, activeId()), bk).layout;
      if (!own) return Object.assign(clone(base), { extras: [] });
      return { boxes: Object.assign({}, base.boxes, own.boxes || {}), panels: Object.assign({}, base.panels, own.panels || {}), extras: own.extras || [], styles: Object.assign({}, base.styles, own.styles || {}) }; }
    id = fixLook(id);
    const c = T.custom[id], own = T.layouts[id];
    const base = c ? { boxes: Object.assign({}, NEUTRAL, c.layout || {}), panels: {}, extras: [], styles: {} } : { boxes: clone(NEUTRAL), panels: clone(NEUTRAL_PANELS), extras: [], styles: {} };
    if (!own) return base;
    return { boxes: Object.assign({}, base.boxes, own.boxes || {}), panels: Object.assign({}, base.panels, own.panels || {}), extras: own.extras || [], styles: own.styles || {} };
  }
  function lookById(id){
    id = fixLook(id);
    const c = T.custom[id], L = c ? { name: c.name, custom: c } : Object.assign({}, LOOKS[id] || LOOKS.paper);
    const lay = getLayout(id);
    return Object.assign(L, lay.boxes, { panels: lay.panels, extras: lay.extras, styles: lay.styles, id });
  }
  const lumOfHex = h => { h = (h || '').replace('#', ''); if (h.length !== 6) return 1; return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).reduce((a, v, i) => a + v * [.299, .587, .114][i], 0); };
  function lookOf(cid, date){ return lookById(roomFor(date || viewDate, cid).look); }
  const bmName = id => BITMOJI[id] || (T.bitmojis[id] || {}).name || 'Bitmoji';
  async function bmSrc(id){ if (!id || id === 'none') return null; const b = T.bitmojis[id]; return b ? fileUrl(b.fileId) : null; }
  const bmAdj = id => Object.assign({ scale: 100, dx: 0 }, T.bmAdj[id] || {});
  /* ---------- formatted text: keep only bold, italic, underline, color, font, and size ---------- */
  const FONTS = { chelsea: '"Chelsea Market"', architect: '"Architects Daughter"', georgia: 'Georgia' };
  const KEY_SIZES = { 'x-small': .7, small: .85, medium: 1, large: 1.15, 'x-large': 1.35, 'xx-large': 1.6, 'xxx-large': 1.9 }, NUM_SIZES = { 1: .7, 2: .85, 3: 1, 4: 1.15, 5: 1.35, 6: 1.6, 7: 1.9 };
  const safeColor = c => /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]+)$/i.test((c || '').trim()) ? c.trim() : '';
  const safeFont = f => { f = (f || '').toLowerCase(); return f.includes('chelsea') ? FONTS.chelsea : f.includes('architect') ? FONTS.architect : f.includes('georgia') ? FONTS.georgia : ''; };
  function clean(html){
    const t = document.createElement('template'); t.innerHTML = html || '';
    const out = document.createElement('div');
    const walk = (src, dst) => src.childNodes.forEach(n => {
      if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.textContent)); return; }
      if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
      if (n.tagName === 'BR') { dst.appendChild(document.createElement('br')); return; }
      const tag = n.tagName; let el = null;
      // a new line made with Enter arrives as a <div> or <p>: start it on its own line
      if ((tag === 'DIV' || tag === 'P') && dst.childNodes.length && !(dst.lastChild && dst.lastChild.nodeName === 'BR')) dst.appendChild(document.createElement('br'));
      if (tag === 'B' || tag === 'STRONG') el = document.createElement('b');
      else if (tag === 'I' || tag === 'EM') el = document.createElement('i');
      else if (tag === 'U') el = document.createElement('u');
      else if (tag === 'SPAN' || tag === 'FONT' || tag === 'DIV') {
        const st = [], col = safeColor(n.getAttribute('color') || n.style.color), face = safeFont(n.getAttribute('face') || n.style.fontFamily);
        const sz = n.getAttribute('size'), fs = n.style.fontSize;
        if (col) st.push('color:' + col);
        if (face) st.push('font-family:' + face);
        if (sz && NUM_SIZES[sz]) st.push('font-size:' + NUM_SIZES[sz] + 'em'); else if (KEY_SIZES[fs]) st.push('font-size:' + KEY_SIZES[fs] + 'em'); else if (/^[\d.]+em$/.test(fs || '')) st.push('font-size:' + fs);
        if (n.style.fontWeight === 'bold' || +n.style.fontWeight >= 600) st.push('font-weight:700');
        if (n.style.fontStyle === 'italic') st.push('font-style:italic');
        if (/underline/.test(n.style.textDecoration || n.style.textDecorationLine || '')) st.push('text-decoration:underline');
        if (st.length) { el = document.createElement('span'); el.setAttribute('style', st.join(';')); }
      }
      if (el) { walk(n, el); dst.appendChild(el); } else walk(n, dst);
    });
    walk(t.content, out);
    while (out.lastChild && out.lastChild.nodeName === 'BR') out.removeChild(out.lastChild);   // no stray empty line at the end
    return out.innerHTML;
  }
  const lineInner = l => l.html ? clean(l.html) : esc(l.text || '').replace(/\*([^*]+)\*/g, '<span class="emph">$1</span>');

  async function render(){
    document.body.classList.toggle('full', full);
    document.body.classList.toggle('editing-screen', editMode);
    const cid = activeId();
    if (!cid) { $('#stage').innerHTML = '<div class="lesson"><div class="lesson-empty"><p class="t">Add your classes first</p><p>Today uses your classes and bell schedule.</p></div></div>'; renderRail(null); return; }
    if (isIdle() && !lesson) { const st = $('#stage'); st.innerHTML = idleHtml(); st.className = 'stage idle-stage'; st.style.backgroundImage = ''; st.style.backgroundColor = ''; st.dataset.look = ''; st.dataset.type = ''; renderRail(cid, []); return; }
    const S = screens(viewDate, cid), rec = dayFor(viewDate, cid), u = usual(cid), room = roomFor(viewDate, cid);
    if (boardNo >= S.length) boardNo = Math.max(0, S.length - 1);
    const type = S[boardNo] || 'welcome', b = boardOf(rec, type);
    const lookId = isCustom(type) && b.look ? b.look : room.look, L = lookById(lookId);
    const layId = isCustom(type) ? 'board:' + type : lookId;
    if (isCustom(type)) { const bl = getLayout(layId); Object.assign(L, bl.boxes, { panels: bl.panels, extras: bl.extras, styles: bl.styles }); }
    const hide = isCustom(type) ? (b.hide || {}) : {};
    const bmUrl = isCustom(type) && b.look ? null : await bmSrc(room.bitmoji), adj = bmAdj(room.bitmoji);
    const E = editMode && !lesson;
    const dark = L.bgStyle === 'chalk' || (L.bgStyle === 'solid' && lumOfHex(u.bgColor) < .45);
    const pn = k => { const p = (L.panels || {})[k] || 'none'; return `pn-${p}${p === 'dark' || (p === 'none' && dark) ? ' ink-light' : ''}`; };
    const handles = k => E ? `<span class="grip" data-g="move" data-k="${k}" title="Drag to move" aria-hidden="true">⠿</span><span class="rz" data-g="size" data-k="${k}" title="Drag to resize" aria-hidden="true"></span>` : '';
    const ce = (f, extra) => E ? ` contenteditable="true" spellcheck="true" data-f="${f}"${extra || ''}` : '';
    let html = '';
    setTimeout(markAlign, 0); setTimeout(rescue, 30); setTimeout(fxCheck, 40);
    if (lesson) { html = lessonHtml(cid, rec); setTimeout(() => drawLessonTools(cid), 0); }
    else {
      const planBoard = (type === 'due' || type === 'agenda') && b.source !== 'custom';
      let lines = boardLines(viewDate, cid, type, rec);
      if (E && !planBoard && !lines.length) lines = [{ text: '', html: '', color: 'blue', level: 0 }];
      let shown = 0;
      const items = lines.map(l => { const hid = !E && l.reveal ? (shown++ >= reveal) : false; return lineHtml(l, hid); }).join('');
      const autoDate = fmtDate(STUDIO ? (STUDIO.kind === 'day' ? STUDIO.d : Suite.dateKey(new Date())) : viewDate, ((L.styles || {}).date || {}).format);
      const picUrl = isCustom(type) && b.pic ? await fileUrl(b.pic) : null;
      const pics = await Promise.all((b.pics || []).map(async p2 => ({ p: p2, url: await fileUrl(p2.file) })));
      html = `${bmUrl && L.bm && !hide.bm ? `<div class="region bm${E ? ' ed' : ''}" data-k="bm" style="${place([L.bm[0] + adj.dx, L.bm[1] + L.bm[3] * (1 - adj.scale / 100), L.bm[2], L.bm[3] * adj.scale / 100])}"${E ? ' data-g="move"' : ''}><img src="${bmUrl}" alt="">${handles('bm')}</div>` : ''}
        ${pics.filter(x => x.url).map(({ p: p2, url }) => `<div class="region pic pics ${pn('p:' + p2.id)}${E ? ' ed' : ''}" data-k="p:${esc(p2.id)}" style="${place(p2.box)}"${E ? ' data-g="move"' : ''}><img src="${url}" alt="">${handles('p:' + p2.id)}${E ? `<button class="xdel" data-g="pdel" data-p="${esc(p2.id)}" aria-label="Remove this picture">×</button>` : ''}</div>`).join('')}
        ${picUrl && !hide.pic ? `<div class="region pic${E ? ' ed' : ''}" data-k="pic" style="${place(L.pic)}"${E ? ' data-g="move"' : ''}><img src="${picUrl}" alt="">${handles('pic')}</div>` : ''}
        ${hide.date ? '' : `<div class="region date ${pn('date')}${E ? ' ed' : ''}" data-k="date" style="${place(L.date)};${boxStyle(L, 'date')}"><span id="dateText"${ce('date')}>${rec.dateText ? clean(rec.dateText) : esc(autoDate)}</span>${handles('date')}</div>`}
        ${hide.board ? '' : `<div class="region board ${pn('board')}${E ? ' ed' : ''}" data-k="board" style="${place(L.board)};${boxStyle(L, 'board')}"><div class="board-fit" id="boardFit"><h1 class="heading"${ce('heading', ` data-t="${type}"`)}>${clean(b.heading != null ? b.heading : (BOARDS[type] || {}).heading || '')}</h1><ul class="lines"${planBoard ? '' : ce('lines', ` data-t="${type}"`)}>${items}</ul>${E && planBoard ? `<p class="planned">This board comes from your Planner. To type your own version, choose "Write for students" in Day settings.</p>` : ''}</div>${handles('board')}</div>`}
        ${hide.cork ? '' : `<div class="region cork ${pn('cork')}${E ? ' ed' : ''}" data-k="cork" style="${place(L.cork)};${boxStyle(L, 'cork')}"><div class="cork-fit" id="corkFit"><p class="have-out">Have out:</p><ul class="have-list"${ce('haveout')}>${(rec.haveOut || []).map(t => `<li>${(rec.haveOutFmt || {})[t] || esc(t)}</li>`).join('') || (E ? '<li></li>' : '')}</ul></div>${handles('cork')}</div>`}
        ${type === 'welcome' && L.timer && u.timer.on ? `<button class="region timer tm-${u.timer.style || 'digital'}${dark ? ' on-dark' : ''}${E ? ' ed' : ''}" id="rTimer" data-k="timer" style="${place(L.timer)};--tc:${esc(u.timer.color || '#2f6fd0')}"${E ? ' data-g="move" tabindex="-1"' : ''} aria-label="Warm-up timer. Click to start or pause."><span class="tm-in" id="timerIn">${timerInner(u.timer.style)}</span>${handles('timer')}</button>` : ''}
        ${!E && full ? `<span class="fstools">${toolMenu('opentool', 'Open a tool', TOOL_PAGES)}</span>` : ''}
        ${(() => { const pu = room.pu, o = (pu && pu.opts) || {}; if (!o.showQuestion || !o.question || (isCustom(type) && (b.hide || {}).board)) return '';
          return `<div class="region eqbox${E ? ' ed' : ''}" data-k="eq" style="${place(L.eq || NEUTRAL.eq)}"${E ? ' data-g="move"' : ''}><span class="eqk">Essential question</span> ${esc(o.question)}${handles('eq')}</div>`; })()}
        ${u.showEvents ? (() => { const ev = Suite.eventsOn(viewDate).filter(x => !x.mine); return ev.length || E ? `<div class="region evs${E ? ' ed' : ''}" data-k="events" style="${place(L.events || NEUTRAL.events)}"${E ? ' data-g="move"' : ''}>${ev.length ? ev.map(x => `<span class="evtag">${esc(x.title)}${x.note ? `<small>${esc(x.note)}</small>` : ''}</span>`).join('') : '<span class="evtag ph">School events from your Planner show here</span>'}${handles('events')}</div>` : ''; })() : ''}
        ${(b.tools || []).map(w => `<div class="region tool tool-${w.kind}${E ? ' ed' : ''}" data-k="t:${esc(w.id)}" style="${place(w.box)}"><div class="w-in">${widgetHtml(w.kind, w)}</div>${handles('t:' + w.id)}${E && w.kind === 'seating' ? `<button class="xdel tset" data-g="tset" data-id="${esc(w.id)}" aria-label="Seating chart settings" title="Heading and front of the room">⚙</button>` : ''}${E ? `<button class="xdel" data-g="tdel" data-x="${esc(w.id)}" aria-label="Remove this tool">×</button>` : ''}</div>`).join('')}
        ${(L.extras || []).map(x => `<div class="region xbox pn-${x.panel || 'none'}${(x.panel === 'dark' || ((x.panel || 'none') === 'none' && dark)) ? ' ink-light' : ''}${E ? ' ed' : ''}" data-k="x:${esc(x.id)}" style="${place(x.box)};${x.style || ''}"><div class="x-fit"${ce('x', ` data-x="${esc(x.id)}"`)}>${clean(x.html || '')}</div>${handles('x:' + x.id)}${E ? `<button class="xdel" data-g="xdel" data-x="${esc(x.id)}" aria-label="Remove this text box">×</button>` : ''}</div>`).join('')}`;
    }
    const B = bellCfg();
    if (B.on) html += B.style === 'box'
      ? (E ? `<div class="region bellbox ed" data-k="bell" style="${place(L.bell || NEUTRAL.bell)}" data-g="move"><span class="b-ph">Bell reminder<br><small>shows in the last ${B.minutes} minutes</small></span>${handles('bell')}</div>` : `<div class="region bellslot" style="${place(L.bell || NEUTRAL.bell)}">${bellHtml(B)}</div>`)
      : (E ? '' : bellHtml(B));
    const st = $('#stage');
    if (!lesson) { html += '<div class="lesson-tools board-tools" id="btools"></div>'; setTimeout(() => drawPinned(cid, 'btools', 'boardTools'), 0); }
    st.innerHTML = html;
    updateBell();
    const roomImg = !lesson && L.custom ? await fileUrl(L.custom.fileId) : null;
    st.style.backgroundImage = roomImg ? `url("${roomImg}")` : '';
    st.className = 'stage' + (!lesson && !L.custom ? ' bg-' + (L.bgStyle || 'paper') : '') + (E ? ' editing' : '');
    st.style.backgroundColor = !lesson && L.bgStyle === 'solid' ? (u.bgColor || '#dfe8ee') : '';
    st.dataset.look = layId; st.dataset.type = type;
    renderRail(cid, S);
    requestAnimationFrame(fitAll); setTimeout(fitAll, 350);
    // the lesson: give the slides keyboard focus right away, so a clicker drives them without a mouse click
    const deck = st.querySelector('.lesson iframe');
    if (deck) { const grab = () => { try { deck.focus(); deck.contentWindow && deck.contentWindow.focus(); } catch (x) {} }; deck.addEventListener('load', () => { grab(); setTimeout(grab, 600); setTimeout(grab, 1500); }); grab(); }
  }
  function fitAll(){ document.querySelectorAll('.x-fit').forEach(el => { el.style.setProperty('--fit', 1); let f = 1; while ((el.scrollHeight > el.clientHeight + 1) && f > .35) { f -= .05; el.style.setProperty('--fit', f.toFixed(2)); } });
    const d = document.getElementById('dateText');
    if (d) { const box = d.parentElement, cs = getComputedStyle(box), room = w => box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - w;
      d.style.setProperty('--fit', 1); let f = 1; while ((d.offsetWidth > room(0) + 1 || d.offsetHeight > box.clientHeight + 1) && f > .45) { f -= .04; d.style.setProperty('--fit', f.toFixed(2)); } }
    ['#boardFit', '#corkFit'].forEach(sel => { const el = document.querySelector(sel); if (!el) return; el.style.setProperty('--fit', 1); let f = 1;
    while ((el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && f > .45) { f -= .04; el.style.setProperty('--fit', f.toFixed(2)); } }); }
  /* ---------- lesson deck ---------- */
  const publishedId = url => ((url || '').match(/\/presentation\/d\/e\/([\w-]+)/) || [])[1] || null;
  const docId = url => ((url || '').match(/\/presentation\/d\/(?!e\/)([\w-]+)/) || [])[1] || null;
  const slideParam = url => ((url || '').match(/slide=(id\.[\w-]+)/) || [])[1] || null;
  const planSlides = cid => ((Suite.agendaFor(viewDate, cid) || {}).materials || []).filter(m => m.kind === 'link' && /docs\.google\.com\/presentation/.test(m.url || ''));
  const slideLinkFor = (cid, rec) => (rec.slideLink && !publishedId(rec.slideLink) ? rec.slideLink : '') || ((planSlides(cid).find(m => !publishedId(m.url)) || {}).url) || '';
  // the deck to show: a published link saved for this day wins, then one in the plan's links, then the course's usual deck
  function carriedDeck(cid){
    const keys = [cid, rowKeyOf(cid)], dates = Object.keys(T.days || {}).filter(d => d <= viewDate).sort().reverse();
    for (const d of dates) for (const k of keys) { const r = (T.days[d] || {})[k]; if (r && publishedId(r.slideLink)) return { url: r.slideLink, from: d }; }
    return null;
  }
  // the deck to show: a published link from this day's plan, else the latest deck saved for this class (it carries forward), else the usual deck
  const deckFor = (cid, rec) => ((planSlides(cid).find(m => publishedId(m.url)) || {}).url) || Suite.deckFor(cid) || (carriedDeck(cid) || {}).url || usual(cid).deckUrl || '';
  function lessonHtml(cid, rec){
    const u = usual(cid), deck = deckFor(cid, rec), pid = publishedId(deck), link = slideLinkFor(cid, rec), did = docId(link) || docId(u.deckUrl), slide = slideParam(link) || slideParam(deck);
    const src = pid ? `https://docs.google.com/presentation/d/e/${pid}/embed?start=false&loop=false&delayms=60000${slide ? '&slide=' + slide : ''}`
      : did ? `https://docs.google.com/presentation/d/${did}/embed?start=false&loop=false&delayms=60000${slide ? '&slide=' + slide : ''}` : '';
    if (!src) return `<div class="lesson"><button class="backboards" data-a="boards" title="Back to the boards">‹ Boards</button><span class="fstools lessontools">${pinMenu(cid)}${toolMenu('opentool', 'Open a tool', TOOL_PAGES)}</span><div class="lesson-tools" id="ltools"></div><div class="lesson-empty"><p class="t">No lesson deck linked yet</p><p>Add a Google Slides link for this day in the Planner (Students see → Lesson slides), or in Day settings → Lesson slides.</p></div></div>`;
    return `<div class="lesson"><span class="lessonbtns"><button class="backboards" data-a="boards" title="Back to the boards">‹ Boards</button><button class="backboards" data-a="full" title="Full screen (F). Keeps the bell reminder and tools on top of your slides.">${full ? 'Exit full screen' : '⛶ Full screen'}</button></span><span class="fstools lessontools">${pinMenu(cid)}${toolMenu('opentool', 'Open a tool', TOOL_PAGES)}</span><div class="lesson-tools" id="ltools"></div><iframe title="Lesson slides" src="${src}"></iframe></div>`;
  }
  function openInSlides(cid){
    const rec = dayFor(viewDate, cid), u = usual(cid), link = slideLinkFor(cid, rec), deck = deckFor(cid, rec), id = docId(link) || docId(deck), slide = slideParam(link) || slideParam(deck);
    if (id) window.open(`https://docs.google.com/presentation/d/${id}/present${slide ? '?slide=' + slide : ''}`, '_blank');
    else if (publishedId(deck)) window.open(deck, '_blank');
    else Suite.toast('Add this class\'s published deck in the Planner first (Plan this day)');
  }

  /* ---------- the warm-up timer ---------- */
  const timer = { left: 0, end: 0, running: false, cid: null, done: false };
  function resetTimer(cid){ const u = usual(cid || activeId()); timer.running = false; timer.done = false; timer.cid = cid || activeId(); timer.left = (u.timer.min || 3) * 60000; }
  function toggleTimer(){
    if (timer.running) { timer.left = Math.max(0, timer.end - Date.now()); timer.running = false; }
    else { if (timer.left <= 0) resetTimer(); timer.end = Date.now() + timer.left; timer.running = true; timer.done = false; }
    drawTimer(); renderRail(activeId());
  }
  const TIMER_STYLES = { digital: 'Digital', flip: 'Flip clock', ring: 'Progress ring', chalk: 'Handwritten', minimal: 'Big and simple' };
  function timerInner(style){
    const t = timerText(), total = (usual(activeId()).timer.min || 3) * 60000, left = timer.running ? Math.max(0, timer.end - Date.now()) : timer.left;
    if (style === 'flip') return `<span class="tm-row">${t.split('').map(ch => ch === ':' ? '<span class="fl-colon">:</span>' : `<span class="fl">${ch}</span>`).join('')}</span>`;
    if (style === 'ring') { const frac = Math.max(0, Math.min(1, total ? left / total : 0)), C = 2 * Math.PI * 44;
      return `<span class="tm-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="r-bg"/><circle cx="50" cy="50" r="44" class="r-fg" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/></svg><span class="tm-num">${t}</span></span>`; }
    return `<span class="tm-num">${t}</span>`;
  }
  const timerText = () => { const ms = timer.running ? Math.max(0, timer.end - Date.now()) : timer.left, s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function drawTimer(){
    if (timer.running && Date.now() >= timer.end) { timer.running = false; timer.left = 0; timer.done = true; renderRail(activeId()); if (document.visibilityState === 'visible') Suite.chimeFor('warmup'); }
    const b = $('#rTimer');
    const tin = document.getElementById('timerIn');
    if (b && tin) { const html = timerInner(usual(activeId()).timer.style); if (tin.dataset.h !== html) { tin.innerHTML = html; tin.dataset.h = html; } b.classList.toggle('done', timer.done); }
  }
  let lastAuto = '', lastCid = null;
  setInterval(() => {
    drawTimer();
    const pick = autoPick();
    const pickKey = pick.cid + (pick.idle ? ':idle' : '');
    if (MODE === 'auto' && pickKey !== lastCid) { lastCid = pickKey; if (!timer.running) resetTimer(pick.cid); boardNo = 0; reveal = 0; lesson = false; render(); }
    const p = pick.period, now = new Date(), nowHM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (p && p.start === nowHM && viewDate === Suite.dateKey(now) && pick.cid && (MODE === 'auto' || MODE === pick.cid)) {
      const key = Suite.dateKey(now) + p.start, u = usual(pick.cid);
      if (key !== lastAuto && u.timer.on && u.timer.auto && lookOf(pick.cid).timer) { lastAuto = key; resetTimer(pick.cid); toggleTimer(); boardNo = 0; lesson = false; render(); }
    }
  }, 250);

  /* ---------- moving through the boards ---------- */
  function next(){
    const cid = activeId(), S = screens(viewDate, cid);
    if (lesson) return;
    const type = S[boardNo], h = hiddenCount(viewDate, cid, type);
    if (reveal < h) { reveal++; render(); return; }
    if (boardNo < S.length - 1) { boardNo++; reveal = 0; render(); return; }
    lesson = true; render();
  }
  function prev(){
    const cid = activeId(), S = screens(viewDate, cid);
    if (lesson) { lesson = false; boardNo = S.length - 1; reveal = hiddenCount(viewDate, cid, S[boardNo]); render(); return; }
    if (reveal > 0) { reveal--; render(); return; }
    if (boardNo > 0) { boardNo--; reveal = hiddenCount(viewDate, cid, S[boardNo]); render(); }
  }

  /* ---------- control rail ---------- */
  function pickMode(id){ setMode(id); boardNo = 0; reveal = 0; lesson = false; if (!timer.running) resetTimer(activeId()); render(); if (editing) renderDrawer(); }
  document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.a2 === 'clspick') pickMode(e.target.value || 'auto'); });
  document.addEventListener('change', e => { if (!STUDIO || !e.target.dataset || e.target.dataset.a2 !== 'stprev') return; save(); STUDIO.cid = e.target.value; studioLoad(); render(); });
  function renderRail(cid, S){
    S = S || (cid ? screens(viewDate, cid) : []);
    const list = classes(), today = Suite.dateKey(new Date()), auto = MODE === 'auto' ? autoPick() : null;
    const seen = new Set(), picks = list.filter(c => { const k = rowKeyOf(c.id); if (seen.has(k + c.id)) return false; seen.add(k + c.id); return true; });
    const u = cid ? usual(cid) : null, L = cid ? lookOf(cid, viewDate) : null;
    if (STUDIO) { $('#rail').innerHTML = studioRail() + `<div class="rrow r2 bar"><button class="btn" data-a="xaddbox">Add a text box</button>${toolMenu('addtool', 'Place a tool on this board', WIDGETS)}<button class="btn" data-a="addpic">Add a picture</button><button class="btn" data-a="edundo" title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn quiet" data-a="edtips" title="Editing tips">?</button></div>` + edFloat(cid, S);
      document.documentElement.style.setProperty('--railh', $('#rail').offsetHeight + 'px'); return; }
    $('#rail').innerHTML = `<div class="rrow r1"><div class="pills" role="radiogroup" aria-label="Which class to show">
        <button role="radio" data-a="mode" data-id="auto" aria-checked="${MODE === 'auto'}" title="Follow the bell schedule">Auto</button>
</div>
      <select class="clspick${MODE !== 'auto' ? ' on' : ''}" data-a2="clspick" aria-label="Pick a class"><option value=""${MODE === 'auto' ? ' selected' : ''}>Pick a class</option>${picks.map(c => `<option value="${esc(c.id)}"${MODE === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <div class="daybar" role="group" aria-label="Which day"><button class="btn quiet small" data-a="dayprev" title="Previous school day" aria-label="Previous school day">‹</button><label class="dpick" title="Pick a date"><span>${esc(fmtDate(viewDate, 'medium'))}</span><input type="date" data-a="daypick" value="${viewDate}" aria-label="Pick a date"></label><button class="btn quiet small" data-a="daynext" title="Next school day" aria-label="Next school day">›</button><button class="btn small" data-a="daytoday"${viewDate !== today ? '' : ' style="visibility:hidden" tabindex="-1" aria-hidden="true"'} title="Back to today">Today</button></div>
      <div class="status">${isIdle() ? (() => { const I = idleInfo(); return `<b>${esc(I.label)}</b>${I.endHM ? ' until ' + Suite.fmt12(I.endHM) : ''} · between classes. Pick a class to plan for it`; })() : cid ? `<b>${esc((list.find(c => c.id === cid) || {}).name || '')}</b>${auto ? ' · ' + esc(auto.text) : ''}${viewDate !== today ? ' · previewing ' + esc(longDate(viewDate)) : ''}` : ''}</div>
      <div class="steps" aria-label="Boards">${S.map((t, i) => `<i class="${!lesson && i === boardNo ? 'on' : ''}" data-a="go" data-i="${i}" title="${esc(boardLabel(dayFor(viewDate, cid), t))}"></i>`).join('')}<i class="ldot${lesson ? ' on' : ''}" data-a="go" data-i="lesson" title="Lesson slides"></i></div>
      </div>
      ${edFloat(cid, S)}
      ${editMode ? `<div class="rrow r2 bar"><button class="btn" data-a="prev" title="Previous board">‹ Back</button><button class="btn primary" data-a="next" title="Next board">Next ›</button><button class="btn" data-a="xaddbox">Add a text box</button>${toolMenu('addtool', 'Place a tool on this board', WIDGETS)}${everyMenu(cid)}<button class="btn" data-a="addpic">Add a picture</button><button class="btn" data-a="edundo" title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn quiet" data-a="edtips" title="Editing tips">?</button><button class="btn" data-a="settings">Day settings</button><button class="btn primary" data-a="editdone">Done editing</button></div>` : `<div class="rrow r2 bar">
        <button class="btn" data-a="prev" title="Previous (left arrow)">‹ Back</button><button class="btn primary" data-a="next" title="Next (right arrow or clicker)">${lesson ? 'Lesson' : 'Next ›'}</button>
        ${lesson ? '<button class="btn slot-lesson" data-a="boards">Back to boards</button>' : '<button class="btn slot-lesson" data-a="lesson" title="L">Lesson</button>'}
        ${toolMenu('opentool', 'Open a tool on top of the board', TOOL_PAGES)}
        ${lesson ? '<button class="btn slot-edit" data-a="openslides" title="If the deck won\'t show here, open it in Google Slides">Open in Slides</button>' : '<button class="btn primary slot-edit" data-a="startedit" title="E: click text to type, drag boxes to move">Edit on screen</button>'}
        <a class="btn" href="planner.html#date=${viewDate}&class=${encodeURIComponent(cid || '')}&from=today" title="Open this day in the Planner">Plan this day</a><button class="btn" data-a="edit" title="Boards, background, and timer for this class">Day settings</button><a class="btn allboards" href="boards.html" title="Every board you've made and where each one shows">All boards</a><button class="btn" data-a="full" title="F">Full screen</button>
        ${(() => { const showT = !lesson && S[boardNo] === 'welcome' && L && L.timer && u && u.timer.on; return showT ? `<button class="btn slot-timer" data-a="timer" title="T to start or pause, R to reset">${timer.running ? 'Pause timer' : timer.left <= 0 ? 'Restart timer' : 'Start timer'}</button>` : ''; })()}</div>`}`;
    document.documentElement.style.setProperty('--railh', $('#rail').offsetHeight + 'px');
    const nav = document.getElementById('suite-nav'); document.documentElement.style.setProperty('--navh', (nav && !full ? nav.offsetHeight : 0) + 'px');
  }
