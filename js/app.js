const $ = s => document.querySelector(s);
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shifted = (date, days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return localDate(d);
};
const GROUPS = [
    {id: 'circuits-electronics', name: 'Circuits & electronics', short: 'Circuits'},
    {id: 'signals-control', name: 'Signals & control', short: 'Signals'},
    {id: 'power-em', name: 'Power & electromagnetics', short: 'Power'},
    {id: 'comms', name: 'Communications & RF', short: 'Comms & RF'}
];
/* Each discipline's symbol on the home screen, in LaTeX. */
const GLYPHS = {circuits: '\\Omega', electronics: '\\beta', signals: '\\mathcal F', control: 'G(s)', digital: '\\mathtt{01}', fields: '\\nabla', power: '3\\phi', measurement: '\\sigma', motors: '\\tau', sensors: '\\hat x', infotheory: 'H', modulation: 'E_b', linkbudget: 'G', rfcircuits: '\\Gamma'};
const MAX_ATTEMPTS = 5;
/* MathLive turns each answer box into a WYSIWYG math editor (typing 3/4 makes a stacked fraction).
   It shares KaTeX's fonts; if it fails to load, plain text inputs are used instead. */
const MATH_EDITOR = typeof window.MathfieldElement === 'function'; // <math-field> registers a moment later; elements upgrade automatically.
if (MATH_EDITOR) {
    MathfieldElement.fontsDirectory = new URL('vendor/katex/fonts/', location.href).href;
    MathfieldElement.soundsDirectory = null;
}
function fieldHTML(p, i) {
    const aria = `aria-describedby="answer-help part-feedback-${i}"`;
    return MATH_EDITOR
        ? `<math-field id="answer-${i}" class="math-input" math-virtual-keyboard-policy="auto" smart-fence ${aria} aria-label="Answer ${i + 1}"></math-field>`
        : `<input id="answer-${i}" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" placeholder="${p.exact ? 'e.g. pi/4 or ln(2)' : 'Enter a value'}" ${aria} required>`;
}
/* A compact cheat sheet of everything the answer box understands (shown under each answer form). */
const TYPING_GUIDE = [
    ['Fractions', '<code>3/4</code> → $\\frac34$ · mixed <code>1 1/2</code> or <code>1½</code>'],
    ['Powers', '<code>2^3</code> <code>2**3</code> <code>2²</code> <code>10^-3</code> <code>2⁻¹</code>'],
    ['Roots', '<code>sqrt2</code> <code>√2</code> → $\\sqrt2$ · <code>cbrt8</code> <code>∛8</code> → $\\sqrt[3]8$ · <code>root</code> (any index) · <code>8^(1/3)</code>'],
    ['Constants', '<code>pi</code> $\\pi$ · <code>e</code> · <code>tau</code> $\\tau$ · <code>phi</code> $\\varphi$'],
    ['Logs', '<code>ln</code> · <code>log</code> or <code>lg</code> (base 10) · <code>log2(8)</code> <code>log_2(8)</code> → $\\log_2 8$ · <code>exp</code>'],
    ['Trig', '<code>sin cos tan sec csc cot</code> · <code>asin</code> <code>arcsin</code> <code>sin^-1</code> · <code>sinh</code> <code>arsinh</code>'],
    ['Degrees, %', '<code>sin(30°)</code> <code>30deg</code> · <code>50%</code> · <code>5‰</code>'],
    ['Other', '<code>5!</code> · <code>|-3|</code> or <code>abs</code> · brackets <code>( ) [ ]</code> · <code>×</code> <code>÷</code> <code>·</code>'],
    ['Big & small', '<code>1.5e-3</code> <code>1.5E-3</code> <code>1.5x10^-3</code> <code>1.5*10^-3</code> · decimal comma <code>0,5</code>'],
    ['Units', 'optional: <code>2.5 mA</code> <code>60 degrees</code> <code>4.7 kohm</code>'],
    ['Moving', '<kbd>→</kbd> leaves a fraction, root or exponent · a space or an operator after a single number does too · <kbd>Enter</kbd> checks']
];
const typingGuideHTML = () => `<details class="typing-guide"><summary>How to type answers</summary><dl>${TYPING_GUIDE.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></details>`;
const isMath = el => el && el.tagName === 'MATH-FIELD';
/* Extra spellings for the editor, on top of MathLive's own (sqrt, cbrt, nthroot, pi, deg, sin, …).
   log is base 10 (not a log with an empty base slot); inverse functions get one symbol, not a·tan. */
const op = name => `\\operatorname{${name}}`;
const EDITOR_SHORTCUTS = {
    log: '\\log', lg: '\\lg', ln: '\\ln', root: '\\sqrt[#?]{#?}', nthroot: '\\sqrt[#?]{#?}', cbrt: '\\sqrt[3]{#?}', cuberoot: '\\sqrt[3]{#?}', squareroot: '\\sqrt{#?}',
    abs: '\\left|#?\\right|', phi: '\\varphi', tau: '\\tau', pi: '\\pi',
    asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan', arctg: '\\arctan', tg: '\\tan',
    asec: op('arcsec'), arcsec: op('arcsec'), acsc: op('arccsc'), arccsc: op('arccsc'), acot: op('arccot'), arccot: op('arccot'), arcctg: op('arccot'),
    sec: '\\sec', csc: '\\csc', cosec: op('cosec'), cot: '\\cot', cotan: '\\cot', ctg: '\\cot',
    sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh', sech: op('sech'), csch: op('csch'), coth: '\\coth',
    asinh: op('arsinh'), arsinh: op('arsinh'), arcsinh: op('arsinh'), acosh: op('arcosh'), arcosh: op('arcosh'), arccosh: op('arcosh'), atanh: op('artanh'), artanh: op('artanh'), arctanh: op('artanh'),
    deg: '\\degree', degrees: '\\degree', percent: '\\%'
};
/* Typing “)” inside a root, exponent or denominator steps out first when the matching “(” lies
   outside it, so (1+sqrt5)/2 and (3/4) can be typed naturally. Runs before MathLive sees the key. */
const unmatchedParens = s => (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
function smartClose(mf) {
    try {
        for (let k = 0; k < 8; k++) {
            const pos = mf.position;
            if (unmatchedParens(mf.getValue(0, pos, 'latex')) <= 0) return;
            mf.executeCommand('extendToGroupStart');
            const start = mf.selection.ranges[0][0], group = mf.getValue(mf.selection, 'latex');
            mf.position = pos;
            if (start === 0 || unmatchedParens(group) > 0) return;
            mf.executeCommand('moveAfterParent');
        }
    } catch {}
}
/* Content of the group holding the caret, from the group’s start up to the caret. */
function caretGroup(mf) {
    const pos = mf.position;
    mf.executeCommand('extendToGroupStart');
    const start = mf.selection.ranges[0][0], text = mf.getValue(mf.selection, 'latex');
    mf.position = pos;
    return {start, text};
}
/* Plain-text reading: sqrt5-1 is √5 − 1 and 3/4+1 is ¾ + 1, so an operator typed right after a
   lone number or constant in a root, exponent or denominator steps out of it first. */
function leaveAtomGroup(mf) {
    try {
        const g = caretGroup(mf);
        if (g.start > 0 && /^-?(\d+\.?\d*|\.\d+|\\pi|\\tau|\\varphi|\\phi|e)$/.test(g.text)) mf.executeCommand('moveAfterParent');
    } catch {}
}
/* ln2/2 means (ln 2)/2: when “/” follows a function and its argument, the whole function term becomes
   the numerator (MathLive alone would take only the argument). Covers ln, log, exp, trig and hyperbolic functions. */
const FUNCTION_TERM = /^a?\\(ln|log|exp|sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh)\s*(\d+\.?\d*|\.\d+|\\pi|e|[a-z]|\(.*\))$/;
function functionNumerator(mf) {
    try {
        const pos = mf.position, g = caretGroup(mf);
        for (let s = pos - 1; s >= g.start && s >= pos - 80; s--) {
            const text = mf.getValue(s, pos, 'latex').replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
            const m = text.match(FUNCTION_TERM);
            if (!m) continue;
            if (m[2][0] === '(') { // the bracket must enclose the whole argument
                let depth = 0;
                for (let i = 0; i < m[2].length; i++) {
                    depth += m[2][i] === '(' ? 1 : m[2][i] === ')' ? -1 : 0;
                    if (depth === 0 && i < m[2].length - 1) return false;
                }
                if (depth !== 0) return false;
            }
            mf.selection = {ranges: [[s, pos]], direction: 'forward'};
            mf.insert('\\frac{#0}{#?}', {selectionMode: 'placeholder'});
            return true;
        }
    } catch {}
    return false;
}
/* A √ that arrives as text (paste, mobile text entry, some keyboards) becomes a real root:
   a trailing √ opens an empty root at the caret, and √2 or √{…} is rewritten as \sqrt{…}. */
const UNICODE_TEX = {'½': '\\frac{1}{2}', '⅓': '\\frac{1}{3}', '⅔': '\\frac{2}{3}', '¼': '\\frac{1}{4}', '¾': '\\frac{3}{4}', '⅕': '\\frac{1}{5}', '⅖': '\\frac{2}{5}', '⅗': '\\frac{3}{5}', '⅘': '\\frac{4}{5}', '⅙': '\\frac{1}{6}', '⅚': '\\frac{5}{6}', '⅛': '\\frac{1}{8}', '⅜': '\\frac{3}{8}', '⅝': '\\frac{5}{8}', '⅞': '\\frac{7}{8}', 'φ': '\\varphi', 'ϕ': '\\varphi', 'τ': '\\tau', 'π': '\\pi', '∞': '\\infty'};
const ROOT_CHARS = {'√': '\\sqrt{#0}', '∛': '\\sqrt[3]{#0}', '∜': '\\sqrt[4]{#0}'};
/* Symbols that arrive as text (paste, phone keyboards, Option-key characters) become proper editor
   structures: a trailing √ ∛ ∜ opens a root at the caret, √2 becomes \sqrt{2}, ½ a fraction, φ τ π symbols. */
function fixUnicode(mf) {
    const original = mf.value;
    if (!/[√∛∜½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞φϕτπ∞]|\\surd/.test(original)) return;
    const atEnd = mf.position === mf.lastOffset;
    let v = original.replace(/\\surd\s*/g, '√');
    const trailing = v.match(/([√∛∜])\s*$/);
    if (trailing && atEnd) {
        mf.value = v.slice(0, trailing.index);
        mf.position = mf.lastOffset;
        mf.insert(ROOT_CHARS[trailing[1]], {selectionMode: 'placeholder'});
        return;
    }
    v = v.replace(/([√∛∜])\s*(\d+(?:\.\d+)?|\\pi|[a-z]|\{[^{}]*\}|\([^()]*\))/g, (m, r, a) => ROOT_CHARS[r].replace('#0', a[0] === '{' ? a.slice(1, -1) : a));
    v = v.replace(/(\d)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (m, d, c) => `${d}\\,${UNICODE_TEX[c]} `); // 1½ stays a mixed number
    v = v.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞φϕτπ∞]/g, c => UNICODE_TEX[c] + ' ');
    if (v !== original) { mf.value = v; if (atEnd) mf.position = mf.lastOffset; }
}
/* sqrt(5) and e^(-1) behave like function calls: a closing bracket that wraps the whole argument ends it. */
function closeWrappedGroup(mf) {
    try {
        const g = caretGroup(mf), s = g.text;
        if (g.start === 0 || s[0] !== '(' || s[s.length - 1] !== ')') return;
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
            depth += s[i] === '(' ? 1 : s[i] === ')' ? -1 : 0;
            if (depth === 0 && i < s.length - 1) return; // the first bracket closes early: (a)+(b)
        }
        mf.executeCommand('moveAfterParent');
    } catch {}
}
/* Read an answer box: LaTeX from the math editor, plain text from the fallback input. */
function readField(i) {
    const el = $(`#answer-${i}`), raw = (el.value || '').trim(), unit = exercise?.parts[i]?.unit || '';
    if (!raw) return {empty: true, value: NaN};
    try {
        // A unit typed after the number ("2.5 mA", "60 degrees", "4.7 kohm") is accepted and ignored.
        const plain = MathInput.stripUnit(isMath(el) ? MathInput.fromLatex(raw) : raw, unit), r = MathInput.read(plain);
        return {value: r.value, latex: r.latex, raw};
    } catch (err) {
        return {value: NaN, error: err.message, raw};
    }
}
let today = localDate(), date = today, topic = 'circuits', level = 'level-1', group = 'circuits-electronics', view = 'home', hintCount = 0, solutionShown = false, exercise;
let progress = {}, attempts = {}, storageAvailable = true;
/* key → the answers last checked for that problem, so a finished problem can show them beside the solution. */
let submitted = {};
/* Coins: rewards earned at streak milestones, and the archive days bought with them. */
let wallet = {earned: {}, unlocked: {}};
/* Levels removed in the regrouping. Their solves stay in storage and still count in totals and streaks. */
const RETIRED_LEVELS = ['foundations', 'applied'];
/* date:topic:tier → date:topic:level-N; the oldest date:topic keys were Foundations. Keys already on a level stay. */
const migrateKey = k => { const [d, t, l] = k.split(':'), to = l && levelOfTier(l); return !l ? `${d}:${t}:foundations` : to ? `${d}:${t}:${to.id}` : k; };
try {
    const saved = JSON.parse(localStorage.getItem('daily-engineer-v1') || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const [k, v] of Object.entries(saved)) {
            if (!v || !['solved', 'reviewed'].includes(v.status))
                continue;
            // Records saved before the levels were regrouped carry a tier id: file them under its level.
            const k2 = migrateKey(k);
            if (!progress[k2] || v.status === 'solved') progress[k2] = v;
        }
    }
    const a = JSON.parse(localStorage.getItem('daily-engineer-attempts') || '{}');
    if (a && typeof a === 'object' && !Array.isArray(a))
        for (const [k, n] of Object.entries(a)) attempts[migrateKey(k)] = Math.max(attempts[migrateKey(k)] || 0, n);
    const sub = JSON.parse(localStorage.getItem('daily-engineer-answers') || '{}'), keepFrom = shifted(today, -31);
    if (sub && typeof sub === 'object' && !Array.isArray(sub))
        for (const [k, v] of Object.entries(sub)) if (Array.isArray(v) && k.split(':')[0] >= keepFrom) submitted[k] = v; // the archive reaches back 30 days
    const w = JSON.parse(localStorage.getItem('daily-engineer-coins') || '{}');
    if (w && typeof w === 'object')
        for (const part of ['earned', 'unlocked']) if (w[part] && typeof w[part] === 'object' && !Array.isArray(w[part])) wallet[part] = w[part];
} catch {
    storageAvailable = false;
}
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const key = (t=topic, l=level) => `${date}:${t}:${l}`;
const activeRecords = () => Object.entries(progress).filter(([k]) => TOPICS.some(t => t.id === k.split(':')[1]) && (LEVELS.some(l => l.id === k.split(':')[2]) || RETIRED_LEVELS.includes(k.split(':')[2])));
/* Typeset $…$ and $$…$$ with KaTeX (no-op if KaTeX failed to load). */
function renderMath(el) {
    if (!el || !window.renderMathInElement) return;
    renderMathInElement(el, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg']});
    // An inline formula wider than its line (a long fraction on a phone) gets a line of its own that scrolls sideways.
    el.querySelectorAll('.katex').forEach(k => {
        if (k.closest('.katex-display')) return;
        let box = k.parentElement; // the line it sits in: the nearest block, since inline wrappers have no width of their own
        while (box && box !== el && getComputedStyle(box).display.startsWith('inline')) box = box.parentElement;
        if (!box) return;
        const cs = getComputedStyle(box), room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (room > 0 && k.getBoundingClientRect().width > room + 1) k.classList.add('katex-wide');
    });
}
function save() {
    try {
        localStorage.setItem('daily-engineer-v1', JSON.stringify(progress));
        localStorage.setItem('daily-engineer-attempts', JSON.stringify(attempts));
        localStorage.setItem('daily-engineer-answers', JSON.stringify(submitted));
        localStorage.setItem('daily-engineer-coins', JSON.stringify(wallet));
    } catch {
        storageAvailable = false;
    }
    updateStorageNote();
}
function updateStorageNote() {
    document.querySelectorAll('.local-note').forEach(el => { el.textContent = storageAvailable ? 'Progress stays in this browser.' : 'Browser storage unavailable; progress lasts for this visit.'; });
}
/* ---------- streaks and coins ----------
   A discipline is done for a day once any one of its levels is solved that day. Every discipline keeps its own streak;
   each milestone a streak reaches pays coins once, and coins unlock past days in the archive. */
const MILESTONES = [[3, 10], [7, 20], [10, 30], [15, 50], [30, 100], [60, 200], [180, 500], [365, 1000]];
const UNLOCK_COST = 10;
const milestoneName = d => ({30: '1 month', 60: '2 months', 180: '6 months', 365: '1 year'})[d] || `${d} days`;
const streakName = d => `${({30: '1-month', 60: '2-month', 180: '6-month', 365: '1-year'})[d] || `${d}-day`} streak`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const doneOn = (t, d) => [...LEVELS.map(l => l.id), ...RETIRED_LEVELS].some(l => { const r = progress[`${d}:${t}:${l}`]; return r?.status === 'solved' && r.daily; });
/* The current run: it includes today once today is done, and stays alive through yesterday until midnight. */
function topicStreak(t) {
    const doneToday = doneOn(t, today);
    let d = doneToday ? today : shifted(today, -1), n = 0;
    while (doneOn(t, d)) { n++; d = shifted(d, -1); }
    return {length: n, start: shifted(d, 1), doneToday};
}
function bestStreak(t) {
    const days = [...new Set(Object.keys(progress).filter(k => k.split(':')[1] === t).map(k => k.split(':')[0]))].filter(d => doneOn(t, d)).sort();
    let best = 0, run = 0, prev = null;
    for (const d of days) { run = prev && shifted(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
    return best;
}
const streak = () => Math.max(0, ...TOPICS.map(t => topicStreak(t.id).length)); // the longest current streak, for summaries
const doneToday = () => TOPICS.filter(t => doneOn(t.id, today)).length;
const nextMilestone = n => MILESTONES.find(([m]) => m > n);
const coins = () => Object.values(wallet.earned).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) - Object.values(wallet.unlocked).reduce((sum, u) => sum + (Number(u.cost) || 0), 0);
/* Pay every milestone each discipline's current run has reached but not yet been paid for. Returns the new rewards. */
function syncRewards() {
    const fresh = [];
    for (const t of TOPICS) {
        const st = topicStreak(t.id);
        for (const [days, amount] of MILESTONES) {
            const k = `${t.id}:${st.start}:${days}`;
            if (st.length >= days && !wallet.earned[k]) { wallet.earned[k] = {amount, at: today}; fresh.push({topic: t, days, amount}); }
        }
    }
    if (fresh.length) save();
    return fresh;
}
/* Past days start locked; a day you already played stays open. Unlocking opens all four levels of that day. */
const hasPlayed = (t, d) => [progress, attempts].some(store => Object.keys(store).some(k => k.startsWith(`${d}:${t}:`)));
const isOpen = (t, d) => d >= today || !!wallet.unlocked[`${t}:${d}`] || hasPlayed(t, d);
function unlockDay(t, d) {
    if (isOpen(t, d) || coins() < UNLOCK_COST) return false;
    wallet.unlocked[`${t}:${d}`] = {cost: UNLOCK_COST, at: today};
    save();
    renderCoins();
    toast(`<p><span>Unlocked ${longDate(d)} · ${topicOf(t).name}</span><b>−${UNLOCK_COST} ◎</b></p>`);
    return true;
}
let shownCoins = null, shownDone = null;
function renderCoins() {
    const n = coins();
    countTo($('#coin-count'), shownCoins ?? n, n);
    shownCoins = n;
    $('#coin-link').setAttribute('aria-label', `${plural(n, 'coin')}. Streaks and rewards`);
}
let toastTimer;
function toast(html) {
    const el = $('#toast');
    el.innerHTML = html;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth; // restart the entrance animation
    el.classList.add('show');
    popToast(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 6000);
}
function announceRewards(list) {
    renderCoins();
    if (list.length) toast(list.map(r => `<p><span>${streakName(r.days)} · ${r.topic.name}</span><b>+<span data-count="${r.amount}">${r.amount}</span> ◎</b></p>`).join(''));
}
const LOCK_ICON = '<svg class="lock" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="7" width="10" height="7"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>';
const glyph = tex => window.katex ? katex.renderToString(tex, {throwOnError: false}) : tex;
const longDate = (d, opts={weekday: 'short', day: 'numeric', month: 'short'}) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', opts);
const dotDate = d => d.split('-').reverse().join('.');
const statusOf = (t, l, d=date) => progress[`${d}:${t}:${l}`]?.status;
const topicOf = id => TOPICS.find(t => t.id === id);
function readJSON(k) {
    try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
}
/* A discipline opens at the level last used there, else Level 1. */
const levelFor = t => { const l = readJSON('daily-engineer-levels')?.[t]; return LEVELS.some(x => x.id === l) ? l : LEVELS[0].id; };
function lastPlayed() {
    try {
        const [t, l] = (localStorage.getItem('daily-engineer-last') || '').split('/');
        return topicOf(t) && LEVELS.some(x => x.id === l) ? [t, l] : null;
    } catch { return null; }
}
/* ---------- Today: every discipline as a card ---------- */
function introHTML() {
    let seen = false;
    try { seen = localStorage.getItem('daily-engineer-intro') === 'done'; } catch {}
    if (seen || Object.keys(progress).length) return '';
    return `<section class="intro frame" aria-labelledby="intro-title"><h2 id="intro-title">New here? It works in three steps.</h2><ol class="intro-steps">`
        + `<li><b aria-hidden="true">1</b><span><strong>Choose a category</strong> below, then a discipline. Each has a new problem every day.</span></li>`
        + `<li><b aria-hidden="true">2</b><span><strong>Choose a level</strong>, from 1 (Insight) to 4 (Expert). One solved level a day keeps that discipline’s streak.</span></li>`
        + `<li><b aria-hidden="true">3</b><span><strong>Type your answer.</strong> You get five attempts; the full worked solution opens when you finish.</span></li>`
        + `</ol><button class="ghost" type="button" id="dismiss-intro">Got it</button></section>`;
}
function cardStatus(t) {
    const st = topicStreak(t.id);
    if (st.doneToday) return {cls: 'ok', text: `✓ Done today · ${st.length}-day streak`};
    if (st.length) return {cls: 'due', text: `Solve today to keep your ${st.length}-day streak`};
    return {cls: '', text: 'Not done yet today'};
}
function cardHTML(t) {
    const lv = levelFor(t.id), n = LEVELS.findIndex(l => l.id === lv) + 1, status = cardStatus(t), done = doneOn(t.id, today);
    const levels = LEVELS.map((l, i) => {
        const x = statusOf(t.id, l.id, today);
        return `<a class="lvl ${x || ''}" href="#/${t.id}/${l.id}" title="${l.tag} · ${l.name} · ${l.time}${x ? ` · ${x} today` : ''}"><span class="visually-hidden">${t.name}, ${l.tag}, ${l.name}${x ? `, ${x} today` : ''}</span><span aria-hidden="true">${i + 1}</span></a>`;
    }).join('');
    return `<article class="card frame ${done ? 'done' : ''}" data-topic="${t.id}"><div class="card-top"><span class="card-glyph" aria-hidden="true">${glyph(GLYPHS[t.id])}</span><div class="card-head"><h3 class="card-title"><a class="card-link" href="#/${t.id}/${lv}">${t.name}</a></h3><p class="card-sub">${t.sub}.</p></div></div>`
        + `<p class="card-status ${status.cls}">${status.text}</p>`
        + `<div class="card-levels" role="group" aria-label="${t.name} levels"><span class="lvl-k" aria-hidden="true">Level</span>${levels}</div><span class="card-cta" aria-hidden="true">${done ? 'Practise another level' : `Start level ${n}`} →</span></article>`;
}
/* ---------- Main menu: choose a category, continue, or open the archive, progress or help ---------- */
const MENU_ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>',
    archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V12M10 20V6M15 20v-9M20 20V9M3 20h18"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6M12 16.8v.4"/></svg>'
};
const groupName = id => GROUPS.find(g => g.id === id).name;
function renderHome() {
    const n = doneToday(), best = streak(), last = lastPlayed();
    const cats = GROUPS.map(g => {
        const ts = TOPICS.filter(t => t.group === g.id), done = ts.filter(t => doneOn(t.id, today)).length, run = Math.max(0, ...ts.map(t => topicStreak(t.id).length));
        return `<a class="menu-cat frame" href="#/${g.id}" data-menu="${g.id}"><span class="menu-glyphs" aria-hidden="true">${ts.slice(0, 4).map(t => `<span>${glyph(GLYPHS[t.id])}</span>`).join('')}</span>`
            + `<span class="menu-cat-name">${g.name}</span><span class="menu-cat-sub">${plural(ts.length, 'discipline')} · ${done} done today${run ? ` · best streak ${plural(run, 'day')}` : ''}</span>`
            + `<span class="menu-cat-list">${ts.map(t => t.name).join(' · ')}</span><span class="menu-go" aria-hidden="true">Open ${g.name} →</span></a>`;
    }).join('');
    const items = [
        last && `<a class="menu-item" href="#/${last[0]}/${last[1]}" data-menu="continue">${MENU_ICONS.play}<span><b>Continue</b><small>${topicOf(last[0]).name} · ${LEVELS.find(l => l.id === last[1]).tag}</small></span></a>`,
        `<a class="menu-item" href="#/archive" data-menu="archive">${MENU_ICONS.archive}<span><b>Archive</b><small>Past days, unlocked with coins</small></span></a>`,
        `<a class="menu-item" href="#/progress" data-menu="progress">${MENU_ICONS.progress}<span><b>Progress</b><small>Streaks, rewards and history</small></span></a>`,
        `<button class="menu-item" type="button" id="menu-help" data-menu="help">${MENU_ICONS.help}<span><b>How it works</b><small>Rules, coins and shortcuts</small></span></button>`
    ].filter(Boolean).join('');
    $('#home').innerHTML = `<header class="menu-head"><p class="kicker mono">Main menu</p><h1>Daily Engineer</h1><p class="muted">${longDate(today, {weekday: 'long', day: 'numeric', month: 'long'})} · new problems in <span class="countdown">--:--:--</span></p></header>`
        + `<section class="menu-stats" aria-label="Today at a glance"><div class="frame"><b>${n}<small>/${TOPICS.length}</small></b><span>disciplines done today</span><div class="goal-bar" role="progressbar" aria-label="Disciplines done today" aria-valuemin="0" aria-valuemax="${TOPICS.length}" aria-valuenow="${n}"><span></span></div></div><div class="frame"><b>◎ ${coins()}</b><span>coins</span></div><div class="frame"><b>${best}</b><span>best current streak</span></div></section>`
        + introHTML()
        + `<nav class="menu" aria-label="Main menu"><h2 class="menu-k">Choose a category</h2><div class="menu-cats">${cats}</div><h2 class="menu-k">More</h2><div class="menu-items">${items}</div></nav>`;
    fillBar($('#home .goal-bar span'), 100 * n / TOPICS.length, shownDone ?? 0);
    shownDone = 100 * n / TOPICS.length;
    $('#dismiss-intro')?.addEventListener('click', () => { remember('daily-engineer-intro', 'done'); $('#home .intro')?.remove(); });
    $('#menu-help').addEventListener('click', () => $('#about-dialog').showModal());
}
/* A category: its disciplines as cards, with a switch to the other category. */
function renderCategory() {
    const ts = TOPICS.filter(t => t.group === group), done = ts.filter(t => doneOn(t.id, today)).length;
    const was = chosenRect('#category .switch', '.switch-opt.current');
    const sw = GROUPS.map(g => `<a class="switch-opt ${g.id === group ? 'current' : ''}" href="#/${g.id}" ${g.id === group ? 'aria-current="page"' : ''} title="${g.name}">${g.short}</a>`).join('');
    $('#category').innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a id="cat-back" href="#/">← Main menu</a><span aria-hidden="true">/</span><span class="crumb-here">${groupName(group)}</span></nav>`
        + `<header class="cat-head"><div><h1>${groupName(group)}</h1><p class="muted">${done} of ${ts.length} done today. Pick a discipline and a level; one solved level a day keeps its streak.</p><div class="goal-bar cat-bar" role="progressbar" aria-label="Done today in ${groupName(group)}" aria-valuemin="0" aria-valuemax="${ts.length}" aria-valuenow="${done}"><span></span></div></div><nav class="switch" aria-label="Category">${sw}</nav></header>`
        + `<div class="cards">${ts.map(cardHTML).join('')}</div>`;
    fillBar($('#category .cat-bar span'), 100 * done / ts.length);
    glide($('#category .switch'), '.switch-opt.current', was);
    cascade([...document.querySelectorAll('#category .card')]);
}
/* Where Back and Esc lead: problem → its category (or the archive for a past day) → main menu. */
const backHref = () => view === 'problem' ? (date !== today ? `#/${topic}/archive` : `#/${topicOf(topic).group}`) : '#/';
/* Above a problem: a breadcrumb with this discipline's streak, and the four levels as labelled tabs. */
function renderBar() {
    const t = topicOf(topic), suffix = date === today ? '' : '/' + date, st = topicStreak(topic);
    const tabs = LEVELS.map((l, i) => {
        const x = statusOf(topic, l.id), current = l.id === level;
        return `<a class="level-tab ${x || ''} ${current ? 'current' : ''}" href="#/${topic}/${l.id}${suffix}" data-level="${l.id}" ${current ? 'aria-current="page"' : ''}><span class="tab-num" aria-hidden="true">${i + 1}</span><span class="tab-text"><b>${l.tag} · ${l.name}</b><small>${x === 'solved' ? '✓ Solved' : x === 'reviewed' ? 'Solution seen' : l.time}</small></span></a>`;
    }).join('');
    const where = date !== today ? `From the archive · ${longDate(date, {weekday: 'long', day: 'numeric', month: 'long'})}` : st.doneToday ? `✓ Done today · ${st.length}-day streak` : st.length ? `Solve any level to keep your ${st.length}-day streak` : 'Solve any level to start a streak';
    $('#problem-bar').innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a id="back-link" href="${backHref()}">← ${date === today ? groupName(t.group) : 'Archive'}</a><span aria-hidden="true">/</span><span class="crumb-here">${t.name}</span><span class="bar-date ${date === today && st.doneToday ? 'ok' : ''}">${where}</span></nav><nav class="level-tabs" aria-label="Level">${tabs}</nav>`;
}
/* Once a problem is finished (or its solution seen), point to the next level and the next unsolved discipline. */
function nextStepsHTML() {
    if (!finished() && progress[key()]?.status !== 'reviewed') return '';
    const i = LEVELS.findIndex(l => l.id === level), suffix = date === today ? '' : '/' + date, links = [];
    if (i < LEVELS.length - 1) links.push(`<a href="#/${topic}/${LEVELS[i + 1].id}${suffix}">Next: ${LEVELS[i + 1].tag} · ${LEVELS[i + 1].name} →</a>`);
    const k = TOPICS.findIndex(t => t.id === topic), next = date === today && TOPICS.slice(k + 1).concat(TOPICS.slice(0, k)).find(t => !doneOn(t.id, today));
    if (next) links.push(`<a href="#/${next.id}/${levelFor(next.id)}">Next discipline: ${next.name} →</a>`);
    return links.join('');
}
/* The archive: pick a discipline, then a day. Today is open; past days unlock with coins (days already played stay open). */
function renderArchive() {
    const t = topicOf(topic), bal = coins(), was = chosenRect('#archive .picker', '.pick.current');
    const picker = TOPICS.map(x => `<a class="pick ${x.id === t.id ? 'current' : ''}" href="#/${x.id}/archive" ${x.id === t.id ? 'aria-current="page"' : ''}>${x.name}</a>`).join('');
    const rows = Array.from({length: 31}, (_, k) => shifted(today, -k)).map(d => {
        const open = isOpen(t.id, d), label = d === today ? 'Today' : longDate(d);
        const content = open ? LEVELS.map((l, i) => {
            const st = statusOf(t.id, l.id, d);
            return `<a class="arch-node ${st || ''}" href="#/${t.id}/${l.id}${d === today ? '' : '/' + d}" title="${l.tag} · ${l.name}${st ? ` (${st})` : ''}"><span class="visually-hidden">${longDate(d, {day: 'numeric', month: 'long'})}, ${l.tag}${st ? `, ${st}` : ''}</span><span aria-hidden="true">${i + 1}</span></a>`;
        }).join('') : `<button class="ghost small unlock" type="button" data-unlock="${d}" ${bal < UNLOCK_COST ? 'disabled' : ''} aria-label="Unlock ${longDate(d, {weekday: 'long', day: 'numeric', month: 'long'})} for ${UNLOCK_COST} coins">${LOCK_ICON} Unlock · ${UNLOCK_COST} coins</button>`;
        return `<li class="${d === today ? 'today' : ''} ${open ? '' : 'locked'}"><span class="arch-date">${label}</span><span class="arch-track ${open ? '' : 'shut'}">${content}</span></li>`;
    }).join('');
    const locked = Array.from({length: 30}, (_, k) => shifted(today, -(k + 1))).filter(d => !isOpen(t.id, d)).length;
    const can = Math.floor(bal / UNLOCK_COST);
    const wallet = bal < UNLOCK_COST ? `Earn coins with streaks: a ${MILESTONES[0][0]}-day streak in any discipline pays ${MILESTONES[0][1]}.` : `Enough to unlock ${plural(can, 'more day')}.`;
    $('#archive').innerHTML = `<header class="page-head"><h1>Archive</h1><p class="muted">Practise the last 30 days. Today is always open. A past day costs ${UNLOCK_COST} coins and opens all four of its levels; days you already played stay open.</p></header>`
        + `<div class="archive-bar frame"><p class="archive-coins"><b>◎ ${bal}</b> coins</p><p class="muted">${wallet}</p></div>`
        + `<nav class="picker" aria-label="Discipline">${picker}</nav>`
        + `<div class="arch-head"><h2>${t.name}</h2><span class="muted">${plural(locked, 'day')} locked</span></div><ol class="arch-list">${rows}</ol>`;
    glide($('#archive .picker'), '.pick.current', was);
    $('#archive').querySelectorAll('[data-unlock]').forEach(b => b.addEventListener('click', () => { if (unlockDay(t.id, b.dataset.unlock)) renderArchive(); }));
}
/* A past day that is still locked: offer to unlock it right here. */
function renderLocked() {
    const t = topicOf(topic), bal = coins();
    renderBar();
    const action = bal >= UNLOCK_COST ? `<button class="primary" type="button" id="unlock-here">Unlock for ${UNLOCK_COST} coins</button>` : `<p class="muted">You need ${plural(UNLOCK_COST - bal, 'more coin')}. Keep a daily streak in any discipline: ${milestoneName(MILESTONES[0][0])} pays +${MILESTONES[0][1]}, ${milestoneName(MILESTONES[1][0])} +${MILESTONES[1][1]}.</p>`;
    $('#challenge').innerHTML = `<div class="frame locked-panel"><p class="kicker mono">${LOCK_ICON} Locked · ${longDate(date)}</p><h1 class="problem-title">This day is still locked.</h1><p class="muted">Unlock it for ${UNLOCK_COST} coins to open all four levels of ${t.name} from ${longDate(date, {weekday: 'long', day: 'numeric', month: 'long'})}. You have ${plural(bal, 'coin')}.</p>${action}<p class="locked-back"><a href="#/${topic}/archive">← Back to the archive</a> · <a href="#/${topic}/${level}">Today’s ${t.name} problem</a></p></div>`;
    $('#unlock-here')?.addEventListener('click', () => { if (unlockDay(topic, date)) route(); });
}
const used = () => attempts[key()] || 0;
const locked = () => progress[key()]?.status !== 'solved' && used() >= MAX_ATTEMPTS;
/* Solved, or out of attempts: the full worked solution is then shown without asking. */
const finished = () => progress[key()]?.status === 'solved' || locked();
const solutionLabel = open => open ? 'Hide solution' : finished() || progress[key()]?.status === 'reviewed' ? 'Show solution' : 'Reveal solution';
function attemptsLabel() {
    const left = MAX_ATTEMPTS - used();
    return progress[key()]?.status === 'solved' ? '✓ Solved' : left > 0 ? `${plural(left, 'attempt')} left` : 'No attempts left';
}
function renderChallenge() {
    hintCount = 0;
    solutionShown = progress[key()]?.status === 'reviewed' || finished();
    exercise = makeExercise(topic, date, level);
    const t = TOPICS.find(t => t.id === topic), e = exercise, record = progress[key()], curated = e.curated;
    renderBar();
    const exactParts = e.parts.some(p => p.exact);
    $('#challenge').innerHTML = `<div class="task"><div class="frame problem-frame challenge-body ${curated ? 'curated' : ''}"><div class="problem-meta mono"><span id="status-line">${record?.status === 'solved' ? '✓ COMPLETED' : record?.status === 'reviewed' ? 'SOLUTION REVIEWED' : e.parts.length > 1 ? `${e.parts.length} CONNECTED PARTS` : 'ONE KEY INSIGHT'}</span><span>${e.level} · ${e.minutes}${date === today ? '' : ' · From the archive'}</span></div><h1 class="problem-title">${e.title}</h1><div class="problem-text">${e.text}</div>${e.diagram ? `<div class="diagram-toolbar"><span>Diagram</span><button type="button" id="enlarge-diagram" class="ghost small" aria-haspopup="dialog">Enlarge</button></div><div class="diagram">${e.diagram}</div>` : ''}${e.givens?.length ? `<div class="givens">${e.givens.map(g => `<span class="given">${g}</span>`).join('')}</div>` : ''}<details class="prerequisites"><summary>What you’ll need</summary><p>${e.prerequisites}</p></details></div><aside class="answer-panel" aria-label="Your answers"><div class="panel-head"><h2 class="panel-title">Your answer${e.parts.length > 1 ? 's' : ''}</h2><span id="attempts">${attemptsLabel()}</span></div><form id="answer-form" novalidate><div class="answers">${e.parts.map((p, i) => `<div class="answer-part"><label class="answer-label" for="answer-${i}">${e.parts.length > 1 ? String.fromCharCode(65 + i) + '. ' : ''}${p.label}</label><div class="input-wrap">${fieldHTML(p, i)}${p.unit ? `<span>${p.unit}</span>` : ''}</div><div class="preview" id="preview-${i}" aria-hidden="true"></div><div id="part-feedback-${i}" class="part-feedback" role="status"></div></div>`).join('')}</div><p class="input-help" id="answer-help">${MATH_EDITOR ? 'Type maths: <code>3/4</code> makes a fraction, <code>sqrt</code> a root, <code>pi</code> π; <kbd>→</kbd> steps out. ' : 'Type expressions such as <code>pi/4</code> or <code>sqrt(3)/2</code>. '}${exactParts ? 'Exact answers or 4 significant figures.' : 'Decimals and <code>2e-3</code> work; within 1% unless stated.'}</p>${typingGuideHTML()}<button class="primary" type="submit" id="check">${e.parts.length > 1 ? 'Check all answers' : 'Check answer'}</button><div class="feedback ${record?.status === 'solved' ? 'success' : ''}" id="feedback" role="status">${record?.status === 'solved' ? 'You’ve solved this one. The full working is below.' : ''}</div><div id="next-steps" class="next-steps mono">${nextStepsHTML()}</div></form><div class="help-row"><p class="help-k">Stuck?</p><button id="hint" class="ghost" type="button">Show a hint <span id="hint-count">0/${e.hints.length}</span></button><button id="solution" class="ghost" type="button" aria-expanded="${solutionShown}">${solutionLabel(solutionShown)}</button></div><div id="hints" class="hint-content" hidden></div></aside></div>${boardHTML(e.title, e.text)}<div id="solution-content" class="solution frame" ${solutionShown ? '' : 'hidden'}>${solutionHTML()}</div>${sourceHTML(e.source)}`;
    renderMath($('#challenge'));
    drawDiagram($('#challenge .diagram svg'));
    mountBoard(key());
    if (e.diagram) {
        const dialog = $('#diagram-dialog');
        const updateDiagram = () => {
            $('#diagram-title').textContent = e.title;
            $('#large-diagram').innerHTML = e.diagram;
        };
        if (dialog.open) updateDiagram();
        $('#enlarge-diagram').onclick = () => {
            updateDiagram();
            dialog.showModal();
        };
    }
    e.parts.forEach((p, i) => {
        const el = $(`#answer-${i}`);
        let pendingClose = false; // after ")", step out of a root or function once MathLive has placed the bracket
        const flushClose = () => { if (pendingClose) { pendingClose = false; closeWrappedGroup(el); } };
        el.addEventListener('input', () => { if (isMath(el)) fixUnicode(el); preview(i); });
        if (isMath(el)) {
            el.smartSuperscript = false; // 2^10 stays one exponent; operators step out instead.
            // log is base 10 (not a log with an empty base slot); atan/asin/acos are inverse trig functions.
            el.inlineShortcuts = {...el.inlineShortcuts, ...EDITOR_SHORTCUTS};
        }
        if (isMath(el)) el.addEventListener('keydown', ev => {
            // Finish pending clean-ups before this key lands: browsers can run a fast typist's next keystroke
            // before the timer after ")" or the input event after a pasted "∜".
            flushClose();
            fixUnicode(el);
            if (ev.key === 'Enter') { ev.preventDefault(); $('#answer-form').requestSubmit(); }
            else if (ev.key === ')') { smartClose(el); pendingClose = true; setTimeout(flushClose); }
            else if (ROOT_CHARS[ev.key]) { // √ ∛ ∜ keys (Option+V etc.): a real root with a bar, not a bare symbol
                ev.preventDefault();
                ev.stopImmediatePropagation();
                el.insert(ROOT_CHARS[ev.key], {selectionMode: 'placeholder'});
            }
            else if (ev.key === '*' && el.getValue(el.position - 1, el.position, 'latex') === '\\cdot') { // ** means power
                ev.preventDefault();
                ev.stopImmediatePropagation();
                el.executeCommand('deleteBackward');
                el.executeCommand('moveToSuperscript');
            }
            else if (ev.key === ' ') {
                leaveAtomGroup(el); // "…/2 Ω": a space after a lone number ends the denominator, exponent or root
                if (/\d$/.test(el.getValue(el.position - 1, el.position, 'latex'))) { // 1 1/2: keep the space so a mixed number reads as 1½
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    el.insert('\\,');
                }
            }
            else if (ev.key === '(') leaveAtomGroup(el); // log_2(8), 2^3(4): a lone base or exponent ends at a bracket
            else if ('+-*/'.includes(ev.key)) {
                leaveAtomGroup(el);
                if (ev.key === '/' && functionNumerator(el)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
            }
        }, {capture: true});
    });
    const last = submitted[key()];
    if (last) e.parts.forEach((p, i) => {
        const el = $(`#answer-${i}`);
        if (last[i]?.raw && last[i].math === isMath(el)) { el.value = last[i].raw; preview(i); }
    });
    $('#answer-form').onsubmit = checkAnswer;
    $('#hint').onclick = showHint;
    $('#solution').onclick = showSolution;
    applyLock();
}
function applyLock() {
    const on = locked();
    exercise.parts.forEach((p, i) => { const el = $(`#answer-${i}`); el.disabled = on; if (isMath(el)) el.readOnly = on; });
    $('#check').disabled = on;
    if (on && !$('#feedback').textContent) {
        $('#feedback').className = 'feedback error';
        $('#feedback').textContent = 'No attempts left. The full worked solution is below.';
    }
}
function preview(i) {
    const out = $(`#preview-${i}`), r = readField(i);
    out.classList.remove('invalid');
    if (r.empty) { out.innerHTML = ''; return; }
    if (!Number.isFinite(r.value)) {
        out.textContent = r.error && /empty box|Incomplete/.test(r.error) ? 'Keep going…' : 'Not a number yet';
        out.classList.add('invalid');
        return;
    }
    const plainNumber = /^-?[\d.]+$/.test(r.raw);
    // The math editor already shows the typeset expression, so only add its value; the fallback shows both.
    const tex = '\\displaystyle ' + (isMath($(`#answer-${i}`)) ? (plainNumber ? '' : `\\approx ${tf(r.value, 6)}`) : (plainNumber ? r.latex : `${r.latex} \\approx ${tf(r.value, 6)}`));
    if (window.katex) katex.render(tex, out, {throwOnError: false}); else out.textContent = tex;
}
function sourceHTML(s) {
    if (s?.reading)
        return `<div class="source-credit"><span>ORIGINAL DAILY ENGINEER EXERCISE</span><p>Further reading (open material): <a href="${s.reading.url}" target="_blank" rel="noopener">${s.reading.title}</a>.</p></div>`;
    return s ? `<div class="source-credit"><span>ADAPTED OPEN EDUCATIONAL MATERIAL</span><p>Based on <a href="${s.url}" target="_blank" rel="noopener">${s.title}</a> by ${s.author || 'Tony R. Kuphaldt, All About Circuits'} · <a href="${s.licenseUrl || 'https://creativecommons.org/licenses/by/1.0/'}" target="_blank" rel="noopener">${s.license || 'CC BY 1.0'}</a>. ${s.changes || 'Wording and values changed; diagrams redrawn; guided steps added.'} Adapted exercise content uses the same license.</p></div>` : '';
}
const escapeHTML = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
/* The exact form (when there is one), its unit and its decimal value. */
function correctHTML(p) {
    const approx = p.exact && !/^-?\d+$/.test(p.exact) ? ` <span class="approx">(≈ $${tf(p.answer)}$)</span>` : '';
    return `$${p.exact || tf(p.answer)}$${p.unit ? ' ' + escapeHTML(p.unit) : ''}${approx}`;
}
function yoursHTML(m) {
    if (!m.tex) return `<code>${escapeHTML(m.raw)}</code>`;
    const approx = m.value !== null && !/^-?\d+(\.\d+)?$/.test(m.tex) ? ` <span class="approx">(≈ $${tf(m.value)}$)</span>` : '';
    return `$${m.tex}$${approx}`;
}
/* The full worked solution: every answer beside yours, the approach, each step of the working and the key idea. */
function solutionHTML() {
    const e = exercise, mine = submitted[key()], status = progress[key()]?.status;
    const verdict = status === 'solved' ? `✓ Solved in ${used()} attempt${used() === 1 ? '' : 's'}. Here is the full working.` : locked() ? 'No attempts left. Here is the full working.' : '';
    const review = e.parts.map((p, i) => {
        const m = mine?.[i], ok = m && answerMatches(m.value, p);
        const yours = m ? `<div class="review-row"><span class="review-key">${ok ? '✓ Yours' : '✗ Yours'}</span><span>${yoursHTML(m)}</span></div>` : '';
        return `<li class="${m ? (ok ? 'ok' : 'miss') : ''}"><div class="review-label">${p.label}</div><div class="review-row"><span class="review-key">Correct</span><span>${correctHTML(p)}</span></div>${yours}</li>`;
    }).join('');
    return `${verdict ? `<p class="solution-verdict">${verdict}</p>` : ''}<h4>Answers</h4><ol class="answer-review">${review}</ol>` +
        `<h4>How to approach it</h4><ul class="approach">${e.hints.map(h => `<li>${h}</li>`).join('')}</ul>` +
        `<h4>Worked solution</h4>${e.steps.length > 1 ? '<div class="walk-bar"><button type="button" class="ghost small" data-walk>Walk through it step by step</button></div>' : ''}<ol class="steps">${e.steps.map(st => `<li>${st}</li>`).join('')}</ol>` +
        `<h4>Take this with you</h4><p>${e.idea}</p>`;
}
/* Explain why an answer could not be read: an unfinished box, a different unit, or unknown notation. */
function unreadableHint(i, p) {
    const r = readField(i);
    if (r.empty) return 'Enter an answer.';
    if (r.error && /empty box|Incomplete/.test(r.error)) return 'Finish the expression: there is still an empty box.';
    if (p.unit && /\d[\s\\,]*[a-zA-ZµΩ°%]/.test(r.raw)) return `Give the value in ${p.unit}, or leave the unit out.`;
    return 'Could not read this. Try forms like −2.5, 1/3, 2e-3, pi/4 or sqrt(2).';
}
function parseAnswer(text) {
    try {
        return MathInput.read(text).value;
    } catch {
        return NaN;
    }
}
function answerMatches(value, p) {
    return Number.isFinite(value) && Math.abs(value - p.answer) <= Math.max(Math.abs(p.answer) * p.tolerance, p.abs || 0, 1e-9);
}
function checkAnswer(event) {
    event.preventDefault();
    if (locked()) return applyLock();
    let correct = 0, unreadable = false;
    exercise.parts.forEach((p, i) => {
        const field = $(`#answer-${i}`), out = $(`#part-feedback-${i}`), value = readField(i).value, ok = answerMatches(value, p);
        if (ok)
            correct++;
        if (!Number.isFinite(value)) unreadable = true;
        field.setAttribute('aria-invalid', String(!ok));
        out.className = 'part-feedback ' + (ok ? 'correct' : 'incorrect');
        if (ok) { out.innerHTML = `${TICK_SVG} Correct`; drawTick(out.querySelector('svg')); }
        else {
            out.textContent = !Number.isFinite(value) ? unreadableHint(i, p) : 'Not quite. Check the sign, units and relationships in this part.';
            if (Number.isFinite(value)) nudge(field.closest('.input-wrap'));
        }
    });
    const f = $('#feedback'), previous = progress[key()] || {};
    if (!unreadable && previous.status !== 'solved')
        submitted[key()] = exercise.parts.map((p, i) => {
            const r = readField(i);
            return {raw: r.raw || '', tex: r.latex || '', value: Number.isFinite(r.value) ? r.value : null, math: isMath($(`#answer-${i}`))};
        });
    if (correct === exercise.parts.length) {
        const status = previous.status === 'solved' ? 'solved' : solutionShown || previous.status === 'reviewed' ? 'reviewed' : 'solved';
        progress[key()] = {status, daily: previous.daily || date === today, hints: Math.max(hintCount, previous.hints || 0), attempts: used() + 1};
        if (previous.status !== 'solved') attempts[key()] = used() + 1;
        save();
        const fresh = date === today && status === 'solved' ? syncRewards() : [];
        renderBar();
        f.className = 'feedback success';
        let note = '';
        if (date === today && status === 'solved') {
            const st = topicStreak(topic), paid = fresh.filter(r => r.topic.id === topic).reduce((sum, r) => sum + r.amount, 0), next = nextMilestone(st.length);
            note = ` ${topicOf(topic).name} streak: ${plural(st.length, 'day')}.${paid ? ` +${paid} coins.` : ''}${next ? ` Next reward at ${milestoneName(next[0])} (+${next[1]}).` : ''}`;
        }
        const verdict = document.createElement('strong');
        verdict.className = 'verdict-word';
        verdict.textContent = 'All correct.';
        f.replaceChildren(verdict, status === 'solved' ? ` Solved at ${exercise.level} in ${used()} attempt${used() === 1 ? '' : 's'}.${note} The full worked solution is below.` : ' Saved as reviewed because the solution was revealed.');
        scrambleIn(verdict);
        announceRewards(fresh);
        $('#status-line').textContent = status === 'solved' ? '✓ COMPLETED' : 'SOLUTION REVIEWED';
        openSolution(true);
    } else {
        if (previous.status !== 'solved' && !unreadable) {
            attempts[key()] = used() + 1;
            save();
        }
        f.className = 'feedback error';
        const left = MAX_ATTEMPTS - used();
        f.textContent = previous.status === 'solved' ? `${correct} of ${exercise.parts.length} correct.` : unreadable ? 'Some answers could not be read, so no attempt was used.' : `${correct} of ${exercise.parts.length} correct. ${left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left.` : 'No attempts left. The full worked solution is below.'}`;
        applyLock();
        if (locked()) openSolution(true);
        else if (!$('#solution-content').hidden) openSolution(); // already revealed: refresh it with these answers
    }
    $('#attempts').textContent = attemptsLabel();
    $('#next-steps').innerHTML = nextStepsHTML();
}
function showHint() {
    if (hintCount >= exercise.hints.length)
        return;
    hintCount++;
    $('#hints').hidden = false;
    $('#hints').innerHTML = exercise.hints.slice(0, hintCount).map((h, i) => `<p><strong>Hint ${i + 1}.</strong> ${h}</p>`).join('');
    renderMath($('#hints'));
    $('#hint-count').textContent = `${hintCount}/${exercise.hints.length}`;
    $('#hint').disabled = hintCount === exercise.hints.length;
    if ($('#hint').disabled) $('#hint').firstChild.textContent = 'All hints shown ';
}
/* Fill and open the worked solution. Seeing it before solving marks the problem as reviewed. */
function openSolution(scroll=false) {
    const panel = $('#solution-content'), status = progress[key()]?.status;
    solutionShown = true;
    if (status !== 'solved' && status !== 'reviewed') {
        progress[key()] = {status: 'reviewed', daily: date === today, hints: hintCount};
        save();
        renderBar();
        $('#status-line').textContent = 'SOLUTION REVIEWED';
    }
    panel.innerHTML = solutionHTML();
    panel.hidden = false; // visible first, so formula widths can be measured
    renderMath(panel);
    mountSolution(panel, exercise);
    $('#solution').textContent = solutionLabel(true);
    $('#solution').setAttribute('aria-expanded', 'true');
    $('#next-steps').innerHTML = nextStepsHTML();
    if (scroll) $('#feedback').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function showSolution() {
    const panel = $('#solution-content');
    if (panel.hidden) return openSolution();
    panel.hidden = true;
    $('#solution').textContent = solutionLabel(false);
    $('#solution').setAttribute('aria-expanded', 'false');
}
function renderProgress() {
    const entries = activeRecords(), includesRetired = entries.some(([k]) => RETIRED_LEVELS.includes(k.split(':')[2]));
    const count = (t, l) => entries.filter(([k, v]) => k.split(':')[1] === t && k.split(':')[2] === l && v.status === 'solved').length;
    const solvedRows = GROUPS.map(g => `<tr class="group-row"><th colspan="${LEVELS.length + 1}">${g.name}</th></tr>` + TOPICS.filter(t => t.group === g.id).map(t => `<tr><th><a href="#/${t.id}">${t.name}</a></th>${LEVELS.map(l => { const n = count(t.id, l.id); return `<td class="${n ? 'some' : ''}">${n || '·'}</td>`; }).join('')}</tr>`).join('')).join('');
    const streakRows = GROUPS.map(g => `<tr class="group-row"><th colspan="4">${g.name}</th></tr>` + TOPICS.filter(t => t.group === g.id).map(t => {
        const st = topicStreak(t.id), next = nextMilestone(st.length), best = bestStreak(t.id);
        const pct = next ? 100 * st.length / next[0] : 100;
        return `<tr><th><a href="#/${t.id}">${t.name}</a></th><td class="${st.length ? 'some' : ''}">${st.length || '·'}${st.length && !st.doneToday ? '<span class="due"> due</span>' : ''}<span class="streak-bar" aria-hidden="true"><span data-to="${pct.toFixed(1)}"></span></span></td><td>${best || '·'}</td><td class="next-cell">${next ? `${milestoneName(next[0])} · +${next[1]}` : 'All earned'}</td></tr>`;
    }).join('')).join('');
    const ladder = MILESTONES.map(([d, a]) => `<li><span>${milestoneName(d)}</span><b>+${a} ◎</b></li>`).join('');
    const log = [
        ...Object.entries(wallet.earned).map(([k, e]) => { const [t, , days] = k.split(':'); return {at: e.at || '', text: `${streakName(Number(days))} · ${topicOf(t)?.name || t}`, amount: Number(e.amount) || 0}; }),
        ...Object.entries(wallet.unlocked).map(([k, u]) => { const [t, d] = k.split(':'); return {at: u.at || '', text: `Unlocked ${longDate(d)} · ${topicOf(t)?.name || t}`, amount: -(Number(u.cost) || 0)}; })
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
    const logHTML = log.length ? log.map(x => `<li><span class="log-date mono">${x.at ? longDate(x.at, {day: 'numeric', month: 'short'}) : ''}</span><span>${x.text}</span><b class="${x.amount < 0 ? 'spend' : ''}">${x.amount < 0 ? '−' : '+'}${Math.abs(x.amount)} ◎</b></li>`).join('') : '<li class="empty">No coins yet. A 3-day streak in any discipline pays the first 10.</li>';
    $('#progress-view').innerHTML = `<header class="page-head"><p class="kicker mono">Log / your learning</p><h1>Progress</h1><p class="muted">Solve any one level of a discipline each day to keep its streak. Streak milestones pay coins once per streak; coins unlock past days in the archive.</p></header>`
        + `<div class="stats"><div class="stat frame"><b>◎ <span class="stat-coins">${coins()}</span></b><span>Coins</span></div><div class="stat frame"><b>${doneToday()}<small>/${TOPICS.length}</small></b><span>Done today</span></div><div class="stat frame"><b>${streak()}</b><span>Best current streak</span></div></div>`
        + `<div class="progress-grid"><section><h2 class="section-k mono">Streaks</h2><div class="progress-table-wrap"><table class="progress-table streaks"><thead><tr><th>Discipline</th><th>Current</th><th>Best</th><th>Next reward</th></tr></thead><tbody>${streakRows}</tbody></table></div></section>`
        + `<section><h2 class="section-k mono">Rewards</h2><ol class="ladder">${ladder}</ol><h2 class="section-k mono">Coin log</h2><ul class="coin-log">${logHTML}</ul></section></div>`
        + `<h2 class="section-k mono">Solved by discipline and level</h2><div class="progress-table-wrap"><table class="progress-table"><thead><tr><th>Discipline</th>${LEVELS.map((l, i) => `<th><span class="arch-node static" title="${l.name}">${i + 1}</span></th>`).join('')}</tr></thead><tbody>${solvedRows}</tbody></table></div>`
        + `<p class="progress-note">${includesRetired ? 'Totals and streaks include your earlier work on retired levels. ' : ''}Archive practice adds to your totals but not to streaks. Progress is stored in this browser; clearing browser data removes it.</p>`;
    countTo($('#progress-view .stat-coins'), 0, coins());
    fillOnScroll([...document.querySelectorAll('#progress-view .streak-bar span')], $('#progress-view .streaks'));
}
/* Routes: #/ home · #/topic levels · #/topic/level-N today's problem · #/topic/level-N/YYYY-MM-DD archive · #/topic/archive · #/progress */
function parseRoute() {
    const [a, b, c] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (a === 'progress') return {view: 'progress'};
    if (a === 'archive') return {view: 'archive'};
    if (GROUPS.some(g => g.id === a)) return {view: 'group', group: a};
    if (!topicOf(a)) return {view: 'home'};
    if (!b) return {view: 'levels', topic: a};
    if (b === 'archive') return {view: 'archive', topic: a};
    if (!LEVELS.some(l => l.id === b)) return {view: 'levels', topic: a};
    const inArchive = /^\d{4}-\d{2}-\d{2}$/.test(c || '') && c >= shifted(today, -30) && c < today;
    return {view: 'problem', topic: a, level: b, date: inArchive ? c : today};
}
const SCREEN = {home: '#home', group: '#category', problem: '#problem', archive: '#archive', progress: '#progress-view'};
function route() {
    release('screen');
    release('solution');
    const r = parseRoute();
    if (r.view === 'levels') { location.replace(`#/${r.topic}/${levelFor(r.topic)}`); return; } // a discipline opens straight at its level
    if (r.view === 'archive' && !r.topic) { location.replace(`#/${topic}/archive`); return; } // the Archive tab opens on the last discipline
    view = r.view;
    if (r.topic) topic = r.topic;
    if (r.level) level = r.level;
    date = r.date || today;
    if (r.group) group = r.group;
    if (view === 'problem' || view === 'archive') group = topicOf(topic).group;
    for (const [v, sel] of Object.entries(SCREEN)) $(sel).hidden = v !== view;
    document.body.dataset.view = view;
    const tab = view === 'archive' || (view === 'problem' && date !== today) ? 'archive' : view === 'progress' ? 'progress' : 'menu';
    document.querySelectorAll('[data-tab]').forEach(a => { a.classList.toggle('active', a.dataset.tab === tab); if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    renderCoins();
    if (view === 'home') renderHome();
    else if (view === 'group') renderCategory();
    else if (view === 'archive') renderArchive();
    else if (view === 'progress') renderProgress();
    else if (!isOpen(topic, date)) renderLocked();
    else {
        renderChallenge();
        remember('daily-engineer-last', `${topic}/${level}`);
        remember('daily-engineer-levels', JSON.stringify({...readJSON('daily-engineer-levels'), [topic]: level}));
    }
    const t = topicOf(topic), lvl = LEVELS.find(l => l.id === level);
    document.title = view === 'problem' ? `${t.name} · ${lvl.tag} · Daily Engineer` : view === 'archive' ? `Archive · ${t.name} · Daily Engineer` : view === 'progress' ? 'Progress · Daily Engineer' : view === 'group' ? `${groupName(group)} · Daily Engineer` : 'Daily Engineer';
    tick();
    window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
/* Shortcuts while not typing in an answer: Esc goes back; on a problem 1–4 switch level, H shows a hint and
   Enter jumps to the first answer box. */
document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.target.closest?.('math-field, input, textarea, select')) return;
    const k = e.key;
    if (k === 'Escape' && view !== 'home') { location.hash = backHref(); return; }
    if (view === 'problem') {
        if (/^[1-9]$/.test(k) && LEVELS[k - 1]) { location.hash = `#/${topic}/${LEVELS[k - 1].id}${date === today ? '' : '/' + date}`; return; }
        if (k === 'h' || k === 'H') { if ($('#hint') && !$('#hint').disabled) showHint(); return; }
        if (k === 'Enter' && !e.target.closest?.('a, button, summary')) { e.preventDefault(); $('#answer-0')?.focus(); }
        return;
    }
    if ((view === 'home' || view === 'group') && /^Arrow(Up|Down|Left|Right)$/.test(k)) {
        const items = [...document.querySelectorAll(view === 'home' ? '#home [data-menu]' : '#category .card-link')], i = items.indexOf(document.activeElement);
        if (!items.length || (i < 0 && document.activeElement !== document.body)) return;
        e.preventDefault();
        items[i < 0 ? 0 : (i + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1) + items.length) % items.length].focus();
    }
});
for (const id of ['#about', '#about-bottom']) $(id).onclick = () => $('#about-dialog').showModal();
$('#close-dialog').onclick = () => $('#about-dialog').close();
$('#about-dialog').onclick = e => {
    if (e.target === $('#about-dialog')) {
        const r = e.target.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
            e.target.close();
    }
};
function tick() {
    const now = new Date(), next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const s = Math.floor((next - now) / 1000), left = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
    document.querySelectorAll('.countdown').forEach(el => { el.textContent = left; });
    const current = localDate();
    if (current !== today) { // midnight: a new set of problems
        today = current;
        route();
    }
}
$('#close-diagram').onclick = () => $('#diagram-dialog').close();
route();
announceRewards(syncRewards()); // streaks that reached a milestone before this visit are paid now
setInterval(tick, 1000);
