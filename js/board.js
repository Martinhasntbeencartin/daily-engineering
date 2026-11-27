/* The whiteboard under each problem: freehand working with a pen, an eraser, colours, undo and redo, more room,
   full screen and a PNG copy. Strokes are vectors in a space 1600 units wide, so the board redraws sharply at any size,
   and each problem keeps its own board in localStorage (the most recent BOARD.keep of them).
   Input: a mouse, a pen or one finger draws; two fingers scroll; once a pen has touched the board, fingers only scroll,
   so a resting palm leaves no marks. */
const BOARD = {store: 'daily-engineer-boards', pref: 'daily-engineer-board-open', width: 1600, height: 1000, step: 600, maxHeight: 4000, keep: 40, eraser: 40, maxPixels: 16e6};
const BOARD_INKS = [['#ecebe6', 'Chalk'], ['#ff6b6b', 'Red'], ['#74e3b4', 'Green'], ['#ffc65c', 'Yellow'], ['#7cb7ff', 'Blue']];
const BOARD_SIZES = [[3, 'Fine'], [6, 'Medium'], [12, 'Thick']];
const BOARD_BG = '#0e1311';
const BOARD_ICONS = {
    pen: '<path d="M4 20l4.5-1L19.5 8 16 4.5 5 15.5z"/><path d="M14 6.5l3.5 3.5"/>',
    erase: '<path d="M9 20h11"/><path d="M4.5 15.5l9.5-9.5 5 5-9 9H8.5z"/><path d="M9 11l5 5"/>',
    undo: '<path d="M9 15L4 10l5-5"/><path d="M4 10h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="M15 15l5-5-5-5"/><path d="M20 10H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    clear: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    more: '<path d="M4 5h16M4 19h16M12 9v6M9 12h6"/>',
    png: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    exit: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    hide: '<path d="M6 6l12 12M18 6L6 18"/>'
};
const boardIcon = name => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${BOARD_ICONS[name]}</svg>`;
const boardButton = (id, icon, label, extra = '') => `<button type="button" class="board-btn" id="${id}" title="${label}" aria-label="${label}"${extra}>${boardIcon(icon)}<span>${label.replace(/ \(.*\)$/, '')}</span></button>`;
let board = null; // the board on the current problem page

/* ---------- storage ---------- */
function boardStore() { try { return JSON.parse(localStorage.getItem(BOARD.store)) || {}; } catch { return {}; } }
function boardPersist() {
    const all = boardStore();
    if (board.strokes.length || board.h !== BOARD.height) all[board.id] = {h: board.h, strokes: board.strokes, t: Date.now()};
    else delete all[board.id];
    let ids = Object.keys(all).sort((a, b) => all[b].t - all[a].t);
    ids.slice(BOARD.keep).forEach(k => delete all[k]);
    ids = ids.slice(0, BOARD.keep);
    for (;;) { // when storage is full, give up the oldest boards first
        try { localStorage.setItem(BOARD.store, JSON.stringify(all)); boardNote(''); return; }
        catch { const old = ids.pop(); if (!old || old === board.id) { boardNote('This board is too large to save in this browser; it stays until you leave the page.'); return; } delete all[old]; }
    }
}
const boardNote = text => { const el = document.getElementById('board-note'); if (el) { el.textContent = text || el.dataset.default; el.classList.toggle('warn', !!text); } };

/* ---------- markup ---------- */
function boardHTML(title, text) {
    return `<section class="board-wrap" id="board-wrap" aria-label="Whiteboard">
<div class="board-closed" id="board-closed"><button type="button" class="ghost" id="board-open">${boardIcon('pen')} Open the whiteboard</button><span>Work it out by hand. Your working is saved with this problem.</span></div>
<div class="board frame" id="board" hidden>
<details class="board-problem"><summary>${title}</summary><div class="problem-text">${text}</div></details>
<div class="board-bar" role="toolbar" aria-label="Whiteboard tools">
<div class="board-group">${boardButton('board-pen', 'pen', 'Pen (P)', ' aria-pressed="true"')}${boardButton('board-erase', 'erase', 'Eraser (E)', ' aria-pressed="false"')}</div>
<div class="board-group" role="group" aria-label="Ink colour">${BOARD_INKS.map(([c, n], i) => `<button type="button" class="board-ink" data-ink="${i}" style="--swatch:${c}" title="${n} ink" aria-label="${n} ink" aria-pressed="${!i}"></button>`).join('')}</div>
<div class="board-group" role="group" aria-label="Pen size">${BOARD_SIZES.map(([w, n], i) => `<button type="button" class="board-size" data-size="${i}" style="--dot:${4 + 2.4 * i}px" title="${n} pen" aria-label="${n} pen" aria-pressed="${i === 1}"></button>`).join('')}</div>
<div class="board-group">${boardButton('board-undo', 'undo', 'Undo (Ctrl+Z)')}${boardButton('board-redo', 'redo', 'Redo (Ctrl+Shift+Z)')}${boardButton('board-clear', 'clear', 'Clear')}</div>
<div class="board-group board-end">${boardButton('board-more', 'more', 'More room')}${boardButton('board-png', 'png', 'Save image')}${boardButton('board-full', 'full', 'Full screen')}${boardButton('board-hide', 'hide', 'Hide (W)')}</div>
</div>
<div class="board-scroll" id="board-scroll"><canvas id="board-canvas" role="img" aria-label="Whiteboard for your working. Draw with a mouse, a pen or one finger; scroll with two fingers."></canvas></div>
<p class="board-note" id="board-note" data-default="Draw with a mouse, a pen or one finger; scroll with two fingers. Saved in this browser."></p>
</div>
</section>`;
}

/* ---------- drawing ---------- */
function boardPaint(ctx, s) { // one stroke, in board units
    ctx.globalCompositeOperation = s.c < 0 ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = s.c < 0 ? '#000' : BOARD_INKS[s.c][0];
    ctx.lineWidth = s.w;
    const p = s.p;
    if (p.length === 2) { ctx.beginPath(); ctx.arc(p[0], p[1], s.w / 2, 0, 2 * Math.PI); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    if (p.length === 4) ctx.lineTo(p[2], p[3]);
    for (let i = 2; i + 2 < p.length; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
    if (p.length > 4) ctx.lineTo(p[p.length - 2], p[p.length - 1]);
    ctx.stroke();
}
function boardSegment(ctx, s) { // the newest piece of a stroke being drawn, matching boardPaint
    const p = s.p, n = p.length / 2 - 1;
    ctx.globalCompositeOperation = s.c < 0 ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.c < 0 ? '#000' : BOARD_INKS[s.c][0];
    ctx.lineWidth = s.w;
    ctx.beginPath();
    if (n === 1) { ctx.moveTo(p[0], p[1]); ctx.lineTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2); }
    else { const i = 2 * (n - 1); ctx.moveTo((p[i - 2] + p[i]) / 2, (p[i - 1] + p[i + 1]) / 2); ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2); }
    ctx.stroke();
}
function boardRedraw() {
    const {ctx, canvas} = board;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(board.scale, 0, 0, board.scale, 0, 0);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const s of board.strokes) boardPaint(ctx, s);
    if (board.live) boardPaint(ctx, board.live);
}
function boardResize() {
    if (!board || !document.contains(board.canvas)) return;
    const box = board.scroller, cssW = box.clientWidth;
    if (!cssW) return;
    const cssH = Math.max(cssW * board.h / BOARD.width, board.full ? box.clientHeight : 0), dpr = Math.min(window.devicePixelRatio || 1, Math.sqrt(BOARD.maxPixels / (cssW * cssH)));
    board.canvas.style.width = cssW + 'px';
    board.canvas.style.height = cssH + 'px';
    board.canvas.width = Math.round(cssW * dpr);
    board.canvas.height = Math.round(cssH * dpr);
    board.scale = board.canvas.width / BOARD.width;
    boardRedraw();
}
const simplify = (p, eps) => { // Ramer–Douglas–Peucker on a flat [x, y, x, y, …] list
    const n = p.length / 2;
    if (n < 3) return p;
    const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1;
    const stack = [[0, n - 1]];
    while (stack.length) {
        const [a, b] = stack.pop(), ax = p[2 * a], ay = p[2 * a + 1], dx = p[2 * b] - ax, dy = p[2 * b + 1] - ay, len = Math.hypot(dx, dy) || 1;
        let worst = -1, far = 0;
        for (let i = a + 1; i < b; i++) { const d = Math.abs((p[2 * i] - ax) * dy - (p[2 * i + 1] - ay) * dx) / len; if (d > far) { far = d; worst = i; } }
        if (far > eps) { keep[worst] = 1; stack.push([a, worst], [worst, b]); }
    }
    return p.filter((_, i) => keep[i >> 1]);
};

/* ---------- editing ---------- */
function boardDo(action) { board.undo.push(action); board.redo = []; boardApply(action, false); }
function boardApply(action, reverse) {
    if (action.type === 'add') { if (reverse) board.strokes.pop(); else board.strokes.push(action.stroke); }
    else if (action.type === 'clear') board.strokes = reverse ? action.strokes : [];
    else if (action.type === 'room') { board.h = reverse ? action.from : action.to; boardResize(); }
    boardRedraw(); boardPersist(); boardButtons();
}
function boardUndo() { const a = board.undo.pop(); if (a) { board.redo.push(a); boardApply(a, true); } }
function boardRedo() { const a = board.redo.pop(); if (a) { board.undo.push(a); boardApply(a, false); } }
function boardButtons() {
    const set = (id, on) => { const el = document.getElementById(id); if (el) el.disabled = !on; };
    set('board-undo', board.undo.length); set('board-redo', board.redo.length); set('board-clear', board.strokes.length); set('board-more', board.h < BOARD.maxHeight);
    document.querySelectorAll('#board [data-ink]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.ink === board.ink)));
    document.querySelectorAll('#board [data-size]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.size === board.size)));
    document.getElementById('board-pen')?.setAttribute('aria-pressed', String(board.tool === 'pen'));
    document.getElementById('board-erase')?.setAttribute('aria-pressed', String(board.tool === 'erase'));
    board.canvas.dataset.tool = board.tool;
}
function boardTool(tool) { board.tool = tool; boardButtons(); }
function boardOpen(open, focus = false) {
    document.getElementById('board').hidden = !open;
    document.getElementById('board-closed').hidden = open;
    try { localStorage.setItem(BOARD.pref, open ? '1' : '0'); } catch {}
    if (!open && board.full) boardFull(false);
    if (open) { boardResize(); if (focus) document.getElementById('board').scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }
    (open ? document.getElementById('board-pen') : document.getElementById('board-open'))?.focus({preventScroll: !focus});
}
function boardFull(on) {
    board.full = on;
    const el = document.getElementById('board'), btn = document.getElementById('board-full');
    el.classList.toggle('full', on);
    document.body.classList.toggle('board-full', on);
    btn.innerHTML = boardIcon(on ? 'exit' : 'full') + `<span>${on ? 'Exit full screen' : 'Full screen'}</span>`;
    btn.title = on ? 'Exit full screen (Esc)' : 'Full screen'; btn.setAttribute('aria-label', btn.title);
    requestAnimationFrame(boardResize);
}
function boardImage() {
    const out = document.createElement('canvas'), ink = document.createElement('canvas');
    out.width = ink.width = BOARD.width; out.height = ink.height = board.h;
    const ic = ink.getContext('2d'); ic.lineCap = ic.lineJoin = 'round';
    board.strokes.forEach(s => boardPaint(ic, s));
    const oc = out.getContext('2d'); oc.fillStyle = BOARD_BG; oc.fillRect(0, 0, out.width, out.height); oc.drawImage(ink, 0, 0);
    out.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `working-${board.id.replace(/:/g, '-')}.png`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
}

/* ---------- input ---------- */
function boardPoint(e) { const r = board.canvas.getBoundingClientRect(); return [(e.clientX - r.left) * BOARD.width / r.width, (e.clientY - r.top) * BOARD.width / r.width]; }
const touchMid = () => { const ys = [...board.touches.values()].map(t => t.y); return ys.reduce((s, y) => s + y, 0) / ys.length; };
function boardCancelLive() { if (board.live) { board.live = null; boardRedraw(); } }
function boardDown(e) {
    if (e.pointerType === 'pen') board.penSeen = true;
    if (e.pointerType === 'touch') {
        board.touches.set(e.pointerId, {y: e.clientY});
        if (board.touches.size > 1 || board.penSeen) { boardCancelLive(); board.panY = touchMid(); e.preventDefault(); return; }
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { board.canvas.setPointerCapture(e.pointerId); } catch {}
    const [x, y] = boardPoint(e);
    board.live = {c: board.tool === 'erase' ? -1 : board.ink, w: board.tool === 'erase' ? BOARD.eraser : BOARD_SIZES[board.size][0], p: [x, y], id: e.pointerId};
    boardRedraw();
}
function boardMove(e) {
    if (e.pointerType === 'touch' && board.touches.has(e.pointerId)) {
        board.touches.get(e.pointerId).y = e.clientY;
        if (board.panY !== null && (board.touches.size > 1 || board.penSeen)) {
            const y = touchMid(), dy = y - board.panY; board.panY = y;
            if (board.full) board.scroller.scrollTop -= dy; else window.scrollBy(0, -dy);
            e.preventDefault(); return;
        }
    }
    const s = board.live;
    if (!s || e.pointerId !== s.id) return;
    e.preventDefault();
    const merged = e.getCoalescedEvents?.();
    for (const ev of merged?.length ? merged : [e]) {
        const [x, y] = boardPoint(ev), n = s.p.length;
        if (Math.hypot(x - s.p[n - 2], y - s.p[n - 1]) < .8) continue;
        s.p.push(x, y);
        board.ctx.setTransform(board.scale, 0, 0, board.scale, 0, 0);
        board.ctx.lineCap = board.ctx.lineJoin = 'round';
        boardSegment(board.ctx, s);
    }
}
function boardUp(e) {
    if (e.pointerType === 'touch') { board.touches.delete(e.pointerId); board.panY = board.touches.size && (board.touches.size > 1 || board.penSeen) ? touchMid() : null; }
    const s = board.live;
    if (!s || e.pointerId !== s.id) return;
    board.live = null;
    if (e.type === 'pointercancel') { boardRedraw(); return; }
    const stroke = {c: s.c, w: s.w, p: simplify(s.p, .6).map(v => Math.round(v))}, low = Math.max(...stroke.p.filter((_, i) => i % 2)) + s.w;
    if (low > board.h && board.h < BOARD.maxHeight) board.h = Math.min(BOARD.maxHeight, Math.ceil(low / 50) * 50 + 100); // writing past the bottom (in full screen) makes room
    boardDo({type: 'add', stroke});
}

/* ---------- mounting ---------- */
function mountBoard(id) {
    const canvas = document.getElementById('board-canvas');
    if (!canvas) return;
    const saved = boardStore()[id], prev = board;
    board = {id, canvas, ctx: canvas.getContext('2d'), scroller: document.getElementById('board-scroll'), strokes: saved?.strokes || [], h: saved?.h || BOARD.height, undo: [], redo: [],
        tool: 'pen', ink: prev?.ink || 0, size: prev?.size ?? 1, live: null, touches: new Map(), panY: null, penSeen: prev?.penSeen || false, full: false, scale: 1};
    boardNote('');
    canvas.addEventListener('pointerdown', boardDown);
    canvas.addEventListener('pointermove', boardMove);
    for (const t of ['pointerup', 'pointercancel']) canvas.addEventListener(t, boardUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.getElementById('board-open').onclick = () => boardOpen(true, true);
    document.getElementById('board-hide').onclick = () => boardOpen(false);
    document.getElementById('board-pen').onclick = () => boardTool('pen');
    document.getElementById('board-erase').onclick = () => boardTool('erase');
    document.querySelectorAll('#board [data-ink]').forEach(b => { b.onclick = () => { board.ink = +b.dataset.ink; boardTool('pen'); }; });
    document.querySelectorAll('#board [data-size]').forEach(b => { b.onclick = () => { board.size = +b.dataset.size; boardTool('pen'); }; });
    document.getElementById('board-undo').onclick = boardUndo;
    document.getElementById('board-redo').onclick = boardRedo;
    document.getElementById('board-clear').onclick = () => { if (board.strokes.length) boardDo({type: 'clear', strokes: board.strokes.slice()}); };
    document.getElementById('board-more').onclick = () => { if (board.h < BOARD.maxHeight) boardDo({type: 'room', from: board.h, to: Math.min(BOARD.maxHeight, board.h + BOARD.step)}); };
    document.getElementById('board-png').onclick = boardImage;
    document.getElementById('board-full').onclick = () => boardFull(!board.full);
    document.body.classList.remove('board-full');
    board.observer?.disconnect?.();
    if (window.ResizeObserver) { board.observer = new ResizeObserver(() => boardResize()); board.observer.observe(board.scroller); }
    boardButtons();
    let open = false;
    try { open = !!saved?.strokes?.length || localStorage.getItem(BOARD.pref) === '1'; } catch {}
    document.getElementById('board').hidden = !open;
    document.getElementById('board-closed').hidden = open;
    if (open) boardResize();
}
/* Keys while not typing an answer: W opens or hides the board; with it open, P pen, E eraser, Ctrl+Z / Ctrl+Shift+Z
   (or Ctrl+Y) undo and redo, and Esc leaves full screen before it does anything else. */
document.addEventListener('keydown', e => {
    if (!board || !document.contains(board.canvas) || document.querySelector('dialog[open]')) return;
    if (e.target.closest?.('math-field, input, textarea, select')) return;
    const open = !document.getElementById('board').hidden, k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === 'escape' && board.full) { e.preventDefault(); e.stopImmediatePropagation(); boardFull(false); return; }
    if (!mod && !e.altKey && k === 'w') { e.preventDefault(); boardOpen(!open, !open); return; }
    if (!open) return;
    if (!mod && !e.altKey && (k === 'p' || k === 'e')) { e.preventDefault(); boardTool(k === 'p' ? 'pen' : 'erase'); return; }
    if (mod && (k === 'z' || k === 'y')) { e.preventDefault(); (k === 'y' || e.shiftKey) ? boardRedo() : boardUndo(); }
}, true);
window.addEventListener('resize', () => boardResize());
