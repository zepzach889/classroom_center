/* Today page, part 3 of 7: Edit on screen: typing into boards, dragging and resizing boxes, and the one-board editor opened from the Boards page.
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  /* ---------- edit on screen: type into the boards, drag and resize boxes ---------- */
  function ownLayout(look){
    const bk = boardKey(look);
    if (bk) { const r = editable(viewDate, activeId()); r.boards = r.boards || {}; const bd = r.boards[bk] = r.boards[bk] || clone(boardOf(r, bk));
      const lay = bd.layout = bd.layout || clone(getLayout(look)); lay.boxes = lay.boxes || {}; lay.panels = lay.panels || {}; lay.extras = lay.extras || []; lay.styles = lay.styles || {}; return lay; }
    const lay = T.layouts[look] = T.layouts[look] || clone(getLayout(look)); lay.boxes = lay.boxes || {}; lay.panels = lay.panels || {}; lay.extras = lay.extras || []; lay.styles = lay.styles || {}; if (!Object.keys(lay.boxes).length) Object.assign(lay.boxes, getLayout(look).boxes); return lay; }
  // switching in or out of editing keeps you on the same board (editing also lists empty boards, which shifts the order)
  function keepBoard(fn){ const cid = activeId(); const cur = cid ? (lesson ? null : screens(viewDate, cid)[boardNo]) : null; fn(); if (cid && cur) { const i = screens(viewDate, cid).indexOf(cur); boardNo = i > -1 ? i : 0; } }
  function startEdit(){ if (!activeId()) return; undoStack = []; lastSaved = JSON.stringify(T); keepBoard(() => { editMode = true; }); lesson = false; editing = false; $('#drawer').hidden = true; render(); }
  function endEdit(){ const a = document.activeElement; if (a && a.dataset && a.dataset.f) syncNow(a); keepBoard(() => { editMode = false; }); hideBar(); render(); }
  const ftb = document.createElement('div'); ftb.className = 'ftb'; ftb.hidden = true; ftb.setAttribute('role', 'toolbar'); ftb.setAttribute('aria-label', 'Text formatting');
  document.body.appendChild(ftb);
  let active = null;   // the text you're editing
  function showBar(el){
    active = el; const f = el.dataset.f, k = el.closest('.region').dataset.k, look = $('#stage').dataset.look, lay = getLayout(look);
    const panel = k.startsWith('x:') ? ((lay.extras.find(x => 'x:' + x.id === k) || {}).panel || 'none') : (lay.panels[k] || 'none');
    const fmt = ((lay.styles || {}).date || {}).format || 'long';
    ftb.innerHTML = `<button data-x="bold" title="Bold (Ctrl+B)"><b>B</b></button><button data-x="italic" title="Italic (Ctrl+I)"><i>I</i></button><button data-x="underline" title="Underline (Ctrl+U)"><u>U</u></button><span class="sep"></span>
      <span class="cpick"><button data-x="cmenu" title="Text color (select words first, or it colors the whole box)" aria-haspopup="true">Color ▾</button>
        <span class="cmenu" hidden>${TEXT_COLORS.map(([g, cs]) => `<span class="crow"><span class="cg">${g}</span>${cs.map(([c, n]) => `<button class="cdot" data-x="color" data-v="${c}" style="background:${c}" title="${n}" aria-label="${n}"></button>`).join('')}</span>`).join('')}
          ${(Suite.get('recentColors', []) || []).length ? `<span class="crow"><span class="cg">Recent</span>${(Suite.get('recentColors', []) || []).map(c => `<button class="cdot" data-x="color" data-v="${c}" style="background:${c}" title="${c}" aria-label="Recent color ${c}"></button>`).join('')}</span>` : ''}
          <span class="crow"><button class="ccust" data-x="ccustom" title="Pick any color">Custom…</button><input type="color" class="ccol" aria-label="Custom color" value="#2f6fd0"></span></span></span><span class="sep"></span>
      <select data-x="font" aria-label="Font" title="Font (select words first, or it changes the whole box)"><option value="">Font</option><option value="Chelsea Market">Chelsea Market</option><option value="Architects Daughter">Architect's Daughter</option><option value="Georgia">Georgia</option></select>
      <button data-x="smaller" title="Smaller">A−</button><button data-x="bigger" title="Bigger">A+</button><span class="sep"></span>
      <button data-x="align" data-v="left" title="Align left" aria-label="Align left"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor"/><rect x="1" y="6" width="9" height="2" rx="1" fill="currentColor"/><rect x="1" y="10" width="14" height="2" rx="1" fill="currentColor"/><rect x="1" y="14" width="9" height="2" rx="1" fill="currentColor"/></svg></button><button data-x="align" data-v="center" title="Center" aria-label="Center"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor"/><rect x="3.5" y="6" width="9" height="2" rx="1" fill="currentColor"/><rect x="1" y="10" width="14" height="2" rx="1" fill="currentColor"/><rect x="3.5" y="14" width="9" height="2" rx="1" fill="currentColor"/></svg></button><button data-x="align" data-v="right" title="Align right" aria-label="Align right"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor"/><rect x="6" y="6" width="9" height="2" rx="1" fill="currentColor"/><rect x="1" y="10" width="14" height="2" rx="1" fill="currentColor"/><rect x="6" y="14" width="9" height="2" rx="1" fill="currentColor"/></svg></button>
      ${f === 'lines' ? `<span class="sep"></span><button data-x="outdent" title="Less indented (Shift+Tab)">⇤</button><button data-x="indent" title="Sub-point (Tab)">⇥</button><button data-x="reveal" title="Keep this line hidden until you press Next">Hide until click</button>` : ''}
      ${f === 'date' ? `<span class="sep"></span><select data-x="datefmt" aria-label="Date style">${Object.entries(DATE_FORMATS).map(([v, n]) => `<option value="${v}"${fmt === v ? ' selected' : ''}>${n}</option>`).join('')}</select><button data-x="autodate" title="Go back to the automatic date">${(() => { const rr = dayFor(viewDate, activeId()); return rr && rr.dateText ? '<b>Typed date (won\'t change).</b> Use the automatic date' : 'Automatic date'; })()}</button>` : ''}
      <span class="sep"></span><select data-x="panel" aria-label="Box background">${PANELS.map(p => `<option value="${p}"${panel === p ? ' selected' : ''}>${PANEL_NAMES[p]}</option>`).join('')}</select>`;
    ftb.hidden = false; placeBar(); syncBar();
  }
  // the toolbar docks in a strip just above the slide, so it never covers anything on the board
  function syncBar(){
    if (!active || ftb.hidden) return;
    ['bold', 'italic', 'underline'].forEach(c => { const b = ftb.querySelector(`[data-x="${c}"]`); if (b) { let on = false; try { on = document.queryCommandState(c); } catch (e) {} b.setAttribute('aria-pressed', on); } });
    const k = active.closest('.region').dataset.k, f = active.dataset.f, lay = getLayout($('#stage').dataset.look);
    const cur = k.startsWith('x:') ? ((((lay.extras || []).find(x => 'x:' + x.id === k) || {}).style || '').match(/--ta:(\w+)/) || [])[1] || 'left'
      : f === 'heading' ? ((lay.styles || {}).board || {}).halign || 'center'
      : ((lay.styles || {})[k] || {}).align || (k === 'date' ? 'center' : 'left');
    ftb.querySelectorAll('[data-x="align"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === cur));
  }
  document.addEventListener('selectionchange', () => { if (active) syncBar(); });
  function placeBar(){ if (!active || ftb.hidden) return; const r = $('#stage').getBoundingClientRect(), w = ftb.offsetWidth;
    ftb.style.left = Math.max(8, r.left + (r.width - w) / 2) + 'px';
    // never over the menus or the editing toolbar: above the text if there's room, otherwise just below it
    const floor = (document.getElementById('rail') ? document.getElementById('rail').getBoundingClientRect().bottom : 0) + 6, h = ftb.offsetHeight;
    let top = r.top - h - 8; if (top < floor) top = r.bottom + 8 + h < innerHeight ? r.bottom + 8 : floor;
    ftb.style.top = top + 'px'; }
  function hideBar(){ ftb.hidden = true; active = null; }
  window.addEventListener('resize', placeBar); window.addEventListener('scroll', placeBar, true);
  const curLi = () => { const n = getSelection().anchorNode; const el = n && (n.nodeType === 1 ? n : n.parentElement); return el && el.closest ? el.closest('ul.lines > li') : null; };
  const collapsed = () => { const sel = getSelection(); return !sel.rangeCount || sel.getRangeAt(0).collapsed; };
  function setBoxStyle(k, patch){ const look = $('#stage').dataset.look, lay = ownLayout(look);
    if (k.startsWith('x:')) { const x = lay.extras.find(y => 'x:' + y.id === k); if (!x) return; const cur = {}; (x.style || '').split(';').forEach(p => { const [a, b] = p.split(':'); if (a && b) cur[a.trim()] = b.trim(); }); const m = { font: '--bf', size: '--sz', color: '--bc', align: '--ta', tj: '--tj' }; if (patch.align) patch.tj = JUST[patch.align]; Object.entries(patch).forEach(([a, b]) => { if (b == null) delete cur[m[a]]; else cur[m[a]] = b; }); x.style = Object.entries(cur).map(([a, b]) => a + ':' + b).join(';'); }
    else { lay.styles[k] = Object.assign({}, lay.styles[k] || {}, patch); }
    save(); }
  const fontStack = f => f === 'Georgia' ? 'Georgia' : `"${f}"`;
  ftb.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  const TEXT_COLORS = [['Deep',[['#1b1b1b','Black'],['#27468a','Navy blue'],['#1f6f8b','Teal'],['#3f7d2b','Forest green'],['#6a3d9a','Purple'],['#8b1e3f','Maroon'],['#7a4a1e','Brown'],['#4a5560','Slate']]],['Bright',[['#c4281c','Red'],['#e8590c','Orange'],['#f2b705','Gold'],['#2e9e4f','Green'],['#1e88e5','Blue'],['#00a0b0','Aqua'],['#d6338a','Pink'],['#7b5cd6','Violet']]],['Soft',[['#ffffff','White'],['#f7e7a8','Butter'],['#c9e8c4','Mint'],['#bcdcf5','Sky'],['#f6c6d6','Rose'],['#e2d4f5','Lavender'],['#fbd3a7','Peach'],['#d9d9d9','Light gray']]],['School',[['#1f7a3a','School green'],['#f5c400','School yellow'],['#ffffff','White']]]];
  let savedRange = null;
  ftb.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !active) return;
    if (b.dataset.x === 'cmenu') { const m = ftb.querySelector('.cmenu'); m.hidden = !m.hidden; return; }
    if (b.dataset.x === 'ccustom') { const sel = getSelection(); savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null; ftb.querySelector('.ccol').click(); return; }
    if (b.dataset.x === 'color') { const m = ftb.querySelector('.cmenu'); if (m) m.hidden = true; }
    fmtCmd(b.dataset.x, b.dataset.v); });
  ftb.addEventListener('input', e => { if (!e.target.classList.contains('ccol')) return; e.target.dataset.v = e.target.value; });
  ftb.addEventListener('change', e => { if (!e.target.classList.contains('ccol') || !active) return; const c = e.target.value;
    if (savedRange) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); savedRange = null; }
    const rc = (Suite.get('recentColors', []) || []).filter(x => x !== c); rc.unshift(c); Suite.set('recentColors', rc.slice(0, 8));
    const m = ftb.querySelector('.cmenu'); if (m) m.hidden = true; fmtCmd('color', c); });
  ftb.addEventListener('change', e => { const x = e.target.dataset.x; if (!active) return; if (x === 'font' && e.target.value) { fmtCmd('font', e.target.value); e.target.value = ''; } else if (x === 'panel' || x === 'datefmt') fmtCmd(x, e.target.value); });
  function fmtCmd(cmd, val){
    const el = active; if (!el) return;
    const k = el.closest('.region').dataset.k, f = el.dataset.f;
    el.focus(); document.execCommand('styleWithCSS', false, true);
    if (cmd === 'panel') { const look = $('#stage').dataset.look, lay = ownLayout(look); if (k.startsWith('x:')) lay.extras.find(x => 'x:' + x.id === k).panel = val; else lay.panels[k] = val; save(); return rerender(el); }
    if (cmd === 'align') {
      if (k.startsWith('x:')) setBoxStyle(k, { align: val });
      else if (f === 'heading') { const lay = ownLayout($('#stage').dataset.look); lay.styles.board = Object.assign({}, lay.styles.board || {}, { halign: val }); save(); }
      else setBoxStyle(k, { align: val });
      return rerender(el);
    }
    if (cmd === 'datefmt') { const look = $('#stage').dataset.look, lay = ownLayout(look); lay.styles.date = Object.assign({}, lay.styles.date || {}, { format: val }); const r = editable(viewDate, activeId()); delete r.dateText; save(); return rerender(el); }
    if (cmd === 'autodate') { const r = editable(viewDate, activeId()); delete r.dateText; save(); return rerender(el); }
    if (cmd === 'indent' || cmd === 'outdent') { const li = curLi(); if (li) { const lv = Math.max(0, Math.min(2, (+((li.className.match(/lv(\d)/) || [])[1] || 0)) + (cmd === 'indent' ? 1 : -1))); li.className = li.className.replace(/lv\d/, 'lv' + lv); syncNow(el); } return; }
    if (cmd === 'reveal') { const li = curLi(); if (li) { const on = li.dataset.reveal !== '1'; li.dataset.reveal = on ? '1' : '0'; li.classList.toggle('rv', on); syncNow(el); } return; }
    const whole = collapsed();
    if (cmd === 'color') {
      if (whole && f === 'lines') { const li = curLi(); if (li) { li.dataset.c = val; li.style.color = val; syncNow(el); } return; }
      if (whole) { setBoxStyle(k, { color: val }); return rerender(el); }
      document.execCommand('foreColor', false, val);
    }
    else if (cmd === 'font') { if (whole) { setBoxStyle(k, { font: fontStack(val) }); return rerender(el); } document.execCommand('fontName', false, val); }
    else if (cmd === 'bigger' || cmd === 'smaller') {
      if (whole) { const look = $('#stage').dataset.look, lay = getLayout(look), cur = k.startsWith('x:') ? parseFloat(((lay.extras.find(x => 'x:' + x.id === k) || {}).style || '').match(/--sz:([\d.]+)/)?.[1] || 1) : ((lay.styles || {})[k] || {}).size || 1;
        setBoxStyle(k, { size: Math.max(.5, Math.min(2.5, +(cur + (cmd === 'bigger' ? .1 : -.1)).toFixed(2))) }); return rerender(el); }
      const cur = parseInt(document.queryCommandValue('fontSize'), 10) || 3; document.execCommand('fontSize', false, String(Math.max(1, Math.min(7, cur + (cmd === 'bigger' ? 1 : -1)))));
    }
    else document.execCommand(cmd);
    syncNow(el); syncBar();
  }
  // redraw, then put the cursor back in the same box
  function rerender(el){ const k = el.closest('.region').dataset.k, f = el.dataset.f; return render().then(() => { const again = document.querySelector(`.region[data-k="${CSS.escape(k)}"] [data-f="${f}"]`); if (again) { again.focus(); showBar(again); } }); }
  // save what you type (no redraw while typing, so the cursor stays put)
  let syncTimer = null;
  function syncNow(el){
    const cid = activeId(), f = el.dataset.f; if (!f) return;
    if (f === 'x') { const lay = ownLayout($('#stage').dataset.look), x = lay.extras.find(y => y.id === el.dataset.x); if (x) x.html = clean(el.innerHTML); save(); return; }
    const r = editable(viewDate, cid);
    if (f === 'date') { const look = $('#stage').dataset.look, L = lookById(look), auto = fmtDate(viewDate, ((L.styles || {}).date || {}).format), txt = el.textContent.trim();
      if (!txt || txt === auto) {   // the same date: keep it automatic, and keep any color or font as the date's style
        delete r.dateText;
        const sp = el.querySelector('span[style], font'); if (sp) { const col = safeColor(sp.getAttribute('color') || sp.style.color), face = safeFont(sp.getAttribute('face') || sp.style.fontFamily); const patch = {}; if (col) patch.color = col; if (face) patch.font = face; if (Object.keys(patch).length) { const lay = ownLayout(look); lay.styles.date = Object.assign({}, lay.styles.date || {}, patch); } }
      } else r.dateText = clean(el.innerHTML); }
    else if (f === 'haveout') { const lis = [...el.querySelectorAll('li')].filter(li => li.textContent.trim());
      r.haveOut = lis.map(li => li.textContent.trim()); r.haveOutFmt = {};
      lis.forEach(li => { const h = clean(li.innerHTML); if (h !== esc(li.textContent.trim()) && /<(b|i|u|span)/.test(h)) r.haveOutFmt[li.textContent.trim()] = h; }); }
    else {
      const t = el.dataset.t; r.boards = r.boards || {}; const bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t));
      if (f === 'heading') bd.heading = clean(el.innerHTML);
      if (f === 'lines') bd.lines = [...el.children].filter(n => n.tagName === 'LI').map(li => ({ html: clean(li.innerHTML), text: li.textContent, level: +((li.className.match(/lv(\d)/) || [])[1] || 0), color: li.dataset.c || 'blue', reveal: li.dataset.reveal === '1' }));
    }
    save();
  }
  const stageEl = $('#stage');
  stageEl.addEventListener('input', e => { const el = e.target.closest('[data-f]'); if (!el) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncNow(el); fitAll(); }, 250); });
  stageEl.addEventListener('focusin', e => { const el = e.target.closest('[data-f]'); if (el && editMode) showBar(el); });
  stageEl.addEventListener('focusout', e => {
    const el = e.target.closest('[data-f]'); if (!el) return;
    clearTimeout(syncTimer); syncNow(el);
    setTimeout(() => { const now = document.activeElement; if (ftb.contains(now)) return; if (!now || !now.closest || !now.closest('#stage [data-f]')) { hideBar(); if (editMode) render(); } }, 120);
  });
  stageEl.addEventListener('keydown', e => {
    const el = e.target.closest('[data-f]'); if (!el) return;
    const f = el.dataset.f;
    if (e.key === 'Enter' && (f === 'date' || f === 'heading')) { e.preventDefault(); el.blur(); return; }
    if (e.key === 'Tab' && f === 'lines') { e.preventDefault(); fmtCmd(e.shiftKey ? 'outdent' : 'indent'); return; }
    if (e.key === 'Escape') { el.blur(); }
  });
  // paste as plain text so outside formatting doesn't come along
  stageEl.addEventListener('paste', e => { const el = e.target.closest('[data-f]'); if (!el) return; e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
  // drag ⠿ to move, drag the corner to resize (bitmoji, timer, and pictures move from anywhere)
  let drag = null;
  stageEl.addEventListener('pointerdown', e => {
    if (!editMode) return;
    const h = e.target.closest('[data-g]'); if (!h || h.dataset.g === 'xdel' || h.dataset.g === 'tdel' || h.dataset.g === 'pdel' || h.dataset.g === 'tset') return;
    if (e.target.closest('[data-f]')) return;
    const region = h.closest('.region'), k = h.dataset.k || region.dataset.k, r = stageEl.getBoundingClientRect(), look = stageEl.dataset.look, lay = ownLayout(look);
    if (e.shiftKey) { toggleAlign(k); e.preventDefault(); return; }   // Shift+click picks items to line up
    const box = getBoxK(k, look);
    // lines to snap to: the edges and centers of everything else, and the middle and edges of the screen
    const xs = [0, 960, 1920], ys = [0, 540, 1080];
    stageEl.querySelectorAll('.region').forEach(o => { if (o === region || o.closest('.lesson-tools')) return; const q2 = o.getBoundingClientRect(); const x1 = (q2.left - r.left) * 1920 / r.width, y1 = (q2.top - r.top) * 1080 / r.height, w2 = q2.width * 1920 / r.width, h2 = q2.height * 1080 / r.height; xs.push(x1, x1 + w2 / 2, x1 + w2); ys.push(y1, y1 + h2 / 2, y1 + h2); });
    drag = { k, region, look, resize: h.dataset.g === 'size', x: e.clientX, y: e.clientY, sx: 1920 / r.width, sy: 1080 / r.height, start: box.slice(), xs, ys };
    hideBar(); try { region.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
  });
  stageEl.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = (e.clientX - drag.x) * drag.sx, dy = (e.clientY - drag.y) * drag.sy, b = drag.start.slice();
    if (drag.resize) { b[2] = Math.max(80, b[2] + dx); b[3] = Math.max(50, b[3] + dy); } else { b[0] = Math.min(1880, Math.max(-b[2] + 40, b[0] + dx)); b[1] = Math.min(1050, Math.max(-b[3] + 30, b[1] + dy)); }
    // snap to nearby edges and centers (hold Alt to place freely)
    let gx = null, gy = null; const T2 = 12;
    if (!e.altKey) {
      const near = (vals, lines) => { let best = null; vals.forEach((v, i) => lines.forEach(l => { const dd = l - v; if (Math.abs(dd) <= T2 && (!best || Math.abs(dd) < Math.abs(best.d))) best = { d: dd, l, i }; })); return best; };
      if (drag.resize) { const sx2 = near([b[0] + b[2]], drag.xs), sy2 = near([b[1] + b[3]], drag.ys); if (sx2) { b[2] += sx2.d; gx = sx2.l; } if (sy2) { b[3] += sy2.d; gy = sy2.l; } }
      else { const sx2 = near([b[0], b[0] + b[2] / 2, b[0] + b[2]], drag.xs), sy2 = near([b[1], b[1] + b[3] / 2, b[1] + b[3]], drag.ys); if (sx2) { b[0] += sx2.d; gx = sx2.l; } if (sy2) { b[1] += sy2.d; gy = sy2.l; } }
    }
    if (drag.k !== 'bm') { if (drag.resize) { b[2] = Math.min(b[2], 1920 - b[0]); b[3] = Math.min(b[3], 1080 - b[1]); } else { b[0] = Math.max(0, Math.min(1920 - b[2], b[0])); b[1] = Math.max(0, Math.min(1080 - b[3], b[1])); } }
    showGuides(gx, gy);
    drag.box = b.map(Math.round); if (drag.resize) requestAnimationFrame(fitAll); const keep = drag.region.getAttribute('style').replace(/left:[^;]*;top:[^;]*;width:[^;]*;height:[^;]*/, ''); drag.region.setAttribute('style', place(drag.box) + ';' + keep.replace(/^;/, ''));
  });
  stageEl.addEventListener('pointerup', () => {
    showGuides(null, null);
    if (!drag) return; const d = drag; drag = null; if (!d.box) return;
    if (d.k.startsWith('p:')) { setBoxK(d.k, d.box, d.look); save(); render(); return; }
    const lay = ownLayout(d.look);
    if (d.k.startsWith('t:')) { const r = editable(viewDate, activeId()), t = stageEl.dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); const w = (bd.tools || []).find(x => 't:' + x.id === d.k); if (w) w.box = d.box; }
    else if (d.k.startsWith('x:')) lay.extras.find(x => 'x:' + x.id === d.k).box = d.box;
    else if (d.k === 'bm') { const id = roomFor(viewDate, activeId()).bitmoji, adj = bmAdj(id), base = getLayout(d.look).boxes.bm; lay.boxes.bm = [d.box[0] - adj.dx, d.box[1] - base[3] * (1 - adj.scale / 100) + (base[3] - d.box[3] * 100 / adj.scale) * (1 - adj.scale / 100) * 0, d.box[2], Math.round(d.box[3] * 100 / adj.scale)]; lay.boxes.bm[1] = Math.round(d.box[1] + d.box[3] - lay.boxes.bm[3]); }
    else lay.boxes[d.k] = d.box;
    save(); render();
  });
  stageEl.addEventListener('click', e => { const ts = e.target.closest('[data-g="tset"]'); if (!ts || !editMode) return;
    const r = editable(viewDate, activeId()), t = stageEl.dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)), w = (bd.tools || []).find(x => x.id === ts.dataset.id); if (!w) return;
    const back = document.createElement('div'); back.className = 'suite-dialog-back';
    back.innerHTML = `<div class="suite-dialog" role="dialog" aria-modal="true"><h2>Seating chart</h2>
      <label class="lb" for="sh-h">Heading <span class="muted small">(optional)</span></label><input class="field" id="sh-h" style="width:100%" value="${esc(w.heading || '')}" placeholder="New seats! Find your name">
      <label class="rv" style="display:flex;gap:6px;margin-top:10px"><input type="checkbox" id="sh-f"${w.front === 'bottom' ? ' checked' : ''}> Front of the room at the bottom</label>
      <div class="suite-dialog-actions"><button class="btn" data-r="no">Cancel</button><button class="btn primary" data-r="yes">Save</button></div></div>`;
    document.body.appendChild(back);
    back.addEventListener('click', ev => { if (ev.target === back || ev.target.closest('[data-r="no"]')) return back.remove(); if (!ev.target.closest('[data-r="yes"]')) return;
      w.heading = back.querySelector('#sh-h').value.trim(); w.front = back.querySelector('#sh-f').checked ? 'bottom' : 'top'; back.remove(); save(); render(); });
  });
  stageEl.addEventListener('click', e => { const td = e.target.closest('[data-g="tdel"]'); if (td && editMode) { const r = editable(viewDate, activeId()), t = stageEl.dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); bd.tools = (bd.tools || []).filter(w => w.id !== td.dataset.x); save(); render(); return; } });
  stageEl.addEventListener('click', e => { const pd = e.target.closest('[data-g="pdel"]'); if (!pd || !editMode) return; const r = editable(viewDate, activeId()), t = stageEl.dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); bd.pics = (bd.pics || []).filter(p2 => p2.id !== pd.dataset.p); save(); render(); });
  stageEl.addEventListener('click', e => { const x = e.target.closest('[data-g="xdel"]'); if (!x || !editMode) return; const lay = ownLayout(stageEl.dataset.look); lay.extras = lay.extras.filter(y => y.id !== x.dataset.x); save(); render(); });


  // add a board to other classes: linked (one board) or separate copies; every day or just this day
  function keyClass(key){ if (!key.startsWith('course:')) return key; const co = Suite.courses().find(x => 'course:' + x.id === key); return co && co.classIds[0]; }
  function shareBoard(cid, t){
    const rows = Suite.courses().map(co => ['course:' + co.id, co.name]).concat(classes().filter(c => !Suite.courseOf(c.id)).map(c => [c.id, c.name])).filter(([k]) => k !== (scope === 'period' ? cid : rowKeyOf(cid)));
    if (!rows.length) { Suite.toast('There are no other classes to add it to'); return; }
    const back = document.createElement('div'); back.className = 'suite-dialog-back';
    back.innerHTML = `<div class="suite-dialog" role="dialog" aria-modal="true" style="max-width:520px"><h2>Use "${esc(boardLabel(dayFor(viewDate, cid), t))}" in other classes</h2>
      <p style="font-weight:700;margin:8px 0 4px">Add it to</p>${rows.map(([k, n]) => `<label class="rv" style="display:flex;gap:6px"><input type="checkbox" class="sh-k" value="${esc(k)}"> ${esc(n)}</label>`).join('')}
      <p style="font-weight:700;margin:12px 0 4px">How</p>
      <label class="rv" style="display:flex;gap:6px"><input type="radio" name="shm" value="link" checked> Linked: one board for all of them (change it once, it updates everywhere)</label>
      <label class="rv" style="display:flex;gap:6px"><input type="radio" name="shm" value="copy"> Separate copies (each class can change its own)</label>
      <p style="font-weight:700;margin:12px 0 4px">When</p>
      <label class="rv" style="display:flex;gap:6px"><input type="radio" name="shw" value="usual" checked> Every day (their usual setup)</label>
      <label class="rv" style="display:flex;gap:6px"><input type="radio" name="shw" value="day"> Just ${esc(longDate(viewDate))}</label>
      <div class="suite-dialog-actions"><button class="btn" data-s="x">Cancel</button><button class="btn primary" data-s="go">Add it</button></div></div>`;
    document.body.appendChild(back);
    back.addEventListener('click', e => {
      if (e.target === back || e.target.closest('[data-s="x"]')) return back.remove();
      if (!e.target.closest('[data-s="go"]')) return;
      const keys = [...back.querySelectorAll('.sh-k:checked')].map(x => x.value); if (!keys.length) { Suite.toast('Pick at least one class'); return; }
      const how = back.querySelector('input[name="shm"]:checked').value, when = back.querySelector('input[name="shw"]:checked').value;
      const board = clone(boardOf(dayFor(viewDate, cid), t));
      let id = t;
      if (how === 'link' && !t.startsWith('L-')) {   // move this board into My boards and link it here too
        T.library = T.library || []; const it = { id: Suite.uid(), name: String(board.heading || 'My board').replace(/<[^>]+>/g, '').trim() || 'My board', from: t, board };
        T.library.push(it); id = 'L-' + it.id;
        const r = editable(viewDate, cid); r.lineup = r.lineup.map(x => x === t ? id : x); if (r.boards) delete r.boards[t];
        const u = usual(cid); if ((u.lineup || []).includes(t)) { u.lineup = u.lineup.map(x => x === t ? id : x); if (u.boards) delete u.boards[t]; }
      }
      const oldScope = scope;
      keys.forEach(k => {
        const kc = keyClass(k); if (!kc) return;
        const newId = how === 'link' ? id : 'c-' + Suite.uid();
        if (when === 'usual') { const u = usual(kc); u.lineup = u.lineup || []; if (!u.lineup.includes(newId)) u.lineup.push(newId); if (how === 'copy') { u.boards = u.boards || {}; u.boards[newId] = clone(board); } }
        else { scope = k.startsWith('course:') ? 'course' : 'period'; const r = editable(viewDate, kc); if (!r.lineup.includes(newId)) r.lineup.push(newId); if (how === 'copy') { r.boards = r.boards || {}; r.boards[newId] = clone(board); } }
      });
      scope = oldScope;
      back.remove(); commit(true); Suite.toast(`Added to ${keys.length} class${keys.length === 1 ? '' : 'es'}${how === 'link' ? ' (linked)' : ''}`);
    });
  }



  /* ---------- the board editor ("studio"): one board, on a scratch copy that's copied back to where it lives ---------- */
  const SBOX = '2099-12-31', SID = 'c-studio';
  let STUDIO = null;   // { kind: 'lib'|'row'|'day', id, k, d, cid, peek }
  function studioTarget(){
    if (!STUDIO) return null;
    if (STUDIO.kind === 'lib') { const it = (T.library || []).find(x => x.id === STUDIO.id); return it ? { get: () => it.board, set: b => { it.board = b; it.name = b.name || it.name; } } : null; }
    if (STUDIO.kind === 'row') { const r = (T.rows || {})[STUDIO.k]; return r && r.boards && r.boards[STUDIO.id] ? { get: () => r.boards[STUDIO.id], set: b => { r.boards[STUDIO.id] = b; } } : null; }
    const r = ((T.days || {})[STUDIO.d] || {})[STUDIO.k]; return r && r.boards && r.boards[STUDIO.id] ? { get: () => r.boards[STUDIO.id], set: b => { r.boards[STUDIO.id] = b; } } : null;
  }
  function studioLoad(){   // put the board on the scratch day for the preview class
    const tg = studioTarget(); if (!tg) return false;
    const b = clone(tg.get() || {}); if (!b.name && STUDIO.kind === 'lib') { const it = T.library.find(x => x.id === STUDIO.id); b.name = it && it.name; }
    const dayRec = STUDIO.kind === 'day' ? ((T.days[STUDIO.d] || {})[STUDIO.k] || {}) : null;
    T.days[SBOX] = { [STUDIO.cid]: { lineup: [SID], haveOut: ((dayRec && dayRec.haveOut) || usual(STUDIO.cid).haveOut || []).slice(), boards: { [SID]: b }, slideLink: '' } };
    return true;
  }
  function studioSync(){   // copy the scratch board back to its real home
    const tg = studioTarget(), sb = ((T.days[SBOX] || {})[STUDIO.cid] || {}).boards; if (!tg || !sb || !sb[SID]) return;
    tg.set(clone(sb[SID]));
  }
  function studioWhere(){
    const nm = k => { if (String(k).startsWith('course:')) { const co = Suite.courses().find(x => 'course:' + x.id === k); return co ? co.name : k; } const c = classes().find(x => x.id === k); return c ? c.name : k; };
    if (STUDIO.kind === 'row') return nm(STUDIO.k) + ': every day';
    if (STUDIO.kind === 'day') return nm(STUDIO.k) + ': ' + longDate(STUDIO.d).replace(/,? \d{4}$/, '') + ' only';
    const id = 'L-' + STUDIO.id, w = [];
    Object.entries(T.rows || {}).forEach(([k, r]) => { if ((r.lineup || []).includes(id)) w.push(nm(k)); });
    return w.length ? 'Linked: ' + w.join(', ') + ' (changes show in all of them)' : 'Saved in My boards';
  }
  function studioRail(){
    const b = (((T.days[SBOX] || {})[STUDIO.cid] || {}).boards || {})[SID] || {};
    return `<div class="rrow r1 studiobar"><span class="st-name">Editing: <b>${esc(b.name || plainOf(b.heading) || 'Board')}</b></span><button class="btn small quiet" data-a="strename">Rename</button>
      <span class="st-where">${esc(studioWhere())}</span>
      <label class="small st-prev">Preview with <select data-a2="stprev">${classes().map(c => `<option value="${esc(c.id)}"${c.id === STUDIO.cid ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <a class="btn primary" href="boards.html">Done</a></div>`;
  }
  // the editing helpers: a linked-board notice, Board options (collapsed), Align (only while boxes are picked), tips (once)
  let edOpts = false, edTips = !Suite.get('edtipsSeen', false);
  function edFloat(cid, S){
    if (!editMode) return '';
    const t = S[boardNo] || '', notice = STUDIO ? '' : sharedNotice(cid, t);
    const opts = cid && t ? (() => { const bd = boardOf(dayFor(viewDate, cid), t), h = bd.hide || {};
      const items = boardItems(cid, t);
      return `<div class="edopt"><button class="btn small quiet" data-a="edopts" aria-expanded="${edOpts}">Board options ${edOpts ? '▾' : '▴'}</button>${edOpts ? `${isCustom(t) ? `<div class="pieces" role="group" aria-label="Pieces on this board"><span class="small muted">Show:</span>${[['date', 'Date'], ['board', 'Main board'], ['cork', 'Have out'], ['bm', 'Bitmoji'], ['pic', 'Picture']].map(([k, n]) => `<label><input type="checkbox" data-a="piece" data-k="${k}"${h[k] ? '' : ' checked'}> ${n}</label>`).join('')}</div>` : ''}
        <div class="items"><span class="small muted">On this board:</span>${items.length ? items.map(it => `<span class="item">${esc(it.label)}<button class="btn quiet danger small" data-a="itemdel" data-kind="${it.kind}" data-id="${esc(it.id)}" aria-label="Remove ${esc(it.label)}">Remove</button></span>`).join('') : '<span class="small muted">No added text boxes, tools, or pictures.</span>'}</div>` : ''}</div>`; })() : '';
    const align = alignSel.size ? `<div class="bar alignbar"><span class="small"><b>${alignSel.size}</b> picked. Align ${alignSel.size === 1 ? 'to the screen' : 'together'}:</span>${[['left', 'Left'], ['hcenter', 'Center'], ['right', 'Right'], ['top', 'Top'], ['vmiddle', 'Middle'], ['bottom', 'Bottom']].map(([k, n]) => `<button class="btn small" data-a="align" data-v="${k}">${n}</button>`).join('')}<button class="btn quiet small" data-a="alignclear">Clear</button></div>` : '';
    const tips = edTips ? `<div class="edtips"><p>Click any text to type. Drag <b>⠿</b> to move a box, and its corner to resize. Boxes snap to each other as you drag (hold Alt to place freely). Shift+click boxes to line them up. Changes save as you go.</p><button class="btn small primary" data-a="edtipsok">Got it</button></div>` : '';
    return notice || align || tips || opts ? `<div class="edfloat">${notice}${tips}${align}${opts}</div>` : '';
  }
  const S0cur = () => screens(viewDate, activeId())[boardNo];
  // ---- while editing a board that also shows on other days or in other classes, say so ----
  function sharedNotice(cid, t){
    if (!t || !String(t).startsWith('L-')) return '';
    const it = (T.library || []).find(x => 'L-' + x.id === t); if (!it) return '';
    const where = new Set(); const nm = k => { if (k.startsWith('course:')) { const co = Suite.courses().find(x => 'course:' + x.id === k); return co ? co.name : k; } const c = classes().find(x => x.id === k); return c ? c.name : k; };
    Object.entries(T.rows || {}).forEach(([k, r]) => { if ((r.lineup || []).includes(t)) where.add(nm(k) + ' (every day)'); });
    Object.entries(T.days || {}).forEach(([d, day]) => { if (d < Suite.dateKey(new Date())) return; Object.entries(day).forEach(([k, r]) => { if ((r.lineup || []).includes(t) && !(((T.rows || {})[k] || {}).lineup || []).includes(t)) where.add(nm(k) + ' (' + longDate(d).replace(/,? \d{4}$/, '') + ')'); }); });
    return `<div class="shnote"><b>This board is linked</b> and shows in: ${[...where].slice(0, 4).map(esc).join(', ')}${where.size > 4 ? ` and ${where.size - 4} more` : ''}. Changes show everywhere it's used. <button class="btn small" data-a="unlinkday">Just change it for ${esc(longDate(viewDate).replace(/,? \d{4}$/, ''))}</button></div>`;
  }
  // ---- everything added to this board (text boxes, tools, pictures, tools on every board), for Board options ----
  function boardItems(cid, t){
    const out = [], look = stageEl.dataset.look, lay = look ? getLayout(look) : { extras: [] }, bd = boardOf(dayFor(viewDate, cid), t);
    (lay.extras || []).forEach((x, i) => { const txt = plainOf(x.html || x.text || ''); out.push({ kind: 'x', id: x.id, label: 'Text box' + (txt ? ': ' + txt.slice(0, 24) + (txt.length > 24 ? '…' : '') : ' ' + (i + 1)) }); });
    (bd.tools || []).forEach(w => out.push({ kind: 't', id: w.id, label: (WIDGETS[w.kind] || ['Tool'])[0] }));
    (bd.pics || []).forEach((p2, i) => out.push({ kind: 'p', id: p2.id, label: 'Picture ' + (i + 1) }));
    (usual(cid).boardTools || []).forEach(w => out.push({ kind: 'b', id: w.id, label: (WIDGETS[w.kind] || ['Tool'])[0] + ' (every board)' }));
    return out;
  }
  function removeItem(kind, id){
    const cid = activeId(), t = stageEl.dataset.type, look = stageEl.dataset.look;
    if (kind === 'x') { const lay = ownLayout(look); lay.extras = lay.extras.filter(y => y.id !== id); }
    else if (kind === 't' || kind === 'p') { const r = editable(viewDate, cid); r.boards = r.boards || {}; const bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); if (kind === 't') bd.tools = (bd.tools || []).filter(w => w.id !== id); else bd.pics = (bd.pics || []).filter(p2 => p2.id !== id); }
    else if (kind === 'b') { const u = usual(cid); u.boardTools = (u.boardTools || []).filter(w => w.id !== id); }
    save(); render(); Suite.toast('Removed. Undo brings it back.');
  }
  // ---- rescue: pull anything that's partly off the board back on (never the bitmoji, which may sit low) ----
  const fitBox = b => { if (!Array.isArray(b) || b.length < 4) return null; const w = Math.min(b[2], 1920), h = Math.min(b[3], 1080), x = Math.max(0, Math.min(1920 - w, b[0])), y = Math.max(0, Math.min(1080 - h, b[1])); return (x !== b[0] || y !== b[1] || w !== b[2] || h !== b[3]) ? [x, y, w, h] : null; };
  function rescue(){
    if (lesson || STUDIO && STUDIO.peek) return; const cid = activeId(), t = stageEl.dataset.type, look = stageEl.dataset.look; if (!cid || !t || !look) return;
    let changed = false; const fix = o => { const f = fitBox(o.box); if (f) { o.box = f; changed = true; } };
    // fix things where they're saved (everyday setup, this day, or My boards), so they stay fixed
    const bd = boardOf(dayFor(viewDate, cid), t);
    (bd.tools || []).forEach(fix); (bd.pics || []).forEach(fix);
    const bk = boardKey(look), ownL = bk ? (boardOf(dayFor(viewDate, cid), bk) || {}).layout : T.layouts[fixLook(look)];
    if (ownL) { Object.keys(ownL.boxes || {}).forEach(k => { if (k === 'bm') return; const f = fitBox(ownL.boxes[k]); if (f) { ownL.boxes[k] = f; changed = true; } }); (ownL.extras || []).forEach(fix); }
    const u = usual(cid); ['boardTools', 'lessonTools'].forEach(n => (u[n] || []).forEach(fix));
    if (changed) { save(); render(); Suite.toast('Moved something back onto the board'); }
  }
  // ---- one place to read or write any item's position (layout boxes, text boxes, tools, pictures) ----
  function getBoxK(k, look){
    const bd = boardOf(dayFor(viewDate, activeId()), stageEl.dataset.type), lay = getLayout(look);
    if (k.startsWith('t:')) return ((bd.tools || []).find(w => 't:' + w.id === k) || {}).box;
    if (k.startsWith('p:')) return ((bd.pics || []).find(p2 => 'p:' + p2.id === k) || {}).box;
    if (k.startsWith('x:')) return (lay.extras.find(x => 'x:' + x.id === k) || {}).box;
    return lay.boxes[k] || (ownLayout(look).boxes || {})[k];
  }
  function setBoxK(k, box, look){
    if (k.startsWith('t:') || k.startsWith('p:')) { const r = editable(viewDate, activeId()), t = stageEl.dataset.type, bd = r.boards[t] = r.boards[t] || clone(boardOf(r, t)); const arr = k.startsWith('t:') ? (bd.tools || []) : (bd.pics || []); const it = arr.find(x => (k.startsWith('t:') ? 't:' : 'p:') + x.id === k); if (it) it.box = box; return; }
    const lay = ownLayout(look);
    if (k.startsWith('x:')) { const x = lay.extras.find(y => 'x:' + y.id === k); if (x) x.box = box; } else lay.boxes[k] = box;
  }
  // ---- snap guide lines ----
  function showGuides(gx, gy){
    ['v', 'h'].forEach(dir => { let el = stageEl.querySelector('.snapline.' + dir); const val = dir === 'v' ? gx : gy;
      if (val == null) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.className = 'snapline ' + dir; stageEl.appendChild(el); }
      if (dir === 'v') el.style.left = (val / 19.2) + '%'; else el.style.top = (val / 10.8) + '%'; });
  }
  // ---- align: Shift+click items, then line them up (one item lines up with the screen) ----
  const alignSel = new Set();
  function toggleAlign(k){ if (k === 'bm') return; if (alignSel.has(k)) alignSel.delete(k); else alignSel.add(k); markAlign(); renderRail(activeId()); }
  function markAlign(){ stageEl.querySelectorAll('.region[data-k]').forEach(r2 => r2.classList.toggle('alsel', alignSel.has(r2.dataset.k))); }
  function doAlign(how){
    const look = stageEl.dataset.look, items = [...alignSel].map(k => [k, getBoxK(k, look)]).filter(x => x[1]); if (!items.length) return;
    const one = items.length === 1;
    const x0 = one ? 0 : Math.min(...items.map(([, b]) => b[0])), x1 = one ? 1920 : Math.max(...items.map(([, b]) => b[0] + b[2]));
    const y0 = one ? 0 : Math.min(...items.map(([, b]) => b[1])), y1 = one ? 1080 : Math.max(...items.map(([, b]) => b[1] + b[3]));
    items.forEach(([k, b0]) => { const b = b0.slice();
      if (how === 'left') b[0] = x0; else if (how === 'right') b[0] = x1 - b[2]; else if (how === 'hcenter') b[0] = Math.round((x0 + x1) / 2 - b[2] / 2);
      else if (how === 'top') b[1] = y0; else if (how === 'bottom') b[1] = y1 - b[3]; else if (how === 'vmiddle') b[1] = Math.round((y0 + y1) / 2 - b[3] / 2);
      setBoxK(k, b, look); });
    save(); render();
  }
