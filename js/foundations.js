/* Original, deterministic practice questions. All calculations use SI units unless labelled. */
const TOPICS = [{
    id: 'circuits', name: 'Circuit analysis', sub: 'Voltage, current & resistance', icon: '⌁', group: 'electrical'
}, {
    id: 'electronics', name: 'Electronics', sub: 'Components & amplifiers', icon: '⋈', group: 'electrical'
}, {
    id: 'signals', name: 'Signals & systems', sub: 'Waves, sampling & frequency', icon: '∿', group: 'electrical'
}, {
    id: 'control', name: 'Control systems', sub: 'Feedback & dynamic response', icon: '⊞', group: 'electrical'
}];
const fmt = n => Number(n.toPrecision(5)).toString();
const svg = (body, label) => `<svg viewBox="0 0 600 210" role="img" aria-label="${label}"><g fill="none" stroke="#315740" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const txt = (x, y, t) => `<text x="${x}" y="${y}" stroke="none" text-anchor="middle">${t}</text>`;
const resistor = (x, y) => `<path d="M${x} ${y}h20l6 -10 10 20 10 -20 10 20 10 -20 10 20 6 -10h20"/>`;
function circuit(type, v, r1, r2) {
    return svg(`<path d="M95 75V40H200M302 40H480V170M95 170V125"/><circle cx="95" cy="100" r="25"/><path d="M87 91h16m-8 -8v16m-8 13h16"/>${txt(46, 106, v + ' V')}${resistor(200, 40)}${txt(250, 22, 'R₁ = ' + r1 + ' Ω')}${type === 'series' ? `<path d="M480 170H352M250 170H95"/>${resistor(250, 170)}${txt(300, 203, 'R₂ = ' + r2 + ' Ω')}` : `<path d="M360 40v40m0 50v40"/><rect x="350" y="80" width="20" height="50"/>${txt(420, 109, 'R₂ = ' + r2 + ' Ω')}<circle cx="360" cy="40" r="4" fill="#315740"/>${txt(436, 24, 'Vout')}`}`, 'Circuit with a DC voltage source and two resistors');
}
function divider(v, r1, r2) {
    return svg(`<circle cx="110" cy="105" r="25"/><path d="M110 80V38H235m102 0h93v55m0 50v35H110v-48"/>${resistor(235, 38)}<rect x="420" y="93" width="20" height="50"/><path d="M430 77h70"/><circle cx="430" cy="77" r="4" fill="#315740"/>${txt(64, 110, v + ' V')}${txt(286, 23, 'R₁ = ' + r1 + ' Ω')}${txt(497, 126, 'R₂ = ' + r2 + ' Ω')}${txt(510, 65, 'Vout')}${txt(285, 204, 'Reference: bottom wire = 0 V')}`, 'Unloaded voltage divider; output is across resistor R2');
}
function parallel(v, r1, r2) {
    return svg(`<circle cx="100" cy="105" r="25"/><path d="M100 80V40H460V80M100 130v45h360v-45M285 40v40m0 50v45"/><rect x="275" y="80" width="20" height="50"/><rect x="450" y="80" width="20" height="50"/>${txt(55, 110, v + ' V')}${txt(350, 108, r1 + ' Ω')}${txt(515, 108, r2 + ' Ω')}${txt(280, 204, 'Both branches share the same voltage')}`, 'Two resistors connected in parallel across a DC source');
}
function block(label, sub) {
    return svg(`<path d="M55 105h115m260 0h115"/><rect x="170" y="60" width="260" height="90" rx="6"/><circle cx="55" cy="105" r="4" fill="#315740"/><circle cx="545" cy="105" r="4" fill="#315740"/>${txt(300, 100, label)}${txt(300, 127, sub)}${txt(100, 87, 'Input')}${txt(497, 87, 'Output')}`, label + ' ' + sub);
}
function wave(label) {
    let path = '';
    for (let x = 50; x <= 550; x += 2)
        path += (x === 50 ? 'M' : 'L') + x + ' ' + (105 - 48 * Math.sin((x - 50) / 500 * 4 * Math.PI));
    return svg(`<path d="M40 105h520M50 175V30" stroke="#aab9a0"/><path d="${path}"/>${txt(300, 195, label)}${txt(30, 40, 'x')}${txt(565, 125, 't')}`, 'Sinusoidal signal, ' + label);
}
function makeFoundationExercise(topic, date) {
    const day = Math.floor(Date.UTC(...date.split('-').map((n, i) => i === 1 ? Number(n) - 1 : Number(n))) / 86400000);
    const idx = TOPICS.findIndex(t => t.id === topic), type = ((day + idx) % 3 + 3) % 3;
    let seed = (day * 2654435761 + idx * 7919) >>> 0;
    const pick = a => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return a[seed % a.length];
    };
    const q = (title, text, answer, unit, givens, hints, steps, idea, diagram, level='Foundations') => ({
        title, text, answer, unit, givens, hints, steps, idea, diagram, level,
        minutes: level === 'Foundations' ? '5–8 min' : '8–12 min'
    });
    if (topic === 'circuits') {
        const v = pick([6, 9, 12, 18, 24]), r1 = pick([100, 220, 330, 470]), r2 = pick([100, 220, 330, 680]);
        if (type === 0)
            return q('A split in potential', `An ideal ${v} V source supplies two resistors in series. Find the unloaded output voltage across R₂, measured relative to the bottom wire.`, v * r2 / (r1 + r2), 'V', [`Vs = ${v} V`, `R₁ = ${r1} Ω`, `R₂ = ${r2} Ω`], ['The same current flows through both resistors. Find the total resistance first.', 'Use I = Vs / (R₁ + R₂), then Vout = I × R₂.'], [`Rtotal = ${r1} + ${r2} = ${r1 + r2} Ω.`, `I = ${v} / ${r1 + r2} = ${fmt(v / (r1 + r2))} A.`, `Vout = I × R₂ = ${fmt(v * r2 / (r1 + r2))} V.`], 'In a series circuit, the larger resistor gets the larger share of the source voltage.', divider(v, r1, r2));
        if (type === 1)
            return q('Two paths, one source', `Two resistors are connected in parallel across an ideal ${v} V source. What total current does the source supply?`, 1000 * v * (1 / r1 + 1 / r2), 'mA', [`Vs = ${v} V`, `R₁ = ${r1} Ω`, `R₂ = ${r2} Ω`], ['Each branch has the full source voltage across it.', 'Find each branch current with Ohm’s law and add them. Convert amperes to milliamperes.'], [`I₁ = ${v}/${r1} = ${fmt(v / r1)} A.`, `I₂ = ${v}/${r2} = ${fmt(v / r2)} A.`, `Is = I₁ + I₂ = ${fmt(1000 * v * (1 / r1 + 1 / r2))} mA.`], 'Adding a parallel branch increases the current demanded from an ideal voltage source.', parallel(v, r1, r2));
        return q('Where does the power go?', `Two resistors are in series across a ${v} V source. Calculate the power dissipated in R₂.`, 1000 * (v / (r1 + r2)) ** 2 * r2, 'mW', [`Vs = ${v} V`, `R₁ = ${r1} Ω`, `R₂ = ${r2} Ω`], ['Find the current through the series circuit.', 'The power in R₂ is I²R₂. Multiply watts by 1000 for milliwatts.'], [`I = ${v}/(${r1}+${r2}) = ${fmt(v / (r1 + r2))} A.`, `P₂ = I²R₂ = ${fmt((v / (r1 + r2)) ** 2 * r2)} W.`, `P₂ = ${fmt(1000 * (v / (r1 + r2)) ** 2 * r2)} mW.`], 'Power depends on the square of current: doubling current quadruples resistive heating.', circuit('series', v, r1, r2), 'Building intuition');
    }
    if (topic === 'electronics') {
        if (type === 0) {
            const vs = pick([5, 9, 12]), vf = pick([1.8, 2, 2.2]), i = pick([5, 10, 15, 20]);
            return q('Give an LED some resistance', `An LED with a constant forward voltage of ${vf} V is connected to a ${vs} V supply through a series resistor. Find the theoretical resistance for ${i} mA. You do not need to choose a standard resistor value.`, (vs - vf) / (i / 1000), 'Ω', [`Vs = ${vs} V`, `Vf = ${vf} V`, `I = ${i} mA`], ['The resistor drops the supply voltage minus the LED forward voltage.', 'Use R = (Vs − Vf) / I. Convert milliamperes to amperes.'], [`VR = ${vs} − ${vf} = ${fmt(vs - vf)} V.`, `I = ${i / 1000} A.`, `R = ${fmt(vs - vf)} / ${i / 1000} = ${fmt((vs - vf) / (i / 1000))} Ω.`], 'A small change in LED voltage can cause a large current change; a resistor limits the current.', block('Supply → resistor → LED', `${vs} V supply · ${vf} V LED · ${i} mA`));
        }
        if (type === 1) {
            const rf = pick([20, 30, 40, 50]), rg = 10, vin = pick([.1, .2, .3, .4]);
            return q('A little signal, amplified', `An ideal non-inverting op-amp has Rf = ${rf} kΩ from output to the inverting input and Rg = ${rg} kΩ from that input to ground. Vin = ${vin} V is applied to the non-inverting input. Assume ±12 V supplies and linear operation. Find Vout.`, (1 + rf / rg) * vin, 'V', [`Rf = ${rf} kΩ`, `Rg = ${rg} kΩ`, `Vin = ${vin} V`], ['The closed-loop gain of a non-inverting amplifier is greater than or equal to one.', 'Use Av = 1 + Rf/Rg, then Vout = Av × Vin.'], [`Av = 1 + ${rf}/${rg} = ${1 + rf / rg}.`, `Vout = ${1 + rf / rg} × ${vin} = ${fmt((1 + rf / rg) * vin)} V.`], 'Negative feedback makes the gain depend mainly on the resistor ratio.', block('Non-inverting amplifier', `Rf = ${rf} kΩ · Rg = ${rg} kΩ`), 'Building intuition');
        }
        const r = pick([1, 2.2, 4.7, 10]), c = pick([10, 22, 47, 100]);
        return q('How quickly does it charge?', `An initially uncharged capacitor is charged through a ${r} kΩ resistor from an ideal DC source. The capacitance is ${c} µF. What is the RC time constant?`, r * c, 'ms', [`R = ${r} kΩ`, `C = ${c} µF`], ['The time constant depends on resistance and capacitance, not source voltage.', 'Use τ = RC. kΩ × µF gives milliseconds.'], [`R = ${r * 1000} Ω and C = ${c} × 10⁻⁶ F.`, `τ = RC = ${fmt(r * c / 1000)} s = ${fmt(r * c)} ms.`], 'After one time constant, an initially uncharged capacitor reaches about 63.2% of its final voltage.', block('RC charging circuit', `R = ${r} kΩ · C = ${c} µF`));
    }
    if (topic === 'signals') {
        if (type === 0) {
            const f = pick([50, 100, 200, 250, 400, 1000]);
            return q('Time for one cycle', `A sinusoidal voltage has a frequency of ${f} Hz. How long does one complete cycle take?`, 1000 / f, 'ms', [`f = ${f} Hz`], ['Frequency counts cycles per second; period measures seconds per cycle.', 'Use T = 1/f, then convert seconds to milliseconds.'], [`T = 1/${f} = ${fmt(1 / f)} s.`, `T = ${fmt(1000 / f)} ms.`], 'Higher frequency means less time per cycle.', wave(`f = ${f} Hz`));
        }
        if (type === 1) {
            const peak = pick([5, 10, 12, 20, 24]);
            return q('The effective voltage', `A pure sine wave with zero DC offset has a peak voltage of ${peak} V. Find its RMS voltage.`, peak / Math.sqrt(2), 'V', [`Vpeak = ${peak} V`, `DC offset = 0 V`], ['RMS voltage tells you the equivalent heating effect of a DC voltage across a resistor.', 'For a sine wave, Vrms = Vpeak / √2.'], [`Vrms = ${peak}/√2.`, `Vrms = ${fmt(peak / Math.sqrt(2))} V.`], 'The √2 relationship is specific to a sine wave; different waveforms have different RMS factors.', wave(`Vpeak = ${peak} V`));
        }
        const f = pick([4000, 6000, 8000, 10000]), fs = pick([32000, 48000]);
        return q('Caught between samples', `An ideal band-limited signal contains frequencies up to ${f / 1000} kHz and is sampled at ${fs / 1000} kHz. How many samples are taken per cycle of its highest-frequency component?`, fs / f, 'samples/cycle', [`fmax = ${f / 1000} kHz`, `fs = ${fs / 1000} kHz`], ['Compare how many samples occur each second with how many cycles occur each second.', 'Samples per cycle = fs / fmax.'], [`N = fs/fmax = ${fs}/${f}.`, `N = ${fmt(fs / f)} samples per cycle.`], 'More samples per cycle describe a waveform more finely. Real sampling systems also need anti-aliasing filters.', wave(`fs = ${fs / 1000} kHz · fmax = ${f / 1000} kHz`), 'Building intuition');
    }
    if (topic === 'control') {
        if (type === 0) {
            const k = pick([2, 3, 4, 5]), u = pick([1, 2, 3]);
            return q('Where will it settle?', `A stable first-order system has G(s) = ${k}/(2s + 1). Starting from rest, its input steps from 0 to ${u}. What is the steady-state output?`, k * u, '', [`G(s) = ${k}/(2s + 1)`, `Step amplitude = ${u}`], ['At steady state, evaluate the transfer function at s = 0.', 'Multiply the DC gain G(0) by the input step amplitude.'], [`G(0) = ${k}/1 = ${k}.`, `y∞ = G(0) × ${u} = ${k * u}.`], 'The DC gain sets the final output. The time constant controls how quickly the system gets there.', block(`G(s) = ${k}/(2s + 1)`, `Input step = ${u}`));
        }
        if (type === 1) {
            const tau = pick([.2, .5, 1, 2, 3]);
            return q('Reading the response', `A stable first-order system has G(s) = 1/(${tau}s + 1). How long after a step does the output complete approximately 63.2% of its total change?`, tau, 's', [`G(s) = 1/(${tau}s + 1)`], ['A first-order response reaches about 63.2% after one time constant.', 'Compare the denominator with τs + 1.'], [`The standard form is G(s) = K/(τs + 1).`, `Here τ = ${tau} s, so t = ${tau} s.`], 'A first-order response approaches its final value gradually: about 95% after three time constants.', block(`G(s) = 1/(${tau}s + 1)`, 'Find the time constant'));
        }
        const k = pick([2, 4, 9, 19]);
        return q('Closing the loop', `A system has forward transfer function G(s) = ${k}/(s + 1) and unity negative feedback. For a unit-step reference and zero initial conditions, find the steady-state tracking error.`, 1 / (1 + k), '', [`G(s) = ${k}/(s + 1)`, `H(s) = 1`, `Reference step = 1`], ['With unity negative feedback, e = r − y and y = Ge.', 'The steady-state error for this stable system is e∞ = 1/(1 + G(0)).'], [`G(0) = ${k}.`, `e∞ = 1/(1+${k}) = ${fmt(1 / (1 + k))}.`], 'Increasing proportional loop gain reduces steady-state error, but a finite gain does not remove it entirely.', block(`G(s) = ${k}/(s + 1)`, 'Unity negative feedback'), 'Building intuition');
    }
    throw new Error('Unknown discipline: ' + topic);
}
