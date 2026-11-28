/* The whiteboard under each problem: freehand working with a pen, shapes (line, arrow, box, ellipse), text, an eraser
   that removes whole items, a chalkboard or paper look, a first-time tour,
   a select tool to move, resize, nudge, restyle, copy, paste, duplicate, reorder or delete what is already drawn (one item or several), colours, undo and redo, more room, full screen
   and a PNG copy. Everything is stored as vectors in a space 1600 units
   wide, so the board redraws sharply at any size, and each problem keeps its own board in localStorage (the most recent
   BOARD.keep of them).
   Input: a mouse, a pen or one finger draws; two fingers scroll; once a pen has touched the board, fingers only scroll,
   so a resting palm leaves no marks. */
const BOARD = {store: 'daily-engineer-boards', pref: 'daily-engineer-board-open', paper: 'daily-engineer-board-paper', clip: 'daily-engineer-board-clip', tour: 'daily-engineer-board-tour', width: 1600, height: 1000, step: 600, maxHeight: 4000, keep: 40, eraser: 10, maxPixels: 16e6} // eraser: its reach in CSS px (more for a finger);
/* Each ink: [chalkboard colour, name, paper colour, name]. Items store the ink's number, so the same working redraws in either
   look; on paper chalk becomes near-black and yellow becomes amber, and every paper ink has at least 4.5:1 contrast. */
const BOARD_INKS = [['#ecebe6', 'Chalk', '#1f2328', 'Black'], ['#ff6b6b', 'Red', '#cf222e', 'Red'], ['#74e3b4', 'Green', '#1a7f37', 'Green'], ['#ffc65c', 'Yellow', '#b45309', 'Amber'], ['#7cb7ff', 'Blue', '#0969da', 'Blue']];
const boardPaperPref = () => { try { return localStorage.getItem(BOARD.paper) === '1'; } catch { return false; } };
const boardOnPaper = () => board ? board.paper : boardPaperPref();
const boardInk = c => BOARD_INKS[c][boardOnPaper() ? 2 : 0];
const boardInkName = c => BOARD_INKS[c][boardOnPaper() ? 3 : 1];
const BOARD_SIZES = [[3, 'Fine'], [6, 'Medium'], [12, 'Thick']];
const BOARD_TEXT = [28, 40, 60]; // text height for each size, in board units
const BOARD_BG = '#0e1311', BOARD_PAPER = '#fbfaf6';
const BOARD_FONT = size => `${size}px "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif`;
const BOARD_TOOLS = [['select', 'Select', 'v'], ['pen', 'Pen', 'p'], ['line', 'Line', 'l'], ['arrow', 'Arrow', 'a'], ['rect', 'Box', 'r'], ['ellipse', 'Ellipse', 'o'], ['text', 'Text', 't'], ['erase', 'Eraser', 'e']];
const BOARD_SHAPES = ['line', 'arrow', 'rect', 'ellipse'];
const BOARD_HINTS = {
    draw: 'Draw with a mouse, a pen or one finger; scroll with two fingers. Saved in this browser.',
    erase: 'Drag over anything to rub it out: each stroke, shape or text it touches goes whole. Undo brings it back.',
    shape: 'Drag to draw. Hold Shift for 45° lines, squares and circles.',
    select: 'Click or tap to select; drag across empty board or Shift-click to select several. Drag to move, or a handle to resize (Shift keeps proportions); double-click text to edit it. Delete or × removes; arrow keys nudge; a colour or size restyles.',
    text: 'Click or tap where the text goes, or on text to edit it. Enter finishes, Shift+Enter adds a line, Esc cancels. Type \\omega for ω, x^2 for x², R_1 for R₁.'
};
const BOARD_ICONS = {
    select: '<path d="M6 3.5v15l4-4 3 6.5 2.6-1.2-3-6.3H18z"/>',
    pen: '<path d="M4 20l4.5-1L19.5 8 16 4.5 5 15.5z"/><path d="M14 6.5l3.5 3.5"/>',
    line: '<path d="M5 19L19 5"/>',
    arrow: '<path d="M5 19L18 6"/><path d="M10 6h8v8"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    erase: '<path d="M9 20h11"/><path d="M4.5 15.5l9.5-9.5 5 5-9 9H8.5z"/><path d="M9 11l5 5"/>',
    front: '<rect x="4" y="4" width="11" height="11" rx="1.5" stroke-dasharray="2.2 2.2"/><rect x="9" y="9" width="11" height="11" rx="1.5" fill="currentColor"/>',
    back: '<rect x="4" y="4" width="11" height="11" rx="1.5" fill="currentColor"/><rect x="9" y="9" width="11" height="11" rx="1.5" style="fill: var(--bg)"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    duplicate: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M14 11v6M11 14h6"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    paste: '<path d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15"/><rect x="9" y="3" width="6" height="4" rx="1"/>',
    undo: '<path d="M9 15L4 10l5-5"/><path d="M4 10h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="M15 15l5-5-5-5"/><path d="M20 10H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    clear: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    more: '<path d="M4 5h16M4 19h16M12 9v6M9 12h6"/>',
    png: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    exit: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    hide: '<path d="M6 6l12 12M18 6L6 18"/>',
    paper: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    tour: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6"/><path d="M12 16.9v.1"/>'
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
    el.textContent = board.warning || board.said || BOARD_HINTS[['text', 'select', 'erase'].includes(board.tool) ? board.tool : BOARD_SHAPES.includes(board.tool) ? 'shape' : 'draw'];
    el.classList.toggle('warn', !!board.warning);
}
function boardSay(text) { // a short confirmation in the note under the board, read out by screen readers
    const mine = board;
    board.said = text; boardNote();
    clearTimeout(board.sayTimer);
    board.sayTimer = setTimeout(() => { if (board === mine) { board.said = ''; boardNote(); } }, 1800);
}

/* ---------- markup ---------- */
function boardHTML(title, text) {
    return `<section class="board-wrap" id="board-wrap" aria-label="Whiteboard">
<div class="board-closed" id="board-closed"><button type="button" class="ghost" id="board-open">${boardIcon('pen')} Open the whiteboard</button><span>Work it out by hand. Your working is saved with this problem.</span></div>
<div class="board frame${boardPaperPref() ? ' paper' : ''}" id="board" hidden>
<details class="board-problem"><summary>${title}</summary><div class="problem-text">${text}</div></details>
<div class="board-bar" role="toolbar" aria-label="Whiteboard tools">
<div class="board-group" role="group" aria-label="Tool">${BOARD_TOOLS.map(([t, label, key]) => `<button type="button" class="board-btn${BOARD_SHAPES.includes(t) ? ' icon' : ''}" id="board-${t}" data-tool="${t}" title="${label} (${key.toUpperCase()})" aria-label="${label} (${key.toUpperCase()})" aria-pressed="${t === 'pen'}">${boardIcon(t)}<span>${label}</span></button>`).join('')}</div>
<div class="board-group" role="group" aria-label="Ink colour">${BOARD_INKS.map((_, i) => `<button type="button" class="board-ink" data-ink="${i}" style="--swatch:${boardInk(i)}" title="${boardInkName(i)} ink" aria-label="${boardInkName(i)} ink" aria-pressed="${!i}"></button>`).join('')}</div>
<div class="board-group" role="group" aria-label="Size">${BOARD_SIZES.map(([w, n], i) => `<button type="button" class="board-size" data-size="${i}" style="--dot:${4 + 2.4 * i}px" title="${n}" aria-label="${n}" aria-pressed="${i === 1}"></button>`).join('')}</div>
<div class="board-group">${boardButton('board-undo', 'undo', 'Undo (Ctrl+Z)')}${boardButton('board-redo', 'redo', 'Redo (Ctrl+Shift+Z)')}${boardButton('board-paste', 'paste', 'Paste (Ctrl+V)')}${boardButton('board-clear', 'clear', 'Clear')}</div>
<div class="board-group board-end">${boardButton('board-more', 'more', 'More room')}${boardButton('board-png', 'png', 'Save image')}${boardButton('board-full', 'full', 'Full screen')}${boardButton('board-paper', 'paper', 'Paper', ` aria-pressed="${boardPaperPref()}"`)}${boardButton('board-tour', 'tour', 'Tour')}${boardButton('board-hide', 'hide', 'Hide (W)')}</div>
</div>
<div class="board-scroll" id="board-scroll"><canvas id="board-canvas" role="img" aria-label="Whiteboard for your working. Draw with a mouse, a pen or one finger; scroll with two fingers."></canvas><div class="board-marquee" id="board-marquee" hidden></div><div class="board-sel" id="board-sel" hidden></div>${'<div class="board-handle" hidden></div>'.repeat(4)}<div class="board-sel-bar" id="board-sel-bar" role="group" aria-label="Selection" hidden><button type="button" class="board-sel-btn" id="board-sel-copy" title="Copy (Ctrl+C)" aria-label="Copy">${boardIcon('copy')}</button><button type="button" class="board-sel-btn" id="board-sel-dup" title="Duplicate (Ctrl+D)" aria-label="Duplicate">${boardIcon('duplicate')}</button><button type="button" class="board-sel-btn" id="board-sel-front" title="Bring to front (])" aria-label="Bring to front">${boardIcon('front')}</button><button type="button" class="board-sel-btn" id="board-sel-back" title="Send to back ([)" aria-label="Send to back">${boardIcon('back')}</button><button type="button" class="board-sel-btn board-sel-del" id="board-sel-del" title="Delete (Del)" aria-label="Delete the selected item">${boardIcon('hide')}</button></div></div>
<p class="board-note" id="board-note" aria-live="polite"></p>
</div>
</section>`;
}

/* ---------- drawing ---------- */
function boardPaint(ctx, s) { // one item, in board units
    ctx.globalCompositeOperation = s.c < 0 ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = s.c < 0 ? '#000' : boardInk(s.c);
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
    ctx.strokeStyle = s.c < 0 ? '#000' : boardInk(s.c);
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
    for (const s of board.strokes) if (s !== board.editor?.item) boardPaint(ctx, s); // text being edited shows only in its box
    if (board.live && 'c' in board.live) boardPaint(ctx, board.live);
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
    if (board.base) { board.live = null; board.base = null; } // a drag in progress: its snapshot no longer fits
    boardRedraw();
    boardTextPlace();
    boardSelPlace();
    boardTourPlace();
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
    const list = action.list, at = board.strokes; // move, delete and replace hold [{i, item, next}] sorted by place in the stack
    if (action.type === 'add') { if (reverse) at.pop(); else at.push(action.stroke); }
    else if (action.type === 'clear') board.strokes = reverse ? action.strokes : [];
    else if (action.type === 'room') { board.h = reverse ? action.from : action.to; boardResize(); }
    else if (action.type === 'move') { // moved items come to the front, whole, keeping their order
        if (reverse) { at.splice(at.length - list.length); list.forEach(e => at.splice(e.i, 0, e.item)); }
        else { for (let j = list.length - 1; j >= 0; j--) at.splice(list[j].i, 1); list.forEach(e => at.push(e.next)); }
    }
    else if (action.type === 'delete') {
        if (reverse) list.forEach(e => at.splice(e.i, 0, e.item));
        else for (let j = list.length - 1; j >= 0; j--) at.splice(list[j].i, 1);
    }
    else if (action.type === 'replace') list.forEach(e => { at[e.i] = reverse ? e.item : e.next; });
    else if (action.type === 'paste') { if (reverse) at.splice(at.length - action.items.length); else at.push(...action.items); }
    else if (action.type === 'order') board.strokes = (reverse ? action.from : action.to).slice();
    const back = action.type === 'delete' && reverse ? list.map(e => e.item) : action.type === 'paste' && !reverse ? action.items : null;
    if (back && board.tool === 'select') board.sel = back.slice(); // what comes back (or is pasted) is selected
    else if (board.sel.length) { // undo and redo carry the selection with its items
        const swap = new Map((action.type === 'move' || action.type === 'replace') && board.tool === 'select' ? list.map(e => reverse ? [e.next, e.item] : [e.item, e.next]) : []);
        board.sel = board.sel.map(s => board.strokes.includes(s) ? s : swap.get(s)).filter(Boolean);
    }
    boardRedraw(); boardPersist(); boardButtons(); boardSelPlace();
}
function boardUndo() { const a = board.undo.pop(); if (a) { board.redo.push(a); boardApply(a, true); } }
function boardRedo() { const a = board.redo.pop(); if (a) { board.undo.push(a); boardApply(a, false); } }
function boardButtons() {
    const set = (id, on) => { const el = document.getElementById(id); if (el) el.disabled = !on; };
    set('board-undo', board.undo.length); set('board-redo', board.redo.length); set('board-paste', boardClipGet()?.items?.length); set('board-clear', board.strokes.length); set('board-more', board.h < BOARD.maxHeight);
    document.querySelectorAll('#board [data-ink]').forEach(b => {
        const i = +b.dataset.ink;
        b.setAttribute('aria-pressed', String(i === board.ink)); b.style.setProperty('--swatch', boardInk(i)); b.title = `${boardInkName(i)} ink`; b.setAttribute('aria-label', b.title);
    });
    document.getElementById('board-paper')?.setAttribute('aria-pressed', String(board.paper));
    document.querySelectorAll('#board [data-size]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.size === board.size)));
    document.querySelectorAll('.board-bar [data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === board.tool)));
    board.canvas.dataset.tool = board.tool;
    board.canvas.style.cursor = '';
    boardNote();
}
function boardTool(tool) { if (tool !== 'text') boardTextCommit(); if (tool !== 'select') boardSelect([]); board.tool = tool; boardButtons(); }
function boardOpen(open, focus = false) {
    if (!open) { boardTextCommit(); boardTourEnd(false); }
    document.getElementById('board').hidden = !open;
    document.getElementById('board-closed').hidden = open;
    try { localStorage.setItem(BOARD.pref, open ? '1' : '0'); } catch {}
    if (!open && board.full) boardFull(false);
    if (open) { boardResize(); if (focus) document.getElementById('board').scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }
    (open ? document.getElementById(`board-${board.tool}`) : document.getElementById('board-open'))?.focus({preventScroll: !focus});
    if (open && focus && !boardTourSeen()) requestAnimationFrame(() => { if (board && !document.getElementById('board').hidden) boardTourStart(); }); // the first time it is opened on request
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
function boardPaper(on) { // dark ink on white paper, or light chalk on the dark board; for every board in this browser
    board.paper = on;
    try { localStorage.setItem(BOARD.paper, on ? '1' : '0'); } catch {}
    document.getElementById('board').classList.toggle('paper', on);
    boardButtons(); boardRedraw(); boardTextPlace();
    boardSay(on ? 'Paper: dark ink on white' : 'Chalkboard: light chalk on dark');
}
function boardImage() {
    boardTextCommit();
    const out = document.createElement('canvas'), ink = document.createElement('canvas');
    out.width = ink.width = BOARD.width; out.height = ink.height = board.h;
    const ic = ink.getContext('2d'); ic.lineCap = ic.lineJoin = 'round';
    board.strokes.forEach(s => boardPaint(ic, s));
    const oc = out.getContext('2d'); oc.fillStyle = board.paper ? BOARD_PAPER : BOARD_BG; oc.fillRect(0, 0, out.width, out.height); oc.drawImage(ink, 0, 0);
    out.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `working-${board.id.replace(/:/g, '-')}.png`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
}

/* ---------- selecting, moving and resizing ---------- */
/* The selection is a list of items (board.sel). One item or several behave the same way: a dashed frame around them all,
   corner handles that scale them together (a single line or arrow has a handle on each end instead), a delete button,
   and moves, nudges, resizes, restyles and deletes that each make one undoable step. */
const boardMeasure = document.createElement('canvas').getContext('2d');
function boardBox(s) { // bounding box [left, top, right, bottom] in board units
    if (s.k === 'text') {
        boardMeasure.font = BOARD_FONT(s.s);
        const lines = s.t.split('\n');
        return [s.x, s.y, s.x + Math.max(...lines.map(l => boardMeasure.measureText(l).width)), s.y + lines.length * s.s * 1.25];
    }
    const xs = s.p.filter((_, i) => !(i % 2)), ys = s.p.filter((_, i) => i % 2), pad = s.k === 'arrow' ? .45 * Math.max(18, 4.5 * s.w) : s.w / 2;
    return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
}
function boardGeom(s) { // the item's own extent in board units, without line widths: what a resize scales
    if (s.k === 'text') return boardBox(s);
    const xs = s.p.filter((_, i) => !(i % 2)), ys = s.p.filter((_, i) => i % 2);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const boardUnion = (items, box) => items.map(box).reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])]);
const boardShift = (s, dx, dy) => s.k === 'text' ? {...s, x: s.x + dx, y: s.y + dy} : {...s, p: s.p.map((v, i) => v + (i % 2 ? dy : dx))};
const segDist = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
};
function boardHit(s, x, y, tol) { // near the ink of one item (text: inside its box)
    if (s.c < 0) return false;
    if (s.k === 'text') { const [a, b, c, d] = boardBox(s); return x >= a - tol && x <= c + tol && y >= b - tol && y <= d + tol; }
    const r = tol + s.w / 2, p = s.p;
    if (s.k === 'rect') { const [x0, y0, x1, y1] = p; return [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]].some(q => segDist(x, y, ...q) <= r); }
    if (s.k === 'ellipse') {
        const rx = Math.abs(p[2] - p[0]) / 2 || .5, ry = Math.abs(p[3] - p[1]) / 2 || .5;
        return Math.abs(Math.hypot((x - (p[0] + p[2]) / 2) / rx, (y - (p[1] + p[3]) / 2) / ry) - 1) * Math.min(rx, ry) <= r;
    }
    if (p.length === 2) return Math.hypot(x - p[0], y - p[1]) <= r;
    for (let i = 0; i + 3 < p.length; i += 2) if (segDist(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= r) return true;
    return false;
}
function boardPick(x, y, tol) { // the topmost item whose ink is under the pointer
    for (let i = board.strokes.length - 1; i >= 0; i--) if (boardHit(board.strokes[i], x, y, tol)) return board.strokes[i];
    return null;
}
function boardPickInside(x, y) { // the topmost box or ellipse around a point: a tap inside an empty box selects it
    for (let i = board.strokes.length - 1; i >= 0; i--) {
        const s = board.strokes[i];
        if (s.k === 'rect' || s.k === 'ellipse') { const [a, b, c, d] = boardBox(s); if (x > a && x < c && y > b && y < d) return s; }
    }
    return null;
}
const boardSelectable = () => board.strokes.filter(s => s.c >= 0);
function boardSelect(list) { board.sel = list; boardSelPlace(); }
function boardFrame(items) { // the dashed frame around items in CSS px: their box plus a margin, at least 44 px across
    const k = board.canvas.clientWidth / BOARD.width, [a, b, c, d] = boardUnion(items, boardBox), pad = 6;
    const span = (lo, hi) => { const more = 44 - (hi - lo); return more > 0 ? [lo - more / 2, hi + more / 2] : [lo, hi]; };
    const [l, r] = span(a * k - pad, c * k + pad), [t, bo] = span(b * k - pad, d * k + pad);
    return [l, t, r, bo];
}
const boardInFrame = (items, x, y) => { const [l, t, r, b] = boardFrame(items); return x >= l && x <= r && y >= t && y <= b; };
const boardEnds = items => items.length === 1 && (items[0].k === 'line' || items[0].k === 'arrow');
function boardHandles(items) { // [x, y, name] in CSS px: the two ends of a single line or arrow, otherwise the frame's corners
    const k = board.canvas.clientWidth / BOARD.width;
    if (boardEnds(items)) { const p = items[0].p; return [[p[0] * k, p[1] * k, 'end0'], [p[2] * k, p[3] * k, 'end1']]; }
    const [l, t, r, b] = boardFrame(items);
    return [[l, t, 'nw'], [r, t, 'ne'], [l, b, 'sw'], [r, b, 'se']];
}
function boardHandleAt(items, x, y, tol) { // the handle under a point in CSS px, if any
    let best = null, near = tol;
    for (const [hx, hy, name] of boardHandles(items)) { const d = Math.hypot(x - hx, y - hy); if (d <= near) { near = d; best = name; } }
    return best;
}
const BOARD_RESIZE_CURSOR = {nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', end0: 'crosshair', end1: 'crosshair'};
function boardSelPlace(view = board?.sel) { // the frame, handles, delete button and (for several) each item's outline follow the selection or its preview
    const box = document.getElementById('board-sel'), bar = document.getElementById('board-sel-bar'), del = document.getElementById('board-sel-del');
    if (!box || !board) return;
    const on = !!view?.length, grips = board.scroller.querySelectorAll('.board-handle'), many = on && view.length > 1 ? view : [], k = board.canvas.clientWidth / BOARD.width;
    const marks = [...board.scroller.querySelectorAll('.board-sel-item')];
    while (marks.length < many.length) { const m = document.createElement('div'); m.className = 'board-sel-item'; box.after(m); marks.push(m); }
    marks.forEach((m, i) => {
        m.hidden = i >= many.length;
        if (i < many.length) { const [a, b, c, d] = boardBox(many[i]); Object.assign(m.style, {left: a * k - 3 + 'px', top: b * k - 3 + 'px', width: (c - a) * k + 6 + 'px', height: (d - b) * k + 6 + 'px'}); }
    });
    box.hidden = bar.hidden = del.hidden = !on;
    grips.forEach(g => { g.hidden = !on; });
    if (!on) return;
    const [l, t, r, b] = boardFrame(view), W = board.canvas.clientWidth, H = board.canvas.clientHeight, hs = boardHandles(view);
    Object.assign(box.style, {left: l + 'px', top: t + 'px', width: r - l + 'px', height: b - t + 'px'});
    grips.forEach((g, i) => { g.hidden = !hs[i]; if (hs[i]) { g.style.left = hs[i][0] + 'px'; g.style.top = hs[i][1] + 'px'; g.classList.toggle('round', hs[i][2].startsWith('end')); } });
    const above = t - 44, bw = bar.offsetWidth || 108; // copy, duplicate and delete sit above the frame, or below it at the top of the board
    Object.assign(bar.style, {left: Math.max(0, Math.min(W - bw, (l + r) / 2 - bw / 2)) + 'px', top: Math.max(0, Math.min(H - 32, above >= 0 ? above : b + 12)) + 'px'});
    del.setAttribute('aria-label', view.length > 1 ? `Delete the ${view.length} selected items` : 'Delete the selected item');
    const n = board.sel.length, head = board.strokes.slice(0, n), tail = board.strokes.slice(-n);
    document.getElementById('board-sel-front').disabled = board.sel.every(it => tail.includes(it));
    document.getElementById('board-sel-back').disabled = board.sel.every(it => head.includes(it));
}
/* Items with one handle dragged by (dx, dy) board units. Corners scale everything from the opposite corner of the group:
   proportions are kept when there is text or a pen stroke among them (so writing is never squashed) or with Shift; the
   ends of a single line or arrow move on their own (Shift: 45° steps). Nothing flips or shrinks below 8 units, text stays
   at least 10 units high, and the dragged corner stays on the board. */
function boardResized(items, h, dx, dy, shift) {
    if (h === 'end0' || h === 'end1') {
        const s = items[0], i = h === 'end0' ? 0 : 2, o = 2 - i, p = s.p.slice();
        let x = s.p[i] + dx, y = s.p[i + 1] + dy;
        if (shift) { const a = Math.round(Math.atan2(y - p[o + 1], x - p[o]) / (Math.PI / 4)) * Math.PI / 4, r = Math.hypot(x - p[o], y - p[o + 1]); x = p[o] + r * Math.cos(a); y = p[o + 1] + r * Math.sin(a); }
        p[i] = Math.max(0, Math.min(BOARD.width, x)); p[i + 1] = Math.max(0, y);
        return [{...s, p}];
    }
    const [a, b, c, d] = boardUnion(items, boardGeom), west = h[1] === 'w', north = h[0] === 'n';
    const ax = west ? c : a, ay = north ? d : b, w0 = (west ? a : c) - ax, h0 = (north ? b : d) - ay; // fixed corner, and the signed size to the dragged one
    const lo = (len, min) => Math.abs(len) > 1 ? min / Math.abs(len) : 1, hi = (len, room) => Math.abs(len) > 1 ? room / Math.abs(len) : 1;
    const minX = lo(w0, 8), minY = lo(h0, 8), maxX = hi(w0, w0 > 0 ? BOARD.width - ax : ax), maxY = north ? hi(h0, ay) : Infinity;
    const texts = items.filter(s => s.k === 'text'), minText = Math.max(0, ...texts.map(s => 10 / s.s));
    let sx = Math.abs(w0) > 1 ? (w0 + dx) / w0 : 1, sy = Math.abs(h0) > 1 ? (h0 + dy) / h0 : 1;
    if (shift || texts.length || items.some(s => !s.k)) { // one scale for both directions, following the drag along the diagonal
        const u = Math.abs(w0) > 1 && Math.abs(h0) > 1 ? ((w0 + dx) * w0 + (h0 + dy) * h0) / (w0 * w0 + h0 * h0) : Math.abs(w0) > 1 ? sx : sy;
        sx = sy = Math.max(Math.max(minX, minY, minText), Math.min(maxX, maxY, u));
    } else { sx = Math.max(minX, Math.min(maxX, sx)); sy = Math.max(minY, Math.min(maxY, sy)); }
    return items.map(s => s.k === 'text' ? {...s, s: s.s * sx, x: ax + (s.x - ax) * sx, y: ay + (s.y - ay) * sy}
        : {...s, p: s.p.map((v, i) => i % 2 ? ay + (v - ay) * sy : ax + (v - ax) * sx)});
}
const boardRounded = s => s.k === 'text' ? {...s, x: Math.round(s.x), y: Math.round(s.y), s: Math.round(s.s * 10) / 10} : {...s, p: s.p.map(v => Math.round(v))};
function boardPreview(items, except, dx = 0, dy = 0) { // draw items over a snapshot of everything but `except`
    const {ctx, canvas} = board;
    if (!board.base) {
        board.base = document.createElement('canvas'); board.base.width = canvas.width; board.base.height = canvas.height;
        const bc = board.base.getContext('2d'); bc.setTransform(board.scale, 0, 0, board.scale, 0, 0); bc.lineCap = bc.lineJoin = 'round';
        for (const it of board.strokes) if (!except.includes(it)) boardPaint(bc, it);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(board.base, 0, 0);
    ctx.setTransform(board.scale, 0, 0, board.scale, dx * board.scale, dy * board.scale); ctx.lineCap = ctx.lineJoin = 'round';
    for (const it of items) boardPaint(ctx, it);
}
function boardGrow(low) { if (low > board.h && board.h < BOARD.maxHeight) board.h = Math.min(BOARD.maxHeight, Math.ceil(low / 50) * 50 + 100); } // room below what was put past the bottom
const boardEntries = pairs => pairs.map(([item, next]) => ({i: board.strokes.indexOf(item), item, next})).filter(e => e.i >= 0).sort((a, b) => a.i - b.i);
function boardDelete() {
    const list = boardEntries(board.sel.map(s => [s]));
    if (!list.length) return;
    board.sel = [];
    boardDo({type: 'delete', list});
}
function boardMoveTo(items, dx, dy, nudge = false) { // one undoable move; arrow-key nudges in a row merge into one step
    const top = board.undo[board.undo.length - 1], tail = board.strokes.slice(-items.length);
    if (nudge && top?.nudge && top.list.length === items.length && top.list.every(e => items.includes(e.next)) && items.every(s => tail.includes(s))) {
        items.forEach(s => Object.assign(s, boardShift(s, dx, dy))); board.redo = [];
        boardRedraw(); boardPersist(); boardButtons(); boardSelPlace();
        return;
    }
    const list = boardEntries(items.map(s => [s, boardShift(s, dx, dy)]));
    boardGrow(Math.max(...list.map(e => boardBox(e.next)[3])));
    board.sel = list.map(e => e.next);
    boardDo({type: 'move', nudge, list});
}
function boardReplace(pairs) { // [[item, next], …] as one undoable step, each item keeping its place; false when nothing changed
    const list = boardEntries(pairs.filter(([s, n]) => JSON.stringify(s) !== JSON.stringify(n)));
    if (!list.length) return false;
    boardGrow(Math.max(...list.map(e => boardBox(e.next)[3])));
    board.sel = board.sel.map(s => list.find(e => e.item === s)?.next || s);
    boardDo({type: 'replace', list});
    return true;
}
/* Copy, cut, paste and duplicate. The clipboard lives in localStorage, so it carries from one problem's board to another
   and between tabs (or in memory when storage is unavailable). A paste lands centred on the mouse when it is over the
   board; otherwise it is offset from where it was copied (once more for each paste), on the visible part of the board.
   Pasted and duplicated items arrive selected, with the select tool, as one undoable step. */
let boardClipMem = null, boardPasteN = 0;
function boardClipGet() { try { return JSON.parse(localStorage.getItem(BOARD.clip)) || boardClipMem; } catch { return boardClipMem; } }
function boardClipSet(clip) { boardClipMem = clip; try { localStorage.setItem(BOARD.clip, JSON.stringify(clip)); } catch { try { localStorage.removeItem(BOARD.clip); } catch {} } }
const boardStep = () => Math.max(24, Math.round(16 * BOARD.width / (board.canvas.clientWidth || BOARD.width))); // about 16 CSS px, at least 24 units
const boardCount = n => n === 1 ? '1 item' : `${n} items`;
function boardCopy(cut = false) {
    const items = boardEntries(board.sel.map(s => [s])).map(e => e.item);
    if (!items.length) return;
    boardClipSet({from: board.id, cut, items: JSON.parse(JSON.stringify(items))});
    boardPasteN = 0;
    if (cut) boardDelete(); else boardButtons();
    boardSay(`${cut ? 'Cut' : 'Copied'} ${boardCount(items.length)}${cut ? '' : '. Paste with Ctrl+V or the Paste button.'}`);
}
function boardVisible() { // the part of the board on screen, top and bottom in board units
    const r = board.canvas.getBoundingClientRect(), sr = board.scroller.getBoundingClientRect(), k = r.width / BOARD.width;
    const top = Math.max(r.top, sr.top, 0), bottom = Math.min(r.bottom, sr.bottom, window.innerHeight);
    return bottom > top ? [(top - r.top) / k, (bottom - r.top) / k] : [0, board.h];
}
function boardPlace(items, dx, dy) { // items shifted by (dx, dy), kept on the board, added and selected as one step
    const [a, b, c] = boardUnion(items, boardBox);
    dx = c - a > BOARD.width ? -a : Math.max(-a, Math.min(BOARD.width - c, Math.round(dx)));
    dy = Math.max(-b, Math.round(dy));
    const placed = items.map(s => boardRounded(boardShift(s, dx, dy)));
    boardGrow(Math.max(...placed.map(s => boardBox(s)[3])));
    if (board.tool !== 'select') boardTool('select');
    board.sel = placed;
    boardDo({type: 'paste', items: placed});
}
function boardPaste(at = null) {
    const clip = boardClipGet();
    if (!clip?.items?.length) return;
    boardTextCommit();
    const items = JSON.parse(JSON.stringify(clip.items)), [a, b, c, d] = boardUnion(items, boardBox), step = boardStep();
    let dx, dy;
    if (at) { dx = at[0] - (a + c) / 2; dy = at[1] - (b + d) / 2; }
    else {
        boardPasteN++;
        dx = dy = step * (clip.from === board.id && !clip.cut ? boardPasteN : boardPasteN - 1); // after a cut, or on another board, the first paste keeps its place
        const [top, bottom] = boardVisible();
        if (b + dy < top || d + dy > bottom) dy = top + step - b; // bring it into view
    }
    boardPlace(items, dx, dy);
    boardSay(`Pasted ${boardCount(items.length)}`);
}
function boardDuplicate() {
    const items = boardEntries(board.sel.map(s => [s])).map(e => e.item);
    if (!items.length) return;
    const step = boardStep(), c = boardUnion(items, boardBox)[2];
    boardPlace(items, c + step <= BOARD.width ? step : -step, step);
}
function boardOrder(front) { // bring the selection to the front (drawn last) or send it to the back, keeping its own order, as one step
    const mine = new Set(board.sel);
    if (!mine.size) return;
    const sel = board.strokes.filter(it => mine.has(it)), rest = board.strokes.filter(it => !mine.has(it)), to = front ? [...rest, ...sel] : [...sel, ...rest];
    if (to.every((it, i) => it === board.strokes[i])) return; // already there
    boardDo({type: 'order', from: board.strokes.slice(), to});
    boardSay(front ? 'Brought to front' : 'Sent to back');
}
function boardRestyle(what) { // a colour or size chosen with something selected restyles all of it
    boardReplace(board.sel.map(s => [s, what === 'ink' ? {...s, c: board.ink} : s.k === 'text' ? {...s, s: boardTextSize()} : {...s, w: BOARD_SIZES[board.size][0]}]));
}

/* ---------- text ---------- */
/* Text is at least 16 CSS px on screen (more for the larger sizes), so it stays readable on a phone and iOS does not zoom
   into the box; on a narrow board that means more board units, so phone text looks larger on a wide screen, like handwriting. */
const boardTextSize = () => Math.round(Math.max(BOARD_TEXT[board.size], (16 + 4 * board.size) * BOARD.width / (board.canvas.clientWidth || BOARD.width)));
function boardTextOpen(x, y, item = null) { // a new text box at (x, y), or `item` (existing text) opened for editing in place
    boardTextCommit();
    const el = document.createElement('textarea');
    el.className = 'board-text';
    el.rows = 1; el.wrap = 'off'; el.spellcheck = false; el.autocapitalize = 'off';
    el.setAttribute('aria-label', `${item ? 'Editing text' : 'Text'} on the whiteboard. Enter finishes, Shift+Enter adds a line, Escape cancels.`);
    board.editor = item ? {el, x: item.x, y: item.y, s: item.s, c: item.c, item} : {el, x, y, s: boardTextSize(), c: board.ink};
    if (item) { el.value = item.t; boardSelect([]); boardRedraw(); }
    board.scroller.append(el);
    boardTextPlace();
    if (item) el.selectionStart = el.selectionEnd = el.value.length;
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
    // at least 16 px on screen, so iOS does not zoom in: small text written on a wide screen is shown larger while it is edited on a phone
    Object.assign(ed.el.style, {left: ed.x * k + 'px', top: ed.y * k + 'px', font: BOARD_FONT(Math.max(16, ed.s * k)), color: boardInk(ed.c), lineHeight: '1.25'});
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
    if (!ed.item) { if (t.trim()) boardAdd({k: 'text', c: ed.c, s: ed.s, x: Math.round(ed.x), y: Math.round(ed.y), t}); return; }
    const i = board.strokes.indexOf(ed.item); // edited text: replaced in place, or deleted when emptied, as one undoable step
    if (i < 0) { boardRedraw(); return; }
    board.sel = board.tool === 'select' ? [ed.item] : [];
    if (!t.trim()) { board.sel = []; boardDo({type: 'delete', list: [{i, item: ed.item}]}); boardSay('Text deleted'); return; }
    if (!boardReplace([[ed.item, {...ed.item, t, c: ed.c, s: ed.s}]])) { boardRedraw(); boardSelPlace(); }
}
function boardTextCancel() {
    const ed = board?.editor;
    if (!ed) return;
    board.editor = null; ed.el.remove();
    if (ed.item) { boardRedraw(); if (board.tool === 'select' && board.strokes.includes(ed.item)) boardSelect([ed.item]); }
}
function boardTextAt(x, y, tol) { // the topmost text under a point
    for (let i = board.strokes.length - 1; i >= 0; i--) { const s = board.strokes[i]; if (s.k === 'text' && boardHit(s, x, y, tol)) return s; }
    return null;
}

/* ---------- the first-time tour ---------- */
/* Five short steps, each a callout pointing at a part of the board, shown the first time the board is opened on request
   (remembered in this browser) and again from the Tour button, which carries a dot until the tour has been seen. The
   callout is a non-modal dialog: the board stays usable, Back and Next (or the arrow keys) step through it, and Skip or
   Esc ends it. Keyboard hints are left out on touch screens. */
const BOARD_TOUR = [
    {at: () => board.canvas, inside: true, title: 'Your working space',
        text: 'Write with a mouse, a pen or one finger; scroll with two fingers. Everything is saved with this problem, in this browser.'},
    {at: () => document.querySelector('#board .board-bar [aria-label="Tool"]'), title: 'Pen, shapes and text',
        text: 'Draw freehand, lines, arrows, boxes and ellipses, or type text (\\omega gives ω, x^2 gives x²).',
        keys: 'Hold Shift for straight lines, squares and circles. Keys: P, L, A, R, O and T.'},
    {at: () => document.getElementById('board-select'), title: 'Select and move',
        text: 'Tap or click something to select it, drag it to move it, or drag a corner to resize it. Drag across empty board to pick several, and double-click (or double-tap) text to edit it.',
        keys: 'Key: V. Ctrl+C, Ctrl+V and Ctrl+D copy, paste and duplicate; ] and [ bring to front and send to back.'},
    {at: () => document.getElementById('board-erase'), title: 'Eraser',
        text: 'Drag over anything to remove it whole. Changed your mind? Undo brings it back.', keys: 'Keys: E, and Ctrl+Z to undo.'},
    {at: () => document.getElementById('board-full'), title: 'Room to think',
        text: 'Full screen gives you the whole window, with the problem on top. More room makes the board longer, Paper switches to dark ink on white, and Save image downloads a copy. Tour shows these tips again.'}
];
let boardTour = null; // {step, el} while the tour is showing
const boardTourSeen = () => { try { return localStorage.getItem(BOARD.tour) === '1'; } catch { return true; } };
function boardTourStart() {
    boardTourEnd(false);
    try { localStorage.setItem(BOARD.tour, '1'); } catch {}
    const btn = document.getElementById('board-tour');
    if (btn) { btn.classList.remove('fresh'); btn.setAttribute('aria-label', 'Tour'); }
    const el = document.createElement('div');
    el.className = 'board-tour'; el.tabIndex = -1;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false'); el.setAttribute('aria-labelledby', 'board-tour-title'); el.setAttribute('aria-describedby', 'board-tour-text');
    el.addEventListener('click', e => {
        const a = e.target.closest('[data-tour]')?.dataset.tour;
        if (a === 'next') boardTourGo(boardTour.step + 1); else if (a === 'back') boardTourGo(boardTour.step - 1); else if (a === 'skip') boardTourEnd();
    });
    document.getElementById('board').append(el);
    boardTour = {step: 0, el};
    boardTourGo(0);
}
function boardTourGo(i) {
    if (!boardTour) return;
    if (i >= BOARD_TOUR.length) { boardTourEnd(); return; }
    i = Math.max(0, i);
    const st = BOARD_TOUR[i], n = BOARD_TOUR.length, last = i === n - 1, el = boardTour.el;
    boardTour.step = i;
    el.classList.toggle('inside', !!st.inside);
    el.innerHTML = `<span class="board-tour-arrow" aria-hidden="true"></span><p class="board-tour-step">${i + 1} of ${n}</p><h3 id="board-tour-title">${st.title}</h3>`
        + `<p id="board-tour-text">${st.text}${st.keys ? ` <span class="keys">${st.keys}</span>` : ''}</p><div class="board-tour-nav">`
        + `${last ? '' : '<button type="button" class="board-tour-skip" data-tour="skip">Skip tour</button>'}${i ? '<button type="button" class="ghost" data-tour="back">Back</button>' : ''}`
        + `<button type="button" class="board-tour-next" data-tour="next">${last ? 'Done' : 'Next'}</button></div>`;
    document.querySelectorAll('.board-tour-target').forEach(t => t.classList.remove('board-tour-target'));
    st.at()?.classList.add('board-tour-target');
    boardTourPlace();
    el.querySelector('[data-tour="next"]').focus({preventScroll: true});
    el.scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
function boardTourPlace() { // under its target, pointing at it; over the board, near the top of what is on screen
    if (!boardTour) return;
    const st = BOARD_TOUR[boardTour.step], target = st.at(), host = document.getElementById('board'), el = boardTour.el;
    if (!target || !host || host.hidden) return;
    const h = host.getBoundingClientRect(), t = target.getBoundingClientRect(), w = Math.min(330, h.width - 24);
    el.style.width = w + 'px';
    let left, top;
    if (st.inside) { left = t.left - h.left + (t.width - w) / 2; top = Math.max(t.top, board.scroller.getBoundingClientRect().top, 0) - h.top + 24; }
    else { left = t.left - h.left + t.width / 2 - w / 2; top = t.bottom - h.top + 12; }
    left = Math.max(12, Math.min(h.width - w - 12, left));
    Object.assign(el.style, {left: left + 'px', top: top + 'px'});
    const arrow = el.querySelector('.board-tour-arrow');
    if (arrow) arrow.style.left = Math.max(18, Math.min(w - 18, t.left - h.left + t.width / 2 - left)) + 'px';
}
function boardTourEnd(refocus = true) {
    if (!boardTour) return;
    boardTour.el.remove();
    document.querySelectorAll('.board-tour-target').forEach(t => t.classList.remove('board-tour-target'));
    boardTour = null;
    if (refocus) document.getElementById(`board-${board.tool}`)?.focus({preventScroll: true});
}

/* ---------- erasing ---------- */
/* The eraser removes whole items: every stroke, shape or text within its reach of the path, checked at short steps so a
   quick swipe misses nothing. What it has touched fades while the pointer is down and goes when it is let go; on touch a
   ring shows its reach. Erase marks saved by the earlier pixel eraser still draw, so old boards look the same. */
function boardEraseAlong(s, x, y) {
    const [x0, y0] = s.p, steps = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / (s.r / 2)));
    let more = false;
    for (const it of board.strokes) {
        if (it.c < 0 || s.hit.has(it)) continue;
        for (let i = 0; i <= steps; i++) if (boardHit(it, x0 + (x - x0) * i / steps, y0 + (y - y0) * i / steps, s.r)) { s.hit.add(it); more = true; break; }
    }
    s.p = [x, y];
    const {ctx, canvas} = board;
    if (more || !board.base) { // redraw with the touched items faded, then keep that as the backdrop
        board.base = document.createElement('canvas'); board.base.width = canvas.width; board.base.height = canvas.height;
        const bc = board.base.getContext('2d'); bc.setTransform(board.scale, 0, 0, board.scale, 0, 0); bc.lineCap = bc.lineJoin = 'round';
        for (const it of board.strokes) { bc.globalAlpha = s.hit.has(it) ? .18 : 1; boardPaint(bc, it); }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(board.base, 0, 0);
    if (s.ring) { // a finger or pen has no cursor: show the eraser's reach
        ctx.setTransform(board.scale, 0, 0, board.scale, 0, 0);
        ctx.strokeStyle = board.paper ? 'rgba(31, 35, 40, .55)' : 'rgba(236, 235, 230, .55)'; ctx.lineWidth = 1.5 / board.scale * (window.devicePixelRatio || 1);
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 2 * Math.PI); ctx.stroke();
    }
}

/* ---------- input ---------- */
function boardPoint(e) { const r = board.canvas.getBoundingClientRect(); return [(e.clientX - r.left) * BOARD.width / r.width, (e.clientY - r.top) * BOARD.width / r.width]; }
const touchMid = () => { const ys = [...board.touches.values()].map(t => t.y); return ys.reduce((s, y) => s + y, 0) / ys.length; };
function boardCancelLive() { if (board.live) { board.live = null; board.base = null; boardMarquee(null); boardRedraw(); boardSelPlace(); } }
function boardMarquee(r) { // the selection box being dragged, [left, top, right, bottom] in board units, or null
    const el = document.getElementById('board-marquee');
    if (!el) return;
    el.hidden = !r;
    if (r) { const k = board.canvas.clientWidth / BOARD.width; Object.assign(el.style, {left: r[0] * k + 'px', top: r[1] * k + 'px', width: (r[2] - r[0]) * k + 'px', height: (r[3] - r[1]) * k + 'px'}); }
}
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
    if (tool === 'select') { boardSelectDown(x, y, e); return; }
    if (BOARD_SHAPES.includes(tool)) {
        board.live = {k: tool, c: board.ink, w: BOARD_SIZES[board.size][0], p: [x, y, x, y], id: e.pointerId};
        board.base = document.createElement('canvas'); board.base.width = board.canvas.width; board.base.height = board.canvas.height;
        board.base.getContext('2d').drawImage(board.canvas, 0, 0);
        return;
    }
    if (tool === 'erase') {
        const touchy = e.pointerType !== 'mouse';
        board.live = {k: 'erase', p: [x, y], r: (touchy ? 16 : BOARD.eraser) * BOARD.width / board.canvas.clientWidth, hit: new Set(), ring: touchy, id: e.pointerId};
        boardEraseAlong(board.live, x, y);
        return;
    }
    board.live = {c: board.ink, w: BOARD_SIZES[board.size][0], p: [x, y], id: e.pointerId};
    boardRedraw();
}
/* A press with the select tool: on a handle it resizes the selection; on an item it selects it (Shift adds or removes it)
   and drags; inside the selection's frame it drags the selection; anywhere else it draws a selection box (a tap there
   selects the empty box or ellipse around it, or lets go). A press that does not travel `slop` is a click. */
function boardSelectDown(x, y, e) {
    const k = board.canvas.clientWidth / BOARD.width, touchy = e.pointerType === 'touch', sel = board.sel, add = e.shiftKey;
    const start = {p: [x, y], slop: (touchy ? 8 : 3) / k, id: e.pointerId};
    const grip = sel.length && boardHandleAt(sel, x * k, y * k, touchy ? 20 : 10);
    if (grip) { board.live = {...start, k: 'resize', items: sel.slice(), h: grip, next: null}; return; }
    const hit = boardPick(x, y, (touchy ? 16 : 8) / k);
    if (hit && add && sel.includes(hit)) { boardSelect(sel.filter(s => s !== hit)); return; }
    if (hit) {
        const solo = !add && sel.length > 1 && sel.includes(hit) ? hit : null; // pressing one of several keeps them all for a drag; a plain click picks it alone
        if (!sel.includes(hit)) boardSelect(add ? [...sel, hit] : [hit]);
        board.live = {...start, k: 'move', items: board.sel.slice(), dx: 0, dy: 0, solo, target: add ? null : hit};
        return;
    }
    if (sel.length && !add && boardInFrame(sel, x * k, y * k)) { board.live = {...start, k: 'move', items: sel.slice(), dx: 0, dy: 0, solo: null}; return; }
    board.live = {...start, k: 'marquee', p: [x, y, x, y], add, on: false};
}
function boardMove(e) {
    if (e.pointerType === 'mouse') board.hover = boardPoint(e);
    if (e.pointerType === 'touch' && board.touches.has(e.pointerId)) {
        board.touches.get(e.pointerId).y = e.clientY;
        if (board.panY !== null && (board.touches.size > 1 || board.penSeen)) {
            const y = touchMid(), dy = y - board.panY; board.panY = y;
            if (board.full) board.scroller.scrollTop -= dy; else window.scrollBy(0, -dy);
            e.preventDefault(); return;
        }
    }
    const s = board.live;
    if (!s && board.tool === 'select' && e.pointerType === 'mouse') { // the cursor shows what a press would do
        const [x, y] = boardPoint(e), k = board.canvas.clientWidth / BOARD.width, sel = board.sel, grip = sel.length && boardHandleAt(sel, x * k, y * k, 10);
        board.canvas.style.cursor = grip ? BOARD_RESIZE_CURSOR[grip] : (sel.length && boardInFrame(sel, x * k, y * k)) || boardPick(x, y, 8 / k) ? 'move' : '';
    }
    if (!s || e.pointerId !== s.id) return;
    e.preventDefault();
    if (s.k === 'place') return;
    if (s.k === 'erase') {
        const merged = e.getCoalescedEvents?.();
        for (const ev of merged?.length ? merged : [e]) { const [x, y] = boardPoint(ev); boardEraseAlong(s, x, y); }
        return;
    }
    if (s.k === 'marquee') {
        const [x, y] = boardPoint(e);
        s.p[2] = x; s.p[3] = y;
        if (!s.on && Math.hypot(x - s.p[0], y - s.p[1]) < s.slop) return;
        s.on = true;
        boardMarquee([Math.min(s.p[0], x), Math.min(s.p[1], y), Math.max(s.p[0], x), Math.max(s.p[1], y)]);
        return;
    }
    if (s.k === 'resize') {
        const [x, y] = boardPoint(e);
        if (!board.base && Math.hypot(x - s.p[0], y - s.p[1]) < s.slop) return;
        s.next = boardResized(s.items, s.h, x - s.p[0], y - s.p[1], e.shiftKey);
        boardPreview(s.next, s.items);
        boardSelPlace(s.next);
        return;
    }
    if (s.k === 'move') { // the items follow the pointer, drawn over a snapshot of everything else, and stay on the board
        const [x, y] = boardPoint(e), [a, b, c, d] = boardUnion(s.items, boardBox), view = board.canvas.clientHeight * BOARD.width / board.canvas.clientWidth;
        let dx = x - s.p[0], dy = y - s.p[1];
        if (!board.base && Math.hypot(dx, dy) < s.slop) return; // a click, not yet a drag
        dx = Math.max(Math.min(0, -a), Math.min(Math.max(0, BOARD.width - c), dx));
        dy = Math.max(Math.min(0, -b), Math.min(Math.max(0, view - d), dy));
        s.dx = dx; s.dy = dy;
        boardPreview(s.items, s.items, dx, dy);
        boardSelPlace(s.items.map(it => boardShift(it, dx, dy)));
        return;
    }
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
    const dragged = !!board.base;
    board.live = null; board.base = null;
    if (e.type === 'pointercancel') { boardMarquee(null); boardRedraw(); boardSelPlace(); return; }
    if (s.k === 'erase') { // everything touched goes, as one undoable step
        const list = boardEntries([...s.hit].map(it => [it]));
        if (!list.length) { boardRedraw(); return; }
        board.sel = board.sel.filter(it => !s.hit.has(it));
        boardDo({type: 'delete', list});
        boardSay(`Erased ${boardCount(list.length)}`);
        return;
    }
    if (s.k === 'place') { // a click on existing text edits it; anywhere else starts new text
        const t = boardTextAt(s.p[0], s.p[1], (e.pointerType === 'touch' ? 8 : 4) * BOARD.width / board.canvas.clientWidth);
        boardTextOpen(s.p[0], s.p[1], t);
        return;
    }
    if (s.k === 'marquee') {
        boardMarquee(null);
        if (!s.on) { // a click on empty board
            const inside = boardPickInside(s.p[0], s.p[1]);
            if (inside) boardSelect(!s.add ? [inside] : board.sel.includes(inside) ? board.sel.filter(t => t !== inside) : [...board.sel, inside]);
            else if (!s.add) boardSelect([]);
            return;
        }
        const l = Math.min(s.p[0], s.p[2]), r = Math.max(s.p[0], s.p[2]), t = Math.min(s.p[1], s.p[3]), b = Math.max(s.p[1], s.p[3]);
        const got = boardSelectable().filter(it => { const [a, bb, c, d] = boardBox(it); return a >= l && c <= r && bb >= t && d <= b; }); // wholly inside the box
        boardSelect(s.add ? [...board.sel, ...got.filter(it => !board.sel.includes(it))] : got);
        return;
    }
    if (s.k === 'move') {
        const dx = Math.round(s.dx), dy = Math.round(s.dy);
        if (dragged && (dx || dy)) boardMoveTo(s.items, dx, dy);
        else {
            if (dragged) boardRedraw();
            if (s.solo) boardSelect([s.solo]); else boardSelPlace();
            const now = performance.now(), last = board.lastTap; // two clicks or taps on the same text open it for editing
            if (s.target?.k === 'text' && last?.item === s.target && now - last.t < 450) { board.lastTap = null; boardTextOpen(0, 0, s.target); }
            else board.lastTap = s.target ? {item: s.target, t: now} : null;
        }
        return;
    }
    if (s.k === 'resize') {
        if (!s.next || !boardReplace(s.items.map((it, j) => [it, boardRounded(s.next[j])]))) { boardRedraw(); boardSelPlace(); }
        return;
    }
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
        tool: prev && prev.tool !== 'erase' ? prev.tool : 'pen', ink: prev?.ink || 0, size: prev?.size ?? 1, live: null, base: null, editor: null, sel: [], paper: boardPaperPref(), warning: '', said: '', hover: null, lastTap: null,
        touches: new Map(), panY: null, penSeen: prev?.penSeen || false, full: false, scale: 1};
    canvas.addEventListener('pointerdown', boardDown);
    canvas.addEventListener('pointermove', boardMove);
    for (const t of ['pointerup', 'pointercancel']) canvas.addEventListener(t, boardUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerleave', () => { board.hover = null; });
    document.getElementById('board-open').onclick = () => boardOpen(true, true);
    document.getElementById('board-hide').onclick = () => boardOpen(false);
    document.querySelectorAll('.board-bar [data-tool]').forEach(b => { b.onclick = () => boardTool(b.dataset.tool); });
    const pick = what => { // a colour or size applies to the text being typed, or to the selected item, too
        const ed = board.editor;
        if (ed) { ed.c = board.ink; ed.s = boardTextSize(); boardTextPlace(); ed.el.focus({preventScroll: true}); }
        if (board.tool === 'select') boardRestyle(what);
        if (board.tool === 'erase') boardTool('pen'); else boardButtons();
    };
    document.querySelectorAll('#board [data-ink], #board [data-size]').forEach(b => { b.onmousedown = e => { if (board.editor) e.preventDefault(); }; });
    document.querySelectorAll('#board [data-ink]').forEach(b => { b.onclick = () => { board.ink = +b.dataset.ink; pick('ink'); }; });
    document.querySelectorAll('#board [data-size]').forEach(b => { b.onclick = () => { board.size = +b.dataset.size; pick('size'); }; });
    document.getElementById('board-sel-del').onclick = boardDelete;
    document.getElementById('board-sel-copy').onclick = () => boardCopy();
    document.getElementById('board-sel-front').onclick = () => boardOrder(true);
    document.getElementById('board-sel-back').onclick = () => boardOrder(false);
    document.getElementById('board-sel-dup').onclick = boardDuplicate;
    document.getElementById('board-paste').onclick = () => boardPaste();
    document.getElementById('board-undo').onclick = boardUndo;
    document.getElementById('board-redo').onclick = boardRedo;
    document.getElementById('board-clear').onclick = () => { if (board.strokes.length) boardDo({type: 'clear', strokes: board.strokes.slice()}); };
    document.getElementById('board-more').onclick = () => { if (board.h < BOARD.maxHeight) boardDo({type: 'room', from: board.h, to: Math.min(BOARD.maxHeight, board.h + BOARD.step)}); };
    document.getElementById('board-png').onclick = boardImage;
    document.getElementById('board-full').onclick = () => boardFull(!board.full);
    document.getElementById('board-paper').onclick = () => boardPaper(!board.paper);
    boardTour = null; // a new page has no callout showing
    const tourBtn = document.getElementById('board-tour');
    tourBtn.onclick = () => boardTour ? boardTourEnd() : boardTourStart();
    if (!boardTourSeen()) { tourBtn.classList.add('fresh'); tourBtn.setAttribute('aria-label', 'Tour (new)'); }
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
/* Keys while not typing an answer or text: W opens or hides the board; with it open, V select, P pen, L line, A arrow,
   R box, O ellipse, T text, E eraser, Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) undo and redo, Ctrl+V paste; with Select,
   Ctrl+A selects everything and Ctrl+C, Ctrl+X and Ctrl+D copy, cut and duplicate the selection; Enter edits a selected
   text. With something selected, Delete or
   Backspace removes it, ] and [ bring it to the front or send it to the back, the arrow keys nudge it (Shift for bigger
   steps) and Esc lets go of it; otherwise Esc leaves
   full screen first. */
const BOARD_KEYS = Object.fromEntries(BOARD_TOOLS.map(([t, , key]) => [key, t]));
document.addEventListener('keydown', e => {
    if (!board || !document.contains(board.canvas) || document.querySelector('dialog[open]')) return;
    if (e.target.closest?.('math-field, input, textarea, select')) return;
    const open = !document.getElementById('board').hidden, k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (boardTour && !mod && !e.altKey) { // the tour: Esc ends it, the arrow keys step through it
        if (k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); boardTourEnd(); return; }
        if (k === 'arrowright' || k === 'arrowleft') { e.preventDefault(); boardTourGo(boardTour.step + (k === 'arrowright' ? 1 : -1)); return; }
    }
    if (open && mod && !e.altKey && k === 'a' && board.tool === 'select') { e.preventDefault(); boardSelect(boardSelectable()); return; }
    if (open && mod && !e.altKey && !e.shiftKey) { // copy, cut, paste and duplicate; page text that is selected is left to the browser
        const pageText = !(window.getSelection?.()?.isCollapsed ?? true);
        if ((k === 'c' || k === 'x') && board.sel.length && !pageText) { e.preventDefault(); boardCopy(k === 'x'); return; }
        if (k === 'v' && boardClipGet()?.items?.length) { e.preventDefault(); boardPaste(board.hover); return; }
        if (k === 'd' && board.sel.length) { e.preventDefault(); boardDuplicate(); return; }
    }
    if (open && board.sel.length && !mod && !e.altKey) {
        const step = e.shiftKey ? 25 : 5, nudge = {arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step]}[k];
        if (k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); boardSelect([]); return; }
        if (k === 'enter' && board.sel.length === 1 && board.sel[0].k === 'text' && !e.target.closest?.('button, a, summary')) { e.preventDefault(); e.stopImmediatePropagation(); boardTextOpen(0, 0, board.sel[0]); return; }
        if (k === 'delete' || k === 'backspace') { e.preventDefault(); boardDelete(); return; }
        if (e.code === 'BracketRight' || k === ']') { e.preventDefault(); boardOrder(true); return; } // ] to the front, [ to the back
        if (e.code === 'BracketLeft' || k === '[') { e.preventDefault(); boardOrder(false); return; }
        if (nudge) { e.preventDefault(); boardMoveTo(board.sel, ...nudge, true); return; }
    }
    if (k === 'escape' && board.full) { e.preventDefault(); e.stopImmediatePropagation(); boardFull(false); return; }
    if (!mod && !e.altKey && k === 'w') { e.preventDefault(); boardOpen(!open, !open); return; }
    if (!open) return;
    if (!mod && !e.altKey && BOARD_KEYS[k]) { // the focus ring follows the tool picked by key
        e.preventDefault(); boardTool(BOARD_KEYS[k]);
        if (document.activeElement?.closest?.('.board-bar [data-tool]')) document.getElementById(`board-${board.tool}`).focus({preventScroll: true}); // without jumping to the toolbar
        return;
    }
    if (mod && (k === 'z' || k === 'y')) { e.preventDefault(); (k === 'y' || e.shiftKey) ? boardRedo() : boardUndo(); }
}, true);
window.addEventListener('resize', () => boardResize());
window.addEventListener('hashchange', () => { if (board?.editor) boardTextCommit(); }); // text being typed is kept on any page change (this runs before the app re-renders)
window.addEventListener('storage', e => { if (e.key === BOARD.clip && board && document.contains(board.canvas)) boardButtons(); }); // copied in another tab
