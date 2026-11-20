const EXTRA_TOPICS = [{
    id: 'digital', name: 'Digital logic', sub: 'Bits, gates & timing', icon: '01', group: 'electrical'
}, {
    id: 'fields', name: 'Electromagnetism', sub: 'Fields, coils & induction', icon: 'Φ', group: 'electrical'
}, {
    id: 'power', name: 'Power & transformers', sub: 'AC power & conversion', icon: 'ϟ', group: 'electrical'
}, {
    id: 'measurement', name: 'Measurements & ADCs', sub: 'Sensors, resolution & loading', icon: '⊙', group: 'electrical'
}];
TOPICS.push(...EXTRA_TOPICS);

/* Routes a (topic, date, level) selection to the generator that owns it. */
function makeExercise(topic, date, level='foundations') {
    if (typeof MECH_TOPICS !== 'undefined' && MECH_TOPICS.some(t => t.id === topic))
        return makeMechExercise(topic, date, level);
    if (level === 'expert' || level === 'mastery')
        return makeExpertExercise(topic, date, level);
    if (level === 'university' || level === 'challenge')
        return makeHardExercise(topic, date, level);
    const e = EXTRA_TOPICS.some(t => t.id === topic) ? makeExtraExercise(topic, date, level) : makeCoreExercise(topic, date, level);
    return enhanceDiagram(e);
}
function makeExtraExercise(topic, date, level) {
    const idx = EXTRA_TOPICS.findIndex(t => t.id === topic), meta = LEVELS.find(l => l.id === level);
    if (idx < 0 || !meta)
        throw Error('Unknown challenge selection');
    const day = Math.floor(Date.UTC(...date.split('-').map((n, i) => i === 1 ? Number(n) - 1 : Number(n))) / 86400000), type = ((day + idx) % 2 + 2) % 2;
    let seed = (Math.imul(day, 2654435761) + idx * 7027 + LEVELS.indexOf(meta) * 5437) >>> 0;
    const pick = a => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return a[Math.floor(seed / 4294967296 * a.length)];
    };
    const p = part, mu0 = 4 * Math.PI * 1e-7;
    const q = (title, text, givens, parts, hints, steps, idea, diagram, prerequisites) => ({
        id: `${topic}-${level}-${type}`, title, text, givens, parts, hints, steps, idea, diagram, prerequisites, level: meta.name, minutes: meta.time
    });
    if (topic === 'digital') {
        if (level === 'foundations' && type === 0) {
            const val = pick([13, 19, 22, 27, 35, 41, 46, 53]), bits = val.toString(2).padStart(6, '0');
            return q('Read the bits', `Convert the unsigned six-bit binary number ${bits} to decimal. The leftmost bit has weight 2⁵.`, [`Word = ${bits}₂`, `Width = 6 bits`], [p('Decimal value', val, '', 0)], ['Each bit is multiplied by its place value.', 'From left to right the weights are 32, 16, 8, 4, 2, and 1. Add the weights of the 1 bits.'], [`Nonzero weights: ${[...bits].flatMap((b, i) => b === '1' ? [2 ** (5 - i)] : []).join(' + ')}.`, `Decimal value = ${val}.`], 'A binary word is a weighted sum, not a string of decimal digits.', digitalDiagram('binary', bits), 'Powers of two; unsigned binary representation.');
        }
        if (level === 'foundations') {
            const a = pick([0, 1]), b = pick([0, 1]), en = pick([0, 1]), ans = (a ^ b) & en;
            return q('Trace a logic signal', `Inputs A = ${a} and B = ${b} feed an XOR gate. Its output is ANDed with Enable = ${en}. Find the final output Y. Enter exactly 0 or 1.`, [`A = ${a}`, `B = ${b}`, `Enable = ${en}`], [p('Logic output Y', ans, '', 0)], ['XOR is 1 only when its two inputs differ.', 'AND is 1 only when both of its inputs are 1.'], [`A XOR B = ${a ^ b}.`, `Y = (A XOR B) AND Enable = ${ans}.`], 'An enable input can force an entire signal path off.', digitalDiagram('logic', a, b, en), 'XOR and AND truth tables.');
        }
        if (level === 'applied' && type === 0) {
            const f = pick([500, 1000, 2000, 4000]), d = pick([.2, .3, .4, .6, .75]), v = pick([3.3, 5]);
            return q('What does PWM really deliver?', `An ideal digital output switches between 0 V and ${v} V at ${f} Hz, with duty cycle ${d * 100}%. Find its period, HIGH time, and mean voltage over one cycle.`, [`f = ${f} Hz`, `Duty = ${d * 100}%`, `HIGH = ${v} V`], [p('Period', 1e6 / f, 'µs'), p('HIGH time', d * 1e6 / f, 'µs'), p('Mean voltage', d * v, 'V')], ['Period is the reciprocal of frequency.', 'Duty cycle is HIGH time divided by total period.', 'For a 0-to-V waveform, the mean voltage is duty cycle multiplied by V.'], [`T = 1/f = ${fmt(1e6 / f)} µs.`, `tHIGH = DT = ${fmt(d * 1e6 / f)} µs.`, `Vmean = D×VHIGH = ${fmt(d * v)} V.`], 'Duty cycle controls the average without changing the HIGH voltage.', pulseDiagram(d, `${f} Hz · duty ${d * 100}% · HIGH ${v} V`), 'Frequency, period, fractions, and waveform averages.');
        }
        if (level === 'applied') {
            const n = pick([3, 4, 5, 6]), f = pick([16, 32, 64, 128]);
            return q('Divide a clock with a counter', `An ideal free-running ${n}-bit binary up-counter receives a ${f} kHz clock. Find the frequency and period of its most significant bit (MSB). Ignore propagation delays.`, [`Clock = ${f} kHz`, `Width = ${n} bits`], [p('MSB frequency', f * 1000 / 2 ** n, 'Hz'), p('MSB period', 2 ** n / f, 'ms')], ['The counter repeats after 2ᴺ clock pulses.', 'The MSB completes one full cycle for each complete counter cycle.'], [`Division factor = 2^${n} = ${2 ** n}.`, `fMSB = ${f * 1000}/${2 ** n} = ${fmt(f * 1000 / 2 ** n)} Hz.`, `TMSB = ${fmt(2 ** n / f)} ms.`], 'Each successive binary counter bit divides the clock frequency by another factor of two.', digitalDiagram('counter', n), 'Binary counters; frequency division.');
        }
        if (type === 0) {
            const cq = pick([2, 3, 4]), pd = pick([8, 12, 16]), setup = pick([2, 3]), margin = 1, t = cq + pd + setup + margin, clk = pick([20, 25, 30]);
            return q('Will the data arrive in time?', `A synchronous register-to-register path has clock-to-Q delay ${cq} ns, worst-case combinational delay ${pd} ns, and setup time ${setup} ns. Add ${margin} ns of adverse clock-skew margin. Find the minimum clock period, corresponding maximum frequency, and setup slack at a ${clk} MHz clock. Ignore hold timing and other delays.`, [`tCQ = ${cq} ns`, `tpd = ${pd} ns`, `tsetup = ${setup} ns`, `Margin = ${margin} ns`, `Clock = ${clk} MHz`], [p('Minimum clock period', t, 'ns'), p('Maximum clock frequency', 1000 / t, 'MHz'), p('Setup slack at the stated clock', 1000 / clk - t, 'ns')], ['Data must launch, propagate, and become stable before the receiving setup window.', 'Add clock-to-Q, combinational delay, setup time, and adverse skew margin.', 'Slack = available clock period − minimum required period.'], [`Tmin = ${cq}+${pd}+${setup}+${margin} = ${t} ns.`, `fmax = 1000/Tmin = ${fmt(1000 / t)} MHz.`, `Slack = 1000/${clk} − ${t} = ${fmt(1000 / clk - t)} ns.`], 'A positive setup slack means this path meets the stated setup constraint; it says nothing about hold timing.', digitalDiagram('timing', cq, pd, setup), 'Synchronous logic; setup timing; unit conversion.');
        }
        const n = pick([4, 5, 6]), a = pick([2 ** n - 3, 2 ** n - 5, 2 ** n - 7]), b = pick([4, 7, 11]), sum = a + b, stored = sum % 2 ** n, carry = Math.floor(sum / 2 ** n);
        return q('Check an unsigned sum for overflow', `An unsigned ${n}-bit adder adds A = ${a} and B = ${b}, with carry-in 0. Only the lowest ${n} result bits are stored. Find the full mathematical sum, stored value in decimal, and carry-out bit.`, [`Width = ${n} bits`, `A = ${a}`, `B = ${b}`], [p('Full mathematical sum', sum, '', 0), p('Stored unsigned value', stored, '', 0), p('Carry-out', carry, '', 0)], ['First add the operands without a word-size limit.', 'N bits can store values from 0 to 2ᴺ−1. The stored value is the sum modulo 2ᴺ.', 'A sum of at least 2ᴺ generates a carry-out of 1.'], [`A+B = ${sum}.`, `Stored = ${sum} mod ${2 ** n} = ${stored}.`, `Carry-out = ${carry}.`], 'Finite-width arithmetic wraps around; unsigned carry and signed overflow are different concepts.', digitalDiagram('adder', a, b, n), 'Unsigned arithmetic; modular arithmetic; carry bits.');
    }
    if (topic === 'fields') {
        if (level === 'foundations' && type === 0) {
            const n = pick([200, 400, 600]), i = pick([.2, .5, 1]), l = pick([.2, .3, .4]), b = mu0 * n * i / l;
            return q('Inside an air-core solenoid', `Model a solenoid as long enough to neglect end effects. It has ${n} turns over length ${l} m and carries ${i} A. Find its internal magnetic flux density. Use μ₀ = 4π × 10⁻⁷ H/m and an air core.`, [`N = ${n}`, `I = ${i} A`, `Length = ${l} m`], [p('Magnetic flux density B', b * 1000, 'mT')], ['For an ideal long solenoid, B = μ₀nI, with n turns per metre.', 'Use n = N/length. Convert teslas to milliteslas at the end.'], [`Turns per metre = N/l = ${fmt(n / l)}.`, `B = μ₀NI/l = ${fmt(b * 1000)} mT.`], 'More turns per unit length or more current produces a stronger magnetic field in this model.', coilDiagram(n + ' turns', `I = ${i} A · length = ${l} m · air core`), 'Magnetic field of a solenoid; SI units.');
        }
        if (level === 'foundations') {
            const l = pick([10, 22, 47, 100]), i = pick([.2, .5, 1, 2]), w = .5 * l * i * i;
            return q('Energy stored in a magnetic field', `An ideal linear inductor of ${l} mH carries ${i} A. Find the energy stored in its magnetic field.`, [`L = ${l} mH`, `I = ${i} A`], [p('Stored magnetic energy', w, 'mJ')], ['Inductor energy depends on inductance and the square of current.', 'Use W = ½LI² with L in henries for joules.'], [`L = ${l / 1000} H.`, `W = ½LI² = ${fmt(w)} mJ.`], 'Doubling current quadruples the stored magnetic energy.', coilDiagram('L = ' + l + ' mH', `Current = ${i} A`), 'Inductor energy; squared quantities.');
        }
        if (level === 'applied' && type === 0) {
            const n = pick([50, 100, 200]), p1 = pick([.1, .2, .3]), change = pick([.2, .4, .6]), p2 = Number((p1 + change).toFixed(1)), ms = pick([5, 10, 20]), rate = change / ms;
            return q('A changing flux induces a voltage', `The magnetic flux through each of ${n} identical coil turns increases linearly from ${p1} to ${p2} mWb in ${ms} ms. All turns link the same flux. Find the flux-change rate and the magnitude of the induced EMF.`, [`N = ${n}`, `Initial flux = ${p1} mWb`, `Final flux = ${p2} mWb`, `Time = ${ms} ms`], [p('Flux-change rate', rate, 'Wb/s'), p('Induced EMF magnitude', n * rate, 'V')], ['Faraday’s law gives |EMF| = N|dΦ/dt|.', 'With a linear change, dΦ/dt = ΔΦ/Δt. Convert both milliwebers and milliseconds to SI.', 'Multiply the flux-change rate for one turn by the number of linked turns.'], [`dΦ/dt = (${p2}−${p1})×10⁻³ / (${ms}×10⁻³) = ${fmt(rate)} Wb/s.`, `|EMF| = N|dΦ/dt| = ${fmt(n * rate)} V.`], 'Faraday’s law responds to the rate of flux change. Lenz’s law determines the opposing polarity.', fluxDiagram(n, p1, p2, ms), 'Magnetic flux; Faraday’s law; rate of change.');
        }
        if (level === 'applied') {
            const l = pick([20, 50, 100]), r = pick([10, 20, 50]), v = pick([5, 10, 12]), t = pick([1, 2, 5]), tau = l / r, inf = v / r, it = inf * (1 - Math.exp(-t / tau));
            return q('Current cannot jump instantly', `At t = 0, an ideal ${v} V DC source is connected to a series ${r} Ω resistor and ${l} mH inductor. Initial current is zero. Find the RL time constant and current after ${t} ms.`, [`L = ${l} mH`, `R = ${r} Ω`, `Vs = ${v} V`, `Time = ${t} ms`], [p('Time constant', tau, 'ms'), p('Current at the stated time', it, 'A')], ['For an RL circuit, τ = L/R and the final current is Vs/R.', 'Current rises as i(t) = (Vs/R)(1 − exp(−t/τ)).', 'Use the same time unit for t and τ.'], [`τ = L/R = ${fmt(tau)} ms.`, `I∞ = Vs/R = ${fmt(inf)} A.`, `i(${t} ms) = ${fmt(it)} A.`], 'An inductor initially opposes a change in current; after a long time an ideal inductor behaves as a short circuit under DC.', drawing(`<path d="M100 100V60h110m110 0h55m124 0h90v145H100v-45"/><circle cx="100" cy="130" r="30"/>${dcMarks(100, 130)}${dt(100, 83, v + ' V')}${rH(210, 60, r + ' Ω')}${coilH(375, 60, l + ' mH')}${dt(360, 245, 'Switch closes at t = 0; i(0) = 0 A')}`, 'DC step source with series resistor and inductor'), 'RL transients; exponentials; consistent time units.');
        }
        if (type === 0) {
            const n = pick([200, 400, 500]), l = .3, g = pick([.5, 1, 1.5]), area = pick([2, 3, 4]), mur = 1000, b = pick([.2, .3, .4]), flux = b * area * 1e-4, rel = l / (mu0 * mur * area * 1e-4) + g * .001 / (mu0 * area * 1e-4), i = flux * rel / n;
            return q('Drive flux across an air gap', `A linear magnetic core has mean core path length ${l} m (excluding its gap), relative permeability ${mur}, area ${area} cm², and one ${g} mm air gap of the same area. A ${n}-turn winding must produce B = ${b} T. Ignore leakage, fringing, and saturation. Use μ₀ = 4π × 10⁻⁷ H/m. Find the flux, total reluctance, and required current.`, [`N = ${n}`, `Core length = ${l} m`, `Gap = ${g} mm`, `Area = ${area} cm²`, `μr = ${mur}`, `B = ${b} T`], [p('Magnetic flux', flux * 1000, 'mWb'), p('Total reluctance', rel / 1e6, 'MA/Wb'), p('Required current', i, 'A')], ['Flux is B times cross-sectional area. Convert cm² to m².', 'Add core and air-gap reluctances: ℜ = lcore/(μ₀μrA) + lgap/(μ₀A).', 'Magnetomotive force is NI = Φℜ. Solve for current.'], [`Φ = BA = ${fmt(flux * 1000)} mWb.`, `ℜtotal = ${fmt(rel / 1e6)} MA/Wb.`, `I = Φℜ/N = ${fmt(i)} A.`], 'Even a short air gap can dominate the required magnetomotive force because air has much lower permeability than the core.', coreDiagram(n, l, g, area), 'Magnetic circuits; reluctance; flux continuity; area conversion.');
        }
        const l1 = pick([10, 20, 40]), l2 = pick([10, 30, 50]), k = pick([.5, .7, .9]), m = k * Math.sqrt(l1 * l2), eq = l1 + l2 + 2 * m;
        return q('Two coils help each other', `Two linear coupled inductors have L₁ = ${l1} mH, L₂ = ${l2} mH and coupling coefficient k = ${k}. They are connected in series aiding: current enters the dotted terminal of each winding. Find the mutual inductance and equivalent inductance.`, [`L₁ = ${l1} mH`, `L₂ = ${l2} mH`, `k = ${k}`], [p('Mutual inductance M', m, 'mH'), p('Series-aiding inductance', eq, 'mH')], ['Mutual inductance is M = k√(L₁L₂).', 'In series aiding, the mutual contributions add twice: Leq = L₁ + L₂ + 2M.'], [`M = ${k}√(${l1}×${l2}) = ${fmt(m)} mH.`, `Leq = L₁+L₂+2M = ${fmt(eq)} mH.`], 'The dot convention determines whether mutual flux adds to or opposes the self-inductance contribution.', drawing(`<path d="M90 140h70m124 0h130m124 0h80"/>${coilH(160, 140, 'L₁ = ' + l1 + ' mH')}${coilH(414, 140, 'L₂ = ' + l2 + ' mH')}${dot(173, 110)}${dot(427, 110)}<path d="M222 75Q347 10 476 75" stroke-dasharray="6 5"/>${dt(350, 42, 'k = ' + k)}${dt(350, 218, 'Current enters both dotted terminals · series aiding')}`, 'Two magnetically coupled inductors in series with aiding dots on the current-entry side of both windings'), 'Mutual inductance; coupling coefficient; dot convention.');
    }
    if (topic === 'power') {
        if (level === 'foundations' && type === 0) {
            const np = pick([500, 1000, 1500]), ns = pick([50, 100, 200]), vp = pick([120, 230]);
            return q('Change voltage with turns', `An ideal transformer has ${np} primary turns and ${ns} secondary turns. Its primary is supplied with ${vp} V RMS. Find the no-load secondary RMS voltage.`, [`Np = ${np}`, `Ns = ${ns}`, `Vp = ${vp} V RMS`], [p('Secondary RMS voltage', vp * ns / np, 'V')], ['For an ideal transformer, the voltage ratio equals the turns ratio.', 'Use Vs/Vp = Ns/Np.'], [`Ns/Np = ${fmt(ns / np)}.`, `Vs = VpNs/Np = ${fmt(vp * ns / np)} V RMS.`], 'More secondary turns increase secondary voltage; fewer turns decrease it.', transformerDiagram(np, ns, 'No-load secondary; ideal model'), 'Transformer turns ratio; RMS voltage.');
        }
        if (level === 'foundations') {
            const out = pick([20, 40, 60, 100]), eta = pick([.8, .85, .9, .95]);
            return q('Account for conversion losses', `A DC converter supplies ${out} W to its load at an efficiency of ${eta * 100}%. Find the input power required.`, [`Pout = ${out} W`, `Efficiency = ${eta * 100}%`], [p('Required input power', out / eta, 'W')], ['Efficiency is output power divided by input power.', 'Use Pin = Pout/η with η as a fraction, not a percentage.'], [`η = ${eta}.`, `Pin = ${out}/${eta} = ${fmt(out / eta)} W.`], 'The input must provide both useful output power and conversion losses.', drawing(`<path d="M80 110h140m270 0h150M355 150v55"/><rect x="220" y="65" width="270" height="85" rx="5"/>${dt(355, 103, 'DC converter')}${dt(355, 132, 'η = ' + eta * 100 + '%')}${dt(135, 93, 'Pin = ?')}${dt(600, 93, 'Pout = ' + out + ' W')}${dt(355, 234, 'Loss as heat')}`, 'Converter energy-flow diagram with input, useful output and heat loss'), 'Power and efficiency; percentage conversion.');
        }
        if (level === 'applied' && type === 0) {
            const np = 1000, ns = pick([50, 100, 200]), vp = 230, r = pick([10, 20, 50]), vs = vp * ns / np, is = vs / r, ip = vs * is / vp;
            return q('A load reflects through a transformer', `An ideal transformer has Np = ${np}, Ns = ${ns}, and Vp = ${vp} V RMS. A ${r} Ω resistor is connected to the secondary. Ignore magnetising current and all losses. Find secondary voltage, secondary current, and primary current.`, [`Np = ${np}`, `Ns = ${ns}`, `Vp = ${vp} V`, `Load = ${r} Ω`], [p('Secondary voltage', vs, 'V RMS'), p('Secondary current', is, 'A RMS'), p('Primary current', ip, 'A RMS')], ['Use the turns ratio to find secondary voltage.', 'Apply Ohm’s law to the secondary load.', 'Conserve real power in the ideal transformer: VpIp = VsIs.'], [`Vs = VpNs/Np = ${fmt(vs)} V.`, `Is = Vs/R = ${fmt(is)} A.`, `Ip = VsIs/Vp = ${fmt(ip)} A.`], 'An ideal transformer trades voltage for current while conserving power.', transformerDiagram(np, ns, `Vp = ${vp} V RMS · resistive load = ${r} Ω`), 'Transformer ratios; Ohm’s law; ideal power conservation.');
        }
        if (level === 'applied') {
            const v = 230, i = pick([2, 4, 6, 8]), pf = pick([.6, .7, .8, .9]), s = v * i, pw = s * pf, qr = s * Math.sqrt(1 - pf * pf);
            return q('Separate real and reactive power', `A single-phase sinusoidal load draws ${i} A RMS from ${v} V RMS at a lagging power factor of ${pf}. Find apparent power, real power and positive inductive reactive power.`, [`Vrms = ${v} V`, `Irms = ${i} A`, `Power factor = ${pf} lagging`], [p('Apparent power S', s, 'VA'), p('Real power P', pw, 'W'), p('Reactive power Q', qr, 'var')], ['Apparent power S = VrmsIrms.', 'Real power P = S cos φ; the power factor is cos φ.', 'Inductive Q is positive and Q = √(S²−P²).'], [`S = ${v}×${i} = ${s} VA.`, `P = S×pf = ${pw} W.`, `Q = √(S²−P²) = ${fmt(qr)} var.`], 'RMS voltage times RMS current gives apparent power; power factor determines how much is real power.', acPowerDiagram(`230 V RMS · ${i} A RMS · pf = ${pf} lagging`), 'AC sinusoidal power; RMS quantities; power triangle.');
        }
        if (type === 0) {
            const v = 230, f = 50, pw = pick([1000, 1500, 2000]), old = pick([.6, .7, .8]), target = .95, qc = pw * (Math.tan(Math.acos(old)) - Math.tan(Math.acos(target))), c = qc / (2 * Math.PI * f * v * v) * 1e6, inew = pw / (v * target);
            return q('Correct the power factor', `A single-phase ${v} V RMS, ${f} Hz load consumes ${pw} W at power factor ${old} lagging. Add an ideal shunt capacitor to reach ${target} lagging, without changing real load power. Find the required capacitive reactive-power magnitude, capacitance, and new source current.`, [`P = ${pw} W`, `V = ${v} V`, `f = ${f} Hz`, `Initial pf = ${old}`, `Target pf = ${target}`], [p('Capacitive reactive-power magnitude', qc, 'var'), p('Shunt capacitance', c, 'µF'), p('New source current', inew, 'A RMS')], ['Initial Q = P tan(acos(pf)). Compute it for both power factors.', 'The capacitor supplies Qc = Qinitial−Qtarget.', 'For a shunt capacitor, |Qc| = ωCV². New current = P/(V×pftarget).'], [`Qc = P[tan(acos(${old}))−tan(acos(${target}))] = ${fmt(qc)} var.`, `C = Qc/(2πfV²) = ${fmt(c)} µF.`, `Inew = P/(V×${target}) = ${fmt(inew)} A.`], 'The capacitor reduces reactive current drawn from the source; it does not reduce the ideal load’s real power.', acPowerDiagram(`Shunt compensation: pf ${old} → ${target}`), 'AC power triangle; capacitance reactance; power-factor correction.');
        }
        const vin = pick([24, 36, 48]), vo = 12, l = pick([.5, 1, 2]), f = pick([20, 40, 50]), io = pick([1, 2, 3]), d = vo / vin, ripple = (vin - vo) * d / (l * f), imin = io - ripple / 2;
        return q('Size up a buck converter waveform', `An ideal buck converter runs in continuous conduction at ${f} kHz, converting ${vin} V DC to ${vo} V. The inductor is ${l} mH and average load current is ${io} A. Assume negligible output-voltage ripple. Find duty cycle, peak-to-peak inductor-current ripple, and minimum inductor current.`, [`Vin = ${vin} V`, `Vout = ${vo} V`, `L = ${l} mH`, `f = ${f} kHz`, `Iout = ${io} A`], [p('Duty cycle', 100 * d, '%'), p('Inductor ripple, peak to peak', ripple, 'A'), p('Minimum inductor current', imin, 'A')], ['In an ideal CCM buck, D = Vout/Vin.', 'During ON time, vL = Vin−Vout, so ΔI = (Vin−Vout)D/(Lf).', 'The triangular ripple is centred on Iout: Imin = Iout−ΔI/2.'], [`D = ${vo}/${vin} = ${fmt(100 * d)}%.`, `ΔIpp = (Vin−Vout)D/(Lf) = ${fmt(ripple)} A.`, `Imin = Iout−ΔIpp/2 = ${fmt(imin)} A, which is positive and consistent with CCM.`], 'Average voltage follows duty cycle, while inductance and switching frequency determine current ripple.', buckDiagram(vin, vo, l, f), 'Inductor voltage-current law; switching waveforms; continuous conduction.');
    }
    if (level === 'foundations' && type === 0) {
        const n = pick([8, 10, 12]), v = pick([2.5, 3.3, 5]), lsb = v / 2 ** n;
        return q('One count on an ADC', `An ideal ${n}-bit unipolar ADC covers 0 to ${v} V using 2ᴺ equal quantisation intervals. Find the width of one interval (one LSB). Use Vref/2ᴺ, not Vref/(2ᴺ−1).`, [`Resolution = ${n} bits`, `Vref = ${v} V`], [p('One LSB', lsb * 1000, 'mV')], ['N bits provide 2ᴺ distinct codes.', 'Divide the full reference span by the number of intervals.'], [`Intervals = 2^${n} = ${2 ** n}.`, `LSB = ${v}/${2 ** n} = ${fmt(lsb * 1000)} mV.`], 'More bits reduce the ideal voltage interval, but do not by themselves guarantee accuracy.', adcDiagram(n, v), 'Binary code count; voltage resolution.');
    }
    if (level === 'foundations') {
        const slope = .01, offset = .5, t = pick([15, 25, 35, 45, 60]), v = offset + slope * t;
        return q('Turn sensor voltage into temperature', `A linear temperature sensor follows Vout = 0.50 + 0.010T, where voltage is in volts and T is in °C. Its output is ${fmt(v)} V. Find the temperature.`, [`Offset = ${offset} V`, `Sensitivity = 10 mV/°C`, `Measured = ${fmt(v)} V`], [p('Temperature', t, '°C')], ['First subtract the zero-degree output offset.', 'Divide the remaining voltage by the sensitivity in volts per degree.'], [`Vsignal = ${fmt(v)}−0.50 = ${fmt(v - offset)} V.`, `T = Vsignal/0.010 = ${t} °C.`], 'A calibrated offset must be removed before dividing by sensitivity.', drawing(`<path d="M250 125h130m150 0h90"/><rect x="80" y="65" width="170" height="120" rx="5"/><rect x="380" y="85" width="150" height="80" rx="5"/>${dt(165, 115, 'Temperature')}${dt(165, 145, 'sensor')}${dt(455, 130, fmt(v) + ' V')}${dt(360, 230, 'Vout = 0.50 V + (0.010 V/°C) × T')}`, 'Temperature sensor and voltmeter with the calibration equation shown'), 'Linear sensor calibration; offsets and sensitivity.');
    }
    if (level === 'applied' && type === 0) {
        const i = pick([1, 2, 4, 5]), r = pick([10, 20, 50]), v = i * r, pw = i * i * r;
        return q('Measure current with a shunt', `A ${r} mΩ ideal shunt resistor carries ${i} A DC. An ideal voltmeter measures its voltage. Find the shunt voltage and power dissipation.`, [`Current = ${i} A`, `Shunt = ${r} mΩ`], [p('Shunt voltage', v, 'mV'), p('Shunt dissipation', pw, 'mW')], ['The shunt obeys Ohm’s law, V = IR.', 'Its power dissipation is I²R. Keep milliohms separate from ohms.'], [`V = ${i}×${r / 1000} = ${fmt(v)} mV.`, `P = I²R = ${fmt(pw)} mW.`], 'A larger shunt gives a stronger voltage signal but causes more voltage drop and heating.', shuntDiagram(i, r), 'Ohm’s law; electrical power; milli-unit conversions.');
    }
    if (level === 'applied') {
        const v = pick([5, 10, 12]), r = pick([100, 220, 470]), meter = 1000, lower = r * meter / (r + meter), read = v * lower / (r + lower), ideal = v / 2, error = 100 * (ideal - read) / ideal;
        return q('The meter changes the measurement', `Two equal ${r} kΩ resistors form a divider across an ideal ${v} V source. A voltmeter with input resistance ${meter} kΩ is connected across the lower resistor. Find the indicated voltage and percentage under-reading relative to an infinite-resistance meter.`, [`Vs = ${v} V`, `Each R = ${r} kΩ`, `Meter = ${meter} kΩ`], [p('Meter reading', read, 'V'), p('Percentage under-reading', error, '%')], ['The meter input resistance is in parallel with the lower resistor.', 'Use Rlower = R∥Rmeter in the divider formula.', 'The unloaded output is Vs/2. Compare the loaded reading with this value.'], [`Rlower = ${fmt(lower)} kΩ.`, `Vread = VsRlower/(R+Rlower) = ${fmt(read)} V.`, `Under-reading = 100(Vs/2−Vread)/(Vs/2) = ${fmt(error)}%.`], 'A measuring instrument becomes part of the circuit. High source resistance makes loading more significant.', loadedDividerDiagram(v, r, r, meter), 'Parallel resistance; divider loading; measurement error.');
    }
    if (type === 0) {
        const lo = pick([.2, .4, .5]), hi = pick([1, 1.2, 1.5]), outlo = .1, outhi = 3.1, n = 12, ref = 3.3, gain = (outhi - outlo) / (hi - lo), offset = outlo - gain * lo, lsb = ref / 2 ** n / gain * 1000;
        return q('Fit a sensor into an ADC range', `A sensor spans ${lo} to ${hi} V. An ideal linear conditioning stage must map these endpoints to 0.10 and 3.10 V for a ${n}-bit, ${ref} V ADC. Use Vadc = GVsensor + b. Find G, b, and one ADC interval referred back to the sensor input. The ADC interval convention is Vref/2ᴺ.`, [`Sensor min = ${lo} V`, `Sensor max = ${hi} V`, `ADC min = 0.10 V`, `ADC max = 3.10 V`, `Resolution = ${n} bits`], [p('Gain G', gain, 'V/V'), p('Output offset b', offset, 'V'), p('Sensor-referred ADC interval', lsb, 'mV')], ['Use the change in output span divided by the change in sensor span to find gain.', 'Insert either endpoint into Vadc = GVsensor+b to find b.', 'Divide the ADC voltage interval by G to refer it to the sensor input.'], [`G = (3.10−0.10)/(${hi}−${lo}) = ${fmt(gain)}.`, `b = 0.10−G×${lo} = ${fmt(offset)} V.`, `Input-referred interval = (3.3/4096)/G = ${fmt(lsb)} mV.`], 'Gain improves use of the ADC span, but a gain and offset stage must also stay within its own output limits.', drawing(`<path d="M40 125h120m200 0h75m180 0h65"/><rect x="160" y="70" width="200" height="110" rx="5"/><rect x="435" y="70" width="180" height="110" rx="5"/>${dt(260, 112, 'Gain + offset')}${dt(260, 143, 'G · Vsensor + b')}${dt(525, 112, '12-bit ADC')}${dt(525, 143, 'Vref = 3.3 V')}${dt(95, 102, lo + '–' + hi + ' V')}${dt(395, 210, 'Required ADC input: 0.10–3.10 V')}`, 'Sensor voltage passing through gain/offset conditioning into a 12-bit ADC'), 'Linear calibration; gain and offset; input-referred resolution.');
    }
    const r = 350, gf = 2, strain = pick([250, 500, 750, 1000]), v = 5, d = gf * strain * 1e-6, va = v / 2, vb = v * (1 + d) / (2 + d), diff = vb - va, target = 1, gain = target / diff;
    return q('Read a strain-gauge bridge', `A Wheatstone bridge is excited by ${v} V. Three resistors are ${r} Ω; the lower-right resistor is an active strain gauge with Rg = R(1+GF·ε), GF = ${gf}, and tensile strain ε = ${strain} µε. The left midpoint is VA and right midpoint VB. Find the signed differential VB−VA and ideal differential-amplifier gain needed for a +${target} V output. Ignore loading and lead resistance.`, [`Excitation = ${v} V`, `R = ${r} Ω`, `Gauge factor = ${gf}`, `Strain = ${strain} µε`], [p('Bridge differential VB−VA', diff * 1000, 'mV'), p('Required differential gain', gain, 'V/V')], ['Convert microstrain to dimensionless strain, then calculate the active gauge resistance.', 'Find each midpoint with the voltage-divider rule. Use the exact ratio, not a small-strain approximation.', 'Use positive gain = target output/(VB−VA), converting millivolts to volts.'], [`Rg = ${r}(1+${gf}×${strain}×10⁻⁶) = ${fmt(r * (1 + d))} Ω.`, `VA = ${va} V; VB = ${fmt(vb)} V.`, `VB−VA = ${fmt(diff * 1000)} mV.`, `Gain = ${target}/(VB−VA) = ${fmt(gain)} V/V.`], 'A bridge turns a small resistance change into a differential voltage that can be amplified.', bridgeDiagram(r, strain), 'Resistance strain gauges; Wheatstone bridges; differential gain.');
}
function enhanceDiagram(e) {
    const v = e.givens.map(x => Number(x.match(/= ([\d.]+)/)?.[1]));
    if (e.title === 'Give an LED some resistance')
        e.diagram = ledDiagram(v[0], v[1], v[2]);
    if (e.title === 'A little signal, amplified')
        e.diagram = opampDiagram(false, `Rf ${v[0]} kΩ`, `Rg ${v[1]} kΩ`, `${v[2]} V`);
    if (e.title === 'How quickly does it charge?')
        e.diagram = rcDiagram(`${v[0]} kΩ`, `${v[1]} µF`, 'DC step', 'charge');
    if (e.title === 'A capacitor reaches a threshold')
        e.diagram = rcDiagram(`${v[0]} kΩ`, `${v[1]} µF`, `${v[2]} V`, 'charge');
    if (e.title === 'Amplification meets its limits')
        e.diagram = opampDiagram(true, `Rf ${v[1]} kΩ`, `Rin ${v[0]} kΩ`, `${v[2]} V`);
    if (e.title === 'When the divider gets loaded')
        e.diagram = loadedDividerDiagram(...v);
    if (e.title === 'A filter changes amplitude and phase')
        e.diagram = rcDiagram(`${v[0]} kΩ`, `${v[1]} nF`, `${v[2]} Hz`);
    if (e.title === 'Design a low-pass to a target')
        e.diagram = rcDiagram(`${v[0]} kΩ`, 'C = ?', `${v[1]} Hz`);
    if (e.title === 'What feedback changes') {
        const coeff = e.givens[0].match(/= (\d+)\/\((\d+)s/);
        if (coeff)
            e.diagram = feedbackDiagram('Kp = ' + v[1], `${coeff[1]}/(${coeff[2]}s + 1)`);
    }
    if (e.title === 'Closing the loop') {
        const coeff = e.givens[0].match(/= (\d+)\//);
        if (coeff)
            e.diagram = feedbackDiagram('1', `${coeff[1]}/(s + 1)`);
    }
    if (e.title === 'Place the poles with a PI controller') {
        const a = e.givens[0].match(/s \+ (\d+)/)?.[1];
        e.diagram = feedbackDiagram('Kp + Ki/s', `1/(s + ${a})`);
    }
    return e;
}
