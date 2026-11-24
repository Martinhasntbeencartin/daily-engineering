/* Electronics: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method for tests/exercises.test.js. */
const ELECTRONICS_READING = {title: 'Microelectronic Devices and Circuits (MIT OpenCourseWare 6.012)', url: 'https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2005/'};
addTypes('electronics', 'university', electronicsBJTBias, electronicsSallenKey, electronicsZener);
addTypes('electronics', 'challenge', electronicsExactDiode, electronicsMOSFETStage, electronicsBuck);
addTypes('electronics', 'expert', electronicsFeedback);
addTypes('electronics', 'mastery', electronicsDiffPair);

/* Device glyphs: base or gate on the left at (x, y); collector/drain up and emitter/source down at x + 22/24. */
const npnGlyph = (x, y) => wire(`M${x} ${y - 22}V${y + 22}M${x} ${y - 10}L${x + 22} ${y - 30}M${x} ${y + 10}L${x + 22} ${y + 30}`) + `<path transform="translate(${x + 22} ${y + 30}) rotate(42)" d="M-9 -5L0 0l-9 5"/>`;
const nmosGlyph = (x, y) => wire(`M${x - 10} ${y - 20}V${y + 20}M${x} ${y - 24}V${y + 24}M${x} ${y - 16}H${x + 24}M${x} ${y + 16}H${x + 24}`) + `<path transform="translate(${x + 22} ${y + 16})" d="M-9 -5L0 0l-9 5"/>`;
const opampGlyph = (x, y) => wire(`M${x} ${y - 40}v80l100 -40z`) + dt(x + 12, y - 14, '+') + dt(x + 12, y + 26, '−');

/* Level 2: a voltage-divider-biased common-emitter amplifier. Units: kΩ, mA, V, mS. */
function electronicsBJTBias(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'bjt-bias', date, ELECTRONICS_READING), p = part, VT = .025, RL = 10;
    const bias = ([Vcc, R1, R2, RC, RE, b]) => { const VBB = Vcc * R2 / (R1 + R2), RBB = R1 * R2 / (R1 + R2), IB = (VBB - .7) / (RBB + (b + 1) * RE); return {VBB, RBB, IB, IC: b * IB, VCE: Vcc - b * IB * RC - (b + 1) * IB * RE}; };
    const [c] = grid(product([9, 12, 15], [22, 33, 47, 56], [4.7, 6.8, 10], [2.2, 3.3, 4.7], [.47, 1, 1.5], [100, 150, 200]).filter(c => { const s = bias(c); return s.IC > .2 && s.VCE > 1.5; }));
    const [Vcc, R1, R2, RC, RE, beta] = c, {VBB, RBB, IB, IC, VCE} = bias(c), gm = IC / VT, rpi = beta / gm, Rin = RBB * rpi / (RBB + rpi), RCL = RC * RL / (RC + RL), Av = -gm * RCL;
    const diagram = drawing(wire('M180 30H560') + note(565, 36, '+Vᴄᴄ') + element('R', 180, 30, 180, 140, 'R₁') + element('R', 180, 140, 180, 260, 'R₂') + ring(70, 140, 4) + note(38, 124, 'vᵢₙ') +
        element('C', 74, 140, 180, 140, 'Cᵢₙ') + wire('M180 140H318') + npnGlyph(318, 140) + wire('M340 110V100M340 170V180') + element('R', 340, 30, 340, 100, 'Rᴄ') + element('R', 340, 180, 340, 260, 'Rᴇ') +
        wire('M340 180H430') + element('C', 430, 180, 430, 260, 'Cᴇ') + element('C', 340, 100, 540, 100, 'Cₒᵤₜ') + element('R', 540, 100, 540, 260, 'Rʟ') + wire('M180 260H540') +
        dot(180, 140) + dot(340, 100) + dot(340, 180) + dot(180, 30) + dot(340, 30) + ground(360, 260), 'NPN common-emitter amplifier biased by the divider R1–R2, with collector resistor RC, bypassed emitter resistor RE and a coupled load RL', 290);
    return q({
        title: 'Bias and gain of a common-emitter amplifier',
        text: T`Find the operating point of the NPN amplifier shown, then its midband small-signal behaviour. Use $V_{BE} = 0.7\,\text{V}$ and $\beta = ${beta}$, keep the base current in the bias calculation (Thévenin-equivalent divider, no "stiff divider" shortcut), and take $V_T = 25\,\text{mV}$. In the midband the capacitors are shorts and $r_o \to \infty$. Find $I_C$, $V_{CE}$, $g_m$, the input resistance seen by $v_{\text{in}}$, and the voltage gain $v_{\text{out}}/v_{\text{in}}$ with $R_L = ${RL}\,\text{k}\Omega$.`,
        givens: [T`$V_{CC} = ${Vcc}\,\text{V}$, $\beta = ${beta}$`, T`$R_1 = ${R1}\,\text{k}\Omega$, $R_2 = ${R2}\,\text{k}\Omega$`, T`$R_C = ${RC}\,\text{k}\Omega$, $R_E = ${RE}\,\text{k}\Omega$, $R_L = ${RL}\,\text{k}\Omega$`],
        parts: [p(T`$I_C$`, IC, 'mA'), p(T`$V_{CE}$`, VCE, 'V'), p(T`$g_m$`, gm, 'mS'), p('Input resistance', Rin, 'kΩ'), p('Voltage gain', Av, 'V/V')],
        hints: [T`Replace the divider by $V_{BB} = V_{CC}\dfrac{R_2}{R_1 + R_2}$ behind $R_{BB} = R_1 \parallel R_2$.`, T`Base loop: $V_{BB} = I_BR_{BB} + 0.7 + (\beta + 1)I_BR_E$.`, T`Midband: $R_E$ is bypassed, so $R_{\text{in}} = R_{BB} \parallel r_\pi$ with $r_\pi = \beta/g_m$, and $A_v = -g_m(R_C \parallel R_L)$.`],
        steps: [T`$V_{BB} = ${tf(VBB)}\,\text{V}$, $R_{BB} = ${tf(RBB)}\,\text{k}\Omega$.`, T`$I_B = \dfrac{${tf(VBB)} - 0.7}{${tf(RBB)} + ${beta + 1}\times${RE}} = ${tf(IB * 1e3)}\,\mu\text{A}$, so $I_C = ${tf(IC)}\,\text{mA}$.`, T`$V_{CE} = V_{CC} - I_CR_C - I_ER_E = ${tf(VCE)}\,\text{V}$: forward active.`, T`$g_m = I_C/V_T = ${tf(gm)}\,\text{mS}$, $r_\pi = ${tf(rpi)}\,\text{k}\Omega$, $R_{\text{in}} = ${tf(Rin)}\,\text{k}\Omega$.`, T`$A_v = -${tf(gm)}\times${tf(RCL)} = ${tf(Av)}$.`],
        idea: 'Bias sets the transconductance, and the transconductance sets the gain: the small-signal model is only as good as the operating point under it.',
        diagram, prerequisites: 'BJT models; Thévenin equivalents; small-signal analysis.',
        verify: () => { // the bias network as a linear system in VB, VE and IB
            const [VB, VE, iB] = NUM.solve([[-(1 / R1 + 1 / R2), 0, -1], [1, -1, 0], [0, 1 / RE, -(beta + 1)]], [-Vcc / R1, .7, 0]), ic = beta * iB, g = ic / VT;
            return [ic, Vcc - ic * RC - VE, g, 1 / (1 / R1 + 1 / R2 + g / beta), -g / (1 / RC + 1 / RL)];
        }
    });
}

/* Level 2: a unity-gain Sallen–Key low-pass filter. */
function electronicsSallenKey(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'sallen-key', date, ELECTRONICS_READING), p = part;
    const Qof = ([r1, r2, c1, c2]) => Math.sqrt(r1 * r2 * c1 * c2) / (c2 * (r1 + r2));
    const [[R1, R2, C1, C2]] = grid(product([3.3, 4.7, 6.8, 10, 15, 22], [4.7, 10, 22, 33], [10, 22, 47, 100], [1, 2.2, 4.7, 10]).filter(c => Qof(c) > .55 && Qof(c) < 5));
    const w0 = 1 / Math.sqrt(R1 * 1e3 * R2 * 1e3 * C1 * 1e-9 * C2 * 1e-9), f0 = w0 / (2 * Math.PI), Q = Qof([R1, R2, C1, C2]);
    const peak = 20 * Math.log10(Q), at2 = -10 * Math.log10(9 + 4 / (Q * Q)), a = 2 - 1 / (Q * Q), f3 = f0 * Math.sqrt((a + Math.sqrt(a * a + 4)) / 2);
    const diagram = drawing(ring(60, 160, 4) + note(36, 144, 'vᵢₙ') + element('R', 64, 160, 200, 160, 'R₁') + element('R', 200, 160, 340, 160, 'R₂') + wire('M340 160H400M200 160V60M540 60V180M400 200H380V245H540V180M500 180H600') +
        element('C', 200, 60, 540, 60, 'C₁') + element('C', 340, 160, 340, 260, 'C₂') + ground(340, 260) + opampGlyph(400, 180) + ring(605, 180, 4) + note(615, 166, 'vₒᵤₜ') + dot(200, 160) + dot(340, 160) + dot(540, 180),
        'Unity-gain Sallen–Key low-pass filter: R1 and R2 in series to the non-inverting input, C2 from that input to ground, C1 from the junction of the resistors to the output, and the op-amp wired as a follower', 290);
    return q({
        title: 'Design check of a Sallen–Key low-pass filter',
        text: T`The op-amp in the unity-gain Sallen–Key filter shown is ideal. Derive $H(s) = V_{\text{out}}/V_{\text{in}}$ and put it in the standard form $\dfrac{\omega_0^2}{s^2 + (\omega_0/Q)s + \omega_0^2}$. Find $f_0$ and $Q$, the gain at $f_0$ and at $2f_0$ in dB, and the exact $-3\,\text{dB}$ frequency.`,
        givens: [T`$R_1 = ${R1}\,\text{k}\Omega$, $R_2 = ${R2}\,\text{k}\Omega$`, T`$C_1 = ${C1}\,\text{nF}$ (feedback), $C_2 = ${C2}\,\text{nF}$ (to ground)`, 'Ideal op-amp, unity-gain follower'],
        parts: [p(T`$f_0$`, f0 / 1e3, 'kHz'), p(T`$Q$`, Q, ''), p(T`Gain at $f_0$`, peak, 'dB', .01, .01), p(T`Gain at $2f_0$`, at2, 'dB', .01, .01), p(T`$-3\,\text{dB}$ frequency`, f3 / 1e3, 'kHz')],
        hints: [T`The follower makes $V_+ = V_{\text{out}}$. Write KCL at the junction of $R_1$ and $R_2$ and at the non-inverting input.`, T`$H(s) = \dfrac{1}{R_1R_2C_1C_2s^2 + C_2(R_1 + R_2)s + 1}$, so $\omega_0 = 1/\sqrt{R_1R_2C_1C_2}$ and $Q = \dfrac{\sqrt{R_1R_2C_1C_2}}{C_2(R_1 + R_2)}$.`, T`With $x = f/f_0$: $|H|^2 = \dfrac{1}{(1 - x^2)^2 + x^2/Q^2}$. Setting this to $\tfrac12$ gives a quadratic in $x^2$.`],
        steps: [T`$f_0 = ${tf(f0 / 1e3)}\,\text{kHz}$ and $Q = ${tf(Q)}$.`, T`At $f_0$: $|H| = Q$, i.e. $${tf(peak)}\,\text{dB}$.`, T`At $2f_0$: $|H|^2 = \dfrac{1}{9 + 4/Q^2}$, i.e. $${tf(at2)}\,\text{dB}$.`, T`$x^2 = \dfrac{(2 - 1/Q^2) + \sqrt{(2 - 1/Q^2)^2 + 4}}{2} = ${tf(f3 * f3 / (f0 * f0))}$, so $f_{-3\text{dB}} = ${tf(f3 / 1e3)}\,\text{kHz}$.`],
        idea: 'The ratio of the two capacitors sets Q in a unity-gain Sallen–Key filter; the −3 dB frequency equals f₀ only when Q = 1/√2.',
        diagram, prerequisites: 'Op-amp circuits; second-order transfer functions; complex nodal analysis.',
        verify: () => { // nodal analysis of the actual circuit at s = jω, with the half-power point found by bisection
            const H = f => { const s = cx(0, 2 * Math.PI * f), g1 = cx(1 / (R1 * 1e3)), g2 = cx(1 / (R2 * 1e3)), y1 = cm(s, cx(C1 * 1e-9)), y2 = cm(s, cx(C2 * 1e-9));
                const [A, B] = complexSolve([[ca(ca(g1, g2), y1), neg(ca(g2, y1))], [neg(g2), ca(g2, y2)]], [g1, cx(0)]); return cabs(B); };
            const fh = NUM.bisect(f => H(f) - Math.SQRT1_2, f0 / 100, f0 * 100, 200);
            return [f0 / 1e3, Math.sqrt(R1 * R2 * C1 * C2) / (C2 * (R1 + R2)), 20 * Math.log10(H(f0)), 20 * Math.log10(H(2 * f0)), fh / 1e3];
        }
    });
}

/* Level 2: designing a Zener shunt regulator. Units: V, mA, kΩ. */
function electronicsZener(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'zener', date, ELECTRONICS_READING), p = part;
    const [Vz, dmin, span, IL, Izk, rz] = grid([3.3, 5.1, 6.2, 9.1], [2, 3, 4], [2, 4, 6], [10, 20, 50, 100], [1, 2, 5], [2, 5, 10]);
    const Vmin = +(Vz + dmin).toFixed(1), Vmax = +(Vmin + span).toFixed(1), R = (Vmin - Vz) / (Izk + IL), Pz = Vz * (Vmax - Vz) / R, PR = (Vmax - Vz) ** 2 / R, reg = rz / (R * 1e3 + rz), eta = Vz * IL / (Vmin * (IL + Izk));
    const diagram = drawing(element('DC', 90, 70, 90, 210, 'Vᵢₙ') + element('R', 90, 70, 300, 70, 'R') + wire('M300 70H500M90 210H500') + element('diode', 330, 210, 330, 70, '') + wire('M319 129h-6l-4 -6M341 129h6l4 6') +
        note(356, 146, 'Dᴢ') + element('R', 500, 70, 500, 210, 'Rʟ') + wire('M480 168l40 -40') + dot(330, 70) + dot(330, 210) + ground(410, 210),
        'An unregulated source with series resistor R feeds a Zener diode, cathode up, in parallel with a variable load RL', 260);
    return q({
        title: 'Size a Zener shunt regulator',
        text: T`The unregulated input of the regulator shown varies from $${Vmin}$ to $${Vmax}\,\text{V}$ and the load draws anything from $0$ to $${IL}\,\text{mA}$. The Zener needs at least $I_{ZK} = ${Izk}\,\text{mA}$ to stay in regulation. Treat it as an ideal $${Vz}\,\text{V}$ source while sizing. Find the largest series resistance $R$ that always regulates, and with that $R$ the worst-case Zener and resistor dissipations. Then use the Zener's dynamic resistance $r_z = ${rz}\,\Omega$ to find the no-load line regulation $\Delta V_{\text{out}}/\Delta V_{\text{in}}$, and the efficiency at full load and minimum input.`,
        givens: [T`$V_Z = ${Vz}\,\text{V}$, $I_{ZK} = ${Izk}\,\text{mA}$, $r_z = ${rz}\,\Omega$`, T`$V_{\text{in}} = ${Vmin}$ to $${Vmax}\,\text{V}$`, T`$I_L = 0$ to $${IL}\,\text{mA}$`],
        parts: [p(T`Largest $R$`, R * 1e3, 'Ω'), p('Worst-case Zener dissipation', Pz, 'mW'), p('Worst-case resistor dissipation', PR, 'mW'), p('Line regulation', reg * 1e3, 'mV/V'), p('Efficiency at full load, minimum input', 100 * eta, '%')],
        hints: [T`The hardest case for regulation is minimum input with maximum load: $R$ must still pass $I_L + I_{ZK}$.`, T`The Zener dissipates most at maximum input with no load, when it takes all of $(V_{\max} - V_Z)/R$.`, T`Small-signal, with no load the regulator is a divider of $R$ and $r_z$.`],
        steps: [T`$R = \dfrac{${Vmin} - ${Vz}}{${IL} + ${Izk}} = ${tf(R * 1e3)}\,\Omega$.`, T`$I_{Z,\max} = \dfrac{${Vmax} - ${Vz}}{R} = ${tf((Vmax - Vz) / R)}\,\text{mA}$, so $P_Z = ${tf(Pz)}\,\text{mW}$ and $P_R = \dfrac{(V_{\max} - V_Z)^2}{R} = ${tf(PR)}\,\text{mW}$.`, T`$\dfrac{\Delta V_{\text{out}}}{\Delta V_{\text{in}}} = \dfrac{r_z}{R + r_z} = ${tf(reg * 1e3)}\,\text{mV/V}$.`, T`$\eta = \dfrac{V_ZI_L}{V_{\min}(I_L + I_{ZK})} = ${tf(100 * eta)}\%$.`],
        idea: 'A shunt regulator burns the difference: R is set by the worst case for regulation, the dissipation by the opposite worst case.',
        diagram, prerequisites: 'Diode models; Ohm’s law; power.',
        verify: () => { // the circuit with a Zener of dynamic resistance rz, solved at the operating points
            const vout = (vin, iload, Rr, r) => (vin / Rr + Vz / r - iload) / (1 / Rr + 1 / r); // kΩ, mA
            const Rmax = NUM.bisect(Rr => (vout(Vmin, IL, Rr, 1e-9) - Vz) / 1e-9 - Izk, 1e-6, 100, 200); // ideal Zener: Iz = Izk at the limit
            const v = vout(Vmax, 0, R, 1e-9), iz = (Vmax - v) / R, d = vout(Vmax, 0, R, rz / 1e3) - vout(Vmax - 1, 0, R, rz / 1e3);
            return [Rmax * 1e3, v * iz, (Vmax - v) * iz, d * 1e3, 100 * Vz * IL / (Vmin * (Vmin - Vz) / R)];
        }
    });
}

/* Level 3: a diode in a resistor network with the full Shockley equation. */
function electronicsExactDiode(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'exact-diode', date, ELECTRONICS_READING), p = part, VT = .02585;
    const [[Vs, R1, R2, R3, Is, n]] = grid(product([3, 5, 9, 12], [1, 2.2, 4.7], [2.2, 4.7, 10], [100, 220, 470], [1e-14, 1e-12, 1e-9], [1, 1.5, 2]).filter(([v, a, b]) => v * b / (a + b) >= 1));
    const Vth = Vs * R2 / (R1 + R2), Rth = R1 * R2 / (R1 + R2) * 1e3, Rt = Rth + R3, nVT = n * VT;
    const I = NUM.bisect(i => Vth - i * Rt - nVT * Math.log(1 + i / Is), 0, Vth / Rt, 200), VD = nVT * Math.log(1 + I / Is), rd = nVT / (I + Is), I07 = (Vth - .7) / Rt, err = 100 * (I07 - I) / I;
    const diagram = drawing(element('DC', 80, 70, 80, 210, 'Vₛ') + element('R', 80, 70, 260, 70, 'R₁') + element('R', 260, 70, 260, 210, 'R₂') + element('diode', 260, 70, 420, 70, 'D') + wire('M420 70H500M80 210H500') +
        element('R', 500, 70, 500, 210, 'R₃') + dot(260, 70) + dot(260, 210) + ground(380, 210) + arrow(320, 98, 370, 98) + dt(345, 120, 'Iᴅ'),
        'A source with R1 and R2 forming a divider; a diode, anode at the divider node, in series with R3 to ground', 260);
    return q({
        title: 'A diode solved without the 0.7 V shortcut',
        text: T`The diode in the figure follows Shockley's law $I_D = I_S\left(e^{V_D/(nV_T)} - 1\right)$ with $V_T = 25.85\,\text{mV}$. Find the diode current and voltage exactly (numerically), and its small-signal resistance at that point. Then find the current the constant-$0.7\,\text{V}$ model predicts, and that model's error in percent.`,
        givens: [T`$V_s = ${Vs}\,\text{V}$`, T`$R_1 = ${R1}\,\text{k}\Omega$, $R_2 = ${R2}\,\text{k}\Omega$, $R_3 = ${R3}\,\Omega$`, T`$I_S = ${tf(Is)}\,\text{A}$, $n = ${n}$`],
        parts: [p(T`$I_D$`, I * 1e3, 'mA'), p(T`$V_D$`, VD, 'V'), p(T`$r_d$`, rd, 'Ω'), p('Current with the 0.7 V model', I07 * 1e3, 'mA'), p('Error of the 0.7 V model', err, '%', .01, .05)],
        hints: [T`Reduce everything except the diode branch to $V_{th} = V_s\dfrac{R_2}{R_1 + R_2}$ behind $R_{th} = R_1 \parallel R_2$; the diode then sees $R = R_{th} + R_3$.`, T`$V_{th} = IR + nV_T\ln(1 + I/I_S)$ has one root in $0 < I < V_{th}/R$; its left side grows with $I$, so bisection or Newton converges.`, T`$r_d = \dfrac{dV_D}{dI_D} = \dfrac{nV_T}{I_D + I_S}$.`],
        steps: [T`$V_{th} = ${tf(Vth)}\,\text{V}$, $R = ${tf(Rth)} + ${R3} = ${tf(Rt)}\,\Omega$.`, T`Solving $${tf(Vth)} = ${tf(Rt)}I + ${tf(nVT)}\ln(1 + I/I_S)$: $I_D = ${tf(I * 1e3)}\,\text{mA}$.`, T`$V_D = ${tf(VD)}\,\text{V}$ and $r_d = ${tf(rd)}\,\Omega$.`, T`The $0.7\,\text{V}$ model gives $${tf(I07 * 1e3)}\,\text{mA}$, an error of $${tf(err)}\%$.`],
        idea: 'The diode equation is transcendental but well behaved: one monotonic function and one root, which bisection or Newton finds in a few steps.',
        diagram, prerequisites: 'Shockley diode equation; Thévenin equivalents; root finding.',
        verify: () => { // KCL at the divider node of the full circuit, bisecting on the diode voltage
            const kcl = vd => { const id = Is * (Math.exp(vd / nVT) - 1), A = vd + id * R3; return (A - Vs) / (R1 * 1e3) + A / (R2 * 1e3) + id; };
            const vd = NUM.bisect(kcl, 0, 1.5, 200), id = Is * (Math.exp(vd / nVT) - 1), i07 = NUM.bisect(i => (.7 + i * R3 - Vs) / (R1 * 1e3) + (.7 + i * R3) / (R2 * 1e3) + i, 0, 1, 200);
            return [id * 1e3, vd, nVT / (id + Is), i07 * 1e3, 100 * (i07 - id) / id];
        }
    });
}

/* Level 3: a degenerated common-source MOSFET stage with channel-length modulation. Units: V, mA, kΩ, mS, mA/V². */
function electronicsMOSFETStage(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'mosfet-stage', date, ELECTRONICS_READING), p = part, RD = 2.2, RL = 10;
    const bias = ([VDD, VG, Vt, Kn, RS]) => { const Vov = (-1 + Math.sqrt(1 + 2 * Kn * RS * (VG - Vt))) / (Kn * RS), ID = Kn / 2 * Vov * Vov; return {Vov, ID, VDS: VDD - ID * (RD + RS)}; };
    const [[VDD, VG, Vt, Kn, RS, lam]] = grid(product([5, 10, 12], [2, 2.5, 3, 3.5], [.5, .8, 1], [1, 2, 4], [.5, 1, 2], [.01, .02, .05]).filter(c => { const b = bias(c); return b.VDS > b.Vov + .3; }));
    const {Vov, ID, VDS} = bias([VDD, VG, Vt, Kn, RS]), gm = Kn * Vov, ro = 1 / (lam * ID), RDL = RD * RL / (RD + RL), Av = -gm * ro * RDL / (RDL + ro + RS * (1 + gm * ro)), Rout = ro + RS * (1 + gm * ro);
    const diagram = drawing(wire('M240 30H560') + note(565, 36, '+Vᴅᴅ') + element('R', 344, 30, 344, 104, 'Rᴅ') + nmosGlyph(320, 120) + wire('M344 136V150M190 120H310') + element('R', 344, 150, 344, 250, 'Rₛ') +
        ground(344, 250) + element('DC', 190, 160, 190, 250, '') + note(134, 210, 'Vɢ') + wire('M190 160V120') + ring(110, 120, 4) + note(78, 104, 'vɢ') + element('C', 114, 120, 190, 120, '') + element('C', 344, 104, 520, 104, 'Cₒᵤₜ') +
        element('R', 520, 104, 520, 250, 'Rʟ') + ground(520, 250) + ground(190, 250) + dot(344, 104) + dot(190, 120), 'n-channel MOSFET with its gate held at VG and driven by a small signal through a capacitor, drain resistor RD, unbypassed source resistor RS, and a coupled load RL', 285);
    return q({
        title: 'A degenerated MOSFET stage with finite output resistance',
        text: T`The NMOS transistor shown obeys $I_D = \tfrac{K_n}{2}(V_{GS} - V_t)^2$ for biasing, with channel-length modulation $\lambda$ used only in the small-signal model ($r_o = 1/(\lambda I_D)$). The gate sits at $V_G$ and $R_S$ is not bypassed. Find $I_D$ and $V_{DS}$ (and confirm saturation), $g_m$, $r_o$, the small-signal gain $v_{\text{out}}/v_g$ including $r_o$, and the resistance looking into the drain.`,
        givens: [T`$V_{DD} = ${VDD}\,\text{V}$, $V_G = ${VG}\,\text{V}$`, T`$K_n = ${Kn}\,\text{mA/V}^2$, $V_t = ${Vt}\,\text{V}$, $\lambda = ${lam}\,\text{V}^{-1}$`, T`$R_S = ${RS}\,\text{k}\Omega$, $R_D = ${RD}\,\text{k}\Omega$, $R_L = ${RL}\,\text{k}\Omega$`],
        parts: [p(T`$I_D$`, ID, 'mA'), p(T`$V_{DS}$`, VDS, 'V'), p(T`$g_m$`, gm, 'mS'), p(T`$r_o$`, ro, 'kΩ'), p('Voltage gain', Av, 'V/V'), p('Resistance into the drain', Rout, 'kΩ')],
        hints: [T`With $V_{ov} = V_{GS} - V_t$: $V_G = V_t + V_{ov} + \tfrac{K_n}{2}V_{ov}^2R_S$, a quadratic in $V_{ov}$.`, T`$g_m = K_nV_{ov}$. Saturation needs $V_{DS} > V_{ov}$.`, T`With $r_o$: $A_v = -\dfrac{g_mr_oR_D'}{R_D' + r_o + R_S(1 + g_mr_o)}$ where $R_D' = R_D \parallel R_L$, and the drain resistance is $r_o + R_S(1 + g_mr_o)$.`],
        steps: [T`$V_{ov} = \dfrac{-1 + \sqrt{1 + 2K_nR_S(V_G - V_t)}}{K_nR_S} = ${tf(Vov)}\,\text{V}$, so $I_D = ${tf(ID)}\,\text{mA}$.`, T`$V_{DS} = V_{DD} - I_D(R_D + R_S) = ${tf(VDS)}\,\text{V} > V_{ov}$: saturated.`, T`$g_m = ${tf(gm)}\,\text{mS}$ and $r_o = ${tf(ro)}\,\text{k}\Omega$.`, T`$A_v = ${tf(Av)}$ (the $r_o \to \infty$ estimate $-g_mR_D'/(1 + g_mR_S)$ gives $${tf(-gm * RDL / (1 + gm * RS))}$).`, T`$R_{\text{drain}} = ${tf(Rout)}\,\text{k}\Omega$.`],
        idea: 'Source degeneration trades gain for linearity and multiplies the output resistance by roughly (1 + g_mR_S).',
        diagram, prerequisites: 'MOSFET square law; small-signal models; nodal analysis.',
        verify: () => { // bias by bisection on ID; small signal by nodal analysis of the hybrid-π model (nodes D and S)
            const id = NUM.bisect(i => Vt + Math.sqrt(2 * i / Kn) + i * RS - VG, 1e-9, 100, 200), g = Math.sqrt(2 * Kn * id), r = 1 / (lam * id);
            const [vd] = NUM.solve([[1 / RDL + 1 / r, -g - 1 / r], [1 / r, -(g + 1 / r + 1 / RS)]], [-g, -g]);
            const [rd] = NUM.solve([[1 / r, -g - 1 / r], [1 / r, -(g + 1 / r + 1 / RS)]], [1, 0]);
            return [id, VDD - id * (RD + RS), g, r, vd, rd];
        }
    });
}

/* Level 3: a buck converter in continuous conduction. */
function electronicsBuck(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'buck', date, ELECTRONICS_READING), p = part, ESR = .01;
    const ripple = ([Vin, Vo, fk, Lu]) => (Vin - Vo) * (Vo / Vin) / (Lu * 1e-6 * fk * 1e3);
    const [[Vin, Vo, fk, Lu, Cu, Io]] = grid(product([12, 24, 48], [1.8, 3.3, 5], [100, 200, 500], [4.7, 10, 22, 47], [22, 47, 100], [1, 2, 5]).filter(c => c[5] > .6 * ripple(c)));
    const D = Vo / Vin, dI = ripple([Vin, Vo, fk, Lu]), Ib = dI / 2, dVc = dI / (8 * fk * 1e3 * Cu * 1e-6), dVtot = dVc + dI * ESR, Ipk = Io + dI / 2;
    const diagram = drawing(element('DC', 70, 80, 70, 220, 'Vᵢₙ') + wire('M70 80H150M210 80H260M150 80L205 58') + ring(150, 80, 3) + ring(210, 80, 3) + dt(180, 40, 'switch') + element('diode', 260, 220, 260, 80, '') +
        note(285, 156, 'D') + element('L', 260, 80, 420, 80, 'L') + wire('M420 80H600M70 220H600') + element('C', 470, 80, 470, 220, 'C') + element('R', 600, 80, 600, 220, 'Rʟ') + dot(260, 80) + dot(420, 80) + ground(360, 220),
        'Buck converter: a switch from the input to the switching node, a freewheeling diode from ground to that node, then the inductor L to the output capacitor C and load', 265);
    return q({
        title: 'Inductor and capacitor ripple in a buck converter',
        text: T`The ideal buck converter shown steps $${Vin}\,\text{V}$ down to $${Vo}\,\text{V}$ at $${fk}\,\text{kHz}$ and delivers $${Io}\,\text{A}$. The switch and diode are ideal and the output ripple is small compared with $V_{\text{out}}$. Find the duty cycle, the peak-to-peak inductor ripple current, the smallest load current that keeps the converter in continuous conduction, and the output ripple voltage, first from the capacitance alone and then adding the capacitor's ESR of $10\,\text{m}\Omega$ (worst case, add them). Finally find the peak inductor current at full load.`,
        givens: [T`$V_{\text{in}} = ${Vin}\,\text{V}$, $V_{\text{out}} = ${Vo}\,\text{V}$, $I_{\text{out}} = ${Io}\,\text{A}$`, T`$f_s = ${fk}\,\text{kHz}$`, T`$L = ${Lu}\,\mu\text{H}$, $C = ${Cu}\,\mu\text{F}$, ESR $= 10\,\text{m}\Omega$`],
        parts: [p(T`Duty cycle $D$`, 100 * D, '%'), p(T`$\Delta I_L$`, dI, 'A'), p('Minimum load for continuous conduction', Ib, 'A'), p('Output ripple, capacitance only', dVc * 1e3, 'mV'), p('Output ripple with ESR', dVtot * 1e3, 'mV'), p('Peak inductor current', Ipk, 'A')],
        hints: [T`Volt-second balance on $L$: $(V_{\text{in}} - V_{\text{out}})DT = V_{\text{out}}(1 - D)T$, so $D = V_{\text{out}}/V_{\text{in}}$.`, T`During the on-time the inductor current rises by $\Delta I_L = \dfrac{(V_{\text{in}} - V_{\text{out}})D}{Lf_s}$. Conduction stays continuous while $I_{\text{out}} > \Delta I_L/2$.`, T`The ripple current flows in $C$: the charge in one triangle is $\dfrac12\cdot\dfrac T2\cdot\dfrac{\Delta I_L}{2}$, so $\Delta V = \dfrac{\Delta I_L}{8f_sC}$. The ESR adds $\Delta I_L\cdot\text{ESR}$.`],
        steps: [T`$D = ${tf(100 * D)}\%$.`, T`$\Delta I_L = \dfrac{(${Vin} - ${Vo})\times${tf(D)}}{${Lu}\,\mu\text{H}\times${fk}\,\text{kHz}} = ${tf(dI)}\,\text{A}$; continuous conduction down to $${tf(Ib)}\,\text{A}$.`, T`$\Delta V_C = \dfrac{${tf(dI)}}{8\times${fk}\,\text{kHz}\times${Cu}\,\mu\text{F}} = ${tf(dVc * 1e3)}\,\text{mV}$; with ESR $${tf(dVtot * 1e3)}\,\text{mV}$.`, T`$I_{\text{pk}} = I_{\text{out}} + \Delta I_L/2 = ${tf(Ipk)}\,\text{A}$.`],
        idea: 'The inductor sets the ripple current and the capacitor turns that current into ripple voltage; at high frequency the ESR often dominates the capacitance.',
        diagram, prerequisites: 'Volt-second balance; capacitor charge; piecewise-linear waveforms.',
        verify: () => { // one switching period in steady state, sampled: inductor current, then the capacitor's charge excursion
            const T = 1 / (fk * 1e3), L = Lu * 1e-6, n = 20000, ton = D * T, up = (Vin - Vo) / L, down = -Vo / L, iL = t => t < ton ? up * t : up * ton + down * (t - ton);
            const avg = Array.from({length: n}, (_, k) => iL((k + .5) * T / n)).reduce((s, v) => s + v, 0) / n, off = Io - avg; // shift so the average equals Io
            let qc = 0, qmin = 0, qmax = 0, imin = Infinity, imax = -Infinity;
            for (let k = 0; k < n; k++) { const i = iL((k + .5) * T / n) + off; imin = Math.min(imin, i); imax = Math.max(imax, i); qc += (i - Io) * T / n; qmin = Math.min(qmin, qc); qmax = Math.max(qmax, qc); }
            const di = imax - imin, dv = (qmax - qmin) / (Cu * 1e-6);
            return [100 * Vo / Vin, di, di / 2, dv * 1e3, (dv + di * ESR) * 1e3, imax];
        }
    });
}

/* Level 4 (expert): a non-inverting amplifier with a real op-amp, by two-port feedback analysis and exactly. */
function electronicsFeedback(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'feedback', date, ELECTRONICS_READING), p = part, Rs = 1e3;
    const [Aexp, Rik, Ro, R1k, R2k, RLk] = grid([3, 4, 5], [10, 100, 1000], [50, 100, 500], [1, 2.2, 4.7], [10, 22, 47, 100], [1, 2]);
    const A = 10 ** Aexp, Ri = Rik * 1e3, R1 = R1k * 1e3, R2 = R2k * 1e3, RL = RLk * 1e3, b = R1 / (R1 + R2), Rp = R1 * R2 / (R1 + R2), RLp = RL * (R1 + R2) / (RL + R1 + R2);
    const a = A * Ri / (Rs + Ri + Rp) * RLp / (Ro + RLp), T2 = a * b, Af2 = a / (1 + T2);
    const solve = (vs, inj, withRL) => NUM.solve([[1 / Rs + 1 / Ri, -1 / Ri, 0], [-1 / Ri, 1 / Ri + 1 / R1 + 1 / R2, -1 / R2], [-A / Ro, A / Ro - 1 / R2, 1 / Ro + (withRL ? 1 / RL : 0) + 1 / R2]], [vs / Rs, 0, inj]);
    const [vp, , vo] = solve(1, 0, true), Af = vo, Rin = vp / ((1 - vp) / Rs), Rout = solve(0, 1, false)[2];
    const diagram = drawing(ring(60, 140, 4) + note(30, 124, 'vₛ') + element('R', 64, 140, 220, 140, 'Rₛ') + wire('M220 140H300') + opampGlyph(300, 160) + wire('M300 180H260V250M400 160H600M520 250V160') +
        element('R', 260, 250, 520, 250, 'R₂') + element('R', 260, 250, 260, 320, 'R₁') + ground(260, 320) +
        element('R', 600, 160, 600, 300, 'Rʟ') + ground(600, 300) + dt(350, 110, 'A, Rᵢ, Rₒ') + dot(260, 250) + dot(520, 160), 'Non-inverting amplifier: the source with Rs drives the plus input; R2 from the output and R1 to ground set the feedback to the minus input; RL loads the output', 345);
    return q({
        title: 'Feedback with loading: the two-port method against the exact answer',
        text: T`The op-amp in the non-inverting amplifier shown has open-loop gain $A = 10^{${Aexp}}$, differential input resistance $R_i$ and output resistance $R_o$. The source has $R_s = 1\,\text{k}\Omega$. Using two-port (series–shunt) feedback analysis, find the feedback factor $\beta$, the loop gain $a\beta$ with the loaded open-loop gain $a$, and the closed-loop gain $a/(1 + a\beta)$. Then solve the circuit exactly by nodal analysis: find the closed-loop gain $v_o/v_s$, the input resistance at the $+$ input, and the output resistance seen by $R_L$ (with $R_L$ removed).`,
        givens: [T`$A = 10^{${Aexp}}$, $R_i = ${Rik}\,\text{k}\Omega$, $R_o = ${Ro}\,\Omega$`, T`$R_1 = ${R1k}\,\text{k}\Omega$, $R_2 = ${R2k}\,\text{k}\Omega$`, T`$R_s = 1\,\text{k}\Omega$, $R_L = ${RLk}\,\text{k}\Omega$`],
        parts: [p(T`$\beta$`, b, ''), p(T`Loop gain $a\beta$`, T2, ''), p('Closed-loop gain, two-port method', Af2, 'V/V'), p('Closed-loop gain, exact', Af, 'V/V'), p('Input resistance at the + input', Rin / 1e6, 'MΩ'), p('Output resistance', Rout, 'Ω', .01, 1e-4)],
        hints: [T`$\beta = \dfrac{R_1}{R_1 + R_2}$. Loading: the feedback network looks like $R_1 \parallel R_2$ at the input and $R_1 + R_2$ at the output.`, T`$a = A\cdot\dfrac{R_i}{R_s + R_i + R_1 \parallel R_2}\cdot\dfrac{R_L'}{R_o + R_L'}$ with $R_L' = R_L \parallel (R_1 + R_2)$.`, T`Exactly: KCL at the $+$ input, the $-$ input and the output, with the op-amp as $R_i$ between its inputs and a source $A(v_+ - v_-)$ behind $R_o$. Inject a test current at the output for $R_{\text{out}}$.`],
        steps: [T`$\beta = ${tf(b)}$; ideal gain $1/\beta = ${tf(1 / b)}$.`, T`$a = ${tf(a)}$, so $a\beta = ${tf(T2)}$ and $A_f \approx \dfrac{a}{1 + a\beta} = ${tf(Af2)}$.`, T`Nodal solution: $v_o/v_s = ${tf(Af)}$ (the two-port estimate differs by $${tf(100 * (Af2 - Af) / Af)}\%$, from the signal fed forward through $R_2$).`, T`$R_{\text{in}} = ${tf(Rin / 1e6)}\,\text{M}\Omega$ and $R_{\text{out}} = ${tf(Rout)}\,\Omega$: feedback multiplies one and divides the other by about $1 + a\beta$.`],
        idea: 'Series–shunt feedback raises input resistance and lowers output resistance by the same factor that it desensitises the gain: one loop gain explains all three.',
        diagram, prerequisites: 'Feedback amplifiers; two-port networks; nodal analysis.',
        verify: () => { // the asymptotic-gain model: G = G∞·T/(1+T) + G0/(1+T), from separate solves of the same circuit
            const node = (gain, src, vs, inj, withRL) => NUM.solve([[1 / Rs + 1 / Ri, -1 / Ri, 0], [-1 / Ri, 1 / Ri + 1 / R1 + 1 / R2, -1 / R2], [-gain / Ro, gain / Ro - 1 / R2, 1 / Ro + (withRL ? 1 / RL : 0) + 1 / R2]], [vs / Rs, 0, inj + src / Ro]);
            const G0 = node(0, 0, 1, 0, true)[2], [p1, m1] = node(0, 1, 0, 0, true), Tr = -A * (p1 - m1), G = (1 + R2 / R1) * Tr / (1 + Tr) + G0 / (1 + Tr);
            const vpl = node(A, 0, 1, 0, true)[0], rout = node(A, 0, 0, 1, false)[2];
            return [R1 / (R1 + R2), a * b, a / (1 + a * b), G, vpl / ((1 - vpl) / Rs) / 1e6, rout];
        }
    });
}

/* Level 4 (mastery): large-signal distortion of a degenerated BJT differential pair, by numerical Fourier analysis. */
function electronicsDiffPair(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'diff-pair', date, ELECTRONICS_READING), p = part, VT = .02585;
    const [IEEm, RCk, RE, Vpm] = grid([.2, .5, 1, 2], [1, 2.2, 4.7, 10], [0, 25, 50, 100], steps(10, 80, 5)), IEE = IEEm * 1e-3, RC = RCk * 1e3, Vp = Vpm * 1e-3;
    // Newton on y = artanh x (unbounded): g(y) = 2V_T y + I_EE R_E tanh y − v is increasing and concave for y > 0,
    // and the start v/(2V_T + I_EE R_E) lies on the root's left, so the iterates climb to it without overshooting.
    const xOf = v => { let y = v / (2 * VT + IEE * RE); for (let i = 0; i < 60; i++) { const t = Math.tanh(y), dy = (2 * VT * y + IEE * RE * t - v) / (2 * VT + IEE * RE * (1 - t * t)); y -= dy; if (Math.abs(dy) < 1e-14 * (1 + Math.abs(y))) break; } return Math.tanh(y); };
    const harmonics = amp => { const N = 256, b = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let n = 0; n < N; n++) { const th = 2 * Math.PI * (n + .5) / N, out = RC * IEE * xOf(amp * Math.sin(th)); for (let k = 1; k < 16; k += 2) b[k] += 2 / N * out * Math.sin(k * th); }
        return b; };
    const thd = amp => { const b = harmonics(amp); return Math.sqrt([3, 5, 7, 9, 11, 13, 15].reduce((s, k) => s + b[k] * b[k], 0)) / Math.abs(b[1]); };
    const Ad = RC * IEE / (2 * VT + IEE * RE), h = harmonics(Vp), b1 = h[1], hd3 = Math.abs(h[3]) / b1, T1 = thd(Vp), V1 = NUM.bisect(v => thd(v) - .01, 1e-4, 2, 44);
    const diagram = drawing(wire('M200 40H520') + note(525, 46, '+Vᴄᴄ') + element('R', 262, 40, 262, 110, 'Rᴄ') + element('R', 458, 40, 458, 110, 'Rᴄ') + npnGlyph(240, 140) + wire('M262 170V180') +
        `<g transform="translate(720 0) scale(-1 1)">${npnGlyph(240, 140)}</g>` + wire('M458 170V180M150 140H240M570 140H480') + element('R', 262, 180, 262, 230, 'Rᴇ') + element('R', 458, 180, 458, 230, '') + note(403, 210, 'Rᴇ') +
        wire('M262 230H458M360 230V250') + element('I', 360, 250, 360, 300, 'Iᴇᴇ') + ground(360, 300) + ring(146, 140, 4) + ring(574, 140, 4) + dt(146, 120, 'v₁') + dt(574, 120, 'v₂') + dt(360, 100, 'vₒd') + wire('M262 110H300M458 110H420') +
        dot(262, 110) + dot(458, 110) + dot(360, 230), 'BJT differential pair: two NPN transistors with collector resistors RC, emitter degeneration resistors RE joined to a tail current source IEE; the input is v1 − v2 and the output is taken between the collectors', 320);
    return q({
        title: 'Distortion of a differential pair, computed',
        text: T`In the differential pair shown, each emitter has degeneration $R_E$ and the tail current is $I_{EE}$ (take $\alpha = 1$, $V_T = 25.85\,\text{mV}$). With $x = (i_{C1} - i_{C2})/I_{EE}$, the large-signal law is $$v_{id} = 2V_T\,\operatorname{artanh}x + I_{EE}R_E\,x, \qquad v_{od} = I_{EE}R_C\,x.$$ Find the small-signal differential gain. Then drive $v_{id} = V_p\sin\omega t$ with $V_p = ${Vpm}\,\text{mV}$: find the amplitude of the fundamental of $v_{od}$, the third-harmonic distortion HD3, and the total harmonic distortion up to the 15th harmonic. Finally find the input amplitude that gives 1% THD.`,
        givens: [T`$I_{EE} = ${IEEm}\,\text{mA}$, $R_C = ${RCk}\,\text{k}\Omega$, $R_E = ${RE}\,\Omega$`, T`$V_p = ${Vpm}\,\text{mV}$`, T`$V_T = 25.85\,\text{mV}$, $\alpha = 1$`],
        parts: [p('Small-signal differential gain', Ad, 'V/V'), p('Fundamental amplitude', b1, 'V'), p('HD3', 100 * hd3, '%', .01, .001), p('THD', 100 * T1, '%', .01, .001), p('Input amplitude for 1% THD', V1 * 1e3, 'mV')],
        hints: [T`Differentiate at $x = 0$: $dv_{id}/dx = 2V_T + I_{EE}R_E$, so $A_d = \dfrac{I_{EE}R_C}{2V_T + I_{EE}R_E}$.`, T`For each sample of $v_{id}$ solve the monotonic law for $x$ (bisection), then compute the Fourier sine coefficients $b_k = \dfrac{2}{N}\sum v_{od}\sin k\theta_n$. Only odd harmonics appear (odd symmetry).`, T`THD grows with $V_p$: bisect on $V_p$ for $\text{THD} = 1\%$.`],
        steps: [T`$A_d = ${tf(Ad)}$.`, T`Fourier analysis of $v_{od}$ ($N = 256$ samples): $b_1 = ${tf(b1)}\,\text{V}$, $b_3 = ${tf(h[3])}\,\text{V}$, $b_5 = ${tf(h[5])}\,\text{V}$.`, T`$\text{HD3} = |b_3|/b_1 = ${tf(100 * hd3)}\%$ and $\text{THD} = ${tf(100 * T1)}\%$.`, T`$\text{THD} = 1\%$ at $V_p = ${tf(V1 * 1e3)}\,\text{mV}$.`],
        idea: 'A differential pair is linear only for inputs well below 2V_T; degeneration extends the linear range by the ratio of I_EE·R_E to 2V_T, at the cost of gain.',
        diagram, prerequisites: 'BJT large-signal model; Fourier series; numerical root finding.',
        verify: () => { // bisection for x, Simpson's rule over one period for the Fourier integrals, a finite difference for the gain
            const xB = v => NUM.bisect(x => 2 * VT * Math.atanh(x) + IEE * RE * x - v, -1 + 1e-15, 1 - 1e-15, 64), n = 512;
            const coefs = amp => { const f = Array.from({length: n + 1}, (_, i) => RC * IEE * xB(amp * Math.sin(2 * Math.PI * i / n))), hh = 2 * Math.PI / n;
                return [1, 3, 5, 7, 9, 11, 13, 15].map(k => f.reduce((s, v, i) => s + (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * v * Math.sin(k * i * hh), 0) * hh / 3 / Math.PI); };
            const td = amp => { const c = coefs(amp); return Math.sqrt(c.slice(1).reduce((s, v) => s + v * v, 0)) / Math.abs(c[0]); };
            let lo = 1e-4, hi = 2; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (td(mid) < .01) lo = mid; else hi = mid; }
            const c = coefs(Vp);
            return [RC * IEE * (xB(1e-7) - xB(-1e-7)) / 2e-7, c[0], 100 * Math.abs(c[1]) / c[0], 100 * td(Vp), (lo + hi) / 2 * 1e3];
        }
    });
}
