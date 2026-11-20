/* ================= MECHANICAL & CIVIL ================= */
bank('statics', 'foundations', [{
    title: 'How steep must the ladder be?',
    text: T`A uniform ladder leans against a smooth vertical wall. The floor has friction coefficient $\mu = \tfrac12$. What is the smallest angle $\theta$ to the floor (in degrees) at which the ladder does not slip?`,
    diagram: wallLadderSVG(),
    parts: [ex(T`$\theta_{\min}$`, 45, '45', '°')],
    hints: [T`The smooth wall pushes only horizontally. Friction at the floor must balance that push.`, T`Take moments about the foot: $N_w L\sin\theta = W\tfrac L2\cos\theta$.`],
    steps: [T`Vertical: $N_f = W$. Horizontal: $F = N_w$.`, T`Moments about the foot: $N_w = \dfrac{W}{2\tan\theta}$.`, T`Slip begins when $F = \mu N_f$: $\tan\theta = \dfrac{1}{2\mu} = 1$, so $\theta_{\min} = 45^\circ$.`],
    idea: 'Three forces, three equations: wall push, floor reaction and friction close the free-body diagram exactly.',
    prereq: 'Equilibrium of a rigid body; Coulomb friction.'
}, {
    title: 'Two ropes at 120°',
    diagram: sketch(
        'Two inclined ropes meet at a joint loaded vertically by W.',
        arrow(357, 139, 210, 54) + arrow(357, 139, 504, 54) + arrow(357, 139, 357, 216) + guide('M357 139V30') +
        dot(357, 139),
        [[192, 47, 'T₁'], [523, 47, 'T₂'], [317, 87, '60°'], [398, 87, '60°'], [383, 211, 'W']]),
    text: T`A weight $W$ hangs from two ropes, each making $60^\circ$ with the vertical. Find the tension in each rope as a multiple of $W$.`,
    parts: [ex(T`$T/W$`, 1, '1')],
    hints: [T`Vertical equilibrium: $2T\cos60^\circ = W$.`],
    steps: [T`$2T\cdot\tfrac12 = W$.`, T`$T = W$: each rope carries the full weight, even though there are two of them.`],
    idea: 'Shallow ropes are expensive: as the angle from vertical approaches 90°, the tension grows without bound.',
    prereq: 'Equilibrium of a particle.'
}, {
    title: 'Centroid of a half-disk',
    diagram: sketch(
        'Half-disk with centroid on its axis of symmetry, measured from the diameter.',
        '<path d="M197 183a157 157 0 0 1 314 0z" fill="#e3ece3"/>' + guide('M354 28v155') +
        arrow(354, 183, 511, 183) + dot(354, 116),
        [[418, 171, 'R'], [381, 113, 'G'], [354, 217, 'Diameter']]),
    text: T`Find the distance of the centroid of a semicircular area of radius $R$ from its straight edge, as a fraction of $R$.`,
    parts: [ex(T`$\bar y/R$`, 4 / (3 * Math.PI), T`\dfrac{4}{3\pi}`)],
    hints: [T`$\bar y = \dfrac{1}{A}\displaystyle\int y\,dA$ with $A = \tfrac12\pi R^2$.`, T`Use strips: $dA = 2\sqrt{R^2 - y^2}\,dy$.`],
    steps: [T`$\displaystyle\int_0^R 2y\sqrt{R^2-y^2}\,dy = \tfrac23R^3$.`, T`$\bar y = \dfrac{2R^3/3}{\pi R^2/2} = \dfrac{4R}{3\pi} \approx 0.424R$.`],
    idea: 'Pappus’s theorem gives the same answer instantly: spinning the half-disk about its edge sweeps a sphere.',
    prereq: 'Centroids; integration.',
    verify: () => [NUM.simpson(y => 2 * y * Math.sqrt(Math.max(0, 1 - y * y)), 0, 1, 20000) / (Math.PI / 2)]
}, {
    title: 'The angle of repose',
    diagram: inclineDiagram(false),
    text: T`A block rests on a plane whose tilt is slowly increased. The static friction coefficient is $\mu = 1/\sqrt3$. At what angle, in degrees, does the block begin to slide?`,
    parts: [ex(T`$\theta$`, 30, '30', '°')],
    hints: [T`Along the slope: $W\sin\theta = \mu W\cos\theta$.`],
    steps: [T`$\tan\theta = \mu = 1/\sqrt3$.`, T`$\theta = 30^\circ$, independent of the block’s weight.`],
    idea: 'Measuring the angle of repose is the simplest experiment for finding a friction coefficient.',
    prereq: 'Friction; resolving forces.'
}]);
bank('statics', 'applied', [{
    title: 'A triangle’s second moment',
    diagram: sketch(
        'Triangular section and two parallel horizontal axes.',
        wire('M220 192l140 -145 140 145z') + guide('M173 144H554') + guide('M360 47v145') + dot(360, 144),
        [[360, 220, 'Base b'], [382, 100, 'h'], [565, 137, 'Centroid']]),
    text: T`For a triangle of base $b$ and height $h$, find the ratio of its second moment of area about the base to that about a parallel axis through its centroid.`,
    parts: [ex('Ratio', 3, '3')],
    hints: [T`$I_{\text{base}} = \dfrac{bh^3}{12}$.`, T`Parallel axis: $I_{\text{base}} = I_c + A(h/3)^2$.`],
    steps: [T`$I_c = \dfrac{bh^3}{12} - \dfrac{bh}{2}\cdot\dfrac{h^2}{9} = \dfrac{bh^3}{36}$.`, T`Ratio $= \dfrac{1/12}{1/36} = 3$.`],
    idea: 'The parallel-axis theorem: the centroidal axis always gives the smallest second moment.',
    prereq: 'Second moments of area.',
    verify: () => [NUM.simpson(y => y * y * (1 - y), 0, 1) / NUM.simpson(y => (y - 1 / 3) ** 2 * (1 - y), 0, 1)]
}, {
    title: 'A rope around a post',
    diagram: sketch(
        'Rope wrapped around a fixed cylindrical post with tangential end tensions.',
        ring(350, 114, 66) + wire('M350 42a72 72 0 1 1 -1 0') + arrow(350, 42, 166, 42) + arrow(351, 49, 547, 49),
        [[163, 75, 'T hold'], [550, 82, 'T load'], [350, 214, 'Contact angle 2π']]),
    text: T`A rope is wrapped once fully around a fixed post, with friction coefficient $\mu = 1/\pi$. What tension ratio $T_{\text{load}}/T_{\text{hold}}$ can it resist without slipping?`,
    parts: [ex('Ratio', Math.E ** 2, T`e^2`)],
    hints: [T`Capstan equation: $T_2 = T_1 e^{\mu\beta}$, with $\beta$ the wrap angle in radians.`],
    steps: [T`One full turn: $\beta = 2\pi$.`, T`$\mu\beta = 2$, so the ratio is $e^2 \approx 7.39$.`],
    idea: 'Friction grows exponentially with wrap angle. Three turns would hold 400 times the holding force.',
    prereq: 'Belt friction.',
    verify: () => { let T = 1; const n = 100000, db = 2 * Math.PI / n; for (let i = 0; i < n; i++) T += T * (1 / Math.PI) * db; return [T]; }
}, {
    title: 'Same load, different spread',
    diagram: distributedBeam(),
    text: T`A simply supported beam carries total load $W$, first as a uniformly distributed load and then as a single point load at midspan. Find the ratio of the midspan deflections $\delta_{\text{UDL}}/\delta_{\text{point}}$.`,
    parts: [ex('Ratio', 5 / 8, T`\dfrac58`)],
    hints: [T`$\delta_{\text{UDL}} = \dfrac{5WL^3}{384EI}$ and $\delta_{\text{point}} = \dfrac{WL^3}{48EI}$.`],
    steps: [T`Ratio $= \dfrac{5/384}{1/48} = \dfrac{5\cdot48}{384} = \dfrac58$.`],
    idea: 'Spreading a load reduces deflection, here by 37.5%.',
    prereq: 'Beam deflection formulas.',
    verify: () => { const udl = NUM.simpson(x => (x * (1 - x) / 2) * (x / 2), 0, .5, 4000) * 2, pt = NUM.simpson(x => (x / 2) * (x / 2), 0, .5, 4000) * 2; return [udl / pt]; }
}, {
    title: 'Hollowing out a shaft',
    diagram: circleSection(38.5, 'Bore radius R/2 · outer radius R'),
    text: T`A solid circular shaft is bored out to inner radius equal to half its outer radius. By what fraction does its torsional stiffness drop? Give the remaining fraction $J_{\text{hollow}}/J_{\text{solid}}$.`,
    parts: [ex('Fraction', 15 / 16, T`\dfrac{15}{16}`)],
    hints: [T`$J = \dfrac\pi2\left(r_o^4 - r_i^4\right)$.`],
    steps: [T`$J_{\text{hollow}}/J_{\text{solid}} = 1 - (1/2)^4 = \dfrac{15}{16}$.`, T`The shaft keeps $93.75\%$ of its stiffness while losing $25\%$ of its mass.`],
    idea: 'Material near the axis carries almost no torque, which is why drive shafts are tubes.',
    prereq: 'Torsion of circular shafts.'
}]);
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

bank('dynamics', 'foundations', [{
    title: 'Height versus range at 45°',
    diagram: sketch(
        'Projectile trajectory from a 45-degree launch to level ground.',
        wire('M99 184H608M118 184Q350 -48 582 184') + guide('M350 68v116') + arrow(118, 184, 177, 125),
        [[184, 167, '45°'], [372, 119, 'H'], [350, 217, 'Range']]),
    text: T`A projectile is launched at $45^\circ$ over level ground, with no air resistance. Find the ratio of its maximum height to its range.`,
    parts: [ex(T`$H/R$`, 1 / 4, T`\dfrac14`)],
    hints: [T`$H = \dfrac{v^2\sin^2\theta}{2g}$ and $R = \dfrac{v^2\sin2\theta}{g}$.`, T`In general $H/R = \tfrac14\tan\theta$.`],
    steps: [T`$\dfrac HR = \dfrac{\sin^2\theta/2}{2\sin\theta\cos\theta} = \dfrac{\tan\theta}{4}$.`, T`At $45^\circ$: $\tfrac14$.`],
    idea: 'H/R = tan θ / 4: a handy check for any projectile calculation.',
    prereq: 'Projectile kinematics.'
}, {
    title: 'A ball rolling down a slope',
    diagram: inclineDiagram(true),
    text: T`A solid sphere rolls without slipping down an incline of angle $\theta$. Find its acceleration as a fraction of $g\sin\theta$.`,
    parts: [ex(T`$a/(g\sin\theta)$`, 5 / 7, T`\dfrac57`)],
    hints: [T`$I = \tfrac25mr^2$, and rolling requires $a = \alpha r$.`, T`$a = \dfrac{g\sin\theta}{1 + I/(mr^2)}$.`],
    steps: [T`$a = \dfrac{g\sin\theta}{1 + 2/5}$.`, T`$a = \tfrac57 g\sin\theta$, independent of mass and radius.`],
    idea: 'Rolling objects race by shape alone: sphere, then disk, then hoop.',
    prereq: 'Rigid-body rotation; rolling.'
}, {
    title: 'Looping the loop',
    diagram: sketch(
        'Bead released from rest enters a vertical circular loop.',
        wire('M113 46C215 46 230 205 385 205') + ring(385, 134, 71) + arrow(385, 134, 456, 134) +
        guide('M113 47v158h272'),
        [[95, 133, 'h'], [422, 120, 'R']]),
    text: T`A bead slides without friction down a track and around a vertical circular loop of radius $R$. From what minimum release height above the loop’s bottom does it stay on the track at the top?`,
    parts: [ex(T`$h/R$`, 5 / 2, T`\dfrac52`)],
    hints: [T`At the top, gravity alone must supply the centripetal force: $v^2 = gR$.`, T`Energy: $mgh = mg(2R) + \tfrac12mv^2$.`],
    steps: [T`$v_{\text{top}}^2 = gR$.`, T`$gh = 2gR + \tfrac12gR$.`, T`$h = \tfrac52R$.`],
    idea: 'Combine an energy balance with a force balance at the critical point.',
    prereq: 'Energy conservation; circular motion.'
}, {
    title: 'Billiard balls fly apart at right angles',
    diagram: sketch(
        'Incoming velocity and two outgoing directions at an off-centre collision.',
        arrow(112, 127, 284, 127) + ring(305, 127, 18) + ring(336, 108, 18) + arrow(355, 101, 464, 38) +
        arrow(323, 144, 372, 230),
        [[165, 109, 'vᵢₙ'], [498, 43, 'v₁'], [396, 219, 'v₂']]),
    text: T`A ball strikes an identical stationary ball off-centre in a perfectly elastic collision. Find the angle between their velocities afterwards, in degrees.`,
    parts: [ex('Angle', 90, '90', '°')],
    hints: [T`Momentum: $\mathbf v = \mathbf v_1 + \mathbf v_2$. Energy: $v^2 = v_1^2 + v_2^2$.`],
    steps: [T`Squaring the momentum equation: $v^2 = v_1^2 + v_2^2 + 2\mathbf v_1\cdot\mathbf v_2$.`, T`Comparing with energy conservation: $\mathbf v_1\cdot\mathbf v_2 = 0$.`, T`The balls separate at $90^\circ$.`],
    idea: 'Pythagoras in velocity space: equal masses and elastic collisions give right angles.',
    prereq: 'Momentum and energy conservation.'
}]);
bank('dynamics', 'applied', [{
    title: 'A swinging rod',
    diagram: sketch(
        'Uniform rod of length L pivoted at its upper end, displaced from the vertical.',
        wire('M241 49h111M297 49l102 150') + ring(297, 49, 6) + guide('M297 58v151') + dot(348, 124),
        [[370, 113, 'G'], [391, 159, 'L']]),
    text: T`A uniform rod of length $L$ swings about one end. Find the length of the simple pendulum with the same small-oscillation period, as a fraction of $L$.`,
    parts: [ex(T`$\ell/L$`, 2 / 3, T`\dfrac23`)],
    hints: [T`Physical pendulum: $T = 2\pi\sqrt{\dfrac{I}{mgd}}$ with $I = \tfrac13mL^2$ and $d = L/2$.`],
    steps: [T`$\dfrac{I}{md} = \dfrac{L^2/3}{L/2} = \dfrac{2L}{3}$.`, T`Equivalent length $\ell = \tfrac23L$.`],
    idea: 'The centre of oscillation lies two-thirds of the way down. Strike a bat there and the hands feel no sting.',
    prereq: 'Physical pendulum.'
}, {
    title: 'The rocket equation',
    diagram: sketch(
        'Rocket accelerates opposite to its exhaust in free space.',
        wire('M262 98h124q51 0 82 23q-31 23 -82 23H262l14 -23z') + arrow(260, 121, 147, 121) +
        arrow(474, 121, 575, 121),
        [[198, 94, 'Exhaust vₑ'], [529, 94, 'Rocket v']]),
    text: T`A rocket in free space burns propellant with exhaust speed $v_e$. What initial-to-final mass ratio gives a velocity change exactly equal to $v_e$?`,
    parts: [ex(T`$m_0/m_f$`, Math.E, T`e`)],
    hints: [T`Tsiolkovsky: $\Delta v = v_e\ln\dfrac{m_0}{m_f}$.`],
    steps: [T`$\ln(m_0/m_f) = 1$.`, T`$m_0/m_f = e \approx 2.72$: about 63% of the launch mass is propellant.`],
    idea: 'Velocity grows only logarithmically with propellant, which is why rockets have stages.',
    prereq: 'Momentum conservation; variable-mass systems.',
    verify: () => { let m = 1, v = 0; const dm = 1e-6; while (v < 1) { v += dm / m; m -= dm; } return [1 / m]; }
}, {
    title: 'Damping from a decay record',
    diagram: curve('Time / damped period', 'Displacement / first peak', [0, 4], [-1, 1], t => 2 ** -t * Math.cos(2 * Math.PI * t)),
    text: T`A freely vibrating system’s amplitude halves every cycle. Find its damping ratio $\zeta$ exactly.`,
    parts: [ex(T`$\zeta$`, Math.LN2 / Math.sqrt(4 * Math.PI ** 2 + Math.LN2 ** 2), T`\dfrac{\ln 2}{\sqrt{4\pi^2 + (\ln 2)^2}}`)],
    hints: [T`Logarithmic decrement: $\delta = \ln 2 = \dfrac{2\pi\zeta}{\sqrt{1-\zeta^2}}$.`, T`Solve for $\zeta$.`],
    steps: [T`$\delta^2(1 - \zeta^2) = 4\pi^2\zeta^2$.`, T`$\zeta = \dfrac{\delta}{\sqrt{4\pi^2 + \delta^2}}$ with $\delta = \ln 2$.`, T`$\zeta \approx 0.110$.`],
    idea: 'Even 11% damping, which is heavy for a structure, still lets the motion ring for several cycles.',
    prereq: 'Damped free vibration.',
    verify: () => [NUM.bisect(z => 2 * Math.PI * z / Math.sqrt(1 - z * z) - Math.LN2, 1e-6, .9)]
}, {
    title: 'Hoop versus disk',
    diagram: sketch(
        'Two rolling bodies with mass distributed differently.',
        ring(218, 111, 62) + ring(218, 111, 56) + '<circle cx="502" cy="111" r="62" fill="#d1dfd4"/>' +
        dot(502, 111) + wire('M110 174h500'),
        [[218, 215, 'Thin hoop'], [502, 215, 'Uniform disk']]),
    text: T`A thin hoop and a uniform disk are released together from rest and roll without slipping down the same incline. Find the ratio of their descent times $t_{\text{hoop}}/t_{\text{disk}}$.`,
    parts: [ex('Ratio', 2 / Math.sqrt(3), T`\dfrac{2}{\sqrt3}`)],
    hints: [T`Hoop: $a = \tfrac12 g\sin\theta$. Disk: $a = \tfrac23 g\sin\theta$.`, T`$t \propto 1/\sqrt a$.`],
    steps: [T`$\dfrac{t_h}{t_d} = \sqrt{\dfrac{a_d}{a_h}} = \sqrt{\dfrac{2/3}{1/2}}$.`, T`Ratio $= \sqrt{4/3} = \dfrac{2}{\sqrt3} \approx 1.155$.`],
    idea: 'Whatever their mass or size, the disk always beats the hoop.',
    prereq: 'Rolling motion.'
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
        arrow(316, 33, 382, 33),
        [[329, 176, 'θ'], [433, 196, 'm'], [402, 37, 'ω']]),
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

bank('thermo', 'foundations', [{
    title: 'A Carnot engine',
    diagram: heatEngine('400 K', '300 K', 'Reversible heat engine'),
    text: T`A reversible heat engine runs between reservoirs at $400\,\text{K}$ and $300\,\text{K}$. Find its efficiency.`,
    parts: [ex(T`$\eta$`, 1 / 4, T`\dfrac14`)],
    hints: [T`$\eta_C = 1 - T_c/T_h$, with absolute temperatures.`],
    steps: [T`$\eta = 1 - \dfrac{300}{400} = \dfrac14$.`],
    idea: 'No engine between these temperatures can beat 25%, whatever its design.',
    prereq: 'Second law of thermodynamics.'
}, {
    title: 'Isothermal doubling',
    diagram: curve('Volume / initial volume', 'Pressure / initial pressure', [1, 2], [0, 1], v => 1 / v),
    text: T`An ideal gas with $nRT = 1\,\text{kJ}$ expands reversibly and isothermally to twice its volume. Find the work it does.`,
    parts: [ex(T`$W$`, Math.LN2, T`\ln 2`, 'kJ')],
    hints: [T`$W = \displaystyle\int p\,dV = nRT\int\frac{dV}{V}$.`],
    steps: [T`$W = nRT\ln\dfrac{V_2}{V_1} = 1\,\text{kJ}\cdot\ln2$.`, T`$W \approx 0.693\,\text{kJ}$, all of it supplied as heat.`],
    idea: 'In an isothermal process of an ideal gas, internal energy is unchanged, so Q = W.',
    prereq: 'Ideal gas; boundary work.',
    verify: () => [NUM.simpson(V => 1 / V, 1, 2)]
}, {
    title: 'Draining a tank in two halves',
    diagram: sketch(
        'Cylindrical tank with depth marks and a bottom drain.',
        wire('M230 38v156h108m21 0h108V38M230 68h237') + guide('M230 162h237') + arrow(349, 194, 349, 229),
        [[201, 75, 'h'], [196, 166, 'h/4'], [506, 202, 'Outlet']]),
    text: T`A cylindrical tank drains through a small hole in its base (Torricelli: $v = \sqrt{2gh}$). Compare the time to fall from depth $h$ to $h/4$ with the time to fall from $h/4$ to empty. Give the ratio.`,
    parts: [ex('Ratio', 1, '1')],
    hints: [T`$A\dfrac{dh}{dt} = -a\sqrt{2gh}$ gives $t \propto \sqrt{h_{\text{start}}} - \sqrt{h_{\text{end}}}$.`],
    steps: [T`$t_1 \propto \sqrt h - \sqrt{h/4} = \tfrac12\sqrt h$.`, T`$t_2 \propto \sqrt{h/4} - 0 = \tfrac12\sqrt h$.`, T`Ratio $= 1$: the last quarter of the depth takes as long as the first three-quarters.`],
    idea: 'Outflow slows as the head drops, so draining time scales with √h.',
    prereq: 'Bernoulli’s equation; separable ODEs.',
    verify: () => { const t = (a, b) => NUM.simpson(h => 1 / Math.sqrt(h), b, a, 20000); return [t(1, .25) / (2 * Math.sqrt(.25))]; }
}, {
    title: 'Squeezing air adiabatically',
    diagram: curve('Volume / initial volume', 'Pressure / initial pressure', [0.5, 1], [0, 3], v => v ** -1.4),
    text: T`Air ($\gamma = 1.4$) is compressed reversibly and adiabatically to half its volume. Find the temperature ratio $T_2/T_1$.`,
    parts: [ex(T`$T_2/T_1$`, 2 ** .4, T`2^{2/5}`)],
    hints: [T`$TV^{\gamma-1} = \text{const}$.`],
    steps: [T`$\dfrac{T_2}{T_1} = \left(\dfrac{V_1}{V_2}\right)^{\gamma - 1} = 2^{0.4}$.`, T`$\approx 1.32$, so $300\,\text{K}$ becomes about $396\,\text{K}$.`],
    idea: 'Compression heating is why diesel engines need no spark.',
    prereq: 'Isentropic relations.'
}]);
bank('thermo', 'applied', [{
    title: 'Mixing creates entropy',
    diagram: sketch(
        'Two equal water masses flow into an insulated mixing vessel.',
        wire('M260 125v76h200v-76M260 161h200') + arrow(181, 67, 295, 133) + arrow(539, 67, 425, 133),
        [[173, 52, 'm at 300 K'], [546, 52, 'm at 400 K'], [360, 233, 'Insulated vessel']]),
    text: T`Equal masses $m$ of water at $300\,\text{K}$ and $400\,\text{K}$ (constant specific heat $c$) are mixed in an insulated container. Find the entropy generated, in units of $mc$.`,
    parts: [ex(T`$\Delta S/(mc)$`, Math.log(49 / 48), T`\ln\dfrac{49}{48}`)],
    hints: [T`The final temperature is $350\,\text{K}$.`, T`$\Delta S = mc\ln\dfrac{T_f}{T_1} + mc\ln\dfrac{T_f}{T_2}$.`],
    steps: [T`$\Delta S = mc\ln\dfrac{350^2}{300\cdot400}$.`, T`$= mc\ln\dfrac{122500}{120000} = mc\ln\dfrac{49}{48} \approx 0.0206\,mc$.`, T`It is positive, because $(T_1+T_2)/2 \ge \sqrt{T_1T_2}$.`],
    idea: 'The AM–GM inequality is the second law here: mixing is always irreversible.',
    prereq: 'Entropy of incompressible substances.',
    verify: () => [NUM.simpson(T => 1 / T, 300, 350) - NUM.simpson(T => 1 / T, 350, 400)]
}, {
    title: 'Halving a pipe',
    diagram: curve('Diameter / initial diameter', 'Flow / initial flow', [0, 1], [0, 1], d => d ** 4),
    text: T`Laminar flow through a pipe follows Poiseuille’s law, $Q = \dfrac{\pi\,\Delta p\,D^4}{128\,\mu L}$. If the diameter is halved at the same pressure drop, by what factor does the flow rate change?`,
    parts: [ex('Factor', 1 / 16, T`\dfrac1{16}`)],
    hints: [T`$Q \propto D^4$.`],
    steps: [T`$(1/2)^4 = 1/16$.`],
    idea: 'This fourth-power law is why slight narrowing of an artery matters so much.',
    prereq: 'Laminar pipe flow.'
}, {
    title: 'Kinetic energy in laminar flow',
    diagram: curve('Radial position r/R', 'Velocity / centreline velocity', [-1, 1], [0, 1], r => 1 - r * r),
    text: T`For laminar flow with the parabolic profile $u = u_{\max}\left(1 - r^2/R^2\right)$, find the kinetic-energy correction factor $$\alpha = \frac{1}{A\bar u^3}\int_A u^3\,dA.$$`,
    parts: [ex(T`$\alpha$`, 2, '2')],
    hints: [T`$\bar u = u_{\max}/2$.`, T`Substitute $s = r^2/R^2$, so $dA = \pi R^2\,ds$.`],
    steps: [T`$\displaystyle\int_A u^3\,dA = \pi R^2u_{\max}^3\int_0^1(1-s)^3ds = \frac{\pi R^2u_{\max}^3}{4}$.`, T`$\alpha = \dfrac{1/4}{(1/2)^3} = 2$.`],
    idea: 'Using the mean velocity in Bernoulli underestimates laminar kinetic energy by half.',
    prereq: 'Velocity profiles; energy equation.',
    verify: () => [NUM.simpson(s => (1 - s) ** 3, 0, 1) / .125]
}, {
    title: 'Insulation that increases heat loss',
    diagram: sketch(
        'Pipe insulation conducts heat radially to its outer convecting surface.',
        ring(330, 119, 40) + ring(330, 119, 79) + arrow(330, 119, 408, 119) + arrow(424, 119, 544, 119),
        [[353, 105, 'r'], [481, 100, 'Heat flow'], [330, 225, 'Insulation k · outside convection h']]),
    text: T`A thin pipe is wrapped in insulation of conductivity $k = 0.5\,\text{W/(m}\cdot\text{K)}$ and cooled by convection with $h = 10\,\text{W/(m}^2\text{}\cdot\text{K)}$. Find the critical insulation radius at which heat loss is maximum.`,
    parts: [ex(T`$r_c$`, 5, '5', 'cm')],
    hints: [T`$R' = \dfrac{\ln(r/r_i)}{2\pi k} + \dfrac{1}{2\pi rh}$. Set $dR'/dr = 0$.`],
    steps: [T`$\dfrac{1}{kr} - \dfrac{1}{hr^2} = 0 \Rightarrow r_c = k/h$.`, T`$r_c = 0.5/10 = 0.05\,\text{m} = 5\,\text{cm}$.`],
    idea: 'Below the critical radius, adding insulation increases heat loss: the extra surface area outweighs the extra resistance.',
    prereq: 'Conduction and convection resistances.',
    verify: () => { let b = [0, Infinity]; for (let r = .011; r < .2; r += 1e-6) { const R = Math.log(r / .01) / (2 * Math.PI * .5) + 1 / (2 * Math.PI * r * 10); if (R < b[1]) b = [r, R]; } return [b[0] * 100]; }
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
    const list = BANK[topic + ':' + level], meta = LEVELS.find(l => l.id === level);
    if (!list || !meta) throw Error('Unknown challenge selection');
    const d = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000), i = ((d + hashString(topic + level)) % list.length + list.length) % list.length, e = list[i];
    return {id: `${topic}-${level}-${i}`, givens: [], source: null, ...e, prerequisites: e.prereq, diagram: e.diagram || '', level: meta.name, minutes: meta.time, bankIndex: i};
}
