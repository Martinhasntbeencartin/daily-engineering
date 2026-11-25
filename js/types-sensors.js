/* Sensors & estimation: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (bisection, numerical integration, QR, search). */
const SENSORS_READING = {title: 'Feedback Control Systems (MIT OpenCourseWare 16.30)', url: 'https://ocw.mit.edu/courses/16-30-feedback-control-systems-fall-2010/'};
addTypes('sensors', 'university', sensorsThermocouple, sensorsAccelerometer, sensorsUltrasonic);
addTypes('sensors', 'challenge', sensorsAllan, sensorsDeadReckoning, sensorsTilt);
addTypes('sensors', 'expert', sensorsEKFUpdate);
addTypes('sensors', 'mastery', sensorsMagCal);

const GRAV = 9.80665;

/* Level 2: a thermocouple with thermistor cold-junction compensation, read by a 12-bit ADC. */
function sensorsThermocouple(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'thermocouple', date, SENSORS_READING), p = part, R25 = 10000;
    const types = [['K', 41, 1250], ['J', 52, 750], ['T', 43, 350], ['E', 68, 900]];
    const [[[tc, S, Tmax], Th, Tcj], beta] = grid(product(types, steps(50, 800, 25), [15, 20, 25, 30]).filter(([[, , mx], th]) => th <= mx), [3380, 3435, 3950]);
    const Rth = Math.round(R25 * Math.exp(beta * (1 / (Tcj + 273.15) - 1 / 298.15))), Tc = 1 / (1 / 298.15 + Math.log(Rth / R25) / beta) - 273.15;
    const V = Math.round(S * (Th - Tcj)) / 1000, Thot = V * 1000 / S + Tc, unc = V * 1000 / S, G = 3.3 / (S * Tmax * 1e-6), lsb = Tmax / 4096;
    const diagram = drawing(wire('M80 90H300M80 170H300') + dot(80, 130) + wire('M80 90Q60 130 80 170') + dt(60, 70, 'hot junction') + dt(190, 80, 'type ' + tc) + wire('M300 70h80v120h-80z') + dt(340, 60, 'terminal block') +
        element('R', 340, 150, 340, 190, '') + note(352, 178, 'NTC') + wire('M380 90H460M380 170H460') + wire('M460 90v80l90 -40z') + dt(495, 136, 'G') + arrow(550, 130, 600, 130) + wire('M600 100h70v60h-70z') + dt(635, 136, 'ADC'),
        'A thermocouple runs from the hot junction to a terminal block whose temperature is measured by an NTC thermistor; an amplifier of gain G feeds a 12-bit ADC', 230);
    return q({
        title: 'Read a thermocouple with cold-junction compensation',
        text: T`A type ${tc} thermocouple (take a constant Seebeck coefficient of $${S}\,\mu\text{V}/^\circ\text{C}$) reads $${tf(V, 6)}\,\text{mV}$. Its cold junction sits on a terminal block measured by a $10\,\text{k}\Omega$ NTC thermistor ($\beta = ${beta}\,\text{K}$, $R_{25} = 10\,\text{k}\Omega$) that reads $${Rth}\,\Omega$. Find the terminal-block temperature, the hot-junction temperature, and the (wrong) temperature you would report by ignoring the cold junction. An amplifier must map the thermocouple's full range ($0$ to $${Tmax}\,{}^\circ\text{C}$, referred to $0\,{}^\circ\text{C}$) onto a $3.3\,\text{V}$, 12-bit ADC: find its gain and the temperature step per LSB.`,
        givens: [T`Type ${tc}: $${S}\,\mu\text{V}/^\circ\text{C}$, range to $${Tmax}\,{}^\circ\text{C}$`, T`$V = ${tf(V, 6)}\,\text{mV}$`, T`Thermistor $${Rth}\,\Omega$, $\beta = ${beta}\,\text{K}$, $R_{25} = 10\,\text{k}\Omega$`],
        parts: [p('Terminal-block temperature', Tc, '°C'), p('Hot-junction temperature', Thot, '°C'), p('Reading without compensation', unc, '°C'), p('Amplifier gain', G, 'V/V'), p('Temperature per LSB', lsb, '°C')],
        hints: [T`$\dfrac{1}{T} = \dfrac{1}{298.15} + \dfrac{1}{\beta}\ln\dfrac{R}{R_{25}}$ with $T$ in kelvin.`, T`A thermocouple measures only the difference: $V = S(T_{\text{hot}} - T_{\text{cold}})$, so $T_{\text{hot}} = V/S + T_{\text{cold}}$.`, T`Full scale: $S\cdot${Tmax}\,{}^\circ\text{C}$ must become $3.3\,\text{V}$; one LSB is $1/4096$ of the range.`],
        steps: [T`$T_{\text{cold}} = ${tf(Tc)}\,{}^\circ\text{C}$.`, T`$V/S = ${tf(unc)}\,{}^\circ\text{C}$, so $T_{\text{hot}} = ${tf(Thot)}\,{}^\circ\text{C}$; ignoring the cold junction would report $${tf(unc)}\,{}^\circ\text{C}$.`, T`$G = \dfrac{3.3}{${S}\times10^{-6}\times${Tmax}} = ${tf(G)}$ and one LSB is $${tf(lsb)}\,{}^\circ\text{C}$.`],
        idea: 'A thermocouple measures a temperature difference; it reads absolute temperature only once you know, and add, the cold-junction temperature.',
        diagram, prerequisites: 'Thermocouples; logarithms; ADC resolution.',
        verify: () => { // bisection on the thermistor and thermocouple equations
            const tcold = NUM.bisect(t => R25 * Math.exp(beta * (1 / (t + 273.15) - 1 / 298.15)) - Rth, -40, 120, 200), thot = NUM.bisect(t => S * (t - tcold) - V * 1000, -100, 2000, 200);
            return [tcold, thot, thot - tcold, 3.3 / (S * 1e-6 * Tmax), Tmax / 4096];
        }
    });
}

/* Level 2: a spring–mass accelerometer: sensitivity, frequency response and usable bandwidth. */
function sensorsAccelerometer(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'accelerometer', date, SENSORS_READING), p = part;
    const [mug, k, z, rf] = grid([.5, 1, 2, 5], [.5, 1, 2, 5, 10], [.3, .5, .6, .7, .8], [.1, .2, .3, .5]), m = mug * 1e-9;
    const wn = Math.sqrt(k / m), fn = wn / (2 * Math.PI), xg = GRAV / (wn * wn), Hm = r => 1 / Math.hypot(1 - r * r, 2 * z * r), err = 100 * (Hm(rf) - 1), lag = Math.atan2(2 * z * rf, 1 - rf * rf) * 180 / Math.PI;
    const peak = z < Math.SQRT1_2 ? 1 / (2 * z * Math.sqrt(1 - z * z)) : 1, M = peak > 1.05 ? 1.05 : .95, bq = 4 * z * z - 2, cq = 1 - 1 / (M * M), disc = Math.sqrt(bq * bq - 4 * cq);
    const u = M > 1 ? (-bq - disc) / 2 : (-bq + disc) / 2, f5 = fn * Math.sqrt(u);
    const diagram = drawing(wire('M120 40H600V230H120z') + dt(360, 30, 'case (accelerates with the body)') + wire('M120 135H170l10 -20 20 40 20 -40 20 40 20 -40 10 20H300') + dt(230, 98, 'k') + wire('M300 90h120v90H300z') + dt(360, 141, 'm') +
        wire('M420 135H470M470 115v40M480 112v46M480 135H600') + dt(475, 190, 'c') + arrow(360, 205, 420, 205) + dt(390, 224, 'x (relative)'), 'Accelerometer model: a proof mass m inside the case, held by a spring k and a damper c; its displacement x relative to the case measures acceleration', 245);
    return q({
        title: 'How fast can a spring–mass accelerometer follow?',
        text: T`A MEMS accelerometer has a proof mass of $${mug}\,\mu\text{g}$ on a suspension of stiffness $${k}\,\text{N/m}$, with damping ratio $\zeta = ${z}$. The relative displacement $x$ of the mass measures the case acceleration: $\dfrac{X}{A}(s) = \dfrac{-1}{s^2 + 2\zeta\omega_ns + \omega_n^2}$. Find the natural frequency, the static displacement for $1\,g$, and at $${rf}f_n$ the amplitude error (relative to the static sensitivity) and the phase lag. Finally find the bandwidth over which the amplitude stays within $\pm5\%$ of its static value.`,
        givens: [T`$m = ${mug}\,\mu\text{g}$, $k = ${k}\,\text{N/m}$, $\zeta = ${z}$`, T`Test frequency $${rf}f_n$`, T`$g = 9.80665\,\text{m/s}^2$`],
        parts: [p(T`$f_n$`, fn / 1e3, 'kHz'), p(T`Displacement for $1\,g$`, xg * 1e9, 'nm'), p(T`Amplitude error at $${rf}f_n$`, err, '%', .01, .01), p(T`Phase lag at $${rf}f_n$`, lag, '°'), p('±5% bandwidth', f5 / 1e3, 'kHz')],
        hints: [T`$\omega_n = \sqrt{k/m}$; at DC $|X| = A/\omega_n^2$.`, T`With $r = f/f_n$: $\left|\dfrac{X}{X_{\text{static}}}\right| = \dfrac{1}{\sqrt{(1 - r^2)^2 + (2\zeta r)^2}}$, lag $= \operatorname{atan2}(2\zeta r,\ 1 - r^2)$.`, T`If the resonant peak exceeds 1.05 the band ends where the gain first reaches 1.05; otherwise where it falls to 0.95. Either way it is a quadratic in $r^2$.`],
        steps: [T`$\omega_n = ${tf(wn)}\,\text{rad/s}$, $f_n = ${tf(fn / 1e3)}\,\text{kHz}$.`, T`$x = g/\omega_n^2 = ${tf(xg * 1e9)}\,\text{nm}$ per $g$.`, T`At $r = ${rf}$: gain $${tf(Hm(rf))}$ (error $${tf(err)}\%$), lag $${tf(lag)}^\circ$.`, T`${peak > 1.05 ? T`The peak is $${tf(peak)} > 1.05$, so the band ends where the gain reaches 1.05` : T`The gain never exceeds 1.05, so the band ends where it falls to 0.95`}: $r = ${tf(Math.sqrt(u))}$, i.e. $${tf(f5 / 1e3)}\,\text{kHz}$.`],
        idea: 'A stiffer suspension widens the bandwidth but shrinks the displacement per g: an accelerometer trades sensitivity for speed through ω².',
        diagram, prerequisites: 'Second-order systems; frequency response.',
        verify: () => { // scan the gain upward from DC for the first ±5% exit, then bisect
            let r = 0; while (Math.abs(Hm(r + .001) - 1) <= .05) r += .001;
            const rr = NUM.bisect(x => Math.abs(Hm(x) - 1) - .05, r, r + .001, 100), w = Math.sqrt(k / m);
            return [w / (2 * Math.PI) / 1e3, GRAV / (w * w) * 1e9, 100 * (Hm(rf) - 1), Math.atan2(2 * z * rf, 1 - rf * rf) * 180 / Math.PI, rr * w / (2 * Math.PI) / 1e3];
        }
    });
}

/* Level 2: ultrasonic ranging: the speed of sound and its temperature error. */
function sensorsUltrasonic(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ultrasonic', date, SENSORS_READING), p = part;
    const c = T0 => 331.3 * Math.sqrt(1 + T0 / 273.15);
    const [[tms, Tc, R]] = grid(product(steps(1, 30, 1), [-10, 0, 10, 20, 30, 40], [2, 4, 5, 8]).filter(([t, T0, R]) => c(T0) * t / 2000 <= R));
    const cs_ = c(Tc), d = cs_ * tms / 2000, d20 = c(20) * tms / 2000, err = (d20 - d) * 1000, dt1 = 2 * .001 / cs_ * 1e6, rate = cs_ / (2 * R);
    const diagram = drawing(wire('M80 90h70v100H80z') + dt(115, 145, 'Tx/Rx') + wire('M560 60V220') + dt(600, 140, 'target') + arrow(160, 120, 550, 120) + arrow(550, 160, 160, 160) + dt(355, 106, 'ping') + dt(355, 186, 'echo') +
        guide('M150 220H560') + dt(355, 240, 'd = c·t/2'), 'An ultrasonic transducer sends a ping to a target and times the echo; the distance is half the round trip times the speed of sound', 250);
    return q({
        title: 'Ultrasonic ranging and the temperature of the air',
        text: T`An ultrasonic sensor hears its echo $${tms}\,\text{ms}$ after the ping. The air is at $${Tc}\,{}^\circ\text{C}$, and the speed of sound is $c = 331.3\sqrt{1 + T/273.15}\,\text{m/s}$ ($T$ in $^\circ\text{C}$). Find $c$ and the distance. How large an error (in mm) would assuming $20\,{}^\circ\text{C}$ cause? What timing resolution is needed to resolve $1\,\text{mm}$ of distance? If the sensor must hear echoes from up to $${R}\,\text{m}$ before pinging again, what is its highest ping rate?`,
        givens: [T`Echo time $${tms}\,\text{ms}$`, T`Air at $${Tc}\,{}^\circ\text{C}$`, T`Maximum range $${R}\,\text{m}$`],
        parts: [p('Speed of sound', cs_, 'm/s'), p('Distance', d, 'm'), p('Error from assuming 20 °C', err, 'mm', .01, .01), p('Timing resolution for 1 mm', dt1, 'µs'), p('Highest ping rate', rate, 'Hz')],
        hints: [T`The sound travels to the target and back: $d = ct/2$.`, T`Assuming the wrong temperature scales the distance by $c(20)/c(T)$.`, T`$\Delta d = c\,\Delta t/2$; the ping period must exceed the round trip $2R/c$.`],
        steps: [T`$c = ${tf(cs_)}\,\text{m/s}$, so $d = ${tf(cs_)}\times${tms / 1000}/2 = ${tf(d)}\,\text{m}$.`, T`At $20\,{}^\circ\text{C}$, $c = ${tf(c(20))}\,\text{m/s}$ gives $${tf(d20)}\,\text{m}$: an error of $${tf(err)}\,\text{mm}$.`, T`$\Delta t = 2\times0.001/c = ${tf(dt1)}\,\mu\text{s}$.`, T`$f_{\max} = c/(2R) = ${tf(rate)}\,\text{Hz}$.`],
        idea: 'Time of flight is easy to measure precisely; the accuracy is limited by how well you know the speed of the wave.',
        diagram, prerequisites: 'Speed, distance and time; square roots.',
        verify: () => { // the speed of sound from the absolute temperature (ideal gas: c ∝ √T)
            const cg = T0 => 331.3 * Math.sqrt((T0 + 273.15) / 273.15), s = cg(Tc); // c ∝ √(absolute temperature), 331.3 m/s at 0 °C
            return [s, s * tms / 2000, (cg(20) - s) * tms / 2, 2e-3 / s * 1e6, s / (2 * R)];
        }
    });
}

/* Level 3: the Allan deviation of a gyroscope: angle random walk against rate random walk. */
function sensorsAllan(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'allan', date, SENSORS_READING), p = part;
    const [N, K, tq] = grid([.05, .1, .2, .3, .5, 1, 2, 3], [.5, 1, 2, 5, 10, 20, 50, 100], [1, 3, 10, 30, 100, 300, 1000]);
    const Ns = N / 60, Ks = K / 216000, sig = t => 3600 * Math.sqrt(Ns * Ns / t + Ks * Ks * t / 3), white = 3600 * Ns / Math.sqrt(tq), tst = Math.sqrt(3) * Ns / Ks, smin = sig(tst), arw = N * Math.sqrt(10 / 60);
    const diagram = drawing(wire('M90 30V220H660') + note(96, 24, 'log σ(τ)') + dt(620, 244, 'log τ') + wire('M110 60L380 190') + dt(200, 92, 'slope −½ (N)') + wire('M380 190L640 70') + dt(560, 92, 'slope +½ (K)') + `<path d="M110 62Q380 260 640 72" stroke="#aa492a" stroke-width="2.5"/>` +
        dot(380, 160) + dt(380, 145, 'minimum'), 'Allan deviation on log–log axes: a slope of minus one half from angle random walk at short averaging times, plus one half from rate random walk at long times, with a minimum between', 255);
    return q({
        title: 'Read a gyroscope’s Allan deviation',
        text: T`A gyroscope has angle random walk $N = ${N}\,{}^\circ/\sqrt{\text{h}}$ and rate random walk $K = ${K}\,{}^\circ/\text{h}/\sqrt{\text{h}}$. Its Allan variance is $\sigma^2(\tau) = \dfrac{N^2}{\tau} + \dfrac{K^2\tau}{3}$ (consistent units). Find the Allan deviation at $\tau = ${tq}\,\text{s}$ in $^\circ/\text{h}$, and the white-noise part alone. Find the averaging time that minimises $\sigma(\tau)$ and that minimum. Finally, what angle error (one sigma) does the angle random walk alone build up over 10 minutes of integration?`,
        givens: [T`$N = ${N}\,{}^\circ/\sqrt{\text{h}}$`, T`$K = ${K}\,{}^\circ/\text{h}/\sqrt{\text{h}}$`, T`Averaging time $\tau = ${tq}\,\text{s}$`],
        parts: [p(T`$\sigma(${tq}\,\text{s})$`, sig(tq), '°/h'), p('White-noise part', white, '°/h'), p('Optimal averaging time', tst, 's'), p('Minimum Allan deviation', smin, '°/h'), p('Angle error after 10 min', arw, '°')],
        hints: [T`Convert to seconds: $N = ${N}/60\ ^\circ/\sqrt{\text{s}}$ and $K = ${K}/(3600\cdot60)\ ^\circ/\text{s}/\sqrt{\text{s}}$; multiply the deviation by 3600 to get $^\circ/\text{h}$.`, T`$\dfrac{d\sigma^2}{d\tau} = -\dfrac{N^2}{\tau^2} + \dfrac{K^2}{3} = 0$ gives $\tau^* = \sqrt3\,N/K$, and then $\sigma_{\min}^2 = 2NK/\sqrt3$.`, T`Angle random walk grows as $N\sqrt t$.`],
        steps: [T`$N = ${tf(Ns)}\,{}^\circ/\sqrt{\text{s}}$, $K = ${tf(Ks)}\,{}^\circ/\text{s}/\sqrt{\text{s}}$.`, T`$\sigma(${tq}) = ${tf(sig(tq))}\,{}^\circ/\text{h}$, of which white noise gives $${tf(white)}\,{}^\circ/\text{h}$.`, T`$\tau^* = \sqrt3\,N/K = ${tf(tst)}\,\text{s}$ and $\sigma_{\min} = ${tf(smin)}\,{}^\circ/\text{h}$.`, T`After 10 minutes: $N\sqrt{1/6\,\text{h}} = ${tf(arw)}^\circ$.`],
        idea: 'Averaging beats white noise down as 1/√τ until slow drift takes over; the Allan deviation shows where that crossover is and how good the sensor can get.',
        diagram, prerequisites: 'Noise processes; logarithmic plots; minimisation.',
        verify: () => { // everything in hours instead of seconds, and the minimum by golden-section search on log τ
            const sh = th => Math.sqrt(N * N / th + K * K * th / 3), gr = (Math.sqrt(5) - 1) / 2; let lo = Math.log(1e-6), hi = Math.log(1e3);
            for (let i = 0; i < 200; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (sh(Math.exp(c)) < sh(Math.exp(d))) hi = d; else lo = c; }
            const tm = Math.exp((lo + hi) / 2);
            return [sh(tq / 3600), N / Math.sqrt(tq / 3600), tm * 3600, sh(tm), N * Math.sqrt(1 / 6)];
        }
    });
}

/* Level 3: how sensor biases grow into position error in dead reckoning (small angles). */
function sensorsDeadReckoning(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'dead-reckoning', date, SENSORS_READING), p = part;
    const [b, eps, Tf] = grid([.05, .1, .2, .5, 1, 2, 5], [.5, 1, 2, 5, 10, 20, 50], [10, 20, 30, 60, 90, 120, 300, 600]);
    const ab = b * 1e-3 * GRAV, er = eps * Math.PI / 180 / 3600, pa = ab * Tf * Tf / 2, pg = GRAV * er * Tf ** 3 / 6, vT = ab * Tf + GRAV * er * Tf * Tf / 2, tx = 3 * ab / (GRAV * er);
    const diagram = drawing(wire('M80 200H660') + dt(650, 222, 't') + note(84, 36, 'position error') + wire('M80 200V40') + `<path d="M80 200Q300 180 640 90" stroke="#315740"/>` + dt(560, 132, '½ b t²') + `<path d="M80 200Q450 200 640 50" stroke="#aa492a" stroke-width="2.5"/>` +
        dt(560, 58, '⅙ g ε t³') + dt(360, 244, 'accelerometer bias grows as t², gyro bias (through tilt) as t³'), 'Position error against time: the accelerometer-bias term grows with t squared, the gyro-bias term with t cubed and eventually dominates', 255);
    return q({
        title: 'Why gyro bias dominates dead reckoning',
        text: T`An inertial unit dead-reckons horizontally for $${Tf}\,\text{s}$. Its accelerometer has a bias of $${b}\,\text{m}g$, which integrates twice into position. Its gyroscope has a bias of $${eps}\,{}^\circ/\text{h}$; the resulting tilt error $\varepsilon t$ projects gravity into the horizontal as an acceleration error $g\varepsilon t$ (small angles). Find the position error after $${Tf}\,\text{s}$ caused by each bias, the total position error and velocity error (the two acting in the same direction), and the time at which the two position contributions are equal.`,
        givens: [T`Accelerometer bias $${b}\,\text{m}g$`, T`Gyro bias $${eps}\,{}^\circ/\text{h}$`, T`$T = ${Tf}\,\text{s}$, $g = 9.80665\,\text{m/s}^2$`],
        parts: [p('Position error from the accelerometer', pa, 'm'), p('Position error from the gyro', pg, 'm'), p('Total position error', pa + pg, 'm'), p('Total velocity error', vT, 'm/s'), p('Time when the two are equal', tx, 's')],
        hints: [T`A constant acceleration error $b$ gives $\tfrac12bt^2$.`, T`An acceleration error that grows as $g\varepsilon t$ integrates to $\tfrac12g\varepsilon t^2$ in velocity and $\tfrac16g\varepsilon t^3$ in position (ε in rad/s).`, T`Equal when $\tfrac12bt^2 = \tfrac16g\varepsilon t^3$, i.e. $t = 3b/(g\varepsilon)$.`],
        steps: [T`$b = ${tf(ab)}\,\text{m/s}^2$, $\varepsilon = ${tf(er)}\,\text{rad/s}$.`, T`Accelerometer: $\tfrac12bT^2 = ${tf(pa)}\,\text{m}$; gyro: $\tfrac16g\varepsilon T^3 = ${tf(pg)}\,\text{m}$; total $${tf(pa + pg)}\,\text{m}$.`, T`Velocity: $bT + \tfrac12g\varepsilon T^2 = ${tf(vT)}\,\text{m/s}$.`, T`Equal at $t = 3b/(g\varepsilon) = ${tf(tx)}\,\text{s}$.`],
        idea: 'Inertial errors grow polynomially with time, and the gyro’s higher power wins in the end: navigation-grade units are judged by their gyros.',
        diagram, prerequisites: 'Integration; unit conversion; small-angle approximation.',
        verify: () => { // integrate the error dynamics numerically
            const sa = ctrlSim((t, x) => [x[1], ab], [0, 0], Tf / 4000, Tf), sg = ctrlSim((t, x) => [x[1], GRAV * er * t], [0, 0], Tf / 4000, Tf);
            return [sa[0], sg[0], sa[0] + sg[0], sa[1] + sg[1], NUM.bisect(t => ab * t * t / 2 - GRAV * er * t ** 3 / 6, 1e-6 + tx / 2, tx * 2, 200)];
        }
    });
}

/* Level 3: roll and pitch from a three-axis accelerometer, and the effect of a bias. */
function sensorsTilt(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'tilt', date, SENSORS_READING), p = part, rad = Math.PI / 180;
    const noises = [[.002, -.001, .001], [-.001, .002, -.002], [.001, .001, .002]];
    const [roll, pitch, bmg, ni] = grid(steps(-60, 60, 10), steps(-40, 40, 10), [5, 10, 20, 50], [0, 1, 2]);
    const a = [-Math.sin(pitch * rad), Math.sin(roll * rad) * Math.cos(pitch * rad), Math.cos(roll * rad) * Math.cos(pitch * rad)].map((v, i) => +(v + noises[ni][i]).toFixed(3));
    const ang = ([x, y, z]) => [Math.atan2(y, z) / rad, Math.atan2(-x, Math.hypot(y, z)) / rad], [phi, th] = ang(a), mag = Math.hypot(...a), dth = ang([a[0] + bmg / 1000, a[1], a[2]])[1] - th, tilt = Math.acos(a[2] / mag) / rad;
    const diagram = drawing(wire('M300 70l140 -30 80 60 -140 30z') + wire('M300 70v60l140 30v-60M440 160l80 -30V100') + arrow(370, 100, 370, 30) + dt(370, 22, 'z') + arrow(370, 100, 470, 80) + dt(486, 80, 'x') + arrow(370, 100, 300, 150) + dt(290, 166, 'y') +
        arrow(600, 60, 600, 200) + dt(626, 140, 'g') + dt(360, 236, 'at rest the sensor measures gravity: a = (−sin θ, sin φ cos θ, cos φ cos θ) g'), 'A tilted sensor board with its x, y and z axes, and gravity pointing straight down', 250);
    return q({
        title: 'Roll and pitch from an accelerometer',
        text: T`A board at rest reads $a = (${a.join(',\\ ')})\,g$ on its accelerometer's $x$, $y$ and $z$ axes. At rest it measures only gravity, $a = g(-\sin\theta,\ \sin\phi\cos\theta,\ \cos\phi\cos\theta)$ for roll $\phi$ and pitch $\theta$. Find the roll $\phi = \operatorname{atan2}(a_y, a_z)$ and the pitch $\theta = \operatorname{atan2}\left(-a_x, \sqrt{a_y^2 + a_z^2}\right)$. How far is $|a|$ from $1\,g$ (in m$g$)? If the $x$ axis had an extra bias of $+${bmg}\,\text{m}g$, by how much would the computed pitch change? Finally give the total tilt of the board's $z$ axis from vertical.`,
        givens: [T`$a = (${a.join(',\\ ')})\,g$`, T`Bias case: $+${bmg}\,\text{m}g$ on $x$`],
        parts: [p(T`Roll $\phi$`, phi, '°', .01, .01), p(T`Pitch $\theta$`, th, '°', .01, .01), p(T`$|a| - 1\,g$`, (mag - 1) * 1000, 'mg', .01, .05), p('Pitch change from the bias', dth, '°', .01, .005), p('Tilt from vertical', tilt, '°', .01, .01)],
        hints: [T`Roll does not depend on $a_x$; pitch uses the full horizontal-plane magnitude $\sqrt{a_y^2 + a_z^2}$.`, T`A reading slightly off $1\,g$ can be noise, scale error or real acceleration; the angle formulas use ratios, so they are not affected by an overall scale.`, T`A bias on $x$ shifts the pitch by roughly $\dfrac{b}{g\cos\theta}$ radians; recompute exactly. The tilt is $\arccos(a_z/|a|)$.`],
        steps: [T`$\phi = \operatorname{atan2}(${a[1]}, ${a[2]}) = ${tf(phi)}^\circ$.`, T`$\theta = \operatorname{atan2}(${tf(-a[0])}, ${tf(Math.hypot(a[1], a[2]))}) = ${tf(th)}^\circ$.`, T`$|a| = ${tf(mag, 6)}\,g$, i.e. $${tf((mag - 1) * 1000)}\,\text{m}g$ from $1\,g$.`, T`With the bias, $\theta$ becomes $${tf(th + dth)}^\circ$: a change of $${tf(dth)}^\circ$.`, T`Tilt $= \arccos(a_z/|a|) = ${tf(tilt)}^\circ$.`],
        idea: 'Gravity gives an accelerometer an absolute vertical reference, so static tilt is just trigonometry — but every milli-g of bias costs about 0.06° of angle.',
        diagram, prerequisites: 'Rotations; inverse trigonometric functions.',
        verify: () => { // fit (φ, θ) by searching for the gravity direction closest to the normalised reading
            const fit = v => { const m = Math.hypot(...v), n = v.map(x => x / m); let best = [0, 0], bd = Infinity;
                for (let s = 10; s >= 1e-7; s /= 10) { const [p0, t0] = best; for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) { const ph = p0 + i * s, tt = t0 + j * s, u = [-Math.sin(tt * rad), Math.sin(ph * rad) * Math.cos(tt * rad), Math.cos(ph * rad) * Math.cos(tt * rad)], dd = u.reduce((acc, x, k) => acc + (x - n[k]) ** 2, 0); if (dd < bd) { bd = dd; best = [ph, tt]; } } }
                return best; };
            const [f1, f2] = fit(a), fb = fit([a[0] + bmg / 1000, a[1], a[2]]), mg = Math.hypot(...a);
            return [f1, f2, (mg - 1) * 1000, fb[1] - f2, Math.acos(Math.cos(f1 * rad) * Math.cos(f2 * rad)) / rad];
        }
    });
}

/* Level 4 (expert): one extended-Kalman-filter update with a range and bearing to a landmark. */
function sensorsEKFUpdate(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ekf-update', date, SENSORS_READING), p = part, rad = Math.PI / 180;
    const [lx, ly, sx, sy, sr, sbd, dr, dbd] = grid([5, 10, 15], [-10, -5, 5, 10], [.5, 1, 2], [.5, 1, 2], [.1, .2, .5], [1, 2, 5], [-.3, .2, .4], [-2, 1, 3]);
    const rh = Math.hypot(lx, ly), bh = Math.atan2(ly, lx), zr = +(rh + dr).toFixed(3), zb = +((bh / rad) + dbd).toFixed(2);
    const H = [[-lx / rh, -ly / rh], [ly / (rh * rh), -lx / (rh * rh)]], P = [[sx * sx, 0], [0, sy * sy]], R = [[sr * sr, 0], [0, (sbd * rad) ** 2]], nu = [zr - rh, (zb - bh / rad) * rad];
    const HP = NUM.matMul(H, P), S = NUM.add(NUM.matMul(HP, [[H[0][0], H[1][0]], [H[0][1], H[1][1]]]), R), Sinv = [0, 1].map(c => NUM.solve(S, [0, 1].map(k => +(k === c)))), Si = [[Sinv[0][0], Sinv[1][0]], [Sinv[0][1], Sinv[1][1]]];
    const K = NUM.matMul(NUM.matMul(P, [[H[0][0], H[1][0]], [H[0][1], H[1][1]]]), Si), xp = NUM.matVec(K, nu), Pp = NUM.add(P, NUM.scale(NUM.matMul(K, HP), -1)), nis = nu[0] * (Si[0][0] * nu[0] + Si[0][1] * nu[1]) + nu[1] * (Si[1][0] * nu[0] + Si[1][1] * nu[1]);
    // Schematic (not to scale): the landmark sits at the true bearing on a fixed-length line, labelled to its right.
    const Lx = 120 + 420 * Math.cos(bh), Ly = 140 - 120 * Math.sin(bh), mx = 120 + .6 * (Lx - 120), my = 140 + .6 * (Ly - 140);
    const diagram = drawing(ring(120, 140, 10) + dt(120, 172, 'robot (0, 0)') + wire(`M${Lx - 8} ${Ly - 8}l16 16m0 -16l-16 16`) + note(Lx + 16, Ly + 5, `landmark (${lx}, ${ly})`) +
        guide(`M120 140L${Lx} ${Ly}`) + wire('M120 140H320') + note(200, ly > 0 ? 162 : 128, 'bearing β') + note(mx + 6, my + (ly > 0 ? -20 : 30), 'range r'), 'The robot at the origin observes a landmark at a range r and a bearing β measured from the x axis', 260);
    return q({
        title: 'One EKF update from a range and bearing',
        text: T`A robot's position estimate is $(0, 0)$ with covariance $P = \operatorname{diag}(${sx}^2, ${sy}^2)\,\text{m}^2$ (its heading is known to be along $x$). It sees a landmark known to be at $(${lx}, ${ly})\,\text{m}$, measuring range $r = ${zr}\,\text{m}$ and bearing $\beta = ${zb}^\circ$ from the $x$ axis, with independent noise $\sigma_r = ${sr}\,\text{m}$ and $\sigma_\beta = ${sbd}^\circ$. Perform one extended-Kalman-filter update: find the predicted range, the updated position $(\hat x, \hat y)$, the posterior standard deviations of $x$ and $y$, and the normalised innovation squared $\nu^\top S^{-1}\nu$ (use radians for the bearing).`,
        givens: [T`Prior $(0, 0)$, $P = \operatorname{diag}(${sx}^2, ${sy}^2)$`, T`Landmark $(${lx}, ${ly})$; $z = (${zr}\,\text{m},\ ${zb}^\circ)$`, T`$\sigma_r = ${sr}\,\text{m}$, $\sigma_\beta = ${sbd}^\circ$`],
        parts: [p('Predicted range', rh, 'm'), p(T`Updated $\hat x$`, xp[0], 'm', .01, .001), p(T`Updated $\hat y$`, xp[1], 'm', .01, .001), p(T`Posterior $\sigma_x$`, Math.sqrt(Pp[0][0]), 'm'), p(T`Posterior $\sigma_y$`, Math.sqrt(Pp[1][1]), 'm'), p('Normalised innovation squared', nis, '')],
        hints: [T`$h(x, y) = \left(\sqrt{(l_x - x)^2 + (l_y - y)^2},\ \operatorname{atan2}(l_y - y,\ l_x - x)\right)$. Its Jacobian at the prior has rows $\left(-\tfrac{l_x}{r}, -\tfrac{l_y}{r}\right)$ and $\left(\tfrac{l_y}{r^2}, -\tfrac{l_x}{r^2}\right)$.`, T`$S = HPH^\top + R$, $K = PH^\top S^{-1}$, $\hat x^+ = \hat x + K\nu$, $P^+ = (I - KH)P$, with $\nu = z - h(\hat x)$.`, T`The bearing innovation and $\sigma_\beta$ must be in radians before they enter $S$.`],
        steps: [T`$\hat r = ${tf(rh)}\,\text{m}$, $\hat\beta = ${tf(bh / rad)}^\circ$; $\nu = (${tf(nu[0])}\,\text{m},\ ${tf(nu[1])}\,\text{rad})$.`, T`$H = \begin{pmatrix}${tf(H[0][0])} & ${tf(H[0][1])}\\ ${tf(H[1][0])} & ${tf(H[1][1])}\end{pmatrix}$, $S = \begin{pmatrix}${tf(S[0][0])} & ${tf(S[0][1])}\\ ${tf(S[1][0])} & ${tf(S[1][1])}\end{pmatrix}$.`, T`$K\nu = (${tf(xp[0])},\ ${tf(xp[1])})\,\text{m}$.`, T`$\sigma_x^+ = ${tf(Math.sqrt(Pp[0][0]))}\,\text{m}$, $\sigma_y^+ = ${tf(Math.sqrt(Pp[1][1]))}\,\text{m}$; $\nu^\top S^{-1}\nu = ${tf(nis)}$ (expect about 2 on average).`],
        idea: 'An EKF update linearises the measurement at the current estimate; range constrains the position along the line of sight, bearing across it.',
        diagram, prerequisites: 'Kalman filtering; Jacobians; 2×2 matrices.',
        verify: () => { // the information form of the update, with a numerical Jacobian
            const h = (x, y) => [Math.hypot(lx - x, ly - y), Math.atan2(ly - y, lx - x)], e = 1e-6, J = [0, 1].map(i => [0, 1].map(j => (h(j ? 0 : e, j ? e : 0)[i] - h(j ? 0 : -e, j ? -e : 0)[i]) / (2 * e)));
            const Rinv = [[1 / (sr * sr), 0], [0, 1 / (sbd * rad) ** 2]], Jt = [[J[0][0], J[1][0]], [J[0][1], J[1][1]]], info = NUM.add([[1 / (sx * sx), 0], [0, 1 / (sy * sy)]], NUM.matMul(NUM.matMul(Jt, Rinv), J));
            const Pn = [0, 1].map(c => NUM.solve(info, [0, 1].map(k => +(k === c)))), Pp2 = [[Pn[0][0], Pn[1][0]], [Pn[0][1], Pn[1][1]]], v = [zr - h(0, 0)[0], zb * rad - h(0, 0)[1]], x = NUM.matVec(NUM.matMul(Pp2, NUM.matMul(Jt, Rinv)), v);
            const S2 = NUM.add(NUM.matMul(NUM.matMul(J, [[sx * sx, 0], [0, sy * sy]]), Jt), [[sr * sr, 0], [0, (sbd * rad) ** 2]]), w = NUM.solve(S2, v);
            return [h(0, 0)[0], x[0], x[1], Math.sqrt(Pp2[0][0]), Math.sqrt(Pp2[1][1]), v[0] * w[0] + v[1] * w[1]];
        }
    });
}

/* Level 4 (mastery): hard-iron calibration of a magnetometer by an algebraic sphere fit, then a heading. */
function sensorsMagCal(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'mag-cal', date, SENSORS_READING), p = part, rad = Math.PI / 180;
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [.577, .577, .577], [-.577, .577, -.577], [.577, -.577, -.577], [-.577, -.577, .577]].map(v => { const m = Math.hypot(...v); return v.map(x => x / m); });
    const noise = [[.2, -.1, .3, -.2, .1, -.3, .2, .1, -.2, .3], [-.3, .2, -.1, .3, -.2, .1, .2, -.3, .1, -.1], [.1, .3, -.2, -.1, .3, -.2, -.1, .2, .3, -.3]];
    const [hx, hy, hz, Rf, ni, psi] = grid([-20, -10, 5, 15, 25], [-15, 0, 10, 20], [-30, -5, 10], [30, 40, 50, 60], [0, 1, 2], steps(15, 345, 30)), h0 = [hx, hy, hz];
    const m = dirs.map((u, i) => u.map((x, k) => +(h0[k] + Rf * x + noise[(ni + k) % 3][(i + 3 * k) % 10]).toFixed(1)));
    const inc = 60 * rad, mnew = [Math.cos(psi * rad) * Math.cos(inc), -Math.sin(psi * rad) * Math.cos(inc), Math.sin(inc)].map((x, k) => +(h0[k] + Rf * x).toFixed(1));
    const rows = m.map(v => [2 * v[0], 2 * v[1], 2 * v[2], 1]), rhs = m.map(v => v[0] ** 2 + v[1] ** 2 + v[2] ** 2), NtN = [0, 1, 2, 3].map(i => [0, 1, 2, 3].map(j => rows.reduce((s, r) => s + r[i] * r[j], 0))), Ntb = [0, 1, 2, 3].map(i => rows.reduce((s, r, k) => s + r[i] * rhs[k], 0));
    const [ex, ey, ez, c] = NUM.solve(NtN, Ntb), Rh = Math.sqrt(c + ex * ex + ey * ey + ez * ez), rms = Math.sqrt(m.reduce((s, v) => s + (Math.hypot(v[0] - ex, v[1] - ey, v[2] - ez) - Rh) ** 2, 0) / m.length);
    const hd = ((Math.atan2(-(mnew[1] - ey), mnew[0] - ex) / rad) % 360 + 360) % 360;
    const diagram = drawing(ring(360, 135, 95) + `<ellipse cx="360" cy="135" rx="95" ry="28" stroke-dasharray="5 5" stroke="#83968b"/>` + dot(360, 135) + dt(360, 160, 'h (offset)') + wire('M200 230H560M200 230V40') + dt(570, 236, 'mₓ') + dt(200, 30, 'mᵧ') + dot(300, 70) + dot(450, 80) + dot(280, 190) + dot(440, 200) + dot(455, 135) + dot(265, 130) +
        arrow(360, 135, 430, 70) + note(400, 98, 'R'), 'Magnetometer readings lie on a sphere of radius R, the field strength, whose centre is displaced by the hard-iron offset h', 255);
    return q({
        title: 'Calibrate a magnetometer by fitting a sphere',
        text: T`A magnetometer is turned through many orientations in a steady field. A hard-iron offset $h$ shifts every reading, so the readings lie near a sphere $|m - h| = R$. The ten readings below (in $\mu\text{T}$) are noisy. Fit the sphere algebraically: rewrite it as $|m|^2 = 2h\cdot m + c$ with $c = R^2 - |h|^2$, which is linear in $(h_x, h_y, h_z, c)$, and solve by least squares. Find $h_x$, $h_y$, $h_z$, the field strength $R$, and the RMS radial residual $\sqrt{\tfrac1{10}\sum(|m_i - h| - R)^2}$. With the device held level, a new reading is $m = (${mnew.join(',\\ ')})$: correct it with your $h$ and give the heading $\psi = \operatorname{atan2}(-(m_y - h_y),\ m_x - h_x)$ in degrees, from 0 to 360.`,
        givens: [T`$m_i$ ($\mu$T): ${m.map(v => `$(${v.join(',\\ ')})$`).join(', ')}`, T`New level reading $(${mnew.join(',\\ ')})\,\mu\text{T}$`],
        parts: [p(T`$h_x$`, ex, 'µT', .01, .02), p(T`$h_y$`, ey, 'µT', .01, .02), p(T`$h_z$`, ez, 'µT', .01, .02), p(T`Field strength $R$`, Rh, 'µT'), p('RMS radial residual', rms, 'µT', .02, .005), p('Heading', hd, '°', .005, .05)],
        hints: [T`Each reading gives one row $[2m_x,\ 2m_y,\ 2m_z,\ 1]$ with right-hand side $|m|^2$: ten equations, four unknowns. Solve the normal equations (or use QR).`, T`$R = \sqrt{c + |h|^2}$.`, T`Subtract $h$ from the new reading before taking the angle; for a level device only the horizontal components matter.`],
        steps: [T`Least squares gives $h = (${tf(ex)},\ ${tf(ey)},\ ${tf(ez)})\,\mu\text{T}$ and $c = ${tf(c)}$.`, T`$R = ${tf(Rh)}\,\mu\text{T}$; RMS radial residual $${tf(rms)}\,\mu\text{T}$.`, T`Corrected: $(${tf(mnew[0] - ex)},\ ${tf(mnew[1] - ey)})$, so $\psi = ${tf(hd)}^\circ$.`],
        idea: 'Hard-iron error is a constant offset, so the readings trace a displaced sphere; fitting it is linear once the square is expanded.',
        diagram, prerequisites: 'Least squares; quadratic surfaces; headings.',
        verify: () => { // the same least-squares problem by modified Gram–Schmidt QR instead of normal equations
            const A = rows.map(r => r.slice()), n = 4, Qc = [], Rm = Array.from({length: n}, () => Array(n).fill(0)), cols = [0, 1, 2, 3].map(j => A.map(r => r[j]));
            for (let j = 0; j < n; j++) { let v = cols[j].slice(); for (let i = 0; i < j; i++) { Rm[i][j] = Qc[i].reduce((s, x, k) => s + x * v[k], 0); v = v.map((x, k) => x - Rm[i][j] * Qc[i][k]); } Rm[j][j] = Math.hypot(...v); Qc.push(v.map(x => x / Rm[j][j])); }
            const qb = Qc.map(col => col.reduce((s, x, k) => s + x * rhs[k], 0)), sol = Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) sol[i] = (qb[i] - Rm[i].slice(i + 1).reduce((s, x, k) => s + x * sol[i + 1 + k], 0)) / Rm[i][i];
            const [gx, gy, gz, cc] = sol, R2 = Math.sqrt(cc + gx * gx + gy * gy + gz * gz), res = Math.sqrt(m.reduce((s, v) => s + (Math.hypot(v[0] - gx, v[1] - gy, v[2] - gz) - R2) ** 2, 0) / 10);
            return [gx, gy, gz, R2, res, ((Math.atan2(-(mnew[1] - gy), mnew[0] - gx) / rad) + 360) % 360];
        }
    });
}
