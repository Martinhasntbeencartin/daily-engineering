// Advanced exercises: explicit assumptions, derived checkpoints, and reusable source credits.
const OPEN_LICENSE = {
    license: 'CC BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
};
const AC_BOOK = 'https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Electronics/AC_Electrical_Circuit_Analysis:_A_Practical_Approach_(Fiore)/';
const OPEN_SOURCES = {
    thevenin: {
        ...OPEN_LICENSE,
        title: 'MIT 6.002 · Homework 5, problem 5.1',
        author: 'Anant Agarwal and Jeffrey Lang, MIT OpenCourseWare (2007)',
        url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/e26921fde419a3632a4241786551171e_hw5.pdf',
        changes: 'Original figure cropped from the problem sheet. Numerical parameters, load-design extension, wording, and worked steps added.'
    },
    nonlinear: {
        ...OPEN_LICENSE,
        title: 'MIT 6.002 · Homework 5, problem 5.2',
        author: 'Anant Agarwal and Jeffrey Lang, MIT OpenCourseWare (2007)',
        url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/e26921fde419a3632a4241786551171e_hw5.pdf',
        changes: 'Original two-amplifier figure cropped from the problem sheet. Numerical cascade and feedback extension, wording, and worked steps added.'
    },
    convolution: {
        ...OPEN_LICENSE,
        title: 'MIT 6.003 · Homework 5, problem 1(c–d)',
        author: 'Dennis Freeman, MIT OpenCourseWare (2011)',
        url: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/d8643589e135c5852360a69a3c0932df_MIT6_003F11_hw05.pdf',
        changes: 'Two convolution tasks combined into a delayed three-sequence problem. New block diagram, wording, and worked steps.'
    },
    nodal: {
        ...OPEN_LICENSE,
        title: 'AC Electrical Circuit Analysis · 6.6, problem 11',
        author: 'James M. Fiore, via Engineering LibreTexts',
        url: AC_BOOK + '06:_Nodal_and_Mesh_Analysis/6.6:_Exercises',
        changes: 'Original figure 6 retained. Source-current values vary by date; extra node-voltage checkpoints and worked steps added.'
    },
    jfet: {
        ...OPEN_LICENSE,
        title: 'Semiconductor Devices · 11.8, problem 1',
        author: 'James M. Fiore, via Engineering LibreTexts',
        url: 'https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Electronics/Semiconductor_Devices_-_Theory_and_Application_(Fiore)/11:_JFET_Small_Signal_Amplfiers/11.8:_Exercises',
        changes: 'Original figure 1 retained. Supply and load variants, physical-root and operating-region checks, new wording, and worked steps added.'
    },
    crossover: {
        ...OPEN_LICENSE,
        title: 'AC Electrical Circuit Analysis · 4.6, problem 52',
        author: 'James M. Fiore, via Engineering LibreTexts',
        url: AC_BOOK + '04:_Series-Parallel_RLC_Circuits/4.6:_Exercises',
        changes: 'Original figure 25 retained. Woofer values retained; transfer-function coefficients, frequency variants, and worked steps added.'
    }
};
const sourceFigure = (file, alt) => `<img class="source-figure" src="assets/open-materials/${file}" alt="${alt}">`;
const cx = (re, im=0) => ({re, im});
const ca = (a, b) => cx(a.re + b.re, a.im + b.im), cs = (a, b) => cx(a.re - b.re, a.im - b.im);
const cm = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cd = (a, b) => {
    const d = b.re * b.re + b.im * b.im;
    return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const cabs = a => Math.hypot(a.re, a.im), cphase = a => Math.atan2(a.im, a.re) * 180 / Math.PI;
const cp = (m, d) => cx(m * Math.cos(d * Math.PI / 180), m * Math.sin(d * Math.PI / 180));
const croot = a => {
    const r = cabs(a);
    return cx(Math.sqrt((r + a.re) / 2), Math.sign(a.im || 1) * Math.sqrt(Math.max(0, (r - a.re) / 2)));
};
const ctanh = a => cx(Math.sinh(2 * a.re) / (Math.cosh(2 * a.re) + Math.cos(2 * a.im)), Math.sin(2 * a.im) / (Math.cosh(2 * a.re) + Math.cos(2 * a.im)));
const cf = a => `${fmt(a.re)} ${a.im < 0 ? '−' : '+'} j${fmt(Math.abs(a.im))}`;
function complexSolve(matrix, rhs) {
    const a = matrix.map((r, i) => [...r, rhs[i]]), n = a.length;
    for (let k = 0; k < n; k++) {
        let pivot = k;
        for (let i = k + 1; i < n; i++)
            if (cabs(a[i][k]) > cabs(a[pivot][k]))
                pivot = i;
        [a[k], a[pivot]] = [a[pivot], a[k]];
        const div = a[k][k];
        a[k] = a[k].map(v => cd(v, div));
        for (let i = 0; i < n; i++)
            if (i !== k) {
                const factor = a[i][k];
                a[i] = a[i].map((v, j) => cs(v, cm(factor, a[k][j])));
            }
    }
    return a.map(r => r[n]);
}
function kMapDiagram(ones) {
    const gray = [0, 1, 3, 2];
    let body = dt(360, 25, 'Karnaugh map · rows AB, columns CD · Gray order');
    gray.forEach((n, i) => {
        body += dt(240 + i * 75, 57, n.toString(2).padStart(2, '0'));
        body += dt(165, 95 + i * 40, n.toString(2).padStart(2, '0'));
    });
    gray.forEach((r, i) => gray.forEach((c, j) => {
        body += `<rect x="${203 + j * 75}" y="${68 + i * 40}" width="75" height="40"/>` + dt(240 + j * 75, 95 + i * 40, ones.includes(r * 4 + c) ? '1' : '0');
    }));
    return drawing(body, 'Four-variable Karnaugh map showing the specified truth table');
}
// Exhaustive prime-implicant set cover; hazard constraints require every adjacent 1-pair to share a term.
function logicCover(ones, hazard=false) {
    const all = [];
    for (let code = 0; code < 81; code++) {
        let k = code;
        const digits = Array.from({length: 4}, () => {
            const d = k % 3;
            k = Math.floor(k / 3);
            return d;
        });
        const covered = Array.from({length: 16}, (_, v) => v).filter(v => digits.every((d, i) => d === 2 || ((v >> (3 - i)) & 1) === d));
        if (covered.length && covered.every(v => ones.includes(v)))
            all.push({digits, covered, literals: digits.filter(d => d !== 2).length});
    }
    const primes = all.filter(p => !all.some(q => q.covered.length > p.covered.length && p.covered.every(v => q.covered.includes(v))));
    const edges = ones.flatMap((a, i) => ones.slice(i + 1).filter(b => {
        const v = a ^ b;
        return v && (v & (v - 1)) === 0;
    }).map(b => [a, b]));
    const requirements = [...ones.map(v => [v]), ...(hazard ? edges : [])];
    let best;
    for (let mask = 1; mask < 2 ** primes.length; mask++) {
        const selected = primes.filter((_, i) => mask & (2 ** i)), terms = selected.length, literals = selected.reduce((s, p) => s + p.literals, 0);
        if (best && (terms > best.terms || terms === best.terms && literals >= best.literals))
            continue;
        if (requirements.every(r => selected.some(p => r.every(v => p.covered.includes(v)))))
            best = {terms, literals, selected};
    }
    const expression = best.selected.map(p => p.digits.map((d, i) => d === 2 ? '' : 'ABCD'[i] + (d === 0 ? '′' : '')).join('')).join(' + ');
    return {...best, expression, edges};
}
function hardBlock(title, subtitle) {
    const wrap = text => {
        const lines = [];
        let line = '';
        for (const word of text.split(' ')) {
            if ((line + ' ' + word).length > 65) {
                lines.push(line);
                line = word;
            } else
                line += (line ? ' ' : '') + word;
        }
        if (line)
            lines.push(line);
        return lines;
    };
    const lines = [...wrap(title), ...wrap(subtitle)];
    return drawing(`<rect x="35" y="40" width="650" height="180" rx="8"/>${lines.map((line, i) => dt(360, 90 + i * 32, line)).join('')}`, title + '; ' + subtitle);
}
function hardTimingDiagram(skew) {
    return drawing(`<path d="M170 145h75m230 0h75M105 205v45h510v-45M360 250v20"/><rect x="40" y="105" width="130" height="100" rx="4"/><rect x="245" y="105" width="230" height="100" rx="4"/><rect x="550" y="105" width="130" height="100" rx="4"/>${dt(105, 55, 'tCQ min / max')}${dt(105, 80, '0.20 / 0.90 ns')}${dt(360, 55, 'Logic min / max')}${dt(360, 80, '0.15 / 5.00 ns')}${dt(615, 55, 'Hold / setup')}${dt(615, 80, '0.60 / 0.70 ns')}${dt(105, 160, 'Launch FF')}${dt(360, 145, 'Logic + N buffers')}${dt(360, 180, 'Buffer: 0.25 / 0.40 ns')}${dt(615, 160, 'Capture FF')}${dt(360, 295, 'Capture clock is delayed by +' + skew + ' ns')}`, 'Register timing path with N inserted buffers; capture clock has positive skew', 320);
}
function hardFeedbackDiagram(controller, plant) {
    return drawing(`<path d="M35 105h55m40 0h30m225 0h35m260 0h35M690 105v110H110v-85"/><circle cx="110" cy="105" r="20"/><rect x="160" y="70" width="225" height="70" rx="4"/><rect x="420" y="70" width="260" height="70" rx="4"/>${dt(60, 88, 'r')}${dt(103, 110, '+')}${dt(130, 155, '−')}${dt(272, 111, controller)}${dt(550, 111, plant)}${dt(360, 247, 'Unity negative feedback')}`, 'Controller and plant in a negative unity-feedback loop');
}
function makeHardExercise(topic, date, level) {
    const meta = LEVELS.find(l => l.id === level);
    if (!TOPICS.some(t => t.id === topic) || !meta)
        throw Error('Unknown challenge selection');
    const d = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000), variant = ((d % 3) + 3) % 3, hard = level === 'challenge';
    const p = part, q = (title, text, givens, parts, hints, steps, idea, diagram, prerequisites, source) => ({
        id: `${topic}-${level}-0`, title, text, givens, parts, hints, steps, idea, diagram, prerequisites, source, level: meta.name, minutes: meta.time
    });
    if (topic === 'circuits' && !hard) {
        const r1 = 1000, r2 = 2200, alpha = [500, 1500, 2500][variant], io = [.004, .006, .008][variant], k = 1 + alpha / r1, rth = 1 / (1 / r2 + 1 / (r1 + alpha)), vth = io * k / (1 / r1 + k / r2), isc = vth / rth;
        return q('Thévenin with a dependent source', `Find the port equivalent of the circuit shown. The source polarity means Vright − Vleft = αi; i flows downward through R₁. Derive Vth and Rth without switching off the dependent source. Then find the short-circuit current (upper terminal to lower terminal), optimal positive resistive load, and maximum load power. Treat R₂ as part of the source network.`, [`I₀ = ${io * 1000} mA`, `R₁ = 1 kΩ`, `R₂ = 2.2 kΩ`, `α = ${alpha} Ω`], [p('Open-circuit voltage Vth', vth, 'V'), p('Port resistance Rth', rth, 'Ω'), p('Short-circuit current', isc * 1000, 'mA'), p('Load for maximum power', rth, 'Ω'), p('Maximum load power', vth * vth / (4 * rth) * 1000, 'mW')], ['Use a supernode: I₀ = VA/R₁ + VB/R₂ and VB = VA(1 + α/R₁).', 'Open only the independent current source. Inject a test current at the port; keep VB − VA = αVA/R₁.', 'The test sees R₂ in parallel with R₁ + α. Check your resistance using Vth/Isc.'], [`Supernode gives Vth = I₀(1+α/R₁)/(1/R₁+(1+α/R₁)/R₂) = ${fmt(vth)} V.`, `With the independent source open, Itest = Vtest/R₂ + Vtest/(R₁+α). Rth = ${fmt(rth)} Ω.`, `Isc = Vth/Rth = ${fmt(isc * 1000)} mA.`, `RL = Rth; Pmax = Vth²/(4Rth) = ${fmt(vth * vth / (4 * rth) * 1000)} mW.`], 'Dependent sources remain active when finding a port resistance. A test source exposes their contribution.', sourceFigure('mit-dependent-source.png', 'MIT problem 5.1: current source I0 and R1 from ground to left node; voltage source alpha times downward R1 current, minus on left and plus on right, connects to output and R2 to ground.'), 'Supernodes; dependent sources; test-source method; maximum power transfer.', OPEN_SOURCES.thevenin);
    }
    if (topic === 'circuits') {
        const i1 = cx([.8, 1.1, 1.4][variant]), i2 = cx(2.5), i3 = cp(2, [20, 35, -25][variant]), yab = cx(1 / 22), yag = cx(0, 1 / 20), ybc = cx(0, -1 / 15), ycg = cx(1 / 39);
        const [va, vb, vc] = complexSolve([[ca(yab, yag), cm(cx(-1), yab), cx(0)], [cm(cx(-1), yab), ca(yab, ybc), cm(cx(-1), ybc)], [cx(0), cm(cx(-1), ybc), ca(ybc, ycg)]], [cs(i1, i3), ca(i2, i3), cx(0)]), iab = cd(cs(va, vb), cx(22));
        return q('Three nodes in the complex plane', `Use RMS phasors and the e^(jωt) convention. I₁ and I₂ inject current upward from ground; I₃ flows from a to b. Write the full complex nodal system, solve a, b, and c, then find current through 22 Ω from a to b. Enter rectangular components; negative imaginary parts are valid. All unlabeled impedance values in the original figure are in ohms.`, [`I₁ = ${i1.re}∠0° A`, `I₂ = 2.5∠0° A`, `I₃ = 2∠${[20, 35, -25][variant]}° A`, `Zag = −j20 Ω`, `Zbc = j15 Ω`], [p('Real part of Va', va.re, 'V'), p('Imaginary part of Va', va.im, 'V'), p('Real part of Vb', vb.re, 'V'), p('Imaginary part of Vb', vb.im, 'V'), p('Real part of Iab', iab.re, 'A'), p('Imaginary part of Iab', iab.im, 'A')], ['At a, the injected current is I₁−I₃; at b it is I₂+I₃. Convert the source phasors to rectangular form.', 'KCL at c: (Vc−Vb)/(j15) + Vc/39 = 0. Do not combine current-source arrows as unsigned magnitudes.', 'After solving, check all three KCL residuals. Iab = (Va−Vb)/22.'], ['At a: (1/22+j/20)Va − Vb/22 = I₁−I₃.', 'At b: −Va/22 + (1/22−j/15)Vb + (j/15)Vc = I₂+I₃.', 'At c: (j/15)Vb + (1/39−j/15)Vc = 0.', `Va = ${cf(va)} V; Vb = ${cf(vb)} V; Vc = ${cf(vc)} V.`, `Iab = (Va−Vb)/22 = ${cf(iab)} A.`], 'Complex nodal analysis uses exactly the same conservation law as DC analysis; phasor signs and source directions still matter.', sourceFigure('fiore-nodal.png', 'Fiore figure 6: capacitor −j20 from a to ground, resistor 22 from a to b, inductor j15 from b to c, resistor 39 from c to ground, I1 up into a, I2 up into b, I3 from a to b.'), 'Complex arithmetic; admittance matrices; current-source orientation; RMS phasors.', OPEN_SOURCES.nodal);
    }
    if (topic === 'electronics' && !hard) {
        const idss = .012, vp = -2, rs = 330, rd = 2000, rl = [3300, 4700, 6800][variant], vdd = [15, 18, 20][variant];
        const a = idss * (rs / vp) ** 2, b = 2 * idss * rs / vp - 1, c = idss, id = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a), vgs = -id * rs, gm = 2 * idss / Math.abs(vp) * (1 - vgs / vp), vds = vdd - id * (rd + rs), av = -gm / (1 / rd + 1 / rl);
        return q('The physical root of a JFET bias equation', `For the pictured n-channel JFET, solve the self-bias operating point using Shockley’s model ID = IDSS(1−VGS/VP)². Reject any root outside VP ≤ VGS ≤ 0. In the midband, capacitors are AC shorts and DC opens; gate current is zero and ro is infinite. Find bias, transconductance, loaded gain, and the margin VDS−(VGS−VP) above the saturation boundary.`, [`IDSS = 12 mA`, `VP = −2 V`, `RS = 330 Ω`, `RD = 2 kΩ`, `RG = 220 kΩ`, `RL = ${rl / 1000} kΩ`, `VDD = ${vdd} V`], [p('Physical drain current ID', id * 1000, 'mA'), p('Gate–source voltage VGS', vgs, 'V'), p('Drain–source voltage VDS', vds, 'V'), p('Small-signal gm', gm * 1000, 'mS'), p('Loaded midband gain', av, 'V/V'), p('Saturation-region margin', vds - (vgs - vp), 'V')], ['DC gate voltage is zero, so VGS = −IDRS. Substitute it into Shockley’s equation before solving.', 'A squared model has an extraneous operating root outside its specified VGS interval. Check both roots against that interval.', 'CS bypasses RS for AC. Gain is −gm(RD ∥ RL); the load is isolated at DC by Cout.'], [`Solve ID = 0.012(1−165ID)² with ID in amperes. The physical root is ${fmt(id * 1000)} mA.`, `VGS = −IDRS = ${fmt(vgs)} V; VDS = VDD−ID(RD+RS) = ${fmt(vds)} V.`, `gm = (2IDSS/|VP|)(1−VGS/VP) = ${fmt(gm * 1000)} mS.`, `Av = −gm(RD∥RL) = ${fmt(av)}; Zin = RG = 220 kΩ.`, `VDS−(VGS−VP) = ${fmt(vds - (vgs - vp))} V > 0, consistent with the assumed saturation region.`], 'Solving a nonlinear equation is only half the job: the chosen root must satisfy the device model’s physical domain.', sourceFigure('fiore-jfet.png', 'Fiore common-source JFET amplifier: gate resistor RG to ground, source RS bypassed by CS, drain RD to VDD, coupling capacitors Cin and Cout, load RL.'), 'JFET Shockley model; quadratic roots; DC/AC equivalent circuits; small-signal gain.', OPEN_SOURCES.jfet);
    }
    if (topic === 'electronics') {
        const vs = 10, vt = 2, gain = [1.05, 1.1, 1.2][variant], low = vs - gain * (vs - vt), upper = vt + (vs - vt) / gain, fixed = (vs + gain * vt) / (1 + gain), target = 7, input = vt + (target - low) / (gain * gain);
        return q('A nonlinear cascade and its unstable fixed point', `Each amplifier A follows f(v) = VS for v ≤ VT, and f(v) = VS−RG(v−VT) for v > VT. Amplifier B cascades two identical stages. For 0 ≤ Vin ≤ VS, derive B’s complete piecewise transfer law and its two input breakpoints. Find its output when Vin ≤ VT, middle-region slope, and input for Vout = 7 V. Finally, reconnect B as the discrete iteration vn+1 = B(vn): find the middle fixed point and local multiplier. A multiplier magnitude above 1 means local instability.`, [`VS = 10 V`, `VT = 2 V`, `RG = ${gain}`, `Two identical stages`, `No additional clipping`], [p('Upper input breakpoint', upper, 'V'), p('Output for Vin ≤ VT', low, 'V'), p('Middle-region slope', gain * gain, 'V/V'), p('Input giving Vout = 7 V', input, 'V'), p('Middle fixed point', fixed, 'V'), p('Local iteration multiplier', gain * gain, '')], ['First-stage threshold Vin = VT is one breakpoint. The other occurs when the first-stage output crosses VT.', 'In the middle region substitute f(Vin) into f again; the two negative slopes multiply.', 'Solve B(v)=v in the middle region. Stability of the specified discrete iteration depends on |B′(v)|, not on the slope of one stage.'], [`Breakpoints: ${vt} V and VT+(VS−VT)/(RG) = ${fmt(upper)} V.`, `B(v) = ${fmt(low)} V for v≤2; B(v) = ${fmt(low)} + ${fmt(gain * gain)}(v−2) in the middle; B(v)=10 V above ${fmt(upper)} V.`, `B(v)=7 gives v = ${fmt(input)} V.`, `The middle fixed point is (VS+RG·VT)/(1+RG) = ${fmt(fixed)} V.`, `Local multiplier = (RG)² = ${fmt(gain * gain)} > 1: the middle fixed point is unstable for this discrete iteration.`], 'Composition changes both thresholds and stability. Derive the operating region before applying a linear gain.', sourceFigure('mit-nonlinear-amplifier.png', 'MIT problem 5.2: amplifier A with pull-up R to VS and threshold-controlled current source, and amplifier B made of two cascaded A blocks.'), 'Piecewise functions; nested thresholds; fixed points; local stability of discrete iterations.', OPEN_SOURCES.nonlinear);
    }
    if (topic === 'signals' && !hard) {
        const a = .5, b = [1 / 3, .25, .2][variant], A = a * (a - 2 * b) / (a - b) ** 2, B = a / (a - b), C = b * b / (a - b) ** 2, n = 8, y = (A + B * (n - 2)) * a ** (n - 2) + C * b ** (n - 2), sum = 1 / ((1 - a) ** 2 * (1 - b));
        return q('Convolution with a repeated pole and a delay', `Let x[n] = a^(n−2)u[n−2], h₁[n] = a^n u[n], and h₂[n] = b^n u[n], where u[0]=1. Derive y = x ∗ h₁ ∗ h₂ without leaving an unevaluated sum. For n ≥ 2, express y[n] as (A+B(n−2))a^(n−2)+Cb^(n−2), and use y[n]=0 for n<2. Find A, B, C, y[8], and the infinite sum of y[n].`, [`a = 1/2`, `b = ${fmt(b)}`, `Exact b = 1/${[3, 4, 5][variant]}`, `Zero initial conditions`], [p('Coefficient A', A, ''), p('Coefficient B', B, ''), p('Coefficient C', C, ''), p('Output y[8]', y, ''), p('Sum of all output samples', sum, '')], ['Account for the two-sample delay after finding the convolution of the three unshifted causal sequences.', 'The transform has a repeated factor: 1/[(1−az⁻¹)²(1−bz⁻¹)]. Its inverse includes (n+1)a^n.', 'For an independent sum check, multiply the sums of the three input sequences.'], [`Partial fractions give A = a(a−2b)/(a−b)² = ${fmt(A)}, B = a/(a−b) = ${fmt(B)}, C = b²/(a−b)² = ${fmt(C)}.`, `For n≥2: y[n]=(A+B(n−2))a^(n−2)+Cb^(n−2); it is zero before sample 2.`, `y[8] = ${fmt(y)}.`, `Σy[n] = 1/[(1−a)²(1−b)] = ${fmt(sum)}. Check y[2]=A+C=1.`], 'Repeated poles produce polynomial factors multiplying exponentials; time shifts move the support as well as the formula.', hardBlock('x[n] → h₁[n] → h₂[n]', 'Causal cascade · two-sample input delay'), 'Discrete convolution; geometric series or Z transforms; repeated poles; causal support.', OPEN_SOURCES.convolution);
    }
    if (topic === 'signals') {
        const l1 = 760e-6, l2 = 250e-6, c = 10.6e-6, r = 8, f = [2500, 3500, 5000][variant], a1 = (l1 + l2) / r, a2 = l1 * c, a3 = l1 * l2 * c / r;
        const response = f => {
            const w = 2 * Math.PI * f;
            return cd(cx(1), cx(1 - a2 * w * w, a1 * w - a3 * w * w * w));
        };
        let lo = 0, hi = 100000;
        for (let i = 0; i < 80; i++) {
            const mid = (lo + hi) / 2;
            if (cabs(response(mid)) > Math.SQRT1_2)
                lo = mid;
            else
                hi = mid;
        }
        const cutoff = (lo + hi) / 2, h = response(f);
        return q('Derive a third-order loudspeaker crossover', `Use the original woofer network shown, driven by an ideal voltage source; model the loudspeaker as a pure 8 Ω resistor. Derive H(s)=Vb/E in the form 1/(1+a₁s+a₂s²+a₃s³). The stages are not buffered. Find all coefficients, the first positive frequency where |H|=1/√2, and the gain and principal phase at ${f} Hz. Use the exact half-power threshold rather than rounding it to −3.00 dB.`, [`L₁ = 760 µH`, `L₂ = 250 µH`, `C = 10.6 µF`, `Load = 8 Ω`, `Test f = ${f} Hz`], [p('Coefficient a₁', a1, 's'), p('Coefficient a₂', a2, 's²'), p('Coefficient a₃', a3, 's³'), p('Half-power cutoff', cutoff, 'Hz'), p('Voltage gain at test frequency', 20 * Math.log10(cabs(h)), 'dB'), p('Principal output phase (−180° to 180°)', cphase(h), '°')], ['At b, (Va−Vb)/(sL₂)=Vb/R. At a, (E−Va)/(sL₁)=sCVa+Vb/R.', 'Eliminate Va. Loading creates the cubic term; multiplying isolated first-order responses is invalid.', 'Evaluate the complex polynomial at s=j2πf. Find its half-power root numerically and use atan2 for phase.'], [`H(s)=1/[1+s(L₁+L₂)/R+s²L₁C+s³L₁L₂C/R].`, `a₁=${fmt(a1)} s; a₂=${fmt(a2)} s²; a₃=${fmt(a3)} s³.`, `The half-power crossing is ${fmt(cutoff)} Hz.`, `At ${f} Hz, H=${cf(h)}; gain=${fmt(20 * Math.log10(cabs(h)))} dB; principal phase=${fmt(cphase(h))}°.`], 'An unbuffered passive network must be solved as a whole; its component interactions determine the actual filter.', sourceFigure('fiore-woofer.png', 'Fiore figure 25: ideal source E, series inductor L1 to a, shunt capacitor C to ground, series L2 to b, loudspeaker from b to ground.'), 'Laplace impedances; two-node analysis; transfer functions; complex frequency response; numerical roots.', OPEN_SOURCES.crossover);
    }
    if (topic === 'control' && !hard) {
        const w = [3, 4, 5][variant], pm = 55, phi = pm - (90 - Math.atan(w / 2) * 180 / Math.PI), alpha = (1 - Math.sin(phi * Math.PI / 180)) / (1 + Math.sin(phi * Math.PI / 180)), tau = 1 / (w * Math.sqrt(alpha)), mag = 10 / (w * Math.hypot(w, 2)), k = Math.sqrt(alpha) / mag;
        return q('Place a lead compensator at crossover', `A unity negative-feedback loop has plant G(s)=10/[s(s+2)]. Design C(s)=K(1+Ts)/(1+αTs), with 0<α<1 and K>0. Require crossover ωc=${w} rad/s and phase margin 55°. Place the compensator’s maximum phase lead exactly at ωc. Derive α, T, K, and the zero and pole break frequencies; then verify both loop conditions at ωc.`, [`ωc = ${w} rad/s`, `Target PM = 55°`, `G(s) = 10/[s(s+2)]`], [p('Required peak phase lead', phi, '°'), p('Parameter α', alpha, ''), p('Time constant T', tau, 's'), p('Controller gain K', k, ''), p('Zero break frequency', 1 / tau, 'rad/s'), p('Pole break frequency', 1 / (alpha * tau), 'rad/s')], ['Find the uncompensated loop phase at the requested crossover, not at its existing gain crossover.', 'For a lead network, sin φmax=(1−α)/(1+α) and ωmax=1/(T√α).', 'Its magnitude at maximum phase is 1/√α before multiplying by K. Use |CG|=1.'], [`Plant phase is −90°−atan(ωc/2); required lead=${fmt(phi)}°.`, `α=(1−sinφ)/(1+sinφ)=${fmt(alpha)}; T=1/(ωc√α)=${fmt(tau)} s.`, `K=√α/|G(jωc)|=${fmt(k)}.`, `ωzero=${fmt(1 / tau)} rad/s; ωpole=${fmt(1 / (alpha * tau))} rad/s.`, `At ωc, |CG|=1 and angle(CG)=−125°, giving PM=55°.`], 'A phase-margin target and a crossover target impose two conditions. A gain change alone cannot generally satisfy both.', hardFeedbackDiagram('K(1+Ts)/(1+αTs)', '10/[s(s+2)]'), 'Bode plots; phase margin; lead compensation; complex loop gain.');
    }
    if (topic === 'control') {
        const z = [3, 4, 5][variant], b = 36 * z - 54, limit = (-b + Math.sqrt(b * b + 1440)) / 2, kmin = 12 / z, omega = Math.sqrt(z * limit / (10 - limit / 6));
        return q('A stability boundary is not a design margin', `The unity negative-feedback open loop is L(s)=K(s+${z})/[s(s+1)(s+2)(s+3)], K>0. Derive the fourth-order characteristic polynomial and use a Routh table to find the exact strict-stability interval. A unit ramp must also have steady-state error ≤0.5. Find the minimum gain meeting this error target, the upper stability boundary, the oscillation frequency at that boundary, and the width of the feasible gain interval. The upper endpoint is excluded.`, [`Zero at s = −${z}`, `Unit-ramp error ≤ 0.5`, `Strict asymptotic stability`], [p('Minimum gain meeting the ramp target', kmin, ''), p('Upper gain boundary (excluded)', limit, ''), p('Marginal oscillation frequency', omega, 'rad/s'), p('Width of the feasible gain interval', limit - kmin, '')], ['The characteristic equation is s⁴+6s³+11s²+(6+K)s+zK=0, with z the stated positive zero magnitude.', 'The s² row begins 10−K/6. The s¹ condition reduces to K²+(36z−54)K−360<0.', 'Kv=lim(sL)=zK/6. At the boundary use the s² auxiliary polynomial to find the imaginary roots.'], [`Routh first column: 1, 6, 10−K/6, [(10−K/6)(6+K)−6zK]/(10−K/6), zK.`, `For positive K, strict stability requires 0<K<${fmt(limit)}.`, `Ramp error=1/Kv=6/(zK), so K≥${fmt(kmin)}.`, `At the upper boundary, (10−K/6)s²+zK=0: ω=${fmt(omega)} rad/s.`, `Feasible interval: [${fmt(kmin)}, ${fmt(limit)}), width ${fmt(limit - kmin)}. Operation near the upper endpoint has very little stability margin.`], 'A mathematically stable gain can still be a poor design choice. Error constraints and stability boundaries must be considered together.', hardFeedbackDiagram(`K(s+${z})`, '1/[s(s+1)(s+2)(s+3)]'), 'Routh–Hurwitz criterion; system type; ramp error; auxiliary polynomials.');
    }
    if (topic === 'digital' && !hard) {
        const skew = [.7, .8, .9][variant], cqmin = .2, cqmax = .9, cdelay = .15, pdelay = 5, hold = .6, setup = .7, unc = .1, setupunc = .2, bufmin = .25, bufmax = .4, n = Math.ceil((skew + hold + unc - cqmin - cdelay - 1e-10) / bufmin), tmin = cqmax + pdelay + n * bufmax + setup + setupunc - skew, minskew = cqmax + pdelay + n * bufmax + setup + setupunc - 10, maxskew = cqmin + cdelay + n * bufmin - hold - unc;
        return q('Repair hold timing without breaking setup', `The capture clock arrives ${skew} ns after the launch clock (positive skew). A single data path has clock-to-Q min/max 0.20/0.90 ns and logic min/max 0.15/5.00 ns. Capture hold/setup times are 0.60/0.70 ns. Add 0.10 ns adverse hold uncertainty and 0.20 ns adverse setup uncertainty. Identical inserted buffers add min/max 0.25/0.40 ns each. Find the fewest buffers that fix hold, the resulting maximum clock frequency, and the permitted nominal skew interval at a 10 ns period. Include uncertainties at both endpoints.`, [`Positive skew helps setup, hurts hold`, `Buffer = 0.25 / 0.40 ns`, `Target period = 10 ns`], [p('Minimum number of buffers', n, 'buffers', 0), p('Repaired maximum clock frequency', 1000 / tmin, 'MHz'), p('Setup slack at 10 ns', 10 - tmin, 'ns'), p('Minimum permitted skew at 10 ns', minskew, 'ns'), p('Maximum permitted skew at 10 ns', maxskew, 'ns')], ['Hold: tCQ,min+tlogic,min+N·tbuf,min ≥ skew+thold+uhold. Round the required count upward.', 'Setup: T+skew ≥ tCQ,max+tlogic,max+N·tbuf,max+tsetup+usetup.', 'With N fixed, solve setup for a lower bound on skew and hold for an upper bound.'], [`Hold requires 0.20+0.15+0.25N≥${fmt(skew + .6 + .1)}: minimum N=${n}.`, `Tmin=0.90+5.00+0.40N+0.70+0.20−skew=${fmt(tmin)} ns; fmax=${fmt(1000 / tmin)} MHz.`, `Setup slack at 10 ns=${fmt(10 - tmin)} ns.`, `Allowed skew: ${fmt(minskew)} ≤ skew ≤ ${fmt(maxskew)} ns.`], 'Delay added to fix hold also consumes setup margin. The best repair satisfies both worst-case inequalities.', hardTimingDiagram(skew), 'Minimum and maximum timing paths; setup/hold constraints; clock skew; integer design decisions.');
    }
    if (topic === 'digital') {
        const ones = [[0, 2, 3, 4, 5, 7, 8, 10, 11, 13, 15], [1, 3, 4, 5, 6, 7, 9, 11, 12, 14], [0, 1, 2, 5, 6, 7, 8, 9, 10, 13, 14]][variant], minimal = logicCover(ones), safe = logicCover(ones, true);
        return q('Minimise logic, then remove its hazards', `Implement F(A,B,C,D)=Σm(${ones.join(',')}) as a two-level sum of products. A is the most significant bit; all other minterms are 0 and there are no don’t-cares. First minimise product count, breaking ties by literal count. Then minimise a static-1-hazard-free implementation for arbitrary gate delays and single-input transitions. Derive both expressions on paper and enter their counts below. For hazard freedom, every adjacent pair of 1-minterms must share a product term. Inverters are not counted as product terms.`, [`Variable order ABCD`, `Two-level AND–OR`, `Single-input changes only`], [p('Minimum ordinary SOP product count', minimal.terms, 'terms', 0), p('Minimum literals at that product count', minimal.literals, 'literals', 0), p('Minimum hazard-free product count', safe.terms, 'terms', 0), p('Minimum literals at that hazard-free count', safe.literals, 'literals', 0), p('Adjacent 1-minterm pairs that require coverage', safe.edges.length, 'pairs', 0)], ['Find all prime implicants, including groups wrapping around Karnaugh-map edges. Cover every 1 with as few terms as possible.', 'Truth-table equivalence alone is insufficient for hazard freedom: two terms can briefly both be off during a transition.', 'Treat adjacent 1-pairs as extra coverage constraints. Add consensus coverage, then minimise again.'], [`One optimal ordinary SOP: F=${minimal.expression}. It has ${minimal.terms} terms and ${minimal.literals} literals.`, `There are ${safe.edges.length} adjacent 1-pairs. Every pair must be jointly covered by at least one product.`, `One optimal hazard-free SOP: F=${safe.expression}. It has ${safe.terms} terms and ${safe.literals} literals.`, `These minima come from exhaustive prime-implicant covers with product count first and literal count second. The numeric checks validate counts; compare your actual expressions with the truth table as well.`], 'Boolean equivalence describes steady outputs. Hazard freedom adds requirements on transitions through the implementation.', kMapDiagram(ones), 'Four-variable Karnaugh maps; prime implicants; consensus terms; static hazards; minimum covers.');
    }
    if (topic === 'fields' && !hard) {
        const mu = 4 * Math.PI * 1e-7, eps = 8.8541878128e-12, er = 2.25, a = .0005, b = .002, len = [.6, .8, 1][variant], f = 50e6, lp = mu / (2 * Math.PI) * Math.log(b / a), cpv = 2 * Math.PI * eps * er / Math.log(b / a), z0 = Math.sqrt(lp / cpv), v = 1 / Math.sqrt(lp * cpv), beta = 2 * Math.PI * f / v, zl = cx(75, 25), t = Math.tan(beta * len), zin = cm(cx(z0), cd(ca(zl, cx(0, z0 * t)), ca(cx(z0), cm(cx(0, t), zl)))), gamma = cd(cs(zl, cx(z0)), ca(zl, cx(z0))), swr = (1 + cabs(gamma)) / (1 - cabs(gamma));
        return q('From coax geometry to input impedance', `A lossless coax has inner-conductor radius a=0.5 mm, inner radius of outer conductor b=2.0 mm, homogeneous dielectric εr=2.25, and μr=1. At 50 MHz it terminates in ZL=75+j25 Ω. Derive L′ and C′ from geometry, obtain Z₀ and phase velocity, then calculate the input impedance of a ${len} m line and its standing-wave ratio. Use the e^(jωt) convention.`, [`μ₀ = 4π×10⁻⁷ H/m`, `ε₀ = 8.8541878128×10⁻¹² F/m`, `Length = ${len} m`, `R′ = G′ = 0`], [p('Inductance per metre', lp * 1e9, 'nH/m'), p('Capacitance per metre', cpv * 1e12, 'pF/m'), p('Characteristic impedance', z0, 'Ω'), p('Real part of Zin', zin.re, 'Ω'), p('Imaginary part of Zin', zin.im, 'Ω'), p('Standing-wave ratio', swr, '')], ['L′=μ ln(b/a)/(2π), C′=2πε/ln(b/a). Their product determines propagation speed.', 'Use Zin=Z₀(ZL+jZ₀tanβl)/(Z₀+jZLtanβl), with β=ω√(L′C′).', 'ΓL=(ZL−Z₀)/(ZL+Z₀) and SWR=(1+|ΓL|)/(1−|ΓL|).'], [`L′=${fmt(lp * 1e9)} nH/m; C′=${fmt(cpv * 1e12)} pF/m.`, `Z₀=√(L′/C′)=${fmt(z0)} Ω; v=${fmt(v)} m/s.`, `βl=${fmt(beta * len)} rad; Zin=${cf(zin)} Ω.`, `|ΓL|=${fmt(cabs(gamma))}; SWR=${fmt(swr)}.`], 'A physically short cable can be electrically long. Geometry sets propagation, while length transforms the load seen at the input.', hardBlock(`Lossless coax · l = ${len} m`, 'Input port → distributed line → ZL = 75 + j25 Ω'), 'Coaxial field relations; distributed parameters; transmission-line impedance; reflection coefficients.');
    }
    if (topic === 'fields') {
        const r = 4, l = 250e-9, g = .0002, c = 100e-12, f = 20e6, len = [6, 8, 10][variant], w = 2 * Math.PI * f, z = cx(r, w * l), y = cx(g, w * c), gamma = croot(cm(z, y)), z0 = croot(cd(z, y)), zl = cx(75, -25), t = ctanh(cm(gamma, cx(len))), zin = cm(z0, cd(ca(zl, cm(z0, t)), ca(z0, cm(zl, t)))), atten = 20 * Math.log10(Math.E) * gamma.re * len;
        return q('A lossy line cannot use the lossless shortcut', `A uniform line has per-metre parameters R′=4 Ω/m, L′=250 nH/m, G′=0.20 mS/m, C′=100 pF/m. At 20 MHz its ${len} m length is loaded by 75−j25 Ω. Derive γ and Z₀ using the physical square-root branches with positive real parts, then calculate Zin using the full lossy-line equation. Finally find the forward-wave amplitude loss along the line in dB, excluding reflection loss.`, [`Length = ${len} m`, `Frequency = 20 MHz`, `e^(jωt) convention`, `ZL = 75−j25 Ω`], [p('Attenuation constant α', gamma.re, 'Np/m'), p('Phase constant β', gamma.im, 'rad/m'), p('Real part of Z₀', z0.re, 'Ω'), p('Imaginary part of Z₀', z0.im, 'Ω'), p('Real part of Zin', zin.re, 'Ω'), p('Imaginary part of Zin', zin.im, 'Ω'), p('Positive forward-wave loss', atten, 'dB')], ['γ=√[(R′+jωL′)(G′+jωC′)] and Z₀=√[(R′+jωL′)/(G′+jωC′)].', 'Use Zin=Z₀[ZL+Z₀tanh(γl)]/[Z₀+ZL tanh(γl)]. Complex Z₀ and γ must both be retained.', 'Forward amplitude is multiplied by exp(−αl), so its positive loss is 20log₁₀(e)αl.'], [`γ=${cf(gamma)} m⁻¹; Z₀=${cf(z0)} Ω.`, `tanh(γl)=${cf(t)}.`, `Zin=${cf(zin)} Ω.`, `Forward-wave amplitude loss=${fmt(atten)} dB. This is not the total insertion loss of a mismatched source/load system.`], 'Loss affects characteristic impedance as well as amplitude; replacing only the propagation factor in a lossless model is incomplete.', hardBlock(`Distributed RLGC line · ${len} m`, 'Input → lossy propagation → ZL = 75 − j25 Ω'), 'Telegrapher equations; complex square roots; complex hyperbolic functions; propagation loss.');
    }
    if (topic === 'power' && !hard) {
        const vll = 400, zf = cx(.6, .8), zl = cx([12, 15, 18][variant], 9), vs = cx(vll / Math.sqrt(3)), i = cd(vs, ca(zf, zl)), vl = cm(i, zl), pload = 3 * cabs(i) ** 2 * zl.re, ql = 3 * cabs(i) ** 2 * zl.im, loss = 3 * cabs(i) ** 2 * zf.re, pf = (pload + loss) / (Math.sqrt(3) * vll * cabs(i));
        return q('Three-phase power through a nonideal feeder', `A balanced positive-sequence 400 V RMS line-to-line source feeds a balanced star-connected load through identical feeder impedances 0.6+j0.8 Ω per phase. Each load phase is ${zl.re}+j9 Ω. Take source phase VAN as 0°. Find the line-current phasor, receiving-end line-to-line voltage magnitude, total real load power, total feeder copper loss, and sending-end power factor. Ignore neutral current and shunt admittance.`, [`Source VLL = 400 V RMS`, `Zfeeder = 0.6+j0.8 Ω/phase`, `Zload = ${zl.re}+j9 Ω/phase`], [p('Real part of line current IA', i.re, 'A'), p('Imaginary part of line current IA', i.im, 'A'), p('Receiving line-to-line voltage magnitude', Math.sqrt(3) * cabs(vl), 'V'), p('Total real load power', pload, 'W'), p('Total feeder copper loss', loss, 'W'), p('Sending-end power factor (lagging)', pf, '')], ['Reduce the balanced system to one phase. Source phase voltage is 400/√3, not 400 V.', 'Use the total complex series impedance for current; then obtain the receiving phase voltage from I·Zload.', 'Compute three-phase complex power. The feeder consumes real and reactive power, so source and load power factors differ.'], [`IA=(400/√3)/(Zfeeder+Zload)=${cf(i)} A.`, `Receiving |VLL|=√3|IA Zload|=${fmt(Math.sqrt(3) * cabs(vl))} V.`, `Pload=3|I|²Rload=${fmt(pload)} W; Qload=${fmt(ql)} var.`, `Pfeeder=3|I|²Rfeeder=${fmt(loss)} W.`, `Sending PF=(Pload+Pfeeder)/(√3·400·|I|)=${fmt(pf)}, lagging.`], 'Voltage drop is a phasor effect. Feeder losses and reactive demand must be included when evaluating the supply.', hardBlock('Balanced system · one-phase equivalent', 'Vs = 400/√3 ∠0° → Zfeeder → Zload → neutral'), 'Balanced three-phase systems; RMS phasors; complex power; feeder voltage drop.');
    }
    if (topic === 'power') {
        const vs = 24, rs = .8, po = [90, 100, 110][variant], eta = .9, pin = po / eta, disc = Math.sqrt(vs * vs - 4 * rs * pin), high = (vs + disc) / 2, low = (vs - disc) / 2, il = pin / high, vo = 48, duty = 1 - high / vo, f = 50000, ripple = .3 * il, lmin = high * duty / (f * ripple), cmin = (po / vo) * duty / (f * .5), pmax = eta * vs * vs / (4 * rs);
        return q('Constant-power loading and voltage collapse', `A 24 V ideal source with 0.8 Ω series resistance supplies a regulated boost converter delivering ${po} W at 48 V. Use constant efficiency η=90% only for input power and source loading. For ripple sizing use the ideal CCM conversion and triangular-ripple model; ignore ESR. Derive both input-voltage equilibria and select the high-voltage branch. A small input capacitor obeys C·dVin/dt=(Vs−Vin)/Rs−Pin/Vin; determine which branch is locally stable. At 50 kHz, size L for ≤30% peak-to-peak input-current ripple and output C for ≤0.5 V peak-to-peak ripple. Also find the maximum deliverable output power before the equilibria merge.`, [`Vs = 24 V`, `Rs = 0.8 Ω`, `Pout = ${po} W`, `η = 0.90`, `Vout = 48 V`, `fs = 50 kHz`], [p('High-voltage equilibrium', high, 'V'), p('Low-voltage equilibrium', low, 'V'), p('Duty cycle on high-voltage branch', duty * 100, '%'), p('Minimum inductance', lmin * 1e6, 'µH'), p('Minimum output capacitance', cmin * 1e6, 'µF'), p('Maximum output power before collapse', pmax, 'W')], ['Input power is constant: Vin(Vs−Vin)/Rs=Pout/η. This is a quadratic, not a fixed-resistance load.', 'Linearise the stated capacitor equation. Its derivative is −1/Rs+Pin/Vin²; stability requires it to be negative.', 'Use D=1−Vin/Vout, ΔIL=VinD/(Lfs), and ΔVo≈IoutD/(Cfs). The quadratic discriminant sets maximum power.'], [`Pin=${fmt(pin)} W. Vin²−24Vin+0.8Pin=0 gives ${fmt(high)} V and ${fmt(low)} V.`, `The high-voltage branch has Vin>Vs/2 and negative small-signal derivative; it is locally stable in the specified capacitor model. The low branch is unstable.`, `At the high branch: Iin=${fmt(il)} A and D=${fmt(duty * 100)}%.`, `Lmin=VinD/(fs·0.30Iin)=${fmt(lmin * 1e6)} µH. The minimum inductor current remains positive.`, `Cmin=IoutD/(fs·0.5)=${fmt(cmin * 1e6)} µF.`, `Pout,max=ηVs²/(4Rs)=${fmt(pmax)} W; at this fold Vin=Vs/2.`], 'A regulated constant-power load draws more current as its input voltage falls. Source impedance can therefore create a voltage-collapse limit.', hardBlock('24 V source → 0.8 Ω → Vin → boost', 'Input capacitor at Vin · regulated output 48 V'), 'Nonlinear operating points; local stability; constant-power loads; boost CCM ripple design.');
    }
    if (topic === 'measurement' && !hard) {
        const vs = [1.2, 1.8, 2.4][variant], offset = .01, gain = 20, r = .05, i = (vs - offset) / (gain * r), uv = .002, uo = .001, ug = .005 * gain, ur = .01 * r, contrib = [uv / (gain * r), uo / (gain * r), i * ug / gain, i * ur / r], uc = Math.hypot(...contrib), worst = contrib.reduce((s, x) => s + x, 0), quant = 3.3 / 4096 / Math.sqrt(12) / (gain * r), total = Math.hypot(uc, quant);
        return q('Build an uncertainty budget for a current sensor', `A sensor follows Vout=GIR+Voff. Measured Vout=${vs} V, nominal G=20, shunt R=0.050 Ω, and Voff=0.010 V. Independent standard uncertainties are u(Vout)=2 mV, u(Voff)=1 mV, u(G)=0.5% of G, and u(R)=1% of R. Use first-order propagation. Then add independent uniform quantisation from a 12-bit, 3.3 V ADC, with LSB=3.3/4096 V. The 2 mV measurement uncertainty excludes quantisation. Find I, combined standard uncertainty before/after quantisation, and k=2 expanded uncertainty. Also report the sum of absolute one-standard-deviation contributions; this sum is not a guaranteed error bound.`, [`Independent uncertainties`, `G = 20`, `R = 0.050 Ω`, `Voff = 0.010 V`, `ADC = 12 bit / 3.3 V`], [p('Estimated current', i, 'A'), p('Combined standard uncertainty before quantisation', uc * 1000, 'mA'), p('Absolute sum of standard contributions', worst * 1000, 'mA'), p('Combined standard uncertainty including quantisation', total * 1000, 'mA'), p('Expanded uncertainty U, k=2', 2 * total * 1000, 'mA')], ['Use I=(V−Voff)/(GR). Compute partial derivatives with respect to all four measured/calibrated quantities.', 'Independent standard uncertainties combine by root sum of squares of sensitivity times uncertainty. Relative gain and resistance terms scale with I.', 'Uniform quantisation has standard deviation LSB/√12. Convert it to current and add it in quadrature.'], [`I=${fmt(i)} A. Absolute standard contributions from V, offset, gain, and R are ${contrib.map(v => fmt(v * 1000)).join(', ')} mA.`, `RSS gives uc=${fmt(uc * 1000)} mA; the absolute sum is ${fmt(worst * 1000)} mA.`, `Quantisation contribution=${fmt(quant * 1000)} mA. Combined uc=${fmt(total * 1000)} mA.`, `Expanded uncertainty U=2uc=${fmt(2 * total * 1000)} mA. A k=2 factor is specified here; exact coverage depends on the distributions and degrees of freedom.`], 'Uncertainty contributions need sensitivity coefficients and a probability model. Adding percentages without those assumptions can give a misleading result.', hardBlock('Shunt: R = 0.050 Ω · amplifier: G = 20', 'Vout = G I R + Voff; Voff = 0.010 V'), 'Partial derivatives; independent uncertainty propagation; standard versus expanded uncertainty; quantisation.');
    }
    if (topic === 'measurement') {
        const x = [0, 2, 5, 8], y = [.12, .93, 2.08, 3.34], sigma = [.02, .04, .03, .06], w = sigma.map(s => 1 / (s * s)), S = w.reduce((s, v) => s + v, 0), Sx = w.reduce((s, v, i) => s + v * x[i], 0), Sy = w.reduce((s, v, i) => s + v * y[i], 0), Sxx = w.reduce((s, v, i) => s + v * x[i] * x[i], 0), Sxy = w.reduce((s, v, i) => s + v * x[i] * y[i], 0), det = S * Sxx - Sx * Sx, a = (Sxx * Sy - Sx * Sxy) / det, b = (S * Sxy - Sx * Sy) / det, va = Sxx / det, vb = S / det, cov = -Sx / det, ym = [1.5, 2.5, 3][variant], um = .025, estimate = (ym - a) / b, ux = Math.sqrt((um * um + va + estimate * estimate * vb + 2 * estimate * cov) / (b * b)), chi = y.reduce((s, v, i) => s + ((v - a - b * x[i]) / sigma[i]) ** 2, 0);
        return q('Weighted calibration with correlated coefficients', `Calibrate y=a+bx from exact reference currents x and independent voltage measurements y. The table lists known Gaussian standard deviations, so use weights 1/σ² and do not rescale coefficient covariance by the residual variance. Derive the weighted normal equations and covariance matrix. An independent new reading is y*=${ym} V with standard uncertainty 0.025 V. Infer x* and its first-order standard uncertainty, including intercept–slope covariance. Also compute the weighted residual χ² (2 degrees of freedom).`, [`x (A): 0, 2, 5, 8`, `y (V): 0.12, 0.93, 2.08, 3.34`, `σy (V): 0.02, 0.04, 0.03, 0.06`, `New y* = ${ym} V`], [p('Fitted intercept a', a, 'V'), p('Fitted slope b', b, 'V/A'), p('Intercept–slope covariance', cov, 'V²/A'), p('Inferred current x*', estimate, 'A'), p('Standard uncertainty of inferred current', ux, 'A'), p('Weighted residual χ²', chi, '')], ['Form X with rows [1,x]. The estimate is (XᵀWX)⁻¹XᵀWy and its covariance is (XᵀWX)⁻¹.', 'For x*=(y*−a)/b, sensitivities to y*, a, b are 1/b, −1/b, and −x*/b.', 'Because a and b are correlated, Var(x*)=[u(y*)²+Var(a)+x*²Var(b)+2x*Cov(a,b)]/b².'], [`Weighted fit gives a=${fmt(a)} V and b=${fmt(b)} V/A.`, `Var(a)=${fmt(va)} V²; Var(b)=${fmt(vb)} (V/A)²; Cov(a,b)=${fmt(cov)} V²/A.`, `x*=(${ym}−a)/b=${fmt(estimate)} A.`, `Including the covariance term gives u(x*)=${fmt(ux)} A.`, `χ²=Σ[(yi−a−bxi)/σi]²=${fmt(chi)} with 4−2=2 degrees of freedom.`], 'Calibration coefficients are correlated. Their covariance can materially change the uncertainty of an inverse prediction.', drawing(`${dt(360, 35, 'Calibration measurements · independent voltage uncertainties')}${dt(170, 80, 'Current / A')}${dt(360, 80, 'Voltage / V')}${dt(550, 80, 'Standard σ / V')}${x.map((v, i) => `${dt(170, 120 + i * 32, String(v))}${dt(360, 120 + i * 32, String(y[i]))}${dt(550, 120 + i * 32, String(sigma[i]))}`).join('')}`, 'Calibration table with currents 0, 2, 5, 8 A; voltages 0.12, 0.93, 2.08, 3.34 V; standard uncertainties 0.02, 0.04, 0.03, 0.06 V.'), 'Weighted least squares; matrix inversion; covariance; first-order propagation; chi-square residuals.');
    }
    throw Error('Unknown challenge selection');
}
