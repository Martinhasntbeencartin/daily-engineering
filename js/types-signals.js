/* Signals & systems: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (numerical integration, an FFT, search). */
const SIGNALS_READING = {title: 'Signals and Systems (MIT OpenCourseWare 6.003)', url: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/'};
addTypes('signals', 'university', signalsPulseFourier, signalsDFT, signalsDifferenceEq);
addTypes('signals', 'challenge', signalsBandpassSampling, signalsWindowFIR, signalsEnergySpectrum);
addTypes('signals', 'expert', signalsToneEstimate);
addTypes('signals', 'mastery', signalsWiener);

/* A radix-2 FFT (recursive), used by the verifications. Input: arrays of real and imaginary parts. */
function sigFFT(re, im) {
    const n = re.length;
    if (n === 1) return [re.slice(), im.slice()];
    const [er, ei] = sigFFT(re.filter((_, i) => i % 2 === 0), im.filter((_, i) => i % 2 === 0)), [or, oi] = sigFFT(re.filter((_, i) => i % 2), im.filter((_, i) => i % 2));
    const R = Array(n), I = Array(n);
    for (let k = 0; k < n / 2; k++) {
        const c = Math.cos(-2 * Math.PI * k / n), s = Math.sin(-2 * Math.PI * k / n), tr = c * or[k] - s * oi[k], ti = c * oi[k] + s * or[k];
        R[k] = er[k] + tr; I[k] = ei[k] + ti; R[k + n / 2] = er[k] - tr; I[k + n / 2] = ei[k] - ti;
    }
    return [R, I];
}
const sigBlocks = (labels, caption, label) => {
    const w = 640 / labels.length;
    return drawing(labels.map((t, i) => wire(`M${45 + i * w + 10} 95h${w - 20}v70h${-(w - 20)}z`) + dt(45 + i * w + w / 2, 136, t) + (i ? arrow(45 + i * w - 10, 130, 45 + i * w + 10, 130) : '')).join('') + dt(365, 220, caption), label, 240);
};

/* Level 2: Fourier series of a rectangular pulse train, and Parseval's theorem. */
function signalsPulseFourier(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pulse-fourier', date, SIGNALS_READING), p = part;
    const [A, Tms, d] = grid(steps(1, 10, 1), [.1, .2, .5, 1, 2, 5], [.1, .15, .2, .25, .3, .35, .4, .45]);
    const an = n => Math.abs(2 * A / (n * Math.PI) * Math.sin(n * Math.PI * d)), DC = A * d, P = A * A * d;
    const frac = (DC * DC + [1, 2, 3, 4, 5].reduce((s, n) => s + an(n) ** 2 / 2, 0)) / P, fnull = 1 / (d * Tms), f0 = 1 / Tms;
    const w = Math.max(14, d * 180), pulses = [180, 360, 540].map(c => `H${c - w / 2}V80H${c + w / 2}V180`).join('');
    const diagram = drawing(wire('M50 200H680') + wire(`M50 180${pulses}H670`) + dt(690, 206, 't') + guide('M180 60V220M360 60V220') + arrow(270, 236, 360, 236) + arrow(270, 236, 180, 236) + dt(270, 256, 'T') +
        dt(540, 66, 'τ = dT') + arrow(40, 180, 40, 80) + dt(26, 136, 'A') + dt(180, 200 + 0, ''), 'A periodic train of rectangular pulses of height A and width τ = dT, repeating every T', 262);
    return q({
        title: 'The spectrum of a pulse train',
        text: T`A periodic train of rectangular pulses (height $A = ${A}\,\text{V}$, period $T = ${Tms}\,\text{ms}$, duty cycle $d = ${d}$, each pulse centred on $t = kT$) drives a $1\,\Omega$ load. Write its trigonometric Fourier series $x(t) = a_0 + \sum a_n\cos(2\pi nt/T)$. Find the DC value, the amplitudes $|a_1|$ and $|a_3|$, the average power, and the fraction of that power carried by the DC term and the first five harmonics together. Finally find the frequency of the first zero of the spectral envelope.`,
        givens: [T`$A = ${A}\,\text{V}$, $T = ${Tms}\,\text{ms}$ ($f_0 = ${tf(f0)}\,\text{kHz}$)`, T`Duty cycle $d = ${d}$`, T`Even pulses (centred on $t = kT$)`],
        parts: [p('DC value', DC, 'V'), p(T`$|a_1|$`, an(1), 'V'), p(T`$|a_3|$`, an(3), 'V'), p('Average power', P, 'W'), p('Power in DC + first five harmonics', 100 * frac, '%'), p('First zero of the envelope', fnull, 'kHz')],
        hints: [T`$a_0 = Ad$ and, for an even pulse, $a_n = \dfrac{2}{T}\displaystyle\int_{-\tau/2}^{\tau/2}A\cos\frac{2\pi nt}{T}\,dt = \dfrac{2A}{n\pi}\sin(n\pi d)$.`, T`Average power is $\dfrac1T\displaystyle\int x^2\,dt = A^2d$. Parseval: $P = a_0^2 + \sum_n a_n^2/2$.`, T`The envelope $\sin(\pi f\tau)/(\pi f\tau)$ first vanishes at $f = 1/\tau$.`],
        steps: [T`$a_0 = ${tf(DC)}\,\text{V}$; $|a_1| = ${tf(an(1))}\,\text{V}$; $|a_3| = ${tf(an(3))}\,\text{V}$.`, T`$P = A^2d = ${tf(P)}\,\text{W}$.`, T`$a_0^2 + \tfrac12(a_1^2 + \cdots + a_5^2) = ${tf(frac * P)}\,\text{W}$, i.e. $${tf(100 * frac)}\%$ of the power.`, T`$1/\tau = 1/(${d}\times${Tms}\,\text{ms}) = ${tf(fnull)}\,\text{kHz}$.`],
        idea: 'Narrow pulses spread their power over many harmonics: the spectrum’s first null moves out to 1/τ as the pulse gets shorter.',
        diagram, prerequisites: 'Fourier series; Parseval’s theorem.',
        verify: () => { // coefficients by numerical integration over one pulse; the null by bisection on the envelope
            const Tt = Tms, tau = d * Tt, coef = n => 2 / Tt * NUM.simpson(t => A * Math.cos(2 * Math.PI * n * t / Tt), -tau / 2, tau / 2, 2000);
            const pw = NUM.simpson(() => A * A, -tau / 2, tau / 2, 10) / Tt, dc = NUM.simpson(() => A, -tau / 2, tau / 2, 10) / Tt;
            const part5 = dc * dc + [1, 2, 3, 4, 5].reduce((s, n) => s + coef(n) ** 2 / 2, 0);
            return [dc, Math.abs(coef(1)), Math.abs(coef(3)), pw, 100 * part5 / pw, NUM.bisect(f => Math.sin(Math.PI * f * tau), .5 / tau, 1.5 / tau, 200)];
        }
    });
}

/* Level 2: an 8-point DFT by hand. */
function signalsDFT(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'dft', date, SIGNALS_READING), p = part, N = 8;
    const v = steps(-3, 3, 1), [x0, x1, x2, x3, x4, x5, x6, x7, fs] = grid(v, v, v, v, v, v, v, v, [8, 16, 48]), x = [x0, x1, x2, x3, x4, x5, x6, x7];
    const X = k => x.reduce((s, xn, n) => ({re: s.re + xn * Math.cos(2 * Math.PI * k * n / N), im: s.im - xn * Math.sin(2 * Math.PI * k * n / N)}), {re: 0, im: 0});
    const X0 = x.reduce((s, xn) => s + xn, 0), X1 = X(1), X2 = X(2), E = N * x.reduce((s, xn) => s + xn * xn, 0);
    const diagram = curve('n', 'x[n]', [0, 7], [-3.5, 3.5], n => x[n], 'stem');
    return q({
        title: 'An 8-point DFT by hand',
        text: T`The eight samples below were taken at $f_s = ${fs}\,\text{kHz}$. Compute their DFT $X[k] = \sum_{n=0}^{7}x[n]e^{-j2\pi kn/8}$. Give $X[0]$, the real and imaginary parts of $X[1]$, and $|X[2]|$. Use Parseval's relation to find $\sum_k|X[k]|^2$ without computing every bin. Which analogue frequency does bin $k = 3$ represent?`,
        givens: [T`$x[n] = (${x.join(',\\ ')})$ for $n = 0, \ldots, 7$`, T`$f_s = ${fs}\,\text{kHz}$, $N = 8$`],
        parts: [p(T`$X[0]$`, X0, '', 0), p(T`$\operatorname{Re}X[1]$`, X1.re, '', .01, .001), p(T`$\operatorname{Im}X[1]$`, X1.im, '', .01, .001), p(T`$|X[2]|$`, Math.hypot(X2.re, X2.im), '', .01, .001), p(T`$\sum_k|X[k]|^2$`, E, '', 0), p('Frequency of bin 3', 3 * fs / N, 'kHz')],
        hints: [T`$e^{-j2\pi kn/8}$ takes only eight values: $1$, $\tfrac{1-j}{\sqrt2}$, $-j$, $\tfrac{-1-j}{\sqrt2}$, $-1$, … For $k = 2$ they are $1, -j, -1, j$ repeating.`, T`$X[0]$ is just the sum of the samples.`, T`Parseval for the DFT: $\sum_k|X[k]|^2 = N\sum_n|x[n]|^2$. Bin $k$ sits at $kf_s/N$.`],
        steps: [T`$X[0] = ${X0}$.`, T`$X[1] = ${tc(X1)}$.`, T`$X[2] = (x_0 - x_2 + x_4 - x_6) - j(x_1 - x_3 + x_5 - x_7) = ${tc(X2)}$, so $|X[2]| = ${tf(Math.hypot(X2.re, X2.im))}$.`, T`$\sum|X[k]|^2 = 8\sum x[n]^2 = ${E}$; bin 3 is at $3\times${fs}/8 = ${tf(3 * fs / N)}\,\text{kHz}$.`],
        idea: 'A DFT correlates the samples with N equally spaced complex tones; for small N the twiddle factors are simple enough to do by hand.',
        diagram, prerequisites: 'Complex exponentials; the DFT; Parseval’s theorem.',
        verify: () => { const [R, I] = sigFFT(x, Array(8).fill(0)); return [Math.round(R[0]), R[1], I[1], Math.hypot(R[2], I[2]), Math.round(R.reduce((s, r, k) => s + r * r + I[k] * I[k], 0)), 3 * fs / 8]; }
    });
}

/* Level 2: a second-order difference equation: poles, DC gain, step response and frequency response. */
function signalsDifferenceEq(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'difference-eq', date, SIGNALS_READING), p = part;
    const [r, th, b0, b1] = grid([.5, .6, .7, .8, .9], [20, 30, 45, 60, 90, 120, 135], [.5, 1, 2], [-.5, 0, .5, 1]);
    const a1 = +(2 * r * Math.cos(th * Math.PI / 180)).toFixed(4) + 0, a2 = +(-r * r).toFixed(4), pre = a1 / 2, pim = Math.sqrt(-a2 - pre * pre), mag = Math.hypot(pre, pim), ang = Math.atan2(pim, pre) * 180 / Math.PI;
    const dc = (b0 + b1) / (1 - a1 - a2), y = [];
    for (let n = 0; n <= 3; n++) y.push(a1 * (y[n - 1] || 0) + a2 * (y[n - 2] || 0) + b0 + (n >= 1 ? b1 : 0));
    const Hj = Math.hypot(b0, b1) / Math.hypot(1 + a2, a1), sg = (c, s) => (c < 0 ? ' - ' : ' + ') + `${Math.abs(c)}${s}`;
    const eqn = `y[n] = ${a1}\\,y[n-1]${sg(a2, '\\,y[n-2]')}${sg(b0, '\\,x[n]')}${b1 ? sg(b1, '\\,x[n-1]') : ''}`;
    const diagram = drawing(arrow(40, 90, 120, 90) + dt(60, 74, 'x[n]') + wire('M120 70h60v40h-60z') + dt(150, 96, 'b₀') + arrow(180, 90, 300, 90) + ring(320, 90, 20) + dt(320, 96, 'Σ') + arrow(340, 90, 660, 90) + dt(640, 74, 'y[n]') +
        wire('M560 90V140') + wire('M530 140h60v40h-60z') + dt(560, 166, 'z⁻¹') + wire('M560 180V210') + wire('M530 210h60v40h-60z') + dt(560, 236, 'z⁻¹') + wire('M530 160H420M530 230H400') + wire('M360 140h60v40h-60zM340 210h60v40h-60z') +
        dt(390, 166, 'a₁') + dt(370, 236, 'a₂') + arrow(360, 160, 328, 110) + arrow(340, 230, 318, 112) + wire('M80 90V160') + wire('M50 160h60v40h-60z') + dt(80, 186, 'z⁻¹') + wire('M80 200V230H180') + wire('M180 210h60v40h-60z') + dt(210, 236, 'b₁') + arrow(240, 230, 310, 108),
        'Direct-form block diagram: x[n] through b0, and x[n−1] through b1, into a summing node; the output y[n] is fed back through one and two delays with gains a1 and a2', 262);
    return q({
        title: 'A recursive filter from its difference equation',
        text: T`A digital filter obeys $$${eqn},$$ starting from rest. Find the magnitude and angle of its poles, its DC gain, the output $y[3]$ when the input is a unit step ($x[n] = 1$ for $n \ge 0$), and the gain $|H(e^{j\omega})|$ at $\omega = \pi/2$ (a quarter of the sampling rate).`,
        givens: [T`$a_1 = ${a1}$, $a_2 = ${a2}$`, T`$b_0 = ${b0}$, $b_1 = ${b1}$`, 'Zero initial conditions'],
        parts: [p('Pole magnitude', mag, ''), p('Pole angle', ang, '°'), p('DC gain', dc, ''), p(T`$y[3]$ for a unit step`, y[3], '', .01, .001), p(T`$|H(e^{j\pi/2})|$`, Hj, '')],
        hints: [T`$H(z) = \dfrac{b_0 + b_1z^{-1}}{1 - a_1z^{-1} - a_2z^{-2}}$. The poles solve $z^2 - a_1z - a_2 = 0$.`, T`For complex poles, $|p|^2 = -a_2$ and $\cos\angle p = \dfrac{a_1}{2|p|}$. The DC gain is $H(1)$.`, T`Run the recursion: $y[0] = b_0$, $y[1] = a_1y[0] + b_0 + b_1$, … At $\omega = \pi/2$, $z = j$ and $z^{-1} = -j$.`],
        steps: [T`Poles $${tf(pre)} \pm j${tf(pim)}$: $|p| = ${tf(mag)}$ at $\pm${tf(ang)}^\circ$ (inside the unit circle, so stable).`, T`$H(1) = \dfrac{${b0} + ${b1}}{1 - ${a1} - (${a2})} = ${tf(dc)}$.`, T`$y[0..3] = ${y.map(v => tf(v)).join(',\\ ')}$.`, T`$|H(j)| = \dfrac{|b_0 - jb_1|}{|1 + a_2 + ja_1|} = ${tf(Hj)}$.`],
        idea: 'A difference equation, its transfer function and its poles are three views of one filter; the poles alone tell you stability and how fast the response rings.',
        diagram, prerequisites: 'Z-transforms; complex roots; recursion.',
        verify: () => { // poles by Newton in the complex plane; y[3] by convolving the impulse response; |H| by summing cosines and sines
            let z = cx(.1, .9); for (let i = 0; i < 100; i++) { const f = cs(cs(cm(z, z), cm(cx(a1), z)), cx(a2)), df = cs(cm(cx(2), z), cx(a1)); z = cs(z, cd(f, df)); }
            const h = []; for (let n = 0; n < 4; n++) h.push(a1 * (h[n - 1] || 0) + a2 * (h[n - 2] || 0) + (n === 0 ? b0 : n === 1 ? b1 : 0));
            const w = Math.PI / 2, B = [b0 + b1 * Math.cos(w), -b1 * Math.sin(w)], Ad = [1 - a1 * Math.cos(w) - a2 * Math.cos(2 * w), a1 * Math.sin(w) + a2 * Math.sin(2 * w)];
            return [cabs(z), Math.abs(cphase(z)), (b0 + b1) / (1 - a1 - a2), h.reduce((s, v) => s + v, 0), Math.hypot(...B) / Math.hypot(...Ad)];
        }
    });
}

/* Level 3: bandpass (undersampling) sampling: the lowest alias-free rate. Units: kHz. */
function signalsBandpassSampling(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'bandpass-sampling', date, SIGNALS_READING), p = part;
    const [fL, B, pos] = grid(steps(20, 200, 5), [4, 5, 8, 10, 12.5, 15, 20], [.25, .5, .75]), fH = fL + B, f0 = fL + pos * B;
    const nmax = Math.floor(fH / B + 1e-9), fs = 2 * fH / nmax, rem = f0 % fs, alias = rem <= fs / 2 ? rem : fs - rem, inv = (nmax - 1) % 2;
    // Zoom on the band: from two zones below it to one zone above, so the zone boundaries around it are visible.
    const lo = Math.max(0, (nmax - 2) * fs / 2), hi = (nmax + 1) * fs / 2, X = f => 60 + 600 * (f - lo) / (hi - lo), zones = [];
    for (let k = Math.ceil(lo / (fs / 2) - 1e-9); k <= Math.floor(hi / (fs / 2) + 1e-9); k++) zones.push(guide(`M${X(k * fs / 2)} 120V200`) + dt(X(k * fs / 2), 112, `${k}·fₛ/2`));
    const diagram = drawing(wire('M60 200H680') + dt(690, 206, 'f') + wire(`M${X(fL)} 200V140H${X(fH)}V200`) + dt((X(fL) + X(fH)) / 2, 170, 'band') + dt(X(fL), 226, 'fL') + dt(X(fH), 226, 'fH') +
        zones.join('') + dt(360, 252, 'dashed: Nyquist-zone boundaries at the lowest valid fₛ'), 'Spectrum of a bandpass signal between fL and fH, with the Nyquist zone boundaries around it for the chosen sampling rate', 262);
    return q({
        title: 'Sample a bandpass signal below its Nyquist rate',
        text: T`A signal occupies only $f_L = ${fL}$ to $f_H = ${fH}\,\text{kHz}$. Sampling a lowpass signal would need $2f_H$. Bandpass sampling only requires the band to fit inside one Nyquist zone $[k f_s/2,\ (k+1)f_s/2]$, which allows $\dfrac{2f_H}{n} \le f_s \le \dfrac{2f_L}{n - 1}$ for integers $1 \le n \le \lfloor f_H/B\rfloor$. Find the lowpass Nyquist rate, the largest usable $n$, and the lowest alias-free sampling rate. At that rate, to which frequency does a component at $${f0}\,\text{kHz}$ alias? Is the band spectrally inverted after sampling (enter $1$ for yes, $0$ for no)?`,
        givens: [T`$f_L = ${fL}\,\text{kHz}$, $f_H = ${fH}\,\text{kHz}$, $B = ${B}\,\text{kHz}$`, T`Test component at $${f0}\,\text{kHz}$`],
        parts: [p('Lowpass Nyquist rate', 2 * fH, 'kHz'), p(T`Largest $n$`, nmax, '', 0), p('Lowest alias-free sampling rate', fs, 'kHz'), p('Alias of the test component', alias, 'kHz'), p('Spectrally inverted? (1/0)', inv, '', 0)],
        hints: [T`The band must not straddle a multiple of $f_s/2$. The tightest choice puts $f_H$ exactly on the $n$-th boundary: $f_s = 2f_H/n$.`, T`A frequency $f$ appears at $f - mf_s$ folded into $[0, f_s/2]$; subtract the nearest multiple of $f_s$ and take the magnitude.`, T`Bands in odd-numbered zones ($k = 1, 3, \ldots$, counting from 0) come out mirror-imaged.`],
        steps: [T`$2f_H = ${tf(2 * fH)}\,\text{kHz}$.`, T`$\lfloor f_H/B\rfloor = \lfloor ${tf(fH / B)}\rfloor = ${nmax}$, so $f_s = 2\times${fH}/${nmax} = ${tf(fs)}\,\text{kHz}$ (check: $2f_L/(n-1) = ${nmax > 1 ? tf(2 * fL / (nmax - 1)) : '\\infty'}$).`, T`$${f0} \bmod ${tf(fs)} = ${tf(rem)}$, folded: $${tf(alias)}\,\text{kHz}$.`, T`The band lies in zone $k = ${nmax - 1}$, ${inv ? 'odd: inverted' : 'even: not inverted'}.`],
        idea: 'A bandpass signal needs a sampling rate set by its bandwidth, not its highest frequency — provided the band falls cleanly inside one Nyquist zone.',
        diagram, prerequisites: 'Sampling theorem; aliasing; modular arithmetic.',
        verify: () => { // scan sampling rates upward for the first one that puts the band inside a single zone
            const ok = f => Math.floor(fL / (f / 2) + 1e-12) === Math.ceil(fH / (f / 2) - 1e-12) - 1;
            let f = 2 * B; while (f <= 2 * fH + 1e-9 && !ok(f)) f += .001;
            let lo2 = f - .001, hi2 = f; for (let i = 0; i < 60; i++) { const mid = (lo2 + hi2) / 2; if (ok(mid)) hi2 = mid; else lo2 = mid; } // refine the zone boundary
            f = hi2;
            const k = Math.floor(fL / (f / 2) + 1e-12), r2 = ((f0 % f) + f) % f, al = Math.min(r2, f - r2);
            return [2 * fH, Math.round(2 * fH / f), f, al, k % 2];
        }
    });
}

/* Level 3: a windowed-sinc FIR low-pass filter (normalised frequency, cycles per sample). */
function signalsWindowFIR(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'window-fir', date, SIGNALS_READING), p = part;
    const [fc, N, win, dfs] = grid([.05, .075, .1, .125, .15, .2, .25], [11, 15, 19, 21, 25, 31, 41], ['rectangular', 'Hann', 'Hamming'], [.05, .1, .15]);
    const M = (N - 1) / 2, wf = {rectangular: () => 1, Hann: n => .5 - .5 * Math.cos(2 * Math.PI * n / (N - 1)), Hamming: n => .54 - .46 * Math.cos(2 * Math.PI * n / (N - 1))}[win];
    const h = Array.from({length: N}, (_, n) => { const k = n - M; return (k === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * k) / (Math.PI * k)) * wf(n); });
    const H = f => Math.hypot(h.reduce((s, v, n) => s + v * Math.cos(2 * Math.PI * f * n), 0), h.reduce((s, v, n) => s + v * Math.sin(2 * Math.PI * f * n), 0)), dc = h.reduce((s, v) => s + v, 0), fsb = +(fc + dfs).toFixed(4);
    const gc = 20 * Math.log10(H(fc) / Math.abs(dc)), gs = 20 * Math.log10(H(fsb) / Math.abs(dc)), lo = Math.min(...h), hi = Math.max(...h);
    const diagram = curve('tap n', 'h[n]', [0, N - 1], [+(Math.min(lo, 0) - .05).toFixed(2), +(hi + .05).toFixed(2)], n => h[Math.round(n)], 'stem');
    return q({
        title: 'Design an FIR low-pass by windowing',
        text: T`Truncate the ideal low-pass impulse response $h_d[k] = \dfrac{\sin(2\pi f_ck)}{\pi k}$ (with $h_d[0] = 2f_c$, frequencies in cycles per sample) to $N = ${N}$ taps centred on $k = 0$, and multiply by a ${win} window $w[n]$, $n = 0, \ldots, ${N - 1}$${win === 'rectangular' ? '' : win === 'Hann' ? T` ($w = 0.5 - 0.5\cos\frac{2\pi n}{N - 1}$)` : T` ($w = 0.54 - 0.46\cos\frac{2\pi n}{N - 1}$)`}. The cutoff is $f_c = ${fc}$. Find the centre tap, the tap next to it, and the DC gain $\sum h[n]$. Then find the gain at $f_c$ and at $f = ${fsb}$, both in dB relative to the DC gain.`,
        givens: [T`$f_c = ${fc}$ cycles/sample, $N = ${N}$`, `${win[0].toUpperCase() + win.slice(1)} window`, T`Stopband test frequency $${fsb}$`],
        parts: [p('Centre tap', h[M], ''), p('Next tap', h[M + 1], '', .01, 1e-4), p('DC gain', dc, ''), p(T`Gain at $f_c$`, gc, 'dB', .01, .02), p(T`Gain at $${fsb}$`, gs, 'dB', .01, .05)],
        hints: [T`Tap $n$ corresponds to $k = n - ${M}$: $h[n] = h_d[n - ${M}]\,w[n]$.`, T`The DC gain is the sum of the taps; truncation and windowing make it slightly different from 1.`, T`For a symmetric filter $|H(f)| = \left|h[${M}] + 2\sum_{k\ge1}h[${M} + k]\cos(2\pi fk)\right|$.`],
        steps: [T`Centre tap $h[${M}] = 2f_c\,w[${M}] = ${tf(h[M])}$; next tap $h[${M + 1}] = ${tf(h[M + 1])}$.`, T`$\sum h[n] = ${tf(dc)}$.`, T`$|H(f_c)|/H(0) = ${tf(10 ** (gc / 20))}$, i.e. $${tf(gc)}\,\text{dB}$ (about $-6\,\text{dB}$ for a windowed sinc).`, T`At $f = ${fsb}$: $${tf(gs)}\,\text{dB}$.`],
        idea: 'Truncating the ideal response causes ripple; a smooth window trades a wider transition band for much lower sidelobes.',
        diagram, prerequisites: 'FIR filters; the DTFT; windows.',
        verify: () => { // taps from the sinc in a different form; |H| from the symmetric cosine series
            const taps = Array.from({length: N}, (_, n) => { const k = n - M, x = 2 * fc * k; return 2 * fc * (k === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * (win === 'rectangular' ? 1 : (win === 'Hann' ? .5 : .54) - (win === 'Hann' ? .5 : .46) * Math.cos(2 * Math.PI * n / (N - 1))); });
            const amp = f => Math.abs(taps[M] + 2 * taps.slice(M + 1).reduce((s, v, k) => s + v * Math.cos(2 * Math.PI * f * (k + 1)), 0)), s0 = taps.reduce((s, v) => s + v, 0);
            return [taps[M], taps[M + 1], s0, 20 * Math.log10(amp(fc) / Math.abs(s0)), 20 * Math.log10(amp(fsb) / Math.abs(s0))];
        }
    });
}

/* Level 3: energy, spectrum and autocorrelation of a decaying exponential. Units: ms, kHz, mJ. */
function signalsEnergySpectrum(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'energy-spectrum', date, SIGNALS_READING), p = part;
    const [A, tau, B, lag] = grid([1, 2, 3, 5, 10], [.1, .2, .5, 1, 2, 5], [.1, .2, .5, 1, 2, 5], [.5, 1, 2]);
    const E = A * A * tau / 2, X0 = A * tau, f3 = 1 / (2 * Math.PI * tau), fr = 2 / Math.PI * Math.atan(2 * Math.PI * B * tau), B99 = Math.tan(.99 * Math.PI / 2) / (2 * Math.PI * tau), R = E * Math.exp(-lag);
    const diagram = curve('t (ms)', 'x(t) (V)', [0, +(5 * tau).toPrecision(3)], [0, A], t => A * Math.exp(-t / tau));
    return q({
        title: 'Where the energy of a pulse lives in frequency',
        text: T`The pulse $x(t) = A e^{-t/\tau}u(t)$ with $A = ${A}\,\text{V}$ and $\tau = ${tau}\,\text{ms}$ is applied to a $1\,\Omega$ resistor. Find its total energy and $|X(0)|$, where $X(f) = \displaystyle\int x(t)e^{-j2\pi ft}dt$. Find the frequency at which $|X(f)|^2$ falls to half its peak, the percentage of the energy that lies in $|f| \le ${B}\,\text{kHz}$, and the bandwidth (one-sided) that holds 99% of the energy. Finally evaluate the autocorrelation $R_x(t_0) = \displaystyle\int x(t)x(t + t_0)dt$ at $t_0 = ${lag}\tau$.`,
        givens: [T`$A = ${A}\,\text{V}$, $\tau = ${tau}\,\text{ms}$`, T`$B = ${B}\,\text{kHz}$`, T`Lag $t_0 = ${lag}\tau$`],
        parts: [p('Energy', E, 'mJ'), p(T`$|X(0)|$`, X0, 'V·ms'), p(T`Half-power frequency of $|X|^2$`, f3, 'kHz'), p(T`Energy in $|f| \le ${B}\,\text{kHz}$`, 100 * fr, '%'), p('99% energy bandwidth', B99, 'kHz'), p(T`$R_x(${lag}\tau)$`, R, 'mJ')],
        hints: [T`$E = \displaystyle\int_0^\infty A^2e^{-2t/\tau}dt = A^2\tau/2$, and $X(f) = \dfrac{A\tau}{1 + j2\pi f\tau}$.`, T`Parseval: the energy in $|f| \le B$ is $\displaystyle\int_{-B}^{B}|X(f)|^2df = E\cdot\frac{2}{\pi}\arctan(2\pi B\tau)$.`, T`For a causal exponential, $R_x(t_0) = E\,e^{-|t_0|/\tau}$.`],
        steps: [T`$E = ${A}^2\times${tau}/2 = ${tf(E)}\,\text{mJ}$ (V² × ms); $|X(0)| = A\tau = ${tf(X0)}\,\text{V}\cdot\text{ms}$.`, T`Half power at $f = 1/(2\pi\tau) = ${tf(f3)}\,\text{kHz}$.`, T`$\tfrac{2}{\pi}\arctan(2\pi\times${B}\times${tau}) = ${tf(fr)}$, i.e. $${tf(100 * fr)}\%$.`, T`99%: $\arctan(2\pi B\tau) = 0.99\cdot\tfrac\pi2$, so $B = ${tf(B99)}\,\text{kHz}$, far beyond the half-power point.`, T`$R_x(${lag}\tau) = ${tf(E)}e^{-${lag}} = ${tf(R)}\,\text{mJ}$.`],
        idea: 'A sharp edge spreads energy far out in frequency: the half-power bandwidth of an exponential pulse is small, but holding 99% of its energy takes about 64 times more.',
        diagram, prerequisites: 'Fourier transform; Parseval’s theorem; autocorrelation.',
        verify: () => { // time-domain and frequency-domain integrals evaluated numerically
            const x = t => A * Math.exp(-t / tau), X2 = f => (A * tau) ** 2 / (1 + (2 * Math.PI * f * tau) ** 2), Et = NUM.simpson(t => x(t) ** 2, 0, 60 * tau, 20000);
            const inBand = b => 2 * NUM.simpson(X2, 0, b, 4000), b99 = NUM.bisect(b => inBand(b) - .99 * Et, f3, 1e3 * f3, 100);
            return [Et, NUM.simpson(x, 0, 60 * tau, 20000), NUM.bisect(f => X2(f) - X2(0) / 2, 0, 10 * f3, 200), 100 * inBand(B) / Et, b99, NUM.simpson(t => x(t) * x(t + lag * tau), 0, 60 * tau, 20000)];
        }
    });
}

/* Level 4 (expert): estimating a tone's frequency between DFT bins (Hann window, log-parabolic interpolation). */
function signalsToneEstimate(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'tone-estimate', date, SIGNALS_READING), p = part, N = 16;
    const [k0, dl, ph] = grid([3, 4, 5, 6], steps(.05, .45, .05), steps(0, 330, 30)), f = k0 + dl;
    const x = Array.from({length: N}, (_, n) => +Math.cos(2 * Math.PI * f * n / N + ph * Math.PI / 180).toFixed(3)), w = Array.from({length: N}, (_, n) => .5 - .5 * Math.cos(2 * Math.PI * n / N));
    const Xw = k => Math.hypot(x.reduce((s, v, n) => s + w[n] * v * Math.cos(2 * Math.PI * k * n / N), 0), x.reduce((s, v, n) => s - w[n] * v * Math.sin(2 * Math.PI * k * n / N), 0));
    const mags = Array.from({length: 8}, (_, k) => Xw(k)), kp = mags.slice(1).reduce((b, m, i) => m > mags[b] ? i + 1 : b, 1);
    const [al, be, ga] = [kp - 1, kp, kp + 1].map(k => 20 * Math.log10(mags[k])), dhat = .5 * (al - ga) / (al - 2 * be + ga), fhat = kp + dhat, err = fhat - f;
    const W = d => Math.hypot(w.reduce((s, v, n) => s + v * Math.cos(2 * Math.PI * d * n / N), 0), w.reduce((s, v, n) => s + v * Math.sin(2 * Math.PI * d * n / N), 0)), scal = 20 * Math.log10(W(dl) / W(0));
    const diagram = curve('sample n', 'x[n]', [0, 15], [-1.1, 1.1], n => x[n], 'stem');
    return q({
        title: 'Find a tone between the DFT bins',
        text: T`Sixteen samples of a unit-amplitude tone are listed below; its frequency is not a whole number of bins. Multiply them by the periodic Hann window $w[n] = 0.5 - 0.5\cos(2\pi n/16)$ and compute the 16-point DFT. Find the bin $k_p$ (between 1 and 7) with the largest magnitude, and that magnitude. Interpolate the peak with a parabola through the dB magnitudes $\alpha, \beta, \gamma$ of bins $k_p - 1$, $k_p$, $k_p + 1$: $\hat\delta = \dfrac12\cdot\dfrac{\alpha - \gamma}{\alpha - 2\beta + \gamma}$. Give the estimated frequency $k_p + \hat\delta$ in bins and its error from the true value $${tf(f)}$ bins. Finally find the scalloping loss of the Hann window at this offset, $20\log_{10}|W(\delta)/W(0)|$ with $\delta = ${dl}$ bins.`,
        givens: [T`$x[n] = (${x.join(',\\ ')})$`, T`$N = 16$, periodic Hann window`, T`True frequency $${tf(f)}$ bins (for the error)`],
        parts: [p(T`Peak bin $k_p$`, kp, '', 0), p('Peak magnitude', mags[kp], ''), p('Estimated frequency', fhat, 'bins'), p('Estimation error', err, 'bins', .01, .002), p('Scalloping loss', scal, 'dB', .01, .01)],
        hints: [T`Window first, then transform: $X_w[k] = \sum_n w[n]x[n]e^{-j2\pi kn/16}$. A unit tone exactly on a bin would give $|X_w| = \tfrac12\sum w = 4$.`, T`Using dB magnitudes makes the parabola fit the Hann main lobe well; work out $\alpha$, $\beta$, $\gamma$ from bins $k_p \pm 1$.`, T`$W(\delta) = \sum_n w[n]e^{-j2\pi\delta n/16}$; at $\delta = 0$ it equals $\sum w = 8$.`],
        steps: [T`Magnitudes of bins 1–7: $${mags.slice(1).map(m => tf(m, 4)).join(',\\ ')}$; the peak is bin $${kp}$ with $${tf(mags[kp])}$.`, T`$\alpha, \beta, \gamma = ${tf(al)}, ${tf(be)}, ${tf(ga)}\,\text{dB}$, so $\hat\delta = ${tf(dhat)}$ and $\hat f = ${tf(fhat)}$ bins.`, T`Error $= ${tf(err)}$ bins.`, T`$|W(${dl})|/W(0) = ${tf(W(dl) / W(0))}$, a loss of $${tf(scal)}\,\text{dB}$.`],
        idea: 'A window trades frequency resolution for leakage control; interpolating between bins recovers frequency far more finely than the bin spacing.',
        diagram, prerequisites: 'The DFT; windows; parabolic interpolation.',
        verify: () => { // FFT of the windowed samples; the Hann kernel in closed form from three Dirichlet kernels
            const [R, I] = sigFFT(x.map((v, n) => v * w[n]), Array(N).fill(0)), m = R.map((r, k) => Math.hypot(r, I[k])), k = m.slice(1, 8).reduce((b, v, i) => v > m[b] ? i + 1 : b, 1);
            const [a, b, c] = [k - 1, k, k + 1].map(j => 20 * Math.log10(m[j])), dh = .5 * (a - c) / (a - 2 * b + c);
            const D = d => Math.abs(d) < 1e-12 ? cx(N) : cm(cp(1, -180 * d * (N - 1) / N), cx(Math.sin(Math.PI * d) / Math.sin(Math.PI * d / N)));
            const Wd = d => cs(cm(cx(.5), D(d)), cm(cx(.25), ca(D(d - 1), D(d + 1))));
            return [k, m[k], k + dh, k + dh - f, 20 * Math.log10(cabs(Wd(dl)) / cabs(Wd(0)))];
        }
    });
}

/* Level 4 (mastery): non-causal and causal Wiener filters for a first-order signal in white noise. */
function signalsWiener(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'wiener', date, SIGNALS_READING), p = part;
    const [s2, al, n0] = grid([.25, .5, 1, 2, 3, 4], [5, 10, 20, 50, 100, 200, 500], [5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, .1, .2]);
    const be = Math.sqrt(al * al + 2 * s2 * al / n0), H0 = (2 * s2 / al) / (2 * s2 / al + n0), mNC = s2 * al / be, mC = n0 * (be - al), Hc0 = (be - al) / be;
    const diagram = drawing(arrow(40, 120, 200, 120) + dt(110, 104, 's(t)') + ring(220, 120, 20) + dt(220, 126, '+') + arrow(220, 40, 220, 100) + dt(220, 30, 'white noise n(t)') + arrow(240, 120, 340, 120) + wire('M340 90h140v60H340z') + dt(410, 126, 'H(ω)') +
        arrow(480, 120, 640, 120) + dt(570, 104, 'ŝ(t)') + dt(360, 200, 'choose H to minimise E[(s − ŝ)²]'), 'A signal s plus white noise n is filtered by H to produce the estimate of s; H minimises the mean-square error', 230);
    return q({
        title: 'Wiener filtering, with and without causality',
        text: T`A zero-mean signal $s(t)$ with variance $\sigma^2 = ${s2}$ has the power spectral density $S_s(\omega) = \dfrac{2\sigma^2\alpha}{\alpha^2 + \omega^2}$, $\alpha = ${al}\,\text{rad/s}$. It is observed in independent white noise of two-sided density $N_0/2 = ${n0}$. The non-causal Wiener filter is $H(\omega) = \dfrac{S_s}{S_s + N_0/2}$. Show that its error spectrum $\dfrac{S_sN_0/2}{S_s + N_0/2}$ is again Lorentzian, with corner $\beta = \sqrt{\alpha^2 + 2\sigma^2\alpha/(N_0/2)}$, and find $\beta$, the filter's gain at $\omega = 0$ and its minimum mean-square error. The best causal filter is $H_c(s) = \dfrac{\beta - \alpha}{s + \beta}$: find its error $\dfrac{1}{2\pi}\displaystyle\int\left(|1 - H_c|^2S_s + |H_c|^2N_0/2\right)d\omega$, its DC gain, and the ratio of the causal to the non-causal error.`,
        givens: [T`$\sigma^2 = ${s2}$, $\alpha = ${al}\,\text{rad/s}$`, T`$N_0/2 = ${n0}$ (two-sided)`, T`PSDs in rad/s: $\sigma^2 = \tfrac{1}{2\pi}\int S_s\,d\omega$`],
        parts: [p(T`$\beta$`, be, 'rad/s'), p('Non-causal gain at ω = 0', H0, ''), p('Non-causal minimum error', mNC, ''), p('Causal minimum error', mC, ''), p('Causal DC gain', Hc0, ''), p('Ratio causal / non-causal', mC / mNC, '')],
        hints: [T`$\dfrac{S_sN_0/2}{S_s + N_0/2} = \dfrac{2\sigma^2\alpha}{\alpha^2 + \omega^2 + 2\sigma^2\alpha/(N_0/2)} = \dfrac{2\sigma^2\alpha}{\beta^2 + \omega^2}$.`, T`$\dfrac{1}{2\pi}\displaystyle\int\frac{2c}{c^2 + \omega^2}d\omega = 1$, so the non-causal error is $\sigma^2\alpha/\beta$.`, T`For the causal filter the classic result (spectral factorisation) is an error of $\tfrac{N_0}{2}(\beta - \alpha)$; check it by integrating.`],
        steps: [T`$\beta = \sqrt{${al}^2 + 2\times${s2}\times${al}/${n0}} = ${tf(be)}\,\text{rad/s}$.`, T`$H(0) = \dfrac{2\sigma^2/\alpha}{2\sigma^2/\alpha + N_0/2} = ${tf(H0)}$; error $\sigma^2\alpha/\beta = ${tf(mNC)}$.`, T`Causal: error $\tfrac{N_0}{2}(\beta - \alpha) = ${tf(mC)}$; $H_c(0) = (\beta - \alpha)/\beta = ${tf(Hc0)}$.`, T`Ratio $= ${tf(mC / mNC)}$: causality costs ${mC / mNC < 1.5 ? 'little' : 'noticeably'} here.`],
        idea: 'The Wiener filter passes frequencies where the signal dominates and blocks those where noise dominates; insisting on causality costs extra error because the filter cannot look ahead.',
        diagram, prerequisites: 'Power spectral densities; Wiener filtering; contour or table integrals.',
        verify: () => { // the two error integrals evaluated numerically, ω = β·tan(u)
            const S = w => 2 * s2 * al / (al * al + w * w), sub = (fn, c) => NUM.simpson(u => fn(c * Math.tan(u)) * c / Math.cos(u) ** 2, -Math.PI / 2 + 1e-7, Math.PI / 2 - 1e-7, 40000) / (2 * Math.PI);
            const nc = sub(w => S(w) * n0 / (S(w) + n0), be);
            const cz = sub(w => { const H = cd(cx(be - al), cx(be, w)), oneMinus = cs(cx(1), H); return cabs(oneMinus) ** 2 * S(w) + cabs(H) ** 2 * n0; }, Math.min(be, al) || 1);
            return [Math.sqrt(al * al + 2 * s2 * al / n0), S(0) / (S(0) + n0), nc, cz, (be - al) / be, cz / nc];
        }
    });
}
