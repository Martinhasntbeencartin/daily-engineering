/* Checks every topic × level over many dates: generators must not throw, answers must be finite,
   every LaTeX fragment must compile with KaTeX, curated answers must match their independent
   numerical verification, and selected generated answers are cross-checked.
   Run with: node tests/exercises.test.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const katex = require(path.join(root, 'vendor/katex/katex.min.js'));
const files = ['diagrams', 'figures', 'network-figures', 'source-figures', 'mathtext', 'core', 'hard', 'numerics', 'expert', 'bank-figures', 'bank', 'motors-sensors', 'comms', 'types-circuits', 'types-electronics', 'types-digital', 'types-measurement'];
const ctx = vm.createContext({console, Math, Number, Date, Object, Array, String, JSON, Error});
for (const f of files)
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, {filename: f + '.js'});
const run = code => vm.runInContext(code, ctx);
const TOPICS = run('TOPICS'), LEVELS = run('LEVELS'), TIERS = run('TIERS'), BANK = run('BANK'), makeExercise = run('makeExercise'), makeTierExercise = run('makeTierExercise'), MathInput = run('MathInput');
let failures = 0, checks = 0;
const fail = msg => { failures++; console.error('FAIL', msg); };
const close = (a, b, tol, msg) => { checks++; if (!(Math.abs(a - b) <= Math.max(Math.abs(b) * tol, 1e-9))) fail(`${msg}: got ${a}, expected ${b}`); };

/* ---- LaTeX: split text exactly as auto-render would ($$…$$ display, $…$ inline) and compile each piece ---- */
const texCache = new Set();
function checkTex(str, where) {
    if (typeof str !== 'string') return;
    const segs = [];
    let rest = str;
    for (;;) {
        const i = rest.indexOf('$');
        if (i < 0) break;
        const display = rest[i + 1] === '$', open = display ? 2 : 1, j = rest.indexOf(display ? '$$' : '$', i + open);
        if (j < 0) { fail(`${where}: unbalanced $ in “${str.slice(0, 80)}…”`); return; }
        segs.push(rest.slice(i + open, j));
        rest = rest.slice(j + open);
    }
    for (const s of segs) {
        if (texCache.has(s)) continue;
        checks++;
        try { katex.renderToString(s, {throwOnError: true, strict: 'error'}); texCache.add(s); }
        catch (e) { fail(`${where}: KaTeX error “${e.message.split('\n')[0]}” in $${s}$`); }
    }
}
const texFields = (e, where) => {
    for (const k of ['title', 'text', 'idea', 'prerequisites']) checkTex(e[k], `${where}.${k}`);
    for (const k of ['givens', 'hints', 'steps']) (e[k] || []).forEach((s, i) => checkTex(s, `${where}.${k}[${i}]`));
    e.parts.forEach((p, i) => { checkTex(p.label, `${where}.parts[${i}].label`); if (p.exact) checkTex('$' + p.exact + '$', `${where}.parts[${i}].exact`); });
};

/* ---- every selection over 120 days ---- */
const start = Date.UTC(2026, 0, 1), seen = {};
for (let d = 0; d < 120; d++) {
    const date = new Date(start + d * 86400000).toISOString().slice(0, 10);
    // Public levels (what people pick) and every internal tier (so rotating levels can't hide a tier).
    const selections = [...LEVELS.map(l => [l.id, t => makeExercise(t, date, l.id), l]), ...TIERS.map(tier => ['tier:' + tier, t => makeTierExercise(t, date, tier), null])];
    for (const t of TOPICS) for (const [id, make, l] of selections) {
        let e;
        try { e = make(t.id); } catch (err) { fail(`${t.id}/${id}/${date} threw ${err.stack}`); continue; }
        checks++;
        const where = `${t.id}/${id}/${date}`;
        for (const k of ['title', 'text', 'idea', 'prerequisites', 'diagram', ...(l ? ['level', 'minutes'] : [])])
            if (!e[k]) fail(`${where} missing ${k}`);
        if (!/<svg\b[^>]*aria-label="[^"]+"/.test(e.diagram) ||
            (!/<(?:path|circle|line|polyline|polygon)\b/.test(e.diagram) && (e.diagram.match(/<rect\b/g) || []).length < 2))
            fail(`${where} missing labelled diagram geometry: ${e.title}`);
        if (!e.parts?.length || !e.hints?.length || !e.steps?.length) fail(`${where} missing parts/hints/steps`);
        if (l && e.level !== `${l.tag} · ${l.name}`) fail(`${where} level label ${e.level} ≠ ${l.tag} · ${l.name}`);
        for (const p of e.parts) {
            if (!Number.isFinite(p.answer)) fail(`${where} non-finite answer for "${p.label}": ${p.answer}`);
            if (p.tolerance === 0 && !Number.isInteger(p.answer)) fail(`${where} exact answer not integer for "${p.label}"`);
        }
        if (/NaN|undefined|Infinity/.test(e.text + e.steps.join('') + (e.givens || []).join('') + e.diagram)) fail(`${where} NaN/undefined in text: ${e.title}`);
        texFields(e, where);
        // Generated problems that carry verify() recompute their answers by an independent method.
        if (typeof e.verify === 'function' && id.startsWith('tier:')) {
            let got;
            try { got = e.verify(); } catch (err) { fail(`${where} verify threw ${err.message}`); got = []; }
            e.parts.forEach((p, j) => { checks++; const tol = p.tolerance === 0 ? 0 : Math.max(Math.abs(p.answer) * 2e-3, p.abs || 1e-9); if (!(Math.abs(got[j] - p.answer) <= tol)) fail(`${where} “${e.title}” part ${j} (${p.label}): verify ${got[j]} vs ${p.answer}`); });
        }
        (seen[t.id + '/' + id] ||= new Set()).add(e.title + JSON.stringify(e.parts.map(p => p.answer)));
    }
}
for (const [k, s] of Object.entries(seen))
    if (s.size < 2) fail(`${k} never varies across 120 days`);

/* ---- fresh every day: at Levels 2–4 a discipline never shows the same problem twice within 365 consecutive days ----
   (the generators draw their values from a daily permutation, js/numerics.js dayGrid, so any 365-day window works) */
{
    const from = Date.UTC(2026, 10, 24);
    for (const t of TOPICS) for (const level of ['level-2', 'level-3', 'level-4']) {
        const firstSeen = new Map();
        for (let d = 0; d < 365; d++) {
            const date = new Date(from + d * 86400000).toISOString().slice(0, 10), e = makeExercise(t.id, date, level), key = [e.title, e.text, ...(e.givens || [])].join('|');
            checks++;
            if (firstSeen.has(key)) { fail(`${t.id}/${level}: the problem of ${date} already appeared on ${firstSeen.get(key)}`); break; }
            firstSeen.set(key, date);
        }
    }
}

/* ---- levels: 1–4, each tier served by exactly one level, Level 4 really mixes Expert and Mastery ---- */
checks++;
if (LEVELS.map(l => l.tag).join() !== 'Level 1,Level 2,Level 3,Level 4') fail(`levels are ${LEVELS.map(l => l.tag).join()}`);
for (const tier of TIERS) {
    checks++;
    const owners = LEVELS.filter(l => l.tiers.includes(tier));
    if (owners.length !== 1) fail(`tier ${tier} is served by ${owners.length} levels`);
}
{
    const byTitle = tier => new Set(TOPICS.flatMap(t => Array.from({length: 30}, (_, d) => makeTierExercise(t.id, new Date(start + d * 86400000).toISOString().slice(0, 10), tier).title)));
    const expert = byTitle('expert'), mastery = byTitle('mastery'), hit = {expert: 0, mastery: 0};
    for (let d = 0; d < 30; d++) {
        const date = new Date(start + d * 86400000).toISOString().slice(0, 10);
        for (const t of TOPICS) { const title = makeExercise(t.id, date, 'level-4').title; if (expert.has(title)) hit.expert++; if (mastery.has(title)) hit.mastery++; }
    }
    checks++;
    if (hit.expert < 100 || hit.mastery < 100) fail(`Level 4 tier mix over 30 days × ${TOPICS.length} topics: ${JSON.stringify(hit)}`);
}

/* ---- curated bank: size, exact forms evaluate to the answer, independent verification ---- */
for (const t of TOPICS) for (const l of [run('CURATED_TIER')]) {
    const list = BANK[t.id + ':' + l] || [];
    if (list.length < 4) fail(`bank ${t.id}:${l} has only ${list.length} problems`);
    list.forEach((e, i) => {
        const where = `bank ${t.id}:${l}#${i} “${e.title}”`;
        texFields({...e, prerequisites: e.prereq}, where);
        e.parts.forEach((p, j) => {
            const plain = p.exact.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\\sqrt(\d)/g, 'sqrt($1)').replace(/\\pi/g, 'pi').replace(/\\ln/g, 'ln').replace(/\\varphi/g, '((1+sqrt5)/2)').replace(/\\arctan/g, 'atan').replace(/\\arccos/g, 'acos').replace(/\\log_\{10\}/g, 'log').replace(/\\left|\\right|\\!|\\,/g, '').replace(/[{}]/g, m => m === '{' ? '(' : ')');
            let v = NaN;
            try { v = MathInput.read(plain).value; } catch {}
            if (Number.isFinite(v)) close(v, p.answer, 1e-9, `${where} exact form ${p.exact}`);
            else if (!/\\/.test(p.exact)) fail(`${where} exact form unreadable: ${p.exact}`);
        });
        if (e.verify) {
            const got = e.verify();
            got.forEach((g, j) => close(g, e.parts[j].answer, 2e-3, `${where} verify part ${j}`));
        }
    });
}

/* ---- the answer parser ---- */
for (const [src, want] of [['pi/4', Math.PI / 4], ['ln2', Math.LN2], ['(sqrt(5)-1)/2', (Math.sqrt(5) - 1) / 2], ['2^(2/5)', 2 ** .4], ['e^-pi', Math.exp(-Math.PI)], ['25ln10', 25 * Math.log(10)], ['2e-3', .002], ['3sqrt2', 3 * Math.SQRT2], ['√3/2', Math.sqrt(3) / 2], ['−1/6', -1 / 6], ['1/(2pi)', 1 / (2 * Math.PI)], ['5-2sqrt6', 5 - 2 * Math.sqrt(6)], ['-2^2', -4], ['0,5', .5], ['2·π', 2 * Math.PI], ['atan(1)*4', Math.PI], ['ln2/2', Math.LN2 / 2], ['log100', 2], ['log10(1000)', 3], ['log100/2', 1], ['sqrt2/2', Math.SQRT1_2], ['sqrt(2)/2', Math.SQRT1_2], ['3sqrt2/2', 3 * Math.SQRT1_2], ['√2/2', Math.SQRT1_2]])
    close(MathInput.read(src).value, want, 1e-12, `parser "${src}"`);
/* LaTeX exactly as the MathLive editor emits it (captured from real keystrokes) → value */
for (const [latex, want] of [[T('\\frac34'), .75], [T('\\frac{\\pi}{4}'), Math.PI / 4], [T('\\frac{1}{\\sqrt2}'), Math.SQRT1_2], [T('e^{-\\pi}'), Math.exp(-Math.PI)], [T('\\frac{(1+\\sqrt5)}{2}'), (1 + Math.sqrt(5)) / 2], [T('\\sqrt{(2)}'), Math.SQRT2], [T('25\\ln10'), 25 * Math.log(10)], [T('-\\frac16'), -1 / 6], [T('2\\cdot\\pi'), 2 * Math.PI], [T('2^{(\\frac25)}'), 2 ** .4], [T('100e^{-\\pi}'), 100 * Math.exp(-Math.PI)], [T('a\\tan\\left(1\\right)'), Math.PI / 4], [T('\\arctan\\left(1\\right)'), Math.PI / 4], [T('\\frac{1}{(2\\pi)}'), 1 / (2 * Math.PI)], [T('5-2\\sqrt6'), 5 - 2 * Math.sqrt(6)], [T('\\frac{8\\sqrt2}{\\pi^2}'), 8 * Math.SQRT2 / Math.PI ** 2], [T('2^{10}-1'), 1023], [T('\\ln(\\frac{49}{48})'), Math.log(49 / 48)], [T('(\\frac56)^{(\\frac72)}'), (5 / 6) ** 3.5], [T('1{,}5'), 1.5], [T('\\sqrt[3]{8}'), 2], [T('\\left|-3\\right|'), 3], [T('2e-3'), .002], [T('3\\times4'), 12], [T('\\frac{\\ln2}{2}'), Math.LN2 / 2], [T('\\frac{\\log100}{2}'), 1], [T('\\frac{\\arctan(1)}{\\pi}'), .25], [T('\\frac{\\sqrt{(2)}}{2}'), Math.SQRT1_2], [T('\\frac{3\\sqrt2}{2}'), 3 * Math.SQRT1_2], [T('\\frac{\\surd2}{2}'), Math.SQRT1_2], [T('3\\surd(2)'), 3 * Math.SQRT2]])
    close(MathInput.readLatex(latex).value, want, 1e-12, `editor LaTeX "${latex}"`);
for (const bad of [T('\\frac{4}{\\placeholder{}}'), T('\\sqrt{'), T('\\alpha')])
    try { MathInput.readLatex(bad); fail(`editor LaTeX accepted "${bad}"`); } catch { checks++; }
function T(s) { return s; }
for (const bad of ['', 'pi/', '2**', 'foo', '(1+2'])
    try { MathInput.read(bad); fail(`parser accepted "${bad}"`); } catch { checks++; }

/* ---- every common way of writing maths, in plain text ---- */
const PHIV = (1 + Math.sqrt(5)) / 2;
for (const [src, want] of [['.5', .5], ['1.5e-3', .0015], ['1.5E3', 1500], ['1.2E+2', 120], ['1.5×10^-3', .0015], ['1.5x10^3', 1500], ['1.5X10^3', 1500], ['1.5·10³', 1500], ['1.5*10⁻³', .0015], ['10⁻³', .001], ['2⁻¹', .5],
    ['1 1/2', 1.5], ['2+1 1/2', 3.5], ['1½', 1.5], ['½', .5], ['¾+¼', 1], ['1⁄4', .25], ['6÷3', 2], ['2∙3', 6], ['2•3', 6], ['–1/6', -1 / 6], ['3 4', 12],
    ['2**3', 8], ['2^3!', 64], ['3!^2', 36], ['5!', 120], ['0.5!', Math.sqrt(Math.PI) / 2], ['50%', .5], ['10%·50', 5], ['5‰', .005],
    ['|-3|', 3], ['2|-3|', 6], ['abs(-3)', 3], ['[1+2]*{3}', 9],
    ['∛8', 2], ['∜16', 2], ['cbrt(27)', 3], ['nthroot(32,5)', 2], ['root(32, 5)', 2], ['nthroot(-8,3)', -2], ['8^(1/3)', 2],
    ['tau', 2 * Math.PI], ['τ/2', Math.PI], ['phi', PHIV], ['φ^2-φ', 1], ['e^2', Math.E ** 2], ['ln e', 1], ['2e', 2 * Math.E], ['2e3', 2000],
    ['lg1000', 3], ['log10(10)', 1], ['log2(8)', 3], ['lb 16', 4], ['log_2(8)', 3], ['log_2 8', 3], ['log₂(8)', 3], ['log_3(81)', 4],
    ['sin(30°)', .5], ['sin 30 deg', .5], ['cos(60degrees)', .5], ['tan(45°)', 1], ['60°', 60], ['pi rad', Math.PI], ['pi/2 radians', Math.PI / 2],
    ['sec(0)', 1], ['csc(pi/2)', 1], ['cosec(pi/2)', 1], ['cot(pi/4)', 1], ['cotan(pi/4)', 1],
    ['asin(1)', Math.PI / 2], ['sin^-1(1)', Math.PI / 2], ['sin⁻¹(1)', Math.PI / 2], ['tan^(-1)(1)', Math.PI / 4], ['arctg(1)', Math.PI / 4], ['arccot(1)', Math.PI / 4], ['acot(1)', Math.PI / 4],
    ['sin^2(pi/4)+cos^2(pi/4)', 1], ['sin²(30°)', .25], ['cosh0', 1], ['sech(0)', 1], ['arsinh(0)', 0], ['asinh(0)', 0], ['arcosh(1)', 0], ['acosh(1)', 0], ['artanh(0)', 0],
    ['(1+√5)/2', PHIV], ['√(3)/2', Math.sqrt(3) / 2], ['(2)(3)', 6]])
    close(MathInput.read(src).value, want, 1e-9, `notation "${src}"`);
/* ---- the same notations as the editor emits them in LaTeX ---- */
for (const [latex, want] of [['\\sqrt[3]{8}', 2], ['∛8', 2], ['∜16', 2], ['2^{2}', 4], ['½', .5], ['¾', .75], ['1\\frac12', 1.5], ['2\\frac{3}{4}', 2.75], ['2\\frac{\\pi}{4}', Math.PI / 2], ['2\\cdot\\frac12', 1], ['\\frac{21}{2}', 10.5],
    ['2x3', 6], ['30\\degree', 30], ['\\sin(30\\degree)', .5], ['30^{\\circ}', 30], ['50\\%', .5], ['5!', 120], ['|-3|', 3], ['[1+2]', 3], ['\\lbrack1+2\\rbrack', 3], ['\\{1+2\\}', 3],
    ['\\log_{2}(8)', 3], ['\\log_2(8)', 3], ['\\log2(8)', 3], ['\\lg100', 2], ['\\sin^{-1}(1)', Math.PI / 2], ['a\\sinh(0)', 0], ['\\operatorname{\\mathrm{arcosh}}(1)', 0], ['a\\cosh(1)', 0], ['arc\\cot(1)', Math.PI / 4],
    ['\\sec(0)', 1], ['\\csc(\\frac{\\pi}{2})', 1], ['\\cot(\\frac{\\pi}{4})', 1], ['\\varphi', PHIV], ['\\phi', PHIV], ['φ', PHIV], ['\\tau', 2 * Math.PI], ['τ', 2 * Math.PI],
    ['1E-3', .001], ['1.5\\times10^{-3}', .0015], ['1.5\\cdot10^3', 1500], ['1.5x10^3', 1500], ['10^{-}^{3}', .001], ['2^{-}^{1}', .5], ['2\\div4', .5], ['1\\,\\frac12', 1.5], ['0,5', .5], ['1‰', .001], ['\\exp(1)', Math.E], ['\\ln e', 1]])
    close(MathInput.readLatex(latex).value, want, 1e-9, `editor LaTeX "${latex}"`);
/* ---- units typed after the answer ---- */
for (const [text, unit, want] of [['2.5 mA', 'mA', '2.5'], ['2.5mA', 'mA', '2.5'], ['60 degrees', '°', '60'], ['37.5%', '%', '37.5'], ['37.5 percent', '%', '37.5'], ['4.7 kohm', 'kΩ', '4.7'], ['4.7kΩ', 'kΩ', '4.7'], ['12 ohms', 'Ω', '12'],
    ['3 µs', 'µs', '3'], ['3 us', 'µs', '3'], ['3 μs', 'µs', '3'], ['9 kN·m', 'kN·m', '9'], ['9 kN m', 'kN·m', '9'], ['5 V/V', 'V/V', '5'], ['2 1/s', '1/s', '2'], ['pi/2 rad/s', 'rad/s', 'pi/2'], ['5', 'V', '5'], ['mA', 'mA', 'mA'], ['4.7 kohm', 'Ω', '4.7 kohm']]) {
    checks++;
    const got = MathInput.stripUnit(text, unit);
    if (got !== want) fail(`stripUnit("${text}", "${unit}") = "${got}", expected "${want}"`);
}

/* ---- cross-checks on generated Levels 4–7 ---- */
const dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
// Dates on which a tier shows its original problem type (the extra types of js/types-*.js rotate with it).
const originalDates = (topic, tier, n = 6) => {
    const out = [];
    for (let d = 0; out.length < n && d < 400; d++) {
        const date = new Date(Date.UTC(2026, 2, 1) + d * 86400000).toISOString().slice(0, 10), id = makeTierExercise(topic, date, tier).id;
        if (id === `${topic}-${tier}-0` || id === `${topic}-${tier}`) out.push(date);
    }
    return out;
};
const c = run('({cx, ca, cs, cm, cd, cabs, cp})');
for (const date of originalDates('circuits', 'expert')) { // Expert circuits: KCL residual at node b.
    const e = makeTierExercise('circuits', date, 'expert'), va = c.cx(e.parts[0].answer, e.parts[1].answer), vb = c.cx(e.parts[2].answer, e.parts[3].answer);
    const ve = c.cd(c.ca(c.cm(c.cx(1 / 200), va), c.cm(c.cx(0, -1 / 300), vb)), c.ca(c.cx(1 / 200), c.cx(0, -1 / 300)));
    const [E1, E2, I] = e.givens.slice(0, 3).map(g => { const m = g.match(/= ([\d.]+)\\angle (-?[\d.]+)\^\\circ/); return c.cp(+m[1], +m[2]); });
    const res = [c.cd(c.cs(vb, va), c.cx(0, -400)), c.cd(c.cs(vb, ve), c.cx(0, 300)), c.cd(vb, c.cx(0, 500)), c.cd(c.cs(vb, E2), c.cx(1000)), c.cm(c.cx(-1), I)].reduce((s, x) => c.ca(s, x), c.cx(0));
    checks++;
    if (c.cabs(res) > 1e-6 * Math.max(1, c.cabs(I))) fail(`circuits/expert KCL residual ${c.cabs(res)} on ${date}`);
}
for (const date of originalDates('control', 'expert')) { // Expert control: Riccati residual.
    const e = makeTierExercise('control', date, 'expert'), a = +e.text.match(/= -(\d+)x_2/)[1], q = e.givens[2].match(/diag\}\((\d+), (\d+)\)/).slice(1).map(Number);
    const p2 = e.parts[0].answer, p3 = e.parts[1].answer, p1 = e.parts[4].answer;
    close(q[0] - p2 * p2 + 1, 1, 1e-9, 'LQR (1,1)'); close(p1 - a * p2 - p2 * p3 + 1, 1, 1e-9, 'LQR (1,2)'); close(2 * (p2 - a * p3) - p3 * p3 + q[1] + 1, 1, 1e-9, 'LQR (2,2)');
    if (e.parts[5].answer < 60) fail('LQR phase margin below 60°');
}
for (const date of originalDates('measurement', 'mastery')) { // Mastery measurement: Kalman gains equal the Kalata closed form.
    const e = makeTierExercise('measurement', date, 'mastery'), num = g => +g.match(/= ([\d.]+)/)[1], sa = num(e.givens[1]), sz = num(e.givens[2]), dt = .1;
    const lam = sa * dt * dt / sz, r = Math.sqrt(lam * lam + 8 * lam), alpha = -(lam * lam + 8 * lam - (lam + 4) * r) / 8, beta = (lam * lam + 4 * lam - lam * r) / 4;
    close(e.parts[0].answer, alpha, 1e-6, 'Kalman α'); close(e.parts[1].answer, beta / dt, 1e-6, 'Kalman β/Δt');
}
for (const date of originalDates('digital', 'mastery')) { // Mastery digital: CRC by long division; x^e ≡ 1.
    const e = makeTierExercise('digital', date, 'mastery'), poly = parseInt(e.text.match(/\(0x([0-9A-F]{2})\)/)[1], 16), bytes = e.givens[1].match(/0x[0-9A-F]{2}/g).map(x => parseInt(x, 16)), g = 0x100 | poly;
    let rem = ((bytes[0] << 16) | (bytes[1] << 8)) >>> 0;
    for (let bit = 23; bit >= 8; bit--) if (rem & (1 << bit)) rem ^= g << (bit - 8);
    close(e.parts[0].answer, rem, 0, 'CRC long division');
    let r = 1; for (let i = 0; i < e.parts[2].answer; i++) { r <<= 1; if (r & 0x100) r ^= g; }
    close(r, 1, 0, 'x^e mod g = 1');
}
for (const date of originalDates('power', 'mastery')) { // Mastery power: losses equal the sum of injections.
    const e = makeTierExercise('power', date, 'mastery'), loss = e.parts[5].answer, p1 = e.parts[4].answer, p3 = -Number(e.text.match(/load of ([\d.]+) MW/)[1]);
    close(loss, p1 + 40 + p3, 1e-6, 'load-flow loss balance');
}
for (const date of originalDates('circuits', 'mastery')) { // Mastery circuits: underdamped with a peak above the final value.
    const e = makeTierExercise('circuits', date, 'mastery');
    if (!(e.parts[5].answer > e.parts[3].answer)) fail('ladder peak not above final value');
}
for (const date of originalDates('signals', 'expert')) { // Expert signals: the reported zero is a zero.
    const e = makeTierExercise('signals', date, 'expert'), wz = e.parts[4].answer, C = 1 / (2e3 * wz);
    const H = run(`(w, C) => { const s = cx(0, w), y1 = cd(cm(s, cx(C)), ca(cx(1), cm(s, cx(2e3 * C)))); const [vb, vc] = complexSolve([[ca(ca(y1, cx(1/2e3 + 1/3e3)), cm(s, cx(C))), cx(-1/3e3)], [cx(-1/3e3), cx(1/3e3 + 1/10e3 + 1/5e3)]], [y1, cx(1/10e3)]); return cabs(cs(vb, vc)); }`);
    checks++;
    if (H(wz, C) > 1e-12) fail('RC network zero is not a zero');
}

/* ---- cross-checks on the motors, sensors and comms generators (values read back from the givens) ---- */
const nums = str => (str.match(/-?\d+(?:\.\d+)?/g) || []).map(Number), rd = x => x * Math.PI / 180;
for (const date of originalDates('motors', 'challenge')) { // DC motor start: a direct simulation finds the same peak current.
    const e = makeTierExercise('motors', date, 'challenge'), [R, Lm] = nums(e.givens[0]), [k, J, b] = nums(e.givens[1]), [V] = nums(e.givens[2]), L = Lm * 1e-3;
    let i = 0, w = 0, peak = 0;
    const h = L / R / 400, f = (i, w) => [(V - R * i - k * w) / L, (k * i - b * w) / J];
    for (let n = 0; n < 4 * e.parts[4].answer * 1e-3 / h; n++) {
        const k1 = f(i, w), k2 = f(i + h / 2 * k1[0], w + h / 2 * k1[1]), k3 = f(i + h / 2 * k2[0], w + h / 2 * k2[1]), k4 = f(i + h * k3[0], w + h * k3[1]);
        i += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); w += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); peak = Math.max(peak, i);
    }
    close(peak, e.parts[3].answer, 1e-5, 'motors/challenge peak current by simulation');
}
for (const date of originalDates('motors', 'mastery')) { // Field weakening: the operating point sits on both the current and the voltage limit.
    const e = makeTierExercise('motors', date, 'mastery'), [pp, psi, Lm, Rs] = nums(e.givens[0]), [Im, Vm] = nums(e.givens[1]), [n] = nums(e.givens[2]), [, id, iq] = e.parts.map(x => x.answer);
    const we = pp * n * 2 * Math.PI / 60, L = Lm * 1e-3;
    close(Math.hypot(id, iq), Im, 1e-6, 'motors/mastery on the current limit'); close(Math.hypot(Rs * id - we * L * iq, Rs * iq + we * (psi + L * id)), Vm, 1e-6, 'motors/mastery on the voltage limit');
}
for (const date of originalDates('sensors', 'expert')) { // Trilateration: the gradient of the squared range residuals vanishes at the answer.
    const e = makeTierExercise('sensors', date, 'expert'), [Lb] = nums(e.givens[0]), rho = nums(e.givens[1]), [x, y] = e.parts.map(p => p.answer), B = [[0, 0], [Lb, 0], [Lb, Lb], [0, Lb]];
    const gr = B.reduce((g, bb, i) => { const d = Math.hypot(x - bb[0], y - bb[1]), r = rho[i] - d; return [g[0] - 2 * r * (x - bb[0]) / d, g[1] - 2 * r * (y - bb[1]) / d]; }, [0, 0]);
    checks++;
    if (Math.hypot(...gr) > 1e-8) fail(`sensors/expert gradient ${Math.hypot(...gr)} on ${date}`);
}
for (const date of originalDates('infotheory', 'expert')) { // Asymmetric channel: Blahut–Arimoto reaches the same capacity.
    const e = makeTierExercise('infotheory', date, 'expert'), e0 = nums(e.givens[0]).pop(), e1 = nums(e.givens[1]).pop(), W = [[1 - e0, e0], [e1, 1 - e1]];
    let px = [.5, .5], C = 0;
    for (let it = 0; it < 3000; it++) {
        const py = [0, 1].map(y => px[0] * W[0][y] + px[1] * W[1][y]), D = W.map(row => row.reduce((s, v, y) => s + (v > 0 ? v * Math.log2(v / py[y]) : 0), 0)), z = px.map((v, i) => v * 2 ** D[i]), sz = z[0] + z[1];
        C = Math.log2(sz); px = z.map(v => v / sz);
    }
    close(C, e.parts[1].answer, 1e-7, 'infotheory/expert Blahut–Arimoto capacity'); close(px[1], e.parts[2].answer, 1e-4, 'infotheory/expert optimal input');
}
for (const date of originalDates('infotheory', 'mastery')) { // Water-filling: the powers implied by the level add up to the budget and give the stated capacity.
    const e = makeTierExercise('infotheory', date, 'mastery'), g0 = nums(e.givens[0]), taps = g0.slice(0, -1), N = g0.pop(), [Pt] = nums(e.givens[2]), [mu, active, Cw] = e.parts.map(p => p.answer);
    const g = Array.from({length: N}, (_, k) => { let re = 0, im = 0; taps.forEach((h, n) => { re += h * Math.cos(2 * Math.PI * k * n / N); im -= h * Math.sin(2 * Math.PI * k * n / N); }); return re * re + im * im; }), P = g.map(x => Math.max(0, mu - 1 / x));
    close(P.reduce((s, v) => s + v, 0), Pt, 1e-9, 'infotheory/mastery power budget'); close(P.filter(v => v > 0).length, active, 0, 'infotheory/mastery active count');
    close(g.reduce((s, x, k) => s + Math.log2(1 + x * P[k]), 0), Cw, 1e-9, 'infotheory/mastery capacity');
}
for (const date of originalDates('modulation', 'expert')) { // Viterbi: re-encoding the answer differs from the received word exactly at the two stated positions, and nothing is closer.
    const e = makeTierExercise('modulation', date, 'expert'), rx = e.givens[2].match(/mathtt\{([^}]*)\}/)[1].replace(/[^01]/g, '').split('').map(Number), [m, a, b, second] = e.parts.map(p => p.answer);
    const enc = bits => { let s1 = 0, s2 = 0; const out = []; for (const u of bits) { out.push(u ^ s1 ^ s2, u ^ s2); s2 = s1; s1 = u; } return out; }, word = x => enc([...Array.from({length: 6}, (_, i) => x >> (5 - i) & 1), 0, 0]);
    const diff = word(m).map((v, i) => v !== rx[i] ? i + 1 : 0).filter(Boolean), others = Array.from({length: 64}, (_, x) => x).filter(x => x !== m).map(x => word(x).reduce((s, v, i) => s + (v !== rx[i]), 0));
    checks++;
    if (diff.join() !== `${a},${b}` || Math.min(...others) !== second || second <= 2) fail(`modulation/expert Viterbi check on ${date}: ${diff} / ${second}`);
}
for (const date of originalDates('modulation', 'mastery').slice(0, 3)) { // Diversity: a plain fine-grid quadrature in γ agrees with the substituted one.
    const e = makeTierExercise('modulation', date, 'mastery'), [L] = nums(e.givens[1]), [gdb] = nums(e.givens[2]), gb = 10 ** (gdb / 10), qamBer = run('qamBer'), fact = [1, 1, 2, 6][L - 1];
    close(run('NUM').simpson(u => qamBer(16, gb * u) * u ** (L - 1) * Math.exp(-u) / fact, 0, 60, 200000), e.parts[1].answer, 1e-4, 'modulation/mastery average BER');
}
for (const date of originalDates('linkbudget', 'mastery')) { // Array: closed-form directivity of a uniform line of isotropic elements.
    const e = makeTierExercise('linkbudget', date, 'mastery'), [N, dl] = nums(e.givens[0]), th0 = nums(e.givens[1]).pop(), kd = 2 * Math.PI * dl, u0 = Math.sin(rd(th0));
    let den = N;
    for (let m = 1; m < N; m++) den += 2 * (N - m) * Math.sin(m * kd) / (m * kd) * Math.cos(m * kd * u0);
    close(10 * Math.log10(N * N / den), e.parts[0].answer, 1e-5, 'linkbudget/mastery directivity');
}
for (const date of originalDates('rfcircuits', 'challenge')) { // Single-stub match: the line admittance plus the stub admittance is exactly Y0.
    const e = makeTierExercise('rfcircuits', date, 'challenge'), m = e.givens[0].match(/= (\d+) ([+-]) j(\d+)/), ZL = c.cx(+m[1], (m[2] === '-' ? -1 : 1) * +m[3]), Y0 = 1 / 50, [d, , ls] = e.parts.map(p => p.answer);
    const YL = c.cd(c.cx(1), ZL), t = Math.tan(2 * Math.PI * d), Yin = c.cm(c.cx(Y0), c.cd(c.ca(YL, c.cx(0, Y0 * t)), c.ca(c.cx(Y0), c.cm(c.cx(0, t), YL)))), Y = c.ca(Yin, c.cx(0, -Y0 / Math.tan(2 * Math.PI * ls)));
    checks++;
    if (c.cabs(c.cs(Y, c.cx(Y0))) > 1e-9 * Y0) fail(`rfcircuits/challenge stub does not match on ${date}`);
}
{ // Amplifier sets: the simultaneous conjugate match gives Γ_S = Γ_in* and a transducer gain equal to the maximum available gain.
    const S = run('SPARAMS'), cj = z => c.cx(z.re, -z.im);
    checks++;
    if (S.length < 2) fail('fewer than two stable S-parameter sets');
    for (const [s11, s12, s21, s22] of S) {
        const D = c.cs(c.cm(s11, s22), c.cm(s12, s21)), K = (1 - c.cabs(s11) ** 2 - c.cabs(s22) ** 2 + c.cabs(D) ** 2) / (2 * c.cabs(c.cm(s12, s21)));
        const B1 = 1 + c.cabs(s11) ** 2 - c.cabs(s22) ** 2 - c.cabs(D) ** 2, C1 = c.cs(s11, c.cm(D, cj(s22))), B2 = 1 + c.cabs(s22) ** 2 - c.cabs(s11) ** 2 - c.cabs(D) ** 2, C2 = c.cs(s22, c.cm(D, cj(s11)));
        const GS = c.cd(c.cx(B1 - Math.sqrt(B1 * B1 - 4 * c.cabs(C1) ** 2)), c.cm(c.cx(2), C1)), GL = c.cd(c.cx(B2 - Math.sqrt(B2 * B2 - 4 * c.cabs(C2) ** 2)), c.cm(c.cx(2), C2));
        const Gin = c.ca(s11, c.cd(c.cm(c.cm(s12, s21), GL), c.cs(c.cx(1), c.cm(s22, GL))));
        const GT = (1 - c.cabs(GS) ** 2) * c.cabs(s21) ** 2 * (1 - c.cabs(GL) ** 2) / (c.cabs(c.cs(c.cx(1), c.cm(GS, Gin))) ** 2 * c.cabs(c.cs(c.cx(1), c.cm(s22, GL))) ** 2);
        close(GT, c.cabs(s21) / c.cabs(s12) * (K - Math.sqrt(K * K - 1)), 1e-9, 'amplifier transducer gain = MAG');
    }
}

/* ---- cache-busting: every css/ and js/ link in index.html carries the current content fingerprint ---- */
{
    const {fingerprint, REF} = require(path.join(root, 'tools', 'stamp.js'));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), v = fingerprint(html);
    const links = [...html.matchAll(/(?:href|src)="((?:css|js)\/[^"]+)"/g)].map(m => m[1]);
    checks++;
    if (!links.length || links.some(l => !l.endsWith(`?v=${v}`))) fail(`index.html asset stamps are stale (want ?v=${v}); run: node tools/stamp.js`);
}
console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
