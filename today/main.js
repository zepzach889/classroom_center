/* Today page, part 7 of 7: Buttons and keys, then the first draw. This file runs last.
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  /* ---------- buttons and keys ---------- */
  document.addEventListener('click', e => { if (!e.target.closest('.tmenu')) document.querySelectorAll('.tmenu-list').forEach(x => { x.hidden = true; }); }, true);
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el) { if (!editMode && e.target.closest('#rTimer')) toggleTimer(); return; }
    const a = el.dataset.a, cid = activeId();
    if (a === 'mode') { pickMode(el.dataset.id); }
    else if (a === 'next') next();
    else if (a === 'prev') prev();
    else if (a === 'go') { if (el.dataset.i === 'lesson') lesson = true; else { lesson = false; boardNo = +el.dataset.i; reveal = 0; } render(); }
    else if (a === 'timer') toggleTimer();
    else if (a === 'lesson') { lesson = true; render(); }
    else if (a === 'boards') { lesson = false; render(); }
    else if (a === 'openslides') openInSlides(cid);
    else if (a === 'edit') { editing = !editing; $('#drawer').hidden = !editing; if (editing) renderDrawer(); }
    else if (a === 'full') { full = !full; if (full && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); else if (!full && document.fullscreenElement) document.exitFullscreen().catch(() => {}); render(); }
    else if (a === 'startedit') startEdit();
    else if (a === 'addpic') { let inp = document.getElementById('picadd'); if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'picadd'; inp.hidden = true; document.body.appendChild(inp); } inp.click(); return; }
    else if (a === 'unlinkday') { const cid = activeId(), t = S0cur(), r = editable(viewDate, cid), id = 'c-' + Suite.uid(), src = clone(boardOf(dayFor(viewDate, cid), t));
      src.name = (src.name || plainOf(src.heading) || 'Board') + ' (this day)'; r.boards = r.boards || {}; r.boards[id] = src; r.lineup = r.lineup.map(x => x === t ? id : x); delete r.boards[t];
      save(); render(); Suite.toast('Now a separate copy, just for this day. The linked board is unchanged.'); return; }
    else if (a === 'edundo') { undo(); return; }
    else if (a === 'itemdel') { removeItem(el.dataset.kind, el.dataset.id); return; }
    else if (a === 'edopts') { edOpts = !edOpts; renderRail(activeId()); return; }
    else if (a === 'edtips') { edTips = !edTips; renderRail(activeId()); return; }
    else if (a === 'edtipsok') { edTips = false; Suite.set('edtipsSeen', true); renderRail(activeId()); return; }
    else if (a === 'strename') { const sb = T.days[SBOX][STUDIO.cid].boards[SID]; Suite.dialog({ title: 'Rename this board', body: 'The name used in lists. What students see on the board doesn\'t change.', input: sb.name || plainOf(sb.heading), ok: 'Rename' }).then(nm => { if (!nm || !nm.trim()) return; sb.name = nm.trim(); save(); renderRail(activeId()); }); return; }
    else if (a === 'align') { doAlign(el.dataset.v); return; }
    else if (a === 'alignclear') { alignSel.clear(); markAlign(); renderRail(activeId()); return; }
    else if (a === 'everytool') { const cid = activeId(), u = usual(cid), list = u.boardTools = u.boardTools || [], i = list.findIndex(w => w.kind === el.dataset.id);
      if (i > -1) list.splice(i, 1); else list.push({ id: Suite.uid(), kind: el.dataset.id, box: (LT_SIZE[el.dataset.id] || [1400, 300, 440, 380]).slice() }); save(); render(); return; }
    else if (a === 'pintool') { togglePin(el.dataset.id); const l = el.closest('.tmenu-list'); if (l) l.hidden = true; }
    else if (a === 'ltdel') { const cid = activeId(), u = usual(cid), ln = el.dataset.list || 'lessonTools'; u[ln] = (u[ln] || []).filter(w => w.id !== el.dataset.id); save(); drawLessonTools(cid); const menu = document.querySelector('.lessontools .tmenu'); if (menu) { const t = document.createElement('span'); t.innerHTML = pinMenu(cid); menu.replaceWith(t.firstElementChild); } }
    else if (a === 'dayprev' || a === 'daynext' || a === 'daytoday') { viewDate = a === 'daytoday' ? Suite.dateKey(new Date()) : shiftDay(viewDate, a === 'dayprev' ? -1 : 1); boardNo = 0; reveal = 0; lesson = false; render(); if (editing) renderDrawer(); }
    else if (a === 'piece') { const t = screens(viewDate, cid)[boardNo], r = editable(viewDate, cid), bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); bd.hide = bd.hide || {}; if (el.checked) delete bd.hide[el.dataset.k]; else bd.hide[el.dataset.k] = true; save(); render(); return; }
    else if (a === 'tmenu') { const l = el.parentElement.querySelector('.tmenu-list'); document.querySelectorAll('.tmenu-list').forEach(x => { if (x !== l) x.hidden = true; }); l.hidden = !l.hidden; return; }
    else if (a === 'opentool') { el.closest('.tmenu-list').hidden = true; openTool(el.dataset.id); }
    else if (a === 'addtool') { el.closest('.tmenu-list').hidden = true; const r = editable(viewDate, cid), t = $('#stage').dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); bd.tools = bd.tools || [];
      // find an open spot so new tools don't stack on top of each other
      const over = (a, b2) => a[0] < b2[0] + b2[2] && b2[0] < a[0] + a[2] && a[1] < b2[1] + b2[3] && b2[1] < a[1] + a[3];
      const box = WIDGETS[el.dataset.id][1].slice(); for (let n = 0; n < 12 && bd.tools.some(w => over(box, w.box)); n++) { box[0] -= box[2] + 20; if (box[0] < 0) { box[0] = 1920 - box[2] - 40; box[1] = Math.max(20, box[1] - box[3] - 20); } }
      bd.tools.push({ id: Suite.uid(), kind: el.dataset.id, box }); save(); render(); Suite.toast(WIDGETS[el.dataset.id][0] + ' added to this board. Drag it into place.'); }
    else if (a === 'editdone' && STUDIO) { endEdit(); save(); location.href = 'boards.html'; }
    else if (a === 'editdone') endEdit();
    else if (a === 'settings') { editing = true; $('#drawer').hidden = false; renderDrawer(); }
    else if (a === 'xaddbox') { const lay = ownLayout($('#stage').dataset.look); lay.extras.push({ id: Suite.uid(), box: [760, 420, 460, 200], panel: 'none', html: '' }); save(); render().then(() => { const x = [...document.querySelectorAll('.x-fit[contenteditable]')].pop(); if (x) { x.focus(); document.execCommand('selectAll'); } }); }
  });
  document.addEventListener('pointerdown', e => {
    if (!editing || $('#drawer').hidden) return;
    if (e.target.closest('#drawer, .suite-dialog-back, .overlay, [data-a="edit"], [data-a="settings"], .tmenu')) return;
    editing = false; $('#drawer').hidden = true;
  });
  document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.a === 'daypick' && e.target.value) { viewDate = e.target.value; boardNo = 0; reveal = 0; lesson = false; render(); if (editing) renderDrawer(); } });
  document.addEventListener('change', async e => { if (e.target.id !== 'picadd' || !e.target.files[0]) return;
    try { const meta = await Suite.files.put(e.target.files[0]); const r = editable(viewDate, activeId()), t = stageEl.dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t));
      bd.pics = bd.pics || []; const n = bd.pics.length; bd.pics.push({ id: Suite.uid(), file: meta.id, box: [1060 + n * 40, 260 + n * 40, 520, 380] }); save(); render(); Suite.toast('Picture added. Drag it into place.'); }
    catch (err) { Suite.toast(err.message || "Couldn't add that picture"); } e.target.value = ''; });
  document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.a2 === 'dpick' && e.target.value) { viewDate = e.target.value; boardNo = 0; reveal = 0; lesson = false; render(); if (editing) renderDrawer(); } });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && full) { full = false; render(); } });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.suite-dialog') || document.querySelector('.overlay') || document.body.classList.contains('timer-open')) return;
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (editMode) { if (k === 'Escape') endEdit(); return; }
    else if (editing && k !== 'Escape') return;      // letters are for typing while the edit drawer is open
    else if (k === 't' || k === 'T') toggleTimer();
    else if (k === 'r' || k === 'R') { resetTimer(); drawTimer(); renderRail(activeId()); }
    else if (k === 'l' || k === 'L') { lesson = !lesson; render(); }
    else if (k === 'e' || k === 'E') startEdit();
    else if (k === 'f' || k === 'F') { full = !full; render(); }
    else if (k === 'Escape') { if (editing) { editing = false; $('#drawer').hidden = true; } else if (full) { full = false; render(); } }
  });
  window.addEventListener('resize', () => requestAnimationFrame(fitAll));
  // the Today page never scrolls; if typing nudges it, put it back so the bar above the slide stays visible
  window.addEventListener('scroll', () => { if (window.scrollY || window.scrollX) window.scrollTo(0, 0); });
  // refit whenever the slide or any box changes size, and once more after fonts finish loading
  if (window.ResizeObserver) { let rq = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(rq); rq = requestAnimationFrame(fitAll); }); ro.observe($('#stage')); }
  window.addEventListener('suite:change', e => {
    if (!e.detail || !(e.detail.external || e.detail.key === '*')) return;
    if (e.detail.key && e.detail.key !== 'today' && e.detail.key !== '*' && !['classes', 'agenda', 'events', 'schedule', 'courses', 'tracker', 'units', 'decks'].includes(e.detail.key)) return;
    T = Object.assign(clone(BLANK), Suite.get('today', {})); T.layouts = T.layouts || {};
    if (lesson) { renderRail(activeId()); updateBell(); drawLessonTools(activeId()); return; }         // the slides keep their place (pinned widgets refresh)
    if (editMode && document.activeElement && document.activeElement.closest && document.activeElement.closest('#stage [data-f]')) return;   // don't redraw under your cursor
    render();
  });
  { const md = location.hash.match(/date=(\d{4}-\d{2}-\d{2})/), mc = location.hash.match(/class=([\w-]+)/);
    if (md) viewDate = md[1];
    if (mc && classes().some(c => c.id === decodeURIComponent(mc[1]))) setMode(decodeURIComponent(mc[1]));
  }
  { const ms = location.hash.match(/studio=([^&]+)/);
    if (ms) { const parts = decodeURIComponent(ms[1]).split('|'), kind = parts[0];
      STUDIO = kind === 'lib' ? { kind, id: parts[1] } : kind === 'row' ? { kind, k: parts[1], id: parts[2] } : { kind: 'day', d: parts[1], k: parts[2], id: parts[3] };
      STUDIO.peek = /peek=1/.test(location.hash);
      // preview with a class that uses it (or the first class)
      const keyCls = k => { if (!k) return null; if (String(k).startsWith('course:')) { const co = Suite.courses().find(x => 'course:' + x.id === k); return co && co.classIds[0]; } return k; };
      let pc = keyCls(STUDIO.k); if (!pc && kind === 'lib') { const id = 'L-' + STUDIO.id, hit = Object.entries(T.rows || {}).find(([k, r]) => (r.lineup || []).includes(id)); pc = hit && keyCls(hit[0]); }
      STUDIO.cid = classes().some(c => c.id === pc) ? pc : (classes()[0] || {}).id;
      if (!STUDIO.cid || !studioLoad()) { STUDIO = null; Suite.toast("That board couldn't be found"); }
      else { viewDate = SBOX; boardNo = 0; scope = 'period'; document.body.classList.add('studio'); if (STUDIO.peek) document.body.classList.add('peek'); }
    } }
  { let lastDay = Suite.dateKey(new Date());
    setInterval(() => { const nowDay = Suite.dateKey(new Date()); if (nowDay === lastDay) return;
      if (viewDate === lastDay && !STUDIO) { viewDate = nowDay; boardNo = 0; reveal = 0; lesson = false; render(); }
      lastDay = nowDay; }, 30000); }
  // one-time cleanup: a typed date that is really another day's date goes back to automatic
  (() => { const looksLikeDate = t => /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(t);
    let fixed = 0;
    Object.entries(T.days || {}).forEach(([d, day]) => Object.values(day).forEach(r => { if (!r || !r.dateText) return;
      const plain = plainOf(r.dateText), ok = Object.keys(DATE_FORMATS).some(f => fmtDate(d, f) === plain);
      if (!ok && looksLikeDate(plain)) { delete r.dateText; fixed++; } }));
    if (fixed) save(); })();
  Suite.mountNav('today');
  resetTimer(activeId()); lastCid = activeId();
  render();
  if (STUDIO && !STUDIO.peek) setTimeout(() => { if (!editMode) startEdit(); }, 30);
  // opened from the Boards page: go straight to that board (and start editing)
  { const mb = location.hash.match(/board=([\w-]+)/);
    if (mb) setTimeout(() => { const S0 = screens(viewDate, activeId()), k = S0.indexOf(decodeURIComponent(mb[1])); if (k > -1) { boardNo = k; reveal = 0; render(); } if (/edit=1/.test(location.hash) && !editMode) startEdit(); }, 60); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(fitAll));
