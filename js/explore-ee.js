/* Electrical explore figures and Play animations (anime.js). They register into EXPLORE_TYPES and CONCEPT_SCENES
   from js/motion.js. Explore figures change only when you drag, slide or press a button; Play animations run once
   per press. Loaded after motion.js and before app.js. */

/* ---------- helpers ---------- */
const exSvg = (box, W, H, label) => { const svg = svgEl('svg', {viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label}); box.querySelector('.explore-stage').prepend(svg); return svg; };
const exReadout = box => pairs => { box.querySelector('.readouts').innerHTML = pairs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join(''); };
const exText = (svg, x, y, text, attrs={}) => { const t = svgEl('text', {x, y, ...attrs}, svg); t.textContent = text; return t; };
function exRange(box, label, min, max, step, value, onInput, show=v => v) {
    const wrap = document.createElement('label');
    wrap.className = 'slider3d';
    wrap.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}"><output></output>`;
    box.querySelector('.explore-controls').append(wrap);
    const input = wrap.querySelector('input'), out = wrap.querySelector('output'), upd = () => { out.textContent = show(Number(input.value)); };
    input.addEventListener('input', () => { upd(); onInput(Number(input.value)); });
    upd();
    return input;
}
function exButton(box, label, onClick, cls='ghost small') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    b.addEventListener('click', onClick);
    box.querySelector('.explore-controls').append(b);
    return b;
}
/* An overlay over part of the drawing (r = {x, y, w, h} in drawing units), so draggable points stay inside it. */
function exArea(box, W, H, r) {
    const area = document.createElement('div');
    area.className = 'ex-area';
    Object.assign(area.style, {left: `${100 * r.x / W}%`, top: `${100 * r.y / H}%`, width: `${100 * r.w / W}%`, height: `${100 * r.h / H}%`});
    box.querySelector('.explore-stage').append(area);
    return area;
}
/* A draggable point inside an area, in drawing units; lockY keeps it on one horizontal line (e.g. the real axis). */
function exKnob(area, r, label, start, onMove, {lockY=null, shape='dot'}={}) {
    const knob = document.createElement('div'), half = 11, k = () => area.clientWidth / r.w;
    knob.className = `knob knob-${shape}`;
    knob.tabIndex = 0;
    knob.setAttribute('role', 'slider');
    knob.setAttribute('aria-label', label);
    area.append(knob);
    let pos = [...start];
    const drag = keep(anime.createDraggable(knob, {container: area, y: lockY === null, velocityMultiplier: 0, cursor: {onHover: 'grab', onGrab: 'grabbing'},
        onUpdate: d => { pos = [r.x + (d.x + half) / k(), lockY === null ? r.y + (d.y + half) / k() : lockY]; onMove(pos); }}), 'solution');
    const place = p => {
        pos = [...p];
        if (lockY !== null) knob.style.top = `${(lockY - r.y) * k() - half}px`;
        drag.setX((pos[0] - r.x) * k() - half, true);
        if (lockY === null) drag.setY((pos[1] - r.y) * k() - half, true);
    };
    knob.addEventListener('keydown', ev => {
        const dv = {ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4]}[ev.key];
        if (!dv) return;
        ev.preventDefault();
        const np = [Math.min(r.x + r.w, Math.max(r.x, pos[0] + dv[0])), lockY === null ? Math.min(r.y + r.h, Math.max(r.y, pos[1] + dv[1])) : lockY];
        place(np);
        onMove(np);
    });
    const ro = new ResizeObserver(() => { drag.refresh(); place(pos); });
    ro.observe(area);
    keep(ro, 'solution');
    place(pos);
    return {place, knob};
}
/* A seeded random generator (mulberry32) and a normal deviate from it. */
const exRng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const exNormal = rnd => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const pathOf = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');

/* ---------- pole–zero model, shared by the explorer and the 3D |H(s)| landscape ---------- */
function pzShared(panel) {
    return panel.pz ||= {sig: -.5, w: 1.6, real: -2.5, zero: -1.2, useReal: false, useZero: false, subs: new Set(), set(patch) { Object.assign(this, patch); this.subs.forEach(f => f()); }};
}
const pzPoles = pz => [cx(pz.sig, pz.w), cx(pz.sig, -pz.w), ...(pz.useReal ? [cx(pz.real)] : [])];
const pzZeros = pz => pz.useZero ? [cx(pz.zero)] : [];
/* The gain that makes H(0) = 1 (unity DC gain), as a complex number with no imaginary part. */
const pzGain = pz => cd(pzPoles(pz).reduce((a, p) => cm(a, cs(cx(0), p)), cx(1)), pzZeros(pz).reduce((a, z) => cm(a, cs(cx(0), z)), cx(1)));
function pzH(pz, s) {
    let n = pzGain(pz), d = cx(1);
    for (const z of pzZeros(pz)) n = cm(n, cs(s, z));
    for (const p of pzPoles(pz)) d = cm(d, cs(s, p));
    return cd(n, d);
}
/* Unit-step response by partial fractions: y(t) = 1 + Σ Res_i e^{p_i t}, Res_i = (s − p_i)H(s)/s at s = p_i. */
function pzStep(pz) {
    const P = pzPoles(pz), Z = pzZeros(pz), K = pzGain(pz);
    const res = P.map((p, i) => { let n = K, d = p; Z.forEach(z => { n = cm(n, cs(p, z)); }); P.forEach((q, j) => { if (j !== i) d = cm(d, cs(p, q)); }); return cd(n, d); });
    return t => 1 + P.reduce((sum, p, i) => sum + cm(res[i], cx(Math.exp(p.re * t) * Math.cos(p.im * t), Math.exp(p.re * t) * Math.sin(p.im * t))).re, 0);
}

/* ---------- explore: drag poles and zeros; Bode magnitude and step response follow ---------- */
Object.assign(EXPLORE_TITLE, {polezero: 'Poles and zeros, live', sampling: 'Sampling and aliasing', logic: 'A logic circuit with gate delays', rc: 'Charging a capacitor', opamp: 'Op-amp gain and clipping', averaging: 'Averaging out noise', powerfactor: 'Power factor and its correction'});
Object.assign(EXPLORE_INTRO, {
    polezero: 'Drag the pole pair (×), and switch on an extra real pole or a zero. The gain is set so H(0) = 1. Watch the Bode magnitude and the step response change as the poles move.',
    sampling: 'A cosine is sampled at fₛ. Lower fₛ below twice the signal frequency and the samples fit a slower cosine (red) just as well: that false frequency is the alias.',
    logic: 'Y = A·B + Ā·C, with one unit of delay per gate. Toggle the inputs and watch the signals ripple through. With B = C = 1, switch A off: the slower NOT path makes Y dip for a moment (a static hazard).',
    rc: 'A 5 V step charges C through R. Change R and C and watch the time constant τ = RC; press Charge to watch it fill.',
    opamp: 'An ideal op-amp on ±12 V supplies (about 1.5 V of headroom). Set the resistors and the input level: the gain is set by the resistors until the output hits the rails and clips.',
    averaging: 'A 10.000 V source is read with 0.5 V of random noise. Add readings and watch the average close in on the truth, with the uncertainty shrinking as σ/√N.',
    powerfactor: 'Drag the tip of the current phasor (230 V, 50 Hz). The power triangle follows; then add capacitor correction and watch the reactive power and the line current fall.'
});
EXPLORE_TYPES.polezero = (box, s, panel) => {
    const W = 720, H = 262, readout = exReadout(box), pz = pzShared(panel), svg = exSvg(box, W, H, 'Pole–zero map with the Bode magnitude and step response');
    const SP = {x: 10, y: 10, w: 240, h: 240}, toV = ([sg, w]) => [SP.x + (sg + 5) * 40, SP.y + 120 - w * 40], toS = ([x, y]) => [(x - SP.x) / 40 - 5, (SP.y + 120 - y) / 40];
    svgEl('rect', {x: toV([0, 3])[0], y: SP.y, width: 40, height: SP.h, class: 'fillwash'}, svg);
    for (let g = -5; g <= 1; g++) svgEl('path', {d: `M${toV([g, 3])[0]} ${SP.y}V${SP.y + SP.h}`, class: 'gd'}, svg);
    for (let w = -3; w <= 3; w++) svgEl('path', {d: `M${SP.x} ${toV([0, w])[1]}H${SP.x + SP.w}`, class: 'gd'}, svg);
    svgEl('path', {d: `M${SP.x} ${toV([0, 0])[1]}H${SP.x + SP.w}M${toV([0, 0])[0]} ${SP.y}V${SP.y + SP.h}`, class: 'ln'}, svg);
    exText(svg, SP.x + SP.w - 4, toV([0, 0])[1] - 6, 'σ', {'text-anchor': 'end'});
    exText(svg, toV([0, 0])[0] + 6, SP.y + 14, 'jω');
    exText(svg, toV([.5, 0])[0], SP.y + SP.h - 6, 'unstable', {'text-anchor': 'middle'});
    const mirror = svgEl('path', {class: 'ac thick'}, svg);
    let kw = pz.w; // the dragged pole's own ω (it may sit below the axis); its conjugate is drawn at −kw
    // Bode magnitude (top right) and step response (bottom right)
    const BX = [300, 710], BY = [14, 118], SY = [148, 250], lw = w => BX[0] + (BX[1] - BX[0]) * (Math.log10(w) + 2) / 4, db = v => BY[0] + (BY[1] - BY[0]) * (20 - Math.max(-60, Math.min(20, v))) / 80;
    const tx = t => BX[0] + (BX[1] - BX[0]) * t / 20, ty = v => SY[0] + (SY[1] - SY[0]) * (2 - Math.max(-.5, Math.min(2, v))) / 2.5;
    svgEl('path', {d: `M${BX[0]} ${BY[0]}V${BY[1]}H${BX[1]}M${BX[0]} ${SY[0]}V${SY[1]}H${BX[1]}`, class: 'ln'}, svg);
    svgEl('path', {d: `M${BX[0]} ${db(0)}H${BX[1]}M${BX[0]} ${db(-3)}H${BX[1]}M${BX[0]} ${ty(1)}H${BX[1]}`, class: 'gd'}, svg);
    [.01, .1, 1, 10, 100].forEach(w => exText(svg, lw(w), BY[1] + 13, String(w), {'text-anchor': 'middle'}));
    exText(svg, BX[0] + 6, BY[0] + 10, '|H(jω)| dB  (0 and −3 dB dashed)');
    exText(svg, BX[1], BY[1] - 4, 'ω (rad/s)', {'text-anchor': 'end'});
    exText(svg, BX[0] + 6, SY[0] + 10, 'step response y(t)');
    exText(svg, BX[1], SY[1] - 4, 't = 0–20 s', {'text-anchor': 'end'});
    const mag = svgEl('path', {class: 'ac thick'}, svg), step = svgEl('path', {class: 'ac thick'}, svg);
    const render = () => {
        const [mx, my] = toV([pz.sig, -kw]);
        mirror.setAttribute('d', `M${mx - 6} ${my - 6}l12 12m0 -12l-12 12`);
        const pts = [];
        for (let i = 0; i <= 200; i++) { const w = 10 ** (-2 + 4 * i / 200); pts.push([lw(w), db(20 * Math.log10(cabs(pzH(pz, cx(0, w)))))]); }
        mag.setAttribute('d', pathOf(pts));
        const y = pzStep(pz), sp = [];
        let peak = -Infinity, unstable = pzPoles(pz).some(p => p.re > 1e-9);
        for (let i = 0; i <= 300; i++) { const t = 20 * i / 300, v = y(t); peak = Math.max(peak, v); sp.push([tx(t), ty(v)]); }
        step.setAttribute('d', pathOf(sp));
        let bw = null;
        for (let i = 0; i <= 800 && bw === null; i++) { const w = 10 ** (-2 + 4 * i / 800); if (cabs(pzH(pz, cx(0, w))) < Math.SQRT1_2) bw = w; }
        const wn = Math.hypot(pz.sig, pz.w), z = -pz.sig / wn;
        readout([['Pole pair', `${pz.sig.toFixed(2)} ± j${pz.w.toFixed(2)}`], ['ζ, ωₙ', `${z.toFixed(2)}, ${wn.toFixed(2)} rad/s`], ['Overshoot', unstable ? '—' : `${Math.max(0, 100 * (peak - 1)).toFixed(1)}%`],
            ['Bandwidth (−3 dB)', bw ? `${bw.toFixed(2)} rad/s` : '> 100 rad/s'], ['Status', unstable ? 'Unstable: a pole in the right half-plane' : pz.useZero && pz.zero > 0 ? 'Stable, non-minimum phase: watch the undershoot' : 'Stable']]);
    };
    const area = exArea(box, W, H, SP);
    exKnob(area, SP, 'Pole pair: drag, or use the arrow keys', toV([pz.sig, pz.w]), v => { const [sg, w] = toS(v); kw = Math.abs(w) < .05 ? (w < 0 ? -.05 : .05) : w; pz.set({sig: Math.min(.95, sg), w: Math.abs(kw)}); render(); }, {shape: 'pole'});
    const realK = exKnob(area, SP, 'Real pole: drag along the real axis', toV([pz.real, 0]), v => { let sg = toS(v)[0]; if (Math.abs(sg) < .05) sg = -.05; pz.set({real: sg}); render(); }, {lockY: toV([0, 0])[1], shape: 'pole'});
    const zeroK = exKnob(area, SP, 'Zero: drag along the real axis', toV([pz.zero, 0]), v => { let sg = toS(v)[0]; if (Math.abs(sg) < .05) sg = sg < 0 ? -.05 : .05; pz.set({zero: sg}); render(); }, {lockY: toV([0, 0])[1], shape: 'zero'});
    const show = () => { realK.knob.hidden = !pz.useReal; zeroK.knob.hidden = !pz.useZero; };
    const tr = exButton(box, 'Add a real pole', () => { pz.set({useReal: !pz.useReal}); tr.textContent = pz.useReal ? 'Remove the real pole' : 'Add a real pole'; show(); render(); });
    const tz = exButton(box, 'Add a zero', () => { pz.set({useZero: !pz.useZero}); tz.textContent = pz.useZero ? 'Remove the zero' : 'Add a zero'; show(); render(); });
    show();
    render();
};

/* ---------- explore: sampling and aliasing ---------- */
EXPLORE_TYPES.sampling = box => {
    const W = 720, H = 230, readout = exReadout(box), svg = exSvg(box, W, H, 'A cosine, its samples, and the slower cosine the samples also fit');
    const X0 = 40, X1 = 705, Y0 = 115, A = 80, X = t => X0 + (X1 - X0) * t, Y = v => Y0 - A * v;
    svgEl('path', {d: `M${X0} ${Y0 - A - 10}V${Y0 + A + 10}M${X0} ${Y0}H${X1}`, class: 'ln'}, svg);
    exText(svg, X1, Y0 + A + 26, 't = 0–1 s', {'text-anchor': 'end'});
    const truth = svgEl('path', {class: 'ln'}, svg), alias = svgEl('path', {class: 'ac thick'}, svg), dots = svgEl('g', {}, svg);
    const st = {f: 5, fs: 12};
    const render = () => {
        const fa = st.f - st.fs * Math.round(st.f / st.fs), tp = [], ap = [];
        for (let i = 0; i <= 600; i++) { const t = i / 600; tp.push([X(t), Y(Math.cos(2 * Math.PI * st.f * t))]); ap.push([X(t), Y(Math.cos(2 * Math.PI * fa * t))]); }
        truth.setAttribute('d', pathOf(tp));
        alias.setAttribute('d', pathOf(ap));
        alias.style.opacity = st.fs < 2 * st.f ? 1 : .35;
        dots.replaceChildren();
        for (let n = 0; n / st.fs <= 1 + 1e-9; n++) { const t = n / st.fs, v = Math.cos(2 * Math.PI * st.f * t); svgEl('path', {d: `M${X(t)} ${Y0}V${Y(v)}`, class: 'gd'}, dots); svgEl('circle', {cx: X(t), cy: Y(v), r: 4.5, class: 'dot'}, dots); }
        readout([['Signal f', `${st.f} Hz`], ['Sampling fₛ', `${st.fs} Hz`], ['Nyquist limit fₛ/2', `${st.fs / 2} Hz`], ['Frequency the samples show', `${Math.abs(fa).toFixed(1)} Hz`], ['Status', st.fs < 2 * st.f ? 'Aliased: the samples cannot tell f from the alias' : st.fs === 2 * st.f ? 'Exactly at the Nyquist rate: ambiguous' : 'Above the Nyquist rate: f is recovered']]);
    };
    exRange(box, 'Signal f (Hz)', 1, 12, .5, st.f, v => { st.f = v; render(); });
    exRange(box, 'Sampling fₛ (Hz)', 2, 40, .5, st.fs, v => { st.fs = v; render(); });
    render();
};

/* ---------- explore: a logic circuit with gate delays and a static hazard ---------- */
EXPLORE_TYPES.logic = box => {
    const W = 720, H = 290, readout = exReadout(box), svg = exSvg(box, W, H, 'Logic circuit Y = A·B + not-A·C with a timing diagram of every signal');
    const names = ['A', 'B', 'C', 'Ā', 'AB', 'ĀC', 'Y'], N = 18, hist = {}, inputs = {A: 1, B: 1, C: 1};
    const settle = () => { const v = {...inputs}; v['Ā'] = 1 - v.A; v.AB = v.A & v.B; v['ĀC'] = v['Ā'] & v.C; v.Y = v.AB | v['ĀC']; return v; };
    const init = settle();
    names.forEach(n => { hist[n] = Array(N).fill(init[n]); });
    // schematic
    const wires = {
        A: 'M44 50H190M64 50V175H80', B: 'M44 110H190', C: 'M44 225H190', 'Ā': 'M128 175H190', AB: 'M240 80H270', 'ĀC': 'M240 200H262V180H270', Y: 'M315 140H338'
    }, wireEls = {};
    Object.entries(wires).forEach(([n, d]) => { wireEls[n] = svgEl('path', {d, class: 'ln'}, svg); });
    [['A', 50], ['B', 110], ['C', 225]].forEach(([n, y]) => exText(svg, 22, y + 4, n, {'text-anchor': 'middle'}));
    svgEl('rect', {x: 80, y: 160, width: 40, height: 30, class: 'ln'}, svg); svgEl('circle', {cx: 124, cy: 175, r: 4, class: 'ln'}, svg); exText(svg, 100, 180, '1', {'text-anchor': 'middle'});
    svgEl('rect', {x: 190, y: 35, width: 50, height: 90, class: 'ln'}, svg); exText(svg, 215, 84, '&', {'text-anchor': 'middle'});
    svgEl('rect', {x: 190, y: 160, width: 50, height: 80, class: 'ln'}, svg); exText(svg, 215, 204, '&', {'text-anchor': 'middle'});
    svgEl('rect', {x: 270, y: 60, width: 45, height: 140, class: 'ln'}, svg); exText(svg, 292, 144, '≥1', {'text-anchor': 'middle'});
    exText(svg, 346, 144, 'Y');
    // timing diagram
    const TX0 = 410, TX1 = 710, rowY = i => 26 + i * 38, tx = k => TX0 + (TX1 - TX0) * k / N;
    names.forEach((n, i) => { exText(svg, TX0 - 10, rowY(i) + 4, n, {'text-anchor': 'end'}); svgEl('path', {d: `M${TX0} ${rowY(i) + 10}H${TX1}`, class: 'gd'}, svg); });
    const waves = names.map(() => svgEl('path', {class: 'ac'}, svg));
    exText(svg, TX1, H - 4, 'time →  (one step = one gate delay)', {'text-anchor': 'end'});
    const glitchSeen = () => { const y = hist.Y; for (let k = 1; k < N - 1; k++) if (y[k] === 0 && y[k - 1] === 1 && y[k + 1] === 1) return true; return false; };
    const render = () => {
        names.forEach((n, i) => {
            let d = '';
            hist[n].forEach((v, k) => { const y = rowY(i) + (v ? -10 : 10); d += k ? `H${tx(k)}V${y}` : `M${tx(0)} ${y}`; });
            waves[i].setAttribute('d', d + `H${tx(N)}`);
        });
        const now = Object.fromEntries(names.map(n => [n, hist[n][N - 1]]));
        Object.entries(wireEls).forEach(([n, el]) => { el.setAttribute('class', now[n] ? 'ac thick' : 'ln'); });
        readout([['Inputs', `A = ${inputs.A}, B = ${inputs.B}, C = ${inputs.C}`], ['Output Y now', now.Y], ['Glitch in the window', glitchSeen() ? 'Yes: Y dipped for one gate delay' : 'None']]);
    };
    const tick = () => {
        const prev = Object.fromEntries(names.map(n => [n, hist[n][N - 1]])), next = {...inputs};
        next['Ā'] = 1 - prev.A; next.AB = prev.A & prev.B; next['ĀC'] = prev['Ā'] & prev.C; next.Y = prev.AB | prev['ĀC'];
        names.forEach(n => { hist[n].push(next[n]); hist[n].shift(); });
        render();
    };
    let run = null, left = 0;
    const advance = () => {
        left = 8;
        if (calm()) { while (left-- > 0) tick(); return; }
        if (run) return;
        const o = {k: 0};
        let done = 0;
        run = keep(anime.animate(o, {k: 8, duration: 8 * 220, ease: 'linear', onUpdate: () => { while (done < Math.floor(o.k) && left > 0) { done++; left--; tick(); } }, onComplete: () => { run = null; if (left > 0) advance(); }}), 'solution');
    };
    const btns = {};
    ['A', 'B', 'C'].forEach(n => { btns[n] = exButton(box, `${n} = ${inputs[n]}`, () => { inputs[n] ^= 1; btns[n].textContent = `${n} = ${inputs[n]}`; advance(); }); });
    render();
};

/* ---------- explore: charging a capacitor ---------- */
EXPLORE_TYPES.rc = box => {
    const W = 720, H = 240, V = 5, T = .25, readout = exReadout(box), svg = exSvg(box, W, H, 'RC charging circuit and the capacitor voltage against time');
    svgEl('path', {d: 'M40 70V40H110M150 40H170M230 40H250V95M250 115V200H40V130', class: 'ln'}, svg);
    svgEl('circle', {cx: 40, cy: 100, r: 20, class: 'ln'}, svg); exText(svg, 40, 105, '5 V', {'text-anchor': 'middle'});
    svgEl('path', {d: 'M110 40L146 26', class: 'ln'}, svg); exText(svg, 130, 20, 'switch', {'text-anchor': 'middle'});
    svgEl('rect', {x: 170, y: 31, width: 60, height: 18, class: 'ln'}, svg); exText(svg, 200, 70, 'R', {'text-anchor': 'middle'});
    svgEl('path', {d: 'M226 95H274M226 115H274', class: 'ln thick'}, svg);
    const charge = svgEl('rect', {x: 228, y: 97, width: 44, height: 16, class: 'fillwash'}, svg);
    charge.style.opacity = .15;
    exText(svg, 290, 110, 'C');
    const X0 = 330, X1 = 705, Y0 = 200, Y1 = 30, X = t => X0 + (X1 - X0) * t / T, Y = v => Y0 - (Y0 - Y1) * v / V;
    svgEl('path', {d: `M${X0} ${Y1 - 6}V${Y0}H${X1}`, class: 'ln'}, svg);
    svgEl('path', {d: `M${X0} ${Y(V)}H${X1}`, class: 'gd'}, svg);
    exText(svg, X0 + 6, Y1 - 10, 'v_C (V)'); exText(svg, X1, Y0 + 18, 't = 0–250 ms', {'text-anchor': 'end'});
    const curveEl = svgEl('path', {class: 'ac thick'}, svg), tauLine = svgEl('path', {class: 'gd'}, svg), tauDot = svgEl('circle', {r: 4.5, class: 'dot'}, svg), runner = svgEl('circle', {r: 6, class: 'dot'}, svg);
    runner.style.opacity = 0;
    const st = {R: 4.7, C: 10};
    const tau = () => st.R * 1e3 * st.C * 1e-6;
    const render = () => {
        const tt = tau(), pts = [];
        for (let i = 0; i <= 300; i++) { const t = T * i / 300; pts.push([X(t), Y(V * (1 - Math.exp(-t / tt)))]); }
        curveEl.setAttribute('d', pathOf(pts));
        const inView = tt <= T;
        tauLine.setAttribute('d', inView ? `M${X(tt)} ${Y0}V${Y(V * (1 - Math.exp(-1)))}H${X0}` : '');
        tauDot.setAttribute('cx', X(Math.min(tt, T))); tauDot.setAttribute('cy', Y(V * (1 - Math.exp(-Math.min(tt, T) / tt))));
        tauDot.style.opacity = inView ? 1 : 0;
        readout([['Time constant τ = RC', `${(1e3 * tt).toFixed(1)} ms`], ['Reaches 63% at', `${(1e3 * tt).toFixed(1)} ms`], ['Reaches 99% at', `${(4.6e3 * tt).toFixed(0)} ms`], ['Current at t = 0', `${(V / st.R).toFixed(2)} mA`], ['Energy stored at the end', `${(.5 * st.C * 1e-6 * V * V * 1e3).toFixed(3)} mJ`]]);
    };
    exRange(box, 'R (kΩ)', 1, 20, .1, st.R, v => { st.R = v; render(); });
    exRange(box, 'C (µF)', 1, 50, 1, st.C, v => { st.C = v; render(); });
    exButton(box, '▶ Charge it', () => {
        const o = {t: 0}, tt = tau(), frame = () => { const v = V * (1 - Math.exp(-o.t / tt)); runner.setAttribute('cx', X(o.t)); runner.setAttribute('cy', Y(v)); charge.style.opacity = .15 + .85 * v / V; };
        runner.style.opacity = 1;
        frame();
        keep(anime.animate(o, {t: T, duration: 2500, ease: 'linear', onUpdate: frame}), 'solution');
    });
    render();
};

/* ---------- explore: op-amp gain and clipping ---------- */
EXPLORE_TYPES.opamp = box => {
    const W = 720, H = 230, rail = 12, head = 1.5, readout = exReadout(box), svg = exSvg(box, W, H, 'Op-amp amplifier and its input and output waveforms');
    const st = {Rf: 47, Rg: 10, A: 1, inv: false};
    svgEl('path', {d: 'M110 70V160L190 115Z', class: 'ln'}, svg);
    const minusLbl = exText(svg, 120, 95, '−'), plusLbl = exText(svg, 120, 145, '+');
    svgEl('path', {d: 'M190 115H240M110 90H80V40H130M190 40H210V115M80 90V150', class: 'ln'}, svg);
    svgEl('rect', {x: 130, y: 31, width: 60, height: 18, class: 'ln'}, svg);
    exText(svg, 160, 24, 'Rf', {'text-anchor': 'middle'});
    svgEl('rect', {x: 71, y: 150, width: 18, height: 40, class: 'ln'}, svg);
    exText(svg, 60, 175, 'Rg', {'text-anchor': 'end'});
    svgEl('path', {d: 'M80 190V205', class: 'ln'}, svg);
    const vinPath = svgEl('path', {class: 'ln'}, svg), cfgLbl = exText(svg, 140, 222, '', {'text-anchor': 'middle'});
    exText(svg, 250, 119, 'out');
    const X0 = 290, X1 = 705, Y0 = 115, sc = 8, X = t => X0 + (X1 - X0) * t / 2, Y = v => Y0 - sc * v;
    svgEl('path', {d: `M${X0} ${Y(13.5)}V${Y(-13.5)}M${X0} ${Y0}H${X1}`, class: 'ln'}, svg);
    svgEl('path', {d: `M${X0} ${Y(rail)}H${X1}M${X0} ${Y(-rail)}H${X1}`, class: 'gd'}, svg);
    exText(svg, X1, Y(rail) - 4, '+12 V rail', {'text-anchor': 'end'}); exText(svg, X1, Y(-rail) + 14, '−12 V rail', {'text-anchor': 'end'});
    const inEl = svgEl('path', {class: 'ln'}, svg), outEl = svgEl('path', {class: 'ac thick'}, svg);
    const render = () => {
        const G = st.inv ? -st.Rf / st.Rg : 1 + st.Rf / st.Rg, lim = rail - head, ip = [], op = [];
        vinPath.setAttribute('d', st.inv ? 'M40 90H71' : 'M40 140H110');
        plusLbl.textContent = '+'; minusLbl.textContent = '−';
        cfgLbl.textContent = st.inv ? 'inverting: input through Rg to −' : 'non-inverting: input to +';
        for (let i = 0; i <= 400; i++) { const t = 2 * i / 400, vin = st.A * Math.sin(2 * Math.PI * t); ip.push([X(t), Y(vin)]); op.push([X(t), Y(Math.max(-lim, Math.min(lim, G * vin)))]); }
        inEl.setAttribute('d', pathOf(ip)); outEl.setAttribute('d', pathOf(op));
        const want = Math.abs(G) * st.A;
        readout([['Configuration', st.inv ? 'Inverting' : 'Non-inverting'], ['Gain', `${G.toFixed(2)} (${(20 * Math.log10(Math.abs(G) || 1e-9)).toFixed(1)} dB)`], ['Output peak wanted', `${want.toFixed(2)} V`], ['Output peak', `${Math.min(want, lim).toFixed(2)} V`], ['Status', want > lim ? `Clipping: the output stops at ±${lim} V` : 'Linear']]);
    };
    exRange(box, 'Rf (kΩ)', 0, 100, 1, st.Rf, v => { st.Rf = v; render(); });
    exRange(box, 'Rg (kΩ)', 1, 20, .5, st.Rg, v => { st.Rg = v; render(); });
    exRange(box, 'Input peak (V)', .1, 5, .1, st.A, v => { st.A = v; render(); });
    const cfg = exButton(box, 'Switch to inverting', () => { st.inv = !st.inv; cfg.textContent = st.inv ? 'Switch to non-inverting' : 'Switch to inverting'; render(); });
    render();
};

/* ---------- explore: averaging out noise ---------- */
EXPLORE_TYPES.averaging = box => {
    const W = 720, H = 240, truth = 10, sigma = .5, readout = exReadout(box), svg = exSvg(box, W, H, 'Individual noisy readings and their running average converging on the true value');
    const rnd = exRng(20261123), readings = [];
    const AX0 = 40, AX1 = 330, BX0 = 390, BX1 = 705, Y0 = 200, Y1 = 30, Y = v => Y0 - (Y0 - Y1) * (v - 8.5) / 3, Yb = v => Y0 - (Y0 - Y1) * (Math.max(9.4, Math.min(10.6, v)) - 9.4) / 1.2;
    svgEl('path', {d: `M${AX0} ${Y1}V${Y0}H${AX1}M${BX0} ${Y1}V${Y0}H${BX1}`, class: 'ln'}, svg);
    svgEl('path', {d: `M${AX0} ${Y(truth)}H${AX1}M${BX0} ${Yb(truth)}H${BX1}`, class: 'gd'}, svg);
    exText(svg, AX0 + 6, Y1 - 10, 'last 200 readings (V)'); exText(svg, BX0 + 6, Y1 - 10, 'running average (V)');
    const lx = n => BX0 + (BX1 - BX0) * Math.log10(n) / 3;
    [1, 10, 100, 1000].forEach(n => exText(svg, lx(n), Y0 + 16, `N = ${n}`, {'text-anchor': 'middle'}));
    const funnel = svgEl('path', {class: 'fillwash'}, svg), meanPath = svgEl('path', {class: 'ac thick'}, svg), dotsG = svgEl('g', {}, svg);
    {
        const up = [], dn = [];
        for (let i = 0; i <= 120; i++) { const n = 10 ** (3 * i / 120), e = 1.96 * sigma / Math.sqrt(n); up.push([lx(n), Yb(truth + e)]); dn.push([lx(n), Yb(truth - e)]); }
        funnel.setAttribute('d', pathOf(up) + 'L' + pathOf(dn.reverse()).slice(1) + 'Z');
    }
    const render = fresh => {
        const n = readings.length, shown = readings.slice(-200), first = n - shown.length;
        dotsG.replaceChildren();
        const newDots = [];
        shown.forEach((v, i) => { const d = svgEl('circle', {cx: AX0 + (AX1 - AX0) * (i + .5) / 200, cy: Y(Math.max(8.5, Math.min(11.5, v))), r: 2.6, class: 'dot'}, dotsG); if (first + i >= n - fresh) newDots.push(d); });
        if (fresh && fresh <= 10 && !calm()) { anime.utils.set(newDots, {opacity: 0, y: -14}); anime.animate(newDots, {opacity: 1, y: 0, duration: 300, delay: anime.stagger(40), ease: 'outQuad', onComplete: () => unstyle(newDots)}); }
        let s = 0;
        const mp = readings.map((v, i) => { s += v; return [lx(i + 1), Yb(Math.max(9.4, Math.min(10.6, s / (i + 1))))]; });
        meanPath.setAttribute('d', mp.length ? pathOf(mp) : '');
        const mean = n ? s / n : NaN;
        readout([['Readings N', n], ['Average', n ? `${mean.toFixed(4)} V` : '—'], ['Standard error σ/√N', n ? `${(sigma / Math.sqrt(n)).toFixed(4)} V` : '—'], ['Actual error', n ? `${(1000 * (mean - truth)).toFixed(1)} mV` : '—'], ['To halve the error', 'take 4 times as many readings']]);
    };
    const add = k => { for (let i = 0; i < k && readings.length < 1000; i++) readings.push(truth + sigma * exNormal(rnd)); render(k); };
    exButton(box, '+1 reading', () => add(1));
    exButton(box, '+10', () => add(10));
    exButton(box, '+100', () => add(100));
    exButton(box, 'Start again', () => { readings.length = 0; render(0); });
    render(0);
};

/* ---------- explore: power factor and capacitor correction ---------- */
EXPLORE_TYPES.powerfactor = box => {
    const W = 720, H = 262, V = 230, f = 50, readout = exReadout(box), svg = exSvg(box, W, H, 'Voltage and current phasors with the power triangle before and after correction');
    const PA = {x: 30, y: 10, w: 300, h: 242}, O = [40, 131], sc = 4.5;
    svgEl('path', {d: `M${O[0]} ${PA.y}V${PA.y + PA.h}M${O[0] - 10} ${O[1]}H${PA.x + PA.w}`, class: 'gd'}, svg);
    svgEl('path', {d: `M${O[0]} ${O[1]}H${O[0] + 200}m-10 -6 10 6 -10 6`, class: 'ln thick'}, svg);
    exText(svg, O[0] + 200, O[1] - 10, 'V = 230 V', {'text-anchor': 'end'});
    exText(svg, O[0] + 6, PA.y + PA.h - 6, 'lagging (inductive) below');
    const iLine = svgEl('path', {class: 'ac thick'}, svg), iLbl = exText(svg, 0, 0, 'I');
    const TX = 420, TY = 200, ksc = 20, tri = svgEl('path', {class: 'ln thick'}, svg), tri2 = svgEl('path', {class: 'ac dashed'}, svg);
    exText(svg, TX, TY + 20, 'P across, Q up · dashed: corrected');
    const st = {I: [28, -16], Qc: 0};
    const render = () => {
        const [ix, iy] = st.I, end = [O[0] + sc * ix, O[1] - sc * iy], ang = Math.atan2(iy, ix);
        iLine.setAttribute('d', `M${O[0]} ${O[1]}L${end[0]} ${end[1]}`);
        iLbl.setAttribute('x', end[0] + 8); iLbl.setAttribute('y', end[1] + 4);
        const P = V * ix / 1000, Q = -V * iy / 1000, S = Math.hypot(P, Q), pf = S ? Math.abs(P) / S : 1, Q2 = Q - st.Qc, S2 = Math.hypot(P, Q2), pf2 = S2 ? Math.abs(P) / S2 : 1;
        tri.setAttribute('d', `M${TX} ${TY}H${TX + ksc * P}V${TY - ksc * Q}Z`);
        tri2.setAttribute('d', `M${TX} ${TY}H${TX + ksc * P}V${TY - ksc * Q2}Z`);
        tri2.style.opacity = st.Qc ? 1 : 0;
        const kind = q => Math.abs(q) < .005 ? 'unity' : q > 0 ? 'lagging' : 'leading', C = st.Qc * 1000 / (2 * Math.PI * f * V * V) * 1e6;
        readout([['Current', `${Math.hypot(ix, iy).toFixed(1)} A at ${(ang * 180 / Math.PI).toFixed(1)}°`], ['P, Q, S', `${P.toFixed(2)} kW, ${Q.toFixed(2)} kvar, ${S.toFixed(2)} kVA`], ['Power factor', `${pf.toFixed(3)} ${kind(Q)}`],
            ['Capacitor', st.Qc ? `${st.Qc.toFixed(1)} kvar = ${C.toFixed(0)} µF` : 'none'], ['After correction', `pf ${pf2.toFixed(3)} ${kind(Q2)}, line current ${(1000 * S2 / V).toFixed(1)} A`]]);
    };
    const area = exArea(box, W, H, PA);
    exKnob(area, PA, 'Current phasor tip: drag, or use the arrow keys', [O[0] + sc * st.I[0], O[1] - sc * st.I[1]], v => { st.I = [Math.max(0, (v[0] - O[0]) / sc), (O[1] - v[1]) / sc]; render(); });
    exRange(box, 'Capacitor correction (kvar)', 0, 10, .1, 0, v => { st.Qc = v; render(); }, v => v.toFixed(1));
    render();
};

/* ---------- Play animations ---------- */
Object.assign(CONCEPT_CAPTION, {
    fourier: 'Odd harmonics, each a rotating circle, add up to a square wave. The overshoot at each edge never shrinks below about 9% of the jump: the Gibbs phenomenon.',
    kalman: 'Each noisy reading (dot) nudges the estimate by the Kalman gain K. The ±2σ band tightens and K settles to its steady value.',
    eye: 'Two-bit slices of a noisy signal, overlaid, make an eye. As the noise grows the eye closes, and with it the margin for deciding each bit.',
    huffman: 'Huffman’s algorithm merges the two least likely entries again and again; the merge tree gives every symbol its codeword.'
});
Object.assign(CONCEPT_SCENES, {
    fourier(svg) {
        const C = [80, 100], A = 40, X0 = 165, X1 = 352, stages = [1, 3, 5, 9, 15, 31], per = 1300;
        svgEl('path', {d: `M${X0} 100H${X1}M${X0} 40V160`, class: 'gd'}, svg);
        const circles = Array.from({length: 16}, () => svgEl('circle', {class: 'gd'}, svg)), arms = svgEl('polyline', {class: 'ac'}, svg), proj = svgEl('line', {class: 'gd'}, svg);
        const wave = svgEl('path', {class: 'ln thick'}, svg), label = exText(svg, 8, 18, '');
        const partial = (N, t) => { let v = 0; for (let n = 1; n <= N; n += 2) v += 4 / (n * Math.PI) * Math.sin(n * t); return v; };
        let shownN = 0;
        const frame = (N, th) => {
            if (N !== shownN) {
                shownN = N;
                const pts = [];
                for (let i = 0; i <= 500; i++) { const t = 4 * Math.PI * i / 500; pts.push([X0 + (X1 - X0) * i / 500, 100 - A * partial(N, t)]); }
                wave.setAttribute('d', pathOf(pts));
                let peak = 0;
                for (let i = 1; i < 2000; i++) peak = Math.max(peak, partial(N, Math.PI * i / 2000));
                label.textContent = `${(N + 1) / 2} harmonic${N > 1 ? 's' : ''} · overshoot ${(100 * (peak - 1) / 2).toFixed(1)}% of the jump`;
            }
            let x = C[0], y = C[1];
            const pts = [[x, y]];
            circles.forEach((c, i) => {
                const n = 2 * i + 1;
                if (n > N) { c.style.opacity = 0; return; }
                const r = A * 4 / (n * Math.PI);
                c.style.opacity = 1; c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', r.toFixed(1));
                x += r * Math.cos(n * th); y -= r * Math.sin(n * th);
                pts.push([x, y]);
            });
            arms.setAttribute('points', pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '));
            const wx = X0 + (X1 - X0) * ((th % (4 * Math.PI)) / (4 * Math.PI));
            [['x1', x], ['y1', y], ['x2', wx], ['y2', y]].forEach(([k, v]) => proj.setAttribute(k, v.toFixed(1)));
        };
        frame(1, 0);
        return () => { const o = {t: 0}; shownN = 0; return anime.animate(o, {t: stages.length * per, duration: stages.length * per, ease: 'linear', onUpdate: () => frame(stages[Math.min(stages.length - 1, Math.floor(o.t / per))], 2 * Math.PI * o.t / 1600)}); };
    },
    kalman(svg) {
        const rnd = exRng(7), n = 40, Q = .01, Rv = .25, truth = [], z = [];
        let x = 1;
        for (let k = 0; k < n; k++) { x += Math.sqrt(Q) * exNormal(rnd); truth.push(x); z.push(x + Math.sqrt(Rv) * exNormal(rnd)); }
        const est = [], band = [], gains = [];
        let xh = 0, P = 1;
        for (let k = 0; k < n; k++) { P += Q; const K = P / (P + Rv); xh += K * (z[k] - xh); P *= 1 - K; est.push(xh); band.push(2 * Math.sqrt(P)); gains.push(K); }
        const lo = Math.min(...z, ...est.map((e, k) => e - band[k])), hi = Math.max(...z, ...est.map((e, k) => e + band[k]));
        const X = k => 30 + 315 * k / (n - 1), Y = v => 180 - 150 * (v - lo) / (hi - lo);
        svgEl('path', {d: 'M30 30V180H345', class: 'ln'}, svg);
        const truthEl = svgEl('path', {d: pathOf(truth.map((v, k) => [X(k), Y(v)])), class: 'gd'}, svg);
        const bandEl = svgEl('path', {class: 'fillwash'}, svg), estEl = svgEl('path', {class: 'ac thick'}, svg), dots = svgEl('g', {}, svg), label = exText(svg, 36, 22, 'Press Play: readings arrive one by one');
        exText(svg, 345, 196, 'step k', {'text-anchor': 'end'});
        truthEl.style.opacity = .6;
        const frame = m => {
            dots.replaceChildren();
            for (let k = 0; k < m; k++) svgEl('circle', {cx: X(k), cy: Y(z[k]), r: 2.8, class: 'dot'}, dots);
            const e = est.slice(0, m).map((v, k) => [X(k), Y(v)]);
            estEl.setAttribute('d', m ? pathOf(e) : '');
            bandEl.setAttribute('d', m > 1 ? pathOf(est.slice(0, m).map((v, k) => [X(k), Y(v + band[k])])) + 'L' + pathOf(est.slice(0, m).map((v, k) => [X(k), Y(v - band[k])]).reverse()).slice(1) + 'Z' : '');
            if (m) label.textContent = `step ${m} · gain K = ${gains[m - 1].toFixed(3)} · ±2σ = ${band[m - 1].toFixed(3)}`;
        };
        return () => { frame(0); const o = {m: 0}; return anime.animate(o, {m: n, duration: n * 130, ease: 'linear', onUpdate: () => frame(Math.round(o.m))}); };
    },
    eye(svg) {
        const rnd = exRng(99), UI = 140, X0 = 40, nTr = 90, bits = Array.from({length: nTr + 4}, () => rnd() < .5 ? -1 : 1);
        const level = t => { const k = Math.floor(t), fr = t - k, a = bits[k], b = bits[k + 1]; return fr < .3 ? a : fr > .7 ? b : a + (b - a) * (1 - Math.cos(Math.PI * (fr - .3) / .4)) / 2; };
        svgEl('path', {d: `M${X0} 100H${X0 + 2 * UI}M${X0 + UI} 30V170`, class: 'gd'}, svg);
        exText(svg, X0 + UI, 190, 'decision instant', {'text-anchor': 'middle'});
        const traces = svgEl('g', {}, svg), label = exText(svg, 8, 18, 'Press Play: slices of the signal pile up');
        const sigma = i => .02 + .38 * i / (nTr - 1);
        const traceD = i => { const r2 = exRng(1000 + i), pts = []; for (let j = 0; j <= 48; j++) { const t = i + 2 * j / 48; pts.push([X0 + UI * 2 * j / 48, 100 - 60 * (level(t) + sigma(i) * exNormal(r2))]); } return pts; };
        const frame = m => {
            while (traces.childElementCount < m) { const i = traces.childElementCount; svgEl('path', {d: pathOf(traceD(i)), class: 'ac trace'}, traces); }
            if (m) {
                const centre = Array.from({length: m}, (_, i) => traceD(i)[24]);
                const highs = centre.filter((p, i) => bits[i + 1] > 0).map(p => p[1]), lows = centre.filter((p, i) => bits[i + 1] < 0).map(p => p[1]);
                const open = highs.length && lows.length ? Math.max(0, Math.min(...lows) - Math.max(...highs)) / 120 : 1;
                label.textContent = `${m} slices · noise σ = ${sigma(m - 1).toFixed(2)} · eye opening ${(100 * open).toFixed(0)}%`;
            }
        };
        return () => { traces.replaceChildren(); const o = {m: 0}; return anime.animate(o, {m: nTr, duration: nTr * 55, ease: 'linear', onUpdate: () => frame(Math.round(o.m))}); };
    },
    huffman(svg) {
        const leaves = [['A', .35], ['B', .2], ['C', .15], ['D', .12], ['E', .1], ['F', .08]].map(([s, p]) => ({s, p}));
        let pool = [...leaves];
        const merges = [];
        while (pool.length > 1) {
            pool.sort((a, b) => a.p - b.p);
            const [a, b] = pool, node = {p: a.p + b.p, kids: [a, b], order: merges.length};
            merges.push(node);
            pool = [node, ...pool.slice(2)];
        }
        const root = pool[0], ordered = [];
        const walk = (nd, code) => { nd.code = code; if (nd.kids) { walk(nd.kids[1], code + '0'); walk(nd.kids[0], code + '1'); } else ordered.push(nd); };
        walk(root, '');
        ordered.forEach((l, i) => { l.x = 40 + 280 * i / (ordered.length - 1); l.y = 150; });
        const place = nd => { if (!nd.kids) return; nd.kids.forEach(place); nd.x = (nd.kids[0].x + nd.kids[1].x) / 2; nd.y = 150 - 26 * (nd.order + 1); };
        place(root);
        const nodeEl = (nd, cls) => { const g = svgEl('g', {}, svg); svgEl('circle', {cx: nd.x, cy: nd.y, r: 13, class: cls}, g); exText(svg, nd.x, nd.y + 4, nd.p.toFixed(2).replace(/^0/, ''), {'text-anchor': 'middle', class: 'small-label'}); return g; };
        leaves.forEach(l => { l.el = nodeEl(l, 'ln joint'); exText(svg, l.x, l.y + 30, l.s, {'text-anchor': 'middle'}); l.codeEl = exText(svg, l.x, l.y + 44, '', {'text-anchor': 'middle', class: 'small-label'}); });
        const label = exText(svg, 8, 16, 'Press Play to build the code tree');
        merges.forEach(m => {
            m.edges = m.kids.map(k => { const L = Math.hypot(k.x - m.x, k.y - m.y), ux = (k.x - m.x) / L, uy = (k.y - m.y) / L; return svgEl('path', {d: `M${(m.x + 13 * ux).toFixed(1)} ${(m.y + 13 * uy).toFixed(1)}L${(k.x - 13 * ux).toFixed(1)} ${(k.y - 13 * uy).toFixed(1)}`, class: 'ln'}, svg); });
            m.bitLbls = m.kids.map((k, j) => exText(svg, (m.x + k.x) / 2 + (j ? 8 : -8), (m.y + k.y) / 2, j ? '1' : '0', {'text-anchor': 'middle', class: 'small-label accent-label'}));
            m.circle = svgEl('circle', {cx: m.x, cy: m.y, r: 13, class: 'ac joint'}, svg);
            m.txt = exText(svg, m.x, m.y + 4, m.p.toFixed(2).replace(/^0/, ''), {'text-anchor': 'middle', class: 'small-label'});
        });
        const parts = m => [...m.edges, ...m.bitLbls, m.circle, m.txt];
        const reset = () => { merges.forEach(m => parts(m).forEach(el => { el.style.opacity = 0; })); leaves.forEach(l => { l.codeEl.textContent = ''; }); label.textContent = 'Press Play to build the code tree'; };
        reset();
        const avg = leaves.reduce((s, l) => s + l.p * l.code.length, 0);
        return () => {
            reset();
            const tl = anime.createTimeline({defaults: {duration: 450, ease: 'outQuad'}});
            merges.forEach((m, i) => {
                const at = 300 + i * 1000;
                tl.call(() => { label.textContent = `Merge ${m.kids[0].p.toFixed(2)} + ${m.kids[1].p.toFixed(2)} = ${m.p.toFixed(2)}`; }, at);
                tl.add(parts(m), {opacity: [0, 1]}, at);
            });
            tl.call(() => { leaves.forEach(l => { l.codeEl.textContent = l.code; }); label.textContent = `Codewords read from the root · average ${avg.toFixed(2)} bits per symbol`; }, 300 + merges.length * 1000);
            return tl;
        };
    }
});
