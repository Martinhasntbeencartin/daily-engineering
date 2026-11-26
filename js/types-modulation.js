/* Modulation & coding: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (numerical integrals, MacWilliams, loop simulation, path enumeration). */
const MOD_READING = COMMS_READING.modulation;
addTypes('modulation', 'university', modBERCompare, modMatchedFilter, modFM);
addTypes('modulation', 'challenge', modBlockCode, modOFDM, modPLL);
addTypes('modulation', 'expert', modIQImbalance);
addTypes('modulation', 'mastery', modConvUnion);

const modQnum = x => NUM.simpson(t => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI), x, x + 12, 600); // Gaussian tail by direct integration
const modPow10 = t => `10^{${Math.round(Math.log10(t))}}`;
const modPopcount = v => { let c = 0; while (v) { c += v & 1; v >>>= 1; } return c; };
const modQamSer = (M, g, Q) => { const a = 2 * (1 - 1 / Math.sqrt(M)) * Q(Math.sqrt(3 * g / (M - 1))); return a * (2 - a); }; // square M-QAM symbol error rate

/* Level 2: BPSK, coherent FSK and DPSK at the same Eb/N0, and the power BPSK needs for a target bit error rate. */
function modBERCompare(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ber-compare', date, MOD_READING), p = part;
    const [gdb, target, [Rb, rateName], N0] = grid(steps(0, 12, .5), [1e-3, 1e-4, 1e-5, 1e-6], [[9600, '9.6 kbit/s'], [64e3, '64 kbit/s'], [1e6, '1 Mbit/s'], [1e7, '10 Mbit/s']], [-174, -170]);
    const g = unDB(gdb), bpsk = Qfn(Math.sqrt(2 * g)), fsk = Qfn(Math.sqrt(g)), dpsk = .5 * Math.exp(-g);
    const req = dB(NUM.bisect(x => Qfn(Math.sqrt(2 * x)) - target, 1e-3, 100, 200)), Preq = req + dB(Rb) + N0;
    const diagram = curve('Eb/N0 (dB)', 'log₁₀ BER', [0, 12], [-8, 0], d => Math.max(-8, Math.log10(Qfn(Math.sqrt(2 * unDB(d))))));
    return q({
        title: 'Three modulations, one Eb/N0',
        text: T`A link runs at $E_b/N_0 = ${gdb}\,\text{dB}$ in white Gaussian noise. Find the bit error rate of coherent BPSK, of coherent binary FSK (orthogonal tones) and of differentially detected DPSK. Then find the $E_b/N_0$ that BPSK needs for a bit error rate of $${modPow10(target)}$, and the received power that requires at ${rateName} when $N_0 = ${N0}\,\text{dBm/Hz}$.`,
        givens: [T`$E_b/N_0 = ${gdb}\,\text{dB}$`, T`Target BER $${modPow10(target)}$`, T`$R_b =$ ${rateName}, $N_0 = ${N0}\,\text{dBm/Hz}$`],
        parts: [p('BPSK bit error rate', bpsk, ''), p('Coherent FSK bit error rate', fsk, ''), p('DPSK bit error rate', dpsk, ''), p('Eb/N0 BPSK needs', req, 'dB', .01, .01), p('Received power needed', Preq, 'dBm', .01, .02)],
        hints: [T`BPSK: $P_b = Q\bigl(\sqrt{2E_b/N_0}\bigr)$. Orthogonal FSK has half the distance squared: $Q\bigl(\sqrt{E_b/N_0}\bigr)$. DPSK: $\tfrac12e^{-E_b/N_0}$.`, T`Solve $Q\bigl(\sqrt{2x}\bigr) = P_b$ for $x$ by trial or bisection; convert to decibels.`, T`$P = (E_b/N_0)\,N_0R_b$, so in dBm: $E_b/N_0\,(\text{dB}) + 10\log_{10}R_b + N_0\,(\text{dBm/Hz})$.`],
        steps: [T`$E_b/N_0 = ${tf(g)}$: BPSK $${tf(bpsk)}$, FSK $${tf(fsk)}$, DPSK $${tf(dpsk)}$.`, T`$Q\bigl(\sqrt{2x}\bigr) = ${modPow10(target)}$ gives $x = ${tf(unDB(req))}$, i.e. $${tf(req)}\,\text{dB}$.`, T`$P = ${tf(req)} + ${tf(dB(Rb))} + (${N0}) = ${tf(Preq)}\,\text{dBm}$.`],
        idea: 'At the same energy per bit, antipodal signals beat orthogonal ones by 3 dB, and giving up the phase reference (DPSK) costs less than a decibel at low error rates.',
        diagram, prerequisites: 'Gaussian noise; the Q function; decibels.',
        verify: () => { // Q by integrating the Gaussian density; the BPSK requirement by bisection in decibels
            const r = NUM.bisect(d => modQnum(Math.sqrt(2 * 10 ** (d / 10))) - target, -10, 20, 80);
            return [modQnum(Math.sqrt(2 * g)), modQnum(Math.sqrt(g)), .5 / Math.exp(g), r, r + 10 * Math.log10(Rb) + N0];
        }
    });
}

/* Level 2: what a matched filter gains over a simple RC filter for a rectangular pulse. */
function modMatchedFilter(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'matched-filter', date, MOD_READING), p = part;
    const [A, Tb, N0, ratio] = grid([1, 2, 5, 10], [1, 2, 5, 10, 20], [1e-13, 1e-12, 1e-11], [.2, .3, .5, 1, 2, 4]);
    const tau = ratio * Tb, a = A * 1e-3, tb = Tb * 1e-6, ta = tau * 1e-6, E = a * a * tb, mf = dB(2 * E / N0), rc = dB(4 * ta * a * a * (1 - Math.exp(-tb / ta)) ** 2 / N0);
    const xs = NUM.bisect(x => Math.exp(x) - 1 - 2 * x, .5, 3, 100), tOpt = Tb / xs;
    const diagram = drawing(wire('M30 150H55V95H125V150H150') + dt(40, 92, `${A} mV`) + dt(90, 172, `${Tb} µs`) + arrow(150, 125, 214, 125) + ring(230, 125, 16) + dt(230, 131, '+') + arrow(230, 60, 230, 109) + dt(230, 50, 'white noise') +
        wire('M246 125H275M275 75V185') + arrow(275, 75, 320, 75) + arrow(275, 185, 320, 185) + wire('M320 50h150v50h-150zM320 160h150v50h-150z') + dt(395, 81, 'matched filter') + dt(395, 191, `RC, τ = ${tf(tau)} µs`) +
        wire('M470 75h40l28-14M470 185h40l28-14') + dt(590, 44, `sample at ${Tb} µs`) + dt(590, 220, `sample at ${Tb} µs`), 'A rectangular pulse in white noise feeds a matched filter and an RC low-pass filter, each sampled at the end of the pulse', 240);
    return q({
        title: 'Matched filter against an RC filter',
        text: T`A rectangular pulse of amplitude $${A}\,\text{mV}$ and duration $T = ${Tb}\,\mu\text{s}$ arrives in white Gaussian noise of two-sided density $N_0/2$ with $N_0 = ${tf(N0)}\,\text{V}^2/\text{Hz}$ (powers into $1\,\Omega$). Find the pulse energy and the peak output SNR of a matched filter sampled at $t = T$. A cheaper receiver uses an RC low-pass filter, impulse response $h(t) = \tfrac1\tau e^{-t/\tau}$ with $\tau = ${tf(tau)}\,\mu\text{s}$, also sampled at $t = T$: find its output SNR and the loss against the matched filter. Which time constant would minimise that loss?`,
        givens: [T`$A = ${A}\,\text{mV}$, $T = ${Tb}\,\mu\text{s}$`, T`$N_0 = ${tf(N0)}\,\text{V}^2/\text{Hz}$`, T`RC filter $\tau = ${tf(tau)}\,\mu\text{s}$`],
        parts: [p('Pulse energy', E * 1e12, 'pJ'), p('Matched-filter SNR', mf, 'dB', .01, .01), p('RC-filter SNR', rc, 'dB', .01, .01), p('Loss of the RC filter', mf - rc, 'dB', .01, .005), p('Best RC time constant', tOpt, 'µs')],
        hints: [T`The matched filter gives the largest possible peak SNR, $2E/N_0$, with $E = A^2T$.`, T`RC output at $T$: signal $A(1 - e^{-T/\tau})$; noise variance $\dfrac{N_0}2\displaystyle\int_0^\infty h^2\,dt = \dfrac{N_0}{4\tau}$.`, T`The ratio of the two SNRs is $\dfrac{2(1 - e^{-x})^2}{x}$ with $x = T/\tau$; setting its derivative to zero gives $e^x = 1 + 2x$.`],
        steps: [T`$E = (${tf(a)})^2\times${tf(tb)} = ${tf(E * 1e12)}\,\text{pJ}$; matched filter $2E/N_0 = ${tf(2 * E / N0)}$ ($${tf(mf)}\,\text{dB}$).`, T`RC: $\dfrac{4\tau A^2(1 - e^{-T/\tau})^2}{N_0} = ${tf(10 ** (rc / 10))}$ ($${tf(rc)}\,\text{dB}$), a loss of $${tf(mf - rc)}\,\text{dB}$.`, T`$e^x = 1 + 2x$ at $x = ${tf(xs)}$, so the best $\tau = T/${tf(xs, 4)} = ${tf(tOpt)}\,\mu\text{s}$, losing only $0.89\,\text{dB}$.`],
        idea: 'Correlating with the pulse shape is optimal, but a well-chosen one-pole filter comes within a decibel of it.',
        diagram, prerequisites: 'Convolution; noise variance through a filter.',
        verify: () => { // the RC signal and noise by numerical convolution; the best τ by golden-section search on the SNR
            const rcSnr = t => { const sig = NUM.simpson(u => a * Math.exp(-u / t) / t, 0, tb, 400), nv = N0 / 2 * NUM.simpson(u => Math.exp(-2 * u / t) / (t * t), 0, 40 * t, 800); return sig * sig / nv; };
            const e = NUM.simpson(() => a * a, 0, tb, 10);
            let lo = tb / 5, hi = tb * 2; const gr = (Math.sqrt(5) - 1) / 2;
            for (let i = 0; i < 50; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (rcSnr(c) > rcSnr(d)) hi = d; else lo = c; }
            return [e * 1e12, dB(2 * e / N0), dB(rcSnr(ta)), dB(2 * e / N0) - dB(rcSnr(ta)), (lo + hi) / 2 * 1e6];
        }
    });
}

/* Level 2: tone FM: modulation index, Carson bandwidth and the power in the carrier and sidebands. */
const fmBessel = (n, b) => { let s = 0; for (let i = 0; i < 256; i++) { const t = 2 * Math.PI * i / 256; s += Math.cos(n * t - b * Math.sin(t)); } return s / 256; }; // J_n(β), trapezoid over one period
let FM_CASES = null;
function modFM(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'fm', date, MOD_READING), p = part;
    FM_CASES ||= product([3, 5, 7.5, 10, 12, 15, 20, 25, 30, 40, 50, 75], [.5, 1, 2, 3, 4, 5, 8, 10, 15]).filter(([d, f]) => d / f >= .25 && d / f <= 12);
    const [[df, fm], P] = grid(FM_CASES, [10, 50, 100, 500, 1000]), b = df / fm, nC = Math.floor(b + 1 + 1e-9), J = Array.from({length: nC + 1}, (_, n) => fmBessel(n, b));
    const carson = 2 * (df + fm), Pc = P * J[0] ** 2, P1 = 2 * P * J[1] ** 2, inC = 100 * (J[0] ** 2 + 2 * J.slice(1).reduce((s, v) => s + v * v, 0)), nPlot = Math.ceil(b + 3);
    const diagram = curve('sideband number n (line at fc + n·fm)', '|Jₙ(β)|', [-nPlot, nPlot], [0, 1], n => Math.abs(fmBessel(n, b)), 'stem');
    return q({
        title: 'The spectrum of a tone-modulated FM signal',
        text: T`An FM transmitter of power $${P}\,\text{W}$ is modulated by a $${fm}\,\text{kHz}$ tone with a peak frequency deviation of $${df}\,\text{kHz}$. Find the modulation index $\beta$ and Carson's bandwidth. The spectrum has lines at $f_c \pm nf_m$ with amplitudes $J_n(\beta)$: find the power left in the carrier, the power in the first pair of sidebands, and the percentage of the power that lies inside Carson's bandwidth.`,
        givens: [T`$P = ${P}\,\text{W}$`, T`$f_m = ${fm}\,\text{kHz}$`, T`$\Delta f = ${df}\,\text{kHz}$`],
        parts: [p(T`$\beta$`, b, ''), p("Carson's bandwidth", carson, 'kHz'), p('Carrier power', Pc, 'W', .01, .005 * P), p('First sideband pair', P1, 'W', .01, .005 * P), p("Power inside Carson's bandwidth", inC, '%', .01, .05)],
        hints: [T`$\beta = \Delta f/f_m$; Carson's rule $B \approx 2(\Delta f + f_m)$.`, T`The carrier keeps $PJ_0^2(\beta)$ and each pair of lines $\pm n$ carries $2PJ_n^2(\beta)$; all of them sum to $P$.`, T`Carson's band holds the lines with $nf_m \le \Delta f + f_m$, i.e. $n \le \beta + 1$. Compute $J_n$ from tables, the series, or $J_n(\beta) = \tfrac1\pi\int_0^\pi\cos(n\theta - \beta\sin\theta)\,d\theta$.`],
        steps: [T`$\beta = ${df}/${fm} = ${tf(b)}$; $B = 2(${df} + ${fm}) = ${tf(carson)}\,\text{kHz}$.`, T`$J_0 = ${tf(J[0], 4)}$, $J_1 = ${tf(J[1], 4)}$: carrier $${tf(Pc)}\,\text{W}$, first pair $${tf(P1)}\,\text{W}$.`, T`Lines up to $n = ${nC}$ lie in Carson's band: $J_0^2 + 2\sum_{n=1}^{${nC}}J_n^2 = ${tf(inC / 100, 4)}$, i.e. $${tf(inC)}\,\%$.`],
        idea: 'FM spreads a fixed power over many lines; Carson’s rule captures about 98% of it, and the carrier can even vanish at a Bessel zero.',
        diagram, prerequisites: 'Frequency modulation; Bessel functions.',
        verify: () => { // Bessel functions from their power series
            const Jn = n => { let s = 0, t = (b / 2) ** n / [...Array(n).keys()].reduce((acc, k) => acc * (k + 1), 1); for (let k = 0; k < 80; k++) { s += t; t *= -(b * b / 4) / ((k + 1) * (k + 1 + n)); } return s; };
            const nmax = Math.floor((df + fm) / fm + 1e-9);
            let inside = Jn(0) ** 2; for (let n = 1; n <= nmax; n++) inside += 2 * Jn(n) ** 2;
            return [df / fm, 2 * df + 2 * fm, P * Jn(0) ** 2, 2 * P * Jn(1) ** 2, 100 * inside];
        }
    });
}

/* Level 3: a systematic linear block code: minimum distance, its error performance on a binary symmetric channel. */
const BLOCK_SIZES = [[7, 4], [8, 4], [9, 4], [10, 4], [10, 5], [12, 5], [12, 6], [15, 7]];
const blockParity = (n, k, seed) => { // k parity rows of n − k bits, from a small xorshift generator
    let x = (seed * 2654435761 + 97 * n + k) >>> 0 || 1;
    const next = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x; };
    const rows = [];
    while (rows.length < k) { const r = next() % (1 << (n - k)); if (modPopcount(r) >= 2 && !rows.includes(r)) rows.push(r); }
    return rows;
};
let BLOCK_CASES = null; // distinct parity blocks for each code size
function modBlockCode(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'block-code', date, MOD_READING), p = part;
    BLOCK_CASES ||= BLOCK_SIZES.flatMap(([n, k]) => { const seen = new Map(); for (let sd = 0; sd < 400 && seen.size < 60; sd++) { const P = blockParity(n, k, sd); seen.set(P.join(','), [n, k, P]); } return [...seen.values()]; });
    const [[n, k, P], pe] = grid(BLOCK_CASES, [.001, .005, .01, .02]), m = n - k;
    const A = Array(n + 1).fill(0);
    for (let u = 0; u < 1 << k; u++) { let par = 0; for (let i = 0; i < k; i++) if (u >> (k - 1 - i) & 1) par ^= P[i]; A[modPopcount(u) + modPopcount(par)]++; }
    const dmin = A.findIndex((v, w) => w > 0 && v > 0), t = Math.floor((dmin - 1) / 2), binom = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return r; };
    const Pu = A.reduce((s, v, w) => s + (w ? v * pe ** w * (1 - pe) ** (n - w) : 0), 0), Pf = 1 - Array.from({length: t + 1}, (_, i) => binom(n, i) * pe ** i * (1 - pe) ** (n - i)).reduce((s, v) => s + v, 0);
    const bits = r => r.toString(2).padStart(m, '0'), cw = 30, x0 = 360 - n * cw / 2;
    const diagram = drawing(P.map((r, i) => Array.from({length: n}, (_, j) => dt(x0 + j * cw + cw / 2, 62 + i * 26, j < k ? (i === j ? 1 : 0) : bits(r)[j - k])).join('')).join('') +
        guide(`M${x0 + k * cw} 40V${48 + k * 26}`) + wire(`M${x0 - 4} 40h-8V${48 + k * 26}h8M${x0 + n * cw + 4} 40h8V${48 + k * 26}h-8`) + dt(x0 - 50, 50 + k * 13, 'G =') + dt(x0 + k * cw / 2, 70 + k * 26, 'I') + dt(x0 + k * cw + m * cw / 2, 70 + k * 26, 'P'),
        `The ${k} by ${n} generator matrix of the code: an identity block followed by the parity block`, 80 + k * 26);
    return q({
        title: 'A systematic block code on a noisy channel',
        text: T`A $(${n}, ${k})$ binary linear code has the systematic generator matrix $G = [\,I_{${k}}\,|\,P\,]$ shown, with parity rows ${P.map(r => bits(r)).join(', ')}. Find its minimum distance (list the codeword weights), the number of codewords of that weight, and how many errors a bounded-distance decoder corrects. On a binary symmetric channel with crossover probability $${pe}$, find the probability that an error pattern goes undetected and the probability that a block has more errors than the decoder can correct.`,
        givens: [T`$(n, k) = (${n}, ${k})$`, `Parity rows ${P.map(r => bits(r)).join(', ')}`, T`BSC, $p = ${pe}$`],
        parts: [p(T`$d_{\min}$`, dmin, '', 0), p(T`Codewords of weight $d_{\min}$`, A[dmin], '', 0), p('Errors corrected', t, '', 0), p('Undetected error probability', Pu, ''), p('Probability of more than t errors', Pf, '')],
        hints: [T`List all $2^{${k}}$ codewords $uG$; for a linear code $d_{\min}$ is the smallest non-zero weight.`, T`An error pattern goes undetected exactly when it is itself a non-zero codeword: $P_u = \sum_{w\ge1}A_wp^w(1 - p)^{n - w}$.`, T`$t = \lfloor(d_{\min} - 1)/2\rfloor$; the decoder fails when more than $t$ of the $${n}$ bits flip.`],
        steps: [T`Weight distribution: ${A.map((v, w) => v ? `$A_{${w}} = ${v}$` : '').filter(Boolean).join(', ')}.`, T`$d_{\min} = ${dmin}$ with $${A[dmin]}$ codewords; $t = ${t}$.`, T`$P_u = ${tf(Pu)}$.`, T`$P(> ${t}\text{ errors}) = 1 - \sum_{i=0}^{${t}}\binom{${n}}{i}p^i(1 - p)^{${n} - i} = ${tf(Pf)}$.`],
        idea: 'A linear code is judged by its weight distribution: the minimum distance sets what it corrects, and the low-weight codewords set what slips through undetected.',
        diagram, prerequisites: 'Linear block codes; binomial probabilities.',
        verify: () => { // via the parity-check matrix H = [Pᵀ | I]: codewords are the n-bit vectors with zero syndrome
            const col = j => j < k ? P[j] : 1 << (n - 1 - j), Aw = Array(n + 1).fill(0);
            for (let v = 1; v < 1 << n; v++) { let syn = 0; for (let j = 0; j < n; j++) if (v >> (n - 1 - j) & 1) syn ^= col(j); if (!syn) Aw[modPopcount(v)]++; }
            const d = Aw.findIndex(v => v > 0), tt = Math.floor((d - 1) / 2);
            let pu = 0, pf = 0;
            for (let v = 1; v < 1 << n; v++) { const w = modPopcount(v); let syn = 0; for (let j = 0; j < n; j++) if (v >> (n - 1 - j) & 1) syn ^= col(j); if (!syn) pu += pe ** w * (1 - pe) ** (n - w); if (w > tt) pf += pe ** w * (1 - pe) ** (n - w); }
            return [d, Aw[d], tt, pu, pf];
        }
    });
}

/* Level 3: OFDM numerology: sampling, cyclic prefix, bit rate and the speed the subcarrier spacing tolerates. */
function modOFDM(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ofdm', date, MOD_READING), p = part;
    const [sc, N, use, cp, M, [r, rName], fc] = grid([15, 30, 60, 120], [512, 1024, 2048, 4096], [.6, .75, .85], [16, 8, 4], [4, 16, 64, 256], [[.5, '1/2'], [2 / 3, '2/3'], [.75, '3/4'], [5 / 6, '5/6']], [.9, 2.6, 3.5, 28]);
    const Nu = 12 * Math.round(use * N / 12), Ncp = N / cp, fs = N * sc / 1e3, Tcp = Ncp / fs, Tu = 1e3 / sc, Ts = Tu + Tcp, BW = Nu * sc / 1e3, Rb = Nu * Math.log2(M) * r / Ts, vmax = .05 * sc * 1e3 * C0 / (fc * 1e9) * 3.6;
    const wcp = 480 * Ncp / (N + Ncp), xc = 120 + wcp / 2, xt = 600 - wcp / 2;
    const diagram = drawing(wire('M80 150H660') + `<rect x="120" y="80" width="${wcp.toFixed(1)}" height="70" fill="#e9eee6" stroke="#315740"/>` + wire(`M${(120 + wcp).toFixed(1)} 80H600V150`) + guide(`M${(600 - wcp).toFixed(1)} 80V150`) +
        `<path d="M${xt.toFixed(1)} 76Q360 14 ${(xc + 6).toFixed(1)} 72"/>` + arrow(xc + 14, 66, xc + 2, 75) + dt(360, 36, 'copy') + dt(xc, 122, 'CP') + dt((120 + wcp + 600 - wcp) / 2, 122, `${N}-point IFFT output`) +
        dt(360, 186, `one symbol: ${N} + ${Ncp} samples`) + dt(360, 214, `${Nu} used subcarriers, Δf = ${sc} kHz`), 'One OFDM symbol: the cyclic prefix copies the last part of the IFFT output in front of it', 230);
    return q({
        title: 'OFDM numerology',
        text: T`An OFDM system uses a subcarrier spacing of $${sc}\,\text{kHz}$, an $${N}$-point FFT, $${Nu}$ used subcarriers, and a cyclic prefix of $1/${cp}$ of the useful symbol. Every used subcarrier carries $${M}$-QAM with a rate-${rName} code. Find the sampling rate, the cyclic-prefix duration (the longest delay spread it absorbs), the occupied bandwidth, and the information bit rate. If the Doppler shift must stay below 5% of the subcarrier spacing at a carrier of $${fc}\,\text{GHz}$, how fast may a receiver move?`,
        givens: [T`$\Delta f = ${sc}\,\text{kHz}$, $N = ${N}$, $N_u = ${Nu}$`, T`CP $= T_u/${cp}$`, T`$${M}$-QAM, code rate ${rName}`, T`$f_c = ${fc}\,\text{GHz}$`],
        parts: [p('Sampling rate', fs, 'MHz'), p('Cyclic-prefix duration', Tcp, 'µs'), p('Occupied bandwidth', BW, 'MHz'), p('Information bit rate', Rb, 'Mbit/s'), p('Maximum speed', vmax, 'km/h')],
        hints: [T`The useful symbol lasts $T_u = 1/\Delta f$ and holds $N$ samples, so $f_s = N\Delta f$.`, T`Each symbol lasts $T_u + T_{cp}$ and carries $N_u\log_2M\cdot r$ information bits.`, T`Doppler $f_D = v f_c/c$; set $f_D = 0.05\,\Delta f$.`],
        steps: [T`$f_s = ${N}\times${sc}\,\text{kHz} = ${tf(fs)}\,\text{MHz}$; $T_u = ${tf(Tu)}\,\mu\text{s}$, $T_{cp} = ${tf(Tcp)}\,\mu\text{s}$.`, T`Occupied bandwidth $${Nu}\times${sc}\,\text{kHz} = ${tf(BW)}\,\text{MHz}$.`, T`$R_b = \dfrac{${Nu}\times${Math.log2(M)}\times${tf(r, 4)}}{${tf(Ts)}\,\mu\text{s}} = ${tf(Rb)}\,\text{Mbit/s}$.`, T`$v = 0.05\times${sc}\,\text{kHz}\times c/f_c = ${tf(vmax)}\,\text{km/h}$.`],
        idea: 'Subcarrier spacing is the master knob of OFDM: wider spacing shortens symbols, which tolerates Doppler but leaves less room for the cyclic prefix.',
        diagram, prerequisites: 'The DFT; QAM; the Doppler effect.',
        verify: () => { // counted in samples and in symbols per millisecond
            const fsHz = N * sc * 1e3, perMs = 1e-3 * fsHz / (N + Ncp), lambda = C0 / (fc * 1e9);
            return [fsHz / 1e6, Ncp / fsHz * 1e6, (Nu * sc * 1e3) / 1e6, perMs * Nu * Math.log2(M) * r / 1e3, .05 * sc * 1e3 * lambda * 3600 / 1000];
        }
    });
}

/* Level 3: a type-2 second-order phase-locked loop: natural frequency, damping, noise bandwidth, tracking error and jitter. */
let PLL_CASES = null;
function modPLL(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pll', date, MOD_READING), p = part;
    PLL_CASES ||= product([100, 200, 500, 1e3, 2e3, 5e3], [1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2], [1e-3, 2e-3, 5e-3, 1e-2, 2e-2], [10, 30, 100, 300, 1000], [35, 40, 45, 50]).filter(([K, t1, t2, Rf, cn]) => {
        const wn = Math.sqrt(K / t1), z = t2 * wn / 2, BL = wn / 2 * (z + 1 / (4 * z));
        const e = 2 * Math.PI * Rf / (wn * wn);
        return z >= .35 && z <= 1.6 && BL / 10 ** (cn / 10) <= .0685 && e >= .0175 && e <= .5;
    });
    const [[K, t1, t2, Rf, cn]] = grid(PLL_CASES), wn = Math.sqrt(K / t1), z = t2 * wn / 2, BL = wn / 2 * (z + 1 / (4 * z)), err = 2 * Math.PI * Rf / (wn * wn) * 180 / Math.PI, jit = Math.sqrt(BL / 10 ** (cn / 10)) * 180 / Math.PI;
    const diagram = hardFeedbackDiagram(T`F(s) = (1 + sτ₂)/(sτ₁)`, 'VCO and detector: K/s');
    return q({
        title: 'Designing a phase-locked loop',
        text: T`A phase-locked loop has phase-detector and VCO gains that combine to $K = ${tf(K)}\,\text{s}^{-1}$ and an active PI loop filter $F(s) = \dfrac{1 + s\tau_2}{s\tau_1}$ with $\tau_1 = ${tf(t1 * 1e3)}\,\text{ms}$ and $\tau_2 = ${tf(t2 * 1e3)}\,\text{ms}$. Find the natural frequency and damping ratio, and the one-sided noise bandwidth $B_L$. The input frequency ramps at $${Rf}\,\text{Hz/s}$ (a Doppler sweep): find the steady phase error. With a carrier-to-noise density of $${cn}\,\text{dB-Hz}$, find the RMS phase jitter ($\sigma^2 = B_L/(C/N_0)$).`,
        givens: [T`$K = ${tf(K)}\,\text{s}^{-1}$`, T`$\tau_1 = ${tf(t1 * 1e3)}\,\text{ms}$, $\tau_2 = ${tf(t2 * 1e3)}\,\text{ms}$`, T`Ramp $${Rf}\,\text{Hz/s}$`, T`$C/N_0 = ${cn}\,\text{dB-Hz}$`],
        parts: [p(T`$\omega_n$`, wn, 'rad/s'), p(T`$\zeta$`, z, ''), p(T`$B_L$`, BL, 'Hz'), p('Steady phase error', err, '°'), p('RMS phase jitter', jit, '°')],
        hints: [T`Closed loop: $H(s) = \dfrac{KF(s)/s}{1 + KF(s)/s} = \dfrac{2\zeta\omega_ns + \omega_n^2}{s^2 + 2\zeta\omega_ns + \omega_n^2}$ with $\omega_n^2 = K/\tau_1$ and $2\zeta\omega_n = K\tau_2/\tau_1$.`, T`$B_L = \displaystyle\int_0^\infty|H(j2\pi f)|^2df = \frac{\omega_n}{2}\left(\zeta + \frac1{4\zeta}\right)$.`, T`The loop has two integrators, so a frequency ramp of $\dot f$ leaves a steady error of $2\pi\dot f/\omega_n^2$ radians.`],
        steps: [T`$\omega_n = \sqrt{${tf(K)}/${tf(t1)}} = ${tf(wn)}\,\text{rad/s}$; $\zeta = \tau_2\omega_n/2 = ${tf(z)}$.`, T`$B_L = ${tf(BL)}\,\text{Hz}$.`, T`Ramp error $2\pi\times${Rf}/${tf(wn)}^2 = ${tf(err * Math.PI / 180)}\,\text{rad} = ${tf(err)}\,{}^\circ$.`, T`$\sigma = \sqrt{${tf(BL)}/${tf(10 ** (cn / 10))}} = ${tf(jit * Math.PI / 180)}\,\text{rad} = ${tf(jit)}\,{}^\circ$.`],
        idea: 'Loop bandwidth is a compromise: wider loops track faster sweeps with less error, narrower loops let in less noise.',
        diagram, prerequisites: 'Second-order systems; Laplace transforms; noise bandwidth.',
        verify: () => { // poles of τ₁s² + Kτ₂s + K; B_L by integrating |H|²; the ramp error by simulating the loop
            const [r1, r2] = NUM.polyRoots([t1, K * t2, K]), w = Math.sqrt(cabs(cm(r1, r2))), zz = -(r1.re + r2.re) / (2 * w);
            const H2f = f => { const s = cx(0, 2 * Math.PI * f), num = cx(K, K * t2 * s.im), den = ca(cx(t1 * s.re * s.re - t1 * s.im * s.im + K, 0), cx(0, K * t2 * s.im)); return (cabs(num) / cabs(den)) ** 2; };
            const bl = NUM.simpson(u => { const f = Math.exp(u); return H2f(f) * f; }, Math.log(w * 1e-5), Math.log(w * 1e5), 6000);
            const rate = zz < 1 ? zz : zz - Math.sqrt(zz * zz - 1), h = .01 / w, tEnd = Math.ceil(40 / (rate * w) / h) * h;
            const x = ctrlSim((t, s) => { const e = Math.PI * Rf * t * t - s[0]; return [K * (t2 / t1 * e + s[1] / t1), e]; }, [0, 0], h, tEnd);
            return [w, zz, bl, (Math.PI * Rf * tEnd * tEnd - x[0]) * 180 / Math.PI, Math.sqrt(bl / 10 ** (cn / 10)) * 180 / Math.PI];
        }
    });
}

/* Level 4 (expert): IQ imbalance and phase noise in a direct-conversion receiver: image rejection, EVM and symbol errors. */
let IQ_CASES = null;
const iqBudget = (eps, phi, sig, snr) => { const g = 10 ** (eps / 20), c = Math.cos(phi * Math.PI / 180), irr = (1 + 2 * g * c + g * g) / (1 - 2 * g * c + g * g), s = sig * Math.PI / 180; return {irr, evm2: 1 / irr + 2 * (1 - Math.exp(-s * s / 2)) + 1 / unDB(snr)}; };
function modIQImbalance(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'iq-imbalance', date, MOD_READING), p = part;
    IQ_CASES ||= product([.1, .2, .3, .5, .8, 1], [.5, 1, 2, 3, 5], [.5, 1, 1.5, 2, 3], [25, 30, 35, 40], [16, 64, 256]).filter(([e, f, s, snr, M]) => {
        const {evm2} = iqBudget(e, f, s, snr); return modQamSer(M, 1 / evm2, Qfn) >= 1e-12 && modQamSer(M, unDB(snr), Qfn) >= 1e-12 && modQamSer(M, 1 / evm2, Qfn) < .5;
    });
    const [[eps, phi, sig, snr, M]] = grid(IQ_CASES), {irr, evm2} = iqBudget(eps, phi, sig, snr), evm = 100 * Math.sqrt(evm2), snrEff = -dB(evm2), ser = modQamSer(M, 1 / evm2, Qfn), ser0 = modQamSer(M, unDB(snr), Qfn);
    const diagram = drawing(arrow(40, 130, 150, 130) + dt(80, 118, 'RF') + wire('M150 130V70H220M150 130V190H220') + dot(150, 130) + [70, 190].map(y => ring(236, y, 16) + dt(236, y + 6, '×')).join('') + wire('M236 86V110M236 174V150') +
        wire('M200 110h72v40h-72z') + dt(236, 136, 'LO') + arrow(252, 70, 420, 70) + arrow(252, 190, 420, 190) + wire('M420 50h90v40h-90zM420 170h90v40h-90z') + dt(465, 76, 'ADC') + dt(465, 196, 'ADC') + arrow(510, 70, 600, 70) + arrow(510, 190, 600, 190) +
        dt(625, 76, 'I') + dt(625, 196, 'Q') + dt(330, 58, 'cos ωt') + dt(330, 222, `−${tf(10 ** (eps / 20), 4)} sin(ωt + ${phi}°)`) + dt(372, 136, `phase noise ${sig}° rms`), 'A direct-conversion receiver: the local oscillator drives the I and Q mixers with a gain and phase error between them', 240);
    return q({
        title: 'IQ imbalance and phase noise in a receiver',
        text: T`A direct-conversion receiver has a gain imbalance of $${eps}\,\text{dB}$ and a phase error of $${phi}\,{}^\circ$ between its I and Q paths, local-oscillator phase noise of $${sig}\,{}^\circ$ RMS, and a thermal SNR of $${snr}\,\text{dB}$. Find the image rejection ratio. Treating the image, the phase noise and the thermal noise as independent Gaussian impairments, find the total EVM and the effective SNR. Find the symbol error rate of $${M}$-QAM at that SNR, and compare with thermal noise alone.`,
        givens: [T`Gain imbalance $${eps}\,\text{dB}$, phase error $${phi}\,{}^\circ$`, T`Phase noise $${sig}\,{}^\circ$ RMS`, T`Thermal SNR $${snr}\,\text{dB}$`, T`$${M}$-QAM`],
        parts: [p('Image rejection ratio', dB(irr), 'dB', .01, .01), p('Total EVM', evm, '%'), p('Effective SNR', snrEff, 'dB', .01, .01), p('Symbol error rate', ser, ''), p('Symbol error rate, thermal noise only', ser0, '')],
        hints: [T`With amplitude ratio $g$ and phase error $\varphi$: $\text{IRR} = \dfrac{1 + 2g\cos\varphi + g^2}{1 - 2g\cos\varphi + g^2}$.`, T`Error powers add: $\text{EVM}^2 = 1/\text{IRR} + 2\bigl(1 - e^{-\sigma^2/2}\bigr) + 1/\text{SNR}$, with $\sigma$ in radians ($2(1 - e^{-\sigma^2/2}) \approx \sigma^2$). The effective SNR is $1/\text{EVM}^2$.`, T`Square $M$-QAM: $P_s = 1 - (1 - a)^2$ with $a = 2\left(1 - \tfrac1{\sqrt M}\right)Q\left(\sqrt{\dfrac{3\gamma}{M - 1}}\right)$.`],
        steps: [T`$g = ${tf(10 ** (eps / 20), 4)}$: $\text{IRR} = ${tf(irr)}$ ($${tf(dB(irr))}\,\text{dB}$).`, T`$\text{EVM}^2 = ${tf(1 / irr)} + ${tf(evm2 - 1 / irr - 1 / unDB(snr))} + ${tf(1 / unDB(snr))} = ${tf(evm2)}$, so EVM $= ${tf(evm)}\,\%$ and SNR $= ${tf(snrEff)}\,\text{dB}$.`, T`$P_s = ${tf(ser)}$, against $${tf(ser0)}$ with thermal noise alone.`],
        idea: 'Analog impairments set a floor on SNR that no amount of signal power removes; dense constellations hit that floor first.',
        diagram, prerequisites: 'Complex baseband; QAM; error vector magnitude.',
        verify: () => { // image ratio from the complex gains μ, ν of y = μx + νx*; phase noise by integrating over a Gaussian phase; Q by integration
            const g = 10 ** (eps / 20), f = phi * Math.PI / 180, mu = cx((1 + g * Math.cos(f)) / 2, -g * Math.sin(f) / 2), nu = cx((1 - g * Math.cos(f)) / 2, -g * Math.sin(f) / 2);
            const s = sig * Math.PI / 180, pn = NUM.simpson(th => (2 - 2 * Math.cos(th)) * Math.exp(-th * th / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)), -10 * s, 10 * s, 4000);
            const e2 = cabs(nu) ** 2 / cabs(mu) ** 2 + pn + 10 ** (-snr / 10);
            return [10 * Math.log10(cabs(mu) ** 2 / cabs(nu) ** 2), 100 * Math.sqrt(e2), -10 * Math.log10(e2), modQamSer(M, 1 / e2, modQnum), modQamSer(M, 10 ** (snr / 10), modQnum)];
        }
    });
}

/* Level 4 (mastery): the distance spectrum of a rate-1/2 convolutional code and its union bound. */
const CONV_CODES = [{g: [5, 7], K: 3}, {g: [15, 17], K: 4}, {g: [23, 35], K: 5}, {g: [53, 75], K: 6}, {g: [133, 171], K: 7}];
const convStep = (code, state, u) => { const reg = u << (code.K - 1) | state, gb = code.g.map(o => parseInt(String(o), 8)); return {next: reg >> 1, w: gb.reduce((s, gg) => s + (modPopcount(reg & gg) & 1), 0)}; };
const convSpectrum = (code, Dcap) => { // trellis dynamic programme over paths that leave state 0 and first return to it: counts A_d and input weights B_d
    const S = 1 << (code.K - 1), A = Array(Dcap + 1).fill(0), B = Array(Dcap + 1).fill(0), first = convStep(code, 0, 1);
    let cnt = Array.from({length: S}, () => Array(Dcap + 1).fill(0)), inw = cnt.map(r => r.slice());
    cnt[first.next][first.w] = 1; inw[first.next][first.w] = 1;
    for (let it = 0; it < 400; it++) {
        const nc = Array.from({length: S}, () => Array(Dcap + 1).fill(0)), ni = nc.map(r => r.slice());
        let live = false;
        for (let s = 1; s < S; s++) for (let w = 0; w <= Dcap; w++) if (cnt[s][w]) for (const u of [0, 1]) {
            const st = convStep(code, s, u), w2 = w + st.w;
            if (w2 > Dcap) continue;
            if (st.next === 0) { A[w2] += cnt[s][w]; B[w2] += inw[s][w]; }
            else { nc[st.next][w2] += cnt[s][w]; ni[st.next][w2] += inw[s][w] + u * cnt[s][w]; live = true; }
        }
        cnt = nc; inw = ni;
        if (!live) break;
    }
    return {A, B};
};
const CONV_SPECTRA = new Map();
function modConvUnion(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'conv-union', date, MOD_READING), p = part;
    const [ci, gdb, target] = grid([0, 1, 2, 3, 4], steps(4, 8, .25), [1e-4, 1e-5, 1e-6, 1e-7]), code = CONV_CODES[ci];
    if (!CONV_SPECTRA.has(ci)) CONV_SPECTRA.set(ci, convSpectrum(code, 25));
    const {A, B} = CONV_SPECTRA.get(ci), df = A.findIndex(v => v > 0), terms = Array.from({length: 10}, (_, i) => df + i);
    const bound = gb => terms.reduce((s, d) => s + B[d] * Qfn(Math.sqrt(d * gb)), 0); // rate 1/2: Q(√(2dR·Eb/N0)) = Q(√(d·Eb/N0))
    const Pb = bound(unDB(gdb)), req = NUM.bisect(d => Math.log(bound(unDB(d))) - Math.log(target), 0, 14, 100), unc = dB(NUM.bisect(x => Math.log(Qfn(Math.sqrt(2 * x))) - Math.log(target), .1, 100, 200)), gain = unc - req;
    const cw = 62, x0 = 110, gbits = code.g.map(o => parseInt(String(o), 8).toString(2).padStart(code.K, '0'));
    const taps = (bitsStr, yBus, yCell, xa) => [...bitsStr].map((c, i) => c === '1' ? wire(`M${x0 + i * cw + cw / 2} ${yCell}V${yBus}`) + dot(x0 + i * cw + cw / 2, yBus) : '').join('') + wire(`M${x0 + cw / 2 + bitsStr.indexOf('1') * cw} ${yBus}H${xa - 18}`);
    const xa = x0 + code.K * cw + 50;
    const diagram = drawing(arrow(30, 130, x0, 130) + dt(52, 118, 'u') + Array.from({length: code.K}, (_, i) => wire(`M${x0 + i * cw} 108h${cw}v44h-${cw}z`) + dt(x0 + i * cw + cw / 2, 136, i ? 'D' : 'u')).join('') +
        taps(gbits[0], 50, 108, xa) + taps(gbits[1], 210, 152, xa) + ring(xa, 50, 18) + dt(xa, 56, '+') + ring(xa, 210, 18) + dt(xa, 216, '+') + arrow(xa + 18, 50, xa + 70, 50) + arrow(xa + 18, 210, xa + 70, 210) + dt(xa + 92, 56, 'c₁') + dt(xa + 92, 216, 'c₂'),
        `Rate one-half convolutional encoder with constraint length ${code.K} and generators ${code.g[0]} and ${code.g[1]} in octal`, 240);
    return q({
        title: 'Union bound for a convolutional code',
        text: T`A rate-$\tfrac12$ convolutional code has constraint length $${code.K}$ and generators $(${code.g[0]}, ${code.g[1]})$ in octal, and is decoded by a soft-decision Viterbi decoder on an AWGN channel with BPSK. A path at Hamming distance $d$ from the correct one wins with probability $Q\bigl(\sqrt{2dRE_b/N_0}\bigr)$. Enumerate the paths that leave the zero state and return to it to find the free distance $d_{\text{free}}$ and the total information-bit weight $B_{d}$ of the error paths at each distance. Using the first ten terms, $P_b \lesssim \sum_{d = d_{\text{free}}}^{d_{\text{free}} + 9}B_dQ\bigl(\sqrt{2dRE_b/N_0}\bigr)$, find the bound at $E_b/N_0 = ${gdb}\,\text{dB}$, the $E_b/N_0$ at which the bound reaches $${modPow10(target)}$, and the coding gain over uncoded BPSK at that bit error rate.`,
        givens: [T`$R = \tfrac12$, $K = ${code.K}$, generators $(${code.g[0]}, ${code.g[1]})_8$`, T`Soft decisions, BPSK, AWGN`, T`$E_b/N_0 = ${gdb}\,\text{dB}$; target $${modPow10(target)}$`],
        parts: [p(T`$d_{\text{free}}$`, df, '', 0), p(T`$B_{d_{\text{free}}}$`, B[df], '', 0), p(`Union bound at ${gdb} dB`, Pb, ''), p('Eb/N0 for the target', req, 'dB', .01, .01), p('Coding gain at the target', gain, 'dB', .01, .01)],
        hints: [T`Track, for every state of the trellis and every accumulated output weight, how many paths there are and how many input 1s they carry; a path ends when it re-enters state 0.`, T`For rate $\tfrac12$, $2dR = d$, so each term is $B_dQ\bigl(\sqrt{dE_b/N_0}\bigr)$.`, T`Solve bound $=$ target by bisection on $E_b/N_0$; uncoded BPSK needs $Q\bigl(\sqrt{2E_b/N_0}\bigr) =$ target. The asymptotic gain is $10\log_{10}(Rd_{\text{free}})$.`],
        steps: [T`Spectrum: ${terms.slice(0, 5).map(d => `$B_{${d}} = ${B[d]}$`).join(', ')}, …`, T`$d_{\text{free}} = ${df}$, asymptotic gain $10\log_{10}(${df}/2) = ${tf(dB(df / 2))}\,\text{dB}$.`, T`At $${gdb}\,\text{dB}$: $P_b \lesssim ${tf(Pb)}$.`, T`Bound $= ${modPow10(target)}$ at $${tf(req)}\,\text{dB}$; uncoded BPSK needs $${tf(unc)}\,\text{dB}$: a gain of $${tf(gain)}\,\text{dB}$.`],
        idea: 'A convolutional code’s performance at high SNR is set by its free distance and the multiplicity of the paths there; the full distance spectrum gives the union bound.',
        diagram, prerequisites: 'Trellises; the Viterbi algorithm; union bounds.',
        verify: () => { // backward recursion: the paths from each state back to state 0 within a weight budget, memoised
            const Dm = df + 9, Av = Array(Dm + 1).fill(0), Bv = Array(Dm + 1).fill(0), memo = new Map();
            const back = (st0, r) => {
                const key = st0 * 64 + r; if (memo.has(key)) return memo.get(key);
                const c = Array(r + 1).fill(0), iw = Array(r + 1).fill(0);
                for (const u of [0, 1]) {
                    const st = convStep(code, st0, u); if (st.w > r) continue;
                    if (st.next === 0) { c[st.w] += 1; iw[st.w] += u; continue; }
                    const [c2, i2] = back(st.next, r - st.w); c2.forEach((v, w) => { if (v) { c[w + st.w] += v; iw[w + st.w] += i2[w] + u * v; } });
                }
                memo.set(key, [c, iw]); return [c, iw];
            };
            const f = convStep(code, 0, 1), [cf, inf] = back(f.next, Dm - f.w);
            cf.forEach((v, w) => { Av[w + f.w] += v; Bv[w + f.w] += inf[w] + v; });
            const d0 = Av.findIndex(v => v > 0), bnd = x => Bv.reduce((s, b, d) => s + (d >= d0 ? b * modQnum(Math.sqrt(d * x)) : 0), 0);
            const r = NUM.bisect(d => bnd(10 ** (d / 10)) - target, 0, 14, 45), u0 = NUM.bisect(d => modQnum(Math.sqrt(2 * 10 ** (d / 10))) - target, 0, 16, 45);
            return [d0, Bv[d0], bnd(10 ** (gdb / 10)), r, u0 - r];
        }
    });
}
