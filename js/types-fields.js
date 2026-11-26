/* Electromagnetism: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (Biot–Savart sums, transfer matrices, CG). */
const FIELDS_READING = {title: 'Electromagnetic Fields and Energy (MIT OpenCourseWare 6.013)', url: 'https://ocw.mit.edu/courses/6-013-electromagnetics-and-applications-spring-2009/'};
addTypes('fields', 'university', fieldsTwoLayerCap, fieldsGappedCore, fieldsPlaneWaveLossy);
addTypes('fields', 'challenge', fieldsSlabReflection, fieldsImageCharge, fieldsSquareLoop);
addTypes('fields', 'expert', fieldsDipole);
addTypes('fields', 'mastery', fieldsMoMPlate);

const EPS0 = 8.8541878128e-12, MU0 = 4 * Math.PI * 1e-7, C0 = 299792458;
const fldSqrt = z => { const r = Math.sqrt(cabs(z)), a = Math.atan2(z.im, z.re) / 2; return cx(r * Math.cos(a), r * Math.sin(a)); }; // principal root (Re ≥ 0)

/* Level 2: a capacitor with two dielectric layers: fields in each and the breakdown voltage. */
function fieldsTwoLayerCap(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'two-layer-cap', date, FIELDS_READING), p = part;
    const mats = [['mica', 6, 118], ['glass', 5, 10], ['PTFE', 2.1, 60], ['paper', 3.5, 16], ['air', 1, 3]];
    const [[m1, m2], A, d1, d2, V] = grid(product(mats.slice(0, 4), mats).filter(([x, y]) => x !== y), [10, 25, 50, 100], [.1, .2, .5, 1], [.1, .2, .5, 1], [100, 500, 1000]);
    const [n1, e1, b1] = m1, [n2, e2, b2] = m2, s = d1 / e1 + d2 / e2, C = EPS0 * A * 1e-4 / (s * 1e-3), E1 = V / (e1 * s) / 1e3, E2 = V / (e2 * s) / 1e3, Vmax = Math.min(b1 / E1, b2 / E2) * V / 1e3, W = .5 * C * V * V;
    const diagram = drawing(wire('M160 60H560M160 200H560') + `<rect x="160" y="62" width="400" height="${(68 * d1 / (d1 + d2) + 33).toFixed(1)}" fill="#e9eee6" stroke="none"/>` + guide(`M160 ${(62 + 68 * d1 / (d1 + d2) + 33).toFixed(1)}H560`) +
        dt(360, 62 + (68 * d1 / (d1 + d2) + 33) / 2 + 5, `${n1}, ${d1} mm`) + dt(360, 62 + (68 * d1 / (d1 + d2) + 33) + (138 - (68 * d1 / (d1 + d2) + 33)) / 2 + 5, `${n2}, ${d2} mm`) + wire('M360 60V30M360 200V230') + dt(400, 26, `+${V} V`) + ground(360, 230) + dt(620, 136, `${A} cm²`),
        'A parallel-plate capacitor whose gap holds two dielectric layers stacked between the plates', 255);
    return q({
        title: 'Two dielectrics in one capacitor',
        text: T`A parallel-plate capacitor of area $${A}\,\text{cm}^2$ has a $${d1}\,\text{mm}$ layer of ${n1} ($\varepsilon_r = ${e1}$, breakdown $${b1}\,\text{kV/mm}$) and a $${d2}\,\text{mm}$ layer of ${n2} ($\varepsilon_r = ${e2}$, breakdown $${b2}\,\text{kV/mm}$) between its plates. Neglect fringing. Find the capacitance, the electric field in each layer when $${V}\,\text{V}$ is applied, the voltage at which the first layer breaks down, and the energy stored at $${V}\,\text{V}$.`,
        givens: [T`${n1}: $${d1}\,\text{mm}$, $\varepsilon_r = ${e1}$, $${b1}\,\text{kV/mm}$`, T`${n2}: $${d2}\,\text{mm}$, $\varepsilon_r = ${e2}$, $${b2}\,\text{kV/mm}$`, T`$A = ${A}\,\text{cm}^2$, $V = ${V}\,\text{V}$`],
        parts: [p('Capacitance', C * 1e12, 'pF'), p(`Field in the ${n1}`, E1, 'kV/mm'), p(`Field in the ${n2}`, E2, 'kV/mm'), p('Breakdown voltage', Vmax, 'kV'), p('Energy stored', W * 1e6, 'µJ')],
        hints: [T`$D$ is the same in both layers (no free charge at the interface), so $E_i = D/(\varepsilon_0\varepsilon_{ri})$.`, T`$V = E_1d_1 + E_2d_2 = \dfrac{D}{\varepsilon_0}\left(\dfrac{d_1}{\varepsilon_{r1}} + \dfrac{d_2}{\varepsilon_{r2}}\right)$, and $C = \dfrac{\varepsilon_0A}{d_1/\varepsilon_{r1} + d_2/\varepsilon_{r2}}$.`, T`The fields scale with $V$: the layer whose field reaches its breakdown strength first sets the limit. A thin low-permittivity layer takes most of the field.`],
        steps: [T`$d_1/\varepsilon_{r1} + d_2/\varepsilon_{r2} = ${tf(s)}\,\text{mm}$, so $C = ${tf(C * 1e12)}\,\text{pF}$.`, T`$E_1 = ${tf(E1)}\,\text{kV/mm}$, $E_2 = ${tf(E2)}\,\text{kV/mm}$.`, T`Breakdown at $V = \min(${b1}/${tf(E1)},\ ${b2}/${tf(E2)})\times${V}\,\text{V} = ${tf(Vmax)}\,\text{kV}$.`, T`$W = \tfrac12CV^2 = ${tf(W * 1e6)}\,\mu\text{J}$.`],
        idea: 'Layers in series share the same D, so the field concentrates in the low-permittivity layer — an air gap can fail long before the solid insulation.',
        diagram, prerequisites: 'Gauss’s law; capacitance; dielectric breakdown.',
        verify: () => { // two capacitors in series and a voltage divider
            const Ca = EPS0 * e1 * A * 1e-4 / (d1 * 1e-3), Cb = EPS0 * e2 * A * 1e-4 / (d2 * 1e-3), Ceq = Ca * Cb / (Ca + Cb), V1 = V * Cb / (Ca + Cb), V2 = V - V1;
            const ea = V1 / d1 / 1e3, eb = V2 / d2 / 1e3;
            return [Ceq * 1e12, ea, eb, Math.min(b1 / ea, b2 / eb) * V / 1e3, .5 * Ceq * V * V * 1e6];
        }
    });
}

/* Level 2: a gapped magnetic core: reluctance, inductance, flux density and where the energy is stored. */
function fieldsGappedCore(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'gapped-core', date, FIELDS_READING), p = part;
    const Bof = ([lc, A, mur, g, N, I]) => N * I / ((lc * 1e-2 / (MU0 * mur * A * 1e-4) + g * 1e-3 / (MU0 * A * 1e-4)) * A * 1e-4);
    const [c] = grid(product([10, 15, 20, 30], [1, 2, 4, 6], [1000, 2000, 5000], [.1, .2, .5, 1], [50, 100, 200, 400], [.5, 1, 2]).filter(cc => Bof(cc) <= 1.2));
    const [lc, A, mur, g, N, I] = c, Rc = lc * 1e-2 / (MU0 * mur * A * 1e-4), Rg = g * 1e-3 / (MU0 * A * 1e-4), L = N * N / (Rc + Rg), B = Bof(c), W = .5 * L * I * I, fr = 100 * Rg / (Rc + Rg);
    const diagram = drawing(wire('M540 125V50H180V230H540V155') + wire('M490 125V100H230V180H490V155') + wire('M490 125H540M490 155H540') + dt(610, 146, `gap ${g} mm`) +
        [0, 1, 2, 3, 4].map(i => wire(`M170 ${80 + i * 22}h70`)).join('') + dt(120, 146, `N = ${N}`) + arrow(110, 200, 170, 200) + dt(90, 206, `I`) + dt(360, 30, `mean length ${lc} cm · area ${A} cm² · μᵣ ${mur}`), 'A rectangular magnetic core with a winding of N turns on one leg and a small air gap cut in the opposite leg', 255);
    return q({
        title: 'Energy in a gapped inductor core',
        text: T`A core of mean length $${lc}\,\text{cm}$, cross-section $${A}\,\text{cm}^2$ and relative permeability $${mur}$ has an air gap of $${g}\,\text{mm}$, and carries a winding of $${N}$ turns with $${I}\,\text{A}$. Neglect fringing and leakage, and assume the core is linear. Find the gap reluctance, the inductance, the flux density, the stored energy, and the percentage of that energy stored in the gap.`,
        givens: [T`$l_c = ${lc}\,\text{cm}$, $A = ${A}\,\text{cm}^2$, $\mu_r = ${mur}$`, T`Gap $g = ${g}\,\text{mm}$`, T`$N = ${N}$, $I = ${I}\,\text{A}$`],
        parts: [p('Gap reluctance', Rg / 1e6, 'MA/Wb'), p('Inductance', L * 1e3, 'mH'), p('Flux density', B, 'T'), p('Stored energy', W * 1e3, 'mJ'), p('Energy in the gap', fr, '%')],
        hints: [T`$\mathcal R = \dfrac{l}{\mu A}$ for the core and the gap; they are in series.`, T`$L = \dfrac{N^2}{\mathcal R_c + \mathcal R_g}$ and $B = \dfrac{\Phi}{A} = \dfrac{NI}{(\mathcal R_c + \mathcal R_g)A}$.`, T`Both parts carry the same flux, so each stores energy in proportion to its reluctance: $W_g/W = \mathcal R_g/(\mathcal R_c + \mathcal R_g)$.`],
        steps: [T`$\mathcal R_c = ${tf(Rc / 1e6)}\,\text{MA/Wb}$, $\mathcal R_g = ${tf(Rg / 1e6)}\,\text{MA/Wb}$.`, T`$L = ${N}^2/${tf((Rc + Rg) / 1e6)}\times10^6 = ${tf(L * 1e3)}\,\text{mH}$.`, T`$B = ${tf(B)}\,\text{T}$; $W = \tfrac12LI^2 = ${tf(W * 1e3)}\,\text{mJ}$.`, T`The gap stores $${tf(fr)}\%$ of it.`],
        idea: 'A tiny air gap dominates a magnetic circuit: it sets the inductance, linearises the core, and stores most of the energy.',
        diagram, prerequisites: 'Magnetic circuits; Ampère’s law; magnetic energy.',
        verify: () => { // Ampère's law around the loop for B, energy density integrated over each volume
            const b = MU0 * N * I / (lc * 1e-2 / mur + g * 1e-3), Ac = A * 1e-4, wc = b * b / (2 * MU0 * mur) * lc * 1e-2 * Ac, wg = b * b / (2 * MU0) * g * 1e-3 * Ac;
            return [g * 1e-3 / (MU0 * Ac) / 1e6, N * b * Ac / I * 1e3, b, (wc + wg) * 1e3, 100 * wg / (wc + wg)];
        }
    });
}

/* Level 2: a plane wave in a lossy medium: attenuation, wavelength and impedance. */
function fieldsPlaneWaveLossy(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'plane-wave-lossy', date, FIELDS_READING), p = part;
    const [sg, er, f] = grid([1e-3, 2e-3, 5e-3, .01, .02, .05, .1, .2, .5, 1, 2, 4], [4, 10, 20, 40, 81], [1e4, 1e5, 1e6, 3e6, 1e7, 1e8, 1e9]);
    const w = 2 * Math.PI * f, eps = EPS0 * er, tl = sg / (w * eps), g = fldSqrt(cx(-w * w * MU0 * eps, w * MU0 * sg)), eta = fldSqrt(cd(cx(0, w * MU0), cx(sg, w * eps))), d20 = 20 / (20 * Math.log10(Math.E) * g.re);
    const fs = f >= 1e9 ? `${f / 1e9}\\,\\text{GHz}` : f >= 1e6 ? `${f / 1e6}\\,\\text{MHz}` : `${f / 1e3}\\,\\text{kHz}`;
    const diagram = curve('depth z (skin depths)', 'E / E₀', [0, 3], [-1, 1], zz => Math.exp(-zz) * Math.cos(zz * g.im / g.re));
    return q({
        title: 'A radio wave in a lossy medium',
        text: T`A uniform plane wave at $${fs}$ travels into a medium with conductivity $\sigma = ${sg}\,\text{S/m}$, relative permittivity $${er}$ and $\mu = \mu_0$. Find the loss tangent $\sigma/(\omega\varepsilon)$, the attenuation and phase constants from $\gamma = \alpha + j\beta = \sqrt{j\omega\mu(\sigma + j\omega\varepsilon)}$, the magnitude and angle of the intrinsic impedance $\eta = \sqrt{j\omega\mu/(\sigma + j\omega\varepsilon)}$, and the depth at which the field has fallen by $20\,\text{dB}$.`,
        givens: [T`$f = ${fs}$`, T`$\sigma = ${sg}\,\text{S/m}$, $\varepsilon_r = ${er}$, $\mu_r = 1$`],
        parts: [p('Loss tangent', tl, ''), p(T`$\alpha$`, g.re, 'Np/m'), p(T`$\beta$`, g.im, 'rad/m'), p(T`$|\eta|$`, cabs(eta), 'Ω'), p(T`$\angle\eta$`, Math.atan2(eta.im, eta.re) * 180 / Math.PI, '°'), p('Depth for 20 dB loss', d20, 'm')],
        hints: [T`Take the square root with positive real part. A large loss tangent means a good conductor ($\alpha \approx \beta \approx 1/\delta$); a small one, a low-loss dielectric.`, T`Closed forms: $\alpha = \omega\sqrt{\tfrac{\mu\varepsilon}{2}}\sqrt{\sqrt{1 + \tan^2\delta} - 1}$ and $\beta = \omega\sqrt{\tfrac{\mu\varepsilon}{2}}\sqrt{\sqrt{1 + \tan^2\delta} + 1}$.`, T`The field decays as $e^{-\alpha z}$: $20\log_{10}e^{\alpha z} = 20$ gives $z = \dfrac{20}{8.686\,\alpha}$.`],
        steps: [T`$\tan\delta = ${tf(tl)}$.`, T`$\gamma = ${tf(g.re)} + j${tf(g.im)}\,\text{m}^{-1}$ (skin depth $1/\alpha = ${tf(1 / g.re)}\,\text{m}$, wavelength $2\pi/\beta = ${tf(2 * Math.PI / g.im)}\,\text{m}$).`, T`$\eta = ${tf(cabs(eta))}\angle${tf(Math.atan2(eta.im, eta.re) * 180 / Math.PI)}^\circ\,\Omega$.`, T`20 dB at $z = ${tf(d20)}\,\text{m}$.`],
        idea: 'The loss tangent decides whether a medium behaves as a dielectric or a conductor at a given frequency; that is why low frequencies reach under the sea.',
        diagram, prerequisites: 'Maxwell’s equations; complex square roots; decibels.',
        verify: () => { // the closed-form α, β, |η| and ∠η in terms of the loss tangent
            const k0 = w * Math.sqrt(MU0 * eps / 2), r = Math.sqrt(1 + tl * tl), a = k0 * Math.sqrt(r - 1), b = k0 * Math.sqrt(r + 1);
            return [sg / (w * eps), a, b, Math.sqrt(MU0 / eps) / Math.sqrt(r), Math.atan(tl) / 2 * 180 / Math.PI, Math.log(10) / a];
        }
    });
}

/* Level 3: normal incidence on a dielectric slab in air: reflection, transmission and the reflectionless frequency. */
function fieldsSlabReflection(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'slab-reflection', date, FIELDS_READING), p = part, eta0 = 376.730313668;
    const [er, dmm, fG] = grid([2.1, 2.55, 3, 4, 4.4, 6, 9.8], steps(5, 30, 2.5), [1, 2, 3, 5, 8, 10, 12]);
    const n = Math.sqrt(er), eta1 = eta0 / n, d = dmm * 1e-3, bd = 2 * Math.PI * fG * 1e9 * n / C0 * d, t = Math.tan(bd);
    const Zin = cm(cx(eta1), cd(cx(eta0, eta1 * t), cx(eta1, eta0 * t))), G = cd(cs(Zin, cx(eta0)), ca(Zin, cx(eta0))), R = cabs(G) ** 2, f0 = C0 / (2 * d * n) / 1e9, gmax = (er - 1) / (er + 1);
    const diagram = drawing(`<rect x="300" y="40" width="120" height="190" fill="#e9eee6" stroke="#315740"/>` + dt(360, 140, `εᵣ = ${er}`) + dt(360, 252, `d = ${dmm} mm`) + arrow(110, 100, 290, 100) + dt(200, 86, 'incident') + arrow(290, 150, 110, 150) + dt(200, 172, 'reflected Γ') +
        arrow(430, 125, 610, 125) + dt(520, 111, 'transmitted') + dt(150, 40, 'air') + dt(570, 40, 'air'), 'A plane wave strikes a dielectric slab in air at normal incidence; part is reflected and part transmitted through the slab', 262);
    return q({
        title: 'Reflection from a dielectric slab',
        text: T`A plane wave in air meets a lossless dielectric slab ($\varepsilon_r = ${er}$, thickness $${dmm}\,\text{mm}$, $\mu = \mu_0$) at normal incidence; there is air behind the slab. At $${fG}\,\text{GHz}$, find the magnitude of the reflection coefficient, and the percentages of the incident power reflected and transmitted. Find the lowest frequency at which the slab reflects nothing, and the largest $|\Gamma|$ it can produce at any frequency.`,
        givens: [T`$\varepsilon_r = ${er}$, $d = ${dmm}\,\text{mm}$`, T`$f = ${fG}\,\text{GHz}$`, T`$\eta_0 = 376.73\,\Omega$, air on both sides`],
        parts: [p(T`$|\Gamma|$ at $${fG}\,\text{GHz}$`, cabs(G), '', .01, .002), p('Power reflected', 100 * R, '%', .01, .02), p('Power transmitted', 100 * (1 - R), '%'), p('Lowest reflectionless frequency', f0, 'GHz'), p(T`Largest $|\Gamma|$`, gmax, '')],
        hints: [T`Treat the slab as a transmission line of impedance $\eta_1 = \eta_0/\sqrt{\varepsilon_r}$ and length $d$, loaded by $\eta_0$: $Z_{\text{in}} = \eta_1\dfrac{\eta_0 + j\eta_1\tan\beta d}{\eta_1 + j\eta_0\tan\beta d}$ with $\beta = 2\pi f\sqrt{\varepsilon_r}/c$.`, T`$\Gamma = \dfrac{Z_{\text{in}} - \eta_0}{Z_{\text{in}} + \eta_0}$; a lossless slab transmits $1 - |\Gamma|^2$.`, T`A half-wave slab ($\beta d = \pi$) is invisible; a quarter-wave slab ($\beta d = \pi/2$) gives $Z_{\text{in}} = \eta_0/\varepsilon_r$ and the largest reflection.`],
        steps: [T`$\eta_1 = ${tf(eta1)}\,\Omega$, $\beta d = ${tf(bd)}\,\text{rad}$.`, T`$Z_{\text{in}} = ${tc(Zin)}\,\Omega$, so $|\Gamma| = ${tf(cabs(G))}$: $${tf(100 * R)}\%$ reflected, $${tf(100 * (1 - R))}\%$ transmitted.`, T`Half-wave: $f = \dfrac{c}{2d\sqrt{\varepsilon_r}} = ${tf(f0)}\,\text{GHz}$.`, T`Quarter-wave: $|\Gamma|_{\max} = \dfrac{\varepsilon_r - 1}{\varepsilon_r + 1} = ${tf(gmax)}$.`],
        idea: 'Reflections from the two faces of a slab interfere: they cancel at half-wave thickness (radomes use this) and add most at quarter-wave thickness.',
        diagram, prerequisites: 'Plane waves; impedance transformation; interference.',
        verify: () => { // the optical characteristic-matrix method; the reflectionless frequency and the maximum by scanning |r(f)|
            const r = fg => { const dl = 2 * Math.PI * fg * 1e9 * n / C0 * d, B = cx(Math.cos(dl), Math.sin(dl) / n), Cc = cx(Math.cos(dl), n * Math.sin(dl)); return cabs(cd(cs(B, Cc), ca(B, Cc))); };
            let fmin = NaN, best = 0, rose = false, prev = r(.001), prevf = .001; for (let fg = .002; fg <= 60; fg += .001) { const v = r(fg); if (v > .02) rose = true; if (rose && Number.isNaN(fmin) && v > prev && prev < .01) fmin = prevf; best = Math.max(best, v); prev = v; prevf = fg; }
            const lo = Math.max(.001, fmin - .002), z0 = NUM.bisect(fg => { const dl = 2 * Math.PI * fg * 1e9 * n / C0 * d; return Math.sin(dl); }, lo, fmin + .002, 100);
            return [r(fG), 100 * r(fG) ** 2, 100 * (1 - r(fG) ** 2), z0, best];
        }
    });
}

/* Level 3: a point charge above a grounded plane, by the method of images. */
function fieldsImageCharge(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'image-charge', date, FIELDS_READING), p = part, k = 1 / (4 * Math.PI * EPS0);
    const [qn, hc, rf, Rf, zf] = grid([1, 2, 5, 10], [1, 2, 5, 10], [.5, 1, 2], [1, 2, 5], [.5, 2, 3]);
    const Q = qn * 1e-9, h = hc * 1e-2, rho = rf * h, Rr = Rf * h, z = zf * h, F = k * Q * Q / (4 * h * h), sig = -Q * h / (2 * Math.PI * (h * h + rho * rho) ** 1.5), Eabs = Math.abs(sig) / EPS0, Qin = -Q * (1 - h / Math.hypot(h, Rr)), Vz = k * Q * (1 / Math.abs(z - h) - 1 / (z + h));
    const diagram = drawing(wire('M80 180H640') + [100, 160, 220, 280, 340, 400, 460, 520, 580].map(x => wire(`M${x} 180l-16 18`)).join('') + dot(360, 80) + dt(395, 86, '+q') + `<circle cx="360" cy="280" r="4" fill="none" stroke="#83968b"/>` + dt(400, 286, '−q (image)') +
        guide('M360 80V280') + dt(330, 134, 'h') + dt(330, 234, 'h') + dot(500, 180) + dt(500, 166, 'ρ') + dot(360, 80 - (zf > 1 ? 25 : 100) * (zf - 1)) + note(372, 80 - (zf > 1 ? 25 : 100) * (zf - 1) + 5, 'P'), 'A positive point charge at height h above a grounded conducting plane, with its image charge an equal distance below the plane', 300);
    return q({
        title: 'A charge above a grounded plane',
        text: T`A point charge $q = ${qn}\,\text{nC}$ sits $h = ${hc}\,\text{cm}$ above an infinite grounded conducting plane. Using an image charge, find the force pulling the charge towards the plane; the induced surface charge density and the field strength on the plane at a horizontal distance $\rho = ${rf}h$ from the foot of the charge; the total charge induced within a radius $R = ${Rf}h$ of that foot; and the potential at the point P on the axis at height $z = ${zf}h$.`,
        givens: [T`$q = ${qn}\,\text{nC}$, $h = ${hc}\,\text{cm}$`, T`$\rho = ${rf}h$, $R = ${Rf}h$, $z = ${zf}h$`],
        parts: [p('Force on the charge', F * 1e3, 'mN'), p(T`Surface charge density at $\rho$`, sig * 1e9, 'nC/m²'), p(T`Field strength at $\rho$`, Eabs / 1e3, 'kV/m'), p(T`Induced charge within $R$`, Qin * 1e9, 'nC'), p('Potential at P', Vz, 'V')],
        hints: [T`Replace the plane by $-q$ at depth $h$: together they make the plane an equipotential at $0\,\text{V}$.`, T`On the plane only the normal field survives: $E_z = -\dfrac{2qh}{4\pi\varepsilon_0(h^2 + \rho^2)^{3/2}}$, and $\sigma = \varepsilon_0E_z$.`, T`Integrating $\sigma$ over a disc of radius $R$ gives $-q\left(1 - \dfrac{h}{\sqrt{h^2 + R^2}}\right)$; the whole plane carries $-q$.`],
        steps: [T`$F = \dfrac{q^2}{4\pi\varepsilon_0(2h)^2} = ${tf(F * 1e3)}\,\text{mN}$.`, T`$\sigma(\rho) = -\dfrac{qh}{2\pi(h^2 + \rho^2)^{3/2}} = ${tf(sig * 1e9)}\,\text{nC/m}^2$, so $|E| = |\sigma|/\varepsilon_0 = ${tf(Eabs / 1e3)}\,\text{kV/m}$.`, T`Within $R$: $${tf(Qin * 1e9)}\,\text{nC}$.`, T`$V_P = \dfrac{q}{4\pi\varepsilon_0}\left(\dfrac{1}{|z - h|} - \dfrac{1}{z + h}\right) = ${tf(Vz)}\,\text{V}$.`],
        idea: 'A grounded plane acts like a mirror: one image charge reproduces the whole induced charge distribution and its field above the plane.',
        diagram, prerequisites: 'Coulomb’s law; boundary conditions; method of images.',
        verify: () => { // the induced charge integrated numerically: its total pull on q, and the charge within R
            const s = r => -Q * h / (2 * Math.PI * (h * h + r * r) ** 1.5), sub = (fn, top) => NUM.simpson(u => fn(h * Math.tan(u)) * h / Math.cos(u) ** 2, 0, top, 20000);
            const pull = sub(r => -s(r) * 2 * Math.PI * r * k * Q * h / (h * h + r * r) ** 1.5, Math.PI / 2 - 1e-9), qin = sub(r => s(r) * 2 * Math.PI * r, Math.atan(Rr / h));
            const Ez = k * Q * (-h / (h * h + rho * rho) ** 1.5) + k * (-Q) * (h / (h * h + rho * rho) ** 1.5); // charge above pushes down, image below pulls down
            return [pull * 1e3, EPS0 * Ez * 1e9, Math.abs(Ez) / 1e3, qin * 1e9, k * Q / Math.abs(z - h) + k * (-Q) / (z + h)];
        }
    });
}

/* Level 3: the magnetic field of a square current loop and its torque in a uniform field. */
function fieldsSquareLoop(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'square-loop', date, FIELDS_READING), p = part;
    const [acm, I, N, B0, th, zf] = grid([2, 5, 10, 20], [.5, 1, 2, 5], [1, 10, 50, 100], [.01, .05, .1], [30, 60, 90], [.5, 1, 2]);
    const a = acm * 1e-2, Bc = N * 2 * Math.SQRT2 * MU0 * I / (Math.PI * a), Bcirc = N * MU0 * I * Math.PI / (4 * a), m = N * I * a * a, tq = m * B0 * Math.sin(th * Math.PI / 180), z = zf * a;
    const Bz = N * MU0 * I * a * a / (2 * Math.PI * (z * z + a * a / 4) * Math.sqrt(z * z + a * a / 2));
    const diagram = drawing(wire('M240 60H480V240H240Z') + arrow(300, 60, 420, 60) + arrow(480, 100, 480, 200) + arrow(420, 240, 300, 240) + arrow(240, 200, 240, 100) + dot(360, 150) + dt(360, 172, 'centre') + dt(360, 40, `I = ${I} A, N = ${N}`) +
        dt(510, 156, `a = ${acm} cm`) + arrow(600, 220, 600 + 60 * Math.cos(th * Math.PI / 180), 220 - 60 * Math.sin(th * Math.PI / 180)) + dt(640, 250, `B₀ at ${th}°`), 'A square loop of side a carrying current I, viewed face on, with an external uniform field at an angle to its axis', 265);
    return q({
        title: 'The field of a square loop',
        text: T`A square coil of side $a = ${acm}\,\text{cm}$ has $N = ${N}$ turns carrying $${I}\,\text{A}$. Using the Biot–Savart law, find the flux density at the centre of the square, and compare it with a circular coil of the same perimeter and turns. Find the coil's magnetic moment and the torque on it in a uniform field of $${B0}\,\text{T}$ at $${th}^\circ$ to its axis. Finally find the flux density on the axis at a distance $z = ${zf}a$ from the centre.`,
        givens: [T`$a = ${acm}\,\text{cm}$, $N = ${N}$, $I = ${I}\,\text{A}$`, T`$B_0 = ${B0}\,\text{T}$ at $${th}^\circ$`, T`Axial point $z = ${zf}a$`],
        parts: [p('Flux density at the centre', Bc * 1e6, 'µT'), p('Circular coil, same perimeter', Bcirc * 1e6, 'µT'), p('Magnetic moment', m, 'A·m²'), p('Torque', tq * 1e3, 'mN·m'), p(T`Flux density at $z = ${zf}a$`, Bz * 1e6, 'µT')],
        hints: [T`A straight segment gives $B = \dfrac{\mu_0I}{4\pi d}(\sin\theta_2 - \sin\theta_1)$ at perpendicular distance $d$; at the centre each side contributes with $d = a/2$ and $\theta = \pm45^\circ$.`, T`A circle of perimeter $4a$ has radius $2a/\pi$ and $B = \mu_0NI/(2r)$ at its centre. The moment is $NIa^2$ and the torque $mB_0\sin\theta$.`, T`On the axis, each side is at distance $\sqrt{z^2 + a^2/4}$ and only the axial components add: $B_z = \dfrac{\mu_0NIa^2}{2\pi(z^2 + a^2/4)\sqrt{z^2 + a^2/2}}$.`],
        steps: [T`$B_{\text{centre}} = \dfrac{2\sqrt2\mu_0NI}{\pi a} = ${tf(Bc * 1e6)}\,\mu\text{T}$; circle: $${tf(Bcirc * 1e6)}\,\mu\text{T}$ (${Bc > Bcirc ? 'the square is stronger' : 'the circle is stronger'} by $${tf(100 * Math.abs(Bc / Bcirc - 1))}\%$).`, T`$m = ${tf(m)}\,\text{A}\cdot\text{m}^2$, torque $${tf(tq * 1e3)}\,\text{mN}\cdot\text{m}$.`, T`$B_z(${zf}a) = ${tf(Bz * 1e6)}\,\mu\text{T}$.`],
        idea: 'The Biot–Savart law adds the field of each current element; far away, any small loop looks like a dipole set only by its moment NIA.',
        diagram, prerequisites: 'Biot–Savart law; magnetic moment; torque on a loop.',
        verify: () => { // Biot–Savart summed over 4000 elements per side
            const corners = [[-a / 2, -a / 2], [a / 2, -a / 2], [a / 2, a / 2], [-a / 2, a / 2]], M = 4000;
            const Bat = P => { let bz = 0; for (let s = 0; s < 4; s++) { const [x1, y1] = corners[s], [x2, y2] = corners[(s + 1) % 4]; for (let i = 0; i < M; i++) {
                const x = x1 + (x2 - x1) * (i + .5) / M, y = y1 + (y2 - y1) * (i + .5) / M, dlx = (x2 - x1) / M, dly = (y2 - y1) / M, rx = P[0] - x, ry = P[1] - y, rz = P[2], r3 = Math.hypot(rx, ry, rz) ** 3;
                bz += (dlx * ry - dly * rx) / r3; } } return MU0 * N * I / (4 * Math.PI) * bz; };
            const r = 2 * a / Math.PI; let bc = 0; for (let i = 0; i < M; i++) bc += MU0 * N * I / (4 * Math.PI) * (2 * Math.PI * r / M) / (r * r);
            return [Bat([0, 0, 0]) * 1e6, bc * 1e6, N * I * a * a, N * I * a * a * B0 * Math.sin(th * Math.PI / 180) * 1e3, Bat([0, 0, z]) * 1e6];
        }
    });
}

/* Level 4 (expert): a centre-fed dipole of any length up to λ/2: input resistance, directivity, losses and efficiency. */
function fieldsDipole(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'dipole', date, FIELDS_READING), p = part;
    const [Lw, fM, am, [metal, sg]] = grid([.1, .2, .25, .3, .375, .4, .45, .5], [50, 100, 300, 433, 900, 2400], [.5, 1, 2], [['copper', 5.8e7], ['aluminium', 3.5e7], ['brass', 1.6e7]]);
    const lam = C0 / (fM * 1e6), kk = 2 * Math.PI / lam, L = Lw * lam, kL = kk * L, F = th => ((Math.cos(kL / 2 * Math.cos(th)) - Math.cos(kL / 2)) / Math.sin(th)) ** 2;
    const integ = NUM.simpson(th => F(th) * Math.sin(th), 1e-9, Math.PI - 1e-9, 20000), Rr0 = 60 * integ, s2 = Math.sin(kL / 2) ** 2, Rin = Rr0 / s2, D = 2 * F(Math.PI / 2) / integ, Ae = D * lam * lam / (4 * Math.PI);
    const Rs = Math.sqrt(Math.PI * fM * 1e6 * MU0 / sg), Rloss = Rs / (2 * Math.PI * am * 1e-3) * (L / 2 - Math.sin(kL) / (2 * kk)) / s2, eff = 100 * Rin / (Rin + Rloss);
    const diagram = drawing(wire('M200 60V128M200 152V220') + ring(200, 140, 6) + dt(160, 146, 'feed') + dt(200, 244, `L = ${Lw}λ`) + `<path d="M200 60Q${200 + 70 * Math.sin(kL / 2)} 100 ${200 + 60 * Math.sin(kL / 2)} 140Q${200 + 70 * Math.sin(kL / 2)} 180 200 220" stroke="#aa492a" stroke-width="2"/>` +
        dt(300, 100, 'current I(z)') + `<ellipse cx="520" cy="140" rx="110" ry="${(40 + 40 * Lw).toFixed(1)}" stroke="#315740"/>` + wire('M520 40V240') + dt(520, 30, 'pattern (cut)'), 'A centre-fed wire dipole with its standing-wave current distribution, and a cut through its radiation pattern', 262);
    return q({
        title: 'Radiation and loss of a wire dipole',
        text: T`A centre-fed ${metal} dipole of total length $L = ${Lw}\lambda$ and wire radius $${am}\,\text{mm}$ works at $${fM}\,\text{MHz}$. Its current is the standing wave $I(z) = I_0\sin\bigl(k(L/2 - |z|)\bigr)$, so the radiated power density follows $F(\theta) = \left[\dfrac{\cos(\tfrac{kL}{2}\cos\theta) - \cos\tfrac{kL}2}{\sin\theta}\right]^2$ and $R_r = 60\displaystyle\int_0^\pi F(\theta)\sin\theta\,d\theta$ referred to $I_0$. Find the input (feed-point) radiation resistance, the directivity in dBi, the maximum effective aperture, the ohmic loss resistance at the feed (surface resistance $R_s = \sqrt{\pi f\mu_0/\sigma}$, $\sigma = ${tf(sg)}\,\text{S/m}$, current confined to the wire's skin), and the radiation efficiency.`,
        givens: [T`$L = ${Lw}\lambda$ at $${fM}\,\text{MHz}$`, `Wire radius ${am} mm, ${metal}`, T`$\sigma = ${tf(sg)}\,\text{S/m}$`],
        parts: [p('Input radiation resistance', Rin, 'Ω'), p('Directivity', 10 * Math.log10(D), 'dBi'), p('Maximum effective aperture', Ae * 1e4, 'cm²'), p('Loss resistance at the feed', Rloss, 'Ω', .01, 1e-4), p('Radiation efficiency', eff, '%')],
        hints: [T`Evaluate the integral numerically. The feed current is $I_0\sin(kL/2)$, so $R_{\text{in}} = R_r/\sin^2(kL/2)$.`, T`$D = \dfrac{4\pi U_{\max}}{P_{\text{rad}}} = \dfrac{2F_{\max}}{\int_0^\pi F\sin\theta\,d\theta}$ with the maximum at $\theta = 90^\circ$; $A_e = D\lambda^2/(4\pi)$.`, T`Loss power $\tfrac12\int\frac{R_s}{2\pi a}|I(z)|^2dz$: $\displaystyle\int_{-L/2}^{L/2}\sin^2\bigl(k(\tfrac L2 - |z|)\bigr)dz = \frac L2 - \frac{\sin kL}{2k}$. Refer it to the feed current as for $R_{\text{in}}$.`],
        steps: [T`$\lambda = ${tf(lam)}\,\text{m}$, $kL = ${tf(kL)}$; $\int F\sin\theta\,d\theta = ${tf(integ)}$, so $R_r = ${tf(Rr0)}\,\Omega$ and $R_{\text{in}} = ${tf(Rin)}\,\Omega$.`, T`$D = ${tf(D)} = ${tf(10 * Math.log10(D))}\,\text{dBi}$; $A_e = ${tf(Ae * 1e4)}\,\text{cm}^2$.`, T`$R_s = ${tf(Rs * 1e3)}\,\text{m}\Omega$, $R_{\text{loss}} = ${tf(Rloss)}\,\Omega$.`, T`Efficiency $= ${tf(eff)}\%$.`],
        idea: 'A short dipole has a tiny radiation resistance, so even small conductor losses waste much of its power; a half-wave dipole radiates efficiently.',
        diagram, prerequisites: 'Antenna patterns; radiation resistance; skin effect.',
        verify: () => { // the closed form of the radiation integral in sine and cosine integrals (Balanis), evaluated by series
            const g = .5772156649015329, Si = x => { let s = 0, t = x; for (let n = 0; n < 60; n++) { s += t / (2 * n + 1); t *= -x * x / ((2 * n + 2) * (2 * n + 3)); } return s; };
            const Ci = x => { let s = 0, t = -x * x / 2; for (let n = 1; n < 60; n++) { s += t / (2 * n); t *= -x * x / ((2 * n + 1) * (2 * n + 2)); } return g + Math.log(x) + s; };
            const x = kL, Rr = 60 * (g + Math.log(x) - Ci(x) + .5 * Math.sin(x) * (Si(2 * x) - 2 * Si(x)) + .5 * Math.cos(x) * (g + Math.log(x / 2) + Ci(2 * x) - 2 * Ci(x)));
            const rin = Rr / s2, d = 2 * F(Math.PI / 2) * 60 / Rr, rl = NUM.simpson(zz => Rs / (2 * Math.PI * am * 1e-3) * Math.sin(kk * (L / 2 - Math.abs(zz))) ** 2, -L / 2, L / 2, 4000) / s2;
            return [rin, 10 * Math.log10(d), d * lam * lam / (4 * Math.PI) * 1e4, rl, 100 * rin / (rin + rl)];
        }
    });
}

/* Level 4 (mastery): the capacitance of a rectangular plate (optionally above a ground plane) by the method of moments. */
function fieldsMoMPlate(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'mom-plate', date, FIELDS_READING), p = part, k = 1 / (4 * Math.PI * EPS0);
    const [a, asp, Nx, hf] = grid([.05, .1, .2, .5, 1], [1, 1.5, 2, 3], [4, 5, 6, 8], [0, 1, .5, .25, .1]);
    const b = a * asp, Ny = Math.round(Nx * asp), sx = a / Nx, sy = b / Ny, h = hf * a, n = Nx * Ny, u = sx / 2, v = sy / 2, dg = Math.hypot(u, v);
    const self = k * 4 * (u * Math.log((v + dg) / u) + v * Math.log((u + dg) / v)), cen = Array.from({length: n}, (_, i) => [((i % Nx) + .5) * sx, (Math.floor(i / Nx) + .5) * sy]);
    const P = cen.map((ci, i) => cen.map((cj, j) => (i === j ? self : k * sx * sy / Math.hypot(ci[0] - cj[0], ci[1] - cj[1])) - (h > 0 ? k * sx * sy / Math.hypot(ci[0] - cj[0], ci[1] - cj[1], 2 * h) : 0)));
    const sig = NUM.solve(P, Array(n).fill(1)), Q = sig.reduce((s, x) => s + x * sx * sy, 0), C = Q, ratio = Math.max(...sig) / Math.min(...sig);
    const edge = sig.reduce((s, x, i) => { const ix = i % Nx, iy = Math.floor(i / Nx); return s + (ix === 0 || iy === 0 || ix === Nx - 1 || iy === Ny - 1 ? x * sx * sy : 0); }, 0), req = Math.sqrt(a * b / Math.PI), Cd = 8 * EPS0 * req;
    const W = 300 / Math.max(Nx, Ny), diagram = drawing(Array.from({length: n}, (_, i) => `<rect x="${(360 - Nx * W / 2 + (i % Nx) * W).toFixed(1)}" y="${(20 + Math.floor(i / Nx) * W).toFixed(1)}" width="${W.toFixed(1)}" height="${W.toFixed(1)}" stroke="#315740" stroke-width="1"/>`).join('') +
        dt(360, 345, `${Nx} × ${Ny} patches, ${a} m × ${tf(b)} m`) + (h > 0 ? dt(360, 370, `plate ${tf(h)} m above a ground plane`) : dt(360, 370, 'isolated plate')), 'A rectangular plate divided into a grid of equal patches for a method-of-moments calculation', 380);
    return q({
        title: 'The capacitance of a plate by the method of moments',
        text: T`A thin rectangular conducting plate, $${a}\,\text{m} \times ${tf(b)}\,\text{m}$, ${h > 0 ? T`lies parallel to an infinite grounded plane at a height of $${tf(h)}\,\text{m}$` : 'is isolated in free space'}, and is held at $1\,\text{V}$. Divide it into $${Nx} \times ${Ny}$ equal patches with constant surface charge density $\sigma_j$ on each, and match the potential at each patch centre. Use the exact self term $\dfrac{\sigma}{4\pi\varepsilon_0}\cdot4\left[u\ln\dfrac{v + \sqrt{u^2 + v^2}}{u} + v\ln\dfrac{u + \sqrt{u^2 + v^2}}{v}\right]$ (patch half-sides $u$, $v$) and treat every other patch as a point charge $\sigma_jA_p$${h > 0 ? ', including the images of all patches in the ground plane' : ''}. Solve for the densities and find the capacitance, the ratio of the largest to the smallest patch density, the percentage of the charge on the outer ring of patches, and the ratio of the capacitance to that of an isolated disc of the same area ($8\varepsilon_0r$).`,
        givens: [T`Plate $${a} \times ${tf(b)}\,\text{m}$, $${Nx} \times ${Ny}$ patches`, h > 0 ? T`Ground plane $${tf(h)}\,\text{m}$ below` : 'No ground plane', T`$V = 1\,\text{V}$, $\varepsilon_0 = 8.854\times10^{-12}\,\text{F/m}$`],
        parts: [p('Capacitance', C * 1e12, 'pF'), p('Largest / smallest density', ratio, ''), p('Charge on the outer ring', 100 * edge / Q, '%'), p('Ratio to the equal-area disc', C / Cd, '')],
        hints: [T`Each row of the system is $\sum_jP_{ij}\sigma_j = 1$, with $P_{ij} = \dfrac{A_p}{4\pi\varepsilon_0r_{ij}}$ off the diagonal${h > 0 ? T` minus $\dfrac{A_p}{4\pi\varepsilon_0\sqrt{r_{ij}^2 + (2h)^2}}$ for the images (also on the diagonal)` : ''}.`, T`Solve the ${n} × ${n} linear system; $C = Q/V = \sum_j\sigma_jA_p$ with $V = 1\,\text{V}$.`, T`Charge crowds towards the edges and corners; the outer ring holds far more than its share of the area (${tf(100 * (n - Math.max(0, Nx - 2) * Math.max(0, Ny - 2)) / n)}% of the patches).`],
        steps: [T`Patch $${tf(sx)} \times ${tf(sy)}\,\text{m}$; self coefficient $${tf(self)}\,\text{V}/(\text{C/m}^2)$.`, T`Solving gives $Q = ${tf(Q * 1e12)}\,\text{pC}$ at $1\,\text{V}$: $C = ${tf(C * 1e12)}\,\text{pF}$.`, T`Density ratio $${tf(ratio)}$; outer ring $${tf(100 * edge / Q)}\%$ of the charge.`, T`Equal-area disc: $8\varepsilon_0\sqrt{ab/\pi} = ${tf(Cd * 1e12)}\,\text{pF}$, ratio $${tf(C / Cd)}$.`],
        idea: 'The method of moments turns an integral equation into a linear system; even a coarse grid shows the charge piling up at the edges.',
        diagram, prerequisites: 'Electrostatic potential; linear systems; numerical methods.',
        verify: () => { // the same system solved by conjugate gradients instead of elimination
            const x = Array(n).fill(0), r = Array(n).fill(1), d = r.slice(); let rr = r.reduce((s, v2) => s + v2 * v2, 0);
            for (let it = 0; it < 5 * n && rr > 1e-30; it++) { const Ad = P.map(row => row.reduce((s, v2, j) => s + v2 * d[j], 0)), al = rr / d.reduce((s, v2, j) => s + v2 * Ad[j], 0);
                for (let i = 0; i < n; i++) { x[i] += al * d[i]; r[i] -= al * Ad[i]; } const rn = r.reduce((s, v2) => s + v2 * v2, 0); for (let i = 0; i < n; i++) d[i] = r[i] + rn / rr * d[i]; rr = rn; }
            const qq = x.reduce((s, v2) => s + v2 * sx * sy, 0), ed = x.reduce((s, v2, i) => { const ix = i % Nx, iy = Math.floor(i / Nx); return s + (ix === 0 || iy === 0 || ix === Nx - 1 || iy === Ny - 1 ? v2 * sx * sy : 0); }, 0);
            return [qq * 1e12, Math.max(...x) / Math.min(...x), 100 * ed / qq, qq / Cd];
        }
    });
}
