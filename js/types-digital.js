/* Digital logic: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (brute force, BigInt, simulation). */
const DIGITAL_READING = {title: 'Computation Structures (MIT OpenCourseWare 6.004)', url: 'https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/'};
addTypes('digital', 'university', digitalFixedPoint, digitalSequenceDetector, digitalCMOSPower);
addTypes('digital', 'challenge', digitalPipeline, digitalCarrySelect, digitalFIRWords);
addTypes('digital', 'expert', digitalFIFO);
addTypes('digital', 'mastery', digitalBerlekampMassey);

const roundAway = x => Math.sign(x) * Math.round(Math.abs(x)); // round to nearest, ties away from zero
const lcgBits = (seed, n) => { let s = (seed * 2654435761 + 12345) >>> 0; return Array.from({length: n}, () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s >>> 31; }); };
const blockDiagram = (labels, caption, label) => {
    const w = 640 / labels.length;
    return drawing(labels.map((t, i) => wire(`M${45 + i * w + 8} 95h${w - 16}v70h${-(w - 16)}z`) + dt(45 + i * w + w / 2, 136, t) + (i ? arrow(45 + i * w - 8, 130, 45 + i * w + 8, 130) : '')).join('') + dt(365, 220, caption), label, 240);
};

/* Level 2: two's-complement fixed-point (Q format) quantisation, multiplication, rounding and saturation. */
function digitalFixedPoint(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'fixed-point', date, DIGITAL_READING), p = part;
    const [[W, I, af, bf]] = grid(product([8, 12, 16], [1, 2, 3], steps(-.95, .95, .05).filter(v => Math.abs(v) > .04), steps(-.9, .9, .15).filter(v => Math.abs(v) > .1)));
    const F = W - 1 - I, scale = 2 ** F, lo = -(2 ** (W - 1)), hi = 2 ** (W - 1) - 1, clamp = c => Math.min(hi, Math.max(lo, c));
    const a = +(af * 2 ** I).toFixed(4), b = +(bf * 2 ** I).toFixed(4), ca_ = clamp(roundAway(a * scale)), cb = clamp(roundAway(b * scale)), errL = ca_ - a * scale;
    const prod = ca_ * cb, back = clamp(roundAway(prod / scale)), sat = back !== roundAway(prod / scale), result = back / scale, maxv = hi / scale;
    const diagram = blockDiagram([`a → Q${I}.${F}`, `b → Q${I}.${F}`, `a·b in Q${2 * I + 1}.${2 * F}`, 'round + saturate'], `${W}-bit words: 1 sign bit, ${I} integer bits, ${F} fractional bits`, 'Quantise a and b to the fixed-point format, multiply exactly into a double-width word, then round and saturate back');
    return q({
        title: 'Fixed-point multiplication in Q format',
        text: T`A DSP stores signed numbers as $${W}$-bit two's-complement words in Q${I}.${F} format (one sign bit, $${I}$ integer bits, $${F}$ fractional bits; the stored integer $k$ means $k/2^{${F}}$). Quantise $a = ${a}$ and $b = ${b}$, rounding to nearest with ties away from zero and saturating at the format's limits. Give both stored integers and the quantisation error of $a$ in LSBs (stored value minus true value). Multiply the stored integers exactly (a $${2 * W}$-bit product in Q${2 * I + 1}.${2 * F}). Round the product back to Q${I}.${F} the same way, with saturation, and give its value. Finally, what is the largest value the format can hold?`,
        givens: [T`Q${I}.${F}, $${W}$ bits, two's complement`, T`$a = ${a}$, $b = ${b}$`, 'Round to nearest, ties away from zero; saturate'],
        parts: [p('Stored integer for a', ca_, '', 0), p('Stored integer for b', cb, '', 0), p('Quantisation error of a', errL, 'LSB', .01, .002), p('Exact product (integer)', prod, '', 0), p('Product rounded back to the format', result, '', 1e-9, 1e-9), p('Largest representable value', maxv, '', 1e-9)],
        hints: [T`One LSB is $2^{-${F}}$, so the stored integer is $\operatorname{round}(x\cdot2^{${F}})$, limited to $[-2^{${W - 1}},\ 2^{${W - 1}} - 1]$.`, T`The product of two Q${I}.${F} integers has $2\times${F} = ${2 * F}$ fractional bits; dropping $${F}$ of them means dividing by $2^{${F}}$ and rounding.`, T`If the rounded product falls outside the ${W}-bit range, it saturates to the nearest limit instead of wrapping.`],
        steps: [T`$a\cdot2^{${F}} = ${tf(a * scale, 8)}$, stored $${ca_}$ (error $${tf(errL, 6)}$ LSB); $b\cdot2^{${F}} = ${tf(b * scale, 8)}$, stored $${cb}$.`, T`Product: $${ca_}\times${cb < 0 ? `(${cb})` : cb} = ${prod}$, worth $${tf(prod / scale / scale, 8)}$.`, T`$${prod}/2^{${F}} = ${tf(prod / scale, 8)}$, rounded $${roundAway(prod / scale)}$${sat ? T`, outside the range, so it saturates to $${back}$` : ''}: the value is $${tf(result, 8)}$.`, T`Largest value: $(2^{${W - 1}} - 1)/2^{${F}} = ${tf(maxv, 8)}$.`],
        idea: 'Fixed-point arithmetic is integer arithmetic with an agreed binary point: products double the word, and every return to the short format is a rounding decision and a possible saturation.',
        diagram, prerequisites: 'Two’s complement; binary fractions; rounding.',
        verify: () => { // exact rational arithmetic in BigInt (a and b have at most four decimals)
            const big = x => BigInt(x), rnd = (num, den) => { const neg = num < 0n, m = neg ? -num : num, r = (2n * m + den) / (2n * den); return neg ? -r : r; };
            const Lo = -(1n << big(W - 1)), Hi = (1n << big(W - 1)) - 1n, cl = v => v < Lo ? Lo : v > Hi ? Hi : v, S = 1n << big(F);
            const qa = cl(rnd(big(Math.round(a * 1e4)) * S, 10000n)), qb = cl(rnd(big(Math.round(b * 1e4)) * S, 10000n)), pr = qa * qb, bk = cl(rnd(pr, S));
            return [Number(qa), Number(qb), Number(qa) - a * scale, Number(pr), Number(bk) / scale, Number(Hi) / scale];
        }
    });
}

/* Level 2: an overlapping sequence detector as a finite-state machine. */
function digitalSequenceDetector(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'sequence-detector', date, DIGITAL_READING), p = part;
    const patterns = [...Array.from({length: 14}, (_, i) => (i + 1).toString(2).padStart(4, '0')), ...Array.from({length: 30}, (_, i) => (i + 1).toString(2).padStart(5, '0'))];
    const [pat, seed] = grid(patterns, steps(0, 499, 1)), L = pat.length, bits = lcgBits(seed + 1000 * patterns.indexOf(pat), 24);
    [3 + seed % 6, 13 + seed % 5].forEach(at => [...pat].forEach((c, j) => { bits[at + j] = +c; })); // make sure it appears
    const stream = bits.join(''), border = k => { for (let b = k - 1; b > 0; b--) if (pat.slice(0, b) === pat.slice(k - b, k)) return b; return 0; };
    const next = (s, c) => { let k = s; while (k > 0 && pat[k] !== c) k = border(k); return pat[k] === c ? k + 1 : 0; };
    let s = 0, over = 0, first = 0, s2 = 0, non = 0;
    [...stream].forEach((c, i) => {
        s = next(s, c); if (s === L) { over++; if (!first) first = i + 1; s = border(L); }
        s2 = next(s2, c); if (s2 === L) { non++; s2 = 0; }
    });
    const grouped = stream.match(/.{1,4}/g).join('\\ ');
    const diagram = drawing(Array.from({length: L + 1}, (_, k) => ring(80 + k * (560 / L), 130, 26) + dt(80 + k * (560 / L), 136, 'S' + k) + (k < L ? arrow(106 + k * (560 / L), 130, 54 + (k + 1) * (560 / L), 130) + dt(80 + (k + .5) * (560 / L), 116, pat[k]) : '')).join('') +
        dt(360, 210, `Moore detector for ${pat}: the forward path; mismatches fall back to the longest matching prefix`), `State diagram forward path of a Moore detector for the pattern ${pat}`, 240);
    return q({
        title: 'Count the detections of a sequence detector',
        text: T`A synchronous detector raises its output for one clock cycle each time the last $${L}$ input bits equal $\mathtt{${pat}}$ (earliest bit first). Overlapping occurrences count. How many states does a minimal Moore implementation need? Feed it the 24-bit input below (left to right) and count the detections. How many would a detector count that restarts from scratch after each detection (no overlap)? In the overlapping Mealy detector, whose state is the length of the longest prefix of the pattern matched so far ($0$ to $${L - 1}$), what is the state after the last bit? Which input bit (1 to 24) completes the first detection?`,
        givens: [T`Pattern $\mathtt{${pat}}$`, T`Input $\mathtt{${grouped}}$`, 'Overlap allowed unless stated'],
        parts: [p('Moore states', L + 1, 'states', 0), p('Detections with overlap', over, '', 0), p('Detections without overlap', non, '', 0), p('Final Mealy state', s, '', 0), p('Bit completing the first detection', first, '', 0)],
        hints: [T`A Moore machine needs one state for each matched prefix length $0$ to $${L}$; the Mealy machine merges the last one into its output.`, T`On a mismatch the machine falls back to the longest proper prefix of the pattern that is also a suffix of what it has seen (as in the KMP algorithm).`, T`Without overlap, return to the start state after every detection.`],
        steps: [T`States: $${L + 1}$ (Moore), $${L}$ (Mealy).`, T`Scanning with fall-back: $${over}$ detections, the first completed by bit $${first}$.`, T`Restarting after each detection: $${non}$ detections.`, T`After the last bit the matched prefix has length $${s}$.`],
        idea: 'A sequence detector is string matching in hardware: its states are prefixes of the pattern, and its fall-back transitions encode the pattern’s self-overlaps.',
        diagram, prerequisites: 'Finite-state machines; Moore and Mealy outputs; string matching.',
        verify: () => { // direct string checks
            let o = 0, f = 0, nn = 0, i = 0;
            for (let e = L; e <= 24; e++) if (stream.slice(e - L, e) === pat) { o++; if (!f) f = e; }
            while (i + L <= 24) { if (stream.slice(i, i + L) === pat) { nn++; i += L; } else i++; }
            let st = 0; for (let b = L - 1; b > 0; b--) if (stream.endsWith(pat.slice(0, b))) { st = b; break; }
            return [L + 1, o, nn, st, f];
        }
    });
}

/* Level 2: dynamic and static power of a CMOS chip, and running slower at a lower voltage. */
function digitalCMOSPower(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'cmos-power', date, DIGITAL_READING), p = part;
    const [C, al, V, f, Il] = grid([.5, 1, 2, 5], [.1, .15, .2, .3], [1, 1.1, 1.2], [.5, 1, 2], [5, 10, 20, 50]), V2 = +(V - .3).toFixed(2), f2 = f / 2, N = 1e9; // C nF, f GHz, Il mA
    const Pd = al * C * V * V * f * 1e3, Ps = V * Il, E = (Pd + Ps) / f, Pd2 = al * C * V2 * V2 * f2 * 1e3, Ps2 = V2 * Il, P2 = Pd2 + Ps2, ratio = (P2 / f2) / ((Pd + Ps) / f);
    const diagram = drawing(wire('M120 60H600M120 220H600') + note(605, 66, 'Vᴅᴅ') + note(605, 226, 'GND') + Array.from({length: 4}, (_, i) => wire(`M${180 + i * 120} 60v40m0 60v60`) + wire(`M${160 + i * 120} 100h40v60h-40z`) + dt(180 + i * 120, 136, 'gate')).join('') +
        element('C', 590, 130, 590, 220, 'C') + dt(360, 30, `α = ${al}, C = ${C} nF, leakage ${Il} mA`), 'Logic gates between the supply rails; each clock cycle charges a fraction α of the switched capacitance C, and a leakage current flows all the time', 245);
    return q({
        title: 'Power and energy of a CMOS chip',
        text: T`A CMOS chip switches an effective capacitance $C = ${C}\,\text{nF}$ with activity factor $\alpha = ${al}$ at $${f}\,\text{GHz}$ from $V_{DD} = ${V}\,\text{V}$, and leaks $${Il}\,\text{mA}$ regardless of activity. Find the dynamic power, the static power and the energy per clock cycle. The chip is then run at half the clock and $${V2}\,\text{V}$ (assume the leakage current stays $${Il}\,\text{mA}$). Find the new total power, and the ratio of the energy needed for a fixed task of $10^9$ cycles at the new point to that at the original point.`,
        givens: [T`$C = ${C}\,\text{nF}$, $\alpha = ${al}$`, T`$f = ${f}\,\text{GHz}$, $V_{DD} = ${V}\,\text{V}$`, T`$I_{\text{leak}} = ${Il}\,\text{mA}$; second point $${f2}\,\text{GHz}$, $${V2}\,\text{V}$`],
        parts: [p('Dynamic power', Pd, 'mW'), p('Static power', Ps, 'mW'), p('Energy per cycle', E, 'pJ'), p('Total power at the slow point', P2, 'mW'), p('Task energy ratio (slow / original)', ratio, '')],
        hints: [T`$P_{\text{dyn}} = \alpha CV^2f$ and $P_{\text{static}} = VI_{\text{leak}}$.`, T`Energy per cycle $= P/f$: the dynamic part is $\alpha CV^2$, independent of $f$.`, T`A fixed task of $N$ cycles takes $N/f$ seconds: lowering $V$ saves dynamic energy, but a longer run spends more leakage energy.`],
        steps: [T`$P_{\text{dyn}} = ${al}\times${C}\,\text{nF}\times${V}^2\times${f}\,\text{GHz} = ${tf(Pd)}\,\text{mW}$; $P_{\text{static}} = ${tf(Ps)}\,\text{mW}$.`, T`Energy per cycle $= ${tf(Pd + Ps)}\,\text{mW}/${f}\,\text{GHz} = ${tf(E)}\,\text{pJ}$.`, T`Slow point: $P = ${tf(Pd2)} + ${tf(Ps2)} = ${tf(P2)}\,\text{mW}$.`, T`Task energy: $${tf(E)}\,\text{pJ}$ versus $${tf(P2 / f2)}\,\text{pJ}$ per cycle, ratio $${tf(ratio)}$.`],
        idea: 'Dynamic energy per operation falls with V², but leakage energy grows with run time; voltage scaling pays only while switching dominates.',
        diagram, prerequisites: 'Power and energy; CMOS switching.',
        verify: () => { // energy per cycle built from its parts, then powers from energies
            const ed = (v, ff) => al * C * 1e-9 * v * v, es = (v, ff) => v * Il * 1e-3 / (ff * 1e9);
            const e1 = ed(V, f) + es(V, f), e2 = ed(V2, f2) + es(V2, f2);
            return [ed(V, f) * f * 1e9 * 1e3, es(V, f) * f * 1e9 * 1e3, e1 * 1e12, e2 * f2 * 1e9 * 1e3, e2 / e1];
        }
    });
}

/* Level 3: pipelining a chain of logic blocks: the best cuts, throughput and latency. */
function digitalPipeline(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'pipeline', date, DIGITAL_READING), p = part;
    const [seed, Treg, k] = grid(steps(0, 399, 1), [.1, .15, .2, .3], [2, 3, 4]);
    let s = (seed * 2654435761 + 7) >>> 0;
    const d = Array.from({length: 6}, () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return +(.4 + .1 * Math.floor((s >>> 8) % 17)).toFixed(1); });
    const best = kk => { // dynamic programme: the smallest possible largest stage over contiguous splits into kk stages
        const pre = [0]; d.forEach(x => pre.push(pre[pre.length - 1] + x));
        const memo = {}, f = (i, st) => { const key = i + ',' + st; if (key in memo) return memo[key]; if (st === 1) return memo[key] = pre[6] - pre[i];
            let m = Infinity; for (let j = i + 1; j <= 6 - st + 1; j++) m = Math.min(m, Math.max(pre[j] - pre[i], f(j, st - 1))); return memo[key] = m; };
        return f(0, kk);
    };
    const total = d.reduce((a, b) => a + b, 0), T1 = total + Treg, Tk = best(k) + Treg, Ttarget = +(1.25 * (Math.max(...d) + Treg)).toFixed(1);
    let kmin = 1; while (best(kmin) + Treg > Ttarget + 1e-9) kmin++;
    const diagram = blockDiagram(d.map((x, i) => `L${i + 1} · ${x} ns`), `Register overhead (clock-to-Q + setup + skew margin) ${Treg} ns per stage`, 'Six combinational blocks in a chain with their delays, to be cut into pipeline stages by registers');
    return q({
        title: 'Where to cut a pipeline',
        text: T`Six combinational blocks run in a fixed order with the delays shown. Every register adds $${Treg}\,\text{ns}$ of overhead (clock-to-Q, setup and skew margin). Registers may only go between blocks. Find the maximum clock frequency without pipelining (one register stage). Cut the chain into $${k}$ stages to minimise the clock period: give that period, the throughput speed-up over the unpipelined design, and the latency of one result. Finally, what is the fewest stages that reaches a clock period of $${Ttarget}\,\text{ns}$?`,
        givens: [T`Delays (ns): $${d.join(',\\ ')}$`, T`Register overhead $${Treg}\,\text{ns}$`, T`$${k}$ stages; target period $${Ttarget}\,\text{ns}$`],
        parts: [p('Unpipelined maximum frequency', 1000 / T1, 'MHz'), p(T`Best period with ${k} stages`, Tk, 'ns'), p('Throughput speed-up', T1 / Tk, '×'), p('Latency', k * Tk, 'ns'), p(T`Fewest stages for $${Ttarget}\,\text{ns}$`, kmin, 'stages', 0)],
        hints: [T`The clock period is the slowest stage plus the register overhead; the stages must be contiguous runs of blocks.`, T`Try the possible cut positions (there are only five gaps), or build the best split stage by stage.`, T`Latency is the number of stages times the period: pipelining raises throughput but never shortens the path through the logic.`],
        steps: [T`Unpipelined: $${tf(total)} + ${Treg} = ${tf(T1)}\,\text{ns}$, i.e. $${tf(1000 / T1)}\,\text{MHz}$.`, T`Best ${k}-stage split: largest stage $${tf(best(k))}\,\text{ns}$, period $${tf(Tk)}\,\text{ns}$.`, T`Speed-up $${tf(T1 / Tk)}$ and latency $${k}\times${tf(Tk)} = ${tf(k * Tk)}\,\text{ns}$.`, T`The largest single block is $${Math.max(...d)}\,\text{ns}$; the first stage count whose best split fits $${Ttarget}\,\text{ns}$ is $${kmin}$.`],
        idea: 'Pipelining is limited by the slowest indivisible block and by register overhead: past a point, more stages add latency and little speed.',
        diagram, prerequisites: 'Combinational delay; registers; throughput and latency.',
        verify: () => { // brute force over every choice of cut positions
            const bestB = kk => { let m = Infinity; for (let mask = 0; mask < 32; mask++) { const cuts = [...Array(5).keys()].filter(i => mask >> i & 1); if (cuts.length !== kk - 1) continue;
                let st = 0, mx = 0; d.forEach((x, i) => { st += x; if (cuts.includes(i) || i === 5) { mx = Math.max(mx, st); st = 0; } }); m = Math.min(m, mx); } return m; };
            let km = 1; while (bestB(km) + Treg > Ttarget + 1e-9) km++;
            const t1 = d.reduce((a, b) => a + b, 0) + Treg, tk = bestB(k) + Treg;
            return [1000 / t1, tk, t1 / tk, k * tk, km];
        }
    });
}

/* Level 3: ripple-carry against carry-select adders, and the best block size. Units: ps → ns. */
function digitalCarrySelect(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'carry-select', date, DIGITAL_READING), p = part;
    const divs = n => Array.from({length: n}, (_, i) => i + 1).filter(m => n % m === 0);
    const [[n, m], tc, tmux] = grid([8, 12, 16, 20, 24, 32, 40, 48, 64].flatMap(n => divs(n).filter(m => m > 1 && m < n).map(m => [n, m])), [40, 50, 60, 80], [30, 40, 50, 70]);
    const Tcs = mm => mm * tc + (n / mm - 1) * tmux, Tr = n * tc, all = divs(n), mopt = all.reduce((b, mm) => Tcs(mm) < Tcs(b) - 1e-9 ? mm : b, all[0]);
    const diagram = drawing(Array.from({length: 4}, (_, i) => wire(`M${70 + i * 150} 80h120v60h-120z`) + dt(130 + i * 150, 105, i ? 'm-bit adders ×2' : 'm-bit adder') + dt(130 + i * 150, 128, i ? 'cin = 0 and 1' : 'ripple') +
        (i ? wire(`M${110 + i * 150} 180h40l-8 22h-24z`) + wire(`M${130 + i * 150} 140v40M${130 + i * 150} 202v18`) + dt(130 + i * 150, 240, 'mux') : '') + (i < 3 ? arrow(190 + i * 150, 191, 260 + i * 150, 191) : '')).join('') +
        dt(130, 240, 'block 1') + dt(360, 40, 'n bits = (n/m) blocks of m bits; the carry hops through one multiplexer per block'), 'Carry-select adder: the first block ripples; each later block computes both possible sums while the carry selects between them through a multiplexer', 260);
    return q({
        title: 'How big should a carry-select block be?',
        text: T`An $${n}$-bit adder is built from full adders whose carry delay is $t_c = ${tc}\,\text{ps}$ per bit. A plain ripple-carry adder needs the carry to pass all $${n}$ bits. A carry-select adder splits the word into blocks of $m$ bits: every block computes its sum for both possible carry-ins in $m\,t_c$, and each block after the first selects its result with one multiplexer ($t_{\text{mux}} = ${tmux}\,\text{ps}$) once its carry-in arrives, so $T = m\,t_c + (n/m - 1)\,t_{\text{mux}}$. Find the ripple-carry delay, the carry-select delay with $m = ${m}$, the block size that minimises the delay (a divisor of $${n}$; take the smaller one if two tie), the minimum delay, and its speed-up over ripple carry.`,
        givens: [T`$n = ${n}$ bits`, T`$t_c = ${tc}\,\text{ps}$, $t_{\text{mux}} = ${tmux}\,\text{ps}$`, T`Given block size $m = ${m}$`],
        parts: [p('Ripple-carry delay', Tr / 1e3, 'ns'), p(T`Carry-select delay, $m = ${m}$`, Tcs(m) / 1e3, 'ns'), p('Best block size', mopt, 'bits', 0), p('Minimum delay', Tcs(mopt) / 1e3, 'ns'), p('Speed-up over ripple carry', Tr / Tcs(mopt), '×')],
        hints: [T`Ripple carry: $T = n\,t_c$.`, T`Large blocks ripple for long; small blocks make many multiplexer hops. Treating $m$ as continuous, $T$ is smallest near $m = \sqrt{n\,t_{\text{mux}}/t_c}$.`, T`Only divisors of $n$ give equal blocks: evaluate $T$ at the divisors near that value.`],
        steps: [T`Ripple: $${n}\times${tc} = ${Tr}\,\text{ps}$.`, T`$m = ${m}$: $${m}\times${tc} + (${n / m} - 1)\times${tmux} = ${Tcs(m)}\,\text{ps}$.`, T`$\sqrt{n\,t_{\text{mux}}/t_c} = ${tf(Math.sqrt(n * tmux / tc))}$; over the divisors of $${n}$ the best is $m = ${mopt}$, giving $${Tcs(mopt)}\,\text{ps}$.`, T`Speed-up $${Tr}/${Tcs(mopt)} = ${tf(Tr / Tcs(mopt))}$.`],
        idea: 'Carry-select spends area (duplicate adders) to turn a linear carry chain into a short ripple plus a hop per block; the best block size balances the two.',
        diagram, prerequisites: 'Adders; propagation delay; minimising a function over integers.',
        verify: () => { // carry arrival times simulated block by block, for every block size
            const sim = mm => { let c = mm * tc; for (let j = 1; j < n / mm; j++) c = Math.max(mm * tc, c) + tmux; return c; };
            const sizes = divs(n), bm = sizes.reduce((b, mm) => sim(mm) < sim(b) - 1e-9 ? mm : b, sizes[0]);
            return [n * tc / 1e3, sim(m) / 1e3, bm, sim(bm) / 1e3, n * tc / sim(bm)];
        }
    });
}

/* Level 3: coefficient quantisation, worst-case output and accumulator width of a fixed-point FIR filter. */
function digitalFIRWords(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'fir-words', date, DIGITAL_READING), p = part;
    const design = (fc, N, gain) => { const M = (N - 1) / 2, h = Array.from({length: N}, (_, n) => { const x = n - M, sinc = x === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * x) / (Math.PI * x); return sinc * (.54 - .46 * Math.cos(2 * Math.PI * n / (N - 1))); }), s = h.reduce((a, b) => a + b, 0); return h.map(v => +(v * gain / s).toFixed(6)); };
    const [[fc, N, Bc, Bin, gain]] = grid(product([.1, .15, .2, .25, .3], [5, 7, 9], [8, 10, 12], [8, 12, 16], [.8, 1, 1.5, 2]).filter(([fc, N, , , g]) => Math.max(...design(fc, N, g).map(Math.abs)) < .95));
    const h = design(fc, N, gain), sc = 2 ** (Bc - 1), hq = h.map(v => roundAway(v * sc) / sc), qerr = Math.max(...h.map((v, i) => Math.abs(v - hq[i]))), L1 = hq.reduce((a, b) => a + Math.abs(b), 0);
    const G = Math.max(0, Math.ceil(Math.log2(L1) - 1e-12)), acc = Bin + Bc + G, lsb = 2 ** -(Bin - 1), pos = hq.filter(v => v > 0).reduce((a, b) => a + b, 0), neg = -hq.filter(v => v < 0).reduce((a, b) => a + b, 0);
    const worst = Math.max(pos * (1 - lsb) + neg, pos + neg * (1 - lsb)), dc = hq.reduce((a, b) => a + b, 0);
    const diagram = drawing(Array.from({length: Math.min(N, 5)}, (_, i) => (i ? wire(`M${70 + i * 120} 70h44v40h-44z`) + dt(92 + i * 120, 96, 'z⁻¹') + arrow(20 + i * 120, 90, 70 + i * 120, 90) : arrow(20, 90, 70, 90) + dt(40, 70, 'x')) +
        ring(92 + i * 120, 170, 16) + dt(92 + i * 120, 176, '×') + wire(`M${92 + i * 120} 90v64`) + dt(122 + i * 120, 150, 'h' + i) + wire(`M${92 + i * 120} 186v30`)).join('') + wire(`M92 216H${92 + 4 * 120}v14`) + dt(360, 252, `Accumulator: sum of ${N} products, then y`),
        'Direct-form FIR filter: a delay line of the input, each tap multiplied by a coefficient, and all products summed in an accumulator', 260);
    return q({
        title: 'Word lengths in a fixed-point FIR filter',
        text: T`A ${N}-tap FIR filter has the coefficients below. They are stored as $${Bc}$-bit two's-complement fractions (Q0.${Bc - 1}: round to nearest, ties away from zero). The input is a $${Bin}$-bit two's-complement fraction in $[-1,\ 1 - 2^{-${Bin - 1}}]$. Find the largest coefficient quantisation error and the sum of the absolute quantised coefficients. The accumulator must never overflow: give the number of guard bits $G = \lceil\log_2\sum|h_q|\rceil$ (at least $0$) and the accumulator width $B_{\text{in}} + B_c + G$. Find the largest output magnitude any input sequence can produce, and the DC gain of the quantised filter.`,
        givens: [T`$h = (${h.join(',\\ ')})$`, T`Coefficients: $${Bc}$ bits; input: $${Bin}$ bits`, 'Two’s-complement fractions; round half away from zero'],
        parts: [p('Largest coefficient quantisation error', qerr, '', .01, 1e-7), p(T`$\sum|h_q|$`, L1, ''), p('Guard bits', G, 'bits', 0), p('Accumulator width', acc, 'bits', 0), p('Largest output magnitude', worst, ''), p('DC gain of the quantised filter', dc, '')],
        hints: [T`One coefficient LSB is $2^{-${Bc - 1}}$: $h_q = \operatorname{round}(h\cdot2^{${Bc - 1}})/2^{${Bc - 1}}$, so every error is at most half an LSB.`, T`The output is largest when every input sample has the sign of its coefficient at full scale: $+1 - 2^{-${Bin - 1}}$ for positive taps and $-1$ for negative ones (or the reverse).`, T`A product of a $B_{\text{in}}$-bit and a $B_c$-bit fraction fits in $B_{\text{in}} + B_c$ bits; summing products whose total weight is $\sum|h_q|$ can grow the result by up to $\log_2\sum|h_q|$ bits.`],
        steps: [T`Quantised: $h_q = (${hq.map(v => tf(v, 7)).join(',\\ ')})$; the largest error is $${tf(qerr, 6)}$.`, T`$\sum|h_q| = ${tf(L1, 7)}$, so $G = ${G}$ and the accumulator needs $${Bin} + ${Bc} + ${G} = ${acc}$ bits.`, T`Worst case: $${tf(pos, 7)}(1 - 2^{-${Bin - 1}}) + ${tf(neg, 7)}$ or the mirror image, so the largest magnitude is $${tf(worst, 7)}$.`, T`DC gain $\sum h_q = ${tf(dc, 7)}$.`],
        idea: 'Fixed-point filters are sized from the sum of absolute coefficients: it bounds the output, sets the guard bits, and tells you when scaling is needed.',
        diagram, prerequisites: 'FIR filters; two’s complement; worst-case bounds.',
        verify: () => { // every sign pattern of full-scale inputs, by brute force
            let best = 0; const hi = 1 - lsb;
            for (let mask = 0; mask < 1 << N; mask++) { let y = 0; hq.forEach((v, i) => { y += v * (mask >> i & 1 ? hi : -1); }); best = Math.max(best, Math.abs(y)); }
            const l1 = hq.map(Math.abs).reduce((a, b) => a + b, 0), g = l1 <= 1 ? 0 : Math.ceil(Math.log2(l1) - 1e-12);
            return [Math.max(...h.map(v => Math.abs(v - Math.round(v * sc) / sc))), l1, g, Bin + Bc + g, best, hq.reduce((a, b) => a + b, 0)];
        }
    });
}

/* Level 4 (expert): sizing an asynchronous FIFO for bursts, with synchroniser latency and Gray-code pointers. */
function digitalFIFO(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'fifo', date, DIGITAL_READING), p = part;
    const [[fw, fr, B, sync]] = grid(product([100, 125, 150, 200, 250], [40, 50, 66, 75, 80, 100], [16, 32, 48, 64, 100, 128, 200, 256], [2, 3]).filter(([w, r]) => r < w));
    const R = Math.floor(B * fr / fw + 1e-9), D0 = B - R, marg = Math.ceil(sync * fr / fw - 1e-9), D = D0 + marg, P2 = 2 ** Math.ceil(Math.log2(D)), ptr = Math.log2(P2) + 1, gap = Math.ceil(B * fw / fr - 1e-9);
    const diagram = drawing(wire('M60 100h150v60H60zM290 80h140v100H290zM510 100h150v60H510z') + dt(135, 128, `writer ${fw} MHz`) + dt(360, 125, 'FIFO') + dt(360, 150, 'Gray pointers') + dt(585, 128, `reader ${fr} MHz`) +
        arrow(210, 130, 290, 130) + arrow(430, 130, 510, 130) + wire('M330 180v40h60v-40') + dt(360, 245, `pointers cross through ${sync}-flop synchronisers`), 'A writer bursts words into an asynchronous FIFO that a slower reader drains; pointers cross clock domains in Gray code through synchronisers', 260);
    return q({
        title: 'How deep must an asynchronous FIFO be?',
        text: T`A writer clocked at $${fw}\,\text{MHz}$ sends bursts of $${B}$ words, one word per write clock. A reader at $${fr}\,\text{MHz}$ removes one word per read clock whenever the FIFO is not empty. A burst lasts $${B}$ write periods and starts with the FIFO empty; assume the reader removes $\lfloor B f_r/f_w\rfloor$ words during it. (a) How many words does it remove? (b) What depth holds the burst? (c) The full flag sees the read pointer through a synchroniser $${sync}$ write cycles late, so reads made in that window are not yet visible: add $\lceil ${sync}\,f_r/f_w\rceil$ words of margin. (d) Pointers count in Gray code, so round the depth up to a power of two. (e) How many bits does each pointer need, including the wrap bit that tells full from empty? (f) What is the shortest burst period, in write cycles, that the reader can sustain?`,
        givens: [T`$f_w = ${fw}\,\text{MHz}$, $f_r = ${fr}\,\text{MHz}$`, T`Burst of $${B}$ words`, T`Synchroniser latency $${sync}$ write cycles`],
        parts: [p('Words read during the burst', R, 'words', 0), p('Depth without margin', D0, 'words', 0), p('Depth with synchroniser margin', D, 'words', 0), p('Power-of-two depth', P2, 'words', 0), p('Pointer width', ptr, 'bits', 0), p('Shortest sustainable burst period', gap, 'write cycles', 0)],
        hints: [T`The burst lasts $B/f_w$; in that time the reader takes $\lfloor B f_r/f_w\rfloor$ words.`, T`Gray-code pointers wrap cleanly only for power-of-two depths. With $2^k$ locations each pointer needs $k + 1$ bits: equal low bits with different top bits means full.`, T`On average the reader must keep up: $B$ words take $B/f_r$ to read, i.e. $\lceil B f_w/f_r\rceil$ write cycles.`],
        steps: [T`(a) $\lfloor ${B}\times${fr}/${fw}\rfloor = ${R}$ words.`, T`(b) $${B} - ${R} = ${D0}$ words.`, T`(c) $\lceil ${sync}\times${fr}/${fw}\rceil = ${marg}$, so $${D}$ words; (d) $${P2}$ words.`, T`(e) $\log_2${P2} + 1 = ${ptr}$ bits.`, T`(f) $\lceil ${B}\times${fw}/${fr}\rceil = ${gap}$ write cycles.`],
        idea: 'A FIFO absorbs the difference between burst and average rates; clock-domain crossing adds latency that must be paid for in extra depth.',
        diagram, prerequisites: 'FIFOs; clock-domain crossing; Gray code.',
        verify: () => { // event counting on the two clocks
            let reads = 0; for (let m = 1; m / fr <= B / fw + 1e-12; m++) reads++;
            let mg = 0; for (let m = 1; m / fr <= sync / fw + 1e-12; m++) mg++; if (Math.abs(sync * fr / fw - Math.round(sync * fr / fw)) > 1e-9) mg++;
            let depth = 1, bits = 1; while (depth < B - reads + mg) { depth *= 2; bits++; }
            let cyc = 0; while (cyc / fw < B / fr - 1e-12) cyc++;
            return [reads, B - reads, B - reads + mg, depth, bits, cyc];
        }
    });
}

/* LFSR sources for the Berlekamp–Massey problem: every register of length 5–7 (c_L = 1) and seed, kept only when its
   visible bits (2L + 6 of them) differ from every earlier one, since different registers can share a sequence. */
const lfsrBits = (L, taps, seed, len) => { const s = Array.from({length: L}, (_, i) => seed >> (L - 1 - i) & 1); while (s.length < len) { let b = 0; for (let k = 1; k <= L; k++) if (taps >> (k - 1) & 1) b ^= s[s.length - k]; s.push(b); } return s; };
let lfsrCache = null;
function lfsrSources() {
    if (lfsrCache) return lfsrCache;
    const seen = new Set(), out = [];
    for (const L of [5, 6, 7]) for (let i = 0; i < 2 ** (L - 1); i++) for (let k = 0; k < 31; k++) {
        const taps = i | 1 << (L - 1), seed = k % (2 ** L - 1) + 1, key = lfsrBits(L, taps, seed, 2 * L + 6).join('');
        if (!seen.has(key)) { seen.add(key); out.push({L, taps, seed}); }
    }
    return lfsrCache = out;
}
/* Level 4 (mastery): Berlekamp–Massey finds the shortest LFSR behind a bit sequence. */
function digitalBerlekampMassey(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'berlekamp-massey', date, DIGITAL_READING), p = part;
    const [{L, taps, seed}] = grid(lfsrSources()), n = 2 * L + 6, shown = lfsrBits(L, taps, seed, n);
    // Berlekamp–Massey over GF(2): C is the connection polynomial (bit k = c_k), LC the linear complexity.
    let C = [1], B = [1], LC = 0, m = 1;
    for (let i = 0; i < n; i++) {
        let d = shown[i]; for (let k = 1; k <= LC; k++) d ^= (C[k] || 0) & shown[i - k];
        if (!d) { m++; continue; }
        const T0 = C.slice(), shifted = Array(m).fill(0).concat(B); C = Array.from({length: Math.max(C.length, shifted.length)}, (_, k) => (C[k] || 0) ^ (shifted[k] || 0));
        if (2 * LC <= i) { LC = i + 1 - LC; B = T0; m = 1; } else m++;
    }
    const Cint = C.slice(0, LC + 1).reduce((v, b, k) => v | (b << k), 0), ext = shown.slice();
    while (ext.length < n + 8) { let b = 0; for (let k = 1; k <= LC; k++) b ^= (Cint >> k & 1) & ext[ext.length - k]; ext.push(b); }
    const next8 = ext.slice(n, n + 8).reduce((v, b) => v * 2 + b, 0);
    let st = ext.slice(0, LC).join(''), period = 0; { let reg = ext.slice(0, LC); do { let b = 0; for (let k = 1; k <= LC; k++) b ^= (Cint >> k & 1) & reg[LC - k]; reg = reg.slice(1).concat(b); period++; } while (reg.join('') !== st && period < 300); }
    const maximal = period === 2 ** LC - 1 ? 1 : 0, bits = shown.join('').match(/.{1,4}/g).join('\\ ');
    const diagram = drawing(Array.from({length: 6}, (_, i) => wire(`M${90 + i * 90} 90h60v50h-60z`) + dt(120 + i * 90, 121, `s(n−${i + 1})`) + (i ? arrow(150 + (i - 1) * 90, 115, 90 + i * 90, 115) : '') + wire(`M${120 + i * 90} 140v40`) + ring(120 + i * 90, 196, 12) + dt(120 + i * 90, 201, 'c' + (i + 1))).join('') +
        wire('M120 208v22H660V115h-30') + arrow(40, 115, 90, 115) + dt(360, 255, 'feedback s(n) = c₁s(n−1) ⊕ c₂s(n−2) ⊕ … (only the length is unknown)'), 'A linear feedback shift register: the delayed bits, each tapped by a coefficient, are XORed together and fed back as the next bit', 265);
    return q({
        title: 'The shortest LFSR behind a bit sequence',
        text: T`The ${n} bits below (first bit on the left) come from an unknown linear feedback shift register over GF(2), $s_n = c_1s_{n-1} \oplus c_2s_{n-2} \oplus \cdots \oplus c_{L}s_{n-L}$. Use the Berlekamp–Massey algorithm to find the linear complexity (the length of the shortest such register) and its connection polynomial $C(x) = 1 + c_1x + \cdots + c_Lx^L$. Give $C$ as the integer $\sum_k c_k2^k$ (so $c_0 = 1$ is bit 0). Predict the next 8 bits (as an integer, first bit most significant). Find the period of the sequence, and whether the register is maximal-length (period $2^L - 1$; enter $1$ for yes, $0$ for no).`,
        givens: [T`$s = \mathtt{${bits}}$`, `${n} bits, earliest first`, 'GF(2) arithmetic (XOR)'],
        parts: [p('Linear complexity', LC, '', 0), p('Connection polynomial as an integer', Cint, '', 0), p('Next 8 bits as an integer', next8, '', 0), p('Period', period, '', 0), p('Maximal length? (1/0)', maximal, '', 0)],
        hints: [T`Berlekamp–Massey keeps the shortest register that reproduces the bits so far. At each new bit it computes the discrepancy $d = s_i \oplus \sum_k c_ks_{i-k}$; if $d = 1$ it corrects $C(x)$ with a shifted copy of an earlier polynomial, and lengthens the register when $2L \le i$.`, T`$2L$ bits fix a register of length $L$ uniquely, so ${n} bits are enough here.`, T`Run the register forward for the prediction, and until its state repeats for the period. A maximal-length register visits all $2^L - 1$ non-zero states.`],
        steps: [T`Berlekamp–Massey ends with $L = ${LC}$ and $C(x) = ${C.slice(0, LC + 1).map((b, k) => b ? (k === 0 ? '1' : k === 1 ? 'x' : `x^{${k}}`) : '').filter(Boolean).join(' + ')}$, i.e. the integer $${Cint}$.`, T`Continuing the recurrence: the next 8 bits are $\mathtt{${ext.slice(n, n + 8).join('')}}$ $= ${next8}$.`, T`The state returns after $${period}$ steps, so the period is $${period}$${maximal ? T` $= 2^{${LC}} - 1$: maximal length` : T`, less than $2^{${LC}} - 1 = ${2 ** LC - 1}$: not maximal`}.`],
        idea: 'Any sequence of linear complexity L is pinned down by 2L bits, so an LFSR is useless as a cipher on its own.',
        diagram, prerequisites: 'Linear recurrences over GF(2); shift registers; Berlekamp–Massey.',
        verify: () => { // brute force: the shortest recurrence of any length that reproduces the shown bits
            for (let len = 1; len <= L; len++) for (let c = 0; c < 2 ** len; c++) {
                let ok = true; for (let i = len; i < n && ok; i++) { let b = 0; for (let k = 1; k <= len; k++) b ^= (c >> (k - 1) & 1) & shown[i - k]; if (b !== shown[i]) ok = false; }
                if (!ok) continue;
                const e = shown.slice(); while (e.length < n + 8) { let b = 0; for (let k = 1; k <= len; k++) b ^= (c >> (k - 1) & 1) & e[e.length - k]; e.push(b); }
                let reg = e.slice(0, len), per = 0; const start = reg.join(''); do { let b = 0; for (let k = 1; k <= len; k++) b ^= (c >> (k - 1) & 1) & reg[len - k]; reg = reg.slice(1).concat(b); per++; } while (reg.join('') !== start && per < 300);
                return [len, 1 | c << 1, e.slice(n, n + 8).reduce((v, b) => v * 2 + b, 0), per, per === 2 ** len - 1 ? 1 : 0];
            }
            return [NaN, NaN, NaN, NaN, NaN];
        }
    });
}
