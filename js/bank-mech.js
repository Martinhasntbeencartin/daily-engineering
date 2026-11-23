/* ================= MECHANICAL & CIVIL ================= */
bank('statics', 'advanced', [{
    title: 'The strongest beam from a log',
    diagram: sketch(
        'Rectangular beam inscribed in a round log.',
        ring(353, 119, 92) + wire('M299 44.5h108v149H299z') + guide('M299 44.5l108 149'),
        [[354, 235, 'Width b'], [470, 124, 'h'], [335, 124, 'd']]),
    text: T`A rectangular beam of width $b$ and depth $h$ is cut from a round log of diameter $d$. The bending strength is proportional to the section modulus $bh^2/6$. Find the ratio $h/b$ for the strongest beam.`,
    parts: [ex(T`$h/b$`, Math.SQRT2, T`\sqrt2`)],
    hints: [T`Constraint: $b^2 + h^2 = d^2$. Maximise $b(d^2 - b^2)$.`],
    steps: [T`$\dfrac{d}{db}\left[b(d^2 - b^2)\right] = d^2 - 3b^2 = 0 \Rightarrow b = d/\sqrt3$.`, T`$h^2 = d^2 - d^2/3 = \tfrac23 d^2$, so $h/b = \sqrt2$.`],
    idea: 'Constrained optimisation in structures: this is Galileo’s and Parent’s classic result.',
    prereq: 'Section modulus; optimisation.',
    verify: () => { let b = [0, 0]; for (let x = .001; x < 1; x += 1e-5) { const v = x * (1 - x * x); if (v > b[1]) b = [x, v]; } return [Math.sqrt(1 - b[0] ** 2) / b[0]]; }
}, {
    title: 'Peak shear in a rectangular beam',
    diagram: sketch(
        'Rectangle under vertical shear, with the neutral axis through its middle.',
        wire('M246 44h178v151H246z') + guide('M189 120H472') + arrow(509, 175, 509, 63),
        [[533, 112, 'V'], [183, 107, 'Neutral axis'], [335, 226, 'Cross-section A']]),
    text: T`A rectangular beam carries a shear force $V$. Find the ratio of the maximum shear stress (at the neutral axis) to the average shear stress $V/A$.`,
    parts: [ex('Ratio', 3 / 2, T`\dfrac32`)],
    hints: [T`$\tau = \dfrac{VQ}{It}$ with $Q = b\dfrac h2\cdot\dfrac h4$ at the neutral axis.`],
    steps: [T`$Q = \dfrac{bh^2}{8}$, $I = \dfrac{bh^3}{12}$ and $t = b$.`, T`$\tau_{\max} = \dfrac{V\,bh^2/8}{(bh^3/12)\,b} = \dfrac{3V}{2bh}$.`, T`Ratio $= \tfrac32$.`],
    idea: 'Shear stress is parabolic across the depth. It is zero at the surfaces and peaks at the neutral axis.',
    prereq: 'Shear formula; first moment of area.'
}, {
    title: 'The lightest two-bar truss',
    diagram: sketch(
        'Two equal inclined bars support a vertical joint load.',
        wire('M174 165L357 64l183 101') + pinSupport(174, 165) + pinSupport(540, 165) + arrow(357, 16, 357, 57) +
        guide('M174 165H540'),
        [[386, 37, 'W'], [239, 154, 'θ'], [470, 155, 'θ']]),
    text: T`Two bars meet at an apex above the midpoint between two pin supports a fixed distance apart, and carry a vertical load there. Each bar is sized to work at the same allowable stress. Which angle to the horizontal minimises the total volume of material?`,
    parts: [ex(T`$\theta$`, 45, '45', '°')],
    hints: [T`Bar force $F = \dfrac{W}{2\sin\theta}$ and bar length $L = \dfrac{a}{\cos\theta}$. Volume $\propto FL$.`],
    steps: [T`$V \propto \dfrac{1}{\sin\theta\cos\theta} = \dfrac{2}{\sin2\theta}$.`, T`This is minimised at $2\theta = 90^\circ$, so $\theta = 45^\circ$.`],
    idea: 'Steeper bars are longer but carry less force. The optimum balances the two, like a Michell structure.',
    prereq: 'Truss equilibrium; optimisation.',
    verify: () => { let b = [0, Infinity]; for (let t = .01; t < 1.56; t += 1e-5) { const v = 1 / (Math.sin(t) * Math.cos(t)); if (v < b[1]) b = [t, v]; } return [b[0] * 180 / Math.PI]; }
}, {
    title: 'Castigliano on a curved bar',
    text: T`A slender quarter-circle bar of radius $R$ and bending stiffness $EI$ is fixed at its lower end, with its tangent there vertical. A horizontal force $P$ acts at the free upper end. Considering bending only, find the horizontal deflection of the free end in units of $PR^3/EI$.`,
    diagram: arcSVG(),
    parts: [ex(T`$\delta\,EI/(PR^3)$`, Math.PI / 4, T`\dfrac\pi4`)],
    hints: [T`Measure $\theta$ from the free end. The lever arm of the horizontal force is $R\sin\theta$, so $M = PR\sin\theta$.`, T`$U = \displaystyle\int\frac{M^2}{2EI}R\,d\theta$ and $\delta = \partial U/\partial P$.`],
    steps: [T`$U = \dfrac{P^2R^3}{2EI}\displaystyle\int_0^{\pi/2}\sin^2\theta\,d\theta = \dfrac{P^2R^3}{2EI}\cdot\dfrac\pi4$.`, T`$\delta = \dfrac{\partial U}{\partial P} = \dfrac{\pi}{4}\dfrac{PR^3}{EI}$.`],
    idea: 'Energy methods handle curved members as easily as straight ones: integrate along the arc.',
    prereq: 'Strain energy; Castigliano’s theorem.',
    verify: () => [NUM.simpson(t => Math.sin(t) ** 2, 0, Math.PI / 2)]
}]);

bank('dynamics', 'advanced', [{
    title: 'The golden ratio in two masses',
    text: T`Two equal masses $m$ are connected in a line: wall, spring $k$, mass, spring $k$, mass, with the last mass free. Find both natural frequencies in units of $\sqrt{k/m}$.`,
    diagram: twoDofDiagram('m', 'm', 'k', 'k'),
    parts: [ex(T`$\omega_1\sqrt{m/k}$`, 1 / PHI, T`\dfrac{\sqrt5-1}{2}`), ex(T`$\omega_2\sqrt{m/k}$`, PHI, T`\dfrac{1+\sqrt5}{2}`)],
    hints: [T`$K = k\begin{pmatrix}2 & -1\\-1 & 1\end{pmatrix}$ and $M = mI$.`, T`$\det(K - \omega^2M) = 0 \Rightarrow \lambda^2 - 3\lambda + 1 = 0$ with $\lambda = \omega^2 m/k$.`],
    steps: [T`$\lambda = \dfrac{3 \pm \sqrt5}{2}$.`, T`Note that $\dfrac{3 + \sqrt5}{2} = \varphi^2$ and $\dfrac{3 - \sqrt5}{2} = \varphi^{-2}$.`, T`$\omega_1 = \dfrac1\varphi\sqrt{k/m}$ and $\omega_2 = \varphi\sqrt{k/m}$: their product is exactly $k/m$.`],
    idea: 'Eigenvalues of simple chains are often algebraic numbers with structure. Here they are powers of φ.',
    prereq: 'Matrix eigenvalues; multi-degree-of-freedom vibration.',
    verify: () => { const e = NUM.eigSym([[2, -1], [-1, 1]]); return e.values.map(Math.sqrt); }
}, {
    title: 'A bead on a spinning hoop',
    diagram: sketch(
        'Bead on a vertical rotating hoop, with angle measured from its bottom radius.',
        ring(354, 123, 83) + guide('M354 24v190') + wire('M354 123l59 59') + dot(413, 182) +
        wire('M334 43a23 8 0 1 1 37 -2l-8 -3m8 3 -2 -8') + wire('M354 159a36 36 0 0 0 25.5 -10.5'),
        [[369, 180, 'θ'], [433, 196, 'm'], [402, 37, 'ω']]),
    text: T`A bead slides without friction on a vertical hoop of radius $R$ spinning about its vertical diameter at angular speed $\omega$, with $\omega^2 = 2g/R$. At what angle from the bottom, in degrees, does the bead sit in stable equilibrium?`,
    parts: [ex(T`$\theta$`, 60, '60', '°')],
    hints: [T`In the rotating frame: $\omega^2R\sin\theta\cos\theta = g\sin\theta$.`, T`Off-bottom equilibrium: $\cos\theta = \dfrac{g}{\omega^2R}$.`],
    steps: [T`$\cos\theta = \dfrac{g}{2g} = \tfrac12$.`, T`$\theta = 60^\circ$. For $\omega^2 > g/R$ this off-axis point is stable and the bottom is unstable.`],
    idea: 'This is a pitchfork bifurcation: above a critical spin rate, the bottom stops being stable.',
    prereq: 'Rotating frames; stability of equilibria.'
}, {
    title: 'Critical damping, one time constant later',
    diagram: curve('Normalised time ωₙt', 'Displacement / x₀', [0, 5], [0, 1], t => (1 + t) * Math.exp(-t)),
    text: T`A critically damped oscillator ($\zeta = 1$) is released from rest at displacement $x_0$. Find its displacement at $t = 1/\omega_n$, as a fraction of $x_0$.`,
    parts: [ex(T`$x/x_0$`, 2 / Math.E, T`\dfrac2e`)],
    hints: [T`$x(t) = (A + Bt)e^{-\omega_n t}$.`, T`Rest at $t = 0$ gives $B = \omega_n A$.`],
    steps: [T`$x(t) = x_0(1 + \omega_n t)e^{-\omega_n t}$.`, T`At $\omega_n t = 1$: $x = 2x_0/e \approx 0.736x_0$.`],
    idea: 'Critical damping is the fastest return without overshoot, yet it is still slower than you might guess.',
    prereq: 'Second-order ODEs.',
    verify: () => { const tr = rk4((t, [x, v]) => [v, -2 * v - x], [1, 0], 0, 1, 2000); return [tr[tr.length - 1][1][0]]; }
}, {
    title: 'A chain slides off a table',
    diagram: sketch(
        'Chain on a smooth tabletop with a free end hanging over its edge.',
        wire('M125 95H462v109M160 83H450q23 0 23 23v67') + arrow(505, 117, 505, 169),
        [[286, 63, 'Chain'], [545, 151, 'g']]),
    text: T`A uniform chain of length $L$ lies straight on a frictionless table, perpendicular to the edge. It starts to slide off from a negligible overhang. Find its speed at the moment it leaves the table, in units of $\sqrt{gL}$.`,
    parts: [ex(T`$v/\sqrt{gL}$`, 1, '1')],
    hints: [T`Energy: the centre of mass drops by $L/2$.`],
    steps: [T`$\tfrac12 mv^2 = mg\tfrac L2$.`, T`$v = \sqrt{gL}$.`],
    idea: 'Energy conservation sidesteps a variable-mass equation of motion entirely.',
    prereq: 'Energy conservation; centre of mass.',
    verify: () => { const tr = rk4((t, [x, v]) => [v, x], [1e-9, 0], 0, 25, 25000); for (const [, [x, v]] of tr) if (x >= 1) return [v]; return [NaN]; }
}]);

bank('thermo', 'advanced', [{
    title: 'Maximum work from two bodies',
    diagram: heatEngine('1200 K initially', '300 K initially', 'Finite bodies with equal heat capacity mc'),
    text: T`A reversible engine runs between two identical finite bodies (constant heat capacity $mc$), initially at $300\,\text{K}$ and $1200\,\text{K}$, until they reach a common temperature. Find that final temperature.`,
    parts: [ex(T`$T_f$`, 600, '600', 'K')],
    hints: [T`Reversible means zero total entropy change: $mc\ln\dfrac{T_f}{T_1} + mc\ln\dfrac{T_f}{T_2} = 0$.`],
    steps: [T`$T_f^2 = T_1T_2 \Rightarrow T_f = \sqrt{300\cdot1200} = 600\,\text{K}$.`, T`$W = mc(T_1 + T_2 - 2T_f) = 300\,mc$.`, T`Simple contact would end at $750\,\text{K}$, the arithmetic mean, and produce no work.`],
    idea: 'Reversible equilibration ends at the geometric mean. Irreversible mixing ends at the arithmetic mean.',
    prereq: 'Entropy; reversible engines.'
}, {
    title: 'The best pressure ratio for a Brayton cycle',
    diagram: braytonCycle(),
    text: T`An ideal Brayton cycle has turbine-inlet temperature $T_3 = 4T_1$. Choose the pressure ratio that maximises net work per unit mass. Find the cycle’s thermal efficiency at that pressure ratio.`,
    parts: [ex(T`$\eta$`, 1 / 2, T`\dfrac12`)],
    hints: [T`With $x = r_p^{(\gamma-1)/\gamma}$: $w \propto (T_3 - T_3/x) - (T_1x - T_1)$.`, T`Maximise over $x$: $x^2 = T_3/T_1$.`],
    steps: [T`$x = \sqrt{T_3/T_1} = 2$.`, T`$\eta = 1 - 1/x = \tfrac12$.`, T`The compressor exit temperature equals the turbine exit temperature, both $2T_1$.`],
    idea: 'Maximum work and maximum efficiency are different design points, and engines usually sit between them.',
    prereq: 'Brayton cycle; optimisation.',
    verify: () => { let b = [1, -Infinity]; for (let x = 1; x < 4; x += 1e-5) { const w = (4 - 4 / x) - (x - 1); if (w > b[1]) b = [x, w]; } return [1 - 1 / b[0]]; }
}, {
    title: 'Efficiency at maximum power',
    diagram: heatEngine('675 K', '300 K', 'Endoreversible heat engine'),
    text: T`An endoreversible engine runs between $675\,\text{K}$ and $300\,\text{K}$. At maximum power output, its efficiency is the Curzon–Ahlborn value $\eta = 1 - \sqrt{T_c/T_h}$. Find it.`,
    parts: [ex(T`$\eta_{CA}$`, 1 / 3, T`\dfrac13`)],
    hints: [T`$T_c/T_h = \dfrac{300}{675} = \dfrac49$.`],
    steps: [T`$\sqrt{4/9} = \tfrac23$.`, T`$\eta_{CA} = \tfrac13$, compared with the Carnot limit of $\tfrac59$.`],
    idea: 'Real power plants run close to the Curzon–Ahlborn efficiency, not the Carnot limit: power, not efficiency, is what pays.',
    prereq: 'Finite-time thermodynamics.'
}, {
    title: 'When a nozzle chokes',
    diagram: sketch(
        'Reservoir feeding a converging nozzle with its minimum area at the outlet.',
        wire('M120 58h165q104 0 203 54h54M120 194h165q104 0 203 -54h54') + arrow(170, 126, 296, 126) +
        guide('M542 104v44'),
        [[200, 95, 'p₀, T₀'], [563, 88, 'Throat'], [554, 183, 'M = 1']]),
    text: T`Air ($\gamma = 1.4$) flows isentropically from a reservoir through a converging nozzle. Find the critical pressure ratio $p^*/p_0$ at which the throat reaches Mach 1.`,
    parts: [ex(T`$p^*/p_0$`, (5 / 6) ** 3.5, T`\left(\dfrac56\right)^{7/2}`)],
    hints: [T`$\dfrac{p^*}{p_0} = \left(\dfrac{2}{\gamma+1}\right)^{\gamma/(\gamma-1)}$.`],
    steps: [T`$\dfrac{2}{\gamma+1} = \dfrac56$ and $\dfrac{\gamma}{\gamma-1} = \dfrac72$.`, T`$p^*/p_0 = (5/6)^{7/2} \approx 0.528$.`],
    idea: 'Below about 53% back pressure, lowering it further cannot increase the mass flow: the nozzle is choked.',
    prereq: 'Compressible flow; isentropic relations.',
    verify: () => [Math.pow(1 + .2, -3.5)]
}]);

/* Picks today’s curated problem for a (topic, level) slot. */
function makeBankExercise(topic, date, level) {
    const list = BANK[topic + ':' + level];
    if (!list) throw Error('Unknown challenge selection');
    const d = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000), i = ((d + hashString(topic + level)) % list.length + list.length) % list.length, e = list[i];
    return {id: `${topic}-${level}-${i}`, givens: [], source: null, ...e, prerequisites: e.prereq, diagram: e.diagram || '', bankIndex: i};
}
