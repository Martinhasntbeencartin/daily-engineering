/* Measurement: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (numerical integration, simulation, search). */
const MEASUREMENT_READING = {title: 'NIST/SEMATECH e-Handbook of Statistical Methods', url: 'https://www.itl.nist.gov/div898/handbook/'};
addTypes('measurement', 'university', measurementStrainBridge, measurementRTD, measurementLoading);
addTypes('measurement', 'challenge', measurementLockIn, measurementAntiAlias, measurementSineFit);
addTypes('measurement', 'expert', measurementFrontEndNoise);
addTypes('measurement', 'mastery', measurementExpFit);

const measureBlocks = (labels, caption, label) => {
    const w = 640 / labels.length;
    return drawing(labels.map((t, i) => wire(`M${45 + i * w + 10} 95h${w - 20}v70h${-(w - 20)}z`) + dt(45 + i * w + w / 2, 136, t) + (i ? arrow(45 + i * w - 10, 130, 45 + i * w + 10, 130) : '')).join('') + dt(365, 220, caption), label, 240);
};
/* Plot sampled data (dots) and a fitted curve on simple axes; xs and ys in data units. */
function dataPlot(xs, ys, fit, xLabel, yLabel, caption) {
    const x0 = Math.min(...xs), x1 = Math.max(...xs), lo = Math.min(...ys), hi = Math.max(...ys), pad = .12 * (hi - lo || 1), y0 = lo - pad, y1 = hi + pad;
    const X = x => 90 + 540 * (x - x0) / (x1 - x0), Y = y => 200 - 150 * (y - y0) / (y1 - y0);
    let path = '';
    for (let i = 0; i <= 160; i++) { const x = x0 + (x1 - x0) * i / 160; path += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(fit(x)).toFixed(1); }
    return drawing(wire('M90 40V200H640') + note(96, 34, yLabel) + dt(365, 232, xLabel) + `<path d="${path}" stroke="#aa492a" stroke-width="2"/>` + xs.map((x, i) => dot(X(x), Y(ys[i]))).join('') + dt(365, 256, caption), caption, 262);
}

/* Level 2: a strain gauge in quarter- and half-bridge circuits. */
function measurementStrainBridge(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'strain-bridge', date, MEASUREMENT_READING), p = part;
    const [GF, ue, Vex, Vfs, R0] = grid([1.9, 2, 2.05, 2.1, 2.15], [250, 500, 800, 1000, 1500, 2000, 2500, 3000], [2.5, 5, 10], [2.5, 5], [120, 350, 1000]), x = GF * ue * 1e-6;
    const quarter = Vex * x / (2 * (2 + x)), lin = Vex * x / 4, nl = 100 * (lin - quarter) / quarter, half = Vex * x / 2, gain = Vfs / half, Pg = (Vex / 2) ** 2 / R0;
    const diagram = drawing(element('DC', 80, 40, 80, 240, 'Vₑₓ') + wire('M80 40H360M80 240H360') + element('R', 360, 40, 230, 140, '') + element('R', 360, 40, 490, 140, '') + element('R', 230, 140, 360, 240, '') + element('R', 490, 140, 360, 240, '') +
        dt(262, 76, 'gauge') + dt(470, 76, 'R₀') + dt(262, 214, 'R₀') + dt(470, 214, 'R₀') + ring(230, 140, 4) + ring(490, 140, 4) + dt(360, 146, 'vₒ') + dot(360, 40) + dot(360, 240) + ground(360, 240),
        'Wheatstone bridge excited by Vex: a strain gauge in the upper-left arm and fixed resistors R0 in the other three; the output is taken between the side nodes', 262);
    return q({
        title: 'A strain gauge in a Wheatstone bridge',
        text: T`A metal-foil gauge ($R_0 = ${R0}\,\Omega$, gauge factor $${GF}$) sits in one arm of a Wheatstone bridge whose other arms are $R_0$, excited by $${Vex}\,\text{V}$. Under a strain of $${ue}\,\mu\varepsilon$ its resistance becomes $R_0(1 + \text{GF}\,\varepsilon)$. Find the exact bridge output, the usual linear approximation $V_{ex}\text{GF}\,\varepsilon/4$, and the approximation's error in percent. A half bridge uses two gauges in adjacent arms that see $+\varepsilon$ and $-\varepsilon$: find its output, and the amplifier gain that brings it to $${Vfs}\,\text{V}$. Finally find the power dissipated in the gauge (unstrained) in the quarter bridge.`,
        givens: [T`$\text{GF} = ${GF}$, $R_0 = ${R0}\,\Omega$`, T`$\varepsilon = ${ue}\,\mu\varepsilon$`, T`$V_{ex} = ${Vex}\,\text{V}$; full scale $${Vfs}\,\text{V}$`],
        parts: [p('Quarter-bridge output, exact', quarter * 1e3, 'mV'), p('Linear approximation', lin * 1e3, 'mV'), p('Error of the approximation', nl, '%'), p('Half-bridge output', half * 1e3, 'mV'), p('Amplifier gain', gain, 'V/V'), p('Gauge power', Pg * 1e3, 'mW')],
        hints: [T`Each side of the bridge is a divider: $v_o = V_{ex}\left(\dfrac{R_0(1+x)}{R_0(1+x) + R_0} - \dfrac12\right)$ with $x = \text{GF}\,\varepsilon$.`, T`That simplifies to $V_{ex}\dfrac{x}{2(2 + x)}$; the linear form drops the $x$ in the denominator, so its relative error is $x/2$.`, T`With $+\varepsilon$ and $-\varepsilon$ gauges in one divider, $\dfrac{1 + x}{(1 + x) + (1 - x)} = \dfrac{1 + x}{2}$: the half bridge is exactly linear.`],
        steps: [T`$x = ${GF}\times${ue}\times10^{-6} = ${tf(x)}$.`, T`Exact: $${tf(quarter * 1e3)}\,\text{mV}$; linear: $${tf(lin * 1e3)}\,\text{mV}$; error $${tf(nl)}\%$.`, T`Half bridge: $V_{ex}x/2 = ${tf(half * 1e3)}\,\text{mV}$, so the gain is $${Vfs}/${tf(half)} = ${tf(gain)}$.`, T`The gauge carries $V_{ex}/(2R_0)$: $P = (V_{ex}/2)^2/R_0 = ${tf(Pg * 1e3)}\,\text{mW}$.`],
        idea: 'A bridge turns a tiny resistance change into a voltage that starts at zero; pairing gauges of opposite strain doubles the output and cancels the nonlinearity.',
        diagram, prerequisites: 'Voltage dividers; strain gauges; linear approximation.',
        verify: () => { // the four resistances, node by node
            const Rg = R0 * (1 + x), vA = Vex * Rg / (Rg + R0), vB = Vex / 2, vH = Vex * R0 * (1 + x) / (R0 * (1 + x) + R0 * (1 - x));
            return [(vA - vB) * 1e3, Vex * GF * ue * 1e-6 / 4 * 1e3, 100 * (Vex * GF * ue * 1e-6 / 4 / (vA - vB) - 1), (vH - vB) * 1e3, Vfs / (vH - vB), (Vex / 2 / R0) ** 2 * R0 * 1e3];
        }
    });
}

/* Level 2: a platinum RTD: Callendar–Van Dusen inversion, linearisation, lead resistance and self-heating. */
function measurementRTD(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'rtd', date, MEASUREMENT_READING), p = part, A = 3.9083e-3, B = -5.775e-7;
    const [R0, Ttrue, r, Ima, dlt] = grid([100, 1000], steps(10, 400, 10), [.1, .25, .5], [.5, 1, 2], [2, 5]);
    const R = +(R0 * (1 + A * Ttrue + B * Ttrue * Ttrue)).toFixed(2), Tof = Rm => (-A + Math.sqrt(A * A - 4 * B * (1 - Rm / R0))) / (2 * B), Tc = Tof(R);
    const Tlin = (R / R0 - 1) / .00385, e2w = Tof(R + 2 * r) - Tc, P = (Ima * 1e-3) ** 2 * R * 1e3, dTs = P / dlt, sens = R0 * (A + 2 * B * Tc);
    const diagram = drawing(element('I', 100, 220, 100, 70, 'I') + element('R', 100, 70, 280, 70, 'r') + wire('M280 70H420M280 220H420') + element('R', 100, 220, 280, 220, 'r') + element('R', 420, 70, 420, 220, 'RTD') +
        ring(160, 145, 20) + dt(160, 151, 'V') + wire('M160 125V70M160 165V220') + dot(160, 70) + dot(160, 220) + dt(425, 28, 'sensor at T') + guide('M360 40v210h130V40z'), 'A current source drives a platinum RTD through two lead wires of resistance r each; a voltmeter reads the voltage at the instrument end', 262);
    return q({
        title: 'Reading temperature from a platinum RTD',
        text: T`A Pt${R0} RTD follows $R(T) = R_0(1 + AT + BT^2)$ for $T \ge 0\,{}^\circ\text{C}$, with $A = 3.9083\times10^{-3}$ and $B = -5.775\times10^{-7}$. A four-wire measurement reads $R = ${R}\,\Omega$. Find the temperature from the quadratic, and from the linear approximation with $\alpha = 0.00385\,/^\circ\text{C}$. If the same sensor were read with two wires of $${r}\,\Omega$ each (as drawn), what temperature error would the leads add? The measuring current of $${Ima}\,\text{mA}$ heats the sensor (dissipation constant $${dlt}\,\text{mW}/^\circ\text{C}$): how large is the self-heating error? Finally give the sensitivity $dR/dT$ at this temperature.`,
        givens: [T`$R_0 = ${R0}\,\Omega$, $R = ${R}\,\Omega$`, T`Lead resistance $${r}\,\Omega$ per wire`, T`$I = ${Ima}\,\text{mA}$, dissipation constant $${dlt}\,\text{mW}/^\circ\text{C}$`],
        parts: [p('Temperature (quadratic)', Tc, '°C'), p('Temperature (linear approximation)', Tlin, '°C'), p('Two-wire error', e2w, '°C'), p('Self-heating error', dTs, '°C'), p(T`Sensitivity $dR/dT$`, sens, 'Ω/°C')],
        hints: [T`Solve $BT^2 + AT + (1 - R/R_0) = 0$ and keep the root near $(R/R_0 - 1)/A$.`, T`Two wires put $2r$ in series with the sensor: work out the temperature that $R + 2r$ would indicate.`, T`The sensor dissipates $I^2R$; dividing by the dissipation constant gives its temperature rise above its surroundings.`],
        steps: [T`$T = \dfrac{-A + \sqrt{A^2 - 4B(1 - R/R_0)}}{2B} = ${tf(Tc)}\,{}^\circ\text{C}$.`, T`Linear: $(R/R_0 - 1)/0.00385 = ${tf(Tlin)}\,{}^\circ\text{C}$.`, T`Two-wire: $R + 2r = ${tf(R + 2 * r)}\,\Omega$ reads $${tf(Tc + e2w)}\,{}^\circ\text{C}$, an error of $${tf(e2w)}\,{}^\circ\text{C}$.`, T`$P = I^2R = ${tf(P * 1e3)}\,\mu\text{W}$, so self-heating adds $${tf(dTs)}\,{}^\circ\text{C}$.`, T`$dR/dT = R_0(A + 2BT) = ${tf(sens)}\,\Omega/^\circ\text{C}$.`],
        idea: 'An RTD is precise only when its small nonlinearity, its leads and its own heating are all accounted for.',
        diagram, prerequisites: 'Quadratic equations; resistance thermometry; power.',
        verify: () => { // bisection on the temperature, and a finite difference for the slope
            const Rt = t => R0 * (1 + A * t + B * t * t), inv = v => NUM.bisect(t => Rt(t) - v, -50, 900, 200), t0 = inv(R);
            return [t0, (R / R0 - 1) / .00385, inv(R + 2 * r) - t0, Ima * Ima * R / 1e3 / dlt, (Rt(t0 + 1e-4) - Rt(t0 - 1e-4)) / 2e-4];
        }
    });
}

/* Level 2: meter loading of a divider, and compensating a 10:1 oscilloscope probe. Units: kΩ, pF. */
function measurementLoading(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'loading', date, MEASUREMENT_READING), p = part;
    const [Vs, R1, R2, RmM, Cin] = grid([3.3, 5, 9, 10, 12], [10, 100, 1000], [10, 47, 100, 1000], [1, 10], [13, 15, 20, 25]), Rm = RmM * 1e3;
    const V = Vs * R2 / (R1 + R2), R2m = R2 * Rm / (R2 + Rm), Vm = Vs * R2m / (R1 + R2m), err = 100 * (Vm - V) / V, Cp = Cin / 9;
    const Rth = R1 * R2 / (R1 + R2), Rpar = Rth * 1e4 / (Rth + 1e4), f3 = 1 / (2 * Math.PI * Rpar * 1e3 * Cin / 10 * 1e-12);
    const diagram = drawing(element('DC', 70, 60, 70, 220, 'Vₛ') + element('R', 70, 60, 230, 60, 'R₁') + element('R', 230, 60, 230, 220, 'R₂') + wire('M230 60H330M70 220H640') + ring(330, 140, 22) + dt(330, 146, 'V') + wire('M330 60V118M330 162V220') + note(358, 120, 'meter Rₘ') +
        wire('M330 60H420') + element('R', 420, 60, 560, 60, '') + wire('M420 60V30H460M520 30H560V60') + element('C', 460, 30, 520, 30, '') + dt(490, 88, '9 MΩ ∥ Cₚ') + wire('M560 60H600') + element('R', 600, 60, 600, 220, '') + wire('M600 60H650') +
        element('C', 650, 60, 650, 220, '') + note(530, 160, '1 MΩ') + dt(690, 150, 'Cᵢₙ') + dot(230, 60) + dot(330, 60) + dot(600, 60) + ground(400, 220), 'A divider R1–R2 is measured by a meter of input resistance Rm; a 10:1 probe (9 megohm in parallel with Cp) feeds an oscilloscope input of 1 megohm in parallel with Cin', 262);
    return q({
        title: 'What the meter and the probe do to the circuit',
        text: T`A divider of $R_1 = ${R1}\,\text{k}\Omega$ and $R_2 = ${R2}\,\text{k}\Omega$ runs from $${Vs}\,\text{V}$. Find the true voltage across $R_2$, the reading of a voltmeter with input resistance $${RmM}\,\text{M}\Omega$, and the loading error in percent. The same node is then viewed through a 10:1 passive probe: a $9\,\text{M}\Omega$ tip resistor in parallel with an adjustable $C_p$, into a scope input of $1\,\text{M}\Omega \parallel ${Cin}\,\text{pF}$ (cable included). Find the $C_p$ that compensates the probe (flat response), and the $-3\,\text{dB}$ bandwidth of the measurement set by the divider's Thévenin resistance driving the compensated probe.`,
        givens: [T`$V_s = ${Vs}\,\text{V}$, $R_1 = ${R1}\,\text{k}\Omega$, $R_2 = ${R2}\,\text{k}\Omega$`, T`Meter: $${RmM}\,\text{M}\Omega$`, T`Probe $9\,\text{M}\Omega \parallel C_p$; scope $1\,\text{M}\Omega \parallel ${Cin}\,\text{pF}$`],
        parts: [p('True voltage', V, 'V'), p('Meter reading', Vm, 'V'), p('Loading error', err, '%', .01, .001), p(T`Compensating $C_p$`, Cp, 'pF'), p('Measurement bandwidth', f3 / 1e3, 'kHz')],
        hints: [T`The meter appears in parallel with $R_2$: $V_m = V_s\dfrac{R_2 \parallel R_m}{R_1 + R_2 \parallel R_m}$.`, T`The probe is compensated when both halves have the same time constant, $9\,\text{M}\Omega\cdot C_p = 1\,\text{M}\Omega\cdot C_{\text{in}}$; it then looks like $10\,\text{M}\Omega \parallel C_{\text{in}}/10$.`, T`The divider's Thévenin resistance $R_1 \parallel R_2$ and the probe's $10\,\text{M}\Omega$ form a single pole with $C_{\text{in}}/10$.`],
        steps: [T`$V = ${tf(V)}\,\text{V}$; with the meter $R_2 \parallel R_m = ${tf(R2m)}\,\text{k}\Omega$ and $V_m = ${tf(Vm)}\,\text{V}$, an error of $${tf(err)}\%$.`, T`$C_p = C_{\text{in}}/9 = ${tf(Cp)}\,\text{pF}$.`, T`$R_{th} = ${tf(Rth)}\,\text{k}\Omega$; with the probe's $10\,\text{M}\Omega$ in parallel, $${tf(Rpar)}\,\text{k}\Omega$ drives $${tf(Cin / 10)}\,\text{pF}$: $f_{-3\text{dB}} = ${tf(f3 / 1e3)}\,\text{kHz}$.`],
        idea: 'Every instrument becomes part of the circuit: its resistance loads the node at DC and its capacitance limits the bandwidth.',
        diagram, prerequisites: 'Voltage dividers; RC time constants; impedance.',
        verify: () => { // Cp by bisection for equal gain at 1 Hz and 1 GHz; the bandwidth from the full complex circuit
            const H = (f, cp) => { const w = 2 * Math.PI * f, zp = cd(cx(9e6), cx(1, w * 9e6 * cp * 1e-12)), zs = cd(cx(1e6), cx(1, w * 1e6 * Cin * 1e-12)); return cd(zs, ca(zp, zs)); };
            const cpv = NUM.bisect(c => cabs(H(1e9, c)) - cabs(H(1, c)), .01, 100, 200);
            const tip = f => { const w = 2 * Math.PI * f, zp = cd(cx(9e6), cx(1, w * 9e6 * cpv * 1e-12)), zs = cd(cx(1e6), cx(1, w * 1e6 * Cin * 1e-12)), zl = ca(zp, zs), z2 = cd(cm(cx(R2 * 1e3), zl), ca(cx(R2 * 1e3), zl)); return cabs(cd(z2, ca(cx(R1 * 1e3), z2))); };
            const fh = NUM.bisect(f => tip(f) / tip(1e-3) - Math.SQRT1_2, 1, 1e10, 200), vm = Vs * (1 / (1 / R2 + 1 / Rm)) / (R1 + 1 / (1 / R2 + 1 / Rm));
            return [Vs * R2 / (R1 + R2), vm, 100 * (vm / (Vs * R2 / (R1 + R2)) - 1), cpv, fh / 1e3];
        }
    });
}

/* Level 3: recovering a weak signal with a lock-in amplifier. */
function measurementLockIn(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'lock-in', date, MEASUREMENT_READING), p = part;
    const [As, en, Bk, tau, ord] = grid([1, 2, 5, 10, 20], [5, 10, 20, 50], [10, 100], [.01, .03, .1, .3, 1], [1, 2]);
    const kE = ord === 1 ? 4 : 8, xs = ord === 1 ? Math.log(100) : NUM.bisect(x => Math.exp(-x) * (1 + x) - .01, 1, 20, 200);
    const snrIn = 20 * Math.log10(As * 1e-6 / (en * 1e-9 * Math.sqrt(Bk * 1e3))), enbw = 1 / (kE * tau), noise = en * Math.sqrt(enbw), snrOut = 20 * Math.log10(As * 1e3 / noise);
    const enbwReq = (As * 1e3 / (en * 100)) ** 2, tauReq = 1 / (kE * enbwReq), settle = xs * tau;
    const diagram = measureBlocks(['signal + noise', '× reference', 'low-pass, τ', 'output'], `The reference shifts the signal to DC; the low-pass filter's noise bandwidth sets the output noise`, 'A lock-in amplifier: the noisy input is multiplied by a reference at the signal frequency and low-pass filtered');
    return q({
        title: 'Digging a signal out of noise with a lock-in amplifier',
        text: T`A $${As}\,\mu\text{V}$ (RMS) signal arrives with white noise of $${en}\,\text{nV}/\sqrt{\text{Hz}}$. In the input bandwidth of $${Bk}\,\text{kHz}$, what is the signal-to-noise ratio? A lock-in amplifier demodulates it and filters the result with ${ord === 1 ? 'a single RC low-pass' : 'two identical cascaded RC low-passes'} of time constant $\tau = ${tau}\,\text{s}$ each. Find the filter's equivalent noise bandwidth, the RMS output noise referred to the input, and the output SNR. What $\tau$ would give an output SNR of $40\,\text{dB}$? How long does the output take to settle within 1% of a step with the given $\tau$?`,
        givens: [T`Signal $${As}\,\mu\text{V}$ RMS; noise $${en}\,\text{nV}/\sqrt{\text{Hz}}$`, T`Input bandwidth $${Bk}\,\text{kHz}$`, T`Low-pass: order $${ord}$, $\tau = ${tau}\,\text{s}$`],
        parts: [p('Input SNR', snrIn, 'dB', .01, .02), p('Equivalent noise bandwidth', enbw, 'Hz'), p('Output noise', noise, 'nV'), p('Output SNR', snrOut, 'dB', .01, .02), p(T`$\tau$ for 40 dB`, tauReq, 's'), p('1% settling time', settle, 's')],
        hints: [T`White noise in a bandwidth $B$ has RMS value $e_n\sqrt B$.`, T`The noise bandwidth of $|H(f)|^2 = (1 + (2\pi f\tau)^2)^{-n}$ is $1/(4\tau)$ for $n = 1$ and $1/(8\tau)$ for $n = 2$.`, T`Settling to 1%: $e^{-t/\tau} = 0.01$ for one pole; $e^{-x}(1 + x) = 0.01$ with $x = t/\tau$ for two.`],
        steps: [T`Input: $${en}\,\text{nV}\times\sqrt{${Bk * 1e3}} = ${tf(en * Math.sqrt(Bk * 1e3) / 1e3)}\,\mu\text{V}$, so $\text{SNR} = ${tf(snrIn)}\,\text{dB}$.`, T`ENBW $= 1/(${kE}\times${tau}) = ${tf(enbw)}\,\text{Hz}$, noise $= ${tf(noise)}\,\text{nV}$, output SNR $= ${tf(snrOut)}\,\text{dB}$.`, T`40 dB needs noise $\le ${tf(As * 10)}\,\text{nV}$, i.e. ENBW $\le ${tf(enbwReq)}\,\text{Hz}$, so $\tau = ${tf(tauReq)}\,\text{s}$.`, T`Settling: $${tf(xs)}\,\tau = ${tf(settle)}\,\text{s}$.`],
        idea: 'A lock-in trades time for noise: the output noise falls as the square root of the averaging time, while the settling time grows in proportion to it.',
        diagram, prerequisites: 'Noise spectral density; filters; decibels.',
        verify: () => { // ENBW by numerical integration of |H|²; settling by simulating the cascaded RC filter
            const g = f => (1 + (2 * Math.PI * f * tau) ** 2) ** -ord, nb = NUM.simpson(u => g(Math.tan(u)) / Math.cos(u) ** 2, 0, Math.PI / 2 - 1e-9, 20000);
            const dt = tau / 2000; let y1 = 0, y2 = 0, t = 0; const out = () => ord === 1 ? y1 : y2;
            while (out() < .99) { y1 += dt / tau * (1 - y1); y2 += dt / tau * (y1 - y2); t += dt; }
            const nz = en * Math.sqrt(nb), need = (As * 1e3 / (en * 100)) ** 2;
            return [20 * Math.log10(As * 1e3 / (en * Math.sqrt(Bk * 1e3))), nb, nz, 20 * Math.log10(As * 1e3 / nz), tau * nb / need, t];
        }
    });
}

/* Level 3: aliasing of an interferer and the anti-alias filter order it demands. */
function measurementAntiAlias(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'anti-alias', date, MEASUREMENT_READING), p = part;
    const [fs, N, frac, mult, Afs] = grid([8, 16, 44.1, 48, 96], [8, 10, 12, 16], [.4, .45], [1.3, 1.7, 2.3, 3.1], [.1, .5, 1]);
    const fb = +(frac * fs / 2).toFixed(4), fi = +(mult * fs / 2).toFixed(4), r = fi % fs, fa = r > fs / 2 ? fs - r : r, Areq = 20 * Math.log10(Afs * 2 ** N), att = (f, n) => 10 * Math.log10(1 + (f / fb) ** (2 * n));
    let n = 1; while (att(fi, n) < Areq) n++;
    const X = f => 70 + 580 * f / (1.1 * Math.max(fi, fs)), diagram = drawing(wire('M70 200H660') + dt(665, 224, 'f') + guide(`M${X(fs / 2)} 40V200`) + dt(X(fs / 2), 224, 'fₛ/2') + guide(`M${X(fs)} 40V200`) + dt(X(fs), 224, 'fₛ') +
        wire(`M70 80H${X(fb)}V200`) + dt((70 + X(fb)) / 2, 66, 'band') + arrow(X(fi), 200, X(fi), 70) + dt(X(fi), 56, 'interferer') + arrow(X(fa), 200, X(fa), 130) + dt(X(fa), 118, 'alias'), 'Spectrum: the wanted band up to fb, the Nyquist frequency fs/2, the sampling frequency fs, an interferer above fs/2 and the alias it creates in the band', 240);
    return q({
        title: 'Size the anti-alias filter',
        text: T`An ${N}-bit ADC samples at $f_s = ${fs}\,\text{kHz}$. The wanted band runs up to $f_b = ${fb}\,\text{kHz}$, and an interferer at $${fi}\,\text{kHz}$ arrives with an amplitude of $${Afs}$ times the ADC's full-scale amplitude. Find the frequency it would alias to. Its alias must stay below half an LSB ($\text{full scale}/2^{${N}}$ in amplitude): find the attenuation required. With a Butterworth low-pass whose $-3\,\text{dB}$ point is $f_b$, find the lowest order that achieves it, the attenuation that order gives at the interferer, and its attenuation at $f_s - f_b$, the lowest frequency that folds into the wanted band.`,
        givens: [T`$f_s = ${fs}\,\text{kHz}$, $${N}$ bits`, T`Band edge $f_b = ${fb}\,\text{kHz}$`, T`Interferer $${fi}\,\text{kHz}$ at $${Afs}\times$ full scale`],
        parts: [p('Alias frequency', fa, 'kHz'), p('Required attenuation', Areq, 'dB'), p('Lowest Butterworth order', n, '', 0), p('Attenuation at the interferer', att(fi, n), 'dB'), p(T`Attenuation at $f_s - f_b$`, att(fs - fb, n), 'dB')],
        hints: [T`Sampling folds every frequency into $[0, f_s/2]$: subtract the nearest multiple of $f_s$ and take the magnitude.`, T`Half an LSB is $\text{FS}/2^{${N}}$, so the attenuation must be at least $20\log_{10}(${Afs}\cdot2^{${N}})$ dB.`, T`A Butterworth filter of order $n$ attenuates by $10\log_{10}\left(1 + (f/f_b)^{2n}\right)$ dB.`],
        steps: [T`The nearest multiple of $f_s$ is $${Math.round(fi / fs)}f_s = ${tf(Math.round(fi / fs) * fs)}\,\text{kHz}$, so the interferer folds to $|${fi} - ${tf(Math.round(fi / fs) * fs)}| = ${tf(fa)}\,\text{kHz}$.`, T`Required: $20\log_{10}(${Afs}\times2^{${N}}) = ${tf(Areq)}\,\text{dB}$.`, T`At $f/f_b = ${tf(fi / fb)}$ the attenuation first reaches it at order $${n}$: $${tf(att(fi, n))}\,\text{dB}$.`, T`At $f_s - f_b = ${tf(fs - fb)}\,\text{kHz}$ that filter gives only $${tf(att(fs - fb, n))}\,\text{dB}$: a narrow transition band is what makes anti-alias filters hard.`],
        idea: 'After sampling, an alias is indistinguishable from a real signal; only filtering before the ADC can remove it.',
        diagram, prerequisites: 'Sampling theorem; decibels; Butterworth filters.',
        verify: () => { // the alias by trying multiples of fs; the filter from its pole positions
            let fal = Infinity; for (let k = 0; k < 20; k++) { const c = Math.abs(fi - k * fs); if (c <= fs / 2 + 1e-9) fal = Math.min(fal, c); }
            const mag = (f, ord) => { let re = 1, im = 0; for (let k = 1; k <= ord; k++) { const th = Math.PI * (2 * k + ord - 1) / (2 * ord), ar = -Math.cos(th), ai = f / fb - Math.sin(th), nr = re * ar - im * ai; im = re * ai + im * ar; re = nr; } return -20 * Math.log10(1 / Math.hypot(re, im)); };
            const need = 20 * Math.log10(Afs) + 20 * N * Math.log10(2); let o = 1; while (mag(fi, o) < need) o++;
            return [fal, need, o, mag(fi, o), mag(fs - fb, o)];
        }
    });
}

/* Level 3: a three-parameter least-squares sine fit (as in IEEE 1057) and the effective number of bits. */
function measurementSineFit(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'sine-fit', date, MEASUREMENT_READING), p = part, N = 12;
    const noises = [[.012, -.008, .004, -.015, .009, .002, -.011, .006, -.003, .013, -.007, .001], [-.006, .011, -.013, .003, .008, -.009, .014, -.002, -.010, .005, .007, -.012], [.009, .004, -.012, .010, -.005, -.014, .006, .011, -.008, -.001, .013, -.003]];
    const [amp, ph, off, ni, m] = grid(steps(.5, 2.5, .1), steps(-150, 150, 30), [-.1, 0, .05, .2], [0, 1, 2], [1, 2, 3, 5]);
    const th = Array.from({length: N}, (_, n) => 2 * Math.PI * m * n / N), y = th.map((t, n) => +(amp * Math.cos(t + ph * Math.PI / 180) + off + noises[ni][n]).toFixed(3));
    const X = th.map(t => [Math.cos(t), Math.sin(t), 1]), XtX = [0, 1, 2].map(i => [0, 1, 2].map(j => X.reduce((s, r) => s + r[i] * r[j], 0))), Xty = [0, 1, 2].map(i => X.reduce((s, r, n) => s + r[i] * y[n], 0));
    const [Ac, Bs, C] = NUM.solve(XtX, Xty), A = Math.hypot(Ac, Bs), phi = Math.atan2(-Bs, Ac) * 180 / Math.PI, res = y.map((v, n) => v - Ac * Math.cos(th[n]) - Bs * Math.sin(th[n]) - C), rms = Math.sqrt(res.reduce((s, v) => s + v * v, 0) / N);
    const sinad = 20 * Math.log10(A / Math.SQRT2 / rms), enob = (sinad - 1.76) / 6.02;
    const diagram = dataPlot(Array.from({length: N}, (_, n) => n), y, n => Ac * Math.cos(2 * Math.PI * m * n / N) + Bs * Math.sin(2 * Math.PI * m * n / N) + C, 'sample n', 'y (V)', `Twelve samples of a ${m}-cycle record and the fitted sine`);
    return q({
        title: 'Fit a sine of known frequency',
        text: T`An ADC records $N = ${N}$ samples of a test tone that completes exactly $${m}$ cycle${m > 1 ? 's' : ''} in the record, so sample $n$ is at phase $\theta_n = 2\pi\cdot${m}n/${N}$. Fit $y_n \approx A\cos(\theta_n + \varphi) + C$ by linear least squares, writing it as $a\cos\theta_n + b\sin\theta_n + C$. Find the amplitude $A$, the phase $\varphi$ in degrees ($-180^\circ$ to $180^\circ$), the offset $C$ and the RMS residual. Treating the residual as noise and distortion, find SINAD $= 20\log_{10}\dfrac{A/\sqrt2}{\text{RMS residual}}$ and the effective number of bits $(\text{SINAD} - 1.76)/6.02$.`,
        givens: [T`$y = (${y.join(',\\ ')})\,\text{V}$`, T`$n = 0, 1, \ldots, ${N - 1}$; $${m}$ cycle${m > 1 ? 's' : ''} per record`],
        parts: [p(T`Amplitude $A$`, A, 'V'), p(T`Phase $\varphi$`, phi, '°', .001, .05), p(T`Offset $C$`, C, 'V', .01, 1e-4), p('RMS residual', rms * 1e3, 'mV'), p('ENOB', enob, 'bits')],
        hints: [T`The model is linear in $a$, $b$ and $C$: solve the $3\times3$ normal equations $X^\top X\,\theta = X^\top y$ with rows $[\cos\theta_n,\ \sin\theta_n,\ 1]$.`, T`$a\cos\theta + b\sin\theta = A\cos(\theta + \varphi)$ with $A = \sqrt{a^2 + b^2}$ and $\varphi = \operatorname{atan2}(-b, a)$.`, T`Over whole cycles the columns are orthogonal, which gives a quick check: $a = \tfrac{2}{N}\sum y_n\cos\theta_n$, $b = \tfrac{2}{N}\sum y_n\sin\theta_n$, $C = \bar y$.`],
        steps: [T`$a = ${tf(Ac)}$, $b = ${tf(Bs)}$, $C = ${tf(C)}\,\text{V}$.`, T`$A = ${tf(A)}\,\text{V}$ and $\varphi = ${tf(phi)}^\circ$.`, T`RMS residual $= ${tf(rms * 1e3)}\,\text{mV}$.`, T`SINAD $= ${tf(sinad)}\,\text{dB}$, so ENOB $= ${tf(enob)}$ bits.`],
        idea: 'With the frequency known, fitting a sine is linear least squares; whatever the fit cannot explain is the converter’s noise and distortion.',
        diagram, prerequisites: 'Least squares; trigonometric identities; decibels.',
        verify: () => { // orthogonality over whole cycles: DFT-style sums
            const a = 2 / N * y.reduce((s, v, n) => s + v * Math.cos(th[n]), 0), b = 2 / N * y.reduce((s, v, n) => s + v * Math.sin(th[n]), 0), c = y.reduce((s, v) => s + v, 0) / N;
            const r = Math.sqrt(y.reduce((s, v, n) => s + (v - a * Math.cos(th[n]) - b * Math.sin(th[n]) - c) ** 2, 0) / N), am = Math.hypot(a, b);
            return [am, Math.atan2(-b, a) * 180 / Math.PI, c, r * 1e3, (20 * Math.log10(am / Math.SQRT2 / r) - 1.76) / 6.02];
        }
    });
}

/* Level 4 (expert): input-referred noise of an amplifier front end, with 1/f noise and the optimum source resistance. */
function measurementFrontEndNoise(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'front-end-noise', date, MEASUREMENT_READING), p = part, kB = 1.380649e-23, Tk = 300, f1 = 1;
    const [Rs, en, inn, fc, f2] = grid([100, 1000, 1e4, 1e5], [1, 4, 10, 20], [.1, 1, 10], [10, 100, 1000], [1e3, 1e4, 1e5]);
    const e = en * 1e-9, i = inn * 1e-12, eR = Math.sqrt(4 * kB * Tk * Rs), ew = Math.sqrt(eR * eR + e * e + (i * Rs) ** 2);
    const v2 = (eR * eR + (i * Rs) ** 2) * (f2 - f1) + e * e * ((f2 - f1) + fc * Math.log(f2 / f1)), NF = 10 * Math.log10(ew * ew / (eR * eR)), Ropt = e / i, NFmin = 10 * Math.log10(1 + 2 * e * i / (4 * kB * Tk));
    const diagram = drawing(element('R', 60, 120, 200, 120, 'Rₛ') + ring(240, 120, 18) + dt(240, 126, '+−') + dt(240, 88, 'eₙ') + wire('M60 120V220M258 120H330M60 220H330') + element('I', 330, 220, 330, 120, 'iₙ') +
        wire('M330 120H420') + wire('M420 80v80l90 -40z') + dt(450, 126, 'noiseless') + wire('M510 120H600') + ring(605, 120, 4) + note(80, 250, 'thermal noise of Rₛ: √(4kTRₛ)') + ground(200, 220) + dot(330, 120),
        'A source resistance Rs feeds a noiseless amplifier; the amplifier noise is modelled by a series voltage source en and a shunt current source in at its input', 262);
    return q({
        title: 'The noise budget of an amplifier front end',
        text: T`A sensor of resistance $R_s = ${tf(Rs)}\,\Omega$ at $300\,\text{K}$ drives an amplifier with input voltage noise $e_n = ${en}\,\text{nV}/\sqrt{\text{Hz}}$ (white, with a $1/f$ corner at $${fc}\,\text{Hz}$, i.e. density $e_n^2(1 + f_c/f)$) and input current noise $i_n = ${inn}\,\text{pA}/\sqrt{\text{Hz}}$ (white). All sources are independent. Find the thermal noise density of $R_s$ and the total white-region input noise density. Find the total RMS input noise from $1\,\text{Hz}$ to $${tf(f2 / 1e3)}\,\text{kHz}$, including the $1/f$ part. Find the noise figure in the white region, the source resistance that would minimise it, and that minimum noise figure.`,
        givens: [T`$R_s = ${tf(Rs)}\,\Omega$, $T = 300\,\text{K}$`, T`$e_n = ${en}\,\text{nV}/\sqrt{\text{Hz}}$, corner $${fc}\,\text{Hz}$`, T`$i_n = ${inn}\,\text{pA}/\sqrt{\text{Hz}}$; band $1\,\text{Hz}$ to $${tf(f2 / 1e3)}\,\text{kHz}$`],
        parts: [p(T`Thermal noise of $R_s$`, eR * 1e9, 'nV/√Hz'), p('Total white input noise', ew * 1e9, 'nV/√Hz'), p('RMS input noise over the band', Math.sqrt(v2) * 1e6, 'µV'), p('Noise figure', NF, 'dB'), p('Optimum source resistance', Ropt / 1e3, 'kΩ'), p('Minimum noise figure', NFmin, 'dB')],
        hints: [T`Independent noise powers add: $e_{\text{tot}}^2 = 4kTR_s + e_n^2 + (i_nR_s)^2$.`, T`Integrate the densities: $\displaystyle\int_{f_1}^{f_2}e_n^2\left(1 + \frac{f_c}{f}\right)df = e_n^2\left[(f_2 - f_1) + f_c\ln\frac{f_2}{f_1}\right]$.`, T`$\text{NF} = 10\log_{10}\dfrac{e_{\text{tot}}^2}{4kTR_s}$. Minimising over $R_s$ gives $R_{\text{opt}} = e_n/i_n$ and $\text{NF}_{\min} = 10\log_{10}\left(1 + \dfrac{2e_ni_n}{4kT}\right)$.`],
        steps: [T`$\sqrt{4kTR_s} = ${tf(eR * 1e9)}\,\text{nV}/\sqrt{\text{Hz}}$; $i_nR_s = ${tf(i * Rs * 1e9)}\,\text{nV}/\sqrt{\text{Hz}}$; total $${tf(ew * 1e9)}\,\text{nV}/\sqrt{\text{Hz}}$.`, T`$v^2 = ${tf(v2)}\,\text{V}^2$, so $v_{\text{rms}} = ${tf(Math.sqrt(v2) * 1e6)}\,\mu\text{V}$.`, T`$\text{NF} = ${tf(NF)}\,\text{dB}$.`, T`$R_{\text{opt}} = ${tf(Ropt / 1e3)}\,\text{k}\Omega$ and $\text{NF}_{\min} = ${tf(NFmin)}\,\text{dB}$.`],
        idea: 'Voltage noise dominates with small sources, current noise with large ones; the noise figure is lowest where the two are balanced, at R = eₙ/iₙ.',
        diagram, prerequisites: 'Thermal noise; noise densities; logarithms.',
        verify: () => { // numerical integration over log frequency; the optimum by golden-section search on log Rs
            const dens = f => 4 * kB * Tk * Rs + (i * Rs) ** 2 + e * e * (1 + fc / f), v = NUM.simpson(u => dens(Math.exp(u)) * Math.exp(u), Math.log(f1), Math.log(f2), 20000);
            const nf = r => 10 * Math.log10((4 * kB * Tk * r + e * e + (i * r) ** 2) / (4 * kB * Tk * r)), gr = (Math.sqrt(5) - 1) / 2;
            let a = Math.log(1), b = Math.log(1e9); for (let k = 0; k < 200; k++) { const c = b - gr * (b - a), d = a + gr * (b - a); if (nf(Math.exp(c)) < nf(Math.exp(d))) b = d; else a = c; }
            const ro = Math.exp((a + b) / 2);
            return [Math.sqrt(4 * kB * Tk * Rs) * 1e9, Math.sqrt(dens(1e12)) * 1e9, Math.sqrt(v) * 1e6, nf(Rs), ro / 1e3, nf(ro)];
        }
    });
}

/* Level 4 (mastery): fitting an exponential decay with offset by Gauss–Newton, with parameter uncertainties. */
function measurementExpFit(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'exp-fit', date, MEASUREMENT_READING), p = part, sig = .02;
    const noises = [[.015, -.022, .008, .019, -.011, -.027, .004, .021, -.016, .009], [-.018, .012, .025, -.006, -.020, .014, .003, -.024, .017, -.002], [.007, .026, -.013, -.019, .022, .001, -.025, .011, .018, -.009]];
    const [A0, tau0, B0, ni] = grid(steps(1, 5, .25), [.5, .8, 1, 1.5, 2, 3], [-.2, 0, .1, .5], [0, 1, 2]), t = Array.from({length: 10}, (_, k) => k * .5);
    const y = t.map((tt, k) => +(A0 * Math.exp(-tt / tau0) + B0 + noises[ni][k]).toFixed(3));
    const model = ([A, ta, B], tt) => A * Math.exp(-tt / ta) + B, jac = ([A, ta], tt) => { const e = Math.exp(-tt / ta); return [e, A * tt / (ta * ta) * e, 1]; };
    const chi = th => y.reduce((s, v, k) => s + ((v - model(th, t[k])) / sig) ** 2, 0);
    // Gauss–Newton with Levenberg–Marquardt damping, from a rough start
    let th = [y[0] - y[9], 1, y[9]], lam = 1e-3;
    for (let it = 0; it < 200; it++) {
        const J = t.map(tt => jac(th, tt)), r = y.map((v, k) => v - model(th, t[k])), JtJ = [0, 1, 2].map(a => [0, 1, 2].map(b => J.reduce((s, row) => s + row[a] * row[b], 0))), Jtr = [0, 1, 2].map(a => J.reduce((s, row, k) => s + row[a] * r[k], 0));
        const step = NUM.solve(JtJ.map((row, a) => row.map((v, b) => a === b ? v * (1 + lam) : v)), Jtr), cand = th.map((v, a) => v + step[a]);
        if (cand[1] > 0 && chi(cand) < chi(th)) { th = cand; lam /= 3; if (Math.max(...step.map(Math.abs)) < 1e-12) break; } else lam = Math.min(lam * 4, 1e12);
    }
    const J = t.map(tt => jac(th, tt)), JtJ = [0, 1, 2].map(a => [0, 1, 2].map(b => J.reduce((s, row) => s + row[a] * row[b], 0))), inv = [0, 1, 2].map(c => NUM.solve(JtJ, [0, 1, 2].map(k => +(k === c))));
    const [A, ta, B] = th, uTau = Math.sqrt(sig * sig * inv[1][1]), chi2 = chi(th);
    const diagram = dataPlot(t, y, tt => model(th, tt), 'time t (s)', 'reading y', 'Ten readings and the fitted A·exp(−t/τ) + B');
    return q({
        title: 'Fit an exponential decay by Gauss–Newton',
        text: T`Ten readings of a decaying signal were taken every $0.5\,\text{s}$, each with an independent Gaussian error of standard deviation $\sigma = ${sig}$. Fit $y = Ae^{-t/\tau} + B$ by nonlinear least squares (Gauss–Newton, damped if needed). Report $A$, $\tau$ and $B$, the standard uncertainty of $\tau$ from the covariance matrix $\sigma^2(J^\top J)^{-1}$ at the solution, and the weighted residual $\chi^2$ (7 degrees of freedom).`,
        givens: [T`$t = 0, 0.5, \ldots, 4.5\,\text{s}$`, T`$y = (${y.join(',\\ ')})$`, T`$\sigma = ${sig}$ for every reading`],
        parts: [p(T`$A$`, A, ''), p(T`$\tau$`, ta, 's'), p(T`$B$`, B, '', .01, .002), p(T`$u(\tau)$`, uTau, 's'), p(T`$\chi^2$`, chi2, '', .01, .01)],
        hints: [T`The Jacobian rows are $\left[e^{-t/\tau},\ \dfrac{At}{\tau^2}e^{-t/\tau},\ 1\right]$. Each step solves $J^\top J\,\delta = J^\top r$ for the residuals $r$.`, T`Start from $A \approx y_0 - y_9$, $B \approx y_9$ and $\tau \approx 1\,\text{s}$; add damping (Levenberg–Marquardt) if a step increases $\chi^2$.`, T`For fixed $\tau$ the model is linear in $A$ and $B$, which gives an independent check: scan $\tau$ and solve for $A$ and $B$ by linear least squares.`],
        steps: [T`Converged: $A = ${tf(A)}$, $\tau = ${tf(ta)}\,\text{s}$, $B = ${tf(B)}$.`, T`$\sigma^2(J^\top J)^{-1}$ gives $u(A) = ${tf(Math.sqrt(sig * sig * inv[0][0]))}$, $u(\tau) = ${tf(uTau)}\,\text{s}$, $u(B) = ${tf(Math.sqrt(sig * sig * inv[2][2]))}$.`, T`$\chi^2 = ${tf(chi2)}$ for 7 degrees of freedom${chi2 < 14 && chi2 > 1.5 ? ', consistent with the stated σ' : ''}.`],
        idea: 'Nonlinear least squares is linear least squares repeated on a linearised model; the final Jacobian also delivers the parameter uncertainties.',
        diagram, prerequisites: 'Least squares; Jacobians; covariance.',
        verify: () => { // variable projection over τ with golden-section search; uncertainties from a numerical Jacobian
            const lin = ta2 => { const e = t.map(tt => Math.exp(-tt / ta2)), S = [[e.reduce((s, v) => s + v * v, 0), e.reduce((s, v) => s + v, 0)], [e.reduce((s, v) => s + v, 0), 10]], rhs = [e.reduce((s, v, k) => s + v * y[k], 0), y.reduce((s, v) => s + v, 0)], [a, b] = NUM.solve(S, rhs); return [a, ta2, b]; };
            let lo = Math.log(.05), hi = Math.log(30); const f = u => chi(lin(Math.exp(u))), gr = (Math.sqrt(5) - 1) / 2;
            let bestU = lo, bestV = Infinity; for (let k = 0; k <= 400; k++) { const u = lo + (hi - lo) * k / 400, v = f(u); if (v < bestV) { bestV = v; bestU = u; } }
            let a = bestU - (hi - lo) / 400, b = bestU + (hi - lo) / 400; for (let k = 0; k < 200; k++) { const c = b - gr * (b - a), d = a + gr * (b - a); if (f(c) < f(d)) b = d; else a = c; }
            const best = lin(Math.exp((a + b) / 2)), h = best.map(v => 1e-6 * Math.max(1e-2, Math.abs(v)));
            const Jn = t.map(tt => [0, 1, 2].map(i => (model(best.map((v, k) => v + (k === i ? h[i] : 0)), tt) - model(best.map((v, k) => v - (k === i ? h[i] : 0)), tt)) / (2 * h[i]))); // numerical Jacobian
            const N2 = [0, 1, 2].map(i => [0, 1, 2].map(j => Jn.reduce((s, row) => s + row[i] * row[j], 0))), cov = [0, 1, 2].map(c => NUM.solve(N2, [0, 1, 2].map(k => +(k === c))).map(v => sig * sig * v));
            return [best[0], best[1], best[2], Math.sqrt(cov[1][1]), chi(best)];
        }
    });
}
