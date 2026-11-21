function seriesRlc() {
    return drawing(element('DC', 100, 80, 100, 195, '1 V') + element('R', 100, 80, 307, 80, 'R') +
        element('L', 307, 80, 520, 80, '1 H') + element('C', 520, 80, 520, 195, '1 F') +
        wire('M520 195H100') + ground(100, 195), 'Step source driving a series resistor, inductor and capacitor.');
}
function bitWord(bits, labels, caption) {
    const width = Math.min(74, 560 / bits.length), left = (720 - bits.length * width) / 2;
    let body = '';
    bits.forEach((bit, i) => {
        const x = left + i * width;
        body += wire(`M${x} 55h${width}v60h-${width}z`) + dt(x + width / 2, 93, bit);
        if (labels[i]) body += dt(x + width / 2, 145, labels[i]);
    });
    return drawing(body + dt(360, 189, caption), caption + '. ' + bits.join(' '), 217);
}
function heatEngine(hot, cold, caption) {
    return drawing(wire('M110 60h114m260 0h115M110 68h114m260 0h115') +
        arrow(180, 83, 306, 139) + ring(360, 153, 48) + arrow(409, 139, 536, 83) +
        arrow(360, 201, 360, 241) + dt(165, 43, hot) + dt(544, 43, cold) + dt(360, 159, 'Engine') +
        dt(237, 132, 'Qₕ') + dt(480, 132, 'Qc') + dt(389, 238, 'W') + dt(360, 279, caption),
        'Heat enters the engine from ' + hot + ', heat leaves for ' + cold + ', and work is delivered.', 305);
}
function powerAngle(fault = false) {
    const body = wire('M100 43v150h510M100 193C255 -5 455 -5 610 193') +
        (fault ? guide('M100 119H610') + note(620, 125, 'Pₘ') : '') +
        dt(78, 46, 'Pₑ') + dt(100, 219, '0') + dt(355, 219, '90°') + dt(610, 219, '180°') + dt(355, 248, 'Rotor angle δ');
    return drawing(body, 'Power transfer rises from zero to a peak at 90 degrees and falls back to zero at 180 degrees.');
}
function braytonCycle() {
    return sketch('Ideal Brayton cycle in T–s coordinates. Vertical compression and expansion legs connect two constant-pressure curves.',
        arrow(110, 196, 110, 36) + arrow(110, 196, 610, 196) +
        wire('M218 169V110Q350 90 483 40V117Q350 159 218 169') + arrow(218, 151, 218, 125) + arrow(483, 69, 483, 94),
        [[89, 48, 'T'], [620, 201, 's'], [201, 177, '1'], [201, 113, '2'], [500, 42, '3'], [503, 124, '4']]);
}

function booleanLattice() {
    // Words are ranked by Hamming weight. Each edge changes one zero to one.
    const positions = [[360, 211], [204, 150], [360, 150], [204, 85], [516, 150], [360, 85], [516, 85], [360, 24]];
    let edges = '', vertices = '';
    positions.forEach(([x, y], n) => {
        for (const mask of [1, 2, 4]) if (!(n & mask)) {
            const [tx, ty] = positions[n | mask];
            edges += wire(`M${x} ${y}L${tx} ${ty}`);
        }
        vertices += `<rect x="${x - 25}" y="${y - 13}" width="50" height="26" rx="8" fill="#fffdf7"/>` +
            dt(x, y + 6, n.toString(2).padStart(3, '0'));
    });
    return drawing(edges + vertices + dt(360, 261, 'Upward edges change one 0 to 1'),
        'Boolean lattice on three input bits. Each word is connected to every word obtained by changing exactly one zero to a one.', 282);
}

function fiveStageRegister() {
    let b = '';
    for (let i = 0; i < 5; i++) {
        const x = 115 + 104 * i;
        b += wire(`M${x} 105h58v46h-58z`) + dt(x + 29, 133, 'q' + '₀₁₂₃₄'[i]) + arrow(x + 58, 128, x + 104, 128);
    }
    return drawing(b + dot(393, 128) + dot(600, 128) + wire('M393 128V57H372M600 128V35H350v2') +
        ring(350, 57, 20) + dt(350, 63, '+') + wire('M330 57H74v71') + arrow(74, 128, 115, 128) +
        dt(360, 205, 'Example tap set · all five cells shift on the same clock'),
        'Five-stage Fibonacci LFSR. Example feedback XORs q₂ and q₄ into q₀. The tap selection determines the feedback polynomial.', 230);
}
