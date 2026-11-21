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
