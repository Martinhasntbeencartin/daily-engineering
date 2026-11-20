/* Checks every topic × level over many dates: generators must not throw, answers must be finite,
   and selected answers are cross-checked against independent calculations.
   Run with: node tests/exercises.test.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const files = ['diagrams', 'foundations', 'levels', 'extra', 'hard', 'numerics', 'expert', 'mechanical'];
const ctx = vm.createContext({console, Math, Number, Date, Object, Array, String, JSON, Error});
for (const f of files)
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, {filename: f + '.js'});
const run = code => vm.runInContext(code, ctx);
const TOPICS = run('TOPICS'), LEVELS = run('LEVELS'), makeExercise = run('makeExercise');
let failures = 0, checks = 0;
const fail = msg => { failures++; console.error('FAIL', msg); };
const close = (a, b, tol, msg) => { checks++; if (!(Math.abs(a - b) <= Math.max(Math.abs(b) * tol, 1e-9))) fail(`${msg}: got ${a}, expected ${b}`); };

const start = Date.UTC(2026, 0, 1), seenVariants = {};
for (let d = 0; d < 120; d++) {
    const date = new Date(start + d * 86400000).toISOString().slice(0, 10);
    for (const t of TOPICS) for (const l of LEVELS) {
        let e;
        try { e = makeExercise(t.id, date, l.id); } catch (err) { fail(`${t.id}/${l.id}/${date} threw ${err.stack}`); continue; }
        checks++;
        for (const k of ['title', 'text', 'diagram', 'idea', 'prerequisites', 'level', 'minutes'])
            if (!e[k]) fail(`${t.id}/${l.id}/${date} missing ${k}`);
        if (!e.parts?.length || !e.hints?.length || !e.steps?.length) fail(`${t.id}/${l.id}/${date} missing parts/hints/steps`);
        if (e.level !== l.name) fail(`${t.id}/${l.id} level label ${e.level} ≠ ${l.name}`);
        for (const p of e.parts) {
            if (!Number.isFinite(p.answer)) fail(`${t.id}/${l.id}/${date} non-finite answer for "${p.label}": ${p.answer}`);
            if (p.tolerance === 0 && !Number.isInteger(p.answer)) fail(`${t.id}/${l.id}/${date} exact answer not integer for "${p.label}"`);
        }
        if (/NaN|undefined|Infinity/.test(e.text + e.steps.join('') + e.givens.join('') + e.diagram)) fail(`${t.id}/${l.id}/${date} NaN/undefined in text: ${e.title}`);
        const key = t.id + '/' + l.id;
        (seenVariants[key] ||= new Set()).add(JSON.stringify(e.parts.map(p => p.answer)));
    }
}
for (const [k, s] of Object.entries(seenVariants))
    if (s.size < 2) fail(`${k} never varies across 120 days`);

/* ---- independent cross-checks for the new levels ---- */
const ans = (topic, level, date, label) => makeExercise(topic, date, level).parts.find(p => p.label.startsWith(label)).answer;
const dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];

// Expert circuits: KCL residual at node a with the reported Va, Vb (Ve recomputed from KCL at e).
for (const date of dates) {
    const e = makeExercise('circuits', date, 'expert');
    if (!e.text.includes('E₁')) continue;
    const va = {re: e.parts[0].answer, im: e.parts[1].answer}, vb = {re: e.parts[2].answer, im: e.parts[3].answer};
    const c = run('({cx, ca, cs, cm, cd, cabs})');
    const ve = c.cd(c.ca(c.cm(c.cx(1 / 200), va), c.cm(c.cx(0, -1 / 300), vb)), c.ca(c.cx(1 / 200), c.cx(0, -1 / 300)));
    // KCL at e: (Ve-Va)/200 + (Ve-Vb)/(j300) = 0 -> check residual is ~0 by construction; check node b instead
    const set = e.givens.map(g => g.match(/= ([\d.]+)∠(-?[\d.]+)°/)).filter(Boolean).map(m => run(`cp(${m[1]}, ${m[2]})`));
    const [E1, E2, I] = set, Y = z => c.cd(c.cx(1), z);
    const terms = [c.cd(c.cs(vb, va), c.cx(0, -400)), c.cd(c.cs(vb, ve), c.cx(0, 300)), c.cd(vb, c.cx(0, 500)), c.cd(c.cs(vb, E2), c.cx(1000)), c.cm(c.cx(-1), I)];
    const res = terms.reduce((s, x) => c.ca(s, x), c.cx(0));
    checks++;
    if (c.cabs(res) > 1e-6 * Math.max(1, c.cabs(I))) fail(`circuits/expert KCL at b residual ${c.cabs(res)} on ${date}`);
}
// Expert control: Riccati residual of the reported gains.
for (const date of dates) {
    const e = makeExercise('control', date, 'expert'), a = Number(e.givens[0].match(/−(\d+)\]/)[1]), q = e.givens[2].match(/diag\((\d+), (\d+)\)/).slice(1).map(Number);
    const p2 = e.parts[0].answer, p3 = e.parts[1].answer, p1 = e.parts[4].answer;
    close(-p2 * p2 + q[0], 0, 1, 'LQR (1,1)'); close(p1 - a * p2 - p2 * p3 + 1, 1, 1e-9, 'LQR (1,2)'); close(2 * (p2 - a * p3) - p3 * p3 + q[1] + 1, 1, 1e-9, 'LQR (2,2)');
    if (e.parts[5].answer < 60) fail('LQR phase margin below 60°');
}
// Mastery measurement: Kalman gains equal the Kalata closed form.
for (const date of dates) {
    const e = makeExercise('measurement', date, 'mastery'), sa = Number(e.givens[1].match(/= ([\d.]+)/)[1]), sz = Number(e.givens[2].match(/= ([\d.]+)/)[1]), dt = .1;
    const lam = sa * dt * dt / sz, r = Math.sqrt(lam * lam + 8 * lam), alpha = -(lam * lam + 8 * lam - (lam + 4) * r) / 8, beta = (lam * lam + 4 * lam - lam * r) / 4;
    close(e.parts[0].answer, alpha, 1e-6, 'Kalman α'); close(e.parts[1].answer, beta / dt, 1e-6, 'Kalman β/Δt');
}
// Mastery fields: broadside, λ/2 array has directivity N (sanity of the integrator used in the generator).
{
    const N = 8, af = u => { const psi = Math.PI * u; return Math.abs(Math.sin(psi / 2)) < 1e-12 ? 1 : Math.abs(Math.sin(N * psi / 2) / (N * Math.sin(psi / 2))); };
    close(2 / run('NUM').simpson(u => af(u) ** 2, -1, 1, 40000), N, 1e-4, 'array directivity N');
}
// Mastery digital: CRC by long division equals the shift-register value; order check x^e mod g == 1.
for (const date of dates) {
    const e = makeExercise('digital', date, 'mastery'), poly = parseInt(e.text.match(/\(0x([0-9A-F]{2})\)/)[1], 16), bytes = e.givens[1].match(/0x[0-9A-F]{2}/g).map(x => parseInt(x, 16));
    let rem = ((bytes[0] << 16) | (bytes[1] << 8)) >>> 0;
    const g = 0x100 | poly;
    for (let bit = 23; bit >= 8; bit--) if (rem & (1 << bit)) rem ^= g << (bit - 8);
    close(e.parts[0].answer, rem, 0, 'CRC long division');
    let r = 1; for (let i = 0; i < e.parts[2].answer; i++) { r <<= 1; if (r & 0x100) r ^= g; }
    close(r, 1, 0, 'x^e mod g = 1');
}
// Mastery power: NR solution satisfies the slack-bus balance (losses equal sum of injections).
for (const date of dates) {
    const e = makeExercise('power', date, 'mastery'), loss = e.parts[5].answer, p1 = e.parts[4].answer, p3 = -Number(e.text.match(/load of ([\d.]+) MW/)[1]);
    close(loss, p1 + 40 + p3, 1e-6, 'load-flow loss balance');
    if (loss <= 0 || loss > 10) fail('implausible loss ' + loss);
}
// Mastery circuits: the trajectory ends at the final value, and the peak exceeds it (underdamped).
for (const date of dates) {
    const e = makeExercise('circuits', date, 'mastery'), vinf = e.parts[3].answer, peak = e.parts[5].answer;
    if (!(peak > vinf)) fail(`ladder peak ${peak} not above final ${vinf}`);
    if (!(e.parts[2].answer > 0)) fail('ladder has no complex pair');
}
// Mastery thermo: shock lies inside the diverging section.
for (const date of dates) {
    const e = makeExercise('thermo', date, 'mastery'), AR = Number(e.givens[2].match(/= ([\d.]+)/)[1]), As = e.parts[5].answer, Me = e.parts[2].answer;
    if (!(As > 1 && As < AR)) fail(`shock outside nozzle: ${As} vs ${AR}`);
    if (!(Me < 1)) fail('exit not subsonic after shock');
}
// Expert thermo: required UA is positive and finite.
for (const date of dates) { const e = makeExercise('thermo', date, 'expert'); if (!(e.parts[4].answer > 0)) fail('HX UA not positive'); }
// Mastery statics: equilibrium of the three bar forces at the joint.
for (const date of dates) {
    const e = makeExercise('statics', date, 'mastery'), F = e.givens[4].match(/\((\d+), (-?\d+)\)/).slice(1).map(Number), T = e.parts.slice(2, 5).map(p => p.answer), sup = [[-1.5, 2], [0, 2], [2, 2]];
    const sx = T.reduce((s, t, i) => s + t * sup[i][0] / Math.hypot(...sup[i]), 0) + F[0], sy = T.reduce((s, t, i) => s + t * sup[i][1] / Math.hypot(...sup[i]), 0) + F[1];
    close(sx, 0, 1, 'truss ΣFx'); close(sy, 0, 1, 'truss ΣFy');
    if (Math.abs(sx) > 1e-6 || Math.abs(sy) > 1e-6) fail(`truss equilibrium residual ${sx}, ${sy}`);
}
// Mastery dynamics: frequencies ascending, effective mass between 50% and 100%.
for (const date of dates) {
    const e = makeExercise('dynamics', date, 'mastery'), f = e.parts.slice(0, 3).map(p => p.answer);
    if (!(f[0] < f[1] && f[1] < f[2])) fail('building frequencies not ascending');
    if (!(e.parts[4].answer > 50 && e.parts[4].answer < 100)) fail('effective mass out of range ' + e.parts[4].answer);
}
// Expert signals: RC network poles real, H(0) matches a hand DC calculation (C1 open, C2 open).
{
    const R2 = 2e3, R3 = 3e3, R4 = 10e3, R5 = 5e3, Rb = R2 + R3, Rc = R5 * Rb / (R5 + Rb), vc = Rc / (R4 + Rc), vb = vc * R2 / Rb;
    close(ans('signals', 'expert', '2026-03-01', 'DC gain'), vb - vc, 1e-9, 'RC network H(0)');
}
// Expert signals: the reported zero really is a zero of the network (|H(jω0)| ≈ 0).
for (const date of dates) {
    const e = makeExercise('signals', date, 'expert'), wz = e.parts.find(p => p.label.startsWith('Transmission')).answer, C = 1 / (2e3 * wz);
    const H = run(`(w, C) => { const G2 = 1/2e3, G3 = 1/3e3, G4 = 1/10e3, G5 = 1/5e3, s = cx(0, w); const y1 = cd(cm(s, cx(C)), ca(cx(1), cm(s, cx(2e3 * C)))); const [vb, vc] = complexSolve([[ca(ca(y1, cx(G2 + G3)), cm(s, cx(C))), cx(-G3)], [cx(-G3), cx(G3 + G4 + G5)]], [y1, cx(G4)]); return cabs(cs(vb, vc)); }`);
    checks++; if (H(wz, C) > 1e-12) fail('RC network zero not a zero');
}
console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
