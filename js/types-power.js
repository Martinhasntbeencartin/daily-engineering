/* Power systems: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (ohmic units, simulation, marginal allocation). */
const POWER_READING = {title: 'Introduction to Electric Power Systems (MIT OpenCourseWare 6.061)', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/'};
addTypes('power', 'university', powerPFCorrection, powerTransformerTests, powerPerUnit);
addTypes('power', 'challenge', powerFaultAsymmetry, powerEconomicDispatch, powerSymComponents);
addTypes('power', 'expert', powerLineParameters);
addTypes('power', 'mastery', powerHarmonicResonance);

/* Level 2: power-factor correction of a three-phase load with a capacitor bank. */
function powerPFCorrection(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pf-correction', date, POWER_READING), p = part;
    const [P, pf1, pf2, V, f] = grid([50, 100, 150, 200, 300, 500], [.65, .7, .75, .8, .85], [.92, .95, .98], [400, 415, 480, 690], [50, 60]);
    const w = 2 * Math.PI * f, Qc = P * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2))), CD = Qc * 1e3 / (3 * w * V * V), CY = Qc * 1e3 / (w * V * V);
    const I1 = P * 1e3 / (Math.sqrt(3) * V * pf1), I2 = P * 1e3 / (Math.sqrt(3) * V * pf2), red = 100 * (1 - (I2 / I1) ** 2);
    const diagram = drawing(element('AC', 80, 70, 80, 210, 'supply') + wire('M80 70H520M80 210H520') + element('R', 520, 70, 520, 210, 'load P, pf') + element('C', 340, 70, 340, 210, '') + note(360, 146, 'capacitor bank') + arrow(150, 50, 260, 50) + dt(205, 36, 'line current I') +
        dot(340, 70) + dot(340, 210) + ground(200, 210), 'One phase of a supply feeding a lagging load, with a capacitor bank connected in parallel at the load to correct the power factor', 250);
    return q({
        title: 'Correct the power factor of a plant',
        text: T`A three-phase plant draws $${P}\,\text{kW}$ at power factor $${pf1}$ lagging from a $${V}\,\text{V}$, $${f}\,\text{Hz}$ supply. A capacitor bank at the plant raises the power factor to $${pf2}$ lagging (the real power is unchanged). Find the reactive power the bank must supply, its capacitance per phase if delta-connected and if star-connected, the line current before and after correction, and the percentage reduction in line losses.`,
        givens: [T`$P = ${P}\,\text{kW}$, $\text{pf}_1 = ${pf1}$ lagging`, T`Target $\text{pf}_2 = ${pf2}$ lagging`, T`$V_{LL} = ${V}\,\text{V}$, $f = ${f}\,\text{Hz}$`],
        parts: [p('Bank reactive power', Qc, 'kvar'), p('Capacitance per phase, delta', CD * 1e6, 'µF'), p('Capacitance per phase, star', CY * 1e6, 'µF'), p('Line current before', I1, 'A'), p('Line current after', I2, 'A'), p('Reduction in line losses', red, '%')],
        hints: [T`$Q = P\tan\varphi$, so the bank supplies $Q_c = P(\tan\varphi_1 - \tan\varphi_2)$.`, T`Delta: each capacitor sees $V_{LL}$ and supplies $Q_c/3 = \omega CV_{LL}^2$. Star: each sees $V_{LL}/\sqrt3$, so $C = Q_c/(\omega V_{LL}^2)$, three times larger.`, T`$I = \dfrac{P}{\sqrt3V_{LL}\,\text{pf}}$; line losses scale with $I^2$.`],
        steps: [T`$\tan\varphi_1 = ${tf(Math.tan(Math.acos(pf1)))}$, $\tan\varphi_2 = ${tf(Math.tan(Math.acos(pf2)))}$: $Q_c = ${tf(Qc)}\,\text{kvar}$.`, T`Delta: $C = \dfrac{Q_c}{3\omega V^2} = ${tf(CD * 1e6)}\,\mu\text{F}$; star: $${tf(CY * 1e6)}\,\mu\text{F}$.`, T`$I_1 = ${tf(I1)}\,\text{A}$, $I_2 = ${tf(I2)}\,\text{A}$.`, T`Losses fall by $1 - (I_2/I_1)^2 = ${tf(red)}\%$.`],
        idea: 'A capacitor bank supplies the load’s reactive power locally, so the lines carry less current for the same real power.',
        diagram, prerequisites: 'AC power; power factor; three-phase connections.',
        verify: () => { // per-phase phasors: find the delta capacitance that makes the line current's phase match pf₂ (bisection)
            const Vp = V / Math.sqrt(3), Iload = cp(P * 1e3 / (3 * Vp * pf1), -Math.acos(pf1) * 180 / Math.PI);
            const line = c => ca(Iload, cx(0, 3 * w * c * V * V / (3 * Vp))), pfOf = c => Math.cos(Math.atan2(line(c).im, line(c).re));
            const cUnity = -Iload.im * Vp / (w * V * V), c = NUM.bisect(x => pfOf(x) - pf2, 0, cUnity, 200), i1 = cabs(Iload), i2 = cabs(line(c));
            return [3 * w * c * V * V / 1e3, c * 1e6, 3 * c * 1e6, i1, i2, 100 * (1 - (i2 / i1) ** 2)];
        }
    });
}

/* Level 2: a transformer's equivalent circuit from open- and short-circuit tests. */
function powerTransformerTests(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'transformer-tests', date, POWER_READING), p = part, s3 = x => Number(x.toPrecision(3));
    const [S, [V1, V2], zp, xr, nl, io, pf] = grid([10, 25, 50, 100], [[2400, 240], [11000, 415], [6600, 400], [4160, 480]], [3, 4, 5, 6], [2, 3, 5], [.5, .8, 1.2], [2, 3, 5], [.8, .9, 1]);
    const I1 = S * 1e3 / V1, Zb = V1 * V1 / (S * 1e3), Zeq0 = zp / 100 * Zb, Req0 = Zeq0 / Math.hypot(1, xr);
    const Vsc = s3(I1 * Zeq0), Psc = s3(I1 * I1 * Req0), Poc = s3(nl / 100 * S * 1e3), Ioc = s3(io / 100 * S * 1e3 / V2);
    const Req = Psc / (I1 * I1), Xeq = Math.sqrt((Vsc / I1) ** 2 - Req * Req), Rc = V2 * V2 / Poc, Im = Math.sqrt(Ioc * Ioc - (Poc / V2) ** 2), Xm = V2 / Im;
    const eta = 100 * S * 1e3 * pf / (S * 1e3 * pf + Poc + Psc), Vp = cabs(ca(cx(V1), cm(cp(I1, -Math.acos(pf) * 180 / Math.PI), cx(Req, Xeq)))), reg = 100 * (Vp - V1) / V1;
    const diagram = drawing(wire('M60 80H160M60 200H160') + ring(56, 80, 4) + ring(56, 200, 4) + note(30, 70, 'HV') + element('R', 160, 80, 290, 80, 'Req') + element('L', 290, 80, 420, 80, 'Xeq') + wire('M420 80H600M160 200H600') +
        element('R', 480, 80, 480, 200, '') + note(492, 150, 'Rc') + element('L', 560, 80, 560, 200, '') + note(572, 150, 'Xm') + ring(604, 80, 4) + ring(604, 200, 4) + dt(360, 240, 'approximate equivalent circuit (shunt branch drawn on the LV side)'),
        'Approximate transformer equivalent circuit: series resistance and reactance, and a shunt branch of core-loss resistance and magnetising reactance', 255);
    return q({
        title: 'A transformer from its open- and short-circuit tests',
        text: T`A ${S} kVA, ${V1}/${V2} V single-phase transformer gives these test results. Open-circuit test (on the LV side at rated voltage): $${Ioc}\,\text{A}$, $${Poc}\,\text{W}$. Short-circuit test (on the HV side at rated current): $${Vsc}\,\text{V}$, $${Psc}\,\text{W}$. Find the series resistance and reactance referred to the HV side, and the core-loss resistance and magnetising reactance referred to the LV side. Then find the full-load efficiency at power factor $${pf}$ lagging, and the voltage regulation at full load and that power factor (the primary voltage needed to hold the secondary at rated voltage, using the series branch).`,
        givens: [T`${S} kVA, ${V1}/${V2} V`, T`OC (LV): $${V2}\,\text{V}$, $${Ioc}\,\text{A}$, $${Poc}\,\text{W}$`, T`SC (HV): $${Vsc}\,\text{V}$, $${tf(I1)}\,\text{A}$, $${Psc}\,\text{W}$`],
        parts: [p(T`$R_{eq}$ (HV)`, Req, 'Ω'), p(T`$X_{eq}$ (HV)`, Xeq, 'Ω'), p(T`$R_c$ (LV)`, Rc, 'Ω'), p(T`$X_m$ (LV)`, Xm, 'Ω'), p(`Full-load efficiency at pf ${pf}`, eta, '%'), p('Voltage regulation', reg, '%')],
        hints: [T`Short-circuit test: $R_{eq} = P_{sc}/I_{sc}^2$ and $|Z_{eq}| = V_{sc}/I_{sc}$, so $X_{eq} = \sqrt{|Z_{eq}|^2 - R_{eq}^2}$.`, T`Open-circuit test: $R_c = V^2/P_{oc}$; the magnetising current is $I_m = \sqrt{I_{oc}^2 - (P_{oc}/V)^2}$, so $X_m = V/I_m$.`, T`Efficiency: output over output plus core loss plus full-load copper loss. Regulation: $V_p = V_1 + I_1\angle{-\varphi}\,(R_{eq} + jX_{eq})$ on the HV side.`],
        steps: [T`Rated HV current $${tf(I1)}\,\text{A}$: $R_{eq} = ${tf(Req)}\,\Omega$, $|Z_{eq}| = ${tf(Vsc / I1)}\,\Omega$, $X_{eq} = ${tf(Xeq)}\,\Omega$.`, T`$R_c = ${tf(Rc)}\,\Omega$; $I_m = ${tf(Im)}\,\text{A}$, $X_m = ${tf(Xm)}\,\Omega$.`, T`$\eta = \dfrac{${tf(S * pf)}\,\text{kW}}{${tf(S * pf)}\,\text{kW} + ${Poc}\,\text{W} + ${Psc}\,\text{W}} = ${tf(eta)}\%$.`, T`$|V_p| = ${tf(Vp)}\,\text{V}$, so the regulation is $${tf(reg)}\%$.`],
        idea: 'Two simple tests separate a transformer’s losses: the open circuit measures the core, the short circuit the windings.',
        diagram, prerequisites: 'Transformer equivalent circuits; AC power; phasors.',
        verify: () => { // impedance angle from cos φ = P/(VI); regulation from the real and imaginary voltage drops
            const zr = Vsc / I1, ang = Math.acos(Psc / (Vsc * I1)), re = zr * Math.cos(ang), xe = zr * Math.sin(ang), ph = Math.acos(pf);
            const vp = Math.hypot(V1 + I1 * (re * Math.cos(ph) + xe * Math.sin(ph)), I1 * (xe * Math.cos(ph) - re * Math.sin(ph))), y = Ioc / V2, g = Poc / (V2 * V2);
            return [re, xe, 1 / g, 1 / Math.sqrt(y * y - g * g), 100 / (1 + (Poc + Psc) / (S * 1e3 * pf)), 100 * (vp / V1 - 1)];
        }
    });
}

/* Level 2: per-unit impedances on a common base, and a three-phase fault current. */
function powerPerUnit(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'per-unit', date, POWER_READING), p = part, Sb = 100, Vg = 13.8;
    const [Sg, xg, St, xt, V2, XL] = grid([50, 100, 200], [.15, .2, .25], [60, 100, 150, 250], [.08, .1, .12], [66, 110, 132, 220], [10, 20, 40, 60]);
    const Xg = xg * Sb / Sg, Xt = xt * Sb / St, Zb2 = V2 * V2 / Sb, Xl = XL / Zb2, Xtot = Xg + Xt + Xl, Ib = Sb / (Math.sqrt(3) * V2), If = Ib / Xtot, MVA = Sb / Xtot;
    const diagram = drawing(ring(90, 130, 26) + dt(90, 136, 'G') + wire('M116 130H200') + ring(220, 130, 20) + ring(250, 130, 20) + wire('M270 130H330') + wire('M330 120h220v20H330z') + dt(440, 106, 'line') + wire('M550 130H640') +
        wire('M630 112l14 14 -10 0 14 16') + dt(645, 170, 'fault') + dt(90, 180, `${Sg} MVA`) + dt(235, 180, `${St} MVA`) + dt(440, 166, `${XL} Ω`), 'One-line diagram: a generator feeds a step-up transformer and a transmission line, with a three-phase fault at the far end of the line', 230);
    return q({
        title: 'Fault current by the per-unit method',
        text: T`A $${Sg}\,\text{MVA}$, $13.8\,\text{kV}$ generator ($X'' = ${xg}\,\text{pu}$ on its rating) feeds a $${St}\,\text{MVA}$, $13.8/${V2}\,\text{kV}$ transformer ($X = ${xt}\,\text{pu}$ on its rating) and a line of reactance $${XL}\,\Omega$. A bolted three-phase fault occurs at the far end of the line with the generator at $1.0\,\text{pu}$ voltage before the fault. On a $100\,\text{MVA}$ base ($13.8\,\text{kV}$ in the generator zone, $${V2}\,\text{kV}$ in the line zone), find the generator, transformer and line reactances in per unit, the total, the fault current in kA, and the fault level in MVA. Neglect resistance and load current.`,
        givens: [T`G: $${Sg}\,\text{MVA}$, $X'' = ${xg}$`, T`T: $${St}\,\text{MVA}$, $X = ${xt}$, $13.8/${V2}\,\text{kV}$`, T`Line $${XL}\,\Omega$; base $100\,\text{MVA}$`],
        parts: [p('Generator X (pu)', Xg, 'pu'), p('Transformer X (pu)', Xt, 'pu'), p('Line X (pu)', Xl, 'pu'), p('Total X (pu)', Xtot, 'pu'), p('Fault current', If, 'kA'), p('Fault level', MVA, 'MVA')],
        hints: [T`Change of base: $X_{\text{new}} = X_{\text{old}}\dfrac{S_{\text{new}}}{S_{\text{old}}}$ (same voltage base).`, T`Line zone: $Z_b = \dfrac{V_b^2}{S_b} = \dfrac{${V2}^2}{100}\,\Omega$.`, T`$I_f = 1/X_{\text{tot}}$ pu, and $I_b = \dfrac{S_b}{\sqrt3V_b}$ in the faulted zone.`],
        steps: [T`$X_g = ${xg}\times\tfrac{100}{${Sg}} = ${tf(Xg)}$, $X_t = ${xt}\times\tfrac{100}{${St}} = ${tf(Xt)}\,\text{pu}$.`, T`$Z_b = ${tf(Zb2)}\,\Omega$, so $X_l = ${tf(Xl)}\,\text{pu}$; total $${tf(Xtot)}\,\text{pu}$.`, T`$I_b = ${tf(Ib)}\,\text{kA}$, so $I_f = ${tf(If)}\,\text{kA}$; fault level $100/${tf(Xtot)} = ${tf(MVA)}\,\text{MVA}$.`],
        idea: 'Per-unit values make transformers disappear from the calculation: every zone reads about the same numbers, whatever its voltage.',
        diagram, prerequisites: 'Per-unit system; three-phase faults; Ohm’s law.',
        verify: () => { // everything in ohms referred to the line voltage
            const xgo = xg * V2 * V2 / Sg, xto = xt * V2 * V2 / St, xo = xgo + xto + XL, i = V2 / (Math.sqrt(3) * xo);
            return [xgo / Zb2, xto / Zb2, XL / Zb2, xo / Zb2, i, Math.sqrt(3) * V2 * i];
        }
    });
}

/* Level 3: the DC offset of a short-circuit current and its first peak. */
function powerFaultAsymmetry(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'fault-asymmetry', date, POWER_READING), p = part;
    const [V, Z, XR, f] = grid([11, 13.8, 33, 66, 132], [.5, 1, 2, 3, 5, 10], [3, 5, 8, 10, 15, 20, 30], [50, 60]);
    const w = 2 * Math.PI * f, I = V / (Math.sqrt(3) * Z), tau = XR / w, Tp = 1 / f, ia = t => Math.SQRT2 * I * (Math.exp(-t / tau) - Math.cos(w * t)), gr = (Math.sqrt(5) - 1) / 2;
    let lo = Tp / 4, hi = Tp; for (let i = 0; i < 200; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (ia(c) > ia(d)) hi = d; else lo = c; }
    const tpk = (lo + hi) / 2, ipk = ia(tpk), kap = 1.02 + .98 * Math.exp(-3 / XR), dc3 = Math.SQRT2 * I * Math.exp(-3 * Tp / tau);
    const diagram = curve('t (ms)', 'i (kA)', [0, +(3000 / f).toPrecision(3)], [+(-1.6 * I).toFixed(1), +(2.9 * I).toFixed(1)], t => ia(t / 1000));
    return q({
        title: 'The first peak of a short-circuit current',
        text: T`A bolted three-phase fault occurs on a $${V}\,\text{kV}$, $${f}\,\text{Hz}$ system whose source impedance is $${Z}\,\Omega$ per phase with $X/R = ${XR}$. In the worst phase the fault starts at the instant that gives the largest DC offset, so $i(t) = \sqrt2I\left(e^{-t/\tau} - \cos\omega t\right)$. Find the symmetrical RMS fault current $I$, the DC time constant $\tau$, the exact first peak of $i(t)$, the peak estimated by the IEC factor $\kappa = 1.02 + 0.98e^{-3R/X}$ (as $\kappa\sqrt2I$), and the DC component left after three cycles, when a breaker might interrupt.`,
        givens: [T`$V_{LL} = ${V}\,\text{kV}$, $f = ${f}\,\text{Hz}$`, T`$|Z| = ${Z}\,\Omega$ per phase, $X/R = ${XR}$`, 'Worst-case closing angle'],
        parts: [p('Symmetrical RMS current', I, 'kA'), p(T`$\tau$`, tau * 1e3, 'ms'), p('Exact first peak', ipk, 'kA'), p('IEC peak estimate', kap * Math.SQRT2 * I, 'kA'), p('DC component after 3 cycles', dc3, 'kA')],
        hints: [T`$I = \dfrac{V_{LL}}{\sqrt3|Z|}$ and $\tau = \dfrac{L}{R} = \dfrac{X/R}{\omega}$.`, T`The peak comes slightly before half a cycle: set $\dfrac{di}{dt} = 0$, i.e. $\omega\sin\omega t = e^{-t/\tau}/\tau$, and solve numerically.`, T`The DC term is $\sqrt2Ie^{-t/\tau}$.`],
        steps: [T`$I = ${tf(I)}\,\text{kA}$ and $\tau = ${tf(tau * 1e3)}\,\text{ms}$.`, T`The first peak is at $t = ${tf(tpk * 1e3)}\,\text{ms}$: $i_{\text{pk}} = ${tf(ipk)}\,\text{kA}$ ($${tf(ipk / (Math.SQRT2 * I))}\,\sqrt2I$).`, T`IEC: $\kappa = ${tf(kap)}$, so $${tf(kap * Math.SQRT2 * I)}\,\text{kA}$.`, T`After three cycles the DC term is $${tf(dc3)}\,\text{kA}$.`],
        idea: 'An inductive circuit cannot jump its current, so a fault starting at the wrong instant carries a decaying DC offset that nearly doubles the first peak.',
        diagram, prerequisites: 'RL transients; phasors; numerical maximisation.',
        verify: () => { // simulate L di/dt + Ri = √2·V_ph·sin(ωt + α) with the worst closing angle α = θ − 90°
            const R = Z / Math.hypot(1, XR), L = R * XR / w, th = Math.atan(XR), Vm = Math.SQRT2 * V / Math.sqrt(3), h = Tp / 20000;
            let mx = 0;
            const di = (tt, x) => [(Vm * Math.sin(w * tt + th - Math.PI / 2) - R * x[0]) / L];
            ctrlSim(di, [0], h, Tp, (tt, x) => { mx = Math.max(mx, x[0]); });
            return [Vm / Math.SQRT2 / Z, L / R * 1e3, mx, (1.02 + .98 * Math.exp(-3 * R / (w * L))) * Vm / Z, Vm / Z * Math.exp(-3 * Tp * R / L)];
        }
    });
}

/* Level 3: economic dispatch of three generators with limits. */
let DISPATCH_CASES = null;
function powerEconomicDispatch(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'economic-dispatch', date, POWER_READING), p = part;
    const lim = [[50, 400], [50, 300], [50, 500]], dispatch = (b, c, D) => { const o = l => b.map((bi, i) => Math.min(lim[i][1], Math.max(lim[i][0], (l - bi) / (2 * c[i])))); return [o, NUM.bisect(l => o(l).reduce((s, v) => s + v, 0) - D, 0, 100, 200)]; };
    // Only cases with a marginal unit (strictly inside its limits), so that λ is defined; filtered once and cached.
    DISPATCH_CASES ||= product([7, 8, 9], [6, 7, 8.5], [9, 10, 11], [.004, .006, .008], [.005, .007, .01], [.003, .004, .006], [400, 600, 800, 1000]).filter(([x1, x2, x3, y1, y2, y3, dd]) => {
        const [o, l] = dispatch([x1, x2, x3], [y1, y2, y3], dd); return o(l).some((v, i) => v > lim[i][0] + 1e-6 && v < lim[i][1] - 1e-6); });
    const [[b1, b2, b3, c1, c2, c3, D]] = grid(DISPATCH_CASES);
    const a = [200, 180, 140], b = [b1, b2, b3], c = [c1, c2, c3], [out, lam] = dispatch(b, c, D);
    const P = out(lam), cost = P.reduce((s, v, i) => s + a[i] + b[i] * v + c[i] * v * v, 0), atLim = P.filter((v, i) => Math.abs(v - lim[i][0]) < 1e-6 || Math.abs(v - lim[i][1]) < 1e-6).length;
    const diagram = drawing([0, 1, 2].map(i => ring(130 + i * 230, 80, 26) + dt(130 + i * 230, 86, 'G' + (i + 1)) + wire(`M${130 + i * 230} 106V170`) + dt(130 + i * 230, 40, `${lim[i][0]}–${lim[i][1]} MW`)).join('') + wire('M100 170H620') + dt(640, 176, 'bus') + arrow(360, 170, 360, 230) + dt(360, 252, `demand ${D} MW`),
        'Three generators with output limits feed a common bus that supplies the demand', 262);
    return q({
        title: 'Dispatch three generators at least cost',
        text: T`Three generators supply a demand of $${D}\,\text{MW}$ (losses neglected). Their costs are $C_i = a_i + b_iP_i + c_iP_i^2$ in USD/h with $P_i$ in MW, and each has output limits. Find the system incremental cost $\lambda$ at the optimum, the three outputs, and the total hourly cost. (If a unit's equal-$\lambda$ output falls outside its limits, fix it at the limit and share the rest among the others.)`,
        givens: [T`$C_1 = 200 + ${b1}P_1 + ${c1}P_1^2$, $50 \le P_1 \le 400$`, T`$C_2 = 180 + ${b2}P_2 + ${c2}P_2^2$, $50 \le P_2 \le 300$`, T`$C_3 = 140 + ${b3}P_3 + ${c3}P_3^2$, $50 \le P_3 \le 500$`],
        parts: [p(T`$\lambda$`, lam, 'USD/MWh'), p(T`$P_1$`, P[0], 'MW'), p(T`$P_2$`, P[1], 'MW'), p(T`$P_3$`, P[2], 'MW'), p('Total cost', cost, 'USD/h')],
        hints: [T`At the optimum every unit inside its limits runs at the same incremental cost: $b_i + 2c_iP_i = \lambda$, so $P_i = \dfrac{\lambda - b_i}{2c_i}$.`, T`Sum the outputs and set them equal to the demand; solve for $\lambda$ (linear while no limit binds).`, T`If a unit exceeds a limit, clamp it there and solve again for the remaining units with the reduced demand.`],
        steps: [T`Equal incremental cost gives $\lambda = ${tf(lam)}\,\text{USD/MWh}$${atLim ? ` (with ${atLim} unit${atLim > 1 ? 's' : ''} held at a limit)` : ''}.`, T`$P_1 = ${tf(P[0])}$, $P_2 = ${tf(P[1])}$, $P_3 = ${tf(P[2])}\,\text{MW}$ (total $${tf(P[0] + P[1] + P[2])}$).`, T`Total cost $= ${tf(cost)}\,\text{USD/h}$.`],
        idea: 'Least-cost dispatch equalises marginal costs: shifting a megawatt from a dearer unit to a cheaper one saves money until their incremental costs meet.',
        diagram, prerequisites: 'Optimisation with a constraint; quadratic cost curves.',
        verify: () => { // greedy allocation in 0.01 MW steps to whichever unit is cheapest at the margin
            const x = lim.map(l => l[0]); let rem = D - x.reduce((s, v) => s + v, 0), last = 0; const step = .01;
            while (rem > 1e-9) { let best = -1, bm = Infinity; x.forEach((v, i) => { const m = b[i] + c[i] * (2 * v + step); if (v + step <= lim[i][1] + 1e-9 && m < bm) { bm = m; best = i; } }); const d = Math.min(step, rem); x[best] += d; rem -= d; last = b[best] + 2 * c[best] * x[best]; }
            return [last, ...x, x.reduce((s, v, i) => s + a[i] + b[i] * v + c[i] * v * v, 0)];
        }
    });
}

/* Level 3: symmetrical components of unbalanced phase currents. */
function powerSymComponents(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'sym-components', date, POWER_READING), p = part;
    const [[Ia, Ib, Ic, db, dc]] = grid(product([90, 100, 110], [80, 90, 100, 110], [70, 85, 100, 115], [-15, -5, 0, 10], [-10, 0, 5, 15]).filter(([x, y, z, u, w]) => !(x === y && y === z && !u && !w)));
    const A = cp(Ia, 0), B = cp(Ib, -120 + db), C = cp(Ic, 120 + dc), aa = cp(1, 120), a2 = cp(1, 240), chop = z => cx(Math.abs(z.re) < 1e-9 ? 0 : z.re, Math.abs(z.im) < 1e-9 ? 0 : z.im);
    const I0 = chop(cd(ca(ca(A, B), C), cx(3))), I1 = chop(cd(ca(ca(A, cm(aa, B)), cm(a2, C)), cx(3))), I2 = chop(cd(ca(ca(A, cm(a2, B)), cm(aa, C)), cx(3)));
    const ph = [[A, 'Ia'], [B, 'Ib'], [C, 'Ic']], sc = .85;
    const diagram = drawing(wire('M240 130H480M360 20V240') + ph.map(([z, n]) => arrow(360, 130, 360 + sc * z.re, 130 - sc * z.im) + dt(360 + 1.25 * sc * z.re, 136 - 1.25 * sc * z.im, n)).join('') + dt(600, 130, 'unbalanced set'),
        'Phasor diagram of three unbalanced phase currents Ia, Ib and Ic drawn from a common origin', 260);
    return q({
        title: 'Split unbalanced currents into sequences',
        text: T`A star-connected load with a neutral draws the unbalanced RMS phase currents below. With $a = 1\angle120^\circ$, resolve them into zero-, positive- and negative-sequence components, $I_0 = \tfrac13(I_a + I_b + I_c)$, $I_1 = \tfrac13(I_a + aI_b + a^2I_c)$ and $I_2 = \tfrac13(I_a + a^2I_b + aI_c)$. Give $|I_0|$, $|I_1|$ and its angle, $|I_2|$, the neutral current, and the current unbalance factor $|I_2|/|I_1|$.`,
        givens: [T`$I_a = ${Ia}\angle0^\circ\,\text{A}$`, T`$I_b = ${Ib}\angle${-120 + db}^\circ\,\text{A}$`, T`$I_c = ${Ic}\angle${120 + dc}^\circ\,\text{A}$`],
        parts: [p(T`$|I_0|$`, cabs(I0), 'A', .01, .01), p(T`$|I_1|$`, cabs(I1), 'A'), p(T`$\angle I_1$`, cphase(I1), '°', .01, .05), p(T`$|I_2|$`, cabs(I2), 'A', .01, .01), p('Neutral current', 3 * cabs(I0), 'A', .01, .02), p('Unbalance factor', 100 * cabs(I2) / cabs(I1), '%', .01, .01)],
        hints: [T`Multiplying by $a$ rotates a phasor by $+120^\circ$; by $a^2$, by $+240^\circ$ (or $-120^\circ$).`, T`Work in rectangular form: add the rotated phasors, then divide by 3.`, T`The neutral carries $I_a + I_b + I_c = 3I_0$; the positive and negative sequences add to zero there.`],
        steps: [T`$I_0 = ${tc(I0)}\,\text{A}$.`, T`$I_1 = ${tc(I1)} = ${tf(cabs(I1))}\angle${tf(cphase(I1))}^\circ\,\text{A}$.`, T`$I_2 = ${tc(I2)}\,\text{A}$, $|I_2| = ${tf(cabs(I2))}\,\text{A}$.`, T`Neutral $3|I_0| = ${tf(3 * cabs(I0))}\,\text{A}$; unbalance $${tf(100 * cabs(I2) / cabs(I1))}\%$.`],
        idea: 'Any unbalanced three-phase set is the sum of three balanced ones; the negative sequence measures how far it is from balance and heats rotating machines.',
        diagram, prerequisites: 'Complex numbers; phasors; three-phase systems.',
        verify: () => { // solve the synthesis equations Ia = I0 + I1 + I2, Ib = I0 + a²I1 + aI2, Ic = I0 + aI1 + a²I2
            const [z0, z1, z2] = complexSolve([[cx(1), cx(1), cx(1)], [cx(1), a2, aa], [cx(1), aa, a2]], [A, B, C]);
            return [cabs(z0), cabs(z1), cphase(z1), cabs(z2), cabs(ca(ca(A, B), C)), 100 * cabs(z2) / cabs(z1)];
        }
    });
}

/* Level 4 (expert): line inductance and capacitance from conductor geometry, surge impedance and the Ferranti effect. */
function powerLineParameters(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'line-parameters', date, POWER_READING), p = part, mu0 = 4 * Math.PI * 1e-7, e0 = 8.8541878128e-12;
    const [[gmr, r], D, arr, V, len, f] = grid([[.8, 1], [1, 1.27], [1.2, 1.5], [1.5, 1.9]], [4, 5, 6, 7, 8, 10], ['flat', 'triangle'], [132, 220, 400], [100, 200, 300, 400, 500], [50, 60]);
    const Ds = arr === 'flat' ? [D, D, 2 * D] : [D, D, D], GMD = Math.cbrt(Ds[0] * Ds[1] * Ds[2]), L = mu0 / (2 * Math.PI) * Math.log(GMD / (gmr / 100)), C = 2 * Math.PI * e0 / Math.log(GMD / (r / 100));
    const Zc = Math.sqrt(L / C), SIL = V * V / Zc, bl = 2 * Math.PI * f * Math.sqrt(L * C) * len * 1e3, fer = 1 / Math.cos(bl);
    const pos = arr === 'flat' ? [[200, 130], [360, 130], [520, 130]] : [[260, 170], [460, 170], [360, 70]];
    const diagram = drawing(pos.map(([x, y], i) => ring(x, y, 12) + dt(x, y + 36, 'abc'[i])).join('') + (arr === 'flat' ? guide('M212 130H348M372 130H508') + dt(280, 116, `${D} m`) + dt(440, 116, `${D} m`) : guide('M272 170H448M268 160L352 80M452 160L368 80') + dt(360, 196, `${D} m`) + dt(290, 110, `${D} m`)) +
        dt(360, 240, `${arr} arrangement, transposed`), 'Cross-section of a three-phase overhead line showing the conductor arrangement and spacings', 255);
    return q({
        title: 'Line constants from tower geometry',
        text: T`A transposed three-phase overhead line has its conductors ${arr === 'flat' ? T`in a flat row, $${D}\,\text{m}$ apart (the outer pair $${2 * D}\,\text{m}$ apart)` : T`at the corners of an equilateral triangle of side $${D}\,\text{m}$`}. Each conductor has radius $${r}\,\text{cm}$ and geometric mean radius $${gmr}\,\text{cm}$. Find the inductance per phase ($\text{mH/km}$) and the capacitance to neutral ($\text{nF/km}$), the surge impedance, and the surge-impedance loading at $${V}\,\text{kV}$. Treating the $${len}\,\text{km}$ line as lossless at $${f}\,\text{Hz}$, find the ratio of receiving-end to sending-end voltage on no load (the Ferranti effect).`,
        givens: [T`${arr === 'flat' ? 'Flat' : 'Triangular'} spacing $${D}\,\text{m}$`, T`$r = ${r}\,\text{cm}$, GMR $= ${gmr}\,\text{cm}$`, T`$${V}\,\text{kV}$, $${len}\,\text{km}$, $${f}\,\text{Hz}$`],
        parts: [p('Inductance', L * 1e6, 'mH/km'), p('Capacitance', C * 1e12, 'nF/km'), p('Surge impedance', Zc, 'Ω'), p('Surge-impedance loading', SIL, 'MW'), p('No-load voltage ratio', fer, '')],
        hints: [T`$\text{GMD} = \sqrt[3]{D_{ab}D_{bc}D_{ca}}$; $L = \dfrac{\mu_0}{2\pi}\ln\dfrac{\text{GMD}}{\text{GMR}}$ and $C = \dfrac{2\pi\varepsilon_0}{\ln(\text{GMD}/r)}$ per metre.`, T`$Z_c = \sqrt{L/C}$ and $\text{SIL} = V_{LL}^2/Z_c$.`, T`For a lossless line $V_S = V_R\cos\beta\ell$ on no load, with $\beta = \omega\sqrt{LC}$.`],
        steps: [T`$\text{GMD} = ${tf(GMD)}\,\text{m}$.`, T`$L = ${tf(L * 1e6)}\,\text{mH/km}$, $C = ${tf(C * 1e12)}\,\text{nF/km}$.`, T`$Z_c = ${tf(Zc)}\,\Omega$ and $\text{SIL} = ${tf(SIL)}\,\text{MW}$.`, T`$\beta\ell = ${tf(bl)}\,\text{rad}$, so $V_R/V_S = 1/\cos\beta\ell = ${tf(fer)}$.`],
        idea: 'Geometry fixes a line’s inductance and capacitance; long, lightly loaded lines see their voltage rise towards the far end.',
        diagram, prerequisites: 'Line inductance and capacitance; transmission-line equations.',
        verify: () => { // per-phase average of the three ln terms; the no-load profile by integrating the telegrapher equations from the receiving end
            const Lv = mu0 / (2 * Math.PI) * Ds.reduce((s, d) => s + Math.log(d / (gmr / 100)), 0) / 3, Cv = 2 * Math.PI * e0 / (Ds.reduce((s, d) => s + Math.log(d / (r / 100)), 0) / 3), w = 2 * Math.PI * f;
            const end = ctrlSim((x, s) => [w * Lv * s[1], -w * Cv * s[0]], [1, 0], len * 1e3 / 20000, len * 1e3); // dV/dx = ωL·I', dI'/dx = −ωC·V (I' = −jI, real)
            return [Lv * 1e6, Cv * 1e12, Math.sqrt(Lv / Cv), V * V / Math.sqrt(Lv / Cv), 1 / end[0]];
        }
    });
}

/* Level 4 (mastery): harmonic resonance of a capacitor bank with the supply, and the voltage distortion it causes. */
function powerHarmonicResonance(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'harmonic-resonance', date, POWER_READING), p = part;
    const [V, Ssc, XR, Qc, P, Pd] = grid([11, 13.8, 33], [100, 200, 300, 500], [5, 10, 20], [2, 3, 5, 8, 10], [5, 10, 20], [2, 4]);
    const Zs0 = V * V / Ssc, Rs = Zs0 / Math.hypot(1, XR), Xs = Rs * XR, Xc = V * V / Qc, RL = V * V / P, I1 = Pd * 1e3 / (Math.sqrt(3) * V), hs = [5, 7, 11, 13];
    const Z = h => cd(cx(1), ca(ca(cd(cx(1), cx(Rs, h * Xs)), cd(cx(1), cx(0, -Xc / h))), cx(1 / RL))), Zm = h => cabs(Z(h)), happrox = Math.sqrt(Ssc / Qc);
    let best = 1; for (let h = 1; h <= 40; h += .01) if (Zm(h) > Zm(best)) best = h;
    let lo = Math.max(1, best - .01), hi = best + .01; const gr = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 100; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (Zm(c) > Zm(d)) hi = d; else lo = c; }
    const hpk = (lo + hi) / 2, Vh = hs.map(h => I1 / h * Zm(h)), V1 = V * 1e3 / Math.sqrt(3), thd = 100 * Math.sqrt(Vh.reduce((s, v) => s + v * v, 0)) / V1;
    const diagram = drawing(element('AC', 80, 70, 80, 200, 'grid') + element('L', 80, 70, 260, 70, 'supply') + wire('M260 70H620M80 200H620') + element('C', 340, 70, 340, 200, '') + note(352, 150, 'Qc') + element('R', 450, 70, 450, 200, '') + note(462, 150, 'load P') +
        element('I', 580, 200, 580, 70, '') + note(512, 46, 'drive harmonics Iₕ') + dot(340, 70) + dot(450, 70) + dot(580, 70) + ground(200, 200), 'One phase of a bus fed through the supply impedance, with a capacitor bank, a resistive load and a harmonic current source from a drive in parallel', 250);
    return q({
        title: 'A capacitor bank that amplifies harmonics',
        text: T`A $${V}\,\text{kV}$ bus has a short-circuit level of $${Ssc}\,\text{MVA}$ with $X/R = ${XR}$, a $${Qc}\,\text{Mvar}$ capacitor bank, and $${P}\,\text{MW}$ of resistive load. A $${Pd}\,\text{MW}$ six-pulse drive injects harmonic currents $I_h = I_1/h$ at $h = 5, 7, 11, 13$, where $I_1 = P_d/(\sqrt3V)$. Per phase, the bus impedance at harmonic $h$ is the parallel combination of $R_s + jhX_s$, $-jX_c/h$ and $R_L$. Estimate the resonant harmonic as $\sqrt{S_{sc}/Q_c}$, then find the harmonic where $|Z(h)|$ actually peaks, $|Z(5)|$, the 5th-harmonic phase voltage, and the bus voltage THD.`,
        givens: [T`$${V}\,\text{kV}$, $S_{sc} = ${Ssc}\,\text{MVA}$, $X/R = ${XR}$`, T`$Q_c = ${Qc}\,\text{Mvar}$, load $${P}\,\text{MW}$`, T`Drive $${Pd}\,\text{MW}$: $I_h = I_1/h$, $h = 5, 7, 11, 13$`],
        parts: [p('Estimated resonant harmonic', happrox, ''), p(T`Peak of $|Z(h)|$`, hpk, ''), p(T`$|Z(5)|$`, Zm(5), 'Ω'), p('5th-harmonic phase voltage', Vh[0], 'V'), p('Voltage THD', thd, '%')],
        hints: [T`At 50/60 Hz: $Z_s = V^2/S_{sc}$ split by $X/R$, $X_c = V^2/Q_c$, $R_L = V^2/P$ (all per phase, in ohms).`, T`Ignoring resistance, resonance is where $hX_s = X_c/h$, i.e. $h_r = \sqrt{X_c/X_s} \approx \sqrt{S_{sc}/Q_c}$; the resistances shift and damp the peak.`, T`$V_h = I_h|Z(h)|$; $\text{THD} = \sqrt{\sum V_h^2}/V_1$ with $V_1 = V/\sqrt3$.`],
        steps: [T`$R_s = ${tf(Rs)}\,\Omega$, $X_s = ${tf(Xs)}\,\Omega$, $X_c = ${tf(Xc)}\,\Omega$, $R_L = ${tf(RL)}\,\Omega$; $I_1 = ${tf(I1)}\,\text{A}$.`, T`$\sqrt{S_{sc}/Q_c} = ${tf(happrox)}$; the peak of $|Z|$ is at $h = ${tf(hpk)}$ ($|Z| = ${tf(Zm(hpk))}\,\Omega$).`, T`$|Z(5)| = ${tf(Zm(5))}\,\Omega$, so $V_5 = ${tf(I1 / 5)} \times ${tf(Zm(5))} = ${tf(Vh[0])}\,\text{V}$.`, T`Harmonic voltages: $${Vh.map(v => tf(v)).join(',\\ ')}\,\text{V}$; THD $= ${tf(thd)}\%$.`],
        idea: 'A capacitor bank and the supply inductance form a parallel resonance; if it lands near a characteristic harmonic, small harmonic currents become large voltages.',
        diagram, prerequisites: 'Impedance; parallel resonance; harmonic analysis.',
        verify: () => { // admittances summed in rectangular form; the peak by a fine scan; the estimate as √(X_c/|Z_s|)
            const Y = h => { const a = 1 / (Rs * Rs + (h * Xs) ** 2); return [Rs * a + 1 / RL, -h * Xs * a + h / Xc]; }, Zv = h => 1 / Math.hypot(...Y(h));
            let bh = 1; for (let h = 1; h <= 40; h += 1e-4) if (Zv(h) > Zv(bh)) bh = h;
            const vs = hs.map(h => I1 / h * Zv(h));
            return [Math.sqrt(Xc / Math.hypot(Rs, Xs)), bh, Zv(5), vs[0], 100 * Math.hypot(...vs) / (V * 1e3 / Math.sqrt(3))];
        }
    });
}
