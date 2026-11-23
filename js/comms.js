/* Communications & RF: information theory, modulation & coding, antennas & link budgets, RF circuits & matching.
   Level 1 is a curated bank: exact answers, each reproduced by an independent calculation (verify).
   Levels 2–4 are generated from seeded values; reference answers are computed from the stated model. */
const COMMS_READING = {
    infotheory: {title: 'Information Theory (MIT OpenCourseWare 6.441)', url: 'https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/'},
    modulation: {title: 'Digital Communication Systems (MIT OpenCourseWare 6.02)', url: 'https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/'},
    linkbudget: {title: 'Principles of Digital Communications I (MIT OpenCourseWare 6.450)', url: 'https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/'},
    rfcircuits: {title: 'Electromagnetics and Applications (MIT OpenCourseWare 6.013)', url: 'https://ocw.mit.edu/courses/6-013-electromagnetics-and-applications-spring-2009/'}
};

/* ---------- shared maths ---------- */
/* Complementary error function (Numerical Recipes erfcc; relative error below 1.2e-7 everywhere). */
function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + .5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (.37409196 + t * (.09678418 + t * (-.18628806 + t * (.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-.82215223 + t * .17087277)))))))));
    return x >= 0 ? r : 2 - r;
}
const Qfn = x => .5 * erfc(x / Math.SQRT2);
const dB = x => 10 * Math.log10(x), unDB = x => 10 ** (x / 10);
const H2 = p => p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
/* Average Huffman codeword length = the sum of the probabilities created by each merge. */
function huffman(ps) {
    let q = [...ps], L = 0;
    const merges = [];
    while (q.length > 1) {
        q.sort((a, b) => a - b);
        const s = q[0] + q[1];
        merges.push(s); L += s; q = [s, ...q.slice(2)];
    }
    return {L, merges};
}
const huffLen = ps => huffman(ps).L;
/* Gray-coded square M-QAM bit error rate (nearest-neighbour approximation) at Eb/N0 = g (ratio). */
const qamBer = (M, g) => { const k = Math.log2(M); return 4 / k * (1 - 1 / Math.sqrt(M)) * Qfn(Math.sqrt(3 * k / (M - 1) * g)); };
const czin = (Z0, ZL, t) => cm(cx(Z0), cd(ca(ZL, cx(0, Z0 * t)), ca(cx(Z0), cm(cx(0, t), ZL)))); // line input impedance, t = tan βℓ
const cconj = a => cx(a.re, -a.im);

/* ---------- diagrams ---------- */
function constellationDiagram(pts, caption) {
    const s = 95 / Math.max(...pts.flatMap(p => [Math.abs(p[0]), Math.abs(p[1])]));
    let b = guide('M200 120H520') + guide('M360 18V222') + dt(536, 125, 'I') + dt(360, 12, 'Q');
    pts.forEach(([i, qv]) => { b += `<circle cx="${(360 + s * i).toFixed(1)}" cy="${(120 - s * qv).toFixed(1)}" r="5" fill="#315740"/>`; });
    return drawing(b + dt(360, 250, caption), 'Signal constellation in the I–Q plane. ' + caption, 255);
}
function tlineDiagram(caption, load, length='ℓ') {
    return drawing(element('AC', 90, 70, 90, 190, '') + dt(50, 134, 'Vs') + wire('M90 70H560M90 190H560') + element('R', 560, 70, 560, 190, load) +
        guide('M180 214H560') + dt(370, 236, length) + dt(330, 56, 'Z₀') + dt(180, 130, 'Z_in →'), 'Transmission line driven at one end and terminated in a load. ' + caption, 250);
}
function towerLink(caption, ht='h_t', hr='h_r') {
    return drawing(wire('M60 220H660') + wire('M120 220V60M610 220V140') + `<path d="M108 60h24l-12 -18z"/><path d="M598 140h24l-12 -18z"/>` +
        wire('M120 60L610 140') + guide('M120 60L420 220L610 140') + dt(90, 140, ht) + dt(640, 180, hr) + dt(420, 240, 'ground reflection') + dt(365, 84, 'direct') + dt(360, 22, caption),
        'Two antennas on towers over flat ground, with the direct ray and the ground-reflected ray. ' + caption, 250);
}
function bscDiagram(p) {
    return drawing(ring(170, 70, 8) + ring(170, 190, 8) + ring(550, 70, 8) + ring(550, 190, 8) + arrow(180, 70, 540, 70) + arrow(180, 190, 540, 190) + arrow(180, 76, 540, 184) + arrow(180, 184, 540, 76) +
        dt(140, 76, '0') + dt(140, 196, '1') + dt(580, 76, '0') + dt(580, 196, '1') + dt(360, 58, '1 − p') + dt(360, 214, '1 − p') + dt(300, 112, 'p') + dt(300, 160, 'p') + dt(360, 246, 'p = ' + p),
        'Binary symmetric channel: each bit arrives correctly with probability 1 − p and flipped with probability p', 255);
}

/* ---------- Level 1: curated ---------- */
bank('infotheory', 'advanced', [{
    title: 'The Shannon limit',
    diagram: curve('spectral efficiency R/B (bit/s/Hz)', 'minimum Eb/N0 (ratio)', [0, 6], [0, 11], e => e < 1e-9 ? Math.LN2 : (2 ** e - 1) / e),
    text: T`At the Shannon limit an AWGN channel carries $R = B\log_2(1 + \text{SNR})$ with $\text{SNR} = \dfrac{E_bR}{N_0B}$. As the bandwidth grows without limit (spectral efficiency $R/B \to 0$), what is the smallest $E_b/N_0$, as a ratio, that still allows error-free transmission?`,
    parts: [ex(T`$(E_b/N_0)_{\min}$`, Math.LN2, T`\ln 2`)],
    hints: [T`With $\eta = R/B$: $2^\eta = 1 + \eta\,E_b/N_0$, so $E_b/N_0 = \dfrac{2^\eta - 1}{\eta}$.`],
    steps: [T`$\dfrac{E_b}{N_0} = \dfrac{2^\eta - 1}{\eta}$ falls as $\eta$ falls.`, T`As $\eta \to 0$, $2^\eta - 1 \approx \eta\ln2$, so $E_b/N_0 \to \ln2 \approx 0.693$.`, T`In decibels, $10\log_{10}(\ln2) \approx -1.59\,\text{dB}$: the Shannon limit.`],
    idea: 'No code, however long, works below Eb/N0 = −1.59 dB; turbo and LDPC codes get within a fraction of a decibel of it.',
    prereq: 'Logarithms; limits.',
    verify: () => { const e = 1e-7; return [(2 ** e - 1) / e]; }
}, {
    title: 'A channel that lies a quarter of the time',
    diagram: bscDiagram('1/4'),
    text: T`A binary symmetric channel flips each bit with probability $p = \tfrac14$. What is its capacity, in bits per use?`,
    parts: [ex('Capacity C', .75 * Math.log2(3) - 1, T`\dfrac{3\ln3}{4\ln2}-1`, 'bit')],
    hints: [T`$C = 1 - H(p)$, with $H(p) = -p\log_2p - (1 - p)\log_2(1 - p)$; by symmetry the uniform input is optimal.`],
    steps: [T`$H(\tfrac14) = \tfrac14\log_24 + \tfrac34\log_2\tfrac43 = \tfrac12 + \tfrac34(2 - \log_23) = 2 - \tfrac34\log_23$.`, T`$C = 1 - H = \tfrac34\log_23 - 1 = \dfrac{3\ln3}{4\ln2} - 1 \approx 0.1887\,\text{bit}$.`],
    idea: 'A channel that is wrong a quarter of the time still carries about 0.19 bit per use, but only with long codes: capacity is a promise about long blocks, not single bits.',
    prereq: 'Entropy; mutual information.',
    verify: () => { let b = 0; for (let q = 0; q <= 1; q += 1e-5) b = Math.max(b, H2(q * .75 + (1 - q) * .25) - H2(.25)); return [b]; }
}, {
    title: 'A code as short as the entropy',
    diagram: sketch('Huffman code tree for four symbols with probabilities one half, one quarter and two eighths.',
        wire('M360 40L230 100M360 40L490 100M490 100L410 160M490 100L570 160M570 160L520 215M570 160L620 215') + ring(360, 40, 6) + ring(490, 100, 6) + ring(570, 160, 6),
        [[230, 124, 'A: 1/2 → 0'], [410, 184, 'B: 1/4 → 10'], [500, 238, 'C: 1/8 → 110'], [640, 238, 'D: 1/8 → 111'], [278, 64, '0'], [440, 64, '1']]),
    text: T`A source emits four symbols with probabilities $\tfrac12$, $\tfrac14$, $\tfrac18$ and $\tfrac18$. What is the average length, in bits per symbol, of its Huffman code?`,
    parts: [ex('Average length', 1.75, T`\dfrac74`, 'bit')],
    hints: [T`Merge the two least likely symbols repeatedly. Every probability here is a power of $\tfrac12$.`],
    steps: [T`Merge $\tfrac18 + \tfrac18 = \tfrac14$, then $\tfrac14 + \tfrac14 = \tfrac12$, then $\tfrac12 + \tfrac12 = 1$.`, T`Codeword lengths $1, 2, 3, 3$: $\bar L = \tfrac12\cdot1 + \tfrac14\cdot2 + \tfrac18\cdot3 + \tfrac18\cdot3 = \tfrac74$.`, T`The entropy $\sum p\log_2(1/p)$ is also $\tfrac74$: the code is perfectly efficient.`],
    idea: 'When every probability is a power of 1/2 the Huffman code meets the entropy exactly; otherwise it is within one bit, and coding blocks of symbols closes the gap.',
    prereq: 'Prefix codes; entropy.',
    verify: () => [huffLen([.5, .25, .125, .125])]
}, {
    title: 'Pouring power like water',
    diagram: sketch('Water-filling over two channels with noise levels 1 and 3 and water level 4.',
        `<rect x="200" y="170" width="140" height="40"/><rect x="380" y="90" width="140" height="120"/>` + guide('M170 50H560') + wire('M170 210H560'),
        [[270, 196, 'N₁ = 1'], [450, 160, 'N₂ = 3'], [600, 54, 'level ν'], [270, 110, 'P₁'], [450, 74, 'P₂']]),
    text: T`Two parallel Gaussian channels have noise powers $N_1 = 1$ and $N_2 = 3$, and a total power $P = 4$ may be split between them. With the best split, what total capacity $\sum\tfrac12\log_2(1 + P_i/N_i)$ is achievable, in bits per use?`,
    parts: [ex('Capacity', 2 - Math.log2(3) / 2, T`2-\dfrac{\ln3}{2\ln2}`, 'bit')],
    hints: [T`Water-filling: $P_i = \max(0,\ \nu - N_i)$, with the level $\nu$ set by $\sum P_i = P$.`],
    steps: [T`Try both channels active: $(\nu - 1) + (\nu - 3) = 4 \Rightarrow \nu = 4$, so $P_1 = 3$ and $P_2 = 1$, both positive.`, T`$C = \tfrac12\log_24 + \tfrac12\log_2\tfrac43 = 1 + 1 - \tfrac12\log_23$.`, T`$C = 2 - \dfrac{\ln3}{2\ln2} \approx 1.2075\,\text{bit}$.`],
    idea: 'Pour power like water into a vessel whose floor is the noise: better channels get more, and a bad enough channel gets none. OFDM and DSL bit-loading work this way.',
    prereq: 'Lagrange multipliers; Gaussian channel capacity.',
    verify: () => { let b = 0; for (let p1 = 0; p1 <= 4; p1 += 1e-5) b = Math.max(b, .5 * Math.log2(1 + p1) + .5 * Math.log2(1 + (4 - p1) / 3)); return [b]; }
}]);

/* Points of a square M-QAM constellation on odd integer levels. */
const squareQam = M => { const n = Math.sqrt(M), lv = Array.from({length: n}, (_, i) => 2 * i - n + 1); return lv.flatMap(i => lv.map(qv => [i, qv])); };
const QAM16 = squareQam(16);
bank('modulation', 'advanced', [{
    title: 'The corners of 16-QAM',
    diagram: constellationDiagram(QAM16, 'Square 16-QAM, levels ±1 and ±3'),
    text: T`A square 16-QAM constellation uses the points $I + jQ$ with $I, Q \in \{-3, -1, 1, 3\}$, all equally likely. What is the ratio of the peak symbol energy to the average symbol energy?`,
    parts: [ex('Peak-to-average ratio', 1.8, T`\dfrac95`)],
    hints: [T`Average $|s|^2 = I^2 + Q^2$ over the 16 points; the peak is at a corner.`],
    steps: [T`$I^2$ averages $\tfrac{1 + 9}{2} = 5$, and so does $Q^2$, so $\bar E = 10$.`, T`The corners have $|s|^2 = 9 + 9 = 18$.`, T`Ratio $= \dfrac{18}{10} = \dfrac95$ ($2.55\,\text{dB}$).`],
    idea: 'Dense constellations have corners well above the average energy, so the power amplifier must back off; higher-order QAM and OFDM make this worse.',
    prereq: 'Complex baseband symbols; averages.',
    verify: () => { const e = QAM16.map(([i, qv]) => i * i + qv * qv); return [Math.max(...e) / (e.reduce((s, v) => s + v, 0) / e.length)]; }
}, {
    title: 'How close are the points of 8-PSK?',
    diagram: constellationDiagram(Array.from({length: 8}, (_, k) => [Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)]), '8-PSK on the unit circle'),
    text: T`An 8-PSK constellation places 8 points evenly on a circle, with unit symbol energy. What is the minimum distance between points?`,
    parts: [ex(T`$d_{\min}$`, Math.sqrt(2 - Math.SQRT2), T`\sqrt{2-\sqrt2}`)],
    hints: [T`Neighbours are $45^\circ$ apart on a unit circle: $d = 2\sin(\pi/8)$.`],
    steps: [T`$d = 2\sin\dfrac\pi8$, and $\sin^2\dfrac\pi8 = \dfrac{1 - \cos(\pi/4)}{2} = \dfrac{2 - \sqrt2}{4}$.`, T`$d = 2\cdot\dfrac{\sqrt{2 - \sqrt2}}{2} = \sqrt{2 - \sqrt2} \approx 0.765$.`, T`QPSK has $d = \sqrt2$, so going from 2 to 3 bits per symbol costs $20\log_{10}(\sqrt2/0.765) \approx 5.3\,\text{dB}$.`],
    idea: 'Error rates are set by minimum distance for a given energy. PSK puts its points on a circle and loses distance fast as M grows, which is why QAM takes over beyond 8 points.',
    prereq: 'Trigonometry; signal constellations.',
    verify: () => { const pts = Array.from({length: 8}, (_, k) => [Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)]); let d = Infinity; for (const a of pts) for (const b of pts) if (a !== b) d = Math.min(d, Math.hypot(a[0] - b[0], a[1] - b[1])); return [d]; }
}, {
    title: 'Say it three times',
    diagram: signalChain(['Bit b', 'Repeat|b b b', 'BSC|p = 0.1', 'Majority|vote'], 'Three-fold repetition code'),
    text: T`Each bit is sent three times over a binary symmetric channel with crossover probability $p = 0.1$, and the receiver takes a majority vote. What is the probability that the decoded bit is wrong?`,
    parts: [ex('Error probability', .028, T`\dfrac{7}{250}`)],
    hints: [T`The vote fails if two or three of the copies are flipped.`],
    steps: [T`$P = \binom32p^2(1 - p) + p^3 = 3(0.01)(0.9) + 0.001$.`, T`$P = 0.027 + 0.001 = 0.028 = \dfrac{7}{250}$.`, T`The error rate falls from 0.1 to 0.028, but the rate drops to $\tfrac13$: a poor trade next to good codes.`],
    idea: 'Redundancy buys reliability. Shannon showed you can have a positive rate and vanishing errors at once, which repetition cannot give.',
    prereq: 'Binomial probabilities.',
    verify: () => { let P = 0; for (let m = 0; m < 8; m++) { const k = (m & 1) + (m >> 1 & 1) + (m >> 2 & 1); if (k >= 2) P += .1 ** k * .9 ** (3 - k); } return [P]; }
}, {
    title: 'The narrowest orthogonal FSK',
    diagram: curve('tone spacing Δf·T', 'correlation', [0, 2], [-0.3, 1], x => x < 1e-9 ? 1 : Math.sin(2 * Math.PI * x) / (2 * Math.PI * x)),
    text: T`Coherent binary FSK sends $\cos(2\pi f_1t)$ or $\cos(2\pi f_2t)$ for a bit time $T$, with carriers far above $1/T$. What is the smallest tone spacing $|f_2 - f_1|$, as a multiple of $1/T$, that makes the two signals orthogonal over a bit?`,
    parts: [ex(T`$\Delta f\cdot T$`, .5, T`\dfrac12`)],
    hints: [T`$\int_0^T\cos(2\pi f_1t)\cos(2\pi f_2t)\,dt \approx \tfrac12\int_0^T\cos(2\pi\Delta f\,t)\,dt$, because the sum-frequency term averages out.`],
    steps: [T`$\tfrac12\int_0^T\cos(2\pi\Delta f\,t)\,dt = \dfrac{\sin(2\pi\Delta f\,T)}{4\pi\Delta f}$.`, T`Its first zero is at $2\pi\Delta f\,T = \pi$, so $\Delta f = \dfrac{1}{2T}$.`, T`This is minimum-shift keying (MSK). Without phase coherence the spacing must double to $1/T$.`],
    idea: 'Orthogonality, not separation on a spectrum plot, is what lets a receiver tell signals apart; the same idea spaces OFDM subcarriers at 1/T.',
    prereq: 'Trigonometric integrals; correlation.',
    verify: () => [NUM.bisect(d => NUM.simpson(t => Math.cos(2 * Math.PI * 100 * t) * Math.cos(2 * Math.PI * (100 + d) * t), 0, 1, 20000), .3, .7, 50)]
}]);

bank('linkbudget', 'advanced', [{
    title: 'The directivity of the simplest antenna',
    diagram: sketch('Short dipole on a vertical axis with its doughnut-shaped sin-squared radiation pattern.',
        wire('M360 40V210') + `<path d="${Array.from({length: 181}, (_, i) => { const t = i * Math.PI / 180, r = 110 * Math.sin(t) ** 2; return (i ? 'L' : 'M') + (360 + r * Math.sin(t)).toFixed(1) + ' ' + (125 - r * Math.cos(t)).toFixed(1); }).join('')}${Array.from({length: 181}, (_, i) => { const t = i * Math.PI / 180, r = 110 * Math.sin(t) ** 2; return 'L' + (360 - r * Math.sin(t)).toFixed(1) + ' ' + (125 + r * Math.cos(t)).toFixed(1); }).join('')}" stroke="#b5532d"/>` + guide('M360 125L460 60'),
        [[360, 28, 'dipole axis'], [520, 130, 'sin²θ'], [400, 84, 'θ']]),
    text: T`A short (Hertzian) dipole radiates a power density proportional to $\sin^2\theta$, where $\theta$ is measured from the dipole axis. What is its directivity: the peak power density divided by the average over all directions?`,
    parts: [ex('Directivity', 1.5, T`\dfrac32`)],
    hints: [T`Average over the sphere: $\dfrac{1}{4\pi}\int_0^{2\pi}\!\!\int_0^\pi\sin^2\theta\,\sin\theta\,d\theta\,d\varphi$.`],
    steps: [T`$\int_0^\pi\sin^3\theta\,d\theta = \dfrac43$.`, T`The average is $\dfrac{2\pi\cdot4/3}{4\pi} = \dfrac23$, and the peak is $1$.`, T`$D = \dfrac{1}{2/3} = \dfrac32$ ($1.76\,\text{dBi}$). A half-wave dipole does only slightly better: $1.64$ ($2.15\,\text{dBi}$).`],
    idea: 'Directivity compares an antenna with an isotropic radiator; even the simplest antenna has some, because it cannot radiate along its own axis.',
    prereq: 'Integrals over a sphere.',
    verify: () => [1 / (NUM.simpson(t => Math.sin(t) ** 3, 0, Math.PI) / 2)]
}, {
    title: 'Where the ground starts to bite',
    diagram: towerLink('h_t = 10 m, h_r = 2 m, λ = 0.5 m', 'h_t', 'h_r'),
    text: T`Over flat ground, the two-ray model predicts that beyond a crossover distance the received power falls as $(h_th_r/d^2)^2$ instead of the free-space $(\lambda/4\pi d)^2$. For antenna heights $h_t = 10\,\text{m}$ and $h_r = 2\,\text{m}$ at $\lambda = 0.5\,\text{m}$ ($600\,\text{MHz}$), at what distance do the two laws give the same power?`,
    parts: [ex('Crossover distance', 160 * Math.PI, T`160\pi`, 'm')],
    hints: [T`Set $\dfrac{\lambda}{4\pi d} = \dfrac{h_th_r}{d^2}$.`],
    steps: [T`$d = \dfrac{4\pi h_th_r}{\lambda} = \dfrac{4\pi\cdot20}{0.5} = 160\pi \approx 503\,\text{m}$.`, T`Beyond it the power falls by $40\,\text{dB}$ per decade of distance instead of $20$.`],
    idea: 'Near the ground the direct and reflected waves cancel more and more at long range, so terrestrial links lose power with the fourth power of distance; raising either antenna pushes the crossover out.',
    prereq: 'Free-space path loss; logarithms.',
    verify: () => [NUM.bisect(d => .5 / (4 * Math.PI * d) - 20 / (d * d), 10, 1e5)]
}, {
    title: 'The first stage decides the noise',
    diagram: signalChain(['Antenna', 'LNA|G = 20 dB|T = 50 K', 'Receiver|T = 1000 K'], 'Noise temperatures in cascade'),
    text: T`A low-noise amplifier with gain $20\,\text{dB}$ and noise temperature $50\,\text{K}$ feeds a receiver with noise temperature $1000\,\text{K}$. What is the noise temperature of the cascade?`,
    parts: [ex('Noise temperature', 60, '60', 'K')],
    hints: [T`Friis: $T = T_1 + \dfrac{T_2}{G_1} + \dfrac{T_3}{G_1G_2} + \cdots$, with gains as ratios.`],
    steps: [T`$G_1 = 10^{20/10} = 100$.`, T`$T = 50 + \dfrac{1000}{100} = 60\,\text{K}$.`, T`The noisy receiver adds only $10\,\text{K}$: a high-gain first stage dominates.`],
    idea: 'Put the low-noise amplifier first and close to the antenna; any loss before it adds straight to the system noise.',
    prereq: 'Noise temperature; decibels.',
    verify: () => { const G1 = 10 ** 2, out = 50 * G1 + 1000; return [out / G1]; } // output noise referred back to the input
}, {
    title: 'Clearance for a microwave hop',
    diagram: drawing(wire('M60 220H660') + wire('M100 220V80M620 220V80') + wire('M100 80L620 80') + `<ellipse cx="360" cy="80" rx="260" ry="46" stroke="#b5532d"/>` + guide('M360 80V126') + dt(380, 108, 'r₁') + dt(360, 40, '10 km at 3 GHz') + dt(230, 74, 'd₁') + dt(490, 74, 'd₂'), 'Microwave link between two towers with the first Fresnel zone drawn as an ellipse around the line of sight', 240),
    text: T`A $10\,\text{km}$ microwave link runs at $3\,\text{GHz}$ ($\lambda = 0.1\,\text{m}$). What is the radius of the first Fresnel zone at mid-path, the clearance to keep free of obstacles?`,
    parts: [ex(T`$r_1$`, 5 * Math.sqrt(10), T`5\sqrt{10}`, 'm')],
    hints: [T`On the zone's edge the bent path is half a wavelength longer: $r_1 = \sqrt{\dfrac{\lambda d_1d_2}{d_1 + d_2}}$.`],
    steps: [T`At mid-path $d_1 = d_2 = 5000\,\text{m}$: $r_1 = \sqrt{\dfrac{0.1\times5000\times5000}{10000}} = \sqrt{250}$.`, T`$r_1 = 5\sqrt{10} \approx 15.8\,\text{m}$.`],
    idea: 'A clear line of sight is not enough: obstacles inside the first Fresnel zone cause diffraction loss, so towers are sized to keep at least 60% of it clear.',
    prereq: 'Path-length differences; square roots.',
    verify: () => [NUM.bisect(r => 2 * Math.hypot(5000, r) - 10000 - .05, 0, 100)]
}]);

bank('rfcircuits', 'advanced', [{
    title: 'What a VSWR of 3 costs',
    diagram: curve('position along the line z/λ', '|V(z)| / |V⁺|', [0, 1], [0, 1.6], z => Math.hypot(1 + .5 * Math.cos(4 * Math.PI * z), .5 * Math.sin(4 * Math.PI * z))),
    text: T`A load on a transmission line produces a voltage standing-wave ratio of 3. What fraction of the incident power is reflected?`,
    parts: [ex('Reflected fraction', .25, T`\dfrac14`)],
    hints: [T`$|\Gamma| = \dfrac{\text{VSWR} - 1}{\text{VSWR} + 1}$, and the reflected fraction of the power is $|\Gamma|^2$.`],
    steps: [T`$|\Gamma| = \dfrac{3 - 1}{3 + 1} = \dfrac12$.`, T`$|\Gamma|^2 = \dfrac14$: a quarter of the power comes back (return loss $6.0\,\text{dB}$).`],
    idea: 'VSWR, |Γ| and return loss all describe the same mismatch: VSWR 2 reflects 11% of the power and VSWR 3 reflects 25%.',
    prereq: 'Reflection coefficient; standing waves.',
    verify: () => {
        const vswr = g => { let hi = 0, lo = Infinity; for (let z = 0; z < .5; z += 1e-4) { const m = Math.hypot(1 + g * Math.cos(4 * Math.PI * z), g * Math.sin(4 * Math.PI * z)); hi = Math.max(hi, m); lo = Math.min(lo, m); } return hi / lo; };
        const g = NUM.bisect(g => vswr(g) - 3, .01, .99, 40);
        return [g * g];
    }
}, {
    title: 'A 75 Ω antenna on a 50 Ω line',
    diagram: tlineDiagram('A 50 Ω line ending in a 75 Ω antenna', '75 Ω', 'any length'),
    text: T`A $75\,\Omega$ antenna is connected to a $50\,\Omega$ line. What is the return loss, in dB?`,
    parts: [ex('Return loss', 20 * Math.log10(5), T`20\log_{10}5`, 'dB')],
    hints: [T`$\Gamma = \dfrac{Z_L - Z_0}{Z_L + Z_0}$ and $\text{RL} = -20\log_{10}|\Gamma|$.`],
    steps: [T`$\Gamma = \dfrac{75 - 50}{75 + 50} = \dfrac15$.`, T`$\text{RL} = 20\log_{10}5 \approx 13.98\,\text{dB}$; only $4\%$ of the power is reflected.`],
    idea: 'Mixing 50 Ω and 75 Ω parts costs little power (VSWR 1.5) but causes ripple and echoes; precision systems keep one impedance throughout.',
    prereq: 'Reflection coefficient; decibels.',
    verify: () => { const g = (75 - 50) / (75 + 50); return [-10 * Math.log10(g * g)]; }
}, {
    title: 'A capacitor made of line',
    diagram: drawing(element('AC', 90, 70, 90, 190, '') + wire('M90 70H520M90 190H520') + ring(520, 70, 5) + ring(520, 190, 5) + guide('M120 214H520') + dt(320, 236, 'ℓ = ?') + dt(560, 134, 'open') + dt(300, 56, 'Z₀'), 'Open-circuited stub of length l driven at one end', 250),
    text: T`An open-circuited stub of characteristic impedance $Z_0$ must present a capacitive reactance of magnitude $Z_0/\sqrt3$. What is its shortest length, as a fraction of a wavelength?`,
    parts: [ex(T`$\ell/\lambda$`, 1 / 6, T`\dfrac16`)],
    hints: [T`An open stub has $Z_{\text{in}} = -jZ_0\cot\beta\ell$, with $\beta = 2\pi/\lambda$.`],
    steps: [T`$Z_0\cot\beta\ell = Z_0/\sqrt3 \Rightarrow \cot\beta\ell = 1/\sqrt3 \Rightarrow \beta\ell = \pi/3$.`, T`$\ell = \dfrac{\pi/3}{2\pi}\,\lambda = \dfrac\lambda6$.`, T`Shorter than $\lambda/4$, an open stub looks capacitive; between $\lambda/4$ and $\lambda/2$ it looks inductive.`],
    idea: 'Lossless stubs synthesise any reactance from a length of line, which is how microwave circuits make capacitors and inductors.',
    prereq: 'Transmission-line input impedance.',
    verify: () => [NUM.bisect(l => czin(1, cx(1e9), Math.tan(2 * Math.PI * l)).im + 1 / Math.sqrt(3), .01, .24, 60)]
}, {
    title: 'The Q of an L-network',
    diagram: drawing(element('AC', 90, 70, 90, 190, '') + dt(48, 134, '50 Ω') + element('L', 90, 70, 330, 70, 'X_s') + element('C', 330, 70, 330, 190, 'X_p') + wire('M330 70H520M90 190H520') + element('R', 520, 70, 520, 190, '200 Ω') + dot(330, 70), 'L-section matching network: series reactance from the 50 ohm source, shunt reactance across the 200 ohm load', 230),
    text: T`An L-section network (one series and one shunt reactance) matches a $50\,\Omega$ source to a $200\,\Omega$ load at one frequency. What is the loaded Q of its elements?`,
    parts: [ex('Q', Math.sqrt(3), T`\sqrt3`)],
    hints: [T`The shunt element sits across the larger resistance. Converted to series form, the parallel $R$–$X$ pair must leave $50\,\Omega$ of resistance.`],
    steps: [T`Parallel to series: $R_s = \dfrac{R_p}{1 + Q^2}$ with $Q = R_p/|X_p|$.`, T`$50 = \dfrac{200}{1 + Q^2} \Rightarrow Q^2 = 3$, so $Q = \sqrt3 \approx 1.73$.`, T`The series element cancels the leftover reactance: $|X_s| = QR_s = 50\sqrt3\,\Omega$, and $|X_p| = 200/\sqrt3\,\Omega$.`],
    idea: 'The impedance ratio alone fixes an L-network’s Q, and with it the bandwidth (about f/Q); a wider band needs more sections.',
    prereq: 'Series–parallel conversion; impedance matching.',
    verify: () => { const X = NUM.bisect(X => cd(cx(1), cx(1 / 200, -1 / X)).re - 50, 1, 1e4, 100); return [200 / X]; }
}]);

/* S-parameter sets for the amplifier problems (magnitude, angle in degrees); only unconditionally stable ones are used. */
const SPARAMS = [
    [[.72, -116], [.03, 57], [2.6, 76], [.73, -54]],
    [[.45, 150], [.01, -10], [2.05, 10], [.4, -150]],
    [[.61, -170], [.045, 16], [2.5, 30], [.5, -90]],
    [[.5, -100], [.05, 40], [4, 80], [.45, -40]],
    [[.65, -140], [.04, 35], [3.2, 60], [.55, -70]],
    [[.38, -158], [.06, 52], [3.8, 75], [.38, -40]]
].map(s => s.map(([m, a]) => cp(m, a))).filter(([s11, s12, s21, s22]) => {
    const D = cs(cm(s11, s22), cm(s12, s21)), K = (1 - cabs(s11) ** 2 - cabs(s22) ** 2 + cabs(D) ** 2) / (2 * cabs(cm(s12, s21)));
    return K > 1.02 && cabs(D) < 1;
});

/* ---------- Levels 2–4: generated ---------- */
function makeCommsExercise(topic, date, level) {
    const li = TIERS.indexOf(level); // 1 university, 2 challenge, 3 expert, 4 mastery
    if (!TOPICS.some(t => t.id === topic && t.group === 'comms') || li < 1)
        throw Error('Unknown challenge selection');
    const pick = seededPicker(date, hashString(topic + level)), p = part;
    const extra = {}; // explore / concept settings for the interactive figures (js/motion.js)
    const q = (title, text, givens, parts, hints, steps, idea, diagram, prerequisites) => ({
        id: `${topic}-${level}`, title, text, givens, parts, hints, steps, idea, diagram, prerequisites, source: {reading: COMMS_READING[topic]}, ...extra
    });

    if (topic === 'infotheory') {
        if (li === 1) {
            const ps = pick([[.4, .2, .2, .1, .1], [.35, .25, .2, .15, .05], [.3, .3, .2, .1, .1], [.5, .2, .15, .1, .05], [.25, .25, .2, .15, .15], [.45, .25, .15, .1, .05]]);
            const H = -ps.reduce((s, v) => s + v * Math.log2(v), 0), {L, merges} = huffman(ps), L2 = huffLen(ps.flatMap(a => ps.map(b => a * b))) / 2, names = 'ABCDE';
            return q('Entropy and Huffman coding of a source', T`A memoryless source emits five symbols $A$–$E$ with probabilities $${ps.join(',\\ ')}$. Find its entropy and the average length of a Huffman code for single symbols, and the coding efficiency. Then find the average length per symbol of a Huffman code for pairs of symbols, and how many bits the single-symbol code saves per 1000 symbols compared with a fixed 3-bit code.`,
                [T`$P = (${ps.join(', ')})$ for $A$–$E$`, 'Memoryless source', 'Fixed-length code: 3 bits'],
                [p(T`$H$`, H, 'bit'), p(T`$\bar L$`, L, 'bit', .001), p('Efficiency', 100 * H / L, '%'), p('Pair code, per symbol', L2, 'bit', .001), p('Bits saved per 1000 symbols', 1000 * (3 - L), 'bit', .001)],
                [T`$H = -\sum p_i\log_2p_i$.`, T`Huffman: repeatedly merge the two least likely entries. The average length equals the sum of the merged probabilities.`, T`For pairs, the 25 probabilities are $p_ip_j$; divide the average length by 2.`],
                [T`$H = ${tf(H)}\,\text{bit/symbol}$.`, T`Merges: $${merges.map(m => tf(m)).join(',\\ ')}$, so $\bar L = ${tf(L)}\,\text{bit/symbol}$.`, T`Efficiency $= H/\bar L = ${tf(100 * H / L)}\%$.`, T`Huffman on the 25 pairs gives $${tf(2 * L2)}$ bits per pair, i.e. $${tf(L2)}$ per symbol, closer to $H$.`, T`Saving: $1000\,(3 - ${tf(L)}) = ${tf(1000 * (3 - L))}\,\text{bits}$.`],
                'Huffman codes are optimal for single symbols but can waste up to a bit; coding blocks of symbols brings the average length towards the entropy, as the source coding theorem promises.',
                signalChain([`Source|${names}`, 'Huffman|encoder', 'Bits|L̄ per symbol'], 'P = ' + ps.join(', ')),
                'Logarithms; prefix codes.');
        }
        if (li === 2) {
            const Pr = pick([-95, -90, -85]), NF = pick([3, 5, 7]), B = pick([1, 2, 5, 10]) * 1e6;
            const N0 = -174 + NF, N = N0 + dB(B), snr = Pr - N, C = B * Math.log2(1 + unDB(snr)), PN = unDB(Pr - N0), Cinf = PN / Math.LN2, R = Number((pick([.3, .5, .7]) * Cinf).toPrecision(2));
            const BR = Math.exp(NUM.bisect(lb => Math.exp(lb) * Math.log2(1 + PN / Math.exp(lb)) - R, 0, 30, 120));
            return q('Capacity of a noisy radio link', T`A receiver sees $P_r = ${Pr}\,\text{dBm}$ in a bandwidth $B = ${B / 1e6}\,\text{MHz}$. Its noise density is $N_0 = -174\,\text{dBm/Hz}$ plus a noise figure of $${NF}\,\text{dB}$. Find the SNR, the Shannon capacity, the spectral efficiency and the $E_b/N_0$ at capacity. With unlimited bandwidth at the same received power, what capacity is possible? And what bandwidth would carry $R = ${tf(R / 1e6)}\,\text{Mbit/s}$ at capacity?`,
                [T`$P_r = ${Pr}\,\text{dBm}$`, T`$B = ${B / 1e6}\,\text{MHz}$, $\text{NF} = ${NF}\,\text{dB}$`, T`$R = ${tf(R / 1e6)}\,\text{Mbit/s}$`],
                [p('SNR', snr, 'dB', .01, .02), p('Capacity', C / 1e6, 'Mbit/s'), p('Spectral efficiency', C / B, 'bit/s/Hz'), p(T`$E_b/N_0$ at capacity`, dB(PN / C), 'dB', .01, .02), p('Capacity, unlimited bandwidth', Cinf / 1e6, 'Mbit/s'), p(T`Bandwidth for $R$`, BR / 1e6, 'MHz')],
                [T`$N = N_0 + 10\log_{10}B$ in dBm. $C = B\log_2(1 + \text{SNR})$.`, T`$E_b/N_0 = \dfrac{P_r/N_0}{C}$, and $C_\infty = \dfrac{P_r}{N_0\ln2}$.`, T`$B\log_2\left(1 + \dfrac{P_r}{N_0B}\right) = R$ increases with $B$: solve numerically.`],
                [T`$N = ${N0} + 10\log_{10}(${tf(B)}) = ${tf(N)}\,\text{dBm}$, so $\text{SNR} = ${tf(snr)}\,\text{dB}$.`, T`$C = ${tf(B)}\log_2(1 + ${tf(unDB(snr))}) = ${tf(C / 1e6)}\,\text{Mbit/s}$, i.e. $${tf(C / B)}\,\text{bit/s/Hz}$.`, T`$P_r/N_0 = 10^{(${Pr} - (${N0}))/10} = ${tf(PN)}\,\text{Hz}$, so $E_b/N_0 = ${tf(PN / C)}$ $(${tf(dB(PN / C))}\,\text{dB})$.`, T`$C_\infty = ${tf(Cinf / 1e6)}\,\text{Mbit/s}$.`, T`Bisection on $B$ gives $${tf(BR / 1e6)}\,\text{MHz}$.`],
                'Capacity grows only logarithmically with power but nearly linearly with bandwidth until SNR becomes small; beyond that more bandwidth barely helps, because the limit is Pr/(N0 ln 2).',
                signalChain(['Transmitter', 'AWGN|N₀ + NF', 'Receiver|B'], `Pr = ${Pr} dBm`),
                'Decibels; logarithms; root finding.');
        }
        if (li === 3) {
            const e0 = pick([.01, .02, .05]), e1 = pick([.3, .4, .5]);
            const py1 = qv => (1 - qv) * e0 + qv * (1 - e1), I = qv => H2(py1(qv)) - ((1 - qv) * H2(e0) + qv * H2(e1));
            let a = 0, b = 1;
            for (let i = 0; i < 80; i++) { const m1 = a + (b - a) * .382, m2 = a + (b - a) * .618; if (I(m1) < I(m2)) a = m1; else b = m2; }
            const qs = (a + b) / 2, C = I(qs), Iu = I(.5);
            return q('Capacity of an asymmetric binary channel', T`A binary channel flips a transmitted 0 with probability $\varepsilon_0 = ${e0}$ and a transmitted 1 with probability $\varepsilon_1 = ${e1}$ (like an optical link where a dark slot is rarely misread but a light pulse can be missed). Find the mutual information with equally likely inputs, then the capacity, the input probability $P(X = 1)$ that achieves it, and $P(Y = 1)$ at that input. By how much does the best input beat the uniform one?`,
                [T`$\varepsilon_0 = P(Y = 1 \mid X = 0) = ${e0}$`, T`$\varepsilon_1 = P(Y = 0 \mid X = 1) = ${e1}$`],
                [p('I at uniform input', Iu, 'bit'), p('Capacity C', C, 'bit'), p('Optimal P(X = 1)', qs), p('P(Y = 1) at the optimum', py1(qs)), p('Gain over uniform', 100 * (C / Iu - 1), '%', .02, .01)],
                [T`$I(q) = H\big(P(Y = 1)\big) - \big[(1 - q)H(\varepsilon_0) + qH(\varepsilon_1)\big]$ with $P(Y = 1) = (1 - q)\varepsilon_0 + q(1 - \varepsilon_1)$.`, T`$I(q)$ is concave: maximise it numerically (golden section, or the Blahut–Arimoto iteration).`, T`The channel is not symmetric, so the best input is not uniform.`],
                [T`$H(\varepsilon_0) = ${tf(H2(e0))}$ and $H(\varepsilon_1) = ${tf(H2(e1))}$ bits.`, T`At $q = \tfrac12$: $P(Y = 1) = ${tf(py1(.5))}$ and $I = ${tf(Iu)}\,\text{bit}$.`, T`Maximising: $q^* = ${tf(qs)}$, $P(Y = 1) = ${tf(py1(qs))}$, $C = ${tf(C)}\,\text{bit/use}$.`, T`Gain: $${tf(100 * (C / Iu - 1))}\%$ over the uniform input.`],
                'Capacity is a maximum over input distributions; for asymmetric channels the optimum favours the more reliable symbol, and Blahut–Arimoto finds it for any discrete channel.',
                drawing(ring(170, 70, 8) + ring(170, 190, 8) + ring(550, 70, 8) + ring(550, 190, 8) + arrow(180, 70, 540, 70) + arrow(180, 190, 540, 190) + arrow(180, 76, 540, 184) + arrow(180, 184, 540, 76) + dt(140, 76, '0') + dt(140, 196, '1') + dt(580, 76, '0') + dt(580, 196, '1') + dt(360, 58, `1 − ${e0}`) + dt(360, 214, `1 − ${e1}`) + dt(290, 112, `ε₀ = ${e0}`) + dt(290, 166, `ε₁ = ${e1}`), 'Binary asymmetric channel with different flip probabilities for 0 and 1', 240),
                'Entropy; mutual information; optimisation.');
        }
        // Mastery: water-filling over the subcarriers of an OFDM symbol.
        const taps = pick([[1, .9], [1, .7, .3], [1, -.5, .4], [1, .8, -.3], [1, .6, .6]]), snr = pick([.5, 1, 2, 4]), N = 16, Pt = N * snr;
        const g = Array.from({length: N}, (_, k) => { let re = 0, im = 0; taps.forEach((h, n) => { re += h * Math.cos(2 * Math.PI * k * n / N); im -= h * Math.sin(2 * Math.PI * k * n / N); }); return re * re + im * im; });
        const inv = g.map(x => 1 / x).sort((a, b) => a - b);
        let m = N, mu = 0;
        for (; m > 0; m--) { mu = (Pt + inv.slice(0, m).reduce((s, v) => s + v, 0)) / m; if (mu > inv[m - 1]) break; }
        const P = g.map(x => Math.max(0, mu - 1 / x)), Cw = g.reduce((s, x, k) => s + Math.log2(1 + x * P[k]), 0), Ce = g.reduce((s, x) => s + Math.log2(1 + x * snr), 0), best = g.indexOf(Math.max(...g));
        return q('Water-filling across OFDM subcarriers', T`An OFDM system uses $N = 16$ subcarriers over a multipath channel with taps $h = (${taps.join(', ')})$, so subcarrier $k$ has gain $g_k = |H_k|^2$ with $H_k = \sum_nh_ne^{-j2\pi kn/16}$. The noise power per subcarrier is 1 and the total power is $${Pt}$ (an average SNR of $${snr}$). Allocate power by water-filling. Find the water level, the number of active subcarriers, the capacity per OFDM symbol, the capacity with equal power on every subcarrier, the gain of water-filling, and the power on the strongest subcarrier.`,
            [T`$h = (${taps.join(', ')})$, $N = 16$`, T`Noise 1 per subcarrier`, T`Total power $${Pt}$`],
            [p(T`Water level $\mu$`, mu), p('Active subcarriers', m, '', 0), p('Capacity, water-filling', Cw, 'bit'), p('Capacity, equal power', Ce, 'bit'), p('Gain', 100 * (Cw / Ce - 1), '%', .02, .01), p('Power on the strongest subcarrier', P[best])],
            [T`Compute the 16 gains $g_k$ (a 16-point DFT of the taps).`, T`Water-filling: $P_k = \max(0,\ \mu - 1/g_k)$ with $\sum P_k = ${Pt}$. Sort $1/g_k$ and grow the active set until the level stops rising above the next floor.`, T`Capacity $\sum_k\log_2(1 + g_kP_k)$.`],
            [T`Gains: $g = (${g.map(x => tf(x, 3)).join(',\\ ')})$.`, T`With the $${m}$ best subcarriers active: $\mu = \dfrac{${Pt} + \sum 1/g_k}{${m}} = ${tf(mu)}$${m < N ? T`, below the next floor $1/g = ${tf(inv[m])}$` : ''}.`, T`Water-filling: $C = ${tf(Cw)}\,\text{bit}$; equal power: $${tf(Ce)}\,\text{bit}$; gain $${tf(100 * (Cw / Ce - 1))}\%$.`, T`The strongest subcarrier ($k = ${best}$, $g = ${tf(g[best])}$) gets $P = ${tf(P[best])}$.`],
            'Water-filling skips deep fades and spends power where it buys the most bits; its gain is largest at low SNR and on channels with deep notches.',
            drawing(g.map((x, k) => { const hgt = Math.min(150, 150 * (1 / x) / (mu * 1.6)); return `<rect x="${110 + k * 32}" y="${(210 - hgt).toFixed(1)}" width="24" height="${hgt.toFixed(1)}"/>`; }).join('') + guide(`M100 ${(210 - 150 / 1.6).toFixed(1)}H630`) + wire('M100 210H630') + dt(370, 240, 'subcarrier k: floors 1/g_k, water level μ') + dt(660, (215 - 150 / 1.6).toFixed(1), 'μ'), 'Water-filling over 16 subcarriers: bars show the noise-to-gain floors and the dashed line the water level', 250),
            'DFT; Lagrange multipliers; capacity.');
    }

    if (topic === 'modulation') {
        if (li === 1) {
            const Rb = pick([10, 20, 50, 100]), M = pick([4, 16, 64]), al = pick([.2, .25, .35]), eb = pick([8, 10, 12, 14]), k = Math.log2(M);
            const Rs = Rb / k, Bw = (1 + al) * Rs, ber = qamBer(M, unDB(eb));
            return q('A QAM link: bandwidth and bit errors', T`A link carries $${Rb}\,\text{Mbit/s}$ with Gray-coded square $${M}$-QAM and root-raised-cosine pulses of roll-off $\alpha = ${al}$. The receiver sees $E_b/N_0 = ${eb}\,\text{dB}$ in AWGN. Find the symbol rate, the occupied bandwidth, the spectral efficiency and $E_s/N_0$. Estimate the bit error rate with $P_b \approx \dfrac{4}{\log_2M}\left(1 - \dfrac{1}{\sqrt M}\right)Q\!\left(\sqrt{\dfrac{3\log_2M}{M - 1}\dfrac{E_b}{N_0}}\right)$.`,
                [T`$R_b = ${Rb}\,\text{Mbit/s}$, $M = ${M}$`, T`$\alpha = ${al}$`, T`$E_b/N_0 = ${eb}\,\text{dB}$`],
                [p('Symbol rate', Rs, 'Mbaud'), p('Bandwidth', Bw, 'MHz'), p('Spectral efficiency', Rb / Bw, 'bit/s/Hz'), p(T`$E_s/N_0$`, eb + dB(k), 'dB'), p('Bit error rate', ber)],
                [T`$R_s = R_b/\log_2M$ and $B = (1 + \alpha)R_s$.`, T`$E_s = E_b\log_2M$, so add $10\log_{10}\log_2M$ in dB.`, T`$Q(x) = \tfrac12\operatorname{erfc}(x/\sqrt2)$.`],
                [T`$R_s = ${Rb}/${k} = ${tf(Rs)}\,\text{Mbaud}$ and $B = ${1 + al}\times${tf(Rs)} = ${tf(Bw)}\,\text{MHz}$, i.e. $${tf(Rb / Bw)}\,\text{bit/s/Hz}$.`, T`$E_s/N_0 = ${eb} + 10\log_{10}${k} = ${tf(eb + dB(k))}\,\text{dB}$.`, T`$E_b/N_0 = ${tf(unDB(eb))}$, so the $Q$ argument is $${tf(Math.sqrt(3 * k / (M - 1) * unDB(eb)))}$.`, T`$P_b \approx ${tf(ber, 4)}$.`],
                'Higher-order QAM packs more bits into each hertz but needs more Eb/N0 for the same error rate: each step from 4 to 16 to 64 points costs about 4 dB.',
                constellationDiagram(squareQam(M), `Square ${M}-QAM`),
                'Decibels; the Q function; Nyquist pulses.');
        }
        if (li === 2) {
            const d = pick([3, 5, 6, 9, 10, 11, 12, 13]), e = pick([1, 2, 3, 4, 5, 6, 7]), pe = pick([.01, .02, .05]);
            const [d1, d2, d3, d4] = [8, 4, 2, 1].map(m => +!!(d & m)), c = [d1 ^ d2 ^ d4, d1 ^ d3 ^ d4, d1, d2 ^ d3 ^ d4, d2, d3, d4], r = c.map((v, i) => i === e - 1 ? 1 - v : v);
            const s1 = r[0] ^ r[2] ^ r[4] ^ r[6], s2 = r[1] ^ r[2] ^ r[5] ^ r[6], s3 = r[3] ^ r[4] ^ r[5] ^ r[6], syn = 4 * s3 + 2 * s2 + s1;
            const fix = r.map((v, i) => i === syn - 1 ? 1 - v : v), dec = 8 * fix[2] + 4 * fix[4] + 2 * fix[5] + fix[6], Pf = 1 - (1 - pe) ** 7 - 7 * pe * (1 - pe) ** 6, P2 = 21 * pe * pe * (1 - pe) ** 5;
            return q('Decoding a Hamming (7,4) word', T`A Hamming $(7,4)$ code places parity bits at positions 1, 2 and 4 and data bits $d_1d_2d_3d_4$ at positions 3, 5, 6 and 7, with even parity: $p_1$ checks positions 1, 3, 5, 7; $p_2$ checks 2, 3, 6, 7; $p_4$ checks 4, 5, 6, 7. The word $\mathtt{${r.join('')}}$ arrives (position 1 first). Find the syndrome $s_4s_2s_1$ as a number, and the decoded data $d_1d_2d_3d_4$ as a number (with $d_1$ the most significant bit). On a binary symmetric channel with $p = ${pe}$, find the probability that a block is decoded wrongly and the probability of exactly two bit errors in a block.`,
                [T`Received $\mathtt{${r.join('')}}$`, 'Even parity; parity at positions 1, 2, 4', T`$p = ${pe}$`],
                [p('Syndrome (0–7)', syn, '', 0), p('Decoded data (0–15)', dec, '', 0), p('Block error probability', Pf), p('Probability of exactly two errors', P2)],
                [T`Recompute each parity check over the received bits; a failed check sets its syndrome bit.`, T`The syndrome, read as a binary number, is the position of a single error. Flip it and read off positions 3, 5, 6, 7.`, T`The code corrects one error, so a block fails when two or more bits flip.`],
                [T`$s_1 = r_1\oplus r_3\oplus r_5\oplus r_7 = ${s1}$, $s_2 = r_2\oplus r_3\oplus r_6\oplus r_7 = ${s2}$, $s_4 = r_4\oplus r_5\oplus r_6\oplus r_7 = ${s3}$.`, T`Syndrome $${s3}${s2}${s1}_2 = ${syn}$: the error is at position $${syn}$. Corrected word $\mathtt{${fix.join('')}}$.`, T`Data bits (positions 3, 5, 6, 7): $\mathtt{${[fix[2], fix[4], fix[5], fix[6]].join('')}} = ${dec}$.`, T`$P_{\text{fail}} = 1 - (1 - p)^7 - 7p(1 - p)^6 = ${tf(Pf, 4)}$.`, T`$P(2) = \binom72p^2(1 - p)^5 = ${tf(P2, 4)}$, most of the failures.`],
                'Hamming codes place each bit in a unique set of parity checks, so the pattern of failed checks spells out where a single error is.',
                drawing(ring(315, 100, 82) + ring(405, 100, 82) + ring(360, 175, 82) + dt(262, 90, `p₁=${r[0]}`) + dt(458, 90, `p₂=${r[1]}`) + dt(360, 236, `p₄=${r[3]}`) + dt(360, 72, `d₁=${r[2]}`) + dt(314, 162, `d₂=${r[4]}`) + dt(406, 162, `d₃=${r[5]}`) + dt(360, 134, `d₄=${r[6]}`) + dt(190, 46, 'check 1') + dt(530, 46, 'check 2') + dt(500, 250, 'check 4'), 'Venn diagram of the three Hamming parity checks with the received bits placed in their regions', 255),
                'Binary arithmetic; binomial probabilities.');
        }
        if (li === 3) {
            const enc = bits => { let s1 = 0, s2 = 0; const out = []; for (const u of bits) { out.push(u ^ s1 ^ s2, u ^ s2); s2 = s1; s1 = u; } return out; };
            const toBits = (m, n) => Array.from({length: n}, (_, i) => m >> (n - 1 - i) & 1), errs = [[2, 11], [3, 14], [5, 12], [1, 9], [4, 15], [6, 13], [2, 10], [7, 16]];
            let msg = pick([11, 19, 22, 37, 45, 52, 26, 41]), start = pick([0, 1, 2, 3, 4, 5, 6, 7]), found = null;
            for (let t = 0; t < 64 && !found; t++) {
                const m = ((msg + t - 1) % 63) + 1, code = enc([...toBits(m, 6), 0, 0]);
                for (let j = 0; j < errs.length && !found; j++) {
                    const [a, b] = errs[(start + j) % errs.length], rx = code.map((v, i) => i === a - 1 || i === b - 1 ? 1 - v : v);
                    const dist = Array.from({length: 64}, (_, x) => enc([...toBits(x, 6), 0, 0]).reduce((s, v, i) => s + (v !== rx[i]), 0)), best = Math.min(...dist);
                    if (dist.filter(v => v === best).length === 1 && dist[m] === best) found = {m, rx, a, b, best, second: Math.min(...dist.filter((v, x) => x !== m))};
                }
            }
            const {m, rx, a, b, best, second} = found, pairs = Array.from({length: 8}, (_, i) => `${rx[2 * i]}${rx[2 * i + 1]}`);
            return q('Viterbi decoding of a convolutional code', T`A rate-$\tfrac12$ convolutional encoder with memory 2 has generators $g_1 = 111$ and $g_2 = 101$ (octal 7, 5): for input $u_k$ and register $(u_{k-1}, u_{k-2})$, it sends $c_1 = u_k\oplus u_{k-1}\oplus u_{k-2}$ then $c_2 = u_k\oplus u_{k-2}$. It starts in state 00, encodes 6 message bits and then 2 zeros to flush. Over a binary symmetric channel the receiver gets the 16 bits $\mathtt{${pairs.join('\\ ')}}$. Decode with the Viterbi algorithm (Hamming metric). Give the message as a number (first bit most significant), the positions (1–16) of the two corrupted bits, and the Hamming distance from the received bits to the nearest other valid codeword.`,
                [T`$g_1 = 111$, $g_2 = 101$, start in state 00`, '6 message bits + 2 flush zeros', T`Received $\mathtt{${pairs.join('\\ ')}}$`],
                [p('Decoded message (0–63)', m, '', 0), p('First corrupted position', a, '', 0), p('Second corrupted position', b, '', 0), p('Distance to the runner-up codeword', second, '', 0)],
                [T`The trellis has 4 states $(u_{k-1}u_{k-2})$; each step adds the Hamming distance between the received pair and each branch's output.`, T`Keep the best path into each state; after 8 steps, trace back from state 00.`, T`Re-encode the decoded message and compare with the received bits to find the errors.`],
                [T`Running the Viterbi recursion, the survivor ending in state 00 has metric $${best}$.`, T`Trace-back gives the input $\mathtt{${toBits(m, 6).join('')}\,00}$, so the message is $\mathtt{${toBits(m, 6).join('')}}_2 = ${m}$.`, T`Re-encoded: $\mathtt{${enc([...toBits(m, 6), 0, 0]).join('')}}$; it differs from the received bits at positions $${a}$ and $${b}$.`, T`The next-best valid codeword is at distance $${second}$. The free distance of this code is 5, so any two errors this far apart are corrected.`],
                'Viterbi decoding finds the most likely path through the trellis with work that grows linearly with the message length; the (7,5) code corrects two scattered errors.',
                drawing(arrow(60, 125, 150, 125) + `<rect x="190" y="100" width="70" height="50"/><rect x="310" y="100" width="70" height="50"/>` + wire('M150 125h40M260 125h50M170 125V50h300M285 125V50M405 125h-25M405 125V200h65M170 125v75h300') + ring(490, 50, 18) + ring(490, 200, 18) + arrow(508, 50, 600, 50) + arrow(508, 200, 600, 200) + dt(225, 130, 'D') + dt(345, 130, 'D') + dt(490, 56, '+') + dt(490, 206, '+') + dt(80, 110, 'u') + dt(630, 56, 'c₁') + dt(630, 206, 'c₂'), 'Rate one-half convolutional encoder with two delay cells and two modulo-2 adders for generators 111 and 101', 240),
                'Finite-state machines; dynamic programming.');
        }
        // Mastery: 16-QAM over Rayleigh fading with L-branch maximal-ratio combining.
        const L = pick([2, 3, 4]), gb = pick([10, 15, 20]), fact = [1, 1, 2, 6, 24][L - 1];
        const avg = (g, LL, fa) => NUM.simpson(t => { const u = Math.exp(t); return qamBer(16, g * u) * u ** LL * Math.exp(-u) / fa; }, -25, Math.log(60), 400);
        const ber = avg(unDB(gb), L, fact), bpsk1 = .5 * (1 - Math.sqrt(unDB(gb) / (1 + unDB(gb))));
        const need = NUM.bisect(x => Math.log(avg(unDB(x), L, fact) / 1e-3), 0, 40, 32), awgn = NUM.bisect(x => Math.log(qamBer(16, unDB(x)) / 1e-3), 0, 30, 60), pen = need + dB(L) - awgn;
        return q('Diversity against Rayleigh fading', T`A 16-QAM link (Gray coding, $P_b(\gamma) \approx \tfrac34Q\big(\sqrt{0.8\,\gamma}\big)$ at $E_b/N_0 = \gamma$) runs over a Rayleigh-fading channel with $L = ${L}$ independent receive branches combined by maximal-ratio combining. Each branch has average $E_b/N_0 = ${gb}\,\text{dB}$, so the combined $\gamma$ has the density $f(\gamma) = \dfrac{\gamma^{L-1}e^{-\gamma/\bar\gamma}}{(L - 1)!\,\bar\gamma^L}$. As a reference, find the BPSK bit error rate on one branch without diversity, $\tfrac12\big(1 - \sqrt{\bar\gamma/(1 + \bar\gamma)}\big)$. Then compute the average 16-QAM bit error rate with combining, the per-branch $E_b/N_0$ that gives $10^{-3}$, the $E_b/N_0$ that gives $10^{-3}$ without fading, and the fading penalty: the total combined $E_b/N_0$ ($L$ times the per-branch value) needed with fading, minus the AWGN value.`,
            [T`16-QAM, Gray coding`, T`$L = ${L}$ branches, MRC`, T`$\bar\gamma = ${gb}\,\text{dB}$ per branch`],
            [p('BPSK, one branch', bpsk1), p('16-QAM average BER with MRC', ber), p(T`Per-branch $E_b/N_0$ for $10^{-3}$`, need, 'dB', .01, .02), p(T`AWGN $E_b/N_0$ for $10^{-3}$`, awgn, 'dB', .01, .02), p('Fading penalty', pen, 'dB', .02, .03)],
            [T`$\bar P_b = \int_0^\infty P_b(\gamma)f(\gamma)\,d\gamma$. Substitute $u = \gamma/\bar\gamma$, then $u = e^t$, so the integrand is smooth for numerical quadrature.`, T`Solve $\bar P_b(\bar\gamma) = 10^{-3}$ by bisection on $\bar\gamma$ in dB (work with $\log\bar P_b$).`, T`Without fading, solve $\tfrac34Q(\sqrt{0.8\gamma}) = 10^{-3}$. Compare like with like: $L$ branches collect $L$ times the energy of one.`],
            [T`BPSK, no diversity, at $${gb}\,\text{dB}$: $${tf(bpsk1, 4)}$ — the slow $1/(4\bar\gamma)$ decay of a single fading branch.`, T`Simpson's rule on $t \in [-25, \ln60]$: $\bar P_b = ${tf(ber, 4)}$ for 16-QAM with $L = ${L}$.`, T`Bisection: $\bar P_b = 10^{-3}$ at $${tf(need)}\,\text{dB}$ per branch.`, T`AWGN: $10^{-3}$ at $${tf(awgn)}\,\text{dB}$.`, T`Total combined $E_b/N_0 = ${tf(need)} + 10\log_{10}${L} = ${tf(need + dB(L))}\,\text{dB}$, so the penalty is $${tf(pen)}\,\text{dB}$; with diversity order $L$ the error rate falls as $\bar\gamma^{-${L}}$.`],
            'Fading makes errors decay only as 1/SNR on one branch; combining L independent branches restores a steep slope (SNR^−L), which is why MIMO and multi-antenna receivers are standard.',
            signalChain(['16-QAM|transmitter', `Rayleigh|× ${L} branches`, 'MRC|combiner', 'Detector'], `L = ${L}, ${gb} dB per branch`),
            'Probability densities; numerical integration; root finding.');
    }

    if (topic === 'linkbudget') {
        if (li === 1) {
            const f = pick([.9, 2.4, 5.8]) * 1e9, dkm = pick([1, 2, 5, 10]), Pt = pick([20, 27, 30]), Gt = pick([6, 10, 15]), Gr = pick([6, 10, 15]), Lc = pick([2, 3]), NF = pick([3, 5, 6]), B = pick([1, 5, 20]) * 1e6, req = pick([10, 15]);
            const lam = 299792458 / f, fspl = 20 * Math.log10(4 * Math.PI * dkm * 1e3 / lam), Pr = Pt + Gt + Gr - Lc - fspl, N = -174 + dB(B) + NF, snr = Pr - N, margin = snr - req, dmax = dkm * 10 ** (margin / 20);
            return q('A point-to-point radio link budget', T`A $${f / 1e9}\,\text{GHz}$ link spans $${dkm}\,\text{km}$ in free space. The transmitter gives $${Pt}\,\text{dBm}$; the antennas have gains $${Gt}\,\text{dBi}$ and $${Gr}\,\text{dBi}$; cables and connectors lose $${Lc}\,\text{dB}$ in total. The receiver has a noise figure of $${NF}\,\text{dB}$ in a $${B / 1e6}\,\text{MHz}$ bandwidth and needs an SNR of $${req}\,\text{dB}$. Find the free-space path loss, the received power, the noise floor, the SNR, the link margin and the longest distance with a zero margin. Use $c = 299\,792\,458\,\text{m/s}$.`,
                [T`$f = ${f / 1e9}\,\text{GHz}$, $d = ${dkm}\,\text{km}$`, T`$P_t = ${Pt}\,\text{dBm}$, $G_t = ${Gt}$, $G_r = ${Gr}\,\text{dBi}$, losses $${Lc}\,\text{dB}$`, T`$\text{NF} = ${NF}\,\text{dB}$, $B = ${B / 1e6}\,\text{MHz}$, required SNR $${req}\,\text{dB}$`],
                [p('Free-space path loss', fspl, 'dB', .002), p('Received power', Pr, 'dBm', .002), p('Noise floor', N, 'dBm', .002), p('SNR', snr, 'dB', .01, .05), p('Margin', margin, 'dB', .01, .05), p('Range at zero margin', dmax, 'km')],
                [T`$\text{FSPL} = 20\log_{10}\dfrac{4\pi d}{\lambda}$.`, T`$P_r = P_t + G_t + G_r - L - \text{FSPL}$; noise floor $-174 + 10\log_{10}B + \text{NF}$ dBm.`, T`Free-space loss grows $6\,\text{dB}$ per doubling of distance: $d_{\max} = d\cdot10^{\text{margin}/20}$.`],
                [T`$\lambda = ${tf(lam)}\,\text{m}$, $\text{FSPL} = ${tf(fspl)}\,\text{dB}$.`, T`$P_r = ${Pt} + ${Gt} + ${Gr} - ${Lc} - ${tf(fspl)} = ${tf(Pr)}\,\text{dBm}$.`, T`$N = -174 + ${tf(dB(B))} + ${NF} = ${tf(N)}\,\text{dBm}$.`, T`$\text{SNR} = ${tf(snr)}\,\text{dB}$, margin $${tf(margin)}\,\text{dB}$.`, T`$d_{\max} = ${dkm}\times10^{${tf(margin)}/20} = ${tf(dmax)}\,\text{km}$.`],
                'A link budget is bookkeeping in decibels: add gains, subtract losses, compare with the noise floor. The margin covers fading and everything the model leaves out.',
                towerLink(`${f / 1e9} GHz, ${dkm} km`, `Gt = ${Gt} dBi`, `Gr = ${Gr} dBi`),
                'Decibels; free-space propagation; thermal noise.');
        }
        if (li === 2) {
            const f = pick([4, 12]) * 1e9, D = pick([.6, 1.2, 2.4]), eta = pick([.55, .6, .65]), eirp = pick([45, 50, 52]), dkm = pick([36000, 38000, 40000]), La = pick([.5, 1]), Ta = pick([30, 50]), Tl = pick([40, 75]), ebreq = pick([5, 7, 9]);
            const lam = 299792458 / f, G = dB(eta * (Math.PI * D / lam) ** 2), Ts = Ta + Tl + 1000 / 1000, GT = G - dB(Ts), fspl = 20 * Math.log10(4 * Math.PI * dkm * 1e3 / lam), kdb = dB(1.380649e-23), cn0 = eirp - fspl - La + GT - kdb, Rb = unDB(cn0 - ebreq);
            return q('A satellite downlink: G/T and C/N₀', T`A geostationary satellite radiates an EIRP of $${eirp}\,\text{dBW}$ at $${f / 1e9}\,\text{GHz}$ towards a ground station $${dkm}\,\text{km}$ away; the atmosphere adds $${La}\,\text{dB}$ of loss. The station has a dish of diameter $${D}\,\text{m}$ and aperture efficiency $${eta}$, an antenna noise temperature of $${Ta}\,\text{K}$, and an LNA with noise temperature $${Tl}\,\text{K}$ and gain $30\,\text{dB}$ followed by a receiver at $1000\,\text{K}$. Find the dish gain, the system noise temperature, the figure of merit $G/T$, the path loss and $C/N_0$. What bit rate can be carried at $E_b/N_0 = ${ebreq}\,\text{dB}$? Use $k = 1.380649\times10^{-23}\,\text{J/K}$.`,
                [T`EIRP $${eirp}\,\text{dBW}$, $f = ${f / 1e9}\,\text{GHz}$, $d = ${dkm}\,\text{km}$`, T`Dish $${D}\,\text{m}$, $\eta = ${eta}$`, T`$T_a = ${Ta}\,\text{K}$, LNA $${Tl}\,\text{K}$ / $30\,\text{dB}$, receiver $1000\,\text{K}$`],
                [p('Dish gain', G, 'dBi', .002), p('System noise temperature', Ts, 'K'), p('G/T', GT, 'dB/K', .01, .05), p('Path loss', fspl, 'dB', .002), p(T`$C/N_0$`, cn0, 'dB-Hz', .002), p('Bit rate', Rb / 1e6, 'Mbit/s')],
                [T`$G = \eta\left(\dfrac{\pi D}{\lambda}\right)^2$.`, T`$T_{\text{sys}} = T_a + T_{\text{LNA}} + \dfrac{T_{\text{rx}}}{G_{\text{LNA}}}$.`, T`$C/N_0 = \text{EIRP} - \text{FSPL} - L_a + G/T - 10\log_{10}k$, and $R_b = 10^{(C/N_0 - E_b/N_0)/10}$.`],
                [T`$\lambda = ${tf(lam)}\,\text{m}$; $G = 10\log_{10}\left[${eta}\left(\dfrac{\pi\cdot${D}}{${tf(lam)}}\right)^2\right] = ${tf(G)}\,\text{dBi}$.`, T`$T_{\text{sys}} = ${Ta} + ${Tl} + 1000/1000 = ${tf(Ts)}\,\text{K}$; $G/T = ${tf(G)} - ${tf(dB(Ts))} = ${tf(GT)}\,\text{dB/K}$.`, T`$\text{FSPL} = ${tf(fspl)}\,\text{dB}$.`, T`$C/N_0 = ${eirp} - ${tf(fspl)} - ${La} + ${tf(GT)} + ${tf(-kdb)} = ${tf(cn0)}\,\text{dB-Hz}$.`, T`$R_b = 10^{(${tf(cn0)} - ${ebreq})/10} = ${tf(Rb / 1e6)}\,\text{Mbit/s}$.`],
                'G/T captures a ground station in one number: antenna gain against the noise it collects. C/N0 then fixes the bit rate for any required Eb/N0.',
                drawing(`<rect x="560" y="30" width="60" height="34"/>` + wire('M540 47h20M620 47h20') + `<path d="M120 200a70 70 0 0 1 100 -90" />` + wire('M170 155L200 130M120 200h120') + guide('M590 64L180 150') + dt(590, 90, 'satellite, EIRP') + dt(160, 225, `dish ${D} m`) + dt(400, 90, `${dkm} km`), 'Geostationary satellite beaming to a ground-station dish', 240),
                'Antenna gain; noise temperature; decibels.');
        }
        if (li === 3) {
            const f = pick([.9, 2.4]) * 1e9, ht = pick([10, 20, 30]), hr = pick([1.5, 2]), Pt = pick([20, 30]), d0 = pick([1, 2]) * 1e3;
            const lam = 299792458 / f, k = 2 * Math.PI / lam, gain = d => { const d1 = Math.hypot(d, ht - hr), d2 = Math.hypot(d, ht + hr), re = Math.cos(k * d1) / d1 - Math.cos(k * d2) / d2, im = -Math.sin(k * d1) / d1 + Math.sin(k * d2) / d2; return (lam / (4 * Math.PI)) ** 2 * (re * re + im * im); };
            const pl0 = -dB(gain(d0)), fs0 = 20 * Math.log10(4 * Math.PI * d0 / lam), db_ = NUM.bisect(d => Math.hypot(d, ht + hr) - Math.hypot(d, ht - hr) - lam / 2, 1, 1e6, 100), pl4 = 40 * Math.log10(d0) - 20 * Math.log10(ht * hr);
            const sens = Math.round(Pt + dB(gain(db_ * pick([4, 8, 16])))), dmax = NUM.bisect(d => Pt + dB(gain(d)) - sens, db_, 1e7, 100);
            return q('The exact two-ray model', T`Two isotropic antennas at heights $h_t = ${ht}\,\text{m}$ and $h_r = ${hr}\,\text{m}$ communicate at $${f / 1e9}\,\text{GHz}$ over flat, perfectly reflecting ground ($\Gamma = -1$). The received power is $P_r = P_t\left(\dfrac{\lambda}{4\pi}\right)^2\left|\dfrac{e^{-jkd_1}}{d_1} - \dfrac{e^{-jkd_2}}{d_2}\right|^2$ with $d_{1,2} = \sqrt{d^2 + (h_t \mp h_r)^2}$. At $d = ${d0 / 1e3}\,\text{km}$, find the exact path loss, the free-space loss and the fourth-power asymptote $40\log_{10}d - 20\log_{10}(h_th_r)$. Find the breakpoint, the last distance where the two rays are in phase ($d_2 - d_1 = \lambda/2$). With $P_t = ${Pt}\,\text{dBm}$ and a receiver sensitivity of $${sens}\,\text{dBm}$, find the maximum range.`,
                [T`$h_t = ${ht}\,\text{m}$, $h_r = ${hr}\,\text{m}$`, T`$f = ${f / 1e9}\,\text{GHz}$, $\Gamma = -1$`, T`$P_t = ${Pt}\,\text{dBm}$, sensitivity $${sens}\,\text{dBm}$`],
                [p('Exact path loss at ' + d0 / 1e3 + ' km', pl0, 'dB', .003), p('Free-space loss', fs0, 'dB', .002), p('Fourth-power asymptote', pl4, 'dB', .002), p('Breakpoint distance', db_, 'm'), p('Maximum range', dmax / 1e3, 'km')],
                [T`Sum the two phasors directly; $k = 2\pi/\lambda$.`, T`$d_2 - d_1$ shrinks with distance; beyond the point where it equals $\lambda/2$ the rays drift towards cancellation.`, T`Beyond the breakpoint the power falls monotonically, so bisect for the sensitivity.`],
                [T`$\lambda = ${tf(lam)}\,\text{m}$. At $${d0}\,\text{m}$: $d_1 = ${tf(Math.hypot(d0, ht - hr), 8)}$, $d_2 = ${tf(Math.hypot(d0, ht + hr), 8)}\,\text{m}$; exact loss $${tf(pl0)}\,\text{dB}$.`, T`Free space: $${tf(fs0)}\,\text{dB}$; asymptote: $${tf(pl4)}\,\text{dB}$.`, T`$d_2 - d_1 = \lambda/2$ at $d = ${tf(db_)}\,\text{m}$ (close to $4h_th_r/\lambda = ${tf(4 * ht * hr / lam)}\,\text{m}$).`, T`Bisection beyond the breakpoint: $P_r = ${sens}\,\text{dBm}$ at $${tf(dmax / 1e3)}\,\text{km}$.`],
                'Close in, the two rays beat and the power swings around the free-space line; beyond the breakpoint they cancel steadily and the loss grows at 40 dB per decade, independent of frequency.',
                towerLink(`${f / 1e9} GHz over flat ground`, `h_t = ${ht} m`, `h_r = ${hr} m`),
                'Complex phasors; logarithms; root finding.');
        }
        // Mastery: a uniform linear array, steered.
        const N = pick([6, 8, 10, 12]), th0 = pick([0, 20, 30]), dl = pick(th0 === 30 ? [.5, .6] : [.5, .6, .7]), u0 = Math.sin(rad(th0)), kd = 2 * Math.PI * dl;
        const af = u => { const ps = kd * (u - u0) / 2; return Math.abs(Math.sin(ps)) < 1e-12 ? 1 : (Math.sin(N * ps) / (N * Math.sin(ps))) ** 2; };
        const D = 2 / NUM.simpson(af, -1, 1, 2000), psiH = NUM.bisect(x => (Math.sin(N * x / 2) / (N * Math.sin(x / 2))) ** 2 - .5, 1e-9, 2 * Math.PI / N, 100);
        const uL = u0 - psiH / kd, uR = u0 + psiH / kd, hpbw = deg(Math.asin(Math.min(1, uR)) - Math.asin(Math.max(-1, uL))), nullU = 1 / (N * dl);
        let psl = 0;
        for (let i = 0; i <= 8000; i++) { const u = -1 + i / 4000; if (Math.abs(u - u0) > nullU) psl = Math.max(psl, af(u)); }
        const gmax = 1 / dl - 1 >= 1 ? 90 : deg(Math.asin(1 / dl - 1));
        extra.explore = {type: 'array', N, d: dl, theta0: th0};
        return q('Steering a uniform linear array', T`A uniform linear array has $N = ${N}$ isotropic elements spaced $d = ${dl}\lambda$ along a line, with equal amplitudes and a progressive phase that steers the main beam to $\theta_0 = ${th0}^\circ$ from broadside. With $u = \sin\theta$, the normalised power pattern is $\left|\dfrac{\sin(N\psi/2)}{N\sin(\psi/2)}\right|^2$ with $\psi = kd(u - u_0)$. Find the directivity by integrating the pattern over all directions, the half-power beamwidth, the peak sidelobe level, and the largest steering angle this spacing allows without grating lobes.`,
            [T`$N = ${N}$, $d = ${dl}\lambda$`, T`$\theta_0 = ${th0}^\circ$ from broadside`, 'Isotropic elements, uniform amplitudes'],
            [p('Directivity', dB(D), 'dBi', .005), p('Half-power beamwidth', hpbw, '°'), p('Peak sidelobe level', 10 * Math.log10(psl), 'dB', .01), p('Largest grating-lobe-free steering angle', gmax, '°')],
            [T`The array lies along an axis, so the pattern depends only on $u$, and $d\Omega = 2\pi\,du$: $D = \dfrac{2}{\int_{-1}^1|AF(u)|^2\,du}$ with the pattern normalised to 1 at the peak.`, T`Half power: solve $\left|\dfrac{\sin(N\psi/2)}{N\sin(\psi/2)}\right|^2 = \tfrac12$ for $\psi$, then $u = u_0 \pm \psi/(kd)$ and $\theta = \arcsin u$.`, T`The first nulls are at $u_0 \pm \lambda/(Nd)$; search the pattern outside them for the largest sidelobe. No grating lobe while $d/\lambda < 1/(1 + |\sin\theta_0|)$.`],
            [T`Simpson's rule over $u \in [-1, 1]$: $D = ${tf(D)}$ $(${tf(dB(D))}\,\text{dBi})$.`, T`Half power at $\psi = ${tf(psiH)}\,\text{rad}$: $u \in [${tf(uL)}, ${tf(uR)}]$, beamwidth $${tf(hpbw)}^\circ$.`, T`Peak sidelobe: $${tf(10 * Math.log10(psl))}\,\text{dB}$ relative to the main beam.`, T`$\sin\theta_{\max} = \lambda/d - 1 = ${tf(1 / dl - 1)}$${1 / dl - 1 >= 1 ? ', so any angle works' : T`, so $\theta_{\max} = ${tf(gmax)}^\circ$`}.`],
            'Steering an array widens its beam (by about 1/cos θ₀) while uniform weighting fixes the first sidelobe near −13 dB; spacing above λ/2 buys aperture but limits how far the beam can be steered.',
            drawing(Array.from({length: N}, (_, i) => ring(+(160 + i * 400 / (N - 1)).toFixed(1), 200, 7)).join('') + wire('M140 200H580') + arrow(360, 200, +(360 + 150 * Math.sin(rad(th0))).toFixed(1), +(200 - 150 * Math.cos(rad(th0))).toFixed(1)) + guide('M360 200V40') + dt(+(380 + 160 * Math.sin(rad(th0))).toFixed(1), +(190 - 160 * Math.cos(rad(th0))).toFixed(1), `θ₀ = ${th0}°`) + dt(360, 236, `${N} elements, d = ${dl}λ`), 'Uniform linear array of isotropic elements with the main beam steered away from broadside', 250),
            'Array factor; numerical integration; root finding.');
    }

    // rfcircuits
    if (li === 1) {
        const Z0 = pick([50, 75]), R = pick([25, 30, 100, 150]), X = pick([-50, -25, 25, 40]), l = pick([.1, .15, .2, .3]), ZL = cx(R, X);
        const G = cd(cs(ZL, cx(Z0)), ca(ZL, cx(Z0))), g = cabs(G), vswr = (1 + g) / (1 - g), Zin = czin(Z0, ZL, Math.tan(2 * Math.PI * l));
        extra.concept = {gamma: [G.re, G.im]};
        return q('A mismatched load seen through a line', T`A lossless line of $Z_0 = ${Z0}\,\Omega$ is terminated in $Z_L = ${R} ${X < 0 ? '-' : '+'} j${Math.abs(X)}\,\Omega$. Find the magnitude and angle of the load reflection coefficient, the VSWR and the return loss. Then find the input impedance $${l}\lambda$ from the load.`,
            [T`$Z_0 = ${Z0}\,\Omega$`, T`$Z_L = ${R} ${X < 0 ? '-' : '+'} j${Math.abs(X)}\,\Omega$`, T`$\ell = ${l}\lambda$`],
            [p(T`$|\Gamma_L|$`, g), p(T`$\angle\Gamma_L$`, cphase(G), '°', .01, .1), p('VSWR', vswr), p('Return loss', -20 * Math.log10(g), 'dB'), p(T`$\operatorname{Re}Z_{\text{in}}$`, Zin.re, 'Ω', .01, .05), p(T`$\operatorname{Im}Z_{\text{in}}$`, Zin.im, 'Ω', .01, .05)],
            [T`$\Gamma_L = \dfrac{Z_L - Z_0}{Z_L + Z_0}$; $\text{VSWR} = \dfrac{1 + |\Gamma|}{1 - |\Gamma|}$; $\text{RL} = -20\log_{10}|\Gamma|$.`, T`$Z_{\text{in}} = Z_0\dfrac{Z_L + jZ_0\tan\beta\ell}{Z_0 + jZ_L\tan\beta\ell}$ with $\beta\ell = 2\pi\ell/\lambda$.`],
            [T`$\Gamma_L = \dfrac{${tc(cs(ZL, cx(Z0)))}}{${tc(ca(ZL, cx(Z0)))}} = ${tc(G)}$, so $|\Gamma_L| = ${tf(g)}$ at $${tf(cphase(G))}^\circ$.`, T`$\text{VSWR} = ${tf(vswr)}$ and $\text{RL} = ${tf(-20 * Math.log10(g))}\,\text{dB}$.`, T`$\beta\ell = ${tf(360 * l)}^\circ$, $\tan\beta\ell = ${tf(Math.tan(2 * Math.PI * l))}$.`, T`$Z_{\text{in}} = ${tc(Zin)}\,\Omega$.`],
            'A line transforms impedance with position: |Γ| stays fixed while its angle rotates by 2βℓ, which is exactly a turn around the centre of the Smith chart.',
            tlineDiagram(`Z₀ = ${Z0} Ω, Z_L = ${R} ${X < 0 ? '−' : '+'} j${Math.abs(X)} Ω`, 'Z_L', `ℓ = ${l}λ`),
            'Complex numbers; transmission lines.');
    }
    if (li === 2) {
        const Z0 = 50, Y0 = 1 / Z0, [R, X] = pick([[25, -30], [100, 50], [30, 40], [150, -60], [60, -80], [20, 10]]), ZL = cx(R, X), YL = cd(cx(1), ZL);
        const yin = (d, sc=1) => { const t = Math.tan(2 * Math.PI * d * sc); return cm(cx(Y0), cd(ca(YL, cx(0, Y0 * t)), ca(cx(Y0), cm(cx(0, t), YL)))); };
        let lo = 0, d = 0;
        for (let i = 1; i <= 2000; i++) { const a = (i - 1) / 4000, b = i / 4000; if ((yin(a).re - Y0) * (yin(b).re - Y0) <= 0) { lo = a; d = NUM.bisect(x => yin(x).re - Y0, a, b, 80); break; } }
        const Bn = yin(d).im / Y0, ls = (Math.PI / 2 - Math.atan(Bn)) / (2 * Math.PI), gL = cabs(cd(cs(ZL, cx(Z0)), ca(ZL, cx(Z0))));
        const yTot = ca(yin(d, 1.1), cx(0, -Y0 / Math.tan(2 * Math.PI * ls * 1.1))), g11 = cabs(cd(cs(cx(Y0), yTot), ca(cx(Y0), yTot)));
        const GL = cd(cs(ZL, cx(Z0)), ca(ZL, cx(Z0)));
        extra.concept = {gamma: [GL.re, GL.im]};
        return q('Matching with a single shunt stub', T`A load $Z_L = ${R} ${X < 0 ? '-' : '+'} j${Math.abs(X)}\,\Omega$ terminates a $50\,\Omega$ line. A short-circuited $50\,\Omega$ stub is to be connected in shunt at the nearest point where $\operatorname{Re}Y_{\text{in}} = Y_0$, and its length chosen to cancel the susceptance there. Find the distance from the load, the normalised susceptance $B/Y_0$ to be cancelled, and the shortest stub length, all in wavelengths. Find the VSWR on the line between the load and the stub, and $|\Gamma|$ at the input when the frequency rises by 10%.`,
            [T`$Z_L = ${R} ${X < 0 ? '-' : '+'} j${Math.abs(X)}\,\Omega$`, T`$Z_0 = 50\,\Omega$, short-circuited shunt stub`, 'Check at 1.1 f₀'],
            [p(T`$d/\lambda$`, d, '', .005, 5e-4), p(T`$B/Y_0$`, Bn, '', .01, .005), p(T`Stub length $\ell/\lambda$`, ls, '', .005, 5e-4), p('VSWR, load to stub', (1 + gL) / (1 - gL)), p(T`$|\Gamma|$ at $1.1f_0$`, g11)],
            [T`Move along the line: $Y_{\text{in}}(d) = Y_0\dfrac{Y_L + jY_0\tan\beta d}{Y_0 + jY_L\tan\beta d}$. Find the first $d$ with $\operatorname{Re}Y_{\text{in}} = Y_0$.`, T`There $Y_{\text{in}} = Y_0 + jB$. A shorted stub gives $-jY_0\cot\beta\ell$: set $\cot\beta\ell = B/Y_0$.`, T`At $1.1f_0$ every electrical length grows by 10%: recompute both admittances and $\Gamma = \dfrac{Y_0 - Y}{Y_0 + Y}$.`],
            [T`$Y_L = ${tc(cm(YL, cx(1e3)))}\,\text{mS}$.`, T`Scanning and bisecting: $\operatorname{Re}Y_{\text{in}} = Y_0$ first at $d = ${tf(d)}\lambda$.`, T`There $Y_{\text{in}}/Y_0 = 1 ${Bn < 0 ? '-' : '+'} j${tf(Math.abs(Bn))}$.`, T`$\beta\ell = \dfrac\pi2 - \arctan(B/Y_0) = ${tf(2 * Math.PI * ls)}\,\text{rad}$, so $\ell = ${tf(ls)}\lambda$.`, T`$|\Gamma_L| = ${tf(gL)}$, VSWR $${tf((1 + gL) / (1 - gL))}$. At $1.1f_0$: $|\Gamma| = ${tf(g11)}$.`],
            'A single stub matches any load at one frequency by first moving to the unit-conductance circle and then cancelling the leftover susceptance; the match degrades as frequency moves.',
            drawing(element('AC', 70, 70, 70, 190, '') + wire('M70 70H600M70 190H600') + element('R', 600, 70, 600, 190, 'Z_L') + wire('M330 70V20M330 190V240') + wire('M330 20h-60M330 240h-60') + wire('M270 20V240') + guide('M330 214H600') + dt(465, 232, 'd') + dt(250, 130, 'ℓ (short)') + dt(200, 56, 'Z₀ = 50 Ω'), 'Transmission line with a short-circuited shunt stub at distance d from the load', 255),
            'Admittance; transmission lines; root finding.');
    }
    if (li === 3) {
        const [s11, s12, s21, s22] = pick(SPARAMS), fG = pick([2, 4, 6]);
        const D = cs(cm(s11, s22), cm(s12, s21)), K = (1 - cabs(s11) ** 2 - cabs(s22) ** 2 + cabs(D) ** 2) / (2 * cabs(cm(s12, s21))), mag = 10 * Math.log10(cabs(s21) / cabs(s12) * (K - Math.sqrt(K * K - 1)));
        const B1 = 1 + cabs(s11) ** 2 - cabs(s22) ** 2 - cabs(D) ** 2, C1 = cs(s11, cm(D, cconj(s22))), B2 = 1 + cabs(s22) ** 2 - cabs(s11) ** 2 - cabs(D) ** 2, C2 = cs(s22, cm(D, cconj(s11)));
        const gs = (B1 - Math.sqrt(B1 * B1 - 4 * cabs(C1) ** 2)) / (2 * cabs(C1)), gl = (B2 - Math.sqrt(B2 * B2 - 4 * cabs(C2) ** 2)) / (2 * cabs(C2));
        const sp = z => `${tf(cabs(z), 3)}\\angle${tf(cphase(z), 3)}^\\circ`;
        return q('Stability and maximum gain of a transistor amplifier', T`A transistor at $${fG}\,\text{GHz}$ has $S_{11} = ${sp(s11)}$, $S_{12} = ${sp(s12)}$, $S_{21} = ${sp(s21)}$ and $S_{22} = ${sp(s22)}$ in a $50\,\Omega$ system. Find the Rollett stability factor $K$ and $|\Delta|$, confirm it is unconditionally stable, and find the maximum available gain. Find the magnitudes of the source and load reflection coefficients for a simultaneous conjugate match.`,
            [T`$S_{11} = ${sp(s11)}$, $S_{12} = ${sp(s12)}$`, T`$S_{21} = ${sp(s21)}$, $S_{22} = ${sp(s22)}$`, T`$Z_0 = 50\,\Omega$`],
            [p(T`$K$`, K), p(T`$|\Delta|$`, cabs(D)), p('Maximum available gain', mag, 'dB'), p(T`$|\Gamma_S|$`, gs), p(T`$|\Gamma_L|$`, gl)],
            [T`$\Delta = S_{11}S_{22} - S_{12}S_{21}$ and $K = \dfrac{1 - |S_{11}|^2 - |S_{22}|^2 + |\Delta|^2}{2|S_{12}S_{21}|}$. Unconditionally stable if $K > 1$ and $|\Delta| < 1$.`, T`$G_{\max} = \dfrac{|S_{21}|}{|S_{12}|}\left(K - \sqrt{K^2 - 1}\right)$.`, T`$\Gamma_S = \dfrac{B_1 - \sqrt{B_1^2 - 4|C_1|^2}}{2C_1}$ with $B_1 = 1 + |S_{11}|^2 - |S_{22}|^2 - |\Delta|^2$, $C_1 = S_{11} - \Delta S_{22}^*$; swap $1 \leftrightarrow 2$ for $\Gamma_L$.`],
            [T`$\Delta = ${tc(D)}$, $|\Delta| = ${tf(cabs(D))}$.`, T`$K = ${tf(K)} > 1$: unconditionally stable.`, T`$G_{\max} = ${tf(cabs(s21) / cabs(s12))}\times(${tf(K)} - ${tf(Math.sqrt(K * K - 1))}) = ${tf(10 ** (mag / 10))}$, i.e. $${tf(mag)}\,\text{dB}$.`, T`$B_1 = ${tf(B1)}$, $|C_1| = ${tf(cabs(C1))}$: $|\Gamma_S| = ${tf(gs)}$. $B_2 = ${tf(B2)}$, $|C_2| = ${tf(cabs(C2))}$: $|\Gamma_L| = ${tf(gl)}$.`],
            'An unconditionally stable transistor can be conjugate-matched at both ports at once, giving the maximum available gain; the reverse transmission S12 is what couples the two matches.',
            signalChain(['Source|50 Ω', 'Input match|Γ_S', 'Transistor|[S]', 'Output match|Γ_L', 'Load|50 Ω'], `Amplifier design at ${fG} GHz`),
            'Complex arithmetic; S-parameters.');
    }
    // Mastery: a binomial multisection quarter-wave transformer, analysed exactly.
    const Z0 = 50, ZLr = pick([100, 150, 200, 20]), N = pick([2, 3, 4]), Gm = pick([.05, .1]);
    const Cn = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
    const Zs = [];
    let zc = Z0;
    for (let n = 0; n < N; n++) { zc *= Math.exp(Cn(N, n) / 2 ** N * Math.log(ZLr / Z0)); Zs.push(zc); }
    const gam = fr => { let z = cx(ZLr); const t = Math.tan(Math.PI / 2 * fr); for (let i = N - 1; i >= 0; i--) z = czin(Zs[i], z, t); return cabs(cd(cs(z, cx(Z0)), ca(z, cx(Z0)))); };
    const fm = NUM.bisect(fr => gam(fr) - Gm, .01, 1, 100), bwExact = 200 * (1 - fm), A = Math.abs((ZLr - Z0) / (ZLr + Z0)) / 2 ** N, bwF = 100 * (2 - 4 / Math.PI * Math.acos(.5 * (Gm / A) ** (1 / N)));
    return q('A binomial multisection transformer', T`A $${N}$-section binomial quarter-wave transformer matches $Z_0 = 50\,\Omega$ to $Z_L = ${ZLr}\,\Omega$. Design the sections with the usual approximation $\ln\dfrac{Z_{n+1}}{Z_n} = 2^{-N}\binom Nn\ln\dfrac{Z_L}{Z_0}$, $n = 0, \ldots, N - 1$, starting from $Z_0$. Then analyse the design exactly by cascading the quarter-wave sections ($\beta\ell = \tfrac\pi2f/f_0$). Find the first and last section impedances, the exact fractional bandwidth over which $|\Gamma| \le ${Gm}$, the bandwidth predicted by $\dfrac{\Delta f}{f_0} = 2 - \dfrac4\pi\arccos\left[\tfrac12\left(\dfrac{\Gamma_m}{|A|}\right)^{1/N}\right]$ with $A = 2^{-N}\dfrac{Z_L - Z_0}{Z_L + Z_0}$, and $|\Gamma|$ at $0.8f_0$.`,
        [T`$N = ${N}$ sections, $Z_0 = 50\,\Omega$, $Z_L = ${ZLr}\,\Omega$`, T`$\Gamma_m = ${Gm}$`, 'Exact analysis: cascade of ideal quarter-wave lines'],
        [p(T`$Z_1$`, Zs[0], 'Ω'), p(T`$Z_${N}$`, Zs[N - 1], 'Ω'), p('Exact fractional bandwidth', bwExact, '%'), p('Formula bandwidth', bwF, '%'), p(T`$|\Gamma(0.8f_0)|$`, gam(.8))],
        [T`Each section multiplies the impedance by $\exp\!\left[2^{-N}\binom Nn\ln(Z_L/Z_0)\right]$.`, T`Start at the load: $Z_{\text{in}} = Z_n\dfrac{Z + jZ_n\tan\beta\ell}{Z_n + jZ\tan\beta\ell}$ for each section towards the source, then $\Gamma = \dfrac{Z_{\text{in}} - Z_0}{Z_{\text{in}} + Z_0}$.`, T`$|\Gamma|$ rises steadily away from $f_0$ and is symmetric about it: bisect for the lower edge $f_m$, and the bandwidth is $2(1 - f_m/f_0)$.`],
        [T`Sections: $${Zs.map((z, i) => `Z_${i + 1} = ${tf(z)}`).join(',\\ ')}\,\Omega$.`, T`Bisection: $|\Gamma| = ${Gm}$ at $f = ${tf(fm)}f_0$, so the exact bandwidth is $${tf(bwExact)}\%$.`, T`$|A| = ${tf(A)}$; the formula gives $${tf(bwF)}\%$.`, T`At $0.8f_0$: $|\Gamma| = ${tf(gam(.8))}$.`],
        'Binomial transformers give a maximally flat response; more sections widen the band, and the textbook bandwidth formula is close to the exact cascade.',
        drawing(element('AC', 60, 80, 60, 180, '') + wire('M60 80h40M60 180h40') + Array.from({length: N}, (_, i) => { const x = 100 + i * 460 / N, w = 460 / N, h = 30 + 25 * i; return `<rect x="${x.toFixed(1)}" y="${130 - h}" width="${w.toFixed(1)}" height="${2 * h}"/>` + dt(+(x + w / 2).toFixed(1), 136, `Z${'₁₂₃₄'[i]}`); }).join('') + element('R', 600, 80, 600, 180, `${ZLr} Ω`) + wire('M560 80h40M560 180h40') + dt(330, 232, `${N} quarter-wave sections`), 'Multisection quarter-wave transformer between a 50 ohm source and the load', 250),
        'Transmission lines; complex arithmetic; root finding.');
}
