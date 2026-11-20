/* Illustrations used by the curated bank. Curves show the given model or input. */
function shareChargeDiagram() {
    return drawing(element('C', 171, 78, 171, 199, 'C') + element('R', 171, 78, 471, 78, 'R') +
        element('C', 471, 78, 471, 199, 'C') + wire('M171 199H471') +
        dt(171, 235, 'Initially V₀') + dt(471, 235, 'Initially 0 V'), 'Two equal capacitors with a common return exchange charge through R.');
}
function seriesRlc() {
    return drawing(element('DC', 100, 80, 100, 195, '1 V') + element('R', 100, 80, 307, 80, 'R') +
        element('L', 307, 80, 520, 80, '1 H') + element('C', 520, 80, 520, 195, '1 F') +
        wire('M520 195H100') + ground(100, 195), 'Step source driving a series resistor, inductor and capacitor.');
}
function poleMap(poles, zeros = []) {
    const x = re => 490 + 115 * re, y = im => 126 - 65 * im;
    let body = arrow(82, y(0), 615, y(0)) + arrow(x(0), 218, x(0), 34);
    for (const [re, im] of poles) {
        const px = x(re), py = y(im);
        body += wire(`M${px - 5} ${py - 5}l10 10m0 -10l-10 10`) + dt(px - 26, py - 12, im ? re + (im > 0 ? ' + j' : ' − j') : String(re));
    }
    for (const re of zeros) body += ring(x(re), y(0), 6) + dt(x(re), y(0) - 17, String(re));
    return drawing(body + dt(639, 132, 'Re') + dt(510, 31, 'Im'), 'Complex plane with poles marked by crosses and zeros by circles.');
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
function counterTransition(n) {
    const before = '0'.repeat(n - 2) + '11', after = '0'.repeat(n - 3) + '100';
    const left = 360 - 24 * n;
    let body = '';
    for (let i = 0; i < n; i++) {
        const x = left + 48 * i;
        body += wire(`M${x} 49h48v42h-48z`) + dt(x + 24, 77, before[i]);
        body += `<rect x="${x}" y="131" width="48" height="42" fill="${before[i] === after[i] ? 'none' : '#e3ece3'}"/>` +
            dt(x + 24, 159, after[i]);
        if (before[i] !== after[i]) body += arrow(x + 24, 97, x + 24, 123);
    }
    return drawing(body + dt(left - 50, 77, 'Before') + dt(left - 50, 159, 'After') + dt(360, 214, n + '-bit counter · one rising edge'),
        'Example increment from ' + before + ' to ' + after + ' with arrows on the toggling bits.', 237);
}
function circleSection(inner, caption) {
    return drawing(ring(350, 118, 77) + (inner ? ring(350, 118, inner) : '') +
        arrow(350, 118, 404, 64) + dt(395, 102, 'R') + dot(350, 118) + dt(360, 229, caption),
        'Circular cross-section. ' + caption);
}
function inclineDiagram(rolling) {
    return sketch(rolling ? 'A circular body in rolling contact with an incline at angle θ.' : 'Block resting on an inclined plane at angle θ.',
        wire('M125 195H590V55z') +
        `<g transform="translate(350 127) rotate(-16.76)">${rolling ? ring(0, -26, 26) + dot(0, -26) : wire('M-35 0v-40h70v40z')}</g>` +
        wire('M195 195a70 70 0 0 0 -3 -20'), [[218, 188, 'θ']]);
}
function heatEngine(hot, cold, caption) {
    return drawing(wire('M110 60h114m260 0h115M110 68h114m260 0h115') +
        arrow(180, 83, 306, 139) + ring(360, 153, 48) + arrow(409, 139, 536, 83) +
        arrow(360, 201, 360, 241) + dt(165, 43, hot) + dt(544, 43, cold) + dt(360, 159, 'Engine') +
        dt(237, 132, 'Qₕ') + dt(480, 132, 'Qc') + dt(389, 238, 'W') + dt(360, 279, caption),
        'Heat enters the engine from ' + hot + ', heat leaves for ' + cold + ', and work is delivered.', 305);
}
function sinePlot(rectification) {
    const wave = t => Math.sin(Math.PI * t);
    return curve('Time / half-period', 'Output / Vₚ', [0, 4], [0, 1],
        t => rectification === 'half' ? Math.max(0, wave(t)) : Math.abs(wave(t)));
}
function powerAngle(fault = false) {
    const body = wire('M100 43v150h510M100 193C255 -5 455 -5 610 193') +
        (fault ? guide('M100 119H610') + note(620, 125, 'Pₘ') : '') +
        dt(78, 46, 'Pₑ') + dt(100, 219, '0') + dt(355, 219, '90°') + dt(610, 219, '180°') + dt(355, 248, 'Rotor angle δ');
    return drawing(body, 'Power transfer rises from zero to a peak at 90 degrees and falls back to zero at 180 degrees.');
}
function distributedBeam() {
    let body = '';
    for (const x of [72, 382]) {
        body += wire(`M${x} 144h256`) + pinSupport(x, 144) + rollerSupport(x + 256, 144);
    }
    for (let x = 72; x <= 328; x += 32) body += arrowDown(x, 87, 48);
    return drawing(body + wire('M72 87H328') + arrowDown(510, 87, 48) +
        dt(200, 66, 'Distributed W/L') + dt(510, 66, 'Point load W') +
        dt(200, 220, 'Span L') + dt(510, 220, 'Span L'), 'Comparison of a uniform load and a central point load on identical simply supported beams.');
}
function starDelta() {
    const star = [[175, 50], [94, 185], [256, 185]], delta = [[510, 50], [429, 185], [591, 185]];
    let body = '';
    star.forEach(([x, y], i) => {
        body += element('R', 175, 139, x, y) + dot(x, y);
        body += element('R', ...delta[i], ...delta[(i + 1) % 3]) + dot(...delta[i]);
    });
    return drawing(body + dot(175, 139) + dt(175, 231, 'Star (Y)') + dt(510, 231, 'Delta (Δ)'),
        'Three equal phase resistors connected to a common star point or around a closed delta.');
}
function braytonCycle() {
    return sketch('Ideal Brayton cycle in T–s coordinates. Vertical compression and expansion legs connect two constant-pressure curves.',
        arrow(110, 196, 110, 36) + arrow(110, 196, 610, 196) +
        wire('M218 169V110Q350 90 483 40V117Q350 159 218 169') + arrow(218, 151, 218, 125) + arrow(483, 69, 483, 94),
        [[89, 48, 'T'], [620, 201, 's'], [201, 177, '1'], [201, 113, '2'], [500, 42, '3'], [503, 124, '4']]);
}
