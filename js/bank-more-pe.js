/* Level 1, more curated problems: Power & electromagnetics (power systems, motors & drives, electromagnetism).
   verify() checks each answer by an independent numerical method (phasors, line cascades, field integrals, simulation). */

/* ================= POWER SYSTEMS ================= */
bankMore('power', 'advanced', [{
    title: 'Correcting a power factor of 0.6',
    diagram: sketch('The power triangle of the load: 3 kilowatts real, 4 kilovars reactive, 5 kilovolt-amperes apparent, and a capacitor that cancels the reactive power.',
        wire('M150 200H450V40L150 200') + `<path d="M450 40V200" stroke="#aa492a" stroke-width="3"/>`, [[300, 226, 'P = 3 kW'], [510, 124, 'Q = 4 kvar'], [270, 106, 'S = 5 kVA'], [620, 70, 'capacitor −4 kvar'], [620, 100, '100 V, ω = 100 rad/s']], 245),
    text: T`A load takes $3\,\text{kW}$ at a power factor of $0.6$ lagging from a $100\,\text{V}$ RMS supply at $\omega = 100\,\text{rad/s}$. What capacitance in parallel brings the power factor to 1, and what is the supply current then (it was $50\,\text{A}$)?`,
    parts: [ex('Capacitance', 4, '4', 'mF'), ex('Supply current after', 30, '30', 'A')],
    hints: [T`$S = P/0.6 = 5\,\text{kVA}$, so $Q = \sqrt{S^2 - P^2} = 4\,\text{kvar}$.`, T`A capacitor supplies $Q_C = \omega CV^2$.`],
    steps: [T`$C = \dfrac{Q}{\omega V^2} = \dfrac{4000}{100\times100^2} = 4\,\text{mF}$.`, T`At unity power factor the current carries only real power: $3000/100 = 30\,\text{A}$.`],
    idea: 'Reactive power circulates between load and capacitor instead of travelling down the line, so the same real power arrives with less current and less loss.',
    prereq: 'Complex power; capacitive reactance.',
    verify: () => { const Il = cp(50, -Math.acos(.6) * 180 / Math.PI), tot = C => ca(Il, cx(0, 100 * C * 100)), C = NUM.bisect(c => tot(c).im, 0, .02); return [C * 1e3, cabs(tot(C))]; }
}, {
    title: 'Star or delta?',
    diagram: sketch('Three equal resistors connected in star and in delta to the same three-phase supply.',
        wire('M180 60L180 130L120 190M180 130L240 190') + dot(180, 130) + wire('M420 190L500 60L580 190Z'), [[180, 46, 'R'], [110, 214, 'R'], [250, 214, 'R'], [180, 240, 'star'], [440, 120, 'R'], [560, 120, 'R'], [500, 214, 'R'], [500, 240, 'delta']], 255),
    text: T`Three equal resistors are connected to a balanced three-phase supply, first in star, then in delta. By what factor does the delta connection increase the total power, and the line current?`,
    parts: [ex('Power ratio', 3, '3'), ex('Line-current ratio', 3, '3')],
    hints: [T`In star each resistor sees the phase voltage $V_L/\sqrt3$; in delta it sees the full line voltage $V_L$.`, T`In delta the line current is $\sqrt3$ times each resistor's current.`],
    steps: [T`Power per resistor scales with $V^2$: $(\sqrt3)^2 = 3$ times more in delta.`, T`Resistor current is $\sqrt3$ times larger, and the line current $\sqrt3$ times that again: $3$ times in all.`],
    idea: 'Delta puts √3 more voltage across each element, tripling the power: star–delta starting uses this to start motors at a third of the torque and current.',
    prereq: 'Three-phase circuits.',
    verify: () => { const V = [0, -120, 120].map(a => cp(1 / Math.sqrt(3), a)), Vab = cs(V[0], V[1]), Vca = cs(V[2], V[0]), R = 1, Pstar = V.reduce((s, v) => s + cabs(v) ** 2 / R, 0), Pdelta = [Vab, cs(V[1], V[2]), Vca].reduce((s, v) => s + cabs(v) ** 2 / R, 0), Istar = cabs(V[0]) / R, Idelta = cabs(cs(cd(Vab, cx(R)), cd(Vca, cx(R)))); return [Pdelta / Pstar, Idelta / Istar]; }
}, {
    title: 'Why transmission voltages are high',
    diagram: drawing(bkChain([[120, 110, 'generator'], [320, 130, 'line 5 Ω'], [540, 110, 'load 10 MW']], 90) + dt(385, 200, 'unity power factor'),
        'A generator feeding a 10 megawatt load through a line of 5 ohms', 225),
    text: T`A load of $10\,\text{MW}$ at unity power factor is fed through a line with total resistance $5\,\Omega$ (treat it as a single-phase or DC link). Find the line loss if the load voltage is $50\,\text{kV}$, and if it is $100\,\text{kV}$.`,
    parts: [ex(T`Loss at $50\,\text{kV}$`, 200, '200', 'kW'), ex(T`Loss at $100\,\text{kV}$`, 50, '50', 'kW')],
    hints: [T`$I = P/V$ and the loss is $I^2R$.`, T`Doubling the voltage halves the current.`],
    steps: [T`$50\,\text{kV}$: $I = 200\,\text{A}$, loss $= 200^2\times5 = 200\,\text{kW}$ ($2\,\%$).`, T`$100\,\text{kV}$: $I = 100\,\text{A}$, loss $= 50\,\text{kW}$: a quarter.`],
    idea: 'Line loss falls with the square of the voltage for the same power, which is why power travels at hundreds of kilovolts and transformers exist.',
    prereq: 'Ohm’s law; power.',
    verify: () => { const loss = V => { const I = NUM.bisect(i => V * i - 1e7, 0, 1e5); return I * I * 5 / 1e3; }; return [loss(5e4), loss(1e5)]; }
}, {
    title: 'The power–angle curve',
    diagram: curve('load angle δ (degrees)', 'power (pu)', [0, 180], [0, 2.2], d => 2 * Math.sin(d * Math.PI / 180)),
    text: T`Two buses with voltages of $1\,\text{pu}$ are joined by a lossless line of reactance $0.5\,\text{pu}$, so $P = \dfrac{V_1V_2}{X}\sin\delta$. Find the largest power the line can carry, and the angle at which it carries $1\,\text{pu}$.`,
    parts: [ex('Maximum power', 2, '2', 'pu'), ex(T`$\delta$ at $1\,\text{pu}$`, 30, '30', '°')],
    hints: [T`$\sin\delta \le 1$.`, T`$\sin\delta = PX/(V_1V_2)$.`],
    steps: [T`$P_{\max} = \dfrac{1\cdot1}{0.5} = 2\,\text{pu}$ at $\delta = 90^\circ$.`, T`$\sin\delta = 0.5 \Rightarrow \delta = 30^\circ$: half the limit at a third of the angle.`],
    idea: 'AC power flows down an angle difference, and a line has a hard steady-state limit V²/X at 90°; stability needs a good margin below it.',
    prereq: 'Phasors; the power-angle equation.',
    verify: () => { const P = d => cm(cp(1, d), cconj(cd(cs(cp(1, d), cx(1)), cx(0, .5)))).re; let best = 0; for (let d = 0; d <= 180; d += .01) best = Math.max(best, P(d)); return [best, NUM.bisect(d => P(d) - 1, 0, 90)]; } // power delivered by the bus at angle δ through j0.5
}, {
    title: 'When a transformer is most efficient',
    diagram: curve('load (fraction of rated)', 'efficiency', [0, 1.2], [.9, .97], x => Math.max(.9, 100 * x / (100 * x + 1 + 4 * x * x))),
    text: T`A $100\,\text{kVA}$ transformer has $1\,\text{kW}$ of core loss and $4\,\text{kW}$ of copper loss at full load. At what fraction of full load is its efficiency highest, and what is that efficiency at unity power factor?`,
    parts: [ex('Load fraction', .5, T`\dfrac{1}{2}`), ex('Efficiency', 25 / 26, T`\dfrac{25}{26}`)],
    hints: [T`Copper loss scales as the square of the load fraction $x$; core loss is constant.`, T`Efficiency peaks when the two losses are equal.`],
    steps: [T`$4x^2 = 1 \Rightarrow x = \tfrac{1}{2}$.`, T`$\eta = \dfrac{50}{50 + 1 + 1} = \dfrac{25}{26} \approx 96.2\,\%$.`],
    idea: 'Efficiency peaks where variable loss equals fixed loss; distribution transformers are designed to peak near their typical, not their maximum, load.',
    prereq: 'Losses; optimisation.',
    verify: () => { const eta = x => 100 * x / (100 * x + 1 + 4 * x * x); let lo = .05, hi = 1.5; const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 80; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (eta(c) > eta(d)) hi = d; else lo = c; } return [(lo + hi) / 2, eta((lo + hi) / 2)]; }
}, {
    title: 'Fault level of a transformer',
    diagram: drawing(wire('M80 120H220M380 120H560') + ring(270, 120, 40) + ring(330, 120, 40) + `<path d="M560 90l20 30h-14l18 34" stroke="#aa492a" stroke-width="3"/>` + dt(120, 100, 'strong grid') + dt(300, 190, '20 MVA, 10 %') + dt(470, 100, '11 kV') + dt(600, 190, 'three-phase fault'),
        'A 20 megavolt-ampere transformer fed from a strong grid, with a three-phase fault on its 11 kilovolt side', 220),
    text: T`A $20\,\text{MVA}$ transformer with $10\,\%$ impedance is fed from a grid strong enough to treat as infinite. A three-phase fault occurs on its $11\,\text{kV}$ side. Find the fault level in MVA and the fault current in kA.`,
    parts: [ex('Fault level', 200, '200', 'MVA'), ex('Fault current', 200 / (11 * Math.sqrt(3)), T`200/(11\sqrt3)`, 'kA')],
    hints: [T`In per unit, the fault current is $1/Z = 10\,\text{pu}$ of the transformer's rating.`, T`$I = \dfrac{S}{\sqrt3V_L}$.`],
    steps: [T`Fault level $= S/Z_{pu} = 20/0.1 = 200\,\text{MVA}$.`, T`$I = \dfrac{200\,\text{MVA}}{\sqrt3\times11\,\text{kV}} \approx 10.5\,\text{kA}$.`],
    idea: 'The per-unit impedance of a transformer is the reciprocal of the fault current it lets through, in multiples of its rating; switchgear is sized from that.',
    prereq: 'Per-unit system; three-phase power.',
    verify: () => { const Z = .1 * 11e3 ** 2 / 20e6, I = 11e3 / Math.sqrt(3) / Z; return [3 * (11e3 / Math.sqrt(3)) * I / 1e6, I / 1e3]; } // impedance in ohms, phase voltage over it
}, {
    title: 'The Ferranti effect',
    diagram: curve('distance from the sending end (km)', 'V / Vs', [0, 500], [.95, 1.2], x => Math.cos(Math.PI / 6 * (1 - x / 500)) / Math.cos(Math.PI / 6)),
    text: T`A lossless $500\,\text{km}$ line at $50\,\text{Hz}$ carries waves at practically the speed of light, so its wavelength is $6000\,\text{km}$. With the receiving end open, what is the ratio of the receiving-end voltage to the sending-end voltage?`,
    parts: [ex(T`$V_R/V_S$`, 2 / Math.sqrt(3), T`2/\sqrt3`)],
    hints: [T`For a lossless line, $V_S = V_R\cos\beta\ell + jZ_0I_R\sin\beta\ell$, and $I_R = 0$ when open.`, T`$\beta\ell = 2\pi\times500/6000$.`],
    steps: [T`$\beta\ell = \pi/6$, so $V_R = V_S/\cos(\pi/6)$.`, T`$V_R/V_S = \dfrac{2}{\sqrt3} \approx 1.155$: a $15.5\,\%$ rise at the open end.`],
    idea: 'A lightly loaded long line’s own capacitance raises the far-end voltage (the Ferranti effect); shunt reactors absorb the excess.',
    prereq: 'Transmission-line equations.',
    verify: () => { const n = 2000, dx = 500 / n, w = 2 * Math.PI * 50, L = 1 / 3e5, Cc = 1 / 3e5; let M = abcdSeries(cx(0)); for (let i = 0; i < n; i++) M = abcdMul(abcdMul(M, abcdSeries(cx(0, w * L * dx / 2))), abcdMul(abcdShunt(cx(0, w * Cc * dx)), abcdSeries(cx(0, w * L * dx / 2)))); return [1 / cabs(M[0][0])]; } // cascade of 2000 short L–C sections (unit Z₀, wave speed 3×10⁵ km/s)
}, {
    title: 'The nose of the PV curve',
    diagram: sketch('Receiving-end voltage against load power for a line feeding a unity-power-factor load: the curve folds back at its nose.',
        wire('M110 210H640M110 210V30') + `<path d="${Array.from({length: 91}, (_, i) => { const d = i * Math.PI / 180; return `${i ? 'L' : 'M'}${(110 + 100 * 5 * Math.sin(2 * d)).toFixed(1)} ${(210 - 170 * Math.cos(d)).toFixed(1)}`; }).join('')}" stroke="#aa492a" stroke-width="3"/>` + dot(610, 210 - 170 * Math.SQRT1_2),
        [[380, 240, 'load power P (pu)'], [70, 30, 'V₂'], [610, 70, 'nose'], [140, 30, '1']], 255),
    text: T`A bus at $1\,\text{pu}$ feeds a load at unity power factor through a line of reactance $0.1\,\text{pu}$. As the load grows, the receiving voltage falls until, beyond some power, no solution exists. Find that maximum power and the receiving voltage at that point.`,
    parts: [ex('Maximum power', 5, '5', 'pu'), ex('Voltage at the nose', Math.SQRT1_2, T`\dfrac{1}{\sqrt2}`, 'pu')],
    hints: [T`With $V_2$ as reference and current $I = P/V_2$ in phase with it: $V_1 = V_2 + jXP/V_2$.`, T`$|V_1|^2 = V_2^2 + X^2P^2/V_2^2$ is a quadratic in $V_2^2$; it has a real root only if $V_1^4 \ge 4X^2P^2$.`],
    steps: [T`$P_{\max} = \dfrac{V_1^2}{2X} = \dfrac{1}{0.2} = 5\,\text{pu}$.`, T`There $V_2^2 = V_1^2/2$, so $V_2 = \dfrac{1}{\sqrt2} \approx 0.707\,\text{pu}$.`, T`Past the nose, voltage collapse: the load cannot be served at any voltage.`],
    idea: 'A line has a maximum deliverable power set by its reactance; the PV curve’s nose marks voltage collapse, which happens well below thermal limits on long lines.',
    prereq: 'Phasors; quadratic equations.',
    verify: () => { const P = v => v / .1 * Math.sqrt(1 - v * v); let lo = .01, hi = .99; const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 80; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (P(c) > P(d)) hi = d; else lo = c; } const v = (lo + hi) / 2; return [P(v), v]; } // |V₂ + jXP/V₂| = 1 solved for P
}, {
    title: 'The distortion of a square wave',
    diagram: curve('time (periods)', 'v', [0, 2], [-1.3, 1.3], x => Math.sin(2 * Math.PI * x) >= 0 ? 1 : -1),
    text: T`An inverter produces a square wave of amplitude $1$. What fraction of its RMS value is in the fundamental, and what is its total harmonic distortion (harmonic RMS divided by fundamental RMS)?`,
    parts: [ex('Fundamental / total RMS', 2 * Math.SQRT2 / Math.PI, T`2\sqrt2/\pi`), ex('THD', Math.sqrt(Math.PI ** 2 / 8 - 1), T`\sqrt{\pi^2/8-1}`)],
    hints: [T`The fundamental has amplitude $4/\pi$, so RMS $\dfrac{4}{\pi\sqrt2}$; the square wave's RMS is $1$.`, T`$\text{THD} = \sqrt{\dfrac{V_{\text{rms}}^2 - V_1^2}{V_1^2}}$.`],
    steps: [T`$V_1/V = \dfrac{2\sqrt2}{\pi} \approx 0.900$.`, T`$\text{THD} = \sqrt{\dfrac{\pi^2}{8} - 1} \approx 0.483$, i.e. $48\,\%$.`],
    idea: 'A square wave puts 90% of its RMS in the fundamental but still has 48% THD; PWM and multilevel inverters push the harmonics up or down to filter them.',
    prereq: 'Fourier series; RMS.',
    verify: () => { let h = 0; for (let n = 3; n < 400000; n += 2) h += (4 / (n * Math.PI)) ** 2 / 2; const v1 = 4 / Math.PI / Math.SQRT2; return [v1 / Math.sqrt(NUM.simpson(() => 1, 0, 1, 2)), Math.sqrt(h) / v1]; }
}, {
    title: 'A boost converter’s ideal and real gain',
    diagram: drawing(element('DC', 80, 70, 80, 210, 'Vin') + element('L', 80, 70, 280, 70, 'L, 0.01 R') + wire('M280 70H330M280 70V110M280 170V210M80 210H600M440 70H600') + wire('M280 110l18 30M280 170V150') + element('diode', 330, 70, 440, 70) + element('C', 500, 70, 500, 210, 'C') + element('R', 600, 70, 600, 210, 'R') + dt(240, 146, 'switch, D'),
        'A boost converter: an inductor with resistance, a switch to ground, a diode, an output capacitor and a load resistor', 240),
    text: T`An ideal boost converter in continuous conduction has $V_o/V_{in} = 1/(1 - D)$. Find the gain at $D = 0.75$. If the inductor has a resistance of $0.01R$, where $R$ is the load, the averaged circuit gives $\dfrac{V_o}{V_{in}} = \dfrac{1}{1 - D}\cdot\dfrac{1}{1 + R_L/(R(1 - D)^2)}$: find the real gain.`,
    parts: [ex('Ideal gain', 4, '4'), ex('Real gain', 100 / 29, T`\dfrac{100}{29}`)],
    hints: [T`Ideal: $1/(1 - 0.75) = 4$.`, T`$R_L/(R(1 - D)^2) = 0.01\times16 = 0.16$.`],
    steps: [T`Ideal gain $4$.`, T`Real gain $\dfrac{4}{1.16} = \dfrac{100}{29} \approx 3.45$.`, T`The inductor carries $1/(1 - D) = 4$ times the load current, so its small resistance matters a lot at high duty cycles.`],
    idea: 'Boost gain looks unlimited on paper, but parasitic resistance caps it: high duty cycles push large currents through the losses.',
    prereq: 'Switching converters; averaging.',
    verify: () => { const D = .75, [, Vo] = NUM.solve([[.01, 1 - D], [1 - D, -1]], [1, 0]); return [1 / (1 - D), Vo]; } // V_in = I_L R_L + (1 − D)V_o; (1 − D)I_L = V_o/R, with R = 1
}, {
    title: 'Two wattmeters on three phases',
    diagram: drawing(wire('M80 70H600M80 130H600M80 190H600') + bkBox(250, 50, 70, 40, 'W1') + bkBox(250, 170, 70, 40, 'W2') + dt(60, 76, 'a') + dt(60, 136, 'b') + dt(60, 196, 'c') + dt(668, 136, 'balanced load'),
        'Three-phase lines a, b and c with wattmeters on lines a and c, their voltage coils referred to line b', 230),
    text: T`Two wattmeters measure a balanced three-phase load, their current coils in lines a and c and their voltage coils referred to line b. They read $3\,\text{kW}$ and $1\,\text{kW}$. Find the total power and the load's power factor.`,
    parts: [ex('Total power', 4, '4', 'kW'), ex('Power factor', 2 / Math.sqrt(7), T`2/\sqrt7`)],
    hints: [T`$P = W_1 + W_2$.`, T`$Q = \sqrt3(W_1 - W_2)$, so $\tan\varphi = \sqrt3\,\dfrac{W_1 - W_2}{W_1 + W_2}$.`],
    steps: [T`$P = 4\,\text{kW}$.`, T`$\tan\varphi = \sqrt3\cdot\tfrac{2}{4} = \tfrac{\sqrt3}{2}$, so $\cos\varphi = \dfrac{1}{\sqrt{1 + 3/4}} = \dfrac{2}{\sqrt7} \approx 0.756$.`],
    idea: 'Two wattmeters measure three-phase power exactly, and their difference reveals the reactive power, and hence the power factor, of a balanced load.',
    prereq: 'Three-phase power; phasors.',
    verify: () => { const read = phi => { const Va = cp(1, 0), Vb = cp(1, -120), Vc = cp(1, 120), Ia = cp(1, -phi), Ic = cp(1, 120 - phi); return [cm(cs(Va, Vb), cconj(Ia)).re, cm(cs(Vc, Vb), cconj(Ic)).re]; }, phi = NUM.bisect(p => { const [w1, w2] = read(p); return w2 - 3 * w1; }, 0, 59), [w1, w2] = read(phi); return [(w1 + w2) * 3 / w2, Math.cos(phi * Math.PI / 180)]; } // for a lagging load the meter on line c reads the larger value
}]);

/* ================= MOTORS & DRIVES ================= */
bankMore('motors', 'advanced', [{
    title: 'Finding the motor constant from one test',
    diagram: drawing(element('DC', 120, 70, 120, 200, '24 V') + element('R', 120, 70, 360, 70, '1 Ω') + wire('M360 70H480V100M480 170V200H120') + ring(480, 135, 35) + dt(480, 141, 'M') + dt(570, 141, '2000 rpm') + dt(240, 236, 'draws 3 A'),
        'A DC motor with 1 ohm armature resistance running from 24 volts', 250),
    text: T`A permanent-magnet DC motor with armature resistance $1\,\Omega$ runs at $2000\,\text{rpm}$ from $24\,\text{V}$, drawing $3\,\text{A}$. Find its motor constant $K$ (back-EMF per rad/s, equal to torque per amp), the torque it is producing, and its ideal no-load speed.`,
    parts: [ex(T`$K$`, 63 / (200 * Math.PI), T`\dfrac{63}{200\pi}`, 'V·s/rad'), ex('Torque', 189 / (200 * Math.PI), T`\dfrac{189}{200\pi}`, 'N·m'), ex('No-load speed', 16000 / 7, T`\dfrac{16000}{7}`, 'rpm')],
    hints: [T`Back-EMF $E = V - IR = 21\,\text{V}$; $\omega = 2000\cdot2\pi/60$.`, T`No load means no current: $\omega_0 = V/K$.`],
    steps: [T`$K = \dfrac{21}{200\pi/3} = \dfrac{63}{200\pi} \approx 0.100\,\text{V}\cdot\text{s/rad}$.`, T`$T = KI = \dfrac{189}{200\pi} \approx 0.301\,\text{N}\cdot\text{m}$.`, T`$\omega_0 = 24/K$, i.e. $2000\times\dfrac{24}{21} = \dfrac{16000}{7} \approx 2286\,\text{rpm}$.`],
    idea: 'One loaded test gives a DC motor’s whole straight-line characteristic: subtract the IR drop to get the back-EMF and hence K.',
    prereq: 'DC motor equations.',
    verify: () => { const w = 2000 * 2 * Math.PI / 60, K = NUM.bisect(k => 24 - 3 * 1 - k * w, 0, 1), w0 = NUM.bisect(x => (24 - K * x) / 1, 0, 1e4); return [K, K * 3, w0 * 60 / (2 * Math.PI)]; }
}, {
    title: 'How fast a DC motor spins up',
    diagram: curve('time (s)', 'speed (rad/s)', [0, .5], [0, 650], t => 600 * (1 - Math.exp(-t / .1))),
    text: T`A DC motor with rotor inertia $J = 2\times10^{-5}\,\text{kg}\cdot\text{m}^2$, resistance $R = 2\,\Omega$ and $K = 0.02\,\text{V}\cdot\text{s/rad}$ is switched onto $12\,\text{V}$ with no load (neglect inductance and friction). Find its mechanical time constant and its speed after one time constant.`,
    parts: [ex('Time constant', .1, T`\dfrac{1}{10}`, 's'), ex('Speed after one time constant', 600 * (1 - Math.exp(-1)), T`600(1-e^{-1})`, 'rad/s')],
    hints: [T`$J\dot\omega = KI = \dfrac{K(V - K\omega)}{R}$.`, T`$\tau_m = \dfrac{JR}{K^2}$ and the final speed is $V/K$.`],
    steps: [T`$\tau_m = \dfrac{2\times10^{-5}\times2}{0.02^2} = 0.1\,\text{s}$.`, T`$\omega(\tau_m) = 600(1 - e^{-1}) \approx 379\,\text{rad/s}$.`],
    idea: 'Back-EMF acts like viscous damping with coefficient K²/R, giving a first-order spin-up with time constant JR/K².',
    prereq: 'First-order ODEs; DC motors.',
    verify: () => { const tr = rk4((t, [w]) => [.02 * (12 - .02 * w) / 2 / 2e-5], [0], 0, 1, 20000), wf = tr[tr.length - 1][1][0], lvl = wf * (1 - Math.exp(-1)); let tau = 0; tr.forEach(([t, [w]], i) => { if (!tau && w >= lvl) { const [t0, [w0]] = tr[i - 1]; tau = t0 + (t - t0) * (lvl - w0) / (w - w0); } }); return [tau, lvl]; }
}, {
    title: 'Slip of an induction motor',
    diagram: drawing(bkBox(90, 50, 140, 50, 'air gap 10 kW') + bkBox(330, 50, 150, 50, 'rotor copper') + bkBox(330, 150, 150, 50, 'mechanical') + arrow(230, 75, 330, 75) + arrow(230, 75, 330, 175) + dt(560, 81, 's × 10 kW') + dt(580, 181, '(1 − s) × 10 kW'),
        'Power flow in an induction motor: air-gap power splits into rotor copper loss and mechanical power', 230),
    text: T`A 4-pole induction motor on a $50\,\text{Hz}$ supply runs with $4\,\%$ slip. Find its synchronous speed and its rotor speed. If $10\,\text{kW}$ crosses the air gap, how much is lost in the rotor copper?`,
    parts: [ex('Synchronous speed', 1500, '1500', 'rpm'), ex('Rotor speed', 1440, '1440', 'rpm'), ex('Rotor copper loss', 400, '400', 'W')],
    hints: [T`$n_s = 120f/p$ with $p$ poles.`, T`Air-gap power splits into rotor copper loss $sP_{ag}$ and mechanical power $(1 - s)P_{ag}$.`],
    steps: [T`$n_s = 120\times50/4 = 1500\,\text{rpm}$; $n = 0.96\times1500 = 1440\,\text{rpm}$.`, T`Rotor copper loss $= 0.04\times10\,\text{kW} = 400\,\text{W}$.`],
    idea: 'Slip is literally the fraction of air-gap power burnt in the rotor, so an induction motor’s rotor efficiency can never exceed 1 − s.',
    prereq: 'Induction motors.',
    verify: () => { const ns = 120 * 50 / 4, s = .04, R2 = .1, I = NUM.bisect(i => i * i * R2 / s - 1e4, 0, 1e4); return [ns, ns * (1 - s), I * I * R2]; } // air-gap power I²R₂/s, rotor copper loss I²R₂
}, {
    title: 'Breakdown torque of an induction motor',
    diagram: curve('slip s', 'torque / maximum', [0, 1], [0, 1.05], s => .4 * s / (.04 + s * s)),
    text: T`An induction motor's torque, neglecting stator impedance, is proportional to $\dfrac{sR_2}{R_2^2 + (sX_2)^2}$, with $R_2 = 0.2\,\Omega$ and $X_2 = 1\,\Omega$. At what slip is the torque largest, and what is the starting torque ($s = 1$) as a fraction of that maximum?`,
    parts: [ex('Slip at maximum torque', .2, T`\dfrac{1}{5}`), ex('Starting / maximum torque', 5 / 13, T`\dfrac{5}{13}`)],
    hints: [T`Maximise $\dfrac{s}{R_2^2 + s^2X_2^2}$: the maximum is at $sX_2 = R_2$.`, T`Compare $T(1) = \dfrac{0.2}{1.04}$ with $T_{\max} = \dfrac{0.04}{0.08}$.`],
    steps: [T`$s_{\max} = R_2/X_2 = 0.2$.`, T`$\dfrac{T(1)}{T_{\max}} = \dfrac{2s_{\max}}{1 + s_{\max}^2} = \dfrac{0.4}{1.04} = \dfrac{5}{13} \approx 0.38$.`],
    idea: 'The rotor resistance sets the slip of breakdown torque without changing its height: wound-rotor motors add resistance to start at full torque.',
    prereq: 'Induction motor torque; optimisation.',
    verify: () => { const T = s => s * .2 / (.04 + s * s); let lo = .01, hi = 1; const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 80; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (T(c) > T(d)) hi = d; else lo = c; } const s = (lo + hi) / 2; return [s, T(1) / T(s)]; }
}, {
    title: 'Torque of a permanent-magnet synchronous motor',
    diagram: sketch('A surface-magnet rotor with alternating poles, and the stator current placed on the q-axis, 90 electrical degrees from the magnet flux.',
        ring(300, 130, 90) + ring(300, 130, 50) + arrow(300, 130, 300, 50) + arrow(300, 130, 380, 130),
        [[300, 36, 'd: magnet flux λ'], [450, 136, 'q: current iq'], [300, 246, '4 pole pairs'], [600, 100, 'λ = 0.01 Wb'], [600, 130, 'iq = 10 A']], 255),
    text: T`A permanent-magnet synchronous motor has $p = 4$ pole pairs and magnet flux linkage $\lambda = 0.01\,\text{Wb}$. With field-oriented control putting $i_q = 10\,\text{A}$ on the q-axis ($i_d = 0$), the torque is $T = \tfrac{3}{2}p\lambda i_q$. Find the torque, and the peak line-to-line back-EMF at $3000\,\text{rpm}$.`,
    parts: [ex('Torque', .6, T`\dfrac{3}{5}`, 'N·m'), ex('Peak line-to-line back-EMF', 4 * Math.sqrt(3) * Math.PI, T`4\sqrt{3}\,\pi`, 'V')],
    hints: [T`$T = 1.5\times4\times0.01\times10$.`, T`Electrical speed $\omega_e = p\,\omega_m$; the phase EMF peak is $\lambda\omega_e$, and line-to-line is $\sqrt3$ times that.`],
    steps: [T`$T = 0.6\,\text{N}\cdot\text{m}$.`, T`$\omega_m = 100\pi$, $\omega_e = 400\pi\,\text{rad/s}$, phase peak $= 4\pi \approx 12.6\,\text{V}$.`, T`Line-to-line peak $= 4\sqrt3\,\pi \approx 21.8\,\text{V}$.`],
    idea: 'With current held on the q-axis, a PMSM behaves like a DC motor: torque proportional to current, back-EMF proportional to speed.',
    prereq: 'Three-phase machines; dq frame.',
    verify: () => { const p = 4, lam = .01, iq = 10, wm = 100 * Math.PI, we = p * wm, T = 1.5 * we * lam * iq / wm; let pk = 0; for (let i = 0; i < 3600; i++) { const th = i * Math.PI / 1800; pk = Math.max(pk, lam * we * (Math.sin(th) - Math.sin(th - 2 * Math.PI / 3))); } return [T, pk]; } // power balance for torque; sampled e_a − e_b for the EMF
}, {
    title: 'Where a motor and a fan agree',
    diagram: bkPlot('speed (rad/s)', 'torque (N·m)', [0, 300], [0, 2], [w => 2 * (1 - w / 300), w => 1e-5 * w * w], [[224.44, .5037, 'operating point', -40, -14]]),
    text: T`A DC motor has a straight torque–speed line from a stall torque of $2\,\text{N}\cdot\text{m}$ to a no-load speed of $300\,\text{rad/s}$. It drives a fan needing $T = 10^{-5}\omega^2\,\text{N}\cdot\text{m}$. Find the operating speed and torque.`,
    parts: [ex('Speed', (Math.sqrt(2.8) - 1) / .003, T`(\sqrt{2.8}-1)/0.003`, 'rad/s'), ex('Torque', 2 * (1 - (Math.sqrt(2.8) - 1) / .9), T`2(1-(\sqrt{2.8}-1)/0.9)`, 'N·m')],
    hints: [T`Equate $2(1 - \omega/300) = 10^{-5}\omega^2$.`, T`$1.5\times10^{-3}\omega^2 + \omega - 300 = 0$.`],
    steps: [T`$\omega = \dfrac{-1 + \sqrt{1 + 1.8}}{0.003} = \dfrac{\sqrt{2.8} - 1}{0.003} \approx 224\,\text{rad/s}$.`, T`$T = 2(1 - \omega/300) \approx 0.504\,\text{N}\cdot\text{m}$.`],
    idea: 'A drive settles where the motor’s torque–speed curve crosses the load’s; fans and pumps, with torque rising as speed squared, give a stable crossing.',
    prereq: 'Quadratic equations; torque–speed curves.',
    verify: () => { const w = NUM.bisect(x => 2 * (1 - x / 300) - 1e-5 * x * x, 0, 300); return [w, 1e-5 * w * w]; }
}, {
    title: 'Torque to drive a lead screw',
    diagram: sketch('A motor turning a lead screw that pushes a nut against a 1000 newton load.',
        wire('M120 110h60v40h-60zM180 130H560') + Array.from({length: 18}, (_, i) => wire(`M${200 + i * 20} 118l10 24`)).join('') + wire('M380 100h60v60h-60z') + arrow(440, 130, 520, 130),
        [[150, 180, 'motor'], [410, 190, 'nut'], [620, 136, '1000 N'], [360, 236, 'lead 5 mm per turn, efficiency 0.9']], 250),
    text: T`A lead screw with a lead of $5\,\text{mm}$ per revolution and an efficiency of $0.9$ pushes a load of $1000\,\text{N}$. What motor torque does it need, and what motor speed moves the load at $50\,\text{mm/s}$?`,
    parts: [ex('Torque', 25 / (9 * Math.PI), T`\dfrac{25}{9\pi}`, 'N·m'), ex('Speed', 600, '600', 'rpm')],
    hints: [T`Work per revolution: $T\cdot2\pi\cdot\eta = F\cdot\ell$.`, T`$50\,\text{mm/s}$ at $5\,\text{mm}$ per turn is $10\,\text{rev/s}$.`],
    steps: [T`$T = \dfrac{1000\times0.005}{2\pi\times0.9} = \dfrac{25}{9\pi} \approx 0.884\,\text{N}\cdot\text{m}$.`, T`$10\,\text{rev/s} = 600\,\text{rpm}$.`],
    idea: 'A screw is a gearbox with ratio 2π/lead: a fine lead turns a small torque into a large force, at the cost of speed.',
    prereq: 'Work and energy; mechanical advantage.',
    verify: () => { const T = NUM.bisect(t => t * 2 * Math.PI * .9 - 1000 * .005, 0, 10); return [T, 50 / 5 * 60]; }
}, {
    title: 'When a motor becomes a generator',
    diagram: bkPlot('speed ω (rad/s)', 'armature current (A)', [0, 320], [-8, 24], [w => (24 - .1 * w) / 1, () => 0], [[300, -6, 'pushed to 300 rad/s', -200, -12]]),
    text: T`A DC motor with $K = 0.1\,\text{V}\cdot\text{s/rad}$ and $R = 1\,\Omega$ is connected to $24\,\text{V}$, so its no-load speed is $240\,\text{rad/s}$. The load drives it to $300\,\text{rad/s}$. Find the armature current, the power returned to the supply, and the mechanical power the load must supply.`,
    parts: [ex('Armature current', -6, '-6', 'A'), ex('Power to the supply', 144, '144', 'W'), ex('Mechanical power input', 180, '180', 'W')],
    hints: [T`Back-EMF $K\omega = 30\,\text{V}$ now exceeds the supply.`, T`$I = (V - K\omega)/R$; the machine's converted power is $K\omega I$.`],
    steps: [T`$I = (24 - 30)/1 = -6\,\text{A}$: current flows back into the supply.`, T`Supply receives $24\times6 = 144\,\text{W}$.`, T`Mechanical input $= 30\times6 = 180\,\text{W}$; the other $36\,\text{W}$ heats the resistance.`],
    idea: 'Above no-load speed a DC machine regenerates automatically; regenerative braking is just letting the back-EMF win.',
    prereq: 'DC machines; power balance.',
    verify: () => { const I = NUM.bisect(i => 24 - i * 1 - .1 * 300, -50, 50); return [I, -24 * I, -.1 * 300 * I]; }
}, {
    title: 'Climbing a 30° ramp',
    diagram: sketch('A small robot on a 30 degree incline, with gravity split into a component down the slope.',
        wire('M150 220H500V18Z') + '<g transform="translate(320 112) rotate(-30)"><rect x="-26" y="-30" width="52" height="30"/></g>' + arrow(330, 96, 330, 172) + arrow(330, 96, 287, 121),
        [[210, 210, '30°'], [352, 176, 'mg'], [610, 90, '20 kg, two drive wheels'], [610, 120, 'wheel radius 0.1 m']], 245),
    text: T`A $20\,\text{kg}$ robot with two driven wheels of radius $0.1\,\text{m}$ climbs a $30^\circ$ ramp at constant speed ($g = 9.81\,\text{m/s}^2$, no rolling resistance). What torque must each wheel motor deliver, and what total power at $0.5\,\text{m/s}$?`,
    parts: [nx('Torque per wheel', 4.905, 'N·m'), nx('Power', 49.05, 'W')],
    hints: [T`The force along the slope is $mg\sin30^\circ$.`, T`Split it between the wheels: torque $= Fr/2$; power $= Fv$.`],
    steps: [T`$F = 20\times9.81\times0.5 = 98.1\,\text{N}$.`, T`Each wheel: $98.1\times0.1/2 = 4.905\,\text{N}\cdot\text{m}$.`, T`Power $= 98.1\times0.5 = 49.05\,\text{W}$: the rate of gaining height, $mg\times0.25\,\text{m/s}$.`],
    idea: 'On a slope the drive must lift the robot: power equals weight times vertical speed, whatever the gearing.',
    prereq: 'Forces on inclines; torque and power.',
    verify: () => { const F = NUM.bisect(f => f - 20 * 9.81 * Math.sin(Math.PI / 6), 0, 500); return [F * .1 / 2, 20 * 9.81 * .5 * Math.sin(Math.PI / 6)]; }
}, {
    title: 'How hard can an intermittent motor work?',
    diagram: curve('time (periods)', 'current (A)', [0, 3], [0, 11], x => (x % 1) < .25 ? 10 : 0),
    text: T`A motor's winding can carry $5\,\text{A}$ continuously without overheating, and its thermal time constant is much longer than its duty cycle. For what fraction of the time can it carry $10\,\text{A}$ (and nothing otherwise)? For what fraction can it carry $7.5\,\text{A}$?`,
    parts: [ex(T`Duty at $10\,\text{A}$`, .25, T`\dfrac{1}{4}`), ex(T`Duty at $7.5\,\text{A}$`, 4 / 9, T`\dfrac{4}{9}`)],
    hints: [T`Heating follows $I^2R$ averaged over the cycle, i.e. the RMS current.`, T`$I_{\text{peak}}\sqrt D = 5\,\text{A}$.`],
    steps: [T`$10\sqrt D = 5 \Rightarrow D = \tfrac{1}{4}$.`, T`$7.5\sqrt D = 5 \Rightarrow D = \tfrac{4}{9} \approx 44\,\%$.`],
    idea: 'Copper heating follows the RMS current, so a motor can be overloaded briefly; the allowed duty falls with the square of the overload.',
    prereq: 'RMS values; I²R heating.',
    verify: () => { const rms = (I, D) => Math.sqrt(NUM.simpson(x => (x < D ? I : 0) ** 2, 0, 1, 20000)); return [NUM.bisect(D => rms(10, D) - 5, .01, 1, 60), NUM.bisect(D => rms(7.5, D) - 5, .01, 1, 60)]; }
}, {
    title: 'Electrical and mechanical speed',
    diagram: sketch('A rotor with 14 magnets, seven pole pairs, alternating north and south around its rim.',
        ring(300, 130, 90) + ring(300, 130, 60),
        Array.from({length: 14}, (_, i) => [300 + 75 * Math.sin(i * Math.PI / 7), 135 - 75 * Math.cos(i * Math.PI / 7), i % 2 ? 'S' : 'N']).concat([[560, 110, '7 pole pairs'], [560, 140, '6000 rpm']]), 250),
    text: T`A brushless motor with $7$ pole pairs runs at $6000\,\text{rpm}$ under six-step commutation (six switching events per electrical cycle). Find the electrical frequency and the number of commutation events per second.`,
    parts: [ex('Electrical frequency', 700, '700', 'Hz'), ex('Commutations per second', 4200, '4200')],
    hints: [T`Each mechanical revolution passes $7$ north–south pairs: 7 electrical cycles.`, T`$6000\,\text{rpm} = 100\,\text{rev/s}$.`],
    steps: [T`$f_e = 7\times100 = 700\,\text{Hz}$.`, T`$6\times700 = 4200$ commutations per second.`],
    idea: 'Electrical frequency is pole pairs times mechanical speed, so many-pole motors demand fast switching even at modest speeds.',
    prereq: 'Rotating machines.',
    verify: () => { let count = 0, prev = 0; const N = 4e5; for (let i = 1; i <= N; i++) { const thm = 2 * Math.PI * 100 * i / N, sector = Math.floor(6 * 7 * thm / (2 * Math.PI)); if (sector !== prev) count++; prev = sector; } return [7 * 100, count]; } // one second of rotation, counting sector changes
}]);

/* ================= ELECTROMAGNETISM ================= */
bankMore('fields', 'advanced', [{
    title: 'Inside a 50 Ω coax',
    diagram: sketch('Cross-section of a coaxial cable: inner conductor of radius a, polyethylene dielectric, outer conductor of radius b.',
        `<circle cx="300" cy="130" r="95" fill="#e9eee6" stroke="#315740"/>` + `<circle cx="300" cy="130" r="27" fill="#315740"/>` + wire('M300 130H395') + wire('M300 130L280 112'),
        [[350, 122, 'b'], [262, 104, 'a'], [560, 110, 'polyethylene'], [560, 140, 'εr = 2.25']], 250),
    text: T`A coaxial cable with polyethylene dielectric ($\varepsilon_r = 2.25$) has $Z_0 = \dfrac{\eta_0}{2\pi\sqrt{\varepsilon_r}}\ln\dfrac ba$ with $\eta_0 = 120\pi\,\Omega$. What ratio $b/a$ gives $50\,\Omega$? What is its propagation delay per metre ($c = 3\times10^8\,\text{m/s}$)?`,
    parts: [ex(T`$b/a$`, Math.exp(1.25), T`e^{5/4}`), ex('Delay', 5, '5', 'ns/m')],
    hints: [T`$\dfrac{120\pi}{2\pi\times1.5} = 40$, so $\ln\dfrac ba = \dfrac{50}{40}$.`, T`The wave travels at $c/\sqrt{\varepsilon_r}$.`],
    steps: [T`$b/a = e^{5/4} \approx 3.49$.`, T`$v = 3\times10^8/1.5 = 2\times10^8\,\text{m/s}$: $5\,\text{ns/m}$.`],
    idea: 'A coax’s impedance depends only logarithmically on its geometry, and its speed only on the dielectric: two dimensions, one material, two numbers.',
    prereq: 'Transmission lines; logarithms.',
    verify: () => { const mu = 4 * Math.PI * 1e-7, eps = 2.25 / (mu * 9e16), Z = r => Math.sqrt((mu / (2 * Math.PI) * Math.log(r)) / (2 * Math.PI * eps / Math.log(r))), r = NUM.bisect(x => Z(x) - 50, 1.01, 100); return [r, Math.sqrt(mu * Math.log(r) / (2 * Math.PI) * 2 * Math.PI * eps / Math.log(r)) * 1e9]; }
}, {
    title: 'The capacitance of the Earth',
    diagram: sketch('An isolated charged sphere with its electric field pointing radially outward to infinity.',
        ring(300, 130, 70) + Array.from({length: 8}, (_, i) => arrow(300 + 75 * Math.cos(i * Math.PI / 4), 130 + 75 * Math.sin(i * Math.PI / 4), 300 + 115 * Math.cos(i * Math.PI / 4), 130 + 115 * Math.sin(i * Math.PI / 4))).join(''),
        [[300, 136, 'radius R'], [560, 110, 'C = Q / V'], [560, 140, 'V measured from infinity']], 260),
    text: T`An isolated conducting sphere has capacitance $C = 4\pi\varepsilon_0R$ relative to infinity ($\varepsilon_0 = 8.854\times10^{-12}\,\text{F/m}$). Find the capacitance of a sphere of radius $1\,\text{m}$, and of the Earth ($R = 6371\,\text{km}$).`,
    parts: [nx(T`$R = 1\,\text{m}$`, 4 * Math.PI * 8.8541878128e-12 * 1e12, 'pF'), nx('Earth', 4 * Math.PI * 8.8541878128e-12 * 6.371e6 * 1e6, 'µF')],
    hints: [T`The potential of a charged sphere is $V = \dfrac{Q}{4\pi\varepsilon_0R}$.`, T`$4\pi\varepsilon_0 \approx 111.3\,\text{pF/m}$.`],
    steps: [T`$R = 1\,\text{m}$: $C \approx 111.3\,\text{pF}$.`, T`Earth: $111.3\,\text{pF/m}\times6.371\times10^6\,\text{m} \approx 709\,\mu\text{F}$: the whole planet is a modest capacitor.`],
    idea: 'Capacitance grows only with size, not volume: even a planet is under a millifarad, while a supercapacitor reaches farads with nanometre gaps.',
    prereq: 'Gauss’s law; capacitance.',
    verify: () => { const e0 = 8.8541878128e-12, C = R => { const Q = 1, W = NUM.simpson(u => .5 * e0 * (Q * u * u / (4 * Math.PI * e0)) ** 2 * 4 * Math.PI / (u * u) / (u * u), 1e-12, 1 / R, 4000); return Q * Q / (2 * W); }; return [C(1) * 1e12, C(6.371e6) * 1e6]; } // field energy integrated with u = 1/r
}, {
    title: 'The force that once defined the ampere',
    diagram: sketch('Two long parallel wires carrying currents in the same direction, attracting each other.',
        ring(250, 130, 12) + dot(250, 130) + ring(450, 130, 12) + dot(450, 130) + arrow(265, 130, 320, 130) + arrow(435, 130, 380, 130) + guide('M250 190H450'),
        [[250, 100, 'I₁'], [450, 100, 'I₂'], [350, 214, 'd'], [600, 136, 'attract']], 240),
    text: T`Two long parallel wires $d$ apart carry currents $I_1$ and $I_2$ in the same direction. Find the force per metre between them for $1\,\text{A}$ each at $1\,\text{m}$ ($\mu_0 = 4\pi\times10^{-7}\,\text{H/m}$), and for $100\,\text{A}$ each at $1\,\text{cm}$.`,
    parts: [ex(T`$1\,\text{A}$ at $1\,\text{m}$`, 2e-7, T`2\times10^{-7}`, 'N/m'), ex(T`$100\,\text{A}$ at $1\,\text{cm}$`, .2, T`\dfrac{1}{5}`, 'N/m')],
    hints: [T`Each wire sits in the other's field $B = \dfrac{\mu_0I}{2\pi d}$.`, T`$F/\ell = I_2B = \dfrac{\mu_0I_1I_2}{2\pi d}$.`],
    steps: [T`$\dfrac{4\pi\times10^{-7}}{2\pi\times1} = 2\times10^{-7}\,\text{N/m}$: the pre-2019 definition of the ampere.`, T`$100\,\text{A}$, $1\,\text{cm}$: $2\times10^{-7}\times\dfrac{10^4}{0.01} = 0.2\,\text{N/m}$.`],
    idea: 'Parallel currents attract with a force set by μ₀ alone, which is why μ₀ was once exactly 4π × 10⁻⁷ and why bus bars must be braced for fault currents.',
    prereq: 'Biot–Savart law; Lorentz force.',
    verify: () => { const B = (I, d) => 1e-7 * I * NUM.simpson(z => d / (z * z + d * d) ** 1.5, -1e4 * d, 1e4 * d, 400000); return [1 * B(1, 1), 100 * B(100, .01)]; } // Biot–Savart along a wire 2×10⁴ d long
}, {
    title: 'A long air-core solenoid',
    diagram: sketch('A long solenoid of 1000 turns, 0.5 metres long, with a uniform field inside.',
        Array.from({length: 20}, (_, i) => `<ellipse cx="${160 + i * 20}" cy="130" rx="8" ry="40" fill="none"/>`).join('') + arrow(160, 130, 560, 130),
        [[360, 200, '1000 turns, 0.5 m long'], [360, 228, 'cross-section 10 cm²'], [600, 136, 'B']], 245),
    text: T`A solenoid of $1000$ turns, $0.5\,\text{m}$ long, with a cross-section of $10\,\text{cm}^2$ and an air core, is long enough to treat its internal field as uniform. Find its inductance, and the energy it stores at $2\,\text{A}$.`,
    parts: [ex('Inductance', .8 * Math.PI, T`0.8\pi`, 'mH'), ex('Energy at 2 A', 1.6 * Math.PI, T`1.6\pi`, 'mJ')],
    hints: [T`$B = \mu_0nI$ with $n = N/\ell$; each turn links $BA$.`, T`$L = \dfrac{\mu_0N^2A}{\ell}$ and $W = \tfrac{1}{2}LI^2$.`],
    steps: [T`$L = \dfrac{4\pi\times10^{-7}\times10^6\times10^{-3}}{0.5} = 8\pi\times10^{-4}\,\text{H} = 0.8\pi\,\text{mH} \approx 2.51\,\text{mH}$.`, T`$W = \tfrac{1}{2}\times0.8\pi\times10^{-3}\times4 = 1.6\pi\,\text{mJ} \approx 5.0\,\text{mJ}$.`],
    idea: 'Inductance grows with the square of the turns: doubling the turns doubles both the field and the number of turns linking it.',
    prereq: 'Ampère’s law; inductance.',
    verify: () => { const n = 2000, R = Math.sqrt(1e-3 / Math.PI), B = 4 * Math.PI * 1e-7 * n * 1 * NUM.simpson(z => R * R / (2 * (R * R + z * z) ** 1.5), -100, 100, 400000), L = 1000 * B * 1e-3 / 1; return [L * 1e3, .5 * L * 4 * 1e3]; } // centre field summed from loops, then flux linkage per amp
}, {
    title: 'Light hitting glass head-on',
    diagram: sketch('A plane wave at normal incidence on glass, partly reflected and partly transmitted.',
        `<rect x="360" y="30" width="250" height="200" fill="#e9eee6" stroke="#315740"/>` + arrow(140, 110, 350, 110) + arrow(350, 150, 160, 150) + arrow(370, 130, 560, 130),
        [[240, 96, 'incident'], [250, 176, 'reflected'], [480, 116, 'transmitted'], [480, 214, 'glass, εr = 4'], [200, 214, 'air']], 250),
    text: T`A plane wave in air strikes a thick slab of glass ($\varepsilon_r = 4$, $\mu_r = 1$) at normal incidence. Find the glass's intrinsic impedance ($\eta_0 = 120\pi\,\Omega$), the reflection coefficient for the electric field, and the fraction of the power transmitted.`,
    parts: [ex('Intrinsic impedance', 60 * Math.PI, T`60\pi`, 'Ω'), ex('Reflection coefficient', -1 / 3, T`-\dfrac{1}{3}`), ex('Power transmitted', 8 / 9, T`\dfrac{8}{9}`)],
    hints: [T`$\eta = \eta_0/\sqrt{\varepsilon_r}$.`, T`$\Gamma = \dfrac{\eta_2 - \eta_1}{\eta_2 + \eta_1}$ and the transmitted power fraction is $1 - |\Gamma|^2$.`],
    steps: [T`$\eta = 120\pi/2 = 60\pi \approx 188\,\Omega$.`, T`$\Gamma = \dfrac{60\pi - 120\pi}{180\pi} = -\dfrac{1}{3}$: the reflected field is inverted.`, T`Transmitted power $1 - \tfrac{1}{9} = \tfrac{8}{9}$.`],
    idea: 'A boundary reflects according to the impedance mismatch, exactly like a transmission line; glass reflects about 11% at this permittivity.',
    prereq: 'Plane waves; boundary conditions.',
    verify: () => { const e1 = 120 * Math.PI, e2 = NUM.bisect(z => z * Math.sqrt(4) - 120 * Math.PI, 1, 500), [Er, Et] = NUM.solve([[1, -1], [-1 / e1, -1 / e2]], [-1, -1 / e1]); return [e2, Er, (Et * Et / e2) / (1 / e1)]; } // E and H continuous at the surface
}, {
    title: 'The fields in sunlight',
    diagram: sketch('An electromagnetic wave with electric and magnetic fields at right angles, carrying 1000 watts per square metre.',
        `<path d="${Array.from({length: 121}, (_, i) => `${i ? 'L' : 'M'}${120 + i * 4} ${(130 - 60 * Math.sin(i * Math.PI / 30)).toFixed(1)}`).join('')}" stroke="#aa492a" stroke-width="3"/>` + guide('M120 130H600'),
        [[150, 60, 'E'], [380, 230, 'S = 1000 W/m²'], [620, 136, 'travel']], 245),
    text: T`Bright sunlight delivers about $1000\,\text{W/m}^2$. Treating it as a single plane wave in free space ($\eta_0 = 120\pi\,\Omega$, $c = 3\times10^8\,\text{m/s}$), find the RMS electric field and the RMS magnetic flux density.`,
    parts: [ex(T`$E_{\text{rms}}$`, Math.sqrt(120000 * Math.PI), T`\sqrt{120000\pi}`, 'V/m'), ex(T`$B_{\text{rms}}$`, Math.sqrt(120000 * Math.PI) / 300, T`\sqrt{120000\pi}/300`, 'µT')],
    hints: [T`Intensity $S = E_{\text{rms}}^2/\eta_0$.`, T`$B = E/c$.`],
    steps: [T`$E_{\text{rms}} = \sqrt{1000\times120\pi} \approx 614\,\text{V/m}$.`, T`$B_{\text{rms}} = 614/(3\times10^8) \approx 2.05\,\mu\text{T}$, a few percent of the Earth's field.`],
    idea: 'Even intense light has modest fields: hundreds of volts per metre, microtesla, because power flux is E²/η₀ and η₀ is large.',
    prereq: 'Plane waves; the Poynting vector.',
    verify: () => { const E = NUM.bisect(e => e * e / (120 * Math.PI) - 1000, 0, 5000); return [E, E / 3e8 * 1e6]; }
}, {
    title: 'Field lines bending at a dielectric',
    diagram: sketch('An electric field line crossing from air into a dielectric of relative permittivity 3, bending away from the normal.',
        wire('M100 130H620') + guide('M360 20V240') + arrow(260, 30, 360, 130) + arrow(360, 130, 360 + 100 * Math.sin(71.565 * Math.PI / 180) * 1.1, 130 + 100 * Math.cos(71.565 * Math.PI / 180) * 1.1),
        [[200, 110, 'air'], [200, 170, 'εr = 3'], [330, 70, '45°'], [520, 200, 'θ₂ ?']], 255),
    text: T`A uniform electric field in air meets the flat surface of a dielectric with $\varepsilon_r = 3$ at $45^\circ$ to the normal. There is no free charge on the surface. Find the angle of the field to the normal inside the dielectric, in degrees, and the ratio of field strengths $|E_2|/|E_1|$.`,
    parts: [ex(T`$\theta_2$`, 180 / Math.PI * Math.atan(3), T`\dfrac{180}{\pi}\arctan 3`, '°'), ex(T`$|E_2|/|E_1|$`, Math.sqrt(5) / 3, T`\dfrac{\sqrt5}{3}`)],
    hints: [T`The tangential component of $\mathbf E$ is continuous; the normal component of $\mathbf D = \varepsilon\mathbf E$ is continuous.`, T`So $\tan\theta_2 = \varepsilon_r\tan\theta_1$.`],
    steps: [T`$\tan\theta_2 = 3\tan45^\circ = 3 \Rightarrow \theta_2 \approx 71.6^\circ$: bent away from the normal.`, T`$E_t = E_1/\sqrt2$, $E_{n2} = E_1/(3\sqrt2)$, so $|E_2| = E_1\sqrt{\tfrac{1}{2} + \tfrac1{18}} = \dfrac{\sqrt5}{3}E_1 \approx 0.745E_1$.`],
    idea: 'Field lines refract at a dielectric surface by the ratio of permittivities, the electrostatic analogue of Snell’s law but with tangents.',
    prereq: 'Boundary conditions for E and D.',
    verify: () => { const e1 = [Math.SQRT1_2, Math.SQRT1_2], e2 = NUM.solve([[1, 0], [0, 3]], [e1[0], e1[1]]); return [Math.atan2(e2[0], e2[1]) * 180 / Math.PI, Math.hypot(...e2)]; } // E_t equal, 3E_n2 = E_n1
}, {
    title: 'Radiation resistance of a short dipole',
    diagram: sketch('A short dipole with its doughnut-shaped radiation pattern, strongest broadside.',
        wire('M360 100V160') + `<circle cx="300" cy="130" r="58" fill="none" stroke="#aa492a" stroke-width="3"/><circle cx="420" cy="130" r="58" fill="none" stroke="#aa492a" stroke-width="3"/>`,
        [[360, 56, 'ℓ = λ/10'], [600, 110, 'loss resistance 2 Ω'], [600, 140, 'pattern ∝ sin²θ']], 245),
    text: T`A short dipole of length $\ell = \lambda/10$ carrying a uniform current has radiation resistance $R_r = 80\pi^2(\ell/\lambda)^2$. Find $R_r$, and the antenna's efficiency if its conductors add a loss resistance of $2\,\Omega$.`,
    parts: [ex(T`$R_r$`, .8 * Math.PI ** 2, T`0.8\pi^2`, 'Ω'), ex('Efficiency', .8 * Math.PI ** 2 / (.8 * Math.PI ** 2 + 2), T`0.8\pi^2/(0.8\pi^2+2)`)],
    hints: [T`$80\pi^2\times\tfrac{1}{100}$.`, T`Efficiency $= \dfrac{R_r}{R_r + R_{\text{loss}}}$.`],
    steps: [T`$R_r = 0.8\pi^2 \approx 7.90\,\Omega$.`, T`$\eta = \dfrac{7.90}{9.90} \approx 0.80$: a fifth of the power warms the wire.`],
    idea: 'Radiation resistance falls with the square of electrical length, so short antennas are inefficient unless their losses are tiny.',
    prereq: 'Antennas; power.',
    verify: () => { const eta = 120 * Math.PI, kl = 2 * Math.PI / 10, omega = NUM.simpson(th => Math.sin(th) ** 2 * 2 * Math.PI * Math.sin(th), 0, Math.PI, 2000), Rr = eta * kl * kl * omega / (16 * Math.PI ** 2); return [Rr, Rr / (Rr + 2)]; } // integrate the far-field power over the sphere
}, {
    title: 'Radio under the sea',
    diagram: curve('depth (m)', 'field amplitude (relative)', [0, 60], [0, 1], z => Math.exp(-z * Math.PI / 25)),
    text: T`Sea water has conductivity $\sigma = 4\,\text{S/m}$. At $1\,\text{kHz}$ it behaves as a good conductor with skin depth $\delta = \dfrac{1}{\sqrt{\pi f\mu_0\sigma}}$. Find $\delta$, and the depth at which the field amplitude has fallen by $60\,\text{dB}$.`,
    parts: [ex('Skin depth', 25 / Math.PI, T`\dfrac{25}{\pi}`, 'm'), ex('Depth for 60 dB', 75 * Math.LN10 / Math.PI, T`\dfrac{75\ln10}{\pi}`, 'm')],
    hints: [T`$\pi f\mu_0\sigma = \pi\times10^3\times4\pi\times10^{-7}\times4 = 16\pi^2\times10^{-4}$.`, T`$60\,\text{dB}$ is a factor $1000$ in amplitude: $e^{-z/\delta} = 10^{-3}$.`],
    steps: [T`$\delta = \dfrac{1}{4\pi\times10^{-2}} = \dfrac{25}{\pi} \approx 7.96\,\text{m}$.`, T`$z = \delta\ln1000 = \dfrac{75\ln10}{\pi} \approx 55\,\text{m}$.`],
    idea: 'Conductors absorb fields within a few skin depths, and δ grows only as 1/√f: submarines need very low frequencies to receive at depth.',
    prereq: 'Skin effect; decibels.',
    verify: () => { const w = 2 * Math.PI * 1e3, mu = 4 * Math.PI * 1e-7, g = croot(cm(cx(0, w * mu), cx(4, w * 81 * 8.854e-12))); return [1 / g.re, Math.log(1000) / g.re]; } // propagation constant √(jωμ(σ + jωε))
}, {
    title: 'How hard can a field pull?',
    diagram: sketch('Parallel capacitor plates pulled together by an electric field, beside a magnetic gap pulled together by its flux.',
        wire('M120 70H300M120 190H300') + arrow(210, 100, 210, 78) + arrow(210, 160, 210, 182) + wire('M420 60h60v60h-60zM420 140h60v60h-60z') + arrow(450, 126, 450, 120) + arrow(450, 134, 450, 140),
        [[210, 136, 'E = 3 MV/m'], [450, 236, 'B = 1 T'], [210, 236, 'capacitor']], 250),
    text: T`The force per unit area on a conductor in an electric field is $\varepsilon_0E^2/2$, and across a magnetic gap it is $B^2/(2\mu_0)$. Find the electric pressure at the breakdown field of air, $3\,\text{MV/m}$ ($\varepsilon_0 = 8.854\times10^{-12}\,\text{F/m}$), and the magnetic pressure at $1\,\text{T}$ ($\mu_0 = 4\pi\times10^{-7}\,\text{H/m}$).`,
    parts: [nx('Electric pressure', 8.8541878128e-12 * 9e12 / 2, 'Pa'), ex('Magnetic pressure', 1e7 / (8 * Math.PI), T`10^{7}/(8\pi)`, 'Pa')],
    hints: [T`Both are energy densities: pressure equals stored energy per unit volume.`, T`$\tfrac{1}{2}\times8.854\times10^{-12}\times(3\times10^6)^2$ and $\dfrac{1}{2\times4\pi\times10^{-7}}$.`],
    steps: [T`Electric: $\approx 39.8\,\text{Pa}$, a gentle breath.`, T`Magnetic: $\dfrac{10^7}{8\pi} \approx 3.98\times10^5\,\text{Pa}$, about four atmospheres: ten thousand times more.`],
    idea: 'Practical magnetic fields store vastly more energy per volume than electric fields can before air breaks down, which is why motors are magnetic.',
    prereq: 'Field energy density; virtual work.',
    verify: () => { const e0 = 8.8541878128e-12, mu = 4 * Math.PI * 1e-7, h = 1e-9, We = x => (e0 * 3e6) ** 2 * x / (2 * e0), Wm = x => 1 * x / (2 * mu); return [(We(1e-3 + h) - We(1e-3 - h)) / (2 * h), (Wm(1e-3 + h) - Wm(1e-3 - h)) / (2 * h)]; } // virtual work at fixed charge and fixed flux, per unit area
}, {
    title: 'A loop spinning in a field',
    diagram: sketch('A rectangular coil rotating between the north and south poles of a magnet.',
        wire('M100 60h80v140h-80zM540 60h80v140h-80z') + wire('M280 80h160v100h-160z') + guide('M360 30V230') + `<path d="M330 30A40 14 0 0 1 390 30"/>` + arrow(386, 26, 392, 32),
        [[140, 136, 'N'], [580, 136, 'S'], [290, 70, '100 turns'], [360, 250, 'B = 0.5 T, area 0.01 m², 3000 rpm']], 260),
    text: T`A coil of $100$ turns and area $0.01\,\text{m}^2$ spins at $3000\,\text{rpm}$ in a uniform field of $0.5\,\text{T}$, about an axis perpendicular to the field. Find the peak and RMS values of the induced EMF.`,
    parts: [ex('Peak EMF', 50 * Math.PI, T`50\pi`, 'V'), ex('RMS EMF', 25 * Math.SQRT2 * Math.PI, T`25\pi\sqrt2`, 'V')],
    hints: [T`Flux linkage $N BA\cos\omega t$; the EMF is its rate of change.`, T`$\omega = 3000\times2\pi/60 = 100\pi\,\text{rad/s}$.`],
    steps: [T`$E_{\text{peak}} = NBA\omega = 100\times0.5\times0.01\times100\pi = 50\pi \approx 157\,\text{V}$.`, T`$E_{\text{rms}} = 50\pi/\sqrt2 = 25\pi\sqrt2 \approx 111\,\text{V}$.`],
    idea: 'Every alternator is this loop: EMF proportional to turns, field, area and speed, and sinusoidal because the linked flux varies as cos ωt.',
    prereq: 'Faraday’s law.',
    verify: () => { const w = 100 * Math.PI, lam = t => 100 * .5 * .01 * Math.cos(w * t), h = 1e-7, T0 = 2 * Math.PI / w; let pk = 0, ms = 0; const n = 4000; for (let i = 0; i < n; i++) { const t = i * T0 / n, e = -(lam(t + h) - lam(t - h)) / (2 * h); pk = Math.max(pk, Math.abs(e)); ms += e * e / n; } return [pk, Math.sqrt(ms)]; }
}]);
