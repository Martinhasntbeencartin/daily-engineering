/* 3D views with three.js: antenna radiation patterns.
   three.js is large, so the tree-shaken bundle (vendor/three/three-lite.min.js, built by tools/build-three.mjs) is
   downloaded only when someone presses "Open the 3D view". Nothing moves on its own: you orbit with the mouse or a
   finger, and change the model with sliders. */
const THREE_URL = () => new URL('vendor/three/three-lite.min.js?v=0.187.0', document.baseURI).href;
let threeModule = null;
const loadThree = () => threeModule ||= import(THREE_URL());
const VIEW3D_DEFAULT = {linkbudget: {type: 'pattern', mode: 'array', N: 8, d: .5, theta0: 0}, fields: {type: 'pattern', mode: 'dipole'}};
const VIEW3D_TEXT = {
    pattern: 'The radiation pattern as a surface: its distance from the centre is the radiated power in that direction. Orbit it, then change the array.'
};
const view3dSpec = e => e.view3d || VIEW3D_DEFAULT[topic] || null;
function scene3dHTML(e) {
    const s = view3dSpec(e);
    if (!s) return '';
    return `<h4>Explore in 3D</h4><div class="view3d fig" data-type="${s.type}"><p class="muted">${VIEW3D_TEXT[s.type]}</p>`
        + '<button type="button" class="ghost small view3d-open">Open the 3D view <span class="view3d-size">· downloads about 140 KB</span></button>'
        + '<div class="view3d-stage" hidden></div><div class="view3d-controls" hidden></div><dl class="readouts" aria-live="polite"></dl></div>';
}
function mount3D(panel, e) {
    const box = panel.querySelector('.view3d');
    if (!box) return;
    const btn = box.querySelector('.view3d-open');
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.firstChild.textContent = 'Loading the 3D view… ';
        try {
            const T = await loadThree();
            if (!box.isConnected) return;
            btn.remove();
            box.querySelector('.view3d-stage').hidden = false;
            box.querySelector('.view3d-controls').hidden = false;
            SCENES_3D[view3dSpec(e).type](T, box, view3dSpec(e));
        } catch (err) {
            btn.disabled = false;
            btn.firstChild.textContent = 'Open the 3D view ';
            box.querySelector('.readouts').innerHTML = `<div><dt>3D view</dt><dd>Could not start: ${/webgl/i.test(String(err)) ? 'this browser does not offer WebGL.' : 'the 3D library did not load. Check your connection and try again.'}</dd></div>`;
        }
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
    return {T, C, scene, camera, controls, render, resize, home, mat, stick, ball, between, grid, setView: pos => { camera.position.set(...pos); controls.target.set(...look); controls.update(); }};
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
