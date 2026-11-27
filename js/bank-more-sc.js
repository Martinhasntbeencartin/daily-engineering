/* Level 1, more curated problems: Signals & control (signals & systems, control systems, sensors & estimation).
   verify() checks each answer by an independent numerical method (simulation, numerical integration, search). */

/* ================= SIGNALS & SYSTEMS ================= */
bankMore('signals', 'advanced', [{
    title: 'The energy of a sinc pulse',
    diagram: curve('t', '(sin t / t)²', [-15, 15], [0, 1], t => Math.abs(t) < 1e-9 ? 1 : (Math.sin(t) / t) ** 2),
    text: T`Find the energy of the pulse $x(t) = \dfrac{\sin t}{t}$, that is $\displaystyle\int_{-\infty}^{\infty}\frac{\sin^2t}{t^2}\,dt$, and of its square, $\displaystyle\int_{-\infty}^{\infty}\frac{\sin^4t}{t^4}\,dt$.`,
    parts: [ex(T`$\int\sin^2t/t^2\,dt$`, Math.PI, T`\pi`), ex(T`$\int\sin^4t/t^4\,dt$`, 2 * Math.PI / 3, T`\dfrac{2\pi}{3}`)],
    hints: [T`$\dfrac{\sin t}{t}$ is the inverse transform of a rectangle: $X(\omega) = \pi$ for $|\omega| < 1$, zero outside.`, T`Parseval: $\displaystyle\int|x|^2dt = \frac{1}{2\pi}\int|X|^2d\omega$. The square of $x$ has a triangular spectrum, the rectangle convolved with itself.`],
    steps: [T`$\dfrac{1}{2\pi}\displaystyle\int_{-1}^{1}\pi^2\,d\omega = \pi$.`, T`$\mathcal F\{x^2\} = \dfrac{1}{2\pi}X * X = \pi\left(1 - \dfrac{|\omega|}{2}\right)$ for $|\omega| < 2$.`, T`$\dfrac{1}{2\pi}\displaystyle\int_{-2}^{2}\pi^2\left(1 - \frac{|\omega|}{2}\right)^2d\omega = \pi\cdot\frac23 = \frac{2\pi}{3}$.`],
    idea: 'Integrals that are awkward in time are trivial in frequency: Parseval turns a sinc into a rectangle and a sinc squared into a triangle.',
    prereq: 'Fourier transforms; Parseval’s theorem.',
    verify: () => { const f = n => 2 * NUM.simpson(t => t < 1e-9 ? 1 : (Math.sin(t) / t) ** n, 0, 4000, 200000); return [f(2) + 1 / 4000, f(4)]; } // tail of sin²/t² beyond 4000 adds about 1/4000
}, {
    title: 'The Gibbs overshoot',
    diagram: curve('time (periods)', 'partial sum', [0, 1], [-1.3, 1.3], x => { let s = 0; for (let k = 1; k <= 15; k += 2) s += 4 / Math.PI * Math.sin(2 * Math.PI * k * x) / k; return s; }),
    text: T`The Fourier series of a square wave that jumps between $-1$ and $+1$ is $\dfrac4\pi\left(\sin x + \tfrac{1}{3}\sin3x + \tfrac{1}{5}\sin5x + \cdots\right)$. As more terms are added, the partial sums overshoot next to each jump by an amount that does not shrink. Find the limiting peak value, and the overshoot as a fraction of the jump of $2$. (Use $\operatorname{Si}(\pi) = \int_0^\pi\frac{\sin t}{t}dt$.)`,
    parts: [ex('Peak value', 2 / Math.PI * NUM.simpson(t => t < 1e-12 ? 1 : Math.sin(t) / t, 0, Math.PI, 2000), T`\tfrac{2}{\pi}\operatorname{Si}(\pi)`), ex('Overshoot / jump', NUM.simpson(t => t < 1e-12 ? 1 : Math.sin(t) / t, 0, Math.PI, 2000) / Math.PI - .5, T`\tfrac{1}{\pi}\operatorname{Si}(\pi) - \tfrac{1}{2}`)],
    hints: [T`Differentiate the partial sum: $S_N'(x) = \dfrac4\pi\sum_{k\,\text{odd}}\cos kx$, whose first zero after the jump is at $x = \pi/(N + 1)$ for harmonics up to $N$.`, T`The peak value becomes a Riemann sum for $\dfrac2\pi\int_0^\pi\frac{\sin t}{t}dt$.`],
    steps: [T`At the first maximum, $S_N \to \dfrac2\pi\operatorname{Si}(\pi) \approx 1.1790$.`, T`Overshoot above $1$: $0.1790$, i.e. $\dfrac{0.1790}{2} \approx 8.95\,\%$ of the jump.`, T`More terms squeeze the ripple towards the jump but never lower it.`],
    idea: 'A truncated Fourier series always overshoots a jump by about 9%: this is a sharp cut-off in frequency, the same thing that gives brick-wall filters their ringing.',
    prereq: 'Fourier series; Riemann sums.',
    verify: () => { const M = 2000, S = x => { let s = 0; for (let k = 1; k <= M; k++) s += Math.sin((2 * k - 1) * x) / (2 * k - 1); return 4 / Math.PI * s; }; let lo = 0, hi = 3 * Math.PI / (2 * M * 2); const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 60; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (S(c) > S(d)) hi = d; else lo = c; } const pk = S((lo + hi) / 2); return [pk, (pk - 1) / 2]; }
}, {
    title: 'Sampling a band-pass signal slowly',
    diagram: sketch('A spectrum occupying 21 to 25 megahertz on a frequency axis from 0 to 30 megahertz.',
        arrow(80, 190, 660, 190) + `<rect x="${80 + 21 * 18}" y="90" width="${4 * 18}" height="100" fill="#e9eee6" stroke="#315740"/>` + [0, 10, 20, 30].map(f => wire(`M${80 + 18 * f} 190v8`)).join(''),
        [[80, 222, '0'], [260, 222, '10'], [440, 222, '20'], [620, 222, '30 MHz'], [494, 80, '21–25 MHz']], 240),
    text: T`A signal occupies only the band from $21$ to $25\,\text{MHz}$. Treated as a low-pass signal it would need sampling above $50\,\text{MHz}$. What is the lowest sampling rate at which its aliases do not overlap, so that it can still be recovered?`,
    parts: [ex('Lowest sampling rate', 25 / 3, T`\dfrac{25}{3}`, 'MHz'), ex('Low-pass Nyquist rate', 50, '50', 'MHz')],
    hints: [T`The band must fit inside one Nyquist zone $[k f_s/2, (k + 1)f_s/2]$.`, T`With bandwidth $B = 4\,\text{MHz}$, the largest usable zone index is $k = \lfloor f_H/B\rfloor$; then $f_s = 2f_H/(k + 1)$... check which $k$ applies.`],
    steps: [T`$f_H/B = 25/4$, so at most 6 bands of width $B$ fit below $f_H$: try $f_s = 2f_H/6 = \tfrac{25}{3}\,\text{MHz}$.`, T`Then $f_s/2 = 4.17\,\text{MHz}$ and zone 5 spans $20.8$ to $25\,\text{MHz}$: the band fits.`, T`So $f_s = \tfrac{25}{3} \approx 8.33\,\text{MHz}$, barely above $2B = 8\,\text{MHz}$, against $50\,\text{MHz}$ for low-pass sampling.`],
    idea: 'Nyquist is about bandwidth, not the highest frequency: a band-pass signal can be sampled near twice its width if the band sits inside one Nyquist zone.',
    prereq: 'Sampling and aliasing.',
    verify: () => { const ok = fs => Math.floor(2 * 21 / fs) >= Math.ceil(2 * 25 / fs - 1e-12) - 1; let lo = 8, hi = 8.4; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; } return [hi, 2 * 25]; }
}, {
    title: 'Convolving two pulses',
    diagram: sketch('A rectangle of height 2 and width 1 convolved with a rectangle of height 1 and width 3 gives a trapezoid.',
        wire('M60 190H220M300 190H460M520 190H700') + wire('M100 190V110H140V190') + wire('M330 190V150H430V190') + `<path d="M540 190L580 110H660L700 190" stroke="#aa492a" stroke-width="3"/>` + dt(260, 154, '∗') + dt(490, 154, '='),
        [[120, 100, '2'], [120, 214, 'width 1'], [380, 140, '1'], [380, 214, 'width 3'], [620, 100, 'peak ?'], [620, 214, 'width 4']], 230),
    text: T`A rectangular pulse of height $2$ and width $1$ is convolved with a rectangular pulse of height $1$ and width $3$. Find the peak value of the result, its area and its total duration.`,
    parts: [ex('Peak', 2, '2'), ex('Area', 6, '6'), ex('Duration', 4, '4')],
    hints: [T`Slide one pulse across the other: the output is the overlapping area.`, T`The area of a convolution is the product of the areas, and the durations add.`],
    steps: [T`Full overlap happens when the narrow pulse lies inside the wide one: area $2\times1\times1 = 2$.`, T`Area $= (2\times1)(1\times3) = 6$; duration $= 1 + 3 = 4$.`, T`The result is a trapezoid rising for 1, flat for 2 at height 2, and falling for 1.`],
    idea: 'Convolution multiplies areas and adds durations; its shape is set by sliding overlap, a trapezoid for two unequal rectangles.',
    prereq: 'Convolution.',
    verify: () => { const h = .001, a = Array.from({length: 1000}, () => 2), b = Array.from({length: 3000}, () => 1), c = Array(a.length + b.length - 1).fill(0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j += 1) c[i + j] += a[i] * b[j] * h; return [Math.max(...c), c.reduce((s, v) => s + v, 0) * h, c.filter(v => v > 1e-9).length * h]; }
}, {
    title: 'A one-pole recursive filter',
    diagram: drawing(arrow(60, 110, 200, 110) + ring(220, 110, 20) + dt(220, 116, '+') + arrow(240, 110, 560, 110) + wire('M480 110V200H430') + bkBox(360, 180, 70, 40, 'z⁻¹') + wire('M360 200H240') + arrow(220, 200, 220, 130) + wire('M240 200H220') + dt(300, 194, '× 0.9') + dt(70, 98, 'x[n]') + dt(590, 116, 'y[n]'),
        'A first-order recursive filter: the output is delayed one sample, scaled by 0.9 and added to the input', 240),
    text: T`A digital filter computes $y[n] = 0.9\,y[n-1] + x[n]$. Find its gain at DC, and the number of samples (allowing fractions) after which its impulse response has fallen to $1/e$ of its first value.`,
    parts: [ex('DC gain', 10, '10'), ex('Decay to 1/e', -1 / Math.log(.9), T`-1/\ln0.9`, 'samples')],
    hints: [T`$H(z) = \dfrac{1}{1 - 0.9z^{-1}}$; DC is $z = 1$.`, T`The impulse response is $0.9^n$.`],
    steps: [T`$H(1) = \dfrac{1}{1 - 0.9} = 10$.`, T`$0.9^n = e^{-1} \Rightarrow n = -\dfrac{1}{\ln0.9} \approx 9.49$ samples, close to $\dfrac{1}{1 - 0.9} = 10$.`],
    idea: 'A pole at z = a behaves like an RC time constant of about 1/(1 − a) samples, and its DC gain is the same 1/(1 − a).',
    prereq: 'Z-transforms; geometric series.',
    verify: () => { let y = 0; for (let n = 0; n < 2000; n++) y = .9 * y + 1; return [y, NUM.bisect(n => Math.exp(n * Math.log(.9)) - Math.exp(-1), 0, 50)]; }
}, {
    title: 'The narrowest time–frequency product',
    diagram: curve('t', 'g(t)', [-2, 2], [0, 1], t => Math.exp(-Math.PI * t * t)),
    text: T`The pulse $g(t) = e^{-\pi t^2}$ is its own Fourier transform: $G(f) = e^{-\pi f^2}$. Treating $|g|^2$ and $|G|^2$ as distributions, find the RMS duration $\sigma_t$ and the product $\sigma_t\sigma_f$.`,
    parts: [ex(T`$\sigma_t$`, 1 / (2 * Math.sqrt(Math.PI)), T`\dfrac{1}{2\sqrt{\pi}}`), ex(T`$\sigma_t\sigma_f$`, 1 / (4 * Math.PI), T`\dfrac{1}{4\pi}`)],
    hints: [T`$|g|^2 = e^{-2\pi t^2}$ is a Gaussian with variance $\dfrac{1}{4\pi}$.`, T`By symmetry $\sigma_f = \sigma_t$.`],
    steps: [T`$e^{-2\pi t^2} = e^{-t^2/(2\sigma^2)}$ with $\sigma^2 = \dfrac{1}{4\pi}$, so $\sigma_t = \dfrac{1}{2\sqrt\pi} \approx 0.282$.`, T`$\sigma_t\sigma_f = \dfrac{1}{4\pi}$, the smallest value the uncertainty principle allows.`],
    idea: 'No signal is both short and narrow-band: σ_t σ_f ≥ 1/(4π), with equality only for Gaussian pulses.',
    prereq: 'Fourier transforms; variance.',
    verify: () => { const g = t => Math.exp(-Math.PI * t * t), G = f => NUM.simpson(t => g(t) * Math.cos(2 * Math.PI * f * t), -6, 6, 600), sd = (h, L) => Math.sqrt(NUM.simpson(x => x * x * h(x) ** 2, -L, L, 400) / NUM.simpson(x => h(x) ** 2, -L, L, 400)), st = sd(g, 6); return [st, st * sd(G, 4)]; }
}, {
    title: 'A tone between two DFT bins',
    diagram: curve('offset from a bin (bins)', 'relative DFT amplitude', [-2, 2], [0, 1], x => Math.abs(x) < 1e-9 ? 1 : Math.abs(Math.sin(Math.PI * x) / (Math.PI * x))),
    text: T`A long DFT with a rectangular window analyses a pure tone. When the tone falls exactly halfway between two bins, by what factor is its peak bin amplitude reduced compared with a tone exactly on a bin? Express the loss in decibels too.`,
    parts: [ex('Amplitude factor', 2 / Math.PI, T`\dfrac{2}{\pi}`), ex('Loss in dB', 20 * Math.log10(2 / Math.PI), T`20\log_{10}(2/\pi)`, 'dB')],
    hints: [T`A rectangular window's response to a tone offset by $\delta$ bins is $\left|\dfrac{\sin\pi\delta}{\pi\delta}\right|$ (for a long DFT).`, T`Put $\delta = \tfrac{1}{2}$.`],
    steps: [T`$\dfrac{\sin(\pi/2)}{\pi/2} = \dfrac2\pi \approx 0.637$.`, T`$20\log_{10}(2/\pi) \approx -3.92\,\text{dB}$: the scalloping loss.`],
    idea: 'A DFT samples a continuous spectrum; between bins a tone loses up to 3.9 dB with a rectangular window, which flat-top windows trade resolution to avoid.',
    prereq: 'The DFT; spectral leakage.',
    verify: () => { const N = 1024, amp = k0 => { let re = 0, im = 0; for (let n = 0; n < N; n++) { re += Math.cos(2 * Math.PI * (k0 - 100) * n / N); im += Math.sin(2 * Math.PI * (k0 - 100) * n / N); } return Math.hypot(re, im); } /* a complex tone at k0 seen in bin 100 */, r = amp(100.5) / amp(100); return [r, 20 * Math.log10(r)]; }
}, {
    title: 'The Barker code’s quiet sidelobes',
    diagram: curve('lag', 'autocorrelation', [-6, 6], [-2, 8], k => { const b = [1, 1, 1, -1, -1, 1, -1]; let s = 0; for (let i = 0; i + Math.abs(k) < 7; i++) s += b[i] * b[i + Math.abs(k)]; return s; }, 'stem'),
    text: T`The 7-chip Barker code is $+1, +1, +1, -1, -1, +1, -1$. Find the peak of its aperiodic autocorrelation, and the largest magnitude of any sidelobe.`,
    parts: [exInt('Peak', 7), exInt('Largest sidelobe', 1)],
    hints: [T`At lag 0 every chip multiplies itself.`, T`At lag $k$, sum the $7 - k$ products of chips $k$ apart.`],
    steps: [T`Lag 0: $7$.`, T`Lags $1$ to $6$ give $0, -1, 0, -1, 0, -1$: no sidelobe exceeds $1$ in magnitude.`, T`A matched filter therefore compresses the code into one sharp peak, 7 times its sidelobes.`],
    idea: 'Barker codes have the smallest possible sidelobes, which is why radar and 802.11b use them to compress long pulses into sharp ones.',
    prereq: 'Correlation.',
    verify: () => { const b = [1, 1, 1, -1, -1, 1, -1], r = k => b.slice(0, 7 - k).reduce((s, v, i) => s + v * b[i + k], 0); return [r(0), Math.max(...[1, 2, 3, 4, 5, 6].map(k => Math.abs(r(k))))]; }
}, {
    title: 'Initial and final values without inverting',
    diagram: curve('t', 'x(t)', [0, 6], [0, 1.6], t => 1.5 - 2 * Math.exp(-t) + .5 * Math.exp(-2 * t)),
    text: T`A signal has the Laplace transform $X(s) = \dfrac{s + 3}{s(s + 1)(s + 2)}$. Without inverting it, find $x(\infty)$, $x(0^+)$ and $\dot x(0^+)$.`,
    parts: [ex(T`$x(\infty)$`, 1.5, T`\dfrac{3}{2}`), ex(T`$x(0^+)$`, 0, '0'), ex(T`$\dot x(0^+)$`, 1, '1')],
    hints: [T`Final value theorem: $x(\infty) = \lim_{s\to0}sX(s)$ (valid here: the other poles are in the left half-plane).`, T`Initial value theorem: $x(0^+) = \lim_{s\to\infty}sX(s)$, and $\dot x(0^+) = \lim_{s\to\infty}s\bigl(sX(s) - x(0^+)\bigr)$.`],
    steps: [T`$sX = \dfrac{s + 3}{(s + 1)(s + 2)} \to \dfrac{3}{2}$ as $s \to 0$.`, T`As $s \to \infty$, $sX \to 0$, so $x(0^+) = 0$.`, T`$s^2X = \dfrac{s(s + 3)}{(s + 1)(s + 2)} \to 1$, so $\dot x(0^+) = 1$. (Indeed $x = \tfrac{3}{2} - 2e^{-t} + \tfrac{1}{2}e^{-2t}$.)`],
    idea: 'The limits s → 0 and s → ∞ read the end and the start of a signal straight from its transform.',
    prereq: 'Laplace transforms; limit theorems.',
    verify: () => { const f = (t, [a, b]) => [b, -2 * a - 3 * b + 1], y = st => 3 * st[0] + st[1], end = rk4(f, [0, 0], 0, 30, 30000), h = 1e-5, early = rk4(f, [0, 0], 0, h, 10); return [y(end[end.length - 1][1]), y([0, 0]), y(early[early.length - 1][1]) / h]; } // controllable form of (s + 3)/((s + 1)(s + 2)) driven by a unit step
}, {
    title: 'Harmonics of a rectified sine',
    diagram: curve('time (periods of the sine)', '|sin|', [0, 2], [0, 1], x => Math.abs(Math.sin(2 * Math.PI * x))),
    text: T`A full-wave rectifier turns $\sin\omega t$ into $|\sin\omega t|$. Find its DC value and the amplitude of its lowest AC harmonic (at $2\omega$).`,
    parts: [ex('DC value', 2 / Math.PI, T`\dfrac{2}{\pi}`), ex(T`Amplitude at $2\omega$`, 4 / (3 * Math.PI), T`\dfrac{4}{3\pi}`)],
    hints: [T`$|\sin\theta|$ has period $\pi$, so only even harmonics of $\omega$ appear.`, T`$a_2 = \dfrac2\pi\displaystyle\int_0^\pi\sin\theta\cos2\theta\,d\theta$.`],
    steps: [T`DC: $\dfrac1\pi\displaystyle\int_0^\pi\sin\theta\,d\theta = \dfrac2\pi \approx 0.637$.`, T`$\displaystyle\int_0^\pi\sin\theta\cos2\theta\,d\theta = -\tfrac{2}{3}$, so the $2\omega$ term is $-\dfrac{4}{3\pi}\cos2\omega t$: amplitude $\dfrac{4}{3\pi} \approx 0.424$.`],
    idea: 'Rectification moves power to DC and even harmonics; the ripple at twice the line frequency is what the smoothing capacitor must remove.',
    prereq: 'Fourier series.',
    verify: () => { const a0 = NUM.simpson(x => Math.abs(Math.sin(x)), 0, 2 * Math.PI, 4000) / (2 * Math.PI), a2 = NUM.simpson(x => Math.abs(Math.sin(x)) * Math.cos(2 * x), 0, 2 * Math.PI, 4000) / Math.PI; return [a0, Math.abs(a2)]; }
}, {
    title: 'Zeros of a moving average',
    diagram: curve('ω / π', '|H|', [0, 1], [0, 1], x => { const w = Math.PI * x; return w < 1e-9 ? 1 : Math.abs(Math.sin(2 * w) / (4 * Math.sin(w / 2))); }),
    text: T`A four-point moving average computes $y[n] = \tfrac{1}{4}(x[n] + x[n-1] + x[n-2] + x[n-3])$. Find the lowest frequency it removes completely, in radians per sample, and its gain at $\omega = \pi/4$.`,
    parts: [ex('First zero', Math.PI / 2, T`\dfrac{\pi}{2}`, 'rad/sample'), ex(T`Gain at $\pi/4$`, 1 / (2 * Math.sqrt(2 - Math.SQRT2)), T`1/(2\sqrt{2-\sqrt2})`)],
    hints: [T`$|H(\omega)| = \left|\dfrac{\sin(2\omega)}{4\sin(\omega/2)}\right|$.`, T`$\sin(\pi/8) = \tfrac{1}{2}\sqrt{2 - \sqrt2}$.`],
    steps: [T`Zeros where $\sin2\omega = 0$ with $\omega \ne 0$: first at $\omega = \pi/2$ (a period of 4 samples averages to zero).`, T`At $\pi/4$: $\dfrac{\sin(\pi/2)}{4\sin(\pi/8)} = \dfrac{1}{2\sqrt{2 - \sqrt2}} \approx 0.653$.`],
    idea: 'A moving average nulls every sinusoid whose period divides its length: the basis of comb filters and mains-hum rejection.',
    prereq: 'Frequency response of FIR filters.',
    verify: () => { const Hc = w => [0, 1, 2, 3].reduce((acc, k) => ca(acc, cp(.25, -w * k * 180 / Math.PI)), cx(0)), amp = w => cm(Hc(w), cp(1, 1.5 * w * 180 / Math.PI)).re; return [NUM.bisect(amp, .5, 2), cabs(Hc(Math.PI / 4))]; } // the zero-phase amplitude changes sign at the zero
}]);

/* ================= CONTROL SYSTEMS ================= */
bankMore('control', 'advanced', [{
    title: 'Following a ramp',
    diagram: hardFeedbackDiagram('gain 1', 'G(s) = 10/(s(s + 2))'),
    text: T`A unity-feedback loop has the open-loop transfer function $G(s) = \dfrac{10}{s(s + 2)}$. Find its velocity error constant $K_v$ and the steady-state error when the reference is a unit ramp, $r(t) = t$.`,
    parts: [ex(T`$K_v$`, 5, '5', '1/s'), ex('Ramp error', .2, T`\dfrac{1}{5}`)],
    hints: [T`$K_v = \lim_{s\to0}sG(s)$.`, T`A type-1 loop follows a ramp with a constant lag $e_{ss} = 1/K_v$.`],
    steps: [T`$K_v = \lim_{s\to0}\dfrac{10}{s + 2} = 5\,\text{s}^{-1}$.`, T`$e_{ss} = 1/5 = 0.2$: the output follows the ramp $0.2\,\text{s}$ behind.`],
    idea: 'Each integrator in the loop removes one more order of steady-state error: a single integrator follows steps exactly and ramps with a fixed lag.',
    prereq: 'Final value theorem; system type.',
    verify: () => { const tr = rk4((t, [y, v]) => [v, -2 * v + 10 * (t - y)], [0, 0], 0, 40, 40000), [t, [y]] = tr[tr.length - 1], s = 1e-9; return [s * 10 / (s * (s + 2)), t - y]; }
}, {
    title: 'The gain at which a loop starts to ring forever',
    diagram: hardFeedbackDiagram('K', '1/(s(s + 1)(s + 2))'),
    text: T`A unity-feedback loop has $G(s) = \dfrac{K}{s(s + 1)(s + 2)}$. Find the gain $K$ at which the closed loop becomes marginally stable, and the frequency of the resulting oscillation.`,
    parts: [ex('Critical gain', 6, '6'), ex('Oscillation frequency', Math.SQRT2, T`\sqrt2`, 'rad/s')],
    hints: [T`Characteristic equation: $s^3 + 3s^2 + 2s + K = 0$.`, T`Routh: a row of zeros appears when $3\cdot2 = K$; the auxiliary equation $3s^2 + K = 0$ gives the frequency.`],
    steps: [T`The Routh array's $s^1$ entry is $\dfrac{6 - K}{3}$, zero at $K = 6$.`, T`Auxiliary: $3s^2 + 6 = 0 \Rightarrow s = \pm j\sqrt2$.`, T`So the loop oscillates at $\sqrt2\,\text{rad/s}$ when $K = 6$, and is unstable beyond.`],
    idea: 'Three lags make any high-gain loop unstable; the Routh array finds the limit and the frequency without solving a cubic.',
    prereq: 'Routh–Hurwitz criterion.',
    verify: () => { const maxRe = K => Math.max(...NUM.polyRoots([1, 3, 2, K]).map(z => z.re)), Kc = NUM.bisect(maxRe, 1, 20); return [Kc, Math.max(...NUM.polyRoots([1, 3, 2, Kc]).map(z => Math.abs(z.im)))]; }
}, {
    title: 'The overshoot of a 45° damped system',
    diagram: curve('time (s)', 'step response', [0, 8], [0, 1.2], t => 1 - Math.exp(-t) * (Math.cos(t) + Math.sin(t))),
    text: T`A second-order system $\dfrac{\omega_n^2}{s^2 + 2\zeta\omega_ns + \omega_n^2}$ has $\zeta = 1/\sqrt2$ and $\omega_n = \sqrt2\,\text{rad/s}$, so its poles sit at $45^\circ$ from the negative real axis. Find the percentage overshoot of its step response and the time of the peak.`,
    parts: [ex('Overshoot', 100 * Math.exp(-Math.PI), T`100e^{-\pi}`, '%'), ex('Peak time', Math.PI, T`\pi`, 's')],
    hints: [T`Overshoot $= e^{-\pi\zeta/\sqrt{1-\zeta^2}}$.`, T`Peak time $= \pi/\omega_d$ with $\omega_d = \omega_n\sqrt{1 - \zeta^2}$.`],
    steps: [T`$\zeta/\sqrt{1 - \zeta^2} = 1$, so the overshoot is $e^{-\pi} \approx 4.32\,\%$.`, T`$\omega_d = \sqrt2\cdot\tfrac{1}{\sqrt2} = 1\,\text{rad/s}$, so $t_p = \pi\,\text{s}$.`],
    idea: 'Overshoot depends only on the angle of the poles: at 45° it is e^{−π}, about 4%, a common design target.',
    prereq: 'Second-order step response.',
    verify: () => { const tr = rk4((t, [y, v]) => [v, 2 - 2 * v - 2 * y], [0, 0], 0, 10, 20000); let b = tr[0]; for (const p of tr) if (p[1][0] > b[1][0]) b = p; return [100 * (b[1][0] - 1), b[0]]; }
}, {
    title: 'Proportional control of a first-order plant',
    diagram: hardFeedbackDiagram('K = 9', '1/(s + 1)'),
    text: T`A plant $\dfrac{1}{s + 1}$ is controlled by a proportional gain $K = 9$ in a unity-feedback loop. Find the closed-loop time constant and the steady-state error for a unit step. What gain would cut the error to $1\,\%$?`,
    parts: [ex('Time constant', .1, T`\dfrac{1}{10}`, 's'), ex('Step error', .1, T`\dfrac{1}{10}`), ex(T`Gain for $1\,\%$`, 99, '99')],
    hints: [T`Closed loop: $\dfrac{K}{s + 1 + K}$.`, T`Steady-state error $\dfrac{1}{1 + K}$.`],
    steps: [T`Pole at $-10$: time constant $0.1\,\text{s}$, ten times faster than the plant.`, T`Final output $\tfrac{9}{10}$, so the error is $\tfrac1{10}$.`, T`$\dfrac{1}{1 + K} = 0.01 \Rightarrow K = 99$.`],
    idea: 'Proportional control speeds a plant up but always leaves an error of 1/(1 + K); only integral action removes it.',
    prereq: 'First-order systems; feedback.',
    verify: () => { const tr = rk4((t, [y]) => [-y + 9 * (1 - y)], [0], 0, 3, 30000), yf = tr[tr.length - 1][1][0], lvl = yf * (1 - Math.exp(-1)); let t63 = 0; tr.forEach(([t, [y]], i) => { if (!t63 && y >= lvl) { const [t0, [y0]] = tr[i - 1]; t63 = t0 + (t - t0) * (lvl - y0) / (y - y0); } }); return [t63, 1 - yf, NUM.bisect(K => 1 / (1 + K) - .01, 1, 1000)]; }
}, {
    title: 'Gain margin of three equal lags',
    diagram: hardFeedbackDiagram('K', '1/(s + 1)³'),
    text: T`For $G(s) = \dfrac{1}{(s + 1)^3}$ in a unity-feedback loop, find the frequency at which the open-loop phase reaches $-180^\circ$ and the gain margin there (as a factor).`,
    parts: [ex('Phase-crossover frequency', Math.sqrt(3), T`\sqrt3`, 'rad/s'), ex('Gain margin', 8, '8')],
    hints: [T`Each lag contributes $-\arctan\omega$; three of them reach $-180^\circ$ when $\arctan\omega = 60^\circ$.`, T`$|G| = (1 + \omega^2)^{-3/2}$.`],
    steps: [T`$\omega = \tan60^\circ = \sqrt3\,\text{rad/s}$.`, T`$|G(j\sqrt3)| = 4^{-3/2} = \tfrac{1}{8}$, so the gain can rise by a factor $8$ ($18.1\,\text{dB}$) before instability.`],
    idea: 'Gain margin is how far the loop gain can grow before the −180° point reaches −1; equal lags make it a neat power of the magnitude.',
    prereq: 'Bode and Nyquist plots.',
    verify: () => { const G = w => { let z = cx(1); for (let i = 0; i < 3; i++) z = cd(z, cx(1, w)); return z; }, w = NUM.bisect(x => G(x).im, .5, 3); return [w, 1 / cabs(G(w))]; }
}, {
    title: 'Placing the poles of a double integrator',
    diagram: bkSPlane([[-2, 2, 's = −2 + 2j'], [-2, -2, 's = −2 − 2j', 12, 22]], wire('M420 130L320 50') + guide('M420 130L320 210'), 'The desired closed-loop poles of the double integrator at −2 ± 2j'),
    text: T`A double integrator $\ddot x = u$ is controlled by state feedback $u = -k_1x - k_2\dot x$. Choose $k_1$ and $k_2$ to place the closed-loop poles at $-2 \pm 2j$.`,
    parts: [ex(T`$k_1$`, 8, '8'), ex(T`$k_2$`, 4, '4')],
    hints: [T`Closed loop: $\ddot x + k_2\dot x + k_1x = 0$, characteristic polynomial $s^2 + k_2s + k_1$.`, T`Desired: $(s + 2)^2 + 4 = s^2 + 4s + 8$.`],
    steps: [T`Matching coefficients: $k_2 = 4$, $k_1 = 8$.`, T`These poles give $\zeta = 1/\sqrt2$ and $\omega_n = 2\sqrt2\,\text{rad/s}$.`],
    idea: 'With full state feedback on a controllable system, the closed-loop poles can be put anywhere: just match the characteristic polynomial.',
    prereq: 'State-space models; characteristic polynomials.',
    verify: () => { const A = [[0, 1], [0, 0]], A2 = NUM.matMul(A, A), phi = A2.map((r, i) => r.map((v, j) => v + 4 * A[i][j] + 8 * (i === j ? 1 : 0))), Ci = [[0, 1], [1, 0]], K = NUM.matMul(Ci, phi)[1]; return [K[0], K[1]]; } // Ackermann: K = [0 1] C⁻¹ φ(A), with C = [B AB]
}, {
    title: 'LQR for a double integrator',
    diagram: drawing(bkChain([[200, 90, '1/s'], [380, 90, '1/s']], 90) + arrow(80, 118, 200, 118) + arrow(470, 118, 600, 118) + wire('M540 118V210H140V118') + dt(330, 232, 'u = −k₁x − k₂ẋ') + dt(100, 106, 'u') + dt(335, 106, 'ẋ') + dt(620, 112, 'x'),
        'A double integrator with state feedback to its input', 245),
    text: T`For $\ddot x = u$, find the state feedback $u = -k_1x - k_2\dot x$ that minimises $\displaystyle J = \int_0^\infty\left(x^2 + \dot x^2 + u^2\right)dt$, and the damping ratio of the resulting closed loop.`,
    parts: [ex(T`$k_1$`, 1, '1'), ex(T`$k_2$`, Math.sqrt(3), T`\sqrt3`), ex('Damping ratio', Math.sqrt(3) / 2, T`\dfrac{\sqrt3}{2}`)],
    hints: [T`The algebraic Riccati equation $A^\top P + PA - PBB^\top P + Q = 0$ with $P = \begin{pmatrix}a & b\\ b & c\end{pmatrix}$ gives $b^2 = 1$, $2b - c^2 + 1 = 0$, $a = bc$.`, T`$K = B^\top P = (b,\ c)$.`],
    steps: [T`$b = 1$ (for $P > 0$), then $c^2 = 3$, $c = \sqrt3$, and $a = \sqrt3$.`, T`$k_1 = 1$, $k_2 = \sqrt3$.`, T`Closed loop $s^2 + \sqrt3s + 1$: $\omega_n = 1$, $\zeta = \tfrac{\sqrt3}{2} \approx 0.87$.`],
    idea: 'LQR turns a choice of weights into gains through the Riccati equation, and it always yields a well-damped, robust loop.',
    prereq: 'State space; the Riccati equation.',
    verify: () => { let a = 1, b = 0, c = 1; const h = 1e-3; for (let i = 0; i < 60000; i++) { const da = -b * b + 1, db = a - b * c, dc = 2 * b - c * c + 1; a += h * da; b += h * db; c += h * dc; } return [b, c, c / 2]; } // integrate the Riccati differential equation to its steady state
}, {
    title: 'A plant seen through a sample-and-hold',
    diagram: drawing(bkChain([[150, 100, 'hold'], [330, 120, '1/(s + 1)'], [530, 90, 'sample']], 90) + arrow(60, 118, 150, 118) + arrow(620, 118, 690, 118) + dt(90, 104, 'u[k]') + dt(680, 104, 'x[k]') + dt(380, 210, 'sampling period T = ln 2 s'),
        'A zero-order hold, a first-order plant and a sampler in series', 230),
    text: T`The plant $\dfrac{1}{s + 1}$ is driven through a zero-order hold and sampled every $T = \ln2\,\text{s}$, giving $x[k+1] = a\,x[k] + b\,u[k]$. Find $a$ and $b$.`,
    parts: [ex(T`$a$`, .5, T`\dfrac{1}{2}`), ex(T`$b$`, .5, T`\dfrac{1}{2}`)],
    hints: [T`Over one period with constant input, $x(T) = e^{-T}x(0) + (1 - e^{-T})u$.`, T`$e^{-\ln2} = \tfrac{1}{2}$.`],
    steps: [T`$a = e^{-T} = \tfrac{1}{2}$.`, T`$b = 1 - e^{-T} = \tfrac{1}{2}$, so the DC gain $b/(1 - a) = 1$ is preserved.`],
    idea: 'Exact discretisation maps each continuous pole s to e^{sT}, and keeps the DC gain.',
    prereq: 'Discrete-time systems; first-order responses.',
    verify: () => { const step = (x0, u) => { const tr = rk4((t, [x]) => [-x + u], [x0], 0, Math.LN2, 2000); return tr[tr.length - 1][1][0]; }; return [step(1, 0), step(0, 1)]; }
}, {
    title: 'Where the root locus leaves the axis',
    diagram: bkSPlane([[0, 0, '0', 8, -10], [-2, 0, '−2', 8, -10]], `<path d="M320 130H420" stroke="#aa492a" stroke-width="3"/>` + `<path d="M370 130V30M370 130V230" stroke="#aa492a" stroke-width="3"/>` + dot(370, 130), 'Root locus of K over s(s + 2): the poles meet at −1 and leave the axis vertically'),
    text: T`For $G(s) = \dfrac{K}{s(s + 2)}$ under unity feedback, the two closed-loop poles start at $0$ and $-2$ as $K$ rises from zero. Where do they meet and leave the real axis, and at what gain?`,
    parts: [ex('Breakaway point', -1, '-1'), ex('Gain there', 1, '1')],
    hints: [T`Closed loop: $s^2 + 2s + K = 0$, roots $-1 \pm \sqrt{1 - K}$.`, T`They meet when the discriminant vanishes.`],
    steps: [T`$1 - K = 0$: the poles meet at $s = -1$ with $K = 1$.`, T`For $K > 1$ they move vertically along $\operatorname{Re}s = -1$: faster oscillation, constant decay rate.`],
    idea: 'Root loci leave the real axis where two poles collide, here midway between the open-loop poles, which is also where the response becomes critically damped.',
    prereq: 'Root locus; quadratic roots.',
    verify: () => { const im = K => Math.max(...NUM.polyRoots([1, 2, K]).map(z => Math.abs(z.im))), K = NUM.bisect(k => im(k) > 0 ? 1 : -1, .5, 2); return [NUM.polyRoots([1, 2, K + 1e-9])[0].re, K]; }
}, {
    title: 'How much phase a lead network can add',
    diagram: curve('log₁₀ ω (rad/s)', 'phase (°)', [-1, 2], [0, 60], x => (Math.atan(10 ** x) - Math.atan(10 ** x / 9)) * 180 / Math.PI),
    text: T`A lead compensator $C(s) = \dfrac{1 + s}{1 + s/9}$ adds positive phase between its zero at $1\,\text{rad/s}$ and its pole at $9\,\text{rad/s}$. Find the frequency of maximum phase lead and the maximum phase, in degrees.`,
    parts: [ex('Frequency', 3, '3', 'rad/s'), ex('Maximum phase', 180 / Math.PI * Math.atan(4 / 3), T`\dfrac{180}{\pi}\arctan\dfrac{4}{3}`, '°')],
    hints: [T`The phase is $\arctan\omega - \arctan(\omega/9)$; it peaks at the geometric mean of $1$ and $9$.`, T`$\tan(\alpha - \beta) = \dfrac{\tan\alpha - \tan\beta}{1 + \tan\alpha\tan\beta}$.`],
    steps: [T`$\omega_{\max} = \sqrt{1\cdot9} = 3\,\text{rad/s}$.`, T`$\tan\varphi = \dfrac{3 - 1/3}{1 + 1} = \dfrac{4}{3}$, so $\varphi = \arctan\tfrac{4}{3} \approx 53.1^\circ$ (equivalently $\arcsin\tfrac{9 - 1}{9 + 1}$).`],
    idea: 'A lead network’s phase peaks midway between zero and pole on a log scale, and the pole–zero ratio alone fixes how much.',
    prereq: 'Bode phase; trigonometric identities.',
    verify: () => { const ph = w => cd(cx(1, w), cx(1, w / 9)), arg = w => Math.atan2(ph(w).im, ph(w).re); let lo = .1, hi = 50; const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 80; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (arg(c) > arg(d)) hi = d; else lo = c; } const w = (lo + hi) / 2; return [w, arg(w) * 180 / Math.PI]; }
}, {
    title: 'Stabilising an unstable pole',
    diagram: bkSPlane([[1, 0, 'open loop +1', 8, -12], [-2, 0, 'K = 3: −2', -40, -12]], arrow(460, 150, 330, 150), 'The closed-loop pole moving from +1 to −2 as the gain rises'),
    text: T`An unstable plant $\dfrac{1}{s - 1}$ is put under unity feedback with a proportional gain $K$. Find the smallest $K$ that makes the loop stable, and the closed-loop pole when $K = 3$.`,
    parts: [ex('Minimum gain', 1, '1'), ex(T`Pole at $K = 3$`, -2, '-2')],
    hints: [T`Closed loop: $\dfrac{K}{s - 1 + K}$.`, T`Stable when the pole $1 - K$ is negative.`],
    steps: [T`The pole is at $s = 1 - K$: stable for $K > 1$.`, T`$K = 3$: pole at $-2$, a time constant of $0.5\,\text{s}$.`],
    idea: 'Feedback can stabilise an unstable plant, but only above a minimum gain; that gain must be held even when sensors or actuators saturate.',
    prereq: 'Closed-loop poles; stability.',
    verify: () => { const pole = K => NUM.polyRoots([1, K - 1])[0].re; return [NUM.bisect(pole, 0, 5), pole(3)]; }
}]);

/* ================= SENSORS & ESTIMATION ================= */
bankMore('sensors', 'advanced', [{
    title: 'A quadrature encoder’s resolution',
    diagram: sketch('Two square waves A and B a quarter period apart, as produced by a quadrature encoder.',
        `<path d="M80 80${Array.from({length: 6}, () => 'h40v-40h40v40').join('')}h20" stroke="#aa492a"/>` + `<path d="M80 170h20${Array.from({length: 6}, () => 'v-40h40v40h40').join('')}" stroke="#aa492a"/>`,
        [[60, 70, 'A'], [60, 160, 'B'], [360, 214, 'every edge of A or B is a count']], 230),
    text: T`An optical encoder has $1024$ lines per revolution and two channels in quadrature, counting every edge of both. How many counts per revolution does it give, what is its angular resolution in degrees, and what count rate does it produce at $3000\,\text{rpm}$?`,
    parts: [exInt('Counts per revolution', 4096), ex('Resolution', 45 / 512, T`\dfrac{45}{512}`, '°'), exInt('Count rate', 204800, 'counts/s')],
    hints: [T`Each line gives a rising and a falling edge on each of the two channels.`, T`$3000\,\text{rpm} = 50\,\text{rev/s}$.`],
    steps: [T`$4\times1024 = 4096$ counts per revolution.`, T`$360^\circ/4096 = \tfrac{45}{512} \approx 0.088^\circ$.`, T`$50\times4096 = 204800$ counts per second.`],
    idea: 'Quadrature both multiplies resolution by four and tells direction: the order of the edges says which way it turns.',
    prereq: 'Rotational kinematics.',
    verify: () => { let edges = 0, pa = 1, pb = 1; const N = 1024, S = 100; for (let i = 1; i <= N * S; i++) { const ph = i / S, a = (ph % 1) < .5 ? 1 : 0, b = ((ph + .25) % 1) < .5 ? 1 : 0; if (a !== pa) edges++; if (b !== pb) edges++; pa = a; pb = b; } return [edges, 360 / edges, 50 * edges]; }
}, {
    title: 'Tilt from an accelerometer',
    diagram: sketch('An accelerometer tilted 30 degrees, with gravity split into components along and across its sensing axis.',
        wire('M240 200L460 73') + arrow(360, 80, 360, 200) + guide('M360 200L420 165') + dt(380, 70, 'g'),
        [[240, 222, 'sensing axis tilted θ'], [470, 150, 'reads g sin θ'], [600, 210, 'reads 0.5 g']], 240),
    text: T`A single-axis accelerometer at rest reads $0.5\,g$ along its sensing axis. What is its tilt from horizontal? If its reading has noise of $0.01\,g$, what is the resulting tilt uncertainty in radians?`,
    parts: [ex('Tilt', 30, '30', '°'), ex('Tilt uncertainty', .02 / Math.sqrt(3), T`\dfrac{0.02}{\sqrt3}`, 'rad')],
    hints: [T`At rest it measures the component of gravity along its axis: $a = g\sin\theta$.`, T`$\delta\theta = \dfrac{\delta a}{g\cos\theta}$.`],
    steps: [T`$\sin\theta = 0.5 \Rightarrow \theta = 30^\circ$.`, T`$\delta\theta = \dfrac{0.01}{\cos30^\circ} = \dfrac{0.02}{\sqrt3} \approx 0.0115\,\text{rad} \approx 0.66^\circ$.`, T`Near vertical, $\cos\theta \to 0$ and the single-axis method fails; a second axis and $\operatorname{atan2}$ fix it.`],
    idea: 'An accelerometer measures tilt through gravity; its sensitivity falls as cos θ, so one axis alone is blind near vertical.',
    prereq: 'Vectors; small-error analysis.',
    verify: () => { const th = Math.asin(.5), h = 1e-7; return [th * 180 / Math.PI, .01 * (Math.asin(.5 + h) - Math.asin(.5 - h)) / (2 * h)]; }
}, {
    title: 'The time constant hiding in a complementary filter',
    diagram: drawing(bkChain([[150, 110, 'integrate'], [330, 120, 'high-pass']], 50, 50) + bkBox(330, 160, 120, 50, 'low-pass') + arrow(60, 75, 150, 75) + arrow(60, 185, 330, 185) + ring(540, 130, 18) + dt(540, 136, '+') + wire('M450 75H540V112M450 185H540V148') + arrow(558, 130, 650, 130) + dt(80, 62, 'gyro') + dt(80, 172, 'accel') + dt(660, 118, 'angle'),
        'A complementary filter: the integrated gyro is high-passed, the accelerometer angle low-passed, and the two summed', 235),
    text: T`A complementary filter runs every $\Delta t = 0.01\,\text{s}$ as $\theta_k = \alpha(\theta_{k-1} + \omega_k\Delta t) + (1 - \alpha)a_k$, with $\alpha = 0.98$, where $\omega_k$ is the gyro rate and $a_k$ the accelerometer angle. The accelerometer path is a first-order low-pass with pole $\alpha$. Find its time constant, $-\Delta t/\ln\alpha$, and the crossover frequency $1/(2\pi\tau)$ between trusting the accelerometer and trusting the gyro.`,
    parts: [ex('Time constant', -.01 / Math.log(.98), T`-0.01/\ln0.98`, 's'), ex('Crossover frequency', -Math.log(.98) / (.02 * Math.PI), T`-\ln0.98/(0.02\pi)`, 'Hz')],
    hints: [T`With $\omega = 0$ the filter is $\theta_k = \alpha\theta_{k-1} + (1 - \alpha)a_k$, whose step response is $1 - \alpha^k$.`, T`$\alpha^k = e^{-k\Delta t/\tau}$.`],
    steps: [T`$\tau = -\dfrac{0.01}{\ln0.98} \approx 0.495\,\text{s}$ (close to $\dfrac{\alpha\Delta t}{1 - \alpha} = 0.49\,\text{s}$).`, T`$f_c = \dfrac{1}{2\pi\tau} \approx 0.32\,\text{Hz}$: slower motion comes from the accelerometer, faster from the gyro.`],
    idea: 'A complementary filter splits the spectrum: low frequencies from the drift-free but noisy sensor, high frequencies from the smooth but drifting one.',
    prereq: 'First-order filters; exponentials.',
    verify: () => { let th = 0, k = 0, prev = 0; const target = 1 - Math.exp(-1); while (th < target) { prev = th; th = .98 * th + .02; k++; } const tau = (k - 1 + (target - prev) / (th - prev)) * .01; return [tau, 1 / (2 * Math.PI * tau)]; } // run the filter on a step and time it to 1 − 1/e
}, {
    title: 'Reading an NTC thermistor',
    diagram: curve('temperature (°C)', 'R (kΩ)', [0, 100], [0, 35], T => 10 * Math.exp(3950 * (1 / (T + 273.15) - 1 / 298.15))),
    text: T`An NTC thermistor follows $R = R_{25}\exp\!\left(B\left(\dfrac1T - \dfrac1{298.15}\right)\right)$ with $R_{25} = 10\,\text{k}\Omega$ and $B = 3950\,\text{K}$ ($T$ in kelvin). At what temperature has its resistance fallen to $R_{25}/e$? What is its sensitivity $\dfrac1R\dfrac{dR}{dT}$ at $25\,{}^\circ\text{C}$, in percent per kelvin?`,
    parts: [ex(T`$T$ for $R_{25}/e$`, 1 / (1 / 298.15 - 1 / 3950), T`1/(1/298.15-1/3950)`, 'K'), ex('Sensitivity at 25 °C', -395000 / 298.15 ** 2, T`-395000/298.15^2`, '%/K')],
    hints: [T`$R = R_{25}/e$ means the exponent equals $-1$.`, T`$\dfrac{d\ln R}{dT} = -\dfrac{B}{T^2}$.`],
    steps: [T`$\dfrac1T = \dfrac1{298.15} - \dfrac1{3950} \Rightarrow T \approx 322.5\,\text{K}$ ($49.3\,{}^\circ\text{C}$).`, T`$-\dfrac{3950}{298.15^2} \approx -0.0444\,\text{K}^{-1}$, i.e. $-4.44\,\%/\text{K}$, ten times a platinum RTD.`],
    idea: 'A thermistor’s resistance is exponential in 1/T, giving large but temperature-dependent sensitivity: high resolution, nonlinear calibration.',
    prereq: 'Exponentials; logarithmic derivatives.',
    verify: () => { const R = T => 1e4 * Math.exp(3950 * (1 / T - 1 / 298.15)), h = 1e-4; return [NUM.bisect(T => R(T) - 1e4 / Math.E, 280, 400), 100 * (R(298.15 + h) - R(298.15 - h)) / (2 * h) / R(298.15)]; }
}, {
    title: 'Locating a robot from three ranges',
    diagram: sketch('Three beacons A at the origin, B at (4, 0) and C at (0, 3), with measured ranges to an unknown position.',
        guide('M200 220L400 70M400 220L400 70M200 70L400 70') + dot(200, 220) + dot(400, 220) + dot(200, 70) + ring(400, 70, 7),
        [[180, 242, 'A (0, 0)'], [420, 242, 'B (4, 0)'], [160, 64, 'C (0, 3)'], [290, 160, '5'], [420, 150, '3'], [300, 60, '4'], [470, 64, 'robot ?']], 260),
    text: T`Beacons sit at A $(0, 0)$, B $(4, 0)$ and C $(0, 3)$ metres. A robot measures ranges of $5\,\text{m}$ to A, $3\,\text{m}$ to B and $4\,\text{m}$ to C. Where is it?`,
    parts: [ex(T`$x$`, 4, '4', 'm'), ex(T`$y$`, 3, '3', 'm')],
    hints: [T`Each range gives a circle: $x^2 + y^2 = 25$, $(x - 4)^2 + y^2 = 9$, $x^2 + (y - 3)^2 = 16$.`, T`Subtracting pairs of circles removes the squares and leaves straight lines.`],
    steps: [T`First minus second: $8x - 16 = 16 \Rightarrow x = 4$.`, T`First minus third: $6y - 9 = 9 \Rightarrow y = 3$.`, T`Position $(4, 3)$; three circles fix it uniquely in a plane.`],
    idea: 'Trilateration becomes linear when you subtract range equations, which is how GPS and indoor positioning solve for position.',
    prereq: 'Coordinate geometry; simultaneous equations.',
    verify: () => { let p = [1, 1]; const B = [[0, 0, 5], [4, 0, 3], [0, 3, 4]]; for (let it = 0; it < 50; it++) { const J = B.map(([bx, by]) => { const d = Math.hypot(p[0] - bx, p[1] - by); return [(p[0] - bx) / d, (p[1] - by) / d]; }), r = B.map(([bx, by, R]) => Math.hypot(p[0] - bx, p[1] - by) - R), JtJ = [[0, 0], [0, 0]], Jtr = [0, 0]; J.forEach((row, i) => { for (let a = 0; a < 2; a++) { Jtr[a] += row[a] * r[i]; for (let b = 0; b < 2; b++) JtJ[a][b] += row[a] * row[b]; } }); const d = NUM.solve(JtJ, Jtr); p = [p[0] - d[0], p[1] - d[1]]; } return p; } // Gauss–Newton on the three ranges
}, {
    title: 'Odometry of a differential-drive robot',
    diagram: sketch('A robot turning on a circular arc, its left wheel travelling 1 metre and its right wheel 1.5 metres.',
        `<path d="M200 220A150 150 0 0 1 330 80" stroke="#aa492a" stroke-width="3"/>` + guide('M200 220L350 220L330 80') + dot(350, 220) + wire('M180 210h40v20h-40z'),
        [[200, 248, 'start'], [360, 244, 'centre of turn'], [520, 120, 'left wheel 1 m'], [520, 150, 'right wheel 1.5 m'], [520, 180, 'track 0.5 m']], 262),
    text: T`A differential-drive robot with wheels $0.5\,\text{m}$ apart moves so that its left wheel rolls $1\,\text{m}$ and its right wheel $1.5\,\text{m}$, both at constant speed. Find its change of heading, the radius of the arc followed by its centre, and the straight-line distance between start and end.`,
    parts: [ex('Heading change', 1, '1', 'rad'), ex('Radius of the arc', 1.25, T`\dfrac{5}{4}`, 'm'), ex('Start-to-end distance', 2.5 * Math.sin(.5), T`\tfrac{5}{2}\sin\tfrac{1}{2}`, 'm')],
    hints: [T`$\Delta\theta = \dfrac{s_R - s_L}{b}$ with track width $b$.`, T`The centre travels $\dfrac{s_R + s_L}{2}$ along an arc of radius $R = \dfrac{s_c}{\Delta\theta}$; the chord is $2R\sin\dfrac{\Delta\theta}{2}$.`],
    steps: [T`$\Delta\theta = \dfrac{0.5}{0.5} = 1\,\text{rad} \approx 57^\circ$.`, T`$s_c = 1.25\,\text{m}$, so $R = 1.25\,\text{m}$.`, T`Chord $= 2.5\sin0.5 \approx 1.199\,\text{m}$.`],
    idea: 'Wheel odometry turns two distances into a pose; a small error in track width becomes a heading error that grows into a large position error.',
    prereq: 'Arc length; kinematics of rolling.',
    verify: () => { let x = 0, y = 0, th = 0; const N = 100000; for (let i = 0; i < N; i++) { const dl = 1 / N, dr = 1.5 / N, ds = (dl + dr) / 2, dth = (dr - dl) / .5; x += ds * Math.cos(th + dth / 2); y += ds * Math.sin(th + dth / 2); th += dth; } return [th, (1 + 1.5) / 2 / th, Math.hypot(x, y)]; }
}, {
    title: 'An accelerometer off the spin axis',
    diagram: sketch('A disc spinning at 300 rpm with an accelerometer mounted 10 centimetres from its axis.',
        ring(300, 130, 100) + dot(300, 130) + wire('M300 130H390') + wire('M384 122h14v16h-14z') + `<path d="M230 50A110 110 0 0 1 370 50" />` + arrow(360, 44, 372, 52),
        [[345, 120, '0.1 m'], [300, 12, '300 rpm'], [560, 136, 'reads ω²r inward']], 250),
    text: T`An accelerometer is mounted $0.1\,\text{m}$ from the axis of a disc spinning at $300\,\text{rpm}$. What centripetal acceleration does it read? At what speed in rpm would it read exactly $1\,g$ ($9.81\,\text{m/s}^2$)?`,
    parts: [ex('Acceleration', 10 * Math.PI ** 2, T`10\pi^2`, 'm/s²'), ex(T`Speed for $1\,g$`, 30 * Math.sqrt(98.1) / Math.PI, T`30\sqrt{98.1}/\pi`, 'rpm')],
    hints: [T`$a = \omega^2r$ with $\omega = 2\pi n/60$.`, T`$\omega = \sqrt{g/r}$, then $n = 60\omega/(2\pi)$.`],
    steps: [T`$\omega = 10\pi\,\text{rad/s}$: $a = 100\pi^2\times0.1 = 10\pi^2 \approx 98.7\,\text{m/s}^2$, about $10\,g$.`, T`$\omega = \sqrt{98.1} \approx 9.90\,\text{rad/s}$, i.e. $\dfrac{30\sqrt{98.1}}{\pi} \approx 94.6\,\text{rpm}$.`],
    idea: 'An off-axis accelerometer measures ω²r as well as gravity; IMUs must sit near the rotation centre or correct for it.',
    prereq: 'Circular motion.',
    verify: () => { const pos = (w, t) => [.1 * Math.cos(w * t), .1 * Math.sin(w * t)], acc = w => { const h = 1e-5, [a0] = pos(w, -h), [a1] = pos(w, 0), [a2] = pos(w, h); return Math.abs((a0 - 2 * a1 + a2) / (h * h)); }; return [acc(10 * Math.PI), NUM.bisect(n => acc(2 * Math.PI * n / 60) - 9.81, 10, 300) ]; }
}, {
    title: 'A thermometer that lags',
    diagram: curve('time (s)', 'lag behind the true temperature (°C)', [0, 60], [0, 11], t => 10 * (1 - Math.exp(-t / 10))),
    text: T`A thermometer behaves as a first-order system with time constant $10\,\text{s}$. In a bath whose temperature rises steadily at $1\,{}^\circ\text{C/s}$, by how much does its reading lag once settled? After a sudden step in temperature, how long does it take to show $99\,\%$ of the change?`,
    parts: [ex('Steady lag', 10, '10', '°C'), ex(T`Time to $99\,\%$`, 20 * Math.LN10, T`20\ln10`, 's')],
    hints: [T`For a ramp input, a first-order system settles to the same ramp delayed by $\tau$.`, T`Step response $1 - e^{-t/\tau} = 0.99$.`],
    steps: [T`Lag $= \text{rate}\times\tau = 1\times10 = 10\,{}^\circ\text{C}$.`, T`$t = \tau\ln100 = 20\ln10 \approx 46\,\text{s}$, nearly five time constants.`],
    idea: 'A first-order sensor reads a ramp late by exactly one time constant; “settled” to 1% takes about 4.6 τ.',
    prereq: 'First-order systems.',
    verify: () => { const ramp = rk4((t, [y]) => [(t - y) / 10], [0], 0, 200, 20000), [t, [y]] = ramp[ramp.length - 1], step = rk4((t, [z]) => [(1 - z) / 10], [0], 0, 60, 60000); let t99 = 0; for (const [s, [z]] of step) if (!t99 && z >= .99) t99 = s; return [t - y, t99]; }
}, {
    title: 'Matching an exponential filter to a moving average',
    diagram: curve('age of sample (samples)', 'weight', [0, 15], [0, .25], k => .2 * .8 ** k, 'stem'),
    text: T`An exponential filter $y_k = \alpha x_k + (1 - \alpha)y_{k-1}$ should reduce white noise exactly as much as a 9-point moving average. Find $\alpha$, the noise variance ratio (output over input), and the mean age of the samples it weights (its delay).`,
    parts: [ex(T`$\alpha$`, .2, T`\dfrac{1}{5}`), ex('Variance ratio', 1 / 9, T`\dfrac{1}{9}`), ex('Mean delay', 4, '4', 'samples')],
    hints: [T`The exponential filter's weights are $\alpha(1 - \alpha)^k$; the sum of their squares is $\dfrac{\alpha}{2 - \alpha}$.`, T`The moving average gives $1/N$ and a mean delay of $(N - 1)/2$; the exponential filter's mean delay is $(1 - \alpha)/\alpha$.`],
    steps: [T`$\dfrac{\alpha}{2 - \alpha} = \dfrac{1}{9} \Rightarrow \alpha = \dfrac{2}{N + 1} = \tfrac{1}{5}$.`, T`Variance ratio $\tfrac{1}{9}$ for both.`, T`Mean delay $(1 - 0.2)/0.2 = 4$ samples, the same as the moving average's $(9 - 1)/2$.`],
    idea: 'α = 2/(N + 1) makes an exponential filter equal to an N-point average in both noise reduction and lag, with one multiply and no buffer.',
    prereq: 'Geometric series; variance of weighted sums.',
    verify: () => { const a = .2, w = Array.from({length: 400}, (_, k) => a * (1 - a) ** k); return [NUM.bisect(x => x / (2 - x) - 1 / 9, .01, 1), w.reduce((s, v) => s + v * v, 0), w.reduce((s, v, k) => s + k * v, 0)]; }
}, {
    title: 'Calibrating a magnetometer’s hard-iron offset',
    diagram: sketch('Four magnetometer readings lying on a circle whose centre is offset from the origin.',
        wire('M150 140H570M360 250V20') + `<circle cx="340" cy="120" r="80" stroke="#83968b" stroke-dasharray="5 5"/>` + [[30, 10], [-10, 50], [-50, 10], [-10, -30]].map(([x, y]) => dot(360 + 2 * x, 140 - 2 * y)).join('') + wire('M335 115l10 10m0 -10l-10 10'),
        [[600, 146, 'Bx'], [384, 24, 'By'], [470, 116, '(30, 10)'], [272, 40, '(−10, 50)'], [212, 116, '(−50, 10)'], [340, 226, '(−10, −30)']], 260),
    text: T`A magnetometer is turned slowly through a full circle in a horizontal plane. Its readings $(B_x, B_y)$ in $\mu\text{T}$ include $(30, 10)$, $(-10, 50)$, $(-50, 10)$ and $(-10, -30)$; ideally they would lie on a circle around the origin. Find the hard-iron offset (the circle's centre) and the true horizontal field strength.`,
    parts: [ex('Offset in x', -10, '-10', 'µT'), ex('Offset in y', 10, '10', 'µT'), ex('Field strength', 40, '40', 'µT')],
    hints: [T`A fixed magnet nearby adds a constant vector to every reading, shifting the circle.`, T`Opposite points on the circle average to its centre.`],
    steps: [T`$(30, 10)$ and $(-50, 10)$ average to $(-10, 10)$; so do $(-10, 50)$ and $(-10, -30)$.`, T`Centre $(-10, 10)\,\mu\text{T}$: subtract it from every reading.`, T`Radius: distance from the centre to any point, $40\,\mu\text{T}$.`],
    idea: 'Nearby ferromagnetic parts add a constant offset that turns the circle of readings off-centre; fitting the circle removes it.',
    prereq: 'Circles; least squares.',
    verify: () => { const P = [[30, 10], [-10, 50], [-50, 10], [-10, -30]], A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0]; for (const [x, y] of P) { const r = [x, y, 1], z = x * x + y * y; for (let i = 0; i < 3; i++) { b[i] += r[i] * z; for (let j = 0; j < 3; j++) A[i][j] += r[i] * r[j]; } } const [D, E, F] = NUM.solve(A, b), cx0 = D / 2, cy0 = E / 2; return [cx0, cy0, Math.sqrt(F + cx0 * cx0 + cy0 * cy0)]; } // algebraic circle fit x² + y² = Dx + Ey + F
}, {
    title: 'Bayes’ rule for a door sensor',
    diagram: sketch('A corridor with three possible positions, one of them in front of a door.',
        wire('M120 180H600') + [180, 360, 540].map(x => wire(`M${x - 50} 180v-20h100v20`)).join('') + wire('M330 160V70h60v90'),
        [[180, 210, 'wall'], [360, 210, 'door'], [540, 210, 'wall'], [360, 50, 'prior: 1/3 at each place']], 230),
    text: T`A robot is equally likely to be at any of three places in a corridor, one of which is in front of a door. Its door sensor fires with probability $0.9$ at the door and $0.2$ elsewhere. After one firing, what is the probability that it is at the door? After a second, independent firing?`,
    parts: [ex('After one firing', 9 / 13, T`\dfrac{9}{13}`), ex('After two firings', 81 / 89, T`\dfrac{81}{89}`)],
    hints: [T`$P(\text{door}\mid\text{fire}) = \dfrac{P(\text{fire}\mid\text{door})P(\text{door})}{P(\text{fire})}$.`, T`$P(\text{fire}) = 0.9\cdot\tfrac{1}{3} + 0.2\cdot\tfrac{2}{3}$. For two firings square the likelihoods.`],
    steps: [T`$\dfrac{0.3}{0.3 + 0.1\overline3} = \dfrac{9}{13} \approx 0.69$.`, T`Two firings: $\dfrac{0.81/3}{0.81/3 + 0.04\cdot2/3} = \dfrac{81}{89} \approx 0.91$.`],
    idea: 'Each measurement multiplies the belief by its likelihood and renormalises; this is the update step inside every Bayes and particle filter.',
    prereq: 'Conditional probability; Bayes’ rule.',
    verify: () => { const post = n => { const pd = 1 / 3 * .9 ** n, po = 2 / 3 * .2 ** n; return pd / (pd + po); }; return [post(1), post(2)]; }
}]);
