/* RF circuits: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (ABCD cascades, Cauer synthesis, two-tone simulation, Fourier integrals). */
const RF_READING = COMMS_READING.rfcircuits;
addTypes('rfcircuits', 'university', rfLMatch, rfMicrostrip, rfPad);
addTypes('rfcircuits', 'challenge', rfLadderFilter, rfSuperhet, rfIP3);
addTypes('rfcircuits', 'expert', rfPAConduction);
addTypes('rfcircuits', 'mastery', rfNoiseCircle);

/* Complex ABCD helpers: series impedance, shunt admittance, product, and |S21|² between equal real terminations R. */
const abcdSeries = z => [[cx(1), z], [cx(0), cx(1)]], abcdShunt = y => [[cx(1), cx(0)], [y, cx(1)]];
const abcdMul = (a, b) => [[ca(cm(a[0][0], b[0][0]), cm(a[0][1], b[1][0])), ca(cm(a[0][0], b[0][1]), cm(a[0][1], b[1][1]))], [ca(cm(a[1][0], b[0][0]), cm(a[1][1], b[1][0])), ca(cm(a[1][0], b[0][1]), cm(a[1][1], b[1][1]))]];
const abcdS21sq = (m, R) => 4 / cabs(ca(ca(m[0][0], cd(m[0][1], cx(R))), ca(cm(m[1][0], cx(R)), m[1][1]))) ** 2;

/* Level 2: an L-section matching network (series inductor, shunt capacitor) between two resistances. */
function rfLMatch(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'l-match', date, RF_READING), p = part;
    const [Rs, RL, f] = grid([50, 75], [5, 10, 12.5, 15, 20, 25, 30, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000], [13.56, 27, 100, 144, 433, 868, 915, 1575, 2450]);
    const hi = Math.max(Rs, RL), lo = Math.min(Rs, RL), Q = Math.sqrt(hi / lo - 1), Xs = Q * lo, Xp = hi / Q, w = 2 * Math.PI * f * 1e6, L = Xs / w * 1e9, C = 1 / (w * Xp) * 1e12, shuntAtLoad = RL > Rs;
    const xC = shuntAtLoad ? 420 : 200;
    const diagram = drawing(element('AC', 80, 80, 80, 190) + element('R', 80, 80, 200, 80, `${Rs} Ω`) + (shuntAtLoad ? element('L', 200, 80, 420, 80, 'L') + element('C', 420, 80, 420, 190, 'C') : element('C', 200, 80, 200, 190, 'C') + element('L', 200, 80, 420, 80, 'L')) +
        wire('M420 80H560M80 190H560') + element('R', 560, 80, 560, 190, `${RL} Ω`) + dt(360, 236, `${f} MHz`) + dot(xC, 80) + dot(xC, 190), `L-section match: a series inductor and a shunt capacitor between a ${Rs} ohm source and a ${RL} ohm load`, 250);
    return q({
        title: 'Designing an L-section match',
        text: T`Match a $${Rs}\,\Omega$ source to a $${RL}\,\Omega$ load at $${f}\,\text{MHz}$ with an L-section made of a series inductor and a shunt capacitor (a low-pass match). The shunt capacitor goes across the larger resistance. Find the loaded Q of the network, the series and shunt reactances, the inductance and the capacitance.`,
        givens: [T`$R_s = ${Rs}\,\Omega$, $R_L = ${RL}\,\Omega$`, T`$f = ${f}\,\text{MHz}$`, 'Series L, shunt C'],
        parts: [p('Q', Q, ''), p('Series reactance', Xs, 'Ω'), p('Shunt reactance', Xp, 'Ω'), p('Inductance', L, 'nH'), p('Capacitance', C, 'pF')],
        hints: [T`$Q = \sqrt{R_{\text{high}}/R_{\text{low}} - 1}$.`, T`The shunt branch sees the high resistance: $X_p = R_{\text{high}}/Q$. The series branch sits on the low side: $X_s = QR_{\text{low}}$.`, T`$L = X_s/\omega$ and $C = 1/(\omega X_p)$ with $\omega = 2\pi f$.`],
        steps: [T`$Q = \sqrt{${hi}/${lo} - 1} = ${tf(Q)}$.`, T`$X_s = ${tf(Q)}\times${lo} = ${tf(Xs)}\,\Omega$; $X_p = ${hi}/${tf(Q)} = ${tf(Xp)}\,\Omega$.`, T`$L = ${tf(L)}\,\text{nH}$, $C = ${tf(C)}\,\text{pF}$.`],
        idea: 'An L-network converts a parallel R–C into a smaller series R–C, then tunes out the reactance; the resistance ratio alone fixes its Q.',
        diagram, prerequisites: 'Series–parallel conversion; reactance.',
        verify: () => { // find C so the shunt branch with the high resistance has a real part equal to the low one, then L to cancel the rest; check the match by ABCD
            const zpar = X => cd(cx(1), cx(1 / hi, 1 / X)), xp = NUM.bisect(X => zpar(X).re - lo, 1e-6, 1e7, 200), xs = -zpar(xp).im;
            return [hi / xp, xs, xp, xs / w * 1e9, 1 / (w * xp) * 1e12];
        }
    });
}

/* Level 2: microstrip: effective permittivity, impedance, guided wavelength and the width for 50 Ω (Hammerstad). */
const msAnalyse = (er, u) => { // u = W/h
    const ee = (er + 1) / 2 + (er - 1) / 2 * ((1 + 12 / u) ** -.5 + (u < 1 ? .04 * (1 - u) ** 2 : 0));
    return {ee, z0: u < 1 ? 60 / Math.sqrt(ee) * Math.log(8 / u + u / 4) : 120 * Math.PI / (Math.sqrt(ee) * (u + 1.393 + .667 * Math.log(u + 1.444)))};
};
function rfMicrostrip(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'microstrip', date, RF_READING), p = part;
    const [[name, er], h, u, f] = grid([['PTFE', 2.2], ['RO3003', 3], ['RO4003C', 3.38], ['RO4350B', 3.66], ['FR-4', 4.4], ['RO3006', 6.15], ['RO3010', 10.2]], [.254, .508, .787, 1, 1.524], [.25, .5, 1, 1.5, 2, 3, 4], [1, 2.4, 5.8, 10]);
    const {ee, z0} = msAnalyse(er, u), lg = C0 / (f * 1e9 * Math.sqrt(ee)) * 1e3, u50 = NUM.bisect(x => msAnalyse(er, x).z0 - 50, .05, 20, 200), W = u * h;
    const diagram = drawing(wire('M120 200H600') + `<rect x="120" y="120" width="480" height="80" fill="#e9eee6" stroke="#315740"/>` + `<rect x="${360 - 20 * Math.min(u, 4)}" y="106" width="${40 * Math.min(u, 4)}" height="14" fill="#315740"/>` +
        dt(360, 96, `W = ${tf(W)} mm`) + dt(360, 166, `${name}, εr = ${er}`) + wire('M612 120V200') + dt(664, 166, `h = ${h} mm`) + dt(360, 232, 'ground plane'), 'Cross-section of a microstrip line: a copper strip on a dielectric substrate over a ground plane', 245);
    return q({
        title: 'A microstrip line on a real substrate',
        text: T`A microstrip line of width $W = ${tf(W)}\,\text{mm}$ is etched on ${name} ($\varepsilon_r = ${er}$, thickness $h = ${h}\,\text{mm}$). With the quasi-static Hammerstad formulas, for $u = W/h \ge 1$: $\varepsilon_{\text{eff}} = \dfrac{\varepsilon_r + 1}2 + \dfrac{\varepsilon_r - 1}2(1 + 12/u)^{-1/2}$ and $Z_0 = \dfrac{120\pi}{\sqrt{\varepsilon_{\text{eff}}}\,(u + 1.393 + 0.667\ln(u + 1.444))}$; for $u < 1$: add $0.04(1 - u)^2$ inside the bracket of $\varepsilon_{\text{eff}}$ and use $Z_0 = \dfrac{60}{\sqrt{\varepsilon_{\text{eff}}}}\ln\left(\dfrac8u + \dfrac u4\right)$. Find $\varepsilon_{\text{eff}}$, $Z_0$, the guided wavelength at $${f}\,\text{GHz}$ and the length of a quarter-wave section. What width gives $50\,\Omega$ on this substrate?`,
        givens: [T`${name}: $\varepsilon_r = ${er}$, $h = ${h}\,\text{mm}$`, T`$W = ${tf(W)}\,\text{mm}$ ($u = ${u}$)`, T`$f = ${f}\,\text{GHz}$`],
        parts: [p(T`$\varepsilon_{\text{eff}}$`, ee, ''), p(T`$Z_0$`, z0, 'Ω'), p('Guided wavelength', lg, 'mm'), p('Quarter-wave length', lg / 4, 'mm'), p('Width for 50 Ω', u50 * h, 'mm')],
        hints: [T`Some field lines run in air, so $1 < \varepsilon_{\text{eff}} < \varepsilon_r$.`, T`$\lambda_g = \dfrac{c}{f\sqrt{\varepsilon_{\text{eff}}}}$.`, T`$Z_0$ falls as the strip widens: solve $Z_0(u) = 50$ by trial or bisection, then $W = uh$.`],
        steps: [T`$u = ${u}$: $\varepsilon_{\text{eff}} = ${tf(ee)}$, $Z_0 = ${tf(z0)}\,\Omega$.`, T`$\lambda_g = ${tf(lg)}\,\text{mm}$; a quarter wave is $${tf(lg / 4)}\,\text{mm}$.`, T`$Z_0 = 50\,\Omega$ at $u = ${tf(u50)}$, i.e. $W = ${tf(u50 * h)}\,\text{mm}$.`],
        idea: 'A microstrip line is a transmission line with a mixed dielectric; its width sets the impedance and the substrate sets how much it shrinks the wavelength.',
        diagram, prerequisites: 'Transmission lines; logarithms.',
        verify: () => { // the 50 Ω width by the secant method instead of bisection
            const a = msAnalyse(er, u); let x0 = 1, x1 = 3;
            for (let i = 0; i < 60; i++) { const f0 = msAnalyse(er, x0).z0 - 50, f1 = msAnalyse(er, x1).z0 - 50; if (Math.abs(f1 - f0) < 1e-14) break; const x2 = Math.max(.05, x1 - f1 * (x1 - x0) / (f1 - f0)); x0 = x1; x1 = x2; }
            const lam = C0 / f / 1e9 / Math.sqrt(a.ee) * 1e3;
            return [a.ee, a.z0, lam, lam / 4, x1 * h];
        }
    });
}

/* Level 2: resistive T and π attenuator pads, and how a pad hides a mismatched load. */
function rfPad(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pad', date, RF_READING), p = part;
    const [Z0, A, vs] = grid([50, 75, 100, 300, 600], [1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 30], [1.2, 1.5, 2, 3, 5, 10]);
    const K = 10 ** (A / 20), Ts = Z0 * (K - 1) / (K + 1), Tp = 2 * Z0 * K / (K * K - 1), Pp = Z0 * (K + 1) / (K - 1), Ps = Z0 * (K * K - 1) / (2 * K), gl = (vs - 1) / (vs + 1), RLin = -20 * Math.log10(gl) + 2 * A;
    const diagram = drawing(element('R', 60, 80, 150, 80, 'R₁') + element('R', 150, 80, 240, 80, 'R₁') + element('R', 150, 80, 150, 190, 'R₂') + wire('M60 190H240') + dot(150, 80) + dot(150, 190) + dt(150, 236, 'T pad') +
        element('R', 470, 80, 600, 80, 'Rs') + element('R', 440, 80, 440, 190, 'Rp') + element('R', 630, 80, 630, 190, 'Rp') + wire('M420 80H470M600 80H650M420 190H650') + dot(440, 80) + dot(630, 80) + dot(440, 190) + dot(630, 190) + dt(535, 236, 'π pad'),
        'A T attenuator with two series arms and a shunt resistor, and a π attenuator with two shunt resistors and a series arm', 250);
    return q({
        title: 'Attenuator pads',
        text: T`Design a symmetrical $${A}\,\text{dB}$ attenuator for a $${Z0}\,\Omega$ system, matched at both ports, as a T pad (series arms $R_1$, shunt $R_2$) and as a π pad (shunt arms $R_p$, series $R_s$). A load with a VSWR of $${vs}$ is then connected through the pad: what return loss does the source see?`,
        givens: [T`$Z_0 = ${Z0}\,\Omega$, attenuation $${A}\,\text{dB}$`, T`Load VSWR $${vs}$`],
        parts: [p(T`T pad $R_1$`, Ts, 'Ω'), p(T`T pad $R_2$`, Tp, 'Ω'), p(T`π pad $R_p$`, Pp, 'Ω'), p(T`π pad $R_s$`, Ps, 'Ω'), p('Return loss through the pad', RLin, 'dB', .01, .01)],
        hints: [T`With $K = 10^{A/20}$: T pad $R_1 = Z_0\dfrac{K - 1}{K + 1}$, $R_2 = \dfrac{2Z_0K}{K^2 - 1}$.`, T`π pad: $R_p = Z_0\dfrac{K + 1}{K - 1}$, $R_s = Z_0\dfrac{K^2 - 1}{2K}$.`, T`A reflection passes through the pad twice, so the return loss improves by $2A$: $|\Gamma| = \dfrac{\text{VSWR} - 1}{\text{VSWR} + 1}$.`],
        steps: [T`$K = ${tf(K)}$: $R_1 = ${tf(Ts)}\,\Omega$, $R_2 = ${tf(Tp)}\,\Omega$.`, T`$R_p = ${tf(Pp)}\,\Omega$, $R_s = ${tf(Ps)}\,\Omega$.`, T`Load $|\Gamma| = ${tf(gl)}$ (return loss $${tf(-20 * Math.log10(gl))}\,\text{dB}$); through the pad $${tf(RLin)}\,\text{dB}$.`],
        idea: 'A matched pad trades signal for isolation: every decibel of attenuation adds two decibels of return loss, which is why test benches put pads on doubtful ports.',
        diagram, prerequisites: 'Resistor networks; reflection coefficient.',
        verify: () => { // solve each pad from its two conditions (input resistance Z0, voltage ratio 1/K) by nested bisection, and the return loss by ABCD
            const par = (a, b) => a * b / (a + b);
            const tFor = r2 => NUM.bisect(r1 => r1 + par(r2, r1 + Z0) - Z0, 0, Z0, 100);
            const tGain = r2 => { const r1 = tFor(r2), vin = 1, vm = vin * par(r2, r1 + Z0) / (r1 + par(r2, r1 + Z0)); return vm * Z0 / (r1 + Z0); };
            const r2 = NUM.bisect(x => tGain(x) - 1 / K, 1e-6, 1e7, 200), r1 = tFor(r2);
            const pFor = rs => NUM.bisect(rp => par(rp, rs + par(rp, Z0)) - Z0, Z0, 1e9, 200);
            const pGain = rs => { const rp = pFor(rs), z = par(rp, Z0); return z / (rs + z); };
            const rs = NUM.bisect(x => pGain(x) - 1 / K, 1e-6, 1e7, 200), rp = pFor(rs);
            const m = abcdMul(abcdMul(abcdSeries(cx(r1)), abcdShunt(cx(1 / r2))), abcdSeries(cx(r1))), zl = cx(Z0 * vs), zin = cd(ca(cm(m[0][0], zl), m[0][1]), ca(cm(m[1][0], zl), m[1][1])), g = cabs(cd(cs(zin, cx(Z0)), ca(zin, cx(Z0))));
            return [r1, r2, rp, rs, -20 * Math.log10(g)];
        }
    });
}

/* Level 3: a Butterworth or Chebyshev LC low-pass ladder: prototype values, scaled components and stopband attenuation. */
const ladderG = (N, ripple) => { // prototype values g₁…g_N, shunt-C first
    if (!ripple) return Array.from({length: N}, (_, k) => 2 * Math.sin((2 * k + 1) * Math.PI / (2 * N)));
    const b = Math.log(1 / Math.tanh(ripple / 17.37)), gm = Math.sinh(b / (2 * N)), a = k => Math.sin((2 * k - 1) * Math.PI / (2 * N)), bb = k => gm * gm + Math.sin(k * Math.PI / N) ** 2, g = [2 * a(1) / gm];
    for (let k = 2; k <= N; k++) g.push(4 * a(k - 1) * a(k) / (bb(k - 1) * g[k - 2]));
    return g;
};
const ladderAtten = (N, ripple, x) => { const ch = (n, v) => Math.abs(v) <= 1 ? Math.cos(n * Math.acos(v)) : Math.cosh(n * Math.acosh(Math.abs(v))); return ripple ? 10 * Math.log10(1 + (10 ** (ripple / 10) - 1) * ch(N, x) ** 2) : 10 * Math.log10(1 + x ** (2 * N)); };
function rfLadderFilter(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ladder-filter', date, RF_READING), p = part;
    const [N, ripple, Z0, fc, m] = grid([3, 5], [0, .1, .5, 1], [50, 75], [10, 50, 100, 200, 500, 1000], [1.5, 2, 2.5, 3, 4]);
    const g = ladderG(N, ripple), wc = 2 * Math.PI * fc * 1e6, C1 = g[0] / (Z0 * wc) * 1e12, L2 = g[1] * Z0 / wc * 1e9;
    let M = [[cx(1), cx(0)], [cx(0), cx(1)]];
    g.forEach((v, k) => { const s = cx(0, 2 * Math.PI * m * fc * 1e6); M = abcdMul(M, k % 2 ? abcdSeries(cm(s, cx(v * Z0 / wc))) : abcdShunt(cm(s, cx(v / (Z0 * wc))))); });
    const att = -10 * Math.log10(abcdS21sq(M, Z0)), kind = ripple ? `${ripple} dB-ripple Chebyshev` : 'Butterworth (maximally flat)';
    const xs = Array.from({length: N}, (_, k) => 150 + k * 420 / (N - 1));
    const diagram = drawing(element('AC', 60, 80, 60, 190) + element('R', 60, 80, 130, 80, `${Z0} Ω`) + wire(`M130 80H${xs[0]}M60 190H650`) + xs.map((x, k) => k % 2 ? element('L', xs[k - 1], 80, xs[k + 1] === undefined ? 600 : xs[k + 1], 80, `L${k + 1}`) : element('C', x, 80, x, 190, `C${k + 1}`) + dot(x, 80) + dot(x, 190)).join('') +
        wire(`M${xs[N - 1]} 80H650`) + element('R', 650, 80, 650, 190, `${Z0} Ω`) + dt(360, 236, `${N === 3 ? "3rd" : "5th"}-order ${ripple ? 'Chebyshev' : 'Butterworth'}, fc = ${fc} MHz`), `An LC low-pass ladder of order ${N}: shunt capacitors alternating with series inductors between ${Z0} ohm terminations`, 250);
    return q({
        title: 'An LC low-pass ladder filter',
        text: T`Design a ${N === 3 ? "3rd" : "5th"}-order ${kind} low-pass filter for $${Z0}\,\Omega$ terminations with a cutoff of $${fc}\,\text{MHz}$${ripple ? ' (the ripple-band edge)' : ' (the 3 dB point)'}, as a ladder starting with a shunt capacitor. Find the prototype values $g_1$ and $g_2$, the capacitance $C_1$ and the inductance $L_2$. Then, by cascading the ABCD matrices of the ladder, find the attenuation at $${m}f_c$.`,
        givens: [T`Order $${N}$, ${kind}`, T`$Z_0 = ${Z0}\,\Omega$, $f_c = ${fc}\,\text{MHz}$`, T`Attenuation wanted at $${m}f_c$`],
        parts: [p(T`$g_1$`, g[0], ''), p(T`$g_2$`, g[1], ''), p(T`$C_1$`, C1, 'pF'), p(T`$L_2$`, L2, 'nH'), p(T`Attenuation at $${m}f_c$`, att, 'dB', .01, .01)],
        hints: [ripple ? T`Chebyshev: $\beta = \ln\coth\dfrac{L_r}{17.37}$, $\gamma = \sinh\dfrac\beta{2N}$, $a_k = \sin\dfrac{(2k - 1)\pi}{2N}$, $b_k = \gamma^2 + \sin^2\dfrac{k\pi}N$; $g_1 = 2a_1/\gamma$, $g_k = \dfrac{4a_{k-1}a_k}{b_{k-1}g_{k-1}}$.` : T`Butterworth: $g_k = 2\sin\dfrac{(2k - 1)\pi}{2N}$.`, T`Scale: $C = \dfrac{g}{Z_0\omega_c}$, $L = \dfrac{gZ_0}{\omega_c}$.`, T`Multiply shunt $\begin{pmatrix}1 & 0\\ j\omega C & 1\end{pmatrix}$ and series $\begin{pmatrix}1 & j\omega L\\ 0 & 1\end{pmatrix}$ matrices; then $|S_{21}|^2 = \dfrac{4}{|A + B/Z_0 + CZ_0 + D|^2}$.`],
        steps: [T`$g = (${g.map(v => tf(v, 4)).join(',\\ ')})$.`, T`$C_1 = ${tf(C1)}\,\text{pF}$, $L_2 = ${tf(L2)}\,\text{nH}$.`, T`At $${m}f_c$ the ladder gives $${tf(att)}\,\text{dB}$ of attenuation${ripple ? T`, as $10\log_{10}\bigl(1 + \varepsilon^2T_{${N}}^2(${m})\bigr)$ predicts` : T`, as $10\log_{10}(1 + ${m}^{${2 * N}})$ predicts`}.`],
        idea: 'Filter design is a table look-up plus scaling: the prototype fixes the shape, and the cutoff and impedance only rescale the parts.',
        diagram, prerequisites: 'Filter approximations; ABCD matrices.',
        verify: () => { // Cauer synthesis: build Γ(s) = N(s)/D(s) from the poles, expand Y(s) = (D + N)/(D − N) as a continued fraction
            const pmul = (a, b) => { const r = Array(a.length + b.length - 1).fill(0).map(() => cx(0)); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = ca(r[i + j], cm(x, y)); })); return r; };
            const fromRoots = (roots, lead) => roots.reduce((acc, r) => pmul(acc, [cx(1), neg(r)]), [cx(lead)]).map(z => z.re);
            const th = k => (2 * k - 1) * Math.PI / (2 * N), ks = Array.from({length: N}, (_, i) => i + 1);
            let D, Nn;
            if (!ripple) { D = fromRoots(ks.map(k => cx(-Math.sin(th(k)), Math.cos(th(k)))), 1); Nn = [1, ...Array(N).fill(0)]; }
            else { const e = Math.sqrt(10 ** (ripple / 10) - 1), a = Math.asinh(1 / e) / N, lead = e * 2 ** (N - 1); D = fromRoots(ks.map(k => cx(-Math.sinh(a) * Math.sin(th(k)), Math.cosh(a) * Math.cos(th(k)))), lead); Nn = fromRoots(ks.map(k => cx(0, Math.cos(th(k)))), lead); }
            let num = D.map((v, i) => v + Nn[i]), den = D.map((v, i) => v - Nn[i]).slice(1);
            const gs = [];
            for (let k = 0; k < N; k++) { const gk = num[0] / den[0]; gs.push(gk); const rem = num.map((v, i) => v - gk * (den[i] ?? 0)).slice(1); rem.shift(); num = den; den = rem.slice(rem.findIndex(v => Math.abs(v) > 1e-12 * Math.max(...rem.map(Math.abs)))); }
            const w0 = 2 * Math.PI * fc * 1e6;
            return [gs[0], gs[1], gs[0] / (Z0 * w0) * 1e12, gs[1] * Z0 / w0 * 1e9, ladderAtten(N, ripple, m)];
        }
    });
}

/* Level 3: frequency planning of a superheterodyne receiver: LO, image, half-IF spur and preselector rejection. */
let SUPERHET_CASES = null;
function rfSuperhet(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'superhet', date, RF_READING), p = part;
    SUPERHET_CASES ||= product([88, 100, 433, 868, 915, 1575, 2450], [10.7, 21.4, 45, 70, 140], [2, 3, 4, 5], [2, 5, 10, 20, 40]).filter(([f, fi, n, B]) => B <= f / 5 && fi >= B);
    const [[fr, fi, n, B]] = grid(SUPERHET_CASES), flo = fr + fi, fim = fr + 2 * fi, fh = fr + fi / 2, xi = f => (f / fr - fr / f) * fr / B, rej = f => 10 * Math.log10(1 + xi(f) ** (2 * n));
    const lo = fr - fi, hi = fr + 2.6 * fi, X = f => 80 + 560 * (f - lo) / (hi - lo);
    const resp = Array.from({length: 121}, (_, i) => { const f = lo + (hi - lo) * i / 120; return `${i ? 'L' : 'M'}${X(f).toFixed(1)} ${(190 - 130 / Math.sqrt(1 + xi(f) ** (2 * n))).toFixed(1)}`; }).join('');
    const diagram = drawing(wire('M60 190H670') + `<path d="${resp}" stroke="#83968b"/>` + [[fr, 'RF'], [fh, '½ IF'], [flo, 'LO'], [fim, 'image']].map(([f, t], i) => wire(`M${X(f).toFixed(1)} 190V${i === 2 ? 70 : 110}`) + dt(X(f), i === 2 ? 60 : 100 - (i % 2) * 16, t)).join('') +
        dt(360, 222, 'frequency (MHz) · grey: preselector response'), 'Frequency plan: the wanted signal, the half-IF spur, the local oscillator and the image, with the preselector response over them', 235);
    return q({
        title: 'Frequency plan of a superheterodyne receiver',
        text: T`A superheterodyne receiver tunes $${fr}\,\text{MHz}$ to an IF of $${fi}\,\text{MHz}$ with the local oscillator above the signal. Find the LO frequency and the image frequency. The preselector is an order-$${n}$ Butterworth band-pass filter centred on $${fr}\,\text{MHz}$ with a $${B}\,\text{MHz}$ 3 dB bandwidth, so its attenuation is $10\log_{10}(1 + \xi^{2n})$ with $\xi = \dfrac{f_0}{B}\left(\dfrac{f}{f_0} - \dfrac{f_0}{f}\right)$. Find the image rejection, the frequency of the half-IF spur (an input that the mixer's second-order products convert to the IF: $2f_{LO} - 2f = f_{IF}$), and its rejection.`,
        givens: [T`$f_{RF} = ${fr}\,\text{MHz}$, $f_{IF} = ${fi}\,\text{MHz}$, high-side LO`, T`Preselector: Butterworth, order $${n}$, $B = ${B}\,\text{MHz}$`],
        parts: [p('LO frequency', flo, 'MHz'), p('Image frequency', fim, 'MHz'), p('Image rejection', rej(fim), 'dB', .01, .01), p('Half-IF spur frequency', fh, 'MHz'), p('Half-IF rejection', rej(fh), 'dB', .01, .01)],
        hints: [T`High-side LO: $f_{LO} = f_{RF} + f_{IF}$; the image sits as far above the LO: $f_{im} = f_{RF} + 2f_{IF}$.`, T`Evaluate $\xi$ at the image and convert to decibels.`, T`$2f_{LO} - 2f = f_{IF}$ gives $f = f_{RF} + f_{IF}/2$, much closer to the wanted signal.`],
        steps: [T`$f_{LO} = ${tf(flo)}\,\text{MHz}$, $f_{im} = ${tf(fim)}\,\text{MHz}$.`, T`At the image $\xi = ${tf(xi(fim))}$: rejection $${tf(rej(fim))}\,\text{dB}$.`, T`Half-IF spur at $${tf(fh)}\,\text{MHz}$: $\xi = ${tf(xi(fh))}$, rejection $${tf(rej(fh))}\,\text{dB}$.`],
        idea: 'A higher IF moves the image away from the preselector passband, but the half-IF spur stays close and often sets the filter order.',
        diagram, prerequisites: 'Mixing; band-pass filters; decibels.',
        verify: () => { // build the actual band-pass ladder from the Butterworth prototype and evaluate |S21| by ABCD
            const g = Array.from({length: n}, (_, k) => 2 * Math.sin((2 * k + 1) * Math.PI / (2 * n))), d = B / fr;
            const at = f => { const w = f / fr; let M = [[cx(1), cx(0)], [cx(0), cx(1)]]; g.forEach((v, k) => { const jw = cx(0, w), y = ca(cm(jw, cx(v / d)), cd(cx(1), cm(jw, cx(d / v)))); M = abcdMul(M, k % 2 ? abcdSeries(y) : abcdShunt(y)); }); return -10 * Math.log10(abcdS21sq(M, 1)); };
            return [fr + fi, fr + 2 * fi, at(fr + 2 * fi), (2 * (fr + fi) - fi) / 2, at((2 * (fr + fi) - fi) / 2)];
        }
    });
}

/* Level 3: cascaded IIP3 and noise figure of a receiver front end, its dynamic range and intermodulation levels. */
function rfIP3(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ip3', date, RF_READING), p = part;
    const [[G1, N1, I1], [G2, N2, I2], [G3, N3, I3], B, Pin] = grid(product([12, 15, 18, 20], [.8, 1.2, 2], [-10, -5, 0]), product([-7, -6, 8, 10], [7, 9, 12], [5, 10, 15]), product([20, 25, 30], [4, 6], [10, 15, 20]), [.03, .2, 1, 5], [-50, -45, -40, -35]);
    const lin = x => 10 ** (x / 10), gs = [G1, G2, G3], ns = [N1, N2, N3], is = [I1, I2, I3];
    let inv = 0, gc = 1, F = 0; gs.forEach((g, i) => { inv += gc / lin(is[i]); F += i ? (lin(ns[i]) - 1) / gc : lin(ns[i]); gc *= lin(g); });
    const IIP3 = -10 * Math.log10(inv), NF = 10 * Math.log10(F), floor = -174 + NF + 10 * Math.log10(B * 1e6), SFDR = 2 / 3 * (IIP3 - floor), Gt = G1 + G2 + G3, im3 = 3 * Pin - 2 * IIP3 + Gt, cross = (2 * IIP3 + floor) / 3;
    const diagram = drawing([['LNA', G1, N1, I1], ['mixer', G2, N2, I2], ['IF amp', G3, N3, I3]].map(([t, g, nf, ii], i) => wire(`M${110 + i * 190} 80h130v60h-130z`) + dt(175 + i * 190, 116, t) + dt(175 + i * 190, 168, `G ${g} dB, NF ${nf} dB`) + dt(175 + i * 190, 192, `IIP3 ${ii} dBm`) + (i < 2 ? arrow(240 + i * 190, 110, 300 + i * 190, 110) : '')).join('') +
        arrow(50, 110, 110, 110) + arrow(620, 110, 680, 110) + dt(360, 232, `two tones at ${Pin} dBm each, B = ${B} MHz`), 'A three-stage receiver front end: LNA, mixer and IF amplifier with their gains, noise figures and intercept points', 245);
    return q({
        title: 'Intercept point and dynamic range of a front end',
        text: T`A receiver front end is an LNA (gain $${G1}\,\text{dB}$, NF $${N1}\,\text{dB}$, IIP3 $${I1}\,\text{dBm}$), a mixer ($${G2}\,\text{dB}$, NF $${N2}\,\text{dB}$, IIP3 $${I2}\,\text{dBm}$) and an IF amplifier ($${G3}\,\text{dB}$, NF $${N3}\,\text{dB}$, IIP3 $${I3}\,\text{dBm}$). Find the cascaded input IP3 and noise figure. In a $${B}\,\text{MHz}$ bandwidth, find the spur-free dynamic range $\tfrac23(\text{IIP3} - N_{\text{floor}})$ with $N_{\text{floor}} = -174 + \text{NF} + 10\log_{10}B$. Two tones arrive at $${Pin}\,\text{dBm}$ each: find the level of each third-order product at the output, and the input tone level at which those products reach the noise floor.`,
        givens: [T`LNA: $${G1}\,\text{dB}$, $${N1}\,\text{dB}$, $${I1}\,\text{dBm}$`, T`Mixer: $${G2}\,\text{dB}$, $${N2}\,\text{dB}$, $${I2}\,\text{dBm}$`, T`IF amp: $${G3}\,\text{dB}$, $${N3}\,\text{dB}$, $${I3}\,\text{dBm}$`, T`$B = ${B}\,\text{MHz}$, tones $${Pin}\,\text{dBm}$`],
        parts: [p('Cascaded IIP3', IIP3, 'dBm', .01, .02), p('Cascaded noise figure', NF, 'dB', .01, .01), p('Spur-free dynamic range', SFDR, 'dB', .01, .02), p('Output IM3 level', im3, 'dBm', .01, .05), p('Input level where IM3 meets the floor', cross, 'dBm', .01, .02)],
        hints: [T`Intercepts add like resistors in parallel, referred to the input: $\dfrac1{\text{IIP3}} = \dfrac1{\text{IIP3}_1} + \dfrac{G_1}{\text{IIP3}_2} + \dfrac{G_1G_2}{\text{IIP3}_3}$ (linear mW).`, T`Noise figure by Friis: $F = F_1 + \dfrac{F_2 - 1}{G_1} + \dfrac{F_3 - 1}{G_1G_2}$.`, T`Input-referred IM3 $= 3P_{\text{in}} - 2\,\text{IIP3}$ (dBm); add the total gain for the output.`],
        steps: [T`$\text{IIP3} = ${tf(IIP3)}\,\text{dBm}$, $\text{NF} = ${tf(NF)}\,\text{dB}$.`, T`$N_{\text{floor}} = ${tf(floor)}\,\text{dBm}$, SFDR $= \tfrac23(${tf(IIP3)} - (${tf(floor)})) = ${tf(SFDR)}\,\text{dB}$.`, T`IM3 at the output: $3(${Pin}) - 2(${tf(IIP3)}) + ${Gt} = ${tf(im3)}\,\text{dBm}$.`, T`IM3 meets the floor at $P_{\text{in}} = (2\,\text{IIP3} + N_{\text{floor}})/3 = ${tf(cross)}\,\text{dBm}$.`],
        idea: 'Gain ahead of a stage helps its noise but hurts its linearity: front-end design balances the two to maximise dynamic range.',
        diagram, prerequisites: 'Noise figure; intermodulation; decibels.',
        verify: () => { // simulate two tones through three cubic stages and read the products off a DFT; noise by temperatures
            const stages = gs.map((g, i) => { const a1 = 10 ** (g / 20), A = Math.sqrt(2 * 10 ** (is[i] / 10) * 1e-3); return {a1, a3: 4 * a1 / (3 * A * A)}; });
            const n = 512, Pt = IIP3 - 60, amp = Math.sqrt(2 * 10 ** (Pt / 10) * 1e-3), bin = (y, k) => Math.hypot(y.reduce((s, v, t) => s + v * Math.cos(2 * Math.PI * k * t / n), 0), y.reduce((s, v, t) => s + v * Math.sin(2 * Math.PI * k * t / n), 0)) * 2 / n;
            const y = Array.from({length: n}, (_, t) => stages.reduce((x, st) => st.a1 * x - st.a3 * x ** 3, amp * (Math.cos(2 * Math.PI * 5 * t / n) + Math.cos(2 * Math.PI * 6 * t / n))));
            const fund = 20 * Math.log10(bin(y, 5)), imd = 20 * Math.log10(bin(y, 4)), iip3 = Pt + (fund - imd) / 2;
            let te = 0, g = 1; gs.forEach((gg, i) => { te += 290 * (10 ** (ns[i] / 10) - 1) / g; g *= 10 ** (gg / 10); });
            const nf = 10 * Math.log10(1 + te / 290), fl = -174 + nf + 10 * Math.log10(B * 1e6);
            return [iip3, nf, 2 / 3 * (iip3 - fl), 3 * Pin - 2 * iip3 + Gt, (2 * iip3 + fl) / 3];
        }
    });
}

/* Level 4 (expert): reduced-conduction-angle power amplifiers: current harmonics, output power, efficiency and load line. */
function rfPAConduction(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pa-conduction', date, RF_READING), p = part;
    const [[al, cls], Vdd, Vk, Im] = grid([[360, 'A'], [300, 'AB'], [240, 'AB'], [210, 'AB'], [180, 'B'], [150, 'C'], [120, 'C']], [5, 12, 28, 48], [.5, 1, 2], [.2, .5, 1, 2, 5]);
    const a = al * Math.PI / 180, c = Math.cos(a / 2), Idc = Im / (2 * Math.PI) * (2 * Math.sin(a / 2) - a * c) / (1 - c), I1 = Im / (2 * Math.PI) * (a - Math.sin(a)) / (1 - c), Pout = I1 * (Vdd - Vk) / 2, eff = 100 * Pout / (Vdd * Idc), Ropt = (Vdd - Vk) / I1;
    const diagram = curve('angle θ (degrees)', 'drain current / Imax', [-180, 180], [0, 1], t => { const th = t * Math.PI / 180; return Math.abs(th) <= a / 2 + 1e-12 ? Math.max(0, (Math.cos(th) - c) / (1 - c)) : 0; });
    return q({
        title: 'Conduction angle of a power amplifier',
        text: T`A transistor power amplifier is biased for a conduction angle of $${al}\,{}^\circ$ (class ${cls}): its drain current is a truncated cosine, $i(\theta) = I_{\max}\dfrac{\cos\theta - \cos(\alpha/2)}{1 - \cos(\alpha/2)}$ for $|\theta| \le \alpha/2$ and zero otherwise, with $I_{\max} = ${Im}\,\text{A}$. A tuned load passes only the fundamental. With $V_{DD} = ${Vdd}\,\text{V}$ and a knee voltage of $${Vk}\,\text{V}$ (so the drain swings $${Vdd - Vk}\,\text{V}$), find the DC current, the fundamental current amplitude, the output power, the drain efficiency and the optimum load resistance.`,
        givens: [T`$\alpha = ${al}\,{}^\circ$, $I_{\max} = ${Im}\,\text{A}$`, T`$V_{DD} = ${Vdd}\,\text{V}$, $V_k = ${Vk}\,\text{V}$`],
        parts: [p('DC current', Idc * 1e3, 'mA'), p('Fundamental current', I1 * 1e3, 'mA'), p('Output power', Pout, 'W'), p('Drain efficiency', eff, '%'), p('Optimum load', Ropt, 'Ω')],
        hints: [T`Fourier coefficients of the truncated cosine: $I_{DC} = \dfrac{I_{\max}}{2\pi}\cdot\dfrac{2\sin(\alpha/2) - \alpha\cos(\alpha/2)}{1 - \cos(\alpha/2)}$, $I_1 = \dfrac{I_{\max}}{2\pi}\cdot\dfrac{\alpha - \sin\alpha}{1 - \cos(\alpha/2)}$.`, T`$P_{\text{out}} = \tfrac12I_1(V_{DD} - V_k)$ and $\eta = P_{\text{out}}/(V_{DD}I_{DC})$.`, T`The load that makes the fundamental swing exactly $V_{DD} - V_k$: $R_{\text{opt}} = (V_{DD} - V_k)/I_1$.`],
        steps: [T`$\cos(\alpha/2) = ${tf(c)}$: $I_{DC} = ${tf(Idc * 1e3)}\,\text{mA}$, $I_1 = ${tf(I1 * 1e3)}\,\text{mA}$.`, T`$P_{\text{out}} = \tfrac12\times${tf(I1)}\times${Vdd - Vk} = ${tf(Pout)}\,\text{W}$.`, T`$\eta = ${tf(Pout)}/(${Vdd}\times${tf(Idc)}) = ${tf(eff)}\,\%$; $R_{\text{opt}} = ${tf(Ropt)}\,\Omega$.`],
        idea: 'Narrowing the conduction angle raises efficiency from 50% (class A) towards 100%, at the cost of output power for a given device current.',
        diagram, prerequisites: 'Fourier series; power and efficiency.',
        verify: () => { // Fourier integrals of the current waveform evaluated numerically
            const i = th => Math.max(0, (Math.cos(th) - c) / (1 - c)) * Im * (Math.abs(th) <= a / 2 ? 1 : 0);
            const dc = NUM.simpson(i, -a / 2, a / 2, 2000) / (2 * Math.PI), f1 = NUM.simpson(th => i(th) * Math.cos(th), -a / 2, a / 2, 2000) / Math.PI, po = f1 * (Vdd - Vk) / 2;
            return [dc * 1e3, f1 * 1e3, po, 100 * po / (Vdd * dc), (Vdd - Vk) / f1];
        }
    });
}

/* Level 4 (mastery): noise parameters of a transistor: noise figure for a given source, and a constant-noise-figure circle. */
function rfNoiseCircle(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'noise-circle', date, RF_READING), p = part;
    const [Fmin, Rn, [gm, ga], [sm, sa], dF] = grid([.4, .6, .8, 1, 1.5], [5, 10, 20, 30], product([.3, .45, .6, .75], [30, 60, 90, 120, 150]), product([.2, .4, .6], [-60, 0, 60, 120]), [.2, .5, 1]);
    const Go = cp(gm, ga), Gs = cp(sm, sa), rn = Rn / 50, fmin = 10 ** (Fmin / 10), d2 = cabs(cs(Gs, Go)) ** 2, one = cabs(ca(cx(1), Go)) ** 2;
    const F = fmin + 4 * rn * d2 / ((1 - sm * sm) * one), Fi = 10 ** ((Fmin + dF) / 10), N = (Fi - fmin) / (4 * rn) * one, cen = gm / (N + 1), rad = Math.sqrt(N * (N + 1 - gm * gm)) / (N + 1), F0 = fmin + 4 * rn * gm * gm / one;
    const P = z => [360 + 100 * z.re, 130 - 100 * z.im], [ox, oy] = P(Go), [sx, sy] = P(Gs), [cxp, cyp] = P(cp(cen, ga));
    const diagram = drawing(ring(360, 130, 100) + guide('M260 130H460') + `<circle cx="${cxp.toFixed(1)}" cy="${cyp.toFixed(1)}" r="${(100 * rad).toFixed(1)}" stroke="#83968b" stroke-dasharray="5 5"/>` + dot(ox, oy) + ring(sx, sy, 5) +
        dot(560, 84) + note(574, 90, 'Γopt') + ring(560, 112, 5) + note(574, 118, 'Γs') + dt(360, 255, `circle: NF = ${tf(Fmin + dF)} dB`), 'The unit reflection-coefficient circle with the optimum source reflection, the chosen source reflection and a constant-noise-figure circle', 262);
    return q({
        title: 'Noise figure circles',
        text: T`A transistor has $F_{\min} = ${Fmin}\,\text{dB}$, $R_n = ${Rn}\,\Omega$ and $\Gamma_{\text{opt}} = ${gm}\angle${ga}\,{}^\circ$ in a $50\,\Omega$ system, so $F = F_{\min} + \dfrac{4r_n|\Gamma_S - \Gamma_{\text{opt}}|^2}{(1 - |\Gamma_S|^2)\,|1 + \Gamma_{\text{opt}}|^2}$ with $r_n = R_n/50$. Find the noise figure when the source reflection coefficient is $\Gamma_S = ${sm}\angle${sa}\,{}^\circ$, and with a plain $50\,\Omega$ source. The source reflections that give a noise figure of $${tf(Fmin + dF)}\,\text{dB}$ lie on a circle: find the parameter $N = \dfrac{F_i - F_{\min}}{4r_n}|1 + \Gamma_{\text{opt}}|^2$, the distance of the circle's centre from the origin, $\dfrac{|\Gamma_{\text{opt}}|}{N + 1}$, and its radius $\dfrac{\sqrt{N(N + 1 - |\Gamma_{\text{opt}}|^2)}}{N + 1}$.`,
        givens: [T`$F_{\min} = ${Fmin}\,\text{dB}$, $R_n = ${Rn}\,\Omega$`, T`$\Gamma_{\text{opt}} = ${gm}\angle${ga}\,{}^\circ$`, T`$\Gamma_S = ${sm}\angle${sa}\,{}^\circ$`, T`Circle at $${tf(Fmin + dF)}\,\text{dB}$`],
        parts: [p(T`NF at $\Gamma_S$`, 10 * Math.log10(F), 'dB', .01, .005), p('NF with a 50 Ω source', 10 * Math.log10(F0), 'dB', .01, .005), p(T`$N$`, N, ''), p('Distance of the centre', cen, ''), p('Radius', rad, '')],
        hints: [T`Work in linear units: $F_{\min} = 10^{${Fmin}/10}$. $|\Gamma_S - \Gamma_{\text{opt}}|$ is the distance between the two points on the Smith chart.`, T`A $50\,\Omega$ source means $\Gamma_S = 0$.`, T`The circles are centred on the line from the origin through $\Gamma_{\text{opt}}$, and shrink to the point $\Gamma_{\text{opt}}$ as $F_i \to F_{\min}$.`],
        steps: [T`$|\Gamma_S - \Gamma_{\text{opt}}|^2 = ${tf(d2)}$, $|1 + \Gamma_{\text{opt}}|^2 = ${tf(one)}$: $F = ${tf(F)}$ ($${tf(10 * Math.log10(F))}\,\text{dB}$).`, T`With $\Gamma_S = 0$: $F = ${tf(F0)}$ ($${tf(10 * Math.log10(F0))}\,\text{dB}$).`, T`$N = ${tf(N)}$; centre at $${tf(cen)}\angle${ga}\,{}^\circ$, radius $${tf(rad)}$.`],
        idea: 'Noise figure is a paraboloid over the Smith chart with its minimum at Γopt; noise circles are its contours, and a low-noise design trades them against gain circles.',
        diagram, prerequisites: 'Reflection coefficients; complex algebra; noise figure.',
        verify: () => { // the admittance form F = Fmin + (Rn/Gs)|Ys − Yopt|²; the circle from the two points on the Γopt ray where F = Fi
            const y = g => cd(cs(cx(1), g), ca(cx(1), g)), Yo = y(Go), Fy = g => { const ys = y(g); return fmin + rn / ys.re * cabs(cs(ys, Yo)) ** 2; };
            const u = cp(1, ga), along = t => Fy(cm(u, cx(t))) - Fi, near = NUM.bisect(along, -.999999, gm, 200), far = NUM.bisect(along, gm, .999999, 200);
            const ni = (Fi - fmin) / (4 * rn) * cabs(ca(cx(1), Go)) ** 2;
            return [10 * Math.log10(Fy(Gs)), 10 * Math.log10(Fy(cx(0))), ni, (near + far) / 2, (far - near) / 2];
        }
    });
}
