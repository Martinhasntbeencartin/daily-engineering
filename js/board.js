/* The whiteboard under each problem: freehand working with a pen, shapes (line, arrow, box, ellipse), text, an eraser,
   colours, undo and redo, more room, full screen and a PNG copy. Everything is stored as vectors in a space 1600 units
   wide, so the board redraws sharply at any size, and each problem keeps its own board in localStorage (the most recent
   BOARD.keep of them).
   Input: a mouse, a pen or one finger draws; two fingers scroll; once a pen has touched the board, fingers only scroll,
   so a resting palm leaves no marks. */
const BOARD = {store: 'daily-engineer-boards', pref: 'daily-engineer-board-open', width: 1600, height: 1000, step: 600, maxHeight: 4000, keep: 40, eraser: 40, maxPixels: 16e6};
const BOARD_INKS = [['#ecebe6', 'Chalk'], ['#ff6b6b', 'Red'], ['#74e3b4', 'Green'], ['#ffc65c', 'Yellow'], ['#7cb7ff', 'Blue']];
const BOARD_SIZES = [[3, 'Fine'], [6, 'Medium'], [12, 'Thick']];
const BOARD_TEXT = [28, 40, 60]; // text height for each size, in board units
const BOARD_BG = '#0e1311';
const BOARD_FONT = size => `${size}px "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif`;
const BOARD_TOOLS = [['pen', 'Pen', 'p'], ['line', 'Line', 'l'], ['arrow', 'Arrow', 'a'], ['rect', 'Box', 'r'], ['ellipse', 'Ellipse', 'o'], ['text', 'Text', 't'], ['erase', 'Eraser', 'e']];
const BOARD_SHAPES = ['line', 'arrow', 'rect', 'ellipse'];
const BOARD_HINTS = {
    draw: 'Draw with a mouse, a pen or one finger; scroll with two fingers. Saved in this browser.',
    shape: 'Drag to draw. Hold Shift for 45° lines, squares and circles.',
    text: 'Click or tap where the text goes. Enter finishes, Shift+Enter adds a line, Esc cancels. Type \\omega for ω, x^2 for x², R_1 for R₁.'
};
const BOARD_ICONS = {
    pen: '<path d="M4 20l4.5-1L19.5 8 16 4.5 5 15.5z"/><path d="M14 6.5l3.5 3.5"/>',
    line: '<path d="M5 19L19 5"/>',
    arrow: '<path d="M5 19L18 6"/><path d="M10 6h8v8"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
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
/* Quick notation for the text tool: \name for Greek letters and symbols, ^digits and _digits for super- and subscripts. */
const BOARD_SYMBOLS = {alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'µ', pi: 'π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', Phi: 'Φ', omega: 'ω', Omega: 'Ω',
    sqrt: '√', int: '∫', sum: 'Σ', infty: '∞', inf: '∞', pm: '±', approx: '≈', neq: '≠', ne: '≠', le: '≤', leq: '≤', ge: '≥', geq: '≥', to: '→', cdot: '·', times: '×', deg: '°', partial: '∂', nabla: '∇', angle: '∠', parallel: '∥'};
const BOARD_SPACED = new Set(['approx', 'neq', 'ne', 'le', 'leq', 'ge', 'geq', 'to', 'pm', 'times', 'cdot']); // relations keep the space typed after them
const BOARD_SUP = {0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '⁺', n: 'ⁿ'};
const BOARD_SUB = {0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉'};
function boardSymbols(t, final) { // live: only sequences already ended by another character; final: everything
    const stop = (chars, gap = '') => `(?:${gap}(?=[^${chars}]${final ? '|$' : ''}))`; // a space after \name ends it and is dropped, as in LaTeX
    return t.replace(new RegExp('\\\\([A-Za-z]+)' + stop('A-Za-z', ' |'), 'g'), (m, w) => BOARD_SYMBOLS[w] ? BOARD_SYMBOLS[w] + (BOARD_SPACED.has(w) && m.endsWith(' ') ? ' ' : '') : m)
        .replace(new RegExp('\\^([-+]?[0-9]+)' + stop('0-9'), 'g'), (m, d) => [...d].map(ch => BOARD_SUP[ch]).join(''))
        .replace(new RegExp('\\^n' + stop('A-Za-z0-9'), 'g'), BOARD_SUP.n)
        .replace(new RegExp('_([0-9]+)' + stop('0-9'), 'g'), (m, d) => [...d].map(ch => BOARD_SUB[ch]).join(''));
}
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
        try { localStorage.setItem(BOARD.store, JSON.stringify(all)); board.warning = ''; boardNote(); return; }
        catch { const old = ids.pop(); if (!old || old === board.id) { board.warning = 'This board is too large to save in this browser; it stays until you leave the page.'; boardNote(); return; } delete all[old]; }
    }
}
function boardNote() {
    const el = document.getElementById('board-note');
    if (!el) return;
    el.textContent = board.warning || BOARD_HINTS[board.tool === 'text' ? 'text' : BOARD_SHAPES.includes(board.tool) ? 'shape' : 'draw'];
    el.classList.toggle('warn', !!board.warning);
}

/* ---------- markup ---------- */
function boardHTML(title, text) {
    return `<section class="board-wrap" id="board-wrap" aria-label="Whiteboard">
<div class="board-closed" id="board-closed"><button type="button" class="ghost" id="board-open">${boardIcon('pen')} Open the whiteboard</button><span>Work it out by hand. Your working is saved with this problem.</span></div>
<div class="board frame" id="board" hidden>
<details class="board-problem"><summary>${title}</summary><div class="problem-text">${text}</div></details>
<div class="board-bar" role="toolbar" aria-label="Whiteboard tools">
<div class="board-group" role="group" aria-label="Tool">${BOARD_TOOLS.map(([t, label, key]) => `<button type="button" class="board-btn${BOARD_SHAPES.includes(t) ? ' icon' : ''}" id="board-${t}" data-tool="${t}" title="${label} (${key.toUpperCase()})" aria-label="${label} (${key.toUpperCase()})" aria-pressed="${t === 'pen'}">${boardIcon(t)}<span>${label}</span></button>`).join('')}</div>
<div class="board-group" role="group" aria-label="Ink colour">${BOARD_INKS.map(([c, n], i) => `<button type="button" class="board-ink" data-ink="${i}" style="--swatch:${c}" title="${n} ink" aria-label="${n} ink" aria-pressed="${!i}"></button>`).join('')}</div>
<div class="board-group" role="group" aria-label="Size">${BOARD_SIZES.map(([w, n], i) => `<button type="button" class="board-size" data-size="${i}" style="--dot:${4 + 2.4 * i}px" title="${n}" aria-label="${n}" aria-pressed="${i === 1}"></button>`).join('')}</div>
<div class="board-group">${boardButton('board-undo', 'undo', 'Undo (Ctrl+Z)')}${boardButton('board-redo', 'redo', 'Redo (Ctrl+Shift+Z)')}${boardButton('board-clear', 'clear', 'Clear')}</div>
<div class="board-group board-end">${boardButton('board-more', 'more', 'More room')}${boardButton('board-png', 'png', 'Save image')}${boardButton('board-full', 'full', 'Full screen')}${boardButton('board-hide', 'hide', 'Hide (W)')}</div>
</div>
<div class="board-scroll" id="board-scroll"><canvas id="board-canvas" role="img" aria-label="Whiteboard for your working. Draw with a mouse, a pen or one finger; scroll with two fingers."></canvas></div>
<p class="board-note" id="board-note"></p>
</div>
</section>`;
}

/* ---------- drawing ---------- */
function boardPaint(ctx, s) { // one item, in board units
    ctx.globalCompositeOperation = s.c < 0 ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = s.c < 0 ? '#000' : BOARD_INKS[s.c][0];
    ctx.lineWidth = s.w;
    if (s.k === 'text') {
        // place the baseline where CSS puts it in a line 1.25 high, so the text lands exactly where it was typed
        ctx.font = BOARD_FONT(s.s); ctx.textBaseline = 'alphabetic';
        const m = ctx.measureText('Hg'), up = m.fontBoundingBoxAscent ?? .93 * s.s, down = m.fontBoundingBoxDescent ?? .25 * s.s, base = (1.25 * s.s - up - down) / 2 + up;
        s.t.split('\n').forEach((line, i) => ctx.fillText(line, s.x, s.y + i * s.s * 1.25 + base));
        return;
    }
    const p = s.p;
    if (s.k) { // shapes: a start and an end point
        const [x0, y0, x1, y1] = p;
        ctx.beginPath();
        if (s.k === 'rect') ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
        else if (s.k === 'ellipse') ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, 2 * Math.PI);
        else {
            const a = Math.atan2(y1 - y0, x1 - x0), head = s.k === 'arrow' ? Math.max(18, 4.5 * s.w) : 0;
            ctx.moveTo(x0, y0); ctx.lineTo(x1 - .6 * head * Math.cos(a), y1 - .6 * head * Math.sin(a));
            if (head) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - head * Math.cos(a - .42), y1 - head * Math.sin(a - .42)); ctx.lineTo(x1 - head * Math.cos(a + .42), y1 - head * Math.sin(a + .42)); ctx.closePath(); ctx.fill(); return; }
        }
        ctx.stroke();
        return;
    }
    if (p.length === 2) { ctx.beginPath(); ctx.arc(p[0], p[1], s.w / 2, 0, 2 * Math.PI); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    if (p.length === 4) ctx.lineTo(p[2], p[3]);
    for (let i = 2; i + 2 < p.length; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
    if (p.length > 4) ctx.lineTo(p[p.length - 2], p[p.length - 1]);
    ctx.stroke();
}
function boardSegment(ctx, s) { // the newest piece of a freehand stroke being drawn, matching boardPaint
    const p = s.p, n = p.length / 2 - 1;
    ctx.globalCompositeOperation = s.c < 0 ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.c < 0 ? '#000' : BOARD_INKS[s.c][0];
    ctx.lineWidth = s.w;
    ctx.beginPath();
    if (n === 1) { ctx.moveTo(p[0], p[1]); ctx.lineTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2); }
    else { const i = 2 * (n - 1); ctx.moveTo((p[i - 2] + p[i]) / 2, (p[i - 1] + p[i + 1]) / 2); ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2); }
    ctx.stroke();
}
const boardBottom = s => s.k === 'text' ? s.y + s.t.split('\n').length * s.s * 1.25 : Math.max(...s.p.filter((_, i) => i % 2)) + s.w;
function boardRedraw() {
    const {ctx, canvas} = board;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(board.scale, 0, 0, board.scale, 0, 0);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const s of board.strokes) boardPaint(ctx, s);
    if (board.live && board.live.k !== 'place') boardPaint(ctx, board.live);
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
    boardTextPlace();
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
function boardAdd(item) { // writing past the bottom (in full screen) makes room, then the item is added as one undoable step
    const low = boardBottom(item);
    if (low > board.h && board.h < BOARD.maxHeight) board.h = Math.min(BOARD.maxHeight, Math.ceil(low / 50) * 50 + 100);
    boardDo({type: 'add', stroke: item});
}
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
    document.querySelectorAll('.board-bar [data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === board.tool)));
    board.canvas.dataset.tool = board.tool;
    boardNote();
}
function boardTool(tool) { if (tool !== 'text') boardTextCommit(); board.tool = tool; boardButtons(); }
function boardOpen(open, focus = false) {
    if (!open) boardTextCommit();
    document.getElementById('board').hidden = !open;
    document.getElementById('board-closed').hidden = open;
    try { localStorage.setItem(BOARD.pref, open ? '1' : '0'); } catch {}
    if (!open && board.full) boardFull(false);
    if (open) { boardResize(); if (focus) document.getElementById('board').scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }
    (open ? document.getElementById(`board-${board.tool}`) : document.getElementById('board-open'))?.focus({preventScroll: !focus});
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
    boardTextCommit();
    const out = document.createElement('canvas'), ink = document.createElement('canvas');
    out.width = ink.width = BOARD.width; out.height = ink.height = board.h;
    const ic = ink.getContext('2d'); ic.lineCap = ic.lineJoin = 'round';
    board.strokes.forEach(s => boardPaint(ic, s));
    const oc = out.getContext('2d'); oc.fillStyle = BOARD_BG; oc.fillRect(0, 0, out.width, out.height); oc.drawImage(ink, 0, 0);
    out.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `working-${board.id.replace(/:/g, '-')}.png`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
}

/* ---------- text ---------- */
/* Text is at least 16 CSS px on screen (more for the larger sizes), so it stays readable on a phone and iOS does not zoom
   into the box; on a narrow board that means more board units, so phone text looks larger on a wide screen, like handwriting. */
const boardTextSize = () => Math.round(Math.max(BOARD_TEXT[board.size], (16 + 4 * board.size) * BOARD.width / (board.canvas.clientWidth || BOARD.width)));
function boardTextOpen(x, y) {
    boardTextCommit();
    const el = document.createElement('textarea');
    el.className = 'board-text';
    el.rows = 1; el.wrap = 'off'; el.spellcheck = false; el.autocapitalize = 'off';
    el.setAttribute('aria-label', 'Text on the whiteboard. Enter finishes, Shift+Enter adds a line, Escape cancels.');
    board.editor = {el, x, y, s: boardTextSize(), c: board.ink};
    board.scroller.append(el);
    boardTextPlace();
    el.addEventListener('input', () => {
        const tail = el.value.length - el.selectionEnd, next = boardSymbols(el.value, false);
        if (next !== el.value) { el.value = next; el.selectionStart = el.selectionEnd = next.length - tail; }
        boardTextFit();
    });
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); boardTextCommit(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); boardTextCancel(); }
    });
    el.addEventListener('blur', () => boardTextCommit());
    el.focus({preventScroll: true});
}
function boardTextPlace() { // keep the box over its spot when the board changes size
    const ed = board?.editor;
    if (!ed) return;
    const k = board.canvas.clientWidth / BOARD.width;
    Object.assign(ed.el.style, {left: ed.x * k + 'px', top: ed.y * k + 'px', font: BOARD_FONT(ed.s * k), color: BOARD_INKS[ed.c][0], lineHeight: '1.25'});
    boardTextFit();
}
function boardTextFit() {
    const el = board.editor?.el;
    if (!el) return;
    el.style.width = '0px'; el.style.height = '0px';
    el.style.width = Math.max(el.scrollWidth + 4, 40) + 'px'; el.style.height = el.scrollHeight + 'px';
}
function boardTextCommit() {
    const ed = board?.editor;
    if (!ed) return;
    board.editor = null;
    const t = boardSymbols(ed.el.value, true).replace(/\s+$/, '');
    ed.el.remove();
    if (t.trim()) boardAdd({k: 'text', c: ed.c, s: ed.s, x: Math.round(ed.x), y: Math.round(ed.y), t});
}
function boardTextCancel() { const ed = board?.editor; if (ed) { board.editor = null; ed.el.remove(); } }

/* ---------- input ---------- */
function boardPoint(e) { const r = board.canvas.getBoundingClientRect(); return [(e.clientX - r.left) * BOARD.width / r.width, (e.clientY - r.top) * BOARD.width / r.width]; }
const touchMid = () => { const ys = [...board.touches.values()].map(t => t.y); return ys.reduce((s, y) => s + y, 0) / ys.length; };
function boardCancelLive() { if (board.live) { board.live = null; board.base = null; boardRedraw(); } }
function boardDown(e) {
    if (e.pointerType === 'pen') board.penSeen = true;
    if (e.pointerType === 'touch') {
        board.touches.set(e.pointerId, {y: e.clientY});
        if (board.touches.size > 1 || board.penSeen) { boardCancelLive(); board.panY = touchMid(); e.preventDefault(); return; }
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    boardTextCommit();
    try { board.canvas.setPointerCapture(e.pointerId); } catch {}
    const [x, y] = boardPoint(e), tool = board.tool;
    if (tool === 'text') { board.live = {k: 'place', p: [x, y], id: e.pointerId}; return; }
    if (BOARD_SHAPES.includes(tool)) {
        board.live = {k: tool, c: board.ink, w: BOARD_SIZES[board.size][0], p: [x, y, x, y], id: e.pointerId};
        board.base = document.createElement('canvas'); board.base.width = board.canvas.width; board.base.height = board.canvas.height;
        board.base.getContext('2d').drawImage(board.canvas, 0, 0);
        return;
    }
    board.live = {c: tool === 'erase' ? -1 : board.ink, w: tool === 'erase' ? BOARD.eraser : BOARD_SIZES[board.size][0], p: [x, y], id: e.pointerId};
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
    if (s.k === 'place') return;
    if (s.k) { // a shape follows the pointer; Shift snaps lines to 45° and makes squares and circles
        let [x, y] = boardPoint(e), dx = x - s.p[0], dy = y - s.p[1];
        if (e.shiftKey) {
            if (s.k === 'line' || s.k === 'arrow') { const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, r = Math.hypot(dx, dy); dx = r * Math.cos(a); dy = r * Math.sin(a); }
            else { const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = Math.sign(dx || 1) * m; dy = Math.sign(dy || 1) * m; }
        }
        s.p[2] = s.p[0] + dx; s.p[3] = s.p[1] + dy;
        const {ctx, canvas} = board;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(board.base, 0, 0);
        ctx.setTransform(board.scale, 0, 0, board.scale, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
        boardPaint(ctx, s);
        return;
    }
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
    board.live = null; board.base = null;
    if (e.type === 'pointercancel') { boardRedraw(); return; }
    if (s.k === 'place') { boardTextOpen(s.p[0], s.p[1]); return; }
    if (s.k) {
        if (Math.hypot(s.p[2] - s.p[0], s.p[3] - s.p[1]) < 4) { boardRedraw(); return; } // a click, not a shape
        boardAdd({k: s.k, c: s.c, w: s.w, p: s.p.map(v => Math.round(v))});
        return;
    }
    boardAdd({c: s.c, w: s.w, p: simplify(s.p, .6).map(v => Math.round(v))});
}

/* ---------- mounting ---------- */
function mountBoard(id) {
    const canvas = document.getElementById('board-canvas');
    if (!canvas) return;
    if (board?.editor) boardTextCommit(); // text still being typed is kept when the page changes
    const saved = boardStore()[id], prev = board;
    board = {id, canvas, ctx: canvas.getContext('2d'), scroller: document.getElementById('board-scroll'), strokes: saved?.strokes || [], h: saved?.h || BOARD.height, undo: [], redo: [],
        tool: prev && prev.tool !== 'erase' ? prev.tool : 'pen', ink: prev?.ink || 0, size: prev?.size ?? 1, live: null, base: null, editor: null, warning: '',
        touches: new Map(), panY: null, penSeen: prev?.penSeen || false, full: false, scale: 1};
    canvas.addEventListener('pointerdown', boardDown);
    canvas.addEventListener('pointermove', boardMove);
    for (const t of ['pointerup', 'pointercancel']) canvas.addEventListener(t, boardUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.getElementById('board-open').onclick = () => boardOpen(true, true);
    document.getElementById('board-hide').onclick = () => boardOpen(false);
    document.querySelectorAll('.board-bar [data-tool]').forEach(b => { b.onclick = () => boardTool(b.dataset.tool); });
    const pick = () => { // a colour or size applies to the text being typed too, without leaving it
        const ed = board.editor;
        if (ed) { ed.c = board.ink; ed.s = boardTextSize(); boardTextPlace(); ed.el.focus({preventScroll: true}); }
        if (board.tool === 'erase') boardTool('pen'); else boardButtons();
    };
    document.querySelectorAll('#board [data-ink], #board [data-size]').forEach(b => { b.onmousedown = e => { if (board.editor) e.preventDefault(); }; });
    document.querySelectorAll('#board [data-ink]').forEach(b => { b.onclick = () => { board.ink = +b.dataset.ink; pick(); }; });
    document.querySelectorAll('#board [data-size]').forEach(b => { b.onclick = () => { board.size = +b.dataset.size; pick(); }; });
    document.getElementById('board-undo').onclick = boardUndo;
    document.getElementById('board-redo').onclick = boardRedo;
    document.getElementById('board-clear').onclick = () => { if (board.strokes.length) boardDo({type: 'clear', strokes: board.strokes.slice()}); };
    document.getElementById('board-more').onclick = () => { if (board.h < BOARD.maxHeight) boardDo({type: 'room', from: board.h, to: Math.min(BOARD.maxHeight, board.h + BOARD.step)}); };
    document.getElementById('board-png').onclick = boardImage;
    document.getElementById('board-full').onclick = () => boardFull(!board.full);
    document.body.classList.remove('board-full');
    prev?.observer?.disconnect?.();
    if (window.ResizeObserver) { board.observer = new ResizeObserver(() => boardResize()); board.observer.observe(board.scroller); }
    boardButtons();
    const texts = board.strokes.filter(s => s.k === 'text'), mine = board; // web fonts (and their Greek subset) may arrive after the first draw
    if (texts.length && document.fonts?.load) Promise.all(texts.map(s => document.fonts.load(BOARD_FONT(s.s), s.t).catch(() => {}))).then(() => { if (board === mine) boardRedraw(); });
    let open = false;
    try { open = !!saved?.strokes?.length || localStorage.getItem(BOARD.pref) === '1'; } catch {}
    document.getElementById('board').hidden = !open;
    document.getElementById('board-closed').hidden = open;
    if (open) boardResize();
}
/* Keys while not typing an answer or text: W opens or hides the board; with it open, P pen, L line, A arrow, R box,
   O ellipse, T text, E eraser, Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) undo and redo; Esc leaves full screen first. */
const BOARD_KEYS = Object.fromEntries(BOARD_TOOLS.map(([t, , key]) => [key, t]));
document.addEventListener('keydown', e => {
    if (!board || !document.contains(board.canvas) || document.querySelector('dialog[open]')) return;
    if (e.target.closest?.('math-field, input, textarea, select')) return;
    const open = !document.getElementById('board').hidden, k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === 'escape' && board.full) { e.preventDefault(); e.stopImmediatePropagation(); boardFull(false); return; }
    if (!mod && !e.altKey && k === 'w') { e.preventDefault(); boardOpen(!open, !open); return; }
    if (!open) return;
    if (!mod && !e.altKey && BOARD_KEYS[k]) { e.preventDefault(); boardTool(BOARD_KEYS[k]); return; }
    if (mod && (k === 'z' || k === 'y')) { e.preventDefault(); (k === 'y' || e.shiftKey) ? boardRedo() : boardUndo(); }
}, true);
window.addEventListener('resize', () => boardResize());
