/* 3D views with three.js: antenna radiation patterns.
   three.js is large, so the tree-shaken bundle (vendor/three/three-lite.min.js, built by tools/build-three.mjs) is
   downloaded only when someone presses "Open the 3D view". Nothing moves on its own: you orbit with the mouse or a
   finger, and change the model with sliders. */
const THREE_URL = () => new URL('vendor/three/three-lite.min.js?v=0.187.0', document.baseURI).href;
let threeModule = null;
const loadThree = () => threeModule ||= import(THREE_URL());
/* Each discipline lists its 3D views; a problem can override one with its own numbers (e.view3d of the same type). */
const VIEWS3D_BY_TOPIC = {
    linkbudget: [{type: 'pattern', mode: 'array', N: 8, d: .5, theta0: 0}],
    fields: [{type: 'pattern', mode: 'dipole'}, {type: 'wave'}, {type: 'fieldlines'}, {type: 'waveguide'}],
    control: [{type: 'hsurface'}], signals: [{type: 'hsurface'}], motors: [{type: 'rotating'}], power: [{type: 'rotating'}], rfcircuits: [{type: 'waveguide'}]
};
const VIEW3D_TITLE = {pattern: 'Antenna radiation pattern', wave: 'An electromagnetic wave and its polarisation', fieldlines: 'Field lines in 3D', waveguide: 'Inside a waveguide: the TE₁₀ mode', hsurface: '|H(s)| as a landscape', rotating: 'The rotating magnetic field'};
const VIEW3D_TEXT = {
    pattern: 'The radiation pattern as a surface: its distance from the centre is the radiated power in that direction. Orbit it, then change the array.',
    wave: 'E (red) and H (white) travel together along the axis. Press Play, then change the phase between the two E components: linear, circular (a helix) or elliptical.',
    fieldlines: 'Electric field lines from two point charges, or magnetic field lines around a current loop. Change the second charge and watch the lines reconnect.',
    waveguide: 'The electric field of the TE₁₀ mode in a WR-90 guide: strongest in the middle, zero at the side walls. Press Play, then lower the frequency towards cutoff.',
    hsurface: 'The height is log|H(s)| over the s-plane: poles are peaks, zeros are pits, and the red cut along the jω axis is the Bode magnitude. Drag the poles and zeros in the explorer above.',
    rotating: 'Three coils 120° apart carry currents 120° apart in time. Their fields add up to one vector of constant length that turns: the heart of every induction motor.'
};
const view3dList = e => (VIEWS3D_BY_TOPIC[topic] || []).map(d => e.view3d?.type === d.type ? e.view3d : d);
function scene3dHTML(e) {
    const list = view3dList(e);
    if (!list.length) return '';
    return '<h4>Explore in 3D</h4>' + list.map(s => `<div class="view3d fig" data-type="${s.type}"><h5 class="fig-title">${VIEW3D_TITLE[s.type]}</h5><p class="muted">${VIEW3D_TEXT[s.type]}</p>`
        + `<button type="button" class="ghost small view3d-open">Open the 3D view <span class="view3d-size">· ${threeModule ? 'ready' : 'downloads about 140 KB, once'}</span></button>`
        + '<div class="view3d-stage" hidden></div><div class="view3d-controls" hidden></div><dl class="readouts" aria-live="polite"></dl></div>').join('');
}
function mount3D(panel, e) {
    const list = view3dList(e);
    panel.querySelectorAll('.view3d').forEach((box, i) => {
        const spec = list[i], btn = box.querySelector('.view3d-open');
        if (!spec) return;
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.firstChild.textContent = 'Loading the 3D view… ';
            try {
                const T = await loadThree();
                if (!box.isConnected) return;
                btn.remove();
                box.querySelector('.view3d-stage').hidden = false;
                box.querySelector('.view3d-controls').hidden = false;
                SCENES_3D[spec.type](T, box, spec, panel);
            } catch (err) {
                btn.disabled = false;
                btn.firstChild.textContent = 'Open the 3D view ';
                box.querySelector('.readouts').innerHTML = `<div><dt>3D view</dt><dd>Could not start: ${/webgl/i.test(String(err)) ? 'this browser does not offer WebGL.' : 'the 3D library did not load. Check your connection and try again.'}</dd></div>`;
            }
        });
    });
}

/* ---------- shared scene plumbing ---------- */
function makeView(T, box, {look=[0, 0, 0], from=[2, 1.5, 2.2], label}) {
    const stage = box.querySelector('.view3d-stage'), css = getComputedStyle(document.body);
    const col = (name, fallback) => new T.Color(css.getPropertyValue(name).trim() || fallback);
    const C = {bg: col('--bg', '#050506'), ink: col('--line', '#e8e8ea'), accent: col('--accent', '#ff4d4d'), dim: col('--dim', '#2a2a2e'), dim2: col('--dim-2', '#44444a')};
    const renderer = new T.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', label);
    stage.append(renderer.domElement);
    const scene = new T.Scene();
    scene.background = C.bg;
    scene.add(new T.AmbientLight(0xffffff, .7));
    const sun = new T.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 6, 4);
    scene.add(sun);
    const camera = new T.PerspectiveCamera(38, 1.5, .01, 100), controls = new T.OrbitControls(camera, renderer.domElement);
    const home = () => { camera.position.set(...from); controls.target.set(...look); controls.update(); };
    home();
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    const resize = () => { const w = Math.max(200, stage.clientWidth), h = Math.round(Math.min(w * .7, 460)); renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); render(); };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    keep({revert() {
        ro.disconnect();
        controls.dispose();
        scene.traverse(o => { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m?.dispose()); });
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }}, 'solution');
    const mat = {ink: new T.MeshStandardMaterial({color: C.ink, roughness: .55, metalness: .1}), accent: new T.MeshStandardMaterial({color: C.accent, roughness: .4, metalness: .1}), plate: new T.MeshStandardMaterial({color: C.dim2, roughness: .8, transparent: true, opacity: .75})};
    const UP = new T.Vector3(0, 1, 0);
    const stick = (m, r) => { const s = new T.Mesh(new T.CylinderGeometry(r, r, 1, 18), m); scene.add(s); return s; };
    const ball = (m, r) => { const b = new T.Mesh(new T.SphereGeometry(r, 24, 16), m); scene.add(b); return b; };
    const between = (s, a, b) => { const A = new T.Vector3(...a), d = new T.Vector3(...b).sub(A), L = d.length(); s.position.copy(A).addScaledVector(d, .5); s.scale.set(1, Math.max(L, 1e-6), 1); if (L > 1e-9) s.quaternion.setFromUnitVectors(UP, d.normalize()); };
    const grid = (size, n) => { const g = new T.GridHelper(size, n, C.dim2, C.dim); scene.add(g); return g; };
    /* An arrow from a to b: a cylinder shaft and a cone head (hidden when it has no length). */
    const arrow = (m, r) => {
        const shaft = stick(m, r), head = new T.Mesh(new T.ConeGeometry(r * 2.6, r * 7, 16), m);
        scene.add(head);
        return {set(a, b) {
            const A = new T.Vector3(...a), d = new T.Vector3(...b).sub(A), L = d.length();
            shaft.visible = head.visible = L > 1e-4;
            if (L <= 1e-4) return;
            const hl = Math.min(r * 7, L * .45), u = d.clone().normalize(), tip = new T.Vector3(...b).addScaledVector(u, -hl);
            between(shaft, a, tip.toArray());
            head.scale.set(1, hl / (r * 7), 1);
            head.position.copy(tip).addScaledVector(u, hl / 2);
            head.quaternion.setFromUnitVectors(UP, u);
        }};
    };
    /* A polyline whose points are replaced on each update. */
    const polyline = (color, opacity=1) => {
        const line = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({color, transparent: opacity < 1, opacity}));
        scene.add(line);
        return {line, set(pts) { line.geometry.dispose(); line.geometry = new T.BufferGeometry(); line.geometry.setAttribute('position', new T.Float32BufferAttribute(pts.flat(), 3)); }};
    };
    return {T, C, scene, camera, controls, render, resize, home, mat, stick, ball, between, grid, arrow, polyline, setView: pos => { camera.position.set(...pos); controls.target.set(...look); controls.update(); }};
}
/* A labelled range slider in the controls row; returns the input. */
function slider(box, label, min, max, step, value, onInput) {
    const id = `s3d-${Math.random().toString(36).slice(2, 8)}`, wrap = document.createElement('label');
    wrap.className = 'slider3d';
    wrap.htmlFor = id;
    wrap.innerHTML = `<span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"><output></output>`;
    box.querySelector('.view3d-controls').append(wrap);
    const input = wrap.querySelector('input'), out = wrap.querySelector('output'), show = () => { out.textContent = Number(input.value).toFixed(step < 1 ? (step < .05 ? 2 : 1) : 0); };
    input.addEventListener('input', () => { show(); onInput(Number(input.value)); });
    show();
    return input;
}
function viewButtons(box, v, views) {
    const row = document.createElement('div');
    row.className = 'view3d-views';
    row.innerHTML = views.map(([name]) => `<button type="button" class="ghost small">${name}</button>`).join('');
    row.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { v.setView(views[i][1]); }));
    box.querySelector('.view3d-controls').append(row);
}
/* A Play button for an animated scene: frame(t) runs for t from 0 to 1 over the duration, then it can be replayed. */
function play3d(box, v, duration, frame) {
    const row = document.createElement('div'), btn = document.createElement('button');
    row.className = 'view3d-views';
    btn.type = 'button';
    btn.className = 'ghost small';
    btn.textContent = '▶ Play';
    row.append(btn);
    box.querySelector('.view3d-controls').prepend(row);
    let run = null;
    btn.addEventListener('click', () => {
        run?.revert?.();
        const o = {t: 0}, done = () => { btn.disabled = false; btn.textContent = '↺ Replay'; };
        btn.disabled = true;
        btn.textContent = '■ Playing…';
        if (typeof anime === 'object') run = keep(anime.animate(o, {t: 1, duration, ease: 'linear', onUpdate: () => { frame(o.t); v.render(); }, onComplete: done}), 'solution');
        else {
            const t0 = performance.now();
            let raf = 0;
            const step = now => { o.t = Math.min(1, (now - t0) / duration); frame(o.t); v.render(); if (o.t < 1) raf = requestAnimationFrame(step); else done(); };
            raf = requestAnimationFrame(step);
            run = keep({revert() { cancelAnimationFrame(raf); }}, 'solution');
        }
    });
    return btn;
}
const readout3d = (box, pairs) => { box.querySelector('.readouts').innerHTML = pairs.map(([k, val]) => `<div><dt>${k}</dt><dd>${val}</dd></div>`).join(''); };

/* ---------- the scenes ---------- */
const SCENES_3D = {
    /* Radiation pattern of a short dipole, or of a uniform line array along the vertical axis (isotropic elements). */
    pattern(T, box, s) {
        const v = makeView(T, box, {look: [0, 0, 0], from: [1.9, 1.2, 2.3], label: 'Three-dimensional antenna radiation pattern'});
        const st = {mode: s.mode || 'array', N: s.N || 8, d: s.d || .5, th: s.theta0 || 0}, NT = 120, NP = 72;
        v.grid(2.4, 12).position.y = -1;
        const axis = v.stick(v.mat.ink, .006);
        v.between(axis, [0, -1.1, 0], [0, 1.1, 0]);
        const geo = new T.BufferGeometry(), count = (NT + 1) * (NP + 1) * 3, idx = [];
        for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) { const p0 = i * (NP + 1) + j, p1 = p0 + NP + 1; idx.push(p0, p1, p0 + 1, p1, p1 + 1, p0 + 1); }
        geo.setIndex(idx);
        geo.setAttribute('position', new T.Float32BufferAttribute(count, 3));
        geo.setAttribute('color', new T.Float32BufferAttribute(count, 3));
        const pos = geo.attributes.position.array, colors = geo.attributes.color.array; // three.js copies arrays it is given: write into its own
        const surface = new T.Mesh(geo, new T.MeshStandardMaterial({vertexColors: true, side: T.DoubleSide, roughness: .6, transparent: true, opacity: .92}));
        v.scene.add(surface);
        const meshLines = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({color: v.C.bg, transparent: true, opacity: .35}));
        v.scene.add(meshLines);
        const elements = new T.Group();
        v.scene.add(elements);
        const low = v.C.dim2.clone(), high = v.C.accent.clone();
        const power = gamma => {
            if (st.mode === 'dipole') return Math.sin(gamma) ** 2;
            const ps = Math.PI * st.d * (Math.cos(gamma) - Math.sin(st.th * Math.PI / 180));
            return Math.abs(Math.sin(ps)) < 1e-9 ? 1 : (Math.sin(st.N * ps) / (st.N * Math.sin(ps))) ** 2;
        };
        const update = () => {
            const P = Array.from({length: NT + 1}, (_, i) => power(Math.PI * i / NT)), lines = [];
            for (let i = 0; i <= NT; i++) {
                const g = Math.PI * i / NT, r = P[i], c = low.clone().lerp(high, Math.sqrt(r));
                for (let j = 0; j <= NP; j++) {
                    const ph = 2 * Math.PI * j / NP, k = 3 * (i * (NP + 1) + j);
                    pos[k] = r * Math.sin(g) * Math.cos(ph); pos[k + 1] = r * Math.cos(g); pos[k + 2] = r * Math.sin(g) * Math.sin(ph);
                    colors[k] = c.r; colors[k + 1] = c.g; colors[k + 2] = c.b;
                }
            }
            for (let j = 0; j < NP; j += 6) for (let i = 0; i < NT; i++) { const k0 = 3 * (i * (NP + 1) + j), k1 = 3 * ((i + 1) * (NP + 1) + j); lines.push(pos[k0], pos[k0 + 1], pos[k0 + 2], pos[k1], pos[k1 + 1], pos[k1 + 2]); }
            geo.attributes.position.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            meshLines.geometry.dispose();
            meshLines.geometry = new T.BufferGeometry();
            meshLines.geometry.setAttribute('position', new T.Float32BufferAttribute(lines, 3));
            elements.children.forEach(c => c.geometry.dispose());
            elements.clear();
            const n = st.mode === 'dipole' ? 0 : st.N, gap = Math.min(.12, 1.6 / Math.max(n - 1, 1));
            for (let i = 0; i < n; i++) { const m = new T.Mesh(new T.SphereGeometry(.022, 12, 8), v.mat.ink); m.position.y = (i - (n - 1) / 2) * gap; elements.add(m); }
            if (st.mode === 'dipole') { const rod = new T.Mesh(new T.CylinderGeometry(.014, .014, .3, 12), v.mat.ink); elements.add(rod); }
            const kd = 2 * Math.PI * st.d, u0 = Math.sin(st.th * Math.PI / 180);
            let D = 1.5;
            if (st.mode === 'array') { let den = st.N; for (let m = 1; m < st.N; m++) den += 2 * (st.N - m) * Math.sin(m * kd) / (m * kd) * Math.cos(m * kd * u0); D = st.N * st.N / den; }
            const grating = st.mode === 'array' && (Math.abs(u0 + 1 / st.d) <= 1 || Math.abs(u0 - 1 / st.d) <= 1);
            readout3d(box, st.mode === 'dipole' ? [['Pattern', 'Short dipole: sin²θ'], ['Directivity', `1.5 (${(10 * Math.log10(1.5)).toFixed(2)} dBi)`], ['Shape', 'A doughnut: no radiation along the dipole axis']]
                : [['Pattern', `${st.N} elements, d = ${st.d.toFixed(2)} λ`], ['Steering', `${st.th.toFixed(0)}° from broadside`], ['Directivity', `${D.toFixed(2)} (${(10 * Math.log10(D)).toFixed(2)} dBi)`],
                    ['Shape', Math.abs(st.th) < .5 ? 'A disc around the array (broadside fan)' : Math.abs(st.th) > 89 ? 'A spike along the axis (endfire)' : `A cone ${(90 - Math.abs(st.th)).toFixed(0)}° from the array axis`], ['Grating lobe', grating ? 'Yes' : 'None']]);
            v.render();
        };
        const sliders = [];
        const modeRow = document.createElement('div');
        modeRow.className = 'view3d-views';
        modeRow.innerHTML = '<button type="button" class="ghost small" data-m="dipole">Short dipole</button><button type="button" class="ghost small" data-m="array">Line array</button>';
        modeRow.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { st.mode = btn.dataset.m; sliders.forEach(x => { x.disabled = st.mode === 'dipole'; }); update(); }));
        box.querySelector('.view3d-controls').append(modeRow);
        sliders.push(slider(box, 'Elements N', 2, 16, 1, st.N, x => { st.N = x; update(); }));
        sliders.push(slider(box, 'Spacing d/λ', .25, 1, .05, st.d, x => { st.d = x; update(); }));
        sliders.push(slider(box, 'Steering (°)', -90, 90, 1, st.th, x => { st.th = x; update(); }));
        sliders.forEach(x => { x.disabled = st.mode === 'dipole'; });
        viewButtons(box, v, [['Perspective', [1.9, 1.2, 2.3]], ['Side', [0, 0, 3.2]], ['Top', [0, 3.2, .001]]]);
        update();
    }
};

Object.assign(SCENES_3D, {
    /* log|H(s)| over the s-plane, sharing its poles and zeros with the explorer above (js/explore-ee.js). */
    hsurface(T, box, s, panel) {
        const pz = typeof pzShared === 'function' ? pzShared(panel) : null;
        const v = makeView(T, box, {look: [0, 0, 0], from: [2.4, 2.1, 3.1], label: 'Magnitude of H(s) as a surface over the complex s-plane'});
        const NS = 72, S0 = -5, S1 = 1, W0 = -3, W1 = 3, k = .5, hy = .4, X = sg => (sg + 2) * k, Z = w => -w * k, Hgt = m => hy * Math.max(-1.5, Math.min(1.5, Math.log10(m)));
        v.grid(3.4, 17).position.y = -hy * 1.5 - .02;
        const geo = new T.BufferGeometry(), count = (NS + 1) * (NS + 1) * 3, idx = [];
        for (let i = 0; i < NS; i++) for (let j = 0; j < NS; j++) { const p0 = i * (NS + 1) + j, p1 = p0 + NS + 1; idx.push(p0, p1, p0 + 1, p1, p1 + 1, p0 + 1); }
        geo.setIndex(idx);
        geo.setAttribute('position', new T.Float32BufferAttribute(count, 3));
        geo.setAttribute('color', new T.Float32BufferAttribute(count, 3));
        const pos = geo.attributes.position.array, colors = geo.attributes.color.array;
        v.scene.add(new T.Mesh(geo, new T.MeshStandardMaterial({vertexColors: true, side: T.DoubleSide, roughness: .7, transparent: true, opacity: .9})));
        const cut = v.polyline(v.C.accent), axisS = v.polyline(v.C.ink, .6), axisW = v.polyline(v.C.ink, .6);
        axisS.set([[X(S0), 0, 0], [X(S1), 0, 0]]);
        axisW.set([[X(0), 0, Z(W0)], [X(0), 0, Z(W1)]]);
        const markers = [];
        const low = v.C.dim2.clone(), high = v.C.accent.clone();
        const model = pz || {sig: -.5, w: 1.6, real: -2.5, zero: -1.2, useReal: false, useZero: false};
        const H = sv => typeof pzH === 'function' ? cabs(pzH(model, sv)) : 1;
        const update = () => {
            for (let i = 0; i <= NS; i++) for (let j = 0; j <= NS; j++) {
                const sg = S0 + (S1 - S0) * i / NS, w = W0 + (W1 - W0) * j / NS, h = Hgt(H(cx(sg, w))), q = 3 * (i * (NS + 1) + j), c = low.clone().lerp(high, (h / hy + 1.5) / 3);
                pos[q] = X(sg); pos[q + 1] = h; pos[q + 2] = Z(w);
                colors[q] = c.r; colors[q + 1] = c.g; colors[q + 2] = c.b;
            }
            geo.attributes.position.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            cut.set(Array.from({length: 241}, (_, i) => { const w = W0 + (W1 - W0) * i / 240; return [X(0), Hgt(H(cx(0, w))) + .01, Z(w)]; }));
            markers.forEach(m => { v.scene.remove(m); m.geometry.dispose(); });
            markers.length = 0;
            const P = typeof pzPoles === 'function' ? pzPoles(model) : [], Zs = typeof pzZeros === 'function' ? pzZeros(model) : [];
            P.forEach(p => { const m = new T.Mesh(new T.SphereGeometry(.04, 16, 10), v.mat.accent); m.position.set(X(p.re), hy * 1.5 + .06, Z(p.im)); v.scene.add(m); markers.push(m); });
            Zs.forEach(z => { const m = new T.Mesh(new T.TorusGeometry(.05, .012, 8, 24), v.mat.accent); m.rotation.x = Math.PI / 2; m.position.set(X(z.re), -hy * 1.5, Z(z.im)); v.scene.add(m); markers.push(m); });
            const peak = P.length ? Math.max(...Array.from({length: 400}, (_, i) => H(cx(0, 3 * i / 400)))) : 1;
            readout3d(box, [['Poles', P.map(p => `${p.re.toFixed(2)}${p.im ? (p.im > 0 ? ' + ' : ' − ') + 'j' + Math.abs(p.im).toFixed(2) : ''}`).join(', ')], ['Zeros', Zs.length ? Zs.map(z => z.re.toFixed(2)).join(', ') : 'none'],
                ['Resonant peak on the jω axis', `${(20 * Math.log10(peak)).toFixed(1)} dB`], ['How to read it', pz ? 'Drag the poles and zeros in the explorer above' : 'Peaks are poles; the red cut is the Bode magnitude']]);
            v.render();
        };
        if (pz) { pz.subs.add(update); keep({revert() { pz.subs.delete(update); }}, 'solution'); }
        viewButtons(box, v, [['Perspective', [2.4, 2.1, 3.1]], ['Along jω (Bode view)', [3.6, .2, 0]], ['Top (s-plane)', [0, 3.6, .001]]]);
        update();
    },
    /* A plane wave along x: E (red) with components in y and z, H (white) at right angles to it. */
    wave(T, box) {
        const v = makeView(T, box, {look: [0, 0, 0], from: [2.9, 1.7, 3.5], label: 'Electromagnetic plane wave with its electric and magnetic field vectors'});
        const N = 64, A = .62, kx = Math.PI, st = {delta: 0, ratio: 0, phase: 0};
        v.grid(4, 16).position.y = -1;
        v.polyline(v.C.ink, .5).set([[-2.2, 0, 0], [2.2, 0, 0]]);
        const eSeg = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({color: v.C.accent})), hSeg = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({color: v.C.ink, transparent: true, opacity: .55}));
        v.scene.add(eSeg, hSeg);
        const eTip = v.polyline(v.C.accent), hTip = v.polyline(v.C.ink, .55);
        const update = () => {
            const d = st.delta * Math.PI / 180, e = [], h = [], et = [], ht = [];
            for (let i = 0; i <= N; i++) {
                const x = -2 + 4 * i / N, ey = A * Math.cos(kx * x - st.phase), ez = A * st.ratio * Math.cos(kx * x - st.phase + d), hy = -.6 * ez, hz = .6 * ey;
                e.push(x, 0, 0, x, ey, ez); h.push(x, 0, 0, x, hy, hz); et.push([x, ey, ez]); ht.push([x, hy, hz]);
            }
            [[eSeg, e], [hSeg, h]].forEach(([seg, arr]) => { seg.geometry.dispose(); seg.geometry = new T.BufferGeometry(); seg.geometry.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); });
            eTip.set(et); hTip.set(ht);
            let mx = 0, mn = Infinity;
            for (let i = 0; i < 360; i++) { const th = i * Math.PI / 180, r = Math.hypot(Math.cos(th), st.ratio * Math.cos(th + d)); mx = Math.max(mx, r); mn = Math.min(mn, r); }
            const linear = st.ratio < .02 || Math.abs(Math.sin(d)) < .02, circular = Math.abs(st.ratio - 1) < .03 && Math.abs(st.delta - 90) < 2;
            readout3d(box, [['Polarisation', linear ? 'Linear' : circular ? 'Circular' : 'Elliptical'], ['Axial ratio', linear ? '∞ (a line)' : `${(mx / mn).toFixed(2)}`], ['Sense', linear ? '—' : 'Right-hand (IEEE): clockwise seen from behind the wave'], ['E and H', 'In phase, at right angles, both across the direction of travel']]);
            v.render();
        };
        play3d(box, v, 6000, t => { st.phase = 4 * Math.PI * t; update(); });
        slider(box, 'Phase between Ey and Ez (°)', 0, 180, 1, 0, x => { st.delta = x; update(); });
        slider(box, 'Amplitude ratio Ez/Ey', 0, 1, .05, 0, x => { st.ratio = x; update(); });
        viewButtons(box, v, [['Perspective', [2.9, 1.7, 3.5]], ['Head-on', [3.2, .001, .001]], ['Side', [0, 0, 3.4]]]);
        update();
    },
    /* Three coils 120° apart with currents 120° apart: their fields add to one rotating vector of constant length. */
    rotating(T, box) {
        const v = makeView(T, box, {look: [0, 0, 0], from: [0, 2.4, 2.2], label: 'Three-phase stator with three coil fields adding to a rotating field'});
        const ring = new T.Mesh(new T.TorusGeometry(1.05, .035, 12, 72), v.mat.plate);
        ring.rotation.x = Math.PI / 2;
        v.scene.add(ring);
        const ang = [90, 210, 330].map(a => a * Math.PI / 180), dirs = ang.map(a => [Math.cos(a), 0, -Math.sin(a)]);
        dirs.forEach(([x, , z]) => { const coil = new T.Mesh(new T.CylinderGeometry(.09, .09, .26, 20), v.mat.ink); coil.position.set(x * 1.05, 0, z * 1.05); coil.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(x, 0, z)); v.scene.add(coil); });
        const phaseArrows = dirs.map(() => v.arrow(v.mat.ink, .018)), total = v.arrow(v.mat.accent, .03);
        v.polyline(v.C.accent, .35).set(Array.from({length: 97}, (_, i) => { const t = 2 * Math.PI * i / 96; return [.9 * Math.cos(t), 0, -.9 * Math.sin(t)]; }));
        const st = {theta: 0, seq: [0, 1, 2]};
        let thetaSlider = null;
        const update = () => {
            const th = st.theta * Math.PI / 180, amp = st.seq.map(k => .6 * Math.cos(th - k * 2 * Math.PI / 3));
            let sx = 0, sz = 0;
            dirs.forEach(([x, , z], k) => { phaseArrows[k].set([0, 0, 0], [x * amp[k], 0, z * amp[k]]); sx += x * amp[k]; sz += z * amp[k]; });
            total.set([0, .001, 0], [sx, .001, sz]);
            const dirDeg = ((Math.atan2(-sz, sx) * 180 / Math.PI) + 360) % 360;
            readout3d(box, [['Currents (per unit)', amp.map((a, k) => `${'ABC'[k]} ${(a / .6).toFixed(2)}`).join(' · ')], ['Resultant field', `${(Math.hypot(sx, sz) / .6).toFixed(2)} × one coil’s peak (always 1.50)`], ['Field direction', `${dirDeg.toFixed(0)}°`], ['Phase order', st.seq[1] === 1 ? 'A–B–C: turns anticlockwise' : 'A–C–B: turns clockwise']]);
            if (thetaSlider) { thetaSlider.value = String(Math.round(st.theta % 360)); thetaSlider.nextElementSibling.textContent = thetaSlider.value; }
            v.render();
        };
        play3d(box, v, 6000, t => { st.theta = 720 * t; update(); });
        thetaSlider = slider(box, 'Electrical angle ωt (°)', 0, 359, 1, 0, x => { st.theta = x; update(); });
        const row = document.createElement('div');
        row.className = 'view3d-views';
        row.innerHTML = '<button type="button" class="ghost small">Swap phases B and C</button>';
        row.querySelector('button').addEventListener('click', () => { st.seq = st.seq[1] === 1 ? [0, 2, 1] : [0, 1, 2]; update(); });
        box.querySelector('.view3d-controls').append(row);
        viewButtons(box, v, [['Perspective', [0, 2.4, 2.2]], ['From above', [0, 3.4, .001]]]);
        update();
    },
    /* The TE10 mode in a WR-90 guide: E across the narrow wall, strongest mid-guide, travelling (or dying away below cutoff). */
    waveguide(T, box) {
        const v = makeView(T, box, {look: [0, 0, 0], from: [2.9, 2, 3.5], label: 'Rectangular waveguide with the electric field of the TE10 mode'});
        const a = 22.86, b = 10.16, Lmm = 60, sx = 4 / Lmm, w = a * sx, h = b * sx, c = 299.792458, fc = c / (2 * a), nz = 9, nx = 30;
        const x0 = -2, x1 = 2, y0 = -h / 2, y1 = h / 2, z0 = -w / 2, z1 = w / 2;
        const edges = [[x0, y0, z0, x1, y0, z0], [x0, y1, z0, x1, y1, z0], [x0, y0, z1, x1, y0, z1], [x0, y1, z1, x1, y1, z1], ...[x0, x1].flatMap(x => [[x, y0, z0, x, y1, z0], [x, y0, z1, x, y1, z1], [x, y0, z0, x, y0, z1], [x, y1, z0, x, y1, z1]])].flat();
        const box3 = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({color: v.C.ink, transparent: true, opacity: .6}));
        box3.geometry.setAttribute('position', new T.Float32BufferAttribute(edges, 3));
        v.scene.add(box3);
        const fieldSeg = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({color: v.C.accent}));
        v.scene.add(fieldSeg);
        const st = {ratio: 1.5, wt: 0};
        const update = () => {
            const f = st.ratio * fc, above = st.ratio > 1, lam = c / f, lg = above ? lam / Math.sqrt(1 - 1 / st.ratio ** 2) : Infinity, alpha = above ? 0 : (2 * Math.PI / (2 * a)) * Math.sqrt(1 - st.ratio ** 2), segs = [];
            for (let i = 0; i < nx; i++) for (let j = 1; j <= nz; j++) {
                const xmm = Lmm * i / (nx - 1), zr = j / (nz + 1), x = x0 + xmm * sx, z = z0 + w * zr;
                const e = Math.sin(Math.PI * zr) * (above ? Math.cos(st.wt - 2 * Math.PI * xmm / lg) : Math.exp(-alpha * xmm) * Math.cos(st.wt));
                segs.push(x, 0, z, x, .45 * h * e, z);
            }
            fieldSeg.geometry.dispose();
            fieldSeg.geometry = new T.BufferGeometry();
            fieldSeg.geometry.setAttribute('position', new T.Float32BufferAttribute(segs, 3));
            readout3d(box, [['Frequency', `${f.toFixed(2)} GHz`], ['Cutoff fc = c/2a', `${fc.toFixed(3)} GHz`], above ? ['Guide wavelength λg', `${lg.toFixed(1)} mm (free space ${lam.toFixed(1)} mm)`] : ['Below cutoff', `evanescent: ${(8.686 * alpha * 10).toFixed(1)} dB per cm`],
                ['Phase / group velocity', above ? `${(lg / lam).toFixed(3)} c / ${(lam / lg).toFixed(3)} c` : 'no propagation']]);
            v.render();
        };
        play3d(box, v, 6000, t => { st.wt = 6 * Math.PI * t; update(); });
        slider(box, 'Frequency f / fc', .6, 2, .05, st.ratio, x => { st.ratio = x; update(); });
        viewButtons(box, v, [['Perspective', [2.9, 2, 3.5]], ['Down the guide', [3.4, .001, .001]], ['Top', [0, 3.2, .001]]]);
        update();
    },
    /* Electric field lines of two point charges, or magnetic field lines of a current loop (Biot–Savart). */
    fieldlines(T, box) {
        const v = makeView(T, box, {look: [0, 0, 0], from: [2.2, 1.6, 2.6], label: 'Field lines in three dimensions'});
        const st = {mode: 'charges', q2: -1}, lines = [], blobs = [];
        v.grid(4, 16).position.y = -1.4;
        const charges = () => [{p: [-.6, 0, 0], q: 1}, {p: [.6, 0, 0], q: st.q2}];
        const E = r => charges().reduce((f, c) => { const d = r.map((x, i) => x - c.p[i]), m = Math.hypot(...d) ** 3 || 1e-9; return f.map((x, i) => x + c.q * d[i] / m); }, [0, 0, 0]);
        const loop = Array.from({length: 64}, (_, i) => { const t = 2 * Math.PI * i / 64; return [0, .6 * Math.cos(t), .6 * Math.sin(t)]; });
        const B = r => { let f = [0, 0, 0]; for (let i = 0; i < 64; i++) { const a = loop[i], b = loop[(i + 1) % 64], dl = b.map((x, k) => x - a[k]), mid = a.map((x, k) => (x + b[k]) / 2), d = r.map((x, k) => x - mid[k]), m = Math.hypot(...d) ** 3 || 1e-9; f = [f[0] + (dl[1] * d[2] - dl[2] * d[1]) / m, f[1] + (dl[2] * d[0] - dl[0] * d[2]) / m, f[2] + (dl[0] * d[1] - dl[1] * d[0]) / m]; } return f; };
        const trace = (start, field, sign, stop) => {
            const pts = [start];
            let r = start;
            for (let k = 0; k < 500; k++) {
                const f1 = field(r), n1 = Math.hypot(...f1) || 1e-9, mid = r.map((x, i) => x + sign * .015 * f1[i] / n1), f2 = field(mid), n2 = Math.hypot(...f2) || 1e-9;
                r = r.map((x, i) => x + sign * .03 * f2[i] / n2);
                pts.push(r);
                if (Math.hypot(...r) > 3 || stop(r, k)) break;
            }
            return pts;
        };
        const clear = () => { [...lines, ...blobs].forEach(o => { v.scene.remove(o); o.geometry.dispose(); }); lines.length = 0; blobs.length = 0; };
        const addLine = (pts, color, opacity) => { const l = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({color, transparent: true, opacity})); l.geometry.setAttribute('position', new T.Float32BufferAttribute(pts.flat(), 3)); v.scene.add(l); lines.push(l); };
        const fib = n => Array.from({length: n}, (_, i) => { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), t = i * Math.PI * (3 - Math.sqrt(5)); return [r * Math.cos(t), y, r * Math.sin(t)]; });
        const update = () => {
            clear();
            if (st.mode === 'charges') {
                const cs3 = charges();
                cs3.forEach(c => {
                    if (Math.abs(c.q) < .05) return;
                    const n = Math.round(14 * Math.abs(c.q));
                    fib(n).forEach(u => {
                        const start = c.p.map((x, i) => x + .07 * u[i]);
                        addLine(trace(start, E, Math.sign(c.q), r => cs3.some(o => o !== c && Math.abs(o.q) > .05 && Math.hypot(...r.map((x, i) => x - o.p[i])) < .06)), c.q > 0 ? v.C.ink : v.C.dim2, .75);
                    });
                    const s3 = new T.Mesh(new T.SphereGeometry(.05 + .03 * Math.abs(c.q), 20, 14), c.q > 0 ? v.mat.accent : v.mat.ink);
                    s3.position.set(...c.p);
                    v.scene.add(s3);
                    blobs.push(s3);
                });
                readout3d(box, [['Charges', `+1 at left, ${st.q2 > 0 ? '+' : ''}${st.q2.toFixed(2)} at right`], ['Lines', 'Start on positive charges and end on negative ones (or run off to infinity)'], ['Total charge', `${(1 + st.q2).toFixed(2)}: far away the field looks like one charge of this size`]]);
            } else {
                for (const y of [.12, .25, .38, .5, .68, .9]) {
                    const start = [0, y, 0];
                    addLine(trace(start, B, 1, (r, k) => k > 20 && Math.hypot(...r.map((x, i) => x - start[i])) < .03), v.C.ink, .8);
                    addLine(trace([0, -y, 0], B, 1, (r, k) => k > 20 && Math.hypot(r[0], r[1] + y, r[2]) < .03), v.C.ink, .8);
                }
                const wire = new T.Mesh(new T.TorusGeometry(.6, .02, 10, 64), v.mat.accent);
                wire.rotation.y = Math.PI / 2;
                v.scene.add(wire);
                blobs.push(wire);
                readout3d(box, [['Source', 'A current loop (red), seen from the side'], ['Lines', 'Closed loops: magnetic field lines have no start or end (∇·B = 0)'], ['Far away', 'The loop looks like a magnetic dipole, like a tiny bar magnet']]);
            }
            v.render();
        };
        const row = document.createElement('div');
        row.className = 'view3d-views';
        row.innerHTML = '<button type="button" class="ghost small" data-m="charges">Two charges</button><button type="button" class="ghost small" data-m="loop">Current loop</button>';
        box.querySelector('.view3d-controls').append(row);
        const q = slider(box, 'Right-hand charge', -2, 2, .25, st.q2, x => { st.q2 = x; update(); });
        row.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { st.mode = btn.dataset.m; q.disabled = st.mode !== 'charges'; update(); }));
        viewButtons(box, v, [['Perspective', [2.2, 1.6, 2.6]], ['Side', [0, 0, 3.4]], ['Top', [0, 3.4, .001]]]);
        update();
    }
});
