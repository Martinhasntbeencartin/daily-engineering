/* Antennas & link budgets: extra problem types for Levels 2–4, rotated with the original ones (EXTRA_TYPES, js/core.js).
   verify() recomputes each problem's answers by an independent method (noise temperatures, radiative transfer, ECEF vectors, eigenvalues). */
const LB_READING = COMMS_READING.linkbudget;
addTypes('linkbudget', 'university', lbBeam, lbCascade, lbFadeMargin);
addTypes('linkbudget', 'challenge', lbRain, lbHata, lbRadar);
addTypes('linkbudget', 'expert', lbGeoLink);
addTypes('linkbudget', 'mastery', lbMimo);

const BOLTZ = 1.380649e-23;
const lbTail = x => NUM.simpson(t => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI), x, x + 12, 600); // Gaussian tail by integration
const lbBlocks = (items, y = 100) => items.map(([x, w, top, bottom], i) => wire(`M${x} ${y}h${w}v54h-${w}z`) + dt(x + w / 2, y + 32, top) + (bottom ? dt(x + w / 2, y + 80, bottom) : '') +
    (i < items.length - 1 ? arrow(x + w, y + 27, items[i + 1][0], y + 27) : '')).join('');

/* Level 2: a dish antenna: gain, beamwidth, pointing loss, footprint and effective aperture. */
let BEAM_CASES = null;
function lbBeam(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'beam', date, LB_READING), p = part;
    BEAM_CASES ||= product([4, 6, 12, 14, 20, 30], [.6, .9, 1.2, 1.8, 2.4, 3.7, 4.5], [.55, .6, .65, .7], [.1, .2, .3, .4], [500, 1200, 20200, 35786]).filter(([f, D, e]) => { const g = 10 * Math.log10(e * (Math.PI * D * f * 1e9 / C0) ** 2); return g >= 25 && g <= 62; });
    const [[f, D, eta, frac, dkm]] = grid(BEAM_CASES), lam = C0 / (f * 1e9), G = eta * (Math.PI * D / lam) ** 2, th3 = 70 * lam / D, the = Number((frac * th3).toPrecision(2));
    const Lp = 40 * Math.log10(2) * (the / th3) ** 2, foot = 2 * dkm * Math.tan(th3 / 2 * Math.PI / 180), Ae = eta * Math.PI * D * D / 4;
    const diagram = drawing(wire('M120 70Q170 130 120 190') + wire('M120 130H150') + `<path d="M150 130L640 76M150 130L640 184" stroke="#83968b" stroke-dasharray="5 5"/>` + wire('M640 60V200') + guide('M150 130H660') +
        `<path d="M150 130L640 108" stroke="#aa492a"/>` + dt(250, 104, 'θ₃dB') + dt(560, 222, `footprint at ${dkm} km`) + note(650, 112, `${the}° off`) + dt(120, 222, `${D} m dish, ${f} GHz`),
        'A dish antenna with its half-power beam cone spreading to a footprint, and the actual pointing direction slightly off the beam axis', 240);
    return q({
        title: 'Gain and beam of a dish antenna',
        text: T`A $${D}\,\text{m}$ dish with aperture efficiency $${eta}$ operates at $${f}\,\text{GHz}$. Find its gain, its half-power beamwidth ($\theta_{3\text{dB}} \approx 70\lambda/D$ degrees) and its effective aperture. Model the beam as Gaussian, $G(\theta) = G_0\,2^{-(2\theta/\theta_{3\text{dB}})^2}$: what does a pointing error of $${the}\,{}^\circ$ cost? Find the diameter of the half-power footprint at a distance of $${dkm}\,\text{km}$.`,
        givens: [T`$D = ${D}\,\text{m}$, $\eta = ${eta}$`, T`$f = ${f}\,\text{GHz}$`, T`Pointing error $${the}\,{}^\circ$`, T`Distance $${dkm}\,\text{km}$`],
        parts: [p('Gain', 10 * Math.log10(G), 'dBi', .01, .01), p('Half-power beamwidth', th3, '°'), p('Pointing loss', Lp, 'dB', .01, .005), p('Footprint diameter', foot, 'km'), p('Effective aperture', Ae, 'm²')],
        hints: [T`$G = \eta\left(\dfrac{\pi D}{\lambda}\right)^2$ with $\lambda = c/f$.`, T`The Gaussian model loses $10\log_{10}2\cdot4(\theta/\theta_{3\text{dB}})^2 \approx 12(\theta/\theta_{3\text{dB}})^2\,\text{dB}$.`, T`Footprint $= 2d\tan(\theta_{3\text{dB}}/2)$; effective aperture $A_e = \eta\pi D^2/4 = G\lambda^2/(4\pi)$.`],
        steps: [T`$\lambda = ${tf(lam * 100)}\,\text{cm}$: $G = ${tf(G)}$ ($${tf(10 * Math.log10(G))}\,\text{dBi}$).`, T`$\theta_{3\text{dB}} = 70\times${tf(lam)}/${D} = ${tf(th3)}\,{}^\circ$.`, T`Pointing loss $= 12.04\times(${the}/${tf(th3)})^2 = ${tf(Lp)}\,\text{dB}$.`, T`Footprint $${tf(foot)}\,\text{km}$; $A_e = ${tf(Ae)}\,\text{m}^2$.`],
        idea: 'Gain and beamwidth are two faces of the same aperture: doubling the dish adds 6 dB and halves the beam, which makes pointing harder.',
        diagram, prerequisites: 'Antenna gain; decibels; geometry.',
        verify: () => { // gain from the effective aperture; the loss straight from the beam pattern; the footprint from the cone's edge rays
            const ae = eta * Math.PI * (D / 2) ** 2, lm = C0 / f / 1e9, t3 = 70 * lm / D, half = t3 / 2 * Math.PI / 180;
            return [10 * Math.log10(4 * Math.PI * ae / lm ** 2), t3, -10 * Math.log10(2 ** (-((2 * the / t3) ** 2))), 2 * dkm * Math.sin(half) / Math.cos(half), ae];
        }
    });
}

/* Level 2: cascaded noise figure, and why the low-noise amplifier belongs at the antenna. */
function lbCascade(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'cascade', date, LB_READING), p = part;
    const [Lc, [G1, F1], Lm, F3, Ta, B, snr] = grid([.5, 1, 2, 3], product([15, 20, 25, 30], [.5, .8, 1, 1.5, 2]), [6, 7, 8], [3, 4, 6], [30, 50, 150, 290], [.2, 1, 5, 20], [6, 10, 15]);
    const fl = x => 10 ** (x / 10), fris = st => { let F = 0, g = 1; st.forEach(([gdb, nf], i) => { F += i ? (fl(nf) - 1) / g : fl(nf); g *= fl(gdb); }); return F; };
    const cableFirst = [[-Lc, Lc], [G1, F1], [-Lm, Lm], [20, F3]], lnaFirst = [[G1, F1], [-Lc, Lc], [-Lm, Lm], [20, F3]];
    const Fa = fris(cableFirst), Fb = fris(lnaFirst), Te = 290 * (Fa - 1), sens = t => 10 * Math.log10(BOLTZ * (Ta + t) * B * 1e6 * 1000) + snr, Sa = sens(Te), Sb = sens(290 * (Fb - 1));
    const diagram = drawing(wire('M60 90l20 40l20 -40M80 130V154') + lbBlocks([[120, 100, 'cable', `${Lc} dB loss`], [270, 100, 'LNA', `${G1} dB, NF ${F1} dB`], [420, 100, 'mixer', `${Lm} dB loss`], [570, 100, 'IF amp', `20 dB, NF ${F3} dB`]]) + arrow(80, 127, 120, 127) + dt(80, 76, `Ta = ${Ta} K`),
        'A receiver chain: antenna, cable, low-noise amplifier, mixer and IF amplifier, each with its gain and noise figure', 210);
    return q({
        title: 'Where the low-noise amplifier goes',
        text: T`An antenna with noise temperature $${Ta}\,\text{K}$ feeds a receiver through a cable with $${Lc}\,\text{dB}$ of loss at $290\,\text{K}$. The chain is then an LNA (gain $${G1}\,\text{dB}$, noise figure $${F1}\,\text{dB}$), a passive mixer ($${Lm}\,\text{dB}$ loss, noise figure equal to its loss) and an IF amplifier ($20\,\text{dB}$, noise figure $${F3}\,\text{dB}$). Find the noise figure of the whole receiver and its noise temperature, and the sensitivity for an SNR of $${snr}\,\text{dB}$ in $${B}\,\text{MHz}$. If the LNA is moved to the antenna, ahead of the cable, what are the new noise figure and the improvement in sensitivity?`,
        givens: [T`Cable $${Lc}\,\text{dB}$; LNA $${G1}\,\text{dB}$, NF $${F1}\,\text{dB}$`, T`Mixer $${Lm}\,\text{dB}$; IF amp $20\,\text{dB}$, NF $${F3}\,\text{dB}$`, T`$T_a = ${Ta}\,\text{K}$, $B = ${B}\,\text{MHz}$, SNR $${snr}\,\text{dB}$`],
        parts: [p('Receiver noise figure', 10 * Math.log10(Fa), 'dB', .01, .005), p('Receiver noise temperature', Te, 'K'), p('Sensitivity', Sa, 'dBm', .01, .01), p('Noise figure with the LNA first', 10 * Math.log10(Fb), 'dB', .01, .005), p('Sensitivity improvement', Sa - Sb, 'dB', .01, .005)],
        hints: [T`Friis: $F = F_1 + \dfrac{F_2 - 1}{G_1} + \dfrac{F_3 - 1}{G_1G_2} + \dots$ in linear units. A passive loss $L$ at $290\,\text{K}$ has $F = L$ and $G = 1/L$.`, T`$T_e = 290(F - 1)$; the noise power at the input is $k(T_a + T_e)B$.`, T`Sensitivity $= 10\log_{10}\bigl(k(T_a + T_e)B\bigr) + \text{SNR}$, in dBm.`],
        steps: [T`Cable first: $F = ${tf(Fa)}$ ($${tf(10 * Math.log10(Fa))}\,\text{dB}$), $T_e = ${tf(Te)}\,\text{K}$.`, T`Sensitivity $= 10\log_{10}\bigl(k(${Ta} + ${tf(Te)})\times${B}\times10^6\bigr) + ${snr} = ${tf(Sa)}\,\text{dBm}$.`, T`LNA first: $F = ${tf(Fb)}$ ($${tf(10 * Math.log10(Fb))}\,\text{dB}$), sensitivity $${tf(Sb)}\,\text{dBm}$: $${tf(Sa - Sb)}\,\text{dB}$ better.`],
        idea: 'Loss ahead of the first amplifier adds straight to the noise figure; after enough gain, nothing that follows matters much.',
        diagram, prerequisites: 'Noise figure; decibels.',
        verify: () => { // the same chains in noise temperatures: Tₑ = T₁ + T₂/G₁ + …
            const chain = st => { let t = 0, g = 1; st.forEach(([gdb, nf]) => { t += 290 * (10 ** (nf / 10) - 1) / g; g *= 10 ** (gdb / 10); }); return t; };
            const ta = chain(cableFirst), tb = chain(lnaFirst), s = t => 10 * Math.log10(BOLTZ * (Ta + t) * B * 1e6 / 1e-3) + snr;
            return [10 * Math.log10(1 + ta / 290), ta, s(ta), 10 * Math.log10(1 + tb / 290), s(ta) - s(tb)];
        }
    });
}

/* Level 2: fade margins for Rayleigh fading and log-normal shadowing, and what they cost in range. */
let FADE_CASES = null;
const FADE_Z = {}; // Q⁻¹ of each outage, computed once
function lbFadeMargin(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'fade-margin', date, LB_READING), p = part;
    const marg = (A, s) => { const po = 1 - A / 100; return [-10 * Math.log10(-Math.log(1 - po)), s * (FADE_Z[A] ??= NUM.bisect(x => Qfn(x) - po, 0, 8, 100))]; };
    FADE_CASES ||= product([90, 95, 99, 99.9], [4, 6, 8, 10], [30, 37, 43], [10, 15, 20], [100, 110, 120, 128], [2.7, 3, 3.5, 4], [-95, -100, -105, -110]).filter(([A, s, Pt, G, PL, n, S]) => {
        const [mr, ms] = marg(A, s), d = 10 ** ((Pt + G - PL - mr - ms - S) / (10 * n)); return d >= .2 && d <= 50;
    });
    const [[A, sg, Pt, G, PL, n, S]] = grid(FADE_CASES), [mr, ms] = marg(A, sg), M = mr + ms, d = 10 ** ((Pt + G - PL - M - S) / (10 * n)), d0 = 10 ** ((Pt + G - PL - S) / (10 * n));
    const diagram = curve('distance (km)', 'mean received power (dBm)', [0, Number((1.25 * d0).toPrecision(2))], [S - 10, Pt + G - PL + 10 * n], x => Pt + G - PL - 10 * n * Math.log10(Math.max(x, .1)));
    return q({
        title: 'Fade margins and coverage',
        text: T`A cellular link has a transmit power of $${Pt}\,\text{dBm}$, combined antenna gains of $${G}\,\text{dB}$, a mean path loss of $${PL}\,\text{dB}$ at $1\,\text{km}$ growing with exponent $n = ${n}$, and a receiver sensitivity of $${S}\,\text{dBm}$. The link must work at $${A}\,\%$ of locations and times. Budget separately for Rayleigh fading (received power exponentially distributed about its local mean) and for log-normal shadowing with $\sigma = ${sg}\,\text{dB}$, each at that availability, and add the two margins. Find each margin, the total, the range with the margins, and the range without any margin.`,
        givens: [T`$P_t = ${Pt}\,\text{dBm}$, gains $${G}\,\text{dB}$`, T`$L(1\,\text{km}) = ${PL}\,\text{dB}$, $n = ${n}$`, T`Sensitivity $${S}\,\text{dBm}$`, T`Availability $${A}\,\%$, $\sigma = ${sg}\,\text{dB}$`],
        parts: [p('Rayleigh fade margin', mr, 'dB', .01, .01), p('Shadowing margin', ms, 'dB', .01, .01), p('Total margin', M, 'dB', .01, .01), p('Range with margins', d, 'km'), p('Range without margins', d0, 'km')],
        hints: [T`Rayleigh: $P(\text{power} < x\bar P) = 1 - e^{-x}$. Set it to the outage $1 - A$ and convert $x$ to a margin $-10\log_{10}x$.`, T`Shadowing is Gaussian in decibels: the margin is $\sigma Q^{-1}(1 - A)$.`, T`The link closes while $P_t + G - L(1\,\text{km}) - 10n\log_{10}d - M \ge$ sensitivity.`],
        steps: [T`Outage $${tf(1 - A / 100)}$: Rayleigh $x = ${tf(-Math.log(A / 100))}$, margin $${tf(mr)}\,\text{dB}$.`, T`$Q^{-1}(${tf(1 - A / 100)}) = ${tf(ms / sg)}$, so the shadowing margin is $${tf(ms)}\,\text{dB}$; total $${tf(M)}\,\text{dB}$.`, T`$d = 10^{(${Pt} + ${G} - ${PL} - ${tf(M)} - (${S}))/(10\times${n})} = ${tf(d)}\,\text{km}$; without margins $${tf(d0)}\,\text{km}$.`],
        idea: 'Reliability is bought with margin, and with a path-loss exponent near 4 every 10 dB of margin costs almost half the range.',
        diagram, prerequisites: 'Probability distributions; decibels; path loss.',
        verify: () => { // the fading quantiles by integrating the densities; the ranges by bisection on the link equation
            const po = 1 - A / 100, xr = NUM.bisect(x => NUM.simpson(t => Math.exp(-t), 0, x, 200) - po, 0, 10, 100), z = NUM.bisect(x => lbTail(x) - po, 0, 8, 60);
            const mT = -10 * Math.log10(xr) + sg * z, rng = m => NUM.bisect(x => Pt + G - PL - 10 * n * Math.log10(x) - m - S, 1e-3, 1e3, 100);
            return [-10 * Math.log10(xr), sg * z, mT, rng(mT), rng(0)];
        }
    });
}

/* Level 3: rain on a satellite path: attenuation, sky noise and the drop in C/N. */
const RAIN_BANDS = [[12, .0188, 1.217], [20, .0751, 1.099], [30, .187, 1.021], [40, .35, .939]];
function lbRain(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'rain', date, LB_READING), p = part;
    const [[f, k, al], R, L, Ts] = grid(RAIN_BANDS, [5, 10, 25, 50, 75, 100], [2, 3, 4, 5, 6, 8], [80, 120, 200, 300]);
    const gam = k * R ** al, L0 = 35 * Math.exp(-.015 * R), Le = L / (1 + L / L0), A = gam * Le, dT = 275 * (1 - 10 ** (-A / 10)), drop = A + 10 * Math.log10((Ts + dT) / Ts);
    const diagram = drawing(wire('M60 210H680') + `<path d="M120 210L620 40" stroke="#315740"/>` + Array.from({length: 13}, (_, i) => `<path d="M${150 + i * 26} ${120 + (i % 3) * 6}l-6 14M${158 + i * 26} ${152 + (i % 2) * 8}l-6 14M${144 + i * 26} ${182 + (i % 3) * 4}l-6 14" stroke="#83968b"/>`).join('') +
        guide('M130 112H520') + dot(120, 210) + wire('M610 30h24v20h-24z') + dt(120, 236, 'earth station') + dt(622, 70, 'satellite') + dt(560, 106, 'rain height') + dt(330, 96, `slant path in rain ${L} km`) + dt(470, 240, `${R} mm/h at ${f} GHz`),
        'A slant path from an earth station up through a layer of rain towards a satellite', 250);
    return q({
        title: 'Rain fade on a satellite link',
        text: T`A $${f}\,\text{GHz}$ satellite downlink passes through $${L}\,\text{km}$ of rain falling at $${R}\,\text{mm/h}$. The specific attenuation is $\gamma = kR^\alpha$ with $k = ${k}$ and $\alpha = ${al}$ (dB/km). Rain cells are smaller than the path, so use an effective length $L_{\text{eff}} = \dfrac{L}{1 + L/L_0}$ with $L_0 = 35e^{-0.015R}\,\text{km}$. Find $\gamma$, $L_{\text{eff}}$ and the rain attenuation. The rain also radiates: with a medium temperature of $275\,\text{K}$, find the rise in sky noise temperature. If the clear-sky system noise temperature is $${Ts}\,\text{K}$, by how much does C/N drop?`,
        givens: [T`$f = ${f}\,\text{GHz}$: $k = ${k}$, $\alpha = ${al}$`, T`$R = ${R}\,\text{mm/h}$, $L = ${L}\,\text{km}$`, T`$T_{\text{sys}} = ${Ts}\,\text{K}$ in clear sky`],
        parts: [p(T`$\gamma$`, gam, 'dB/km'), p(T`$L_{\text{eff}}$`, Le, 'km'), p('Rain attenuation', A, 'dB', .01, .005), p('Sky-noise rise', dT, 'K'), p('Drop in C/N', drop, 'dB', .01, .005)],
        hints: [T`$A = \gamma L_{\text{eff}}$ in decibels.`, T`An absorbing medium at temperature $T_m$ with loss factor $\ell = 10^{A/10}$ emits $T_m(1 - 1/\ell)$.`, T`C/N falls by the attenuation and also by the rise in noise: $\Delta = A + 10\log_{10}\dfrac{T_{\text{sys}} + \Delta T}{T_{\text{sys}}}$.`],
        steps: [T`$\gamma = ${k}\times${R}^{${al}} = ${tf(gam)}\,\text{dB/km}$; $L_0 = ${tf(L0)}\,\text{km}$, $L_{\text{eff}} = ${tf(Le)}\,\text{km}$.`, T`$A = ${tf(A)}\,\text{dB}$.`, T`$\Delta T = 275(1 - 10^{-${tf(A)}/10}) = ${tf(dT)}\,\text{K}$.`, T`$\Delta(\text{C/N}) = ${tf(A)} + 10\log_{10}(${tf(Ts + dT)}/${Ts}) = ${tf(drop)}\,\text{dB}$.`],
        idea: 'Rain hurts twice: it absorbs the signal and it glows with thermal noise, which matters most for a quiet receiver.',
        diagram, prerequisites: 'Decibels; noise temperature.',
        verify: () => { // the sky noise by integrating the radiative-transfer equation along the effective path
            const g = Math.exp(Math.log(k) + al * Math.log(R)), le = L * L0 / (L + L0), a = g * le, kap = a * Math.LN10 / 10 / le;
            const t = NUM.simpson(s => 275 * kap * Math.exp(-kap * s), 0, le, 400);
            return [g, le, a, t, a + 10 * Math.log10(1 + t / Ts)];
        }
    });
}

/* Level 3: Okumura–Hata path loss in a city and the cell radius it allows. */
let HATA_CASES = null;
const hataFixed = (f, hb, hm) => { const lf = Math.log10(f), a = (1.1 * lf - .7) * hm - (1.56 * lf - .8); return {a, A: 69.55 + 26.16 * lf - 13.82 * Math.log10(hb) - a, slope: 44.9 - 6.55 * Math.log10(hb)}; };
function lbHata(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'hata', date, LB_READING), p = part;
    HATA_CASES ||= product([150, 200, 450, 700, 900, 1500], [30, 50, 80, 120, 200], [1.5, 3, 5, 10], [1, 2, 5, 10, 20], [40, 50, 60], [-95, -100, -105, -110]).filter(([f, hb, hm, d, P, S]) => { const h = hataFixed(f, hb, hm), r = 10 ** ((P - S - h.A) / h.slope); return r >= 1 && r <= 40; });
    const [[f, hb, hm, d, P, S]] = grid(HATA_CASES), h = hataFixed(f, hb, hm), L = h.A + h.slope * Math.log10(d), Pr = P - L, rmax = 10 ** ((P - S - h.A) / h.slope);
    const diagram = drawing(wire('M40 210H690') + wire('M110 210V60M96 60h28M110 60l-10 -18M110 60l10 -18') + [[200, 120], [260, 90], [330, 140], [400, 100], [470, 130], [540, 110]].map(([x, y]) => `<rect x="${x}" y="${y}" width="50" height="${210 - y}" fill="#e9eee6" stroke="#315740"/>`).join('') +
        wire('M650 210V180M642 180h16') + dt(110, 32, `base station ${hb} m`) + dt(650, 166, `mobile ${hm} m`) + dt(370, 240, `${f} MHz, d = ${d} km`), 'A base-station mast above city buildings, with a mobile at street level some distance away', 250);
    return q({
        title: 'Okumura–Hata path loss in a city',
        text: T`A base station at height $h_b = ${hb}\,\text{m}$ radiates an EIRP of $${P}\,\text{dBm}$ at $${f}\,\text{MHz}$ over a medium-sized city. The Okumura–Hata model gives $L = 69.55 + 26.16\log_{10}f - 13.82\log_{10}h_b - a(h_m) + (44.9 - 6.55\log_{10}h_b)\log_{10}d$ (f in MHz, d in km), with $a(h_m) = (1.1\log_{10}f - 0.7)h_m - (1.56\log_{10}f - 0.8)$. For a mobile antenna at $h_m = ${hm}\,\text{m}$, find $a(h_m)$, the path loss at $d = ${d}\,\text{km}$ and the received power (0 dBi mobile antenna). How steeply does the loss grow per decade of distance, and what is the cell radius for a sensitivity of $${S}\,\text{dBm}$?`,
        givens: [T`$f = ${f}\,\text{MHz}$, $h_b = ${hb}\,\text{m}$, $h_m = ${hm}\,\text{m}$`, T`EIRP $${P}\,\text{dBm}$`, T`$d = ${d}\,\text{km}$; sensitivity $${S}\,\text{dBm}$`],
        parts: [p(T`$a(h_m)$`, h.a, 'dB', .01, .01), p('Path loss', L, 'dB', .01, .02), p('Received power', Pr, 'dBm', .01, .02), p('Slope per decade', h.slope, 'dB'), p('Cell radius', rmax, 'km')],
        hints: [T`Evaluate the logarithms once: $\log_{10}f$, $\log_{10}h_b$ and $\log_{10}d$.`, T`Received power $= \text{EIRP} - L$.`, T`The distance term has slope $44.9 - 6.55\log_{10}h_b$ dB per decade; solve $\text{EIRP} - L(d) = $ sensitivity for $d$.`],
        steps: [T`$a(${hm}) = ${tf(h.a)}\,\text{dB}$.`, T`$L = ${tf(h.A)} + ${tf(h.slope)}\log_{10}${d} = ${tf(L)}\,\text{dB}$; $P_r = ${tf(Pr)}\,\text{dBm}$.`, T`Slope $${tf(h.slope)}\,\text{dB/decade}$ (path-loss exponent $${tf(h.slope / 10)}$).`, T`$\log_{10}d_{\max} = (${P} - (${S}) - ${tf(h.A)})/${tf(h.slope)}$, so $d_{\max} = ${tf(rmax)}\,\text{km}$.`],
        idea: 'In a city the loss grows with an exponent of about 3.5, so raising the base-station antenna buys range twice: less loss and a gentler slope.',
        diagram, prerequisites: 'Logarithms; empirical path-loss models.',
        verify: () => { // the loss evaluated term by term; the slope by a numerical difference; the radius by bisection
            const lf = Math.log10(f), a = 1.1 * lf * hm - .7 * hm - 1.56 * lf + .8, loss = x => 69.55 + 26.16 * lf - 13.82 * Math.log10(hb) - a + (44.9 - 6.55 * Math.log10(hb)) * Math.log10(x);
            return [a, loss(d), P - loss(d), loss(100) - loss(10), NUM.bisect(x => P - loss(x) - S, .01, 1e4, 100)];
        }
    });
}

/* Level 3: the radar equation, detection range and pulse integration. */
function lbRadar(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'radar', date, LB_READING), p = part;
    const [Pt, G, f, sig, F, B, R, Np, prf] = grid([10, 50, 100, 500, 1000], [30, 35, 40], [3, 5.6, 9.4], [.1, 1, 10], [3, 4, 5], [1, 2, 5], [20, 50, 100], [8, 16, 32, 64], [1, 2, 4]);
    const lam = C0 / (f * 1e9), g = 10 ** (G / 10), Lsys = 10 ** (4 / 10), N = BOLTZ * 290 * 10 ** (F / 10) * B * 1e6, smin = 10 ** 1.3;
    const snrAt = r => Pt * 1e3 * g * g * lam * lam * sig / ((4 * Math.PI) ** 3 * (r * 1e3) ** 4 * Lsys) / N, snr = snrAt(R), R1 = R * (snr / smin) ** .25, RN = R1 * Np ** .25, Ru = C0 / (2 * prf * 1e3) / 1e3;
    const diagram = drawing(wire('M90 90Q140 150 90 210M90 150H120') + arrow(130, 132, 520, 132) + arrow(520, 168, 130, 168) + `<path d="M560 130l30 20l-30 20l-15 -20z" fill="#e9eee6" stroke="#315740"/>` +
        dt(325, 120, `${Pt} kW pulses, ${f} GHz`) + dt(325, 196, 'echo') + dt(570, 200, `σ = ${sig} m²`) + dt(325, 240, `range ${R} km`) + dt(90, 236, `${G} dBi`), 'A radar antenna sending pulses to a target and receiving the echo', 250);
    return q({
        title: 'The radar equation',
        text: T`A monostatic radar transmits $${Pt}\,\text{kW}$ peak at $${f}\,\text{GHz}$ through an antenna of gain $${G}\,\text{dBi}$ used for transmitting and receiving. The receiver has a noise figure of $${F}\,\text{dB}$ and a bandwidth of $${B}\,\text{MHz}$, and system losses total $4\,\text{dB}$. For a target of radar cross-section $${sig}\,\text{m}^2$ at $${R}\,\text{km}$, find the single-pulse SNR. Detection needs $13\,\text{dB}$: find the detection range on one pulse, the gain from coherently integrating $${Np}$ pulses, and the detection range with that integration. What is the unambiguous range at a pulse repetition frequency of $${prf}\,\text{kHz}$?`,
        givens: [T`$P_t = ${Pt}\,\text{kW}$, $G = ${G}\,\text{dBi}$, $f = ${f}\,\text{GHz}$`, T`$\sigma = ${sig}\,\text{m}^2$, $R = ${R}\,\text{km}$`, T`NF $${F}\,\text{dB}$, $B = ${B}\,\text{MHz}$, losses $4\,\text{dB}$`, T`$${Np}$ pulses, PRF $${prf}\,\text{kHz}$`],
        parts: [p('Single-pulse SNR', 10 * Math.log10(snr), 'dB', .01, .01), p('Detection range, one pulse', R1, 'km'), p('Integration gain', 10 * Math.log10(Np), 'dB'), p('Detection range, integrated', RN, 'km'), p('Unambiguous range', Ru, 'km')],
        hints: [T`$P_r = \dfrac{P_tG^2\lambda^2\sigma}{(4\pi)^3R^4L}$; noise $kT_0FB$ with $T_0 = 290\,\text{K}$.`, T`SNR falls as $R^{-4}$, so $R_{\max} = R\,(\text{SNR}/\text{SNR}_{\min})^{1/4}$.`, T`Coherent integration of $N$ pulses multiplies the SNR by $N$ (range by $N^{1/4}$). The echo must return before the next pulse: $R_u = c/(2\,\text{PRF})$.`],
        steps: [T`$\lambda = ${tf(lam * 100)}\,\text{cm}$; $P_r = ${tf(snr * N)}\,\text{W}$, noise $${tf(N)}\,\text{W}$: SNR $= ${tf(10 * Math.log10(snr))}\,\text{dB}$.`, T`$R_1 = ${R}\times(${tf(snr)}/${tf(smin)})^{1/4} = ${tf(R1)}\,\text{km}$.`, T`Integration gain $10\log_{10}${Np} = ${tf(10 * Math.log10(Np))}\,\text{dB}$; range $${tf(R1)}\times${Np}^{1/4} = ${tf(RN)}\,\text{km}$.`, T`$R_u = c/(2\times${prf}\,\text{kHz}) = ${tf(Ru)}\,\text{km}$.`],
        idea: 'Radar fights an inverse fourth-power law: sixteen times the power, or sixteen integrated pulses, only doubles the range.',
        diagram, prerequisites: 'Antenna gain; noise power; decibels.',
        verify: () => { // the echo traced step by step: power density at the target, re-radiated power, density back, captured by the aperture
            const pr = r => { const s1 = Pt * 1e3 * g / (4 * Math.PI * (r * 1e3) ** 2), s2 = s1 * sig / (4 * Math.PI * (r * 1e3) ** 2), ae = g * lam * lam / (4 * Math.PI); return s2 * ae / Lsys; };
            const r1 = NUM.bisect(r => Math.log(pr(r) / N / smin), 1e-3, 1e5, 200), rn = NUM.bisect(r => Math.log(Np * pr(r) / N / smin), 1e-3, 1e6, 200);
            return [10 * Math.log10(pr(R) / N), r1, 10 * Math.log10(Np), rn, C0 / prf / 2e6];
        }
    });
}

/* Level 4 (expert): geometry of a geostationary link: slant range, elevation, delay, path loss and C/N₀. */
const RE_KM = 6378.137, RGEO_KM = 42164.17;
let GEO_CASES = null;
function lbGeoLink(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'geo-link', date, LB_READING), p = part;
    const geom = (lat, dl) => { const cg = Math.cos(lat * Math.PI / 180) * Math.cos(dl * Math.PI / 180), sg = Math.sqrt(1 - cg * cg); return {d: Math.sqrt(RE_KM ** 2 + RGEO_KM ** 2 - 2 * RE_KM * RGEO_KM * cg), el: Math.atan2(cg - RE_KM / RGEO_KM, sg) * 180 / Math.PI, gam: Math.acos(cg) * 180 / Math.PI}; };
    GEO_CASES ||= product(steps(5, 70, 5), [0, 10, 20, 30, 40, 50, 60], [4, 12, 20], [44, 48, 52], [10, 15, 20, 25, 30]).filter(([lat, dl]) => geom(lat, dl).el >= 5);
    const [[lat, dl, f, eirp, gt]] = grid(GEO_CASES), {d, el, gam} = geom(lat, dl), delay = d / (C0 / 1e3) * 1e3, Lfs = 20 * Math.log10(4 * Math.PI * d * 1e3 * f * 1e9 / C0), cn0 = eirp - Lfs + gt - 10 * Math.log10(BOLTZ);
    const ex = 150 + 110 * Math.cos(lat * Math.PI / 180 * .9), ey = 160 - 110 * Math.sin(lat * Math.PI / 180 * .9);
    const diagram = drawing(ring(150, 160, 110) + guide('M150 160H640') + dot(640, 160) + wire('M628 150h24v20h-24z') + dot(ex, ey) + wire(`M${ex.toFixed(1)} ${ey.toFixed(1)}L640 160`) + guide(`M150 160L${(150 + 160 * Math.cos(lat * Math.PI / 180 * .9)).toFixed(1)} ${(160 - 160 * Math.sin(lat * Math.PI / 180 * .9)).toFixed(1)}`) +
        dt(640, 196, 'GEO satellite') + dt(150, 194, `station at ${lat}°`) + dt(420, 140 - (160 - ey) * .45, `slant range`) + dt(150, 290, 'Earth (not to scale)') + dt(400, 250, `longitude difference ${dl}°`), 'An earth station on the globe and a geostationary satellite over the equator, joined by the slant path', 300);
    return q({
        title: 'Geometry of a geostationary link',
        text: T`An earth station at latitude $${lat}\,{}^\circ$ points at a geostationary satellite whose longitude differs from its own by $${dl}\,{}^\circ$. With an Earth radius of $${RE_KM}\,\text{km}$ and an orbit radius of $${RGEO_KM}\,\text{km}$, find the slant range, the elevation angle and the one-way propagation delay. At $${f}\,\text{GHz}$, find the free-space path loss. If the satellite's EIRP towards the station is $${eirp}\,\text{dBW}$ and the station's figure of merit is $G/T = ${gt}\,\text{dB/K}$, find $C/N_0$ (no other losses).`,
        givens: [T`Latitude $${lat}\,{}^\circ$, longitude difference $${dl}\,{}^\circ$`, T`$R_E = ${RE_KM}\,\text{km}$, $r = ${RGEO_KM}\,\text{km}$`, T`$f = ${f}\,\text{GHz}$, EIRP $${eirp}\,\text{dBW}$, $G/T = ${gt}\,\text{dB/K}$`],
        parts: [p('Slant range', d, 'km'), p('Elevation', el, '°', .01, .02), p('One-way delay', delay, 'ms'), p('Path loss', Lfs, 'dB', .01, .01), p(T`$C/N_0$`, cn0, 'dB-Hz', .01, .01)],
        hints: [T`The central angle $\gamma$ between the station and the sub-satellite point has $\cos\gamma = \cos(\text{lat})\cos(\Delta\text{lon})$.`, T`Law of cosines: $d^2 = R_E^2 + r^2 - 2R_Er\cos\gamma$; elevation $\tan\varepsilon = \dfrac{\cos\gamma - R_E/r}{\sin\gamma}$.`, T`$C/N_0 = \text{EIRP} - L_{fs} + G/T - 10\log_{10}k$, with $-10\log_{10}k = 228.6\,\text{dB}$.`],
        steps: [T`$\gamma = ${tf(gam)}\,{}^\circ$; $d = ${tf(d)}\,\text{km}$.`, T`$\varepsilon = ${tf(el)}\,{}^\circ$; delay $= ${tf(delay)}\,\text{ms}$.`, T`$L_{fs} = 20\log_{10}(4\pi d/\lambda) = ${tf(Lfs)}\,\text{dB}$.`, T`$C/N_0 = ${eirp} - ${tf(Lfs)} + ${gt} + 228.6 = ${tf(cn0)}\,\text{dB-Hz}$.`],
        idea: 'Geostationary links are long and slow: about 36 000 to 41 000 km and an eighth of a second each way, with the station’s latitude setting both.',
        diagram, prerequisites: 'Spherical geometry; vectors; decibels.',
        verify: () => { // Earth-centred vectors for the station and the satellite; elevation from the angle with the local vertical
            const la = lat * Math.PI / 180, lo = dl * Math.PI / 180, st = [RE_KM * Math.cos(la), 0, RE_KM * Math.sin(la)], sat = [RGEO_KM * Math.cos(lo), RGEO_KM * Math.sin(lo), 0];
            const v = sat.map((x, i) => x - st[i]), dist = Math.hypot(...v), up = st.map(x => x / RE_KM), cz = v.reduce((s, x, i) => s + x * up[i], 0) / dist;
            const loss = 10 * Math.log10((4 * Math.PI * dist * 1e3 / (C0 / (f * 1e9))) ** 2);
            return [dist, 90 - Math.acos(cz) * 180 / Math.PI, dist * 1e3 / C0 * 1e3, loss, eirp - loss + gt + 10 * Math.log10(1 / BOLTZ)];
        }
    });
}

/* Level 4 (mastery): capacity of a 2×2 MIMO channel: eigenmodes, equal power and water-filling. */
const MIMO_ENTRIES = [cx(1, 0), cx(.8, .3), cx(.5, -.6), cx(-.4, .7), cx(.3, .2), cx(-.9, -.1), cx(.6, .6)];
let MIMO_CASES = null;
const mimoEig = ([a, b, c, d]) => { // eigenvalues of HHᴴ for H = [[a, b], [c, d]]
    const p11 = cabs(a) ** 2 + cabs(b) ** 2, p22 = cabs(c) ** 2 + cabs(d) ** 2, p12 = ca(cm(a, cconj(c)), cm(b, cconj(d))), m = (p11 + p22) / 2, r = Math.sqrt(((p11 - p22) / 2) ** 2 + cabs(p12) ** 2);
    return [m + r, m - r];
};
function lbMimo(date, tier, topic) {
    const {grid, q} = typeKit(topic, tier, 'mimo', date, LB_READING), p = part;
    MIMO_CASES ||= product(MIMO_ENTRIES, MIMO_ENTRIES, MIMO_ENTRIES, MIMO_ENTRIES).filter(h => { const [l1, l2] = mimoEig(h); return l2 / l1 >= .01; });
    const [h, sdb] = grid(MIMO_CASES, [0, 5, 10, 15, 20]), rho = unDB(sdb), [l1, l2] = mimoEig(h), Ceq = Math.log2(1 + rho * l1 / 2) + Math.log2(1 + rho * l2 / 2);
    let mu = (rho + 1 / l1 + 1 / l2) / 2, both = mu > 1 / l2;
    if (!both) mu = rho + 1 / l1;
    const Cwf = Math.log2(mu * l1) + (both ? Math.log2(mu * l2) : 0), Csiso = Math.log2(1 + rho * cabs(h[0]) ** 2);
    const hs = h.map(z => tc(z));
    const diagram = drawing([90, 190].map((y, i) => wire(`M150 ${y}h-30M120 ${y}l-14 -22M120 ${y}l14 -22`) + dt(80, y + 6, `Tx${i + 1}`) + wire(`M570 ${y}h30M600 ${y}l-14 -22M600 ${y}l14 -22`) + dt(645, y + 6, `Rx${i + 1}`)).join('') +
        wire('M150 90L570 90M150 190L570 190') + guide('M150 90L570 190M150 190L570 90') + dt(360, 80, 'h₁₁') + dt(360, 214, 'h₂₂') + dt(215, 128, 'h₂₁') + dt(215, 166, 'h₁₂') + dt(360, 252, `SNR ${sdb} dB`), 'Two transmit and two receive antennas with the four channel gains between them', 262);
    return q({
        title: 'Capacity of a 2×2 MIMO channel',
        text: T`A $2\times2$ MIMO link has the channel matrix $H = \begin{pmatrix}${hs[0]} & ${hs[1]}\\ ${hs[2]} & ${hs[3]}\end{pmatrix}$ (row = receive antenna, column = transmit antenna), unit noise power per receive antenna and a total transmit SNR of $\rho = ${sdb}\,\text{dB}$. Find the eigenvalues $\lambda_1 \ge \lambda_2$ of $HH^{\mathsf H}$ (the squared singular values). Find the capacity with the power split equally between the transmit antennas, $\log_2\det\left(I + \tfrac\rho2HH^{\mathsf H}\right)$, and with water-filling over the eigenmodes when the transmitter knows $H$. Compare with a single antenna pair using $h_{11}$ only.`,
        givens: ['h_{11}', 'h_{12}', 'h_{21}', 'h_{22}'].map((nm, i) => T`$${nm} = ${hs[i]}$`).concat([T`$\rho = ${sdb}\,\text{dB}$`]),
        parts: [p(T`$\lambda_1$`, l1, ''), p(T`$\lambda_2$`, l2, ''), p('Capacity, equal power', Ceq, 'bit/s/Hz'), p('Capacity, water-filling', Cwf, 'bit/s/Hz'), p(T`Capacity, $h_{11}$ alone`, Csiso, 'bit/s/Hz')],
        hints: [T`$HH^{\mathsf H}$ is Hermitian $2\times2$: $\lambda = \tfrac{p_{11} + p_{22}}{2} \pm \sqrt{\left(\tfrac{p_{11} - p_{22}}{2}\right)^2 + |p_{12}|^2}$.`, T`Equal power: $C = \sum_i\log_2(1 + \rho\lambda_i/2)$.`, T`Water-filling: $P_i = \max(0,\ \mu - 1/\lambda_i)$ with $\sum P_i = \rho$, then $C = \sum\log_2(1 + P_i\lambda_i)$. Check that the weaker mode gets positive power.`],
        steps: [T`$\lambda_1 = ${tf(l1)}$, $\lambda_2 = ${tf(l2)}$ (condition number $${tf(Math.sqrt(l1 / l2))}$).`, T`Equal power: $C = ${tf(Ceq)}\,\text{bit/s/Hz}$.`, T`Water level $\mu = ${tf(mu)}$${both ? '' : T` (the weak mode gets no power)`}: $C = ${tf(Cwf)}\,\text{bit/s/Hz}$.`, T`Single pair: $\log_2(1 + \rho|h_{11}|^2) = ${tf(Csiso)}\,\text{bit/s/Hz}$.`],
        idea: 'A MIMO channel is a set of parallel channels in disguise: its singular values are their gains, and water-filling over them matters most at low SNR.',
        diagram, prerequisites: 'Complex matrices; eigenvalues; water-filling.',
        verify: () => { // eigenvalues from a real 4×4 embedding of HHᴴ; equal-power capacity from the determinant; water level by bisection
            const [a, b, c, d] = h, P11 = ca(cm(a, cconj(a)), cm(b, cconj(b))), P12 = ca(cm(a, cconj(c)), cm(b, cconj(d))), P22 = ca(cm(c, cconj(c)), cm(d, cconj(d)));
            const Pm = [[P11, P12], [cconj(P12), P22]], E = [0, 1].flatMap(i => [[...Pm[i].map(z => z.re), ...Pm[i].map(z => -z.im)]]).concat([0, 1].map(i => [...Pm[i].map(z => z.im), ...Pm[i].map(z => z.re)]));
            const ev = NUM.eigSym(E).values, lam1 = (ev[2] + ev[3]) / 2, lam2 = (ev[0] + ev[1]) / 2;
            const M = Pm.map((row, i) => row.map((z, j) => ca(cx(i === j ? 1 : 0), cm(cx(rho / 2), z)))), det = cs(cm(M[0][0], M[1][1]), cm(M[0][1], M[1][0]));
            const lv = NUM.bisect(m => Math.max(0, m - 1 / lam1) + Math.max(0, m - 1 / lam2) - rho, 0, rho + 1 / lam1 + 1 / lam2, 200);
            return [lam1, lam2, Math.log2(cabs(det)), Math.log2(1 + Math.max(0, lv - 1 / lam1) * lam1) + Math.log2(1 + Math.max(0, lv - 1 / lam2) * lam2), Math.log2(1 + rho * (a.re ** 2 + a.im ** 2))];
        }
    });
}
