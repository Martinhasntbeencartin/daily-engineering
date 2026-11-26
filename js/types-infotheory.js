/* Information theory: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (joint tables, bisection, closed forms, recursion). */
const INFO_READING = {title: 'Information Theory (MIT OpenCourseWare 6.441)', url: 'https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/'};
addTypes('infotheory', 'university', infoBSC, infoJointEntropy, infoArithmetic);
addTypes('infotheory', 'challenge', infoMarkov, infoRateDistortion, infoShannonLimit);
addTypes('infotheory', 'expert', infoPolarBEC);
addTypes('infotheory', 'mastery', infoErgodic);

const Hsum = ps => -ps.reduce((s, x) => s + (x > 0 ? x * Math.log2(x) : 0), 0);

/* Level 2: a binary symmetric channel: capacity, mutual information at a biased input, and two channels in cascade. */
function infoBSC(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'bsc', date, INFO_READING), p = part;
    const [pe, qx, p2] = grid(steps(.01, .3, .01), [.1, .2, .3, .4, .5], [.01, .02, .05, .1]);
    const Hp = H2(pe), C = 1 - Hp, I = H2(qx * (1 - pe) + (1 - qx) * pe) - Hp, pc = pe + p2 - 2 * pe * p2, Cc = 1 - H2(pc);
    const diagram = drawing(ring(170, 70, 8) + ring(170, 190, 8) + ring(550, 70, 8) + ring(550, 190, 8) + arrow(180, 70, 540, 70) + arrow(180, 190, 540, 190) + arrow(180, 76, 540, 184) + arrow(180, 184, 540, 76) +
        dt(140, 76, '0') + dt(140, 196, '1') + dt(580, 76, '0') + dt(580, 196, '1') + dt(360, 58, `1 − ${pe}`) + dt(360, 214, `1 − ${pe}`) + dt(240, 134, `${pe}`) + dt(480, 134, `${pe}`) + dt(100, 136, `P(X=1) = ${qx}`), 'Binary symmetric channel: each bit is flipped with the same probability', 240);
    return q({
        title: 'A binary symmetric channel',
        text: T`A binary symmetric channel flips each bit with probability $p = ${pe}$. Find the binary entropy $H(p)$ and the capacity. With a biased input, $P(X = 1) = ${qx}$, find the mutual information $I(X;Y)$. The output then passes through a second, independent BSC with crossover $${p2}$: find the crossover probability of the cascade and its capacity.`,
        givens: [T`$p = ${pe}$`, T`$P(X = 1) = ${qx}$`, T`Second BSC: $p_2 = ${p2}$`],
        parts: [p(T`$H(p)$`, Hp, 'bit'), p('Capacity', C, 'bit/use'), p(T`$I(X;Y)$ at the biased input`, I, 'bit'), p('Cascade crossover probability', pc, ''), p('Cascade capacity', Cc, 'bit/use')],
        hints: [T`$H(p) = -p\log_2p - (1 - p)\log_2(1 - p)$; the BSC capacity is $1 - H(p)$, reached with equally likely inputs.`, T`$I(X;Y) = H(Y) - H(Y|X) = H\bigl(P(Y = 1)\bigr) - H(p)$ with $P(Y = 1) = q(1 - p) + (1 - q)p$.`, T`A bit survives the cascade unflipped if neither or both channels flip it: $p_c = p + p_2 - 2pp_2$.`],
        steps: [T`$H(${pe}) = ${tf(Hp)}$, so $C = ${tf(C)}\,\text{bit/use}$.`, T`$P(Y = 1) = ${tf(qx * (1 - pe) + (1 - qx) * pe)}$, so $I = ${tf(H2(qx * (1 - pe) + (1 - qx) * pe))} - ${tf(Hp)} = ${tf(I)}\,\text{bit}$.`, T`$p_c = ${tf(pc)}$ and $C_c = 1 - H(p_c) = ${tf(Cc)}\,\text{bit/use}$, less than either channel alone.`],
        idea: 'Capacity is mutual information maximised over the input; cascading channels can only lose information (the data-processing inequality).',
        diagram, prerequisites: 'Entropy; mutual information; probability.',
        verify: () => { // mutual information from the joint table; capacity by golden-section search over the input bias
            const mi = (qq, pp) => { const j = [[(1 - qq) * (1 - pp), (1 - qq) * pp], [qq * pp, qq * (1 - pp)]], px = [1 - qq, qq], py = [j[0][0] + j[1][0], j[0][1] + j[1][1]]; let s = 0; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (j[a][b] > 0) s += j[a][b] * Math.log2(j[a][b] / (px[a] * py[b])); return s; };
            const cap = pp => { let lo = 0, hi = 1; const gr = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 100; i++) { const c = hi - gr * (hi - lo), d = lo + gr * (hi - lo); if (mi(c, pp) > mi(d, pp)) hi = d; else lo = c; } return mi((lo + hi) / 2, pp); };
            const flip = (1 - pe) * p2 + pe * (1 - p2);
            return [Hsum([pe, 1 - pe]), cap(pe), mi(qx, pe), flip, cap(flip)];
        }
    });
}

/* Level 2: entropies and mutual information from a joint probability table. */
let JOINT_TABLES = null;
function infoJointEntropy(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'joint-entropy', date, INFO_READING), p = part;
    if (!JOINT_TABLES) { JOINT_TABLES = []; const rec = (left, parts) => { if (parts.length === 5) { if (left >= 1) JOINT_TABLES.push([...parts, left]); return; } for (let k = 1; k <= left - (5 - parts.length); k++) rec(left - k, [...parts, k]); }; rec(20, []); }
    const [cells] = grid(JOINT_TABLES), J = [cells.slice(0, 3).map(c => c / 20), cells.slice(3).map(c => c / 20)];
    const px = J.map(r => r.reduce((s, v) => s + v, 0)), py = [0, 1, 2].map(j => J[0][j] + J[1][j]), HX = Hsum(px), HY = Hsum(py), HXY = Hsum(J.flat()), HYgX = HXY - HX, I = HX + HY - HXY;
    const diagram = drawing(J.map((row, i) => row.map((v, j) => wire(`M${230 + j * 110} ${80 + i * 60}h110v60h-110z`) + dt(285 + j * 110, 116 + i * 60, String(v))).join('') + dt(195, 116 + i * 60, `x${i + 1}`)).join('') + [0, 1, 2].map(j => dt(285 + j * 110, 66, `y${j + 1}`)).join('') + dt(360, 236, 'joint distribution p(x, y)'),
        'A two-by-three table of joint probabilities for X and Y', 250);
    return q({
        title: 'Entropies from a joint distribution',
        text: T`$X$ takes two values and $Y$ three, with the joint probabilities in the table. Find $H(X)$, $H(Y)$, the joint entropy $H(X, Y)$, the conditional entropy $H(Y|X)$, and the mutual information $I(X;Y)$.`,
        givens: [T`$p(x_1, \cdot) = (${J[0].join(',\\ ')})$`, T`$p(x_2, \cdot) = (${J[1].join(',\\ ')})$`],
        parts: [p(T`$H(X)$`, HX, 'bit'), p(T`$H(Y)$`, HY, 'bit'), p(T`$H(X, Y)$`, HXY, 'bit'), p(T`$H(Y|X)$`, HYgX, 'bit'), p(T`$I(X;Y)$`, I, 'bit', .01, .001)],
        hints: [T`Marginals: sum each row for $p(x)$ and each column for $p(y)$.`, T`$H(X, Y) = -\sum p(x, y)\log_2p(x, y)$ over all six cells.`, T`Chain rule: $H(Y|X) = H(X, Y) - H(X)$, and $I(X;Y) = H(X) + H(Y) - H(X, Y)$.`],
        steps: [T`$p(x) = (${px.map(v => tf(v)).join(',\\ ')})$, $p(y) = (${py.map(v => tf(v)).join(',\\ ')})$.`, T`$H(X) = ${tf(HX)}$, $H(Y) = ${tf(HY)}$, $H(X, Y) = ${tf(HXY)}\,\text{bit}$.`, T`$H(Y|X) = ${tf(HYgX)}$ and $I(X;Y) = ${tf(I)}\,\text{bit}$.`],
        idea: 'Mutual information is the overlap of two entropies: how much knowing one variable shrinks the uncertainty about the other.',
        diagram, prerequisites: 'Probability tables; entropy; the chain rule.',
        verify: () => { // H(Y|X) as the average of the row entropies; I as relative entropy of the joint to the product of marginals
            const hyx = J.reduce((s, row, i) => s + px[i] * Hsum(row.map(v => v / px[i])), 0), mi = J.reduce((s, row, i) => s + row.reduce((t, v, j) => t + v * Math.log2(v / (px[i] * py[j])), 0), 0);
            return [Hsum(px), Hsum(py), Hsum(px) + hyx, hyx, mi];
        }
    });
}

/* Level 2: arithmetic coding of a four-symbol message. */
function infoArithmetic(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'arithmetic', date, INFO_READING), p = part;
    const [pr, s1, s2, s3, s4] = grid([[.5, .3, .2], [.6, .3, .1], [.4, .4, .2], [.7, .2, .1], [.5, .25, .25], [.45, .35, .2], [.6, .25, .15], [.8, .1, .1]], [0, 1, 2], [0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const msg = [s1, s2, s3, s4], cum = [0, pr[0], pr[0] + pr[1]], names = 'ABC';
    let low = 0, width = 1; msg.forEach(s => { low += width * cum[s]; width *= pr[s]; });
    const info = -Math.log2(width), bits = Math.ceil(info) + 1, H4 = 4 * Hsum(pr), word = msg.map(s => names[s]).join('');
    const diagram = drawing(wire('M80 120H640') + [0, cum[1], cum[2], 1].map((c, i) => wire(`M${80 + 560 * c} 105v30`) + (i < 3 ? dt(80 + 560 * (c + pr[i] / 2), 100, names[i]) : '')).join('') + dt(80, 160, '0') + dt(640, 160, '1') + `<path d="M${(80 + 560 * low).toFixed(1)} 175h${Math.max(2, 560 * width).toFixed(1)}" stroke="#aa492a" stroke-width="5"/>` +
        dt(360, 210, `final interval for ${word}`), 'The unit interval split into sub-intervals for A, B and C, with the final interval of the message marked below it', 240);
    return q({
        title: 'Arithmetic coding of a short message',
        text: T`A memoryless source emits A, B and C with probabilities $${pr.join(',\\ ')}$. An arithmetic coder splits $[0, 1)$ in that order (A lowest) and narrows the interval symbol by symbol. Encode the message ${word}: give the lower end and the width of the final interval. How much information does the message carry, and how many bits does the coder need to identify the interval (use $\lceil-\log_2\text{width}\rceil + 1$)? Compare with four times the source entropy.`,
        givens: [T`$P(A), P(B), P(C) = ${pr.join(',\\ ')}$`, `Message ${word}`, 'Order A, B, C from 0 upwards'],
        parts: [p('Lower end of the final interval', low, '', .001, 1e-6), p('Width of the final interval', width, ''), p('Information in the message', info, 'bit'), p('Bits needed', bits, 'bit', 0), p('Four times the entropy', H4, 'bit')],
        hints: [T`Each symbol moves the lower end up by (current width) × (cumulative probability of the symbols below it), then multiplies the width by its own probability.`, T`The final width is the product of the four probabilities, so the information is $-\log_2(\text{width})$ bits.`, T`One bit more than the rounded-up information always fits a binary fraction inside the interval: $\lceil-\log_2w\rceil + 1$ bits.`],
        steps: [T`Cumulative starts: A at $0$, B at $${cum[1]}$, C at $${tf(cum[2])}$.`, T`After ${word}: lower end $${tf(low, 6)}$, width $${tf(width, 6)}$.`, T`Information $-\log_2${tf(width, 6)} = ${tf(info)}$ bits, so $${bits}$ bits are needed.`, T`$4H = ${tf(H4)}$ bits: arithmetic coding approaches the entropy for long messages.`],
        idea: 'Arithmetic coding represents a whole message by one number inside a nested interval; its length tracks the message’s information content, not a per-symbol code.',
        diagram, prerequisites: 'Probability; logarithms; interval arithmetic.',
        verify: () => { // the lower end as an explicit sum over prefixes, the width as a product
            let l = 0; msg.forEach((s, i) => { l += cum[s] * msg.slice(0, i).reduce((acc, t) => acc * pr[t], 1); });
            const w = msg.reduce((acc, s) => acc * pr[s], 1);
            return [l, w, Math.log2(1 / w), Math.ceil(Math.log2(1 / w)) + 1, 4 * Hsum(pr)];
        }
    });
}

/* Level 3: the entropy rate of a two-state Markov source. */
function infoMarkov(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'markov', date, INFO_READING), p = part;
    const [a, b] = grid(steps(.02, .5, .02), steps(.05, .9, .05)), pi1 = a / (a + b), rate = (1 - pi1) * H2(a) + pi1 * H2(b), H1 = H2(pi1), pair = (H1 + rate) / 2;
    const diagram = drawing(ring(240, 130, 40) + dt(240, 136, '0') + ring(480, 130, 40) + dt(480, 136, '1') + `<path d="M276 112Q360 60 444 112"/>` + `<path d="M444 148Q360 200 276 148"/>` + arrow(440, 116, 445, 113) + arrow(281, 145, 276, 148) +
        dt(360, 70, `P(0→1) = ${a}`) + dt(360, 208, `P(1→0) = ${b}`) + `<path d="M204 112q-50 18 0 36"/>` + `<path d="M516 112q50 18 0 36"/>` + dt(140, 136, `${tf(1 - a)}`) + dt(590, 136, `${tf(1 - b)}`), 'A two-state Markov chain with transition probabilities between states 0 and 1', 240);
    return q({
        title: 'Entropy rate of a source with memory',
        text: T`A binary source is a Markov chain: after a 0 the next symbol is 1 with probability $${a}$; after a 1 it is 0 with probability $${b}$. Find the stationary probability of a 1, the entropy rate $H(X_n|X_{n-1})$, the entropy $H(X)$ of a single symbol, the entropy per symbol of pairs $\tfrac12H(X_1, X_2)$, and the fewest bits needed on average to code 1000 symbols.`,
        givens: [T`$P(1|0) = ${a}$`, T`$P(0|1) = ${b}$`, 'Stationary source'],
        parts: [p('Stationary P(1)', pi1, ''), p('Entropy rate', rate, 'bit/symbol'), p(T`$H(X)$`, H1, 'bit'), p('Pair entropy per symbol', pair, 'bit/symbol'), p('Bits for 1000 symbols', 1000 * rate, 'bit')],
        hints: [T`Balance the flow between the states: $\pi_0a = \pi_1b$, so $\pi_1 = \dfrac{a}{a + b}$.`, T`$H(X_n|X_{n-1}) = \pi_0H(a) + \pi_1H(b)$ with the binary entropy function $H$.`, T`$H(X_1, X_2) = H(X_1) + H(X_2|X_1)$; the entropy rate is the limit of the per-symbol block entropy.`],
        steps: [T`$\pi_1 = ${tf(pi1)}$.`, T`Rate $= ${tf(1 - pi1)}\times${tf(H2(a))} + ${tf(pi1)}\times${tf(H2(b))} = ${tf(rate)}$ bit/symbol.`, T`$H(X) = ${tf(H1)}$; pairs: $\tfrac12(${tf(H1)} + ${tf(rate)}) = ${tf(pair)}$.`, T`At least $${tf(1000 * rate)}$ bits per 1000 symbols — ${rate < H1 ? 'less than a memoryless code would need' : 'the same as a memoryless code'}.`],
        idea: 'Memory makes a source more predictable: its entropy rate is lower than the entropy of single symbols, and block codes can exploit the difference.',
        diagram, prerequisites: 'Markov chains; conditional entropy.',
        verify: () => { // stationary distribution by power iteration; the rate from the joint pair distribution
            let pv = [1, 0]; for (let i = 0; i < 20000; i++) pv = [pv[0] * (1 - a) + pv[1] * b, pv[0] * a + pv[1] * (1 - b)];
            const pj = [pv[0] * (1 - a), pv[0] * a, pv[1] * b, pv[1] * (1 - b)], h12 = Hsum(pj), h1 = Hsum(pv);
            return [pv[1], h12 - h1, h1, h12 / 2, 1000 * (h12 - h1)];
        }
    });
}

/* Level 3: reverse water-filling for three independent Gaussian components. */
const rdLevel = (sv, R) => { // water level θ and the number of active components (variances sorted, largest first)
    for (let k = 3; k >= 1; k--) { const t = Math.pow(sv.slice(0, k).reduce((acc, v) => acc * v, 1), 1 / k) * 2 ** (-2 * R / k); if (t < sv[k - 1] && (k === 3 || t >= sv[k])) return [t, k]; }
    return null;
};
let RD_CASES = null; // cases where no variance sits on the water level, so the active set is clear-cut
function infoRateDistortion(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'rate-distortion', date, INFO_READING), p = part, vs = [25, 16, 12, 9, 6, 4, 3, 2, 1, .5];
    RD_CASES ||= product(product(vs, vs, vs).filter(([x, y, z]) => x >= y && y >= z), [1, 1.5, 2, 3, 4, 6]).filter(([sv, R]) => { const r = rdLevel(sv, R); return r && sv.every(v => Math.abs(v - r[0]) > .03 * v); });
    const [[[s1, s2, s3], R]] = grid(RD_CASES), sv = [s1, s2, s3], [th, act] = rdLevel(sv, R);
    const D = sv.map(v => Math.min(th, v)), Dt = D.reduce((s, v) => s + v, 0), snr = 10 * Math.log10((s1 + s2 + s3) / Dt);
    const ky = 150 / s1, diagram = drawing(wire('M120 220H600') + sv.map((v, i) => `<rect x="${170 + i * 140}" y="${(220 - ky * v).toFixed(1)}" width="80" height="${(ky * v).toFixed(1)}" fill="#e9eee6" stroke="#315740"/>` + dt(210 + i * 140, 240, `σ²${'₁₂₃'[i]} = ${v}`)).join('') +
        guide(`M140 ${(220 - ky * th).toFixed(1)}H580`) + dt(620, 224 - ky * th, 'θ'), 'Three component variances drawn as bars with the reverse water-filling level θ across them', 260);
    return q({
        title: 'Reverse water-filling for Gaussian sources',
        text: T`Three independent zero-mean Gaussian components have variances $${s1}$, $${s2}$ and $${s3}$, and are to be described with a total of $R = ${R}$ bits per vector under mean-square error. Rate–distortion theory gives $R = \sum_i\max\left(0,\ \tfrac12\log_2\dfrac{\sigma_i^2}{D_i}\right)$ with $D_i = \min(\theta, \sigma_i^2)$ (reverse water-filling). Find the water level $\theta$, the total distortion, the distortion of the weakest component, the reconstruction SNR $10\log_{10}\dfrac{\sum\sigma_i^2}{\sum D_i}$, and how many components receive a non-zero rate.`,
        givens: [T`$\sigma^2 = (${s1},\ ${s2},\ ${s3})$`, T`$R = ${R}$ bits per vector`, 'Mean-square error'],
        parts: [p(T`$\theta$`, th, ''), p('Total distortion', Dt, ''), p('Distortion of the weakest component', D[2], ''), p('Reconstruction SNR', snr, 'dB'), p('Components with non-zero rate', act, '', 0)],
        hints: [T`Components with $\sigma_i^2 \le \theta$ get no bits and keep distortion $\sigma_i^2$; the others are all reproduced with the same distortion $\theta$.`, T`If $k$ components are active, $R = \sum_{i\le k}\tfrac12\log_2(\sigma_i^2/\theta)$, so $\theta = \left(\prod_{i\le k}\sigma_i^2\right)^{1/k}2^{-2R/k}$.`, T`Try $k = 3$ first; if $\theta$ exceeds the smallest variance, drop that component and try again.`],
        steps: [T`With $k = ${act}$ active components: $\theta = ${tf(th)}$.`, T`$D = (${D.map(v => tf(v)).join(',\\ ')})$, total $${tf(Dt)}$.`, T`SNR $= 10\log_{10}(${s1 + s2 + s3}/${tf(Dt)}) = ${tf(snr)}\,\text{dB}$.`],
        idea: 'Bits go where the variance is: components weaker than the water level are not worth describing at all.',
        diagram, prerequisites: 'Rate–distortion for Gaussians; logarithms; constrained optimisation.',
        verify: () => { // bisection on θ for the rate constraint
            const rate = t => sv.reduce((s, v) => s + Math.max(0, .5 * Math.log2(v / t)), 0), t = NUM.bisect(x => rate(x) - R, 1e-9, 16, 200), d = sv.map(v => Math.min(t, v));
            return [t, d[0] + d[1] + d[2], d[2], 10 * Math.log10((s1 + s2 + s3) / (d[0] + d[1] + d[2])), sv.filter(v => v > t + 1e-12).length];
        }
    });
}

/* Level 3: how close a link can get to the Shannon limit. */
function infoShannonLimit(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'shannon-limit', date, INFO_READING), p = part;
    const [[B, Rb], N0, gap] = grid(product([1, 2, 5, 10, 20], [.5, 1, 2, 5, 10, 20, 50]).filter(([b, r]) => r / b <= 8), [-174, -170, -165], [1.5, 2, 3, 4]);
    const eta = Rb / B, ebn0 = (2 ** eta - 1) / eta, Pmin = 10 * Math.log10(ebn0 * Rb * 1e6) + N0, Pinf = 10 * Math.log10(Math.LN2 * Rb * 1e6) + N0, Pprac = Pmin + gap;
    const diagram = curve('spectral efficiency η (bit/s/Hz)', 'minimum Eb/N0 (dB)', [0, 8], [-2, 16], x => 10 * Math.log10(Math.max(1e-9, (2 ** Math.max(x, 1e-6) - 1) / Math.max(x, 1e-6))));
    return q({
        title: 'How close to the Shannon limit?',
        text: T`A link must carry $${Rb}\,\text{Mbit/s}$ in $${B}\,\text{MHz}$ of an AWGN channel whose noise density is $${N0}\,\text{dBm/Hz}$. From $C = B\log_2(1 + S/N)$, find the spectral efficiency, the minimum $E_b/N_0$, and the minimum received power that capacity allows. Find the minimum power if the bandwidth were unlimited ($E_b/N_0 \to \ln2$), and the power a practical coded system needs if it operates $${gap}\,\text{dB}$ from capacity.`,
        givens: [T`$R_b = ${Rb}\,\text{Mbit/s}$, $B = ${B}\,\text{MHz}$`, T`$N_0 = ${N0}\,\text{dBm/Hz}$`, T`Practical gap $${gap}\,\text{dB}$`],
        parts: [p('Spectral efficiency', eta, 'bit/s/Hz'), p(T`Minimum $E_b/N_0$`, 10 * Math.log10(ebn0), 'dB', .01, .01), p('Minimum received power', Pmin, 'dBm', .01, .02), p('Minimum power, unlimited bandwidth', Pinf, 'dBm', .01, .02), p('Practical system power', Pprac, 'dBm', .01, .02)],
        hints: [T`At capacity $R_b = B\log_2(1 + S/N)$ with $S/N = \dfrac{E_bR_b}{N_0B}$, so $\dfrac{E_b}{N_0} = \dfrac{2^\eta - 1}{\eta}$ with $\eta = R_b/B$.`, T`Received power $P = (E_b/N_0)\cdot N_0\cdot R_b$; in dBm add $10\log_{10}$ of $E_b/N_0$ and $R_b$ to $N_0$.`, T`As $\eta \to 0$, $(2^\eta - 1)/\eta \to \ln2$ ($-1.59\,\text{dB}$), the ultimate limit.`],
        steps: [T`$\eta = ${tf(eta)}\,\text{bit/s/Hz}$, so $E_b/N_0 \ge ${tf(ebn0)}$ ($${tf(10 * Math.log10(ebn0))}\,\text{dB}$).`, T`$P_{\min} = ${tf(10 * Math.log10(ebn0))} + 10\log_{10}(${Rb}\times10^6) + (${N0}) = ${tf(Pmin)}\,\text{dBm}$.`, T`Unlimited bandwidth: $${tf(Pinf)}\,\text{dBm}$.`, T`Practical: $${tf(Pprac)}\,\text{dBm}$.`],
        idea: 'Capacity trades power for bandwidth: the closer a link packs bits per hertz, the more energy each bit needs, while no amount of bandwidth gets below −1.59 dB.',
        diagram, prerequisites: 'Shannon capacity; decibels.',
        verify: () => { // bisection on the received power that makes the capacity equal the bit rate
            const n0 = 10 ** (N0 / 10) / 1000, P = NUM.bisect(pw => B * 1e6 * Math.log2(1 + pw / (n0 * B * 1e6)) - Rb * 1e6, 0, 1, 300), pd = 10 * Math.log10(P * 1000);
            return [Rb / B, 10 * Math.log10(P / (n0 * Rb * 1e6)), pd, 10 * Math.log10(NUM.bisect(pw => pw / (n0 * Math.LN2) - Rb * 1e6, 0, 1, 300) * 1000), pd + gap];
        }
    });
}

/* Level 4 (expert): channel polarisation on a binary erasure channel and the frozen set of a polar code. */
function infoPolarBEC(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'polar-bec', date, INFO_READING), p = part;
    const [eps, n, rate] = grid(steps(.05, .7, .025), [3, 4, 5], [.25, .375, .5, .625, .75]), N = 2 ** n, K = rate * N;
    let Z = [eps]; for (let l = 0; l < n; l++) Z = Z.flatMap(z => [2 * z - z * z, z * z]);
    const sorted = Z.slice().sort((x, y) => x - y), good = Z.filter(z => z < .1).length, bound = sorted.slice(0, K).reduce((s, z) => s + z, 0);
    const diagram = drawing(Z.map((z, i) => `<rect x="${(80 + i * 560 / N).toFixed(1)}" y="${(220 - 160 * z).toFixed(1)}" width="${(560 / N - 2).toFixed(1)}" height="${(160 * z).toFixed(1)}" fill="#e9eee6" stroke="#315740" stroke-width="1"/>`).join('') + wire('M80 220H650M80 220V50') +
        guide(`M80 ${220 - 160 * eps}H650`) + dt(690, 224 - 160 * eps, `ε = ${eps}`) + dt(365, 248, `erasure probability of the ${N} synthetic channels`), `Bar chart of the erasure probabilities of the ${N} synthetic channels after polarisation`, 262);
    return q({
        title: 'Channel polarisation for a polar code',
        text: T`A polar code of length $N = ${N}$ is used on a binary erasure channel with erasure probability $\varepsilon = ${eps}$. Each polarisation step turns a channel with erasure probability $z$ into a worse one, $2z - z^2$, and a better one, $z^2$. Apply $${n}$ steps to get the $${N}$ synthetic channels. Find the erasure probability of the worst and of the best channel, how many channels have erasure probability below $0.1$, the union bound on the block error probability of successive cancellation decoding when the $K = ${K}$ best channels carry information (the sum of their erasure probabilities), and the fraction of channels below $0.1$.`,
        givens: [T`BEC, $\varepsilon = ${eps}$`, T`$N = ${N}$ ($${n}$ steps), $K = ${K}$`, T`$z^- = 2z - z^2$, $z^+ = z^2$`],
        parts: [p('Worst channel', Math.max(...Z), ''), p('Best channel', Math.min(...Z), '', .01, 1e-12), p('Channels below 0.1', good, '', 0), p('Union bound on block errors', bound, '', .01, 1e-9), p('Fraction below 0.1', good / N, '', .001, .001)],
        hints: [T`Start from $[\varepsilon]$; each step replaces every $z$ by the pair $2z - z^2$, $z^2$.`, T`The average erasure probability stays $\varepsilon$ at every step, while the values spread towards 0 and 1.`, T`Freeze the $N - K$ worst channels. Successive cancellation fails if any information channel erases, so $P_B \le \sum$ of the $K$ smallest $z$.`],
        steps: [T`After $${n}$ steps the erasure probabilities range from $${tf(Math.min(...Z))}$ to $${tf(Math.max(...Z))}$ (mean $${tf(Z.reduce((s, v) => s + v, 0) / N)} = \varepsilon$).`, T`$${good}$ of the $${N}$ channels are below $0.1$ (fraction $${tf(good / N)}$, against the capacity $1 - \varepsilon = ${tf(1 - eps)}$).`, T`The $${K}$ best sum to $${tf(bound)}$.`],
        idea: 'Polarisation splits copies of a channel into nearly perfect and nearly useless ones; the fraction of good channels tends to the capacity.',
        diagram, prerequisites: 'Erasure channels; recursion; union bounds.',
        verify: () => { // the same recursion written for capacities: I⁻ = I², I⁺ = 2I − I²
            let I = [1 - eps]; for (let l = 0; l < n; l++) I = I.flatMap(x => [x * x, 2 * x - x * x]);
            const z = I.map(x => 1 - x), s = z.slice().sort((x, y) => x - y), g = z.filter(v => v < .1).length;
            return [Math.max(...z), Math.min(...z), g, s.slice(0, K).reduce((acc, v) => acc + v, 0), g / N];
        }
    });
}

/* Level 4 (mastery): ergodic and outage capacity of a Rayleigh-fading channel, with and without diversity. */
function infoErgodic(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'ergodic', date, INFO_READING), p = part;
    const [gdb, R, eo] = grid(steps(0, 30, 1), [1, 2, 3, 4], [.01, .05, .1]), g = 10 ** (gdb / 10);
    const Eexp = (fn, L) => NUM.simpson(t => { const x = Math.exp(t); return fn(x) * (L === 1 ? 1 : x) * Math.exp(-x) * x; }, -30, Math.log(80), 3000);
    const Cerg = Eexp(x => Math.log2(1 + g * x), 1), Cawgn = Math.log2(1 + g), Pout = 1 - Math.exp(-(2 ** R - 1) / g), Ceps = Math.log2(1 - g * Math.log(1 - eo)), C2 = Eexp(x => Math.log2(1 + g * x / 2), 2);
    const diagram = curve('average SNR (dB)', 'capacity (bit/s/Hz)', [0, 30], [0, 10], d => Math.log2(1 + 10 ** (d / 10)));
    return q({
        title: 'Capacity of a fading channel',
        text: T`A narrowband link has Rayleigh fading: the instantaneous SNR is $\bar\gamma X$ with $X$ exponential (mean 1) and average SNR $\bar\gamma = ${gdb}\,\text{dB}$. Find the ergodic capacity $E[\log_2(1 + \bar\gamma X)]$ by numerical integration, and compare with the AWGN capacity at the same average SNR. If the code rate is fixed at $${R}\,\text{bit/s/Hz}$ and a frame is lost whenever the instantaneous capacity falls below it, find the outage probability. Find the capacity that is achieved with outage probability $${eo}$. Finally find the ergodic capacity with two receive branches combined by MRC, keeping the same total average SNR ($X$ then has density $xe^{-x}$ and SNR $\bar\gamma X/2$).`,
        givens: [T`$\bar\gamma = ${gdb}\,\text{dB}$, Rayleigh fading`, T`Fixed rate $${R}\,\text{bit/s/Hz}$; outage target $${eo}$`, 'Two-branch MRC at equal total SNR'],
        parts: [p('Ergodic capacity', Cerg, 'bit/s/Hz'), p('AWGN capacity', Cawgn, 'bit/s/Hz'), p('Outage probability', Pout, '', .01, 1e-6), p(`Capacity at ${eo} outage`, Ceps, 'bit/s/Hz'), p('Ergodic capacity with 2-branch MRC', C2, 'bit/s/Hz')],
        hints: [T`$C = \displaystyle\int_0^\infty\log_2(1 + \bar\gamma x)e^{-x}dx$; it equals $\log_2(e)\,e^{1/\bar\gamma}E_1(1/\bar\gamma)$. By Jensen's inequality it is below $\log_2(1 + \bar\gamma)$.`, T`Outage: $P(\log_2(1 + \bar\gamma X) < R) = 1 - e^{-(2^R - 1)/\bar\gamma}$.`, T`Set that probability to the target and solve for $R$: $C_\varepsilon = \log_2(1 - \bar\gamma\ln(1 - \varepsilon))$. For MRC integrate against $xe^{-x}$.`],
        steps: [T`$\bar\gamma = ${tf(g)}$: ergodic $C = ${tf(Cerg)}$, AWGN $${tf(Cawgn)}\,\text{bit/s/Hz}$.`, T`$P_{\text{out}}(${R}) = ${tf(Pout)}$.`, T`$C_{${eo}} = ${tf(Ceps)}\,\text{bit/s/Hz}$.`, T`With 2-branch MRC: $${tf(C2)}\,\text{bit/s/Hz}$, closer to AWGN.`],
        idea: 'Fading costs little in average capacity but a lot in reliability; diversity narrows the spread of the SNR and recovers both.',
        diagram, prerequisites: 'Probability densities; numerical integration; capacity.',
        verify: () => { // exponential-integral closed forms for one branch and for two
            const E1 = z => { let s = 0, t = 1; for (let k = 1; k < 200; k++) { t *= -z / k; s += t / k; } return -.5772156649015329 - Math.log(z) - s; };
            const a = g / 2, c1 = Math.log2(Math.E) * Math.exp(1 / g) * E1(1 / g), c2 = Math.log2(Math.E) * (1 + (1 - 1 / a) * Math.exp(1 / a) * E1(1 / a)); // MRC: by parts, ∫ln(1 + ax)xe^{−x}dx = 1 + (1 − 1/a)e^{1/a}E₁(1/a)
            return [c1, Math.log2(1 + g), 1 - Math.exp(-(2 ** R - 1) / g), NUM.bisect(r => 1 - Math.exp(-(2 ** r - 1) / g) - eo, 0, 40, 200), c2];
        }
    });
}
