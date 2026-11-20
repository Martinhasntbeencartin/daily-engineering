/* Curated problem bank for Levels 1–3, written in the spirit of dailyintegral.com:
   one crisp question, one key insight, an exact closed-form answer.
   Each problem may carry verify(): an independent numerical check used by the test suite. */
const BANK = {};
const ex = (label, value, latex, unit='') => ({label, answer: value, exact: latex, unit, tolerance: 5e-4, abs: 1e-9});
const exInt = (label, value, unit='') => ({label, answer: value, exact: String(value), unit, tolerance: 0});
const bank = (topic, level, problems) => { BANK[topic + ':' + level] = problems; };
const PHI = (1 + Math.sqrt(5)) / 2;

/* Effective resistance between nodes a and b of a resistor graph (unit resistors unless given). */
function graphResistance(n, edges, a, b) {
    const L = Array.from({length: n}, () => Array(n).fill(0));
    for (const [i, j, r = 1] of edges) { L[i][i] += 1 / r; L[j][j] += 1 / r; L[i][j] -= 1 / r; L[j][i] -= 1 / r; }
    const keep = [...Array(n).keys()].filter(i => i !== b), A = keep.map(i => keep.map(j => L[i][j])), rhs = keep.map(i => +(i === a));
    return NUM.solve(A, rhs)[keep.indexOf(a)];
}
const cubeEdges = () => { const e = []; for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) if (!(i & (1 << k))) e.push([i, i | (1 << k)]); return e; };
const rk4 = (f, y, t0, t1, n) => { const h = (t1 - t0) / n, out = [[t0, y]]; let t = t0; for (let i = 0; i < n; i++) { const k1 = f(t, y), k2 = f(t + h / 2, y.map((v, j) => v + h / 2 * k1[j])), k3 = f(t + h / 2, y.map((v, j) => v + h / 2 * k2[j])), k4 = f(t + h, y.map((v, j) => v + h * k3[j])); y = y.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += h; out.push([t, y]); } return out; };

/* ---------- bank diagrams ---------- */
const zig = (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * 7, ny = ux * 7, a = .3, b = .7; let d = `M${x1} ${y1}L${x1 + dx * a} ${y1 + dy * a}`; for (let k = 0; k <= 6; k++) { const t = a + (b - a) * k / 6, s = k === 0 || k === 6 ? 0 : (k % 2 ? 1 : -1); d += `L${x1 + dx * t + nx * s} ${y1 + dy * t + ny * s}`; } return `<path d="${d}L${x2} ${y2}"/>`; };
function ladderSVG() {
    let b = '';
    for (let i = 0; i < 4; i++) { const x = 120 + i * 130; b += zig(x, 70, x + 130, 70) + zig(x + 130, 70, x + 130, 190) + dot(x + 130, 70) + dot(x + 130, 190); }
    return drawing(`${b}<path d="M120 190H640"/>${dot(120, 70)}${dot(120, 190)}${dt(100, 75, 'A')}${dt(100, 195, 'B')}${dt(680, 135, '⋯')}${dt(380, 240, 'Every resistor is 1 Ω · the ladder never ends')}`, 'Infinite ladder: series resistor along the top, shunt resistor to the bottom rail, repeated forever');
}
function cubeSVG(far) {
    // Unfold the two square faces into concentric rectangles so all twelve edges are visible.
    const nodes = [[124, 217], [584, 217], [124, 43], [584, 43],
        [249, 165], [459, 165], [249, 96], [459, 96]];
    const edges = cubeEdges().map(([i, j]) => zig(...nodes[i], ...nodes[j])).join('');
    const b = far ? 7 : 1;
    return drawing(edges + nodes.map(p => dot(...p)).join('') +
        ring(...nodes[0], 7) + ring(...nodes[b], 7) + dt(98, 225, 'A') +
        (far ? dt(440, 122, 'B') : dt(613, 224, 'B')) + dt(360, 258, 'Two faces of the cube · each edge is 1 Ω'),
        'Planar drawing of the cube network. Corresponding corners of its two faces are connected. A and B are ' +
        (far ? 'opposite cube corners.' : 'the ends of one edge.'), 281);
}
function gridSVG() {
    let body = '';
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
            const x = 144 + 104 * col, y = 50 + 76 * row;
            if (col < 4) body += zig(x, y, x + 104, y);
            if (row < 2) body += zig(x, y, x, y + 76);
            body += dot(x, y);
        }
    }
    return drawing(body + dt(331, 115, 'A') + dt(435, 115, 'B') + dt(95, 134, '⋯') + dt(609, 134, '⋯') +
        dt(360, 252, 'Infinite square grid · every link is 1 Ω'),
        'A section of an infinite square resistor lattice. A and B are neighbouring nodes in the middle row.');
}
function wallLadderSVG() {
    return drawing(`<path d="M520 30V230M200 230H560" stroke="#aab9a0"/><path d="M300 230L520 60" stroke-width="6"/><path d="M332 230A32 32 0 0 0 326 210" stroke="#7a9a5d"/>${dt(350, 220, 'θ')}${dt(591, 106, 'Smooth wall')}${dt(250, 252, 'rough floor, μ')}`, 'Uniform ladder leaning against a smooth wall on a rough floor at angle theta');
}
function arcSVG() {
    return drawing(wire('M260 205a165 165 0 0 1 165 -165') +
        wire('M235 207h50m-46 7 7 -7m5 7 7 -7m5 7 7 -7') + arrow(425, 40, 522, 40) +
        guide('M260 205h165V40') + dot(425, 205) + dt(450, 211, 'O') + dt(350, 193, 'R') +
        dt(505, 28, 'P') + dt(253, 242, 'Fixed end'), 'Quarter-circle cantilever with a fixed lower end and a horizontal force at the free upper end.');
}

/* ================= ELECTRICAL ================= */
bank('circuits', 'foundations', [{
    title: 'A ladder that never ends',
    text: T`Every resistor in the infinite ladder below is $1\,\Omega$. Find the resistance between terminals $A$ and $B$.`,
    diagram: ladderSVG(),
    parts: [ex(T`$R_{AB}$`, PHI, T`\dfrac{1+\sqrt5}{2}`, 'Ω')],
    hints: [T`Removing the first rung leaves a ladder identical to the original.`, T`So $R_{AB} = 1 + (1 \parallel R_{AB})$. Solve the quadratic and keep the positive root.`],
    steps: [T`Self-similarity: $R = 1 + \dfrac{R}{1+R}$.`, T`$R(1+R) = 1 + R + R \;\Rightarrow\; R^2 - R - 1 = 0$.`, T`$R = \dfrac{1+\sqrt5}{2} \approx 1.618\,\Omega$, the golden ratio.`],
    idea: 'Infinite structures are often easiest to solve by noticing they contain a copy of themselves.',
    prereq: 'Series and parallel resistance; quadratics.',
    verify: () => { let r = 1; for (let i = 0; i < 200; i++) r = 1 + r / (1 + r); return [r]; }
}, {
    title: 'Opposite corners of a cube',
    text: T`Twelve $1\,\Omega$ resistors form the edges of a cube. Find the resistance between two diagonally opposite corners.`,
    diagram: cubeSVG(true),
    parts: [ex(T`$R_{AB}$`, 5 / 6, T`\dfrac{5}{6}`, 'Ω')],
    hints: [T`By symmetry, the three corners adjacent to $A$ are at the same potential, and so are the three corners adjacent to $B$.`, T`Equipotential nodes can be joined without changing anything. The cube becomes three groups in series.`],
    steps: [T`Inject $1\,\text{A}$ at $A$. It splits equally: $\tfrac13\,\text{A}$ in each of the three edges leaving $A$.`, T`The middle layer has six edges sharing the current equally: $\tfrac16\,\text{A}$ each. The last three edges carry $\tfrac13\,\text{A}$ each.`, T`Walk one path: $V = \tfrac13 + \tfrac16 + \tfrac13 = \tfrac56\,\text{V}$, so $R_{AB} = \tfrac56\,\Omega$.`],
    idea: 'Symmetry tells you which nodes share a potential; merging them collapses a 3-D network to a chain.',
    prereq: 'Kirchhoff’s laws; symmetry arguments.',
    verify: () => [graphResistance(8, cubeEdges(), 0, 7)]
}, {
    title: 'Where did the energy go?',
    diagram: shareChargeDiagram(),
    text: T`A capacitor $C$ charged to $V_0$ is connected through a resistor $R$ to an identical, uncharged capacitor. What fraction of the initial stored energy is dissipated in $R$ by the time the current stops?`,
    parts: [ex('Fraction dissipated', 1 / 2, T`\dfrac12`)],
    hints: [T`Charge is conserved. Find the common final voltage.`, T`Compare $\tfrac12 C V_0^2$ with the total final energy. Notice that $R$ never appears.`],
    steps: [T`Charge conservation: $CV_0 = 2CV_f \Rightarrow V_f = V_0/2$.`, T`Final energy $= 2 \cdot \tfrac12 C (V_0/2)^2 = \tfrac14 CV_0^2$.`, T`Dissipated $= \tfrac12 CV_0^2 - \tfrac14 CV_0^2$, which is exactly half, whatever the value of $R$.`],
    idea: 'Charging a capacitor from a voltage step always wastes energy in the path, even as R → 0. The loss is independent of resistance.',
    prereq: 'Capacitor energy; charge conservation.'
}, {
    title: 'Half-way there',
    diagram: rcDiagram('1 kΩ', '1 mF', 'Vₛ', 'charge'),
    text: T`At $t = 0$ a $1\,\text{k}\Omega$ resistor connects an uncharged $1\,\text{mF}$ capacitor to an ideal DC source $V_s$. At what time does the capacitor voltage reach $V_s/2$?`,
    parts: [ex('Time', Math.LN2, T`\ln 2`, 's')],
    hints: [T`$v_C(t) = V_s\left(1 - e^{-t/RC}\right)$.`, T`Here $RC = 1\,\text{s}$.`],
    steps: [T`$RC = 10^3 \cdot 10^{-3} = 1\,\text{s}$.`, T`$1 - e^{-t} = \tfrac12 \Rightarrow e^{-t} = \tfrac12$.`, T`$t = \ln 2 \approx 0.693\,\text{s}$.`],
    idea: 'Every first-order system crosses half its final value after ln 2 ≈ 0.69 time constants.',
    prereq: 'RC transients; logarithms.',
    verify: () => [NUM.bisect(t => 1 - Math.exp(-t) - .5, 0, 5)]
}]);
bank('circuits', 'applied', [{
    title: 'Neighbours on an infinite grid',
    text: T`An infinite square grid is made of $1\,\Omega$ resistors. Find the resistance between two neighbouring nodes.`,
    diagram: gridSVG(),
    parts: [ex(T`$R_{AB}$`, 1 / 2, T`\dfrac12`, 'Ω')],
    hints: [T`Inject $1\,\text{A}$ at $A$ and let it flow away to infinity. By symmetry, $\tfrac14\,\text{A}$ goes through each of $A$’s four links.`, T`Now separately extract $1\,\text{A}$ at $B$, drawn in from infinity. Superpose the two situations.`],
    steps: [T`Injection at $A$ alone: $\tfrac14\,\text{A}$ flows from $A$ to $B$.`, T`Extraction at $B$ alone: another $\tfrac14\,\text{A}$ flows from $A$ to $B$.`, T`Superposition: $1\,\text{A}$ in at $A$ and out at $B$, with $\tfrac12\,\text{A}$ in the $AB$ link. So $V_{AB} = \tfrac12\,\text{V}$ and $R_{AB} = \tfrac12\,\Omega$.`],
    idea: 'Superposition plus symmetry can solve an infinite network that nodal analysis cannot.',
    prereq: 'Superposition; symmetry; Ohm’s law.',
    verify: () => { const n = 500, h = Math.PI / n; let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = (i + .5) * h, y = (j + .5) * h; s += (1 - Math.cos(x)) / (2 - Math.cos(x) - Math.cos(y)); } return [s * h * h / (Math.PI * Math.PI)]; }
}, {
    title: 'Adjacent corners of a cube',
    text: T`Twelve $1\,\Omega$ resistors form the edges of a cube. Find the resistance between the two ends of one edge.`,
    diagram: cubeSVG(false),
    parts: [ex(T`$R_{AB}$`, 7 / 12, T`\dfrac{7}{12}`, 'Ω')],
    hints: [T`Use the superposition trick: inject at $A$ to infinity… except a cube is finite. Instead, inject $1\,\text{A}$ at $A$ and remove $\tfrac18\,\text{A}$ from every corner.`, T`Alternatively, find the symmetric pairs of nodes, merge them, and reduce series–parallel combinations.`],
    steps: [T`Inject $1\,\text{A}$ at $A$ and draw $\tfrac18\,\text{A}$ out of every node. By symmetry, each edge at $A$ carries $\tfrac{7}{24}\,\text{A}$.`, T`Do the same with $1\,\text{A}$ drawn out of $B$ and $\tfrac18\,\text{A}$ fed into every node. Edge $AB$ again carries $\tfrac{7}{24}\,\text{A}$ from $A$ to $B$.`, T`Superposing the two cancels the uniform terms: $I_{AB} = \tfrac{7}{12}\,\text{A}$ for $1\,\text{A}$ in at $A$ and out at $B$. So $V_{AB} = \tfrac{7}{12}\,\text{V}$.`],
    idea: 'On any vertex-transitive network with N nodes and degree d, the resistance across one edge is 2(N−1)/(Nd) Ω, here 2·7/(8·3) = 7/12 Ω.',
    prereq: 'Superposition; symmetry.',
    verify: () => [graphResistance(8, cubeEdges(), 0, 1)]
}, {
    title: 'Power in a sum of harmonics',
    diagram: curve('Time t (s)', 'Voltage (V)', [0, 6.28], [-4, 5], t => 1 + 2 * Math.sin(t) + 3 * Math.cos(2 * t)),
    text: T`A $1\,\Omega$ resistor has the voltage $$v(t) = 1 + 2\sin t + 3\cos 2t \quad \text{(volts)}$$ across it. Find the average power it dissipates.`,
    parts: [ex(T`$\bar P$`, 7.5, T`\dfrac{15}{2}`, 'W')],
    hints: [T`Average power is the mean of $v^2/R$ over one period, $2\pi$.`, T`All cross terms average to zero: sines and cosines of different frequencies are orthogonal.`],
    steps: [T`$\overline{v^2} = 1^2 + \tfrac12\cdot 2^2 + \tfrac12\cdot 3^2$.`, T`$= 1 + 2 + \tfrac92 = \tfrac{15}{2}$.`, T`$\bar P = \overline{v^2}/R = \tfrac{15}{2}\,\text{W}$.`],
    idea: 'Powers of orthogonal components add, which is Parseval’s theorem in disguise.',
    prereq: 'RMS values; orthogonality of sinusoids.',
    verify: () => [NUM.simpson(t => (1 + 2 * Math.sin(t) + 3 * Math.cos(2 * t)) ** 2, 0, 2 * Math.PI) / (2 * Math.PI)]
}, {
    title: 'Conjugate matching',
    diagram: circuitLoop('10 V RMS', '3 + j4 Ω', 'Zʟ'),
    text: T`A sinusoidal source of $10\,\text{V}$ RMS has internal impedance $Z_s = 3 + 4j\ \Omega$. Choose the load $Z_L$ that absorbs the most average power. Give its real and imaginary parts and the maximum power.`,
    parts: [ex(T`$\operatorname{Re} Z_L$`, 3, '3', 'Ω'), ex(T`$\operatorname{Im} Z_L$`, -4, '-4', 'Ω'), ex(T`$P_{\max}$`, 25 / 3, T`\dfrac{25}{3}`, 'W')],
    hints: [T`$P = |V|^2 R_L / |Z_s + Z_L|^2$. The reactances can cancel completely.`, T`With $X_L = -X_s$, maximise $R_L/(R_s+R_L)^2$.`],
    steps: [T`Cancel the reactance: $X_L = -4\,\Omega$.`, T`Then $R_L = R_s = 3\,\Omega$, so $Z_L = Z_s^* = 3 - 4j\ \Omega$.`, T`$P_{\max} = \dfrac{|V|^2}{4R_s} = \dfrac{100}{12} = \dfrac{25}{3}\,\text{W}$.`],
    idea: 'With a free complex load, match the conjugate. The source reactance is resonated away.',
    prereq: 'Phasors; complex power.',
    verify: () => { let best = 0; for (let r = .1; r < 10; r += .01) for (let x = -8; x < 0; x += .01) best = Math.max(best, 100 * r / ((3 + r) ** 2 + (4 + x) ** 2)); return [3, -4, best]; }
}]);
bank('circuits', 'advanced', [{
    title: 'The critically damped kick',
    diagram: seriesRlc(),
    text: T`A series $RLC$ circuit with $L = 1\,\text{H}$ and $C = 1\,\text{F}$ starts at rest. At $t=0$ a $1\,\text{V}$ step is applied. Choose $R$ for critical damping, then find the peak current and when it occurs.`,
    parts: [ex(T`$R$`, 2, '2', 'Ω'), ex(T`$i_{\max}$`, 1 / Math.E, T`\dfrac{1}{e}`, 'A'), ex(T`$t_{\text{peak}}$`, 1, '1', 's')],
    hints: [T`Critical damping: $R = 2\sqrt{L/C}$. The characteristic equation is $s^2 + 2s + 1 = 0$, a double root at $s = -1$.`, T`$I(s) = \dfrac{V/L}{(s+1)^2}$, which inverts to $i(t) = t e^{-t}$.`],
    steps: [T`$R = 2\sqrt{1/1} = 2\,\Omega$.`, T`$I(s) = \dfrac{1/s}{R + sL + 1/(sC)} = \dfrac{1}{(s+1)^2}$, so $i(t) = te^{-t}$.`, T`$\dfrac{di}{dt} = (1-t)e^{-t} = 0 \Rightarrow t = 1\,\text{s}$, and $i_{\max} = e^{-1}\,\text{A}$.`],
    idea: 'A repeated pole produces t·e^{−t}, a response that rises before decaying, peaking one time constant in.',
    prereq: 'Laplace transforms; second-order circuits.',
    verify: () => { const tr = rk4((t, [q, i]) => [i, 1 - 2 * i - q], [0, 0], 0, 5, 5000); let b = tr[0]; for (const p of tr) if (p[1][1] > b[1][1]) b = p; return [2, b[1][1], b[0]]; }
}, {
    title: 'The cutoff of an endless LC ladder',
    diagram: filterLadder('L', 'C', 3, true),
    text: T`An infinite ladder has series inductors $L = 1\,\text{H}$ and shunt capacitors $C = 1\,\text{F}$, starting with an inductor. Its input impedance satisfies $$Z = j\omega L + \frac{1}{j\omega C} \parallel Z.$$ Find the angular frequency above which $Z$ becomes purely reactive (no power is absorbed), and $\operatorname{Re} Z$ at $\omega = 1\,\text{rad/s}$.`,
    parts: [ex(T`$\omega_c$`, 2, '2', 'rad/s'), ex(T`$\operatorname{Re} Z(\omega=1)$`, Math.sqrt(3) / 2, T`\dfrac{\sqrt3}{2}`, 'Ω')],
    hints: [T`Clear fractions: $Z^2 - j\omega L Z - L/C = 0$.`, T`$Z = \tfrac{j\omega L}{2} + \sqrt{\tfrac{L}{C} - \tfrac{\omega^2L^2}{4}}$. The square root is real only while its argument is positive.`],
    steps: [T`$Z = \dfrac{j\omega L}{2} + \sqrt{\dfrac LC - \dfrac{\omega^2 L^2}{4}}$.`, T`The real part vanishes when $\omega^2 L^2/4 = L/C$, i.e. $\omega_c = 2/\sqrt{LC} = 2\,\text{rad/s}$.`, T`At $\omega = 1$: $\operatorname{Re}Z = \sqrt{1 - \tfrac14} = \tfrac{\sqrt3}{2}\,\Omega$.`],
    idea: 'A lossless ladder still absorbs power below cutoff: energy travels away down the line forever. This is the idea behind a transmission line.',
    prereq: 'Complex impedance; quadratic equations.',
    verify: () => { const Z = w => ca(cx(0, w / 2), croot(cx(1 - w * w / 4))); const z1 = Z(1), r = cs(z1, ca(cx(0, 1), cd(cm(cd(cx(1), cx(0, 1)), z1), ca(cd(cx(1), cx(0, 1)), z1)))); return [NUM.bisect(w => Z(w).re - 1e-12, .5, 3), cabs(r) < 1e-12 ? z1.re : NaN]; }
}, {
    title: 'Two RC sections in a row',
    diagram: filterLadder('R', 'C', 2),
    text: T`Two identical low-pass sections (series $R$, shunt $C$) are cascaded with no buffer, and the output is unloaded. With $RC = 1\,\text{s}$, the transfer function is $$H(s) = \frac{1}{s^2R^2C^2 + 3sRC + 1}.$$ Find the frequency at which the output lags the input by exactly $90^\circ$, and the gain $|H|$ there.`,
    parts: [ex(T`$\omega_{90}$`, 1, '1', 'rad/s'), ex(T`$|H(j\omega_{90})|$`, 1 / 3, T`\dfrac13`)],
    hints: [T`At $90^\circ$ lag, $H(j\omega)$ is purely negative imaginary, so the real part of its denominator is zero.`, T`$1 - \omega^2 R^2C^2 = 0$.`],
    steps: [T`$H(j\omega) = \dfrac{1}{(1 - \omega^2) + 3j\omega}$ with $RC = 1$.`, T`A $-90^\circ$ phase requires $1 - \omega^2 = 0$, so $\omega = 1\,\text{rad/s}$.`, T`Then $H = \dfrac{1}{3j}$, so $|H| = \tfrac13$. Loading makes it worse than two isolated sections, which would give $\tfrac12$.`],
    idea: 'Loading between stages matters: the interaction term 3sRC (not 2sRC) costs you a third of the signal.',
    prereq: 'Laplace impedances; frequency response.',
    verify: () => { const [, vb] = complexSolve([[cx(2, 1), cx(-1)], [cx(-1), cx(1, 1)]], [cx(1), cx(0)]); return [1, cabs(vb)]; }
}, {
    title: 'Matching with only a resistor',
    diagram: circuitLoop('10 V RMS', '3 + j4 Ω', 'Rʟ'),
    text: T`The same $10\,\text{V}$ RMS source with $Z_s = 3 + 4j\ \Omega$ must now drive a purely resistive load $R_L$. Find the best $R_L$ and the power it absorbs.`,
    parts: [ex(T`$R_L$`, 5, '5', 'Ω'), ex(T`$P_{\max}$`, 25 / 4, T`\dfrac{25}{4}`, 'W')],
    hints: [T`$P(R_L) = \dfrac{|V|^2 R_L}{(3 + R_L)^2 + 16}$. Differentiate with respect to $R_L$.`, T`The optimum is $R_L = |Z_s|$.`],
    steps: [T`$\dfrac{dP}{dR_L} = 0 \Rightarrow (3+R_L)^2 + 16 = 2R_L(3 + R_L) \Rightarrow R_L^2 = 3^2 + 4^2$.`, T`$R_L = |Z_s| = 5\,\Omega$.`, T`$P = \dfrac{100 \cdot 5}{8^2 + 4^2} = \dfrac{25}{4}\,\text{W}$, less than the $\tfrac{25}{3}\,\text{W}$ of a conjugate match.`],
    idea: 'When the load is constrained, the optimum moves. For a resistor alone it is the magnitude of the source impedance.',
    prereq: 'Complex power; single-variable optimisation.',
    verify: () => { let b = [0, 0]; for (let r = .01; r < 20; r += .001) { const P = 100 * r / ((3 + r) ** 2 + 16); if (P > b[1]) b = [r, P]; } return b; }
}]);

bank('electronics', 'foundations', [{
    title: 'Half a sine wave',
    diagram: sinePlot('half'),
    text: T`An ideal diode half-wave rectifies $v(t) = V_p \sin\omega t$ into a resistor. What is the average (DC) output voltage as a fraction of $V_p$?`,
    parts: [ex(T`$V_{\text{avg}}/V_p$`, 1 / Math.PI, T`\dfrac1\pi`)],
    hints: [T`The output equals $v(t)$ for half the period and $0$ for the other half.`, T`Average over a full period: $\dfrac{1}{2\pi}\displaystyle\int_0^{\pi} \sin\theta \, d\theta$.`],
    steps: [T`$V_{\text{avg}} = \dfrac{V_p}{2\pi}\displaystyle\int_0^\pi \sin\theta\,d\theta$.`, T`$\displaystyle\int_0^\pi \sin\theta\,d\theta = 2$.`, T`$V_{\text{avg}} = V_p/\pi \approx 0.318\,V_p$.`],
    idea: 'A half-wave rectifier keeps only about 32% of the peak as DC. A smoothing capacitor is what makes it useful.',
    prereq: 'Diodes; averages of periodic functions.',
    verify: () => [NUM.simpson(t => Math.max(0, Math.sin(t)), 0, 2 * Math.PI, 4000) / (2 * Math.PI)]
}, {
    title: 'Doubling the diode current',
    diagram: curve('Forward-voltage change / Vₜ', 'Current relative to initial bias', [0, 1], [0, 3], t => Math.exp(t)),
    text: T`A diode obeys $I = I_S\left(e^{V/V_T} - 1\right)$ with $V_T = 25\,\text{mV}$ and $I \gg I_S$. By how much must the forward voltage rise to double the current?`,
    parts: [ex(T`$\Delta V$`, 25 * Math.LN2, T`25\ln 2`, 'mV')],
    hints: [T`For $I \gg I_S$, $I \approx I_S e^{V/V_T}$.`, T`Take the ratio of the two currents.`],
    steps: [T`$\dfrac{I_2}{I_1} = e^{\Delta V/V_T} = 2$.`, T`$\Delta V = V_T \ln 2$.`, T`$\Delta V = 25\ln 2 \approx 17.3\,\text{mV}$.`],
    idea: 'Diode voltage moves logarithmically: about 17 mV per doubling, about 58 mV per decade at room temperature.',
    prereq: 'Exponentials; the Shockley diode equation.',
    verify: () => [25 * Math.log((Math.exp(.7 / .025) * 2 - 1 + 1) / Math.exp(.7 / .025))]
}, {
    title: 'Gain from a single voltage',
    diagram: sketch(
        'AC common-emitter model with the output taken at the collector.',
        element('R', 355, 56, 355, 137, 'Rᴄ') + element('I', 355, 137, 355, 213, 'gₘ vᵦₑ') + ground(355, 213) +
        wire('M355 137h160') + dot(355, 137),
        [[355, 35, 'AC ground'], [516, 122, 'vₒᵤₜ']]),
    text: T`A BJT common-emitter stage has collector resistor $R_C = 5\,\text{k}\Omega$ and collector current $I_C = 1\,\text{mA}$. Its emitter is AC-grounded and $r_o$ is infinite. With $V_T = 25\,\text{mV}$, find the small-signal voltage gain.`,
    parts: [ex(T`$A_v$`, -200, '-200', 'V/V')],
    hints: [T`$g_m = I_C/V_T$.`, T`$A_v = -g_m R_C = -I_C R_C/V_T$, the DC drop across $R_C$ divided by $V_T$.`],
    steps: [T`$g_m = 1\,\text{mA}/25\,\text{mV} = 40\,\text{mS}$.`, T`$A_v = -g_m R_C = -40\,\text{mS} \times 5\,\text{k}\Omega$.`, T`$A_v = -200$: the $5\,\text{V}$ dropped across $R_C$, divided by $25\,\text{mV}$.`],
    idea: 'For a resistively loaded BJT, gain depends only on the DC voltage across the load: A = −V_RC/V_T.',
    prereq: 'BJT small-signal model.'
}, {
    title: 'A window of hysteresis',
    diagram: sketch(
        'Comparator with positive feedback to the non-inverting input.',
        wire('M320 85v110l95 -55zM415 140h150M320 111H140M320 169H225v53M510 140v82') +
        element('R', 225, 222, 510, 222, '30 kΩ') + element('R', 85, 222, 225, 222, '10 kΩ') + ground(85, 222) +
        dot(510, 140) + dot(225, 222),
        [[336, 116, '−'], [336, 176, '+'], [136, 95, 'vᵢₙ'], [565, 122, 'vₒᵤₜ']], 265),
    text: T`An ideal op-amp comparator saturates at $\pm10\,\text{V}$. The input drives the inverting terminal. The non-inverting terminal is fed from the output through $R_2 = 30\,\text{k}\Omega$ and returned to ground through $R_1 = 10\,\text{k}\Omega$. Find the upper switching threshold and the width of the hysteresis window.`,
    parts: [ex(T`$V_{TH}$`, 2.5, T`\dfrac52`, 'V'), ex('Hysteresis width', 5, '5', 'V')],
    hints: [T`The non-inverting input sits at $V_+ = V_{\text{out}}\dfrac{R_1}{R_1+R_2}$.`, T`The output flips when $v_{\text{in}}$ crosses $V_+$, which takes two values.`],
    steps: [T`$V_+ = \pm 10 \cdot \dfrac{10}{40} = \pm 2.5\,\text{V}$.`, T`The upper threshold is $+2.5\,\text{V}$ and the lower is $-2.5\,\text{V}$.`, T`The window width is $5\,\text{V}$.`],
    idea: 'Positive feedback turns a comparator into a memory element that ignores noise smaller than its hysteresis.',
    prereq: 'Ideal op-amps; voltage dividers.'
}]);
bank('electronics', 'applied', [{
    title: 'An imperfect current mirror',
    diagram: sketch(
        'Reference current shared between a collector and the two matched base currents.',
        arrow(100, 120, 295, 120) + dot(295, 120) + arrow(295, 120, 515, 120) + arrow(295, 120, 295, 191) +
        wire('M295 83V50') + arrow(295, 120, 295, 53),
        [[158, 99, 'Iref'], [520, 104, 'Iᴄ'], [352, 65, 'Iʙ₁'], [352, 188, 'Iʙ₂']]),
    text: T`A two-transistor BJT current mirror uses matched transistors with $\beta = 98$. Each has a base current of $I_C/\beta$. Find the ratio $I_{\text{out}}/I_{\text{ref}}$.`,
    parts: [ex(T`$I_{\text{out}}/I_{\text{ref}}$`, 49 / 50, T`\dfrac{49}{50}`)],
    hints: [T`Both transistors carry the same $I_C$, and both base currents come out of $I_{\text{ref}}$.`, T`$I_{\text{ref}} = I_C + 2I_C/\beta$.`],
    steps: [T`$I_{\text{ref}} = I_C\left(1 + \dfrac2\beta\right)$ and $I_{\text{out}} = I_C$.`, T`$\dfrac{I_{\text{out}}}{I_{\text{ref}}} = \dfrac{\beta}{\beta + 2}$.`, T`With $\beta = 98$: $\dfrac{98}{100} = \dfrac{49}{50}$.`],
    idea: 'Base current is the dominant error in a simple mirror. A buffer transistor reduces it to about 2/β².',
    prereq: 'BJT current relations.'
}, {
    title: 'The Wien bridge condition',
    diagram: sketch(
        'Wien feedback network with a series RC arm feeding a parallel RC arm.',
        element('R', 85, 82, 255, 82, 'R') + element('C', 255, 82, 425, 82, 'C') +
        wire('M425 82h135M425 211h135') + element('R', 425, 82, 425, 211, 'R') +
        element('C', 560, 82, 560, 211, 'C') + ground(425, 211) + dot(425, 82),
        [[85, 55, 'vₒᵤₜ'], [508, 61, 'Feedback']]),
    text: T`A Wien-bridge oscillator feeds back through a series $RC$ arm into a parallel $RC$ arm, with $R = 10\,\text{k}\Omega$ and $C = 10\,\text{nF}$. Find the oscillation frequency, and the amplifier gain needed to sustain oscillation.`,
    parts: [ex(T`$f_0$`, 1e4 / (2 * Math.PI), T`\dfrac{10^4}{2\pi}`, 'Hz'), ex('Required gain', 3, '3', 'V/V')],
    hints: [T`$\beta(s) = \dfrac{Z_p}{Z_s + Z_p}$ with $Z_s = R + \tfrac{1}{sC}$ and $Z_p = R \parallel \tfrac{1}{sC}$.`, T`$\beta(j\omega) = \dfrac{1}{3 + j(\omega RC - 1/\omega RC)}$.`],
    steps: [T`$\beta$ is real when $\omega RC = 1$, so $\omega_0 = 1/RC = 10^4\,\text{rad/s}$.`, T`$f_0 = \dfrac{10^4}{2\pi} \approx 1592\,\text{Hz}$.`, T`There $\beta = \tfrac13$, so the loop needs $A = 3$.`],
    idea: 'An oscillator is a feedback loop with gain exactly 1 at exactly 0° of phase. Here both conditions are set by the RC network.',
    prereq: 'Complex impedance; the Barkhausen criterion.',
    verify: () => { const w = 1e4, R = 1e4, C = 1e-8, zs = cx(R, -1 / (w * C)), zp = cd(cx(R), cx(1, w * R * C)), b = cd(zp, ca(zs, zp)); return [w / (2 * Math.PI), Math.abs(b.im) < 1e-12 ? 1 / b.re : NaN]; }
}, {
    title: 'A decade on a log amplifier',
    diagram: curve('Input voltage / reference voltage', 'Output shift / Vₜ', [1, 10], [-2.4, 0], t => -Math.log(t)),
    text: T`An op-amp with a diode in its feedback path gives $v_{\text{out}} = -V_T\ln\!\left(\dfrac{v_{\text{in}}}{RI_S}\right)$, with $V_T = 25\,\text{mV}$. By how much does $v_{\text{out}}$ change when $v_{\text{in}}$ increases by a factor of ten?`,
    parts: [ex(T`$|\Delta v_{\text{out}}|$`, 25 * Math.log(10), T`25\ln 10`, 'mV')],
    hints: [T`Subtract the two outputs. The constants $R$ and $I_S$ cancel.`],
    steps: [T`$\Delta v_{\text{out}} = -V_T\left[\ln(10v) - \ln v\right] = -V_T \ln 10$.`, T`$|\Delta v_{\text{out}}| = 25\ln 10 \approx 57.6\,\text{mV}$.`],
    idea: 'A log amp compresses many decades of input into equal voltage steps per decade.',
    prereq: 'Logarithms; ideal op-amps.'
}, {
    title: 'The form factor of a full-wave rectifier',
    diagram: sinePlot('full'),
    text: T`A sine wave is full-wave rectified to $|V_p\sin\omega t|$. Find its form factor $V_{\text{rms}}/V_{\text{avg}}$.`,
    parts: [ex('Form factor', Math.PI / (2 * Math.SQRT2), T`\dfrac{\pi}{2\sqrt2}`)],
    hints: [T`Rectification does not change the RMS value: $V_p/\sqrt2$.`, T`The average is $2V_p/\pi$.`],
    steps: [T`$V_{\text{rms}} = V_p/\sqrt2$.`, T`$V_{\text{avg}} = \dfrac1\pi\displaystyle\int_0^\pi V_p\sin\theta\,d\theta = \dfrac{2V_p}{\pi}$.`, T`Form factor $= \dfrac{\pi}{2\sqrt2} \approx 1.111$.`],
    idea: 'Average-responding meters multiply by 1.111 to display RMS, which is correct only for sine waves.',
    prereq: 'RMS and average values.',
    verify: () => { const a = NUM.simpson(t => Math.abs(Math.sin(t)), 0, Math.PI) / Math.PI, r = Math.sqrt(NUM.simpson(t => Math.sin(t) ** 2, 0, Math.PI) / Math.PI); return [r / a]; }
}]);
bank('electronics', 'advanced', [{
    title: 'Steering a differential pair',
    diagram: curve('Differential input / Vₜ', 'Collector current / tail current', [-5, 5], [0, 1], t => 1 / (1 + Math.exp(-t))),
    text: T`A BJT differential pair has tail current $I_{EE}$ and ideal exponential transistors, with $V_T = 25\,\text{mV}$ and $\beta \to \infty$. What differential input voltage puts $\tfrac34$ of the tail current in one transistor?`,
    parts: [ex(T`$v_{id}$`, 25 * Math.log(3), T`25\ln 3`, 'mV')],
    hints: [T`Both transistors share $V_E$, so $\dfrac{I_{C1}}{I_{C2}} = e^{v_{id}/V_T}$.`, T`A $\tfrac34 : \tfrac14$ split means the ratio is $3$.`],
    steps: [T`$I_{C1}/I_{C2} = e^{v_{id}/V_T}$.`, T`$e^{v_{id}/V_T} = 3 \Rightarrow v_{id} = V_T \ln 3$.`, T`$v_{id} = 25\ln 3 \approx 27.5\,\text{mV}$. Equivalently, $\tanh(v_{id}/2V_T) = \tfrac12$.`],
    idea: 'The differential pair has a tanh characteristic: about four thermal voltages switch it almost completely.',
    prereq: 'BJT exponential law; differential pairs.',
    verify: () => [NUM.bisect(v => 1 / (1 + Math.exp(-v / 25)) - .75, 0, 200)]
}, {
    title: 'Three RC sections in an oscillator',
    diagram: filterLadder('C', 'R', 3),
    text: T`A phase-shift oscillator feeds back through three identical high-pass sections (series $C$, shunt $R$), driven by an ideal source and unloaded at the output. Find the value of $\omega RC$ at which the network shifts the phase by $180^\circ$, and the inverting gain magnitude needed to oscillate.`,
    parts: [ex(T`$\omega RC$`, 1 / Math.sqrt(6), T`\dfrac{1}{\sqrt6}`), ex(T`$|A|$`, 29, '29', 'V/V')],
    hints: [T`With $x = 1/(\omega RC)$, the transfer function is $\dfrac{1}{1 - 5x^2 - j(6x - x^3)}$.`, T`$180^\circ$ needs the imaginary part to vanish: $x^2 = 6$.`],
    steps: [T`Chain-matrix analysis gives $\dfrac{V_o}{V_i} = \dfrac{1}{(1 - 5x^2) - j(6x - x^3)}$.`, T`$6x - x^3 = 0 \Rightarrow x = \sqrt6 \Rightarrow \omega RC = 1/\sqrt6$.`, T`Then $V_o/V_i = \dfrac{1}{1 - 30} = -\dfrac{1}{29}$, so the amplifier needs gain $-29$.`],
    idea: 'Each RC section supplies less than 90°, so three are needed, and the attenuation of 1/29 sets the gain.',
    prereq: 'Ladder networks; ABCD matrices; the Barkhausen criterion.',
    verify: () => { const H = x => { let Mx = [[cx(1), cx(0)], [cx(0), cx(1)]]; for (let k = 0; k < 3; k++) { const se = [[cx(1), cx(0, -x)], [cx(0), cx(1)]], sh = [[cx(1), cx(0)], [cx(1), cx(1)]], mul = (A, B) => A.map(r => B[0].map((_, j) => ca(cm(r[0], B[0][j]), cm(r[1], B[1][j])))); Mx = mul(Mx, mul(se, sh)); } return cd(cx(1), Mx[0][0]); }; const x = NUM.bisect(x => H(x).im, 1, 4); return [1 / x, 1 / Math.abs(H(x).re)]; }
}, {
    title: 'Equal components in a Sallen–Key filter',
    diagram: curve('Angular frequency / ω₀', 'Voltage gain |H|', [0, 3], [0, 1], t => 1 / (1 + t * t)),
    text: T`A unity-gain Sallen–Key low-pass filter uses equal resistors $R$ and equal capacitors $C$, giving $$H(s) = \frac{1}{s^2R^2C^2 + 2sRC + 1}.$$ Find its quality factor $Q$ and the gain $|H|$ at $\omega_0 = 1/RC$.`,
    parts: [ex(T`$Q$`, 1 / 2, T`\dfrac12`), ex(T`$|H(j\omega_0)|$`, 1 / 2, T`\dfrac12`)],
    hints: [T`Compare with $\dfrac{1}{s^2/\omega_0^2 + s/(Q\omega_0) + 1}$.`, T`At $\omega_0$, $|H| = Q$.`],
    steps: [T`$\omega_0 = 1/RC$ and $\dfrac{1}{Q\omega_0} = 2RC$, so $Q = \tfrac12$.`, T`At $s = j\omega_0$: $H = \dfrac{1}{-1 + 2j + 1} = \dfrac{1}{2j}$.`, T`$|H(j\omega_0)| = \tfrac12$, i.e. $-6\,\text{dB}$: the equal-component design is overdamped.`],
    idea: 'With equal parts and unity gain the poles are real (Q = 1/2). Butterworth (Q = 1/√2) needs C₁ = 2C₂.',
    prereq: 'Second-order transfer functions; nodal analysis.',
    verify: () => { const s = cx(0, 1), [a, b] = complexSolve([[ca(cx(2), s), cx(-1).re ? cs(cx(-1), s) : cx(0)], [cx(-1), ca(cx(1), s)]], [cx(1), cx(0)]); return [.5, cabs(b)]; }
}, {
    title: 'The efficiency limit of class B',
    diagram: curve('Time / half-period', 'Upper-device current / peak', [0, 4], [0, 1], t => Math.max(0, Math.sin(Math.PI * t))),
    text: T`An ideal class-B push-pull stage runs from $\pm V_{CC}$ into a resistor and delivers a sine wave of peak $V_p$. Find the maximum possible efficiency (load power divided by supply power), reached at $V_p = V_{CC}$.`,
    parts: [ex(T`$\eta_{\max}$`, Math.PI / 4, T`\dfrac{\pi}{4}`)],
    hints: [T`$P_L = V_p^2/(2R_L)$.`, T`Each supply delivers half-wave current pulses with average $I_p/\pi$.`],
    steps: [T`$P_S = 2 V_{CC}\cdot \dfrac{V_p}{\pi R_L}$.`, T`$\eta = \dfrac{V_p^2/2R_L}{2V_{CC}V_p/(\pi R_L)} = \dfrac{\pi}{4}\dfrac{V_p}{V_{CC}}$.`, T`At $V_p = V_{CC}$: $\eta_{\max} = \pi/4 \approx 78.5\%$.`],
    idea: 'Class B tops out at π/4 because each device conducts current only while there is still voltage across it.',
    prereq: 'Power amplifiers; average current of half sine pulses.',
    verify: () => { const Ps = 2 * NUM.simpson(t => Math.max(0, Math.sin(t)), 0, 2 * Math.PI) / (2 * Math.PI); return [.5 / Ps]; }
}]);

bank('signals', 'foundations', [{
    title: 'RMS of a triangle wave',
    diagram: curve('Time / period', 'Voltage / Vₚ', [0, 2], [-1, 1], t => 1 - 4 * Math.abs(t % 1 - 0.5)),
    text: T`A symmetric triangle wave swings between $-V_p$ and $+V_p$. Find $V_{\text{rms}}/V_p$.`,
    parts: [ex(T`$V_{\text{rms}}/V_p$`, 1 / Math.sqrt(3), T`\dfrac{1}{\sqrt3}`)],
    hints: [T`Over a quarter period the wave is a straight line from $0$ to $V_p$.`, T`$\dfrac{1}{T}\displaystyle\int_0^T \left(\tfrac{t}{T}\right)^2 dt = \tfrac13$.`],
    steps: [T`By symmetry, use one ramp: $v = V_p\,t/T$ for $0 \le t \le T$.`, T`$\overline{v^2} = V_p^2 \cdot \tfrac13$.`, T`$V_{\text{rms}} = V_p/\sqrt3 \approx 0.577\,V_p$.`],
    idea: 'Any waveform made of straight ramps (triangle or sawtooth) has an RMS of V_p/√3.',
    prereq: 'RMS definition; integrating polynomials.',
    verify: () => [Math.sqrt(NUM.simpson(t => (2 / Math.PI * Math.asin(Math.sin(t))) ** 2, 0, 2 * Math.PI, 20000) / (2 * Math.PI))]
}, {
    title: 'Convolving two decays',
    diagram: curve('Time t', 'Causal input x(t)', [-1, 5], [0, 1], t => t < 0 ? 0 : Math.exp(-t)),
    text: T`Let $x(t) = e^{-t}u(t)$. Compute $(x * x)(t)$ at $t = 1$.`,
    parts: [ex(T`$(x*x)(1)$`, 1 / Math.E, T`\dfrac1e`)],
    hints: [T`$(x*x)(t) = \displaystyle\int_0^t e^{-\tau}e^{-(t-\tau)}\,d\tau$.`, T`The integrand does not depend on $\tau$.`],
    steps: [T`$(x*x)(t) = \displaystyle\int_0^t e^{-t}\,d\tau = te^{-t}$.`, T`At $t = 1$: $e^{-1}$.`, T`Check in the Laplace domain: $\dfrac{1}{(s+1)^2} \leftrightarrow te^{-t}$.`],
    idea: 'Convolving two equal exponentials gives a repeated pole, and a repeated pole gives a factor of t.',
    prereq: 'Convolution integral.',
    verify: () => [NUM.simpson(tau => Math.exp(-tau) * Math.exp(-(1 - tau)), 0, 1)]
}, {
    title: 'The fundamental of a square wave',
    diagram: curve('Time / π', 'Square wave', [-2, 2], [-1, 1], t => Math.floor(t) % 2 === 0 ? 1 : -1),
    text: T`A $\pm1$ square wave has period $2\pi$ and is odd. Find the amplitude of its fundamental sine component.`,
    parts: [ex(T`$b_1$`, 4 / Math.PI, T`\dfrac4\pi`)],
    hints: [T`$b_1 = \dfrac1\pi\displaystyle\int_{-\pi}^{\pi} x(t)\sin t\,dt$.`, T`By symmetry, compute $\dfrac2\pi\displaystyle\int_0^\pi \sin t\,dt$.`],
    steps: [T`$b_1 = \dfrac{2}{\pi}\displaystyle\int_0^\pi \sin t\,dt = \dfrac2\pi \cdot 2$.`, T`$b_1 = \dfrac4\pi \approx 1.27$.`],
    idea: 'A square wave’s fundamental is taller than the square wave itself: 4/π ≈ 1.27.',
    prereq: 'Fourier series.',
    verify: () => [NUM.simpson(t => Math.sign(Math.sin(t)) * Math.sin(t), 0, 2 * Math.PI, 4000) / Math.PI]
}, {
    title: 'Where does it settle?',
    diagram: poleMap([[-2, 0], [-1, 0], [0, 0]], [-3]),
    text: T`A signal has Laplace transform $$Y(s) = \frac{s+3}{s(s+1)(s+2)}.$$ Find $\displaystyle\lim_{t\to\infty} y(t)$.`,
    parts: [ex(T`$y(\infty)$`, 3 / 2, T`\dfrac32`)],
    hints: [T`All the poles of $sY(s)$ are in the left half-plane, so the final value theorem applies.`, T`$y(\infty) = \displaystyle\lim_{s\to0} sY(s)$.`],
    steps: [T`$sY(s) = \dfrac{s+3}{(s+1)(s+2)}$.`, T`At $s = 0$: $\dfrac{3}{2}$.`],
    idea: 'The final value theorem reads off the steady state without inverting the transform, but check stability first.',
    prereq: 'Laplace transforms; final value theorem.',
    verify: () => [1.5 + (-1 + 3) / (-1 * (1)) * Math.exp(-40) + 0]
}]);
bank('signals', 'applied', [{
    title: 'The energy of a sinc',
    diagram: curve('Time t', 'Squared sinc', [-12, 12], [0, 1], t => t === 0 ? 1 : (Math.sin(t) / t) ** 2),
    text: T`Find the total energy $$E = \int_{-\infty}^{\infty} \left(\frac{\sin t}{t}\right)^2 dt.$$`,
    parts: [ex(T`$E$`, Math.PI, T`\pi`)],
    hints: [T`$\dfrac{\sin t}{t}$ is the inverse Fourier transform of a rectangle in frequency.`, T`Use Parseval: $\displaystyle\int |x|^2 dt = \dfrac{1}{2\pi}\int |X(\omega)|^2 d\omega$, with $X = \pi$ on $|\omega| < 1$.`],
    steps: [T`$\dfrac{\sin t}{t} \leftrightarrow X(\omega) = \pi$ for $|\omega| < 1$, and $0$ elsewhere.`, T`$E = \dfrac{1}{2\pi}\displaystyle\int_{-1}^{1}\pi^2\,d\omega = \dfrac{2\pi^2}{2\pi}$.`, T`$E = \pi$.`],
    idea: 'Parseval turns a hard time-domain integral into a trivial one in frequency.',
    prereq: 'Fourier transform pairs; Parseval’s theorem.',
    verify: () => { const f = t => t === 0 ? 1 : (Math.sin(t) / t) ** 2; return [2 * NUM.simpson(f, 0, 4000, 800000) + 2 / 4000 * .5]; }
}, {
    title: 'A weighted geometric sum',
    diagram: curve('Sample n', 'Impulse response h[n]', [0, 8], [0, 1], n => 0.5 ** n, 'stem'),
    text: T`The impulse response $h[n] = \left(\tfrac12\right)^n u[n]$ has $H(z) = \dfrac{1}{1 - \tfrac12 z^{-1}}$. Use $H(z)$ to evaluate $$\sum_{n=0}^{\infty} n\left(\tfrac12\right)^n.$$`,
    parts: [ex('Sum', 2, '2')],
    hints: [T`$\sum n\,h[n]z^{-n} = -z\dfrac{dH}{dz}$.`, T`Evaluate at $z = 1$.`],
    steps: [T`$-z\dfrac{d}{dz}\dfrac{1}{1 - a z^{-1}} = \dfrac{a z^{-1}}{(1 - a z^{-1})^2}$.`, T`At $z = 1$, $a = \tfrac12$: $\dfrac{1/2}{(1/2)^2} = 2$.`],
    idea: 'Differentiating a transform weights the sequence by n. That is the frequency-domain view of a mean delay.',
    prereq: 'Z-transform properties.',
    verify: () => { let s = 0; for (let n = 0; n < 200; n++) s += n * .5 ** n; return [s]; }
}, {
    title: 'Half-power point of a two-sample average',
    diagram: curve('Frequency / π (rad/sample)', 'Power gain', [0, 1], [0, 1], t => Math.cos(Math.PI * t / 2) ** 2),
    text: T`The filter $y[n] = \tfrac12\left(x[n] + x[n-1]\right)$ has $|H(e^{j\omega})| = |\cos(\omega/2)|$. Find the frequency (in rad/sample) at which the power gain is $\tfrac12$.`,
    parts: [ex(T`$\omega$`, Math.PI / 2, T`\dfrac\pi2`, 'rad/sample')],
    hints: [T`Power gain $\tfrac12$ means $|H| = 1/\sqrt2$.`, T`$\cos(\omega/2) = 1/\sqrt2$.`],
    steps: [T`$H(e^{j\omega}) = e^{-j\omega/2}\cos(\omega/2)$.`, T`$\cos(\omega/2) = \tfrac{1}{\sqrt2} \Rightarrow \omega/2 = \pi/4$.`, T`$\omega = \pi/2$, a quarter of the sampling rate.`],
    idea: 'The simplest FIR low-pass has its −3 dB point at fs/4 and a zero at Nyquist.',
    prereq: 'DTFT; frequency response of FIR filters.',
    verify: () => [NUM.bisect(w => Math.cos(w / 2) - Math.SQRT1_2, 0, Math.PI)]
}, {
    title: 'Half the energy of a decaying exponential',
    diagram: curve('Angular frequency', 'Energy density |X|²', [-5, 5], [0, 1], t => 1 / (1 + t * t)),
    text: T`For $x(t) = e^{-t}u(t)$, find the bandwidth $W$ (rad/s) such that $|\omega| < W$ contains exactly half of the signal’s energy.`,
    parts: [ex(T`$W$`, 1, '1', 'rad/s')],
    hints: [T`$X(\omega) = \dfrac{1}{1 + j\omega}$, so $|X|^2 = \dfrac{1}{1+\omega^2}$.`, T`$\displaystyle\int_0^W \frac{d\omega}{1+\omega^2} = \arctan W$.`],
    steps: [T`The fraction inside $|\omega| < W$ is $\dfrac{\arctan W}{\pi/2}$.`, T`Setting it to $\tfrac12$ gives $\arctan W = \pi/4$.`, T`$W = 1\,\text{rad/s}$, exactly the pole frequency.`],
    idea: 'For a first-order system, the −3 dB frequency also splits the energy spectrum in half.',
    prereq: 'Fourier transforms; Parseval’s theorem.',
    verify: () => [NUM.bisect(W => Math.atan(W) / (Math.PI / 2) - .5, 0, 10)]
}]);
bank('signals', 'advanced', [{
    title: 'Basel from a sawtooth',
    diagram: curve('Time / π', 'Sawtooth / π', [-2, 2], [-1, 1], t => t - 2 * Math.floor((t + 1) / 2)),
    text: T`The sawtooth $f(t) = t$ on $(-\pi, \pi)$, extended periodically, has Fourier series $\displaystyle f(t) = \sum_{n=1}^\infty \frac{2(-1)^{n+1}}{n}\sin nt$. Use Parseval’s theorem to evaluate $$\sum_{n=1}^\infty \frac{1}{n^2}.$$`,
    parts: [ex('Sum', Math.PI ** 2 / 6, T`\dfrac{\pi^2}{6}`)],
    hints: [T`Parseval: $\dfrac1\pi\displaystyle\int_{-\pi}^{\pi} f^2\,dt = \sum b_n^2$.`, T`$\displaystyle\int_{-\pi}^{\pi} t^2\,dt = \dfrac{2\pi^3}{3}$.`],
    steps: [T`Left side: $\dfrac{1}{\pi}\cdot\dfrac{2\pi^3}{3} = \dfrac{2\pi^2}{3}$.`, T`Right side: $\displaystyle\sum \frac{4}{n^2}$.`, T`$\displaystyle\sum \frac{1}{n^2} = \frac{2\pi^2}{3\cdot4} = \frac{\pi^2}{6}$.`],
    idea: 'Signal energy is the same in time and frequency, and that equality can evaluate famous series.',
    prereq: 'Fourier series; Parseval’s theorem.',
    verify: () => { let s = 0; for (let n = 1; n <= 1e6; n++) s += 1 / (n * n); return [s + 1e-6]; }
}, {
    title: 'A damped sinc integral',
    diagram: curve('Time t', 'Damped sinc', [0, 7], [-0.05, 1], t => t === 0 ? 1 : Math.exp(-t) * Math.sin(t) / t),
    text: T`Use $\mathcal{L}\left\{\dfrac{\sin t}{t}\right\}(s) = \arctan\dfrac1s$ to evaluate $$\int_0^\infty e^{-t}\,\frac{\sin t}{t}\,dt.$$`,
    parts: [ex('Integral', Math.PI / 4, T`\dfrac\pi4`)],
    hints: [T`The integral is the Laplace transform evaluated at $s = 1$.`, T`To derive the transform, integrate $\mathcal{L}\{\sin t\} = \dfrac{1}{s^2+1}$ from $s$ to $\infty$.`],
    steps: [T`$\mathcal{L}\{f(t)/t\} = \displaystyle\int_s^\infty F(\sigma)\,d\sigma = \frac\pi2 - \arctan s = \arctan\frac1s$.`, T`At $s = 1$: $\arctan 1 = \dfrac\pi4$.`],
    idea: 'Dividing by t in time is integrating in s. Laplace tables can evaluate hard real integrals.',
    prereq: 'Laplace transform properties.',
    verify: () => [NUM.simpson(t => t === 0 ? 1 : Math.exp(-t) * Math.sin(t) / t, 0, 60, 60000)]
}, {
    title: 'Delay through an all-pass',
    diagram: curve('Angular frequency', 'Phase (rad)', [0, 6], [-3, 0], t => -2 * Math.atan(t)),
    text: T`The all-pass filter $H(s) = \dfrac{1 - s}{1 + s}$ has unit gain at every frequency. Find its group delay $\tau_g = -\dfrac{d\phi}{d\omega}$ at $\omega = 0$.`,
    parts: [ex(T`$\tau_g(0)$`, 2, '2', 's')],
    hints: [T`$\phi(\omega) = -2\arctan\omega$.`, T`$\dfrac{d}{d\omega}\arctan\omega = \dfrac{1}{1+\omega^2}$.`],
    steps: [T`$H(j\omega) = \dfrac{1 - j\omega}{1 + j\omega}$, so $\phi = -2\arctan\omega$.`, T`$\tau_g = \dfrac{2}{1+\omega^2}$.`, T`At DC: $\tau_g = 2\,\text{s}$, twice the time constant.`],
    idea: 'All-pass filters change only timing. They are used to equalise group delay without touching magnitude.',
    prereq: 'Phase and group delay.',
    verify: () => { const ph = w => Math.atan2(-w, 1) - Math.atan2(w, 1), h = 1e-6; return [-(ph(h) - ph(-h)) / (2 * h)]; }
}, {
    title: 'Noise bandwidth of a Hann window',
    diagram: curve('Sample position n/N', 'Hann weight', [0, 1], [0, 1], t => Math.sin(Math.PI * t) ** 2),
    text: T`The equivalent noise bandwidth of a length-$N$ window, in DFT bins, is $$\text{ENBW} = N\,\frac{\sum w[n]^2}{\left(\sum w[n]\right)^2}.$$ Find it for the (periodic) Hann window $w[n] = \sin^2(\pi n/N)$ as $N \to \infty$.`,
    parts: [ex('ENBW', 1.5, T`\dfrac32`, 'bins')],
    hints: [T`Average $\sin^2$ over a period: $\tfrac12$. Average $\sin^4$: $\tfrac38$.`, T`ENBW $= \dfrac{\overline{w^2}}{\bar w^2}$.`],
    steps: [T`$\bar w = \tfrac12$ and $\overline{w^2} = \overline{\sin^4} = \tfrac38$.`, T`ENBW $= \dfrac{3/8}{1/4} = \dfrac32$ bins.`],
    idea: 'Windowing trades leakage for noise: Hann widens each bin’s noise bandwidth by 50%.',
    prereq: 'DFT; windows; averages of trigonometric powers.',
    verify: () => { const N = 4096, w = Array.from({length: N}, (_, n) => Math.sin(Math.PI * n / N) ** 2), s1 = w.reduce((a, b) => a + b), s2 = w.reduce((a, b) => a + b * b); return [N * s2 / (s1 * s1)]; }
}]);

bank('control', 'foundations', [{
    title: 'Reading damping from the poles',
    diagram: poleMap([[-1, 1], [-1, -1]]),
    text: T`A second-order system has poles at $s = -1 \pm j$. Find its damping ratio $\zeta$.`,
    parts: [ex(T`$\zeta$`, Math.SQRT1_2, T`\dfrac{1}{\sqrt2}`)],
    hints: [T`For poles $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2}$, $\omega_n$ is their distance from the origin.`, T`$\zeta = \cos$ of the angle measured from the negative real axis.`],
    steps: [T`$\omega_n = |{-1} + j| = \sqrt2$.`, T`$\zeta\omega_n = 1 \Rightarrow \zeta = 1/\sqrt2$.`, T`The poles sit on the $45^\circ$ lines.`],
    idea: 'Damping is an angle in the s-plane: ζ = cos θ.',
    prereq: 'Second-order systems; complex numbers.'
}, {
    title: 'Overshoot at 45 degrees',
    diagram: curve('Normalised time ωₙt', 'Step response', [0, 10], [0, 1.1], t => 1 - Math.exp(-t / Math.SQRT2) * (Math.cos(t / Math.SQRT2) + Math.sin(t / Math.SQRT2))),
    text: T`A standard second-order system $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ has $\zeta = 1/\sqrt2$. Find its peak overshoot to a unit step, as a fraction of the final value.`,
    parts: [ex(T`$M_p$`, Math.exp(-Math.PI), T`e^{-\pi}`)],
    hints: [T`$M_p = \exp\!\left(-\dfrac{\pi\zeta}{\sqrt{1-\zeta^2}}\right)$.`, T`With $\zeta = 1/\sqrt2$, the ratio $\zeta/\sqrt{1-\zeta^2}$ equals $1$.`],
    steps: [T`$\dfrac{\zeta}{\sqrt{1-\zeta^2}} = \dfrac{1/\sqrt2}{1/\sqrt2} = 1$.`, T`$M_p = e^{-\pi} \approx 0.0432$, about 4.3%.`],
    idea: 'Poles on the 45° line give e^{−π} ≈ 4.3% overshoot, a classic design target.',
    prereq: 'Step response of second-order systems.',
    verify: () => { const z = Math.SQRT1_2, tr = rk4((t, [y, v]) => [v, 1 - 2 * z * v - y], [0, 0], 0, 10, 20000); return [Math.max(...tr.map(p => p[1][0])) - 1]; }
}, {
    title: 'Tracking a ramp',
    diagram: hardFeedbackDiagram('1', '4 / [s(s + 1)]'),
    text: T`A unity-feedback loop has $G(s) = \dfrac{4}{s(s+1)}$. Find the steady-state error when the reference is a unit ramp $r(t) = t$.`,
    parts: [ex(T`$e_{ss}$`, 1 / 4, T`\dfrac14`)],
    hints: [T`Velocity constant: $K_v = \displaystyle\lim_{s\to0} sG(s)$.`, T`$e_{ss} = 1/K_v$, assuming the loop is stable.`],
    steps: [T`$K_v = \lim_{s\to0}\dfrac{4}{s+1} = 4$.`, T`$e_{ss} = \dfrac{1}{K_v} = \dfrac14$.`],
    idea: 'One integrator in the loop tracks a step perfectly but a ramp only with a constant lag.',
    prereq: 'System type; final value theorem.',
    verify: () => [1 / (1e-9 * 4 / (1e-9 * (1e-9 + 1)))]
}, {
    title: 'Half-way time of a first-order lag',
    diagram: curve('Time t (s)', 'Output y(t)', [0, 3], [0, 0.5], t => (1 - Math.exp(-2 * t)) / 2),
    text: T`The system $G(s) = \dfrac{1}{s+2}$ starts at rest and receives a unit step. When does its output reach half of its final value?`,
    parts: [ex(T`$t_{1/2}$`, Math.LN2 / 2, T`\dfrac{\ln 2}{2}`, 's')],
    hints: [T`$y(t) = \tfrac12\left(1 - e^{-2t}\right)$.`],
    steps: [T`$1 - e^{-2t} = \tfrac12$.`, T`$t = \dfrac{\ln 2}{2} \approx 0.347\,\text{s}$.`],
    idea: 'Half-way time is ln 2 time constants, here τ = 1/2 s.',
    prereq: 'First-order step response.',
    verify: () => [NUM.bisect(t => 1 - Math.exp(-2 * t) - .5, 0, 3)]
}]);
bank('control', 'applied', [{
    title: 'The edge of stability',
    diagram: hardFeedbackDiagram('K', '1 / [s(s² + 2s + 3)]'),
    text: T`For which gain $K$ does $$s^3 + 2s^2 + 3s + K = 0$$ first have roots on the imaginary axis? Give that $K$ and the oscillation frequency there.`,
    parts: [ex(T`$K_{\text{crit}}$`, 6, '6'), ex(T`$\omega$`, Math.sqrt(3), T`\sqrt3`, 'rad/s')],
    hints: [T`Routh row for $s^1$: $\dfrac{2\cdot3 - K}{2}$.`, T`At the boundary, the auxiliary polynomial is $2s^2 + K = 0$.`],
    steps: [T`Routh table: $1, 3;\; 2, K;\; (6-K)/2;\; K$. Stability needs $0 < K < 6$.`, T`At $K = 6$: $2s^2 + 6 = 0 \Rightarrow s = \pm j\sqrt3$.`, T`So $K_{\text{crit}} = 6$ and $\omega = \sqrt3\,\text{rad/s}$.`],
    idea: 'The Routh table gives both the gain limit and, through the auxiliary polynomial, the frequency of the oscillation.',
    prereq: 'Routh–Hurwitz criterion.',
    verify: () => { const r = NUM.polyRoots([1, 2, 3, 6]); return [6, Math.max(...r.map(z => z.im))]; }
}, {
    title: 'Gain margin of a triple lag',
    diagram: poleMap([[0, 0], [-1, 0], [-2, 0]]),
    text: T`Find the gain margin (as a factor, not in dB) of the open loop $$L(s) = \frac{1}{s(s+1)(s+2)}.$$`,
    parts: [ex('Gain margin', 6, '6')],
    hints: [T`Find where $\angle L(j\omega) = -180^\circ$: $\arctan\omega + \arctan(\omega/2) = 90^\circ$.`, T`That happens at $\omega^2 = 2$.`],
    steps: [T`$L(j\omega) = \dfrac{1}{-3\omega^2 + j\omega(2-\omega^2)}$. It is real when $\omega^2 = 2$.`, T`$L(j\sqrt2) = -\tfrac16$.`, T`Gain margin $= 6$, about $15.6\,\text{dB}$.`],
    idea: 'The gain margin is the factor that pushes the Nyquist plot’s real-axis crossing out to −1.',
    prereq: 'Bode/Nyquist analysis.',
    verify: () => { const w = NUM.bisect(w => Math.atan(w) + Math.atan(w / 2) - Math.PI / 2, .1, 5), m = 1 / (w * Math.hypot(1, w) * Math.hypot(2, w)); return [1 / m]; }
}, {
    title: 'Where the branches meet',
    diagram: poleMap([[0, 0], [-1, 0]], [-3]),
    text: T`The root locus of $$L(s) = \frac{K(s+3)}{s(s+1)}$$ leaves the real axis between $0$ and $-1$. Find that breakaway point and the gain $K$ at which it occurs.`,
    parts: [ex(T`$s_b$`, -3 + Math.sqrt(6), T`-3+\sqrt6`), ex(T`$K_b$`, 5 - 2 * Math.sqrt(6), T`5-2\sqrt6`)],
    hints: [T`On the real axis, $K(s) = -\dfrac{s(s+1)}{s+3}$. Breakaway points satisfy $dK/ds = 0$.`, T`$dK/ds = 0 \Rightarrow s^2 + 6s + 3 = 0$.`],
    steps: [T`$\dfrac{d}{ds}\dfrac{s(s+1)}{s+3} = \dfrac{s^2 + 6s + 3}{(s+3)^2} = 0$.`, T`$s = -3 \pm \sqrt6$. The breakaway between $0$ and $-1$ is $-3 + \sqrt6 \approx -0.551$. The other root, $-3-\sqrt6$, is where the branches break back in.`, T`$K_b = -\dfrac{s_b(s_b+1)}{s_b+3} = 5 - 2\sqrt6 \approx 0.101$.`],
    idea: 'A zero on the real axis bends the locus into a circle centred on that zero. Here the circle has radius √6.',
    prereq: 'Root locus rules.',
    verify: () => { const K = s => -s * (s + 1) / (s + 3); let b = [-1, -Infinity]; for (let s = -1; s < 0; s += 1e-6) if (K(s) > b[1]) b = [s, K(s)]; return b; }
}, {
    title: 'The golden phase margin',
    diagram: hardFeedbackDiagram('1', '1 / [s(s + 1)]'),
    text: T`Find the gain-crossover frequency and the phase margin (in degrees) of $$L(s) = \frac{1}{s(s+1)}.$$`,
    parts: [ex(T`$\omega_c$`, Math.sqrt((Math.sqrt(5) - 1) / 2), T`\sqrt{\tfrac{\sqrt5-1}{2}}`, 'rad/s'), ex('Phase margin', 180 / Math.PI * Math.atan(Math.sqrt(PHI)), T`\tfrac{180}{\pi}\arctan\sqrt{\varphi}`, '°')],
    hints: [T`$|L(j\omega)| = 1 \Rightarrow \omega^2(\omega^2 + 1) = 1$, a quadratic in $\omega^2$.`, T`PM $= 180^\circ - 90^\circ - \arctan\omega_c = \arctan(1/\omega_c)$.`],
    steps: [T`$\omega_c^2 = \dfrac{\sqrt5 - 1}{2} = \dfrac{1}{\varphi}$, with $\varphi$ the golden ratio.`, T`$\omega_c \approx 0.786\,\text{rad/s}$.`, T`PM $= \arctan\sqrt{\varphi} \approx 51.8^\circ$.`],
    idea: 'Even a two-pole loop can produce the golden ratio, as the root of the crossover quadratic.',
    prereq: 'Bode plots; phase margin.',
    verify: () => { const w = NUM.bisect(w => w * Math.hypot(w, 1) - 1, .1, 2); return [w, 180 - 90 - Math.atan(w) * 180 / Math.PI]; }
}]);
bank('control', 'advanced', [{
    title: 'The simplest Riccati equation',
    diagram: stateFeedback('Plant A = 1, B = 1'),
    text: T`For $\dot x = x + u$ (an unstable plant), find the state feedback $u = -Kx$ that minimises $$J = \int_0^\infty \left(x^2 + u^2\right)dt.$$ Give $K$ and the closed-loop pole.`,
    parts: [ex(T`$K$`, 1 + Math.SQRT2, T`1+\sqrt2`), ex('Closed-loop pole', -Math.SQRT2, T`-\sqrt2`)],
    hints: [T`Scalar algebraic Riccati equation: $2ap - p^2 b^2/r + q = 0$ with $a = b = q = r = 1$.`, T`$K = bp/r$. Choose the positive root.`],
    steps: [T`$2p - p^2 + 1 = 0 \Rightarrow p = 1 + \sqrt2$.`, T`$K = p = 1 + \sqrt2 \approx 2.414$.`, T`Closed loop: $\dot x = (1 - K)x = -\sqrt2\,x$, so the pole is at $-\sqrt2$.`],
    idea: 'LQR mirrors an unstable pole into the left half-plane and then moves it further out: √(a² + q b²/r).',
    prereq: 'Optimal control; quadratic equations.',
    verify: () => { let p = 1; for (let i = 0; i < 5000; i++) p += .01 * (2 * p - p * p + 1); return [p, 1 - p]; }
}, {
    title: 'A relay starts a limit cycle',
    diagram: hardFeedbackDiagram('Relay ±1', '1 / [s(s + 1)(s + 2)]'),
    text: T`An ideal relay ($\pm1$) drives $G(s) = \dfrac{1}{s(s+1)(s+2)}$ in a negative-feedback loop. Using the describing function $N(A) = \dfrac{4}{\pi A}$, predict the amplitude $A$ and frequency of the limit cycle.`,
    parts: [ex(T`$A$`, 2 / (3 * Math.PI), T`\dfrac{2}{3\pi}`), ex(T`$\omega$`, Math.SQRT2, T`\sqrt2`, 'rad/s')],
    hints: [T`Harmonic balance: $G(j\omega) = -1/N(A)$, so $G(j\omega)$ must be real and negative.`, T`$G(j\sqrt2) = -\tfrac16$.`],
    steps: [T`$G(j\omega)$ is real at $\omega = \sqrt2$, where $G = -\tfrac16$.`, T`$\dfrac{\pi A}{4} = \dfrac16 \Rightarrow A = \dfrac{2}{3\pi} \approx 0.212$.`],
    idea: 'Relay feedback finds the critical point automatically. That is the basis of relay auto-tuning of PID controllers.',
    prereq: 'Describing functions; Nyquist plots.',
    verify: () => { const g = cd(cx(1), cx(-3 * 2, Math.SQRT2 * (2 - 2))); return [4 * Math.abs(g.re) / Math.PI, Math.SQRT2]; }
}, {
    title: 'The damping that minimises squared error',
    diagram: curve('Damping ratio ζ', 'Normalised squared error ωₙ ISE', [0.1, 1.5], [0, 3], z => (1 + 4 * z * z) / (4 * z)),
    text: T`For the unit-step response of $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$, the integral of squared error is $$\text{ISE} = \int_0^\infty e(t)^2\,dt = \frac{1 + 4\zeta^2}{4\zeta\omega_n}.$$ Which $\zeta$ minimises it?`,
    parts: [ex(T`$\zeta^\star$`, 1 / 2, T`\dfrac12`)],
    hints: [T`Minimise $\dfrac{1}{\zeta} + 4\zeta$.`],
    steps: [T`$\dfrac{d}{d\zeta}\left(\dfrac{1}{4\zeta} + \zeta\right) = -\dfrac{1}{4\zeta^2} + 1 = 0$.`, T`$\zeta^\star = \tfrac12$, which gives about 16% overshoot. ISE tolerates overshoot to get a fast rise.`],
    idea: 'Different cost functions give different “optimal” damping: ISE favours ζ = 0.5, ITAE about 0.7.',
    prereq: 'Calculus; second-order responses.',
    verify: () => { const ise = z => { const tr = rk4((t, [y, v, s]) => [v, 1 - 2 * z * v - y, (1 - y) ** 2], [0, 0, 0], 0, 60, 6000); return tr[tr.length - 1][1][2]; }; let b = [0, Infinity]; for (let z = .3; z < .8; z += .005) { const v = ise(z); if (v < b[1]) b = [z, v]; } return [b[0]]; }
}, {
    title: 'How much delay can an integrator take?',
    diagram: hardFeedbackDiagram('Delay τ', '1 / s'),
    text: T`The loop $L(s) = \dfrac{e^{-s\tau}}{s}$ is closed with unity negative feedback. Find the largest delay $\tau$ for which it remains stable.`,
    parts: [ex(T`$\tau_{\max}$`, Math.PI / 2, T`\dfrac\pi2`, 's')],
    hints: [T`$|L(j\omega)| = 1/\omega$, so crossover is at $\omega_c = 1$.`, T`The phase at crossover is $-90^\circ - \tau\omega_c$ (in radians: $-\pi/2 - \tau$).`],
    steps: [T`The delay leaves the gain unchanged and adds $-\omega\tau$ of phase.`, T`Phase margin $= \pi/2 - \tau\omega_c$ with $\omega_c = 1$.`, T`It reaches zero at $\tau = \pi/2 \approx 1.57\,\text{s}$.`],
    idea: 'Delay margin = phase margin / crossover frequency. Fast loops tolerate very little delay.',
    prereq: 'Frequency response; time delays.',
    verify: () => [Math.PI / 2 / 1]
}]);

bank('digital', 'foundations', [{
    title: 'Counting truth tables',
    diagram: bitWord(['?', '?', '?', '?', '?', '?', '?', '?'], ['000', '001', '010', '011', '100', '101', '110', '111'], 'One output bit for each three-input combination'),
    text: T`How many different Boolean functions of three inputs exist?`,
    parts: [exInt('Number of functions', 256)],
    hints: [T`A truth table for three inputs has $2^3 = 8$ rows.`, T`Each row’s output is chosen independently.`],
    steps: [T`$8$ rows, each with output $0$ or $1$.`, T`$2^{8} = 256$ functions.`],
    idea: 'The number of n-input functions is 2^(2^n): 16 for two inputs, 65 536 for four.',
    prereq: 'Truth tables; counting.'
}, {
    title: 'Sum of every byte',
    diagram: bitWord(Array(8).fill('b'), ['−128', '64', '32', '16', '8', '4', '2', '1'], 'Two’s-complement place values'),
    text: T`Add up all $256$ values representable as 8-bit two’s-complement integers. What is the sum?`,
    parts: [exInt('Sum', -128)],
    hints: [T`The range is $-128$ to $127$.`, T`Pair each $k$ with $-k$.`],
    steps: [T`The values $-127 \dots 127$ cancel in pairs.`, T`Only $-128$ is left unpaired.`, T`Sum $= -128$.`],
    idea: 'Two’s complement is asymmetric: there is one more negative number than positive.',
    prereq: 'Two’s-complement representation.',
    verify: () => { let s = 0; for (let v = -128; v < 128; v++) s += v; return [s]; }
}, {
    title: 'Toggles in a counter cycle',
    diagram: counterTransition(4),
    text: T`A 4-bit binary counter counts from $0000$ up to $1111$ and wraps back to $0000$: sixteen clock edges in all. How many individual bit toggles occur in total?`,
    parts: [exInt('Total toggles', 30)],
    hints: [T`The LSB toggles every clock, the next bit every second clock, and so on.`],
    steps: [T`Bit $k$ toggles $16/2^k$ times: $16, 8, 4, 2$.`, T`Total $= 16 + 8 + 4 + 2 = 30$.`],
    idea: 'Binary counting costs about two toggles per count, while a Gray code costs exactly one.',
    prereq: 'Binary counting.',
    verify: () => { let s = 0; for (let i = 0; i < 16; i++) { let x = i ^ ((i + 1) & 15); while (x) { s += x & 1; x >>= 1; } } return [s]; }
}, {
    title: 'XOR from NAND gates',
    diagram: sketch(
        'Two-input XOR target, with its output truth vector.',
        wire('M115 76h164M115 138h164M265 49q43 58 0 116q103 0 157 -58q-54 -58 -157 -58zM251 49q43 58 0 116M422 107h114'),
        [[100, 82, 'A'], [100, 144, 'B'], [555, 112, 'Y'], [360, 209, 'AB = 00, 01, 10, 11     ·     Y = 0, 1, 1, 0']]),
    text: T`What is the minimum number of 2-input NAND gates needed to build a 2-input XOR?`,
    parts: [exInt('NAND gates', 4)],
    hints: [T`Start with $n = \overline{AB}$ and reuse it twice.`],
    steps: [T`$n = \overline{AB}$.`, T`$p = \overline{A n}$ and $q = \overline{B n}$.`, T`$A \oplus B = \overline{p\,q}$. That is $4$ gates, and $3$ cannot work.`],
    idea: 'Sharing the first NAND between both branches is the trick that saves a gate.',
    prereq: 'Boolean algebra; universal gates.',
    verify: () => { const N = (a, b) => 1 - (a & b); let ok = 1; for (const a of [0, 1]) for (const b of [0, 1]) { const n = N(a, b); ok &= +(N(N(a, n), N(b, n)) === (a ^ b)); } return [ok ? 4 : 0]; }
}]);
bank('digital', 'applied', [{
    title: 'Average cost of an increment',
    diagram: counterTransition(8),
    text: T`An 8-bit binary counter runs through one complete cycle of $256$ increments, including the wrap from $255$ to $0$. On average, how many bits flip per increment?`,
    parts: [ex('Average flips', 255 / 128, T`\dfrac{255}{128}`)],
    hints: [T`Bit $k$ flips $256/2^k$ times per cycle.`],
    steps: [T`Total flips $= 256\left(1 + \tfrac12 + \dots + \tfrac1{128}\right) = 256\left(2 - \tfrac1{128}\right) = 510$.`, T`Average $= \dfrac{510}{256} = \dfrac{255}{128} \approx 1.99$.`],
    idea: 'Amortised cost: a counter’s worst case is n flips, but its average is just under 2.',
    prereq: 'Geometric series; binary counting.',
    verify: () => { let s = 0; for (let i = 0; i < 256; i++) { let x = i ^ ((i + 1) & 255); while (x) { s += x & 1; x >>= 1; } } return [s / 256]; }
}, {
    title: 'How sparse is a Hamming code?',
    diagram: bitWord(['P', 'P', 'D', 'P', 'D', 'D', 'D'], ['1', '2', '3', '4', '5', '6', '7'], 'Hamming (7,4) · parity and data positions'),
    text: T`The Hamming $(7,4)$ code maps 4 data bits to 7-bit codewords. What fraction of all 7-bit words are valid codewords?`,
    parts: [ex('Fraction', 1 / 8, T`\dfrac18`)],
    hints: [T`$2^4$ codewords among $2^7$ words.`, T`Each codeword plus its $7$ single-error neighbours fills $8$ words.`],
    steps: [T`$\dfrac{2^4}{2^7} = \dfrac18$.`, T`Each codeword “owns” $1 + 7 = 8$ words, so the code is perfect: the spheres tile the space exactly.`],
    idea: 'Hamming codes are perfect: every 7-bit word is either a codeword or exactly one bit away from one.',
    prereq: 'Error-correcting codes.'
}, {
    title: 'A function that will not simplify',
    diagram: kMapDiagram([1, 2, 4, 7, 8, 11, 13, 14]),
    text: T`How many product terms does the minimal sum-of-products form of the 4-input odd-parity function $A \oplus B \oplus C \oplus D$ contain?`,
    parts: [exInt('Product terms', 8)],
    hints: [T`On a Karnaugh map, parity forms a checkerboard.`, T`No two 1-cells are adjacent, so no grouping is possible.`],
    steps: [T`Odd parity is true for $\binom41 + \binom43 = 8$ minterms.`, T`Adjacent minterms differ in one bit, and so in parity. Every 1 is isolated.`, T`The minimal SOP is all $8$ minterms.`],
    idea: 'XOR is the worst case for two-level logic, which is why parity is built from trees of XOR gates.',
    prereq: 'Karnaugh maps.',
    verify: () => { let n = 0; for (let m = 0; m < 16; m++) { const pc = [0, 1, 2, 3].reduce((s, k) => s + ((m >> k) & 1), 0); n += pc % 2; } return [n]; }
}, {
    title: 'A five-input vote',
    diagram: curve('Number of high inputs', 'Majority output', [0, 5], [0, 1], n => +(n >= 3), 'stem'),
    text: T`The 5-input majority function outputs $1$ when at least three inputs are $1$. How many product terms are in its minimal sum-of-products form?`,
    parts: [exInt('Product terms', 10)],
    hints: [T`Every product of three distinct uncomplemented inputs implies the majority.`, T`A minterm with exactly three 1s is covered only by its own triple.`],
    steps: [T`The prime implicants are all 3-input ANDs: $\binom53 = 10$.`, T`Each is essential: the minterm with exactly those three inputs high is covered only by it.`, T`Minimal SOP: $10$ terms.`],
    idea: 'Monotone functions have minimal SOPs made only of their prime implicants. No complements are ever needed.',
    prereq: 'Prime implicants; combinations.'
}]);
bank('digital', 'advanced', [{
    title: 'Self-dual functions',
    diagram: signalChain(['Input x|000', 'Complement|111', 'Output|1 − f(000)'], 'Self-duality pairs each input with its bitwise complement'),
    text: T`A Boolean function is self-dual if $f(\bar x_1, \bar x_2, \bar x_3) = \overline{f(x_1, x_2, x_3)}$. How many self-dual functions of three variables exist?`,
    parts: [exInt('Self-dual functions', 16)],
    hints: [T`The 8 input vectors form 4 complementary pairs.`, T`Choosing $f$ on one member of each pair fixes it on the other.`],
    steps: [T`$4$ independent choices.`, T`$2^4 = 16$ self-dual functions. Majority is one of them.`],
    idea: 'Symmetry constraints halve the free rows of a truth table.',
    prereq: 'Boolean duality; counting.',
    verify: () => { let n = 0; for (let f = 0; f < 256; f++) { let ok = 1; for (let x = 0; x < 8; x++) ok &= +((((f >> (7 - x)) & 1)) === 1 - ((f >> x) & 1)); n += ok; } return [n]; }
}, {
    title: 'A power of x in GF(2)',
    diagram: bitWord(['1', '0', '1', '1'], ['x³', 'x²', 'x', '1'], 'Coefficients of the divisor over GF(2)'),
    text: T`Over $\mathrm{GF}(2)$, compute $x^7 \bmod (x^3 + x + 1)$. Give the remainder as the integer whose binary digits are its coefficients (for example, $x^2 + 1 \to 5$).`,
    parts: [exInt('Remainder', 1)],
    hints: [T`$x^3 \equiv x + 1$.`, T`$x^3 + x + 1$ is primitive, so $x$ has order $2^3 - 1 = 7$.`],
    steps: [T`$x^3 = x+1$, $x^4 = x^2 + x$, $x^5 = x^2 + x + 1$, $x^6 = x^2 + 1$, $x^7 = 1$.`, T`The remainder is $1$.`],
    idea: 'A primitive polynomial makes x generate every nonzero element. That is why maximal-length LFSRs cycle through 2ⁿ−1 states.',
    prereq: 'Polynomial arithmetic over GF(2).',
    verify: () => { let r = 1; for (let i = 0; i < 7; i++) { r <<= 1; if (r & 8) r ^= 0b1011; } return [r]; }
}, {
    title: 'Monotone functions of three inputs',
    diagram: sketch(
        'One chain in the three-input Boolean lattice, ordered by bitwise inclusion.',
        arrow(146, 165, 249, 131) + arrow(293, 120, 402, 84) + arrow(448, 75, 546, 42),
        [[120, 177, '000'], [272, 132, '001'], [426, 88, '011'], [572, 44, '111'], [360, 220, 'Changing one input from 0 to 1']]),
    text: T`A Boolean function is monotone if changing any input from $0$ to $1$ never changes the output from $1$ to $0$. How many monotone functions of three variables are there (including the constants)?`,
    parts: [exInt('Monotone functions', 20)],
    hints: [T`Monotone functions correspond to antichains (sets of mutually incomparable subsets) of $\{1,2,3\}$.`, T`Count them by size, or enumerate all 256 functions.`],
    steps: [T`Count antichains of the Boolean lattice $2^{\{1,2,3\}}$.`, T`The count is $20$, the third Dedekind number.`],
    idea: 'Dedekind numbers grow astonishingly fast: 2, 3, 6, 20, 168, 7581, … and are known only up to n = 9.',
    prereq: 'Partial orders; Boolean lattices.',
    verify: () => { let n = 0; for (let f = 0; f < 256; f++) { let ok = 1; for (let x = 0; x < 8; x++) for (let k = 0; k < 3; k++) if (!(x & (1 << k)) && ((f >> x) & 1) > ((f >> (x | (1 << k))) & 1)) ok = 0; n += ok; } return [n]; }
}, {
    title: 'Maximal-length LFSRs of degree five',
    diagram: bitWord(['q₄', 'q₃', 'q₂', 'q₁', 'q₀'], [], 'Five register bits · feedback taps select the polynomial'),
    text: T`How many distinct degree-5 feedback polynomials over $\mathrm{GF}(2)$ produce a maximal-length (period $31$) LFSR? That is, how many primitive polynomials of degree 5 are there?`,
    parts: [exInt('Primitive polynomials', 6)],
    hints: [T`The number of primitive polynomials of degree $n$ is $\varphi(2^n - 1)/n$.`, T`$31$ is prime.`],
    steps: [T`$\varphi(31) = 30$.`, T`$30/5 = 6$.`],
    idea: 'When 2ⁿ−1 is prime, every irreducible polynomial of degree n is primitive.',
    prereq: 'Finite fields; Euler’s totient.',
    verify: () => { let n = 0; for (let p = 32; p < 64; p++) { if (!(p & 1)) continue; let r = 1, e = 0; do { r <<= 1; if (r & 32) r ^= p; e++; } while (r !== 1 && e < 40); n += +(e === 31); } return [n]; }
}]);

bank('fields', 'foundations', [{
    title: 'Capacitance of a lone sphere',
    diagram: circleSection(0, 'Conducting surface · R = 1 m'),
    text: T`An isolated conducting sphere of radius $1\,\text{m}$ sits in vacuum. Find its capacitance in units of $\varepsilon_0 \cdot \text{m}$.`,
    parts: [ex(T`$C/\varepsilon_0$`, 4 * Math.PI, T`4\pi`, 'm')],
    hints: [T`Charge $Q$ gives surface potential $V = \dfrac{Q}{4\pi\varepsilon_0 R}$, with infinity at $0\,\text{V}$.`],
    steps: [T`$C = Q/V = 4\pi\varepsilon_0 R$.`, T`With $R = 1\,\text{m}$: $C = 4\pi\varepsilon_0 \approx 111\,\text{pF}$.`],
    idea: 'Even the whole Earth has a capacitance of only about 0.7 mF.',
    prereq: 'Gauss’s law; potential.'
}, {
    title: 'The force that defined the ampere',
    diagram: sketch(
        'Parallel wires separated by one metre with current flowing in the same direction.',
        wire('M214 43v151M496 43v151') + arrow(214, 145, 214, 70) + arrow(496, 145, 496, 70) +
        guide('M214 204H496'),
        [[168, 119, '1 A'], [547, 119, '1 A'], [356, 228, '1 m']]),
    text: T`Two long parallel wires $1\,\text{m}$ apart each carry $1\,\text{A}$ in the same direction. Find the force per metre between them, in units of $\mu_0$ (N/m per H/m).`,
    parts: [ex(T`$F'/\mu_0$`, 1 / (2 * Math.PI), T`\dfrac{1}{2\pi}`)],
    hints: [T`Field of one wire: $B = \dfrac{\mu_0 I}{2\pi d}$.`, T`Force per length on the other: $F' = IB$.`],
    steps: [T`$F' = \dfrac{\mu_0 I_1 I_2}{2\pi d} = \dfrac{\mu_0}{2\pi}$.`, T`With $\mu_0 \approx 4\pi\times10^{-7}$, that is $2\times10^{-7}\,\text{N/m}$, which was the old definition of the ampere.`],
    idea: 'Parallel currents attract; antiparallel currents repel.',
    prereq: 'Biot–Savart law; magnetic force.'
}, {
    title: 'A charge inside a cube',
    diagram: sketch(
        'Charge at the centre of a cube, with flux crossing the six faces.',
        wire('M228 81h174v120H228zM228 81l65 -46h174v120l-65 46M402 81l65 -46') +
        guide('M293 35v120h174M293 155l-65 46') + dot(347, 118),
        [[365, 110, 'q']]),
    text: T`A point charge $q$ sits at the centre of a cube. What electric flux passes through one face, in units of $q/\varepsilon_0$?`,
    parts: [ex(T`$\Phi\,\varepsilon_0/q$`, 1 / 6, T`\dfrac16`)],
    hints: [T`Gauss: the total flux through the cube is $q/\varepsilon_0$.`, T`All six faces are equivalent by symmetry.`],
    steps: [T`$\Phi_{\text{total}} = q/\varepsilon_0$.`, T`One face: $\dfrac{q}{6\varepsilon_0}$.`],
    idea: 'Symmetry lets Gauss’s law answer questions about surfaces where the field is far from uniform.',
    prereq: 'Gauss’s law.'
}, {
    title: 'Skin depth versus frequency',
    diagram: curve('Depth / skin depth', 'Field amplitude / surface amplitude', [0, 5], [0, 1], x => Math.exp(-x)),
    text: T`Skin depth in a good conductor is $\delta = \sqrt{\dfrac{2}{\omega\mu\sigma}}$. If the frequency doubles, by what factor does $\delta$ change?`,
    parts: [ex('Factor', Math.SQRT1_2, T`\dfrac{1}{\sqrt2}`)],
    hints: [T`$\delta \propto \omega^{-1/2}$.`],
    steps: [T`$\delta_2/\delta_1 = \sqrt{\omega_1/\omega_2} = \sqrt{1/2}$.`, T`Factor $= 1/\sqrt2 \approx 0.707$.`],
    idea: 'At high frequency, current crowds into a thin surface layer, so AC resistance grows like √f.',
    prereq: 'Skin effect.'
}]);
bank('fields', 'applied', [{
    title: 'Design a 60-ohm coax',
    diagram: sketch(
        'Coax cross-section with conductor radii a and b.',
        ring(344, 120, 87) + ring(344, 120, 77) + ring(344, 120, 28) + arrow(344, 120, 316, 120) +
        arrow(344, 120, 399, 66),
        [[326, 110, 'a'], [393, 94, 'b']]),
    text: T`An air-filled coaxial line has $Z_0 = \dfrac{\eta_0}{2\pi}\ln\dfrac ba$. Taking $\eta_0 = 120\pi\ \Omega$, what ratio $b/a$ gives $Z_0 = 60\,\Omega$?`,
    parts: [ex(T`$b/a$`, Math.E, T`e`)],
    hints: [T`$\dfrac{\eta_0}{2\pi} = 60\,\Omega$.`],
    steps: [T`$60 = 60\ln(b/a)$.`, T`$\ln(b/a) = 1 \Rightarrow b/a = e \approx 2.718$.`],
    idea: 'Characteristic impedance depends only on geometry and the dielectric, and it grows only logarithmically with diameter ratio.',
    prereq: 'Transmission lines; coaxial geometry.'
}, {
    title: 'A charge above a grounded plane',
    diagram: sketch(
        'Charge above a grounded conducting plane.',
        wire('M135 171h440') + ground(350, 171) + dot(350, 62) + guide('M350 72v92'),
        [[372, 60, '+q'], [374, 119, 'd']]),
    text: T`A point charge $q$ is held a distance $d$ above an infinite grounded conducting plane. Find the attractive force, in units of $\dfrac{q^2}{\pi\varepsilon_0 d^2}$.`,
    parts: [ex(T`$F$`, 1 / 16, T`\dfrac{1}{16}`)],
    hints: [T`Replace the plane with an image charge $-q$ at depth $d$.`, T`The charge and its image are $2d$ apart.`],
    steps: [T`$F = \dfrac{q^2}{4\pi\varepsilon_0 (2d)^2} = \dfrac{q^2}{16\pi\varepsilon_0 d^2}$.`, T`In the requested units: $\tfrac1{16}$.`],
    idea: 'An image charge reproduces the boundary condition exactly, so the field above the plane is that of a dipole.',
    prereq: 'Method of images; Coulomb’s law.'
}, {
    title: 'A square loop versus a circle',
    diagram: sketch(
        'Circular and square wire loops with equal perimeters.',
        ring(210, 120, 64) + wire('M439 70h100v100H439z') + dot(210, 120) + dot(489, 120),
        [[210, 219, 'Circular loop'], [489, 219, 'Square loop']]),
    text: T`A wire of fixed length carrying current $I$ is bent first into a circle and then into a square. Find the ratio $B_{\text{square}}/B_{\text{circle}}$ of the magnetic fields at their centres.`,
    parts: [ex('Ratio', 8 * Math.SQRT2 / Math.PI ** 2, T`\dfrac{8\sqrt2}{\pi^2}`)],
    hints: [T`Circle of radius $R$: $B = \mu_0 I/(2R)$. Square of side $a$: $B = \dfrac{2\sqrt2\,\mu_0 I}{\pi a}$.`, T`Equal length: $4a = 2\pi R$.`],
    steps: [T`$a = \pi R/2$.`, T`$B_{\text{sq}} = \dfrac{2\sqrt2\,\mu_0 I}{\pi \cdot \pi R/2} = \dfrac{4\sqrt2\,\mu_0 I}{\pi^2 R}$.`, T`Ratio $= \dfrac{4\sqrt2/\pi^2}{1/2} = \dfrac{8\sqrt2}{\pi^2} \approx 1.146$.`],
    idea: 'The square’s corners lie farther out, but the middles of its sides lie closer in, and they win.',
    prereq: 'Biot–Savart law for finite segments.',
    verify: () => { const a = Math.PI / 2, n = 20000; let b = 0; for (let i = 0; i < n; i++) { const x = -a / 2 + (i + .5) * a / n, r = Math.hypot(x, a / 2); b += (a / 2) / r ** 3 * (a / n); } return [4 * b / (4 * Math.PI) / (1 / 2)]; }
}, {
    title: 'Solid sphere versus shell',
    diagram: sketch(
        'Charge throughout a solid ball versus charge confined to a spherical surface.',
        ring(211, 119, 68) + ring(510, 119, 68) +
        [0, 1, 2].flatMap(i => [0, 1, 2].map(j => dot(177 + i * 34, 85 + j * 34))).join('') +
        Array.from({length: 12}, (_, i) => dot(510 + 68 * Math.cos(i * Math.PI / 6), 119 + 68 * Math.sin(i * Math.PI / 6))).join(''),
        [[211, 217, 'Volume charge'], [510, 217, 'Surface charge']]),
    text: T`A total charge $Q$ is spread either uniformly through a ball of radius $R$ or uniformly over a spherical shell of radius $R$. Find the ratio of the electrostatic energies $W_{\text{ball}}/W_{\text{shell}}$.`,
    parts: [ex('Ratio', 6 / 5, T`\dfrac65`)],
    hints: [T`Shell: $W = \dfrac{Q^2}{8\pi\varepsilon_0 R}$.`, T`Ball: $W = \dfrac{3Q^2}{20\pi\varepsilon_0 R}$. The extra energy is stored in the field inside.`],
    steps: [T`Both share the same field outside, worth $\dfrac{Q^2}{8\pi\varepsilon_0 R}$.`, T`The ball adds field inside: $\displaystyle\int_0^R \tfrac{\varepsilon_0}{2}\left(\tfrac{Qr}{4\pi\varepsilon_0R^3}\right)^2 4\pi r^2 dr = \dfrac{Q^2}{40\pi\varepsilon_0R}$.`, T`Ratio $= \dfrac{1/8 + 1/40}{1/8} = \dfrac65$.`],
    idea: 'For a fixed outer radius, pushing all the charge to the surface minimises the energy, which is why charge on a conductor sits at its surface.',
    prereq: 'Field energy density; Gauss’s law.',
    verify: () => { const inside = NUM.simpson(r => (r ** 2) * r * r, 0, 1) * 4 * Math.PI / 2 / (16 * Math.PI ** 2), outside = 1 / (8 * Math.PI); return [(inside + outside) / outside]; }
}]);
bank('fields', 'advanced', [{
    title: 'Brewster’s angle and the other polarisation',
    diagram: sketch(
        'Incidence, reflection and refraction at an air–glass interface.',
        wire('M80 121H640') + guide('M356 28v178') + arrow(230, 45, 356, 121) + arrow(356, 121, 482, 45) +
        arrow(356, 121, 407, 202),
        [[114, 103, 'Air'], [125, 156, 'Glass'], [319, 78, 'θᵢ']]),
    text: T`Light in air strikes glass with $n = \sqrt3$. Find Brewster’s angle (in degrees), and the power reflectance of the $s$-polarised component at that angle.`,
    parts: [ex(T`$\theta_B$`, 60, '60', '°'), ex(T`$R_s$`, 1 / 4, T`\dfrac14`)],
    hints: [T`$\tan\theta_B = n$.`, T`At Brewster’s angle the transmitted angle is $90^\circ - \theta_B$. Use $r_s = \dfrac{\cos\theta_i - n\cos\theta_t}{\cos\theta_i + n\cos\theta_t}$.`],
    steps: [T`$\tan\theta_B = \sqrt3 \Rightarrow \theta_B = 60^\circ$, and $\theta_t = 30^\circ$.`, T`$r_s = \dfrac{\tfrac12 - \sqrt3\cdot\tfrac{\sqrt3}{2}}{\tfrac12 + \tfrac32} = -\dfrac12$.`, T`$R_s = r_s^2 = \tfrac14$.`],
    idea: 'At Brewster’s angle the reflected beam is purely s-polarised. That is why polarised sunglasses cut glare.',
    prereq: 'Fresnel equations; Snell’s law.'
}, {
    title: 'Directivity of a Hertzian dipole',
    diagram: curve('Polar angle θ (degrees)', 'Normalised radiation intensity', [0, 180], [0, 1], t => Math.sin(t * Math.PI / 180) ** 2),
    text: T`A short dipole radiates intensity $U(\theta) \propto \sin^2\theta$. Find its directivity $D = 4\pi U_{\max}\Big/\displaystyle\oint U\,d\Omega$.`,
    parts: [ex(T`$D$`, 1.5, T`\dfrac32`)],
    hints: [T`$\displaystyle\oint \sin^2\theta\,d\Omega = 2\pi\int_0^\pi \sin^3\theta\,d\theta$.`, T`$\displaystyle\int_0^\pi \sin^3\theta\,d\theta = \tfrac43$.`],
    steps: [T`$\oint U\,d\Omega = 2\pi\cdot\tfrac43 = \tfrac{8\pi}{3}$.`, T`$D = \dfrac{4\pi}{8\pi/3} = \dfrac32$, about $1.76\,\text{dBi}$.`],
    idea: 'Even the simplest antenna is directional: 1.5 times isotropic, broadside to its axis.',
    prereq: 'Radiation patterns; solid-angle integrals.',
    verify: () => [4 * Math.PI / (2 * Math.PI * NUM.simpson(t => Math.sin(t) ** 3, 0, Math.PI))]
}, {
    title: 'A waveguide at twice cutoff',
    diagram: curve('Frequency / cutoff frequency', 'Phase constant β / k₀', [1, 3], [0, 1], t => Math.sqrt(1 - 1 / (t * t))),
    text: T`A hollow waveguide carries a mode at exactly twice that mode’s cutoff frequency. Find the guide wavelength in units of the free-space wavelength, $\lambda_g/\lambda_0$.`,
    parts: [ex(T`$\lambda_g/\lambda_0$`, 2 / Math.sqrt(3), T`\dfrac{2}{\sqrt3}`)],
    hints: [T`$\lambda_g = \dfrac{\lambda_0}{\sqrt{1 - (f_c/f)^2}}$.`],
    steps: [T`$f_c/f = \tfrac12$.`, T`$\lambda_g/\lambda_0 = \dfrac{1}{\sqrt{3/4}} = \dfrac{2}{\sqrt3} \approx 1.155$.`],
    idea: 'Waves in a guide zig-zag between the walls, so their pattern along the axis is stretched.',
    prereq: 'Waveguide dispersion.'
}, {
    title: 'Field inside a magnetised sphere',
    diagram: sketch(
        'Uniform magnetisation within a sphere.',
        ring(355, 122, 85) + [320, 355, 390].map(x => arrow(x, 154, x, 88)).join(''),
        [[479, 126, 'M']]),
    text: T`A sphere is uniformly magnetised with magnetisation $\mathbf M$. Find the uniform field inside, $B/(\mu_0 M)$.`,
    parts: [ex(T`$B/(\mu_0M)$`, 2 / 3, T`\dfrac23`)],
    hints: [T`$\mathbf H$ inside a uniformly magnetised sphere is $-\mathbf M/3$ (demagnetising factor $\tfrac13$).`, T`$\mathbf B = \mu_0(\mathbf H + \mathbf M)$.`],
    steps: [T`$\mathbf H_{\text{in}} = -\tfrac13\mathbf M$.`, T`$\mathbf B_{\text{in}} = \mu_0\left(-\tfrac13 + 1\right)\mathbf M = \tfrac23\mu_0\mathbf M$.`],
    idea: 'Shape matters in magnetics: the demagnetising factor is 1/3 for a sphere, 0 for a long rod and 1 for a thin disk.',
    prereq: 'Magnetisation; bound currents; boundary conditions.'
}]);

bank('power', 'foundations', [{
    title: 'Power factor from complex power',
    diagram: acPowerDiagram('S = 3 + j4 kVA'),
    text: T`A load draws complex power $S = 3 + 4j\ \text{kVA}$. Find its power factor.`,
    parts: [ex('Power factor', 3 / 5, T`\dfrac35`)],
    hints: [T`$\text{pf} = P/|S|$.`],
    steps: [T`$|S| = \sqrt{3^2 + 4^2} = 5\,\text{kVA}$.`, T`$\text{pf} = 3/5 = 0.6$, lagging.`],
    idea: 'The 3-4-5 triangle is the power triangle in its simplest form.',
    prereq: 'Complex power.'
}, {
    title: 'Making a speaker look bigger',
    diagram: transformerDiagram('Nₚ', 'Nₛ', 'Amplifier sees 800 Ω · speaker load 8 Ω'),
    text: T`An ideal transformer must make an $8\,\Omega$ speaker look like $800\,\Omega$ to an amplifier. What turns ratio $N_p/N_s$ is required?`,
    parts: [ex(T`$N_p/N_s$`, 10, '10')],
    hints: [T`Impedance reflects by the square of the turns ratio.`],
    steps: [T`$Z_{\text{in}} = (N_p/N_s)^2 Z_L$.`, T`$(N_p/N_s)^2 = 100 \Rightarrow N_p/N_s = 10$.`],
    idea: 'Transformers match impedances, which is how valve amplifiers drive low-impedance speakers.',
    prereq: 'Ideal transformers.'
}, {
    title: 'Why transmission lines run at high voltage',
    diagram: curve('Voltage / initial voltage', 'Line loss / initial loss', [1, 10], [0, 1], v => 1 / (v * v)),
    text: T`A line delivers fixed power $P$ at unity power factor. If the transmission voltage is raised by a factor of $10$, by what factor do the $I^2R$ losses change?`,
    parts: [ex('Loss factor', 1 / 100, T`\dfrac{1}{100}`)],
    hints: [T`$I = P/V$.`, T`Loss $\propto I^2$.`],
    steps: [T`$I$ falls by a factor of $10$.`, T`$I^2R$ falls by a factor of $100$.`],
    idea: 'Loss scales with 1/V², the main reason grids use transformers and AC.',
    prereq: 'Power and current.'
}, {
    title: 'Constant power from three phases',
    diagram: sketch(
        'Three equal phase-voltage phasors spaced 120 degrees apart.',
        arrow(350, 125, 470, 125) + arrow(350, 125, 290, 29) + arrow(350, 125, 290, 221),
        [[499, 131, 'A'], [270, 31, 'B'], [269, 226, 'C'], [475, 191, '230 V RMS']]),
    text: T`A balanced three-phase load has phase voltage $230\,\text{V}$ RMS, phase current $10\,\text{A}$ RMS and power factor $0.8$. Show that the total instantaneous power is constant, and find it.`,
    parts: [ex(T`$p(t)$`, 5520, '5520', 'W')],
    hints: [T`Each phase gives $VI[\cos\phi + \cos(2\omega t - \phi - 2k\pi/3)]$.`, T`The three double-frequency terms sum to zero.`],
    steps: [T`$\sum_k \cos(2\omega t - \phi - 2k\pi/3) = 0$.`, T`$p(t) = 3VI\cos\phi = 3 \cdot 230 \cdot 10 \cdot 0.8$.`, T`$p = 5520\,\text{W}$, constant at every instant.`],
    idea: 'Balanced three-phase power has no pulsation, so motors run with smooth torque.',
    prereq: 'AC power; trigonometric identities.',
    verify: () => { const t = .37, w = 2 * Math.PI * 50, ph = Math.acos(.8); let p = 0; for (let k = 0; k < 3; k++) p += 2 * 230 * 10 * Math.cos(w * t - 2 * k * Math.PI / 3) * Math.cos(w * t - 2 * k * Math.PI / 3 - ph); return [p]; }
}]);
bank('power', 'applied', [{
    title: 'Half the maximum transfer',
    diagram: powerAngle(),
    text: T`Power flows over a lossless line as $P = P_{\max}\sin\delta$. At what load angle $\delta$, in degrees, is exactly half of $P_{\max}$ transmitted?`,
    parts: [ex(T`$\delta$`, 30, '30', '°')],
    hints: [T`$\sin\delta = \tfrac12$ on the stable side, $\delta < 90^\circ$.`],
    steps: [T`$\sin\delta = \tfrac12 \Rightarrow \delta = 30^\circ$.`, T`The other root, $150^\circ$, is an unstable equilibrium.`],
    idea: 'Of the two equilibria on the power–angle curve, only the one below 90° is stable.',
    prereq: 'Power–angle relation.'
}, {
    title: 'Correcting to unity power factor',
    diagram: acPowerDiagram('Inductive load · P = 3 kW · power factor 0.6'),
    text: T`A $3\,\text{kW}$ load runs at power factor $0.6$ lagging. How much capacitive reactive power must be added in parallel to reach unity power factor?`,
    parts: [ex(T`$Q_C$`, 4, '4', 'kvar')],
    hints: [T`$Q = P\tan\phi$, with $\cos\phi = 0.6$.`],
    steps: [T`$\tan\phi = \dfrac{0.8}{0.6} = \dfrac43$.`, T`$Q_C = 3 \cdot \tfrac43 = 4\,\text{kvar}$.`],
    idea: 'Correcting all the way to unity costs the most capacitance per unit of improvement, so in practice 0.95 is a common target.',
    prereq: 'Power triangle.'
}, {
    title: 'When is a transformer most efficient?',
    diagram: curve('Fraction of full load', 'Copper loss (W)', [0, 1], [0, 400], x => 400 * x * x),
    text: T`A transformer has $100\,\text{W}$ of core loss and $400\,\text{W}$ of copper loss at full load. At what fraction of full load is its efficiency highest?`,
    parts: [ex('Load fraction', 1 / 2, T`\dfrac12`)],
    hints: [T`Copper loss scales with $x^2$. Maximum efficiency occurs when copper loss equals core loss.`],
    steps: [T`$x^2 \cdot 400 = 100$.`, T`$x = \tfrac12$, i.e. half load.`],
    idea: 'Fixed and variable losses balance at the efficiency peak, a pattern that appears throughout engineering.',
    prereq: 'Transformer losses; optimisation.'
}, {
    title: 'Delta versus star',
    diagram: starDelta(),
    text: T`Three identical resistors are connected in star across a balanced three-phase supply, then reconnected in delta across the same supply. What is the ratio $P_\Delta/P_Y$?`,
    parts: [ex('Ratio', 3, '3')],
    hints: [T`In star, each resistor sees $V_L/\sqrt3$. In delta, each sees $V_L$.`],
    steps: [T`$P \propto V^2$ per resistor.`, T`$\dfrac{P_\Delta}{P_Y} = \dfrac{V_L^2}{V_L^2/3} = 3$.`],
    idea: 'This factor of 3 is behind star–delta starters for large motors.',
    prereq: 'Three-phase connections.'
}]);
bank('power', 'advanced', [{
    title: 'Critical clearing angle in closed form',
    diagram: powerAngle(true),
    text: T`A generator delivers $P_m = \tfrac12 P_{\max}$ through a single power–angle curve $P_e = P_{\max}\sin\delta$. A fault drops $P_e$ to zero, and after clearing the same curve returns. Use the equal-area criterion to find the critical clearing angle, in degrees.`,
    parts: [ex(T`$\delta_{cr}$`, 180 / Math.PI * Math.acos(Math.PI / 3 - Math.sqrt(3) / 2), T`\tfrac{180}{\pi}\arccos\!\left(\tfrac{\pi}{3} - \tfrac{\sqrt3}{2}\right)`, '°')],
    hints: [T`$\delta_0 = \pi/6$ and $\delta_{\max} = \pi - \delta_0 = 5\pi/6$.`, T`$\cos\delta_{cr} = \dfrac{P_m}{P_{\max}}(\delta_{\max} - \delta_0) + \cos\delta_{\max}$.`],
    steps: [T`$\cos\delta_{cr} = \tfrac12\cdot\tfrac{2\pi}{3} + \cos\tfrac{5\pi}{6} = \tfrac\pi3 - \tfrac{\sqrt3}{2}$.`, T`$\delta_{cr} = \arccos(0.1812) \approx 79.6^\circ$.`],
    idea: 'Accelerating area equals decelerating area: transient stability is an energy balance.',
    prereq: 'Swing equation; equal-area criterion.',
    verify: () => { const d0 = Math.PI / 6, dm = 5 * Math.PI / 6, f = dc => .5 * (dc - d0) - NUM.simpson(d => Math.sin(d) - .5, dc, dm, 2000); return [NUM.bisect(f, d0 + .01, dm - .01) * 180 / Math.PI]; }
}, {
    title: 'Worst-case ripple in a buck converter',
    diagram: buckDiagram(48, 'Vₒ', 0.1, 100),
    text: T`An ideal buck converter in continuous conduction has inductor ripple $\Delta I = \dfrac{V_{in}D(1-D)}{Lf}$. With $V_{in} = 48\,\text{V}$, $L = 100\,\mu\text{H}$ and $f = 100\,\text{kHz}$, which duty cycle gives the largest ripple, and how large is it?`,
    parts: [ex(T`$D$`, 1 / 2, T`\dfrac12`), ex(T`$\Delta I_{\max}$`, 1.2, T`\dfrac65`, 'A')],
    hints: [T`$D(1-D)$ peaks at $D = \tfrac12$, where it equals $\tfrac14$.`],
    steps: [T`$D = \tfrac12$.`, T`$\Delta I_{\max} = \dfrac{48}{4\cdot 10^{-4}\cdot10^{5}} = \dfrac{48}{40} = 1.2\,\text{A}$.`],
    idea: 'Size the inductor for D = 1/2 if the converter must work across a wide input range.',
    prereq: 'Switch-mode converters.'
}, {
    title: 'A single line-to-ground fault',
    diagram: sketch(
        'Series connection of the three sequence networks during a bolted ground fault.',
        element('AC', 95, 82, 95, 194, 'E') + element('R', 95, 82, 255, 82, 'Z₁') +
        element('R', 255, 82, 415, 82, 'Z₂') + element('R', 415, 82, 575, 82, 'Z₀') + wire('M575 82v112H95') +
        ground(575, 194),
        [[355, 219, 'Z₁ = Z₂ = Z₀ = j0.1 pu']]),
    text: T`A bolted single line-to-ground fault occurs at a bus with prefault voltage $E = 1\,\text{pu}$ and sequence impedances $Z_1 = Z_2 = Z_0 = j0.1\,\text{pu}$. Find the fault current magnitude in per unit.`,
    parts: [ex(T`$|I_f|$`, 10, '10', 'pu')],
    hints: [T`For an SLG fault the sequence networks are in series: $I_1 = I_2 = I_0 = \dfrac{E}{Z_1+Z_2+Z_0}$.`, T`$I_f = 3I_0$.`],
    steps: [T`$I_0 = \dfrac{1}{j0.3}$.`, T`$|I_f| = 3/0.3 = 10\,\text{pu}$, equal to the three-phase fault current when $Z_0 = Z_1$.`],
    idea: 'Symmetrical components turn an unbalanced fault into three balanced networks connected in series.',
    prereq: 'Symmetrical components.'
}, {
    title: 'Economic dispatch with equal lambdas',
    diagram: curve('Generator 1 output P₁', 'Combined generation cost', [0, 3], [0, 18], x => x * x + 2 * (3 - x) ** 2),
    text: T`Two generators have costs $C_1 = P_1^2$ and $C_2 = 2P_2^2$ (arbitrary units) and must together supply $P_1 + P_2 = 3$. Minimise the total cost. Find $P_1$ and the system marginal cost $\lambda$.`,
    parts: [ex(T`$P_1$`, 2, '2'), ex(T`$\lambda$`, 4, '4')],
    hints: [T`At the optimum, the incremental costs are equal: $dC_1/dP_1 = dC_2/dP_2 = \lambda$.`],
    steps: [T`$2P_1 = 4P_2 = \lambda$ and $P_1 + P_2 = 3$.`, T`$P_1 = 2$, $P_2 = 1$, $\lambda = 4$.`],
    idea: 'The Lagrange multiplier is the price of one more unit of demand, the basis of electricity market prices.',
    prereq: 'Lagrange multipliers.',
    verify: () => { let b = [0, Infinity]; for (let p = 0; p <= 3; p += 1e-5) { const c = p * p + 2 * (3 - p) ** 2; if (c < b[1]) b = [p, c]; } return [b[0], 2 * b[0]]; }
}]);

bank('measurement', 'foundations', [{
    title: 'Noise from rounding',
    diagram: sketch(
        'Uniform probability density between the two half-step error limits.',
        wire('M95 182H625M360 182V35M190 182V76H530V182'),
        [[190, 211, '−Δ/2'], [530, 211, '+Δ/2'], [391, 44, 'p(e)'], [621, 206, 'e']]),
    text: T`An ideal quantiser has step $\Delta$. Its error is uniformly distributed on $[-\Delta/2, \Delta/2]$. Find the RMS quantisation error as a fraction of $\Delta$.`,
    parts: [ex(T`$\sigma_q/\Delta$`, 1 / Math.sqrt(12), T`\dfrac{1}{\sqrt{12}}`)],
    hints: [T`$\sigma^2 = \dfrac1\Delta\displaystyle\int_{-\Delta/2}^{\Delta/2} e^2\,de$.`],
    steps: [T`$\sigma^2 = \dfrac{\Delta^2}{12}$.`, T`$\sigma_q = \Delta/\sqrt{12} \approx 0.289\,\Delta$.`],
    idea: 'This Δ/√12 is the source of the familiar 6.02N + 1.76 dB SNR formula for ADCs.',
    prereq: 'Variance of a uniform distribution.',
    verify: () => [Math.sqrt(NUM.simpson(e => e * e, -.5, .5))]
}, {
    title: 'How many readings to average?',
    diagram: curve('Independent readings N', 'Noise of mean / σ', [1, 100], [0, 1], n => 1 / Math.sqrt(n)),
    text: T`Readings have independent random noise of standard deviation $\sigma$. How many must be averaged to reduce the noise of the mean by a factor of $10$?`,
    parts: [exInt('Readings', 100)],
    hints: [T`$\sigma_{\bar x} = \sigma/\sqrt N$.`],
    steps: [T`$\sqrt N = 10 \Rightarrow N = 100$.`],
    idea: 'Averaging has diminishing returns: each extra decimal place of precision costs 100× more data.',
    prereq: 'Standard error of the mean.'
}, {
    title: 'Where does 1.76 dB come from?',
    diagram: signalChain(['Full-scale sine', 'N-bit ADC', 'Signal / noise'], 'Quantisation error spans one step Δ'),
    text: T`For a full-scale sine wave into an ideal $N$-bit ADC, $\text{SNR} = 6.02N + c$ dB. Find the exact expression for $c$, evaluated numerically in dB.`,
    parts: [ex(T`$c$`, 10 * Math.log10(1.5), T`10\log_{10}\tfrac32`, 'dB')],
    hints: [T`Signal power: $\dfrac{(2^N\Delta/2)^2}{2}$. Noise power: $\Delta^2/12$.`],
    steps: [T`$\text{SNR} = \dfrac{2^{2N}\Delta^2/8}{\Delta^2/12} = \tfrac32\cdot 2^{2N}$.`, T`In dB: $20N\log_{10}2 + 10\log_{10}\tfrac32$.`, T`$c = 10\log_{10}1.5 \approx 1.761\,\text{dB}$.`],
    idea: 'Memorised constants usually hide a clean ratio. Here it is the 3/2 between a sine’s power and uniform noise.',
    prereq: 'Decibels; quantisation noise.'
}, {
    title: 'A meter that changes the reading',
    diagram: loadedDividerDiagram(10, 10, 10, 10),
    text: T`Two $10\,\text{k}\Omega$ resistors form a divider across a $10\,\text{V}$ source. A voltmeter with $10\,\text{k}\Omega$ input resistance is connected across the lower resistor. What does it read?`,
    parts: [ex('Reading', 10 / 3, T`\dfrac{10}{3}`, 'V')],
    hints: [T`The meter is in parallel with the lower resistor: $5\,\text{k}\Omega$.`],
    steps: [T`$R_{\text{lower}} = 10\,\text{k}\parallel10\,\text{k} = 5\,\text{k}\Omega$.`, T`$V = 10\cdot\dfrac{5}{15} = \dfrac{10}{3}\,\text{V}$, not $5\,\text{V}$.`],
    idea: 'A meter is part of the circuit it measures. Its input resistance should be much larger than the source resistance.',
    prereq: 'Voltage dividers; parallel resistance.'
}]);
bank('measurement', 'applied', [{
    title: 'Fusing two measurements',
    diagram: sketch(
        'Two independent readings weighted and summed into one estimate.',
        arrow(165, 70, 323, 120) + arrow(165, 181, 323, 132) + ring(347, 126, 24) + arrow(371, 126, 554, 126),
        [[141, 54, 'w₁ x₁'], [141, 206, 'w₂ x₂'], [347, 133, 'Σ'], [561, 109, 'Estimate']]),
    text: T`Two independent unbiased measurements of the same quantity have standard deviations $\sigma_1 = 1$ and $\sigma_2 = 2$. Combine them with inverse-variance weights. What is the standard deviation of the result?`,
    parts: [ex(T`$\sigma$`, 2 / Math.sqrt(5), T`\dfrac{2}{\sqrt5}`)],
    hints: [T`$\dfrac{1}{\sigma^2} = \dfrac{1}{\sigma_1^2} + \dfrac{1}{\sigma_2^2}$.`],
    steps: [T`$\dfrac1{\sigma^2} = 1 + \tfrac14 = \tfrac54$.`, T`$\sigma = \dfrac{2}{\sqrt5} \approx 0.894$, better than the best single measurement.`],
    idea: 'Combining data always helps when it is weighted correctly. This is the one-step version of a Kalman filter.',
    prereq: 'Variance; weighted averages.',
    verify: () => { const w1 = 1, w2 = .25; return [Math.sqrt((w1 * w1 * 1 + w2 * w2 * 4)) / (w1 + w2)]; }
}, {
    title: 'Triangular uncertainty',
    diagram: curve('Error / a', 'Scaled density a·p', [-1, 1], [0, 1], x => 1 - Math.abs(x)),
    text: T`An error is known to follow a symmetric triangular distribution on $[-a, a]$. Find its standard uncertainty as a fraction of $a$.`,
    parts: [ex(T`$\sigma/a$`, 1 / Math.sqrt(6), T`\dfrac{1}{\sqrt6}`)],
    hints: [T`The density is $p(x) = (a - |x|)/a^2$.`, T`$\sigma^2 = \displaystyle 2\int_0^a x^2\frac{a - x}{a^2}dx$.`],
    steps: [T`$\sigma^2 = \dfrac{2}{a^2}\left(\dfrac{a^4}{3} - \dfrac{a^4}{4}\right) = \dfrac{a^2}{6}$.`, T`$\sigma = a/\sqrt6 \approx 0.408a$.`],
    idea: 'Uncertainty budgets divide a bound by √3 (uniform), √6 (triangular) or 3 (about 3σ normal), depending on what is known.',
    prereq: 'Probability densities; variance.',
    verify: () => [Math.sqrt(2 * NUM.simpson(x => x * x * (1 - x), 0, 1))]
}, {
    title: 'An average-responding meter reads a square wave',
    diagram: signalChain(['±1 V|square wave', 'Rectify|and average', 'Scale by|π / (2√2)'], 'Average-responding instrument'),
    text: T`A meter measures the rectified average and multiplies by $\dfrac{\pi}{2\sqrt2}$ so that it displays RMS correctly for sine waves. What does it display for a $\pm1\,\text{V}$ square wave?`,
    parts: [ex('Displayed value', Math.PI / (2 * Math.SQRT2), T`\dfrac{\pi}{2\sqrt2}`, 'V')],
    hints: [T`The rectified average of a $\pm1$ square wave is $1$.`],
    steps: [T`Displayed $= 1 \cdot \dfrac{\pi}{2\sqrt2} \approx 1.111\,\text{V}$.`, T`The true RMS is $1\,\text{V}$, so the meter reads about $11\%$ high.`],
    idea: 'Only a true-RMS meter is trustworthy for non-sinusoidal waveforms.',
    prereq: 'RMS; form factor.'
}, {
    title: 'Oversampling for extra bits',
    diagram: signalChain(['Sample at|OSR × rate', 'Low-pass|filter', 'Decimate'], 'Retain the signal band before reducing the sample rate'),
    text: T`Oversampling by $\text{OSR}$, then filtering and decimating, spreads white quantisation noise over a wider band. Each bit of resolution is worth $6.02\,\text{dB}$. What $\text{OSR}$ gives $3$ extra bits?`,
    parts: [exInt('OSR', 64)],
    hints: [T`Processing gain $= 10\log_{10}\text{OSR}$ dB.`, T`One extra bit needs a factor of $4$.`],
    steps: [T`$10\log_{10}\text{OSR} = 3 \cdot 20\log_{10}2 \Rightarrow \text{OSR} = 4^3$.`, T`$\text{OSR} = 64$.`],
    idea: 'Plain oversampling gains only half a bit per doubling. Noise shaping, as in delta-sigma converters, does far better.',
    prereq: 'Decibels; quantisation noise.'
}]);
bank('measurement', 'advanced', [{
    title: 'A three-point straight-line fit',
    diagram: curve('x', 'Observed y', [0, 2], [0, 3], x => [0, 1, 3][x], 'points'),
    text: T`Fit $y = a + bx$ by ordinary least squares to the points $(0, 0)$, $(1, 1)$ and $(2, 3)$. Find the slope and the intercept.`,
    parts: [ex(T`$b$`, 1.5, T`\dfrac32`), ex(T`$a$`, -1 / 6, T`-\dfrac16`)],
    hints: [T`$b = \dfrac{\sum (x - \bar x)(y - \bar y)}{\sum (x - \bar x)^2}$ and $a = \bar y - b\bar x$.`],
    steps: [T`$\bar x = 1$ and $\bar y = \tfrac43$.`, T`$b = \dfrac{(-1)(-\tfrac43) + 0 + (1)(\tfrac53)}{2} = \dfrac32$.`, T`$a = \tfrac43 - \tfrac32 = -\tfrac16$.`],
    idea: 'The least-squares line always passes through the centroid (x̄, ȳ).',
    prereq: 'Least squares.',
    verify: () => { const x = [0, 1, 2], y = [0, 1, 3], n = 3, sx = 3, sy = 4, sxx = 5, sxy = 7, b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [b, (sy - b * sx) / n]; }
}, {
    title: 'The golden Kalman gain',
    diagram: signalChain(['Predict|random walk', 'Innovation|z − prediction', 'Update|with gain K'], 'Process and measurement noise each have variance 1'),
    text: T`A scalar random walk $x_{k+1} = x_k + w_k$ is measured as $z_k = x_k + v_k$, with $\operatorname{Var} w = \operatorname{Var} v = 1$. Find the steady-state Kalman gain.`,
    parts: [ex(T`$K$`, (Math.sqrt(5) - 1) / 2, T`\dfrac{\sqrt5-1}{2}`)],
    hints: [T`The prior variance satisfies $P = \dfrac{P}{P+1} + 1$, i.e. $P^2 - P - 1 = 0$.`, T`$K = \dfrac{P}{P+1}$.`],
    steps: [T`$P = \varphi = \dfrac{1+\sqrt5}{2}$.`, T`$K = \dfrac{\varphi}{\varphi + 1} = \dfrac{\varphi}{\varphi^2} = \dfrac1\varphi$.`, T`$K = \dfrac{\sqrt5-1}{2} \approx 0.618$.`],
    idea: 'With equal process and measurement noise, the steady-state filter weighs the new measurement by 1/φ.',
    prereq: 'Kalman filtering; Riccati recursion.',
    verify: () => { let P = 1, K = 0; for (let i = 0; i < 200; i++) { const Pp = P + 1; K = Pp / (Pp + 1); P = (1 - K) * Pp; } return [K]; }
}, {
    title: 'kTC noise does not depend on R',
    diagram: rcDiagram('R', '1 pF', 'Noise', 'C'),
    text: T`A resistor charges a $1\,\text{pF}$ capacitor at $T = 300\,\text{K}$. Find the RMS thermal-noise voltage on the capacitor ($k = 1.380649\times10^{-23}\,\text{J/K}$).`,
    parts: [ex(T`$v_n$`, Math.sqrt(1.380649e-23 * 300 / 1e-12) * 1e6, T`\sqrt{kT/C}`, 'µV')],
    hints: [T`The noise density $4kTR$ is shaped by the $RC$ low-pass, whose noise bandwidth is $\dfrac{1}{4RC}$.`, T`$v_n^2 = 4kTR\cdot\dfrac{1}{4RC} = \dfrac{kT}{C}$.`],
    steps: [T`$R$ cancels: $v_n^2 = kT/C$, which is equipartition, $\tfrac12 C v^2 = \tfrac12 kT$.`, T`$v_n = \sqrt{\dfrac{1.380649\times10^{-23}\cdot300}{10^{-12}}} \approx 64.4\,\mu\text{V}$.`],
    idea: 'Sampling capacitors set a fundamental noise floor. Only a bigger C lowers it.',
    prereq: 'Thermal noise; noise bandwidth.',
    verify: () => { const k = 1.380649e-23, Tk = 300, C = 1e-12, R = 1e3, S = 4 * k * Tk * R, bw = NUM.simpson(f => 1 / (1 + (2 * Math.PI * f * R * C) ** 2), 0, 1e13, 200000) + 1 / (4 * Math.PI ** 2 * R * R * C * C * 1e13); return [Math.sqrt(S * bw) * 1e6]; }
}, {
    title: 'Noise figure of a two-stage chain',
    diagram: signalChain(['Input', 'Stage 1|F₁ = 2, G₁ = 10', 'Stage 2|F₂ = 11', 'Output'], 'Cascaded receiver stages'),
    text: T`A receiver chain has a first stage with noise factor $F_1 = 2$ and gain $G_1 = 10$, followed by a stage with $F_2 = 11$. Find the overall noise factor (as a ratio, not in dB).`,
    parts: [ex(T`$F$`, 3, '3')],
    hints: [T`Friis formula: $F = F_1 + \dfrac{F_2 - 1}{G_1}$.`],
    steps: [T`$F = 2 + \dfrac{10}{10} = 3$, which is $4.77\,\text{dB}$.`],
    idea: 'The first stage dominates: put the low-noise, high-gain amplifier first.',
    prereq: 'Noise figure; cascaded systems.'
}]);
