/* Today page, part 4 of 7: The bell reminder, and suite tools opened on top of a board or placed on one.
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  /* ---------- bell reminder: the last few minutes of class, passing time, and timed messages ---------- */
  const BELL_DEFAULT = { on: true, style: 'badge', corner: 'tr', strip: 'bottom', minutes: 5, overLesson: true, messages: [{ min: 3, text: 'Clean up your area and push in your chair.', chime: true }] };
  const bellCfg = () => { const base = Object.assign({}, BELL_DEFAULT, T.bell || {}), cid = activeId(), own = cid ? (usual(cid).bellOwn || null) : null;
    return own && own.on ? Object.assign({}, base, { minutes: own.minutes || base.minutes, messages: own.messages || [], chimeStart: !!own.chimeStart, chimeEnd: !!own.chimeEnd, sound: own.sound || '' }) : base; };
  const bellChime = B => { if (B.sound) Suite.chime(B.sound, Suite.chimeRepeat('bell', B.sound)); else Suite.chimeFor('bell'); };
  const fired = new Set();
  let bellPreview = 0;
  function bellInfo(){
    const now = new Date(), day = Suite.scheduleFor(now), P = day.periods, st = Suite.periodStatus(P, now);
    if (st.cur < 0) return null;
    if (Suite.noClassFor(Suite.dateKey(now), activeId()) && isIdle()) return null;   // a class that isn't meeting: no bell reminder
    const p = P[st.cur], [h, m] = p.end.split(':').map(Number), end = new Date(now); end.setHours(h, m, 0, 0);
    let nx = null; for (let i = st.cur + 1; i < P.length; i++) if (!Suite.isPassing(P[i])) { nx = P[i]; break; }
    return { p, left: end - now, passing: Suite.isPassing(p), brk: !!p.isBreak && !Suite.isPassing(p), staff: !!p.staff, nx, key: Suite.dateKey(now) + p.start };
  }
  function bellHtml(B){
    const pos = B.style === 'strip' ? 'strip-' + B.strip : B.style === 'badge' ? 'corner-' + B.corner : '';
    return `<div id="bellRem" class="bell bell-${B.style} ${pos}" hidden aria-live="polite"></div>`;
  }
  function updateBell(){
    const el = document.getElementById('bellRem'); if (!el) return;
    const B = bellCfg(), today = viewDate === Suite.dateKey(new Date());
    let info = B.on && today && !editMode ? bellInfo() : null;
    if (bellPreview > Date.now()) info = { p: { name: 'Period 2' }, left: 2 * 60000 + 30000, passing: false, brk: false, nx: { name: 'Period 3', start: '10:09' }, key: 'preview', preview: true };
    if (!info || info.staff || (lesson && !B.overLesson)) { el.hidden = true; return; }
    // show from the countdown setting, or earlier if a message starts earlier (a 7-minute clean-up message shows at 7 minutes)
    const limit = info.passing ? Infinity : Math.max(B.minutes, ...(B.messages || []).filter(x => x.text && x.min > 0).map(x => x.min)) * 60000;
    // chimes: when the countdown first appears, and at the bell (once each per period)
    if (!info.passing && !info.brk && !info.preview && today) {
      if (B.chimeStart && info.left <= limit && info.left > limit - 3000 && !fired.has(info.key + '|start')) { fired.add(info.key + '|start'); if (document.visibilityState === 'visible') bellChime(B); }
      if (B.chimeEnd && info.left <= 1500 && info.left > -2000 && !fired.has(info.key + '|end')) { fired.add(info.key + '|end'); if (document.visibilityState === 'visible') bellChime(B); }
    }
    if (info.left > limit || info.left <= 0) { el.hidden = true; return; }
    const secs = Math.ceil(info.left / 1000), mmss = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    // a message is due once the time left drops under its mark; the chime plays once
    let msg = null;
    if (!info.passing && !info.brk) (B.messages || []).filter(x => x.text && x.min > 0).sort((a, b) => a.min - b.min).forEach(x => {
      if (info.left <= x.min * 60000 && !msg) { msg = x; const k = info.key + '|' + x.min; if (!fired.has(k) && info.left > x.min * 60000 - 3000) { fired.add(k); if (x.chime && Suite.chime) bellChime(B); } else fired.add(k); }
    });
    const lead = info.passing ? 'Passing period' : info.brk ? info.p.name + ' ends in' : 'Class ends in';
    const next = info.nx ? `${info.passing ? '' : 'Next: '}${esc(info.nx.name)}${info.passing ? ' starts' : ''} at ${Suite.fmt12(info.nx.start)}` : '';
    el.innerHTML = `<div class="b-main"><span class="b-lead">${lead}</span><span class="b-time">${mmss}</span></div>${next ? `<div class="b-next">${next}</div>` : ''}${msg ? `<div class="b-msg">${esc(msg.text)}</div>` : ''}`;
    el.classList.toggle('warn', info.left <= B.minutes * 60000 && info.left > 60000);
    el.classList.toggle('urgent', info.left <= 60000);
    el.classList.toggle('hasmsg', !!msg);
    el.classList.toggle('big', !!(msg && msg.big));   // "show it big on screen": the message and a large countdown
    if (msg && msg.big) el.innerHTML = `<div class="b-bigmsg">${esc(msg.text)}</div><div class="b-bigtime">${mmss}</div><div class="b-bignext">${lead === 'Class ends in' ? 'until the bell' : esc(lead)}</div>${msg.duties ? dutiesHtml(activeId(), 'b-du') : ''}`;
    el.classList.toggle('withdu', !!(msg && msg.big && msg.duties));
    el.hidden = false;
  }
  setInterval(() => { updateBell(); updateIdle(); }, 500);

  /* ---------- suite tools: open one on top, or place one on a board ---------- */
  const TOOL_PAGES = { fxtoggle: ['Seasonal effects on / off', ''], timeleft: ['Time left (full screen)', ''], spinner: ['Name spinner', 'spinner.html'], groups: ['Partners and groups', 'activities.html', 'tool=groups'], noise: ['Noise meter', 'noise.html'], tally: ['Tally', 'activities.html', 'tool=tally'], points: ['Table points', 'tracker.html'], timer: ['Timer'] };
  const WIDGETS = { seating: ['Seating chart', [240, 170, 1440, 880]], duties: ['Clean-up duties', [1360, 300, 520, 360]], clock: ['Time left', [1440, 40, 440, 250]], winners: ["Week results", [1300, 200, 580, 620]], spinner: ['Name spinner', [1300, 250, 560, 620]], picker: ['Name picker', [1500, 760, 380, 240]], noise: ['Noise meter', [1440, 820, 440, 200]], points: ['Points standings', [1500, 640, 380, 380]], timer: ['Class timer', [1500, 820, 380, 200]] };
  // clean-up duties: set per class, rotating every Monday (plus any Rotate / Back adjustments)
  const mondayKey = k => { const d = new Date(k + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return Suite.dateKey(d); };
  function dutiesFor(cid, dateKey){
    const D = usual(cid).duties; if (!D || !(D.list || []).filter(Boolean).length) return null;
    const c = classes().find(x => x.id === cid); if (!c) return null;
    const lay = Suite.roomLayout(c.tables), tables = Suite.activeTables(c).slice().sort((a, b) => (lay.at[a.id] || {}).row - (lay.at[b.id] || {}).row || (lay.at[a.id] || {}).col - (lay.at[b.id] || {}).col);
    const list = D.list.filter(Boolean), weeks = Math.round((new Date(mondayKey(dateKey) + 'T12:00') - new Date((D.start || mondayKey(dateKey)) + 'T12:00')) / (7 * 86400000));
    const M = Math.max(tables.length, list.length), idx = ((weeks + (D.shift || 0)) % M + M) % M;
    const rows = tables.map((t, i) => { const slot = (i + idx) % M; return { t, duty: slot < list.length ? list[slot] : 'Free this week' }; });
    const taken = new Set(tables.map((t, i) => (i + idx) % M)), open = list.filter((x, j) => !taken.has(j));
    return { rows, open };
  }
  const dutiesHtml = (cid, cls) => { const R = dutiesFor(cid, viewDate); if (!R) return ''; return `<div class="${cls}">${R.rows.map(r => `<div class="du-r"><span class="dot" style="background:${esc(r.t.color || '#888')}"></span><b>${esc(r.t.name)}</b><span>${esc(r.duty)}</span></div>`).join('')}${R.open.length ? `<div class="du-r du-open"><span></span><b>Not assigned</b><span>${R.open.map(esc).join(', ')}</span></div>` : ''}</div>`; };
