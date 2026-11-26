/* Motors & drives: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (simulation, shooting, Thévenin, projections). */
const MOTORS_READING = {title: 'Introduction to Electric Power Systems (MIT OpenCourseWare 6.061)', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/'};
addTypes('motors', 'university', motorsGearbox, motorsInductionSlip, motorsStepper);
addTypes('motors', 'challenge', motorsPWMRipple, motorsThermal, motorsSpeedLoop);
addTypes('motors', 'expert', motorsInductionCircuit);
addTypes('motors', 'mastery', motorsSVPWM);

const rpmToRad = n => n * 2 * Math.PI / 60;
/* One period of a first-order system simulated twice gives the affine period map x → A·x + B; its fixed point is the
   periodic steady state. Returns that start value. */
function motPeriodic(step, x0probe = [0, 1]) {
    const [y0, y1] = x0probe.map(x => step(x)), A = (y1 - y0) / (x0probe[1] - x0probe[0]), B = y0 - A * x0probe[0];
    return B / (1 - A);
}

/* Level 2: a motor driving an inertia through a gearbox. */
function motorsGearbox(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'gearbox', date, MOTORS_READING), p = part;
    const [[Ts, n0, Jmc, JL, TL, N]] = grid(product([.5, 1, 2, 5], [3000, 4000, 6000], [.5, 1, 2, 5], [.01, .02, .05, .1], [.5, 1, 2, 5], [5, 10, 20, 30]).filter(c => c[4] / c[5] < .6 * c[0]));
    const Jm = Jmc * 1e-4, Jr = JL / (N * N), Nopt = Math.sqrt(JL / Jm), aL = (Ts - TL / N) / (N * (Jm + Jr)), w0 = rpmToRad(n0), nL = n0 * (1 - TL / (N * Ts)) / N, tau = (Jm + Jr) * w0 / Ts;
    const diagram = drawing(wire('M60 100h140v80H60z') + dt(130, 146, 'motor') + wire('M200 140H260') + ring(290, 140, 30) + ring(370, 140, 70) + dt(290, 146, '1') + dt(370, 146, `${N}`) + wire('M440 140H520') + wire('M520 80h40v120h-40z') + dt(540, 230, 'load Jʟ') +
        dt(130, 80, `Tₛ ${Ts} N·m, n₀ ${n0} rpm`) + dt(330, 40, `gear ratio ${N}:1`) + dt(620, 146, `Tʟ ${TL} N·m`), 'A motor drives a load inertia through a reduction gearbox; the load also needs a friction torque', 250);
    return q({
        title: 'Choose the gear ratio for an inertia load',
        text: T`A motor has a linear torque–speed line from a stall torque of $${Ts}\,\text{N}\cdot\text{m}$ to a no-load speed of $${n0}\,\text{rpm}$, and rotor inertia $${Jmc}\,\text{kg}\cdot\text{cm}^2$. Through an ideal ${N}:1 reduction it drives a load of inertia $${JL}\,\text{kg}\cdot\text{m}^2$ that also needs a constant $${TL}\,\text{N}\cdot\text{m}$ (at the load shaft). Find the load inertia reflected to the motor shaft, the gear ratio that would give the greatest initial acceleration of a pure inertia load, the initial load acceleration with the ${N}:1 gearbox, the final load speed, and the mechanical time constant of the speed rise.`,
        givens: [T`Motor: $T_s = ${Ts}\,\text{N}\cdot\text{m}$, $n_0 = ${n0}\,\text{rpm}$, $J_m = ${Jmc}\,\text{kg}\cdot\text{cm}^2$`, T`Load: $J_L = ${JL}\,\text{kg}\cdot\text{m}^2$, $T_L = ${TL}\,\text{N}\cdot\text{m}$`, T`Gear ratio $${N}:1$`],
        parts: [p('Reflected load inertia', Jr * 1e4, 'kg·cm²'), p('Optimal gear ratio', Nopt, ''), p('Initial load acceleration', aL, 'rad/s²'), p('Final load speed', nL, 'rpm'), p('Mechanical time constant', tau * 1e3, 'ms')],
        hints: [T`Through an $N:1$ reduction, load inertia appears as $J_L/N^2$ and load torque as $T_L/N$ at the motor.`, T`For a pure inertia, $\alpha_L = \dfrac{T_s}{NJ_m + J_L/N}$, largest when $NJ_m = J_L/N$, i.e. $N = \sqrt{J_L/J_m}$.`, T`With a linear torque–speed line the speed rises exponentially with $\tau = J_{\text{tot}}\omega_0/T_s$; it settles where motor torque equals $T_L/N$.`],
        steps: [T`$J_L/N^2 = ${tf(Jr * 1e4)}\,\text{kg}\cdot\text{cm}^2$; optimal $N = \sqrt{J_L/J_m} = ${tf(Nopt)}$.`, T`$\alpha_m = \dfrac{${Ts} - ${TL}/${N}}{${tf(Jm + Jr)}} = ${tf(aL * N)}\,\text{rad/s}^2$, so $\alpha_L = ${tf(aL)}\,\text{rad/s}^2$.`, T`Final motor speed $n_0(1 - T_L/(NT_s)) = ${tf(nL * N)}\,\text{rpm}$, load $${tf(nL)}\,\text{rpm}$.`, T`$\tau = ${tf(Jm + Jr)}\times${tf(w0)}/${Ts} = ${tf(tau * 1e3)}\,\text{ms}$.`],
        idea: 'A gearbox trades speed for torque and divides the load inertia by N²; matching reflected inertia to the rotor gives the fastest start.',
        diagram, prerequisites: 'Rotational dynamics; gear ratios; first-order systems.',
        verify: () => { // simulate the start from rest; the optimal ratio by golden-section search
            const J = Jm + Jr, acc = w => (Ts * (1 - w / w0) - TL / N) / J, wf = ctrlSim((t, x) => [acc(x[0])], [0], tau / 400, 30 * tau)[0];
            let t63 = NaN; ctrlSim((t, x) => [acc(x[0])], [0], tau / 4000, 2 * tau, (t, x) => { if (Number.isNaN(t63) && x[0] >= (1 - Math.exp(-1)) * wf) t63 = t; });
            const gr = (Math.sqrt(5) - 1) / 2, f = n => Ts / (n * Jm + JL / n); let lo = .1, hi = 1000; for (let i = 0; i < 200; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (f(c) > f(d)) hi = d; else lo = c; }
            return [JL / N / N * 1e4, (lo + hi) / 2, acc(0) / N, wf / N * 60 / (2 * Math.PI), t63 * 1e3];
        }
    });
}

/* Level 2: slip and torque of an induction motor from a simplified equivalent circuit. */
function motorsInductionSlip(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'induction-slip', date, MOTORS_READING), p = part;
    const [VLL, f, poles, R2, X, s] = grid([400, 415, 480], [50, 60], [2, 4, 6], [.2, .3, .5, .8], [1, 1.5, 2, 3], [.02, .03, .04, .05]);
    const ns = 120 * f / poles, n = Math.round(ns * (1 - s)), Vph = VLL / Math.sqrt(3), ws = rpmToRad(ns), Tq = sl => 3 * Vph * Vph * (R2 / sl) / (ws * ((R2 / sl) ** 2 + X * X)), Tmax = 3 * Vph * Vph / (2 * ws * X), smax = R2 / X;
    const diagram = curve('speed (rpm)', 'torque (N·m)', [0, ns], [0, +(1.15 * Tmax).toPrecision(2)], nn => Tq(Math.max(1e-6, 1 - nn / ns)));
    return q({
        title: 'Slip and torque of an induction motor',
        text: T`A ${poles}-pole, $${VLL}\,\text{V}$ (line), $${f}\,\text{Hz}$ star-connected induction motor runs at $${n}\,\text{rpm}$. Use the simplified per-phase circuit (stator resistance and magnetising branch neglected) with rotor resistance $R_2' = ${R2}\,\Omega$ and total leakage reactance $X = ${X}\,\Omega$, so $T = \dfrac{3V_\phi^2}{\omega_s}\cdot\dfrac{R_2'/s}{(R_2'/s)^2 + X^2}$. Find the synchronous speed, the slip, the rotor current frequency, the torque at this speed, the maximum (breakdown) torque, and the starting torque.`,
        givens: [T`${poles} poles, $${VLL}\,\text{V}$, $${f}\,\text{Hz}$, star`, T`$R_2' = ${R2}\,\Omega$, $X = ${X}\,\Omega$`, T`Speed $${n}\,\text{rpm}$`],
        parts: [p('Synchronous speed', ns, 'rpm'), p('Slip', 100 * s, '%'), p('Rotor frequency', s * f, 'Hz'), p('Torque at this speed', Tq(s), 'N·m'), p('Maximum torque', Tmax, 'N·m'), p('Starting torque', Tq(1), 'N·m')],
        hints: [T`$n_s = 120f/p$ and $s = (n_s - n)/n_s$; the rotor currents run at $sf$.`, T`$V_\phi = V_{LL}/\sqrt3$ and $\omega_s = 2\pi n_s/60$ in rad/s.`, T`The torque peaks at $s_{\max} = R_2'/X$, where $T_{\max} = \dfrac{3V_\phi^2}{2\omega_sX}$ (independent of $R_2'$). Starting means $s = 1$.`],
        steps: [T`$n_s = ${ns}\,\text{rpm}$, $s = ${tf(s)}$, rotor frequency $${tf(s * f)}\,\text{Hz}$.`, T`$V_\phi = ${tf(Vph)}\,\text{V}$, $\omega_s = ${tf(ws)}\,\text{rad/s}$, $R_2'/s = ${tf(R2 / s)}\,\Omega$: $T = ${tf(Tq(s))}\,\text{N}\cdot\text{m}$.`, T`$s_{\max} = ${tf(smax)}$, $T_{\max} = ${tf(Tmax)}\,\text{N}\cdot\text{m}$; $T_{\text{start}} = ${tf(Tq(1))}\,\text{N}\cdot\text{m}$.`],
        idea: 'An induction motor runs just below synchronous speed; the slip sets the rotor current, and the breakdown torque depends only on leakage reactance.',
        diagram, prerequisites: 'Induction machines; per-phase circuits; AC power.',
        verify: () => { // the rotor current as a phasor, air-gap power over ω_s; the breakdown torque by golden-section search over slip
            const T2 = sl => { const i = cd(cx(Vph), cx(R2 / sl, X)); return 3 * cabs(i) ** 2 * R2 / sl / ws; }, gr = (Math.sqrt(5) - 1) / 2;
            let lo = 1e-4, hi = 1; for (let i = 0; i < 200; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (T2(c) > T2(d)) hi = d; else lo = c; }
            return [120 * f / poles, 100 * (1 - n / (120 * f / poles)), (1 - n / (120 * f / poles)) * f, T2(1 - n / ns), T2((lo + hi) / 2), T2(1)];
        }
    });
}

/* Level 2: a stepper motor and lead screw: resolution, step rate and a trapezoidal move. */
function motorsStepper(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'stepper', date, MOTORS_READING), p = part;
    const [spr, m, pitch, D, vmax, acc] = grid([200, 400], [1, 2, 4, 8, 16], [2, 4, 5, 8, 10], [10, 25, 50, 100, 200], [2, 5, 10], [20, 50, 100]);
    const res = pitch * 1000 / (spr * m), nsteps = Math.round(D / pitch * spr * m), d = D / pitch, tri = d < vmax * vmax / acc - 1e-9 ? 1 : 0, vpk = tri ? Math.sqrt(d * acc) : vmax, tm = tri ? 2 * Math.sqrt(d / acc) : d / vmax + vmax / acc, fpk = vpk * spr * m / 1000;
    const tt = tm, diagram = curve('t (s)', 'speed (rev/s)', [0, +tt.toPrecision(3)], [0, vmax], t => Math.min(acc * t, vpk, acc * (tt - t)));
    return q({
        title: 'Move a lead screw with a stepper motor',
        text: T`A ${spr}-step/rev stepper motor with ${m === 1 ? 'full-step drive' : T`${m}× microstepping`} turns a lead screw of $${pitch}\,\text{mm}$ pitch. Find the linear resolution per (micro)step and the number of (micro)steps for a $${D}\,\text{mm}$ move. The move uses a trapezoidal speed profile with acceleration and deceleration $${acc}\,\text{rev/s}^2$ and a speed limit of $${vmax}\,\text{rev/s}$. Find the move time, whether the profile is triangular (the speed limit never reached: enter 1 for yes, 0 for no), and the peak step rate.`,
        givens: [T`${spr} steps/rev, ${m}× microstepping`, T`Pitch $${pitch}\,\text{mm/rev}$; move $${D}\,\text{mm}$`, T`$a = ${acc}\,\text{rev/s}^2$, $v_{\max} = ${vmax}\,\text{rev/s}$`],
        parts: [p('Resolution', res, 'µm'), p('Steps for the move', nsteps, 'steps', 0), p('Move time', tm, 's'), p('Triangular profile? (1/0)', tri, '', 0), p('Peak step rate', fpk, 'kHz')],
        hints: [T`One revolution moves the nut one pitch and takes $${spr}\times${m}$ (micro)steps.`, T`Accelerating to $v_{\max}$ and back takes $v_{\max}^2/a$ revolutions; if the move is shorter, the profile is a triangle with peak $\sqrt{da}$.`, T`Trapezoid: $t = d/v_{\max} + v_{\max}/a$; triangle: $t = 2\sqrt{d/a}$. The step rate is speed times steps per revolution.`],
        steps: [T`Resolution $${pitch}/(${spr}\times${m}) = ${tf(res)}\,\mu\text{m}$; the move is $${tf(d)}$ rev $= ${nsteps}$ steps.`, T`$v_{\max}^2/a = ${tf(vmax * vmax / acc)}$ rev ${tri ? '>' : '≤'} $${tf(d)}$ rev, so the profile is ${tri ? 'triangular' : 'trapezoidal'}${tri ? T` with peak $${tf(vpk)}\,\text{rev/s}$` : ''}.`, T`Move time $${tf(tm)}\,\text{s}$; peak step rate $${tf(fpk)}\,\text{kHz}$.`],
        idea: 'Microstepping refines position, but the time of a move is set by acceleration and speed limits, not by resolution.',
        diagram, prerequisites: 'Kinematics with constant acceleration; unit conversion.',
        verify: () => { // invert distance-versus-time of a symmetric profile (accelerate, cruise if allowed, brake) by bisection
            const dist = T => T >= 2 * vmax / acc ? vmax * (T - vmax / acc) : acc * T * T / 4, t = NUM.bisect(T => dist(T) - d, 0, 1e4, 200), top = Math.min(vmax, acc * t / 2);
            return [pitch * 1000 / (spr * m), D * spr * m / pitch, t, top < vmax * (1 - 1e-9) ? 1 : 0, top * spr * m / 1000];
        }
    });
}

/* Level 3: PWM current ripple in a DC motor driven by an H-bridge (unipolar switching with freewheeling). */
function motorsPWMRipple(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pwm-ripple', date, MOTORS_READING), p = part;
    const solve = ([Vdc, R, Lm, k, fk, n, Tl]) => {
        const L = Lm * 1e-3, E = k * rpmToRad(n), I = Tl / k, D = (E + I * R) / Vdc, Tp = 1 / (fk * 1e3), tau = L / R, a = (Vdc - E) / R, b = -E / R, e1 = Math.exp(-D * Tp / tau), e2 = Math.exp(-(1 - D) * Tp / tau);
        const imax = (a * (1 - e1) + b * e1 * (1 - e2)) / (1 - e1 * e2), imin = b + (imax - b) * e2; return {L, E, I, D, Tp, tau, a, b, imax, imin};
    };
    const [c] = grid(product([12, 24, 48], [.2, .5, 1], [.1, .2, .5, 1], [.02, .04, .06, .1], [10, 20, 40], [500, 1000, 2000], [.05, .1, .2, .5]).filter(cc => { const r = solve(cc); return r.D > .1 && r.D < .95 && r.imin > 0; }));
    const [Vdc, R, Lm, k, fk, n, Tl] = c, {L, E, I, D, Tp, tau, a, b, imax, imin} = solve(c), dI = imax - imin, approx = Vdc * D * (1 - D) / (L * fk * 1e3);
    const iw = t => { const u = t % Tp; return u < D * Tp ? a + (imin - a) * Math.exp(-u / tau) : b + (imax - b) * Math.exp(-(u - D * Tp) / tau); };
    const diagram = curve('t (µs)', 'i (A)', [0, +(3 * Tp * 1e6).toPrecision(3)], [+(Math.max(0, imin - .3 * dI)).toPrecision(3), +(imax + .3 * dI).toPrecision(3)], t => iw(t * 1e-6));
    return q({
        title: 'Current ripple in a PWM-driven motor',
        text: T`A DC motor ($R = ${R}\,\Omega$, $L = ${Lm}\,\text{mH}$, $k = ${k}\,\text{V}\cdot\text{s/rad}$) is driven from $${Vdc}\,\text{V}$ by an H-bridge switching at $${fk}\,\text{kHz}$: during the on-time the armature sees $V_{dc}$, during the off-time it freewheels at $0\,\text{V}$. It must run at $${n}\,\text{rpm}$ against $${Tl}\,\text{N}\cdot\text{m}$. Find the duty cycle, the back-EMF, and, from the exact exponential waveforms in periodic steady state, the peak-to-peak current ripple, the peak current and the torque ripple. (Compare the ripple with the small-ripple estimate $V_{dc}D(1 - D)/(Lf)$.)`,
        givens: [T`$R = ${R}\,\Omega$, $L = ${Lm}\,\text{mH}$, $k = ${k}\,\text{V}\cdot\text{s/rad}$`, T`$V_{dc} = ${Vdc}\,\text{V}$, $f = ${fk}\,\text{kHz}$`, T`$${n}\,\text{rpm}$ at $${Tl}\,\text{N}\cdot\text{m}$`],
        parts: [p('Duty cycle', 100 * D, '%'), p('Back-EMF', E, 'V'), p('Peak-to-peak ripple', dI, 'A'), p('Peak current', imax, 'A'), p('Torque ripple', k * dI * 1e3, 'mN·m')],
        hints: [T`The average armature voltage is $DV_{dc}$, and on average $DV_{dc} = E + IR$ with $E = k\omega$ and $I = T/k$.`, T`On: $i \to a = (V_{dc} - E)/R$ with $\tau = L/R$; off: $i \to b = -E/R$. In steady state the current returns to its starting value each period.`, T`$i_{\max} = a + (i_{\min} - a)e^{-DT/\tau}$ and $i_{\min} = b + (i_{\max} - b)e^{-(1-D)T/\tau}$: two linear equations.`],
        steps: [T`$E = ${k}\times${tf(rpmToRad(n))} = ${tf(E)}\,\text{V}$, $I = ${tf(I)}\,\text{A}$, $D = \dfrac{E + IR}{V_{dc}} = ${tf(D)}$.`, T`$\tau = ${tf(tau * 1e6)}\,\mu\text{s}$, $a = ${tf(a)}\,\text{A}$, $b = ${tf(b)}\,\text{A}$.`, T`$i_{\max} = ${tf(imax)}\,\text{A}$, $i_{\min} = ${tf(imin)}\,\text{A}$: ripple $${tf(dI)}\,\text{A}$ (estimate $${tf(approx)}\,\text{A}$).`, T`Torque ripple $k\Delta I = ${tf(k * dI * 1e3)}\,\text{mN}\cdot\text{m}$.`],
        idea: 'The armature inductance filters the PWM voltage into a nearly steady current; the ripple falls with switching frequency and is largest at 50% duty.',
        diagram, prerequisites: 'RL transients; PWM; DC motors.',
        verify: () => { // simulate one switching period from two starting currents, take the periodic fixed point, then trace the last period
            // integrate the on- and off-intervals separately so no step straddles a switching instant
            const seg = (v, i, dur, track) => ctrlSim((t, x) => [(v - E - R * x[0]) / L], [i], dur / 2000, dur, track)[0];
            const per = i0 => seg(0, seg(Vdc, i0, D * Tp), (1 - D) * Tp), i0 = motPeriodic(per);
            let mx = i0, mn = i0; const tr = (t, x) => { mx = Math.max(mx, x[0]); mn = Math.min(mn, x[0]); }; seg(0, seg(Vdc, i0, D * Tp, tr), (1 - D) * Tp, tr);
            return [100 * (E + Tl / k * R) / Vdc, k * rpmToRad(n), mx - mn, mx, k * (mx - mn) * 1e3];
        }
    });
}

/* Level 3: intermittent (S3) duty: the periodic temperature of a motor winding. */
function motorsThermal(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'thermal', date, MOTORS_READING), p = part;
    const [Rth, tau, P, ton, toff, kf] = grid([.2, .3, .5, .8], [10, 20, 30, 45, 60], [100, 200, 300, 500], [2, 5, 10, 15], [5, 10, 20, 30], [1.2, 1.5, 2]);
    const Tc = ton + toff, Pon = kf * kf * P, th1 = Pon * Rth * (1 - Math.exp(-ton / tau)), thmax = th1 / (1 - Math.exp(-Tc / tau)), thmin = thmax * Math.exp(-toff / tau), kal = Math.sqrt((1 - Math.exp(-Tc / tau)) / (1 - Math.exp(-ton / tau)));
    const thAt = t => { let th = 0, u = 0; while (u + Tc <= t) { th = Pon * Rth + (th - Pon * Rth) * Math.exp(-ton / tau); th *= Math.exp(-toff / tau); u += Tc; } const r = t - u; return r < ton ? Pon * Rth + (th - Pon * Rth) * Math.exp(-r / tau) : (Pon * Rth + (th - Pon * Rth) * Math.exp(-ton / tau)) * Math.exp(-(r - ton) / tau); };
    const diagram = curve('t (min)', 'temperature rise (K)', [0, 6 * Tc], [0, +(1.15 * Math.max(thmax, P * Rth)).toPrecision(2)], thAt);
    return q({
        title: 'Overload a motor in intermittent duty',
        text: T`A motor winding has thermal resistance $${Rth}\,\text{K/W}$ to ambient and thermal time constant $${tau}\,\text{min}$; at rated current its losses are $${P}\,\text{W}$ (all copper loss, proportional to current squared). In an intermittent duty it runs at ${kf}× rated current for $${ton}\,\text{min}$, then stops for $${toff}\,\text{min}$, repeatedly. Find the steady temperature rise at rated current, the rise at the end of the first run from cold, the maximum and minimum rises once the cycle has settled, and the largest current (as a multiple of rated) that this cycle allows if the peak rise may not exceed the rated steady rise.`,
        givens: [T`$R_{th} = ${Rth}\,\text{K/W}$, $\tau = ${tau}\,\text{min}$, rated loss $${P}\,\text{W}$`, T`Duty: $${ton}\,\text{min}$ on at ${kf}× rated current, $${toff}\,\text{min}$ off`],
        parts: [p('Rated steady rise', P * Rth, 'K'), p('Rise after the first run', th1, 'K'), p('Settled maximum rise', thmax, 'K'), p('Settled minimum rise', thmin, 'K'), p('Allowed overload factor', kal, '×')],
        hints: [T`First-order heating: during a run $\theta \to P_{\text{on}}R_{th}$ with time constant $\tau$; stopped, $\theta$ decays to zero. $P_{\text{on}} = (${kf})^2\times${P}\,\text{W}$.`, T`In the settled cycle the temperature returns to $\theta_{\min}$ each period: $\theta_{\max} = P_{\text{on}}R_{th}\dfrac{1 - e^{-t_{\text{on}}/\tau}}{1 - e^{-(t_{\text{on}} + t_{\text{off}})/\tau}}$, $\theta_{\min} = \theta_{\max}e^{-t_{\text{off}}/\tau}$.`, T`Set $\theta_{\max} = PR_{th}$ with $P_{\text{on}} = k^2P$ and solve for $k$.`],
        steps: [T`Rated rise $${tf(P * Rth)}\,\text{K}$; $P_{\text{on}} = ${tf(Pon)}\,\text{W}$.`, T`First run: $${tf(Pon * Rth)}(1 - e^{-${ton}/${tau}}) = ${tf(th1)}\,\text{K}$.`, T`Settled: $\theta_{\max} = ${tf(thmax)}\,\text{K}$, $\theta_{\min} = ${tf(thmin)}\,\text{K}$.`, T`$k = \sqrt{\dfrac{1 - e^{-${Tc}/${tau}}}{1 - e^{-${ton}/${tau}}}} = ${tf(kal)}$.`],
        idea: 'A motor’s thermal mass lets it carry more than rated current for short runs; the allowed overload follows from the duty cycle and the thermal time constant.',
        diagram, prerequisites: 'First-order systems; exponentials.',
        verify: () => { // simulate the heating ODE over a cycle, find the periodic state by shooting, and bisect for the allowed factor
            const cyc = (kk, th0, track) => ctrlSim((t, x) => [((t < ton ? kk * kk * P : 0) * Rth - x[0]) / tau], [th0], Tc / 4000, Tc, track)[0];
            const settledMax = kk => { const th0 = motPeriodic(x => cyc(kk, x)); let mx = 0; cyc(kk, th0, (t, x) => { mx = Math.max(mx, x[0]); }); return [mx, th0]; };
            const first = ctrlSim((t, x) => [(Pon * Rth - x[0]) / tau], [0], ton / 4000, ton)[0], [mx, mn] = settledMax(kf);
            return [P * Rth, first, mx, mn, NUM.bisect(kk => settledMax(kk)[0] - P * Rth, .5, 10, 60)];
        }
    });
}

/* Level 3: a PI speed loop around a torque-controlled motor: gains, overshoot and the dip under a load step. */
function motorsSpeedLoop(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'speed-loop', date, MOTORS_READING), p = part;
    const [J, b, wn, z, dT] = grid([1e-4, 2e-4, 5e-4, 1e-3, 2e-3], [1e-5, 1e-4, 5e-4], [50, 100, 200, 400], [.5, .6, .7, .8], [.1, .2, .5, 1]);
    const Kp = 2 * z * wn * J - b, Ki = wn * wn * J, sg = z * wn, wd = wn * Math.sqrt(1 - z * z), B = (Kp / J - sg) / wd, y = t => 1 + Math.exp(-sg * t) * (-Math.cos(wd * t) + B * Math.sin(wd * t));
    let best = 0; for (let i = 1; i <= 4000; i++) { const t = i * (2 * Math.PI / wd) / 4000; if (y(t) > y(best)) best = t; }
    let lo = Math.max(0, best - 2 * Math.PI / wd / 4000), hi = best + 2 * Math.PI / wd / 4000; const gr = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 100; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (y(c) > y(d)) hi = d; else lo = c; }
    const Mp = 100 * (y((lo + hi) / 2) - 1), ts = Math.atan2(wd, sg) / wd, dip = dT / (J * wd) * Math.exp(-sg * ts) * Math.sin(wd * ts) * 60 / (2 * Math.PI);
    return q({
        title: 'Tune a PI speed loop and check its load response',
        text: T`A motor with a fast current loop behaves as a torque source driving inertia $J = ${tf(J)}\,\text{kg}\cdot\text{m}^2$ with viscous friction $b = ${tf(b)}\,\text{N}\cdot\text{m}\cdot\text{s/rad}$, so $\dfrac{\Omega}{T}(s) = \dfrac{1}{Js + b}$. A PI speed controller $T^\ast = K_p e + K_i\!\int\!e\,dt$ closes the loop. Choose $K_p$ and $K_i$ for closed-loop poles with $\omega_n = ${wn}\,\text{rad/s}$ and $\zeta = ${z}$. Because the PI zero appears in the reference response, find the actual overshoot to a speed step. Then find the largest speed dip after a sudden load torque of $${dT}\,\text{N}\cdot\text{m}$, and when it occurs.`,
        givens: [T`$J = ${tf(J)}\,\text{kg}\cdot\text{m}^2$, $b = ${tf(b)}\,\text{N}\cdot\text{m}\cdot\text{s/rad}$`, T`$\omega_n = ${wn}\,\text{rad/s}$, $\zeta = ${z}$`, T`Load step $${dT}\,\text{N}\cdot\text{m}$`],
        parts: [p(T`$K_p$`, Kp, 'N·m·s/rad'), p(T`$K_i$`, Ki, 'N·m/rad'), p('Overshoot to a speed step', Mp, '%'), p('Speed dip under the load step', dip, 'rpm'), p('Time of the dip', ts * 1e3, 'ms')],
        hints: [T`Closed loop: $Js^2 + (b + K_p)s + K_i = 0$. Match it to $J(s^2 + 2\zeta\omega_ns + \omega_n^2)$.`, T`$\dfrac{\Omega}{\Omega^\ast} = \dfrac{K_ps + K_i}{Js^2 + (b + K_p)s + K_i}$: the zero at $-K_i/K_p$ adds overshoot beyond $e^{-\pi\zeta/\sqrt{1-\zeta^2}}$. Its step response is $1 + e^{-\sigma t}(-\cos\omega_dt + B\sin\omega_dt)$ with $B = (K_p/J - \sigma)/\omega_d$.`, T`From load torque: $\dfrac{\Omega}{T_L} = \dfrac{-s}{Js^2 + (b + K_p)s + K_i}$, so a step gives $-\dfrac{\Delta T}{J\omega_d}e^{-\sigma t}\sin\omega_dt$, largest at $\tan\omega_dt = \omega_d/\sigma$.`],
        steps: [T`$K_p = 2\zeta\omega_nJ - b = ${tf(Kp)}$, $K_i = \omega_n^2J = ${tf(Ki)}$.`, T`$\sigma = ${tf(sg)}$, $\omega_d = ${tf(wd)}\,\text{rad/s}$, $B = ${tf(B)}$: the step response peaks at $${tf(100 * (y((lo + hi) / 2) - 1))}\%$ overshoot (the pole pair alone would give $${tf(100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)))}\%$).`, T`Dip at $t = ${tf(ts * 1e3)}\,\text{ms}$: $${tf(dip)}\,\text{rpm}$.`],
        idea: 'Integral action removes the steady-state speed error under load, but the PI zero makes the reference response overshoot more than the pole damping suggests.',
        diagram: hardFeedbackDiagram('Kp + Ki/s', '1/(Js + b)'), prerequisites: 'PI control; second-order systems; Laplace transforms.',
        verify: () => { // simulate the loop with states (ω, ∫e) for a reference step and for a load step
            const f = (r, TL) => (t, x) => { const e = r - x[0]; return [(Kp * e + Ki * x[1] - b * x[0] - TL) / J, e]; }, h = 1 / wn / 2000;
            let pk = 0; ctrlSim(f(1, 0), [0, 0], h, 12 / sg, (t, x) => { pk = Math.max(pk, x[0]); });
            let mn = 0, tm = 0; ctrlSim(f(0, dT), [0, 0], h, 12 / sg, (t, x) => { if (x[0] < mn) { mn = x[0]; tm = t; } });
            return [2 * z * wn * J - b, wn * wn * J, 100 * (pk - 1), -mn * 60 / (2 * Math.PI), tm * 1e3];
        }
    });
}

/* Level 4 (expert): the full per-phase equivalent circuit of an induction motor. */
function motorsInductionCircuit(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'induction-circuit', date, MOTORS_READING), p = part, VLL = 400, f = 50, poles = 4;
    const [R1, X1, Xm, R2, X2, s, Prot] = grid([.2, .3, .5], [.5, .8, 1.2], [15, 20, 30], [.15, .25, .4], [.5, .8, 1.2], [.02, .03, .04, .05], [200, 400, 600]);
    const Vph = VLL / Math.sqrt(3), Zr = cx(R2 / s, X2), Zpar = cd(cm(cx(0, Xm), Zr), ca(cx(0, Xm), Zr)), Z = ca(cx(R1, X1), Zpar), I1 = cd(cx(Vph), Z), pf = Math.cos(Math.atan2(Z.im, Z.re));
    const I2 = cd(cm(I1, cx(0, Xm)), ca(cx(0, Xm), Zr)), Pag = 3 * cabs(I2) ** 2 * R2 / s, Pmech = (1 - s) * Pag, Psh = Pmech - Prot, ws = rpmToRad(120 * f / poles), Tsh = Psh / ((1 - s) * ws), Pin = 3 * Vph * cabs(I1) * pf, eta = 100 * Psh / Pin;
    const diagram = drawing(ring(56, 80, 4) + ring(56, 210, 4) + wire('M60 80H100M60 210H600') + element('R', 100, 80, 220, 80, 'R₁') + element('L', 220, 80, 340, 80, 'jX₁') + wire('M340 80H400') + element('L', 400, 80, 400, 210, '') + note(412, 150, 'jXm') +
        wire('M400 80H440') + element('L', 440, 80, 560, 80, 'jX₂') + element('R', 600, 80, 600, 210, '') + wire('M560 80H600') + note(612, 150, 'R₂/s') + dot(400, 80) + dot(400, 210) + note(30, 150, 'Vφ'), 'Per-phase induction-motor equivalent circuit: stator resistance and reactance, a magnetising reactance shunt, rotor reactance and the slip-dependent rotor resistance R2 over s', 255);
    return q({
        title: 'An induction motor’s full equivalent circuit',
        text: T`A 4-pole, $400\,\text{V}$ (line), $50\,\text{Hz}$ star-connected induction motor has per-phase parameters $R_1 = ${R1}\,\Omega$, $X_1 = ${X1}\,\Omega$, $X_m = ${Xm}\,\Omega$, $R_2' = ${R2}\,\Omega$, $X_2' = ${X2}\,\Omega$ (core loss neglected) and rotational losses of $${Prot}\,\text{W}$. At a slip of $${s}$, find the stator current, the input power factor, the air-gap power, the shaft torque, and the efficiency.`,
        givens: [T`$R_1 = ${R1}$, $X_1 = ${X1}$, $X_m = ${Xm}\,\Omega$`, T`$R_2' = ${R2}$, $X_2' = ${X2}\,\Omega$`, T`$s = ${s}$, rotational loss $${Prot}\,\text{W}$`],
        parts: [p('Stator current', cabs(I1), 'A'), p('Power factor', pf, ''), p('Air-gap power', Pag / 1e3, 'kW'), p('Shaft torque', Tsh, 'N·m'), p('Efficiency', eta, '%')],
        hints: [T`$Z = R_1 + jX_1 + jX_m \parallel (R_2'/s + jX_2')$ and $I_1 = V_\phi/Z$; the power factor is $\cos\angle Z$.`, T`The rotor current divides from $I_1$: $I_2 = I_1\dfrac{jX_m}{jX_m + R_2'/s + jX_2'}$; air-gap power $P_{ag} = 3|I_2|^2R_2'/s$.`, T`$P_{\text{mech}} = (1 - s)P_{ag}$; subtract rotational losses for the shaft. Torque = shaft power / rotor speed; efficiency = shaft power / input power.`],
        steps: [T`$Z = ${tc(Z)}\,\Omega$, $|I_1| = ${tf(cabs(I1))}\,\text{A}$, pf $= ${tf(pf)}$.`, T`$|I_2| = ${tf(cabs(I2))}\,\text{A}$, $P_{ag} = ${tf(Pag / 1e3)}\,\text{kW}$, $P_{\text{mech}} = ${tf(Pmech / 1e3)}\,\text{kW}$.`, T`Shaft: $${tf(Psh / 1e3)}\,\text{kW}$ at $${tf((1 - s) * 1500)}\,\text{rpm}$: $T = ${tf(Tsh)}\,\text{N}\cdot\text{m}$.`, T`$P_{\text{in}} = ${tf(Pin / 1e3)}\,\text{kW}$, so $\eta = ${tf(eta)}\%$.`],
        idea: 'The equivalent circuit turns the motor into a slip-dependent impedance; the power crossing the air gap splits into rotor copper loss (s·Pag) and mechanical power.',
        diagram, prerequisites: 'Induction machines; complex impedance; power balance.',
        verify: () => { // Thévenin equivalent of the stator side seen by the rotor; stator current from KCL at the magnetising node
            const Zs = cx(R1, X1), Zm = cx(0, Xm), Vth = cd(cm(cx(Vph), Zm), ca(Zs, Zm)), Zth = cd(cm(Zs, Zm), ca(Zs, Zm)), i2 = cd(Vth, ca(Zth, Zr));
            const vm = cm(i2, Zr), i1 = ca(i2, cd(vm, Zm)), pin = 3 * (Vph * i1.re), pag = 3 * cabs(i2) ** 2 * R2 / s, psh = (1 - s) * pag - Prot;
            return [cabs(i1), Math.cos(Math.atan2(-i1.im, i1.re)), pag / 1e3, psh / ((1 - s) * ws), 100 * psh / pin];
        }
    });
}

/* Level 4 (mastery): space-vector PWM dwell times and leg duty cycles. */
function motorsSVPWM(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'svpwm', date, MOTORS_READING), p = part, d2r = Math.PI / 180;
    const [Vdc, mi, th, Tsu] = grid([300, 400, 540, 600, 700], [.3, .5, .7, .85, .95], steps(5, 355, 10), [50, 100, 200]);
    const Vref = +(mi * Vdc / Math.sqrt(3)).toFixed(1), k = Math.floor(th / 60) + 1, tp = th - 60 * (k - 1), T1 = Math.sqrt(3) * Tsu * Vref / Vdc * Math.sin((60 - tp) * d2r), T2 = Math.sqrt(3) * Tsu * Vref / Vdc * Math.sin(tp * d2r), T0 = Tsu - T1 - T2;
    const onA = [T1 + T2 + T0 / 2, T1 + T0 / 2, T0 / 2, T0 / 2, T2 + T0 / 2, T1 + T2 + T0 / 2][k - 1], dA = 100 * onA / Tsu;
    const hex = [0, 1, 2, 3, 4, 5].map(i => [360 + 110 * Math.cos(i * Math.PI / 3), 130 - 110 * Math.sin(i * Math.PI / 3)]);
    const diagram = drawing(wire('M' + hex.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z') + hex.map(([x, y], i) => guide(`M360 130L${x.toFixed(1)} ${y.toFixed(1)}`) + dt(360 + 134 * Math.cos(i * Math.PI / 3), 136 - 134 * Math.sin(i * Math.PI / 3), ['100', '110', '010', '011', '001', '101'][i])).join('') +
        arrow(360, 130, 360 + 95 * mi * Math.cos(th * d2r), 130 - 95 * mi * Math.sin(th * d2r)) + dt(620, 60, 'reference V*') + dt(620, 84, `θ = ${th}°`), 'Space-vector hexagon: six active switching states at 60° intervals with the reference vector drawn inside it', 262);
    return q({
        title: 'Space-vector PWM dwell times',
        text: T`A two-level three-phase inverter on a $${Vdc}\,\text{V}$ DC link uses symmetric space-vector PWM with switching period $T_s = ${Tsu}\,\mu\text{s}$. The reference voltage vector has magnitude $${Vref}\,\text{V}$ (phase peak) at angle $\theta = ${th}^\circ$; active vectors have length $\tfrac23V_{dc}$ and the first sector spans $0^\circ$ to $60^\circ$ between states $100$ and $110$. Find the sector, the dwell times $T_1$ (first active vector of the sector), $T_2$ (second) and the zero-vector time $T_0$, the duty cycle of phase leg $a$ (zero time split equally between $000$ and $111$), and the largest reference magnitude that stays in the linear range.`,
        givens: [T`$V_{dc} = ${Vdc}\,\text{V}$, $T_s = ${Tsu}\,\mu\text{s}$`, T`$|V^\ast| = ${Vref}\,\text{V}$, $\theta = ${th}^\circ$`, 'Symmetric SVPWM, sectors counted from state 100'],
        parts: [p('Sector', k, '', 0), p(T`$T_1$`, T1, 'µs'), p(T`$T_2$`, T2, 'µs'), p(T`$T_0$`, T0, 'µs'), p('Duty cycle of leg a', dA, '%'), p('Largest linear reference', Vdc / Math.sqrt(3), 'V')],
        hints: [T`Sector $k = \lfloor\theta/60^\circ\rfloor + 1$ and the angle inside it $\theta' = \theta - 60^\circ(k - 1)$.`, T`$T_1 = \sqrt3T_s\dfrac{|V^\ast|}{V_{dc}}\sin(60^\circ - \theta')$, $T_2 = \sqrt3T_s\dfrac{|V^\ast|}{V_{dc}}\sin\theta'$, $T_0 = T_s - T_1 - T_2$.`, T`Leg $a$ is high in states 100, 110 and 101 and in half of the zero time. The inscribed circle of the hexagon has radius $V_{dc}/\sqrt3$.`],
        steps: [T`$\theta = ${th}^\circ$ lies in sector $${k}$ with $\theta' = ${tp}^\circ$.`, T`$T_1 = ${tf(T1)}\,\mu\text{s}$, $T_2 = ${tf(T2)}\,\mu\text{s}$, $T_0 = ${tf(T0)}\,\mu\text{s}$.`, T`Leg $a$ is on for $${tf(onA)}\,\mu\text{s}$: duty $${tf(dA)}\%$.`, T`Linear range up to $V_{dc}/\sqrt3 = ${tf(Vdc / Math.sqrt(3))}\,\text{V}$.`],
        idea: 'SVPWM builds the reference from the two nearest switching states and the zero states; it reaches 15% more voltage than sine-triangle PWM before over-modulating.',
        diagram, prerequisites: 'Three-phase inverters; vectors; trigonometry.',
        verify: () => { // dwell times by solving the 2×2 vector equation; leg duty by min–max zero-sequence injection
            const ang1 = (k - 1) * 60 * d2r, ang2 = k * 60 * d2r, Va = 2 / 3 * Vdc, rx = Vref * Math.cos(th * d2r), ry = Vref * Math.sin(th * d2r);
            const [t1, t2] = NUM.solve([[Va * Math.cos(ang1), Va * Math.cos(ang2)], [Va * Math.sin(ang1), Va * Math.sin(ang2)]], [rx * Tsu, ry * Tsu]);
            const v = [0, -120, 120].map(o => Vref * Math.cos((th + o) * d2r)), off = -(Math.max(...v) + Math.min(...v)) / 2;
            return [Math.floor(th / 60) + 1, t1, t2, Tsu - t1 - t2, 100 * (.5 + (v[0] + off) / Vdc), Vdc / Math.sqrt(3)];
        }
    });
}
