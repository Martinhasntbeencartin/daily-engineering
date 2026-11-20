const $ = s => document.querySelector(s);
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shifted = (date, days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return localDate(d);
};
const GROUPS = [{id: 'electrical', name: 'Electrical'}, {id: 'mechanical', name: 'Mechanical & civil'}];
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
let today = localDate(), date = today, topic = 'circuits', level = PRACTICE_LEVELS[0].id, group = 'electrical', view = 'today', hintCount = 0, solutionShown = false, exercise;
let progress = {}, attempts = {}, storageAvailable = true;
try {
    const saved = JSON.parse(localStorage.getItem('daily-engineer-v1') || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const [k, v] of Object.entries(saved)) {
            if (!v || !['solved', 'reviewed'].includes(v.status))
                continue;
            // Preserve the original records; old keys belong to Foundations.
            progress[k.split(':').length === 2 ? k + ':foundations' : k] = v;
        }
    }
    const a = JSON.parse(localStorage.getItem('daily-engineer-attempts') || '{}');
    if (a && typeof a === 'object' && !Array.isArray(a)) attempts = a;
    const preference = localStorage.getItem('daily-engineer-level');
    if (PRACTICE_LEVELS.some(l => l.id === preference))
        level = preference;
    const g = localStorage.getItem('daily-engineer-group');
    if (GROUPS.some(x => x.id === g)) {
        group = g;
        topic = TOPICS.find(t => t.group === g).id;
    }
} catch {
    storageAvailable = false;
}
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const key = (t=topic, l=level) => `${date}:${t}:${l}`;
const activeRecords = () => Object.entries(progress).filter(([k]) => TOPICS.some(t => t.id === k.split(':')[1]) && LEVELS.some(l => l.id === k.split(':')[2]));
/* Typeset $…$ and $$…$$ with KaTeX (no-op if KaTeX failed to load). */
function renderMath(el) {
    if (el && window.renderMathInElement)
        renderMathInElement(el, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg']});
}
function save() {
    try {
        localStorage.setItem('daily-engineer-v1', JSON.stringify(progress));
        localStorage.setItem('daily-engineer-attempts', JSON.stringify(attempts));
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
function renderLevels() {
    const buttons = PRACTICE_LEVELS.map(l => {
        const status = progress[key(topic, l.id)]?.status;
        const completion = status === 'solved' ? '✓ Solved' : status === 'reviewed' ? 'Solution reviewed' : '';
        return `<button class="level-option ${level === l.id ? 'selected' : ''}" data-level="${l.id}" aria-pressed="${level === l.id}">
            <span class="level-top"><span>${l.tag}</span><span>${l.time}</span></span>
            <strong>${l.name}</strong><span class="level-description">${l.description}</span>
            ${completion ? `<span class="level-completion">${completion}</span>` : ''}
        </button>`;
    });
    $('#level-picker').innerHTML = `<h2 class="picker-heading">Difficulty</h2><div class="level-options">${buttons.join('')}</div>`;
    document.querySelectorAll('[data-level]').forEach(b => b.onclick = () => {
        level = b.dataset.level;
        remember('daily-engineer-level', level);
        renderChallenge();
    });
}
function renderTopics() {
    $('#groups').innerHTML = GROUPS.map(g => `<button role="tab" class="group-tab ${group === g.id ? 'selected' : ''}" data-group="${g.id}" aria-selected="${group === g.id}">${g.name}</button>`).join('');
    $('#topics').innerHTML = TOPICS.filter(t => t.group === group).map(t => `<button class="topic ${topic === t.id ? 'selected' : ''}" data-topic="${t.id}" aria-pressed="${topic === t.id}"><span class="topic-icon" aria-hidden="true">${t.icon}</span><span><strong>${t.name}</strong><small>${t.sub}</small></span><span class="topic-done" aria-label="${progress[key(t.id)]?.status === 'solved' ? 'Solved' : ''}">${progress[key(t.id)]?.status === 'solved' ? '✓' : ''}</span></button>`).join('');
    updateStorageNote();
    document.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => {
        topic = b.dataset.topic;
        renderChallenge();
    });
    document.querySelectorAll('[data-group]').forEach(b => b.onclick = () => {
        if (group === b.dataset.group) return;
        group = b.dataset.group;
        remember('daily-engineer-group', group);
        topic = TOPICS.find(t => t.group === group).id;
        renderChallenge();
    });
}
const used = () => attempts[key()] || 0;
const locked = () => progress[key()]?.status !== 'solved' && used() >= MAX_ATTEMPTS;
function attemptsLabel() {
    const s = progress[key()]?.status;
    return s === 'solved' ? 'Solved' : `Attempts ${used()}/${MAX_ATTEMPTS}`;
}
function renderChallenge() {
    hintCount = 0;
    solutionShown = progress[key()]?.status === 'reviewed';
    exercise = makeExercise(topic, date, level);
    const t = TOPICS.find(t => t.id === topic), e = exercise, record = progress[key()], curated = CURATED_LEVELS.includes(level);
    group = t.group;
    renderTopics();
    renderLevels();
    const exactParts = e.parts.some(p => p.exact);
    $('#challenge').innerHTML = `<div class="challenge-top"><div class="challenge-tags"><span class="tag">${t.name}</span><span class="tag level">${e.level}</span></div><span class="challenge-date">${date === today ? 'TODAY’S CHALLENGE' : 'FROM THE ARCHIVE'}</span></div><div class="challenge-body ${curated ? 'curated' : ''}"><div class="problem-meta"><span id="status-line">${record?.status === 'solved' ? '✓ COMPLETED' : record?.status === 'reviewed' ? 'SOLUTION REVIEWED' : e.parts.length > 1 ? `${e.parts.length} CONNECTED PARTS` : 'ONE KEY INSIGHT'}</span><span>${e.minutes}</span></div><h3>${e.title}</h3><div class="problem-text">${e.text}</div>${e.diagram ? `<div class="diagram-toolbar"><span>DIAGRAM</span><button type="button" id="enlarge-diagram" class="text-button" aria-haspopup="dialog">Enlarge</button></div><div class="diagram">${e.diagram}</div>` : ''}${e.givens?.length ? `<div class="givens">${e.givens.map(g => `<span class="given">${g}</span>`).join('')}</div>` : ''}<details class="prerequisites"><summary>What you’ll need</summary><p>${e.prerequisites}</p></details><form id="answer-form" novalidate><div class="answers">${e.parts.map((p, i) => `<div class="answer-part"><label class="answer-label" for="answer-${i}">${e.parts.length > 1 ? String.fromCharCode(65 + i) + '. ' : ''}${p.label}</label><div class="input-wrap">${fieldHTML(p, i)}${p.unit ? `<span>${p.unit}</span>` : ''}</div><div class="preview" id="preview-${i}" aria-hidden="true"></div><div id="part-feedback-${i}" class="part-feedback" role="status"></div></div>`).join('')}</div><p class="input-help" id="answer-help">${MATH_EDITOR ? 'Type maths naturally: <code>3/4</code> becomes a fraction, <code>sqrt</code> a root, <code>pi</code> π and <code>^</code> an exponent. Press <kbd>→</kbd> to leave a fraction, root or exponent, and <kbd>Enter</kbd> to check. ' : 'Type expressions such as <code>pi/4</code>, <code>ln(2)</code> or <code>sqrt(3)/2</code>. '}${exactParts ? 'Exact answers are best; decimals need 4 significant figures.' : 'Decimals and scientific notation (<code>2e-3</code>) work too. Tolerance: 1% unless stated; counts must be exact.'}</p>${typingGuideHTML()}<div class="submit-row"><button class="primary" type="submit" id="check">${e.parts.length > 1 ? 'Check all answers' : 'Check answer'}</button><span id="attempts">${attemptsLabel()}</span></div><div class="feedback ${record?.status === 'solved' ? 'success' : ''}" id="feedback" role="status">${record?.status === 'solved' ? 'You’ve solved this challenge. You can revisit your reasoning below.' : ''}</div></form></div><div class="challenge-actions"><button id="hint" class="text-button">☼ &nbsp; Get a hint <span id="hint-count">(0/${e.hints.length})</span></button><button id="solution" class="text-button" aria-expanded="${solutionShown}">${solutionShown ? 'Hide solution' : 'Reveal solution'}</button></div><div id="hints" class="hint-content" hidden></div><div id="solution-content" class="solution" ${solutionShown ? '' : 'hidden'}>${solutionHTML()}</div>${sourceHTML(e.source)}`;
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
        el.addEventListener('input', () => { if (isMath(el)) fixUnicode(el); preview(i); });
        if (isMath(el)) {
            el.smartSuperscript = false; // 2^10 stays one exponent; operators step out instead.
            // log is base 10 (not a log with an empty base slot); atan/asin/acos are inverse trig functions.
            el.inlineShortcuts = {...el.inlineShortcuts, ...EDITOR_SHORTCUTS};
        }
        if (isMath(el)) el.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') { ev.preventDefault(); $('#answer-form').requestSubmit(); }
            else if (ev.key === ')') { smartClose(el); setTimeout(() => closeWrappedGroup(el)); }
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
        $('#feedback').textContent = 'Out of attempts for this problem. Reveal the solution to see the reasoning, or come back tomorrow.';
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
function answerLine(p) {
    const val = p.exact ? p.exact : tf(p.answer);
    return `<li>${p.label}: $${val}$${p.unit ? ' ' + p.unit : ''}${p.exact && !/^-?\d+$/.test(p.exact) ? ` <span class="approx">(≈ ${tf(p.answer)})</span>` : ''}</li>`;
}
function solutionHTML() {
    return `<strong>The reasoning</strong><ol>${exercise.steps.map(s => `<li>${s}</li>`).join('')}</ol><strong>Answer</strong><ul class="answer-list">${exercise.parts.map(answerLine).join('')}</ul><strong>Take this with you</strong><p>${exercise.idea}</p>`;
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
    if (correct === exercise.parts.length) {
        const status = previous.status === 'solved' ? 'solved' : solutionShown || previous.status === 'reviewed' ? 'reviewed' : 'solved';
        progress[key()] = {status, daily: previous.daily || date === today, hints: Math.max(hintCount, previous.hints || 0), attempts: used() + 1};
        if (previous.status !== 'solved') attempts[key()] = used() + 1;
        save();
        renderTopics();
        renderLevels();
        f.className = 'feedback success';
        f.textContent = status === 'solved' ? `All correct. Solved at ${exercise.level} level in ${used()} attempt${used() === 1 ? '' : 's'}.` : 'All correct. Saved as reviewed because the solution was revealed.';
        $('#status-line').textContent = status === 'solved' ? '✓ COMPLETED' : 'SOLUTION REVIEWED';
    } else {
        if (previous.status !== 'solved' && !unreadable) {
            attempts[key()] = used() + 1;
            save();
        }
        f.className = 'feedback error';
        const left = MAX_ATTEMPTS - used();
        f.textContent = previous.status === 'solved' ? `${correct} of ${exercise.parts.length} correct.` : unreadable ? 'Some answers could not be read, so no attempt was used.' : `${correct} of ${exercise.parts.length} correct. ${left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left.` : ''}`;
        applyLock();
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
function showSolution() {
    const panel = $('#solution-content');
    panel.hidden = !panel.hidden;
    $('#solution').textContent = panel.hidden ? 'Reveal solution' : 'Hide solution';
    $('#solution').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
        solutionShown = true;
        if (progress[key()]?.status !== 'solved') {
            progress[key()] = {status: 'reviewed', daily: date === today, hints: hintCount};
            save();
            renderLevels();
            $('#status-line').textContent = 'SOLUTION REVIEWED';
        }
    }
}
function renderProgress() {
    const entries = activeRecords(), solved = entries.filter(([k, v]) => v.status === 'solved').length, reviewed = entries.filter(([k, v]) => v.status === 'reviewed').length;
    const includesRetired = entries.some(([k]) => LEVELS.some(l => l.retired && l.id === k.split(':')[2]));
    $('#progress-view').innerHTML = `<div class="stats"><div class="stat"><b>${solved}</b><span>Challenges solved</span></div><div class="stat"><b>${streak()}</b><span>Day streak</span></div><div class="stat"><b>${reviewed}</b><span>Solutions reviewed</span></div></div><div class="progress-topics"><h2>Solved by topic and difficulty</h2><div class="progress-table-wrap"><table class="progress-table"><thead><tr><th>Discipline</th>${PRACTICE_LEVELS.map(l => `<th>${l.name}</th>`).join('')}</tr></thead><tbody>${GROUPS.map(g => `<tr class="group-row"><th colspan="${PRACTICE_LEVELS.length + 1}">${g.name}</th></tr>` + TOPICS.filter(t => t.group === g.id).map(t => `<tr><th>${t.name}</th>${PRACTICE_LEVELS.map(l => `<td>${entries.filter(([k, v]) => k.split(':')[1] === t.id && k.split(':')[2] === l.id && v.status === 'solved').length} solved</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div></div><p class="progress-note">${includesRetired ? 'Totals and streaks include your earlier work on retired levels. ' : ''}Solve at least one of today’s challenges at any level to build your streak. Archive practice adds to your totals. Progress is stored in this browser; clearing browser data removes it.</p>`;
}
function setView(v) {
    view = v;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('#archive-bar').hidden = v !== 'archive';
    $('#practice').hidden = v === 'progress';
    $('#level-picker').hidden = v === 'progress';
    $('#progress-view').hidden = v !== 'progress';
    $('#view-title').textContent = v === 'progress' ? 'Your progress' : v === 'archive' ? 'Exercise archive' : 'Daily exercises';
    $('#date-label').hidden = v === 'progress';
    if (v === 'today')
        date = today;
    if (v === 'archive') {
        date = shifted(today, -1);
        $('#archive-date').value = date;
    }
    if (v === 'progress')
        renderProgress();
    else
        renderChallenge();
    renderDate();
}
function renderDate() {
    $('#date-label').dateTime = date;
    $('#date-label').textContent = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'});
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
$('#back-today').onclick = () => setView('today');
$('#archive-date').min = shifted(today, -30);
$('#archive-date').max = shifted(today, -1);
$('#archive-date').onchange = e => {
    if (e.target.value >= shifted(today, -30) && e.target.value < today) {
        date = e.target.value;
        renderChallenge();
        renderDate();
    } else
        e.target.value = date;
};
$('#about').onclick = () => $('#about-dialog').showModal();
$('#close-dialog').onclick = () => $('#about-dialog').close();
$('#about-dialog').onclick = e => {
    if (e.target === $('#about-dialog')) {
        const r = e.target.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
            e.target.close();
    }
};
document.querySelectorAll('.brand').forEach(a => a.onclick = e => {
    e.preventDefault();
    setView('today');
    window.scrollTo({top: 0, behavior: 'smooth'});
});
function tick() {
    const now = new Date(), next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const s = Math.floor((next - now) / 1000);
    $('#countdown').textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
    const current = localDate();
    if (current !== today) {
        today = current;
        $('#archive-date').min = shifted(today, -30);
        $('#archive-date').max = shifted(today, -1);
        if (view === 'today')
            setView('today');
        else if (view === 'progress')
            renderProgress();
    }
}
$('#close-diagram').onclick = () => $('#diagram-dialog').close();
setView('today');
tick();
setInterval(tick, 1000);
