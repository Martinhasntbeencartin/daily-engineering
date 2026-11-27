/* Level 1, more curated problems: Circuits & electronics (circuit analysis, electronics, digital logic, measurement).
   Each problem has one key insight and an exact answer, and verify() checks it by an independent numerical method
   (nodal analysis, simulation, exhaustive search). The small drawing helpers here are shared by the other bank-more files. */

/* ---------- shared drawing helpers ---------- */
const bkPlot = (xLabel, yLabel, [x0, x1], [y0, y1], fns, marks = []) => {
    const L = 100, R = 642, T0 = 47, B = 194, X = x => L + (R - L) * (x - x0) / (x1 - x0), Y = y => B - (B - T0) * (y - y0) / (y1 - y0);
    let body = wire(`M${L} ${T0}V${B}H${R}`) + note(L, 27, yLabel) + dt(360, 246, xLabel);
    for (const v of [y0, y1]) body += wire(`M${L - 6} ${Y(v).toFixed(1)}h6`) + dt(L - 34, Y(v) + 5, String(v));
    for (const v of [x0, x1]) body += wire(`M${X(v).toFixed(1)} ${B}v6`) + dt(X(v), B + 25, String(v));
    fns.forEach((fn, k) => {
        let d = '';
        for (let i = 0; i <= 240; i++) { const x = x0 + (x1 - x0) * i / 240, y = Math.max(y0, Math.min(y1, fn(x))); d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`; }
        body += k ? guide(d) : `<path d="${d}" stroke="#aa492a" stroke-width="3"/>`;
    });
    marks.forEach(([x, y, t, dx = 10, dy = -10]) => { body += dot(X(x), Y(y)) + note(X(x) + dx, Y(y) + dy, t); });
    return drawing(body, `${yLabel} against ${xLabel}, from ${x0} to ${x1}`, 255);
};
const bkBox = (x, y, w, h, label, below) => wire(`M${x} ${y}h${w}v${h}h-${w}z`) + dt(x + w / 2, y + h / 2 + 6, label) + (below ? dt(x + w / 2, y + h + 24, below) : '');
const bkChain = (items, y = 90, h = 56) => items.map(([x, w, label, below], i) => bkBox(x, y, w, h, label, below) + (i < items.length - 1 ? arrow(x + w, y + h / 2, items[i + 1][0], y + h / 2) : '')).join('');
const bkOpAmp = (x, y) => wire(`M${x} ${y - 60}V${y + 60}L${x + 120} ${y}Z`) + dt(x + 15, y - 24, '−') + dt(x + 15, y + 36, '+'); // inputs at y ∓ 30, output at x + 120
const bkBjt = (x, y) => wire(`M${x} ${y - 22}V${y + 22}M${x - 40} ${y}H${x}M${x} ${y - 10}L${x + 24} ${y - 28}V${y - 60}`) + arrow(x, y + 10, x + 24, y + 28) + wire(`M${x + 24} ${y + 28}V${y + 60}`);
const bkNand = (x, y) => wire(`M${x} ${y - 25}h30a25 25 0 0 1 0 50h-30z`) + ring(x + 61, y, 6); // inputs at y ∓ 12, output at x + 67
const bkSPlane = (pts, extra = '', label = 'Poles in the s-plane') => {
    const X = re => 420 + 50 * re, Y = im => 130 - 40 * im;
    return drawing(arrow(140, 130, 640, 130) + arrow(420, 236, 420, 18) + dt(652, 136, 'Re') + dt(444, 22, 'Im') + extra +
        pts.map(([re, im, t, dx = 12, dy = -10]) => wire(`M${X(re) - 7} ${Y(im) - 7}l14 14m0 -14l-14 14`) + (t ? note(X(re) + dx, Y(im) + dy, t) : '')).join(''), label, 250);
};
const bkBits = v => { let c = 0; while (v) { c += v & 1; v >>>= 1; } return c; };
const bkMirror = (x, svg) => `<g transform="translate(${2 * x} 0) scale(-1 1)">${svg}</g>`;
const bkMinSop = (n, ones) => { // prime implicants (value, mask) of a function given as a set of minterms, and the smallest covers
    const on = new Set(ones), cubes = [];
    for (let mask = 0; mask < 1 << n; mask++) for (let v = 0; v < 1 << n; v++) {
        if (v & mask) continue;
        let ok = true; for (let m = 0; m < 1 << n && ok; m++) if ((m & ~mask) === v && !on.has(m)) ok = false;
        if (ok) cubes.push([v, mask]);
    }
    const covers = ([v, mk], [w, mw]) => (mk & mw) === mw && (w & ~mk) === v; // first contains second
    const primes = cubes.filter(c => !cubes.some(d => d !== c && covers(d, c)));
    const minterms = ([v, mk]) => ones.filter(m => (m & ~mk) === v);
    let best = 0, count = 0;
    for (let size = 1; size <= primes.length && !best; size++) {
        const rec = (start, chosen) => {
            if (chosen.length === size) { const got = new Set(chosen.flatMap(minterms)); if (ones.every(m => got.has(m))) count++; return; }
            for (let i = start; i < primes.length; i++) rec(i + 1, [...chosen, primes[i]]);
        };
        rec(0, []); if (count) best = size;
    }
    return {primes: primes.length, terms: best, covers: count};
};

/* ================= CIRCUIT ANALYSIS ================= */
bankMore('circuits', 'advanced', [{
    title: 'The golden ladder',
    diagram: filterLadder('R', 'R', 3, true),
    text: T`An infinite ladder of $1\,\Omega$ resistors alternates series and shunt elements, starting with a series resistor. Find its input resistance, and the fraction $V_1/V_{\text{in}}$ of the input voltage that appears across the first shunt resistor.`,
    parts: [ex(T`$R_{\text{in}}$`, PHI, T`\dfrac{1+\sqrt5}{2}`, 'Ω'), ex(T`$V_1/V_{\text{in}}$`, 1 / PHI ** 2, T`\dfrac{3-\sqrt5}{2}`)],
    hints: [T`Removing the first section leaves the same infinite ladder, so $R = 1 + \dfrac{1\cdot R}{1 + R}$.`, T`The first shunt resistor is in parallel with the rest of the ladder, $1 \parallel R$, and in series with $1\,\Omega$.`],
    steps: [T`$R(1 + R) = (1 + R) + R \Rightarrow R^2 - R - 1 = 0$, so $R = \varphi = \dfrac{1 + \sqrt5}{2}\,\Omega$.`, T`$1 \parallel \varphi = \dfrac{\varphi}{1 + \varphi} = \dfrac{\varphi}{\varphi^2} = \dfrac1\varphi$.`, T`$\dfrac{V_1}{V_{\text{in}}} = \dfrac{1/\varphi}{\varphi} = \dfrac1{\varphi^2} = \dfrac{3 - \sqrt5}{2} \approx 0.382$: each section passes on $1/\varphi^2$ of its voltage.`],
    idea: 'An infinite network equals itself plus one section: self-similarity turns it into a quadratic, here the golden ratio.',
    prereq: 'Series and parallel resistors; quadratic equations.',
    verify: () => { // nodal analysis of a 40-section ladder driven at 1 V
        const n = 40, A = Array.from({length: n}, () => Array(n).fill(0)), b = Array(n).fill(0);
        for (let i = 0; i < n; i++) { A[i][i] += 2; if (i) A[i][i - 1] -= 1; else b[i] = 1; if (i < n - 1) { A[i][i] += 1; A[i][i + 1] -= 1; } }
        const V = NUM.solve(A, b); return [1 / (1 - V[0]), V[0]];
    }
}, {
    title: 'Twelve resistors on a cube',
    diagram: sketch('A cube whose twelve edges are 1 ohm resistors, with corner A, the adjacent corner C and the opposite corner B marked.',
        wire('M200 100H360V230H200ZM290 40H450V170M200 100L290 40M360 100L450 40M360 230L450 170') + guide('M290 40V170H450M200 230L290 170') +
        [[200, 100], [360, 100], [360, 230], [200, 230], [290, 40], [450, 40], [450, 170], [290, 170]].map(([x, y]) => dot(x, y)).join(''),
        [[180, 252, 'A'], [380, 252, 'C'], [470, 36, 'B'], [600, 136, 'each edge 1 Ω']], 265),
    text: T`Each edge of a cube is a $1\,\Omega$ resistor. Find the resistance between two opposite corners (A to B), and between two adjacent corners (A to C).`,
    parts: [ex('A to B', 5 / 6, T`\dfrac{5}{6}`, 'Ω'), ex('A to C', 7 / 12, T`\dfrac{7}{12}`, 'Ω')],
    hints: [T`For opposite corners, symmetry puts the three neighbours of A at one potential and the three neighbours of B at another: join them without changing anything.`, T`For adjacent corners, inject $1\,\text{A}$ at A and remove it at C. Each of the 12 edges carries a share; the direct edge A–C carries $7/12\,\text{A}$.`],
    steps: [T`Opposite corners: three parallel edges, then six, then three: $\tfrac{1}{3} + \tfrac{1}{6} + \tfrac{1}{3} = \tfrac{5}{6}\,\Omega$.`, T`Adjacent corners: by superposition of "$1\,\text{A}$ in at A, spread to all corners" and "$1\,\text{A}$ out at C", the edge A–C carries $\tfrac{7}{12}\,\text{A}$.`, T`So $V_{AC} = \tfrac{7}{12}\,\text{V}$ for $1\,\text{A}$: $R_{AC} = \tfrac{7}{12}\,\Omega$.`],
    idea: 'Symmetry finds equipotential nodes, which can be joined or cut freely; it turns a 3D network into a short series chain.',
    prereq: 'Kirchhoff’s laws; symmetry.',
    verify: () => { // Laplacian of the cube graph, node 0 grounded
        const solveTo = t => { const A = Array.from({length: 7}, () => Array(7).fill(0)), b = Array(7).fill(0);
            for (let i = 1; i < 8; i++) for (let j = 0; j < 8; j++) if ([1, 2, 4].includes(i ^ j)) { A[i - 1][i - 1] += 1; if (j) A[i - 1][j - 1] -= 1; }
            b[t - 1] = 1; return NUM.solve(A, b)[t - 1]; };
        return [solveTo(7), solveTo(1)];
    }
}, {
    title: 'Two capacitors and the missing energy',
    diagram: drawing(element('C', 150, 80, 150, 200, '2 µF, 10 V') + element('C', 560, 80, 560, 200, '2 µF, 0 V') + wire('M150 80H280M340 80H380M490 80H560M150 200H560') + wire('M280 80L312 62') + dot(280, 80) + dot(340, 80) + element('R', 380, 80, 490, 80, 'R') + dt(310, 52, 'switch'),
        'A charged capacitor connected through a switch and a resistor to an identical uncharged capacitor', 235),
    text: T`A $2\,\mu\text{F}$ capacitor charged to $10\,\text{V}$ is connected through a resistor $R$ to an identical uncharged capacitor. When the current has died away, what is the common voltage, and how much energy has the resistor dissipated?`,
    parts: [ex('Final voltage', 5, '5', 'V'), ex('Energy dissipated', 50, '50', 'µJ')],
    hints: [T`Charge is conserved: $Q = CV$ is shared between the two equal capacitors.`, T`Compare $\tfrac{1}{2}CV^2$ before with the total after.`],
    steps: [T`$Q = 2\,\mu\text{F}\times10\,\text{V} = 20\,\mu\text{C}$, shared over $4\,\mu\text{F}$: $V = 5\,\text{V}$.`, T`Before: $\tfrac{1}{2}\cdot2\,\mu\text{F}\cdot10^2 = 100\,\mu\text{J}$. After: $2\times\tfrac{1}{2}\cdot2\,\mu\text{F}\cdot5^2 = 50\,\mu\text{J}$.`, T`The resistor dissipates $50\,\mu\text{J}$, whatever its value.`],
    idea: 'Half the energy is lost whatever R is: a smaller resistor only makes the current larger and shorter. Even with R → 0 the energy leaves as radiation or a spark.',
    prereq: 'Capacitor energy; conservation of charge.',
    verify: () => { const C = 2e-6, R = 1000, tr = rk4((t, [v1, v2]) => { const i = (v1 - v2) / R; return [-i / C, i / C, i * i * R]; }, [10, 0, 0], 0, .02, 20000), y = tr[tr.length - 1][1]; return [y[1], y[2] * 1e6]; }
}, {
    title: 'RMS of a sine riding on DC',
    diagram: curve('time (cycles)', 'v (V)', [0, 2], [-1, 7], x => 3 + 4 * Math.sin(2 * Math.PI * x)),
    text: T`A voltage $v(t) = 3 + 4\sin\omega t$ volts is applied to a resistor. Find its RMS value, and its crest factor (peak divided by RMS).`,
    parts: [ex('RMS value', Math.sqrt(17), T`\sqrt{17}`, 'V'), ex('Crest factor', 7 / Math.sqrt(17), T`7/\sqrt{17}`)],
    hints: [T`$v^2 = 9 + 24\sin\omega t + 16\sin^2\omega t$; average each term over a period.`, T`The cross term averages to zero, so the mean squares of the DC and the sine simply add.`],
    steps: [T`$\overline{v^2} = 9 + 0 + 16\cdot\tfrac{1}{2} = 17$, so $V_{\text{rms}} = \sqrt{17} \approx 4.12\,\text{V}$.`, T`The peak is $3 + 4 = 7\,\text{V}$, so the crest factor is $7/\sqrt{17} \approx 1.70$.`],
    idea: 'Components at different frequencies (DC counts as one) are orthogonal: their powers add, not their amplitudes.',
    prereq: 'RMS values; averages of sinusoids.',
    verify: () => { const ms = NUM.simpson(x => (3 + 4 * Math.sin(2 * Math.PI * x)) ** 2, 0, 1, 2000); let pk = 0; for (let i = 0; i <= 4000; i++) pk = Math.max(pk, 3 + 4 * Math.sin(2 * Math.PI * i / 4000)); return [Math.sqrt(ms), pk / Math.sqrt(ms)]; }
}, {
    title: 'Half-power points of a series resonance',
    diagram: curve('ω (rad/s)', '|I| / Imax', [0, 6], [0, 1], w => 2 / Math.hypot(2, w - 3 / Math.max(w, 1e-6))),
    text: T`A series circuit has $R = 2\,\Omega$, $L = 1\,\text{H}$ and $C = \tfrac{1}{3}\,\text{F}$, driven by a sine of fixed amplitude and variable frequency. Find the two frequencies at which the current falls to $1/\sqrt2$ of its peak, and the circuit's Q.`,
    parts: [ex(T`$\omega_1$`, 1, '1', 'rad/s'), ex(T`$\omega_2$`, 3, '3', 'rad/s'), ex('Q', Math.sqrt(3) / 2, T`\dfrac{\sqrt3}{2}`)],
    hints: [T`The current is $1/\sqrt2$ of its peak when $|X| = R$, i.e. $\omega L - \dfrac{1}{\omega C} = \pm R$.`, T`$\omega - 3/\omega = \pm2$ gives two quadratics.`],
    steps: [T`$\omega^2 - 2\omega - 3 = 0 \Rightarrow \omega_2 = 3$; $\omega^2 + 2\omega - 3 = 0 \Rightarrow \omega_1 = 1\,\text{rad/s}$.`, T`The resonance $\omega_0 = 1/\sqrt{LC} = \sqrt3$ is their geometric mean: $\sqrt{1\cdot3}$.`, T`$Q = \dfrac{\omega_0}{\omega_2 - \omega_1} = \dfrac{\sqrt3}{2}$, which also equals $\omega_0L/R$.`],
    idea: 'The half-power points sit symmetrically on a logarithmic scale: resonance is their geometric mean, and the bandwidth is exactly R/L.',
    prereq: 'Impedance of R, L and C; resonance.',
    verify: () => { const I = w => 1 / Math.hypot(2, w - 3 / w), half = .5 / Math.SQRT2, w1 = NUM.bisect(w => I(w) - half, .01, Math.sqrt(3)), w2 = NUM.bisect(w => I(w) - half, Math.sqrt(3), 50); return [w1, w2, Math.sqrt(3) / (w2 - w1)]; }
}, {
    title: 'An unbalanced Wheatstone bridge',
    diagram: drawing(element('R', 360, 50, 220, 140) + element('R', 220, 140, 360, 230) + element('R', 360, 50, 500, 140) + element('R', 500, 140, 360, 230) + element('R', 220, 140, 500, 140) +
        wire('M360 50V20H80M80 250H360V230') + element('DC', 80, 20, 80, 250) + dot(220, 140) + dot(500, 140) + dt(266, 80, '1 Ω') + dt(266, 214, '2 Ω') + dt(456, 80, '3 Ω') + dt(456, 214, '4 Ω') + dt(360, 168, 'G 1 Ω') + dt(40, 140, '10 V') + dt(200, 128, 'a') + dt(520, 128, 'b'),
        'A Wheatstone bridge of 1, 2, 3 and 4 ohm arms fed from 10 volts, with a 1 ohm galvanometer across the middle', 265),
    text: T`A $10\,\text{V}$ source feeds a bridge: node a divides it with $1\,\Omega$ above and $2\,\Omega$ below, node b with $3\,\Omega$ above and $4\,\Omega$ below. A galvanometer of $1\,\Omega$ joins a and b. Find the Thevenin equivalent seen by the galvanometer, and the current through it.`,
    parts: [ex(T`$V_{\text{th}}$`, 20 / 21, T`\dfrac{20}{21}`, 'V'), ex(T`$R_{\text{th}}$`, 50 / 21, T`\dfrac{50}{21}`, 'Ω'), ex('Galvanometer current', 20 / 71, T`\dfrac{20}{71}`, 'A')],
    hints: [T`With the galvanometer removed, each side is a plain divider.`, T`With the source shorted, the top and bottom nodes merge: $R_{\text{th}} = (1\parallel2) + (3\parallel4)$.`],
    steps: [T`$V_a = 10\cdot\tfrac{2}{3} = \tfrac{20}{3}$, $V_b = 10\cdot\tfrac{4}{7} = \tfrac{40}{7}$, so $V_{\text{th}} = \tfrac{20}{21}\,\text{V}$.`, T`$R_{\text{th}} = \tfrac{2}{3} + \tfrac{12}{7} = \tfrac{50}{21}\,\Omega$.`, T`$I_g = \dfrac{20/21}{50/21 + 1} = \dfrac{20}{71}\,\text{A} \approx 0.28\,\text{A}$.`],
    idea: 'Thevenin’s theorem reduces any linear network to one source and one resistor as seen from a pair of terminals, here the meter.',
    prereq: 'Voltage dividers; Thevenin equivalents.',
    verify: () => { // nodal analysis with and without the galvanometer
        const withG = NUM.solve([[1 + .5 + 1, -1], [-1, 1 / 3 + 1 / 4 + 1]], [10, 10 / 3]), open = NUM.solve([[1.5, 0], [0, 1 / 3 + 1 / 4]], [10, 10 / 3]);
        const vth = open[0] - open[1], ig = withG[0] - withG[1]; return [vth, vth / ig - 1, ig];
    }
}, {
    title: 'Resistance on an infinite grid',
    diagram: sketch('Part of an infinite square grid of resistors, with neighbouring nodes A and B and the diagonal node C marked.',
        Array.from({length: 7}, (_, i) => wire(`M${150 + i * 70} 40V220`)).join('') + Array.from({length: 4}, (_, j) => wire(`M130 ${40 + j * 60}H590`)).join('') + dot(360, 160) + dot(430, 160) + dot(430, 100),
        [[344, 184, 'A'], [450, 184, 'B'], [450, 92, 'C'], [360, 248, 'each link 1 Ω, extending without end']], 260),
    text: T`An infinite square grid has a $1\,\Omega$ resistor on every link. Find the resistance between two neighbouring nodes (A to B), and between two diagonal neighbours (A to C).`,
    parts: [ex('A to B', .5, T`\dfrac{1}{2}`, 'Ω'), ex('A to C', 2 / Math.PI, T`\dfrac{2}{\pi}`, 'Ω')],
    hints: [T`Inject $1\,\text{A}$ at A and let it spread to infinity: by symmetry a quarter flows through each of A's four links. Now superpose $1\,\text{A}$ drawn out at B from infinity.`, T`The diagonal case needs the lattice Green's function: $R = \dfrac{1}{\pi^2}\displaystyle\int_0^\pi\!\!\int_0^\pi\frac{1 - \cos x\cos y}{2 - \cos x - \cos y}\,dx\,dy$.`],
    steps: [T`Each source alone puts $\tfrac{1}{4}\,\text{A}$ through link AB, in the same direction: $\tfrac{1}{2}\,\text{A}$ in all.`, T`So $V_{AB} = \tfrac{1}{2}\,\text{V}$ for $1\,\text{A}$: $R_{AB} = \tfrac{1}{2}\,\Omega$.`, T`The diagonal integral evaluates to $\dfrac2\pi \approx 0.637\,\Omega$: farther, but not twice as far.`],
    idea: 'Superposing two symmetric half-problems (current in at A, current out at B) solves a problem with no symmetry of its own.',
    prereq: 'Superposition; symmetry.',
    verify: () => { // conjugate gradients on a large grid grounded at its edge, with +1 A at A and −1 A at the other node
        const M = 81, c = 40, idx = (i, j) => i * M + j;
        const R = (di, dj) => { const b = new Float64Array(M * M); b[idx(c, c)] = 1; b[idx(c + di, c + dj)] = -1;
            const Ap = v => { const o = new Float64Array(M * M); for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) { const k = idx(i, j); let s = 4 * v[k]; if (i) s -= v[k - M]; if (i < M - 1) s -= v[k + M]; if (j) s -= v[k - 1]; if (j < M - 1) s -= v[k + 1]; o[k] = s; } return o; };
            const x = new Float64Array(M * M), r = Float64Array.from(b), p = Float64Array.from(b); let rr = r.reduce((s, v) => s + v * v, 0);
            for (let it = 0; it < 3000 && rr > 1e-24; it++) { const q = Ap(p); const a = rr / p.reduce((s, v, k) => s + v * q[k], 0); for (let k = 0; k < x.length; k++) { x[k] += a * p[k]; r[k] -= a * q[k]; } const nr = r.reduce((s, v) => s + v * v, 0); for (let k = 0; k < p.length; k++) p[k] = r[k] + nr / rr * p[k]; rr = nr; }
            return x[idx(c, c)] - x[idx(c + di, c + dj)]; };
        return [R(0, 1), R(1, 1)];
    }
}, {
    title: 'The three-voltmeter method',
    diagram: drawing(element('AC', 110, 80, 110, 200) + element('R', 110, 80, 330, 80) + wire('M330 80H500M110 200H500') + element('L', 500, 80, 500, 200) + dt(220, 56, '6 Ω: reads 6 V') + note(530, 146, 'coil: reads 5 V') + dt(110, 236, 'supply: reads 10 V'),
        'An AC supply driving a 6 ohm resistor in series with a coil, with voltmeter readings across the supply, the resistor and the coil', 250),
    text: T`To measure a coil's power, it is put in series with a $6\,\Omega$ resistor across an AC supply. Voltmeters read $10\,\text{V}$ across the supply, $6\,\text{V}$ across the resistor and $5\,\text{V}$ across the coil. Find the power the coil absorbs and its power factor.`,
    parts: [ex('Coil power', 13 / 4, T`\dfrac{13}{4}`, 'W'), ex('Coil power factor', 13 / 20, T`\dfrac{13}{20}`)],
    hints: [T`The three voltages form a triangle of phasors: $\mathbf V = \mathbf V_R + \mathbf V_c$.`, T`Law of cosines: $V^2 = V_R^2 + V_c^2 + 2V_RV_c\cos\varphi$, where $\varphi$ is the coil's phase angle.`],
    steps: [T`$\cos\varphi = \dfrac{100 - 36 - 25}{2\cdot6\cdot5} = \dfrac{39}{60} = \dfrac{13}{20}$.`, T`The current is $6/6 = 1\,\text{A}$, so $P = V_cI\cos\varphi = 5\cdot1\cdot\tfrac{13}{20} = \tfrac{13}{4}\,\text{W}$.`, T`Equivalently $P = \dfrac{V^2 - V_R^2 - V_c^2}{2R}$: three magnitudes and one resistor give the power.`],
    idea: 'Magnitudes alone fix a phasor triangle, so three voltmeters measure phase, and hence power, without a wattmeter.',
    prereq: 'Phasors; the law of cosines.',
    verify: () => { const r = NUM.bisect(r => (6 + r) ** 2 + 25 - r * r - 100, 0, 5); return [r, r / 5]; } // coil r + jx with r² + x² = 25 and |6 + r + jx| = 10
}, {
    title: 'Switching on an RL circuit',
    diagram: curve('time t (s)', 'current i (A)', [0, 12], [-.8, .8], t => (Math.sin(t) - Math.cos(t) + Math.exp(-t)) / 2),
    text: T`At $t = 0$ a voltage $v = \sin t$ (volts, $t$ in seconds) is switched onto a series circuit with $R = 1\,\Omega$ and $L = 1\,\text{H}$, initially without current. Find the amplitude of the steady-state current, and the current at $t = \pi\,\text{s}$.`,
    parts: [ex('Steady-state amplitude', Math.SQRT1_2, T`\dfrac{1}{\sqrt2}`, 'A'), ex(T`$i(\pi)$`, (1 + Math.exp(-Math.PI)) / 2, T`(1+e^{-\pi})/2`, 'A')],
    hints: [T`Steady state: $|Z| = |1 + j| = \sqrt2$ and the current lags by $45^\circ$: $i_{ss} = \tfrac{1}{2}(\sin t - \cos t)$.`, T`Add the natural response $Ae^{-t}$ and choose $A$ so that $i(0) = 0$.`],
    steps: [T`$i(t) = \tfrac{1}{2}(\sin t - \cos t) + Ae^{-t}$; $i(0) = -\tfrac{1}{2} + A = 0 \Rightarrow A = \tfrac{1}{2}$.`, T`Amplitude of the steady part: $\tfrac{1}{\sqrt2}\,\text{A}$.`, T`$i(\pi) = \tfrac{1}{2}(0 + 1) + \tfrac{1}{2}e^{-\pi} = \dfrac{1 + e^{-\pi}}{2} \approx 0.522\,\text{A}$, above the steady amplitude for a moment.`],
    idea: 'A switched-on AC circuit carries a decaying DC offset that makes up the difference between the steady-state current and the initial current.',
    prereq: 'First-order transients; phasors.',
    verify: () => { const tr = rk4((t, [i]) => [Math.sin(t) - i], [0], 0, Math.PI, 4000), late = rk4((t, [i]) => [Math.sin(t) - i], [0], 0, 60, 40000); let m = 0; for (const [t, [i]] of late) if (t > 50) m = Math.max(m, Math.abs(i)); return [m, tr[tr.length - 1][1][0]]; }
}, {
    title: 'Measuring mutual inductance',
    diagram: drawing(element('L', 280, 70, 280, 200) + element('L', 440, 70, 440, 200) + dot(266, 82) + dot(426, 82) + dt(220, 140, '1 H') + dt(500, 140, '4 H') + arrow(310, 135, 410, 135) + arrow(410, 135, 310, 135) + dt(360, 122, 'M') + dt(360, 236, 'series aiding: 7 H · series opposing: 3 H'),
        'Two coupled coils of 1 and 4 henries, with dots marking their winding sense', 250),
    text: T`Coils of $1\,\text{H}$ and $4\,\text{H}$ are magnetically coupled. Connected in series one way they measure $7\,\text{H}$; reversing one coil gives $3\,\text{H}$. Find the mutual inductance $M$ and the coupling coefficient $k$.`,
    parts: [ex(T`$M$`, 1, '1', 'H'), ex(T`$k$`, .5, T`\dfrac{1}{2}`)],
    hints: [T`Series aiding: $L_1 + L_2 + 2M$. Series opposing: $L_1 + L_2 - 2M$.`, T`$k = M/\sqrt{L_1L_2}$.`],
    steps: [T`Subtracting: $4M = 7 - 3$, so $M = 1\,\text{H}$ (and indeed $L_1 + L_2 = 5$).`, T`$k = \dfrac{1}{\sqrt{1\cdot4}} = \dfrac{1}{2}$.`],
    idea: 'Two series measurements, one with a coil reversed, separate self and mutual inductance; the difference is 4M.',
    prereq: 'Mutual inductance; the dot convention.',
    verify: () => { const Ls = (M, s) => [1, s].reduce((acc, a, i) => acc + [1, s].reduce((b, c, j) => b + a * c * [[1, M], [M, 4]][i][j], 0), 0), M = NUM.bisect(m => Ls(m, 1) - 7, 0, 2); return [M, M / Math.sqrt(1 * 4)]; } // eᵀLe for e = (1, ±1)
}, {
    title: 'Three unequal batteries in parallel',
    diagram: drawing(wire('M140 50H600M140 230H600') + [[140, '12 V', '1 Ω'], [290, '10 V', '2 Ω'], [440, '8 V', '4 Ω']].map(([x, e, r]) => element('R', x, 50, x, 130, r) + element('DC', x, 130, x, 230, e) + dot(x, 50) + dot(x, 230)).join('') + element('R', 600, 50, 600, 230, 'load 4 Ω'),
        'Three batteries of 12, 10 and 8 volts with internal resistances 1, 2 and 4 ohms in parallel with a 4 ohm load', 250),
    text: T`Batteries of $12\,\text{V}$, $10\,\text{V}$ and $8\,\text{V}$, with internal resistances $1\,\Omega$, $2\,\Omega$ and $4\,\Omega$, are connected in parallel across a $4\,\Omega$ load. Find the common terminal voltage, the load current, and the current flowing into the $8\,\text{V}$ battery.`,
    parts: [ex('Terminal voltage', 9.5, T`\dfrac{19}{2}`, 'V'), ex('Load current', 19 / 8, T`\dfrac{19}{8}`, 'A'), ex(T`Current into the $8\,\text{V}$ battery`, 3 / 8, T`\dfrac{3}{8}`, 'A')],
    hints: [T`Millman's theorem: $V = \dfrac{\sum E_k/R_k}{\sum 1/R_k}$, counting the load as a branch with $E = 0$.`, T`A branch whose EMF is below $V$ is being charged.`],
    steps: [T`$V = \dfrac{12 + 5 + 2}{1 + \tfrac{1}{2} + \tfrac{1}{4} + \tfrac{1}{4}} = \dfrac{19}{2}\,\text{V}$.`, T`Load: $9.5/4 = \tfrac{19}{8}\,\text{A}$.`, T`The $8\,\text{V}$ battery: $(9.5 - 8)/4 = \tfrac{3}{8}\,\text{A}$ flows into it: the others charge it.`],
    idea: 'Paralleled sources share by conductance, and a weak cell does not help: it becomes a load and is charged by the others.',
    prereq: 'Nodal analysis; Millman’s theorem.',
    verify: () => { const V = NUM.bisect(v => (12 - v) / 1 + (10 - v) / 2 + (8 - v) / 4 - v / 4, 0, 12); return [V, V / 4, (V - 8) / 4]; }
}]);

/* ================= ELECTRONICS ================= */
bankMore('electronics', 'advanced', [{
    title: 'Sixty millivolts per decade',
    diagram: curve('diode voltage V (V)', 'current (mA)', [.5, .7], [0, 15], v => 1e-14 * Math.exp(v / .025) * 1e3),
    text: T`A silicon diode follows $I = I_s(e^{V/V_T} - 1)$ with $V_T = 25\,\text{mV}$. By how much must its forward voltage rise to increase the current tenfold, and what is its small-signal resistance at $1\,\text{mA}$?`,
    parts: [ex('Rise for ten times the current', 25 * Math.LN10, T`25\ln10`, 'mV'), ex(T`$r_d$ at $1\,\text{mA}$`, 25, '25', 'Ω')],
    hints: [T`Well above $I_s$, $V = V_T\ln(I/I_s)$.`, T`$r_d = dV/dI = V_T/I$.`],
    steps: [T`$\Delta V = V_T\ln10 = 25\ln10 \approx 57.6\,\text{mV}$, the rule of thumb "60 mV per decade".`, T`$r_d = 25\,\text{mV}/1\,\text{mA} = 25\,\Omega$, whatever the diode.`],
    idea: 'An exponential device has a fixed voltage step per decade of current and a small-signal resistance set only by the current through it.',
    prereq: 'The diode equation; logarithms.',
    verify: () => { const Is = 1e-14, V = I => .025 * Math.log(I / Is + 1); return [(V(1e-2) - V(1e-3)) * 1e3, (V(1e-3 + 1e-9) - V(1e-3 - 1e-9)) / 2e-9]; }
}, {
    title: 'How finite gain spoils an inverting amplifier',
    diagram: drawing(bkOpAmp(300, 140) + element('R', 110, 110, 240, 110, '1 kΩ') + wire('M240 110H300M240 110V40H300M440 40H460V140M420 140H520M300 170H260v40') + element('R', 300, 40, 440, 40, '9 kΩ') + ground(260, 210) + dot(240, 110) + dot(460, 140) + dt(90, 100, 'in') + dt(540, 146, 'out') + dt(360, 236, 'open-loop gain 1000'),
        'An inverting amplifier with a 1 kilohm input resistor and a 9 kilohm feedback resistor around an op-amp of gain 1000', 250),
    text: T`An inverting amplifier uses $R_1 = 1\,\text{k}\Omega$ and $R_2 = 9\,\text{k}\Omega$, so the ideal gain is $-9$. The op-amp's open-loop gain is only $A = 1000$. Find the actual closed-loop gain and its shortfall from the ideal, in percent.`,
    parts: [ex('Closed-loop gain', -900 / 101, T`-\dfrac{900}{101}`), ex('Shortfall', 100 / 101, T`\dfrac{100}{101}`, '%')],
    hints: [T`With $v_{\text{out}} = -Av_-$ and $v_- = \dfrac{R_2v_{\text{in}} + R_1v_{\text{out}}}{R_1 + R_2}$, solve for $v_{\text{out}}/v_{\text{in}}$.`, T`The result is $-\dfrac{R_2/R_1}{1 + (1 + R_2/R_1)/A}$: the noise gain $1 + R_2/R_1$ divides $A$.`],
    steps: [T`$G = -\dfrac{9}{1 + 10/1000} = -\dfrac{900}{101} \approx -8.911$.`, T`Shortfall: $1 - \dfrac{100}{101} = \dfrac{1}{101}$, i.e. $\dfrac{100}{101}\,\% \approx 0.99\,\%$.`],
    idea: 'The error of a feedback amplifier is roughly the noise gain divided by the open-loop gain, not the signal gain.',
    prereq: 'Op-amp feedback; solving linear equations.',
    verify: () => { const [, vo] = NUM.solve([[1, -1 / 10], [1000, 1]], [9 / 10, 0]); return [vo, 100 * (1 - Math.abs(vo) / 9)]; } // v₋ − v_out/10 = 9 v_in/10, v_out + 1000 v₋ = 0, v_in = 1
}, {
    title: 'Splitting the gain between two op-amps',
    diagram: bkPlot('log₁₀ frequency (Hz)', 'gain (dB)', [2, 7], [0, 45], [f => 20 * Math.log10(100 / (1 + (10 ** f / 1e5) ** 2)), f => 20 * Math.log10(100 / Math.hypot(1, 10 ** f / 1e4))], [[5.3, 20 * Math.log10(100 / (1 + 10 ** .6)), 'two stages of ×10', 10, -10], [4.3, 20 * Math.log10(100 / Math.hypot(1, 10 ** .3)), 'one stage of ×100', -150, 24]]),
    text: T`Op-amps with a gain–bandwidth product of $1\,\text{MHz}$ (one dominant pole) are used for a total gain of 100. Find the $-3\,\text{dB}$ bandwidth of one non-inverting stage with gain 100, and of two cascaded stages with gain 10 each.`,
    parts: [ex('One stage', 10, '10', 'kHz'), ex('Two stages', 100 * Math.sqrt(Math.SQRT2 - 1), T`100\sqrt{\sqrt2-1}`, 'kHz')],
    hints: [T`Each stage's bandwidth is GBW divided by its gain.`, T`Two identical poles at $f_1$: $|H| \propto \dfrac{1}{1 + (f/f_1)^2}$. Set that to $1/\sqrt2$.`],
    steps: [T`One stage: $1\,\text{MHz}/100 = 10\,\text{kHz}$.`, T`Two stages: each has $f_1 = 100\,\text{kHz}$; $1 + (f/f_1)^2 = \sqrt2$ gives $f = f_1\sqrt{\sqrt2 - 1}$.`, T`$f = 100\sqrt{\sqrt2 - 1} \approx 64.4\,\text{kHz}$: more than six times wider.`],
    idea: 'Gain–bandwidth is a budget per stage: spreading the gain over several stages buys bandwidth.',
    prereq: 'First-order frequency response; op-amp feedback.',
    verify: () => { const A = f => cd(cx(1e7), cx(1, f / .1)), H = (f, b) => cd(A(f), ca(cx(1), cm(A(f), cx(b)))), bw = (g, n) => NUM.bisect(f => (cabs(H(f, 1 / g)) / cabs(H(0, 1 / g))) ** n - Math.SQRT1_2, 1, 1e7); return [bw(100, 1) / 1e3, bw(10, 2) / 1e3]; }
}, {
    title: 'A current mirror with finite β',
    diagram: drawing(bkMirror(290, bkBjt(290, 150)) + bkBjt(430, 150) + wire('M330 150H390M266 105H360V150M266 210V230H454V210') + arrow(266, 24, 266, 90) + arrow(454, 24, 454, 90) + dot(360, 150) + dt(266, 16, 'Iref') + dt(454, 16, 'Iout') + dt(220, 156, 'Q1') + dt(500, 156, 'Q2') + ground(360, 230),
        'A two-transistor current mirror: the reference transistor is diode-connected and shares its base with the output transistor', 250),
    text: T`A basic current mirror uses two matched transistors with $\beta = 100$; the reference transistor is diode-connected. Find the ratio $I_{\text{out}}/I_{\text{ref}}$. Adding a third transistor to supply the base currents (a "beta helper") changes the ratio to what?`,
    parts: [ex('Basic mirror', 50 / 51, T`\dfrac{50}{51}`), ex('With a beta helper', 5050 / 5051, T`\dfrac{5050}{5051}`)],
    hints: [T`Equal $V_{BE}$ gives equal collector currents $I_C$; the reference must also supply both base currents, $2I_C/\beta$.`, T`With a helper, the reference only supplies the helper's base current, $\dfrac{2I_C/\beta}{\beta + 1}$.`],
    steps: [T`$I_{\text{ref}} = I_C\left(1 + \tfrac2\beta\right) \Rightarrow \dfrac{I_{\text{out}}}{I_{\text{ref}}} = \dfrac{\beta}{\beta + 2} = \dfrac{50}{51} \approx 0.980$.`, T`Helper: $I_{\text{ref}} = I_C\left(1 + \tfrac{2}{\beta(\beta + 1)}\right)$, so the ratio is $\dfrac{10100}{10102} = \dfrac{5050}{5051} \approx 0.9998$.`],
    idea: 'Base current is the mirror’s error term; buffering it with another transistor divides the error by β again.',
    prereq: 'BJT currents; Kirchhoff’s current law.',
    verify: () => { const Is = 1e-15, b = 100, ic = v => Is * Math.exp(v / .025), V1 = NUM.bisect(v => ic(v) * (1 + 2 / b) - 1e-3, .3, 1), V2 = NUM.bisect(v => ic(v) + 2 * ic(v) / b / (b + 1) - 1e-3, .3, 1); return [ic(V1) / 1e-3, ic(V2) / 1e-3]; }
}, {
    title: 'Sizing a Zener regulator',
    diagram: drawing(element('DC', 90, 70, 90, 210, '12 V') + element('R', 90, 70, 300, 70, '100 Ω') + wire('M300 70H560M90 210H560') + element('diode', 380, 210, 380, 70, '5 V Zener') + element('R', 560, 70, 560, 210, 'load') + dot(380, 70) + dot(380, 210),
        'A 12 volt supply feeding a 5 volt Zener diode through 100 ohms, with a load in parallel with the Zener', 240),
    text: T`A $12\,\text{V}$ supply feeds an ideal $5\,\text{V}$ Zener diode through $100\,\Omega$, with a load across the Zener. While it regulates, what current does the supply deliver? What is the smallest load resistance that still keeps the Zener conducting, and how much does the Zener dissipate with no load?`,
    parts: [ex('Supply current', 70, '70', 'mA'), ex('Minimum load resistance', 500 / 7, T`\dfrac{500}{7}`, 'Ω'), ex('Zener power at no load', .35, T`\dfrac{7}{20}`, 'W')],
    hints: [T`While the Zener conducts, the output is $5\,\text{V}$, so the resistor carries $(12 - 5)/100$.`, T`That current divides between the Zener and the load; the load can take all of it at most.`],
    steps: [T`$I = 7\,\text{V}/100\,\Omega = 70\,\text{mA}$, fixed while regulating.`, T`All of it into the load at $5\,\text{V}$: $R_{\min} = 5/0.07 = \tfrac{500}{7} \approx 71.4\,\Omega$.`, T`No load: the Zener takes all $70\,\text{mA}$: $P = 5 \times 0.07 = 0.35\,\text{W}$.`],
    idea: 'A shunt regulator draws a constant current and steers it between load and Zener; the Zener must survive the no-load case.',
    prereq: 'Ohm’s law; Zener diodes.',
    verify: () => { const node = RL => NUM.bisect(v => (12 - v) / 100 - Math.max(0, (v - 5) / 1e-4) - v / RL, 0, 12), Rmin = NUM.bisect(RL => node(RL) - 4.99999, 10, 200); return [(12 - node(1e12)) / 100 * 1e3, Rmin, node(1e12) * (12 - node(1e12)) / 100]; }
}, {
    title: 'Gain set by the collector drop',
    diagram: drawing(bkBjt(330, 140) + element('R', 354, 80, 354, 20, '5 kΩ') + element('R', 354, 200, 354, 250, 'RE') + arrow(150, 140, 290, 140) + wire('M354 20H560M354 80H520') + dt(130, 132, 'in') + dt(580, 26, 'VCC') + dt(540, 74, 'out') + ground(354, 250),
        'A common-emitter amplifier with a 5 kilohm collector resistor and an optional emitter resistor', 270),
    text: T`A common-emitter stage runs at $I_C = 1\,\text{mA}$ with $R_C = 5\,\text{k}\Omega$ ($V_T = 25\,\text{mV}$, $\beta$ large). Find its small-signal voltage gain with the emitter grounded, and with an unbypassed emitter resistor $R_E = 100\,\Omega$.`,
    parts: [ex('Gain, emitter grounded', -200, '-200'), ex(T`Gain with $R_E$`, -40, '-40')],
    hints: [T`$g_m = I_C/V_T$ and $A_v = -g_mR_C = -I_CR_C/V_T$.`, T`With $R_E$: $A_v = -\dfrac{R_C}{r_e + R_E}$ with $r_e = 1/g_m = 25\,\Omega$.`],
    steps: [T`$A_v = -\dfrac{5\,\text{V}}{25\,\text{mV}} = -200$: only the DC drop across $R_C$ matters.`, T`With $R_E$: $-\dfrac{5000}{25 + 100} = -40$, much less dependent on the transistor.`],
    idea: 'A bipolar stage’s gain is the collector’s DC drop divided by the thermal voltage; emitter degeneration trades gain for predictability.',
    prereq: 'Transconductance; small-signal models.',
    verify: () => { const Is = 1e-15, Vb0 = .025 * Math.log(1e-3 / Is), vc = vb => 10 - Is * Math.exp(vb / .025) * 5000, ic = vb => NUM.bisect(i => .025 * Math.log(i / Is) + i * 100 - vb, 1e-9, 1e-2, 200), Vb1 = Vb0 + 1e-3 * 100, h = 1e-6;
        return [(vc(Vb0 + h) - vc(Vb0 - h)) / (2 * h), -(ic(Vb1 + h) - ic(Vb1 - h)) * 5000 / (2 * h)]; }
}, {
    title: 'An op-amp relaxation oscillator',
    diagram: drawing(bkOpAmp(300, 140) + wire('M420 140H520M480 140V40M230 40V110H300M520 215H270V170H300') + element('R', 480, 40, 230, 40, 'R') + element('C', 230, 110, 230, 215, 'C') + element('R', 520, 140, 520, 215, '40 kΩ') + element('R', 520, 215, 520, 262, '10 kΩ') +
        ground(230, 215) + ground(520, 262) + dot(480, 140) + dot(520, 215) + dot(230, 110) + dt(580, 134, '±10 V'),
        'An op-amp comparator with positive feedback through 40 and 10 kilohms, and an RC network from output to the inverting input', 285),
    text: T`An op-amp whose output swings between $\pm10\,\text{V}$ has positive feedback from a divider of $40\,\text{k}\Omega$ (output to $+$) and $10\,\text{k}\Omega$ ($+$ to ground), and charges a capacitor on its $-$ input through $R$, with $RC = 1\,\text{ms}$. Find the switching thresholds and the period of oscillation.`,
    parts: [ex('Threshold magnitude', 2, '2', 'V'), ex('Period', 2 * Math.log(1.5), T`2\ln\tfrac{3}{2}`, 'ms')],
    hints: [T`The $+$ input sits at $\beta V_o$ with $\beta = \dfrac{10}{10 + 40}$.`, T`The capacitor charges from $-2$ towards $+10\,\text{V}$ and switches at $+2$: $t = RC\ln\dfrac{10 + 2}{10 - 2}$.`],
    steps: [T`$\beta = \tfrac{1}{5}$, so the thresholds are $\pm2\,\text{V}$.`, T`Each half-cycle: $RC\ln\dfrac{12}{8} = RC\ln\tfrac{3}{2}$.`, T`Period $T = 2RC\ln\tfrac{3}{2} = 2\ln\tfrac{3}{2}\,\text{ms} \approx 0.811\,\text{ms}$.`],
    idea: 'Hysteresis plus an RC timer makes an oscillator; the period depends on a ratio of resistors, not on the supply.',
    prereq: 'Comparators with hysteresis; RC charging.',
    verify: () => { let vc = -2, vo = 10, t = 0; const dt = 1e-7, flips = []; while (flips.length < 5) { const prev = vc; vc += (vo - vc) * dt / 1e-3; t += dt; if (vo > 0 && vc >= 2 || vo < 0 && vc <= -2) { flips.push(t - dt * (vc - vo / 5) / (vc - prev)); vo = -vo; } } return [Math.abs(vo / 5), (flips[4] - flips[2]) * 1e3]; }
}, {
    title: 'A MOSFET in saturation',
    diagram: drawing(wire('M300 100V180M314 90V190M314 110H360V90M314 170H360V250M240 140H300M360 20H560M360 90H520') + element('R', 360, 90, 360, 20, '2 kΩ') + dot(360, 90) + dt(620, 26, 'VDD = 10 V') + dt(540, 84, 'out') + dt(190, 146, 'VGS = 3 V') + ground(360, 250),
        'An n-channel MOSFET with a 2 kilohm drain resistor from a 10 volt supply, driven with 3 volts on its gate', 270),
    text: T`An n-channel MOSFET with $V_T = 1\,\text{V}$ follows $I_D = \tfrac{1}{2}k(V_{GS} - V_T)^2$ in saturation, with $k = 1\,\text{mA/V}^2$. It has a $2\,\text{k}\Omega$ drain resistor from $10\,\text{V}$ and $V_{GS} = 3\,\text{V}$. Find the drain current, the transconductance and the small-signal voltage gain.`,
    parts: [ex(T`$I_D$`, 2, '2', 'mA'), ex(T`$g_m$`, 2, '2', 'mS'), ex('Voltage gain', -4, '-4')],
    hints: [T`Check saturation: $V_{DS} \ge V_{GS} - V_T$.`, T`$g_m = \dfrac{dI_D}{dV_{GS}} = k(V_{GS} - V_T) = \dfrac{2I_D}{V_{GS} - V_T}$.`],
    steps: [T`$I_D = \tfrac{1}{2}\cdot1\cdot2^2 = 2\,\text{mA}$; $V_{DS} = 10 - 4 = 6\,\text{V} > 2\,\text{V}$: saturated.`, T`$g_m = 1\times2 = 2\,\text{mS}$.`, T`$A_v = -g_mR_D = -2\,\text{mS}\times2\,\text{k}\Omega = -4$.`],
    idea: 'For a square-law device g_m = 2I_D/V_ov: at the same current a MOSFET gives far less gain than a BJT, whose equivalent is I/V_T.',
    prereq: 'MOSFET square law; small-signal gain.',
    verify: () => { const id = v => .5 * 1e-3 * (v - 1) ** 2, vd = v => 10 - id(v) * 2000, h = 1e-6; return [id(3) * 1e3, (id(3 + h) - id(3 - h)) / (2 * h) * 1e3, (vd(3 + h) - vd(3 - h)) / (2 * h)]; }
}, {
    title: 'Slew rate limits a sine wave',
    diagram: curve('time (µs)', 'output (V)', [0, 100], [-10, 10], t => 10 * Math.sin(2 * Math.PI * t / 62.83)),
    text: T`An op-amp's output can change no faster than its slew rate, $1\,\text{V}/\mu\text{s}$. What is the highest frequency at which it can deliver an undistorted $10\,\text{V}$ peak sine wave, and the largest undistorted peak amplitude at $100\,\text{kHz}$?`,
    parts: [ex('Full-power frequency', 5e4 / Math.PI, T`\dfrac{50000}{\pi}`, 'Hz'), ex(T`Peak amplitude at $100\,\text{kHz}$`, 5 / Math.PI, T`\dfrac{5}{\pi}`, 'V')],
    hints: [T`A sine $V_p\sin2\pi ft$ changes fastest at its zero crossings, at $2\pi fV_p$.`, T`Set $2\pi fV_p$ equal to the slew rate.`],
    steps: [T`$f = \dfrac{10^6\,\text{V/s}}{2\pi\times10\,\text{V}} = \dfrac{50000}{\pi} \approx 15.9\,\text{kHz}$.`, T`At $100\,\text{kHz}$: $V_p = \dfrac{10^6}{2\pi\times10^5} = \dfrac5\pi \approx 1.59\,\text{V}$.`],
    idea: 'Slew rate limits the product of amplitude and frequency, so large signals have a much smaller bandwidth than small ones.',
    prereq: 'Derivatives of sinusoids.',
    verify: () => { const slope = (A, f) => { let m = 0; for (let i = 0; i < 2000; i++) { const t = i / (2000 * f); m = Math.max(m, Math.abs(A * 2 * Math.PI * f * Math.cos(2 * Math.PI * f * t))); } return m; }; return [NUM.bisect(f => slope(10, f) - 1e6, 100, 1e6, 80), NUM.bisect(A => slope(A, 1e5) - 1e6, .01, 10, 80)]; }
}, {
    title: 'The Miller effect',
    diagram: drawing(bkOpAmp(330, 140) + element('R', 120, 110, 260, 110, '10 kΩ') + wire('M260 110H330M260 110V40H330M480 40H500V140M450 140H560M330 170H290v40') + element('C', 330, 40, 480, 40, '1 pF') + ground(290, 210) + dot(260, 110) + dot(500, 140) + dt(100, 102, 'source') + dt(390, 146, '−100') + dt(580, 146, 'out'),
        'An inverting amplifier of gain minus 100 with a 1 picofarad capacitor from output to input, driven through 10 kilohms', 245),
    text: T`An inverting amplifier with gain $-100$ has a parasitic $1\,\text{pF}$ capacitance from its output back to its input, and is driven from a $10\,\text{k}\Omega$ source. Find the effective capacitance seen at the input, and the angular frequency of the resulting input pole.`,
    parts: [ex('Input capacitance', 101, '101', 'pF'), ex('Pole frequency', 1e8 / 101, T`10^8/101`, 'rad/s')],
    hints: [T`The capacitor sees $v_{\text{in}} - v_{\text{out}} = 101\,v_{\text{in}}$, so it draws 101 times the current it would if grounded.`, T`The pole is at $\omega = 1/(R_sC_{\text{in}})$.`],
    steps: [T`$C_{\text{in}} = (1 + 100)\times1\,\text{pF} = 101\,\text{pF}$.`, T`$\omega_p = \dfrac{1}{10^4\times101\times10^{-12}} = \dfrac{10^8}{101} \approx 9.9\times10^5\,\text{rad/s}$ (about $158\,\text{kHz}$).`],
    idea: 'Gain multiplies any capacitance bridging input and output; a tiny feedback capacitance can set the bandwidth.',
    prereq: 'Capacitive impedance; inverting amplifiers.',
    verify: () => { const H = w => cabs(cd(cx(1), ca(cx(1), cm(cx(0, w), cx(1e4 * 1e-12 * 101))))), w = NUM.bisect(x => H(x) - Math.SQRT1_2, 1e3, 1e9, 200), w0 = 1e5, i = cm(cx(0, w0 * 1e-12), cx(101)); return [i.im / w0 * 1e12, w]; } // capacitor current for v_in = 1, v_out = −100
}, {
    title: 'The Wien-bridge oscillator',
    diagram: drawing(bkOpAmp(330, 140) + wire('M450 140H560M540 140V40M260 40V170H330M260 170V190M220 190H300M220 250H300M330 110H300') + element('R', 540, 40, 400, 40, 'R') + element('C', 400, 40, 260, 40, 'C') + element('R', 220, 190, 220, 250, 'R') + element('C', 300, 190, 300, 250, 'C') +
        dot(540, 140) + dot(260, 170) + dot(260, 190) + ground(260, 250) + dt(560, 236, 'amplifier gain set to 3'),
        'A Wien-bridge oscillator: a series RC from output to the non-inverting input and a parallel RC from there to ground', 270),
    text: T`A Wien-bridge oscillator feeds the output back to the $+$ input through a series $RC$, with a parallel $RC$ from the $+$ input to ground, $R = 10\,\text{k}\Omega$ and $C = 10\,\text{nF}$. Find the frequency at which this network has zero phase shift, and the amplifier gain needed to sustain oscillation.`,
    parts: [ex('Oscillation frequency', 5000 / Math.PI, T`\dfrac{5000}{\pi}`, 'Hz'), ex('Required gain', 3, '3')],
    hints: [T`$\beta = \dfrac{Z_p}{Z_s + Z_p}$, which simplifies to $\dfrac{1}{3 + j(\omega RC - 1/(\omega RC))}$.`, T`The phase is zero when the imaginary part vanishes.`],
    steps: [T`$\omega_0RC = 1 \Rightarrow \omega_0 = 10^4\,\text{rad/s}$, $f_0 = \dfrac{10^4}{2\pi} = \dfrac{5000}{\pi} \approx 1.59\,\text{kHz}$.`, T`There $\beta = \tfrac{1}{3}$, so the loop needs a gain of exactly 3 (for example $1 + R_f/R_g$ with $R_f = 2R_g$).`],
    idea: 'An oscillator runs where the loop phase is zero and the loop gain is one; the Wien network passes a third of the signal there.',
    prereq: 'Complex impedance; Barkhausen criterion.',
    verify: () => { const R = 1e4, C = 1e-8, beta = w => { const zs = ca(cx(R), cd(cx(1), cx(0, w * C))), zp = cd(cx(R), ca(cx(1), cx(0, w * R * C))); return cd(zp, ca(zs, zp)); }, w = NUM.bisect(x => beta(x).im, 1e3, 1e5); return [w / (2 * Math.PI), 1 / cabs(beta(w))]; }
}]);

/* ================= DIGITAL LOGIC ================= */
bankMore('digital', 'advanced', [{
    title: 'Functions that ignore the order of their inputs',
    diagram: sketch('The sixteen inputs of a four-input function grouped by how many ones they contain: 1, 4, 6, 4 and 1.',
        [1, 4, 6, 4, 1].map((n, w) => Array.from({length: n}, (_, i) => dot(160 + w * 100, 60 + i * 26)).join('') + dt(160 + w * 100, 230, `${w} one${w === 1 ? '' : 's'}`)).join(''), [[360, 252, 'a symmetric function picks one output per column']], 262),
    text: T`A Boolean function of four inputs is symmetric if its output depends only on how many inputs are 1, not on which. How many symmetric functions of four inputs are there? How many of five inputs?`,
    parts: [exInt('Four inputs', 32), exInt('Five inputs', 64)],
    hints: [T`Group the $2^n$ input combinations by their number of ones.`, T`There are $n + 1$ groups, and the function chooses 0 or 1 for each group.`],
    steps: [T`Four inputs: weights $0, 1, \dots, 4$ make 5 classes, so $2^5 = 32$ functions.`, T`Five inputs: $2^6 = 64$, out of $2^{32}$ functions in all.`],
    idea: 'Symmetry collapses 2ⁿ input rows to n + 1 classes; AND, OR, XOR and majority are all symmetric.',
    prereq: 'Truth tables; counting.',
    verify: () => { const w = Array.from({length: 16}, (_, m) => bkBits(m)); let c = 0; for (let t = 0; t < 1 << 16; t++) { let ok = true; for (let a = 0; a < 16 && ok; a++) for (let b = a + 1; b < 16 && ok; b++) if (w[a] === w[b] && (t >> a & 1) !== (t >> b & 1)) ok = false; if (ok) c++; } return [c, 2 ** new Set(Array.from({length: 32}, (_, m) => bkBits(m))).size]; } // brute force for four inputs; weight classes for five
}, {
    title: 'Why parity is the worst case for two-level logic',
    diagram: sketch('A four-variable Karnaugh map of the parity function: a checkerboard of ones that no two can be grouped.',
        Array.from({length: 5}, (_, i) => wire(`M${220 + i * 70} 40V200`)).join('') + Array.from({length: 5}, (_, j) => wire(`M220 ${40 + j * 40}H500`)).join('') +
        [0, 1, 3, 2].flatMap((r, i) => [0, 1, 3, 2].map((c, j) => dt(255 + j * 70, 66 + i * 40, String(bkBits(r << 2 | c) & 1)))).join(''), [[360, 234, 'four-input parity: no two ones are adjacent']], 250),
    text: T`How many product terms does the minimal sum-of-products form of the four-input parity (XOR) function need? And the five-input majority function (1 when at least three inputs are 1)?`,
    parts: [exInt('Four-input parity', 8), exInt('Five-input majority', 10)],
    hints: [T`On a Karnaugh map, parity's ones form a checkerboard: no two are adjacent.`, T`Majority's prime implicants are the products of any three inputs; each is essential.`],
    steps: [T`Parity: 8 isolated minterms, so 8 terms of four literals each.`, T`Majority of 5: every 3-input product $abc, abd, \dots$ is a prime implicant and covers a minterm no other covers: $\binom53 = 10$ terms.`],
    idea: 'Two-level logic is exponential for parity, which is why XOR trees, not sums of products, implement it.',
    prereq: 'Karnaugh maps; prime implicants.',
    verify: () => [bkMinSop(4, Array.from({length: 16}, (_, m) => m).filter(m => bkBits(m) & 1)).terms, bkMinSop(5, Array.from({length: 32}, (_, m) => m).filter(m => bkBits(m) >= 3)).terms]
}, {
    title: 'Which single gate can build everything?',
    diagram: drawing(bkNand(150, 120) + wire('M110 108H150M110 132H150M217 120H260') + dt(185, 186, 'NAND') + wire('M430 95q40 0 60 25q-20 25 -60 25q12 -25 0 -50z') + ring(496, 120, 6) + wire('M400 108H438M400 132H438M502 120H545') + dt(470, 186, 'NOR') + dt(360, 236, 'the only two-input gates that are universal on their own'),
        'NAND and NOR gate symbols', 250),
    text: T`How many different Boolean functions of two inputs are there? Of these, how many are universal on their own, meaning that every Boolean function can be built from copies of that one gate (with no constants supplied)?`,
    parts: [exInt('Two-input functions', 16), exInt('Universal gates', 2)],
    hints: [T`A two-input truth table has four rows, each 0 or 1.`, T`A universal gate must produce NOT from a single input, so it must invert when both inputs are equal: $g(0,0) = 1$ and $g(1,1) = 0$.`],
    steps: [T`$2^{2^2} = 16$ functions.`, T`$g(0,0) = 1$, $g(1,1) = 0$ leaves four candidates: NAND, NOR, NOT $a$ and NOT $b$.`, T`The last two cannot combine their inputs, so only NAND and NOR remain: 2 universal gates.`],
    idea: 'NAND and NOR are the Sheffer functions: one gate type can build any circuit, which is why CMOS libraries centre on them.',
    prereq: 'Truth tables; functional completeness.',
    verify: () => { let uni = 0; for (let g = 0; g < 16; g++) { const S = new Set([12, 10]); let grew = true; while (grew) { grew = false; for (const u of [...S]) for (const v of [...S]) { let r = 0; for (let k = 0; k < 4; k++) r |= (g >> (2 * (u >> k & 1) + (v >> k & 1)) & 1) << k; if (!S.has(r)) { S.add(r); grew = true; } } } if (S.size === 16) uni++; } return [16, uni]; }
}, {
    title: 'When 100 plus 50 is negative',
    diagram: bitWord(['1', '0', '0', '1', '0', '1', '1', '0'], ['−128', '64', '32', '16', '8', '4', '2', '1'], '100 + 50 in an 8-bit two’s-complement register'),
    text: T`An 8-bit register holds two's-complement integers from $-128$ to $127$. What does it hold after computing $100 + 50$? Which non-zero value $x$ in this register satisfies $x = -x$?`,
    parts: [ex(T`$100 + 50$`, -106, '-106'), ex(T`$x$ with $x = -x$`, -128, '-128')],
    hints: [T`Sums wrap modulo $256$: a result above $127$ comes back as itself minus $256$.`, T`Negation is "invert the bits and add 1".`],
    steps: [T`$150 - 256 = -106$ (bits $10010110$): signed overflow.`, T`$-(-128)$: invert $10000000$ to $01111111$ and add 1, giving $10000000$ again.`, T`So $-128 = -(-128)$ in 8 bits, the one value with no positive partner.`],
    idea: 'Two’s complement is arithmetic modulo 2ⁿ; overflow wraps around, and the most negative number is its own negative.',
    prereq: 'Binary numbers; two’s complement.',
    verify: () => { const w = v => new Int8Array([v])[0]; let x = 0; for (let v = -128; v < 128; v++) if (v && w(-v) === v) x = v; return [w(100 + 50), x]; }
}, {
    title: 'A twisted-ring counter',
    diagram: drawing([0, 1, 2, 3].map(i => bkBox(110 + i * 130, 90, 80, 60, `D Q${i}`)).join('') + [0, 1, 2].map(i => arrow(190 + i * 130, 120, 240 + i * 130, 120)).join('') + wire('M580 120H620V200H80V120') + arrow(80, 120, 110, 120) + ring(620, 160, 7) + dt(360, 228, 'the inverted last output feeds the first flip-flop'),
        'Four D flip-flops in a ring, with the last output inverted and fed back to the first', 245),
    text: T`A Johnson (twisted-ring) counter is a 4-bit shift register whose inverted last output feeds its first input. Starting from $0000$, how many distinct states does it cycle through, and how many of the 16 possible states does it never visit?`,
    parts: [exInt('States in the cycle', 8), exInt('Unused states', 8)],
    hints: [T`Shift in ones until the register is full, then shift in zeros.`, T`$0000 \to 1000 \to 1100 \to \dots$`],
    steps: [T`$0000, 1000, 1100, 1110, 1111, 0111, 0011, 0001$, then back to $0000$: 8 states.`, T`An $n$-bit Johnson counter has $2n$ states, so $16 - 8 = 8$ are unused (and must be steered back if ever entered).`],
    idea: 'A Johnson counter has 2n states, each one bit away from the next, so it decodes glitch-free with two-input gates.',
    prereq: 'Shift registers; state diagrams.',
    verify: () => { const seen = new Set(); let s = 0; while (!seen.has(s)) { seen.add(s); s = (s >> 1) | ((~s & 1) << 3); } return [seen.size, 16 - seen.size]; }
}, {
    title: 'Parity bits for a 64-bit word',
    diagram: sketch('A 72-bit memory word: 64 data bits, 7 Hamming check bits and one overall parity bit.',
        wire('M100 90H620V150H100ZM540 90V150M610 90V150'), [[320, 126, '64 data bits'], [575, 126, '7'], [640, 126, '+1'], [360, 196, 'single-error-correcting, double-error-detecting']], 220),
    text: T`A Hamming code protects $k = 64$ data bits with $r$ check bits, enough to locate any single error. What is the smallest $r$? How many check bits does the usual single-error-correcting, double-error-detecting (SECDED) version need?`,
    parts: [exInt('Hamming check bits', 7), exInt('SECDED check bits', 8)],
    hints: [T`The $r$ check bits form a syndrome that must name "no error" or any one of the $k + r$ bit positions: $2^r \ge k + r + 1$.`, T`SECDED adds one overall parity bit.`],
    steps: [T`$r = 6$: $64 < 71$. $r = 7$: $128 \ge 72$. So 7 check bits.`, T`Plus overall parity: 8, which is why ECC memory uses 72-bit words.`],
    idea: 'Check bits grow only logarithmically with the word: a syndrome of r bits can point at any of 2ʳ − 1 positions.',
    prereq: 'Hamming codes; powers of two.',
    verify: () => { let r = 1; while (2 ** r < 64 + r + 1) r++; return [r, r + 1]; }
}, {
    title: 'Pipelining raises the clock',
    diagram: drawing(bkBox(80, 70, 60, 70, 'reg') + bkBox(200, 70, 200, 70, 'logic 6 ns') + bkBox(460, 70, 60, 70, 'reg') + arrow(140, 105, 200, 105) + arrow(400, 105, 460, 105) + dt(300, 180, 'clock-to-Q 1 ns, setup 1 ns') + dt(300, 214, 'split the logic into two 3 ns halves with a register between'),
        'Combinational logic of 6 nanoseconds between two registers', 235),
    text: T`Logic with a delay of $6\,\text{ns}$ sits between two registers whose clock-to-output delay and setup time are $1\,\text{ns}$ each. Find the highest clock frequency. If a register is inserted to split the logic into two $3\,\text{ns}$ halves, find the new maximum frequency and the latency of one result.`,
    parts: [ex('Original clock', 125, '125', 'MHz'), ex('Pipelined clock', 200, '200', 'MHz'), ex('Pipelined latency', 10, '10', 'ns')],
    hints: [T`The clock period must cover clock-to-output, logic and setup: $T \ge t_{cq} + t_{\text{logic}} + t_{su}$.`, T`After splitting, each stage has $3\,\text{ns}$ of logic plus the same register overhead, and a result takes two cycles.`],
    steps: [T`$T = 1 + 6 + 1 = 8\,\text{ns}$: $125\,\text{MHz}$.`, T`Pipelined: $T = 1 + 3 + 1 = 5\,\text{ns}$: $200\,\text{MHz}$.`, T`Latency $2\times5 = 10\,\text{ns}$, longer than $8\,\text{ns}$: throughput rises, latency does not fall.`],
    idea: 'Pipelining raises throughput but pays the register overhead in every stage, so latency grows.',
    prereq: 'Synchronous timing; setup time.',
    verify: () => { const f = logic => 1e3 / (1 + logic + 1); return [f(6), f(3), 2 * 1e3 / f(3)]; }
}, {
    title: 'How long to wait out metastability',
    diagram: drawing(bkBox(200, 80, 90, 70, 'FF1') + bkBox(400, 80, 90, 70, 'FF2') + arrow(90, 115, 200, 115) + arrow(290, 115, 400, 115) + arrow(490, 115, 600, 115) + dt(110, 100, 'async in') + dt(345, 100, 'settles') + dt(620, 100, 'sync out') + dt(345, 200, '100 MHz clock'),
        'A two-flip-flop synchroniser for an asynchronous input', 225),
    text: T`A flip-flop sampling an asynchronous signal has a mean time between failures $\text{MTBF} = \dfrac{e^{t/\tau}}{T_0f_{\text{clk}}f_{\text{data}}}$, where $t$ is the time allowed to resolve, $\tau = 0.1\,\text{ns}$, $T_0 = 0.1\,\text{ns}$, $f_{\text{clk}} = 100\,\text{MHz}$ and $f_{\text{data}} = 10\,\text{MHz}$. How much resolution time gives an MTBF of $10^{10}\,\text{s}$? By what factor does a second flip-flop, adding a full $10\,\text{ns}$ clock period, multiply the MTBF?`,
    parts: [ex('Resolution time', 1.5 * Math.LN10, T`\dfrac{3}{2}\ln10`, 'ns'), ex('MTBF factor', Math.exp(100), T`e^{100}`)],
    hints: [T`$T_0f_{\text{clk}}f_{\text{data}} = 10^{-10}\cdot10^8\cdot10^7 = 10^5\,\text{s}^{-1}$.`, T`Solve $e^{t/\tau} = 10^{15}$; each extra nanosecond multiplies the MTBF by $e^{1/0.1}$.`],
    steps: [T`$t = \tau\ln10^{15} = 0.1\times15\ln10 = \tfrac{3}{2}\ln10 \approx 3.45\,\text{ns}$.`, T`An extra $10\,\text{ns}$: factor $e^{10/0.1} = e^{100} \approx 2.7\times10^{43}$.`],
    idea: 'Metastability decays exponentially, so a little extra settling time buys astronomical reliability: that is the two-flip-flop synchroniser.',
    prereq: 'Exponentials; synchronous design.',
    verify: () => [NUM.bisect(t => Math.log(Math.exp(t / .1) / 1e5) - Math.log(1e10), 0, 10), Math.exp((3.45 + 10) / .1) / Math.exp(3.45 / .1)]
}, {
    title: 'A function with no essential prime implicants',
    diagram: sketch('A three-variable Karnaugh map with ones at 0, 1, 2, 5, 6 and 7: a ring of six ones.',
        Array.from({length: 5}, (_, i) => wire(`M${220 + i * 70} 60V140`)).join('') + Array.from({length: 3}, (_, j) => wire(`M220 ${60 + j * 40}H500`)).join(''),
        [[0, 0, '1'], [0, 1, '1'], [0, 2, '0'], [0, 3, '1'], [1, 0, '0'], [1, 1, '1'], [1, 2, '1'], [1, 3, '1']].map(([r, c, v]) => [255 + c * 70, 86 + r * 40, v]).concat([[190, 86, 'A = 0'], [190, 126, 'A = 1'], [255, 46, '00'], [325, 46, '01'], [395, 46, '11'], [465, 46, '10'], [360, 186, 'columns: BC in Gray order']]), 210),
    text: T`The function $f(A, B, C) = \sum m(0, 1, 2, 5, 6, 7)$ has six ones. How many prime implicants does it have, how many product terms does a minimal sum of products need, and how many different minimal sums of products are there?`,
    parts: [exInt('Prime implicants', 6), exInt('Terms in a minimal cover', 3), exInt('Minimal covers', 2)],
    hints: [T`On the map the ones form a ring: each pairs with its two neighbours, and no group of four exists.`, T`Each one is covered by exactly two pair-implicants, so none is essential: choose alternate pairs around the ring.`],
    steps: [T`Pairs: $\bar A\bar B, \bar A\bar C, \bar BC, B\bar C, AC, AB$: 6 prime implicants.`, T`Each covers 2 of the 6 ones, so at least 3 are needed, and alternate pairs work.`, T`Two choices of alternation: $\bar A\bar B + B\bar C + AC$ or $\bar A\bar C + \bar BC + AB$.`],
    idea: 'When a function has a cyclic core, no prime implicant is forced; minimisation becomes a genuine covering choice.',
    prereq: 'Karnaugh maps; prime implicants.',
    verify: () => { const r = bkMinSop(3, [0, 1, 2, 5, 6, 7]); return [r.primes, r.terms, r.covers]; }
}, {
    title: 'The fewest NAND gates for XOR',
    diagram: drawing(bkNand(150, 120) + bkNand(320, 70) + bkNand(320, 170) + bkNand(490, 120) + wire('M80 108H150M80 132H150M100 108V58H320M120 132V182H320M217 120H260M260 120V82H320M260 120V158H320M387 70H440V108H490M387 170H440V132H490M557 120H620') + dt(60, 112, 'a') + dt(60, 136, 'b') + dt(665, 126, 'a ⊕ b'),
        'Exclusive-OR built from four two-input NAND gates', 235),
    text: T`What is the smallest number of two-input NAND gates that computes $a \oplus b$? And the smallest number of two-input NOR gates?`,
    parts: [exInt('NAND gates', 4), exInt('NOR gates', 5)],
    hints: [T`Start with $n = \overline{ab}$; then $\overline{a\,n}$ and $\overline{b\,n}$ are each half of the XOR.`, T`Four NOR gates give XNOR by the dual construction; one more inverts it.`],
    steps: [T`$n = \overline{ab}$, $p = \overline{an}$, $q = \overline{bn}$, $\overline{pq} = a\oplus b$: 4 gates. No 3-gate circuit works (check all of them).`, T`With NOR the dual gives $\overline{a\oplus b}$ in 4 gates; inverting needs a fifth: 5 gates.`],
    idea: 'Gate count depends on the gate: NAND gives XOR directly while NOR gives XNOR, so the same function costs four gates or five.',
    prereq: 'Boolean algebra; logic gates.',
    verify: () => { const least = (op, target) => { const go = (sig, left) => { if (sig.includes(target)) return true; if (!left) return false; for (let i = 0; i < sig.length; i++) for (let j = i; j < sig.length; j++) { const s = op(sig[i], sig[j]); if (!sig.includes(s) && go([...sig, s], left - 1)) return true; } return false; }; for (let k = 1; k <= 6; k++) if (go([12, 10], k)) return k; return 0; };
        return [least((u, v) => ~(u & v) & 15, 6), least((u, v) => ~(u | v) & 15, 6)]; }
}, {
    title: 'Sequences that contain every word once',
    diagram: sketch('The cyclic sequence 00010111 written around a circle: each of the eight 3-bit words appears exactly once.',
        ring(360, 125, 90) + '00010111'.split('').map((b, i) => dot(360 + 90 * Math.sin(i * Math.PI / 4), 125 - 90 * Math.cos(i * Math.PI / 4))).join(''),
        '00010111'.split('').map((b, i) => [360 + 115 * Math.sin(i * Math.PI / 4), 131 - 115 * Math.cos(i * Math.PI / 4), b]).concat([[600, 130, 'order 3']]), 250),
    text: T`A binary de Bruijn sequence of order $n$ is a cyclic string of length $2^n$ in which every $n$-bit word appears exactly once as a window. How many different ones are there (counting rotations as the same) for $n = 3$, and for $n = 4$?`,
    parts: [exInt(T`$n = 3$`, 2), exInt(T`$n = 4$`, 16)],
    hints: [T`For $n = 3$, start with $000$ and extend by one bit at a time without repeating a window.`, T`The count is $2^{2^{n-1} - n}$ (de Bruijn and Good).`],
    steps: [T`$n = 3$: $00010111$ and $00011101$, so $2^{4-3} = 2$.`, T`$n = 4$: $2^{8 - 4} = 16$.`],
    idea: 'De Bruijn sequences are Eulerian circuits of a graph of overlapping words; they let a short shift register visit every state once.',
    prereq: 'Binary strings; counting.',
    verify: () => { const count = n => { const L = 1 << n; let c = 0; for (let s = 0; s < 1 << (L - n); s++) { const bits = Array(n).fill(0).concat(Array.from({length: L - n}, (_, i) => s >> (L - n - 1 - i) & 1)), seen = new Set(); for (let i = 0; i < L; i++) { let w = 0; for (let k = 0; k < n; k++) w = w << 1 | bits[(i + k) % L]; seen.add(w); } if (seen.size === L) c++; } return c; }; return [count(3), count(4)]; }
}]);

/* ================= MEASUREMENT ================= */
bankMore('measurement', 'advanced', [{
    title: 'Uncertainty of a power measurement',
    diagram: drawing(element('DC', 160, 80, 160, 200, 'V = 10 ± 0.1 V') + wire('M160 80H500M160 200H500') + element('R', 500, 80, 500, 200, 'R = 100 ± 1 Ω') + dt(330, 236, 'P = V²/R'),
        'A voltage source across a resistor, each known with a standard uncertainty', 250),
    text: T`The power in a resistor is found from $P = V^2/R$, with $V = 10\,\text{V}$ (standard uncertainty $0.1\,\text{V}$) and $R = 100\,\Omega$ (standard uncertainty $1\,\Omega$), independent. Find $P$ and its relative standard uncertainty in percent.`,
    parts: [ex(T`$P$`, 1, '1', 'W'), ex('Relative uncertainty', Math.sqrt(5), T`\sqrt5`, '%')],
    hints: [T`For a product of powers, relative uncertainties add in quadrature, each multiplied by its exponent.`, T`$\dfrac{u_P}{P} = \sqrt{\left(2\dfrac{u_V}{V}\right)^2 + \left(\dfrac{u_R}{R}\right)^2}$.`],
    steps: [T`$P = 100/100 = 1\,\text{W}$.`, T`$\dfrac{u_P}{P} = \sqrt{(2\times1\%)^2 + (1\%)^2} = \sqrt5\,\% \approx 2.24\,\%$.`],
    idea: 'The squared voltage doubles its relative uncertainty, so the voltmeter, not the resistor, dominates the result.',
    prereq: 'Propagation of uncertainty; partial derivatives.',
    verify: () => { const P = (V, R) => V * V / R, h = 1e-6, dV = (P(10 + h, 100) - P(10 - h, 100)) / (2 * h), dR = (P(10, 100 + h) - P(10, 100 - h)) / (2 * h); return [P(10, 100), 100 * Math.hypot(dV * .1, dR * 1) / P(10, 100)]; }
}, {
    title: 'A voltmeter that loads the circuit',
    diagram: drawing(element('DC', 120, 50, 120, 230, '10 V') + element('R', 340, 50, 340, 140, '1 MΩ') + element('R', 340, 140, 340, 230, '1 MΩ') + wire('M120 50H340M120 230H560M340 140H560M560 140V160M560 210V230') + ring(560, 185, 25) + dt(560, 191, 'V') + dot(340, 140) + dt(630, 191, '10 MΩ'),
        'A divider of two 1 megohm resistors across 10 volts, with a 10 megohm voltmeter across the lower resistor', 250),
    text: T`A voltmeter with input resistance $10\,\text{M}\Omega$ measures the voltage across the lower resistor of a divider made of two $1\,\text{M}\Omega$ resistors across $10\,\text{V}$. What does it read? What input resistance would it need to read within $1\,\%$ of the true $5\,\text{V}$?`,
    parts: [ex('Reading', 100 / 21, T`\dfrac{100}{21}`, 'V'), ex(T`Input resistance for $1\,\%$`, 49.5, T`\dfrac{99}{2}`, 'MΩ')],
    hints: [T`The meter is in parallel with the lower resistor: $1 \parallel 10 = \tfrac{10}{11}\,\text{M}\Omega$.`, T`With meter resistance $R_m$, the reading is $10\dfrac{p}{1 + p}$ with $p = \dfrac{R_m}{1 + R_m}$ (in M$\Omega$).`],
    steps: [T`Reading $= 10\cdot\dfrac{10/11}{1 + 10/11} = \dfrac{100}{21} \approx 4.76\,\text{V}$, about $5\,\%$ low.`, T`Within $1\,\%$: $\dfrac{2p}{1 + p} \ge 0.99 \Rightarrow p \ge \tfrac{99}{101} \Rightarrow R_m \ge \tfrac{99}{2} = 49.5\,\text{M}\Omega$.`],
    idea: 'A meter must be much stiffer than the Thevenin resistance it sees (here 0.5 MΩ): the error is roughly R_th/R_m.',
    prereq: 'Voltage dividers; parallel resistance.',
    verify: () => { const read = Rm => { const g = 1 + 1 / Rm; return 10 * 1 / (1 + g); }; return [read(10), NUM.bisect(Rm => read(Rm) - 4.95, 1, 1e4)]; } // node equation (10 − V)/1 = V·(1 + 1/Rm)
}, {
    title: 'Quantisation noise of an ideal ADC',
    diagram: curve('input (full scale = 1)', 'output (3-bit staircase)', [-1, 1], [-1, 1], x => Math.round(x * 4) / 4),
    text: T`An ideal $N$-bit converter quantises a full-scale sine wave with uniform error in $\pm\tfrac{1}{2}$ step. Find its signal-to-quantisation-noise ratio for $N = 12$, and the fewest bits that give at least $100\,\text{dB}$.`,
    parts: [nx('SNR at 12 bits', 10 * Math.log10(1.5 * 4 ** 12), 'dB'), exInt('Bits for 100 dB', 17)],
    hints: [T`Step $q = 2A/2^N$ for a sine of amplitude $A$; the error power is $q^2/12$ and the signal power $A^2/2$.`, T`$\text{SNR} = \tfrac{3}{2}\cdot4^N$, i.e. $6.02N + 1.76\,\text{dB}$.`],
    steps: [T`$\text{SNR} = 10\log_{10}(1.5\cdot4^{12}) \approx 74.0\,\text{dB}$.`, T`$6.02N + 1.76 \ge 100 \Rightarrow N \ge 16.3$, so 17 bits.`],
    idea: 'Each bit halves the quantisation step and buys 6 dB; a full-scale sine adds 1.76 dB on top.',
    prereq: 'Signal power; uniform distributions; decibels.',
    verify: () => { const N = 12, q = 2 / 2 ** N, A = 1 - q; let e = 0, s = 0; for (let k = 0; k < 40000; k++) { const x = A * Math.sin(2 * Math.PI * .1234567 * k); e += (Math.round(x / q) * q - x) ** 2; s += x * x; } let n = 1; while (10 * Math.log10(6 / (2 / 2 ** n) ** 2) < 100) n++; return [10 * Math.log10(s / e) - 20 * Math.log10(A), n]; }
}, {
    title: 'A quarter-bridge strain gauge',
    diagram: drawing(element('R', 360, 50, 220, 140) + element('R', 220, 140, 360, 230) + element('R', 360, 50, 500, 140) + element('R', 500, 140, 360, 230) + wire('M360 50V20H80M80 250H360V230') + element('DC', 80, 20, 80, 250) + dot(220, 140) + dot(500, 140) +
        dt(266, 80, 'R') + dt(266, 214, 'R') + dt(456, 80, 'R') + dt(470, 214, 'R + ΔR') + dt(40, 140, '5 V') + dt(360, 146, 'Vout'),
        'A Wheatstone bridge with one active strain gauge and three fixed resistors, excited by 5 volts', 265),
    text: T`A strain gauge with gauge factor $2$ forms one arm of a bridge of otherwise equal resistors, excited at $5\,\text{V}$. At a strain of $1000\times10^{-6}$ (so $\Delta R/R = 0.002$), find the output from the usual linear approximation $V_{\text{ex}}\tfrac{\Delta R}{4R}$, and the exact output.`,
    parts: [ex('Linear approximation', 2.5, '2.5', 'mV'), ex('Exact output', 2500 / 1001, T`\dfrac{2500}{1001}`, 'mV')],
    hints: [T`One half-bridge sits at $V_{\text{ex}}/2$; the other at $V_{\text{ex}}\dfrac{R + \Delta R}{2R + \Delta R}$.`, T`The difference is $V_{\text{ex}}\dfrac{\Delta R}{2(2R + \Delta R)}$.`],
    steps: [T`Linear: $5\times0.002/4 = 2.5\,\text{mV}$.`, T`Exact: $5\cdot\dfrac{0.002}{2(2.002)} = \dfrac{0.01}{4.004}\,\text{V} = \dfrac{2500}{1001}\,\text{mV} \approx 2.4975\,\text{mV}$.`, T`The quarter bridge is non-linear by about $\tfrac{1}{2}\Delta R/R = 0.1\,\%$ here.`],
    idea: 'A bridge nulls the large constant part of a resistance and outputs only its change, almost linearly for small strains.',
    prereq: 'Voltage dividers; Wheatstone bridges.',
    verify: () => { const R = 350, dR = .7, [va, vb] = NUM.solve([[2 / R, 0], [0, 1 / R + 1 / (R + dR)]], [5 / R, 5 / R]); return [5 * 2 * 1e-3 / 4 * 1e3, (vb - va) * 1e3]; } // lower gauge R + ΔR from node b to ground
}, {
    title: 'Noise bandwidth of an RC filter',
    diagram: bkPlot('log₁₀ frequency (Hz)', '|H|²', [-3, 2], [0, 1], [x => 1 / (1 + (2 * Math.PI * 10 ** x) ** 2), x => 10 ** x < .25 ? 1 : 0]),
    text: T`White noise passes through an RC low-pass filter with $RC = 1\,\text{s}$. Find the filter's equivalent noise bandwidth, $\int_0^\infty|H(f)|^2df$. What is it for two such sections in cascade, isolated by a buffer?`,
    parts: [ex('One section', .25, T`\dfrac{1}{4}`, 'Hz'), ex('Two buffered sections', .125, T`\dfrac{1}{8}`, 'Hz')],
    hints: [T`$|H|^2 = \dfrac{1}{1 + (2\pi fRC)^2}$ and $\int_0^\infty\dfrac{dx}{1 + x^2} = \dfrac\pi2$.`, T`Two sections: $|H|^2 = \dfrac{1}{(1 + x^2)^2}$, and $\int_0^\infty\dfrac{dx}{(1 + x^2)^2} = \dfrac\pi4$.`],
    steps: [T`One section: $\dfrac{1}{2\pi RC}\cdot\dfrac\pi2 = \dfrac{1}{4RC} = \tfrac{1}{4}\,\text{Hz}$, about $1.57$ times the $-3\,\text{dB}$ bandwidth.`, T`Two sections: $\dfrac{1}{2\pi RC}\cdot\dfrac\pi4 = \dfrac{1}{8RC} = \tfrac{1}{8}\,\text{Hz}$.`],
    idea: 'Noise sees the whole response, not just the −3 dB point: a gentle roll-off lets through more noise than its corner frequency suggests.',
    prereq: 'Frequency response; definite integrals.',
    verify: () => { const enbw = n => NUM.simpson(u => { const f = Math.exp(u); return f / (1 + (2 * Math.PI * f) ** 2) ** n; }, Math.log(1e-7), Math.log(1e6), 8000); return [enbw(1), enbw(2)]; }
}, {
    title: 'Correcting a measured rise time',
    diagram: curve('time (ns)', 'normalised step', [-10, 10], [0, 1], t => 1 - Qfn(t / 1.95)),
    text: T`An oscilloscope whose own rise time is $3\,\text{ns}$ displays an edge with a $5\,\text{ns}$ rise time. Rise times of cascaded Gaussian-like systems add in quadrature. What is the true rise time of the edge? Using $t_rB = 0.35$, what bandwidth does the oscilloscope have?`,
    parts: [ex('True rise time', 4, '4', 'ns'), ex('Oscilloscope bandwidth', 350 / 3, T`\dfrac{350}{3}`, 'MHz')],
    hints: [T`$t_{\text{shown}}^2 = t_{\text{true}}^2 + t_{\text{scope}}^2$.`, T`$B = 0.35/t_r$.`],
    steps: [T`$t_{\text{true}} = \sqrt{5^2 - 3^2} = 4\,\text{ns}$.`, T`$B = \dfrac{0.35}{3\,\text{ns}} = \dfrac{350}{3} \approx 117\,\text{MHz}$.`],
    idea: 'Widths of cascaded Gaussian responses add like independent errors; an instrument should be about three times faster than what it measures.',
    prereq: 'Step response; root-sum-square.',
    verify: () => { const z = NUM.bisect(x => Qfn(x) - .1, 0, 5), tr = s => 2 * z * s, s1 = 5 / (2 * z), s2 = 3 / (2 * z), tau = 3 / Math.log(9); return [tr(Math.sqrt(s1 * s1 - s2 * s2)), 1e3 / (2 * Math.PI * tau)]; }
}, {
    title: 'When shot noise beats thermal noise',
    diagram: drawing(element('R', 160, 70, 160, 200, 'R') + element('diode', 480, 200, 480, 70, 'diode') + arrow(230, 135, 290, 135) + dt(160, 236, '4kT/R') + dt(480, 236, '2qI') + dt(320, 120, 'compare'),
        'A resistor with thermal noise beside a diode carrying a current with shot noise', 255),
    text: T`A current $I$ flowing through a resistor $R$ carries shot noise of density $2qI$ (if it consists of independent charge carriers), while the resistor contributes thermal noise $4kT/R$. Taking $kT/q = 25\,\text{mV}$, find the voltage drop $IR$ at which the two are equal. For a diode at its own small-signal resistance $r_d = V_T/I$, what is the ratio of its shot noise to the thermal noise of a resistor equal to $r_d$?`,
    parts: [ex('Drop where they are equal', 50, '50', 'mV'), ex('Diode shot noise / thermal noise', .5, T`\dfrac{1}{2}`)],
    hints: [T`$2qI = 4kT/R \Rightarrow IR = 2kT/q$.`, T`For the diode, $4kT/r_d = 4kTI/V_T = 4qI$.`],
    steps: [T`$IR = 2kT/q = 2\times25 = 50\,\text{mV}$: above that, shot noise dominates.`, T`Diode: $\dfrac{2qI}{4qI} = \dfrac{1}{2}$: a junction is "half as noisy" as a resistor of the same small-signal value.`],
    idea: 'Shot noise grows with current while thermal noise does not, and the crossover is a voltage of only a few kT/q.',
    prereq: 'Noise spectral densities; the diode equation.',
    verify: () => { const q = 1.602176634e-19, k = 1.380649e-23, T = .025 * q / k, R = 1000, I = NUM.bisect(i => 2 * q * i - 4 * k * T / R, 0, 1); return [I * R * 1e3, 2 * q * 1e-3 / (4 * k * T / (.025 / 1e-3))]; }
}, {
    title: 'A lock-in amplifier’s two outputs',
    diagram: drawing(arrow(60, 130, 170, 130) + ring(190, 80, 18) + ring(190, 180, 18) + dt(190, 86, '×') + dt(190, 186, '×') + wire('M170 130H150M150 80V180M150 80H172M150 180H172') + bkBox(290, 55, 120, 50, 'low-pass') + bkBox(290, 155, 120, 50, 'low-pass') + arrow(208, 80, 290, 80) + arrow(208, 180, 290, 180) + arrow(410, 80, 500, 80) + arrow(410, 180, 500, 180) +
        dt(80, 118, 'signal') + dt(190, 40, 'sin ωt') + dt(190, 226, 'cos ωt') + dt(530, 86, 'X') + dt(530, 186, 'Y'), 'A lock-in amplifier: the signal is multiplied by sine and cosine references and low-pass filtered', 240),
    text: T`A lock-in amplifier multiplies the signal $\sin(\omega t + \varphi)$ by $\sin\omega t$ and by $\cos\omega t$, and averages each product over many periods. For $\varphi = 60^\circ$, find the two outputs $X$ and $Y$.`,
    parts: [ex(T`$X$`, .25, T`\dfrac{1}{4}`), ex(T`$Y$`, Math.sqrt(3) / 4, T`\dfrac{\sqrt3}{4}`)],
    hints: [T`$\sin a\sin b = \tfrac{1}{2}[\cos(a - b) - \cos(a + b)]$; the $2\omega$ term averages away.`, T`$\sin a\cos b = \tfrac{1}{2}[\sin(a - b) + \sin(a + b)]$.`],
    steps: [T`$X = \tfrac{1}{2}\cos\varphi = \tfrac{1}{4}$.`, T`$Y = \tfrac{1}{2}\sin\varphi = \tfrac{\sqrt3}{4}$; then $2\sqrt{X^2 + Y^2} = 1$ recovers the amplitude and $\arctan(Y/X)$ the phase.`],
    idea: 'Multiplying by the reference shifts the signal to DC, where a narrow low-pass filter rejects almost all noise; two references recover amplitude and phase.',
    prereq: 'Product-to-sum identities; averages.',
    verify: () => { const f = Math.PI / 3, avg = g => NUM.simpson(g, 0, 20 * Math.PI, 20000) / (20 * Math.PI); return [avg(t => Math.sin(t + f) * Math.sin(t)), avg(t => Math.sin(t + f) * Math.cos(t))]; }
}, {
    title: 'A meter that assumes a sine',
    diagram: curve('time (periods)', 'v', [0, 2], [-1, 1], x => { const u = (x % 1 + 1) % 1; return u < .25 ? 4 * u : u < .75 ? 2 - 4 * u : 4 * u - 4; }),
    text: T`An average-responding AC voltmeter rectifies the signal, averages it, and multiplies by the sine's form factor $\pi/(2\sqrt2)$ so that it reads RMS correctly for sines. What does it read for a square wave of amplitude $1\,\text{V}$, and for a triangle wave of amplitude $1\,\text{V}$? (Their true RMS values are $1$ and $1/\sqrt3\,\text{V}$.)`,
    parts: [ex('Square wave reading', Math.PI / (2 * Math.SQRT2), T`\dfrac{\pi}{2\sqrt2}`, 'V'), ex('Triangle wave reading', Math.PI / (4 * Math.SQRT2), T`\dfrac{\pi}{4\sqrt2}`, 'V')],
    hints: [T`Rectified averages: square wave $1$, triangle wave $\tfrac{1}{2}$.`, T`Multiply each by $\pi/(2\sqrt2) \approx 1.111$.`],
    steps: [T`Square: $1\times\dfrac{\pi}{2\sqrt2} \approx 1.111\,\text{V}$, $11\,\%$ high.`, T`Triangle: $\tfrac{1}{2}\times\dfrac{\pi}{2\sqrt2} = \dfrac{\pi}{4\sqrt2} \approx 0.555\,\text{V}$, against a true $0.577\,\text{V}$: $3.8\,\%$ low.`],
    idea: 'A meter calibrated through a form factor is right only for the waveform it assumes; true-RMS meters square and average instead.',
    prereq: 'RMS and average values.',
    verify: () => { const tri = u => { u = (u % 1 + 1) % 1; return u < .25 ? 4 * u : u < .75 ? 2 - 4 * u : 4 * u - 4; }, ff = Math.PI / (2 * Math.SQRT2); return [ff * NUM.simpson(u => Math.abs(Math.sign(Math.sin(2 * Math.PI * u + 1e-9))), 0, 1, 4000), ff * NUM.simpson(u => Math.abs(tri(u)), 0, 1, 4000)]; }
}, {
    title: 'How well does a line fit pin down its slope?',
    diagram: sketch('Five equally spaced measurements at x = 1 to 5 with a fitted straight line through them.',
        wire('M100 220H620M100 220V30') + [[1, 1.2], [2, 1.8], [3, 3.3], [4, 3.9], [5, 5.1]].map(([x, y]) => dot(100 + 90 * x, 220 - 34 * y)).join('') + `<path d="M150 192L600 27" stroke="#aa492a" stroke-width="3"/>`,
        [[360, 250, 'x = 1, 2, 3, 4, 5; each y has σ = 1']], 262),
    text: T`A straight line $y = a + bx$ is fitted by least squares to five measurements at $x = 1, 2, 3, 4, 5$, each with independent noise of standard deviation $\sigma = 1$. Find the standard deviations of the fitted slope $b$ and intercept $a$.`,
    parts: [ex(T`$\sigma_b$`, 1 / Math.sqrt(10), T`1/\sqrt{10}`), ex(T`$\sigma_a$`, Math.sqrt(1.1), T`\sqrt{11/10}`)],
    hints: [T`$\sigma_b^2 = \dfrac{\sigma^2}{\sum(x_i - \bar x)^2}$.`, T`$\sigma_a^2 = \dfrac{\sigma^2\sum x_i^2}{n\sum(x_i - \bar x)^2}$.`],
    steps: [T`$\bar x = 3$, $\sum(x - \bar x)^2 = 4 + 1 + 0 + 1 + 4 = 10$, so $\sigma_b = 1/\sqrt{10} \approx 0.316$.`, T`$\sum x^2 = 55$: $\sigma_a^2 = \dfrac{55}{5\times10} = \dfrac{11}{10}$, $\sigma_a \approx 1.05$, larger than one reading's noise, because $x = 0$ lies outside the data.`],
    idea: 'Spreading the measurements widely pins down the slope; extrapolating to an intercept far from the data inflates its uncertainty.',
    prereq: 'Least squares; variance.',
    verify: () => { const M = [[5, 15], [15, 55]], inv = [NUM.solve(M, [1, 0]), NUM.solve(M, [0, 1])]; return [Math.sqrt(inv[1][1]), Math.sqrt(inv[0][0])]; }
}, {
    title: 'Averaging cannot remove correlated noise',
    diagram: curve('number of readings averaged N', 'std of the mean', [1, 200], [0, 1.05], n => Math.sqrt(.01 + 1 / n)),
    text: T`Each reading has independent noise of standard deviation $1$ plus a slowly varying error of standard deviation $0.1$ that is the same in every reading. Find the standard deviation of the mean of $100$ readings, and its limit as the number of readings grows without bound.`,
    parts: [ex('Mean of 100', Math.sqrt(2) / 10, T`\dfrac{\sqrt2}{10}`), ex('Limit', .1, T`\dfrac{1}{10}`)],
    hints: [T`The common error is not reduced by averaging; the independent part falls as $1/\sqrt N$.`, T`$\operatorname{Var}(\bar x) = \sigma_c^2 + \sigma_i^2/N$.`],
    steps: [T`$N = 100$: $0.01 + 1/100 = 0.02$, so $\sigma = \sqrt{0.02} = \dfrac{\sqrt2}{10} \approx 0.141$.`, T`As $N \to \infty$: $\sigma \to \sigma_c = 0.1$.`],
    idea: 'Averaging only beats down noise that is independent from reading to reading; correlated errors set a floor that only calibration removes.',
    prereq: 'Variance of sums; covariance.',
    verify: () => { const vm = N => { let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += .01 + (i === j ? 1 : 0); return s / N / N; }; return [Math.sqrt(vm(100)), Math.sqrt(vm(2000) - 1 / 2000)]; }
}]);
