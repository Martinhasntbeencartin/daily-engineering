/* Circuit analysis: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   Each type draws its values from its own daily grid, and verify() recomputes the answers by a different method
   (nodal instead of mesh analysis, simulation instead of a closed form, and so on) for tests/exercises.test.js. */
const CIRCUITS_READING = {title: 'Circuits and Electronics (MIT OpenCourseWare 6.002)', url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/'};
addTypes('circuits', 'university', circuitsSupermesh, circuitsSwitchedRC, circuitsResonance);
addTypes('circuits', 'challenge', circuitsRLCStep, circuitsRestrictedPower, circuitsTwoPort);
addTypes('circuits', 'expert', circuitsCoupledCoils);
addTypes('circuits', 'mastery', circuitsSquareWave);

/* Level 2: mesh analysis with a current source shared by two meshes (a supermesh). Units: kΩ, mA, V. */
function circuitsSupermesh(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'supermesh', date, CIRCUITS_READING), p = part;
    const [Vs, Is, R2] = grid(steps(6, 24, 1), steps(1, 10, 1), [1.5, 2.2, 3.3, 4.7]), R1 = 1, R3 = 2.2, R4 = 1, R5 = 3.3, R45 = R4 + R5;
    // Mesh 1: (R1 + R2) I1 − R2 I2 = Vs.  Supermesh with I3 = I2 + Is: −R2 I1 + (R2 + R3 + R45) I2 = −R45 Is.
    const a11 = R1 + R2, a12 = -R2, a22 = R2 + R3 + R45, det = a11 * a22 - a12 * a12, I1 = (Vs * a22 + a12 * R45 * Is) / det, I2 = (-a11 * R45 * Is - a12 * Vs) / det, I3 = I2 + Is;
    const V = R45 * I3, P = V * Is;
    const diagram = drawing(element('DC', 80, 70, 80, 200, 'Vₛ') + element('R', 80, 70, 250, 70, 'R₁') + element('R', 250, 70, 250, 200, 'R₂') + element('R', 250, 70, 420, 70, 'R₃') +
        element('I', 420, 200, 420, 70, 'Iₛ') + element('R', 420, 70, 590, 70, 'R₄') + element('R', 590, 70, 590, 200, 'R₅') + wire('M80 200H590') +
        dot(250, 70) + dot(420, 70) + dot(250, 200) + dot(420, 200) + dt(165, 150, '↻ I₁') + dt(337, 150, '↻ I₂') + dt(508, 150, '↻ I₃') + ground(335, 200),
        'Three meshes in a row: a voltage source and R1 in the left mesh, R2 shared with the middle mesh, R3 on top of the middle mesh, a current source shared by the middle and right meshes, and R4 and R5 in the right mesh');
    return q({
        title: 'Mesh currents around a shared current source',
        text: T`In the circuit shown, find the clockwise mesh currents $I_1$, $I_2$ and $I_3$. The current source pushes $I_s$ upward through the branch shared by meshes 2 and 3. Then find the voltage across the current source (top terminal relative to bottom) and the power it delivers to the rest of the circuit. Resistances are in kΩ, so currents in mA come out directly.`,
        givens: [T`$V_s = ${Vs}\,\text{V}$, $I_s = ${Is}\,\text{mA}$`, T`$R_1 = ${R1}$, $R_2 = ${R2}$, $R_3 = ${R3}\,\text{k}\Omega$`, T`$R_4 = ${R4}$, $R_5 = ${R5}\,\text{k}\Omega$`],
        parts: [p(T`$I_1$`, I1, 'mA', .01, .001), p(T`$I_2$`, I2, 'mA', .01, .001), p(T`$I_3$`, I3, 'mA', .01, .001), p('Voltage across the current source', V, 'V', .01, .001), p('Power delivered by the current source', P, 'mW', .01, .001)],
        hints: [T`A current source shared by two meshes fixes their difference: $I_3 - I_2 = I_s$.`, T`You cannot write KVL around mesh 2 or mesh 3 alone (the source voltage is unknown). Go round the supermesh: the outer loop of meshes 2 and 3.`, T`Once the currents are known, KVL around mesh 3 alone gives the source voltage.`],
        steps: [T`Mesh 1: $(R_1 + R_2)I_1 - R_2I_2 = V_s$, i.e. $${tf(a11)}I_1 - ${R2}I_2 = ${Vs}$.`, T`Supermesh: $-R_2I_1 + (R_2 + R_3)I_2 + (R_4 + R_5)I_3 = 0$ with $I_3 = I_2 + ${Is}$: $-${R2}I_1 + ${tf(a22)}I_2 = ${tf(-R45 * Is)}$.`, T`Solving: $I_1 = ${tf(I1)}\,\text{mA}$, $I_2 = ${tf(I2)}\,\text{mA}$, $I_3 = ${tf(I3)}\,\text{mA}$.`, T`Mesh 3: $V = (R_4 + R_5)I_3 = ${tf(V)}\,\text{V}$, so the source delivers $P = VI_s = ${tf(P)}\,\text{mW}$.`, T`Check: $V_sI_1 + P = ${tf(Vs * I1 + P)}\,\text{mW}$ equals the power in the five resistors.`],
        idea: 'A current source in a shared branch removes one unknown and one equation: its constraint replaces the KVL you cannot write.',
        diagram, prerequisites: 'Kirchhoff’s voltage law; mesh analysis; 2×2 linear systems.',
        verify: () => { // nodal analysis: A after R1, B on top of the current source, C between R4 and R5
            const [A, B, C] = NUM.solve([[1 / R1 + 1 / R2 + 1 / R3, -1 / R3, 0], [-1 / R3, 1 / R3 + 1 / R4, -1 / R4], [0, -1 / R4, 1 / R4 + 1 / R5]], [Vs / R1, Is, 0]);
            return [(Vs - A) / R1, (A - B) / R3, (B - C) / R4, B, B * Is];
        }
    });
}

/* Level 2: a precharged capacitor switched onto a divider. Units: kΩ, µF, ms, V. */
function circuitsSwitchedRC(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'switched-rc', date, CIRCUITS_READING), p = part;
    const [[Vs, R1, R2, C, V0]] = grid(product(steps(5, 24, 1), [1, 2.2, 4.7], [2.2, 4.7, 10], [1, 2.2, 4.7, 10], [0, 1]).filter(([v, a, b, , v0]) => v * b / (a + b) > v0 + 1));
    const Vth = Vs * R2 / (R1 + R2), Rth = R1 * R2 / (R1 + R2), tau = Rth * C, t1 = Number((1.5 * tau).toPrecision(2)), vt1 = Vth + (V0 - Vth) * Math.exp(-t1 / tau);
    const Vt = Number((V0 + .6 * (Vth - V0)).toFixed(1)), tcross = tau * Math.log((Vth - V0) / (Vth - Vt)), i0 = (Vth - V0) / Rth;
    const diagram = drawing(element('DC', 80, 70, 80, 200, 'Vₛ') + element('R', 80, 70, 260, 70, 'R₁') + element('R', 260, 70, 260, 200, 'R₂') + wire('M260 70H330M395 70H500M330 70L388 46') +
        dot(260, 70) + dot(260, 200) + ring(330, 70, 3) + ring(395, 70, 3) + dt(362, 30, 't = 0') + element('C', 500, 70, 500, 200, 'C') + wire('M80 200H500') + ground(380, 200),
        'A source with R1 and R2 forming a divider; at t = 0 a switch connects a precharged capacitor C across R2');
    return q({
        title: 'A precharged capacitor meets a divider',
        text: T`The capacitor in the figure holds $V_0 = ${V0}\,\text{V}$ when the switch closes at $t = 0$. Find the Thévenin voltage and resistance that the capacitor sees, the time constant, the current through the switch just after it closes, the capacitor voltage at $t = ${t1}\,\text{ms}$, and the time at which the capacitor reaches $${Vt}\,\text{V}$.`,
        givens: [T`$V_s = ${Vs}\,\text{V}$`, T`$R_1 = ${R1}\,\text{k}\Omega$, $R_2 = ${R2}\,\text{k}\Omega$`, T`$C = ${C}\,\mu\text{F}$, $v_C(0) = ${V0}\,\text{V}$`],
        parts: [p(T`$V_{th}$`, Vth, 'V'), p(T`$\tau$`, tau, 'ms'), p('Switch current at 0⁺', i0, 'mA'), p(T`$v_C(${t1}\,\text{ms})$`, vt1, 'V'), p(T`Time to reach $${Vt}\,\text{V}$`, tcross, 'ms')],
        hints: [T`Replace everything the capacitor sees by its Thévenin equivalent: $V_{th} = V_s\dfrac{R_2}{R_1 + R_2}$ and $R_{th} = R_1 \parallel R_2$.`, T`A capacitor voltage cannot jump, so at $0^+$ the switch current is $(V_{th} - V_0)/R_{th}$.`, T`$v_C(t) = V_{th} + (V_0 - V_{th})e^{-t/\tau}$; solve it for $t$ to find the crossing time.`],
        steps: [T`$V_{th} = ${tf(Vth)}\,\text{V}$ and $R_{th} = ${tf(Rth)}\,\text{k}\Omega$, so $\tau = R_{th}C = ${tf(tau)}\,\text{ms}$ (kΩ × µF = ms).`, T`$i(0^+) = \dfrac{${tf(Vth)} - ${V0}}{${tf(Rth)}} = ${tf(i0)}\,\text{mA}$.`, T`$v_C(${t1}) = ${tf(Vth)} + (${V0} - ${tf(Vth)})e^{-${t1}/${tf(tau)}} = ${tf(vt1)}\,\text{V}$.`, T`$t = \tau\ln\dfrac{V_{th} - V_0}{V_{th} - ${Vt}} = ${tf(tcross)}\,\text{ms}$.`],
        idea: 'Any first-order circuit is a Thévenin source charging one capacitor: find the initial value, the final value and τ, and the whole waveform follows.',
        diagram, prerequisites: 'Thévenin equivalents; first-order transients; logarithms.',
        verify: () => { // integrate C dv/dt = (Vs − v)/R1 − v/R2 with small steps
            const f = v => ((Vs - v) / R1 - v / R2) / C, h = tau / 4000;
            let v = V0, t = 0, cross = NaN, at1 = NaN;
            while (t < Math.max(t1, 3 * tcross) + h) {
                const k1 = f(v), k2 = f(v + h / 2 * k1), k3 = f(v + h / 2 * k2), k4 = f(v + h * k3), nv = v + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
                if (Number.isNaN(cross) && v < Vt && nv >= Vt) cross = t + h * (Vt - v) / (nv - v);
                if (Number.isNaN(at1) && t + h >= t1) at1 = v + (nv - v) * (t1 - t) / h;
                v = nv; t += h;
            }
            return [Vth, tau, (Vth - V0) / Rth, at1, cross];
        }
    });
}

/* Level 2: series RLC resonance, bandwidth and the capacitor voltage at resonance. */
function circuitsResonance(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'resonance', date, CIRCUITS_READING), p = part;
    const [R, Lm, Cn, V] = grid([4.7, 6.8, 10, 15, 22, 33, 47, 68], [1, 2.2, 4.7, 10], [10, 22, 47, 100], [1, 2, 5, 10]), L = Lm * 1e-3, C = Cn * 1e-9;
    const w0 = 1 / Math.sqrt(L * C), f0 = w0 / (2 * Math.PI), Q = Math.sqrt(L / C) / R, B = R / (2 * Math.PI * L), fl = Math.sqrt(f0 * f0 + B * B / 4) - B / 2, fh = fl + B, VC = Q * V;
    const diagram = drawing(element('AC', 90, 70, 90, 200, 'Vₛ') + element('R', 90, 70, 280, 70, 'R') + element('L', 280, 70, 470, 70, 'L') + wire('M470 70H560') + element('C', 560, 70, 560, 200, 'C') +
        wire('M90 200H560') + ground(325, 200), 'A sinusoidal source driving R, L and C in series');
    return q({
        title: 'Resonance in a series RLC circuit',
        text: T`A sinusoidal source of $${V}\,\text{V}$ RMS drives the series circuit shown, and its frequency can be tuned. Find the resonant frequency, the quality factor and the half-power bandwidth, then both half-power frequencies exactly (not as $f_0 \pm B/2$). Finally find the RMS voltage across the capacitor at resonance.`,
        givens: [T`$R = ${R}\,\Omega$`, T`$L = ${Lm}\,\text{mH}$`, T`$C = ${Cn}\,\text{nF}$`, T`$V_s = ${V}\,\text{V}$ RMS`],
        parts: [p(T`$f_0$`, f0 / 1e3, 'kHz'), p(T`$Q$`, Q, ''), p('Bandwidth', B, 'Hz'), p('Lower half-power frequency', fl / 1e3, 'kHz'), p('Upper half-power frequency', fh / 1e3, 'kHz'), p(T`$|V_C|$ at $f_0$`, VC, 'V')],
        hints: [T`At resonance $\omega_0L = 1/(\omega_0C)$: the reactances cancel and the current is $V/R$.`, T`Half power means $|Z| = \sqrt2R$, i.e. $\omega L - \dfrac{1}{\omega C} = \pm R$: two quadratics in $\omega$.`, T`The bandwidth is exactly $R/(2\pi L)$ and $f_lf_h = f_0^2$; the two frequencies are not symmetric about $f_0$.`],
        steps: [T`$f_0 = \dfrac{1}{2\pi\sqrt{LC}} = ${tf(f0 / 1e3)}\,\text{kHz}$ and $Q = \dfrac1R\sqrt{\dfrac LC} = ${tf(Q)}$.`, T`$B = \dfrac{R}{2\pi L} = ${tf(B)}\,\text{Hz}$.`, T`$f_{l,h} = \sqrt{f_0^2 + (B/2)^2} \mp \dfrac B2$: $${tf(fl / 1e3)}\,\text{kHz}$ and $${tf(fh / 1e3)}\,\text{kHz}$.`, T`At resonance $I = V/R$ and $|V_C| = \dfrac{I}{\omega_0C} = QV = ${tf(VC)}\,\text{V}$.`],
        idea: 'At resonance a series RLC is purely resistive, yet the reactive voltages are Q times the source: a high-Q circuit amplifies voltage without amplifying power.',
        diagram, prerequisites: 'Phasors; impedance; quadratic equations.',
        verify: () => { // the current magnitude versus frequency, and its half-power points by bisection
            const I = f => { const w = 2 * Math.PI * f; return V / Math.hypot(R, w * L - 1 / (w * C)); }, Imax = V / R, half = f => I(f) - Imax / Math.SQRT2;
            const lo = NUM.bisect(half, f0 / 1e4, f0, 200), hi = NUM.bisect(half, f0, f0 * 1e4, 200);
            return [f0 / 1e3, (2 * Math.PI * f0 * L) / R, hi - lo, lo / 1e3, hi / 1e3, I(f0) / (2 * Math.PI * f0 * C)];
        }
    });
}

/* Level 3: the step response of a switched series RLC with a precharged capacitor (underdamped). */
function circuitsRLCStep(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'rlc-step', date, CIRCUITS_READING), p = part;
    const zeta = ([, , R, Lm, Cu]) => R / 2 * Math.sqrt(Cu * 1e-6 / (Lm * 1e-3));
    const [[Vs, V0, R, Lm, Cu]] = grid(product([5, 10, 12, 15, 24], [0, 1, 2], steps(10, 100, 10), [1, 2.2, 4.7, 10], [1, 2.2, 4.7]).filter(c => c[1] < c[0] / 2 && zeta(c) > .05 && zeta(c) < .8));
    const L = Lm * 1e-3, C = Cu * 1e-6, alpha = R / (2 * L), w0 = 1 / Math.sqrt(L * C), wd = Math.sqrt(w0 * w0 - alpha * alpha), z = alpha / w0;
    const v = t => Vs + (V0 - Vs) * Math.exp(-alpha * t) * (Math.cos(wd * t) + alpha / wd * Math.sin(wd * t));
    const tp = Math.PI / wd, vp = Vs + (Vs - V0) * Math.exp(-alpha * tp), t1 = Number((tp / 2 * 1e3).toPrecision(2)), v1 = v(t1 * 1e-3);
    const diagram = drawing(element('DC', 80, 70, 80, 200, 'Vₛ') + wire('M80 70H140M200 70H230M140 70L195 48') + ring(140, 70, 3) + ring(200, 70, 3) + dt(170, 30, 't = 0') +
        element('R', 230, 70, 380, 70, 'R') + element('L', 380, 70, 530, 70, 'L') + wire('M530 70H600') + element('C', 600, 70, 600, 200, 'C') + note(627, 100, '+ vC') + wire('M80 200H600') + ground(340, 200),
        'At t = 0 a switch connects a DC source to R, L and a precharged capacitor in series');
    return q({
        title: 'An RLC circuit rings after a switch',
        text: T`Before $t = 0$ the inductor carries no current and the capacitor holds $${V0}\,\text{V}$. The switch then connects the $${Vs}\,\text{V}$ source. Find the neper frequency $\alpha$, the damping ratio, the damped frequency $\omega_d$, and the time and value of the first maximum of $v_C$. Then find $v_C$ at $t = ${t1}\,\text{ms}$.`,
        givens: [T`$V_s = ${Vs}\,\text{V}$, $v_C(0^-) = ${V0}\,\text{V}$, $i_L(0^-) = 0$`, T`$R = ${R}\,\Omega$, $L = ${Lm}\,\text{mH}$, $C = ${Cu}\,\mu\text{F}$`],
        parts: [p(T`$\alpha$`, alpha, '1/s'), p(T`Damping ratio $\zeta$`, z, ''), p(T`$\omega_d$`, wd, 'rad/s'), p('Time of the first maximum', tp * 1e3, 'ms'), p(T`First maximum of $v_C$`, vp, 'V'), p(T`$v_C(${t1}\,\text{ms})$`, v1, 'V')],
        hints: [T`KVL gives $LC\ddot v_C + RC\dot v_C + v_C = V_s$: $\alpha = R/(2L)$ and $\omega_0 = 1/\sqrt{LC}$.`, T`The initial conditions are $v_C(0^+) = ${V0}\,\text{V}$ and $\dot v_C(0^+) = i(0^+)/C = 0$.`, T`With zero initial slope, $v_C = V_s + (V_0 - V_s)e^{-\alpha t}\left(\cos\omega_dt + \dfrac{\alpha}{\omega_d}\sin\omega_dt\right)$; its first maximum is at $t = \pi/\omega_d$.`],
        steps: [T`$\alpha = ${tf(alpha)}\,\text{s}^{-1}$, $\omega_0 = ${tf(w0)}\,\text{rad/s}$, $\zeta = \alpha/\omega_0 = ${tf(z)}$: underdamped.`, T`$\omega_d = \sqrt{\omega_0^2 - \alpha^2} = ${tf(wd)}\,\text{rad/s}$.`, T`$t_p = \pi/\omega_d = ${tf(tp * 1e3)}\,\text{ms}$ and $v_C(t_p) = V_s + (V_s - V_0)e^{-\alpha t_p} = ${tf(vp)}\,\text{V}$.`, T`$v_C(${t1}\,\text{ms}) = ${tf(v1)}\,\text{V}$.`],
        idea: 'Two energy stores give two initial conditions; the capacitor voltage and the inductor current both carry across the switching instant.',
        diagram, prerequisites: 'Second-order differential equations; initial conditions; damping.',
        verify: () => { // simulate L di/dt = Vs − Ri − v, C dv/dt = i
            const h = tp / 20000, f = (i, vv) => [(Vs - R * i - vv) / L, i / C];
            let i = 0, vv = V0, t = 0, peak = -Infinity, tpk = 0, at1 = NaN;
            while (t < 1.5 * tp) {
                const k1 = f(i, vv), k2 = f(i + h / 2 * k1[0], vv + h / 2 * k1[1]), k3 = f(i + h / 2 * k2[0], vv + h / 2 * k2[1]), k4 = f(i + h * k3[0], vv + h * k3[1]);
                const ni = i + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), nv = vv + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
                if (Number.isNaN(at1) && t + h >= t1 * 1e-3) at1 = vv + (nv - vv) * (t1 * 1e-3 - t) / h;
                i = ni; vv = nv; t += h;
                if (vv > peak) { peak = vv; tpk = t; }
            }
            return [R / (2 * L), R / 2 * Math.sqrt(C / L), Math.sqrt(1 / (L * C) - (R / (2 * L)) ** 2), tpk * 1e3, peak, at1];
        }
    });
}

/* Level 3: maximum power transfer when the load is restricted. */
function circuitsRestrictedPower(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'restricted-power', date, CIRCUITS_READING), p = part;
    const [V, Rs, Xs, XL] = grid([10, 20, 50, 100, 120], steps(5, 50, 5), [-40, -20, 20, 40, 60], [-30, -10, 15, 35]);
    const Pc = V * V / (4 * Rs), Rr = Math.hypot(Rs, Xs), Pr = V * V * Rr / ((Rs + Rr) ** 2 + Xs * Xs), Rx = Math.hypot(Rs, Xs + XL), Px = V * V * Rx / ((Rs + Rx) ** 2 + (Xs + XL) ** 2);
    const reac = (x, x1, x2, name) => element(x > 0 ? 'L' : 'C', x1, 70, x2, 70, name), sgn = x => (x < 0 ? '-' : '+') + ' j' + Math.abs(x);
    const diagram = drawing(element('AC', 80, 70, 80, 200, 'Vₛ') + element('R', 80, 70, 230, 70, 'Rₛ') + reac(Xs, 230, 380, 'jXₛ') + wire('M380 70H430M80 200H600') + ring(440, 70, 5) + ring(440, 200, 5) +
        dt(440, 50, 'a') + dt(440, 228, 'b') + wire('M445 70H470') + element('R', 470, 70, 600, 70, 'R') + element(XL > 0 ? 'L' : 'C', 600, 70, 600, 200, 'jXʟ') + wire('M445 200H600'),
        'A source with internal resistance and reactance drives, between terminals a and b, a load made of an adjustable resistor R in series with a reactance');
    return q({
        title: 'Maximum power when the load is restricted',
        text: T`An AC source of $${V}\,\text{V}$ RMS has internal impedance $Z_s = ${Rs} ${sgn(Xs)}\,\Omega$. (a) Find the most power any passive load could draw. (b) If the load must be a pure resistor, find the best resistance and the power it draws. (c) The load in the figure has a fixed reactance $jX_L = ${XL < 0 ? '-' : ''}j${Math.abs(XL)}\,\Omega$ in series with an adjustable resistor $R$: find the best $R$ and the power. (d) What fraction of the conjugate-match power does the pure resistor of (b) get?`,
        givens: [T`$V_s = ${V}\,\text{V}$ RMS`, T`$Z_s = ${Rs} ${sgn(Xs)}\,\Omega$`, T`$X_L = ${XL}\,\Omega$ (fixed)`],
        parts: [p('Conjugate-match power', Pc, 'W'), p('Best pure resistor', Rr, 'Ω'), p('Power into that resistor', Pr, 'W'), p(T`Best $R$ with $X_L$ fixed`, Rx, 'Ω'), p(T`Power with $X_L$ fixed`, Px, 'W'), p('Fraction in (d)', Pr / Pc, '')],
        hints: [T`$P = |I|^2R = \dfrac{V^2R}{(R_s + R)^2 + X^2}$, where $X$ is the total reactance in the loop.`, T`For a fixed total reactance $X$, $dP/dR = 0$ gives $R = \sqrt{R_s^2 + X^2}$.`, T`The conjugate load cancels all reactance and sets $R = R_s$: $P = V^2/(4R_s)$.`],
        steps: [T`(a) $P_{\max} = \dfrac{V^2}{4R_s} = ${tf(Pc)}\,\text{W}$.`, T`(b) $X = X_s$: $R = |Z_s| = ${tf(Rr)}\,\Omega$ and $P = ${tf(Pr)}\,\text{W}$.`, T`(c) $X = X_s + X_L = ${Xs + XL}\,\Omega$: $R = ${tf(Rx)}\,\Omega$ and $P = ${tf(Px)}\,\text{W}$.`, T`(d) $${tf(Pr)}/${tf(Pc)} = ${tf(Pr / Pc)}$.`],
        idea: 'Maximum power transfer depends on what you are allowed to adjust: with only a resistor, match its value to the magnitude of everything else in the loop.',
        diagram, prerequisites: 'Complex impedance; calculus of one variable; AC power.',
        verify: () => { // golden-section search on P(R) for each restriction
            const best = X => { let a = 0, b = 1e4; const P = r => V * V * r / ((Rs + r) ** 2 + X * X), g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 200; i++) { const c = b - g * (b - a), d = a + g * (b - a); if (P(c) > P(d)) b = d; else a = c; } const r = (a + b) / 2; return [r, P(r)]; };
            const [r1, p1] = best(Xs), [r2, p2] = best(Xs + XL), pc = best(0)[1];
            return [pc, r1, p1, r2, p2, p1 / pc];
        }
    });
}

/* Level 3: two-port parameters of a T network with a current-controlled voltage source in its shunt arm. Units: Ω. */
function circuitsTwoPort(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'two-port', date, CIRCUITS_READING), p = part;
    const [Za, Zb, Zc, r, RL] = grid([10, 22, 47, 100], [10, 33, 68], [100, 220, 470, 1000], [50, 100, 200, 500], [100, 470, 1000]), Rs = 50;
    const z11 = Za + Zc + r, z12 = Zc, z21 = Zc + r, z22 = Zb + Zc, Zin = z11 - z12 * z21 / (z22 + RL), gain = z21 * RL / ((z11 + Rs) * (z22 + RL) - z12 * z21), Zout = z22 - z12 * z21 / (z11 + Rs);
    const diagram = drawing(element('AC', 60, 70, 60, 200, 'Vₛ') + element('R', 60, 70, 170, 70, 'Rₛ') + ring(195, 70, 4) + ring(195, 200, 4) + dt(195, 52, '1') + wire('M199 70H210M199 200H470') +
        element('R', 210, 70, 330, 70, 'Za') + element('R', 330, 70, 450, 70, 'Zb') + element('R', 330, 70, 330, 140, 'Zc') + wire('M330 140V150M330 190V200M330 150l18 20 -18 20 -18 -20z') +
        dt(330, 167, '+') + dt(330, 187, '−') + note(357, 176, 'r·i₁') + wire('M450 70H470M60 200H191') + ring(475, 70, 4) + ring(475, 200, 4) + dt(475, 52, '2') + wire('M479 70H600M479 200H600') +
        element('R', 600, 70, 600, 200, 'Rʟ') + arrow(170, 92, 200, 92) + dt(186, 112, 'i₁') + dot(330, 70) + dot(330, 200),
        'A T network between port 1 and port 2: series Za and Zb, and a shunt arm of Zc in series with a voltage source r times i1. A source with Rs drives port 1 and RL loads port 2');
    return q({
        title: 'A T network with a dependent source',
        text: T`The T network in the figure has a shunt arm made of $Z_c$ in series with a current-controlled voltage source $r\,i_1$, where $i_1$ is the current into port 1 ($+$ terminal up). Find the impedance parameters $z_{11}$ and $z_{21}$ (the network is not reciprocal). With $R_L$ on port 2, find the input impedance at port 1. With the source $V_s$ and $R_s = ${Rs}\,\Omega$ connected, find the voltage gain $V_2/V_s$, and the output impedance seen at port 2.`,
        givens: [T`$Z_a = ${Za}\,\Omega$, $Z_b = ${Zb}\,\Omega$, $Z_c = ${Zc}\,\Omega$`, T`$r = ${r}\,\Omega$`, T`$R_L = ${RL}\,\Omega$, $R_s = ${Rs}\,\Omega$`],
        parts: [p(T`$z_{11}$`, z11, 'Ω'), p(T`$z_{21}$`, z21, 'Ω'), p('Input impedance with RL', Zin, 'Ω'), p(T`$V_2/V_s$`, gain, 'V/V'), p('Output impedance at port 2', Zout, 'Ω')],
        hints: [T`With both port currents entering, the shunt-arm voltage is $Z_c(i_1 + i_2) + r\,i_1$.`, T`So $V_1 = (Z_a + Z_c + r)i_1 + Z_ci_2$ and $V_2 = (Z_c + r)i_1 + (Z_b + Z_c)i_2$. The dependent source breaks $z_{12} = z_{21}$.`, T`Terminations: $Z_{\text{in}} = z_{11} - \dfrac{z_{12}z_{21}}{z_{22} + R_L}$ and $Z_{\text{out}} = z_{22} - \dfrac{z_{12}z_{21}}{z_{11} + R_s}$.`],
        steps: [T`$z_{11} = ${z11}$, $z_{12} = ${z12}$, $z_{21} = ${z21}$, $z_{22} = ${z22}\,\Omega$.`, T`$Z_{\text{in}} = ${z11} - \dfrac{${z12}\cdot${z21}}{${z22} + ${RL}} = ${tf(Zin)}\,\Omega$.`, T`$\dfrac{V_2}{V_s} = \dfrac{z_{21}R_L}{(z_{11} + R_s)(z_{22} + R_L) - z_{12}z_{21}} = ${tf(gain)}$.`, T`$Z_{\text{out}} = ${z22} - \dfrac{${z12}\cdot${z21}}{${z11} + ${Rs}} = ${tf(Zout)}\,\Omega$.`],
        idea: 'Two-port parameters capture a network once; every termination then follows from algebra, and a dependent source shows up as z₁₂ ≠ z₂₁.',
        diagram, prerequisites: 'Two-port networks; dependent sources; nodal analysis.',
        verify: () => { // nodal analysis of the whole circuit: P1 after Rs, M at the T junction, P2 at port 2; the CCVS sets X = r i1
            const solve = (vs, inj, rl) => { const g = rl ? 1 / rl : 0, k = r / Rs; // X = r (vs − P1)/Rs
                const [P1, M, P2] = NUM.solve([[1 / Rs + 1 / Za, -1 / Za, 0], [-1 / Za + k / Zc, 1 / Za + 1 / Zc + 1 / Zb, -1 / Zb], [0, -1 / Zb, 1 / Zb + g]], [vs / Rs, k * vs / Zc, inj]);
                return {P1, P2, i1: (vs - P1) / Rs}; };
            const a = solve(1, 0, RL), zin = a.P1 / a.i1, b = solve(0, 1, 0);
            return [Za + Zc + r, Zc + r, zin, a.P2, b.P2];
        }
    });
}

/* Level 4 (expert): magnetically coupled coils, reflected impedance and power to the load. */
function circuitsCoupledCoils(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'coupled-coils', date, CIRCUITS_READING), p = part;
    const [L1m, L2m, k, RL, fk] = grid([1, 2.2, 4.7], [1, 2.2, 4.7, 10], [.3, .5, .7, .9], [10, 22, 47, 100], [5, 10, 20]), Rs = 5, Vs = 10;
    const w = 2 * Math.PI * fk * 1e3, L1 = L1m * 1e-3, L2 = L2m * 1e-3, M = k * Math.sqrt(L1 * L2), z2 = cx(RL, w * L2);
    const refl = cd(cx((w * M) ** 2), z2), Zin = ca(cx(0, w * L1), refl), I1 = cd(cx(Vs), ca(cx(Rs), Zin)), I2 = cd(cm(cx(0, -w * M), I1), z2);
    const Pl = cabs(I2) ** 2 * RL, Psrc = cm(cx(Vs), cx(I1.re, -I1.im)).re, eta = Pl / Psrc;
    const diagram = drawing(element('AC', 70, 80, 70, 200, 'Vₛ') + element('R', 70, 80, 220, 80, 'Rₛ') + wire('M220 80H260M70 200H260') + element('L', 260, 80, 260, 200, 'L₁') +
        element('L', 400, 200, 400, 80, '') + note(345, 146, 'L₂') + wire('M400 80H560M400 200H560') + element('R', 560, 80, 560, 200, 'Rʟ') + dot(246, 104) + dot(386, 104) +
        dt(330, 54, 'M = k√(L₁L₂)') + wire('M318 70v140M342 70v140'), 'A source with Rs drives coil L1; coil L2, magnetically coupled with the dots at the top ends, feeds the load RL');
    return q({
        title: 'Power through coupled coils',
        text: T`The source in the figure ($${Vs}\,\text{V}$ RMS at $${fk}\,\text{kHz}$, internal resistance $R_s = ${Rs}\,\Omega$) drives coil $L_1$. Coil $L_2$ is coupled to it with coefficient $k$ (dots at the top ends) and feeds $R_L$. Find the impedance seen by the source at the primary terminals (real and imaginary parts), the magnitudes of both coil currents, the power delivered to $R_L$, and the fraction of the power delivered by the ideal source $V_s$ that reaches $R_L$.`,
        givens: [T`$L_1 = ${L1m}\,\text{mH}$, $L_2 = ${L2m}\,\text{mH}$, $k = ${k}$`, T`$R_L = ${RL}\,\Omega$, $R_s = ${Rs}\,\Omega$`, T`$V_s = ${Vs}\,\text{V}$ RMS, $f = ${fk}\,\text{kHz}$`],
        parts: [p(T`$\operatorname{Re} Z_{\text{in}}$`, Zin.re, 'Ω'), p(T`$\operatorname{Im} Z_{\text{in}}$`, Zin.im, 'Ω'), p(T`$|I_1|$`, cabs(I1) * 1e3, 'mA'), p(T`$|I_2|$`, cabs(I2) * 1e3, 'mA'), p('Power in RL', Pl * 1e3, 'mW'), p('Fraction of source power reaching RL', 100 * eta, '%')],
        hints: [T`$M = k\sqrt{L_1L_2}$. With both currents entering the dotted ends: $V_1 = j\omega L_1I_1 + j\omega MI_2$ and $0 = j\omega MI_1 + (j\omega L_2 + R_L)I_2$.`, T`Eliminate $I_2$: the secondary appears in the primary as the reflected impedance $\dfrac{\omega^2M^2}{j\omega L_2 + R_L}$.`, T`Only $R_s$ and $R_L$ dissipate power. The ideal source delivers $\operatorname{Re}\{V_sI_1^*\}$; what enters the primary of these ideal coils all reaches $R_L$.`],
        steps: [T`$\omega = ${tf(w)}\,\text{rad/s}$, $M = ${tf(M * 1e3)}\,\text{mH}$, $\omega M = ${tf(w * M)}\,\Omega$.`, T`$Z_r = \dfrac{(\omega M)^2}{R_L + j\omega L_2} = ${tc(refl)}\,\Omega$, so $Z_{\text{in}} = j\omega L_1 + Z_r = ${tc(Zin)}\,\Omega$.`, T`$I_1 = \dfrac{V_s}{R_s + Z_{\text{in}}} = ${tc(I1)}\,\text{A}$, $|I_1| = ${tf(cabs(I1) * 1e3)}\,\text{mA}$; $I_2 = \dfrac{-j\omega MI_1}{R_L + j\omega L_2}$, $|I_2| = ${tf(cabs(I2) * 1e3)}\,\text{mA}$.`, T`$P_L = |I_2|^2R_L = ${tf(Pl * 1e3)}\,\text{mW}$. The source delivers $${tf(Psrc * 1e3)}\,\text{mW}$ in total, so $${tf(100 * eta)}\%$ reaches the load (the rest heats $R_s$).`],
        idea: 'A coupled secondary is felt by the primary as a reflected impedance: its resistance draws real power through the magnetic field.',
        diagram, prerequisites: 'Mutual inductance; the dot convention; phasor analysis; AC power.',
        verify: () => { // T-equivalent of the coupled pair: series j(L1 − M), shunt jM, series j(L2 − M), then a voltage divider
            const Z1 = cx(Rs, w * (L1 - M)), Zm = cx(0, w * M), Z2 = cx(RL, w * (L2 - M)), par = cd(cm(Zm, Z2), ca(Zm, Z2)), Vc = cd(cm(cx(Vs), par), ca(Z1, par));
            const i1 = cd(cs(cx(Vs), Vc), Z1), i2 = cd(Vc, Z2), zin = cs(cd(cx(Vs), i1), cx(Rs)), pl = cabs(i2) ** 2 * RL, ps = Vs * i1.re;
            return [zin.re, zin.im, cabs(i1) * 1e3, cabs(i2) * 1e3, pl * 1e3, 100 * pl / ps];
        }
    });
}

/* Level 4 (mastery): a square wave into an RC low-pass, solved exactly in periodic steady state. */
function circuitsSquareWave(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'square-wave', date, CIRCUITS_READING), p = part;
    const [[Vp, Rk, Cn, fk]] = grid(product([1.8, 2.5, 3.3, 5, 10, 12], [1, 2.2, 4.7, 10], [10, 22, 47, 100], [.5, 1, 2, 3, 5, 10]).filter(([, r, c, f]) => { const x = 1 / (2 * f * 1e3) / (r * c * 1e-6); return x > .1 && x < 10; }));
    const tau = Rk * 1e3 * Cn * 1e-9, Tp = 1 / (fk * 1e3), h = Tp / 2, e = Math.exp(-h / tau), Vmax = Vp / (1 + e), Vmin = Vp * e / (1 + e), pp = Vmax - Vmin;
    const high = Vp * Vp * h + 2 * Vp * (Vmin - Vp) * tau * (1 - e) + (Vmin - Vp) ** 2 * tau / 2 * (1 - e * e), low = Vmax * Vmax * tau / 2 * (1 - e * e), rms = Math.sqrt((high + low) / Tp);
    const w0 = 2 * Math.PI / Tp, a1 = 2 * Vp / Math.PI / Math.hypot(1, w0 * tau), ratio = 2 * a1 / pp;
    const sq = 'M64 146h8v-22h16v22h8';
    const diagram = drawing(ring(80, 135, 20) + wire(sq.replace('M64', 'M66')) + wire('M80 115V70M80 155V200') + note(110, 141, '0 ↔ Vₚ') + element('R', 80, 70, 330, 70, 'R') + wire('M330 70H430') + element('C', 430, 70, 430, 200, 'C') +
        wire('M430 70H530M80 200H530') + ring(535, 70, 4) + ring(535, 200, 4) + note(555, 141, 'vC') + ground(300, 200), 'A square-wave source switching between 0 and Vp drives a series resistor R and capacitor C; the output is the capacitor voltage');
    return q({
        title: 'A square wave through an RC low-pass, exactly',
        text: T`A 50% duty-cycle square wave switching between $0$ and $V_p = ${Vp}\,\text{V}$ at $${fk}\,\text{kHz}$ drives the RC circuit shown. In periodic steady state the capacitor charges and discharges along exponentials between $V_{\min}$ and $V_{\max}$. Find $V_{\max}$, the peak-to-peak ripple, and the RMS value of $v_C$ (including its DC part). Then find the amplitude of the fundamental component of $v_C$, and the ratio of twice that amplitude to the exact peak-to-peak ripple: how well does a one-harmonic estimate predict the ripple?`,
        givens: [T`$V_p = ${Vp}\,\text{V}$, $f = ${fk}\,\text{kHz}$, duty 50%`, T`$R = ${Rk}\,\text{k}\Omega$, $C = ${Cn}\,\text{nF}$`],
        parts: [p(T`$V_{\max}$`, Vmax, 'V'), p('Peak-to-peak ripple', pp, 'V'), p(T`RMS of $v_C$`, rms, 'V'), p('Fundamental amplitude', a1, 'V'), p('Ratio 2 × fundamental / ripple', ratio, '')],
        hints: [T`In steady state the high half-period takes $V_{\min}$ to $V_{\max}$ and the low half takes it back: $V_{\max} = V_p + (V_{\min} - V_p)e^{-T/2\tau}$ and $V_{\min} = V_{\max}e^{-T/2\tau}$.`, T`Square each exponential segment and integrate it in closed form; add the two halves and divide by $T$.`, T`The input's fundamental has amplitude $2V_p/\pi$; the RC passes it with gain $1/\sqrt{1 + (\omega_0\tau)^2}$.`],
        steps: [T`$\tau = RC = ${tf(tau * 1e6)}\,\mu\text{s}$, $T/2 = ${tf(h * 1e6)}\,\mu\text{s}$, $x = e^{-T/2\tau} = ${tf(e)}$.`, T`$V_{\max} = \dfrac{V_p}{1 + x} = ${tf(Vmax)}\,\text{V}$, $V_{\min} = ${tf(Vmin)}\,\text{V}$, ripple $= V_p\tanh\dfrac{T}{4\tau} = ${tf(pp)}\,\text{V}$.`, T`$\displaystyle\int_0^Tv_C^2\,dt = ${tf((high + low) * 1e6)}\,\text{V}^2\mu\text{s}$, so the RMS is $${tf(rms)}\,\text{V}$ (the DC part alone is $${tf(Vp / 2)}\,\text{V}$).`, T`Fundamental: $\dfrac{2V_p/\pi}{\sqrt{1 + (\omega_0\tau)^2}} = ${tf(a1)}\,\text{V}$; ratio $= ${tf(ratio)}$.`],
        idea: 'For a slow filter the ripple is nearly sinusoidal and one harmonic predicts it well; for a fast one the output keeps the square wave’s corners and the harmonics matter.',
        diagram, prerequisites: 'First-order transients; Fourier series; RMS values.',
        verify: () => { // Fourier series: DC Vp/2 plus odd harmonics 2Vp/(kπ) through the RC
            let ms = (Vp / 2) ** 2, vT2 = Vp / 2, v0 = Vp / 2;
            for (let k = 1; k < 40001; k += 2) {
                const g = 1 / Math.hypot(1, k * w0 * tau), ph = Math.atan(k * w0 * tau), a = 2 * Vp / (k * Math.PI) * g;
                ms += a * a / 2; vT2 += a * Math.sin(k * Math.PI - ph); v0 += a * Math.sin(-ph);
            }
            const ripple = vT2 - v0, fund = 2 * Vp / Math.PI / Math.hypot(1, w0 * tau);
            return [vT2, ripple, Math.sqrt(ms), fund, 2 * fund / ripple];
        }
    });
}
