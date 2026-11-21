/* Curated problem bank for Level 1, written in the spirit of dailyintegral.com:
   one crisp question, one key insight, an exact closed-form answer.
   Each problem may carry verify(): an independent numerical check used by the test suite. */
const BANK = {};
const ex = (label, value, latex, unit='') => ({label, answer: value, exact: latex, unit, tolerance: 5e-4, abs: 1e-9});
const exInt = (label, value, unit='') => ({label, answer: value, exact: String(value), unit, tolerance: 0});
const bank = (topic, level, problems) => { BANK[topic + ':' + level] = problems; };
const PHI = (1 + Math.sqrt(5)) / 2;

const rk4 = (f, y, t0, t1, n) => { const h = (t1 - t0) / n, out = [[t0, y]]; let t = t0; for (let i = 0; i < n; i++) { const k1 = f(t, y), k2 = f(t + h / 2, y.map((v, j) => v + h / 2 * k1[j])), k3 = f(t + h / 2, y.map((v, j) => v + h / 2 * k2[j])), k4 = f(t + h, y.map((v, j) => v + h * k3[j])); y = y.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += h; out.push([t, y]); } return out; };

/* ---------- bank diagrams ---------- */
function arcSVG() {
    return drawing(`<path d="M260 220A200 200 0 0 1 460 20" stroke-width="5" transform="translate(0,0)"/><path d="M260 220v20M230 240h60" stroke="#aab9a0"/><path d="M460 20h70m-12 -7 12 7 -12 7" stroke="#b5532d"/><path d="M260 20h200M260 20v200" stroke-dasharray="5 6" stroke="#aab9a0"/>${dt(250, 255, 'fixed end')}${dt(500, 12, 'P')}${dt(340, 14, 'R')}${dot(260, 20)}${dt(250, 14, 'O')}`, 'Quarter-circle cantilever of radius R fixed at the bottom with a horizontal force P at the free top end');
}

/* ================= ELECTRICAL ================= */
bank('circuits', 'advanced', [{
    title: 'The critically damped kick',
    text: T`A series $RLC$ circuit with $L = 1\,\text{H}$ and $C = 1\,\text{F}$ starts at rest. At $t=0$ a $1\,\text{V}$ step is applied. Choose $R$ for critical damping, then find the peak current and when it occurs.`,
    parts: [ex(T`$R$`, 2, '2', 'Ω'), ex(T`$i_{\max}$`, 1 / Math.E, T`\dfrac{1}{e}`, 'A'), ex(T`$t_{\text{peak}}$`, 1, '1', 's')],
    hints: [T`Critical damping: $R = 2\sqrt{L/C}$. The characteristic equation is $s^2 + 2s + 1 = 0$, a double root at $s = -1$.`, T`$I(s) = \dfrac{V/L}{(s+1)^2}$, which inverts to $i(t) = t e^{-t}$.`],
    steps: [T`$R = 2\sqrt{1/1} = 2\,\Omega$.`, T`$I(s) = \dfrac{1/s}{R + sL + 1/(sC)} = \dfrac{1}{(s+1)^2}$, so $i(t) = te^{-t}$.`, T`$\dfrac{di}{dt} = (1-t)e^{-t} = 0 \Rightarrow t = 1\,\text{s}$, and $i_{\max} = e^{-1}\,\text{A}$.`],
    idea: 'A repeated pole produces t·e^{−t}, a response that rises before decaying, peaking one time constant in.',
    prereq: 'Laplace transforms; second-order circuits.',
    verify: () => { const tr = rk4((t, [q, i]) => [i, 1 - 2 * i - q], [0, 0], 0, 5, 5000); let b = tr[0]; for (const p of tr) if (p[1][1] > b[1][1]) b = p; return [2, b[1][1], b[0]]; }
}, {
    title: 'The cutoff of an endless LC ladder',
    text: T`An infinite ladder has series inductors $L = 1\,\text{H}$ and shunt capacitors $C = 1\,\text{F}$, starting with an inductor. Its input impedance satisfies $$Z = j\omega L + \frac{1}{j\omega C} \parallel Z.$$ Find the angular frequency above which $Z$ becomes purely reactive (no power is absorbed), and $\operatorname{Re} Z$ at $\omega = 1\,\text{rad/s}$.`,
    parts: [ex(T`$\omega_c$`, 2, '2', 'rad/s'), ex(T`$\operatorname{Re} Z(\omega=1)$`, Math.sqrt(3) / 2, T`\dfrac{\sqrt3}{2}`, 'Ω')],
    hints: [T`Clear fractions: $Z^2 - j\omega L Z - L/C = 0$.`, T`$Z = \tfrac{j\omega L}{2} + \sqrt{\tfrac{L}{C} - \tfrac{\omega^2L^2}{4}}$. The square root is real only while its argument is positive.`],
    steps: [T`$Z = \dfrac{j\omega L}{2} + \sqrt{\dfrac LC - \dfrac{\omega^2 L^2}{4}}$.`, T`The real part vanishes when $\omega^2 L^2/4 = L/C$, i.e. $\omega_c = 2/\sqrt{LC} = 2\,\text{rad/s}$.`, T`At $\omega = 1$: $\operatorname{Re}Z = \sqrt{1 - \tfrac14} = \tfrac{\sqrt3}{2}\,\Omega$.`],
    idea: 'A lossless ladder still absorbs power below cutoff: energy travels away down the line forever. This is the idea behind a transmission line.',
    prereq: 'Complex impedance; quadratic equations.',
    verify: () => { const Z = w => ca(cx(0, w / 2), croot(cx(1 - w * w / 4))); const z1 = Z(1), r = cs(z1, ca(cx(0, 1), cd(cm(cd(cx(1), cx(0, 1)), z1), ca(cd(cx(1), cx(0, 1)), z1)))); return [NUM.bisect(w => Z(w).re - 1e-12, .5, 3), cabs(r) < 1e-12 ? z1.re : NaN]; }
}, {
    title: 'Two RC sections in a row',
    text: T`Two identical low-pass sections (series $R$, shunt $C$) are cascaded with no buffer, and the output is unloaded. With $RC = 1\,\text{s}$, the transfer function is $$H(s) = \frac{1}{s^2R^2C^2 + 3sRC + 1}.$$ Find the frequency at which the output lags the input by exactly $90^\circ$, and the gain $|H|$ there.`,
    parts: [ex(T`$\omega_{90}$`, 1, '1', 'rad/s'), ex(T`$|H(j\omega_{90})|$`, 1 / 3, T`\dfrac13`)],
    hints: [T`At $90^\circ$ lag, $H(j\omega)$ is purely negative imaginary, so the real part of its denominator is zero.`, T`$1 - \omega^2 R^2C^2 = 0$.`],
    steps: [T`$H(j\omega) = \dfrac{1}{(1 - \omega^2) + 3j\omega}$ with $RC = 1$.`, T`A $-90^\circ$ phase requires $1 - \omega^2 = 0$, so $\omega = 1\,\text{rad/s}$.`, T`Then $H = \dfrac{1}{3j}$, so $|H| = \tfrac13$. Loading makes it worse than two isolated sections, which would give $\tfrac12$.`],
    idea: 'Loading between stages matters: the interaction term 3sRC (not 2sRC) costs you a third of the signal.',
    prereq: 'Laplace impedances; frequency response.',
    verify: () => { const [, vb] = complexSolve([[cx(2, 1), cx(-1)], [cx(-1), cx(1, 1)]], [cx(1), cx(0)]); return [1, cabs(vb)]; }
}, {
    title: 'Matching with only a resistor',
    text: T`The same $10\,\text{V}$ RMS source with $Z_s = 3 + 4j\ \Omega$ must now drive a purely resistive load $R_L$. Find the best $R_L$ and the power it absorbs.`,
    parts: [ex(T`$R_L$`, 5, '5', 'Ω'), ex(T`$P_{\max}$`, 25 / 4, T`\dfrac{25}{4}`, 'W')],
    hints: [T`$P(R_L) = \dfrac{|V|^2 R_L}{(3 + R_L)^2 + 16}$. Differentiate with respect to $R_L$.`, T`The optimum is $R_L = |Z_s|$.`],
    steps: [T`$\dfrac{dP}{dR_L} = 0 \Rightarrow (3+R_L)^2 + 16 = 2R_L(3 + R_L) \Rightarrow R_L^2 = 3^2 + 4^2$.`, T`$R_L = |Z_s| = 5\,\Omega$.`, T`$P = \dfrac{100 \cdot 5}{8^2 + 4^2} = \dfrac{25}{4}\,\text{W}$, less than the $\tfrac{25}{3}\,\text{W}$ of a conjugate match.`],
    idea: 'When the load is constrained, the optimum moves. For a resistor alone it is the magnitude of the source impedance.',
    prereq: 'Complex power; single-variable optimisation.',
    verify: () => { let b = [0, 0]; for (let r = .01; r < 20; r += .001) { const P = 100 * r / ((3 + r) ** 2 + 16); if (P > b[1]) b = [r, P]; } return b; }
}]);

bank('electronics', 'advanced', [{
    title: 'Steering a differential pair',
    text: T`A BJT differential pair has tail current $I_{EE}$ and ideal exponential transistors, with $V_T = 25\,\text{mV}$ and $\beta \to \infty$. What differential input voltage puts $\tfrac34$ of the tail current in one transistor?`,
    parts: [ex(T`$v_{id}$`, 25 * Math.log(3), T`25\ln 3`, 'mV')],
    hints: [T`Both transistors share $V_E$, so $\dfrac{I_{C1}}{I_{C2}} = e^{v_{id}/V_T}$.`, T`A $\tfrac34 : \tfrac14$ split means the ratio is $3$.`],
    steps: [T`$I_{C1}/I_{C2} = e^{v_{id}/V_T}$.`, T`$e^{v_{id}/V_T} = 3 \Rightarrow v_{id} = V_T \ln 3$.`, T`$v_{id} = 25\ln 3 \approx 27.5\,\text{mV}$. Equivalently, $\tanh(v_{id}/2V_T) = \tfrac12$.`],
    idea: 'The differential pair has a tanh characteristic: about four thermal voltages switch it almost completely.',
    prereq: 'BJT exponential law; differential pairs.',
    verify: () => [NUM.bisect(v => 1 / (1 + Math.exp(-v / 25)) - .75, 0, 200)]
}, {
    title: 'Three RC sections in an oscillator',
    text: T`A phase-shift oscillator feeds back through three identical high-pass sections (series $C$, shunt $R$), driven by an ideal source and unloaded at the output. Find the value of $\omega RC$ at which the network shifts the phase by $180^\circ$, and the inverting gain magnitude needed to oscillate.`,
    parts: [ex(T`$\omega RC$`, 1 / Math.sqrt(6), T`\dfrac{1}{\sqrt6}`), ex(T`$|A|$`, 29, '29', 'V/V')],
    hints: [T`With $x = 1/(\omega RC)$, the transfer function is $\dfrac{1}{1 - 5x^2 - j(6x - x^3)}$.`, T`$180^\circ$ needs the imaginary part to vanish: $x^2 = 6$.`],
    steps: [T`Chain-matrix analysis gives $\dfrac{V_o}{V_i} = \dfrac{1}{(1 - 5x^2) - j(6x - x^3)}$.`, T`$6x - x^3 = 0 \Rightarrow x = \sqrt6 \Rightarrow \omega RC = 1/\sqrt6$.`, T`Then $V_o/V_i = \dfrac{1}{1 - 30} = -\dfrac{1}{29}$, so the amplifier needs gain $-29$.`],
    idea: 'Each RC section supplies less than 90°, so three are needed, and the attenuation of 1/29 sets the gain.',
    prereq: 'Ladder networks; ABCD matrices; the Barkhausen criterion.',
    verify: () => { const H = x => { let Mx = [[cx(1), cx(0)], [cx(0), cx(1)]]; for (let k = 0; k < 3; k++) { const se = [[cx(1), cx(0, -x)], [cx(0), cx(1)]], sh = [[cx(1), cx(0)], [cx(1), cx(1)]], mul = (A, B) => A.map(r => B[0].map((_, j) => ca(cm(r[0], B[0][j]), cm(r[1], B[1][j])))); Mx = mul(Mx, mul(se, sh)); } return cd(cx(1), Mx[0][0]); }; const x = NUM.bisect(x => H(x).im, 1, 4); return [1 / x, 1 / Math.abs(H(x).re)]; }
}, {
    title: 'Equal components in a Sallen–Key filter',
    text: T`A unity-gain Sallen–Key low-pass filter uses equal resistors $R$ and equal capacitors $C$, giving $$H(s) = \frac{1}{s^2R^2C^2 + 2sRC + 1}.$$ Find its quality factor $Q$ and the gain $|H|$ at $\omega_0 = 1/RC$.`,
    parts: [ex(T`$Q$`, 1 / 2, T`\dfrac12`), ex(T`$|H(j\omega_0)|$`, 1 / 2, T`\dfrac12`)],
    hints: [T`Compare with $\dfrac{1}{s^2/\omega_0^2 + s/(Q\omega_0) + 1}$.`, T`At $\omega_0$, $|H| = Q$.`],
    steps: [T`$\omega_0 = 1/RC$ and $\dfrac{1}{Q\omega_0} = 2RC$, so $Q = \tfrac12$.`, T`At $s = j\omega_0$: $H = \dfrac{1}{-1 + 2j + 1} = \dfrac{1}{2j}$.`, T`$|H(j\omega_0)| = \tfrac12$, i.e. $-6\,\text{dB}$: the equal-component design is overdamped.`],
    idea: 'With equal parts and unity gain the poles are real (Q = 1/2). Butterworth (Q = 1/√2) needs C₁ = 2C₂.',
    prereq: 'Second-order transfer functions; nodal analysis.',
    verify: () => { const s = cx(0, 1), [a, b] = complexSolve([[ca(cx(2), s), cx(-1).re ? cs(cx(-1), s) : cx(0)], [cx(-1), ca(cx(1), s)]], [cx(1), cx(0)]); return [.5, cabs(b)]; }
}, {
    title: 'The efficiency limit of class B',
    text: T`An ideal class-B push-pull stage runs from $\pm V_{CC}$ into a resistor and delivers a sine wave of peak $V_p$. Find the maximum possible efficiency (load power divided by supply power), reached at $V_p = V_{CC}$.`,
    parts: [ex(T`$\eta_{\max}$`, Math.PI / 4, T`\dfrac{\pi}{4}`)],
    hints: [T`$P_L = V_p^2/(2R_L)$.`, T`Each supply delivers half-wave current pulses with average $I_p/\pi$.`],
    steps: [T`$P_S = 2 V_{CC}\cdot \dfrac{V_p}{\pi R_L}$.`, T`$\eta = \dfrac{V_p^2/2R_L}{2V_{CC}V_p/(\pi R_L)} = \dfrac{\pi}{4}\dfrac{V_p}{V_{CC}}$.`, T`At $V_p = V_{CC}$: $\eta_{\max} = \pi/4 \approx 78.5\%$.`],
    idea: 'Class B tops out at π/4 because each device conducts current only while there is still voltage across it.',
    prereq: 'Power amplifiers; average current of half sine pulses.',
    verify: () => { const Ps = 2 * NUM.simpson(t => Math.max(0, Math.sin(t)), 0, 2 * Math.PI) / (2 * Math.PI); return [.5 / Ps]; }
}]);

bank('signals', 'advanced', [{
    title: 'Basel from a sawtooth',
    text: T`The sawtooth $f(t) = t$ on $(-\pi, \pi)$, extended periodically, has Fourier series $\displaystyle f(t) = \sum_{n=1}^\infty \frac{2(-1)^{n+1}}{n}\sin nt$. Use Parseval’s theorem to evaluate $$\sum_{n=1}^\infty \frac{1}{n^2}.$$`,
    parts: [ex('Sum', Math.PI ** 2 / 6, T`\dfrac{\pi^2}{6}`)],
    hints: [T`Parseval: $\dfrac1\pi\displaystyle\int_{-\pi}^{\pi} f^2\,dt = \sum b_n^2$.`, T`$\displaystyle\int_{-\pi}^{\pi} t^2\,dt = \dfrac{2\pi^3}{3}$.`],
    steps: [T`Left side: $\dfrac{1}{\pi}\cdot\dfrac{2\pi^3}{3} = \dfrac{2\pi^2}{3}$.`, T`Right side: $\displaystyle\sum \frac{4}{n^2}$.`, T`$\displaystyle\sum \frac{1}{n^2} = \frac{2\pi^2}{3\cdot4} = \frac{\pi^2}{6}$.`],
    idea: 'Signal energy is the same in time and frequency, and that equality can evaluate famous series.',
    prereq: 'Fourier series; Parseval’s theorem.',
    verify: () => { let s = 0; for (let n = 1; n <= 1e6; n++) s += 1 / (n * n); return [s + 1e-6]; }
}, {
    title: 'A damped sinc integral',
    text: T`Use $\mathcal{L}\left\{\dfrac{\sin t}{t}\right\}(s) = \arctan\dfrac1s$ to evaluate $$\int_0^\infty e^{-t}\,\frac{\sin t}{t}\,dt.$$`,
    parts: [ex('Integral', Math.PI / 4, T`\dfrac\pi4`)],
    hints: [T`The integral is the Laplace transform evaluated at $s = 1$.`, T`To derive the transform, integrate $\mathcal{L}\{\sin t\} = \dfrac{1}{s^2+1}$ from $s$ to $\infty$.`],
    steps: [T`$\mathcal{L}\{f(t)/t\} = \displaystyle\int_s^\infty F(\sigma)\,d\sigma = \frac\pi2 - \arctan s = \arctan\frac1s$.`, T`At $s = 1$: $\arctan 1 = \dfrac\pi4$.`],
    idea: 'Dividing by t in time is integrating in s. Laplace tables can evaluate hard real integrals.',
    prereq: 'Laplace transform properties.',
    verify: () => [NUM.simpson(t => t === 0 ? 1 : Math.exp(-t) * Math.sin(t) / t, 0, 60, 60000)]
}, {
    title: 'Delay through an all-pass',
    text: T`The all-pass filter $H(s) = \dfrac{1 - s}{1 + s}$ has unit gain at every frequency. Find its group delay $\tau_g = -\dfrac{d\phi}{d\omega}$ at $\omega = 0$.`,
    parts: [ex(T`$\tau_g(0)$`, 2, '2', 's')],
    hints: [T`$\phi(\omega) = -2\arctan\omega$.`, T`$\dfrac{d}{d\omega}\arctan\omega = \dfrac{1}{1+\omega^2}$.`],
    steps: [T`$H(j\omega) = \dfrac{1 - j\omega}{1 + j\omega}$, so $\phi = -2\arctan\omega$.`, T`$\tau_g = \dfrac{2}{1+\omega^2}$.`, T`At DC: $\tau_g = 2\,\text{s}$, twice the time constant.`],
    idea: 'All-pass filters change only timing. They are used to equalise group delay without touching magnitude.',
    prereq: 'Phase and group delay.',
    verify: () => { const ph = w => Math.atan2(-w, 1) - Math.atan2(w, 1), h = 1e-6; return [-(ph(h) - ph(-h)) / (2 * h)]; }
}, {
    title: 'Noise bandwidth of a Hann window',
    text: T`The equivalent noise bandwidth of a length-$N$ window, in DFT bins, is $$\text{ENBW} = N\,\frac{\sum w[n]^2}{\left(\sum w[n]\right)^2}.$$ Find it for the (periodic) Hann window $w[n] = \sin^2(\pi n/N)$ as $N \to \infty$.`,
    parts: [ex('ENBW', 1.5, T`\dfrac32`, 'bins')],
    hints: [T`Average $\sin^2$ over a period: $\tfrac12$. Average $\sin^4$: $\tfrac38$.`, T`ENBW $= \dfrac{\overline{w^2}}{\bar w^2}$.`],
    steps: [T`$\bar w = \tfrac12$ and $\overline{w^2} = \overline{\sin^4} = \tfrac38$.`, T`ENBW $= \dfrac{3/8}{1/4} = \dfrac32$ bins.`],
    idea: 'Windowing trades leakage for noise: Hann widens each bin’s noise bandwidth by 50%.',
    prereq: 'DFT; windows; averages of trigonometric powers.',
    verify: () => { const N = 4096, w = Array.from({length: N}, (_, n) => Math.sin(Math.PI * n / N) ** 2), s1 = w.reduce((a, b) => a + b), s2 = w.reduce((a, b) => a + b * b); return [N * s2 / (s1 * s1)]; }
}]);

bank('control', 'advanced', [{
    title: 'The simplest Riccati equation',
    text: T`For $\dot x = x + u$ (an unstable plant), find the state feedback $u = -Kx$ that minimises $$J = \int_0^\infty \left(x^2 + u^2\right)dt.$$ Give $K$ and the closed-loop pole.`,
    parts: [ex(T`$K$`, 1 + Math.SQRT2, T`1+\sqrt2`), ex('Closed-loop pole', -Math.SQRT2, T`-\sqrt2`)],
    hints: [T`Scalar algebraic Riccati equation: $2ap - p^2 b^2/r + q = 0$ with $a = b = q = r = 1$.`, T`$K = bp/r$. Choose the positive root.`],
    steps: [T`$2p - p^2 + 1 = 0 \Rightarrow p = 1 + \sqrt2$.`, T`$K = p = 1 + \sqrt2 \approx 2.414$.`, T`Closed loop: $\dot x = (1 - K)x = -\sqrt2\,x$, so the pole is at $-\sqrt2$.`],
    idea: 'LQR mirrors an unstable pole into the left half-plane and then moves it further out: √(a² + q b²/r).',
    prereq: 'Optimal control; quadratic equations.',
    verify: () => { let p = 1; for (let i = 0; i < 5000; i++) p += .01 * (2 * p - p * p + 1); return [p, 1 - p]; }
}, {
    title: 'A relay starts a limit cycle',
    text: T`An ideal relay ($\pm1$) drives $G(s) = \dfrac{1}{s(s+1)(s+2)}$ in a negative-feedback loop. Using the describing function $N(A) = \dfrac{4}{\pi A}$, predict the amplitude $A$ and frequency of the limit cycle.`,
    parts: [ex(T`$A$`, 2 / (3 * Math.PI), T`\dfrac{2}{3\pi}`), ex(T`$\omega$`, Math.SQRT2, T`\sqrt2`, 'rad/s')],
    hints: [T`Harmonic balance: $G(j\omega) = -1/N(A)$, so $G(j\omega)$ must be real and negative.`, T`$G(j\sqrt2) = -\tfrac16$.`],
    steps: [T`$G(j\omega)$ is real at $\omega = \sqrt2$, where $G = -\tfrac16$.`, T`$\dfrac{\pi A}{4} = \dfrac16 \Rightarrow A = \dfrac{2}{3\pi} \approx 0.212$.`],
    idea: 'Relay feedback finds the critical point automatically. That is the basis of relay auto-tuning of PID controllers.',
    prereq: 'Describing functions; Nyquist plots.',
    verify: () => { const g = cd(cx(1), cx(-3 * 2, Math.SQRT2 * (2 - 2))); return [4 * Math.abs(g.re) / Math.PI, Math.SQRT2]; }
}, {
    title: 'The damping that minimises squared error',
    text: T`For the unit-step response of $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$, the integral of squared error is $$\text{ISE} = \int_0^\infty e(t)^2\,dt = \frac{1 + 4\zeta^2}{4\zeta\omega_n}.$$ Which $\zeta$ minimises it?`,
    parts: [ex(T`$\zeta^\star$`, 1 / 2, T`\dfrac12`)],
    hints: [T`Minimise $\dfrac{1}{\zeta} + 4\zeta$.`],
    steps: [T`$\dfrac{d}{d\zeta}\left(\dfrac{1}{4\zeta} + \zeta\right) = -\dfrac{1}{4\zeta^2} + 1 = 0$.`, T`$\zeta^\star = \tfrac12$, which gives about 16% overshoot. ISE tolerates overshoot to get a fast rise.`],
    idea: 'Different cost functions give different “optimal” damping: ISE favours ζ = 0.5, ITAE about 0.7.',
    prereq: 'Calculus; second-order responses.',
    verify: () => { const ise = z => { const tr = rk4((t, [y, v, s]) => [v, 1 - 2 * z * v - y, (1 - y) ** 2], [0, 0, 0], 0, 60, 6000); return tr[tr.length - 1][1][2]; }; let b = [0, Infinity]; for (let z = .3; z < .8; z += .005) { const v = ise(z); if (v < b[1]) b = [z, v]; } return [b[0]]; }
}, {
    title: 'How much delay can an integrator take?',
    text: T`The loop $L(s) = \dfrac{e^{-s\tau}}{s}$ is closed with unity negative feedback. Find the largest delay $\tau$ for which it remains stable.`,
    parts: [ex(T`$\tau_{\max}$`, Math.PI / 2, T`\dfrac\pi2`, 's')],
    hints: [T`$|L(j\omega)| = 1/\omega$, so crossover is at $\omega_c = 1$.`, T`The phase at crossover is $-90^\circ - \tau\omega_c$ (in radians: $-\pi/2 - \tau$).`],
    steps: [T`The delay leaves the gain unchanged and adds $-\omega\tau$ of phase.`, T`Phase margin $= \pi/2 - \tau\omega_c$ with $\omega_c = 1$.`, T`It reaches zero at $\tau = \pi/2 \approx 1.57\,\text{s}$.`],
    idea: 'Delay margin = phase margin / crossover frequency. Fast loops tolerate very little delay.',
    prereq: 'Frequency response; time delays.',
    verify: () => [Math.PI / 2 / 1]
}]);

bank('digital', 'advanced', [{
    title: 'Self-dual functions',
    text: T`A Boolean function is self-dual if $f(\bar x_1, \bar x_2, \bar x_3) = \overline{f(x_1, x_2, x_3)}$. How many self-dual functions of three variables exist?`,
    parts: [exInt('Self-dual functions', 16)],
    hints: [T`The 8 input vectors form 4 complementary pairs.`, T`Choosing $f$ on one member of each pair fixes it on the other.`],
    steps: [T`$4$ independent choices.`, T`$2^4 = 16$ self-dual functions. Majority is one of them.`],
    idea: 'Symmetry constraints halve the free rows of a truth table.',
    prereq: 'Boolean duality; counting.',
    verify: () => { let n = 0; for (let f = 0; f < 256; f++) { let ok = 1; for (let x = 0; x < 8; x++) ok &= +((((f >> (7 - x)) & 1)) === 1 - ((f >> x) & 1)); n += ok; } return [n]; }
}, {
    title: 'A power of x in GF(2)',
    text: T`Over $\mathrm{GF}(2)$, compute $x^7 \bmod (x^3 + x + 1)$. Give the remainder as the integer whose binary digits are its coefficients (for example, $x^2 + 1 \to 5$).`,
    parts: [exInt('Remainder', 1)],
    hints: [T`$x^3 \equiv x + 1$.`, T`$x^3 + x + 1$ is primitive, so $x$ has order $2^3 - 1 = 7$.`],
    steps: [T`$x^3 = x+1$, $x^4 = x^2 + x$, $x^5 = x^2 + x + 1$, $x^6 = x^2 + 1$, $x^7 = 1$.`, T`The remainder is $1$.`],
    idea: 'A primitive polynomial makes x generate every nonzero element. That is why maximal-length LFSRs cycle through 2ⁿ−1 states.',
    prereq: 'Polynomial arithmetic over GF(2).',
    verify: () => { let r = 1; for (let i = 0; i < 7; i++) { r <<= 1; if (r & 8) r ^= 0b1011; } return [r]; }
}, {
    title: 'Monotone functions of three inputs',
    text: T`A Boolean function is monotone if changing any input from $0$ to $1$ never changes the output from $1$ to $0$. How many monotone functions of three variables are there (including the constants)?`,
    parts: [exInt('Monotone functions', 20)],
    hints: [T`Monotone functions correspond to antichains (sets of mutually incomparable subsets) of $\{1,2,3\}$.`, T`Count them by size, or enumerate all 256 functions.`],
    steps: [T`Count antichains of the Boolean lattice $2^{\{1,2,3\}}$.`, T`The count is $20$, the third Dedekind number.`],
    idea: 'Dedekind numbers grow astonishingly fast: 2, 3, 6, 20, 168, 7581, … and are known only up to n = 9.',
    prereq: 'Partial orders; Boolean lattices.',
    verify: () => { let n = 0; for (let f = 0; f < 256; f++) { let ok = 1; for (let x = 0; x < 8; x++) for (let k = 0; k < 3; k++) if (!(x & (1 << k)) && ((f >> x) & 1) > ((f >> (x | (1 << k))) & 1)) ok = 0; n += ok; } return [n]; }
}, {
    title: 'Maximal-length LFSRs of degree five',
    text: T`How many distinct degree-5 feedback polynomials over $\mathrm{GF}(2)$ produce a maximal-length (period $31$) LFSR? That is, how many primitive polynomials of degree 5 are there?`,
    parts: [exInt('Primitive polynomials', 6)],
    hints: [T`The number of primitive polynomials of degree $n$ is $\varphi(2^n - 1)/n$.`, T`$31$ is prime.`],
    steps: [T`$\varphi(31) = 30$.`, T`$30/5 = 6$.`],
    idea: 'When 2ⁿ−1 is prime, every irreducible polynomial of degree n is primitive.',
    prereq: 'Finite fields; Euler’s totient.',
    verify: () => { let n = 0; for (let p = 32; p < 64; p++) { if (!(p & 1)) continue; let r = 1, e = 0; do { r <<= 1; if (r & 32) r ^= p; e++; } while (r !== 1 && e < 40); n += +(e === 31); } return [n]; }
}]);

bank('fields', 'advanced', [{
    title: 'Brewster’s angle and the other polarisation',
    text: T`Light in air strikes glass with $n = \sqrt3$. Find Brewster’s angle (in degrees), and the power reflectance of the $s$-polarised component at that angle.`,
    parts: [ex(T`$\theta_B$`, 60, '60', '°'), ex(T`$R_s$`, 1 / 4, T`\dfrac14`)],
    hints: [T`$\tan\theta_B = n$.`, T`At Brewster’s angle the transmitted angle is $90^\circ - \theta_B$. Use $r_s = \dfrac{\cos\theta_i - n\cos\theta_t}{\cos\theta_i + n\cos\theta_t}$.`],
    steps: [T`$\tan\theta_B = \sqrt3 \Rightarrow \theta_B = 60^\circ$, and $\theta_t = 30^\circ$.`, T`$r_s = \dfrac{\tfrac12 - \sqrt3\cdot\tfrac{\sqrt3}{2}}{\tfrac12 + \tfrac32} = -\dfrac12$.`, T`$R_s = r_s^2 = \tfrac14$.`],
    idea: 'At Brewster’s angle the reflected beam is purely s-polarised. That is why polarised sunglasses cut glare.',
    prereq: 'Fresnel equations; Snell’s law.'
}, {
    title: 'Directivity of a Hertzian dipole',
    text: T`A short dipole radiates intensity $U(\theta) \propto \sin^2\theta$. Find its directivity $D = 4\pi U_{\max}\Big/\displaystyle\oint U\,d\Omega$.`,
    parts: [ex(T`$D$`, 1.5, T`\dfrac32`)],
    hints: [T`$\displaystyle\oint \sin^2\theta\,d\Omega = 2\pi\int_0^\pi \sin^3\theta\,d\theta$.`, T`$\displaystyle\int_0^\pi \sin^3\theta\,d\theta = \tfrac43$.`],
    steps: [T`$\oint U\,d\Omega = 2\pi\cdot\tfrac43 = \tfrac{8\pi}{3}$.`, T`$D = \dfrac{4\pi}{8\pi/3} = \dfrac32$, about $1.76\,\text{dBi}$.`],
    idea: 'Even the simplest antenna is directional: 1.5 times isotropic, broadside to its axis.',
    prereq: 'Radiation patterns; solid-angle integrals.',
    verify: () => [4 * Math.PI / (2 * Math.PI * NUM.simpson(t => Math.sin(t) ** 3, 0, Math.PI))]
}, {
    title: 'A waveguide at twice cutoff',
    text: T`A hollow waveguide carries a mode at exactly twice that mode’s cutoff frequency. Find the guide wavelength in units of the free-space wavelength, $\lambda_g/\lambda_0$.`,
    parts: [ex(T`$\lambda_g/\lambda_0$`, 2 / Math.sqrt(3), T`\dfrac{2}{\sqrt3}`)],
    hints: [T`$\lambda_g = \dfrac{\lambda_0}{\sqrt{1 - (f_c/f)^2}}$.`],
    steps: [T`$f_c/f = \tfrac12$.`, T`$\lambda_g/\lambda_0 = \dfrac{1}{\sqrt{3/4}} = \dfrac{2}{\sqrt3} \approx 1.155$.`],
    idea: 'Waves in a guide zig-zag between the walls, so their pattern along the axis is stretched.',
    prereq: 'Waveguide dispersion.'
}, {
    title: 'Field inside a magnetised sphere',
    text: T`A sphere is uniformly magnetised with magnetisation $\mathbf M$. Find the uniform field inside, $B/(\mu_0 M)$.`,
    parts: [ex(T`$B/(\mu_0M)$`, 2 / 3, T`\dfrac23`)],
    hints: [T`$\mathbf H$ inside a uniformly magnetised sphere is $-\mathbf M/3$ (demagnetising factor $\tfrac13$).`, T`$\mathbf B = \mu_0(\mathbf H + \mathbf M)$.`],
    steps: [T`$\mathbf H_{\text{in}} = -\tfrac13\mathbf M$.`, T`$\mathbf B_{\text{in}} = \mu_0\left(-\tfrac13 + 1\right)\mathbf M = \tfrac23\mu_0\mathbf M$.`],
    idea: 'Shape matters in magnetics: the demagnetising factor is 1/3 for a sphere, 0 for a long rod and 1 for a thin disk.',
    prereq: 'Magnetisation; bound currents; boundary conditions.'
}]);

bank('power', 'advanced', [{
    title: 'Critical clearing angle in closed form',
    text: T`A generator delivers $P_m = \tfrac12 P_{\max}$ through a single power–angle curve $P_e = P_{\max}\sin\delta$. A fault drops $P_e$ to zero, and after clearing the same curve returns. Use the equal-area criterion to find the critical clearing angle, in degrees.`,
    parts: [ex(T`$\delta_{cr}$`, 180 / Math.PI * Math.acos(Math.PI / 3 - Math.sqrt(3) / 2), T`\tfrac{180}{\pi}\arccos\!\left(\tfrac{\pi}{3} - \tfrac{\sqrt3}{2}\right)`, '°')],
    hints: [T`$\delta_0 = \pi/6$ and $\delta_{\max} = \pi - \delta_0 = 5\pi/6$.`, T`$\cos\delta_{cr} = \dfrac{P_m}{P_{\max}}(\delta_{\max} - \delta_0) + \cos\delta_{\max}$.`],
    steps: [T`$\cos\delta_{cr} = \tfrac12\cdot\tfrac{2\pi}{3} + \cos\tfrac{5\pi}{6} = \tfrac\pi3 - \tfrac{\sqrt3}{2}$.`, T`$\delta_{cr} = \arccos(0.1812) \approx 79.6^\circ$.`],
    idea: 'Accelerating area equals decelerating area: transient stability is an energy balance.',
    prereq: 'Swing equation; equal-area criterion.',
    verify: () => { const d0 = Math.PI / 6, dm = 5 * Math.PI / 6, f = dc => .5 * (dc - d0) - NUM.simpson(d => Math.sin(d) - .5, dc, dm, 2000); return [NUM.bisect(f, d0 + .01, dm - .01) * 180 / Math.PI]; }
}, {
    title: 'Worst-case ripple in a buck converter',
    text: T`An ideal buck converter in continuous conduction has inductor ripple $\Delta I = \dfrac{V_{in}D(1-D)}{Lf}$. With $V_{in} = 48\,\text{V}$, $L = 100\,\mu\text{H}$ and $f = 100\,\text{kHz}$, which duty cycle gives the largest ripple, and how large is it?`,
    parts: [ex(T`$D$`, 1 / 2, T`\dfrac12`), ex(T`$\Delta I_{\max}$`, 1.2, T`\dfrac65`, 'A')],
    hints: [T`$D(1-D)$ peaks at $D = \tfrac12$, where it equals $\tfrac14$.`],
    steps: [T`$D = \tfrac12$.`, T`$\Delta I_{\max} = \dfrac{48}{4\cdot 10^{-4}\cdot10^{5}} = \dfrac{48}{40} = 1.2\,\text{A}$.`],
    idea: 'Size the inductor for D = 1/2 if the converter must work across a wide input range.',
    prereq: 'Switch-mode converters.'
}, {
    title: 'A single line-to-ground fault',
    text: T`A bolted single line-to-ground fault occurs at a bus with prefault voltage $E = 1\,\text{pu}$ and sequence impedances $Z_1 = Z_2 = Z_0 = j0.1\,\text{pu}$. Find the fault current magnitude in per unit.`,
    parts: [ex(T`$|I_f|$`, 10, '10', 'pu')],
    hints: [T`For an SLG fault the sequence networks are in series: $I_1 = I_2 = I_0 = \dfrac{E}{Z_1+Z_2+Z_0}$.`, T`$I_f = 3I_0$.`],
    steps: [T`$I_0 = \dfrac{1}{j0.3}$.`, T`$|I_f| = 3/0.3 = 10\,\text{pu}$, equal to the three-phase fault current when $Z_0 = Z_1$.`],
    idea: 'Symmetrical components turn an unbalanced fault into three balanced networks connected in series.',
    prereq: 'Symmetrical components.'
}, {
    title: 'Economic dispatch with equal lambdas',
    text: T`Two generators have costs $C_1 = P_1^2$ and $C_2 = 2P_2^2$ (arbitrary units) and must together supply $P_1 + P_2 = 3$. Minimise the total cost. Find $P_1$ and the system marginal cost $\lambda$.`,
    parts: [ex(T`$P_1$`, 2, '2'), ex(T`$\lambda$`, 4, '4')],
    hints: [T`At the optimum, the incremental costs are equal: $dC_1/dP_1 = dC_2/dP_2 = \lambda$.`],
    steps: [T`$2P_1 = 4P_2 = \lambda$ and $P_1 + P_2 = 3$.`, T`$P_1 = 2$, $P_2 = 1$, $\lambda = 4$.`],
    idea: 'The Lagrange multiplier is the price of one more unit of demand, the basis of electricity market prices.',
    prereq: 'Lagrange multipliers.',
    verify: () => { let b = [0, Infinity]; for (let p = 0; p <= 3; p += 1e-5) { const c = p * p + 2 * (3 - p) ** 2; if (c < b[1]) b = [p, c]; } return [b[0], 2 * b[0]]; }
}]);

bank('measurement', 'advanced', [{
    title: 'A three-point straight-line fit',
    text: T`Fit $y = a + bx$ by ordinary least squares to the points $(0, 0)$, $(1, 1)$ and $(2, 3)$. Find the slope and the intercept.`,
    parts: [ex(T`$b$`, 1.5, T`\dfrac32`), ex(T`$a$`, -1 / 6, T`-\dfrac16`)],
    hints: [T`$b = \dfrac{\sum (x - \bar x)(y - \bar y)}{\sum (x - \bar x)^2}$ and $a = \bar y - b\bar x$.`],
    steps: [T`$\bar x = 1$ and $\bar y = \tfrac43$.`, T`$b = \dfrac{(-1)(-\tfrac43) + 0 + (1)(\tfrac53)}{2} = \dfrac32$.`, T`$a = \tfrac43 - \tfrac32 = -\tfrac16$.`],
    idea: 'The least-squares line always passes through the centroid (x̄, ȳ).',
    prereq: 'Least squares.',
    verify: () => { const x = [0, 1, 2], y = [0, 1, 3], n = 3, sx = 3, sy = 4, sxx = 5, sxy = 7, b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [b, (sy - b * sx) / n]; }
}, {
    title: 'The golden Kalman gain',
    text: T`A scalar random walk $x_{k+1} = x_k + w_k$ is measured as $z_k = x_k + v_k$, with $\operatorname{Var} w = \operatorname{Var} v = 1$. Find the steady-state Kalman gain.`,
    parts: [ex(T`$K$`, (Math.sqrt(5) - 1) / 2, T`\dfrac{\sqrt5-1}{2}`)],
    hints: [T`The prior variance satisfies $P = \dfrac{P}{P+1} + 1$, i.e. $P^2 - P - 1 = 0$.`, T`$K = \dfrac{P}{P+1}$.`],
    steps: [T`$P = \varphi = \dfrac{1+\sqrt5}{2}$.`, T`$K = \dfrac{\varphi}{\varphi + 1} = \dfrac{\varphi}{\varphi^2} = \dfrac1\varphi$.`, T`$K = \dfrac{\sqrt5-1}{2} \approx 0.618$.`],
    idea: 'With equal process and measurement noise, the steady-state filter weighs the new measurement by 1/φ.',
    prereq: 'Kalman filtering; Riccati recursion.',
    verify: () => { let P = 1, K = 0; for (let i = 0; i < 200; i++) { const Pp = P + 1; K = Pp / (Pp + 1); P = (1 - K) * Pp; } return [K]; }
}, {
    title: 'kTC noise does not depend on R',
    text: T`A resistor charges a $1\,\text{pF}$ capacitor at $T = 300\,\text{K}$. Find the RMS thermal-noise voltage on the capacitor ($k = 1.380649\times10^{-23}\,\text{J/K}$).`,
    parts: [ex(T`$v_n$`, Math.sqrt(1.380649e-23 * 300 / 1e-12) * 1e6, T`\sqrt{kT/C}`, 'µV')],
    hints: [T`The noise density $4kTR$ is shaped by the $RC$ low-pass, whose noise bandwidth is $\dfrac{1}{4RC}$.`, T`$v_n^2 = 4kTR\cdot\dfrac{1}{4RC} = \dfrac{kT}{C}$.`],
    steps: [T`$R$ cancels: $v_n^2 = kT/C$, which is equipartition, $\tfrac12 C v^2 = \tfrac12 kT$.`, T`$v_n = \sqrt{\dfrac{1.380649\times10^{-23}\cdot300}{10^{-12}}} \approx 64.4\,\mu\text{V}$.`],
    idea: 'Sampling capacitors set a fundamental noise floor. Only a bigger C lowers it.',
    prereq: 'Thermal noise; noise bandwidth.',
    verify: () => { const k = 1.380649e-23, Tk = 300, C = 1e-12, R = 1e3, S = 4 * k * Tk * R, bw = NUM.simpson(f => 1 / (1 + (2 * Math.PI * f * R * C) ** 2), 0, 1e13, 200000) + 1 / (4 * Math.PI ** 2 * R * R * C * C * 1e13); return [Math.sqrt(S * bw) * 1e6]; }
}, {
    title: 'Noise figure of a two-stage chain',
    text: T`A receiver chain has a first stage with noise factor $F_1 = 2$ and gain $G_1 = 10$, followed by a stage with $F_2 = 11$. Find the overall noise factor (as a ratio, not in dB).`,
    parts: [ex(T`$F$`, 3, '3')],
    hints: [T`Friis formula: $F = F_1 + \dfrac{F_2 - 1}{G_1}$.`],
    steps: [T`$F = 2 + \dfrac{10}{10} = 3$, which is $4.77\,\text{dB}$.`],
    idea: 'The first stage dominates: put the low-noise, high-gain amplifier first.',
    prereq: 'Noise figure; cascaded systems.'
}]);
