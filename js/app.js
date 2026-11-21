const $ = s => document.querySelector(s);
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shifted = (date, days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return localDate(d);
};
const GROUPS = [{id: 'electrical', name: 'Electrical'}, {id: 'mechanical', name: 'Mechanical & civil'}];
/* Each discipline's symbol on the home screen, in LaTeX. */
const GLYPHS = {circuits: '\\Omega', electronics: '\\beta', signals: '\\mathcal F', control: 'G(s)', digital: '\\mathtt{01}', fields: '\\nabla', power: '3\\phi', measurement: '\\sigma', statics: '\\Sigma F', dynamics: '\\omega', thermo: '\\Delta S'};
const CALENDAR_ICON = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
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
let today = localDate(), date = today, topic = 'circuits', level = 'level-1', view = 'home', hintCount = 0, solutionShown = false, exercise;
let progress = {}, attempts = {}, storageAvailable = true;
/* key → the answers last checked for that problem, so a finished problem can show them beside the solution. */
let submitted = {};
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
    } catch {
        storageAvailable = false;
    }
    updateStorageNote();
}
function updateStorageNote() {
    $('.local-note').textContent = storageAvailable ? 'Your progress stays in this browser.' : 'Browser storage unavailable; progress lasts for this visit.';
}
function streak() {
    const days = new Set(activeRecords().filter(([k, v]) => v.status === 'solved' && v.daily).map(([k]) => k.split(':')[0]));
    let n = 0, d = days.has(today) ? today : shifted(today, -1);
    while (days.has(d)) {
        n++;
        d = shifted(d, -1);
    }
    return n;
}
const glyph = tex => window.katex ? katex.renderToString(tex, {throwOnError: false}) : tex;
const longDate = (d, opts={weekday: 'short', day: 'numeric', month: 'short'}) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', opts);
const statusOf = (t, l, d=date) => progress[`${d}:${t}:${l}`]?.status;
const topicOf = id => TOPICS.find(t => t.id === id);
/* Position i of n on a circle (radius r, % of the ring), starting at the top and going clockwise. */
function ringPos(i, n, r) {
    const a = -Math.PI / 2 + 2 * Math.PI * i / n;
    return `--x: ${(50 + r * Math.cos(a)).toFixed(2)}%; --y: ${(50 + r * Math.sin(a)).toFixed(2)}%`;
}
const ringGuide = r => `<svg class="ring-guide" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}"/></svg>`;
function lastPlayed() {
    try {
        const [t, l] = (localStorage.getItem('daily-engineer-last') || '').split('/');
        return topicOf(t) && LEVELS.some(x => x.id === l) ? [t, l] : null;
    } catch { return null; }
}
/* Home: every discipline on one ring, today's progress as four dots under each. */
function renderHome() {
    const orbs = TOPICS.map((t, i) => {
        const done = LEVELS.filter(l => statusOf(t.id, l.id, today) === 'solved').length;
        const dots = `<span class="orb-dots" role="img" aria-label="${done} of ${LEVELS.length} levels solved today">${LEVELS.map(l => `<i class="${statusOf(t.id, l.id, today) || ''}"></i>`).join('')}</span>`;
        return `<a class="orb ${t.group}" href="#/${t.id}" data-topic="${t.id}" style="${ringPos(i, TOPICS.length, 41)}"><span class="orb-disc" aria-hidden="true">${glyph(GLYPHS[t.id])}</span><span class="orb-name">${t.name}</span><span class="orb-sub">${t.group === 'electrical' ? 'Electrical' : 'Mechanical'}</span>${dots}</a>`;
    }).join('');
    const last = lastPlayed(), n = streak();
    const resume = last ? `<a class="resume" href="#/${last[0]}/${last[1]}">Continue with ${topicOf(last[0]).name} · ${LEVELS.find(l => l.id === last[1]).tag} <span aria-hidden="true">→</span></a>` : '<p class="cue mono">Choose a discipline</p>';
    $('#home').innerHTML = `<div class="ring ring-home">${ringGuide(41)}<div class="ring-center"><p class="kicker">The Daily</p><h1 class="wordmark">Engineer</h1><p class="tagline">One engineering problem per discipline, every day.</p><p class="meta mono"><span>New set in <b class="countdown">--:--:--</b></span>${n ? `<span>Streak <b>${n}</b></span>` : ''}</p>${resume}</div>${orbs}</div>`;
}
/* A discipline: its four levels and the archive on a ring. */
function renderLevelRing() {
    const t = topicOf(topic);
    const orbs = LEVELS.map((l, i) => {
        const st = statusOf(t.id, l.id, today), sub = st === 'solved' ? '✓ Solved today' : st === 'reviewed' ? 'Reviewed today' : l.time;
        return `<a class="orb level l${i + 1} ${st || ''}" href="#/${t.id}/${l.id}" data-level="${l.id}" style="${ringPos(i, 5, 38)}"><span class="orb-disc" aria-hidden="true"><span class="numeral">${i + 1}</span></span><span class="orb-name"><span class="visually-hidden">${l.tag}: </span>${l.name}</span><span class="orb-sub">${sub}</span></a>`;
    }).join('') + `<a class="orb archive" href="#/${t.id}/archive" style="${ringPos(4, 5, 38)}"><span class="orb-disc" aria-hidden="true">${CALENDAR_ICON}</span><span class="orb-name">Archive</span><span class="orb-sub">Last 30 days</span></a>`;
    $('#levels').innerHTML = `<div class="ring ring-levels ${t.group}">${ringGuide(38)}<div class="ring-center"><p class="kicker">The Daily</p><h1 class="wordmark topic-mark">${t.name}</h1><p class="tagline">${t.sub}.</p><p class="meta mono"><span>New set in <b class="countdown">--:--:--</b></span></p><p class="cue mono">Choose a level</p></div>${orbs}</div>`;
}
/* The bar above a problem: discipline, a switch between the four levels, and the date. */
function renderBar() {
    const suffix = date === today ? '' : '/' + date;
    const pills = LEVELS.map((l, i) => {
        const st = statusOf(topic, l.id), current = l.id === level;
        return `<a class="pill l${i + 1} ${st || ''} ${current ? 'current' : ''}" href="#/${topic}/${l.id}${suffix}" ${current ? 'aria-current="page"' : ''} title="${l.tag} · ${l.name}${st ? ` (${st})` : ''}"><span class="visually-hidden">${l.tag}</span><span aria-hidden="true">${i + 1}</span></a>`;
    }).join('');
    $('#problem-bar').innerHTML = `<span class="pills">${pills}</span><span class="bar-date mono">${date === today ? `Today · <span class="countdown">--:--:--</span> left` : `Archive · ${longDate(date)}`}</span>`;
}
/* The last 30 days of one discipline, one row per day with its four levels. */
function renderArchive() {
    const t = topicOf(topic);
    const rows = Array.from({length: 31}, (_, k) => shifted(today, -k)).map(d => `<li class="${d === today ? 'today' : ''}"><span class="arch-date mono">${d === today ? 'Today' : longDate(d)}</span><span class="pills">${LEVELS.map((l, i) => {
        const st = statusOf(t.id, l.id, d);
        return `<a class="pill l${i + 1} ${st || ''}" href="#/${t.id}/${l.id}${d === today ? '' : '/' + d}" title="${l.tag} · ${l.name}${st ? ` (${st})` : ''}"><span class="visually-hidden">${longDate(d, {day: 'numeric', month: 'long'})}, ${l.tag}${st ? `, ${st}` : ''}</span><span aria-hidden="true">${i + 1}</span></a>`;
    }).join('')}</span></li>`).join('');
    $('#archive').innerHTML = `<header class="page-head"><p class="kicker">${t.name}</p><h1>Archive</h1><p class="muted">Today and the last 30 days. Filled circles are solved; coloured rings were reviewed.</p></header><ol class="arch-list">${rows}</ol>`;
}
const used = () => attempts[key()] || 0;
const locked = () => progress[key()]?.status !== 'solved' && used() >= MAX_ATTEMPTS;
/* Solved, or out of attempts: the full worked solution is then shown without asking. */
const finished = () => progress[key()]?.status === 'solved' || locked();
const solutionLabel = open => open ? 'Hide solution' : finished() || progress[key()]?.status === 'reviewed' ? 'Show solution' : 'Reveal solution';
function attemptsLabel() {
    const s = progress[key()]?.status;
    return s === 'solved' ? 'Solved' : `Attempts ${used()}/${MAX_ATTEMPTS}`;
}
function renderChallenge() {
    hintCount = 0;
    solutionShown = progress[key()]?.status === 'reviewed' || finished();
    exercise = makeExercise(topic, date, level);
    const t = TOPICS.find(t => t.id === topic), e = exercise, record = progress[key()], curated = e.curated;
    renderBar();
    const exactParts = e.parts.some(p => p.exact);
    $('#challenge').innerHTML = `<div class="challenge-body ${curated ? 'curated' : ''}"><div class="problem-meta"><span id="status-line">${record?.status === 'solved' ? '✓ COMPLETED' : record?.status === 'reviewed' ? 'SOLUTION REVIEWED' : e.parts.length > 1 ? `${e.parts.length} CONNECTED PARTS` : 'ONE KEY INSIGHT'}</span><span>${e.level} · ${e.minutes}</span></div><h1 class="problem-title">${e.title}</h1><div class="problem-text">${e.text}</div>${e.diagram ? `<div class="diagram-toolbar"><span>DIAGRAM</span><button type="button" id="enlarge-diagram" class="text-button" aria-haspopup="dialog">Enlarge</button></div><div class="diagram">${e.diagram}</div>` : ''}${e.givens?.length ? `<div class="givens">${e.givens.map(g => `<span class="given">${g}</span>`).join('')}</div>` : ''}<details class="prerequisites"><summary>What you’ll need</summary><p>${e.prerequisites}</p></details><form id="answer-form" novalidate><div class="answers">${e.parts.map((p, i) => `<div class="answer-part"><label class="answer-label" for="answer-${i}">${e.parts.length > 1 ? String.fromCharCode(65 + i) + '. ' : ''}${p.label}</label><div class="input-wrap">${fieldHTML(p, i)}${p.unit ? `<span>${p.unit}</span>` : ''}</div><div class="preview" id="preview-${i}" aria-hidden="true"></div><div id="part-feedback-${i}" class="part-feedback" role="status"></div></div>`).join('')}</div><p class="input-help" id="answer-help">${MATH_EDITOR ? 'Type maths naturally: <code>3/4</code> becomes a fraction, <code>sqrt</code> a root, <code>pi</code> π and <code>^</code> an exponent. Press <kbd>→</kbd> to leave a fraction, root or exponent, and <kbd>Enter</kbd> to check. ' : 'Type expressions such as <code>pi/4</code>, <code>ln(2)</code> or <code>sqrt(3)/2</code>. '}${exactParts ? 'Exact answers are best; decimals need 4 significant figures.' : 'Decimals and scientific notation (<code>2e-3</code>) work too. Tolerance: 1% unless stated; counts must be exact.'}</p>${typingGuideHTML()}<div class="submit-row"><button class="primary" type="submit" id="check">${e.parts.length > 1 ? 'Check all answers' : 'Check answer'}</button><span id="attempts">${attemptsLabel()}</span></div><div class="feedback ${record?.status === 'solved' ? 'success' : ''}" id="feedback" role="status">${record?.status === 'solved' ? 'You’ve solved this challenge. You can revisit your reasoning below.' : ''}</div></form></div><div class="challenge-actions"><button id="hint" class="text-button">☼ &nbsp; Get a hint <span id="hint-count">(0/${e.hints.length})</span></button><button id="solution" class="text-button" aria-expanded="${solutionShown}">${solutionLabel(solutionShown)}</button></div><div id="hints" class="hint-content" hidden></div><div id="solution-content" class="solution" ${solutionShown ? '' : 'hidden'}>${solutionHTML()}</div>${sourceHTML(e.source)}`;
    renderMath($('#challenge'));
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
        return `<div class="source-credit"><span>ORIGINAL DAILY ENGINEER EXERCISE</span><p>Further reading (open textbook): <a href="${s.reading.url}" target="_blank" rel="noopener">${s.reading.title}</a>.</p></div>`;
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
        `<h4>Worked solution</h4><ol class="steps">${e.steps.map(st => `<li>${st}</li>`).join('')}</ol>` +
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
        out.textContent = ok ? '✓ Correct' : !Number.isFinite(value) ? unreadableHint(i, p) : 'Not quite. Check the sign, units and relationships in this part.';
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
        renderBar();
        f.className = 'feedback success';
        f.textContent = status === 'solved' ? `All correct. Solved at ${exercise.level} in ${used()} attempt${used() === 1 ? '' : 's'}. The full worked solution is below.` : 'All correct. Saved as reviewed because the solution was revealed.';
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
}
function showHint() {
    if (hintCount >= exercise.hints.length)
        return;
    hintCount++;
    $('#hints').hidden = false;
    $('#hints').innerHTML = exercise.hints.slice(0, hintCount).map((h, i) => `<p><strong>Hint ${i + 1}.</strong> ${h}</p>`).join('');
    renderMath($('#hints'));
    $('#hint-count').textContent = `(${hintCount}/${exercise.hints.length})`;
    $('#hint').disabled = hintCount === exercise.hints.length;
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
    $('#solution').textContent = solutionLabel(true);
    $('#solution').setAttribute('aria-expanded', 'true');
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
    const entries = activeRecords(), solved = entries.filter(([k, v]) => v.status === 'solved').length, reviewed = entries.filter(([k, v]) => v.status === 'reviewed').length;
    const includesRetired = entries.some(([k]) => RETIRED_LEVELS.includes(k.split(':')[2]));
    const count = (t, l) => entries.filter(([k, v]) => k.split(':')[1] === t && k.split(':')[2] === l && v.status === 'solved').length;
    const rows = GROUPS.map(g => `<tr class="group-row"><th colspan="${LEVELS.length + 1}">${g.name}</th></tr>` + TOPICS.filter(t => t.group === g.id).map(t => `<tr><th><a href="#/${t.id}">${t.name}</a></th>${LEVELS.map(l => { const n = count(t.id, l.id); return `<td class="${n ? 'some' : ''}">${n || '·'}</td>`; }).join('')}</tr>`).join('')).join('');
    $('#progress-view').innerHTML = `<header class="page-head"><p class="kicker">Your learning</p><h1>Progress</h1></header><div class="stats"><div class="stat"><b>${solved}</b><span>Solved</span></div><div class="stat"><b>${streak()}</b><span>Streak</span></div><div class="stat"><b>${reviewed}</b><span>Reviewed</span></div></div><div class="progress-table-wrap"><table class="progress-table"><thead><tr><th>Solved by discipline</th>${LEVELS.map((l, i) => `<th><span class="pill l${i + 1} static" title="${l.name}">${i + 1}</span></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="progress-note">${includesRetired ? 'Totals and streaks include your earlier work on retired levels. ' : ''}Solve at least one of today’s problems to keep your streak. Archive practice adds to your totals. Progress is stored in this browser; clearing browser data removes it.</p>`;
}
/* Routes: #/ home · #/topic levels · #/topic/level-N today's problem · #/topic/level-N/YYYY-MM-DD archive · #/topic/archive · #/progress */
function parseRoute() {
    const [a, b, c] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (a === 'progress') return {view: 'progress'};
    if (!topicOf(a)) return {view: 'home'};
    if (!b) return {view: 'levels', topic: a};
    if (b === 'archive') return {view: 'archive', topic: a};
    if (!LEVELS.some(l => l.id === b)) return {view: 'levels', topic: a};
    const inArchive = /^\d{4}-\d{2}-\d{2}$/.test(c || '') && c >= shifted(today, -30) && c < today;
    return {view: 'problem', topic: a, level: b, date: inArchive ? c : today};
}
const SCREEN = {home: '#home', levels: '#levels', problem: '#problem', archive: '#archive', progress: '#progress-view'};
function route() {
    const r = parseRoute();
    view = r.view;
    if (r.topic) topic = r.topic;
    if (r.level) level = r.level;
    date = r.date || today;
    for (const [v, sel] of Object.entries(SCREEN)) $(sel).hidden = v !== view;
    document.body.dataset.view = view;
    const t = topicOf(topic), back = view === 'home' ? null : view === 'levels' || view === 'progress' ? ['#/', 'All disciplines'] : [`#/${topic}`, t.name];
    $('#back-link').hidden = !back;
    if (back) { $('#back-link').href = back[0]; $('#back-label').textContent = back[1]; }
    $('#progress-link').hidden = view === 'progress';
    if (view === 'home') renderHome();
    else if (view === 'levels') renderLevelRing();
    else if (view === 'archive') renderArchive();
    else if (view === 'progress') renderProgress();
    else {
        renderChallenge();
        remember('daily-engineer-last', `${topic}/${level}`);
    }
    const lvl = LEVELS.find(l => l.id === level);
    document.title = view === 'problem' ? `${t.name} · ${lvl.tag} · Daily Engineer` : view === 'levels' || view === 'archive' ? `${t.name} · Daily Engineer` : view === 'progress' ? 'Progress · Daily Engineer' : 'Daily Engineer';
    tick();
    window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
// Escape steps back up one screen (unless a dialog or the answer box is using it).
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]') || e.target.closest?.('math-field, input, textarea') || $('#back-link').hidden) return;
    location.hash = $('#back-link').getAttribute('href');
});
$('#about').onclick = () => $('#about-dialog').showModal();
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
setInterval(tick, 1000);
