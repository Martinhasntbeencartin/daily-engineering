/* Motion, built on anime.js (bundled in vendor/animejs, MIT licence).
   - Automatic motion (diagrams drawing, card cascades, counters, bar fills, ticks, nudges, the reward toast,
     the "All correct" decode, the switch and picker glide, progress bars filling on scroll) never runs when the
     system asks for reduced motion, or if the library did not load.
   - The step-by-step walk-through stays available, because people start it; with reduced motion it changes in
     steps instead of tweening.
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

/* Everything interactive inside a freshly rendered worked solution: the step-by-step walk-through. */
function mountSolution(panel, e) {
    release('solution');
    panel.querySelector('[data-walk]')?.addEventListener('click', () => startWalk(panel, e));
}
