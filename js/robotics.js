/* Robotics & mechatronics: robot kinematics, robot dynamics & control, motors & drives, sensors & estimation.
   Level 1 is a curated bank: exact answers, each reproduced by an independent calculation (verify).
   Levels 2–4 are generated from seeded values; reference answers are computed from the stated model. */
const ROBO_READING = {
    kinematics: {title: 'Introduction to Robotics (MIT OpenCourseWare 2.12)', url: 'https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/'},
    robotcontrol: {title: 'Introduction to Robotics (MIT OpenCourseWare 2.12)', url: 'https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/'},
    motors: {title: 'Introduction to Electric Power Systems (MIT OpenCourseWare 6.061)', url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/'},
    sensors: {title: 'Feedback Control Systems (MIT OpenCourseWare 16.30)', url: 'https://ocw.mit.edu/courses/16-30-feedback-control-systems-fall-2010/'}
};

/* ---------- shared maths ---------- */
/* Joint positions of a planar serial arm: relative joint angles, base at the origin. */
const fkN = (ls, qs) => {
    let x = 0, y = 0, a = 0;
    const pts = [[0, 0]];
    ls.forEach((l, i) => { a += qs[i]; x += l * Math.cos(a); y += l * Math.sin(a); pts.push([x, y]); });
    return pts;
};
/* Two-link inverse kinematics for a point; sign picks the elbow branch (+1: q2 > 0). */
const ik2 = (l1, l2, x, y, sign=1) => {
    const c2 = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    if (Math.abs(c2) > 1) return null;
    const q2 = sign * Math.acos(c2);
    return {c2, q2, q1: Math.atan2(y, x) - Math.atan2(l2 * Math.sin(q2), l1 + l2 * Math.cos(q2))};
};
/* Point masses at the ends of two links: inertia matrix, velocity terms and gravity (angles from horizontal). */
function arm2(m1, m2, l1, l2, [q1, q2], [w1, w2]) {
    const c2 = Math.cos(q2), h = m2 * l1 * l2 * Math.sin(q2);
    return {
        M: [[(m1 + m2) * l1 * l1 + m2 * l2 * l2 + 2 * m2 * l1 * l2 * c2, m2 * l2 * l2 + m2 * l1 * l2 * c2], [m2 * l2 * l2 + m2 * l1 * l2 * c2, m2 * l2 * l2]],
        C: [-h * (2 * w1 * w2 + w2 * w2), h * w1 * w1],
        G: [(m1 + m2) * G0 * l1 * Math.cos(q1) + m2 * G0 * l2 * Math.cos(q1 + q2), m2 * G0 * l2 * Math.cos(q1 + q2)]
    };
}
const det3 = J => J[0][0] * (J[1][1] * J[2][2] - J[1][2] * J[2][1]) - J[0][1] * (J[1][0] * J[2][2] - J[1][2] * J[2][0]) + J[0][2] * (J[1][0] * J[2][1] - J[1][1] * J[2][0]);
const mat2 = M => T`\begin{bmatrix}${tf(M[0][0])} & ${tf(M[0][1])}\\ ${tf(M[1][0])} & ${tf(M[1][1])}\end{bmatrix}`;
const vecTex = v => `(${v.map(x => tf(Math.abs(x) < 1e-12 ? 0 : x)).join(',\\ ')})`;

/* ---------- diagrams ---------- */
/* Maps world points (x right, y up) into the drawing box, keeping proportions. */
function fitter(pts, box=[120, 34, 600, 206]) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((box[2] - box[0]) / Math.max(x1 - x0, 1e-6), (box[3] - box[1]) / Math.max(y1 - y0, 1e-6));
    const ox = (box[0] + box[2]) / 2 - s * (x0 + x1) / 2, oy = (box[1] + box[3]) / 2 + s * (y0 + y1) / 2;
    return ([x, y]) => [+(ox + s * x).toFixed(1), +(oy - s * y).toFixed(1)];
}
/* A serial arm drawn through its joint positions, with a base, joint circles, link names and marked points. */
function armDiagram(world, label, {names=[], joints=[], marks=[], ground=true}={}) {
    const f = fitter([...world, ...marks.map(m => [m[0], m[1]])]), P = world.map(f), [bx, by] = P[0];
    let b = ground ? `<path d="M${bx - 30} ${by + 18}h60" stroke="#aab9a0"/><path d="M${bx - 14} ${by + 18}L${bx} ${by}l14 18"/>` : '';
    b += wire('M' + P.map(p => p.join(' ')).join('L'));
    P.slice(0, -1).forEach(([x, y]) => { b += ring(x, y, 7); });
    b += dot(...P[P.length - 1]);
    names.forEach((n, i) => {
        const [x1, y1] = P[i], [x2, y2] = P[i + 1], len = Math.hypot(x2 - x1, y2 - y1) || 1;
        b += dt(+((x1 + x2) / 2 - 18 * (y2 - y1) / len).toFixed(1), +((y1 + y2) / 2 + 18 * (x2 - x1) / len + 5).toFixed(1), n);
    });
    joints.forEach((n, i) => { const [x, y] = P[i]; b += dt(x + 22, y + 24, n); });
    marks.forEach(([x, y, n]) => { const [px, py] = f([x, y]); b += `<path d="M${px - 8} ${py - 8}l16 16m0 -16l-16 16" stroke="#b5532d"/>` + dt(px, py - 14, n); });
    return drawing(b, label, 240);
}
function motorCircuit(caption, load='J, b') {
    return drawing(element('DC', 110, 75, 110, 195, '') + dt(62, 140, 'V') + element('R', 110, 75, 250, 75, 'R') + element('L', 250, 75, 390, 75, 'L') +
        wire('M390 75h30v30M420 165v30H110') + ring(420, 135, 30) + dt(420, 141, 'M') + dt(352, 140, 'E = kω') +
        wire('M450 135h80') + `<rect x="530" y="100" width="44" height="70" rx="4"/>` + dt(552, 200, load) + dt(500, 122, 'τ = kI') +
        dt(360, 238, caption), 'DC motor equivalent circuit: supply, armature resistance and inductance, back-EMF, and a shaft driving an inertia. ' + caption, 250);
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
bank('kinematics', 'advanced', [{
    title: 'How much floor can a two-link arm reach?',
    diagram: sketch('Two-link arm on a fixed base; the hand can reach a ring.',
        ring(360, 125, 105) + ring(360, 125, 35) + guide('M360 125H465') + wire('M360 125L413.6 80L436.1 106.8') + ring(360, 125, 6) + ring(413.6, 80, 6) + dot(436.1, 106.8),
        [[372, 92, 'l₁ = 2 m'], [452, 82, 'l₂ = 1 m'], [530, 128, 'r = 3 m'], [360, 158, '1 m']]),
    text: T`A planar arm has a shoulder on a fixed base and an elbow. The links are $l_1 = 2\,\text{m}$ and $l_2 = 1\,\text{m}$, and both joints turn through a full circle. What floor area can the hand reach?`,
    parts: [ex('Reachable area', 8 * Math.PI, T`8\pi`, 'm²')],
    hints: [T`The hand's distance from the base is $r = \sqrt{l_1^2 + l_2^2 + 2l_1l_2\cos q_2}$. Which values can it take?`],
    steps: [T`$\cos q_2$ runs from $-1$ to $1$, so $r$ runs from $|l_1 - l_2| = 1\,\text{m}$ to $l_1 + l_2 = 3\,\text{m}$.`, T`The shoulder sweeps every direction, so the workspace is the ring $1 \le r \le 3$.`, T`Area $= \pi(3^2 - 1^2) = 8\pi \approx 25.13\,\text{m}^2$.`],
    idea: 'A workspace is the set of reachable positions: the elbow sets the radius and the shoulder sweeps it round. Equal links would close the hole in the middle.',
    prereq: 'Forward kinematics of a two-link arm; area of a ring.',
    verify: () => [NUM.simpson(r => Math.abs((r * r - 5) / 4) <= 1 ? 2 * Math.PI * r : 0, 0, 4, 40000)]
}, {
    title: 'Where a two-link arm is most agile',
    diagram: sketch('Two-link arm with equal links and the elbow bent at a right angle.',
        wire('M260 190L390 90L490 220') + ring(260, 190, 7) + ring(390, 90, 7) + dot(490, 220) + guide('M260 190L490 220') + `<path d="M260 208h-30m60 0h-30" stroke="#aab9a0"/>`,
        [[300, 128, 'L'], [462, 150, 'L'], [372, 226, 'r'], [412, 112, 'q₂']]),
    text: T`A planar two-link arm has equal links of length $L$. Its manipulability is $w = |\det J|$, where the Jacobian $J$ maps joint rates to hand velocity. At what distance from the base, as a multiple of $L$, is $w$ largest?`,
    parts: [ex(T`$r/L$`, Math.SQRT2, T`\sqrt2`)],
    hints: [T`For a two-link arm $\det J = l_1l_2\sin q_2$.`, T`Express the reach through $q_2$: $r^2 = l_1^2 + l_2^2 + 2l_1l_2\cos q_2$.`],
    steps: [T`$w = L^2|\sin q_2|$ is largest at $q_2 = 90^\circ$.`, T`There $r^2 = L^2 + L^2 + 2L^2\cos 90^\circ = 2L^2$, so $r = \sqrt2\,L$.`],
    idea: 'An arm is most agile with the elbow at a right angle and loses a direction of motion when stretched straight or folded back (det J = 0, a singularity). Workcells put the work near r = √2 L.',
    prereq: 'Jacobian of a two-link arm; determinants.',
    verify: () => {
        const p = (a, b) => [Math.cos(a) + Math.cos(a + b), Math.sin(a) + Math.sin(a + b)], h = 1e-6;
        let best = [0, 0];
        for (let q2 = 1e-3; q2 < Math.PI; q2 += 1e-4) {
            const p0 = p(.3, q2), pa = p(.3 + h, q2), pb = p(.3, q2 + h), d = Math.abs((pa[0] - p0[0]) * (pb[1] - p0[1]) - (pa[1] - p0[1]) * (pb[0] - p0[0])) / (h * h);
            if (d > best[1]) best = [q2, d];
        }
        return [Math.hypot(...p(.3, best[0]))];
    }
}, {
    title: 'Two quarter turns make a third of a turn',
    diagram: sketch('Right-handed x, y and z axes with quarter turns about x and then y.',
        arrow(360, 140, 500, 140) + arrow(360, 140, 360, 26) + arrow(360, 140, 268, 212) + guide('M360 140L452 48') +
        wire('M300 186a36 22 0 0 0 26 30') + wire('M456 120a20 36 0 0 1 22 36'),
        [[516, 146, 'y'], [360, 16, 'z'], [252, 226, 'x'], [478, 44, 'one equivalent axis'], [286, 170, '90°'], [500, 120, '90°']]),
    text: T`A rigid body is turned $90^\circ$ about the $x$ axis, then $90^\circ$ about the fixed $y$ axis. Together the two turns equal a single rotation about one axis. Through what angle?`,
    parts: [ex(T`Angle $\theta$`, 120, '120', '°')],
    hints: [T`Rotations about fixed axes multiply on the left: $R = R_y(90^\circ)\,R_x(90^\circ)$.`, T`For any rotation matrix, $\operatorname{tr}R = 1 + 2\cos\theta$.`],
    steps: [T`$R_x(90^\circ) = \begin{bmatrix}1&0&0\\0&0&-1\\0&1&0\end{bmatrix}$ and $R_y(90^\circ) = \begin{bmatrix}0&0&1\\0&1&0\\-1&0&0\end{bmatrix}$.`, T`$R = R_yR_x = \begin{bmatrix}0&1&0\\0&0&-1\\-1&0&0\end{bmatrix}$, so $\operatorname{tr}R = 0$.`, T`$1 + 2\cos\theta = 0 \Rightarrow \theta = 120^\circ$. The skew part of $R$ gives the axis, along $(1, 1, -1)/\sqrt3$.`],
    idea: 'Rotations do not add like vectors: two quarter turns about perpendicular axes make a third of a turn about a diagonal. Robots therefore track orientation with rotation matrices or quaternions, not sums of angles.',
    prereq: 'Rotation matrices; trace.',
    verify: () => {
        const c = Math.cos(Math.PI / 2), s = Math.sin(Math.PI / 2), R = NUM.matMul([[c, 0, s], [0, 1, 0], [-s, 0, c]], [[1, 0, 0], [0, c, -s], [0, s, c]]);
        return [Math.acos((R[0][0] + R[1][1] + R[2][2] - 1) / 2) * 180 / Math.PI];
    }
}, {
    title: 'Counting the freedoms of a hexapod',
    diagram: sketch('Stewart platform: a fixed base and a moving top plate joined by six extensible legs.',
        wire('M170 205H550') + wire('M270 70H450') + wire('M200 205L290 70M250 205L280 70M330 205L320 70M390 205L400 70M470 205L440 70M520 205L430 70') +
        [200, 250, 330, 390, 470, 520].map(x => ring(x, 205, 5)).join('') + [290, 280, 320, 400, 440, 430].map(x => ring(x, 70, 5)).join(''),
        [[360, 52, 'Moving top plate'], [360, 236, 'Fixed base'], [600, 140, 'U–P–S legs']]),
    text: T`A Stewart platform joins a fixed base to a moving top plate with six legs. Each leg has a universal joint at the base (2 freedoms), a sliding actuator (1) and a ball joint at the top (3). Use the Grübler–Kutzbach count $M = 6(n - 1 - j) + \sum f_i$ to find the mobility of the top plate.`,
    parts: [ex('Mobility M', 6, '6')],
    hints: [T`Count the bodies: base, top and two pieces per leg. Count the joints: three per leg.`],
    steps: [T`Bodies: $n = 2 + 6\times2 = 14$. Joints: $j = 6\times3 = 18$.`, T`Freedoms: $\sum f_i = 6(2 + 1 + 3) = 36$.`, T`$M = 6(14 - 1 - 18) + 36 = -30 + 36 = 6$: the plate can be placed and oriented freely, with one actuator per freedom.`],
    idea: 'Counting bodies and joints gives a mechanism’s degrees of freedom before any geometry. Six legs give a rigid body’s six freedoms, which is why flight simulators and precision hexapods use this layout.',
    prereq: 'Degrees of freedom of rigid bodies and joints.',
    verify: () => { const legs = 6, n = 2 + 2 * legs, j = 3 * legs, f = legs * (2 + 1 + 3); return [6 * (n - 1 - j) + f]; }
}]);

bank('robotcontrol', 'advanced', [{
    title: 'The damping that minimises squared error',
    diagram: curve('time ωₙt', 'error e(t)', [0, 10], [-0.4, 1], t => Math.exp(-.5 * t) * (Math.cos(Math.sqrt(.75) * t) + Math.sin(Math.sqrt(.75) * t) / Math.sqrt(3))),
    text: T`A robot joint with inertia $J$ runs under PD control, so its error obeys $J\ddot e + K_d\dot e + K_pe = 0$, starting from $e(0) = 1$, $\dot e(0) = 0$. With $K_p$ fixed, which damping ratio $\zeta$ minimises the integral of squared error $\int_0^\infty e^2\,dt$?`,
    parts: [ex(T`$\zeta$`, .5, T`\dfrac12`)],
    hints: [T`Write $\ddot e + 2\zeta\omega_n\dot e + \omega_n^2e = 0$. The integral equals $P_{11}$, where $A^{\mathsf T}P + PA = -\operatorname{diag}(1, 0)$.`],
    steps: [T`Solving the Lyapunov equation gives $\displaystyle\int_0^\infty e^2\,dt = \frac{1 + 4\zeta^2}{4\zeta\omega_n}$.`, T`$\dfrac{d}{d\zeta}\left(\dfrac{1}{\zeta} + 4\zeta\right) = -\dfrac{1}{\zeta^2} + 4 = 0 \Rightarrow \zeta = \tfrac12$.`, T`The minimum is $1/\omega_n$. The response overshoots by $e^{-\pi\zeta/\sqrt{1 - \zeta^2}} \approx 16\%$.`],
    idea: 'Squared-error criteria reward a fast rise and tolerate some overshoot, so the ISE optimum ζ = 1/2 is lighter than the critically damped tuning people often reach for.',
    prereq: 'Second-order systems; Lyapunov equation or Parseval’s theorem.',
    verify: () => {
        const ise = z => {
            const f = (e, v) => [v, -2 * z * v - e], h = 2e-3;
            let e = 1, v = 0, s = 0;
            for (let t = 0; t < 60; t += h) {
                const k1 = f(e, v), k2 = f(e + h / 2 * k1[0], v + h / 2 * k1[1]), k3 = f(e + h / 2 * k2[0], v + h / 2 * k2[1]), k4 = f(e + h * k3[0], v + h * k3[1]);
                const e2 = e + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
                v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
                s += h * (e * e + e2 * e2) / 2; e = e2;
            }
            return s;
        };
        let a = .2, b = 1;
        for (let i = 0; i < 40; i++) { const m1 = a + (b - a) * .382, m2 = a + (b - a) * .618; if (ise(m1) < ise(m2)) b = m2; else a = m1; }
        return [(a + b) / 2];
    }
}, {
    title: 'How much the shoulder’s inertia changes',
    diagram: sketch('Two-link arm with point masses at the elbow and the hand, shown stretched and folded.',
        wire('M120 150H260H400') + ring(120, 150, 7) + ring(260, 150, 9) + ring(400, 150, 9) + wire('M470 150H610L500 150') + ring(470, 150, 7) + ring(610, 150, 9) + ring(500, 158, 9),
        [[190, 134, 'L'], [330, 134, 'L'], [260, 182, 'm'], [400, 182, 'm'], [260, 220, 'Stretched: q₂ = 0'], [540, 220, 'Folded: q₂ = 180°']]),
    text: T`A two-link arm has equal links of length $L$, each massless with a point mass $m$ at its outer end. How many times larger is the inertia felt at the shoulder, $M_{11}$, with the arm stretched out than with the elbow folded back?`,
    parts: [ex('Ratio', 5, '5')],
    hints: [T`$M_{11} = (m_1 + m_2)l_1^2 + m_2l_2^2 + 2m_2l_1l_2\cos q_2$.`],
    steps: [T`With $m_1 = m_2 = m$ and $l_1 = l_2 = L$: $M_{11} = mL^2(3 + 2\cos q_2)$.`, T`Stretched ($q_2 = 0$): $5mL^2$. Folded ($q_2 = 180^\circ$): $mL^2$.`, T`Ratio $= 5$.`],
    idea: 'A robot’s inertia depends on its posture, so fixed-gain joint controllers must be tuned for the worst case or scheduled with configuration; computed-torque control cancels the variation.',
    prereq: 'Kinetic energy; the inertia matrix.',
    verify: () => {
        const elbow = a => [Math.cos(a), Math.sin(a)], tip = (a, b) => [Math.cos(a) + Math.cos(a + b), Math.sin(a) + Math.sin(a + b)], h = 1e-6;
        const M = q2 => { const v1 = elbow(h).map((v, i) => (v - elbow(0)[i]) / h), v2 = tip(h, q2).map((v, i) => (v - tip(0, q2)[i]) / h); return v1[0] ** 2 + v1[1] ** 2 + v2[0] ** 2 + v2[1] ** 2; };
        let hi = 0, lo = Infinity;
        for (let q2 = 0; q2 <= Math.PI + 1e-9; q2 += Math.PI / 1800) { const m = M(q2); hi = Math.max(hi, m); lo = Math.min(lo, m); }
        return [hi / lo];
    }
}, {
    title: 'The fastest quarter turn',
    diagram: curve('time t (s)', 'speed (rad/s)', [0, 1.77], [0, 1.8], t => 2 * Math.min(t, 1.7725 - t)),
    text: T`A joint behaves as a pure inertia whose acceleration is limited to $|\ddot\theta| \le 2\,\text{rad/s}^2$. What is the shortest time for a rest-to-rest move of $\pi/2\,\text{rad}$?`,
    parts: [ex('Minimum time', Math.sqrt(Math.PI), T`\sqrt{\pi}`, 's')],
    hints: [T`Bang-bang: full acceleration for half the move, full braking for the rest.`],
    steps: [T`By symmetry each half covers $\Theta/2$ in time $T/2$: $\tfrac12a(T/2)^2 = \Theta/2$.`, T`$T = 2\sqrt{\Theta/a} = 2\sqrt{\dfrac{\pi/2}{2}} = \sqrt{\pi} \approx 1.772\,\text{s}$.`, T`The peak speed is $aT/2 = \sqrt{\pi} \approx 1.77\,\text{rad/s}$.`],
    idea: 'With only an acceleration limit the time-optimal control is bang-bang (Pontryagin): always at a limit, switching once. Real drives add a speed limit, which gives the trapezoidal profile.',
    prereq: 'Constant-acceleration kinematics; optimal control (intuition).',
    verify: () => { let th = 0, v = 0, t = 0; const h = 1e-6; while (th < Math.PI / 4) { v += 2 * h; th += v * h; t += h; } return [2 * t]; }
}, {
    title: 'The smoothest move: peak speed against average',
    diagram: curve('time t/T', 'speed ÷ average speed', [0, 1], [0, 1.5], s => 6 * s * (1 - s)),
    text: T`A pure inertia must move a distance $\Theta$ in time $T$, starting and ending at rest. The torque profile minimises $\int_0^T \tau^2\,dt$, a proxy for copper losses. What is the ratio of peak speed to average speed $\Theta/T$?`,
    parts: [ex('Ratio', 1.5, T`\dfrac32`)],
    hints: [T`The Euler–Lagrange equation for $\int\ddot\theta^2\,dt$ is $\theta'''' = 0$: the motion is a cubic in time.`],
    steps: [T`With $s = t/T$: $\theta = \Theta(3s^2 - 2s^3)$ meets $\theta(0) = 0$, $\theta(T) = \Theta$ and zero speed at both ends.`, T`$\dot\theta = \dfrac{\Theta}{T}\,6s(1 - s)$, a parabola that peaks at $s = \tfrac12$.`, T`Peak $= \dfrac64\,\dfrac{\Theta}{T} = \dfrac32\,\dfrac{\Theta}{T}$. The torque falls linearly from $6J\Theta/T^2$ to $-6J\Theta/T^2$.`],
    idea: 'Minimum-effort moves are cubics with linearly varying torque: the starting point for the cubic and quintic trajectories used in robot motion planning.',
    prereq: 'Calculus of variations; polynomial trajectories.',
    verify: () => {
        const N = 2000, h = 1 / N, c = Array.from({length: N}, (_, i) => (N - i - .5) * h * h);
        const S12 = c.reduce((s, v) => s + v * h, 0), S22 = c.reduce((s, v) => s + v * v, 0), [l, m] = NUM.solve([[N * h * h, S12], [S12, S22]], [0, 1]);
        let v = 0, peak = 0;
        for (let i = 0; i < N; i++) { v += (l * h + m * c[i]) * h; peak = Math.max(peak, v); }
        return [peak];
    }
}]);

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
    diagram: signalChain(['Random walk|x + w', 'Sensor|z = x + v', 'Kalman filter|gain K'], 'Equal process and measurement noise: Q = R'),
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
function makeRoboticsExercise(topic, date, level) {
    const li = TIERS.indexOf(level); // 1 university, 2 challenge, 3 expert, 4 mastery
    if (!TOPICS.some(t => t.id === topic && t.group === 'robotics') || li < 1)
        throw Error('Unknown challenge selection');
    const pick = seededPicker(date, hashString(topic + level)), p = part;
    const q = (title, text, givens, parts, hints, steps, idea, diagram, prerequisites) => ({
        id: `${topic}-${level}`, title, text, givens, parts, hints, steps, idea, diagram, prerequisites, source: {reading: ROBO_READING[topic]}
    });

    if (topic === 'kinematics') {
        if (li === 1) {
            const l1 = pick([.5, .6, .8]), l2 = pick([.4, .5]), qa = rad(pick([10, 20, 35, 50])), qb = rad(pick([40, 60, 80, 100]));
            const t0 = fkN([l1, l2], [qa, qb])[2], x = +t0[0].toFixed(3), y = +t0[1].toFixed(3), [vx, vy] = pick([[.1, 0], [0, .1], [-.05, .1], [.08, -.06]]);
            const {c2, q1, q2} = ik2(l1, l2, x, y), s1 = Math.sin(q1), c1 = Math.cos(q1), s12 = Math.sin(q1 + q2), c12 = Math.cos(q1 + q2);
            const J = [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]], det = l1 * l2 * Math.sin(q2);
            const qd1 = (J[1][1] * vx - J[0][1] * vy) / det, qd2 = (-J[1][0] * vx + J[0][0] * vy) / det;
            return q('Inverse kinematics of a two-link arm', T`A planar arm has links $l_1 = ${l1}\,\text{m}$ and $l_2 = ${l2}\,\text{m}$; $q_1$ is measured from the $x$ axis and $q_2$ relative to link 1. The hand must reach $(x, y) = (${x}, ${y})\,\text{m}$, using the solution with $q_2 > 0$. Find both joint angles and $\det J$ there. Then find the joint rates that move the hand at $\mathbf v = (${vx}, ${vy})\,\text{m/s}$.`,
                [T`$l_1 = ${l1}\,\text{m}$, $l_2 = ${l2}\,\text{m}$`, T`Target $(${x}, ${y})\,\text{m}$`, T`$\mathbf v = (${vx}, ${vy})\,\text{m/s}$`],
                [p(T`$q_2$`, deg(q2), '°', .01, .05), p(T`$q_1$`, deg(q1), '°', .01, .05), p(T`$\det J$`, det, 'm²'), p(T`$\dot q_1$`, qd1, 'rad/s', .01, .002), p(T`$\dot q_2$`, qd2, 'rad/s', .01, .002)],
                [T`The law of cosines on the triangle base–elbow–hand gives $\cos q_2$.`, T`Then $q_1 = \operatorname{atan2}(y, x) - \operatorname{atan2}(l_2\sin q_2,\ l_1 + l_2\cos q_2)$.`, T`Differentiate the forward kinematics for $J$, then solve $J\dot{\mathbf q} = \mathbf v$.`],
                [T`$\cos q_2 = \dfrac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2} = ${tf(c2)}$, so $q_2 = ${tf(deg(q2))}^\circ$.`,
                    T`$q_1 = \operatorname{atan2}(y, x) - \operatorname{atan2}(l_2\sin q_2,\ l_1 + l_2\cos q_2) = ${tf(deg(q1))}^\circ$.`,
                    T`$J = \begin{bmatrix}-l_1s_1 - l_2s_{12} & -l_2s_{12}\\ l_1c_1 + l_2c_{12} & l_2c_{12}\end{bmatrix} = ${mat2(J)}$ and $\det J = l_1l_2\sin q_2 = ${tf(det)}\,\text{m}^2$.`,
                    T`$\dot q_1 = \dfrac{J_{22}v_x - J_{12}v_y}{\det J} = ${tf(qd1)}\,\text{rad/s}$ and $\dot q_2 = \dfrac{-J_{21}v_x + J_{11}v_y}{\det J} = ${tf(qd2)}\,\text{rad/s}$.`],
                'Inverse kinematics has two branches (elbow one way or the other); the Jacobian turns hand velocities into joint rates and fails where det J = 0.',
                armDiagram(fkN([l1, l2], [q1, q2]), 'Two-link planar arm reaching the target point', {names: ['l₁', 'l₂'], joints: ['q₁', 'q₂'], marks: [[x, y, 'target']]}),
                'Trigonometry; 2×2 matrices; the chain rule.');
        }
        if (li === 2) {
            const l1 = pick([.5, .6]), l2 = pick([.4, .5]), l3 = pick([.1, .15]), qs0 = [pick([20, 30, 40]), pick([50, 70, 90]), pick([-60, -40, -20])].map(rad);
            const phiDeg = Math.round(deg(qs0[0] + qs0[1] + qs0[2])), phi = rad(phiDeg), tip = fkN([l1, l2, l3], qs0)[3], x = +tip[0].toFixed(3), y = +tip[1].toFixed(3);
            const [Fx, Fy] = pick([[0, -20], [15, -10], [-10, -25], [20, 0]]);
            const wx = x - l3 * Math.cos(phi), wy = y - l3 * Math.sin(phi), {c2, q1, q2} = ik2(l1, l2, wx, wy), q3 = phi - q1 - q2;
            const pts = fkN([l1, l2, l3], [q1, q2, q3]), tau = [0, 1, 2].map(i => (pts[3][0] - pts[i][0]) * Fy - (pts[3][1] - pts[i][1]) * Fx);
            return q('A three-link arm: pose and joint torques', T`A planar arm has links $l_1 = ${l1}\,\text{m}$, $l_2 = ${l2}\,\text{m}$ and $l_3 = ${l3}\,\text{m}$ (relative joint angles; $q_1$ from the $x$ axis). The tool tip must sit at $(${x}, ${y})\,\text{m}$ with the last link at $\varphi = ${phiDeg}^\circ$ to the $x$ axis, using the solution with $q_2 > 0$. Find the three joint angles. The tool then pushes on its surroundings with $\mathbf F = (${Fx}, ${Fy})\,\text{N}$ and no moment: find the joint torques $\boldsymbol\tau = J^{\mathsf T}\mathbf F$.`,
                [T`$l = (${l1}, ${l2}, ${l3})\,\text{m}$`, T`Tip $(${x}, ${y})\,\text{m}$, $\varphi = ${phiDeg}^\circ$`, T`$\mathbf F = (${Fx}, ${Fy})\,\text{N}$`],
                [p(T`$q_1$`, deg(q1), '°', .01, .05), p(T`$q_2$`, deg(q2), '°', .01, .05), p(T`$q_3$`, deg(q3), '°', .01, .05), p(T`$\tau_1$`, tau[0], 'N·m', .01, .01), p(T`$\tau_2$`, tau[1], 'N·m', .01, .01), p(T`$\tau_3$`, tau[2], 'N·m', .01, .01)],
                [T`Step back from the tip along the last link to find the wrist; it is a two-link problem from there.`, T`$q_3 = \varphi - q_1 - q_2$.`, T`Column $i$ of the planar Jacobian is $(-(y_e - y_i),\ x_e - x_i)$, so $\tau_i = (x_e - x_i)F_y - (y_e - y_i)F_x$: the moment of $\mathbf F$ about joint $i$.`],
                [T`Wrist: $(x_w, y_w) = (x - l_3\cos\varphi,\ y - l_3\sin\varphi) = (${tf(wx)}, ${tf(wy)})\,\text{m}$.`,
                    T`$\cos q_2 = ${tf(c2)} \Rightarrow q_2 = ${tf(deg(q2))}^\circ$, and $q_1 = \operatorname{atan2}(y_w, x_w) - \operatorname{atan2}(l_2\sin q_2,\ l_1 + l_2\cos q_2) = ${tf(deg(q1))}^\circ$.`,
                    T`$q_3 = ${phiDeg}^\circ - q_1 - q_2 = ${tf(deg(q3))}^\circ$.`,
                    T`Joints at $(0, 0)$, $${vecTex(pts[1])}$ and $${vecTex(pts[2])}$; tip at $${vecTex(pts[3])}$.`,
                    T`$\boldsymbol\tau = ${vecTex(tau)}\,\text{N}\cdot\text{m}$.`],
                'Decouple position and orientation at the wrist, then use the Jacobian transpose for statics: joint torques are the moments of the tip force about each joint.',
                armDiagram(pts, 'Three-link planar arm with its tool tip at the target pose', {names: ['l₁', 'l₂', 'l₃'], joints: ['q₁', 'q₂', 'q₃'], marks: [[x, y, 'tip']]}),
                'Two-link inverse kinematics; moments; the Jacobian.');
        }
        if (li === 3) {
            const d1 = pick([.3, .4]), a2 = pick([.4, .5]), a3 = pick([.35, .4, .45]), [qa, qb, qc] = [pick([-40, 25, 60]), pick([30, 45, 60]), pick([-90, -70, -50])].map(rad);
            const r0 = a2 * Math.cos(qb) + a3 * Math.cos(qb + qc), x = +(r0 * Math.cos(qa)).toFixed(3), y = +(r0 * Math.sin(qa)).toFixed(3), z = +(d1 + a2 * Math.sin(qb) + a3 * Math.sin(qb + qc)).toFixed(3);
            const v = pick([[.1, 0, 0], [0, .1, 0], [0, 0, .1], [.05, -.05, .1]]);
            const q1 = Math.atan2(y, x), r = Math.hypot(x, y), s = z - d1, c3 = (r * r + s * s - a2 * a2 - a3 * a3) / (2 * a2 * a3), q3 = -Math.acos(c3), q2 = Math.atan2(s, r) - Math.atan2(a3 * Math.sin(q3), a2 + a3 * Math.cos(q3));
            const S = a2 * Math.sin(q2) + a3 * Math.sin(q2 + q3), R = a2 * Math.cos(q2) + a3 * Math.cos(q2 + q3), c1 = Math.cos(q1), s1 = Math.sin(q1), s23 = Math.sin(q2 + q3), c23 = Math.cos(q2 + q3);
            const J = [[-R * s1, -S * c1, -a3 * s23 * c1], [R * c1, -S * s1, -a3 * s23 * s1], [0, R, a3 * c23]], det = Math.abs(det3(J)), qd = NUM.solve(J, v);
            return q('An elbow arm in three dimensions', T`An elbow (anthropomorphic) arm has a base joint $q_1$ about the vertical axis, a shoulder at height $d_1 = ${d1}\,\text{m}$, and shoulder and elbow joints $q_2$, $q_3$ in the vertical plane, with links $a_2 = ${a2}\,\text{m}$ and $a_3 = ${a3}\,\text{m}$. $q_2$ is measured up from the horizontal and $q_3$ relative to the upper arm. The hand must reach $(${x}, ${y}, ${z})\,\text{m}$ with the arm facing the target and the elbow up ($q_3 < 0$). Find the joint angles and $|\det J|$. Then find the joint rates for a hand velocity $\mathbf v = (${v.join(', ')})\,\text{m/s}$.`,
                [T`$d_1 = ${d1}\,\text{m}$, $a_2 = ${a2}\,\text{m}$, $a_3 = ${a3}\,\text{m}$`, T`Target $(${x}, ${y}, ${z})\,\text{m}$`, T`$\mathbf v = (${v.join(', ')})\,\text{m/s}$`],
                [p(T`$q_1$`, deg(q1), '°', .01, .05), p(T`$q_2$`, deg(q2), '°', .01, .05), p(T`$q_3$`, deg(q3), '°', .01, .05), p(T`$|\det J|$`, det, 'm³'), p(T`$\dot q_1$`, qd[0], 'rad/s', .01, .002), p(T`$\dot q_2$`, qd[1], 'rad/s', .01, .002), p(T`$\dot q_3$`, qd[2], 'rad/s', .01, .002)],
                [T`$q_1 = \operatorname{atan2}(y, x)$. In the arm's plane, use $r = \sqrt{x^2 + y^2}$ and $s = z - d_1$ for a two-link problem.`, T`With $R = a_2c_2 + a_3c_{23}$ and $S = a_2s_2 + a_3s_{23}$ the hand is at $(Rc_1, Rs_1, d_1 + S)$. Differentiate for $J$.`, T`$\det J = -a_2a_3\sin q_3\,R$: singular when the arm is straight or the hand is above the base.`],
                [T`$q_1 = \operatorname{atan2}(${y}, ${x}) = ${tf(deg(q1))}^\circ$; $r = ${tf(r)}\,\text{m}$, $s = ${tf(s)}\,\text{m}$.`,
                    T`$\cos q_3 = \dfrac{r^2 + s^2 - a_2^2 - a_3^2}{2a_2a_3} = ${tf(c3)} \Rightarrow q_3 = ${tf(deg(q3))}^\circ$ (elbow up).`,
                    T`$q_2 = \operatorname{atan2}(s, r) - \operatorname{atan2}(a_3\sin q_3,\ a_2 + a_3\cos q_3) = ${tf(deg(q2))}^\circ$.`,
                    T`$J = \begin{bmatrix}-Rs_1 & -Sc_1 & -a_3s_{23}c_1\\ Rc_1 & -Ss_1 & -a_3s_{23}s_1\\ 0 & R & a_3c_{23}\end{bmatrix}$ with $R = ${tf(R)}$, $S = ${tf(S)}$; $|\det J| = a_2a_3|\sin q_3|\,R = ${tf(det)}\,\text{m}^3$.`,
                    T`Solving $J\dot{\mathbf q} = \mathbf v$: $\dot{\mathbf q} = ${vecTex(qd)}\,\text{rad/s}$.`],
                'A spatial elbow arm splits into a base rotation and a planar two-link problem; its Jacobian determinant shows both singularities at a glance.',
                armDiagram([[0, 0], [0, d1], [a2 * Math.cos(q2), d1 + a2 * Math.sin(q2)], [r, z]], 'Side view of the elbow arm in its vertical plane: base column, upper arm and forearm', {names: ['d₁', 'a₂', 'a₃'], joints: ['', 'q₂', 'q₃'], marks: [[r, z, 'hand (r, z)']]}),
                '3D forward kinematics; 3×3 linear systems.');
        }
        // Mastery: a redundant arm placing its hand at a point; choose the most manipulable posture.
        const l1 = 1, l2 = pick([.8, .9]), l3 = pick([.4, .5, .6]), rho = pick([1.2, 1.4, 1.6]), px = +(rho * Math.cos(rad(30))).toFixed(3), py = +(rho * Math.sin(rad(30))).toFixed(3);
        const R = Math.hypot(px, py), al = Math.atan2(py, px), cmin = (R * R + l3 * l3 - (l1 + l2) ** 2) / (2 * R * l3), width = cmin <= -1 ? 360 : 2 * deg(Math.acos(cmin));
        const conf = (phi, sg) => { const k = ik2(l1, l2, px - l3 * Math.cos(phi), py - l3 * Math.sin(phi), sg); return k && [k.q1, k.q2, phi - k.q1 - k.q2]; };
        const manip = qs => { const pts = fkN([l1, l2, l3], qs), e = pts[3]; let a = 0, b = 0, c = 0; for (let i = 0; i < 3; i++) { const jx = -(e[1] - pts[i][1]), jy = e[0] - pts[i][0]; a += jx * jx; b += jx * jy; c += jy * jy; } return Math.sqrt(Math.max(0, a * c - b * b)); };
        const wAt = (phi, sg) => { const c = conf(phi, sg); return c ? manip(c) : -1; };
        let best = {w: -1};
        const N = 3600;
        for (const sg of [1, -1]) for (let i = 0; i < N; i++) { const phi = al - Math.PI + 2 * Math.PI * i / N, w = wAt(phi, sg); if (w > best.w) best = {w, phi, sg}; }
        let a = best.phi - 2 * Math.PI / N, b = best.phi + 2 * Math.PI / N;
        for (let i = 0; i < 60; i++) { const m1 = a + (b - a) * .382, m2 = a + (b - a) * .618; if (wAt(m1, best.sg) > wAt(m2, best.sg)) b = m2; else a = m1; }
        const phiOpt = (a + b) / 2, qOpt = conf(phiOpt, best.sg), wMax = manip(qOpt), off = Math.abs(deg(Math.atan2(Math.sin(phiOpt - al), Math.cos(phiOpt - al)))), q0 = conf(al, 1), w0 = manip(q0);
        return q('Choosing the best posture of a redundant arm', T`A planar three-link arm ($l_1 = ${l1}\,\text{m}$, $l_2 = ${l2}\,\text{m}$, $l_3 = ${l3}\,\text{m}$) must hold its hand at $(${px}, ${py})\,\text{m}$, a distance $\rho = ${rho}\,\text{m}$ from the base along $30^\circ$. Only the position is specified, so the hand angle $\varphi$ (of the last link) is free: one extra degree of freedom. Find the range of feasible hand angles. Then, over every feasible $\varphi$ and both elbow branches, find the largest manipulability $w = \sqrt{\det(JJ^{\mathsf T})}$ of the $2\times3$ position Jacobian, the hand angle relative to the target direction and the elbow angle $|q_2|$ at that posture, and $w$ with the last link pointing straight at the target ($\varphi = 30^\circ$, $q_2 > 0$).`,
            [T`$l = (${l1}, ${l2}, ${l3})\,\text{m}$`, T`Hand at $(${px}, ${py})\,\text{m}$`, T`Search: hand angle $\varphi$ and both elbow branches`],
            [p('Width of the feasible range of φ', width, '°', .01, .05), p(T`$w_{\max}$`, wMax, 'm²'), p(T`$|\varphi - 30^\circ|$ at $w_{\max}$`, off, '°', .01, .3), p(T`$|q_2|$ at $w_{\max}$`, deg(Math.abs(qOpt[1])), '°', .01, .3), p(T`$w$ at $\varphi = 30^\circ$`, w0, 'm²')],
            [T`The hand angle fixes the wrist, $\mathbf w = \mathbf p - l_3(\cos\varphi, \sin\varphi)$, which the first two links must reach: $|l_1 - l_2| \le |\mathbf w| \le l_1 + l_2$.`, T`For each feasible $\varphi$ and branch, solve the two-link problem; the Jacobian columns are $(-(y_e - y_i),\ x_e - x_i)$ for joints $i = 1, 2, 3$.`, T`Scan $\varphi$ finely on both branches, then refine the best point (golden section). Mirror postures about the target line have equal $w$.`],
            [T`$|\mathbf w|^2 = \rho^2 + l_3^2 - 2\rho l_3\cos(\varphi - 30^\circ) \le (l_1 + l_2)^2$ gives $\cos(\varphi - 30^\circ) \ge ${tf(cmin)}$${cmin <= -1 ? ', true for every angle, so all 360° are feasible' : T`, a range of $2\arccos(${tf(cmin)}) = ${tf(width)}^\circ$`}.`,
                T`At $\varphi = 30^\circ$ ($q_2 > 0$): $\mathbf q = ${vecTex(q0.map(deg))}^\circ$ and $w = ${tf(w0)}\,\text{m}^2$.`,
                T`Scanning $\varphi$ in $0.1^\circ$ steps on both branches and refining: $w_{\max} = ${tf(wMax)}\,\text{m}^2$ at $\varphi - 30^\circ = \pm${tf(off)}^\circ$.`,
                T`There $\mathbf q = ${vecTex(qOpt.map(deg))}^\circ$, so $|q_2| = ${tf(deg(Math.abs(qOpt[1])))}^\circ$. The mirror posture about the line to the target gives the same $w$.`],
            'Redundancy leaves a family of postures (the self-motion) for one hand position; resolving it by maximising manipulability keeps the arm far from singularities, as redundant industrial arms do online.',
            armDiagram(fkN([l1, l2, l3], qOpt), 'Redundant three-link arm in its most manipulable posture for the given hand position', {names: ['l₁', 'l₂', 'l₃'], joints: ['q₁', 'q₂', 'q₃'], marks: [[px, py, 'hand']]}),
            'Inverse kinematics; Jacobians; numerical optimisation.');
    }

    if (topic === 'robotcontrol') {
        if (li === 1) {
            const m = pick([1.5, 2, 3]), l = pick([.4, .5, .6]), wn = pick([8, 10, 12]), z = pick([.7, .8, 1]), thd = pick([20, 30, 45]);
            const I = m * l * l / 3, Kp = I * wn * wn, Kd = 2 * z * I * wn, tg = m * G0 * l / 2, e = NUM.bisect(e => Kp * e - tg * Math.cos(rad(thd) - e), 0, Math.PI / 2);
            return q('PD control of a single link against gravity', T`A uniform link of mass $m = ${m}\,\text{kg}$ and length $l = ${l}\,\text{m}$ turns about one end in a vertical plane; $\theta$ is measured up from the horizontal. A PD controller $\tau = K_p(\theta_d - \theta) - K_d\dot\theta$ is tuned so that the loop, with gravity ignored, has $\omega_n = ${wn}\,\text{rad/s}$ and $\zeta = ${z}$. Find the link's inertia about the joint, $K_p$ and $K_d$, and the torque needed to hold the link horizontal. With no gravity compensation, the link settles below $\theta_d = ${thd}^\circ$: find the steady-state error.`,
                [T`$m = ${m}\,\text{kg}$, $l = ${l}\,\text{m}$`, T`$\omega_n = ${wn}\,\text{rad/s}$, $\zeta = ${z}$`, T`$\theta_d = ${thd}^\circ$, $g = 9.81\,\text{m/s}^2$`],
                [p(T`$I$`, I, 'kg·m²'), p(T`$K_p$`, Kp, 'N·m/rad'), p(T`$K_d$`, Kd, 'N·m·s/rad'), p('Holding torque, horizontal', tg, 'N·m'), p('Steady-state error', deg(e), '°')],
                [T`A uniform rod about one end: $I = ml^2/3$. Matching $I s^2 + K_ds + K_p$ to $I(s^2 + 2\zeta\omega_ns + \omega_n^2)$ gives the gains.`, T`Gravity torque: $mg\tfrac l2\cos\theta$.`, T`At rest the controller balances gravity: $K_pe = mg\tfrac l2\cos(\theta_d - e)$. Solve numerically.`],
                [T`$I = \dfrac{ml^2}{3} = ${tf(I)}\,\text{kg}\cdot\text{m}^2$.`, T`$K_p = I\omega_n^2 = ${tf(Kp)}\,\text{N}\cdot\text{m/rad}$ and $K_d = 2\zeta\omega_nI = ${tf(Kd)}\,\text{N}\cdot\text{m}\cdot\text{s/rad}$.`, T`Horizontal: $\tau = mg\,l/2 = ${tf(tg)}\,\text{N}\cdot\text{m}$.`, T`$${tf(Kp)}\,e = ${tf(tg)}\cos(${thd}^\circ - e)$ has the root $e = ${tf(e)}\,\text{rad} = ${tf(deg(e))}^\circ$ (bisection).`],
                'PD control leaves a gravity-dependent offset; adding the gravity torque as feedforward (or integral action) removes it.',
                armDiagram([[0, 0], [l * Math.cos(rad(thd)), l * Math.sin(rad(thd))]], 'Single link pivoting about one end in a vertical plane, at the desired angle', {names: ['l, m'], joints: ['θ'], marks: []}),
                'Rigid-body rotation; second-order systems; root finding.');
        }
        if (li === 2) {
            const m1 = pick([2, 3]), m2 = pick([1, 1.5, 2]), l1 = pick([.5, .6]), l2 = pick([.4, .5]), qdeg = [pick([0, 30, 45]), pick([30, 60, 90])], qq = qdeg.map(rad), w = pick([[1, 2], [2, -1], [-1.5, 1]]), acc = pick([[2, -1], [3, 4], [-2, 5]]);
            const {M, C, G} = arm2(m1, m2, l1, l2, qq, w), tau = [0, 1].map(i => M[i][0] * acc[0] + M[i][1] * acc[1] + C[i] + G[i]);
            return q('Torques for a two-link arm in motion', T`A two-link arm moves in a vertical plane, with point masses $m_1 = ${m1}\,\text{kg}$ and $m_2 = ${m2}\,\text{kg}$ at the ends of massless links $l_1 = ${l1}\,\text{m}$ and $l_2 = ${l2}\,\text{m}$. $q_1$ is measured from the horizontal and $q_2$ relative to link 1. At $\mathbf q = (${qdeg[0]}^\circ, ${qdeg[1]}^\circ)$, $\dot{\mathbf q} = (${w.join(', ')})\,\text{rad/s}$ and $\ddot{\mathbf q} = (${acc.join(', ')})\,\text{rad/s}^2$, find the inertia matrix, the velocity (Coriolis and centrifugal) torque at joint 1, and the joint torques. $g = 9.81\,\text{m/s}^2$.`,
                [T`$m = (${m1}, ${m2})\,\text{kg}$, $l = (${l1}, ${l2})\,\text{m}$`, T`$\mathbf q = (${qdeg[0]}^\circ, ${qdeg[1]}^\circ)$`, T`$\dot{\mathbf q} = (${w.join(', ')})$, $\ddot{\mathbf q} = (${acc.join(', ')})$`],
                [p(T`$M_{11}$`, M[0][0], 'kg·m²'), p(T`$M_{12}$`, M[0][1], 'kg·m²'), p(T`$M_{22}$`, M[1][1], 'kg·m²'), p('Velocity torque at joint 1', C[0], 'N·m', .01, .002), p(T`$\tau_1$`, tau[0], 'N·m', .01, .005), p(T`$\tau_2$`, tau[1], 'N·m', .01, .005)],
                [T`$M = \begin{bmatrix}(m_1 + m_2)l_1^2 + m_2l_2^2 + 2m_2l_1l_2c_2 & m_2l_2^2 + m_2l_1l_2c_2\\ m_2l_2^2 + m_2l_1l_2c_2 & m_2l_2^2\end{bmatrix}$.`, T`With $h = m_2l_1l_2\sin q_2$: velocity torques $-h(2\dot q_1\dot q_2 + \dot q_2^2)$ and $h\dot q_1^2$.`, T`Gravity: $(m_1 + m_2)gl_1c_1 + m_2gl_2c_{12}$ and $m_2gl_2c_{12}$. Then $\boldsymbol\tau = M\ddot{\mathbf q} + \mathbf c + \mathbf g$.`],
                [T`$M = ${mat2(M)}\,\text{kg}\cdot\text{m}^2$.`, T`Velocity torques: $\mathbf c = ${vecTex(C)}\,\text{N}\cdot\text{m}$.`, T`Gravity torques: $\mathbf g = ${vecTex(G)}\,\text{N}\cdot\text{m}$.`, T`$\boldsymbol\tau = M\ddot{\mathbf q} + \mathbf c + \mathbf g = ${vecTex(tau)}\,\text{N}\cdot\text{m}$.`],
                'The Lagrangian model M(q)q̈ + c(q, q̇) + g(q) = τ is the basis of computed-torque control: evaluate it at the desired motion and the robot follows.',
                armDiagram(fkN([l1, l2], qq), 'Two-link arm with point masses at the elbow and hand, in a vertical plane', {names: ['l₁', 'l₂'], joints: ['q₁', 'q₂'], marks: []}),
                'Lagrangian mechanics; matrices.');
        }
        if (li === 3) {
            const Jm = pick([.01, .015, .02]), JL = pick([.05, .08, .1]), k = pick([50, 80, 120]), Kp = pick([5, 8, 10]), Kd = pick([.2, .3, .5]), td = pick([.5, 1, 2]);
            const wa = Math.sqrt(k / JL), wr = Math.sqrt(k * (Jm + JL) / (Jm * JL));
            const roots = NUM.polyRoots([Jm * JL, Kd * JL / wr, (Jm * k + JL * (Kp + k)) / wr ** 2, Kd * k / wr ** 3, Kp * k / wr ** 4]).map(r => cx(r.re * wr, r.im * wr));
            const pairs = roots.filter(r => r.im > 1e-9).map(r => ({z: -r.re / cabs(r), w: cabs(r)})).sort((a, b) => a.z - b.z), least = pairs[0] || {z: 1, w: cabs(roots[0])};
            const defl = deg(td * (1 / Kp + 1 / k));
            return q('A flexible joint under motor-side PD control', T`A robot joint is modelled as a motor inertia $J_m = ${Jm}\,\text{kg}\cdot\text{m}^2$ (referred to the link side) coupled through a torsional stiffness $k = ${k}\,\text{N}\cdot\text{m/rad}$ to a link inertia $J_L = ${JL}\,\text{kg}\cdot\text{m}^2$. A PD controller acts on the motor angle only: $\tau = -K_p\theta_m - K_d\dot\theta_m$ with $K_p = ${Kp}\,\text{N}\cdot\text{m/rad}$ and $K_d = ${Kd}\,\text{N}\cdot\text{m}\cdot\text{s/rad}$. Find the open-loop antiresonance (link with locked motor) and resonance frequencies, the damping ratio and natural frequency of the least-damped closed-loop pole pair, and the static link deflection when a torque $\tau_d = ${td}\,\text{N}\cdot\text{m}$ acts on the link.`,
                [T`$J_m = ${Jm}$, $J_L = ${JL}\,\text{kg}\cdot\text{m}^2$`, T`$k = ${k}\,\text{N}\cdot\text{m/rad}$`, T`$K_p = ${Kp}$, $K_d = ${Kd}$; $\tau_d = ${td}\,\text{N}\cdot\text{m}$`],
                [p(T`$\omega_a$`, wa, 'rad/s'), p(T`$\omega_r$`, wr, 'rad/s'), p(T`$\zeta_{\min}$`, least.z), p('Its natural frequency', least.w, 'rad/s'), p('Static link deflection', defl, '°')],
                [T`$\omega_a = \sqrt{k/J_L}$; $\omega_r = \sqrt{k(J_m + J_L)/(J_mJ_L)}$.`, T`Closed loop: $(J_ms^2 + K_ds + K_p + k)(J_Ls^2 + k) - k^2 = 0$, a quartic. Find its roots numerically.`, T`At rest: the motor angle is $\tau_d/K_p$ and the spring twists by $\tau_d/k$.`],
                [T`$\omega_a = ${tf(wa)}\,\text{rad/s}$ and $\omega_r = ${tf(wr)}\,\text{rad/s}$.`, T`Quartic: $${tf(Jm * JL)}s^4 + ${tf(Kd * JL)}s^3 + ${tf(Jm * k + JL * (Kp + k))}s^2 + ${tf(Kd * k)}s + ${tf(Kp * k)} = 0$.`, T`Roots: $${roots.filter(r => r.im >= 0).map(r => tc(r)).join(',\\ ')}$ (and conjugates).`, T`Least damped: $\zeta = -\operatorname{Re}s/|s| = ${tf(least.z)}$ at $|s| = ${tf(least.w)}\,\text{rad/s}$.`, T`Deflection $= \tau_d\left(\dfrac1{K_p} + \dfrac1k\right) = ${tf(defl)}^\circ$.`],
                'Feedback on the motor side cannot damp the link mode much: the poles near the resonance stay lightly damped. This limits the bandwidth of robots with harmonic drives or elastic joints.',
                drawing(`<rect x="110" y="80" width="110" height="90" rx="6"/>` + wire('M220 125h40l10 -16 20 32 20 -32 20 32 20 -32 10 16h40') + `<rect x="400" y="70" width="140" height="110" rx="6"/>` + arrow(60, 125, 108, 125) + dt(165, 130, 'Jₘ') + dt(470, 130, 'J_L') + dt(320, 90, 'k') + dt(60, 108, 'τ') + dt(165, 210, 'θₘ (measured)') + dt(470, 210, 'θ_L'), 'Two-inertia model of a flexible joint: motor inertia, torsional spring and link inertia, with torque applied at the motor', 230),
                'Two-mass systems; polynomial roots; damping ratio.');
        }
        // Mastery: simulate a two-link arm under PD control with gravity compensation.
        const m1 = pick([2, 3]), m2 = pick([1, 1.5]), l1 = .5, l2 = .4, qdd = [pick([45, 60, 90]), pick([-45, 30, 60])], qd = qdd.map(rad), Kp = [pick([40, 60, 80]), pick([15, 20, 30])], Kd = [pick([4, 6]), pick([1, 1.5, 2])];
        const f = (s) => { const qv = [s[0], s[1]], w = [s[2], s[3]], {M, C} = arm2(m1, m2, l1, l2, qv, w), u = [0, 1].map(i => Kp[i] * (qd[i] - qv[i]) - Kd[i] * w[i] - C[i]), dm = M[0][0] * M[1][1] - M[0][1] * M[1][0]; return [w[0], w[1], (M[1][1] * u[0] - M[0][1] * u[1]) / dm, (M[0][0] * u[1] - M[1][0] * u[0]) / dm]; };
        const h = 2e-3;
        let s = [0, 0, 0, 0], t = 0, peakKE = 0, over = 0, cross = null, q05 = null;
        for (let i = 0; i < 1500; i++) {
            const k1 = f(s), k2 = f(s.map((v, j) => v + h / 2 * k1[j])), k3 = f(s.map((v, j) => v + h / 2 * k2[j])), k4 = f(s.map((v, j) => v + h * k3[j]));
            const ns = s.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
            if (cross === null && (ns[0] - qd[0]) >= 0) cross = t + h * (qd[0] - s[0]) / (ns[0] - s[0]);
            s = ns; t += h;
            if (Math.abs(t - .5) < h / 2) q05 = [s[0], s[1]];
            const {M} = arm2(m1, m2, l1, l2, [s[0], s[1]], [s[2], s[3]]), ke = .5 * (s[2] * (M[0][0] * s[2] + M[0][1] * s[3]) + s[3] * (M[1][0] * s[2] + M[1][1] * s[3]));
            peakKE = Math.max(peakKE, ke); over = Math.max(over, (s[1] - qd[1]) * Math.sign(qd[1]));
        }
        return q('Simulating a two-link arm under PD control', T`A two-link arm in a vertical plane has point masses $m_1 = ${m1}\,\text{kg}$ and $m_2 = ${m2}\,\text{kg}$ at the ends of massless links $l_1 = ${l1}\,\text{m}$ and $l_2 = ${l2}\,\text{m}$ ($q_1$ from the horizontal, $q_2$ relative). Starting at rest at $\mathbf q = (0, 0)$, it is driven to $\mathbf q_d = (${qdd[0]}^\circ, ${qdd[1]}^\circ)$ by PD control with exact gravity compensation, $\boldsymbol\tau = K_p(\mathbf q_d - \mathbf q) - K_d\dot{\mathbf q} + \mathbf g(\mathbf q)$, with $K_p = \operatorname{diag}(${Kp.join(', ')})\,\text{N}\cdot\text{m/rad}$ and $K_d = \operatorname{diag}(${Kd.join(', ')})\,\text{N}\cdot\text{m}\cdot\text{s/rad}$. Integrate the full nonlinear dynamics for 3 s. Find both joint angles at $t = 0.5\,\text{s}$, the time when $q_1$ first reaches its target, the largest overshoot of $q_2$ past its target, and the peak kinetic energy.`,
            [T`$m = (${m1}, ${m2})\,\text{kg}$, $l = (${l1}, ${l2})\,\text{m}$`, T`$\mathbf q_d = (${qdd[0]}^\circ, ${qdd[1]}^\circ)$`, T`$K_p = \operatorname{diag}(${Kp.join(', ')})$, $K_d = \operatorname{diag}(${Kd.join(', ')})$`],
            [p(T`$q_1(0.5\,\text{s})$`, deg(q05[0]), '°', .01, .1), p(T`$q_2(0.5\,\text{s})$`, deg(q05[1]), '°', .01, .1), p(T`First time $q_1 = q_{1d}$`, cross ?? 3, 's'), p(T`Peak overshoot of $q_2$`, deg(Math.max(0, over)), '°', .02, .1), p('Peak kinetic energy', peakKE, 'J')],
            [T`Gravity cancels exactly, leaving $M(\mathbf q)\ddot{\mathbf q} + \mathbf c(\mathbf q, \dot{\mathbf q}) = K_p(\mathbf q_d - \mathbf q) - K_d\dot{\mathbf q}$.`, T`Write the state $(q_1, q_2, \dot q_1, \dot q_2)$, solve the $2\times2$ system for $\ddot{\mathbf q}$ at each step, and integrate with RK4 ($h = 2\,\text{ms}$ is ample).`, T`Kinetic energy: $\tfrac12\dot{\mathbf q}^{\mathsf T}M(\mathbf q)\dot{\mathbf q}$. Interpolate between steps for the crossing time.`],
            [T`$M$ and $\mathbf c$ as for two point-mass links: $M_{11} = (m_1 + m_2)l_1^2 + m_2l_2^2 + 2m_2l_1l_2\cos q_2$, $M_{12} = m_2l_2^2 + m_2l_1l_2\cos q_2$, $M_{22} = m_2l_2^2$; $\mathbf c = h\,(-2\dot q_1\dot q_2 - \dot q_2^2,\ \dot q_1^2)$, $h = m_2l_1l_2\sin q_2$.`,
                T`RK4 with $h = 2\,\text{ms}$ for 1500 steps: $\mathbf q(0.5\,\text{s}) = (${tf(deg(q05[0]))}^\circ, ${tf(deg(q05[1]))}^\circ)$.`,
                T`$q_1$ first reaches $${qdd[0]}^\circ$ at $t = ${tf(cross ?? 3)}\,\text{s}$; $q_2$ overshoots by at most $${tf(deg(Math.max(0, over)))}^\circ$.`,
                T`Peak kinetic energy: $${tf(peakKE)}\,\text{J}$.`, T`With gravity compensation, $V = \tfrac12\dot{\mathbf q}^{\mathsf T}M\dot{\mathbf q} + \tfrac12\mathbf e^{\mathsf T}K_p\mathbf e$ never increases, so the arm settles at $\mathbf q_d$.`],
            'PD plus gravity compensation is globally stable for any positive gains (a Lyapunov argument), but the transient still depends on the posture-dependent inertia and coupling: simulation shows it.',
            armDiagram(fkN([l1, l2], qd), 'Two-link arm at its target posture, driven from the horizontal by PD control', {names: ['l₁', 'l₂'], joints: ['q₁', 'q₂'], marks: []}),
            'Nonlinear ODEs; Runge–Kutta integration; Lagrangian dynamics.');
    }

    if (topic === 'motors') {
        if (li === 1) {
            const V = pick([12, 24, 48]), R = pick([.5, 1, 2]), K = pick([.03, .05, .08]), stall = K * V / R, tl = +(stall * pick([.2, .3, .4])).toFixed(3);
            const w0 = V / K, I = tl / K, w = (V - I * R) / K, eta = tl * w / (V * I), rpm = x => x * 60 / (2 * Math.PI);
            return q('A DC motor at its operating point', T`A permanent-magnet DC motor has armature resistance $R = ${R}\,\Omega$ and motor constant $k = ${K}\,\text{V}\cdot\text{s/rad}$ ($= \text{N}\cdot\text{m/A}$), and runs from $V = ${V}\,\text{V}$. Ignore friction and inductance. Find the no-load speed and the stall torque. It drives a load of $${tl}\,\text{N}\cdot\text{m}$: find the speed, the current and the efficiency.`,
                [T`$V = ${V}\,\text{V}$, $R = ${R}\,\Omega$`, T`$k = ${K}\,\text{N}\cdot\text{m/A}$`, T`Load $${tl}\,\text{N}\cdot\text{m}$`],
                [p('No-load speed', rpm(w0), 'rpm'), p('Stall torque', stall, 'N·m'), p('Speed under load', rpm(w), 'rpm'), p('Current', I, 'A'), p('Efficiency', 100 * eta, '%')],
                [T`$V = IR + k\omega$ and $\tau = kI$.`, T`No load: $I = 0$. Stall: $\omega = 0$.`, T`Efficiency $= \dfrac{\tau\omega}{VI}$.`],
                [T`$\omega_0 = V/k = ${tf(w0)}\,\text{rad/s} = ${tf(rpm(w0))}\,\text{rpm}$.`, T`$\tau_s = kV/R = ${tf(stall)}\,\text{N}\cdot\text{m}$.`, T`$I = \tau/k = ${tf(I)}\,\text{A}$; $\omega = (V - IR)/k = ${tf(w)}\,\text{rad/s} = ${tf(rpm(w))}\,\text{rpm}$.`, T`$\eta = \dfrac{${tl}\times${tf(w)}}{${V}\times${tf(I)}} = ${tf(100 * eta)}\%$.`],
                'Two constants describe a DC motor: k converts current to torque and speed to voltage, R sets the slope of the torque–speed line.',
                motorCircuit('Steady state: L plays no part'),
                'Ohm’s law; DC motor equations.');
        }
        if (li === 2) {
            const R = pick([1, 2]), L = pick([.2e-3, .5e-3]), K = pick([.03, .05]), J = pick([5e-5, 1e-4, 2e-4]), b = pick([1e-5, 2e-5]), V = pick([6, 12]);
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
            const pp = pick([2, 4, 5]), psi = pick([.01, .015, .02]), Tq = pick([.5, 1, 1.5]), Rs = pick([.1, .2]), L = pick([.2e-3, .4e-3]), n = pick([2000, 3000]), Vdc = pick([24, 48]);
            const iq = Tq / (1.5 * pp * psi), we = pp * n * 2 * Math.PI / 60, vd = -we * L * iq, vq = Rs * iq + we * psi, vm = Math.hypot(vd, vq), Vmax = Vdc / Math.sqrt(3);
            const A = psi * psi + L * L * iq * iq, B = 2 * Rs * iq * psi, Cc = Rs * Rs * iq * iq - Vmax * Vmax, web = (-B + Math.sqrt(B * B - 4 * A * Cc)) / (2 * A), nb = web / pp * 60 / (2 * Math.PI);
            return q('A brushless motor in the dq frame', T`A surface permanent-magnet synchronous motor has $${pp}$ pole pairs, magnet flux linkage $\psi = ${psi}\,\text{V}\cdot\text{s}$, stator resistance $R_s = ${Rs}\,\Omega$ and $L_d = L_q = ${tf(L * 1e3)}\,\text{mH}$. Torque is $T = \tfrac32p\psi i_q$ (amplitude-invariant dq). Running at $${n}\,\text{rpm}$ in steady state with $i_d = 0$, it must deliver $${Tq}\,\text{N}\cdot\text{m}$. Find $i_q$, the electrical speed, $v_d$, $v_q$ and the voltage magnitude. The inverter, on a $${Vdc}\,\text{V}$ bus, can supply at most $V_{dc}/\sqrt3$: find the highest speed at which this torque is possible with $i_d = 0$.`,
                [T`$p = ${pp}$, $\psi = ${psi}\,\text{V}\cdot\text{s}$`, T`$R_s = ${Rs}\,\Omega$, $L = ${tf(L * 1e3)}\,\text{mH}$`, T`$${n}\,\text{rpm}$, $T = ${Tq}\,\text{N}\cdot\text{m}$, $V_{dc} = ${Vdc}\,\text{V}$`],
                [p(T`$i_q$`, iq, 'A'), p(T`$\omega_e$`, we, 'rad/s'), p(T`$v_d$`, vd, 'V'), p(T`$v_q$`, vq, 'V'), p(T`$|v|$`, vm, 'V'), p('Base speed at this torque', nb, 'rpm')],
                [T`Steady-state dq equations: $v_d = R_si_d - \omega_eLi_q$, $v_q = R_si_q + \omega_e(Li_d + \psi)$.`, T`$\omega_e = p\,\omega_m$.`, T`With $i_d = 0$: $(R_si_q + \omega_e\psi)^2 + (\omega_eLi_q)^2 = V_{\max}^2$ is a quadratic in $\omega_e$.`],
                [T`$i_q = \dfrac{T}{1.5p\psi} = ${tf(iq)}\,\text{A}$.`, T`$\omega_e = ${pp}\times${n}\cdot\dfrac{2\pi}{60} = ${tf(we)}\,\text{rad/s}$.`, T`$v_d = -\omega_eLi_q = ${tf(vd)}\,\text{V}$; $v_q = R_si_q + \omega_e\psi = ${tf(vq)}\,\text{V}$; $|v| = ${tf(vm)}\,\text{V}$.`, T`$V_{\max} = ${Vdc}/\sqrt3 = ${tf(Vmax)}\,\text{V}$. Solving $(\psi^2 + L^2i_q^2)\omega_e^2 + 2R_si_q\psi\,\omega_e + R_s^2i_q^2 - V_{\max}^2 = 0$: $\omega_e = ${tf(web)}\,\text{rad/s}$, i.e. $${tf(nb)}\,\text{rpm}$.`],
                'In the rotating dq frame a brushless motor looks like a DC motor: i_q makes torque and the back-EMF ωψ grows with speed until the inverter runs out of voltage.',
                drawing(wire('M100 210V40M100 210H620') + arrow(100, 210, 100, 40) + arrow(100, 210, 620, 210) + arrow(100, 210, 400, 80) + guide('M400 80V210M100 80H400') + dt(80, 40, 'q') + dt(630, 230, 'd') + dt(425, 72, 'v') + dt(250, 120, '|v|') + dt(560, 140, 'voltage limit V_dc/√3'), 'Voltage vector in the dq plane with its d and q components', 250),
                'Synchronous machines; Park transform; quadratic equations.');
        }
        // Mastery: field weakening with resistance, at a speed above base speed.
        const pp = pick([3, 4]), psi = pick([.01, .012]), L = pick([.3e-3, .5e-3]), Rs = pick([.05, .08]), Im = pick([15, 20]), Vm = pick([14, 20]);
        const iqv = (we, id) => { const a = we * we * L * L + Rs * Rs, b = Rs * we * psi, c = Rs * Rs * id * id + we * we * (psi + L * id) ** 2, dd = b * b - a * (c - Vm * Vm); return dd < 0 ? -1 : (-b + Math.sqrt(dd)) / a; };
        const web = NUM.bisect(we => iqv(we, 0) - Im, 1, 1e5), wmax = psi > L * Im ? Math.sqrt(Vm * Vm - Rs * Rs * Im * Im) / (psi - L * Im) : 3 * web;
        const rpmOf = we => we / pp * 60 / (2 * Math.PI), n = Math.round(rpmOf(web + pick([.3, .5, .7]) * (Math.min(wmax, 3 * web) - web)) / 100) * 100, we = pp * n * 2 * Math.PI / 60;
        const id = NUM.bisect(d => iqv(we, d) - Math.sqrt(Math.max(0, Im * Im - d * d)), 0, -Im), iq = Math.sqrt(Im * Im - id * id), Tq = 1.5 * pp * psi * iq, P = Tq * n * 2 * Math.PI / 60;
        return q('Field weakening: the most torque above base speed', T`A surface PM synchronous motor ($p = ${pp}$, $\psi = ${psi}\,\text{V}\cdot\text{s}$, $L_d = L_q = ${tf(L * 1e3)}\,\text{mH}$, $R_s = ${Rs}\,\Omega$) is limited to a current amplitude $I_{\max} = ${Im}\,\text{A}$ and a voltage amplitude $V_{\max} = ${Vm}\,\text{V}$ (amplitude-invariant dq; $T = \tfrac32p\psi i_q$). Find the base speed: the highest speed at which full current with $i_d = 0$ is possible. At $${n}\,\text{rpm}$, above base speed, find the $i_d$ and $i_q$ that give the most torque within both limits, the torque and the mechanical power. Keep $R_s$ in the voltage equations.`,
            [T`$p = ${pp}$, $\psi = ${psi}\,\text{V}\cdot\text{s}$, $L = ${tf(L * 1e3)}\,\text{mH}$, $R_s = ${Rs}\,\Omega$`, T`$I_{\max} = ${Im}\,\text{A}$, $V_{\max} = ${Vm}\,\text{V}$`, T`Speed $${n}\,\text{rpm}$`],
            [p('Base speed', rpmOf(web), 'rpm'), p(T`$i_d$`, id, 'A'), p(T`$i_q$`, iq, 'A'), p('Torque', Tq, 'N·m'), p('Mechanical power', P, 'W')],
            [T`$v_d = R_si_d - \omega_eLi_q$, $v_q = R_si_q + \omega_e(\psi + Li_d)$. Expanding, $|v|^2 = (\omega_e^2L^2 + R_s^2)i_q^2 + 2R_s\omega_e\psi\,i_q + R_s^2i_d^2 + \omega_e^2(\psi + Li_d)^2$.`, T`For each $i_d$, the voltage limit caps $i_q$ (a quadratic); the current limit caps it at $\sqrt{I_{\max}^2 - i_d^2}$.`, T`Negative $i_d$ relaxes the voltage cap but tightens the current cap: the best point is where they meet. Bisect on $i_d$.`],
            [T`Base speed: $|v| = V_{\max}$ with $i_d = 0$, $i_q = I_{\max}$ gives $\omega_e = ${tf(web)}\,\text{rad/s}$, i.e. $${tf(rpmOf(web))}\,\text{rpm}$.`, T`At $${n}\,\text{rpm}$: $\omega_e = ${tf(we)}\,\text{rad/s}$.`, T`Bisection on the meeting point gives $i_d = ${tf(id)}\,\text{A}$ and $i_q = ${tf(iq)}\,\text{A}$.`, T`$T = 1.5\times${pp}\times${psi}\times${tf(iq)} = ${tf(Tq)}\,\text{N}\cdot\text{m}$ and $P = T\omega_m = ${tf(P)}\,\text{W}$.`],
            'Above base speed a PM motor trades torque-producing current for negative d-axis current that cancels part of the magnet’s back-EMF: field weakening extends the speed range at roughly constant power.',
            drawing(wire('M360 200V30M120 200H600') + `<circle cx="360" cy="200" r="150" stroke-dasharray="6 5"/>` + `<ellipse cx="${(360 - 60).toFixed(0)}" cy="200" rx="110" ry="80" stroke="#b5532d"/>` + dot(+(360 + 150 * id / Im).toFixed(1), +(200 - 150 * iq / Im).toFixed(1)) + dt(600, 220, 'i_d') + dt(375, 24, 'i_q') + dt(560, 80, 'current circle') + dt(190, 110, 'voltage limit'), 'Current circle and voltage-limit ellipse in the id–iq plane; the operating point is where they meet', 240),
            'Synchronous machines; constrained optimisation; root finding.');
    }

    // sensors
    if (li === 1) {
        const N = pick([500, 1000, 2048]), Ts = pick([1, 2, 5]) * 1e-3, n = pick([120, 600, 1500]), fc = pick([1e6, 1e7]);
        const res = 360 / (4 * N), c = 4 * N * n / 60 * Ts, dn = 60 / (4 * N * Ts), rel = 100 / c, m = fc / (4 * N * n / 60), nx = 60 / (4 * N) * Math.sqrt(fc / Ts);
        return q('Reading speed from an incremental encoder', T`An incremental encoder has $${N}$ lines per revolution and is decoded $\times4$ (both edges of both channels). The shaft turns at $${n}\,\text{rpm}$. Find the angular resolution. Counting edges in a window $T_s = ${Ts * 1e3}\,\text{ms}$: find the expected count, the speed resolution and the relative quantisation at this speed. Timing one edge interval with a $${fc / 1e6}\,\text{MHz}$ clock: find the expected tick count. Finally, find the speed at which the two methods have equal resolution.`,
            [T`$${N}$ lines, $\times4$ decoding`, T`$n = ${n}\,\text{rpm}$, $T_s = ${Ts * 1e3}\,\text{ms}$`, T`Clock $${fc / 1e6}\,\text{MHz}$`],
            [p('Angular resolution', res, '°'), p('Counts per window', c), p('Speed resolution (counting)', dn, 'rpm'), p('Relative quantisation', rel, '%'), p('Clock ticks per edge', m), p('Equal-resolution speed', nx, 'rpm')],
            [T`$4N$ edges per revolution.`, T`Counting: one count in $T_s$ is $\Delta n = \dfrac{60}{4NT_s}\,\text{rpm}$.`, T`Timing: $m = f_c/f_{\text{edge}}$ ticks, with resolution $\approx n/m$. Equal when $n^2\dfrac{4N}{60f_c} = \dfrac{60}{4NT_s}$.`],
            [T`$360^\circ/(4\times${N}) = ${tf(res)}^\circ$.`, T`Edge rate $= 4N\,n/60 = ${tf(4 * N * n / 60)}\,\text{Hz}$, so $${tf(c)}$ counts per window.`, T`$\Delta n = ${tf(dn)}\,\text{rpm}$, i.e. $${tf(rel)}\%$ of the speed.`, T`$m = ${tf(fc)}/${tf(4 * N * n / 60)} = ${tf(m)}$ ticks.`, T`$n_\times = \dfrac{60}{4N}\sqrt{f_c/T_s} = ${tf(nx)}\,\text{rpm}$.`],
            'Counting edges is precise at high speed and coarse at low speed; timing edges is the reverse. The crossover speed tells you which to use.',
            encoderDisc(`${N} lines, ×4 decoding`),
            'Frequency and period; quantisation.');
    }
    if (li === 2) {
        const dts = pick([.005, .01, .02]), tau = pick([.5, 1, 2]), bias = pick([.5, 1, 2]), sig = pick([1, 2, 3]);
        const alpha = tau / (tau + dts), err = alpha * bias * dts / (1 - alpha), sd = sig * Math.sqrt((1 - alpha) / (1 + alpha)), fx = 1 / (2 * Math.PI * tau), tdisc = -dts / Math.log(alpha);
        return q('Designing a complementary filter for tilt', T`A tilt estimate fuses a gyroscope and an accelerometer every $\Delta t = ${dts}\,\text{s}$: $\hat\theta_k = \alpha(\hat\theta_{k-1} + \omega_k\Delta t) + (1 - \alpha)\theta_{a,k}$, with $\alpha = \tau/(\tau + \Delta t)$ and $\tau = ${tau}\,\text{s}$. The gyro has a constant bias of $${bias}^\circ/\text{s}$; the accelerometer angle has white noise of $${sig}^\circ$ standard deviation per sample. Find $\alpha$, the steady-state angle error caused by the gyro bias, the standard deviation of the output caused by accelerometer noise, the crossover frequency, and the exact time constant of the discrete filter.`,
            [T`$\Delta t = ${dts}\,\text{s}$, $\tau = ${tau}\,\text{s}$`, T`Gyro bias $${bias}^\circ/\text{s}$`, T`Accelerometer noise $\sigma = ${sig}^\circ$`],
            [p(T`$\alpha$`, alpha, '', 1e-4), p('Bias error', err, '°'), p('Output noise σ', sd, '°'), p('Crossover frequency', fx, 'Hz'), p('Discrete time constant', tdisc, 's', .001)],
            [T`In steady state the estimate error $e$ satisfies $e = \alpha(e + b\Delta t)$.`, T`Accelerometer noise passes through $y_k = \alpha y_{k-1} + (1 - \alpha)n_k$: variance $\dfrac{(1 - \alpha)^2\sigma^2}{1 - \alpha^2}$.`, T`The gyro is high-passed and the accelerometer low-passed at $f_c = \dfrac{1}{2\pi\tau}$; the discrete pole $\alpha$ decays as $e^{-t/\tau_d}$ with $\tau_d = -\Delta t/\ln\alpha$.`],
            [T`$\alpha = \dfrac{${tau}}{${tau} + ${dts}} = ${tf(alpha, 6)}$.`, T`$e = \dfrac{\alpha b\Delta t}{1 - \alpha} = b\tau = ${tf(err)}^\circ$.`, T`$\sigma_y = \sigma\sqrt{\dfrac{1 - \alpha}{1 + \alpha}} = ${tf(sd)}^\circ$.`, T`$f_c = ${tf(fx)}\,\text{Hz}$.`, T`$\tau_d = -\Delta t/\ln\alpha = ${tf(tdisc, 6)}\,\text{s}$, slightly more than $\tau$.`],
            'A complementary filter trades gyro drift (worse for large τ) against accelerometer noise (worse for small τ); τ sets both, and a constant gyro bias always leaves an error of bτ.',
            signalChain(['Gyro ω|+ bias b', 'Integrate|× α', 'Sum|θ̂', 'Accel θₐ|× (1 − α)'], 'Complementary filter: high-pass gyro plus low-pass accelerometer'),
            'First-order filters; variance of filtered noise.');
    }
    if (li === 3) {
        const Lb = pick([10, 20]), truth = [pick([.3, .45, .6, .7]) * Lb, pick([.25, .4, .55, .8]) * Lb], noise = pick([[.05, -.08, .03, -.02], [-.04, .06, .07, -.05], [.09, .02, -.06, .04]]);
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
            drawing([[0, 0], [Lb, 0], [Lb, Lb], [0, Lb]].map(([bx, by]) => { const X = 220 + bx / Lb * 280, Y = 220 - by / Lb * 190; return `<rect x="${X - 7}" y="${Y - 7}" width="14" height="14"/>` + wire(`M${X} ${Y}L${(220 + x[0] / Lb * 280).toFixed(1)} ${(220 - x[1] / Lb * 190).toFixed(1)}`); }).join('') + ring(+(220 + x[0] / Lb * 280).toFixed(1), +(220 - x[1] / Lb * 190).toFixed(1), 8) + dt(220, 246, '(0, 0)') + dt(500, 22, `(${Lb}, ${Lb})`) + dt(+(220 + x[0] / Lb * 280).toFixed(1), +(220 - x[1] / Lb * 190 - 16).toFixed(1), 'robot'), 'Four beacons at the corners of a square, with range lines to the robot', 250),
            'Nonlinear least squares; linearisation; 2×2 matrices.');
    }
    // Mastery: steady-state alpha-beta-gamma gains from the discrete Riccati equation.
    const Tq = pick([.1, .2, .5]), sz = pick([1, 2, 5]), sa = pick([.1, .5, 1]);
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
        signalChain(['Fix z|σz', 'Predict|F x̂', 'Correct|K (z − x̂)', 'x̂, v̂, â'], 'Steady-state α–β–γ tracker'),
        'Kalman filtering; matrix algebra; fixed-point iteration.');
}
