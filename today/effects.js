/* Today page, part 5 of 7: Seasonal looks and the falling effects (leaves, snow, and so on).
   The parts are ordinary scripts that share their names with one another, and today.html loads them in this order:
   boards.js, drawer.js, editor.js, tools.js, effects.js, widgets.js, main.js. Keep that order: a part can use anything from the parts before it as it loads. */
  /* ---------- seasonal looks and falling effects ---------- */
  const seasonsList = () => Suite.seasonsOf(T);
  const seasonFor = date => seasonsList().find(x => Suite.seasonOn(x, date)) || null;
  function seasonLook(date, cid){
    const f = (cid && usual(cid).fx) || {};
    if (f.mode === 'off') return {};
    if (f.mode === 'pick') return { look: f.look || '', bitmoji: f.bitmoji || '' };
    const se = seasonFor(date); if (!se) return {};
    const okLook = id => id && (LOOKS[id] || T.custom[id]), okBm = id => id && (id === 'none' || BITMOJI[id] || T.bitmojis[id]);
    return { look: okLook(se.look) ? se.look : '', bitmoji: okBm(se.bitmoji) ? se.bitmoji : '' };
  }
  const FX_DEF_SIZE = { halloween: 'medium', leaves: 'small', snow: 'small', hearts: 'small', shamrocks: 'medium' };
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fxWanted(){
    if (T.fxOff || editMode || document.hidden || RM || STUDIO) return null;
    const se = seasonFor(viewDate);
    if (isIdle()) return se && se.idle && se.effect !== 'none' ? se : null;
    const cid = activeId(); if (!cid) return null;
    const f = usual(cid).fx || {};
    if (f.mode === 'off') return null;
    if (f.mode === 'pick') { if (!f.effect || f.effect === 'none') return null; if (lesson ? !f.overSlides : (f.where === 'board' && f.board !== screens(viewDate, cid)[boardNo])) return null; return { effect: f.effect, amount: f.amount || 'medium', size: f.size || FX_DEF_SIZE[f.effect] }; }
    if (!se || se.effect === 'none' || (lesson && !se.overSlides)) return null;
    return se;
  }

  // ---- the artwork (drawn at about 100 units across, centered on 0,0) ----
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, m = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${m(r)},${m(g)},${m(b)})`; };
  const ART = {
    maple(c, p, back){ const col = p.col; c.beginPath(); const P = [[0,-50],[9,-30],[24,-38],[20,-16],[44,-22],[36,-6],[48,4],[26,8],[30,24],[10,16],[4,30],[0,22],[-4,30],[-10,16],[-30,24],[-26,8],[-48,4],[-36,-6],[-44,-22],[-20,-16],[-24,-38],[-9,-30]];
      c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) { const [x, y] = P[i], [px, py] = P[i - 1]; c.quadraticCurveTo((x + px) / 2 + (i % 2 ? 3 : -3), (y + py) / 2, x, y); } c.closePath();
      const g = c.createLinearGradient(0, -50, 0, 30); g.addColorStop(0, back ? shade(col, .75) : shade(col, 1.15)); g.addColorStop(1, back ? shade(col, .55) : shade(col, .85)); c.fillStyle = g; c.fill(); c.strokeStyle = shade(col, .55); c.lineWidth = 1.6; c.stroke();
      c.strokeStyle = back ? shade(col, .45) : shade(col, .6); c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 40); c.lineTo(0, -44); c.moveTo(0, 8); c.lineTo(36, -14); c.moveTo(0, 8); c.lineTo(-36, -14); c.moveTo(0, 14); c.lineTo(22, 22); c.moveTo(0, 14); c.lineTo(-22, 22); c.stroke();
      c.strokeStyle = '#6b3b1c'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 26); c.quadraticCurveTo(2, 40, -3, 52); c.stroke(); },
    oak(c, p, back){ const col = p.col; c.beginPath(); c.moveTo(0, -50); const lobes = [[14,-40],[10,-30],[26,-24],[14,-14],[30,-4],[14,6],[24,18],[8,24],[6,36]];
      lobes.forEach(([x, y], i) => c.quadraticCurveTo(x + (i % 2 ? -6 : 10), y - 6, x, y)); c.lineTo(0, 40); lobes.slice().reverse().forEach(([x, y], i) => c.quadraticCurveTo(-x - (i % 2 ? -6 : 10), y - 6, -x, y)); c.closePath();
      const g = c.createLinearGradient(-30, -50, 30, 40); g.addColorStop(0, back ? shade(col, .7) : shade(col, 1.12)); g.addColorStop(1, back ? shade(col, .5) : shade(col, .82)); c.fillStyle = g; c.fill(); c.strokeStyle = shade(col, .55); c.lineWidth = 1.5; c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(0, 46); c.lineTo(0, -42); for (const y of [-26, -10, 8, 22]) { c.moveTo(0, y); c.lineTo(16, y - 8); c.moveTo(0, y); c.lineTo(-16, y - 8); } c.stroke();
      c.strokeStyle = '#6b3b1c'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 40); c.lineTo(2, 54); c.stroke(); },
    bat(c, p){ const w = Math.sin(p.t * p.flapS); c.strokeStyle = '#140f1a'; c.lineWidth = 1.5;
      for (const sd of [1, -1]) { c.save(); c.scale(sd, 1); c.rotate(-w * .5); c.beginPath(); c.moveTo(6, -4); c.quadraticCurveTo(26, -26 - w * 6, 50, -14); c.quadraticCurveTo(44, -4, 46, 6); c.quadraticCurveTo(36, 0, 32, 10); c.quadraticCurveTo(24, 2, 18, 12); c.quadraticCurveTo(12, 4, 6, 8); c.closePath();
        const g = c.createLinearGradient(6, -20, 50, 10); g.addColorStop(0, '#3d3049'); g.addColorStop(1, '#1d1726'); c.fillStyle = g; c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(8, -2); c.lineTo(46, -12); c.moveTo(8, 0); c.lineTo(34, 6); c.stroke(); c.strokeStyle = '#140f1a'; c.restore(); }
      c.fillStyle = '#2a2233'; c.beginPath(); c.ellipse(0, 4, 9, 13, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -8, 8, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-6, -12); c.lineTo(-8, -22); c.lineTo(-2, -14); c.moveTo(6, -12); c.lineTo(8, -22); c.lineTo(2, -14); c.fill();
      c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(-3, -9, 1.8, 0, 7); c.arc(3, -9, 1.8, 0, 7); c.fill(); },
    ghost(c, p){ c.fillStyle = 'rgba(255,255,255,.92)'; c.strokeStyle = 'rgba(120,140,170,.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-26, 30); c.lineTo(-26, -8); c.quadraticCurveTo(-26, -44, 0, -44); c.quadraticCurveTo(26, -44, 26, -8); c.lineTo(26, 30);
      for (let i = 0; i < 4; i++) { const x0 = 26 - i * 13; c.quadraticCurveTo(x0 - 6.5, 30 + 10 * Math.sin(p.t * 4 + i), x0 - 13, 30); } c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#2a2233'; c.beginPath(); c.ellipse(-9, -14, 4, 6, 0, 0, 7); c.ellipse(9, -14, 4, 6, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, 2, 5, 7, 0, 0, 7); c.fill(); },
    flake(c, p){ const arms = () => { for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -44); c.moveTo(0, -18); c.lineTo(-11, -28); c.moveTo(0, -18); c.lineTo(11, -28); c.moveTo(0, -31); c.lineTo(-8, -39); c.moveTo(0, -31); c.lineTo(8, -39); c.stroke(); c.restore(); } };
      c.lineCap = 'round'; if (!fxDark) { c.strokeStyle = 'rgba(110,150,200,.7)'; c.lineWidth = 9; arms(); } c.strokeStyle = '#ffffff'; c.lineWidth = 5; arms(); },
    dot(c){ const g = c.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, '#fff'); g.addColorStop(.5, fxDark ? 'rgba(255,255,255,.85)' : 'rgba(235,243,252,.95)'); g.addColorStop(.75, fxDark ? 'rgba(255,255,255,.2)' : 'rgba(130,165,210,.6)'); g.addColorStop(1, 'rgba(130,165,210,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill(); },
    heart(c, p){ const col = p.col; c.beginPath(); c.moveTo(0, 36); c.bezierCurveTo(-46, 6, -40, -40, 0, -16); c.bezierCurveTo(40, -40, 46, 6, 0, 36); c.closePath();
      const g = c.createLinearGradient(-30, -36, 30, 36); g.addColorStop(0, shade(col, 1.25)); g.addColorStop(1, shade(col, .8)); c.fillStyle = g; c.fill(); c.strokeStyle = shade(col, .6); c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-16, -14, 7, 11, -.6, 0, 7); c.fill(); },
    shamrock(c){ const leaf = () => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-26, -10, -24, -40, -2, -36); c.lineTo(0, -32); c.lineTo(2, -36); c.bezierCurveTo(24, -40, 26, -10, 0, 0); c.closePath(); const g = c.createLinearGradient(0, -36, 0, 0); g.addColorStop(0, '#5cc35c'); g.addColorStop(1, '#1f8a3a'); c.fillStyle = g; c.fill(); c.strokeStyle = '#11632a'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -28); c.stroke(); };
      c.strokeStyle = '#1f7a34'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(6, 26, 16, 44); c.stroke(); for (const a of [0, 2.1, -2.1]) { c.save(); c.rotate(a); leaf(); c.restore(); } },
    coin(c, p){ const f = Math.cos(p.t * 4); c.save(); c.scale(Math.max(.15, Math.abs(f)), 1); const g = c.createRadialGradient(-10, -10, 4, 0, 0, 30); g.addColorStop(0, '#fff3b0'); g.addColorStop(.5, '#f5c542'); g.addColorStop(1, '#c78d12'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 28, 0, 7); c.fill();
      c.strokeStyle = '#a8740a'; c.lineWidth = 3; c.stroke(); c.beginPath(); c.arc(0, 0, 20, 0, 7); c.lineWidth = 2; c.stroke(); c.restore(); }
  };
  // ---- motion ----
  const FX_SIZE = { small: .045, medium: .068, large: .1 }, FX_COUNT = { light: 10, medium: 18, lots: 30 };
  const FX_LEAVES = ['#c2401f', '#e0661c', '#e8a21a', '#b8521b', '#9c3b1a', '#d9881f'];
  const rnd = (a, b) => a + Math.random() * (b - a), pickOne = a => a[Math.floor(Math.random() * a.length)];
  let fxCv = null, fxCtx = null, fxParts = [], fxKey = '', fxRaf = 0, fxLast = 0, fxDark = false, fxW = 0, fxH = 0;
  function fxMake(kind, size, fresh){
    const W = fxW, H = fxH, s = W * (FX_SIZE[size] || FX_SIZE.medium) * rnd(.75, 1.25), p = { s, t: rnd(0, 10) };
    const top = () => (fresh ? rnd(-H, H) : rnd(-H * .3, -s));
    if (kind === 'leaves') Object.assign(p, { k: Math.random() < .55 ? 'maple' : 'oak', col: pickOne(FX_LEAVES), x: rnd(0, W), y: top(), vy: rnd(.06, .1) * H, sway: rnd(.04, .09) * W, sf: rnd(.6, 1.1), flip: rnd(1.2, 2.4), rock: rnd(.5, 1) });
    else if (kind === 'snow') { const big = Math.random() < .3; Object.assign(p, { k: big ? 'flake' : 'dot', s: big ? s : s * rnd(.25, .45), x: rnd(0, W), y: top(), vy: rnd(.05, .09) * H * (big ? 1 : 1.2), sway: rnd(.01, .03) * W, sf: rnd(.4, .9), spin: rnd(-.4, .4) }); }
    else if (kind === 'hearts') Object.assign(p, { k: 'heart', col: pickOne(['#e0457b', '#d62839', '#ff7aa8', '#c2185b']), x: rnd(0, W), y: top(), vy: rnd(.05, .08) * H, sway: rnd(.02, .05) * W, sf: rnd(.5, 1), tilt: rnd(-.3, .3) });
    else if (kind === 'shamrocks') { const c = Math.random() < .25; Object.assign(p, { k: c ? 'coin' : 'shamrock', s: c ? s * .75 : s, x: rnd(0, W), y: top(), vy: (c ? rnd(.1, .14) : rnd(.05, .08)) * H, sway: rnd(.02, .05) * W, sf: rnd(.5, 1), spin: rnd(-.6, .6) }); }
    else { // halloween: bats and ghosts
      if (Math.random() < .68) { const dir = Math.random() < .5 ? 1 : -1; Object.assign(p, { k: 'bat', dir, x: fresh ? rnd(0, W) : (dir > 0 ? -s * 2 : W + s * 2), y: rnd(.08, .6) * H, vx: dir * rnd(.12, .2) * W, swoop: rnd(.04, .1) * H, sf: rnd(.8, 1.4), flapS: rnd(10, 14) }); }
      else Object.assign(p, { k: 'ghost', x: rnd(.05, .95) * W, y: fresh ? rnd(.3, 1) * H : H + s, vy: -rnd(.035, .055) * H, sway: rnd(.02, .04) * W, sf: rnd(.4, .7), life: 0 });
    }
    p.x0 = p.x; return p;
  }
  function fxFrame(t){
    fxRaf = 0; const w = fxWanted(); if (!w) { fxStop(); return; }
    const st = document.getElementById('stage'); if (!st) return; const r = st.getBoundingClientRect(); if (!r.width) { fxRaf = requestAnimationFrame(fxFrame); return; }
    const dpr = Math.min(1.5, devicePixelRatio || 1); fxW = r.width; fxH = r.height; const W = fxW, H = fxH;
    if (!fxCv) { fxCv = document.createElement('canvas'); fxCv.id = 'fx'; fxCv.setAttribute('aria-hidden', 'true'); document.body.appendChild(fxCv); fxCtx = fxCv.getContext('2d'); }
    Object.assign(fxCv.style, { left: r.left + 'px', top: r.top + 'px', width: W + 'px', height: H + 'px' });
    if (fxCv.width !== Math.round(W * dpr) || fxCv.height !== Math.round(H * dpr)) { fxCv.width = Math.round(W * dpr); fxCv.height = Math.round(H * dpr); fxKey = ''; }
    const size = w.size || FX_DEF_SIZE[w.effect] || 'medium', amt = w.amount || 'medium', key = w.effect + '|' + size + '|' + amt;
    if (key !== fxKey) { fxKey = key; const n = Math.round(FX_COUNT[amt] * (size === 'large' ? .7 : size === 'small' ? 1.4 : 1)); fxParts = Array.from({ length: n }, () => fxMake(w.effect, size, true)); }
    fxDark = !!(st.querySelector('.ink-light') || document.querySelector('.idle'));
    const dt = Math.min(.05, fxLast ? (t - fxLast) / 1000 : 0); fxLast = t;
    const c = fxCtx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    fxParts.forEach((p, i) => {
      p.t += dt; let x = p.x, y, rot = 0, sx = 1, back = false;
      if (p.k === 'bat') { p.x += p.vx * dt; x = p.x; y = p.y + Math.sin(p.t * p.sf) * p.swoop; rot = Math.cos(p.t * p.sf) * .25 * p.dir; if ((p.dir > 0 && p.x > W + p.s * 2) || (p.dir < 0 && p.x < -p.s * 2)) { fxParts[i] = fxMake(w.effect, size, false); return; } }
      else if (p.k === 'ghost') { p.y += p.vy * dt; p.life += dt; y = p.y; x = p.x0 + Math.sin(p.t * p.sf) * p.sway; if (p.y < -p.s * 1.5) { fxParts[i] = fxMake(w.effect, size, false); return; } }
      else { p.y += p.vy * dt; y = p.y; x = p.x0 + Math.sin(p.t * p.sf) * p.sway; if (p.y > H + p.s * 1.5) { fxParts[i] = fxMake(w.effect, size, false); return; } }
      if (p.k === 'maple' || p.k === 'oak') { const f = Math.cos(p.t * p.flip); sx = Math.max(.12, Math.abs(f)); back = f < 0; rot = Math.sin(p.t * p.sf * 1.3) * p.rock + p.t * .3; }
      else if (p.k === 'heart') rot = p.tilt + Math.sin(p.t * 1.5) * .15;
      else if (p.spin) rot = p.t * p.spin;
      c.save(); c.translate(x, y); c.rotate(rot); const k = p.s / 100; c.scale(k * sx, k * (p.k === 'heart' ? 1 + Math.sin(p.t * 3) * .04 : 1));
      if (p.k === 'ghost') c.globalAlpha = Math.min(1, p.life / 1.5) * Math.min(1, Math.max(0, (p.y + p.s) / (H * .25))) * .9;
      ART[p.k](c, p, back); c.restore();
    });
    fxRaf = requestAnimationFrame(fxFrame);
  }
  function fxStop(){ if (fxRaf) cancelAnimationFrame(fxRaf); fxRaf = 0; fxLast = 0; fxKey = ''; if (fxCv) { fxCv.remove(); fxCv = null; fxCtx = null; } }
  function fxCheck(){ if (fxWanted()) { if (!fxRaf) fxRaf = requestAnimationFrame(fxFrame); } else fxStop(); }
  setInterval(fxCheck, 700); document.addEventListener('visibilitychange', fxCheck);

  // what's happening now: in class (time left until the bell), or passing or a break (time until the next class)
  function timeLeftInfo(){
    const i = bellInfo(), now = new Date();
    if (!i) return { now, label: 'No class right now', left: null, pct: 0, sub: '' };
    const [h, m] = i.p.end.split(':').map(Number), end = new Date(now); end.setHours(h, m, 0, 0);
    const [h0, m0] = i.p.start.split(':').map(Number), start = new Date(now); start.setHours(h0, m0, 0, 0);
    if (i.passing || i.brk) { const nx = i.nx; if (!nx) return { now, label: i.p.name, left: i.left, pct: 0, sub: '' };
      const [h2, m2] = nx.start.split(':').map(Number), ns = new Date(now); ns.setHours(h2, m2, 0, 0);
      return { now, label: i.passing ? 'Passing period' : i.p.name, left: ns - now, pct: 0, sub: `${nx.name} starts at ${Suite.fmt12(nx.start)}` }; }
    return { now, label: i.p.name, left: i.left, pct: Math.max(0, Math.min(100, (now - start) / (end - start) * 100)), sub: `${i.p.name} ends at ${Suite.fmt12(i.p.end)}` };
  }
  const mmssOf = ms => { const t = Math.max(0, Math.ceil(ms / 1000)), hh = Math.floor(t / 3600), mm = Math.floor(t % 3600 / 60); return (hh ? hh + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(t % 60).padStart(2, '0'); };
  const clockOf = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  function openTimeLeft(){
    let el = document.getElementById('time-left');
    if (!el) { el = document.createElement('div'); el.id = 'time-left';
      el.innerHTML = `<div class="st-panel" role="dialog" aria-modal="true" aria-label="Time left in class">
        <div class="st-top"><span class="st-title" id="tl-title">Time left</span><span class="bar"><button class="btn quiet" data-tl="set" aria-label="Chime settings" title="Chimes">🔔</button><button class="btn" data-tl="close">Close</button></span></div>
        <div class="tl-opts" id="tl-opts" hidden><label><input type="checkbox" data-tlo="chime5"> Chime at 5 minutes left</label><label><input type="checkbox" data-tlo="chimeEnd"> Chime at the bell</label><span class="muted small">Sound: Settings → Look and tools → Sounds (Time left)</span></div>
        <div class="tl-left" id="tl-left"></div>
        <div class="st-time tl-clock" id="tl-clock"></div>
        <div class="st-status" id="tl-sub" aria-live="polite"></div>
        <div class="st-bar" aria-hidden="true"><span id="tl-bar"></span></div></div>`;
      document.body.appendChild(el);
      el.addEventListener('click', e => { if (e.target.closest('[data-tl="close"]')) closeTimeLeft(); if (e.target.closest('[data-tl="set"]')) { const o = el.querySelector('#tl-opts'); o.hidden = !o.hidden; const C = tlCfg(); o.querySelectorAll('[data-tlo]').forEach(x => { x.checked = !!C[x.dataset.tlo]; }); } });
      el.addEventListener('change', e => { const k = e.target.dataset.tlo; if (!k) return; T.timeLeft = Object.assign(tlCfg(), { [k]: e.target.checked }); save(); });
    }
    el.hidden = false; el.querySelector('#tl-opts').hidden = true; const C = tlCfg(); el.querySelectorAll('[data-tlo]').forEach(x => { x.checked = !!C[x.dataset.tlo]; }); tickTimeLeft();
  }
  function closeTimeLeft(){ const el = document.getElementById('time-left'); if (el) el.hidden = true; }
  function tickTimeLeft(){
    const el = document.getElementById('time-left'); if (!el || el.hidden) return; const I = timeLeftInfo();
    el.querySelector('#tl-title').textContent = I.label;
    const c12 = clockOf(I.now), ap = c12.match(/\s?([AP]M)$/i);
    el.querySelector('#tl-clock').innerHTML = esc(ap ? c12.slice(0, -ap[0].length) : c12) + (ap ? `<small>${ap[1]}</small>` : '');
    el.querySelector('#tl-left').textContent = I.left != null ? mmssOf(I.left) + (I.pct > 0 ? ' left' : '') : '';
    el.querySelector('#tl-sub').textContent = I.left != null ? (I.sub || '') : 'No class right now';
    el.querySelector('#tl-bar').style.width = I.pct + '%';
    el.classList.toggle('is-low', I.left != null && I.left <= 5 * 60000 && I.pct > 0);
  }
  // Time left chimes (on by default): at 5 minutes left and at the bell, when the view or a Time left widget is showing
  const tlCfg = () => Object.assign({ chime5: true, chimeEnd: true }, T.timeLeft || {});
  const tlFired = new Set();
  function tlChimes(){
    const showing = (document.getElementById('time-left') && !document.getElementById('time-left').hidden) || document.querySelector('.w-clock');
    if (!showing || document.visibilityState !== 'visible') return;
    const i = bellInfo(); if (!i || i.passing || i.brk || i.staff) return; const C = tlCfg(), key = Suite.dateKey(new Date()) + i.p.start;
    if (C.chime5 && i.left <= 5 * 60000 && i.left > 5 * 60000 - 3000 && !tlFired.has(key + '|5')) { tlFired.add(key + '|5'); Suite.chimeFor('timeleft'); }
    if (C.chimeEnd && i.left <= 1500 && i.left > -2000 && !tlFired.has(key + '|end')) { tlFired.add(key + '|end'); Suite.chimeFor('timeleft'); }
  }
  document.addEventListener('keydown', e => { if (!editMode || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== 'z') return; const a = document.activeElement; if (a && (a.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(a.tagName))) return; e.preventDefault(); undo(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('time-left') && !document.getElementById('time-left').hidden) { e.stopPropagation(); closeTimeLeft(); } }, true);
  // the Time left widget (on a board, every board, or pinned to the slides)
  setInterval(() => { tickTimeLeft(); tlChimes(); if (!document.querySelector('.w-clock')) return; const I = timeLeftInfo();
    document.querySelectorAll('.w-clock').forEach(w => { w.querySelector('.wc-now').textContent = clockOf(I.now).replace(/\s?[AP]M$/i, ''); w.querySelector('.wc-left').textContent = I.left != null ? mmssOf(I.left) + (I.pct > 0 ? ' left' : '') : 'No class right now'; w.querySelector('.wc-lab').textContent = I.left != null ? (I.pct > 0 ? I.sub : I.sub) : ''; w.classList.toggle('is-low', I.left != null && I.left <= 5 * 60000 && I.pct > 0); }); }, 500);
  function openTool(kind){
    if (kind === 'timeleft') { openTimeLeft(); return; }
    if (kind === 'fxtoggle') { T.fxOff = !T.fxOff; save(); fxCheck(); Suite.toast(T.fxOff ? 'Seasonal effects off (until you turn them back on)' : 'Seasonal effects on'); return; }
    if (kind === 'timer') { Suite.openTimer(); return; }
    const t = TOOL_PAGES[kind], cid = activeId();
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<button class="btn close" data-o="close">Back to the board</button><iframe title="${esc(t[0])}" src="${t[1]}?embed&proj#${t[2] ? t[2] + '&' : ''}class=${encodeURIComponent(cid || '')}"></iframe>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); window.removeEventListener('message', onMsg); };
    const onMsg = ev => { if (ev.origin === location.origin && ev.data && ev.data.suite === 'close') close(); };
    window.addEventListener('message', onMsg);
    ov.addEventListener('click', ev => { if (ev.target.closest('[data-o="close"]')) close(); });
  }
  const toolMenu = (act, title, list) => `<span class="tmenu"><button class="btn" data-a="tmenu" aria-haspopup="true" title="${title}">${act === 'addtool' ? 'Add a tool' : 'Tools'} ▾</button><span class="tmenu-list" hidden>${Object.entries(list).map(([k, v]) => `<button data-a="${act}" data-id="${k}">${esc(v[0])}</button>`).join('')}</span></span>`;

  const everyMenu = cid => { const on = new Set((usual(cid).boardTools || []).map(w => w.kind));
    return `<span class="tmenu"><button class="btn" data-a="tmenu" aria-haspopup="true" title="Place a tool once and show it on all of this class's boards">On every board ▾</button><span class="tmenu-list" hidden>${Object.entries(WIDGETS).map(([k, v]) => `<button data-a="everytool" data-id="${k}">${on.has(k) ? '✓ ' : ''}${esc(v[0])}</button>`).join('')}</span></span>`; };
