/* Shared geometry for exercise schematics. All coordinates are in viewBox units. */
const wire = d => `<path d="${d}"/>`;
const guide = d => `<path d="${d}" stroke="#83968b" stroke-dasharray="5 5"/>`;
const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const arrow = (x1, y1, x2, y2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return wire(`M${x1} ${y1}L${x2} ${y2}`) +
        `<path transform="translate(${x2} ${y2}) rotate(${angle})" d="M-9 -5L0 0l-9 5"/>`;
};
const note = (x, y, text) => `<text x="${x}" y="${y}" stroke="none" text-anchor="start">${text}</text>`;
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
function signalChain(stages, caption) {
    const pitch = 660 / stages.length, width = pitch - 38;
    let body = '';
    stages.forEach((stage, i) => {
        const x = 30 + i * pitch, lines = stage.split('|');
        body += `<rect x="${x}" y="54" width="${width}" height="70" rx="6"/>`;
        lines.forEach((line, j) => { body += dt(x + width / 2, 96 + (j - (lines.length - 1) / 2) * 24, line); });
        if (i + 1 < stages.length) body += arrow(x + width, 89, x + pitch, 89);
    });
    return drawing(body + dt(360, 169, caption), stages.join(' → ').replaceAll('|', ' ') + '. ' + caption, 200);
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
    for (const v of [ymin, ymax]) body += dt(left - 34, y(v) + 5, String(v));
    for (const v of [xmin, xmax]) body += dt(x(v), bottom + 23, String(v));
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
    return drawing(body, yLabel + ' versus ' + xLabel);
}
function sketch(label, geometry, labels, height = 245) {
    return drawing(geometry + labels.map(([x, y, s]) => dt(x, y, s)).join(''), label, height);
}
