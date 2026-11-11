/* Today page, part 2 of 7: The Day settings drawer (the panel that edits one day for one class).
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  /* ---------- the editing drawer ---------- */
  const isSchool = k => { const [y, m, d] = k.split('-').map(Number); return Suite.scheduleFor(new Date(y, m - 1, d, 12)).periods.length > 0; };
  const shiftDay = (k, dir) => { const [y, m, d] = k.split('-').map(Number), x = new Date(y, m - 1, d, 12); for (let i = 0; i < 30; i++) { x.setDate(x.getDate() + dir); if (isSchool(Suite.dateKey(x))) break; } return Suite.dateKey(x); };
  let dTab = sessionStorage.getItem('suite:daytab') || 'boards';
  function renderDrawer(){
    const cid = activeId(); if (!cid) return;
    const rec = dayFor(viewDate, cid), u = usual(cid), co = Suite.courseOf(cid), c = classes().find(x => x.id === cid), room = roomFor(viewDate, cid);
    const dayOwn = (T.days[viewDate] || {})[scope === 'period' ? cid : rowKeyOf(cid)] || {};
    const lookOpts = (v, blank) => (blank ? `<option value="">${blank}</option>` : '') + Object.entries(LOOKS).concat(Object.entries(T.custom)).map(([k, x]) => `<option value="${k}"${v === k ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
    const bmOpts = (v, blank) => (blank ? `<option value="">${blank}</option>` : '') + `<option value="none"${v === 'none' ? ' selected' : ''}>No bitmoji</option>` + Object.keys(BITMOJI).concat(Object.keys(T.bitmojis)).map(k => `<option value="${k}"${v === k ? ' selected' : ''}>${esc(bmName(k))}</option>`).join('');
    const ownExists = !!((T.days[viewDate] || {})[cid]);
    if (!co) scope = 'course';
    const lineup = rec.lineup.filter(t => BOARDS[t] || isCustom(t));
    const all = lineup.concat(Object.keys(BOARDS).filter(t => !lineup.includes(t)));
    const customs = lineup.filter(isCustom);
    $('#drawer').dataset.tab = dTab;
    $('#drawer').innerHTML = `<div class="dhead"><h2>Day settings: ${esc(rowName(cid))}</h2><button class="btn quiet" data-d="close" aria-label="Close">×</button></div>
      <div class="dbody">
        <p class="hintline" style="margin-top:0">Settings for every class (bell reminder, backgrounds, bitmojis, My boards) are in <a href="settings.html#today">Settings → Today screen</a>.</p>
        <div class="daynav"><button class="btn small" data-d="day" data-dir="-1" aria-label="Previous school day">‹</button><b>${esc(longDate(viewDate))}</b><button class="btn small" data-d="day" data-dir="1" aria-label="Next school day">›</button>${viewDate !== Suite.dateKey(new Date()) ? '<button class="btn quiet small" data-d="today">Today</button>' : ''}</div>
        ${co ? `<div class="scope">Changes apply to <select data-d="scope"><option value="course"${scope === 'course' ? ' selected' : ''}>all of ${esc(co.name)}</option><option value="period"${scope === 'period' ? ' selected' : ''}>${esc(c.name)} only</option></select>${ownExists ? `<div class="hintline">${esc(c.name)} has its own setup this day. <a href="#" data-d="unown">Use the course setup again</a></div>` : ''}</div>` : ''}
        <div class="bar" style="margin:8px 0 2px"><a class="btn small" href="planner.html#date=${viewDate}&class=${encodeURIComponent(cid)}&from=today">Plan this day</a><button class="btn small" data-d="movetext">Edit on screen</button></div>
        <p class="hintline" style="margin:2px 0 4px">The plan, student boards, and slides come from the Planner; arrange the boards with Edit on screen.</p>
        <div class="dtabs" role="tablist" aria-label="Day settings">${''}${[['boards', 'Boards'], ['look', 'Look'], ['routines', 'Routines'], ['events', 'Events']].map(([k, n]) => `<button role="tab" data-d="dtab" data-v="${k}" aria-selected="${dTab === k}">${n}</button>`).join('')}</div>
        <p class="hintline bdlink" style="margin:0 0 6px"><a href="boards.html">See all your boards</a>: rename them, edit their words, and see where each one is used.</p>
        <details class="sec" data-dt="boards" open><summary>Boards and order <span class="muted small">${lineup.length} boards</span></summary>
          <ul class="lineup">${all.map(t => { const on = lineup.includes(t); return `<li>
            <input type="checkbox" data-d="lineup" data-t="${esc(t)}"${on ? ' checked' : ''} aria-label="Show ${esc(boardLabel(rec, t))}"><span>${esc(boardLabel(rec, t))}${t.startsWith('L-') ? ' <span class="muted small">(linked)</span>' : isCustom(t) ? ' <span class="muted small">(custom)</span>' : ''}</span>
            ${on ? `<button class="btn quiet" data-d="up" data-t="${esc(t)}" aria-label="Move up">↑</button><button class="btn quiet" data-d="down" data-t="${esc(t)}" aria-label="Move down">↓</button>` : ''}${isCustom(t) ? `<button class="btn quiet small" data-d="cren" data-t="${esc(t)}" title="Rename this board (the name in lists, not what students see)">Rename</button>` : ''}<button class="btn quiet small" data-d="cdup" data-t="${esc(t)}" title="Make a copy of this board (same look and layout)">Duplicate</button>${isCustom(t) ? `<button class="btn quiet danger" data-d="crm" data-t="${esc(t)}" aria-label="Delete this board">×</button>` : ''}</li>`; }).join('')}</ul>
          <div class="bar" style="margin-top:6px"><button class="btn small" data-d="cadd">Add a custom board</button>${(T.library || []).length ? `<select data-d="libadd" aria-label="Add a saved board"><option value="">Add a copy of a saved board…</option>${T.library.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}</select><select data-d="liblink" aria-label="Add a linked board"><option value="">Add a linked board…</option>${T.library.map(x => `<option value="${esc(x.id || '')}">${esc(x.name)}</option>`).join('')}</select>` : ''}</div>
          <p class="hintline">Empty boards are skipped in class. Custom boards can have a picture and their own background, and any line can stay hidden until you click (in Edit on screen, use "Hide until click").</p></details>
        ${customs.length ? `<details class="sec" data-dt="boards" open><summary>Custom boards</summary>${customs.map(t => { const bd = boardOf(rec, t); return `<div class="cboard"><b>${esc(boardLabel(rec, t))}</b>
            <div class="bar" style="margin-top:4px"><label class="btn small">${bd.pic ? 'Change picture' : 'Add a picture'}<input type="file" accept="image/*" data-d="cpic" data-t="${esc(t)}" hidden></label>${bd.pic ? `<button class="btn quiet small" data-d="cpicrm" data-t="${esc(t)}">Remove picture</button>` : ''}</div>
            <div class="bar" style="margin-top:4px"><button class="btn small" data-d="cshare" data-t="${esc(t)}" title="Add this board to other classes, linked or as a copy">Use in other classes…</button>${t.startsWith('L-') ? '<span class="muted small">Linked: changes show in every class that uses it.</span>' : ''}</div>
            <div class="bar" style="margin-top:4px"${t.startsWith('L-') ? ' hidden' : ''}><button class="btn small" data-d="libsave" data-t="${esc(t)}">${(T.library || []).some(x => x.from === t) ? 'Update in My boards' : 'Save to My boards'}</button></div>
            <label class="lb">Background for this board<select data-d="clook" data-t="${esc(t)}"><option value="">Same as the other boards</option>${Object.entries(LOOKS).concat(Object.entries(T.custom)).map(([k, x]) => `<option value="${k}"${bd.look === k ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></div>`; }).join('')}
          <p class="hintline"><b>Save to My boards</b> keeps a board, with its layout, text, and picture, so you can add it to any day later. To show it every day, use "Save as the usual setup."</p>
          ${(T.library || []).length ? `<span class="lb">My boards</span><ul class="lineup">${T.library.map((x, i) => `<li><span>${esc(x.name)}</span><button class="btn quiet danger" data-d="librm" data-i="${i}" aria-label="Delete ${esc(x.name)} from My boards">×</button></li>`).join('')}</ul>` : ''}</details>` : ''}
        <details class="sec" data-dt="look" open><summary>Background and bitmoji <span class="muted small">${esc(lookById(room.look).name)} · ${room.bitmoji === 'none' ? 'no bitmoji' : esc(bmName(room.bitmoji))}</span></summary>
          <span class="lb">Usual for ${esc(rowName(cid))}</span>
          <div class="bmrow"><select data-d="look" aria-label="Usual background">${lookOpts(fixLook(u.look))}</select><select data-d="bm" aria-label="Usual bitmoji">${bmOpts(u.bitmoji || 'none')}</select></div>
          ${room.look === 'solid' ? `<label class="lb">Background color <input type="color" data-d="bgcolor" value="${esc(u.bgColor || '#dfe8ee')}"></label>` : ''}
          <span class="lb">Just this day</span>
          <div class="bmrow"><select data-d="daylook" aria-label="Background this day">${lookOpts(dayOwn.look || '', 'Usual background')}</select><select data-d="daybm" aria-label="Bitmoji this day">${bmOpts(dayOwn.bitmoji || '', 'Usual bitmoji')}</select></div>
          <p class="hintline">${room.pu ? `Right now the unit <b>${esc(room.pu.name)}</b> sets this class's look. ` : ''}Unit backgrounds and bitmojis are set in the Planner (Units).</p>
          ${room.bitmoji !== 'none' ? `<span class="lb">Fit ${esc(bmName(room.bitmoji))} <span class="muted small">(saved for this bitmoji)</span></span>
          <div class="bmrow"><label class="small">Size <input type="range" min="60" max="130" data-d="bmscale" value="${bmAdj(room.bitmoji).scale}"></label><label class="small">Left or right <input type="range" min="-200" max="300" data-d="bmdx" value="${bmAdj(room.bitmoji).dx}"></label></div>` : ''}
          <p class="hintline">Add or remove backgrounds and bitmojis in <a href="settings.html#today">Settings → Today screen</a>.</p></details>
        ${(() => { const f = usual(cid).fx || {}, mode = f.mode || 'auto', se = seasonFor(viewDate), lineupNow = screens(viewDate, cid);
          return `<details class="sec" data-dt="look" open><summary>Seasonal effect <span class="muted small">${mode === 'off' ? 'off' : mode === 'pick' ? esc((Suite.FX_KINDS[f.effect] || 'chosen').split(' (')[0]) : se ? 'calendar: ' + esc(se.name) : 'calendar'}</span></summary>
          <label class="rv" style="display:flex;gap:6px"><input type="radio" name="fxm" data-d="fxmode" value="auto"${mode === 'auto' ? ' checked' : ''}> Use the seasonal calendar (<a href="settings.html#today">edit it</a>)${se ? ` <span class="muted small">now: ${esc(se.name)}</span>` : ''}</label>
          <label class="rv" style="display:flex;gap:6px"><input type="radio" name="fxm" data-d="fxmode" value="off"${mode === 'off' ? ' checked' : ''}> Off for this class</label>
          <label class="rv" style="display:flex;gap:6px"><input type="radio" name="fxm" data-d="fxmode" value="pick"${mode === 'pick' ? ' checked' : ''}> Choose one for this class</label>
          ${mode === 'pick' ? `<div class="fxpick">
            <label class="lb">Effect <select data-d="fxeff">${Object.entries(Suite.FX_KINDS).map(([k, n]) => `<option value="${k}"${(f.effect || 'snow') === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
            <label class="lb">Show it on <select data-d="fxwhere"><option value="all"${f.where !== 'board' ? ' selected' : ''}>All boards</option>${lineupNow.filter(t => t !== 'lesson').map(t => `<option value="b:${esc(t)}"${f.where === 'board' && f.board === t ? ' selected' : ''}>Just: ${esc(boardLabel(dayFor(viewDate, cid), t))}</option>`).join('')}</select></label>
            <label class="lb">Size <select data-d="fxsize">${[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([k, n]) => `<option value="${k}"${(f.size || FX_DEF_SIZE[f.effect] || 'medium') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="lb">Amount <select data-d="fxamt">${[['light', 'Light'], ['medium', 'Medium'], ['lots', 'Lots']].map(([k, n]) => `<option value="${k}"${(f.amount || 'light') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="rv"><input type="checkbox" data-d="fxslides"${f.overSlides ? ' checked' : ''}> Also over the lesson slides</label>
            <label class="lb">Background <select data-d="fxlook">${lookOpts(f.look || '', 'Keep the usual')}</select></label>
            <label class="lb">Bitmoji <select data-d="fxbm">${bmOpts(f.bitmoji || '', 'Keep the usual')}</select></label></div>` : ''}
          <p class="hintline">Tools ▾ → "Seasonal effects on / off" turns every effect off for a test or a serious moment.</p></details>`; })()}
        <details class="sec" data-dt="events" open><summary>School events <span class="muted small">${u.showEvents ? 'shown' : 'off'}</span></summary>
          <label class="rv" style="display:flex;gap:6px"><input type="checkbox" data-d="evon"${u.showEvents ? ' checked' : ''}> Show today's school events from the Planner (like picture day) on the boards</label>
          <p class="hintline">Optional. Place the events strip with Edit on screen.</p></details>
        ${(() => { const D = usual(cid).duties || {}, list = D.list || [];
          return `<details class="sec" data-dt="routines"${list.length ? '' : ''}><summary>Clean-up duties <span class="muted small">${list.filter(Boolean).length ? list.filter(Boolean).length + ' duties, rotating each Monday' : 'not set up'}</span></summary>
          <p class="hintline">One duty per line, in rotation order. Each Monday, every ${esc(Suite.word('team'))} moves to the next duty.</p>
          <textarea class="field" data-d="dulist" rows="4" style="width:100%" placeholder="Duty 1&#10;Duty 2&#10;Duty 3&#10;Duty 4">${esc(list.join('\n'))}</textarea>
          ${list.filter(Boolean).length ? `<span class="lb">This week (${esc(longDate(mondayKey(viewDate)).replace(/,? \d{4}$/, ''))})</span>${dutiesHtml(cid, 'du-prev')}
            <div class="bar" style="margin-top:6px"><button class="btn small" data-d="dushift" data-v="1">Rotate now</button><button class="btn small quiet" data-d="dushift" data-v="-1">Back one week</button></div>
            <p class="hintline">Show them with the Clean-up duties tool, or on a big bell message (check "show duties" in Bell reminder).</p>` : ''}
          </details>`; })()}
        ${(() => { const own = usual(cid).bellOwn || {}, on = !!own.on, msgs = own.messages || [];
          return `<details class="sec" data-dt="routines"${on ? ' open' : ''}><summary>Bell reminder <span class="muted small">${on ? 'custom for this class' : 'your usual settings'}</span></summary>
          <label class="rv" style="display:flex;gap:6px"><input type="radio" name="bown" data-d="bown" value="usual"${on ? '' : ' checked'}> Use my usual settings (<a href="settings.html#today">edit them</a>)</label>
          <label class="rv" style="display:flex;gap:6px"><input type="radio" name="bown" data-d="bown" value="own"${on ? ' checked' : ''}> Custom for this class</label>
          ${on ? `<label class="lb">Show the countdown in the last <input class="field num" type="number" min="1" max="20" data-d="bomin" value="${own.minutes || 5}" style="width:64px"> minutes of class</label>
            <label class="rv" style="display:flex;gap:6px"><input type="checkbox" data-d="bocs"${own.chimeStart ? ' checked' : ''}> Chime when the countdown appears</label>
            <label class="rv" style="display:flex;gap:6px"><input type="checkbox" data-d="boce"${own.chimeEnd ? ' checked' : ''}> Chime at the bell</label>
            <label class="lb">Sound for this class <select data-d="bosnd"><option value="">Use my usual sound</option>${Object.entries(Suite.CHIMES).map(([k, v]) => `<option value="${k}"${own.sound === k ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select> <button class="btn quiet small" data-d="bosndtry">Preview</button></label>
            <span class="lb">Messages before the bell</span>
            ${msgs.map((x, k) => `<div class="bomrow"><input class="field num" type="number" min="1" max="30" data-d="bomm" data-k="${k}" value="${x.min}" aria-label="Minutes before the bell" style="width:58px"><span class="small">min:</span><input class="field" data-d="bomt" data-k="${k}" value="${esc(x.text || '')}" placeholder="Clean-up time!" style="flex:1;min-width:0">
              <label class="small"><input type="checkbox" data-d="bomc" data-k="${k}"${x.chime ? ' checked' : ''}> chime</label><label class="small" title="Fill the screen with this message and a big countdown"><input type="checkbox" data-d="bomb" data-k="${k}"${x.big ? ' checked' : ''}> big on screen</label><label class="small" title="List this week's clean-up duties under the big countdown"><input type="checkbox" data-d="bomd" data-k="${k}"${x.duties ? ' checked' : ''}> show duties</label><button class="btn quiet danger small" data-d="bomrm" data-k="${k}" aria-label="Remove message">×</button></div>`).join('') || '<p class="hintline">No messages yet.</p>'}
            <button class="btn small" data-d="bomadd">Add a message</button>
            <p class="hintline">Each message shows from its minute mark until the bell. The chime uses your Sounds settings.</p>` : ''}
          </details>`; })()}
        <details class="sec" data-dt="routines"><summary>Warm-up timer</summary>
          <div class="bar"><label class="rv"><input type="checkbox" data-d="ton"${u.timer.on ? ' checked' : ''}> Warm-up timer</label><input class="field num" type="number" min="1" max="30" data-d="tmin" value="${u.timer.min}" style="width:70px"> minutes</div>
          <div class="bmrow" style="margin-top:8px"><label class="small">Style <select data-d="tstyle">${Object.entries(TIMER_STYLES).map(([k, n]) => `<option value="${k}"${(u.timer.style || 'digital') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label><label class="small">Color <input type="color" data-d="tcolor" value="${esc(u.timer.color || '#2f6fd0')}"></label></div>
          <label class="rv" style="margin-top:6px;display:flex;gap:6px"><input type="checkbox" data-d="tauto"${u.timer.auto ? ' checked' : ''}> Start automatically when the bell rings</label>
          ${lookById(room.look).timer ? '' : '<p class="note warn">This background has no spot for the timer yet, so it won\'t show.</p><button class="btn small" data-d="taddspot">Add a timer spot</button>'}
          <p class="hintline">The timer shows on the Welcome board and can start on its own at the bell, in Auto or when you've picked this class. Move it with Edit on screen.</p></details>
      </div>
      <div class="dfoot"><button class="btn small" data-d="copyprev">Copy previous day</button><button class="btn small" data-d="saveusual">Save as usual</button><button class="btn quiet small" data-d="reset">Reset to usual</button></div>`;
  }
  const commit = (redrawer) => { save(); render(); if (redrawer) { const top = $('.dbody') ? $('.dbody').scrollTop : 0, open = [...document.querySelectorAll('details.sec')].map(d => d.open); renderDrawer(); const b = $('.dbody'); if (b) b.scrollTop = top; document.querySelectorAll('details.sec').forEach((d, i) => { if (open[i] != null) d.open = open[i]; }); } };
  function boardRec(type){ const r = editable(viewDate, activeId()); r.boards = r.boards || {}; r.boards[type] = r.boards[type] || clone(boardOf(r, type)); r.boards[type].lines = r.boards[type].lines || []; return r.boards[type]; }

  $('#drawer').addEventListener('click', async e => {
    const el = e.target.closest('[data-d]'); if (!el) return;
    const d = el.dataset.d, cid = activeId(), row = el.closest('.lrow');
    if (d === 'close') { editing = false; $('#drawer').hidden = true; return; }
    if (d === 'day') { viewDate = shiftDay(viewDate, +el.dataset.dir); boardNo = 0; reveal = 0; render(); renderDrawer(); return; }
    if (d === 'today') { viewDate = Suite.dateKey(new Date()); render(); renderDrawer(); return; }
    if (d === 'unown') { e.preventDefault(); delete T.days[viewDate][cid]; scope = 'course'; commit(true); return; }
    if (d === 'up' || d === 'down') { const r = editable(viewDate, cid), i = r.lineup.indexOf(el.dataset.t), j = i + (d === 'up' ? -1 : 1); if (j >= 0 && j < r.lineup.length) [r.lineup[i], r.lineup[j]] = [r.lineup[j], r.lineup[i]]; commit(true); return; }
    if (d === 'add') { const b = boardRec(el.dataset.type); b.lines.push({ text: '', html: '', color: 'blue', level: 0 }); commit(true); const inp = [...document.querySelectorAll(`.lrow[data-type="${el.dataset.type}"] .rline`)].pop(); if (inp) inp.focus(); return; }
    if (row && d === 'color') { const b = boardRec(row.dataset.type), l = b.lines[+row.dataset.i]; l.color = INK_ORDER[(INK_ORDER.indexOf(l.color || 'blue') + 1) % 3]; commit(true); return; }
    if (row && d === 'rm') { boardRec(row.dataset.type).lines.splice(+row.dataset.i, 1); commit(true); return; }
    if (d === 'have') { const r = editable(viewDate, cid), v = el.dataset.v, i = r.haveOut.indexOf(v); if (i > -1) r.haveOut.splice(i, 1); else r.haveOut.push(v); commit(true); return; }

    if (d === 'cdup') {   // an exact copy: same text, pictures, tools, and layout
      const r = editable(viewDate, cid), src = clone(boardOf(dayFor(viewDate, cid), el.dataset.t)), id = 'c-' + Suite.uid();
      if (!isCustom(el.dataset.t)) { src.layout = src.layout || clone(getLayout(roomFor(viewDate, cid).look)); }
      if (src.layout && !src.layout.extras) src.layout.extras = [];
      src.name = boardLabel(dayFor(viewDate, cid), el.dataset.t) + ' (copy)'; if (!src.heading) src.heading = BOARDS[el.dataset.t] ? BOARDS[el.dataset.t].heading : 'MY BOARD';
      (src.pics || []).forEach(p2 => { p2.id = Suite.uid(); }); (src.tools || []).forEach(w => { w.id = Suite.uid(); });
      r.boards = r.boards || {}; r.boards[id] = src; const i = r.lineup.indexOf(el.dataset.t); r.lineup.splice(i < 0 ? r.lineup.length : i + 1, 0, id);
      commit(true); Suite.toast('Copy made. Change its words in Edit on screen.'); return;
    }
    if (d === 'cshare') { shareBoard(cid, el.dataset.t); return; }
    if (d === 'cren') { const t = el.dataset.t, cur = boardLabel(dayFor(viewDate, cid), t);
      const nm = await Suite.dialog({ title: 'Rename this board', body: 'The name shown in lists like this one. What students see on the board doesn\'t change.', input: cur, ok: 'Rename' }); if (!nm || !nm.trim()) return;
      if (t.startsWith('L-')) { const it = (T.library || []).find(x => 'L-' + x.id === t); if (it) { it.name = nm.trim(); it.board.name = nm.trim(); } }
      else { const r = editable(viewDate, cid); r.boards = r.boards || {}; r.boards[t] = r.boards[t] || clone(boardOf(dayFor(viewDate, cid), t)); r.boards[t].name = nm.trim(); const u = usual(cid); if (u.boards && u.boards[t]) u.boards[t].name = nm.trim(); }
      commit(true); return; }
    if (d === 'dushift') { const u = usual(cid); if (u.duties) { u.duties.shift = (u.duties.shift || 0) + (+el.dataset.v); commit(true); Suite.toast(+el.dataset.v > 0 ? 'Duties rotated' : 'Duties moved back a week'); } return; }
    if (d === 'bomadd') { const u = usual(cid), o = u.bellOwn = u.bellOwn || { on: true, minutes: 7, messages: [] }; o.messages = (o.messages || []).concat({ min: 7, text: 'Clean-up time!', chime: true, big: true }); commit(true); return; }
    if (d === 'bosndtry') { bellChime(bellCfg()); return; }
    if (d === 'bomrm') { const o = usual(cid).bellOwn; if (o) o.messages.splice(+el.dataset.k, 1); commit(true); return; }
    if (d === 'dtab') { dTab = el.dataset.v; sessionStorage.setItem('suite:daytab', dTab); const top = $('.dbody') ? $('.dbody').scrollTop : 0; renderDrawer(); return; }
    if (d === 'movetext') { startEdit(); return; }
    if (d === 'libsave') { const r = dayFor(viewDate, cid), bd = clone(boardOf(r, el.dataset.t)), name = plainOf(bd.heading) || 'My board'; T.library = T.library || [];
      const i = T.library.findIndex(x => x.from === el.dataset.t); const item = { name, from: el.dataset.t, board: bd }; if (i > -1) T.library[i] = item; else T.library.push(item); commit(true); Suite.toast(name + ' saved to My boards'); return; }
    if (d === 'librm') { if (!await Suite.dialog({ title: 'Delete from My boards?', body: 'Days that already use it keep their copy.', ok: 'Delete', danger: true })) return; T.library.splice(+el.dataset.i, 1); commit(true); return; }
    if (d === 'taddspot') { const lay = ownLayout(roomFor(viewDate, cid).look); lay.boxes.timer = NEUTRAL.timer.slice(); commit(true); Suite.toast('Timer spot added. Move it with Edit on screen.'); return; }
    if (d === 'cadd') { const name = await Suite.dialog({ title: 'Name this board', body: 'This becomes the heading. You can change it on screen.', input: 'REMINDERS', ok: 'Add board' }); if (!name) return;
      const r = editable(viewDate, cid), id = 'c-' + Suite.uid(); r.boards = r.boards || {}; r.boards[id] = { heading: esc(name), lines: [] }; r.lineup = (r.lineup || []).concat(id); save();
      editing = false; $('#drawer').hidden = true; editMode = true; lesson = false; boardNo = Math.max(0, screens(viewDate, cid).indexOf(id)); render(); Suite.toast('Your new board is ready. Click to type, or use the switches above to choose its pieces.'); return; }
    if (d === 'crm') { if (!await Suite.dialog({ title: 'Delete this board?', body: 'It is removed from this day. Other days keep their copy.', ok: 'Delete', danger: true })) return; const snap = Suite.snapshot(['today']); const r = editable(viewDate, cid); r.lineup = r.lineup.filter(x => x !== el.dataset.t); delete (r.boards || {})[el.dataset.t]; commit(true); Suite.undoToast('Board deleted', snap); return; }
    if (d === 'cpicrm') { const r = editable(viewDate, cid); const bd = r.boards[el.dataset.t]; if (bd) delete bd.pic; commit(true); return; }
    if (d === 'xadd') { const look = roomFor(viewDate, cid).look, lay = clone(getLayout(look)); lay.extras.push({ id: Suite.uid(), box: [760, 420, 420, 220], panel: 'card', html: '' }); T.layouts[look] = lay; commit(true); return; }
    if (d === 'xrm') { const look = roomFor(viewDate, cid).look, lay = clone(getLayout(look)); lay.extras = lay.extras.filter(x => x.id !== el.dataset.x); T.layouts[look] = lay; commit(true); return; }
    if (d === 'copyprev') {   // the same copy as the Planner's: the plan and the boards, together
      const res = Suite.copyPrevDay(scope === 'period' ? cid : rowKeyOf(cid), viewDate);
      if (!res) { Suite.toast('No earlier day to copy from'); return; }
      T = Object.assign(clone(BLANK), Suite.get('today', {})); T.layouts = T.layouts || {};
      render(); if (editing) renderDrawer();
      Suite.undoToast(`Copied ${[res.plan && 'the plan', res.boards && 'the boards'].filter(Boolean).join(' and ')} from ${longDate(res.from)}`, res.snap); return;
    }
    if (d === 'saveusual') { const cur = dayFor(viewDate, cid), u = usual(cid); Object.assign(u, clone({ lineup: cur.lineup, haveOut: cur.haveOut, haveOutFmt: cur.haveOutFmt || {}, boards: cur.boards })); commit(true); Suite.toast('Saved as the usual setup for ' + rowName(cid)); return; }
    if (d === 'reset') { const day = T.days[viewDate] || {}; delete day[scope === 'period' ? cid : rowKeyOf(cid)]; commit(true); Suite.toast('This day is back to the usual setup'); return; }
  });
  $('#drawer').addEventListener('input', e => {
    const el = e.target, row = el.closest('.lrow'), cid = activeId();
    if (el.dataset.d === 'xhtml') { const look = roomFor(viewDate, cid).look, lay = clone(getLayout(look)), x = lay.extras.find(y => y.id === el.dataset.x); if (x) { x.html = clean(el.innerHTML); T.layouts[look] = lay; commit(false); } return; }
    if (el.dataset.d === 'bgcolor') { usual(cid).bgColor = el.value; commit(false); return; }
    if (row && el.dataset.d === 'rich') { const l = boardRec(row.dataset.type).lines[+row.dataset.i]; l.html = clean(el.innerHTML); l.text = el.textContent; commit(false); return; }
    if (el.dataset.d === 'bmscale' || el.dataset.d === 'bmdx') { const id = roomFor(viewDate, cid).bitmoji; T.bmAdj[id] = Object.assign(bmAdj(id), { [el.dataset.d === 'bmscale' ? 'scale' : 'dx']: +el.value }); save(); render(); return; }
    if (el.dataset.h) { boardRec(el.dataset.h).heading = el.value; commit(false); return; }
    if (el.dataset.d === 'slide') { editable(viewDate, cid).slideLink = el.value.trim(); commit(false); return; }
    if (el.dataset.d === 'deck') { usual(cid).deckUrl = el.value.trim(); commit(false); return; }
  });
  $('#drawer').addEventListener('change', async e => {
    const el = e.target, row = el.closest('.lrow'), cid = activeId(), d = el.dataset.d;
    if (d === 'scope') { scope = el.value; renderDrawer(); return; }
    if (d === 'lineup') { const r = editable(viewDate, cid), t = el.dataset.t; if (el.checked) { if (!r.lineup.includes(t)) r.lineup.push(t); } else r.lineup = r.lineup.filter(x => x !== t); commit(true); return; }
    if (row && d === 'reveal') { boardRec(row.dataset.type).lines[+row.dataset.i].reveal = el.checked; commit(false); return; }
    if (el.dataset.src) { const b = boardRec(el.dataset.src); b.source = el.value;
      if (el.value === 'custom' && !(b.lines || []).some(l => l.text)) { const plan = Suite.agendaFor(viewDate, cid) || {}; b.lines = (el.dataset.src === 'agenda' ? plan.items || [] : (plan.homework || '').split('\n')).filter(x => x && x.trim()).map(t => ({ text: t, color: 'blue', level: 0 })); }
      commit(true); return; }
    if (d === 'look') { usual(cid).look = el.value; commit(true); return; }
    if (['fxmode', 'fxeff', 'fxwhere', 'fxamt', 'fxsize', 'fxslides', 'fxlook', 'fxbm'].includes(d)) { const u = usual(cid), f = u.fx = Object.assign({ mode: 'auto', effect: 'snow', where: 'all', amount: 'medium' }, u.fx || {});
      if (d === 'fxmode') f.mode = el.value; else if (d === 'fxeff') f.effect = el.value; else if (d === 'fxamt') f.amount = el.value; else if (d === 'fxsize') f.size = el.value; else if (d === 'fxslides') f.overSlides = el.checked; else if (d === 'fxlook') f.look = el.value; else if (d === 'fxbm') f.bitmoji = el.value;
      else if (d === 'fxwhere') { if (el.value === 'all') { f.where = 'all'; delete f.board; } else { f.where = 'board'; f.board = el.value.slice(2); } }
      commit(true); return; }
    if (d === 'bown') { const base = Object.assign({}, BELL_DEFAULT, T.bell || {}), u = usual(cid); u.bellOwn = Object.assign({ minutes: base.minutes, messages: [], chimeStart: !!base.chimeStart, chimeEnd: !!base.chimeEnd, sound: '' }, u.bellOwn || {}, { on: el.value === 'own' }); commit(true); return; }
    if (d === 'dulist') { const u = usual(cid), list = el.value.split('\n').map(x => x.trim()).filter(Boolean); u.duties = Object.assign({ start: mondayKey(Suite.dateKey(new Date())), shift: 0 }, u.duties || {}, { list }); commit(true); return; }
    if (d === 'bomd') { const o = usual(cid).bellOwn; const m = o && o.messages[+el.dataset.k]; if (m) { m.duties = el.checked; save(); } return; }
    if (['bomin', 'bomm', 'bomt', 'bomc', 'bomb', 'bocs', 'boce', 'bosnd'].includes(d)) { const o = usual(cid).bellOwn; if (!o) return;
      if (d === 'bomin') o.minutes = Math.max(1, Math.min(20, parseInt(el.value, 10) || 5));
      else if (d === 'bocs') o.chimeStart = el.checked; else if (d === 'boce') o.chimeEnd = el.checked; else if (d === 'bosnd') o.sound = el.value;
      else { const m = o.messages[+el.dataset.k]; if (!m) return; if (d === 'bomm') m.min = Math.max(1, Math.min(30, parseInt(el.value, 10) || 1)); else if (d === 'bomt') m.text = el.value; else if (d === 'bomc') m.chime = el.checked; else m.big = el.checked; }
      save(); return; }
    if (d === 'liblink' && el.value) { const r = editable(viewDate, cid), id = 'L-' + el.value; if (!r.lineup.includes(id)) r.lineup.push(id); commit(true); Suite.toast('Linked board added. Changing it updates every class that uses it.'); return; }
    if (d === 'libadd' && el.value !== '') { const src = T.library[+el.value]; if (!src) return; const r = editable(viewDate, cid), id = 'c-' + Suite.uid(); r.boards = r.boards || {}; r.boards[id] = clone(src.board); r.lineup = (r.lineup || []).concat(id); commit(true); Suite.toast(src.name + ' added to this day'); return; }
    if (d === 'evon') { usual(cid).showEvents = el.checked; commit(true); return; }
    if (d === 'clook') { const r = editable(viewDate, cid), bd = r.boards[el.dataset.t] = r.boards[el.dataset.t] || clone(boardOf(r, el.dataset.t)); if (el.value) bd.look = el.value; else delete bd.look; commit(true); return; }
    if (d === 'cpic' && el.files[0]) { try { const meta = await Suite.files.put(el.files[0]), r = editable(viewDate, cid), bd = r.boards[el.dataset.t] = r.boards[el.dataset.t] || clone(boardOf(r, el.dataset.t)); bd.pic = meta.id; commit(true); Suite.toast('Picture added. Move or resize it with Edit on screen.'); } catch (err) { Suite.toast(err.message || "Couldn't add that picture"); } return; }
    if (d === 'bgcolor') { usual(cid).bgColor = el.value; commit(false); return; }
    if (d === 'tstyle' || d === 'tcolor') { usual(cid).timer[d === 'tstyle' ? 'style' : 'color'] = el.value; commit(true); return; }
    if (d === 'bm') { usual(cid).bitmoji = el.value; commit(true); return; }
    if (d === 'daylook' || d === 'daybm') { const r = editable(viewDate, cid), k = d === 'daylook' ? 'look' : 'bitmoji'; if (el.value) r[k] = el.value; else delete r[k]; commit(true); return; }
    if (d === 'ton' || d === 'tauto') { usual(cid).timer[d === 'ton' ? 'on' : 'auto'] = el.checked; if (d === 'ton') resetTimer(cid); commit(true); return; }
    if (d === 'tmin') { usual(cid).timer.min = Math.max(1, Math.min(30, parseInt(el.value, 10) || 3)); if (!timer.running) resetTimer(cid); commit(false); return; }
  });
