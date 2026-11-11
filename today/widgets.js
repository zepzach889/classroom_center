/* Today page, part 6 of 7: Widgets pinned on top of the lesson slides.
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  /* ---------- widgets pinned on top of the lesson slides (per class, kept until removed) ---------- */
  const LT_SIZE = { seating: [240, 170, 1440, 880], duties: [1360, 300, 520, 360], clock: [1440, 40, 440, 250], winners: [1300, 200, 580, 620], picker: [1480, 40, 400, 230], points: [1480, 300, 400, 420], timer: [1480, 760, 400, 220], noise: [40, 860, 460, 180], spinner: [1300, 250, 560, 620] };
  const pinMenu = cid => { const on = new Set((usual(cid).lessonTools || []).map(w => w.kind));
    return `<span class="tmenu"><button class="btn" data-a="tmenu" aria-haspopup="true" title="Keep a tool on top of your slides">Pin to slides ▾</button><span class="tmenu-list" hidden>${Object.entries(WIDGETS).map(([k, v]) => `<button data-a="pintool" data-id="${k}">${on.has(k) ? '✓ ' : ''}${esc(v[0])}</button>`).join('')}</span></span>`; };
  function drawLessonTools(cid){ drawPinned(cid, 'ltools', 'lessonTools'); drawPinned(cid, 'btools', 'boardTools'); }
  function drawPinned(cid, elId, listName){
    const el = document.getElementById(elId); if (!el) return;
    const list = usual(cid)[listName] || [];
    el.innerHTML = list.map(w => `<div class="region tool tool-${w.kind} ltool" data-lt="${esc(w.id)}" data-list="${listName}" style="${place(w.box)}"><div class="w-in">${widgetHtml(w.kind, w)}</div>
      <span class="lt-grip" data-lt-move title="Drag to move">⠿</span><span class="lt-size" data-lt-size title="Drag to resize"></span><button class="lt-x" data-a="ltdel" data-list="${listName}" data-id="${esc(w.id)}" aria-label="Remove ${esc(WIDGETS[w.kind][0])}">×</button></div>`).join('');
    fitAll && requestAnimationFrame(() => fitAll());
  }
  function togglePin(kind){
    const cid = activeId(), u = usual(cid), list = u.lessonTools = u.lessonTools || [], i = list.findIndex(w => w.kind === kind);
    if (i > -1) list.splice(i, 1); else list.push({ id: Suite.uid(), kind, box: LT_SIZE[kind].slice() });
    save(); drawLessonTools(cid);
    const menu = document.querySelector('.lessontools'); if (menu) { const old = menu.querySelector('.tmenu'); const tmp = document.createElement('span'); tmp.innerHTML = pinMenu(cid); old.replaceWith(tmp.firstElementChild); }
  }
  // drag to move or resize (a cover over the slides keeps the drag smooth)
  document.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-lt-move],[data-lt-size]'); if (!h) return;
    const box = h.closest('.ltool'), st = document.getElementById('stage'), cid = activeId(), w = (usual(cid)[box.dataset.list || 'lessonTools'] || []).find(x => x.id === box.dataset.lt); if (!w) return;
    e.preventDefault(); const r = st.getBoundingClientRect(), sx = 1920 / r.width, sy = 1080 / r.height, x0 = e.clientX, y0 = e.clientY, b0 = w.box.slice(), resize = h.hasAttribute('data-lt-size');
    const shield = document.createElement('div'); shield.className = 'lt-shield'; st.appendChild(shield);
    const move = ev => { const dx = (ev.clientX - x0) * sx, dy = (ev.clientY - y0) * sy;
      if (resize) { w.box[2] = Math.max(180, Math.min(1920 - b0[0], b0[2] + dx)); w.box[3] = Math.max(110, Math.min(1080 - b0[1], b0[3] + dy)); } else { w.box[0] = Math.max(0, Math.min(1920 - b0[2], b0[0] + dx)); w.box[1] = Math.max(0, Math.min(1080 - b0[3], b0[1] + dy)); }
      Object.assign(box.style, { left: (w.box[0] / 19.2) + '%', top: (w.box[1] / 10.8) + '%', width: (w.box[2] / 19.2) + '%', height: (w.box[3] / 10.8) + '%' }); };
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); shield.remove(); save(); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  });

  // the widgets themselves
  const picked = {};   // names already picked this session, per class
  // the class's seating chart, drawn like the printout (redrawn only when seats change)
  const seatCache = {};
  function seatImg(c, front){
    const sig = JSON.stringify([c.tables, c.students.map(x => [x.name, x.tableId, x.seat]), front]);
    if (seatCache[c.id] && seatCache[c.id].sig === sig) return seatCache[c.id].url;
    const url = Suite.drawSeatingChart(c, { title: '', width: 2400, height: 1500, margin: 24, front }).toDataURL('image/png');
    seatCache[c.id] = { sig, url }; return url;
  }
  function widgetHtml(kind, w){
    if (kind === 'seating') { const c = classes().find(x => x.id === activeId());
      if (!c || !c.tables.length) return '<div class="w-pts"><div class="w-empty">Set up tables and seats on the Seating page first.</div></div>';
      return `<div class="w-seat">${w && w.heading ? `<div class="w-sh">${esc(w.heading)}</div>` : ''}<div class="w-si"><img alt="Seating chart for ${esc(c.name)}" src="${seatImg(c, (w && w.front) || 'top')}"></div></div>`; }
    if (kind === 'duties') { const cid = activeId(), h = dutiesHtml(cid, 'w-du'); return `<div class="w-pts w-duw"><div class="w-ph">Clean-up duties</div>${h || '<div class="w-empty">Set up duties in Day settings → Clean-up duties.</div>'}</div>`; }
    if (kind === 'clock') { const I = timeLeftInfo(); return `<div class="w-clock"><div class="wc-left">${I.left != null ? mmssOf(I.left) + (I.pct > 0 ? ' left' : '') : ''}</div><div class="wc-now">${clockOf(I.now).replace(/\s?[AP]M$/i, '')}</div><div class="wc-lab">${esc(I.sub || '')}</div></div>`; }
    if (kind === 'spinner') return `<iframe class="w-spinner" title="Name spinner" src="spinner.html?embed&proj&mini#class=${encodeURIComponent(activeId() || '')}"></iframe>`;
    if (kind === 'picker') return `<div class="w-pick"><div class="w-name" data-w="name">${esc(w.last || '')}</div><button class="w-btn" data-w="pick">Pick a name</button></div>`;
    if (kind === 'noise') return `<div class="w-noise"><div class="w-nlab" data-w="nlab">${mic ? '' : 'Noise meter'}</div><div class="w-meter"><span data-w="nbar"></span><i style="left:${(Suite.get('noise', {}) || {}).line || 60}%"></i></div>${mic ? '' : '<button class="w-btn" data-w="mic">Start listening</button>'}</div>`;
    if (kind === 'timer') { const t = Suite.timerState(); return `<div class="w-timer"><div class="w-time" data-w="time">${Suite.fmtDuration(t.left || 0)}</div><div class="w-row">${[1, 3, 5].map(m => `<button class="w-btn sm" data-w="tstart" data-m="${m}">${m} min</button>`).join('')}<button class="w-btn sm" data-w="ttog">${t.state === 'running' ? 'Pause' : 'Go'}</button></div></div>`; }
    if (kind === 'winners') {   // the most recent ended week: places after that week, with prize badges
      const c = classes().find(x => x.id === activeId()), T0 = Object.assign({ prizes: [], log: [] }, Suite.get('tracker', {})), team = Suite.word('team', { cap: true });
      if (!c || !Suite.feature('points')) return '<div class="w-pts muted">Points are turned off.</div>';
      const mine = (T0.prizes || []).filter(x => x.c === c.id && x.q === T0.quarter && x.kind !== 'quarter');
      const wk = (T0.week || 1) - 1, q = T0.quarter;
      if (wk < 1) return `<div class="w-pts w-win"><div class="w-ph">Week results</div><div class="w-empty">Results show here after you end a week in ${esc(team)} points.</div></div>`;
      const QT = tid => (T0.log || []).reduce((a, e) => a + (e.c === c.id && e.t === tid && e.q === q && e.w <= wk ? e.d : 0), 0);
      const won = (kind2, tid) => mine.some(x => x.w === wk && x.kind === kind2 && x.tables.some(y => y.id === tid));
      const rows = Suite.activeTables(c).map(t => [t, QT(t.id)]).sort((a, b) => b[1] - a[1]);
      const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
      const names = kind2 => rows.filter(([t]) => won(kind2, t.id)).map(([t]) => t.name).join(' and ');
      const foot = [`🏆 Top ${esc(team.toLowerCase())}: ${names('top') ? esc(names('top')) : 'none yet'}`, names('streak') ? `🔥 Streak: ${esc(names('streak'))}` : '', wk >= 2 ? (names('improved') ? `📈 Most improved: ${esc(names('improved'))}` : `📈 Most improved: no ${esc(team.toLowerCase())} beat its week ${wk - 1} points`) : ''].filter(Boolean);
      return `<div class="w-pts w-win w-res"><div class="w-ph">Week ${wk} results <span class="w-wq">Quarter ${q} · totals after week ${wk}</span></div>${rows.map(([t, v]) => { const place = 1 + rows.filter(r => r[1] > v).length;
        return `<div class="w-rr${place === 1 ? ' first' : ''}"><span class="w-rp">${ord(place)}</span><span class="dot" style="background:${esc(t.color || '#888')}"></span><span class="w-rn">${esc(t.name)}</span><span class="w-rb">${won('top', t.id) ? '🏆' : ''}${won('improved', t.id) ? '📈' : ''}${won('streak', t.id) ? '🔥' : ''}</span><b>${v}</b></div>`; }).join('')}<div class="w-rf">${foot.map(x => `<span>${x}</span>`).join('')}</div></div>`;
    }
    if (kind === 'points') {
      const c = classes().find(x => x.id === activeId()), T0 = Object.assign({ quarter: 1, week: 1, log: [] }, Suite.get('tracker', {}));
      if (!c || !Suite.feature('points')) return '<div class="w-pts muted">Points are turned off.</div>';
      const rows = Suite.activeTables(c).map(t => ({ t, w: T0.log.reduce((a, e) => a + (e.c === c.id && e.t === t.id && e.q === T0.quarter && e.w === T0.week ? e.d : 0), 0), n: T0.log.reduce((a, e) => a + (e.c === c.id && e.t === t.id && e.q === T0.quarter ? e.d : 0), 0) })).sort((a, b) => b.n - a.n);
      return `<div class="w-pts"><div class="w-ph">${esc(Suite.word('team', { cap: true }))} points <span class="w-pq">quarter (+week)</span></div>${rows.map(r => `<div class="w-pr"><span class="dot" style="background:${esc(r.t.color)}"></span><span>${esc(r.t.name)}</span><i class="w-pw">+${r.w}</i><b>${r.n}</b></div>`).join('')}</div>`;
    }
    return '';
  }
  // the noise meter widget shares the Noise meter page's calibration
  let mic = null;
  async function startMic(){
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new (window.AudioContext || window.webkitAudioContext)(), an = ctx.createAnalyser(); an.fftSize = 2048;
      const h1 = ctx.createBiquadFilter(), h2 = ctx.createBiquadFilter(); [h1, h2].forEach(f => { f.type = 'highpass'; f.frequency.value = 300; });
      ctx.createMediaStreamSource(stream).connect(h1); h1.connect(h2); h2.connect(an);
      mic = { stream, ctx, an, buf: new Float32Array(an.fftSize), level: 0 }; render(); micTick();
    } catch (e) { Suite.toast("The microphone isn't available here"); }
  }
  function micTick(){
    if (!mic) return;
    mic.an.getFloatTimeDomainData(mic.buf); let sum = 0; for (let i = 0; i < mic.buf.length; i++) sum += mic.buf[i] * mic.buf[i];
    const db = 20 * Math.log10(Math.sqrt(sum / mic.buf.length) + 1e-9), N = Object.assign({ line: 60, sens: 5, base: null }, Suite.get('noise', {}) || {});
    const floor = N.base != null ? N.base + 3 : -66 - (N.sens - 1) * 4, range = N.base != null ? 20 + (10 - N.sens) * 6 : 60;
    mic.level = mic.level * .88 + Math.max(0, Math.min(100, (db - floor) / range * 100)) * .12;
    document.querySelectorAll('[data-w="nbar"]').forEach(b => { b.style.width = mic.level.toFixed(1) + '%'; b.parentElement.parentElement.dataset.z = mic.level < N.line * .7 ? 'ok' : mic.level < N.line ? 'warn' : 'loud'; });
    document.querySelectorAll('[data-w="nlab"]').forEach(l => { l.textContent = mic.level < N.line * .7 ? 'Nice and quiet' : mic.level < N.line ? 'Getting loud' : 'Too loud'; });
    requestAnimationFrame(micTick);
  }
  window.addEventListener('pagehide', () => { if (mic) { mic.stream.getTracks().forEach(t => t.stop()); try { mic.ctx.close(); } catch (e) {} } });
  setInterval(() => { const t = Suite.timerState(); document.querySelectorAll('[data-w="time"]').forEach(el => { el.textContent = Suite.fmtDuration(t.left || 0); }); document.querySelectorAll('[data-w="ttog"]').forEach(b => { b.textContent = t.state === 'running' ? 'Pause' : 'Go'; }); }, 300);
  window.addEventListener('suite:change', e => { if (e.detail && e.detail.key === 'tracker' && document.querySelector('.w-pts, .w-win')) { if (lesson) drawLessonTools(activeId()); else render(); } });
  $('#stage').addEventListener('click', e => {
    const b = e.target.closest('[data-w]'); if (!b || editMode) return;
    const w = b.dataset.w;
    if (w === 'pick') {
      const c = classes().find(x => x.id === activeId()); if (!c || !c.students.length) { Suite.toast('No students in this class yet'); return; }
      const sp = Suite.get('spinner', {}) || {}, a = sp.absent && sp.absent[c.id], away = a && a.date === Suite.dateKey(new Date()) ? new Set(a.ids) : new Set();
      const used = picked[c.id] = picked[c.id] || new Set(); let pool = c.students.filter(s => !away.has(s.id) && !used.has(s.id));
      if (!pool.length) { used.clear(); pool = c.students.filter(s => !away.has(s.id)); }
      const s = pool[Math.floor(Math.random() * pool.length)]; used.add(s.id);
      const box = b.closest('.w-pick').querySelector('[data-w="name"]'); box.textContent = s.name; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
    }
    else if (w === 'mic') startMic();
    else if (w === 'tstart') Suite.timerStart(+b.dataset.m * 60000);
    else if (w === 'ttog') Suite.timerToggle();
  });
