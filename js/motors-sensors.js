/* Motors & drives and sensors & estimation (both electrical engineering disciplines).
   Level 1 is a curated bank: exact answers, each reproduced by an independent calculation (verify).
   Levels 2–4 are generated from seeded values; reference answers are computed from the stated model. */
const DRIVES_READING = {
    motors: {title: 'Introduction to Electric Power Systems (MIT OpenCourseWare 6.061)', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/'},
    sensors: {title: 'Feedback Control Systems (MIT OpenCourseWare 16.30)', url: 'https://ocw.mit.edu/courses/16-30-feedback-control-systems-fall-2010/'}
};

/* ---------- shared maths ---------- */
const mat2 = M => T`\begin{bmatrix}${tf(M[0][0])} & ${tf(M[0][1])}\\ ${tf(M[1][0])} & ${tf(M[1][1])}\end{bmatrix}`;
const vecTex = v => `(${v.map(x => tf(Math.abs(x) < 1e-12 ? 0 : x)).join(',\\ ')})`;

/* ---------- diagrams ---------- */
/* Maps world points (x right, y up) into the drawing box, keeping proportions. */
function fitter(pts, box) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((box[2] - box[0]) / Math.max(x1 - x0, 1e-6), (box[3] - box[1]) / Math.max(y1 - y0, 1e-6));
    const ox = (box[0] + box[2]) / 2 - s * (x0 + x1) / 2, oy = (box[1] + box[3]) / 2 + s * (y0 + y1) / 2;
    return ([x, y]) => [+(ox + s * x).toFixed(1), +(oy - s * y).toFixed(1)];
}
function voltageVector(vd, vq, limit) {
    const ox = 270, oy = 205, scale = 146 / Math.max(limit, Math.hypot(vd, vq));
    const x = ox + vd * scale, y = oy - vq * scale, r = limit * scale;
    return drawing(guide(`M${ox - r} ${oy}a${r} ${r} 0 0 1 ${2 * r} 0`) +
        arrow(83, oy, 457, oy) + arrow(ox, 224, ox, 27) +
        guide(`M${x} ${oy}V${y}H${ox}`) + arrow(ox, oy, x, y) +
        dt(466, 230, 'd (V)') + dt(287, 20, 'q (V)') +
        note(475, 87, 'v_d = −ωₑ L i_q') + note(475, 123, 'v_q = Rₛ i_q + ωₑ ψ') +
        guide('M475 160h34') + note(520, 166, 'V limit') + dt(290, 256, 'Voltage at the specified speed and torque'),
        'Voltage vector with negative d and positive q components. Dashed arc shows the inverter voltage limit at the same scale.', 278);
}

function fieldLimits(we, psi, L, Rs, Im, Vm, id, iq) {
    // For equal d/q inductance the voltage locus is a displaced circle,
    // including the q-axis displacement due to stator resistance.
    const wl = we * L, emf = we * psi, a = Rs * Rs + wl * wl;
    const cx = -wl * emf / a, cy = -Rs * emf / a, radius = Vm / Math.sqrt(a);
    const f = fitter([[-Im, -Im], [Im, Im], [cx - radius, cy - radius], [cx + radius, cy + radius]], [40, 30, 443, 235]);
    const [ox, oy] = f([0, 0]), [vx, vy] = f([cx, cy]), s = (f([Im, 0])[0] - ox) / Im;
    const [px, py] = f([id, iq]);
    return drawing(arrow(34, oy, 452, oy) + arrow(ox, 248, ox, 15) +
        dt(451, oy + 25, 'i_d (A)') + note(ox + 13, 17, 'i_q (A)') +
        `<circle cx="${ox}" cy="${oy}" r="${s * Im}" stroke-dasharray="6 5"/>` +
        `<circle cx="${vx}" cy="${vy}" r="${s * radius}" stroke="#b5532d"/>` +
        dot(px, py) + guide('M490 77h32') + note(535, 83, `I limit · ${Im} A`) +
        '<path d="M490 121h32" stroke="#b5532d"/>' + note(535, 127, `V limit · ${Vm} V`) +
        dot(506, 165) + note(535, 171, 'Operating point'),
        'Current and voltage limits at the specified speed, drawn to the same current scale. Their upper intersection gives the operating point.', 268);
}

function tiltFilter(dtSeconds) {
    return drawing(arrow(78, 72, 191, 72) + dt(120, 50, 'Gyro ω Δt') +
        ring(211, 72, 20) + dt(211, 78, 'Σ') + arrow(231, 72, 309, 72) +
        wire('M309 52h58v40h-58z') + dt(338, 78, 'α') + arrow(367, 72, 450, 72) +
        ring(470, 72, 20) + dt(470, 78, 'Σ') + arrow(490, 72, 647, 72) + dt(623, 50, 'Tilt θ̂') +
        wire('M70 171H203m0 0a8 8 0 0 1 16 0') + arrow(219, 171, 272, 171) + dt(116, 155, 'Accelerometer θₐ') +
        wire('M272 151h90v40h-90z') + dt(317, 177, '1 − α') + wire('M362 171H470') + arrow(470, 171, 470, 92) +
        dot(566, 72) + wire('M566 72V233H377M377 214h-83v38h83zM294 233H211') +
        dt(336, 239, 'Delay') + arrow(211, 233, 211, 92) +
        dt(360, 292, `Sample interval Δt = ${dtSeconds} s`),
        'Previous tilt plus the gyro increment is weighted by alpha. The accelerometer enters the final sum through a separate one-minus-alpha branch.', 312);
}

function beaconRanges(beacons, ranges, side, estimate) {
    const f = fitter(beacons, [255, 42, 465, 230]), [rx, ry] = f(estimate);
    let b = guide('M' + beacons.map(pos => f(pos).join(' ')).join('L') + 'z');
    beacons.forEach((pos, i) => {
        const [x, y] = f(pos);
        b += wire(`M${rx} ${ry}L${x} ${y}`) + `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#fffdf7"/>` +
            dt(x + (pos[0] ? 90 : -90), y + 6, `B${i + 1} · ${ranges[i]} m`);
    });
    return drawing(b + `<circle cx="${rx}" cy="${ry}" r="6" fill="#b5532d"/>` +
        dt(360, 268, `Square side ${side} m · B1 at (0, 0)`),
        'Four corner beacons around the robot, numbered counterclockwise from the lower left. Each range is labelled beside its beacon.', 290);
}
function motorCircuit(caption, load='J, b', inductive=true) {
    return drawing(element('DC', 110, 75, 110, 195, '') + dt(62, 140, 'V') + element('R', 110, 75, 250, 75, 'R') + (inductive ? element('L', 250, 75, 390, 75, 'L') : wire('M250 75H390')) +
        wire('M390 75h30v30M420 165v30H110') + ring(420, 135, 30) + dt(420, 141, 'M') + dt(352, 140, 'E = kω') +
        wire('M450 135h80') + `<rect x="530" y="100" width="44" height="70" rx="4"/>` + dt(552, 200, load) + dt(500, 122, 'τ = kI') +
        dt(360, 238, caption), 'Motor armature loop and back-EMF, with a shaft driving the mechanical load. ' + caption, 250);
}
function encoderDisc(caption) {
    let b = ring(200, 125, 90) + ring(200, 125, 24);
    for (let i = 0; i < 24; i++) {
        const a = i * Math.PI / 12, c = Math.cos(a), s = Math.sin(a);
        b += wire(`M${(200 + 62 * c).toFixed(1)} ${(125 + 62 * s).toFixed(1)}L${(200 + 82 * c).toFixed(1)} ${(125 + 82 * s).toFixed(1)}`);
    }
    b += `<path d="M400 70h40v20h40V70h40v20h40V70h40" />` + `<path d="M420 160h40v20h40v-20h40v20h40v-20h40" />` + dt(372, 84, 'A') + dt(372, 174, 'B') + dt(500, 130, '90° apart') + dt(360, 245, caption);
    return drawing(b, 'Optical encoder disc with two quadrature channels A and B. ' + caption, 250);
}

/* ---------- Level 1: curated ---------- */
bank('motors', 'advanced', [{
    title: 'Half speed, quarter of the stall power',
    diagram: curve('speed ω (rad/s)', 'torque τ (N·m)', [0, 300], [0, 2], w => 2 * (1 - w / 300)),
    text: T`A DC motor at fixed voltage has a straight torque–speed line: stall torque $2\,\text{N}\cdot\text{m}$ and no-load speed $300\,\text{rad/s}$. What is its maximum mechanical output power?`,
    parts: [ex('Maximum power', 150, '150', 'W')],
    hints: [T`$P = \tau\omega = \tau_s\left(1 - \omega/\omega_0\right)\omega$.`],
    steps: [T`$\dfrac{dP}{d\omega} = \tau_s\left(1 - \dfrac{2\omega}{\omega_0}\right) = 0 \Rightarrow \omega = \dfrac{\omega_0}{2} = 150\,\text{rad/s}$.`, T`There $\tau = \tau_s/2 = 1\,\text{N}\cdot\text{m}$, so $P_{\max} = \dfrac{\tau_s\omega_0}{4} = 150\,\text{W}$.`],
    idea: 'Peak power sits at half speed and half torque, but efficiency there is at most 50%; motors are sized so the usual operating point lies nearer no-load speed, where they are efficient.',
    prereq: 'The DC motor torque–speed line.',
    verify: () => { let b = 0; for (let w = 0; w <= 300; w += .001) b = Math.max(b, 2 * (1 - w / 300) * w); return [b]; }
}, {
    title: 'The gear ratio that accelerates fastest',
    diagram: sketch('Motor driving a load inertia through a gearbox of ratio n.',
        `<rect x="90" y="90" width="120" height="80" rx="6"/>` + wire('M210 130h70') + ring(300, 130, 22) + ring(300, 72, 36) + wire('M336 72h110') + ring(500, 72, 54),
        [[150, 136, 'Motor Jₘ'], [300, 180, 'n : 1'], [500, 150, 'Load J_L'], [360, 236, 'Ideal gearbox, no losses']]),
    text: T`A motor with rotor inertia $J_m = 2\times10^{-4}\,\text{kg}\cdot\text{m}^2$ drives a load inertia $J_L = 4\times10^{-3}\,\text{kg}\cdot\text{m}^2$ through an ideal gearbox of ratio $n$ (motor turns per load turn). Which ratio gives the largest load acceleration for a given motor torque?`,
    parts: [ex(T`$n$`, Math.sqrt(20), T`2\sqrt5`)],
    hints: [T`Refer everything to the load: $\alpha_L = \dfrac{n\tau_m}{n^2J_m + J_L}$.`],
    steps: [T`$\dfrac{d}{dn}\,\dfrac{n}{n^2J_m + J_L} = 0 \Rightarrow n^2J_m = J_L$.`, T`$n = \sqrt{J_L/J_m} = \sqrt{20} = 2\sqrt5 \approx 4.47$.`, T`At this ratio the rotor inertia reflected to the load equals the load inertia: inertia matching.`],
    idea: 'Like impedance matching in circuits, inertia matching transfers the most acceleration; in practice designers pick a slightly lower ratio to keep speed in hand.',
    prereq: 'Gear ratios; reflected inertia.',
    verify: () => { let b = [0, 0]; for (let n = .1; n < 20; n += 1e-4) { const a = n / (n * n * 2e-4 + 4e-3); if (a > b[1]) b = [n, a]; } return [b[0]]; }
}, {
    title: 'The best a DC motor can do',
    diagram: curve('current I/Iₛ', 'efficiency η', [0, 1], [0, .6], i => i < 1 / 16 ? 0 : (i - 1 / 16) * (1 - i) / i),
    text: T`A permanent-magnet DC motor runs from a fixed voltage. Its friction is a constant torque, so it draws a no-load current $I_0 = I_s/16$, where $I_s$ is the stall current. What is its peak efficiency?`,
    parts: [ex(T`$\eta_{\max}$`, 9 / 16, T`\dfrac{9}{16}`)],
    hints: [T`$V = IR + k\omega$ and the useful torque is $k(I - I_0)$, so $\eta = \dfrac{(I - I_0)(V - IR)}{VI}$.`],
    steps: [T`With $I_s = V/R$: $\eta = \dfrac{(I - I_0)(I_s - I)}{I_sI}$.`, T`$\dfrac{d\eta}{dI} = 0 \Rightarrow I^2 = I_0I_s$, so $I = \sqrt{I_0I_s} = I_s/4$.`, T`$\eta_{\max} = \left(1 - \sqrt{I_0/I_s}\right)^2 = \left(1 - \tfrac14\right)^2 = \dfrac{9}{16} \approx 56\%$.`],
    idea: 'Peak efficiency occurs at the geometric mean of no-load and stall current, so a motor with low friction peaks close to no-load speed.',
    prereq: 'DC motor equations; optimisation.',
    verify: () => { let b = 0; for (let i = 1 / 16; i < 1; i += 1e-6) b = Math.max(b, (i - 1 / 16) * (1 - i) / i); return [b]; }
}, {
    title: 'One constant with two names',
    diagram: motorCircuit('The same k links E to ω and τ to I'),
    text: T`A DC motor's datasheet gives its back-EMF constant as $60\,\text{V}$ per $1000\,\text{rpm}$. What is its torque constant in $\text{N}\cdot\text{m/A}$?`,
    parts: [ex(T`$k_t$`, 9 / (5 * Math.PI), T`\dfrac{9}{5\pi}`, 'N·m/A')],
    hints: [T`Electrical power converted, $EI$, equals mechanical power, $\tau\omega$. So in SI units $k_t = k_e$.`],
    steps: [T`$1000\,\text{rpm} = \dfrac{1000\cdot2\pi}{60} = \dfrac{100\pi}{3}\,\text{rad/s}$.`, T`$k_e = \dfrac{60}{100\pi/3} = \dfrac{9}{5\pi}\,\text{V}\cdot\text{s/rad}$.`, T`$EI = \tau\omega$ with $E = k_e\omega$ and $\tau = k_tI$ gives $k_t = k_e = \dfrac{9}{5\pi} \approx 0.573\,\text{N}\cdot\text{m/A}$.`],
    idea: 'Torque constant and back-EMF constant are the same number in SI units because the motor converts power losslessly between its electrical and mechanical ports.',
    prereq: 'Power balance; unit conversion.',
    verify: () => [60 / (1000 * 2 * Math.PI / 60)]
}]);

bank('sensors', 'advanced', [{
    title: 'Two sensors are better than one',
    diagram: sketch('Two sensors measuring the same distance, combined into one estimate.',
        `<rect x="90" y="50" width="150" height="56" rx="6"/><rect x="90" y="150" width="150" height="56" rx="6"/>` + arrow(240, 78, 352, 120) + arrow(240, 178, 352, 136) + ring(380, 128, 28) + arrow(408, 128, 540, 128),
        [[165, 84, 'σ₁ = 3 cm'], [165, 184, 'σ₂ = 4 cm'], [380, 134, 'Σ'], [300, 84, 'w'], [300, 192, '1 − w'], [590, 134, 'x̂']]),
    text: T`Two independent, unbiased sensors measure the same distance, with standard deviations $\sigma_1 = 3\,\text{cm}$ and $\sigma_2 = 4\,\text{cm}$. You combine them as $\hat x = wx_1 + (1 - w)x_2$ with the best weight. What is the standard deviation of $\hat x$?`,
    parts: [ex(T`$\sigma_{\hat x}$`, 2.4, T`\dfrac{12}{5}`, 'cm')],
    hints: [T`$\operatorname{var}\hat x = w^2\sigma_1^2 + (1 - w)^2\sigma_2^2$. Minimise over $w$.`],
    steps: [T`The optimum weights by inverse variance: $w = \dfrac{\sigma_2^2}{\sigma_1^2 + \sigma_2^2} = \dfrac{16}{25}$.`, T`$\dfrac{1}{\sigma_{\hat x}^2} = \dfrac19 + \dfrac{1}{16} = \dfrac{25}{144}$.`, T`$\sigma_{\hat x} = \dfrac{12}{5} = 2.4\,\text{cm}$, better than either sensor alone.`],
    idea: 'Information adds: for independent measurements the inverse variances sum. This is the one-step core of the Kalman filter.',
    prereq: 'Variance of a weighted sum.',
    verify: () => { let b = Infinity; for (let w = 0; w <= 1; w += 1e-6) b = Math.min(b, w * w * 9 + (1 - w) ** 2 * 16); return [Math.sqrt(b)]; }
}, {
    title: 'The golden Kalman gain',
    diagram: estimatorDiagram('Delay', 'Predicted x', 'Estimate x̂', 'Random walk · Q = R'),
    text: T`A quantity drifts as a random walk, $x_{k+1} = x_k + w_k$, and is measured as $z_k = x_k + v_k$. The process and measurement noise have equal variances, $Q = R$. Find the steady-state Kalman gain.`,
    parts: [ex(T`$K_\infty$`, (Math.sqrt(5) - 1) / 2, T`\dfrac{\sqrt5-1}{2}`)],
    hints: [T`With prior variance $P$, the steady state satisfies $P = \left(P - \dfrac{P^2}{P + R}\right) + Q$.`],
    steps: [T`$\dfrac{P^2}{P + R} = Q$. With $Q = R = 1$: $P^2 - P - 1 = 0$, so $P = \dfrac{1 + \sqrt5}{2} = \varphi$.`, T`$K = \dfrac{P}{P + R} = \dfrac{\varphi}{\varphi + 1} = \dfrac{\varphi}{\varphi^2} = \dfrac1\varphi$.`, T`$K_\infty = \dfrac{\sqrt5 - 1}{2} \approx 0.618$.`],
    idea: 'The steady-state Kalman filter for a random walk is an exponential smoother; with equal noises its gain is the reciprocal of the golden ratio.',
    prereq: 'The scalar Kalman filter; quadratic equations.',
    verify: () => { let P = 1; for (let i = 0; i < 200; i++) { const K = P / (P + 1); P = (1 - K) * P + 1; } return [P / (P + 1)]; }
}, {
    title: 'When to stop timing and start counting',
    diagram: encoderDisc('1000 counts per revolution after decoding'),
    text: T`An encoder gives $N = 1000$ counts per revolution. Speed can be measured by counting pulses in a window $T = 1\,\text{ms}$, with resolution $\Delta\omega = \dfrac{2\pi}{NT}$, or by timing one count with a $10\,\text{MHz}$ clock, with resolution $\Delta\omega \approx \dfrac{N\omega^2}{2\pi f_c}$. Above which speed is counting the finer method?`,
    parts: [ex('Crossover speed', 200 * Math.PI, T`200\pi`, 'rad/s')],
    hints: [T`Set the two resolutions equal and solve for $\omega$.`],
    steps: [T`$\dfrac{N\omega^2}{2\pi f_c} = \dfrac{2\pi}{NT} \Rightarrow \omega = \dfrac{2\pi}{N}\sqrt{\dfrac{f_c}{T}}$.`, T`$\sqrt{f_c/T} = \sqrt{10^7/10^{-3}} = 10^5\,\text{s}^{-1}$, so $\omega = \dfrac{2\pi}{1000}\cdot10^5 = 200\pi \approx 628\,\text{rad/s}$ ($6000\,\text{rpm}$).`, T`Below it, timing one count is finer; above it, counting many counts wins.`],
    idea: 'Counting suits high speeds and timing suits low speeds; drives switch between them or combine both (the M/T method).',
    prereq: 'Quantisation; incremental encoders.',
    verify: () => [NUM.bisect(w => 1000 * w * w / (2 * Math.PI * 1e7) - 2 * Math.PI / (1000 * 1e-3), 1, 1e4)]
}, {
    title: 'How far a gyro drifts in the dark',
    diagram: curve('time t (h)', 'heading error σ (°)', [0, 4], [0, .6], t => .3 * Math.sqrt(t)),
    text: T`A gyroscope has an angle random walk of $0.3^\circ/\sqrt{\text{h}}$. Integrated with no other aiding, what is the standard deviation of the heading error after $4\,\text{h}$?`,
    parts: [ex(T`$\sigma_\theta$`, .6, T`\dfrac35`, '°')],
    hints: [T`Integrated white rate noise is a random walk: its variance grows linearly with time.`],
    steps: [T`$\sigma_\theta = N\sqrt t$ with $N = 0.3^\circ/\sqrt{\text{h}}$.`, T`$\sigma_\theta = 0.3\sqrt4 = 0.6^\circ$.`, T`Four times longer costs only twice the error: this drift grows with $\sqrt t$, while a constant bias would grow with $t$.`],
    idea: 'Angle random walk is the square-root-of-time error from integrating white rate noise. It is read from an Allan deviation plot at an averaging time of 1.',
    prereq: 'Random walks; variance of sums.',
    verify: () => { const dt = 1 / 3600, n = 4 / dt, sd = .3 / Math.sqrt(dt); return [Math.sqrt(n) * sd * dt]; }
}]);

/* ---------- Levels 2–4: generated ---------- */
let PMSM_POINTS = null; // reachable dq operating points, filtered once (18 000 candidates)
function makeMotorSensorExercise(topic, date, level) {
    const li = TIERS.indexOf(level); // 1 university, 2 challenge, 3 expert, 4 mastery
    if (!['motors', 'sensors'].includes(topic) || li < 1)
        throw Error('Unknown challenge selection');
    const salt = hashString(topic + level), grid = (...lists) => dayGrid(date, salt, ...lists), p = part;
    const extra = {}; // explore / concept settings for the interactive figures (js/motion.js)
    const q = (title, text, givens, parts, hints, steps, idea, diagram, prerequisites) => ({
        id: `${topic}-${level}`, title, text, givens, parts, hints, steps, idea, diagram, prerequisites, source: {reading: DRIVES_READING[topic]}, ...extra
    });

    if (topic === 'motors') {
        if (li === 1) {
            const [V, R, K, frac] = grid([6, 9, 12, 18, 24, 36, 48], [.3, .5, .8, 1, 1.5, 2, 3], [.02, .03, .04, .05, .06, .08, .1], [.15, .2, .25, .3, .35, .4]), stall = K * V / R, tl = +(stall * frac).toFixed(3);
            const w0 = V / K, I = tl / K, w = (V - I * R) / K, eta = tl * w / (V * I), rpm = x => x * 60 / (2 * Math.PI);
            return q('A DC motor at its operating point', T`A permanent-magnet DC motor has armature resistance $R = ${R}\,\Omega$ and motor constant $k = ${K}\,\text{V}\cdot\text{s/rad}$ ($= \text{N}\cdot\text{m/A}$), and runs from $V = ${V}\,\text{V}$. Ignore friction and inductance. Find the no-load speed and the stall torque. It drives a load of $${tl}\,\text{N}\cdot\text{m}$: find the speed, the current and the efficiency.`,
                [T`$V = ${V}\,\text{V}$, $R = ${R}\,\Omega$`, T`$k = ${K}\,\text{N}\cdot\text{m/A}$`, T`Load $${tl}\,\text{N}\cdot\text{m}$`],
                [p('No-load speed', rpm(w0), 'rpm'), p('Stall torque', stall, 'N·m'), p('Speed under load', rpm(w), 'rpm'), p('Current', I, 'A'), p('Efficiency', 100 * eta, '%')],
                [T`$V = IR + k\omega$ and $\tau = kI$.`, T`No load: $I = 0$. Stall: $\omega = 0$.`, T`Efficiency $= \dfrac{\tau\omega}{VI}$.`],
                [T`$\omega_0 = V/k = ${tf(w0)}\,\text{rad/s} = ${tf(rpm(w0))}\,\text{rpm}$.`, T`$\tau_s = kV/R = ${tf(stall)}\,\text{N}\cdot\text{m}$.`, T`$I = \tau/k = ${tf(I)}\,\text{A}$; $\omega = (V - IR)/k = ${tf(w)}\,\text{rad/s} = ${tf(rpm(w))}\,\text{rpm}$.`, T`$\eta = \dfrac{${tl}\times${tf(w)}}{${V}\times${tf(I)}} = ${tf(100 * eta)}\%$.`],
                'Two constants describe a DC motor: k converts current to torque and speed to voltage, R sets the slope of the torque–speed line.',
                motorCircuit('Steady-state armature circuit', `Load · ${tl} N·m`, false),
                'Ohm’s law; DC motor equations.');
        }
        if (li === 2) {
            // Keep two well-separated real roots and a current peak at a positive time.
            const stepOk = ([R, L, K, J, b]) => {
                const D0 = R * b + K * K, a2 = L * J, a1 = R * J + L * b, dd = a1 * a1 - 4 * a2 * D0;
                if (dd <= 4 * a2 * D0) return false;
                const disc = Math.sqrt(dd), pf = (-a1 - disc) / (2 * a2), ps = (-a1 + disc) / (2 * a2), ratio = -((J * ps + b) / (ps - pf)) / ((J * pf + b) / (pf - ps));
                return ratio > 0 && Math.log(ratio) / (pf - ps) > 0;
            };
            const [[R, L, K, J, b], V] = grid(product([.5, 1, 1.5, 2, 3], [.1e-3, .2e-3, .3e-3, .5e-3, 1e-3], [.02, .03, .04, .05, .06], [2e-5, 5e-5, 1e-4, 2e-4, 5e-4], [1e-5, 2e-5, 5e-5]).filter(stepOk), [6, 12, 24]);
            const D0 = R * b + K * K, a2 = L * J, a1 = R * J + L * b, disc = Math.sqrt(a1 * a1 - 4 * a2 * D0), pf = (-a1 - disc) / (2 * a2), ps = (-a1 + disc) / (2 * a2);
            const wss = K * V / D0, iss = V * b / D0, A = pi => (J * pi + b) / (L * J * (pi - (pi === pf ? ps : pf)));
            const tpk = Math.log(-A(ps) / A(pf)) / (pf - ps), cur = t => V * (b / D0 + [pf, ps].reduce((s, pi) => s + (J * pi + b) / (L * J * pi * (pi - (pi === pf ? ps : pf))) * Math.exp(pi * t), 0)), ipk = cur(tpk);
            return q('Starting a DC motor: two time constants', T`A DC motor has $R = ${R}\,\Omega$, $L = ${tf(L * 1e3)}\,\text{mH}$, $k = ${K}\,\text{N}\cdot\text{m/A}$, rotor inertia $J = ${tf(J)}\,\text{kg}\cdot\text{m}^2$ and viscous friction $b = ${tf(b)}\,\text{N}\cdot\text{m}\cdot\text{s/rad}$. At $t = 0$ a step of $${V}\,\text{V}$ is applied to the motor at rest. Find the final speed, the two time constants of the response, the peak current and when it occurs, and the final current.`,
                [T`$R = ${R}\,\Omega$, $L = ${tf(L * 1e3)}\,\text{mH}$`, T`$k = ${K}$, $J = ${tf(J)}$, $b = ${tf(b)}$`, T`Step of $${V}\,\text{V}$`],
                [p('Final speed', wss, 'rad/s'), p('Slow time constant', -1e3 / ps, 'ms'), p('Fast time constant', -1e3 / pf, 'ms'), p('Peak current', ipk, 'A'), p('Time of the peak', tpk * 1e3, 'ms'), p('Final current', iss, 'A')],
                [T`$\dfrac{\Omega(s)}{V(s)} = \dfrac{k}{(Ls + R)(Js + b) + k^2}$ and $\dfrac{I(s)}{V(s)} = \dfrac{Js + b}{(Ls + R)(Js + b) + k^2}$.`, T`The denominator $LJs^2 + (RJ + Lb)s + (Rb + k^2)$ has two real roots here: the time constants are $-1/p$.`, T`The current peaks where $di/dt = 0$: expand $I(s)/s$ in partial fractions.`],
                [T`$D(s) = ${tf(a2)}s^2 + ${tf(a1)}s + ${tf(D0)}$, roots $p_f = ${tf(pf)}$ and $p_s = ${tf(ps)}\,\text{s}^{-1}$.`, T`Time constants: $${tf(-1e3 / ps)}\,\text{ms}$ (mechanical) and $${tf(-1e3 / pf)}\,\text{ms}$ (electrical).`, T`$\omega_\infty = \dfrac{kV}{Rb + k^2} = ${tf(wss)}\,\text{rad/s}$ and $i_\infty = \dfrac{bV}{Rb + k^2} = ${tf(iss)}\,\text{A}$.`, T`$\dfrac{di}{dt} = V\sum_i A_ie^{p_it}$ with $A_i = \dfrac{Jp_i + b}{LJ(p_i - p_j)}$; it is zero at $t = \dfrac{\ln(-A_s/A_f)}{p_f - p_s} = ${tf(tpk * 1e3)}\,\text{ms}$.`, T`There $i = ${tf(ipk)}\,\text{A}$, just under $V/R = ${tf(V / R)}\,\text{A}$.`],
                'Inductance sets a fast electrical time constant and inertia a slow mechanical one; the starting current nearly reaches V/R before back-EMF builds, which is why drives limit current.',
                motorCircuit('Step of ' + V + ' V at t = 0'),
                'Laplace transforms; partial fractions; second-order systems.');
        }
        if (li === 3) {
            // The stated operating point must be reachable: its voltage stays within 95% of the inverter limit.
            const reachable = ([pp, psi, Tq, Rs, L, n, Vdc]) => { const iq = Tq / (1.5 * pp * psi), we = pp * n * 2 * Math.PI / 60; return Math.hypot(we * L * iq, Rs * iq + we * psi) <= .95 * Vdc / Math.sqrt(3); };
            const [[pp, psi, Tq, Rs, L, n, Vdc]] = grid(PMSM_POINTS ||= product([2, 3, 4, 5], [.008, .01, .012, .015, .02], [.3, .5, .8, 1, 1.5], [.05, .1, .2], [.1e-3, .2e-3, .3e-3, .4e-3], [1000, 1500, 2000, 2500, 3000], [24, 36, 48]).filter(reachable));
            const iq = Tq / (1.5 * pp * psi), we = pp * n * 2 * Math.PI / 60, vd = -we * L * iq, vq = Rs * iq + we * psi, vm = Math.hypot(vd, vq), Vmax = Vdc / Math.sqrt(3);
            const A = psi * psi + L * L * iq * iq, B = 2 * Rs * iq * psi, Cc = Rs * Rs * iq * iq - Vmax * Vmax, web = (-B + Math.sqrt(B * B - 4 * A * Cc)) / (2 * A), nb = web / pp * 60 / (2 * Math.PI);
            return q('A brushless motor in the dq frame', T`A surface permanent-magnet synchronous motor has $${pp}$ pole pairs, magnet flux linkage $\psi = ${psi}\,\text{V}\cdot\text{s}$, stator resistance $R_s = ${Rs}\,\Omega$ and $L_d = L_q = ${tf(L * 1e3)}\,\text{mH}$. Torque is $T = \tfrac32p\psi i_q$ (amplitude-invariant dq). Running at $${n}\,\text{rpm}$ in steady state with $i_d = 0$, it must deliver $${Tq}\,\text{N}\cdot\text{m}$. Find $i_q$, the electrical speed, $v_d$, $v_q$ and the voltage magnitude. The inverter, on a $${Vdc}\,\text{V}$ bus, can supply at most $V_{dc}/\sqrt3$: find the highest speed at which this torque is possible with $i_d = 0$.`,
                [T`$p = ${pp}$, $\psi = ${psi}\,\text{V}\cdot\text{s}$`, T`$R_s = ${Rs}\,\Omega$, $L = ${tf(L * 1e3)}\,\text{mH}$`, T`$${n}\,\text{rpm}$, $T = ${Tq}\,\text{N}\cdot\text{m}$, $V_{dc} = ${Vdc}\,\text{V}$`],
                [p(T`$i_q$`, iq, 'A'), p(T`$\omega_e$`, we, 'rad/s'), p(T`$v_d$`, vd, 'V'), p(T`$v_q$`, vq, 'V'), p(T`$|v|$`, vm, 'V'), p('Base speed at this torque', nb, 'rpm')],
                [T`Steady-state dq equations: $v_d = R_si_d - \omega_eLi_q$, $v_q = R_si_q + \omega_e(Li_d + \psi)$.`, T`$\omega_e = p\,\omega_m$.`, T`With $i_d = 0$: $(R_si_q + \omega_e\psi)^2 + (\omega_eLi_q)^2 = V_{\max}^2$ is a quadratic in $\omega_e$.`],
                [T`$i_q = \dfrac{T}{1.5p\psi} = ${tf(iq)}\,\text{A}$.`, T`$\omega_e = ${pp}\times${n}\cdot\dfrac{2\pi}{60} = ${tf(we)}\,\text{rad/s}$.`, T`$v_d = -\omega_eLi_q = ${tf(vd)}\,\text{V}$; $v_q = R_si_q + \omega_e\psi = ${tf(vq)}\,\text{V}$; $|v| = ${tf(vm)}\,\text{V}$.`, T`$V_{\max} = ${Vdc}/\sqrt3 = ${tf(Vmax)}\,\text{V}$. Solving $(\psi^2 + L^2i_q^2)\omega_e^2 + 2R_si_q\psi\,\omega_e + R_s^2i_q^2 - V_{\max}^2 = 0$: $\omega_e = ${tf(web)}\,\text{rad/s}$, i.e. $${tf(nb)}\,\text{rpm}$.`],
                'In the rotating dq frame a brushless motor looks like a DC motor: i_q makes torque and the back-EMF ωψ grows with speed until the inverter runs out of voltage.',
                voltageVector(vd, vq, Vmax),
                'Synchronous machines; Park transform; quadratic equations.');
        }
        // Mastery: field weakening with resistance, at a speed above base speed.
        const [pp, psi, L, Rs, Im, Vm, frac] = grid([3, 4, 5], [.008, .01, .012], [.2e-3, .3e-3, .5e-3], [.05, .08], [10, 15, 20], [12, 14, 20], [.3, .5, .7]);
        const iqv = (we, id) => { const a = we * we * L * L + Rs * Rs, b = Rs * we * psi, c = Rs * Rs * id * id + we * we * (psi + L * id) ** 2, dd = b * b - a * (c - Vm * Vm); return dd < 0 ? -1 : (-b + Math.sqrt(dd)) / a; };
        const web = NUM.bisect(we => iqv(we, 0) - Im, 1, 1e5), wmax = psi > L * Im ? Math.sqrt(Vm * Vm - Rs * Rs * Im * Im) / (psi - L * Im) : 3 * web;
        const rpmOf = we => we / pp * 60 / (2 * Math.PI), n = Math.round(rpmOf(web + frac * (Math.min(wmax, 3 * web) - web)) / 100) * 100, we = pp * n * 2 * Math.PI / 60;
        const id = NUM.bisect(d => iqv(we, d) - Math.sqrt(Math.max(0, Im * Im - d * d)), 0, -Im), iq = Math.sqrt(Im * Im - id * id), Tq = 1.5 * pp * psi * iq, P = Tq * n * 2 * Math.PI / 60;
        return q('Field weakening: the most torque above base speed', T`A surface PM synchronous motor ($p = ${pp}$, $\psi = ${psi}\,\text{V}\cdot\text{s}$, $L_d = L_q = ${tf(L * 1e3)}\,\text{mH}$, $R_s = ${Rs}\,\Omega$) is limited to a current amplitude $I_{\max} = ${Im}\,\text{A}$ and a voltage amplitude $V_{\max} = ${Vm}\,\text{V}$ (amplitude-invariant dq; $T = \tfrac32p\psi i_q$). Find the base speed: the highest speed at which full current with $i_d = 0$ is possible. At $${n}\,\text{rpm}$, above base speed, find the $i_d$ and $i_q$ that give the most torque within both limits, the torque and the mechanical power. Keep $R_s$ in the voltage equations.`,
            [T`$p = ${pp}$, $\psi = ${psi}\,\text{V}\cdot\text{s}$, $L = ${tf(L * 1e3)}\,\text{mH}$, $R_s = ${Rs}\,\Omega$`, T`$I_{\max} = ${Im}\,\text{A}$, $V_{\max} = ${Vm}\,\text{V}$`, T`Speed $${n}\,\text{rpm}$`],
            [p('Base speed', rpmOf(web), 'rpm'), p(T`$i_d$`, id, 'A'), p(T`$i_q$`, iq, 'A'), p('Torque', Tq, 'N·m'), p('Mechanical power', P, 'W')],
            [T`$v_d = R_si_d - \omega_eLi_q$, $v_q = R_si_q + \omega_e(\psi + Li_d)$. Expanding, $|v|^2 = (\omega_e^2L^2 + R_s^2)i_q^2 + 2R_s\omega_e\psi\,i_q + R_s^2i_d^2 + \omega_e^2(\psi + Li_d)^2$.`, T`For each $i_d$, the voltage limit caps $i_q$ (a quadratic); the current limit caps it at $\sqrt{I_{\max}^2 - i_d^2}$.`, T`Negative $i_d$ relaxes the voltage cap but tightens the current cap: the best point is where they meet. Bisect on $i_d$.`],
            [T`Base speed: $|v| = V_{\max}$ with $i_d = 0$, $i_q = I_{\max}$ gives $\omega_e = ${tf(web)}\,\text{rad/s}$, i.e. $${tf(rpmOf(web))}\,\text{rpm}$.`, T`At $${n}\,\text{rpm}$: $\omega_e = ${tf(we)}\,\text{rad/s}$.`, T`Bisection on the meeting point gives $i_d = ${tf(id)}\,\text{A}$ and $i_q = ${tf(iq)}\,\text{A}$.`, T`$T = 1.5\times${pp}\times${psi}\times${tf(iq)} = ${tf(Tq)}\,\text{N}\cdot\text{m}$ and $P = T\omega_m = ${tf(P)}\,\text{W}$.`],
            'Above base speed a PM motor trades torque-producing current for negative d-axis current that cancels part of the magnet’s back-EMF: field weakening extends the speed range at roughly constant power.',
            fieldLimits(we, psi, L, Rs, Im, Vm, id, iq),
            'Synchronous machines; constrained optimisation; root finding.');
    }

    // sensors
    if (li === 1) {
        const [N, Tsms, n, fcM] = grid([100, 200, 256, 360, 500, 512, 1000, 1024, 2000, 2048, 4096], [.5, 1, 2, 5, 10], [60, 120, 300, 600, 900, 1500, 3000], [1, 10, 20]), Ts = Tsms * 1e-3, fc = fcM * 1e6;
        const res = 360 / (4 * N), c = 4 * N * n / 60 * Ts, dn = 60 / (4 * N * Ts), rel = 100 / c, m = fc / (4 * N * n / 60), nx = 60 / (4 * N) * Math.sqrt(fc / Ts);
        return q('Reading speed from an incremental encoder', T`An incremental encoder has $${N}$ lines per revolution and is decoded $\times4$ (both edges of both channels). The shaft turns at $${n}\,\text{rpm}$. Find the angular resolution. Counting edges in a window $T_s = ${Tsms}\,\text{ms}$: find the expected count, the speed resolution and the relative quantisation at this speed. Timing one edge interval with a $${fc / 1e6}\,\text{MHz}$ clock: find the expected tick count. Finally, find the speed at which the two methods have equal resolution.`,
            [T`$${N}$ lines, $\times4$ decoding`, T`$n = ${n}\,\text{rpm}$, $T_s = ${Tsms}\,\text{ms}$`, T`Clock $${fc / 1e6}\,\text{MHz}$`],
            [p('Angular resolution', res, '°'), p('Counts per window', c), p('Speed resolution (counting)', dn, 'rpm'), p('Relative quantisation', rel, '%'), p('Clock ticks per edge', m), p('Equal-resolution speed', nx, 'rpm')],
            [T`$4N$ edges per revolution.`, T`Counting: one count in $T_s$ is $\Delta n = \dfrac{60}{4NT_s}\,\text{rpm}$.`, T`Timing: $m = f_c/f_{\text{edge}}$ ticks, with resolution $\approx n/m$. Equal when $n^2\dfrac{4N}{60f_c} = \dfrac{60}{4NT_s}$.`],
            [T`$360^\circ/(4\times${N}) = ${tf(res)}^\circ$.`, T`Edge rate $= 4N\,n/60 = ${tf(4 * N * n / 60)}\,\text{Hz}$, so $${tf(c)}$ counts per window.`, T`$\Delta n = ${tf(dn)}\,\text{rpm}$, i.e. $${tf(rel)}\%$ of the speed.`, T`$m = ${tf(fc)}/${tf(4 * N * n / 60)} = ${tf(m)}$ ticks.`, T`$n_\times = \dfrac{60}{4N}\sqrt{f_c/T_s} = ${tf(nx)}\,\text{rpm}$.`],
            'Counting edges is precise at high speed and coarse at low speed; timing edges is the reverse. The crossover speed tells you which to use.',
            encoderDisc(`${N} lines, ×4 decoding`),
            'Frequency and period; quantisation.');
    }
    if (li === 2) {
        const [dts, tau, bias, sig] = grid([.002, .004, .005, .01, .02], [.2, .3, .5, .8, 1, 1.5, 2], [.1, .2, .5, 1, 2], [.5, 1, 2, 3]);
        const alpha = tau / (tau + dts), err = alpha * bias * dts / (1 - alpha), sd = sig * Math.sqrt((1 - alpha) / (1 + alpha)), fx = 1 / (2 * Math.PI * tau), tdisc = -dts / Math.log(alpha);
        return q('Designing a complementary filter for tilt', T`A tilt estimate fuses a gyroscope and an accelerometer every $\Delta t = ${dts}\,\text{s}$: $\hat\theta_k = \alpha(\hat\theta_{k-1} + \omega_k\Delta t) + (1 - \alpha)\theta_{a,k}$, with $\alpha = \tau/(\tau + \Delta t)$ and $\tau = ${tau}\,\text{s}$. The gyro has a constant bias of $${bias}^\circ/\text{s}$; the accelerometer angle has white noise of $${sig}^\circ$ standard deviation per sample. Find $\alpha$, the steady-state angle error caused by the gyro bias, the standard deviation of the output caused by accelerometer noise, the crossover frequency, and the exact time constant of the discrete filter.`,
            [T`$\Delta t = ${dts}\,\text{s}$, $\tau = ${tau}\,\text{s}$`, T`Gyro bias $${bias}^\circ/\text{s}$`, T`Accelerometer noise $\sigma = ${sig}^\circ$`],
            [p(T`$\alpha$`, alpha, '', 1e-4), p('Bias error', err, '°'), p('Output noise σ', sd, '°'), p('Crossover frequency', fx, 'Hz'), p('Discrete time constant', tdisc, 's', .001)],
            [T`In steady state the estimate error $e$ satisfies $e = \alpha(e + b\Delta t)$.`, T`Accelerometer noise passes through $y_k = \alpha y_{k-1} + (1 - \alpha)n_k$: variance $\dfrac{(1 - \alpha)^2\sigma^2}{1 - \alpha^2}$.`, T`The gyro is high-passed and the accelerometer low-passed at $f_c = \dfrac{1}{2\pi\tau}$; the discrete pole $\alpha$ decays as $e^{-t/\tau_d}$ with $\tau_d = -\Delta t/\ln\alpha$.`],
            [T`$\alpha = \dfrac{${tau}}{${tau} + ${dts}} = ${tf(alpha, 6)}$.`, T`$e = \dfrac{\alpha b\Delta t}{1 - \alpha} = b\tau = ${tf(err)}^\circ$.`, T`$\sigma_y = \sigma\sqrt{\dfrac{1 - \alpha}{1 + \alpha}} = ${tf(sd)}^\circ$.`, T`$f_c = ${tf(fx)}\,\text{Hz}$.`, T`$\tau_d = -\Delta t/\ln\alpha = ${tf(tdisc, 6)}\,\text{s}$, slightly more than $\tau$.`],
            'A complementary filter trades gyro drift (worse for large τ) against accelerometer noise (worse for small τ); τ sets both, and a constant gyro bias always leaves an error of bτ.',
            tiltFilter(dts),
            'First-order filters; variance of filtered noise.');
    }
    if (li === 3) {
        const [Lb, fx, fy, noise] = grid([8, 10, 12, 15, 20], steps(.2, .8, .1), steps(.2, .8, .1), [[.05, -.08, .03, -.02], [-.04, .06, .07, -.05], [.09, .02, -.06, .04]]), truth = [fx * Lb, fy * Lb];
        const B = [[0, 0], [Lb, 0], [Lb, Lb], [0, Lb]], rho = B.map((b, i) => +(Math.hypot(truth[0] - b[0], truth[1] - b[1]) + noise[i]).toFixed(3));
        let x = [Lb / 2, Lb / 2];
        for (let it = 0; it < 30; it++) {
            const H = B.map(b => { const d = Math.hypot(x[0] - b[0], x[1] - b[1]); return [(x[0] - b[0]) / d, (x[1] - b[1]) / d]; }), r = B.map((b, i) => rho[i] - Math.hypot(x[0] - b[0], x[1] - b[1]));
            const HtH = [[0, 0], [0, 0]], Htr = [0, 0];
            H.forEach((h, i) => { for (let a = 0; a < 2; a++) { Htr[a] += h[a] * r[i]; for (let c = 0; c < 2; c++) HtH[a][c] += h[a] * h[c]; } });
            const dx = NUM.solve(HtH, Htr); x = [x[0] + dx[0], x[1] + dx[1]];
        }
        const H = B.map(b => { const d = Math.hypot(x[0] - b[0], x[1] - b[1]); return [(x[0] - b[0]) / d, (x[1] - b[1]) / d]; }), res = B.map((b, i) => rho[i] - Math.hypot(x[0] - b[0], x[1] - b[1]));
        const A = [[0, 0], [0, 0]]; H.forEach(h => { for (let a = 0; a < 2; a++) for (let c = 0; c < 2; c++) A[a][c] += h[a] * h[c]; });
        const dA = A[0][0] * A[1][1] - A[0][1] * A[1][0], hdop = Math.sqrt((A[0][0] + A[1][1]) / dA), rms = Math.sqrt(res.reduce((s, v) => s + v * v, 0) / 4);
        return q('Locating a robot from four range beacons', T`A mobile robot measures its distance to four beacons at the corners of a $${Lb}\,\text{m}$ square: $(0, 0)$, $(${Lb}, 0)$, $(${Lb}, ${Lb})$ and $(0, ${Lb})$. The ranges are $${rho.join(',\\ ')}\,\text{m}$, in that order, each with independent noise. Find the least-squares position, minimising $\sum_i(\rho_i - \|\mathbf p - \mathbf b_i\|)^2$ by Gauss–Newton from the centre of the square. Report the RMS range residual and the horizontal dilution of precision, $\text{HDOP} = \sqrt{\operatorname{tr}(H^{\mathsf T}H)^{-1}}$, at the solution.`,
            [T`Beacons at the corners of a $${Lb}\,\text{m}$ square`, T`$\rho = (${rho.join(', ')})\,\text{m}$`, T`Start at $(${Lb / 2}, ${Lb / 2})$`],
            [p(T`$\hat x$`, x[0], 'm', .001), p(T`$\hat y$`, x[1], 'm', .001), p('RMS residual', rms, 'm', .02, .001), p('HDOP', hdop)],
            [T`Linearise: $\rho_i \approx \|\mathbf p_0 - \mathbf b_i\| + \mathbf u_i^{\mathsf T}\Delta\mathbf p$, with unit vectors $\mathbf u_i = (\mathbf p_0 - \mathbf b_i)/\|\mathbf p_0 - \mathbf b_i\|$ as the rows of $H$.`, T`Each step solves $H^{\mathsf T}H\,\Delta\mathbf p = H^{\mathsf T}\mathbf r$, where $\mathbf r$ holds the range residuals.`, T`Iterate until the step is negligible (a handful of iterations).`],
            [T`Gauss–Newton from $(${Lb / 2}, ${Lb / 2})$ converges to $\hat{\mathbf p} = (${tf(x[0], 6)}, ${tf(x[1], 6)})\,\text{m}$.`, T`Residuals: $${vecTex(res)}\,\text{m}$; RMS $= ${tf(rms)}\,\text{m}$.`, T`$H^{\mathsf T}H = ${mat2(A)}$, so $\text{HDOP} = \sqrt{\operatorname{tr}(H^{\mathsf T}H)^{-1}} = ${tf(hdop)}$.`],
            'Range-based positioning (GPS, UWB, acoustic beacons) is nonlinear least squares; HDOP turns range noise into position noise and depends only on the geometry.',
            beaconRanges(B, rho, Lb, x),
            'Nonlinear least squares; linearisation; 2×2 matrices.');
    }
    // Mastery: steady-state alpha-beta-gamma gains from the discrete Riccati equation.
    const [Tq, sz, sa] = grid([.02, .05, .1, .2, .25, .5, 1], [.5, 1, 1.5, 2, 3, 4, 5, 10], [.05, .1, .2, .3, .5, 1, 2]);
    const F = [[1, Tq, Tq * Tq / 2], [0, 1, Tq], [0, 0, 1]], Gv = [Tq * Tq / 2, Tq, 1], Qm = Gv.map(a => Gv.map(b => sa * sa * a * b)), Rv = sz * sz;
    let P = [[1e4, 0, 0], [0, 1e4, 0], [0, 0, 1e4]], Pm = P, K = [0, 0, 0];
    for (let it = 0; it < 5000; it++) {
        const K0 = K;
        Pm = NUM.add(NUM.matMul(NUM.matMul(F, P), F.map((_, i) => F.map(r => r[i]))), Qm);
        const S = Pm[0][0] + Rv;
        K = [Pm[0][0] / S, Pm[1][0] / S, Pm[2][0] / S];
        P = Pm.map((r, i) => r.map((v, j) => v - K[i] * Pm[0][j]));
        if (it > 50 && K.every((v, i) => Math.abs(v - K0[i]) <= 1e-15 * Math.abs(v))) break;
    }
    const al = K[0], be = K[1] * Tq, ga = 2 * K[2] * Tq * Tq;
    return q('Steady-state gains of an α–β–γ tracker', T`A tracker estimates position, velocity and acceleration from position fixes every $T = ${Tq}\,\text{s}$ with noise $\sigma_z = ${sz}\,\text{m}$. The motion model is constant acceleration with a random acceleration increment each step (Wiener-process acceleration): $\mathbf x_{k+1} = F\mathbf x_k + \mathbf g\,w_k$ with $F = \begin{bmatrix}1 & T & T^2/2\\ 0 & 1 & T\\ 0 & 0 & 1\end{bmatrix}$, $\mathbf g = (T^2/2,\ T,\ 1)^{\mathsf T}$ and $\sigma_w = ${sa}\,\text{m/s}^2$. Iterate the Kalman filter's Riccati recursion to steady state. Report the gains as $\alpha = K_1$, $\beta = TK_2$, $\gamma = 2T^2K_3$, and the steady-state position standard deviation before and after each update.`,
        [T`$T = ${Tq}\,\text{s}$, $\sigma_z = ${sz}\,\text{m}$`, T`$\sigma_w = ${sa}\,\text{m/s}^2$`, T`$Q = \sigma_w^2\mathbf g\mathbf g^{\mathsf T}$, $R = \sigma_z^2$, $H = [1\ 0\ 0]$`],
        [p(T`$\alpha$`, al), p(T`$\beta$`, be), p(T`$\gamma$`, ga), p('Position σ after update', Math.sqrt(P[0][0]), 'm'), p('Position σ before update', Math.sqrt(Pm[0][0]), 'm')],
        [T`Predict: $P^- = FPF^{\mathsf T} + Q$. Gain: $K = P^-H^{\mathsf T}/(HP^-H^{\mathsf T} + R)$. Update: $P = (I - KH)P^-$.`, T`Start from a large $P$ and iterate until nothing changes (a few hundred steps).`, T`The gains settle to constants: the steady-state Kalman filter is a fixed-gain α–β–γ filter.`],
        [T`$Q = ${tf(sa * sa)}\,\mathbf g\mathbf g^{\mathsf T}$ with $\mathbf g = (${tf(Gv[0])}, ${tf(Gv[1])}, 1)$.`, T`After convergence: $K = ${vecTex(K)}$.`, T`$\alpha = ${tf(al)}$, $\beta = ${tf(be)}$, $\gamma = ${tf(ga)}$.`, T`$\sqrt{P_{11}} = ${tf(Math.sqrt(P[0][0]))}\,\text{m}$ after the update, $\sqrt{P^-_{11}} = ${tf(Math.sqrt(Pm[0][0]))}\,\text{m}$ before.`],
        'Iterating the Riccati recursion gives the steady-state gains that radar and GNSS trackers hard-code; the ratio of process to measurement noise alone sets how much the filter trusts new fixes.',
        estimatorDiagram('F z⁻¹', 'Position Hx̂⁻', 'Position, velocity, acceleration', `Fix every ${Tq} s · σz = ${sz} m`),
        'Kalman filtering; matrix algebra; fixed-point iteration.');
}
