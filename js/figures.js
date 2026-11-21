/* Shared geometry for exercise schematics. All coordinates are in viewBox units. */
const wire = d => `<path d="${d}"/>`;
const guide = d => `<path d="${d}" stroke="#83968b" stroke-dasharray="5 5"/>`;
const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const arrow = (x1, y1, x2, y2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return wire(`M${x1} ${y1}L${x2} ${y2}`) +
        `<path transform="translate(${x2} ${y2}) rotate(${angle})" d="M-9 -5L0 0l-9 5"/>`;
};
const note = (x, y, text) => `<text x="${x}" y="${y}" fill="#315740" stroke="none" text-anchor="start">${text}</text>`;
const symbols = {
    R: [21, wire('M-21 -7h42v14h-42z')],
    C: [4, wire('M-4 -14v28M4 -14v28')],
    L: [24, wire('M-24 0a6 9 0 0 1 12 0a6 9 0 0 1 12 0a6 9 0 0 1 12 0a6 9 0 0 1 12 0')],
    diode: [11, wire('M-11 -10v20L11 0zM11 -11v22')],
    AC: [18, ring(0, 0, 18) + wire('M-11 0q5 -14 11 0t11 0')],
    DC: [18, ring(0, 0, 18) + wire('M-12 0h8m-4 -4v8M8 -4v8')],
    I: [18, ring(0, 0, 18) + arrow(-10, 0, 10, 0)]
};
// Draw a complete two-terminal element between its endpoints, including both leads.
// The first terminal of a voltage source is positive. Current arrows point towards terminal two.
function element(type, x1, y1, x2, y2, label = '') {
    const dx = x2 - x1, dy = y2 - y1, half = Math.hypot(dx, dy) / 2;
    const x = (x1 + x2) / 2, y = (y1 + y2) / 2;
    const [edge, body] = symbols[type];
    const leads = wire(`M${-half} 0H${-edge}M${edge} 0H${half}`);
    const geometry = `<g transform="translate(${x} ${y}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})">${leads}${body}</g>`;
    if (!label) return geometry;
    return geometry + (dy === 0 ? dt(x, y - 24, label) : note(x + 27, y + 6, label));
}
function circuitLoop(source, series, load, dc = false) {
    return drawing(element(dc ? 'DC' : 'AC', 145, 70, 145, 205) + dt(145, 42, source) +
        element('R', 145, 70, 500, 70, series) + element('R', 500, 70, 500, 205, load) +
        wire('M500 205H145') + ground(325, 205), `${source}, series impedance ${series}, and load ${load} in a closed loop`);
}
function filterLadder(series, shunt, count, infinite = false) {
    let x = 80, body = dot(x, 85) + dt(x, 61, 'In');
    for (let n = 0; n < count; n++) {
        const next = x + 480 / count;
        body += element(series, x, 85, next, 85, series) + element(shunt, next, 85, next, 190, shunt) + dot(next, 85);
        x = next;
    }
    body += wire(`M80 190H${x}M${x} 85h65`) + ground(80, 190) + dt(625, 65, infinite ? '⋯' : 'Out');
    if (infinite) body += wire(`M${x} 190h65`) + dt(625, 172, '⋯');
    return drawing(body, `Ladder with series ${series} and shunt ${shunt}${infinite ? ', repeating indefinitely' : ''}`);
}
function noiseCascade(first, gain, second, input) {
    return drawing(arrow(110, 105, 215, 105) + dt(144, 86, input) +
        wire('M215 60v90l84 -45z') + arrow(299, 105, 446, 105) + wire('M446 60v90l84 -45z') +
        arrow(530, 105, 624, 105) + dt(595, 85, 'Output') +
        dt(247, 44, 'First stage') + dt(480, 44, 'Second stage') +
        dt(249, 181, first) + dt(479, 181, second) + dt(367, 86, gain),
        `Two cascaded receiver stages. ${first}, first-stage gain ${gain}. ${second}.`, 210);
}

function convolutionSequences(a, b) {
    const series = [['x[n]', a, 2], ['h₁[n]', a, 0], ['h₂[n]', b, 0]];
    let body = '';
    series.forEach(([name, pole, delay], i) => {
        const x0 = 61 + i * 231, base = 162;
        body += wire(`M${x0} 54V${base}h166`) + dt(x0 + 72, 32, name) +
            dt(x0 - 16, 66, '1') + dt(x0, 188, '0') + dt(x0 + 48, 188, '2') + dt(x0 + 144, 188, '6');
        for (let n = 0; n <= 6; n++) {
            const x = x0 + 24 * n, y = base - 100 * (n < delay ? 0 : pole ** (n - delay));
            body += wire(`M${x} ${base}V${y}`) + dot(x, y);
        }
    });
    return drawing(body + dt(360, 233, 'Sample index n · the input starts two samples after the impulse responses'),
        `Three discrete sequences on the same amplitude scale. The input is zero before n = 2. Its decay and the first response both use a = ${a}. The second response decays with b = ${fmt(b)}.`, 253);
}
// A plotted relation, with axis units, endpoint ticks and an explicit zero reference.
function curve(xLabel, yLabel, [xmin, xmax], [ymin, ymax], fn, mode = 'line') {
    const left = 100, right = 642, top = 47, bottom = 194;
    const x = t => left + (right - left) * (t - xmin) / (xmax - xmin);
    const y = v => bottom - (bottom - top) * (v - ymin) / (ymax - ymin);
    const baseline = y(Math.max(ymin, Math.min(0, ymax)));
    let body = wire(`M${left} ${top}V${bottom}H${right}`);
    if (ymin < 0 && ymax > 0) body += guide(`M${left} ${baseline}H${right}`);
    if (xmin < 0 && xmax > 0) body += guide(`M${x(0)} ${top}V${bottom}`);
    body += note(left, 27, yLabel) + dt(360, 246, xLabel);
    // A labelled interior tick lets the reader estimate a value between limits.
    // Prefer zero when the range straddles it, provided there is room to label it.
    const ticks = (lo, hi, discrete=false) => {
        let mid = lo < 0 && hi > 0 ? 0 : Number(((lo + hi) / 2).toPrecision(2));
        if (discrete) mid = Math.round(mid);
        const gap = .15 * (hi - lo);
        return mid - lo > gap && hi - mid > gap ? [lo, mid, hi] : [lo, hi];
    };
    for (const v of ticks(ymin, ymax))
        body += wire(`M${left - 6} ${y(v)}h6`) + dt(left - 34, y(v) + 5, String(v));
    for (const v of ticks(xmin, xmax, mode !== 'line'))
        body += wire(`M${x(v)} ${bottom}v6`) + dt(x(v), bottom + 25, String(v));
    const steps = mode === 'line' ? 160 : xmax - xmin;
    let path = '';
    for (let i = 0; i <= steps; i++) {
        const t = xmin + (xmax - xmin) * i / steps;
        const px = +x(t).toFixed(2), py = +y(fn(t)).toFixed(2);
        if (mode === 'line') path += (i ? 'L' : 'M') + px + ' ' + py;
        else {
            if (mode === 'stem') body += wire(`M${px} ${baseline}V${py}`);
            body += dot(px, py);
        }
    }
    if (path) body += `<path d="${path}" stroke="#aa492a" stroke-width="3"/>`;
    return drawing(body, `${yLabel} versus ${xLabel}. Horizontal range ${xmin} to ${xmax}, vertical range ${ymin} to ${ymax}.`);
}
function sketch(label, geometry, labels, height = 245) {
    return drawing(geometry + labels.map(([x, y, s]) => dt(x, y, s)).join(''), label, height);
}

// Both sums need the prior: its measured component forms the innovation,
// while the full state is carried forward into the posterior.
function estimatorDiagram(model, observation, state, caption) {
    const prediction = wire('M568 74V188H520M520 164H422v48h98z') + dt(471, 194, model) +
        arrow(422, 188, 355, 188) + dot(355, 188) + wire('M355 188H151') +
        arrow(151, 188, 151, 94) + arrow(355, 188, 355, 94);
    return drawing(prediction + dt(250, 178, observation) + dt(378, 155, 'prior') +
        arrow(58, 74, 131, 74) + dt(82, 52, 'Fix z') + ring(151, 74, 20) + dt(151, 80, 'Σ') +
        dt(127, 107, '−') + arrow(171, 74, 228, 74) + dt(199, 49, 'residual') +
        wire('M228 53h56v42h-56z') + dt(256, 80, 'K') + arrow(284, 74, 335, 74) +
        ring(355, 74, 20) + dt(355, 80, 'Σ') + arrow(375, 74, 639, 74) + dot(568, 74) +
        dt(506, 51, state) + dt(360, 255, caption),
        'Measurement minus predicted measurement gives the residual. Gain K weights it before addition to the prior state. The posterior feeds the next prediction. ' + caption, 275);
}
