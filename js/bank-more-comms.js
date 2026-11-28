/* Level 1, more curated problems: Communications & RF (information theory, modulation & coding, antennas & link budgets, RF circuits).
   verify() checks each answer by an independent numerical method (joint tables, enumeration, simulation, field integrals, ABCD cascades). */

const bkChannel = (ins, outs, edges, caption) => { // edges: [from, to, label, labelX, labelY]
    const Y = (n, i) => n === 1 ? 130 : 60 + i * 140 / (n - 1);
    return drawing(ins.map((t, i) => ring(170, Y(ins.length, i), 8) + dt(140, Y(ins.length, i) + 6, t)).join('') + outs.map((t, i) => ring(550, Y(outs.length, i), 8) + dt(582, Y(outs.length, i) + 6, t)).join('') +
        edges.map(([a, b, t, lx, ly]) => arrow(180, Y(ins.length, a), 540, Y(outs.length, b)) + dt(lx, ly, t)).join('') + dt(360, 246, caption), caption, 255);
};
const bkTree = (leaves, caption) => drawing(wire('M360 40L230 100M360 40L490 100M490 100L410 160M490 100L570 160M570 160L520 215M570 160L620 215') + ring(360, 40, 6) + ring(490, 100, 6) + ring(570, 160, 6) +
    dt(230, 124, leaves[0]) + dt(410, 184, leaves[1]) + dt(500, 238, leaves[2]) + dt(640, 238, leaves[3]) + dt(278, 64, '0') + dt(440, 64, '1') + dt(150, 236, caption), `Binary code tree: ${caption}`, 255);
const bkH = ps => -ps.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
const bkMI = (px, W) => { const py = W[0].map((_, j) => px.reduce((s, p, i) => s + p * W[i][j], 0)); return px.reduce((s, p, i) => s + W[i].reduce((t, w, j) => t + (p * w > 0 ? p * w * Math.log2(w / py[j]) : 0), 0), 0); };
const bkCap2 = W => { let lo = 0, hi = 1; const g = (Math.sqrt(5) - 1) / 2, f = q => bkMI([1 - q, q], W); for (let i = 0; i < 90; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (f(c) > f(d)) hi = d; else lo = c; } return [f((lo + hi) / 2), (lo + hi) / 2]; };

/* ================= INFORMATION THEORY ================= */
bankMore('infotheory', 'advanced', [{
    title: 'The entropy of two dice',
    diagram: curve('sum of two dice', 'ways (out of 36)', [2, 12], [0, 6], s => 6 - Math.abs(s - 7), 'stem'),
    text: T`Two fair dice are thrown. Find the entropy of one die, the entropy of their sum, and the information lost by reporting only the sum, $H(\text{dice}\mid\text{sum})$.`,
    parts: [ex('One die', Math.log2(6), T`\log_2 6`, 'bit'), ex('The sum', 23 / 18 + 5 / 3 * Math.log2(3) - 5 / 18 * Math.log2(5), T`\tfrac{23}{18} + \tfrac{5}{3}\log_2 3 - \tfrac{5}{18}\log_2 5`, 'bit'), ex('Information lost', 13 / 18 + Math.log2(3) / 3 + 5 / 18 * Math.log2(5), T`\tfrac{13}{18} + \tfrac{1}{3}\log_2 3 + \tfrac{5}{18}\log_2 5`, 'bit')],
    hints: [T`The sum $s$ has $6 - |s - 7|$ ways out of 36.`, T`The sum is a function of the dice, so $H(\text{dice}) = H(\text{sum}) + H(\text{dice}\mid\text{sum})$.`],
    steps: [T`One die: $\log_26 \approx 2.585$ bits; two dice: $\log_236 \approx 5.170$.`, T`$H(\text{sum}) = \sum\dfrac{n_s}{36}\log_2\dfrac{36}{n_s} \approx 3.274$ bits.`, T`Lost: $5.170 - 3.274 \approx 1.896$ bits, mostly which die showed what.`],
    idea: 'A function can only lose information: the sum keeps 3.27 of the 5.17 bits in a pair of dice.',
    prereq: 'Entropy; probability.',
    verify: () => { const pairs = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) pairs.push(a + b); const ps = Array.from({length: 11}, (_, k) => pairs.filter(s => s === k + 2).length / 36); return [bkH(Array(6).fill(1 / 6)), bkH(ps), bkH(Array(36).fill(1 / 36)) - bkH(ps)]; }
}, {
    title: 'Which codeword lengths are possible?',
    diagram: bkTree(['0', '10', '110', '111'], 'lengths 1, 2, 3, 3'),
    text: T`Can a binary prefix code have codeword lengths $1, 2, 3, 3, 3$? Compute the Kraft sum $\sum2^{-\ell_i}$. If the code already has one word of length 1 and one of length 2, how many words of length 3 can still be added?`,
    parts: [ex('Kraft sum', 9 / 8, T`\dfrac{9}{8}`), exInt('Words of length 3 that fit', 2)],
    hints: [T`A prefix code exists if and only if $\sum2^{-\ell_i} \le 1$.`, T`A word of length 1 uses half of all longer words; one of length 2 a quarter.`],
    steps: [T`$\tfrac{1}{2} + \tfrac{1}{4} + 3\cdot\tfrac{1}{8} = \tfrac{9}{8} > 1$: impossible.`, T`After $\tfrac{1}{2} + \tfrac{1}{4}$, the remaining $\tfrac{1}{4}$ holds $\tfrac{1}{4}\times8 = 2$ words of length 3, e.g. $110$ and $111$.`],
    idea: 'Short codewords are expensive: each uses up a fraction 2^{−ℓ} of the code space, and the Kraft inequality is the budget.',
    prereq: 'Prefix codes.',
    verify: () => { const used = ['0', '10'], free = Array.from({length: 8}, (_, i) => i.toString(2).padStart(3, '0')).filter(w => !used.some(u => w.startsWith(u))); return [[1, 2, 3, 3, 3].reduce((s, l) => s + 2 ** -l, 0), free.length]; }
}, {
    title: 'The Z-channel',
    diagram: bkChannel(['0', '1'], ['0', '1'], [[0, 0, '1', 360, 50], [1, 0, '1/2', 440, 150], [1, 1, '1/2', 360, 220]], 'a 0 always arrives; a 1 is lost half the time'),
    text: T`In a Z-channel a $0$ always arrives correctly, while a $1$ turns into a $0$ with probability $\tfrac{1}{2}$. Find its capacity and the probability of sending a $1$ that achieves it.`,
    parts: [ex('Capacity', Math.log2(1.25), T`\log_2\tfrac{5}{4}`, 'bit/use'), ex('Best P(X = 1)', .4, T`\dfrac{2}{5}`)],
    hints: [T`With $P(X = 1) = q$: $P(Y = 1) = q/2$ and $H(Y\mid X) = q\cdot H(\tfrac{1}{2}) = q$.`, T`$I = H_2(q/2) - q$; set its derivative to zero.`],
    steps: [T`$\tfrac{1}{2}\log_2\dfrac{1 - q/2}{q/2} = 1 \Rightarrow \dfrac{1 - q/2}{q/2} = 4 \Rightarrow q = \tfrac{2}{5}$.`, T`$C = H_2(\tfrac{1}{5}) - \tfrac{2}{5} = \log_25 - 2 = \log_2\tfrac{5}{4} \approx 0.322$ bits.`],
    idea: 'An asymmetric channel favours the reliable symbol: sending fewer 1s (40%) maximises the information that gets through.',
    prereq: 'Mutual information; optimisation.',
    verify: () => bkCap2([[1, 0], [.5, .5]])
}, {
    title: 'Erasures beat errors',
    diagram: bkChannel(['0', '1'], ['0', 'e', '1'], [[0, 0, '0.8', 360, 52], [0, 1, '0.2', 290, 98], [1, 1, '0.2', 290, 172], [1, 2, '0.8', 360, 222]], 'binary erasure channel'),
    text: T`A binary erasure channel loses each bit with probability $0.2$, but the receiver knows which bits were lost. Find its capacity. If instead each erased bit were replaced by a random guess, the result would be a binary symmetric channel with crossover $0.1$: find its capacity.`,
    parts: [ex('Erasure channel', .8, T`\dfrac{4}{5}`, 'bit/use'), ex('Symmetric channel', 1 - (-.1 * Math.log2(.1) - .9 * Math.log2(.9)), T`1 + 0.1\log_2 0.1 + 0.9\log_2 0.9`, 'bit/use')],
    hints: [T`BEC: $C = 1 - \varepsilon$.`, T`BSC: $C = 1 - H_2(p)$.`],
    steps: [T`BEC: $1 - 0.2 = 0.8$ bit per use.`, T`BSC: $1 - H_2(0.1) \approx 1 - 0.469 = 0.531$ bit per use.`, T`Knowing where the damage is worth $0.27$ bit per use.`],
    idea: 'An erasure is far less harmful than an error: knowing which bits are unreliable is itself information, which is why soft decisions help decoders.',
    prereq: 'Channel capacity.',
    verify: () => [bkCap2([[.8, .2, 0], [0, .2, .8]])[0], bkCap2([[.9, .1], [.1, .9]])[0]]
}, {
    title: 'A source whose best code is unary',
    diagram: curve('symbol k', 'probability', [1, 8], [0, .5], k => 2 ** -k, 'stem'),
    text: T`A source emits $k = 1, 2, 3, \dots$ with probability $2^{-k}$. Find its entropy, and the average length of the unary code that sends $k$ as $k - 1$ ones followed by a zero.`,
    parts: [ex('Entropy', 2, '2', 'bit'), ex('Unary code length', 2, '2', 'bit')],
    hints: [T`$H = \sum k\,2^{-k}$ because $\log_2(1/p_k) = k$.`, T`The unary codeword for $k$ has length $k$.`],
    steps: [T`$\sum_{k\ge1}k2^{-k} = 2$, so $H = 2$ bits.`, T`Average unary length $= \sum k2^{-k} = 2$ bits: the code meets the entropy exactly.`],
    idea: 'When probabilities are powers of 1/2, the ideal codeword lengths are integers and a simple code is perfectly efficient; Golomb codes generalise this.',
    prereq: 'Entropy; geometric series.',
    verify: () => { const ps = Array.from({length: 200}, (_, i) => 2 ** -(i + 1)); return [bkH(ps), ps.reduce((s, p, i) => s + p * (i + 1), 0)]; }
}, {
    title: 'Differential entropy of the bell curve',
    diagram: curve('x', 'density', [-4, 4], [0, .45], x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)),
    text: T`Find the differential entropy $h(X) = -\int f\log_2f\,dx$ of a standard Gaussian ($\sigma = 1$). What variance would a Gaussian need to have zero differential entropy, the same as a uniform variable on $[0, 1]$?`,
    parts: [ex(T`$h$ for $\sigma = 1$`, .5 * Math.log2(2 * Math.PI * Math.E), T`\tfrac{1}{2}\log_2(2\pi e)`, 'bit'), ex('Variance for zero entropy', 1 / (2 * Math.PI * Math.E), T`\dfrac{1}{2\pi e}`)],
    hints: [T`$-\log_2f = \tfrac{1}{2}\log_2(2\pi\sigma^2) + \dfrac{x^2}{2\sigma^2}\log_2e$; average over $f$.`, T`$h = \tfrac{1}{2}\log_2(2\pi e\sigma^2)$.`],
    steps: [T`$h = \tfrac{1}{2}\log_2(2\pi e) \approx 2.047$ bits.`, T`$h = 0$ when $2\pi e\sigma^2 = 1$: $\sigma^2 = \dfrac{1}{2\pi e} \approx 0.0586$.`],
    idea: 'Among all densities with a given variance the Gaussian has the largest entropy, which is why Gaussian noise is the worst case and Gaussian inputs achieve capacity.',
    prereq: 'Continuous distributions; logarithms.',
    verify: () => { const h = s2 => -NUM.simpson(x => { const f = Math.exp(-x * x / (2 * s2)) / Math.sqrt(2 * Math.PI * s2); return f > 0 ? f * Math.log2(f) : 0; }, -12 * Math.sqrt(s2), 12 * Math.sqrt(s2), 4000); return [h(1), NUM.bisect(h, .01, 1, 60)]; }
}, {
    title: 'How many sequences are typical?',
    diagram: curve('number of heads k (out of 100)', 'nH(k/n), about log₂ of the number of sequences', [0, 100], [0, 100], k => 100 * bkH([k / 100, 1 - k / 100])),
    text: T`A biased coin shows heads with probability $\tfrac{1}{4}$. For $n = 100$ throws, the asymptotic equipartition property says that about $2^{nH}$ sequences carry almost all the probability. Find $nH$, and $\log_2$ of the number of sequences with exactly 25 heads.`,
    parts: [ex(T`$nH$`, 100 * (2 - .75 * Math.log2(3)), T`200 - 75\log_2 3`, 'bit'), nx(T`$\log_2\binom{100}{25}$`, (() => { let s = 0; for (let i = 1; i <= 25; i++) s += Math.log2((75 + i) / i); return s; })(), 'bit')],
    hints: [T`$H(\tfrac{1}{4}) = 2 - \tfrac{3}{4}\log_23$.`, T`$\log_2\binom{100}{25} = \sum_{i=1}^{25}\log_2\dfrac{75 + i}{i}$, or Stirling: $nH - \tfrac{1}{2}\log_2(2\pi np(1 - p))$.`],
    steps: [T`$nH = 100\times0.8113 \approx 81.1$ bits, out of 100 for all sequences.`, T`$\log_2\binom{100}{25} \approx 77.7$: the single most likely composition holds about $2^{-3.4}$ of the typical set; neighbouring counts of heads fill the rest.`],
    idea: 'Almost all the probability sits on about 2^{nH} sequences, far fewer than 2ⁿ: that gap is exactly what compression removes.',
    prereq: 'Entropy; binomial coefficients.',
    verify: () => { let c = 1n; for (let i = 1n; i <= 25n; i++) c = c * (75n + i) / i; return [100 * bkH([.25, .75]), Math.log2(Number(c))]; } // exact binomial with BigInt
}, {
    title: 'Perfect codes and the sphere-packing bound',
    diagram: sketch('Codewords as points, each surrounded by a sphere of the words within t errors; the spheres must not overlap.',
        [[220, 75], [340, 75], [460, 75], [280, 175], [400, 175], [520, 175]].map(([x, y]) => ring(x, y, 50) + dot(x, y)).join(''), [[360, 256, 'spheres of radius t around codewords must not overlap']], 268),
    text: T`A binary code of length $n$ correcting $t$ errors needs disjoint spheres of $\sum_{i\le t}\binom ni$ words around its codewords, so it has at most $2^n\big/\sum_{i\le t}\binom ni$ codewords. Evaluate this bound for $n = 7, t = 1$ and for $n = 23, t = 3$.`,
    parts: [exInt(T`$n = 7, t = 1$`, 16), exInt(T`$n = 23, t = 3$`, 4096)],
    hints: [T`$n = 7$: spheres of $1 + 7 = 8$ words.`, T`$n = 23$: $1 + 23 + 253 + 1771 = 2048 = 2^{11}$.`],
    steps: [T`$2^7/8 = 16$: met exactly by the $(7, 4)$ Hamming code.`, T`$2^{23}/2^{11} = 4096 = 2^{12}$: met by the $(23, 12)$ Golay code.`, T`Codes that meet the bound tile the whole space with spheres: perfect codes, and there are very few.`],
    idea: 'The sphere-packing bound limits how many codewords can sit far apart; perfect codes fill every word of the space with no waste.',
    prereq: 'Binomial coefficients; Hamming distance.',
    verify: () => { const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }, bound = (n, t) => 2 ** n / Array.from({length: t + 1}, (_, i) => binom(n, i)).reduce((s, v) => s + v, 0); return [bound(7, 1), bound(23, 3)]; }
}, {
    title: 'The noisy typewriter',
    diagram: drawing('ABCDEFG'.split('').map((c, i) => dt(120 + i * 80, 60, c) + dt(120 + i * 80, 210, c) + arrow(120 + i * 80, 70, 120 + i * 80, 192) + (i < 6 ? arrow(126 + i * 80, 70, 194 + i * 80, 192) : '')).join('') + dt(680, 136, '… Z → A') + dt(360, 246, 'each letter arrives as itself or the next, equally likely'),
        'A noisy typewriter channel: each letter is received as itself or the next letter', 255),
    text: T`A "noisy typewriter" has 26 letters arranged in a circle; each typed letter appears as itself or as the next letter, each with probability $\tfrac{1}{2}$. Find its capacity. How many letters can be used so that the receiver is never confused?`,
    parts: [ex('Capacity', Math.log2(13), T`\log_2 13`, 'bit/use'), exInt('Letters for zero error', 13)],
    hints: [T`$C = \max H(Y) - H(Y\mid X)$, with $H(Y\mid X) = 1$ bit for every input.`, T`Use every other letter: their possible outputs never overlap.`],
    steps: [T`A uniform input makes $Y$ uniform: $C = \log_226 - 1 = \log_213 \approx 3.70$ bits.`, T`A, C, E, …: 13 letters whose output pairs are disjoint, so this capacity is reached with no errors at all.`],
    idea: 'Capacity can sometimes be reached with zero error by choosing inputs whose outputs never overlap, which is the idea behind every channel code.',
    prereq: 'Channel capacity.',
    verify: () => { const n = 26; let p = Array(n).fill(1 / n), C = 0; for (let it = 0; it < 300; it++) { const py = Array.from({length: n}, (_, j) => (p[j] + p[(j - 1 + n) % n]) / 2), D = p.map((_, i) => .5 * Math.log2(.5 / py[i]) + .5 * Math.log2(.5 / py[(i + 1) % n])), Z = p.reduce((s, v, i) => s + v * 2 ** D[i], 0); C = Math.log2(Z); p = p.map((v, i) => v * 2 ** D[i] / Z); }
        const path = m => { let inc = 0, exc = 0; for (let i = 0; i < m; i++) { const ni = exc + 1; exc = Math.max(inc, exc); inc = ni; } return Math.max(inc, exc); }; return [C, Math.max(path(n - 1), 1 + path(n - 3))]; } // Blahut–Arimoto; largest independent set of the 26-cycle of confusable letters
}, {
    title: 'Compressing coin flips with errors allowed',
    diagram: curve('allowed distortion D', 'rate R(D) (bit/flip)', [0, .5], [0, 1], d => d <= 0 ? 1 : 1 + d * Math.log2(d) + (1 - d) * Math.log2(1 - d)),
    text: T`Fair coin flips are to be compressed so that, on average, at most a fraction $D$ of them are reproduced wrongly. The rate–distortion function is $R(D) = 1 - H_2(D)$. Find the bits per flip needed for $D = \tfrac{1}{8}$, and the distortion at which no bits at all are needed.`,
    parts: [ex(T`$R(\tfrac{1}{8})$`, 7 / 8 * Math.log2(7) - 2, T`\tfrac{7}{8}\log_2 7 - 2`, 'bit'), ex('Distortion with zero rate', .5, T`\dfrac{1}{2}`)],
    hints: [T`$H_2(\tfrac{1}{8}) = \tfrac{1}{8}\log_28 + \tfrac{7}{8}\log_2\tfrac{8}{7} = 3 - \tfrac{7}{8}\log_27$.`, T`With no bits the decoder can only guess a fixed value.`],
    steps: [T`$R = 1 - 3 + \tfrac{7}{8}\log_27 = \tfrac{7}{8}\log_27 - 2 \approx 0.456$ bit per flip.`, T`Guessing always heads is wrong half the time: $D = \tfrac{1}{2}$ at zero rate.`],
    idea: 'Allowing a little distortion buys a lot of compression: tolerating 12.5% errors more than halves the bits needed for random data.',
    prereq: 'Entropy; rate–distortion.',
    verify: () => { const D = 1 / 8, joint = [[.5 * (1 - D), .5 * D], [.5 * D, .5 * (1 - D)]], I = bkH([.5, .5]) + bkH([.5, .5]) - bkH(joint.flat()); return [I, Math.min(...[0, 1].map(g => .5 * (g === 0 ? 0 : 1) + .5 * (g === 1 ? 0 : 1)))]; } // mutual information of the BSC test channel
}, {
    title: 'Huffman against Shannon’s code',
    diagram: bkTree(['0.4 → 0', '0.3 → 10', '0.2 → 110', '0.1 → 111'], 'Huffman code'),
    text: T`A source has probabilities $0.4, 0.3, 0.2, 0.1$. Find the average length of its Huffman code, and of the Shannon code that gives each symbol a codeword of length $\lceil\log_2(1/p)\rceil$. (The entropy is $1.846$ bits.)`,
    parts: [ex('Huffman', 1.9, T`\dfrac{19}{10}`, 'bit'), ex('Shannon code', 2.4, T`\dfrac{12}{5}`, 'bit')],
    hints: [T`Huffman: merge $0.1 + 0.2$, then $0.3 + 0.3$, then $0.4 + 0.6$.`, T`Shannon lengths: $\lceil1.32\rceil, \lceil1.74\rceil, \lceil2.32\rceil, \lceil3.32\rceil$.`],
    steps: [T`Huffman lengths $1, 2, 3, 3$: $0.4 + 0.6 + 0.6 + 0.3 = 1.9$ bits.`, T`Shannon lengths $2, 2, 3, 4$: $0.8 + 0.6 + 0.6 + 0.4 = 2.4$ bits.`, T`Both lie within one bit of the entropy, but Huffman is optimal.`],
    idea: 'Rounding each ideal length up is simple but wasteful; Huffman’s merging finds the best integer lengths jointly.',
    prereq: 'Prefix codes; Huffman coding.',
    verify: () => { const ps = [.4, .3, .2, .1]; return [huffLen(ps), ps.reduce((s, p) => s + p * Math.ceil(Math.log2(1 / p) - 1e-12), 0)]; }
}]);

/* ================= MODULATION & CODING ================= */
bankMore('modulation', 'advanced', [{
    title: 'Bandwidth of raised-cosine pulses',
    diagram: curve('frequency (MHz)', '|H(f)|', [-1, 1], [0, 1.1], f => { const a = Math.abs(f), lo = .375, hi = .625; return a <= lo ? 1 : a >= hi ? 0 : .5 * (1 + Math.cos(Math.PI * (a - lo) / (hi - lo))); }),
    text: T`A link sends $1\,\text{Msymbol/s}$ with raised-cosine pulses of roll-off $0.25$. Find the one-sided baseband bandwidth, and the spectral efficiency in the passband (where the occupied bandwidth is twice that) if each symbol is 16-QAM.`,
    parts: [ex('Baseband bandwidth', 625, '625', 'kHz'), ex('Spectral efficiency', 3.2, T`\dfrac{16}{5}`, 'bit/s/Hz')],
    hints: [T`Raised-cosine pulses occupy $\dfrac{(1 + \beta)R_s}{2}$ at baseband.`, T`16-QAM carries 4 bits per symbol.`],
    steps: [T`$\dfrac{1.25\times1\,\text{MHz}}{2} = 625\,\text{kHz}$.`, T`Passband width $1.25\,\text{MHz}$ for $4\,\text{Mbit/s}$: $3.2\,\text{bit/s/Hz}$.`],
    idea: 'Nyquist pulses can pack Rs symbols into Rs/2 of bandwidth; the roll-off buys realisable filters and timing tolerance at a cost of β in bandwidth.',
    prereq: 'Nyquist pulses; bandwidth.',
    verify: () => { const H = f => { const a = Math.abs(f), lo = .375e6, hi = .625e6; return a <= lo ? 1 : a >= hi ? 0 : .5 * (1 + Math.cos(Math.PI * (a - lo) / (hi - lo))); }; let lo = .3e6, hi = 1e6; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (H(m) > 0) lo = m; else hi = m; } return [hi / 1e3, 4e6 / (2 * hi)]; }
}, {
    title: 'QPSK is two BPSKs in quadrature',
    diagram: constellationDiagram([[1, 1], [-1, 1], [-1, -1], [1, -1]], 'QPSK: one bit on I, one on Q'),
    text: T`A QPSK receiver decides the in-phase and quadrature bits independently, each wrong with probability $0.01$. What is the probability that a symbol is received wrongly, and the probability that both of its bits are wrong?`,
    parts: [ex('Symbol error probability', .0199, T`\dfrac{199}{10000}`), ex('Both bits wrong', 1e-4, T`\dfrac{1}{10000}`)],
    hints: [T`A symbol is right only if both bits are right.`, T`Independent errors multiply.`],
    steps: [T`$1 - 0.99^2 = 0.0199$.`, T`Both wrong: $0.01^2 = 10^{-4}$. With Gray labelling the bit error rate stays $0.01$, exactly that of BPSK at the same $E_b/N_0$.`],
    idea: 'QPSK doubles the bit rate of BPSK in the same bandwidth at the same bit error rate, because its two carriers are orthogonal.',
    prereq: 'Probability; QPSK.',
    verify: () => { let wrong = 0, both = 0; for (const a of [0, 1]) for (const b of [0, 1]) { const pr = (a ? .01 : .99) * (b ? .01 : .99); if (a || b) wrong += pr; if (a && b) both += pr; } return [wrong, both]; }
}, {
    title: 'Why OFDM has high peaks',
    diagram: curve('time (symbol periods)', '|x(t)|² / mean', [0, 1], [0, 8.5], t => { let re = 0, im = 0; for (let k = 0; k < 8; k++) { re += Math.cos(2 * Math.PI * k * t); im += Math.sin(2 * Math.PI * k * t); } return (re * re + im * im) / 8; }),
    text: T`An OFDM symbol adds $N = 8$ equal subcarriers, $x(t) = \sum_{k=0}^{7}e^{j2\pi kt/T}$, all starting in phase. Find the peak-to-average power ratio of its complex envelope, as a ratio and in decibels. What is it for single-carrier QPSK with rectangular pulses?`,
    parts: [ex('PAPR of 8 tones', 8, '8'), ex('In decibels', 10 * Math.log10(8), T`10\log_{10}8`, 'dB'), ex('Single-carrier QPSK', 1, '1')],
    hints: [T`At $t = 0$ all eight phasors add: $|x|^2 = 64$.`, T`The mean of $|x|^2$ is the sum of the individual powers, $8$.`],
    steps: [T`PAPR $= 64/8 = 8$, i.e. $9.03\,\text{dB}$.`, T`QPSK with rectangular pulses has a constant envelope: PAPR $= 1$ ($0\,\text{dB}$).`],
    idea: 'Summing many carriers occasionally lines up their phases, so OFDM needs power amplifiers with large back-off, or peak-reduction tricks.',
    prereq: 'Complex envelopes; average power.',
    verify: () => { let pk = 0, mean = 0; const M = 8000; for (let i = 0; i < M; i++) { let re = 0, im = 0; for (let k = 0; k < 8; k++) { re += Math.cos(2 * Math.PI * k * i / M); im += Math.sin(2 * Math.PI * k * i / M); } const p = re * re + im * im; pk = Math.max(pk, p); mean += p / M; } return [pk / mean, 10 * Math.log10(pk / mean), 1]; }
}, {
    title: 'Power in an AM signal’s sidebands',
    diagram: curve('time (modulation periods)', 's(t)', [0, 2], [-2.2, 2.2], t => (1 + Math.cos(2 * Math.PI * t)) * Math.cos(2 * Math.PI * 12 * t)),
    text: T`A standard AM signal $[1 + m\cos\omega_mt]\cos\omega_ct$ is modulated by a single tone. What fraction of its power is in the sidebands (the part that carries information) at $m = 1$, and at $m = \tfrac{1}{2}$?`,
    parts: [ex(T`$m = 1$`, 1 / 3, T`\dfrac{1}{3}`), ex(T`$m = \tfrac{1}{2}$`, 1 / 9, T`\dfrac{1}{9}`)],
    hints: [T`The carrier carries $\tfrac{1}{2}$; each sideband has amplitude $m/2$ and power $m^2/8$.`, T`Fraction $= \dfrac{m^2/4}{1/2 + m^2/4} = \dfrac{m^2}{2 + m^2}$.`],
    steps: [T`$m = 1$: $\tfrac{1}{3}$.`, T`$m = \tfrac{1}{2}$: $\dfrac{1/4}{9/4} = \tfrac{1}{9}$.`, T`Even fully modulated, two thirds of the power is spent on the carrier, which is why SSB and suppressed-carrier schemes exist.`],
    idea: 'Ordinary AM is easy to demodulate but power-hungry: the carrier, which carries no information, takes at least two thirds of the power.',
    prereq: 'Modulation; trigonometric identities.',
    verify: () => { const frac = m => { const s = t => (1 + m * Math.cos(2 * Math.PI * t)) * Math.cos(2 * Math.PI * 20 * t), tot = NUM.simpson(t => s(t) ** 2, 0, 1, 20000), car = 2 * NUM.simpson(t => s(t) * Math.cos(2 * Math.PI * 20 * t), 0, 1, 20000); return (tot - car * car / 2) / tot; }; return [frac(1), frac(.5)]; } // carrier amplitude by projection, the rest is sideband power
}, {
    title: '16-QAM against 16-PSK',
    diagram: sketch('A square 16-QAM constellation beside a 16-PSK circle, both scaled to the same average energy.',
        [-3, -1, 1, 3].flatMap(i => [-3, -1, 1, 3].map(q => `<circle cx="${180 + 22 * i}" cy="${125 - 22 * q}" r="4" fill="#315740"/>`)).join('') + Array.from({length: 16}, (_, k) => `<circle cx="${(520 + 72 * Math.cos(k * Math.PI / 8)).toFixed(1)}" cy="${(125 - 72 * Math.sin(k * Math.PI / 8)).toFixed(1)}" r="4" fill="#315740"/>`).join('') + guide('M520 125m-72 0a72 72 0 1 0 144 0a72 72 0 1 0 -144 0'),
        [[180, 236, '16-QAM'], [520, 236, '16-PSK']], 250),
    text: T`Scale 16-QAM (points $I, Q \in \{\pm1, \pm3\}$) and 16-PSK to the same average energy of $1$. Find the minimum distance of each, and the QAM's advantage in decibels, $20\log_{10}(d_{\text{QAM}}/d_{\text{PSK}})$.`,
    parts: [ex(T`$d_{\text{QAM}}$`, 2 / Math.sqrt(10), T`2/\sqrt{10}`), ex(T`$d_{\text{PSK}}$`, 2 * Math.sin(Math.PI / 16), T`2\sin\tfrac{\pi}{16}`), nx('QAM advantage', 20 * Math.log10(1 / Math.sqrt(10) / Math.sin(Math.PI / 16)), 'dB')],
    hints: [T`16-QAM's average energy is $2\times\tfrac{1 + 9}{2} = 10$, so divide the coordinates by $\sqrt{10}$.`, T`Adjacent PSK points on a unit circle are $2\sin(\pi/16)$ apart.`],
    steps: [T`$d_{\text{QAM}} = \dfrac{2}{\sqrt{10}} \approx 0.632$.`, T`$d_{\text{PSK}} = 2\sin\dfrac{\pi}{16} \approx 0.390$.`, T`Advantage $\approx 4.2\,\text{dB}$: QAM uses the whole plane, PSK only a circle.`],
    idea: 'Beyond eight points, spreading a constellation over the plane beats crowding it onto a circle; PSK survives where a constant envelope matters more than distance.',
    prereq: 'Signal constellations; distance.',
    verify: () => { const md = pts => { const e = pts.reduce((s, [a, b]) => s + a * a + b * b, 0) / pts.length, sc = 1 / Math.sqrt(e); let d = Infinity; pts.forEach((p, i) => pts.slice(i + 1).forEach(q => { d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1]) * sc); })); return d; }, dq = md([-3, -1, 1, 3].flatMap(i => [-3, -1, 1, 3].map(q => [i, q]))), dp = md(Array.from({length: 16}, (_, k) => [Math.cos(k * Math.PI / 8), Math.sin(k * Math.PI / 8)])); return [dq, dp, 20 * Math.log10(dq / dp)]; }
}, {
    title: 'Spreading gain of a CDMA link',
    diagram: sketch('One data bit spread into many faster chips.',
        `<path d="M100 80h500" stroke="#aa492a" stroke-width="3"/>` + `<path d="M100 200${Array.from({length: 25}, (_, i) => (i % 3 === 1 ? 'v-40h20v40' : 'h20')).join('')}" stroke="#315740"/>`,
        [[350, 60, 'one data bit, 15 kbit/s'], [350, 236, 'chips at 3.84 Mchip/s']], 255),
    text: T`A spread-spectrum link sends $15\,\text{kbit/s}$ of data with a chip rate of $3.84\,\text{Mchip/s}$. Find the spreading factor, the processing gain in decibels, and the $E_b/N_0$ after despreading if the signal arrives $20\,\text{dB}$ below the noise in the chip bandwidth.`,
    parts: [exInt('Spreading factor', 256), ex('Processing gain', 20 * Math.log10(16), T`20\log_{10}16`, 'dB'), ex(T`$E_b/N_0$ after despreading`, 20 * Math.log10(16) - 20, T`20\log_{10}16 - 20`, 'dB')],
    hints: [T`Spreading factor $= R_c/R_b$.`, T`Despreading collects the energy of all the chips in a bit while the noise stays spread: SNR rises by the spreading factor.`],
    steps: [T`$3.84\times10^6/15\times10^3 = 256$.`, T`$10\log_{10}256 = 20\log_{10}16 \approx 24.1\,\text{dB}$.`, T`$-20 + 24.1 \approx 4.1\,\text{dB}$: enough for a coded link.`],
    idea: 'Spreading lets a signal hide below the noise; correlating with the code concentrates it again, by the processing gain.',
    prereq: 'Spread spectrum; decibels.',
    verify: () => { const sf = 3.84e6 / 15e3; let s = 0, n = 0; for (let k = 0; k < sf; k++) { s += 1; n += 1; } return [sf, 10 * Math.log10(s * s / n), 10 * Math.log10(s * s / n) - 20]; } // coherent sum of sf chips over the incoherent noise sum
}, {
    title: 'Why differential decoding doubles errors',
    diagram: drawing(arrow(80, 120, 260, 120) + ring(280, 120, 20) + dt(280, 126, '⊕') + arrow(300, 120, 480, 120) + wire('M200 120V200H240') + bkBox(240, 180, 80, 40, 'delay') + arrow(280, 180, 280, 140) + dt(110, 106, 'received bits') + dt(520, 126, 'decoded'),
        'Differential decoding: each decoded bit is the exclusive-OR of two consecutive received bits', 240),
    text: T`With differential encoding, each data bit is recovered as the XOR of two consecutive received bits. If received bits are wrong independently with probability $p$, what is the probability that a decoded bit is wrong for $p = 0.01$, and for $p = 0.1$?`,
    parts: [ex(T`$p = 0.01$`, .0198, T`\dfrac{99}{5000}`), ex(T`$p = 0.1$`, .18, T`\dfrac{9}{50}`)],
    hints: [T`The XOR is wrong if exactly one of its two inputs is wrong.`, T`$2p(1 - p)$.`],
    steps: [T`$2\times0.01\times0.99 = 0.0198$: almost double.`, T`$2\times0.1\times0.9 = 0.18$.`],
    idea: 'Differential coding removes the need for an absolute phase reference, but every channel error now corrupts two decoded bits.',
    prereq: 'Probability; XOR.',
    verify: () => [.01, .1].map(p => { let w = 0; for (const a of [0, 1]) for (const b of [0, 1]) if (a ^ b) w += (a ? p : 1 - p) * (b ? p : 1 - p); return w; })
}, {
    title: 'Asymptotic gain of a convolutional code',
    diagram: convolutionalEncoder(),
    text: T`At high SNR a soft-decision Viterbi decoder gains $10\log_{10}(Rd_{\text{free}})$ over uncoded BPSK. Find this gain for the rate-$\tfrac{1}{2}$ code with generators $(7, 5)$ (free distance $5$), and for the standard rate-$\tfrac{1}{2}$, constraint-length-7 code $(171, 133)$ (free distance $10$).`,
    parts: [ex(T`$(7, 5)$`, 10 * Math.log10(2.5), T`10\log_{10}(5/2)`, 'dB'), ex(T`$(171, 133)$`, 10 * Math.log10(5), T`10\log_{10}5`, 'dB')],
    hints: [T`Each error event needs at least $d_{\text{free}}$ code bits wrong, each carrying energy $RE_b$.`, T`$10\log_{10}(\tfrac{1}{2}\cdot5)$ and $10\log_{10}(\tfrac{1}{2}\cdot10)$.`],
    steps: [T`$(7, 5)$: $10\log_{10}2.5 \approx 3.98\,\text{dB}$.`, T`$(171, 133)$: $10\log_{10}5 \approx 6.99\,\text{dB}$, the code used for decades in space and cellular links.`],
    idea: 'Free distance times code rate sets a convolutional code’s asymptotic gain; doubling the free distance costs a 32-fold bigger trellis but adds 3 dB.',
    prereq: 'Convolutional codes.',
    verify: () => [0, 4].map(i => { const sp = convSpectrum(CONV_CODES[i], 14); return 10 * Math.log10(.5 * sp.A.findIndex(v => v > 0)); }) // free distances from a trellis search
}, {
    title: 'BPSK in Rayleigh fading',
    diagram: curve('average SNR (dB)', 'log₁₀ BER', [0, 30], [-4, 0], d => { const g = 10 ** (d / 10); return Math.log10(.5 * (1 - Math.sqrt(g / (1 + g)))); }),
    text: T`Coherent BPSK in Rayleigh fading has average bit error rate $\tfrac{1}{2}\left(1 - \sqrt{\dfrac{\bar\gamma}{1 + \bar\gamma}}\right)$, where $\bar\gamma$ is the average $E_b/N_0$. Find the error rate at $\bar\gamma = 10\,\text{dB}$, and the high-SNR approximation $1/(4\bar\gamma)$ there.`,
    parts: [ex('Exact BER', (1 - Math.sqrt(10 / 11)) / 2, T`(1-\sqrt{10/11})/2`), ex('Approximation', 1 / 40, T`\dfrac{1}{40}`)],
    hints: [T`$\bar\gamma = 10$.`, T`$\sqrt{10/11} \approx 0.9535$.`],
    steps: [T`BER $= \tfrac{1}{2}(1 - 0.9535) \approx 0.0233$.`, T`$1/(4\times10) = 0.025$, already close. In AWGN the same SNR would give $4\times10^{-6}$.`],
    idea: 'Fading turns the exponential fall of error rate into an inverse-SNR fall: occasional deep fades dominate, which is why diversity matters.',
    prereq: 'Error probability; averaging over a distribution.',
    verify: () => [NUM.simpson(x => Qfn(Math.sqrt(2 * 10 * x)) * Math.exp(-x), 0, 40, 40000), 1 / (4 * 10)] // average of Q(√(2γ)) over the exponential SNR
}, {
    title: 'How often a Hamming code saves a block',
    diagram: bitWord(['d₁', 'd₂', 'd₃', 'd₄', 'p₁', 'p₂', 'p₃'], ['', '', '', '', '', '', ''], 'Hamming (7, 4): four data bits, three parity bits'),
    text: T`A $(7, 4)$ Hamming code corrects any single error in a block. On a binary symmetric channel with $p = 0.01$, find the probability that a block of 4 data bits is delivered correctly with the code, and without coding.`,
    parts: [ex('With the code', 1.06 * .99 ** 6, T`1.06(0.99)^6`), ex('Without coding', .99 ** 4, T`0.99^4`)],
    hints: [T`With coding, a block survives with zero or one errors among 7 bits.`, T`$(1 - p)^7 + 7p(1 - p)^6$.`],
    steps: [T`$0.99^7 + 7(0.01)(0.99)^6 = 0.99^6(0.99 + 0.07) = 1.06\times0.99^6 \approx 0.99797$.`, T`Uncoded: $0.99^4 \approx 0.96060$. The block error rate falls from $3.9\,\%$ to $0.2\,\%$, at the price of 75% more bits.`],
    idea: 'Correcting single errors turns a first-order block error probability into a second-order one, a large gain when errors are rare.',
    prereq: 'Binomial probabilities; Hamming codes.',
    verify: () => { const p = .01, H = [1, 2, 3, 4, 5, 6, 7]; let ok = 0; for (let e = 0; e < 128; e++) { let syn = 0, w = 0; for (let j = 0; j < 7; j++) if (e >> j & 1) { syn ^= H[j]; w++; } const fixed = syn ? e ^ (1 << (syn - 1)) : e; if (!fixed) ok += p ** w * (1 - p) ** (7 - w); } return [ok, .99 ** 4]; } // syndrome decoding of every error pattern
}, {
    title: 'Non-coherent FSK and DPSK',
    diagram: bkPlot('Eb/N0 (dB)', 'log₁₀ BER', [0, 14], [-6, 0], [d => Math.log10(.5 * Math.exp(-(10 ** (d / 10)) / 2)), d => Math.log10(.5 * Math.exp(-(10 ** (d / 10))))], [[10, Math.log10(.5 * Math.exp(-5)), 'FSK', 10, -10], [6, Math.log10(.5 * Math.exp(-(10 ** .6))), 'DPSK', -56, 20]]),
    text: T`Non-coherent binary FSK has $P_b = \tfrac{1}{2}e^{-E_b/(2N_0)}$ and DPSK has $P_b = \tfrac{1}{2}e^{-E_b/N_0}$. Find the $E_b/N_0$ (as a ratio) each needs for $P_b = 10^{-4}$.`,
    parts: [ex('Non-coherent FSK', 2 * Math.log(5000), T`2\ln5000`), ex('DPSK', Math.log(5000), T`\ln5000`)],
    hints: [T`$\tfrac{1}{2}e^{-x} = 10^{-4} \Rightarrow x = \ln5000$.`, T`FSK needs $E_b/(2N_0) = \ln5000$.`],
    steps: [T`FSK: $2\ln5000 \approx 17.0$ ($12.3\,\text{dB}$).`, T`DPSK: $\ln5000 \approx 8.52$ ($9.3\,\text{dB}$): exactly $3\,\text{dB}$ better.`],
    idea: 'Both schemes avoid a phase reference; DPSK uses the previous symbol as its reference and so beats orthogonal FSK by 3 dB.',
    prereq: 'Exponentials; logarithms.',
    verify: () => [NUM.bisect(g => .5 * Math.exp(-g / 2) - 1e-4, 0, 50), NUM.bisect(g => .5 * Math.exp(-g) - 1e-4, 0, 50)]
}]);

/* ================= ANTENNAS & LINK BUDGETS ================= */
bankMore('linkbudget', 'advanced', [{
    title: 'Free-space loss at 2.4 GHz',
    diagram: freeSpaceLink(2.4, 1, 20, 0, 0, 0),
    text: T`Find the free-space path loss between isotropic antennas $1\,\text{km}$ apart at $2.4\,\text{GHz}$ ($c = 3\times10^8\,\text{m/s}$). At what distance does the loss reach $120\,\text{dB}$?`,
    parts: [ex(T`Loss at $1\,\text{km}$`, 20 * Math.log10(32000 * Math.PI), T`20\log_{10}(32000\pi)`, 'dB'), ex(T`Distance for $120\,\text{dB}$`, 31.25 / Math.PI, T`31.25/\pi`, 'km')],
    hints: [T`$L = \left(\dfrac{4\pi d}{\lambda}\right)^2$ with $\lambda = 0.125\,\text{m}$.`, T`$120\,\text{dB}$ means $\dfrac{4\pi d}{\lambda} = 10^6$.`],
    steps: [T`$\dfrac{4\pi\times1000}{0.125} = 32000\pi$, so $L = 20\log_{10}(32000\pi) \approx 100.0\,\text{dB}$.`, T`$d = \dfrac{10^6\times0.125}{4\pi} = \dfrac{31250}{\pi}\,\text{m} \approx 9.95\,\text{km}$: ten times the distance, 20 dB more.`],
    idea: 'Free-space loss grows 20 dB per decade of distance and of frequency: it is a geometric spreading term plus the shrinking aperture of an antenna at higher frequency.',
    prereq: 'Friis equation; decibels.',
    verify: () => { const loss = d => -10 * Math.log10((.125 / (4 * Math.PI * d)) ** 2); return [loss(1000), NUM.bisect(d => loss(d) - 120, 1, 1e6) / 1e3]; }
}, {
    title: 'EIRP and flux density',
    diagram: sketch('An antenna radiating into a cone towards a distant sphere on which the power spreads out.',
        wire('M110 160l20 -40l20 40M130 120V200') + guide('M150 140L560 60M150 140L560 220') + `<path d="M560 60A190 190 0 0 1 560 220" stroke="#aa492a" stroke-width="3"/>`,
        [[130, 226, '10 W, 20 dBi'], [628, 140, '10 km']], 245),
    text: T`A $10\,\text{W}$ transmitter feeds an antenna with $20\,\text{dBi}$ of gain. Find its EIRP in dBm, and the power flux density in the main beam $10\,\text{km}$ away, in $\mu\text{W/m}^2$.`,
    parts: [ex('EIRP', 60, '60', 'dBm'), ex('Flux density', 2.5 / Math.PI, T`2.5/\pi`, 'µW/m²')],
    hints: [T`EIRP $= P_tG_t = 10\,\text{W}\times100$.`, T`Flux density $= \dfrac{\text{EIRP}}{4\pi d^2}$.`],
    steps: [T`EIRP $= 1000\,\text{W} = 60\,\text{dBm}$.`, T`$\dfrac{1000}{4\pi\times10^8} = \dfrac{2.5}{\pi}\times10^{-6}\,\text{W/m}^2 \approx 0.80\,\mu\text{W/m}^2$.`],
    idea: 'EIRP is the power an isotropic antenna would need to give the same flux in the beam; regulators limit it rather than transmitter power.',
    prereq: 'Antenna gain; spherical spreading.',
    verify: () => { const eirp = 10 * 100, area = NUM.simpson(th => 2 * Math.PI * 1e8 * Math.sin(th), 0, Math.PI, 2000); return [10 * Math.log10(eirp * 1e3), eirp / area * 1e6]; } // sphere area by integration
}, {
    title: 'The thermal noise floor',
    diagram: drawing(bkChain([[140, 120, 'R at 290 K'], [360, 140, 'receiver'], [580, 100, 'detector']], 90) + dt(420, 200, '1 MHz bandwidth, NF 5 dB'),
        'A resistor at 290 kelvin feeding a receiver of noise figure 5 dB in a 1 megahertz bandwidth', 225),
    text: T`Find the thermal noise power $kTB$ in a $1\,\text{MHz}$ bandwidth at $290\,\text{K}$, in dBm ($k = 1.380649\times10^{-23}\,\text{J/K}$). What is the sensitivity of a receiver with a $5\,\text{dB}$ noise figure that needs a $10\,\text{dB}$ SNR?`,
    parts: [nx('Noise floor', 10 * Math.log10(1.380649e-23 * 290 * 1e6 * 1e3), 'dBm'), nx('Sensitivity', 10 * Math.log10(1.380649e-23 * 290 * 1e6 * 1e3) + 15, 'dBm')],
    hints: [T`$kT_0 \approx -174\,\text{dBm/Hz}$ at $290\,\text{K}$; add $10\log_{10}B$.`, T`Sensitivity $= kTB + \text{NF} + \text{SNR}$.`],
    steps: [T`$-174 + 60 = -114\,\text{dBm}$ (more precisely $-113.98$).`, T`$-113.98 + 5 + 10 \approx -99.0\,\text{dBm}$.`],
    idea: '−174 dBm/Hz is the floor every receiver starts from; bandwidth, noise figure and required SNR stack on top in decibels.',
    prereq: 'Thermal noise; decibels.',
    verify: () => { const N = NUM.simpson(() => 1.380649e-23 * 290, 0, 1e6, 10); return [10 * Math.log10(N / 1e-3), 10 * Math.log10(N / 1e-3) + 5 + 10]; }
}, {
    title: 'The aperture of an isotropic antenna',
    diagram: sketch('An isotropic receiving antenna and its equivalent capture area, which shrinks as the wavelength shrinks.',
        ring(250, 130, 70) + `<ellipse cx="480" cy="130" rx="18" ry="60" fill="none" stroke="#aa492a" stroke-width="3"/>` + arrow(330, 130, 455, 130),
        [[250, 136, 'isotropic'], [480, 214, 'Aₑ = λ²/4π'], [600, 80, 'f = 1 GHz']], 245),
    text: T`At $1\,\text{GHz}$ ($\lambda = 0.3\,\text{m}$), find the effective aperture of an isotropic antenna, $\lambda^2/(4\pi)$. What gain would an ideal aperture of $1\,\text{m}^2$ have at this frequency?`,
    parts: [ex('Isotropic aperture', 9 / (400 * Math.PI), T`\dfrac{9}{400\pi}`, 'm²'), ex(T`Gain of $1\,\text{m}^2$`, 400 * Math.PI / 9, T`\dfrac{400\pi}{9}`)],
    hints: [T`$A_e = \dfrac{\lambda^2}{4\pi}G$.`, T`$G = \dfrac{4\pi A}{\lambda^2}$.`],
    steps: [T`$A_e = \dfrac{0.09}{4\pi} = \dfrac{9}{400\pi} \approx 7.2\times10^{-3}\,\text{m}^2$.`, T`$G = \dfrac{4\pi}{0.09} = \dfrac{400\pi}{9} \approx 140$ ($21.4\,\text{dBi}$).`],
    idea: 'Path loss rises with frequency only because isotropic antennas shrink; fixed-size dishes gain it all back, and more.',
    prereq: 'Antenna gain and aperture.',
    verify: () => { const lam = 3e8 / 1e9, D = NUM.simpson(() => 1, 0, 4 * Math.PI, 2) / (4 * Math.PI); return [D * lam * lam / (4 * Math.PI), 4 * Math.PI * 1 / (lam * lam)]; }
}, {
    title: 'Polarisation mismatch',
    diagram: sketch('Two linearly polarised antennas whose polarisations differ by 30 degrees.',
        arrow(200, 200, 200, 60) + arrow(440, 200, 510, 79) + guide('M440 200V60') + `<path d="M440 120A80 80 0 0 1 480 131"/>`,
        [[200, 226, 'transmit'], [440, 226, 'receive'], [466, 112, '30°']], 245),
    text: T`A linearly polarised wave reaches a linearly polarised antenna rotated $30^\circ$ from it. Find the polarisation mismatch loss in decibels. What fraction of the power does a linear antenna capture from a circularly polarised wave?`,
    parts: [ex('Loss at 30°', 10 * Math.log10(4 / 3), T`10\log_{10}(4/3)`, 'dB'), ex('Circular into linear', .5, T`\dfrac{1}{2}`)],
    hints: [T`The captured fraction is $|\hat e_1\cdot\hat e_2|^2 = \cos^2\psi$.`, T`A circular wave is two equal linear components in quadrature.`],
    steps: [T`$\cos^230^\circ = \tfrac{3}{4}$: loss $10\log_{10}\tfrac{4}{3} \approx 1.25\,\text{dB}$.`, T`Circular into linear: half the power, $3\,\text{dB}$, at any rotation, which is why satellites often use circular polarisation.`],
    idea: 'Polarisation is a vector match: the power captured is the squared projection of one polarisation onto the other.',
    prereq: 'Vectors; antenna polarisation.',
    verify: () => { const a = [1, 0], b = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)], c = [Math.SQRT1_2, Math.SQRT1_2]; const dot2 = (u, v) => (u[0] * v[0] + u[1] * v[1]) ** 2; return [-10 * Math.log10(dot2(a, b)), (c[0] ** 2 + c[1] ** 2) / 2]; } // circular: |(1, j)/√2 · x̂|²
}, {
    title: 'Two antennas half a wavelength apart',
    diagram: sketch('Two isotropic antennas half a wavelength apart, fed in phase, with their figure-of-eight pattern broadside to the pair.',
        dot(330, 130) + dot(390, 130) + `<path d="${Array.from({length: 181}, (_, i) => { const th = i * Math.PI / 90, r = 100 * Math.abs(Math.cos(Math.PI / 2 * Math.cos(th))); return `${i ? 'L' : 'M'}${(360 + r * Math.cos(th)).toFixed(1)} ${(130 - r * Math.sin(th)).toFixed(1)}`; }).join('')}" stroke="#aa492a" stroke-width="3"/>`,
        [[440, 136, 'λ/2'], [600, 120, 'fed in phase'], [600, 150, 'nulls along the axis']], 250),
    text: T`Two isotropic antennas half a wavelength apart are fed equally and in phase, so the array factor is $2\cos\!\left(\tfrac\pi2\cos\theta\right)$, with $\theta$ from the line joining them. Find the array's directivity, and the angle from broadside at which it has a null.`,
    parts: [ex('Directivity', 2, '2'), ex('Null angle from broadside', 90, '90', '°')],
    hints: [T`$D = \dfrac{4\pi|AF|^2_{\max}}{\oint|AF|^2d\Omega}$.`, T`$\oint4\cos^2\!\left(\tfrac\pi2\cos\theta\right)d\Omega = 2\pi\int_{-1}^{1}4\cos^2\tfrac{\pi u}{2}du = 8\pi$.`],
    steps: [T`$D = \dfrac{4\pi\times4}{8\pi} = 2$ ($3\,\text{dBi}$): two elements, twice the directivity.`, T`$|AF| = 0$ when $\cos\theta = \pm1$: along the axis, $90^\circ$ from broadside, where the two waves arrive half a cycle apart.`],
    idea: 'Arrays shape patterns by interference: half-wavelength spacing puts nulls on the axis and doubles the directivity broadside.',
    prereq: 'Array factor; integration over a sphere.',
    verify: () => { const AF2 = th => 4 * Math.cos(Math.PI / 2 * Math.cos(th)) ** 2, tot = NUM.simpson(th => AF2(th) * 2 * Math.PI * Math.sin(th), 0, Math.PI, 4000), f = th => Math.abs(Math.cos(Math.PI / 2 * Math.cos(th))); let lo = 0, hi = Math.PI / 2; const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 80; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (f(c) < f(d)) hi = d; else lo = c; } return [4 * Math.PI * 4 / tot, 90 - (lo + hi) / 2 * 180 / Math.PI]; }
}, {
    title: 'Radar range resolution',
    diagram: sketch('A radar pulse reaching two targets separated in range; they are resolved if their echoes do not overlap.',
        wire('M100 150l20 -40l20 40M120 110V190') + `<path d="M180 140h120" stroke="#aa492a" stroke-width="6"/>` + wire('M480 120h20v40h-20zM560 120h20v40h-20z') + guide('M490 200H570'),
        [[240, 124, 'pulse 1 µs'], [530, 226, 'ΔR'], [620, 100, 'PRF 1 kHz']], 245),
    text: T`A radar transmits pulses $1\,\mu\text{s}$ long at a pulse repetition frequency of $1\,\text{kHz}$ ($c = 3\times10^8\,\text{m/s}$). Find its range resolution and its maximum unambiguous range.`,
    parts: [ex('Range resolution', 150, '150', 'm'), ex('Unambiguous range', 150, '150', 'km')],
    hints: [T`Echoes from two targets separate when their round-trip delays differ by more than the pulse length: $\Delta R = c\tau/2$.`, T`The echo must return before the next pulse: $R_u = c/(2\,\text{PRF})$.`],
    steps: [T`$\Delta R = \dfrac{3\times10^8\times10^{-6}}{2} = 150\,\text{m}$.`, T`$R_u = \dfrac{3\times10^8}{2\times10^3} = 150\,\text{km}$.`],
    idea: 'Short pulses resolve range and slow repetition keeps it unambiguous; pulse compression gives long pulses the resolution of short ones.',
    prereq: 'Time of flight.',
    verify: () => [NUM.bisect(d => 2 * d / 3e8 - 1e-6, 0, 1e4), NUM.bisect(d => 2 * d / 3e8 - 1e-3, 0, 1e7) / 1e3]
}, {
    title: 'A warm feeder heats a cold antenna',
    diagram: drawing(bkChain([[110, 120, 'antenna 50 K'], [320, 150, 'feeder ×0.8, 290 K'], [560, 110, 'receiver']], 90) + dt(400, 200, 'noise temperature at the feeder output?'),
        'An antenna with 50 kelvin noise temperature connected to a receiver through a warm, slightly lossy feeder', 225),
    text: T`An antenna with noise temperature $50\,\text{K}$ is connected through a feeder at $290\,\text{K}$ that passes $80\,\%$ of the power (loss factor $L = 1.25$). Find the noise temperature at the feeder output, and the fraction of it contributed by the feeder.`,
    parts: [ex('Output noise temperature', 98, '98', 'K'), ex('Feeder share', 29 / 49, T`\dfrac{29}{49}`)],
    hints: [T`A passive loss at temperature $T_0$ passes $1/L$ of the incoming noise and adds $T_0(1 - 1/L)$.`, T`$50\times0.8 + 290\times0.2$.`],
    steps: [T`$T = 40 + 58 = 98\,\text{K}$.`, T`The feeder adds $58$ of the $98\,\text{K}$: $\tfrac{29}{49} \approx 59\,\%$, from a loss of under $1\,\text{dB}$.`],
    idea: 'Any loss ahead of the first amplifier both attenuates the signal and adds thermal noise; with cold antennas, a fraction of a decibel matters.',
    prereq: 'Noise temperature.',
    verify: () => { const n = 1000, g = .8 ** (1 / n); let T = 50; for (let i = 0; i < n; i++) T = T * g + 290 * (1 - g); return [T, (T - 50 * .8) / T]; } // a long feeder as many thin lossy slices
}, {
    title: 'How far is the radio horizon?',
    diagram: sketch('Two antennas on a curved Earth whose line of sight just grazes the surface between them.',
        `<path d="M80 230Q360 120 640 230"/>` + wire('M160 197V137M540 197V170') + guide('M160 137L540 170'),
        [[160, 124, '100 m'], [540, 158, '25 m'], [360, 250, 'effective Earth radius 4/3 × 6370 km']], 262),
    text: T`With atmospheric refraction modelled by an effective Earth radius of $\tfrac{4}{3}\times6370\,\text{km}$, find the radio horizon of an antenna $100\,\text{m}$ high, $\sqrt{2R_eh}$, and the longest line-of-sight path between antennas $100\,\text{m}$ and $25\,\text{m}$ high.`,
    parts: [ex(T`Horizon at $100\,\text{m}$`, Math.sqrt(5096 / 3), T`\sqrt{5096/3}`, 'km'), ex('Longest path', 1.5 * Math.sqrt(5096 / 3), T`1.5\sqrt{5096/3}`, 'km')],
    hints: [T`$2R_eh = 2\times\tfrac{4}{3}\times6370\times0.1\,\text{km}^2$.`, T`The longest path is the sum of the two horizons; the second is half the first since $\sqrt{25} = \tfrac{1}{2}\sqrt{100}$.`],
    steps: [T`$\sqrt{5096/3} \approx 41.2\,\text{km}$ (the rule of thumb $4.12\sqrt{h}$).`, T`$41.2 + 20.6 \approx 61.8\,\text{km}$.`],
    idea: 'Range grows only as the square root of antenna height: quadrupling the mast doubles the horizon.',
    prereq: 'Geometry of the circle.',
    verify: () => { const R = 4 / 3 * 6370, hz = h => Math.sqrt((R + h) ** 2 - R * R); return [hz(.1), hz(.1) + hz(.025)]; } // exact tangent lengths
}, {
    title: 'Two antennas against fading',
    diagram: drawing(wire('M100 90l15 -30l15 30M115 60V120M100 170l15 -30l15 30M115 140V200') + arrow(130, 90, 300, 120) + arrow(130, 170, 300, 140) + bkBox(300, 100, 120, 60, 'select best') + arrow(420, 130, 520, 130) + bkBox(520, 100, 110, 60, 'receiver'),
        'Two receive antennas feeding a selector that picks the stronger signal', 225),
    text: T`In Rayleigh fading the received power is exponentially distributed about its mean. The link fails when the power drops $10\,\text{dB}$ below the mean. Find the outage probability with one antenna, and with two independently fading antennas and selection of the stronger.`,
    parts: [ex('One antenna', 1 - Math.exp(-.1), T`1-e^{-1/10}`), ex('Two antennas', (1 - Math.exp(-.1)) ** 2, T`(1-e^{-1/10})^2`)],
    hints: [T`$P(\text{power} < x\bar P) = 1 - e^{-x}$ with $x = 0.1$.`, T`Selection fails only if both branches fail.`],
    steps: [T`$1 - e^{-0.1} \approx 0.095$.`, T`$0.095^2 \approx 0.0091$: ten times less.`],
    idea: 'Deep fades rarely hit two independent antennas at once; diversity turns a 10% outage into 1%.',
    prereq: 'Exponential distribution; independence.',
    verify: () => { const p = NUM.simpson(x => Math.exp(-x), 0, .1, 200); return [p, p * p]; }
}, {
    title: 'Trading bit rate for range',
    diagram: curve('bit-rate reduction (dB)', 'range multiplier (free space)', [0, 20], [1, 10], x => 10 ** (x / 20)),
    text: T`At a fixed $E_b/N_0$, a receiver's sensitivity improves in proportion to the bit rate. If the bit rate is cut by a factor of 10, by what factor does the range grow in free space (path-loss exponent 2), and on a path with exponent 4?`,
    parts: [ex('Free space', Math.sqrt(10), T`\sqrt{10}`), ex('Exponent 4', 10 ** .25, T`10^{1/4}`)],
    hints: [T`Ten times lower rate needs ten times less received power: $10\,\text{dB}$.`, T`Path loss $\propto d^n$, so $d \propto 10^{10/(10n)}$.`],
    steps: [T`Free space: $10^{1/2} = \sqrt{10} \approx 3.16$.`, T`Exponent 4: $10^{1/4} \approx 1.78$.`],
    idea: 'Every halving of bit rate buys 3 dB; long-range IoT links trade speed for range this way, but steep path loss makes the trade poorer.',
    prereq: 'Link budgets; path-loss exponents.',
    verify: () => [2, 4].map(n => { const rx = (d, rate) => -10 * n * Math.log10(d) - 10 * Math.log10(rate); return NUM.bisect(d => rx(d, .1) - rx(1, 1), 1, 100); }) // range where the slower link has the same margin
}]);

/* ================= RF CIRCUITS ================= */
bankMore('rfcircuits', 'advanced', [{
    title: 'A quarter-wave transformer off its design frequency',
    diagram: tlineDiagram(100, '200 Ω', 'a quarter wave at f₀, from a 50 Ω source'),
    text: T`A quarter-wave section matches a $50\,\Omega$ line to a $200\,\Omega$ load at $f_0$. Find its characteristic impedance. At $1.5f_0$ the section is $3\lambda/8$ long: find the magnitude of the reflection coefficient seen from the $50\,\Omega$ line.`,
    parts: [ex(T`$Z_1$`, 100, '100', 'Ω'), ex(T`$|\Gamma|$ at $1.5f_0$`, 3 / Math.sqrt(41), T`3/\sqrt{41}`)],
    hints: [T`A quarter wave inverts: $Z_{\text{in}} = Z_1^2/Z_L$.`, T`At $1.5f_0$, $\tan\beta\ell = \tan(3\pi/4) = -1$: $Z_{\text{in}} = Z_1\dfrac{Z_L + jZ_1t}{Z_1 + jZ_Lt}$.`],
    steps: [T`$Z_1 = \sqrt{50\times200} = 100\,\Omega$.`, T`$Z_{\text{in}} = 100\cdot\dfrac{200 - 100j}{100 - 200j} = 80 + 60j\,\Omega$.`, T`$\Gamma = \dfrac{30 + 60j}{130 + 60j}$, $|\Gamma| = \dfrac{3}{\sqrt{41}} \approx 0.47$.`],
    idea: 'A single quarter-wave transformer is a narrowband match; more sections in cascade widen the band.',
    prereq: 'Transmission-line input impedance.',
    verify: () => { const zin = (Z1, bl) => cd(cm(cx(Z1), ca(cx(200 * Math.cos(bl)), cx(0, Z1 * Math.sin(bl)))), ca(cx(Z1 * Math.cos(bl)), cx(0, 200 * Math.sin(bl)))), Z1 = NUM.bisect(z => zin(z, Math.PI / 2).re - 50, 51, 199), z = zin(Z1, 3 * Math.PI / 4); return [Z1, cabs(cd(cs(z, cx(50)), ca(z, cx(50))))]; }
}, {
    title: 'One point, two readings on the Smith chart',
    diagram: sketch('The Smith chart with the point for normalised impedance 1 + j where the r = 1 circle meets the x = 1 arc.',
        ring(360, 130, 100) + `<circle cx="410" cy="130" r="50" stroke="#83968b" stroke-dasharray="5 5" fill="none"/>` + guide('M260 130H460') + `<path d="M460 130A100 100 0 0 0 360 30" stroke="#83968b" stroke-dasharray="5 5"/>` + dot(380, 90),
        [[400, 82, 'z = 1 + j'], [600, 110, 'Γ = ?'], [600, 140, 'y = ?']], 250),
    text: T`A load has normalised impedance $z = 1 + j$. Find its normalised admittance $y = g + jb$, and the magnitude of its reflection coefficient.`,
    parts: [ex(T`$g$`, .5, T`\dfrac{1}{2}`), ex(T`$b$`, -.5, T`-\dfrac{1}{2}`), ex(T`$|\Gamma|$`, 1 / Math.sqrt(5), T`1/\sqrt5`)],
    hints: [T`$y = 1/z = \dfrac{1 - j}{2}$.`, T`$\Gamma = \dfrac{z - 1}{z + 1} = \dfrac{j}{2 + j}$.`],
    steps: [T`$y = 0.5 - 0.5j$: on the chart it sits diametrically opposite $z$.`, T`$\Gamma = \dfrac{j(2 - j)}{5} = \dfrac{1 + 2j}{5}$, so $|\Gamma| = \dfrac{1}{\sqrt5} \approx 0.447$.`],
    idea: 'Admittance is impedance rotated half a turn on the Smith chart, which is why shunt matching is done by reading the chart upside down.',
    prereq: 'Complex numbers; reflection coefficient.',
    verify: () => { const z = cx(1, 1), y = cd(cx(1), z), g = cd(cs(z, cx(1)), ca(z, cx(1))); return [y.re, y.im, cabs(g)]; }
}, {
    title: 'An open line seen through a lossy cable',
    diagram: drawing(ring(102, 83, 5) + ring(102, 181, 5) + wire('M107 83H520M107 181H520') + ring(525, 83, 5) + ring(525, 181, 5) + dt(560, 136, 'open') + dt(310, 64, 'Z₀ = 50 Ω, one-way loss 5 dB') + arrow(119, 132, 182, 132) + dt(150, 160, 'Γᵢₙ'),
        'A 50 ohm cable with 5 dB of one-way loss, open at the far end', 230),
    text: T`A $50\,\Omega$ cable with a one-way loss of $5\,\text{dB}$ is left open at the far end, where all the power is reflected. What return loss and what VSWR does an instrument measure at the input?`,
    parts: [ex('Return loss', 10, '10', 'dB'), ex('VSWR', (Math.sqrt(10) + 1) / (Math.sqrt(10) - 1), T`(\sqrt{10}+1)/(\sqrt{10}-1)`)],
    hints: [T`The reflected wave crosses the cable twice: $10\,\text{dB}$ in all.`, T`$|\Gamma_{\text{in}}| = 10^{-10/20} = 1/\sqrt{10}$, and $\text{VSWR} = \dfrac{1 + |\Gamma|}{1 - |\Gamma|}$.`],
    steps: [T`Return loss $= 2\times5 = 10\,\text{dB}$.`, T`$|\Gamma| = 0.316$, $\text{VSWR} = \dfrac{\sqrt{10} + 1}{\sqrt{10} - 1} \approx 1.92$.`],
    idea: 'Cable loss masks mismatches: a total reflection looks like a decent match through enough loss, so antennas must be checked at their terminals.',
    prereq: 'Reflection coefficient; decibels.',
    verify: () => { const a = 5 / (20 * Math.log10(Math.E)), e2 = cp(Math.exp(-2 * a), -2 * 1.234 * 180 / Math.PI), coth = cd(ca(cx(1), e2), cs(cx(1), e2)), zin = cm(cx(50), coth), G = cabs(cd(cs(zin, cx(50)), ca(zin, cx(50)))); return [-20 * Math.log10(G), (1 + G) / (1 - G)]; } // Z_in = Z₀ coth(γℓ) for an open lossy line
}, {
    title: 'A Wilkinson divider',
    diagram: sketch('A Wilkinson power divider: the input splits into two quarter-wave lines whose outputs are joined by a resistor.',
        wire('M90 130H200M200 130L300 60H500M200 130L300 200H500') + element('R', 500, 60, 500, 200, '') + dot(200, 130) + dot(500, 60) + dot(500, 200) + wire('M500 60H600M500 200H600'),
        [[120, 116, 'port 1'], [400, 46, 'λ/4, Z = ?'], [400, 226, 'λ/4, Z = ?'], [550, 136, 'R = ?'], [640, 66, 'port 2'], [640, 206, 'port 3']], 250),
    text: T`An equal-split Wilkinson divider in a $50\,\Omega$ system uses two quarter-wave lines from the input to the outputs, and a resistor between the outputs. Find the line impedance that matches the input, and the resistor that matches and isolates the outputs.`,
    parts: [ex('Line impedance', 50 * Math.SQRT2, T`50\sqrt2`, 'Ω'), ex('Resistor', 100, '100', 'Ω')],
    hints: [T`Each quarter-wave line turns its $50\,\Omega$ port into $Z^2/50$; two in parallel must give $50\,\Omega$.`, T`Odd mode: the input node is a virtual short, which a quarter wave turns into an open at the outputs, so each output sees $R/2$.`],
    steps: [T`$\tfrac{1}{2}\cdot\dfrac{Z^2}{50} = 50 \Rightarrow Z = 50\sqrt2 \approx 70.7\,\Omega$.`, T`$R/2 = 50 \Rightarrow R = 100\,\Omega$; in the even mode no current flows in $R$, so it costs nothing in normal operation.`],
    idea: 'The Wilkinson resistor only carries power when the outputs differ, so it isolates them without wasting the signal.',
    prereq: 'Quarter-wave transformers; even–odd mode analysis.',
    verify: () => { const solve3 = (Z, R, drive) => { const j = cx(0, 1 / Z), G = cx(1 / 50), Y = [[G, j, j], [j, ca(G, cx(1 / R)), cx(-1 / R)], [j, cx(-1 / R), ca(G, cx(1 / R))]], b = [0, 1, 2].map(i => cx(i === drive ? 1 / 50 : 0)); return complexSolve(Y, b); };
        const match = Z => cabs(cs(cm(cx(2), solve3(Z, 100, 0)[0]), cx(1))), iso = R => cabs(solve3(50 * Math.SQRT2, R, 1)[2]); const gs = (f, lo, hi) => { const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 100; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (f(c) < f(d)) hi = d; else lo = c; } return (lo + hi) / 2; };
        return [gs(match, 30, 150), gs(iso, 20, 500)]; } // nodal analysis of the 3-port at the design frequency (quarter-wave lines as admittance matrices)
}, {
    title: 'What a 20 dB coupler takes',
    diagram: drawing(wire('M100 100H620M180 170H540') + guide('M180 120H540') + arrow(80, 100, 140, 100) + arrow(580, 100, 640, 100) + arrow(220, 170, 160, 170) + dt(90, 86, 'in') + dt(640, 86, 'through') + dt(150, 196, 'coupled −20 dB') + dt(560, 196, 'isolated'),
        'A directional coupler: a main line with a coupled line beside it', 225),
    text: T`An ideal lossless directional coupler has a coupling of $20\,\text{dB}$. What fraction of the input power appears at the coupled port, and what is the insertion loss of the main line in decibels?`,
    parts: [ex('Coupled fraction', .01, T`\dfrac{1}{100}`), ex('Through loss', 10 * Math.log10(100 / 99), T`10\log_{10}(100/99)`, 'dB')],
    hints: [T`$20\,\text{dB}$ is a factor of $100$ in power.`, T`Power is conserved: the through port gets the rest.`],
    steps: [T`Coupled: $1\,\%$ of the input.`, T`Through: $99\,\%$, a loss of $10\log_{10}\tfrac{100}{99} \approx 0.044\,\text{dB}$.`],
    idea: 'A weak coupler samples a signal for monitoring while barely disturbing it, the basis of power meters and reflectometers.',
    prereq: 'Decibels; conservation of power.',
    verify: () => { const c = 10 ** (-20 / 20), t = Math.sqrt(1 - c * c); return [c * c, -20 * Math.log10(t)]; } // unitary coupler: |S21|² + |S31|² = 1
}, {
    title: 'Loaded and unloaded Q',
    diagram: drawing(element('AC', 80, 70, 80, 200) + element('R', 80, 70, 200, 70, 'R₀') + element('L', 200, 70, 320, 70, 'L') + element('C', 320, 70, 440, 70, 'C') + element('R', 440, 70, 540, 70, 'r') + wire('M540 70H620M80 200H620') + element('R', 620, 70, 620, 200, 'R₀'),
        'A series resonator between a matched source and load, with its own loss resistance', 230),
    text: T`A series resonator at $100\,\text{MHz}$ has an unloaded Q of $100$, set by its own loss. Coupled between a source and a load, its external Q (from the source and load resistances) is also $100$. Find the loaded Q, the $3\,\text{dB}$ bandwidth, and the insertion loss at resonance.`,
    parts: [ex('Loaded Q', 50, '50'), ex('Bandwidth', 2, '2', 'MHz'), ex('Insertion loss', 10 * Math.log10(4), T`10\log_{10}4`, 'dB')],
    hints: [T`$\dfrac1{Q_L} = \dfrac1{Q_u} + \dfrac1{Q_e}$.`, T`At resonance $S_{21} = \dfrac{Q_u}{Q_u + Q_e}$.`],
    steps: [T`$Q_L = 50$; bandwidth $= f_0/Q_L = 2\,\text{MHz}$.`, T`$S_{21} = \tfrac{1}{2}$, i.e. $6.0\,\text{dB}$ of loss: half the available voltage is dropped across the resonator's own resistance.`],
    idea: 'A filter’s insertion loss depends on how strongly it is coupled compared with its own losses: wide bands (low Q_e) suffer less from lossy resonators.',
    prereq: 'Resonance; Q factor.',
    verify: () => { const f0 = 1e8, L = 1e-6, w0 = 2 * Math.PI * f0, r = w0 * L / 100, R0 = w0 * L / 200, C = 1 / (w0 * w0 * L), S21 = f => { const w = 2 * Math.PI * f, z = ca(cx(r + 2 * R0), cx(0, w * L - 1 / (w * C))); return cabs(cd(cx(2 * R0), z)); }, pk = S21(f0), lo = NUM.bisect(f => S21(f) - pk / Math.SQRT2, .9 * f0, f0), hi = NUM.bisect(f => S21(f) - pk / Math.SQRT2, f0, 1.1 * f0); return [f0 / (hi - lo), (hi - lo) / 1e6, -20 * Math.log10(pk)]; }
}, {
    title: 'The intercept point from one measurement',
    diagram: bkPlot('input power per tone (dBm)', 'output (dBm, gain removed)', [-40, 20], [-120, 20], [p => p, p => 3 * p - 20], [[10, 10, 'IIP3', -60, -6]]),
    text: T`Two equal tones at $-20\,\text{dBm}$ each enter an amplifier, and its third-order intermodulation products appear $60\,\text{dB}$ below the tones. Find the input third-order intercept point. What would the products be, referred to the input, with tones at $-10\,\text{dBm}$?`,
    parts: [ex('IIP3', 10, '10', 'dBm'), ex(T`IM3 at $-10\,\text{dBm}$ tones`, -50, '-50', 'dBm')],
    hints: [T`IM3 rises 3 dB for every dB of input, the tones 1 dB: the gap closes 2 dB per dB.`, T`$\text{IIP3} = P_{\text{in}} + \Delta/2$, where $\Delta$ is the gap in dB.`],
    steps: [T`$\text{IIP3} = -20 + 60/2 = 10\,\text{dBm}$.`, T`At $-10\,\text{dBm}$: gap $2(10 - (-10)) = 40\,\text{dB}$, so IM3 $= -50\,\text{dBm}$ (input-referred).`],
    idea: 'One two-tone measurement fixes the intercept point, and from it the intermodulation at any other level, as long as the amplifier stays out of compression.',
    prereq: 'Intermodulation; decibels.',
    verify: () => { const n = 512, im3 = (P, a3) => { const A = Math.sqrt(2 * 10 ** (P / 10) * 1e-3), y = Array.from({length: n}, (_, t) => { const x = A * (Math.cos(2 * Math.PI * 5 * t / n) + Math.cos(2 * Math.PI * 6 * t / n)); return x - a3 * x ** 3; }), amp = Math.hypot(y.reduce((s, v, t) => s + v * Math.cos(2 * Math.PI * 4 * t / n), 0), y.reduce((s, v, t) => s + v * Math.sin(2 * Math.PI * 4 * t / n), 0)) * 2 / n; return 10 * Math.log10(amp * amp / 2 / 1e-3); };
        const a3 = Math.exp(NUM.bisect(la => im3(-20, Math.exp(la)) - (-20 - 60), -10, 20, 80)); return [10 * Math.log10(4 / (3 * a3) / 2 / 1e-3), im3(-10, a3)]; } // fit the cubic term to the measured products, then simulate the stronger tones (unit gain, so output = input-referred)
}, {
    title: 'Compression point and intercept point',
    diagram: bkPlot('input power (dBm)', 'output power (dBm, gain removed)', [-20, 6], [-20, 10], [p => { const A = Math.sqrt(2 * 10 ** (p / 10) * 1e-3), a3 = 4 / (3 * 2 * 10 * 1e-3); const y = A - .75 * a3 * A ** 3; return y > 0 ? 10 * Math.log10(y * y / 2 / 1e-3) : -20; }, p => p]),
    text: T`For an amplifier whose nonlinearity is a pure cubic term, $y = a_1x - a_3x^3$, find how far the input 1 dB compression point lies below the input third-order intercept point, $10\log_{10}\bigl(1 - 10^{-1/20}\bigr)$, in dB. If the IIP3 is $10\,\text{dBm}$, where is the input $P_{1\text{dB}}$?`,
    parts: [ex(T`$P_{1\text{dB}} - \text{IIP3}$`, 10 * Math.log10(1 - 10 ** (-1 / 20)), T`10\log_{10}(1-10^{-1/20})`, 'dB'), ex(T`$P_{1\text{dB}}$`, 10 + 10 * Math.log10(1 - 10 ** (-1 / 20)), T`10+10\log_{10}(1-10^{-1/20})`, 'dBm')],
    hints: [T`One tone of amplitude $A$: the fundamental is $a_1A - \tfrac{3}{4}a_3A^3$. Compression by 1 dB: $1 - \tfrac{3}{4}\dfrac{a_3}{a_1}A^2 = 10^{-1/20}$.`, T`The intercept amplitude satisfies $\tfrac{3}{4}\dfrac{a_3}{a_1}A_{IP3}^2 = 1$.`],
    steps: [T`$\dfrac{A_{1\text{dB}}^2}{A_{IP3}^2} = 1 - 10^{-1/20} \approx 0.109$, i.e. $-9.64\,\text{dB}$.`, T`$P_{1\text{dB}} \approx 10 - 9.64 = 0.36\,\text{dBm}$.`],
    idea: 'For a cubic nonlinearity the 1 dB compression point sits 9.6 dB below the intercept point: the rule of thumb linking the two datasheet numbers.',
    prereq: 'Power series; decibels.',
    verify: () => { const a3 = 4 / (3 * 2 * 10 * 1e-3), n = 256, fund = A => { const y = Array.from({length: n}, (_, t) => { const x = A * Math.cos(2 * Math.PI * 3 * t / n); return x - a3 * x ** 3; }); return 2 / n * y.reduce((s, v, t) => s + v * Math.cos(2 * Math.PI * 3 * t / n), 0); }, A1 = NUM.bisect(A => 20 * Math.log10(fund(A) / A) + 1, 1e-4, Math.sqrt(2 * 10 * 1e-3), 100), P1 = 10 * Math.log10(A1 * A1 / 2 / 1e-3); return [P1 - 10, P1]; } // simulate one tone through y = x − a₃x³ with IIP3 = 10 dBm
}, {
    title: 'A load seen through λ/8 and λ/4',
    diagram: tlineDiagram(50, '25 Ω', 'length λ/8, then λ/4'),
    text: T`A $25\,\Omega$ load terminates a lossless $50\,\Omega$ line. Find the input impedance when the line is a quarter wavelength long, and its resistance and reactance when the line is an eighth of a wavelength long.`,
    parts: [ex(T`$Z_{\text{in}}$ at $\lambda/4$`, 100, '100', 'Ω'), ex(T`$R$ at $\lambda/8$`, 40, '40', 'Ω'), ex(T`$X$ at $\lambda/8$`, 30, '30', 'Ω')],
    hints: [T`$\lambda/4$ inverts: $Z_0^2/Z_L$.`, T`$\lambda/8$: $\tan\beta\ell = 1$, so $Z_{\text{in}} = 50\dfrac{25 + 50j}{50 + 25j}$.`],
    steps: [T`$\lambda/4$: $2500/25 = 100\,\Omega$.`, T`$\lambda/8$: $50\cdot\dfrac{(25 + 50j)(50 - 25j)}{3125} = 40 + 30j\,\Omega$.`, T`Both have $|\Gamma| = \tfrac{1}{3}$: moving along a lossless line only rotates the reflection coefficient.`],
    idea: 'A line transforms impedance by rotating Γ around the Smith chart: a quarter wave inverts, an eighth wave turns a resistance into a complex load.',
    prereq: 'Transmission-line input impedance.',
    verify: () => { const zin = bl => { const M = [[cx(Math.cos(bl)), cx(0, 50 * Math.sin(bl))], [cx(0, Math.sin(bl) / 50), cx(Math.cos(bl))]]; return cd(ca(cm(M[0][0], cx(25)), M[0][1]), ca(cm(M[1][0], cx(25)), M[1][1])); }, q = zin(Math.PI / 2), e = zin(Math.PI / 4); return [q.re, e.re, e.im]; } // line ABCD with the load
}, {
    title: 'Matching a unilateral amplifier',
    diagram: drawing(bkChain([[80, 130, 'input match'], [290, 140, 'transistor'], [510, 130, 'output match']], 90) + dt(360, 200, '|S11| = 0.6, |S21| = 4, |S22| = 0.5, S12 ≈ 0'),
        'A transistor between input and output matching networks', 225),
    text: T`A transistor with $S_{12} \approx 0$ has $|S_{11}| = 0.6$, $|S_{21}| = 4$ and $|S_{22}| = 0.5$. Find its maximum transducer gain with both ports conjugately matched, $\dfrac{|S_{21}|^2}{(1 - |S_{11}|^2)(1 - |S_{22}|^2)}$, and how many decibels matching adds over connecting it straight into $50\,\Omega$.`,
    parts: [ex('Maximum gain', 100 / 3, T`\dfrac{100}{3}`), ex('Improvement', 10 * Math.log10(25 / 12), T`10\log_{10}(25/12)`, 'dB')],
    hints: [T`$1 - 0.36 = 0.64$ and $1 - 0.25 = 0.75$.`, T`Without matching the gain is $|S_{21}|^2 = 16$.`],
    steps: [T`$G_{\max} = \dfrac{16}{0.64\times0.75} = \dfrac{100}{3} \approx 15.2\,\text{dB}$.`, T`Improvement $10\log_{10}\dfrac{100/3}{16} = 10\log_{10}\dfrac{25}{12} \approx 3.2\,\text{dB}$.`],
    idea: 'Matching recovers the power a mismatched device would reflect at each port; the gain from each side is 1/(1 − |S|²).',
    prereq: 'S-parameters; transducer gain.',
    verify: () => { const gs = s => { let lo = -.99, hi = .99; const g = (Math.sqrt(5) - 1) / 2, f = x => (1 - x * x) / (1 - s * x) ** 2; for (let i = 0; i < 90; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (f(c) > f(d)) hi = d; else lo = c; } return f((lo + hi) / 2); }, G = 16 * gs(.6) * gs(.5); return [G, 10 * Math.log10(G / 16)]; } // best real source and load reflections
}, {
    title: 'Measuring a line with an open and a short',
    diagram: sketch('The same length of line measured twice: once with its far end open, once shorted.',
        wire('M120 70H480M120 110H480') + ring(485, 70, 4) + ring(485, 110, 4) + wire('M120 170H480M120 210H480M480 170V210'),
        [[300, 56, 'open: Zin = −j100 Ω'], [300, 156, 'shorted: Zin = j25 Ω'], [600, 140, 'Z₀ = ?']], 245),
    text: T`A length of lossless line measures $Z_{\text{oc}} = -j100\,\Omega$ with its far end open and $Z_{\text{sc}} = j25\,\Omega$ with it shorted. Find its characteristic impedance and its electrical length $\beta\ell$ in radians.`,
    parts: [ex(T`$Z_0$`, 50, '50', 'Ω'), ex(T`$\beta\ell$`, Math.atan(.5), T`\arctan(1/2)`, 'rad')],
    hints: [T`$Z_{\text{sc}} = jZ_0\tan\beta\ell$ and $Z_{\text{oc}} = -jZ_0\cot\beta\ell$.`, T`Their product is $Z_0^2$ and their ratio $-\tan^2\beta\ell$.`],
    steps: [T`$Z_0 = \sqrt{Z_{\text{oc}}Z_{\text{sc}}} = \sqrt{2500} = 50\,\Omega$.`, T`$\tan\beta\ell = \sqrt{25/100} = \tfrac{1}{2}$, so $\beta\ell = \arctan\tfrac{1}{2} \approx 0.464\,\text{rad}$ ($26.6^\circ$).`],
    idea: 'An open and a short measurement characterise any line or two-port completely: the basis of classic impedance-bridge and VNA calibration.',
    prereq: 'Transmission-line input impedance.',
    verify: () => { const x = NUM.bisect(t => Math.tan(t) ** 2 - 25 / 100, .01, 1.5); return [25 / Math.tan(x), x]; } // −Z_sc/Z_oc = tan²βℓ, then Z₀ = |Z_sc|/tan βℓ
}]);
