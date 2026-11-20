/* Checks every topic × level over many dates: generators must not throw, answers must be finite,
   every LaTeX fragment must compile with KaTeX, curated answers must match their independent
   numerical verification, and selected generated answers are cross-checked.
   Run with: node tests/exercises.test.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const katex = require(path.join(root, 'vendor/katex/katex.min.js'));
const files = ['diagrams', 'mathtext', 'core', 'hard', 'numerics', 'expert', 'mechanical', 'bank', 'bank-mech'];
const ctx = vm.createContext({console, Math, Number, Date, Object, Array, String, JSON, Error});
for (const f of files)
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, {filename: f + '.js'});
const run = code => vm.runInContext(code, ctx);
const TOPICS = run('TOPICS'), LEVELS = run('LEVELS'), BANK = run('BANK'), makeExercise = run('makeExercise'), MathInput = run('MathInput');
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
    for (const t of TOPICS) for (const l of LEVELS) {
        let e;
        try { e = makeExercise(t.id, date, l.id); } catch (err) { fail(`${t.id}/${l.id}/${date} threw ${err.stack}`); continue; }
        checks++;
        const where = `${t.id}/${l.id}/${date}`;
        for (const k of ['title', 'text', 'idea', 'prerequisites', 'level', 'minutes'])
            if (!e[k]) fail(`${where} missing ${k}`);
        if (!e.parts?.length || !e.hints?.length || !e.steps?.length) fail(`${where} missing parts/hints/steps`);
        if (e.level !== l.name) fail(`${where} level label ${e.level} ≠ ${l.name}`);
        for (const p of e.parts) {
            if (!Number.isFinite(p.answer)) fail(`${where} non-finite answer for "${p.label}": ${p.answer}`);
            if (p.tolerance === 0 && !Number.isInteger(p.answer)) fail(`${where} exact answer not integer for "${p.label}"`);
        }
        if (/NaN|undefined|Infinity/.test(e.text + e.steps.join('') + (e.givens || []).join('') + e.diagram)) fail(`${where} NaN/undefined in text: ${e.title}`);
        texFields(e, where);
        (seen[t.id + '/' + l.id] ||= new Set()).add(e.title + JSON.stringify(e.parts.map(p => p.answer)));
    }
}
for (const [k, s] of Object.entries(seen))
    if (s.size < 2) fail(`${k} never varies across 120 days`);

/* ---- curated bank: size, exact forms evaluate to the answer, independent verification ---- */
for (const t of TOPICS) for (const l of run('CURATED_LEVELS')) {
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
for (const [src, want] of [['pi/4', Math.PI / 4], ['ln2', Math.LN2], ['(sqrt(5)-1)/2', (Math.sqrt(5) - 1) / 2], ['2^(2/5)', 2 ** .4], ['e^-pi', Math.exp(-Math.PI)], ['25ln10', 25 * Math.log(10)], ['2e-3', .002], ['3sqrt2', 3 * Math.SQRT2], ['√3/2', Math.sqrt(3) / 2], ['−1/6', -1 / 6], ['1/(2pi)', 1 / (2 * Math.PI)], ['5-2sqrt6', 5 - 2 * Math.sqrt(6)], ['-2^2', -4], ['0,5', .5], ['2·π', 2 * Math.PI], ['atan(1)*4', Math.PI], ['ln2/2', Math.LN2 / 2], ['log100', 2], ['log10(1000)', 3], ['log100/2', 1]])
    close(MathInput.read(src).value, want, 1e-12, `parser "${src}"`);
/* LaTeX exactly as the MathLive editor emits it (captured from real keystrokes) → value */
for (const [latex, want] of [[T('\\frac34'), .75], [T('\\frac{\\pi}{4}'), Math.PI / 4], [T('\\frac{1}{\\sqrt2}'), Math.SQRT1_2], [T('e^{-\\pi}'), Math.exp(-Math.PI)], [T('\\frac{(1+\\sqrt5)}{2}'), (1 + Math.sqrt(5)) / 2], [T('\\sqrt{(2)}'), Math.SQRT2], [T('25\\ln10'), 25 * Math.log(10)], [T('-\\frac16'), -1 / 6], [T('2\\cdot\\pi'), 2 * Math.PI], [T('2^{(\\frac25)}'), 2 ** .4], [T('100e^{-\\pi}'), 100 * Math.exp(-Math.PI)], [T('a\\tan\\left(1\\right)'), Math.PI / 4], [T('\\arctan\\left(1\\right)'), Math.PI / 4], [T('\\frac{1}{(2\\pi)}'), 1 / (2 * Math.PI)], [T('5-2\\sqrt6'), 5 - 2 * Math.sqrt(6)], [T('\\frac{8\\sqrt2}{\\pi^2}'), 8 * Math.SQRT2 / Math.PI ** 2], [T('2^{10}-1'), 1023], [T('\\ln(\\frac{49}{48})'), Math.log(49 / 48)], [T('(\\frac56)^{(\\frac72)}'), (5 / 6) ** 3.5], [T('1{,}5'), 1.5], [T('\\sqrt[3]{8}'), 2], [T('\\left|-3\\right|'), 3], [T('2e-3'), .002], [T('3\\times4'), 12], [T('\\frac{\\ln2}{2}'), Math.LN2 / 2], [T('\\frac{\\log100}{2}'), 1], [T('\\frac{\\arctan(1)}{\\pi}'), .25]])
    close(MathInput.readLatex(latex).value, want, 1e-12, `editor LaTeX "${latex}"`);
for (const bad of [T('\\frac{4}{\\placeholder{}}'), T('\\sqrt{'), T('\\alpha')])
    try { MathInput.readLatex(bad); fail(`editor LaTeX accepted "${bad}"`); } catch { checks++; }
function T(s) { return s; }
for (const bad of ['', 'pi/', '2**', 'foo', '(1+2'])
    try { MathInput.read(bad); fail(`parser accepted "${bad}"`); } catch { checks++; }

/* ---- cross-checks on generated Levels 4–7 ---- */
const dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
const c = run('({cx, ca, cs, cm, cd, cabs, cp})');
for (const date of dates) { // Expert circuits: KCL residual at node b.
    const e = makeExercise('circuits', date, 'expert'), va = c.cx(e.parts[0].answer, e.parts[1].answer), vb = c.cx(e.parts[2].answer, e.parts[3].answer);
    const ve = c.cd(c.ca(c.cm(c.cx(1 / 200), va), c.cm(c.cx(0, -1 / 300), vb)), c.ca(c.cx(1 / 200), c.cx(0, -1 / 300)));
    const [E1, E2, I] = e.givens.slice(0, 3).map(g => { const m = g.match(/= ([\d.]+)\\angle (-?[\d.]+)\^\\circ/); return c.cp(+m[1], +m[2]); });
    const res = [c.cd(c.cs(vb, va), c.cx(0, -400)), c.cd(c.cs(vb, ve), c.cx(0, 300)), c.cd(vb, c.cx(0, 500)), c.cd(c.cs(vb, E2), c.cx(1000)), c.cm(c.cx(-1), I)].reduce((s, x) => c.ca(s, x), c.cx(0));
    checks++;
    if (c.cabs(res) > 1e-6 * Math.max(1, c.cabs(I))) fail(`circuits/expert KCL residual ${c.cabs(res)} on ${date}`);
}
for (const date of dates) { // Expert control: Riccati residual.
    const e = makeExercise('control', date, 'expert'), a = +e.text.match(/= -(\d+)x_2/)[1], q = e.givens[2].match(/diag\}\((\d+), (\d+)\)/).slice(1).map(Number);
    const p2 = e.parts[0].answer, p3 = e.parts[1].answer, p1 = e.parts[4].answer;
    close(q[0] - p2 * p2 + 1, 1, 1e-9, 'LQR (1,1)'); close(p1 - a * p2 - p2 * p3 + 1, 1, 1e-9, 'LQR (1,2)'); close(2 * (p2 - a * p3) - p3 * p3 + q[1] + 1, 1, 1e-9, 'LQR (2,2)');
    if (e.parts[5].answer < 60) fail('LQR phase margin below 60°');
}
for (const date of dates) { // Mastery measurement: Kalman gains equal the Kalata closed form.
    const e = makeExercise('measurement', date, 'mastery'), num = g => +g.match(/= ([\d.]+)/)[1], sa = num(e.givens[1]), sz = num(e.givens[2]), dt = .1;
    const lam = sa * dt * dt / sz, r = Math.sqrt(lam * lam + 8 * lam), alpha = -(lam * lam + 8 * lam - (lam + 4) * r) / 8, beta = (lam * lam + 4 * lam - lam * r) / 4;
    close(e.parts[0].answer, alpha, 1e-6, 'Kalman α'); close(e.parts[1].answer, beta / dt, 1e-6, 'Kalman β/Δt');
}
for (const date of dates) { // Mastery digital: CRC by long division; x^e ≡ 1.
    const e = makeExercise('digital', date, 'mastery'), poly = parseInt(e.text.match(/\(0x([0-9A-F]{2})\)/)[1], 16), bytes = e.givens[1].match(/0x[0-9A-F]{2}/g).map(x => parseInt(x, 16)), g = 0x100 | poly;
    let rem = ((bytes[0] << 16) | (bytes[1] << 8)) >>> 0;
    for (let bit = 23; bit >= 8; bit--) if (rem & (1 << bit)) rem ^= g << (bit - 8);
    close(e.parts[0].answer, rem, 0, 'CRC long division');
    let r = 1; for (let i = 0; i < e.parts[2].answer; i++) { r <<= 1; if (r & 0x100) r ^= g; }
    close(r, 1, 0, 'x^e mod g = 1');
}
for (const date of dates) { // Mastery power: losses equal the sum of injections.
    const e = makeExercise('power', date, 'mastery'), loss = e.parts[5].answer, p1 = e.parts[4].answer, p3 = -Number(e.text.match(/load of ([\d.]+) MW/)[1]);
    close(loss, p1 + 40 + p3, 1e-6, 'load-flow loss balance');
}
for (const date of dates) { // Mastery circuits: underdamped with a peak above the final value.
    const e = makeExercise('circuits', date, 'mastery');
    if (!(e.parts[5].answer > e.parts[3].answer)) fail('ladder peak not above final value');
}
for (const date of dates) { // Mastery thermo: shock inside the diverging section.
    const e = makeExercise('thermo', date, 'mastery'), AR = +e.givens[2].match(/= ([\d.]+)/)[1], As = e.parts[5].answer;
    if (!(As > 1 && As < AR) || !(e.parts[2].answer < 1)) fail(`nozzle shock check failed (${As} vs ${AR})`);
}
for (const date of dates) { // Mastery statics: joint equilibrium.
    const e = makeExercise('statics', date, 'mastery'), F = e.givens[3].match(/\((\d+), (-?\d+)\)/).slice(1).map(Number), Tn = e.parts.slice(2, 5).map(p => p.answer), sup = [[-1.5, 2], [0, 2], [2, 2]];
    const sx = Tn.reduce((s, t, i) => s + t * sup[i][0] / Math.hypot(...sup[i]), 0) + F[0], sy = Tn.reduce((s, t, i) => s + t * sup[i][1] / Math.hypot(...sup[i]), 0) + F[1];
    checks++;
    if (Math.abs(sx) > 1e-6 || Math.abs(sy) > 1e-6) fail(`truss equilibrium residual ${sx}, ${sy}`);
}
for (const date of dates) { // Expert signals: the reported zero is a zero.
    const e = makeExercise('signals', date, 'expert'), wz = e.parts[4].answer, C = 1 / (2e3 * wz);
    const H = run(`(w, C) => { const s = cx(0, w), y1 = cd(cm(s, cx(C)), ca(cx(1), cm(s, cx(2e3 * C)))); const [vb, vc] = complexSolve([[ca(ca(y1, cx(1/2e3 + 1/3e3)), cm(s, cx(C))), cx(-1/3e3)], [cx(-1/3e3), cx(1/3e3 + 1/10e3 + 1/5e3)]], [y1, cx(1/10e3)]); return cabs(cs(vb, vc)); }`);
    checks++;
    if (H(wz, C) > 1e-12) fail('RC network zero is not a zero');
}
console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
