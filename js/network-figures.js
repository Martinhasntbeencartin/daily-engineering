function coaxLine(len, a, b, er) {
    const section = '<circle cx="120" cy="121" r="66" fill="#d5e0d8"/>' +
        '<circle cx="120" cy="121" r="57" fill="#fffdf7"/><circle cx="120" cy="121" r="14" fill="#bd764b"/>' +
        arrow(120, 121, 159, 80) + dt(133, 88, 'b') + wire('M107 124l-23 31H65') + dt(56, 162, 'a');
    const cable = '<path d="M316 92h170v48H316z" fill="#edf1e9" stroke="none"/>' +
        wire('M316 92h170M316 140h170') + wire('M255 116H554') + wire('M316 92q-12 8 -10 17m1 14q2 12 9 17M486 92q12 8 10 17m-1 14q-2 12 -9 17') +
        wire('M255 177h61v-37M486 140v37h68');
    return drawing(section + dt(120, 221, `a = ${fmt(a * 1000)} mm · b = ${fmt(b * 1000)} mm`) + guide('M216 44v173') +
        cable + ring(250, 116, 5) + ring(250, 177, 5) +
        dt(263, 91, 'Input') + dt(398, 72, 'Outer shield') + dt(400, 171, 'εᵣ = ' + er) + element('R', 554, 116, 554, 177) +
        note(581, 149, '75 + j25 Ω') + dt(607, 179, 'Load') +
        wire('M316 204v10m0 -5h170m0 -5v10') + dt(401, 241, 'ℓ = ' + len + ' m'),
        'Coaxial line, inner radius a and shield inner radius b. The centre conductor and shield connect the input to a 75 + j25 ohm load over ' + len + ' m.');
}
function lossyLine(len) {
    return drawing(ring(60, 85, 5) + ring(60, 220, 5) + element('R', 65, 85, 200, 85, 'R′ Δz') +
        element('L', 200, 85, 338, 85, 'L′ Δz') + wire('M338 85H445m60 0h75M65 220H445m60 0h75') +
        element('R', 338, 85, 338, 220) + dt(278, 160, '1/(G′ Δz)') + element('C', 445, 85, 445, 220, 'C′ Δz') +
        dot(338, 85) + dot(445, 85) + dt(477, 90, '⋯') + dt(477, 226, '⋯') +
        element('R', 580, 85, 580, 220, 'Zʟ') + dt(360, 270, 'Repeated RLGC sections over ℓ = ' + len + ' m') +
        dt(580, 57, '75 − j25 Ω'), 'Differential lossy transmission-line section with series R and L, parallel conductance and capacitance, and terminating load.', 300);
}
function feederDiagram(vll, zf, zl) {
    return drawing(element('AC', 124, 83, 124, 210) + dt(125, 43, 'Vₐₙ = ' + vll + '/√3 ∠0° V') +
        element('R', 124, 83, 330, 83, zf.re + ' Ω') + element('L', 330, 83, 530, 83, 'j' + zf.im + ' Ω') +
        element('R', 530, 83, 530, 210, zl.re + ' + j' + zl.im + ' Ω') +
        wire('M124 210H530') + dot(530, 83) + ground(124, 210) + dt(530, 64, 'Load bus') +
        dt(335, 240, 'Neutral return') + arrow(235, 123, 310, 123) + dt(275, 151, 'Iₐ'),
        'One phase of the balanced feeder. The phase source drives the feeder resistance and reactance in series with the phase load.');
}
function boostInput(po) {
    return drawing(element('DC', 72, 80, 72, 216) + dt(72, 56, '24 V') +
        element('R', 72, 80, 235, 80, '0.8 Ω') + element('C', 235, 80, 235, 216, 'Cᵢₙ') +
        element('L', 235, 80, 400, 80, 'L') + element('diode', 400, 80, 505, 80) + wire('M505 80H585') +
        wire('M400 80v48m0 38v50M400 166l-18 -35M72 216H585') +
        dot(235, 80) + dt(235, 56, 'Vᵢₙ') + dot(400, 80) + dt(430, 158, 'S') +
        element('C', 505, 80, 505, 216, 'Cₒ') + dot(505, 80) +
        element('R', 585, 80, 585, 216, po + ' W') + dt(585, 57, '48 V') + ground(235, 216),
        'Boost converter supplied through a source resistance. Input and output capacitors share the return with the switch and regulated load.');
}
function tiaDiagram(rf) {
    return drawing(wire('M355 126v92l85 -46zM225 148H355M440 172h165M355 196h-40v27M225 56v92M536 56v116') +
        dt(368, 153, '−') + dt(368, 200, '+') + ground(315, 223) +
        element('R', 225, 56, 536, 56, 'Rf = ' + rf + ' kΩ') + element('C', 225, 99, 536, 99) + dt(411, 94, 'Cf') +
        element('I', 110, 235, 110, 148, 'Iᵢₙ') + wire('M110 148H225') + ground(110, 235) +
        element('C', 225, 148, 225, 235) + dt(261, 196, 'Cᵢₙ') + ground(225, 235) +
        dot(225, 148) + dot(536, 172) + dt(605, 155, 'Vₒᵤₜ'),
        'Photodiode current and input capacitance meet at the inverting node, with Rf and Cf in parallel from output to input.', 280);
}
function shuntAmplifier(vout) {
    return drawing(arrow(60, 90, 110, 90) + element('R', 110, 90, 315, 90, '50 mΩ') +
        wire('M315 90h45M129 90v112h267M287 90v68h109M396 133v96l96 -48zM492 181h100') +
        dot(129, 90) + dot(287, 90) + dt(413, 206, '+') + dt(413, 163, '−') +
        dt(438, 187, '20') + dt(75, 72, 'I') + dt(590, 163, vout + ' V') +
        dt(360, 264, 'Differential sensing · output offset 10 mV'),
        'Current crosses a shunt left to right. A differential amplifier senses both terminals and adds an output offset.', 288);
}
function stateFeedback(label) {
    return drawing(arrow(124, 95, 244, 95) + dt(160, 74, 'u') +
        wire('M244 60h225v70H244z') + dt(356, 103, 'ẋ = Ax + Bu') +
        arrow(469, 95, 610, 95) + dt(600, 74, 'x') + dot(540, 95) +
        wire('M540 95v98H417M302 193H124V95M302 166h115v54H302z') +
        dt(360, 201, '−K') + arrow(470, 193, 418, 193) + dt(360, 257, label),
        'State feedback returns the measured state through negative gain K to the plant input.', 282);
}

function calibrationDiagram(currents, voltages, uncertainties) {
    const x = i => 115 + i * 58, y = v => 224 - 48 * v;
    let body = arrow(115, 224, 115, 24) + arrow(115, 224, 622, 224);
    for (let v = 0; v <= 4; v++) body += wire(`M109 ${y(v)}h6`) + dt(92, y(v) + 5, String(v));
    currents.forEach((current, i) => {
        const px = x(current), py = y(voltages[i]), hi = y(voltages[i] + uncertainties[i]), lo = y(voltages[i] - uncertainties[i]);
        body += wire(`M${px} ${hi}V${lo}M${px - 6} ${hi}h12M${px - 6} ${lo}h12`) + dot(px, py);
        body += dt(px, 247, String(current));
    });
    return drawing(body + note(132, 33, 'Voltage (V)') + dt(370, 278, 'Reference current (A)'),
        'Measured voltage versus reference current, with vertical bars spanning one standard uncertainty on each side.', 302);
}

function synchronizerDiagram(tau) {
    let body = '';
    for (const x of [170, 464]) {
        body += wire(`M${x} 65h92v90h-92zM${x + 34} 155l12 -13 12 13`) +
            dt(x + 17, 110, 'D') + dt(x + 75, 110, 'Q');
    }
    return drawing(body + arrow(77, 104, 170, 104) + arrow(262, 104, 308, 104) +
        wire('M308 86h104v36H308z') + dt(360, 110, 'Logic') + arrow(412, 104, 464, 104) +
        arrow(556, 104, 641, 104) + wire('M100 202h410v-47M216 202v-47') + dot(216, 202) +
        dt(76, 84, 'Async in') + dt(636, 84, 'Sync out') + dt(82, 226, 'Clock') +
        dt(360, 48, 'Delay between registers') + dt(360, 252, 'Compare 1.5 ns of logic delay with a direct Q-to-D wire · τ = ' + tau + ' ps'),
        'Clocked D flip-flops with optional combinational delay on the Q-to-D path.', 280);
}
function crcDiagram(bytes, poly) {
    const words = bytes.map(b => b.toString(2).padStart(8, '0')).concat('????????');
    let body = '';
    words.forEach((word, j) => {
        const start = 55 + 205 * j;
        [...word].forEach((bit, i) => {
            const x = start + 24 * i;
            body += wire(`M${x} 88h24v40h-24z`) + dt(x + 12, 115, bit);
        });
        body += dt(start + 96, 66, j === 2 ? 'CRC byte' : 'Message byte ' + (j + 1));
    });
    return drawing(body + arrow(55, 166, 657, 166) + dt(360, 200, 'MSB first · generator 0x' + poly.toString(16).toUpperCase().padStart(2, '0')),
        'Two message bytes transmitted most-significant bit first, followed by eight check bits.', 228);
}
function biquadDiagram(fs, fc) {
    // Direct form II: the centre column holds the two delayed internal states.
    let body = arrow(65, 68, 164, 68) + ring(185, 68, 20) + dt(185, 75, 'Σ') +
        wire('M205 68H330') + dot(330, 68) + arrow(330, 68, 528, 68) + dt(426, 54, 'b₀') +
        ring(550, 68, 21) + dt(550, 75, 'Σ') + arrow(571, 68, 659, 68) +
        dt(66, 48, 'x[n]') + dt(658, 48, 'y[n]');
    for (const [i, y] of [165, 267].entries()) {
        const top = y - 78;
        body += wire(`M330 ${top - 20}v20m-31 0h62v39h-62zM330 ${top + 39}V${y}`) +
            dt(330, top + 26, 'z⁻¹') + dot(330, y);
        const left = 201 - i * 32, right = 534 + i * 32;
        body += wire(`M330 ${y}H${left}M330 ${y}H${right}`) +
            arrow(left, y, left, 84) + arrow(right, y, right, 84) +
            dt(258, y - 10, i ? '−a₂' : '−a₁') + dt(431, y - 10, i ? 'b₀' : '2b₀');
    }
    return drawing(body + dt(360, 311, 'Two unit delays · sampling ' + fs + ' Hz · cutoff ' + fc + ' Hz'),
        'Second-order filter with feedback taps minus a₁ and minus a₂ and feedforward taps b₀, 2b₀ and b₀.', 336);
}
function pumpDiagram(D, L, Q, lift) {
    return drawing(wire('M74 156v60h121v-60M74 175h121M520 42v62h116V42M520 63h116') +
        wire('M151 197h84M285 197h38l169 -106h59') + ring(260, 197, 25) +
        wire('M244 180l39 17 -39 17z') + arrow(367, 166, 420, 133) +
        guide('M197 175h303M498 63h20') + wire('M495 63v112m-5 -112h10m-10 112h10') +
        note(507, 147, 'Δz = ' + lift + ' m') + dt(260, 249, 'Pump') +
        dt(328, 60, 'L = ' + L + ' m · D = ' + D + ' mm') + dt(331, 100, 'Q = ' + Q + ' L/s'),
        'A pump carries water from the lower reservoir to an upper reservoir with a lift of ' + lift + ' m.', 275);
}

function samplingDiagram(finMHz, jitterFs, osr) {
    const at = t => 114 - 58 * Math.sin(2 * Math.PI * finMHz * t / 1000);
    let signal = '';
    for (let t = 0; t <= 40; t += 0.1)
        signal += (signal ? 'L' : 'M') + (85 + 13 * t).toFixed(1) + ' ' + at(t).toFixed(1);
    let samples = '';
    for (let t = 0; t <= 40; t += 4) {
        const x = 85 + 13 * t, y = at(t);
        samples += guide(`M${x} 192V${y}`) + dot(x, y);
    }
    return drawing(wire('M85 40v152h550') + wire(signal) + samples +
        dt(85, 216, '0') + dt(605, 216, '40 ns') + dt(360, 30, finMHz + ' MHz input · 250 MS/s') +
        dt(360, 255, 'Clock jitter ' + fmt(jitterFs) + ' fs RMS · decimation by ' + osr),
        'Full-scale input sine and its sample instants spaced four nanoseconds apart.', 277);
}
