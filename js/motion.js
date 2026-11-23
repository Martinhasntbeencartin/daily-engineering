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
const fmtDeg = r => `${(((r * 180 / Math.PI + 180) % 360 + 360) % 360 - 180).toFixed(1)}°`;

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

/* ---------- explore figures (drag to change the model) ---------- */
const EXPLORE_DEFAULT = {kinematics: {type: 'arm2', l1: .6, l2: .4}, statics: {type: 'beam', L: 6, P: 10}, linkbudget: {type: 'array', N: 8, d: .5, theta0: 0}};
const EXPLORE_TEXT = {
    arm2: 'Drag the red hand. The arm solves its own inverse kinematics: watch the joint angles and det J, and find the places where it loses a direction of motion.',
    array: 'Drag the knob to steer the beam. Watch the main lobe widen away from broadside, and see where grating lobes appear. Change the element count and spacing too.',
    beam: 'Drag the load along the simply supported beam. The supports share it in proportion to distance, and the bending moment peaks under the load.'
};
const exploreSpec = e => hasAnime() ? (e.explore || EXPLORE_DEFAULT[topic] || null) : null;
function exploreHTML(e) {
    const s = exploreSpec(e);
    if (!s) return '';
    const knob = label => `<div class="knob" tabindex="0" role="slider" aria-label="${label}"></div>`;
    return `<h4>Explore</h4><div class="explore fig" data-type="${s.type}"><p class="muted">${EXPLORE_TEXT[s.type]}</p>`
        + `<div class="explore-stage">${s.type === 'arm2' ? knob('Hand position: drag, or use the arrow keys') : ''}</div>`
        + (s.type === 'arm2' ? '' : `<div class="explore-track">${knob(s.type === 'array' ? 'Steering angle: drag, or use the arrow keys' : 'Load position: drag, or use the arrow keys')}</div>`)
        + '<div class="explore-controls"></div><dl class="readouts" aria-live="polite"></dl></div>';
}
function mountExplore(panel, e) {
    const box = panel.querySelector('.explore');
    if (!box) return;
    const s = exploreSpec(e), stage = box.querySelector('.explore-stage'), knob = box.querySelector('.knob'), out = box.querySelector('.readouts'), controls = box.querySelector('.explore-controls');
    const W = 360, H = s.type === 'arm2' ? 330 : s.type === 'beam' ? 262 : 220, half = 11;
    const svg = svgEl('svg', {viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': {arm2: 'Two-link arm and its reachable ring', array: 'Array power pattern against angle from broadside', beam: 'Simply supported beam, its point load, reactions and bending moment diagram'}[s.type]});
    stage.prepend(svg);
    const readout = pairs => { out.innerHTML = pairs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join(''); };
    const kpx = () => stage.clientWidth / W; // CSS pixels per drawing unit
    const opts = extra => ({velocityMultiplier: calm() ? 0 : .4, releaseStiffness: 200, cursor: {onHover: 'grab', onGrab: 'grabbing'}, ...extra});
    let drag, place, render, nudgeBy;

    if (s.type === 'arm2') {
        const R = s.l1 + s.l2, rmin = Math.abs(s.l1 - s.l2), sc = 145 / R, O = [180, 168];
        const toView = ([x, y]) => [O[0] + sc * x, O[1] - sc * y], toWorld = ([vx, vy]) => [(vx - O[0]) / sc, (O[1] - vy) / sc];
        svgEl('circle', {cx: O[0], cy: O[1], r: sc * R, class: 'gd'}, svg);
        if (rmin > 1e-6) svgEl('circle', {cx: O[0], cy: O[1], r: sc * rmin, class: 'gd'}, svg);
        svgEl('path', {d: `M${O[0] - 16} ${O[1] + 16}h32M${O[0] - 9} ${O[1] + 16}L${O[0]} ${O[1]}L${O[0] + 9} ${O[1] + 16}`, class: 'ln'}, svg);
        if (s.target) { const [tx, ty] = toView(s.target); svgEl('path', {d: `M${tx - 7} ${ty - 7}l14 14m0 -14l-14 14`, class: 'ac'}, svg); svgEl('text', {x: tx + 10, y: ty - 8}, svg).textContent = 'target'; }
        const reachLine = svgEl('line', {class: 'gd'}, svg), links = svgEl('polyline', {class: 'ln thick'}, svg), j1 = svgEl('circle', {r: 6, class: 'ln joint'}, svg), j2 = svgEl('circle', {r: 6, class: 'ln joint'}, svg);
        let branch = 1, hand = s.target ? [...s.target] : fkN([s.l1, s.l2], [Math.PI * 40 / 180, Math.PI * 70 / 180])[2];
        render = () => {
            const r = Math.hypot(...hand), rc = Math.min(R - 1e-9, Math.max(rmin + 1e-9, r)), [x, y] = r > 1e-9 ? hand.map(v => v * rc / r) : [rc, 0];
            const sol = ik2(s.l1, s.l2, x, y, branch), pts = fkN([s.l1, s.l2], [sol.q1, sol.q2]).map(toView), hv = toView(hand);
            links.setAttribute('points', pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '));
            j1.setAttribute('cx', pts[0][0]); j1.setAttribute('cy', pts[0][1]); j2.setAttribute('cx', pts[1][0].toFixed(1)); j2.setAttribute('cy', pts[1][1].toFixed(1));
            [['x1', pts[2][0]], ['y1', pts[2][1]], ['x2', hv[0]], ['y2', hv[1]]].forEach(([a, v]) => reachLine.setAttribute(a, v.toFixed(1)));
            reachLine.style.opacity = r > R || r < rmin ? 1 : 0;
            const det = s.l1 * s.l2 * Math.sin(sol.q2);
            readout([['q₁', fmtDeg(sol.q1)], ['q₂', fmtDeg(sol.q2)], ['Hand (x, y)', `(${hand[0].toFixed(3)}, ${hand[1].toFixed(3)}) m`], ['Reach r', `${r.toFixed(3)} m`], ['det J', `${det.toFixed(4)} m²`],
                ['Status', r > R ? 'Out of reach: the arm points at the hand' : r < rmin ? 'Too close: inside the hole' : Math.abs(Math.sin(sol.q2)) < .06 ? 'Near a singularity' : 'Reachable']]);
        };
        place = () => { const [vx, vy] = toView(hand), k = kpx(); drag.setX(vx * k - half, true); drag.setY(vy * k - half, true); };
        drag = anime.createDraggable(knob, opts({container: stage, onUpdate: d => { const k = kpx(); hand = toWorld([(d.x + half) / k, (d.y + half) / k]); render(); }}));
        nudgeBy = (dx, dy) => { hand = [hand[0] + dx * R / 40, hand[1] + dy * R / 40]; place(); render(); };
        controls.innerHTML = '<button type="button" class="ghost small">Flip the elbow</button>';
        controls.querySelector('button').addEventListener('click', () => { branch = -branch; render(); });
    } else {
        const track = box.querySelector('.explore-track'), span = () => track.clientWidth - 2 * half;
        let value, lo, hi;
        if (s.type === 'array') {
            const st = {N: s.N, d: s.d}, X0 = 34, X1 = 336, Y0 = 186, Y1 = 26, X = th => X0 + (X1 - X0) * (th + 90) / 180;
            [lo, hi, value] = [-75, 75, s.theta0 || 0];
            svgEl('path', {d: `M${X0} ${Y1}V${Y0}H${X1}`, class: 'ln'}, svg);
            [-90, -45, 0, 45, 90].forEach(t => { svgEl('path', {d: `M${X(t)} ${Y0}v5`, class: 'ln'}, svg); svgEl('text', {x: X(t), y: Y0 + 20, 'text-anchor': 'middle'}, svg).textContent = `${t}°`; });
            svgEl('text', {x: X0 + 4, y: Y1 - 8}, svg).textContent = '|AF|² (normalised)';
            const beamLine = svgEl('line', {y1: Y1, y2: Y0, class: 'gd'}, svg), curvePath = svgEl('path', {class: 'ac thick'}, svg);
            const af = (u, u0) => { const ps = Math.PI * st.d * (u - u0); return Math.abs(Math.sin(ps)) < 1e-12 ? 1 : (Math.sin(st.N * ps) / (st.N * Math.sin(ps))) ** 2; };
            render = () => {
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
        } else { // beam
            const X0 = 40, X1 = 320, yb = 76, base = 168, X = a => X0 + (X1 - X0) * a / s.L;
            [lo, hi, value] = [0, s.L, s.L / 2];
            svgEl('rect', {x: X0, y: yb, width: X1 - X0, height: 12, rx: 2, class: 'ln'}, svg);
            svgEl('path', {d: `M${X0} ${yb + 12}l-12 20h24zM${X1} ${yb + 12}l-12 20h24z`, class: 'ln'}, svg);
            svgEl('path', {d: `M${X0} ${base}H${X1}`, class: 'gd'}, svg);
            svgEl('text', {x: X1, y: base - 8, 'text-anchor': 'end'}, svg).textContent = 'bending moment';
            const load = svgEl('path', {class: 'ac thick'}, svg), ra = svgEl('path', {class: 'ln'}, svg), rb = svgEl('path', {class: 'ln'}, svg), moment = svgEl('polygon', {class: 'ac fillwash'}, svg), mt = svgEl('text', {'text-anchor': 'middle'}, svg);
            render = () => {
                const a = value, RA = s.P * (s.L - a) / s.L, RB = s.P * a / s.L, M = s.P * a * (s.L - a) / s.L, xa = X(a), depth = 60 * M / (s.P * s.L / 4);
                load.setAttribute('d', `M${xa} ${yb - 50}V${yb - 2}m-7 -11 7 11 7 -11`);
                const arrowUp = (x, f) => `M${x} ${yb + 62 + 40 * f / s.P}V${yb + 36}m-6 9 6 -9 6 9`;
                ra.setAttribute('d', arrowUp(X0, RA)); rb.setAttribute('d', arrowUp(X1, RB));
                moment.setAttribute('points', `${X0},${base} ${xa.toFixed(1)},${(base + depth).toFixed(1)} ${X1},${base}`);
                mt.setAttribute('x', xa.toFixed(1)); mt.setAttribute('y', (base + depth + 16).toFixed(1)); mt.textContent = `${M.toFixed(2)} kN·m`;
                readout([['Load position a', `${a.toFixed(2)} m of ${s.L} m`], ['Load P', `${s.P} kN`], ['R_A', `${RA.toFixed(2)} kN`], ['R_B', `${RB.toFixed(2)} kN`], ['Peak moment (under the load)', `${M.toFixed(2)} kN·m`]]);
            };
        }
        place = () => drag.setX((value - lo) / (hi - lo) * span(), true);
        drag = anime.createDraggable(knob, opts({container: track, y: false, onUpdate: d => { value = lo + (hi - lo) * Math.min(1, Math.max(0, d.x / span())); render(); }}));
        nudgeBy = dx => { value = Math.min(hi, Math.max(lo, value + dx * (hi - lo) / 60)); place(); render(); };
    }
    keep(drag, 'solution');
    knob.addEventListener('keydown', ev => {
        const step = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1]}[ev.key];
        if (!step) return;
        ev.preventDefault();
        nudgeBy(...step);
    });
    const ro = new ResizeObserver(() => { drag.refresh(); place(); });
    ro.observe(stage);
    keep(ro, 'solution');
    place();
    render();
}

/* ---------- concept animations (they only play when Play is pressed) ---------- */
const CONCEPT_BY_TOPIC = {power: 'phasor', signals: 'phasor', circuits: 'loop', rfcircuits: 'smith', modulation: 'qam', control: 'damping', robotcontrol: 'damping'};
const CONCEPT_CAPTION = {
    phasor: 'A phasor turns at ω; its height traces the sine wave v(t) = V sin ωt.',
    loop: 'In a series loop the same current flows everywhere: charge leaves the source, passes the resistor and returns.',
    smith: 'Moving away from the load turns Γ clockwise at constant |Γ|: one full turn every half wavelength.',
    qam: 'Each step quadruples the points and adds 2 bits per symbol, but at the same peak power the points crowd closer.',
    damping: 'The same second-order system with more and more damping: ringing, a quick overshoot, critical damping, then a slow crawl.'
};
const conceptSpec = e => hasAnime() && CONCEPT_BY_TOPIC[topic] ? {type: CONCEPT_BY_TOPIC[topic], ...(e.concept || {})} : null;
function conceptHTML(e) {
    const c = conceptSpec(e);
    if (!c) return '';
    return `<h4>See it move</h4><div class="concept fig" data-type="${c.type}"><div class="concept-stage"></div><div class="concept-bar"><button type="button" class="ghost small concept-play">▶ Play</button><span class="concept-caption">${CONCEPT_CAPTION[c.type]}</span></div></div>`;
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
    const box = panel.querySelector('.concept');
    if (!box) return;
    const c = conceptSpec(e), svg = svgEl('svg', {viewBox: '0 0 360 200', role: 'img', 'aria-label': CONCEPT_CAPTION[c.type]});
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
}

/* Everything interactive inside a freshly rendered worked solution. */
function mountSolution(panel, e) {
    release('solution');
    panel.querySelector('[data-walk]')?.addEventListener('click', () => startWalk(panel, e));
    mountConcept(panel, e);
    mountExplore(panel, e);
}
