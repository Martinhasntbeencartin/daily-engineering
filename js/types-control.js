/* Control systems: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (simulation, bisection, Ackermann's formula). */
const CONTROL_READING = {title: 'Feedback Control Systems (MIT OpenCourseWare 16.30)', url: 'https://ocw.mit.edu/courses/16-30-feedback-control-systems-fall-2010/'};
addTypes('control', 'university', controlStepSpecs, controlZieglerNichols, controlRootLocus);
addTypes('control', 'challenge', controlPolePlacement, controlDigital, controlDelayMargin);
addTypes('control', 'expert', controlSensitivity);
addTypes('control', 'mastery', controlMinEnergy);

/* Simulate ẋ = f(t, x) with fixed-step RK4; calls back after every step with (t, x). */
function ctrlSim(f, x0, h, tEnd, each) {
    let x = x0.slice(), t = 0;
    while (t < tEnd - 1e-12) {
        const k1 = f(t, x), k2 = f(t + h / 2, x.map((v, i) => v + h / 2 * k1[i])), k3 = f(t + h / 2, x.map((v, i) => v + h / 2 * k2[i])), k4 = f(t + h, x.map((v, i) => v + h * k3[i]));
        x = x.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); t += h;
        if (each) each(t, x);
    }
    return x;
}
const ctrlPhase = (re, im) => Math.atan2(im, re) * 180 / Math.PI;

/* Level 2: time-domain specifications of a second-order loop. */
function controlStepSpecs(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'step-specs', date, CONTROL_READING), p = part;
    const [[a, K]] = grid(product([1, 2, 3, 4, 5, 6, 8, 10], steps(1, 120, 1)).filter(([a, K]) => a / (2 * Math.sqrt(K)) >= .15 && a / (2 * Math.sqrt(K)) <= .85));
    const wn = Math.sqrt(K), z = a / (2 * wn), wd = wn * Math.sqrt(1 - z * z), Mp = 100 * Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)), tp = Math.PI / wd, ts = 4 / (z * wn), ess = a / K;
    return q({
        title: 'Overshoot, peak time and settling of a feedback loop',
        text: T`The plant $G(s) = \dfrac{${K}}{s(s + ${a})}$ is in a unity negative-feedback loop. Find the closed-loop damping ratio and natural frequency, the percentage overshoot and peak time of the unit-step response, the 2% settling time (use the usual estimate $4/(\zeta\omega_n)$), and the steady-state error to a unit ramp.`,
        givens: [T`$G(s) = \dfrac{${K}}{s(s+${a})}$`, 'Unity negative feedback', 'Unit step and unit ramp inputs'],
        parts: [p(T`$\zeta$`, z, ''), p(T`$\omega_n$`, wn, 'rad/s'), p('Overshoot', Mp, '%'), p('Peak time', tp, 's'), p('2% settling time', ts, 's'), p('Ramp error', ess, '')],
        hints: [T`$\dfrac{Y}{R} = \dfrac{K}{s^2 + as + K}$: compare with $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_ns + \omega_n^2}$.`, T`$M_p = e^{-\zeta\pi/\sqrt{1 - \zeta^2}}$ and $t_p = \pi/\omega_d$ with $\omega_d = \omega_n\sqrt{1 - \zeta^2}$.`, T`The loop is type 1, so a ramp leaves a constant error $1/K_v$ with $K_v = \lim_{s\to0}sG(s) = K/a$.`],
        steps: [T`$\omega_n = \sqrt{${K}} = ${tf(wn)}\,\text{rad/s}$, $\zeta = \dfrac{${a}}{2\omega_n} = ${tf(z)}$.`, T`$M_p = ${tf(Mp)}\%$, $\omega_d = ${tf(wd)}\,\text{rad/s}$, $t_p = ${tf(tp)}\,\text{s}$.`, T`$t_s \approx 4/(\zeta\omega_n) = 8/a = ${tf(ts)}\,\text{s}$.`, T`$e_{\text{ramp}} = a/K = ${tf(ess)}$.`],
        idea: 'Raising the gain of this loop speeds it up and cuts the ramp error but lowers the damping: one knob cannot set every specification.',
        diagram: hardFeedbackDiagram('', `${K}/[s(s+${a})]`), prerequisites: 'Second-order systems; Laplace transforms; final-value theorem.',
        verify: () => { // simulate the closed loop for a step (peak) and a ramp (error), and read the decay rate from the poles
            let peak = 0, tpk = 0;
            ctrlSim((t, x) => [x[1], K * (1 - x[0]) - a * x[1]], [0, 0], tp / 4000, 2 * tp, (t, x) => { if (x[0] > peak) { peak = x[0]; tpk = t; } });
            let rampErr = NaN; ctrlSim((t, x) => [x[1], K * (t - x[0]) - a * x[1]], [0, 0], .002, 40 / (z * wn), (t, x) => { rampErr = t - x[0]; });
            return [a / (2 * Math.sqrt(K)), Math.sqrt(K), 100 * (peak - 1), tpk, 4 / (a / 2), rampErr];
        }
    });
}

/* Level 2: ultimate gain by the Routh criterion, then Ziegler–Nichols PID settings. */
function controlZieglerNichols(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ziegler-nichols', date, CONTROL_READING), p = part;
    const [t1, t2, t3, K0] = grid([.2, .5, 1, 2], [1, 1.5, 2, 3, 5], [5, 8, 10, 15, 20], [.5, 1, 2, 4, 5]);
    const a3 = t1 * t2 * t3, a2 = t1 * t2 + t1 * t3 + t2 * t3, a1 = t1 + t2 + t3, Ku = (a1 * a2 / a3 - 1) / K0, wu = Math.sqrt(a1 / a3), Pu = 2 * Math.PI / wu;
    return q({
        title: 'Tune a PID controller by Ziegler–Nichols',
        text: T`The plant $G(s) = \dfrac{${K0}}{(${t1}s + 1)(${t2}s + 1)(${t3}s + 1)}$ is under proportional control $K$ in unity feedback. Use the Routh criterion to find the ultimate gain $K_u$ at which the loop oscillates, and the period $P_u$ of that oscillation. Then give the classic Ziegler–Nichols PID settings $K_p = 0.6K_u$, $T_i = P_u/2$, $T_d = P_u/8$ for $C(s) = K_p\left(1 + \dfrac{1}{T_is} + T_ds\right)$.`,
        givens: [T`$G(s) = \dfrac{${K0}}{(${t1}s+1)(${t2}s+1)(${t3}s+1)}$`, 'Unity feedback, proportional gain K', 'Classic Ziegler–Nichols PID rule'],
        parts: [p(T`$K_u$`, Ku, ''), p(T`$P_u$`, Pu, 's'), p(T`$K_p$`, .6 * Ku, ''), p(T`$T_i$`, Pu / 2, 's'), p(T`$T_d$`, Pu / 8, 's')],
        hints: [T`Expand the denominator: $a_3s^3 + a_2s^2 + a_1s + 1$ with $a_3 = \tau_1\tau_2\tau_3$, $a_2 = \tau_1\tau_2 + \tau_1\tau_3 + \tau_2\tau_3$, $a_1 = \tau_1 + \tau_2 + \tau_3$.`, T`Characteristic equation: $a_3s^3 + a_2s^2 + a_1s + (1 + KK_0) = 0$. The $s^1$ row of the Routh table vanishes when $a_2a_1 = a_3(1 + KK_0)$.`, T`At that gain the auxiliary equation $a_2s^2 + (1 + K_uK_0) = 0$ gives $\omega_u = \sqrt{a_1/a_3}$.`],
        steps: [T`$a_3 = ${tf(a3)}$, $a_2 = ${tf(a2)}$, $a_1 = ${tf(a1)}$.`, T`$K_u = \dfrac{a_1a_2/a_3 - 1}{K_0} = ${tf(Ku)}$.`, T`$\omega_u = \sqrt{a_1/a_3} = ${tf(wu)}\,\text{rad/s}$, so $P_u = ${tf(Pu)}\,\text{s}$.`, T`$K_p = ${tf(.6 * Ku)}$, $T_i = ${tf(Pu / 2)}\,\text{s}$, $T_d = ${tf(Pu / 8)}\,\text{s}$.`],
        idea: 'Ziegler–Nichols tuning only needs the edge of stability: the ultimate gain and period summarise the plant well enough for a first PID setting.',
        diagram: hardFeedbackDiagram('K (then PID)', 'K₀/[(τ₁s+1)(τ₂s+1)(τ₃s+1)]'), prerequisites: 'Routh–Hurwitz criterion; PID control.',
        verify: () => { // the frequency where the phase reaches −180°, by bisection, and the gain there
            const ph = w => -(Math.atan(w * t1) + Math.atan(w * t2) + Math.atan(w * t3)) * 180 / Math.PI, w = NUM.bisect(x => ph(x) + 180, 1e-6, 1e3, 200);
            const mag = K0 / Math.sqrt((1 + (w * t1) ** 2) * (1 + (w * t2) ** 2) * (1 + (w * t3) ** 2)), P = 2 * Math.PI / w;
            return [1 / mag, P, .6 / mag, P / 2, P / 8];
        }
    });
}

/* Level 2: the root locus of K/[s(s+a)(s+b)]: asymptotes, breakaway and the imaginary-axis crossing. */
function controlRootLocus(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'root-locus', date, CONTROL_READING), p = part;
    const [[a, b]] = grid(product(steps(.5, 6, .25), [...steps(2, 20, 1), 25, 30]).filter(([a, b]) => b >= a + 1));
    const cen = -(a + b) / 3, sb = (-(a + b) + Math.sqrt((a + b) ** 2 - 3 * a * b)) / 3, Kb = -sb * (sb + a) * (sb + b), wx = Math.sqrt(a * b), Kx = (a + b) * a * b;
    const diagram = drawing(wire('M60 140H680M560 30V250') + dt(670, 164, 'σ') + dt(578, 40, 'jω') + [[560, '0'], [450, '−a'], [190, '−b']].map(([x, t]) => wire(`M${x - 8} 132l16 16m0 -16l-16 16`) + dt(x, 172, t)).join('') +
        wire('M560 140L450 140') + guide('M500 140L620 36M500 140L620 244') + dt(500, 196, 'centroid') + wire('M60 140H190') + dot(520, 140) + dt(522, 118, 'breakaway') + dot(560, 66) + note(572, 70, 'jω crossing'), 'Root-locus sketch: open-loop poles at 0, −a and −b on the real axis, the breakaway point between 0 and −a, asymptotes at ±60° from the centroid, and the crossing of the imaginary axis', 262);
    return q({
        title: 'Sketch a root locus by its landmarks',
        text: T`Sketch the root locus of $1 + K\dfrac{1}{s(s + ${a})(s + ${b})} = 0$ for $K > 0$. Find the centroid of the asymptotes, the breakaway point on the real axis between $0$ and $-${a}$, and the gain at which the branches break away. Find where the locus crosses the imaginary axis and the gain at that crossing, which is the largest gain for stability.`,
        givens: [T`Open-loop poles at $0$, $-${a}$, $-${b}$; no zeros`, 'K > 0, negative feedback'],
        parts: [p('Centroid of the asymptotes', cen, ''), p('Breakaway point', sb, ''), p('Gain at breakaway', Kb, ''), p('Crossing frequency', wx, 'rad/s'), p('Gain at the crossing', Kx, '')],
        hints: [T`Three poles and no zeros: asymptotes at $\pm60^\circ$ and $180^\circ$ from $\sigma = \dfrac{\sum\text{poles}}{3}$.`, T`On the real axis $K(\sigma) = -\sigma(\sigma + a)(\sigma + b)$; breakaway is where $dK/d\sigma = 0$, i.e. $3\sigma^2 + 2(a + b)\sigma + ab = 0$.`, T`Put $s = j\omega$ into $s^3 + (a + b)s^2 + abs + K = 0$: the imaginary part gives $\omega$, the real part $K$.`],
        steps: [T`$\sigma = -\dfrac{${a} + ${b}}{3} = ${tf(cen)}$.`, T`$3\sigma^2 + ${tf(2 * (a + b))}\sigma + ${tf(a * b)} = 0$ gives $\sigma = ${tf(sb)}$ (the root between $0$ and $-${a}$), where $K = ${tf(Kb)}$.`, T`$\omega(ab - \omega^2) = 0$: $\omega = \sqrt{ab} = ${tf(wx)}\,\text{rad/s}$, and $K = (a + b)ab = ${tf(Kx)}$.`],
        idea: 'A handful of landmarks — asymptotes, breakaway and axis crossings — fixes the whole shape of a root locus and its stability limit.',
        diagram, prerequisites: 'Root locus rules; polynomials; complex substitution.',
        verify: () => { // golden-section search for the real-axis maximum of K(σ); bisection on the phase for the crossing
            const Kof = s => -s * (s + a) * (s + b), gr = (Math.sqrt(5) - 1) / 2; let lo = -a, hi = 0;
            for (let i = 0; i < 200; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (Kof(c) > Kof(d)) hi = d; else lo = c; }
            const s = (lo + hi) / 2, ph = w => -90 - Math.atan(w / a) * 180 / Math.PI - Math.atan(w / b) * 180 / Math.PI, w = NUM.bisect(x => ph(x) + 180, 1e-6, 1e4, 200);
            return [(0 - a - b) / 3, s, Kof(s), w, w * Math.hypot(w, a) * Math.hypot(w, b)];
        }
    });
}

/* Level 3: state feedback and a state observer for a two-state plant, by coefficient matching. */
function controlPolePlacement(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pole-placement', date, CONTROL_READING), p = part;
    const [pa, qa, g, z, wn, mult] = grid([0, 1, 2], [1, 2, 5], [1, 2, 5, 10], [.5, .6, .707, .8], [2, 4, 5, 8, 10], [3, 4, 5]);
    const k2 = (2 * z * wn - pa - qa) / g, k1 = (wn * wn - pa * (qa + g * k2)) / g, Nr = wn * wn / g, lam = mult * wn, l1 = 2 * lam - pa - qa, l2 = lam * lam - qa * (pa + l1), Mp = 100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z));
    const diagram = drawing(arrow(40, 100, 110, 100) + dt(70, 84, 'r') + wire('M110 80h40v40h-40z') + dt(130, 106, 'N') + arrow(150, 100, 200, 100) + ring(215, 100, 15) + dt(215, 106, '+') + arrow(230, 100, 290, 100) + dt(262, 84, 'u') +
        wire('M290 70h200v60H290z') + dt(390, 106, 'ẋ = Ax + Bu') + arrow(490, 100, 660, 100) + dt(640, 84, 'y = x₁') + wire('M560 100V200H430M290 200H215V115') + wire('M290 180h140v40H290z') + dt(360, 206, 'K (from x̂)') +
        dt(560, 236, 'observer x̂ from y and u'), 'State-feedback loop: the reference r is scaled by N, the plant is driven by u = N r − K x̂, and an observer reconstructs the state from y and u', 250);
    return q({
        title: 'Place the poles, then build the observer',
        text: T`The plant $\dot x_1 = -${pa}x_1 + x_2$, $\dot x_2 = -${qa}x_2 + ${g}u$ has output $y = x_1$. With $u = -Kx + Nr$, choose $K = [k_1\ k_2]$ so that the closed loop has $\zeta = ${z}$ and $\omega_n = ${wn}\,\text{rad/s}$, and $N$ so that $y$ follows a constant $r$ with zero error. Then design a full-order observer $\dot{\hat x} = A\hat x + Bu + L(y - \hat x_1)$ with both poles at $s = -${lam}$. Find $k_1$, $k_2$, $N$, $l_1$, $l_2$, and the percentage overshoot of $y$ for a step in $r$ (with the observer converged).`,
        givens: [T`$A = \begin{pmatrix}-${pa} & 1\\ 0 & -${qa}\end{pmatrix}$, $B = \begin{pmatrix}0\\ ${g}\end{pmatrix}$, $C = \begin{pmatrix}1 & 0\end{pmatrix}$`, T`Controller: $\zeta = ${z}$, $\omega_n = ${wn}\,\text{rad/s}$`, T`Observer poles: $-${lam}$ (double)`],
        parts: [p(T`$k_1$`, k1, '', .01, .001), p(T`$k_2$`, k2, '', .01, .001), p(T`$N$`, Nr, ''), p(T`$l_1$`, l1, '', .01, .001), p(T`$l_2$`, l2, '', .01, .001), p('Overshoot', Mp, '%')],
        hints: [T`$\det(sI - A + BK) = s^2 + (${pa} + ${qa} + ${g}k_2)s + ${pa}(${qa} + ${g}k_2) + ${g}k_1$; match it to $s^2 + 2\zeta\omega_ns + \omega_n^2$.`, T`At steady state $\dot x = 0$: $x_2 = ${pa}x_1$ and $${g}Nr = (${g}k_1 + (${qa} + ${g}k_2)${pa})x_1$, so $N = \omega_n^2/${g}$.`, T`$\det(sI - A + LC) = s^2 + (${pa} + ${qa} + l_1)s + ${qa}(${pa} + l_1) + l_2$; match it to $(s + ${lam})^2$. The reference-to-output transfer function has no zero, so the overshoot follows from $\zeta$ alone.`],
        steps: [T`$k_2 = \dfrac{2\zeta\omega_n - ${pa} - ${qa}}{${g}} = ${tf(k2)}$, $k_1 = \dfrac{\omega_n^2 - ${pa}(${qa} + ${g}k_2)}{${g}} = ${tf(k1)}$.`, T`$N = ${tf(Nr)}$.`, T`$l_1 = 2\times${lam} - ${pa} - ${qa} = ${tf(l1)}$, $l_2 = ${lam}^2 - ${qa}(${pa} + l_1) = ${tf(l2)}$.`, T`$M_p = e^{-\pi\zeta/\sqrt{1 - \zeta^2}} = ${tf(Mp)}\%$.`],
        idea: 'Controller and observer are designed separately (the separation principle); the observer is made several times faster so the controller sees an accurate state.',
        diagram, prerequisites: 'State-space models; characteristic polynomials; observers.',
        verify: () => { // Ackermann's formula for K and L; N from the closed-loop DC gain; overshoot by simulation
            const A = [[-pa, 1], [0, -qa]], B = [0, g], A2 = NUM.matMul(A, A), phi = (c1, c0) => [[A2[0][0] + c1 * A[0][0] + c0, A2[0][1] + c1 * A[0][1]], [A2[1][0] + c1 * A[1][0], A2[1][1] + c1 * A[1][1] + c0]];
            const AB = NUM.matVec(A, B), Wc = [[B[0], AB[0]], [B[1], AB[1]]], Pc = phi(2 * z * wn, wn * wn), e2 = NUM.solve([[Wc[0][0], Wc[1][0]], [Wc[0][1], Wc[1][1]]], [0, 1]); // e2ᵀ = [0 1]·Wc⁻¹
            const Kv = [e2[0] * Pc[0][0] + e2[1] * Pc[1][0], e2[0] * Pc[0][1] + e2[1] * Pc[1][1]];
            const Wo = [[1, 0], A[0]], Po = phi(2 * lam, lam * lam), col = NUM.solve(Wo, [0, 1]), Lv = NUM.matVec(Po, col);
            const Acl = [[A[0][0], A[0][1]], [A[1][0] - g * Kv[0], A[1][1] - g * Kv[1]]], xss = NUM.solve(Acl, [0, -g]), Nv = 1 / xss[0];
            let peak = 0; ctrlSim((t, x) => [Acl[0][0] * x[0] + Acl[0][1] * x[1], Acl[1][0] * x[0] + Acl[1][1] * x[1] + g * Nv], [0, 0], .02 / wn, 12 / (z * wn), (t, x) => { peak = Math.max(peak, x[0]); });
            return [Kv[0], Kv[1], Nv, Lv[0], Lv[1], 100 * (peak - 1)];
        }
    });
}

/* Level 3: proportional control of a sampled first-order plant (zero-order hold). */
function controlDigital(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'digital', date, CONTROL_READING), p = part;
    const [a, Ts, K0, frac] = grid([1, 2, 5, 10, 20], [.01, .02, .05, .1, .2], [.5, 1, 2, 5], [.2, .4, .6, .8]);
    const e = Math.exp(-a * Ts), b = K0 * (1 - e), Kmax = (1 + e) / b, Kc = Number((frac * Kmax).toPrecision(3)), zc = e - Kc * b, ess = 1 / (1 + Kc * K0), nset = Math.abs(zc) < 1e-12 ? 1 : Math.ceil(Math.log(.02) / Math.log(Math.abs(zc)) - 1e-9);
    return q({
        title: 'A sampled loop can go unstable where the continuous one cannot',
        text: T`A plant $G(s) = \dfrac{${K0}\cdot${a}}{s + ${a}}$ is driven through a zero-order hold and sampled every $T = ${Ts}\,\text{s}$; a digital proportional controller sets $u_k = K_c(r - y_k)$. Find the pulse transfer function $G(z) = \dfrac{b}{z - p}$ (give $p$ and $b$), and the largest $K_c$ for which the sampled loop is stable — the same loop in continuous time is stable for any gain. With $K_c = ${Kc}$, find the closed-loop pole, the steady-state error to a unit step, and the number of samples after which the error has decayed to 2% of its initial transient.`,
        givens: [T`$G(s) = \dfrac{${K0}\cdot${a}}{s+${a}}$ (DC gain $${K0}$)`, T`Zero-order hold, $T = ${Ts}\,\text{s}$`, T`$K_c = ${Kc}$`],
        parts: [p(T`Discrete pole $p$`, e, ''), p(T`$b$`, b, ''), p(T`Largest stable $K_c$`, Kmax, ''), p('Closed-loop pole', zc, '', .01, 1e-3), p('Steady-state error', ess, ''), p('Samples to settle to 2%', nset, 'samples', 0)],
        hints: [T`Over one sample with constant input, $y$ moves toward $K_0u$ by the factor $1 - e^{-aT}$: $p = e^{-aT}$ and $b = K_0(1 - e^{-aT})$.`, T`Closed loop: $y_{k+1} = (p - K_cb)y_k + K_cbr$. Stability needs $|p - K_cb| < 1$.`, T`The error transient shrinks by $|p - K_cb|$ each sample; a negative pole means it alternates in sign.`],
        steps: [T`$p = e^{-${a}\times${Ts}} = ${tf(e)}$, $b = ${tf(b)}$.`, T`$p - K_cb > -1$ gives $K_c < \dfrac{1 + p}{b} = ${tf(Kmax)}$.`, T`$z_{cl} = ${tf(e)} - ${Kc}\times${tf(b)} = ${tf(zc)}$; $e_{ss} = \dfrac{1}{1 + K_cK_0} = ${tf(ess)}$.`, T`$|z_{cl}|^n \le 0.02$ first at $n = ${nset}$.`],
        idea: 'Sampling adds delay; a gain that would be harmless in continuous time can drive a sampled loop’s pole past −1.',
        diagram: hardFeedbackDiagram('Kc · ZOH', 'K₀a/(s+a)'), prerequisites: 'Z-transforms; zero-order hold; discrete stability.',
        verify: () => { // the plant integrated within each sampling interval; the sampled loop simulated
            const step = (y, u) => ctrlSim((t, x) => [a * (K0 * u - x[0])], [y], Ts / 200, Ts)[0];
            const bb = step(0, 1), pp = step(1, 0), km = (1 + pp) / bb;
            let y = 0, ys = []; for (let k = 0; k < 400; k++) { ys.push(y); y = step(y, Kc * (1 - y)); }
            const yinf = Kc * K0 / (1 + Kc * K0), e0 = ys[0] - yinf, pole = (ys[2] - yinf) / (ys[1] - yinf);
            let n = 1; while (Math.abs(ys[n] - yinf) > .02 * Math.abs(e0) * (1 + 1e-9) && n < 399) n++;
            return [pp, bb, km, pole, 1 - yinf, n];
        }
    });
}

/* Level 3: phase margin, delay margin and gain margin of a loop with dead time. */
function controlDelayMargin(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'delay-margin', date, CONTROL_READING), p = part;
    const [K, tau, frac] = grid(steps(.5, 10, .5), [.1, .2, .5, 1, 2], [.1, .25, .5, .75]);
    const wc = Math.sqrt((-1 + Math.sqrt(1 + 4 * K * K * tau * tau)) / (2 * tau * tau)), PM0 = 90 - Math.atan(wc * tau) * 180 / Math.PI, DM = PM0 * Math.PI / 180 / wc;
    const th = Number((frac * DM).toPrecision(2)), PM = PM0 - wc * th * 180 / Math.PI, wp = NUM.bisect(w => 90 + Math.atan(w * tau) * 180 / Math.PI + w * th * 180 / Math.PI - 180, 1e-6, 1e4, 200), GM = 20 * Math.log10(wp * Math.hypot(1, wp * tau) / K);
    return q({
        title: 'How much dead time can the loop take?',
        text: T`The loop gain $L(s) = \dfrac{${K}\,e^{-s\theta}}{s(${tau}s + 1)}$ includes a dead time $\theta$. Without the delay, find the gain-crossover frequency and the phase margin. Find the delay margin (the dead time that would make the loop marginally stable). With $\theta = ${th}\,\text{s}$, find the phase margin and the gain margin in dB.`,
        givens: [T`$K = ${K}$, $\tau = ${tau}\,\text{s}$`, T`$\theta = ${th}\,\text{s}$`, 'Unity negative feedback'],
        parts: [p('Crossover frequency', wc, 'rad/s'), p('Phase margin without delay', PM0, '°'), p('Delay margin', DM, 's'), p(T`Phase margin with $\theta = ${th}\,\text{s}$`, PM, '°'), p(T`Gain margin with $\theta = ${th}\,\text{s}$`, GM, 'dB', .01, .02)],
        hints: [T`The delay does not change $|L|$: $\dfrac{K}{\omega\sqrt{1 + \omega^2\tau^2}} = 1$ is a quadratic in $\omega^2$.`, T`The delay subtracts $\omega\theta$ radians of phase. The delay margin is the phase margin (in radians) divided by $\omega_c$.`, T`With the delay, the phase reaches $-180^\circ$ where $90^\circ + \arctan(\omega\tau) + \omega\theta\cdot\tfrac{180^\circ}{\pi} = 180^\circ$; solve numerically, then $\text{GM} = 1/|L|$ there.`],
        steps: [T`$\omega_c^2 = \dfrac{-1 + \sqrt{1 + 4K^2\tau^2}}{2\tau^2}$: $\omega_c = ${tf(wc)}\,\text{rad/s}$; $\text{PM}_0 = 90^\circ - \arctan(\omega_c\tau) = ${tf(PM0)}^\circ$.`, T`Delay margin $= \dfrac{${tf(PM0)}^\circ\cdot\pi/180}{${tf(wc)}} = ${tf(DM)}\,\text{s}$.`, T`With $\theta = ${th}\,\text{s}$: $\text{PM} = ${tf(PM0)} - ${tf(wc * th * 180 / Math.PI)} = ${tf(PM)}^\circ$.`, T`Phase crossover at $${tf(wp)}\,\text{rad/s}$: $\text{GM} = ${tf(GM)}\,\text{dB}$.`],
        idea: 'Dead time leaves the gain alone but eats phase in proportion to frequency, so fast loops tolerate little delay.',
        diagram: hardFeedbackDiagram('K', 'e^(−sθ)/[s(τs+1)]'), prerequisites: 'Bode plots; phase and gain margins; time delay.',
        verify: () => { // bisection for the gain crossover; a logarithmic frequency scan with interpolation for the phase crossover
            const mag = w => K / (w * Math.hypot(1, w * tau)), w0 = NUM.bisect(w => mag(w) - 1, 1e-6, 1e4, 200), pm0 = 180 - 90 - Math.atan(w0 * tau) * 180 / Math.PI;
            const ph = w => -90 - Math.atan(w * tau) * 180 / Math.PI - w * th * 180 / Math.PI; let wl = 1e-4, wpx = NaN;
            for (let i = 1; i < 200000; i++) { const w2 = 1e-4 * 10 ** (i * 8 / 200000); if (ph(wl) > -180 && ph(w2) <= -180) { wpx = wl + (w2 - wl) * (ph(wl) + 180) / (ph(wl) - ph(w2)); break; } wl = w2; }
            return [w0, pm0, pm0 * Math.PI / 180 / w0, pm0 - w0 * th * 180 / Math.PI, -20 * Math.log10(mag(wpx))];
        }
    });
}

/* Level 4 (expert): margins and the peak sensitivity of a third-order loop. */
function controlSensitivity(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'sensitivity', date, CONTROL_READING), p = part;
    const [p1, p2, kf] = grid([.5, 1, 1.5, 2, 3, 4, 5], [6, 8, 10, 15, 20, 30, 50], [.05, .1, .15, .2, .25, .3, .4, .5]);
    const Kc = (p1 + p2) * p1 * p2, K = Number((kf * Kc).toPrecision(3)), GM = 20 * Math.log10(Kc / K), wp = Math.sqrt(p1 * p2);
    const L = w => cd(cx(K), cm(cm(cx(0, w), cx(p1, w)), cx(p2, w))), Sm = w => 1 / cabs(ca(cx(1), L(w)));
    const wc = NUM.bisect(w => cabs(L(w)) - 1, 1e-6, 1e4, 200), PM = 90 - (Math.atan(wc / p1) + Math.atan(wc / p2)) * 180 / Math.PI;
    let best = 1e-3; for (let i = 0; i <= 4000; i++) { const w = 1e-3 * 10 ** (i * 6 / 4000); if (Sm(w) > Sm(best)) best = w; }
    let lo = best / 1.01, hi = best * 1.01; const gr = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 100; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (Sm(c) > Sm(d)) hi = d; else lo = c; }
    const wMs = (lo + hi) / 2, Ms = Sm(wMs), GMb = 20 * Math.log10(Ms / (Ms - 1)), PMb = 2 * Math.asin(1 / (2 * Ms)) * 180 / Math.PI;
    return q({
        title: 'Margins and the sensitivity peak',
        text: T`The loop $L(s) = \dfrac{${K}}{s(s + ${p1})(s + ${p2})}$ is closed with unity negative feedback. Find the gain margin in dB and the phase margin. Then find the peak of the sensitivity $|S(j\omega)| = 1/|1 + L(j\omega)|$ and the frequency at which it occurs. Every loop with that peak $M_s$ is guaranteed at least $\text{GM} \ge \dfrac{M_s}{M_s - 1}$ and $\text{PM} \ge 2\arcsin\dfrac{1}{2M_s}$: give both guarantees, and compare them with the actual margins.`,
        givens: [T`$L(s) = \dfrac{${K}}{s(s+${p1})(s+${p2})}$`, 'Unity negative feedback'],
        parts: [p('Gain margin', GM, 'dB'), p('Phase margin', PM, '°'), p(T`Peak sensitivity $M_s$`, Ms, ''), p('Frequency of the peak', wMs, 'rad/s'), p('Guaranteed gain margin', GMb, 'dB'), p('Guaranteed phase margin', PMb, '°')],
        hints: [T`The phase reaches $-180^\circ$ at $\omega = \sqrt{${p1}\cdot${p2}}$, where $|L| = K/(\omega^2(${p1} + ${p2}))$; equivalently the Routh limit is $K_{\max} = (${p1} + ${p2})${p1}\cdot${p2}$.`, T`Find the gain crossover $|L| = 1$ numerically; $\text{PM} = 90^\circ - \arctan\tfrac{\omega_c}{${p1}} - \arctan\tfrac{\omega_c}{${p2}}$.`, T`$1/M_s$ is the closest distance from the Nyquist curve to $-1$; scan $|1 + L(j\omega)|$ over a logarithmic grid and refine the minimum.`],
        steps: [T`$K_{\max} = ${tf(Kc)}$, so $\text{GM} = 20\log_{10}(${tf(Kc)}/${K}) = ${tf(GM)}\,\text{dB}$ at $${tf(wp)}\,\text{rad/s}$.`, T`$\omega_c = ${tf(wc)}\,\text{rad/s}$ and $\text{PM} = ${tf(PM)}^\circ$.`, T`$M_s = ${tf(Ms)}$ at $${tf(wMs)}\,\text{rad/s}$.`, T`Guarantees: $\text{GM} \ge ${tf(GMb)}\,\text{dB}$ and $\text{PM} \ge ${tf(PMb)}^\circ$ — conservative next to the actual margins.`],
        idea: 'Gain and phase margins test two points of the Nyquist curve; the sensitivity peak measures its closest approach to −1 and bounds both margins at once.',
        diagram: hardFeedbackDiagram('', `${K}/[s(s+${p1})(s+${p2})]`), prerequisites: 'Nyquist and Bode analysis; sensitivity functions.',
        verify: () => { // dense scans of the frequency response with interpolation, no closed forms
            let wcx = NaN, wpx = NaN, ms = 0, wm = 0, prev = null;
            for (let i = 0; i <= 400000; i++) {
                const w = 1e-3 * 10 ** (i * 6 / 400000), l = L(w), m = cabs(l), ph = -90 - (Math.atan(w / p1) + Math.atan(w / p2)) * 180 / Math.PI, s = Sm(w);
                if (prev) { if (prev.m >= 1 && m < 1) wcx = prev.w + (w - prev.w) * (prev.m - 1) / (prev.m - m); if (prev.ph > -180 && ph <= -180) wpx = prev.w + (w - prev.w) * (prev.ph + 180) / (prev.ph - ph); }
                if (s > ms) { ms = s; wm = w; } prev = {w, m, ph};
            }
            const pm = 180 - 90 - (Math.atan(wcx / p1) + Math.atan(wcx / p2)) * 180 / Math.PI;
            return [-20 * Math.log10(cabs(L(wpx))), pm, ms, wm, 20 * Math.log10(ms / (ms - 1)), 2 * Math.asin(1 / (2 * ms)) * 180 / Math.PI];
        }
    });
}

/* Level 4 (mastery): minimum-energy control of a double integrator via the controllability Gramian. */
function controlMinEnergy(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'min-energy', date, CONTROL_READING), p = part;
    const [d, v0, Tf] = grid(steps(1, 10, 1), steps(-2, 2, .5), [1, 1.5, 2, 2.5, 3, 4, 5]);
    const r = [-d - v0 * Tf, -v0], W = [[Tf ** 3 / 3, Tf ** 2 / 2], [Tf ** 2 / 2, Tf]], [l1, l2] = NUM.solve(W, r), J = r[0] * l1 + r[1] * l2;
    const u = t => l1 * (Tf - t) + l2, u0 = u(0), uT = u(Tf), v = t => v0 + l1 * (Tf * t - t * t / 2) + l2 * t, ts = Math.abs(l1) > 1e-12 ? Tf + l2 / l1 : -1;
    const vmax = Math.max(Math.abs(v0), ...(ts > 0 && ts < Tf ? [Math.abs(v(ts))] : []));
    const diagram = curve('t (s)', 'u(t) (m/s²)', [0, Tf], [+(Math.min(0, u0, uT) - .5).toFixed(1), +(Math.max(0, u0, uT) + .5).toFixed(1)], u);
    return q({
        title: 'Move a mass with the least control energy',
        text: T`A cart obeys $\ddot x = u$ (acceleration commanded directly). It starts at $x(0) = ${d}\,\text{m}$ with velocity $\dot x(0) = ${v0}\,\text{m/s}$ and must be brought to rest at the origin at $t = ${Tf}\,\text{s}$ while minimising $J = \displaystyle\int_0^{${Tf}}u^2\,dt$. Using the controllability Gramian $W(T) = \displaystyle\int_0^T e^{A\tau}BB^\top e^{A^\top\tau}d\tau$, find the minimum $J$, the control at the start and at the end, the largest $|u|$, and the largest speed $|\dot x|$ during the move. (The optimal control is $u(t) = B^\top e^{A^\top(T - t)}W^{-1}\bigl(x_f - e^{AT}x_0\bigr)$.)`,
        givens: [T`$x(0) = ${d}\,\text{m}$, $\dot x(0) = ${v0}\,\text{m/s}$`, T`Target: $x = 0$, $\dot x = 0$ at $T = ${Tf}\,\text{s}$`, T`$A = \begin{pmatrix}0 & 1\\0 & 0\end{pmatrix}$, $B = \begin{pmatrix}0\\1\end{pmatrix}$`],
        parts: [p(T`Minimum $J$`, J, 'm²/s³'), p(T`$u(0)$`, u0, 'm/s²', .01, .001), p(T`$u(T)$`, uT, 'm/s²', .01, .001), p(T`Largest $|u|$`, Math.max(Math.abs(u0), Math.abs(uT)), 'm/s²'), p('Largest speed', vmax, 'm/s')],
        hints: [T`$e^{A\tau}B = \begin{pmatrix}\tau\\1\end{pmatrix}$, so $W(T) = \begin{pmatrix}T^3/3 & T^2/2\\ T^2/2 & T\end{pmatrix}$.`, T`$x_f - e^{AT}x_0 = \begin{pmatrix}-x_0 - v_0T\\ -v_0\end{pmatrix}$. With $\lambda = W^{-1}(x_f - e^{AT}x_0)$, $u(t) = \lambda_1(T - t) + \lambda_2$ is a straight line and $J = (x_f - e^{AT}x_0)^\top\lambda$.`, T`The speed is extreme where $u = 0$ (if that happens inside the interval) or at the ends.`],
        steps: [T`$x_f - e^{AT}x_0 = (${tf(r[0])},\ ${tf(r[1])})$ and $\lambda = W^{-1}(\cdot) = (${tf(l1)},\ ${tf(l2)})$.`, T`$J = ${tf(J)}\,\text{m}^2/\text{s}^3$.`, T`$u(0) = \lambda_1T + \lambda_2 = ${tf(u0)}$, $u(T) = \lambda_2 = ${tf(uT)}\,\text{m/s}^2$.`, T`${ts > 0 && ts < Tf ? T`$u = 0$ at $t = ${tf(ts)}\,\text{s}$, where $|\dot x| = ${tf(Math.abs(v(ts)))}\,\text{m/s}$; ` : ''}the largest speed is $${tf(vmax)}\,\text{m/s}$.`],
        idea: 'For a linear system the cheapest control between two states comes straight from the controllability Gramian; for a double integrator it is a ramp in acceleration.',
        diagram, prerequisites: 'State-space models; matrix exponentials; least-norm solutions.',
        verify: () => { // discretise u into 4000 constant pieces and take the least-norm solution of the two endpoint constraints
            const M = 4000, dtt = Tf / M, cols = Array.from({length: M}, (_, i) => { const tm = (i + .5) * dtt; return [(Tf - tm) * dtt, dtt]; });
            const G = [[0, 0], [0, 0]]; cols.forEach(c => { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) G[a][b] += c[a] * c[b]; });
            const y = NUM.solve(G, r), us = cols.map(c => c[0] * y[0] + c[1] * y[1]); // least norm of Σu²Δt subject to Σcᵢuᵢ = r
            let vv = v0, vm = Math.abs(v0); us.forEach(x => { vv += x * dtt; vm = Math.max(vm, Math.abs(vv)); });
            return [us.reduce((s, x) => s + x * x * dtt, 0), us[0] + (us[0] - us[1]) / 2, us[M - 1] - (us[M - 2] - us[M - 1]) / 2, Math.max(...us.map(Math.abs)), vm];
        }
    });
}
