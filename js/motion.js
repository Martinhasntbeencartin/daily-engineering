/* Motion and interactive figures, built on anime.js (bundled in vendor/animejs, MIT licence).
   - Automatic motion (diagrams drawing, card cascades, counters, bar fills, ticks, nudges, the reward toast,
     the "All correct" decode, the switch and picker glide, progress bars filling on scroll) never runs when the
     system asks for reduced motion, or if the library did not load.
   - Motion that someone asks for (Play, the step-by-step walk-through, dragging an explore figure) stays
     available, because they start it; the walk-through then changes in steps instead of tweening.
   Loaded before app.js; the functions read app state (topic, exercise) only when they are called. */
const hasAnime = () => typeof anime === 'object';
const calm = () => !hasAnime() || matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Clears the inline styles an animation leaves behind (anime.js's own clean-up would restore a hidden start state). */
const unstyle = els => els.forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('transform'); });
const SVG_NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs={}, parent=null) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
};

/* Draggables, observers and Play animations to stop when a screen or the solution panel is rebuilt. */
const LIVE = {screen: [], solution: []};
const keep = (x, bucket='screen') => { LIVE[bucket].push(x); return x; };
function release(bucket) {
    for (const x of LIVE[bucket].splice(0)) {
        try { if (x.disconnect) x.disconnect(); else if (x.revert) x.revert(); else x.pause?.(); } catch {}
    }
}

/* ---------- drawing lines ---------- */
const DRAW_ATTRS = ['pathLength', 'stroke-dasharray', 'stroke-dashoffset', 'draw'];
/* Draws SVG lines from nothing to whole, then removes every drawing attribute so they are exactly as authored. */
function drawLines(lines, {duration=600, step=0, start=0, ease='inOutSine'}={}) {
    return anime.animate(anime.createDrawable(lines), {
        draw: ['0 0', '0 1'], duration, delay: step ? anime.stagger(step, {start}) : start, ease,
        onComplete: () => lines.forEach(el => { DRAW_ATTRS.forEach(a => el.removeAttribute(a)); el.style.removeProperty('stroke-linecap'); })
    });
}
/* A problem's diagram is drawn line by line, as if sketched; dashed guides, filled dots and labels fade in. */
function drawDiagram(svg) {
    if (!svg || calm()) return;
    const shapes = [...svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')];
    const lines = shapes.filter(el => !el.hasAttribute('stroke-dasharray') && getComputedStyle(el).fill === 'none');
    const rest = [...shapes.filter(el => !lines.includes(el)), ...svg.querySelectorAll('text')];
    const step = Math.min(30, 600 / Math.max(lines.length, 1)), total = 600 + step * lines.length;
    if (lines.length) drawLines(lines, {step});
    if (rest.length) {
        anime.utils.set(rest, {opacity: 0});
        anime.animate(rest, {opacity: 1, duration: 400, delay: total * .45, ease: 'outQuad', onComplete: () => unstyle(rest)});
    }
}
const TICK_SVG = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
function drawTick(svg) {
    if (svg && !calm()) drawLines([...svg.querySelectorAll('path')], {duration: 380, ease: 'outQuad'});
}

/* ---------- small feedback ---------- */
/* Cards fade up one after another. */
function cascade(els) {
    if (!els.length || calm()) return;
    anime.utils.set(els, {opacity: 0, y: 10});
    anime.animate(els, {opacity: 1, y: 0, duration: 380, delay: anime.stagger(45), ease: 'outQuad', onComplete: () => unstyle(els)});
}
/* A number counts from one value to another. */
function countTo(el, from, to, duration=700) {
    if (!el) return;
    if (calm() || from === to) { el.textContent = to; return; }
    const o = {v: from};
    el.textContent = from;
    anime.animate(o, {v: to, duration, ease: 'outQuad', onUpdate: () => { el.textContent = Math.round(o.v); }, onComplete: () => { el.textContent = to; }});
}
/* A progress bar grows from one percentage to another. */
function fillBar(el, to, from=0) {
    if (!el) return;
    el.style.width = `${(calm() ? to : from).toFixed(1)}%`;
    if (!calm() && from !== to) anime.animate(el, {width: `${to.toFixed(1)}%`, duration: 700, delay: 120, ease: 'outCubic'});
}
/* A small side-to-side nudge for a wrong answer. */
function nudge(el) {
    if (!el || calm()) return;
    anime.animate(el, {x: [{to: -6, duration: 60}, {to: 6, duration: 80}, {to: -3, duration: 70}, {to: 0, duration: 90}], ease: 'inOutSine', onComplete: () => unstyle([el])});
}
/* The reward toast settles with a soft spring and its coin amounts count up. Returns false when it should not move. */
function popToast(el) {
    if (calm()) return false;
    el.style.animation = 'none';
    anime.utils.set(el, {opacity: 0, y: 28});
    anime.animate(el, {opacity: 1, y: 0, ease: anime.spring({bounce: .35, duration: 650}), onComplete: () => unstyle([el])});
    el.querySelectorAll('[data-count]').forEach(c => countTo(c, 0, Number(c.dataset.count), 900));
    return true;
}
/* "All correct." decodes from binary noise. */
function scrambleIn(el) {
    if (el && !calm()) anime.animate(el, {innerHTML: anime.scrambleText({chars: '01', revealRate: 40, settleDuration: 250})});
}
/* Where the chosen option sat before a re-render, relative to its container (for glide). */
function chosenRect(containerSel, chosenSel) {
    const box = document.querySelector(containerSel), el = box?.querySelector(chosenSel);
    if (!box || !el || box.closest('[hidden]')) return null;
    const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    return {left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height};
}
/* A highlight slides from the previously chosen option to the new one (category switch, archive picker). */
function glide(container, chosenSel, from) {
    const to = container?.querySelector(chosenSel);
    if (!to || !from || calm()) return;
    const b = container.getBoundingClientRect(), r = to.getBoundingClientRect(), end = {left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height};
    if (Math.abs(end.left - from.left) < 1 && Math.abs(end.top - from.top) < 1) return;
    const g = document.createElement('span');
    g.className = 'glider';
    g.setAttribute('aria-hidden', 'true');
    container.appendChild(g);
    container.classList.add('gliding');
    const px = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, `${v}px`]));
    anime.utils.set(g, px(from));
    anime.animate(g, {...px(end), duration: 340, ease: 'outCubic', onComplete: () => { g.remove(); container.classList.remove('gliding'); }});
}
/* Progress bars fill when they scroll into view. */
function fillOnScroll(bars, root) {
    if (!bars.length) return;
    if (calm()) { bars.forEach(b => { b.style.width = `${b.dataset.to}%`; }); return; }
    bars.forEach(b => { b.style.width = '0%'; });
    keep(anime.animate(bars, {width: el => `${el.dataset.to}%`, duration: 800, delay: anime.stagger(35), ease: 'outCubic', autoplay: anime.onScroll({target: root})}));
}

/* ---------- step-by-step walk-through of a worked solution ---------- */
const SUBSCRIPTS = Object.fromEntries([...'₀₁₂₃₄₅₆₇₈₉'].map((c, i) => [c, String(i)]).concat([['ₐ', 'a'], ['ₑ', 'e'], ['ₒ', 'o'], ['ₓ', 'x'], ['ₕ', 'h'], ['ₖ', 'k'], ['ₗ', 'l'], ['ₘ', 'm'], ['ₙ', 'n'], ['ₚ', 'p'], ['ₛ', 's'], ['ₜ', 't'], ['ᵢ', 'i'], ['ⱼ', 'j'], ['ᵣ', 'r'], ['ᵤ', 'u'], ['ᵥ', 'v']]));
const GREEK = {alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', Theta: 'Θ', lambda: 'λ', mu: 'μ', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', varphi: 'φ', Phi: 'Φ', psi: 'ψ', omega: 'ω', Omega: 'Ω'};
/* Symbols a step talks about: subscripted names (R_1 → R1, h_t → ht) and Greek letters, as plain tokens. */
function texTokens(tex) {
    const s = tex.replace(/\\(alpha|beta|gamma|Gamma|delta|Delta|varepsilon|epsilon|zeta|eta|Theta|theta|lambda|mu|rho|sigma|Sigma|tau|varphi|phi|Phi|psi|omega|Omega)(?![a-zA-Z])/g, (_, g) => GREEK[g]);
    const out = new Set();
    for (const m of s.matchAll(/([A-Za-zα-ωΑ-Ω])_(?:\{([A-Za-z0-9]{1,4})\}|([A-Za-z0-9]))/g)) out.add(m[1] + (m[2] || m[3]));
    for (const m of s.matchAll(/[α-ωΑ-Ω]/g)) out.add(m[0]);
    return out;
}
/* The symbol a diagram label names: "R₁ = 2 kΩ" → R1, "h_t = 10 m" → ht. */
const labelToken = text => [...text.trim().split(/[\s=:,]/)[0]].map(c => SUBSCRIPTS[c] ?? c).join('').replace('_', '');
function startWalk(panel, e) {
    const list = panel.querySelector('ol.steps'), bar = panel.querySelector('.walk-bar');
    if (!list || panel.querySelector('.walk')) return;
    const items = [...list.children], n = items.length;
    const wrap = document.createElement('div');
    wrap.className = 'walk';
    wrap.innerHTML = (e.diagram ? `<div class="walk-figure diagram" aria-hidden="true">${e.diagram}</div>` : '') + '<div class="walk-main"></div>';
    list.before(wrap);
    wrap.querySelector('.walk-main').append(list);
    bar.innerHTML = '<button type="button" class="ghost small" data-walk-back>← Back</button><span class="walk-count mono" aria-live="polite"></span><button type="button" class="primary small" data-walk-next>Next step →</button><button type="button" class="ghost small" data-walk-all>Show all steps</button>';
    list.classList.add('walking');
    const labels = [...wrap.querySelectorAll('.walk-figure text')].map(t => ({t, k: labelToken(t.textContent)}));
    let i = 0;
    const show = () => {
        items.forEach((li, j) => { li.classList.toggle('done', j < i); li.classList.toggle('current', j === i); li.classList.toggle('later', j > i); });
        const tokens = texTokens(e.steps[i] || ''), lit = labels.filter(l => tokens.has(l.k)).map(l => l.t);
        labels.forEach(l => l.t.classList.toggle('hl', lit.includes(l.t)));
        bar.querySelector('.walk-count').textContent = `Step ${i + 1} of ${n}`;
        bar.querySelector('[data-walk-back]').disabled = i === 0;
        bar.querySelector('[data-walk-next]').textContent = i === n - 1 ? 'Finish' : 'Next step →';
        if (!calm()) {
            const tl = anime.createTimeline({defaults: {ease: 'outQuad', duration: 320}});
            const cur = items[i]; // captured: i may have moved on before this finishes
            tl.add(cur, {opacity: [.25, 1], x: [12, 0], onComplete: () => unstyle([cur])});
            if (lit.length) tl.add(lit, {opacity: [.2, 1], duration: 260, loop: 1, onComplete: () => unstyle(lit)}, '-=200');
        }
    };
    const stop = () => {
        wrap.replaceWith(list);
        list.classList.remove('walking');
        items.forEach(li => li.classList.remove('done', 'current', 'later'));
        bar.innerHTML = '<button type="button" class="ghost small" data-walk>Walk through it step by step</button>';
        bar.querySelector('[data-walk]').addEventListener('click', () => startWalk(panel, e));
    };
    bar.querySelector('[data-walk-back]').addEventListener('click', () => { if (i > 0) { i--; show(); } });
    bar.querySelector('[data-walk-next]').addEventListener('click', () => { if (i < n - 1) { i++; show(); } else stop(); });
    bar.querySelector('[data-walk-all]').addEventListener('click', stop);
    show();
    bar.querySelector('[data-walk-next]').focus();
}

/* ---------- explore figures (you drag or slide; nothing moves on its own) ----------
   Each discipline lists its figures; a problem can override one with its own numbers (e.explore of the same type).
   The figure types live in EXPLORE_TYPES (the antenna array here, the rest in js/explore-ee.js). */
const EXPLORES_BY_TOPIC = {
    linkbudget: [{type: 'array', N: 8, d: .5, theta0: 0}], control: [{type: 'polezero'}], signals: [{type: 'sampling'}, {type: 'polezero'}],
    digital: [{type: 'logic'}], circuits: [{type: 'rc'}], electronics: [{type: 'opamp'}], measurement: [{type: 'averaging'}], power: [{type: 'powerfactor'}]
};
const EXPLORE_INTRO = {array: 'Drag the knob to steer the beam. Watch the main lobe widen away from broadside, and see where grating lobes appear. Change the element count and spacing too.'};
const EXPLORE_TITLE = {array: 'Steer an antenna array'};
const EXPLORE_TYPES = {};
const exploreList = e => hasAnime() ? (EXPLORES_BY_TOPIC[topic] || []).map(d => e.explore?.type === d.type ? e.explore : d).filter(d => EXPLORE_TYPES[d.type]) : [];
function exploreHTML(e) {
    const list = exploreList(e);
    if (!list.length) return '';
    return '<h4>Explore</h4>' + list.map(d => `<div class="explore fig" data-type="${d.type}"><h5 class="fig-title">${EXPLORE_TITLE[d.type]}</h5><p class="muted">${EXPLORE_INTRO[d.type]}</p>`
        + '<div class="explore-stage"></div><div class="explore-controls"></div><dl class="readouts" aria-live="polite"></dl></div>').join('');
}
function mountExplore(panel, e) {
    const list = exploreList(e);
    panel.querySelectorAll('.explore').forEach((box, i) => { if (list[i]) EXPLORE_TYPES[list[i].type](box, list[i], panel); });
}
/* The antenna array: drag the knob along its track to steer; buttons change the element count and spacing. */
EXPLORE_TYPES.array = (box, s) => {
    const stage = box.querySelector('.explore-stage'), out = box.querySelector('.readouts'), controls = box.querySelector('.explore-controls');
    const track = document.createElement('div'), knob = document.createElement('div');
    track.className = 'explore-track';
    knob.className = 'knob';
    knob.tabIndex = 0;
    knob.setAttribute('role', 'slider');
    knob.setAttribute('aria-label', 'Steering angle: drag, or use the arrow keys');
    track.append(knob);
    stage.after(track);
    const W = 360, H = 220, half = 11, lo = -75, hi = 75, span = () => track.clientWidth - 2 * half, st = {N: s.N, d: s.d};
    let value = s.theta0 || 0;
    const svg = svgEl('svg', {viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Array power pattern against angle from broadside'});
    stage.prepend(svg);
    const readout = pairs => { out.innerHTML = pairs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join(''); };
    const X0 = 34, X1 = 336, Y0 = 186, Y1 = 26, X = th => X0 + (X1 - X0) * (th + 90) / 180;
    svgEl('path', {d: `M${X0} ${Y1}V${Y0}H${X1}`, class: 'ln'}, svg);
    [-90, -45, 0, 45, 90].forEach(t => { svgEl('path', {d: `M${X(t)} ${Y0}v5`, class: 'ln'}, svg); svgEl('text', {x: X(t), y: Y0 + 20, 'text-anchor': 'middle'}, svg).textContent = `${t}°`; });
    svgEl('text', {x: X0 + 4, y: Y1 - 8}, svg).textContent = '|AF|² (normalised)';
    const beamLine = svgEl('line', {y1: Y1, y2: Y0, class: 'gd'}, svg), curvePath = svgEl('path', {class: 'ac thick'}, svg);
    const af = (u, u0) => { const ps = Math.PI * st.d * (u - u0); return Math.abs(Math.sin(ps)) < 1e-12 ? 1 : (Math.sin(st.N * ps) / (st.N * Math.sin(ps))) ** 2; };
    const render = () => {
        const u0 = Math.sin(value * Math.PI / 180), kd = 2 * Math.PI * st.d;
        let d = '';
        for (let i = 0; i <= 360; i++) { const th = -90 + i / 2; d += `${i ? 'L' : 'M'}${X(th).toFixed(1)} ${(Y0 - (Y0 - Y1) * af(Math.sin(th * Math.PI / 180), u0)).toFixed(1)}`; }
        curvePath.setAttribute('d', d);
        beamLine.setAttribute('x1', X(value)); beamLine.setAttribute('x2', X(value));
        let a = 1e-9, b = 2 * Math.PI / st.N;
        for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if ((Math.sin(st.N * m / 2) / (st.N * Math.sin(m / 2))) ** 2 > .5) a = m; else b = m; }
        const uL = Math.max(-1, u0 - a / kd), uR = Math.min(1, u0 + a / kd), hp = (Math.asin(uR) - Math.asin(uL)) * 180 / Math.PI;
        let den = st.N;
        for (let m = 1; m < st.N; m++) den += 2 * (st.N - m) * Math.sin(m * kd) / (m * kd) * Math.cos(m * kd * u0);
        const grating = Math.abs(u0 + 1 / st.d) <= 1 || Math.abs(u0 - 1 / st.d) <= 1;
        readout([['Steering θ₀', `${value.toFixed(1)}°`], ['Elements N', st.N], ['Spacing d', `${st.d.toFixed(2)} λ`], ['Half-power beamwidth', `${hp.toFixed(1)}°`], ['Directivity', `${(10 * Math.log10(st.N * st.N / den)).toFixed(2)} dBi`], ['Grating lobe', grating ? 'Yes: a second full-height beam is visible' : 'None']]);
    };
    controls.innerHTML = '<span class="ctl-label">Elements N</span><button type="button" class="ghost small" data-k="N" data-v="-1">−</button><button type="button" class="ghost small" data-k="N" data-v="1">+</button><span class="ctl-label">Spacing d/λ</span><button type="button" class="ghost small" data-k="d" data-v="-0.05">−</button><button type="button" class="ghost small" data-k="d" data-v="0.05">+</button>';
    controls.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
        const k = btn.dataset.k, v = Number(btn.dataset.v);
        st[k] = k === 'N' ? Math.min(24, Math.max(2, st.N + v)) : Math.round(Math.min(1.2, Math.max(.2, st.d + v)) * 100) / 100;
        render();
    }));
    const drag = keep(anime.createDraggable(knob, {container: track, y: false, velocityMultiplier: calm() ? 0 : .4, releaseStiffness: 200, cursor: {onHover: 'grab', onGrab: 'grabbing'},
        onUpdate: d => { value = lo + (hi - lo) * Math.min(1, Math.max(0, d.x / span())); render(); }}), 'solution');
    const place = () => drag.setX((value - lo) / (hi - lo) * span(), true);
    knob.addEventListener('keydown', ev => {
        const dx = {ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1}[ev.key];
        if (!dx) return;
        ev.preventDefault();
        value = Math.min(hi, Math.max(lo, value + dx * (hi - lo) / 60));
        place();
        render();
    });
    const ro = new ResizeObserver(() => { drag.refresh(); place(); });
    ro.observe(stage);
    keep(ro, 'solution');
    place();
    render();
};

/* ---------- concept animations (they only play when Play is pressed) ---------- */
const CONCEPTS_BY_TOPIC = {power: ['phasor'], signals: ['phasor', 'fourier'], circuits: ['loop'], rfcircuits: ['smith'], modulation: ['qam', 'eye'], control: ['damping'], sensors: ['kalman'], infotheory: ['huffman']};
const CONCEPT_CAPTION = {
    phasor: 'A phasor turns at ω; its height traces the sine wave v(t) = V sin ωt.',
    loop: 'In a series loop the same current flows everywhere: charge leaves the source, passes the resistor and returns.',
    smith: 'Moving away from the load turns Γ clockwise at constant |Γ|: one full turn every half wavelength.',
    qam: 'Each step quadruples the points and adds 2 bits per symbol, but at the same peak power the points crowd closer.',
    damping: 'The same second-order system with more and more damping: ringing, a quick overshoot, critical damping, then a slow crawl.'
};
/* A problem's own settings (e.concept) apply to the concept of its type, or to the first one when it names none. */
const conceptList = e => !hasAnime() ? [] : (CONCEPTS_BY_TOPIC[topic] || []).map((type, i) => ({type, ...(e.concept && (e.concept.type ? e.concept.type === type : i === 0) ? e.concept : {})})).filter(c => CONCEPT_SCENES[c.type]);
function conceptHTML(e) {
    const list = conceptList(e);
    if (!list.length) return '';
    return '<h4>See it move</h4>' + list.map(c => `<div class="concept fig" data-type="${c.type}"><div class="concept-stage"></div><div class="concept-bar"><button type="button" class="ghost small concept-play">▶ Play</button><span class="concept-caption">${CONCEPT_CAPTION[c.type]}</span></div></div>`).join('');
}
const CONCEPT_SCENES = {
    phasor(svg) {
        const C = [80, 100], r = 62, X0 = 166, X1 = 350, turns = 2;
        svgEl('circle', {cx: C[0], cy: C[1], r, class: 'gd'}, svg);
        svgEl('path', {d: `M${C[0] - r - 8} ${C[1]}H${X1}M${X0} ${C[1] - r - 10}V${C[1] + r + 10}`, class: 'gd'}, svg);
        svgEl('text', {x: X1 - 6, y: C[1] + 18, 'text-anchor': 'end'}, svg).textContent = 'ωt';
        const proj = svgEl('line', {class: 'gd'}, svg), wave = svgEl('path', {class: 'ln thick'}, svg), vec = svgEl('line', {x1: C[0], y1: C[1], class: 'ac thick'}, svg), tip = svgEl('circle', {r: 4.5, class: 'dot'}, svg);
        const frame = a => {
            const tx = C[0] + r * Math.cos(a), ty = C[1] - r * Math.sin(a), wx = X0 + (X1 - X0) * a / (2 * Math.PI * turns);
            vec.setAttribute('x2', tx.toFixed(1)); vec.setAttribute('y2', ty.toFixed(1)); tip.setAttribute('cx', tx.toFixed(1)); tip.setAttribute('cy', ty.toFixed(1));
            [['x1', tx], ['y1', ty], ['x2', wx], ['y2', ty]].forEach(([k, v]) => proj.setAttribute(k, v.toFixed(1)));
            let d = '';
            for (let i = 0, n = Math.max(1, Math.ceil(a / .05)); i <= n; i++) { const t = a * i / n; d += `${i ? 'L' : 'M'}${(X0 + (X1 - X0) * t / (2 * Math.PI * turns)).toFixed(1)} ${(C[1] - r * Math.sin(t)).toFixed(1)}`; }
            wave.setAttribute('d', d);
        };
        frame(0);
        return () => { const o = {a: 0}; return anime.animate(o, {a: 2 * Math.PI * turns, duration: 6000, ease: 'linear', onUpdate: () => frame(o.a)}); };
    },
    loop(svg) {
        const path = svgEl('path', {d: 'M70 40H290V165H70Z', fill: 'none', stroke: 'none'}, svg);
        svgEl('path', {d: 'M70 95V40H150M210 40H290V165H70V109', class: 'ln'}, svg);
        svgEl('rect', {x: 150, y: 31, width: 60, height: 18, class: 'ln'}, svg);
        svgEl('path', {d: 'M56 95h28M63 109h14', class: 'ln thick'}, svg);
        svgEl('text', {x: 92, y: 92}, svg).textContent = '+';
        svgEl('text', {x: 180, y: 24, 'text-anchor': 'middle'}, svg).textContent = 'R';
        svgEl('text', {x: 40, y: 106, 'text-anchor': 'middle'}, svg).textContent = 'V';
        svgEl('text', {x: 310, y: 106}, svg).textContent = 'I';
        const L = path.getTotalLength(), n = 10, dots = Array.from({length: n}, (_, i) => { const p = path.getPointAtLength(L * i / n), d = svgEl('circle', {cx: 0, cy: 0, r: 4, class: 'dot'}, svg); d.style.transform = `translate(${p.x}px, ${p.y}px)`; return d; });
        return () => {
            const tl = anime.createTimeline();
            dots.forEach((d, i) => { const m = anime.createMotionPath(path, i / n); tl.add(d, {translateX: m.translateX, translateY: m.translateY, duration: 7000, ease: 'linear'}, 0); });
            return tl;
        };
    },
    smith(svg, c) {
        const C = [180, 104], R = 88, g0 = c.gamma || [.35, .35], mag = Math.hypot(...g0), ph0 = Math.atan2(g0[1], g0[0]);
        svgEl('circle', {cx: C[0], cy: C[1], r: R, class: 'ln'}, svg);
        svgEl('path', {d: `M${C[0] - R} ${C[1]}H${C[0] + R}`, class: 'gd'}, svg);
        for (const rr of [.5, 1, 2]) svgEl('circle', {cx: C[0] + R * rr / (1 + rr), cy: C[1], r: R / (1 + rr), class: 'gd'}, svg);
        // Constant-reactance arcs, only the part inside the chart: from the open-circuit point to ((x² − 1)/(x² + 1), 2x/(x² + 1)).
        for (const x of [.5, 1, 2, -.5, -1, -2]) {
            const gx = (x * x - 1) / (x * x + 1), gy = 2 * x / (x * x + 1);
            svgEl('path', {d: `M${C[0] + R} ${C[1]}A${(R / Math.abs(x)).toFixed(2)} ${(R / Math.abs(x)).toFixed(2)} 0 0 ${x > 0 ? 1 : 0} ${(C[0] + R * gx).toFixed(2)} ${(C[1] - R * gy).toFixed(2)}`, class: 'gd'}, svg);
        }
        svgEl('circle', {cx: C[0], cy: C[1], r: R * mag, class: 'ac dashed'}, svg);
        const trace = svgEl('path', {class: 'ac thick'}, svg), dot = svgEl('circle', {r: 5, class: 'dot'}, svg), label = svgEl('text', {x: 286, y: 30}, svg);
        svgEl('text', {x: C[0] - R - 4, y: C[1] + 18, 'text-anchor': 'end'}, svg).textContent = 'short';
        svgEl('text', {x: C[0] + R + 4, y: C[1] + 18}, svg).textContent = 'open';
        const at = l => [C[0] + R * mag * Math.cos(ph0 - 4 * Math.PI * l), C[1] - R * mag * Math.sin(ph0 - 4 * Math.PI * l)];
        const frame = l => {
            const [x, y] = at(l);
            dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1));
            let d = '';
            for (let i = 0, n = Math.max(1, Math.ceil(l / .004)); i <= n; i++) { const [px, py] = at(l * i / n); d += `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`; }
            trace.setAttribute('d', d);
            label.textContent = `ℓ = ${l.toFixed(3)} λ`;
        };
        frame(0);
        return () => { const o = {l: 0}; return anime.animate(o, {l: .5, duration: 6000, ease: 'linear', onUpdate: () => frame(o.l)}); };
    },
    qam(svg) {
        const C = [180, 112], s = 10, sg = v => v < 0 ? -1 : 1, p16 = v => sg(v) * (Math.abs(v) < 4 ? 2 : 6), p4 = v => sg(v) * 4, lv = [-7, -5, -3, -1, 1, 3, 5, 7];
        svgEl('path', {d: `M${C[0] - 86} ${C[1]}H${C[0] + 86}M${C[0]} ${C[1] - 82}V${C[1] + 82}`, class: 'gd'}, svg);
        svgEl('text', {x: C[0] + 92, y: C[1] + 4}, svg).textContent = 'I';
        svgEl('text', {x: C[0] + 6, y: C[1] - 86}, svg).textContent = 'Q';
        const label = svgEl('text', {x: 8, y: 16}, svg);
        const dots = lv.flatMap(a => lv.map(b => { const d = svgEl('circle', {r: 4, class: 'dot'}, svg); d.dataset.a = a; d.dataset.b = b; return d; }));
        const at = (d, f) => [C[0] + s * f(Number(d.dataset.a)), C[1] - s * f(Number(d.dataset.b))];
        const reset = () => { dots.forEach(d => { const [x, y] = at(d, p4); d.setAttribute('cx', x); d.setAttribute('cy', y); }); label.textContent = 'QPSK · 4 points · 2 bits'; };
        reset();
        return () => {
            reset();
            const tl = anime.createTimeline({defaults: {ease: 'inOutQuad', duration: 1000}});
            tl.add(dots, {cx: d => at(d, p16)[0], cy: d => at(d, p16)[1]}, 900).call(() => { label.textContent = '16-QAM · 16 points · 4 bits'; }, 900)
              .add(dots, {cx: d => at(d, v => v)[0], cy: d => at(d, v => v)[1]}, 3000).call(() => { label.textContent = '64-QAM · 64 points · 6 bits'; }, 3000);
            return tl;
        };
    },
    damping(svg) {
        const X0 = 40, X1 = 345, Y0 = 180, Y1 = 22, T = 14, zetas = [.15, .4, 1, 2.5];
        const y = (z, t) => z < 1 ? 1 - Math.exp(-z * t) * (Math.cos(Math.sqrt(1 - z * z) * t) + z / Math.sqrt(1 - z * z) * Math.sin(Math.sqrt(1 - z * z) * t))
            : z === 1 ? 1 - Math.exp(-t) * (1 + t) : (() => { const r = Math.sqrt(z * z - 1), s1 = -z + r, s2 = -z - r; return 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1); })();
        const pathOf = z => Array.from({length: 141}, (_, i) => { const t = T * i / 140; return `${i ? 'L' : 'M'}${(X0 + (X1 - X0) * t / T).toFixed(2)} ${(Y0 - (Y0 - Y1) * y(z, t) / 1.8).toFixed(2)}`; }).join(' ');
        svgEl('path', {d: `M${X0} ${Y1}V${Y0}H${X1}`, class: 'ln'}, svg);
        svgEl('path', {d: `M${X0} ${(Y0 - (Y0 - Y1) / 1.8).toFixed(1)}H${X1}`, class: 'gd'}, svg);
        svgEl('text', {x: X0 + 4, y: Y1 - 6}, svg).textContent = 'step response y(t)';
        svgEl('text', {x: X1, y: Y0 + 18, 'text-anchor': 'end'}, svg).textContent = 'ωₙt';
        const defs = svgEl('defs', {}, svg), targets = zetas.map(z => svgEl('path', {d: pathOf(z)}, defs));
        const curve = svgEl('path', {d: pathOf(zetas[0]), class: 'ac thick'}, svg), label = svgEl('text', {x: X1, y: Y1 + 10, 'text-anchor': 'end'}, svg);
        const reset = () => { curve.setAttribute('d', targets[0].getAttribute('d')); label.textContent = `ζ = ${zetas[0]}`; };
        reset();
        return () => {
            reset();
            const tl = anime.createTimeline({defaults: {ease: 'inOutQuad', duration: 1100}});
            zetas.slice(1).forEach((z, i) => { const at = 900 + i * 1900; tl.add(curve, {d: anime.morphTo(targets[i + 1], 0)}, at).call(() => { label.textContent = `ζ = ${z}`; }, at + 550); });
            return tl;
        };
    }
};
function mountConcept(panel, e) {
    const list = conceptList(e);
    panel.querySelectorAll('.concept').forEach((box, i) => {
        const c = list[i];
        if (!c) return;
        const svg = svgEl('svg', {viewBox: '0 0 360 200', role: 'img', 'aria-label': CONCEPT_CAPTION[c.type]});
        box.querySelector('.concept-stage').append(svg);
        const play = CONCEPT_SCENES[c.type](svg, c), btn = box.querySelector('.concept-play');
        let running = null;
        btn.addEventListener('click', () => {
            running?.pause();
            running = keep(play(), 'solution');
            btn.textContent = '■ Playing…';
            btn.disabled = true;
            running.then(() => { btn.disabled = false; btn.textContent = '↺ Replay'; });
        });
    });
}

/* Everything interactive inside a freshly rendered worked solution. */
function mountSolution(panel, e) {
    release('solution');
    panel.pz = null; // the pole–zero state shared by the explorer and the 3D |H(s)| view starts afresh
    panel.querySelector('[data-walk]')?.addEventListener('click', () => startWalk(panel, e));
    mountConcept(panel, e);
    mountExplore(panel, e);
    if (typeof mount3D === 'function') mount3D(panel, e); // js/scenes3d.js
}
