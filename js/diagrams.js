/* Vector diagrams are drawn from the exercise parameters, never generated imagery. */
const drawing = (body, label, h=260) => `<svg viewBox="-10 -8 740 ${h + 16}" role="img" aria-label="${label}"><g fill="none" stroke="#315740" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const dt = (x, y, t) => `<text x="${x}" y="${y}" fill="#315740" stroke="none" text-anchor="middle">${t}</text>`;
const ground = (x, y) => `<path d="M${x} ${y}v8m-14 0h28m-23 6h18m-13 6h8"/>`;
const rH = (x, y, label) => `<path d="M${x} ${y}h20m70 0h20"/><rect x="${x + 20}" y="${y - 9}" width="70" height="18"/>${dt(x + 55, y - 20, label)}`;
const rV = (x, y, label) => `<path d="M${x} ${y}v15m0 50v15"/><rect x="${x - 9}" y="${y + 15}" width="18" height="50"/>${dt(x + 65, y + 46, label)}`;
const dcMarks = (x, y) => `<path d="M${x - 6} ${y - 10}h12m-6 -6v12m-6 14h12"/>`;
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#315740"/>`;
function coilH(x, y, label) {
    return `<path d="M${x} ${y}h12${Array.from({length: 5}, () => 'a10 13 0 0 1 20 0').join('')}h12"/>${dt(x + 62, y - 26, label)}`;
}
function rcDiagram(r, c, source='Vin', cap='C', load) {
    return drawing(`<path d="M100 110V70h110m110 0h150v55m0 18v57H100v-30M470 70h130"/><circle cx="100" cy="140" r="30"/>${cap === 'charge' ? dcMarks(100, 140) : dt(100, 145, '~')}${dt(43, 147, source)}${rH(210, 70, r)}<path d="M448 125h44m-44 18h44"/>${dt(535, 140, c)}${dot(470, 70)}${dt(610, 65, 'Vout')}${ground(370, 200)}${load ? `<path d="M600 70v35m0 80v15H470"/>${rV(600, 105, load)}` : ''}${dt(355, 250, cap === 'charge' ? 'Initially uncharged; ideal DC step at t = 0' : 'Output is measured across the capacitor')}`, 'RC circuit with a series resistor and output across a capacitor to ground');
}
function ledDiagram(v, vf, i) {
    return drawing(`<path d="M110 110V60h130m110 0h170v40m0 45v65H110v-40"/><circle cx="110" cy="140" r="30"/>${dcMarks(110, 140)}${dt(100, 95, v + ' V')}${rH(240, 60, 'R = ?')}<path d="M500 100h40l-20 45zM498 145h44M550 110l28 -22m-9 1 9 -1 -2 9M553 131l28 -22m-9 1 9 -1 -2 9"/>${dt(600, 164, 'LED ' + vf + ' V')}${dt(330, 235, 'Target current: ' + i + ' mA')}`, 'DC source, series resistor and forward biased LED with light emission arrows');
}
function opampDiagram(inverting, rf='Rf', rg='Rg', vin='Vin') {
    return drawing(`<path d="M345 90v110l105 -55zM450 145h190M345 115h-55v-65h90m110 0h100v95"/>${rH(380, 50, rf)}${dot(590, 145)}${dot(290, 115)}${dt(360, 121, '−')}${dt(360, 180, '+')}${dt(650, 135, 'Vout')}${inverting ? `<path d="M80 115h35m110 0h65M345 175h-45v35"/>${rH(115, 115, rg)}${dt(80, 90, vin)}${ground(300, 210)}` : `<path d="M345 175H110M290 115h-65m-110 0H80v80"/>${rH(115, 115, rg)}${ground(80, 195)}${dt(140, 165, vin)}`}${dt(480, 235, 'Supply connections omitted; see the stated model')}`, (inverting ? 'Inverting' : 'Non-inverting') + ' op amp with correctly connected resistor feedback and labelled inputs');
}
function loadedDividerDiagram(v, a, b, load) {
    return drawing(`<path d="M90 100V50h130m110 0h130v45m0 80v35H90v-50M460 50h140v45m0 80v35H460"/><circle cx="90" cy="130" r="30"/>${dcMarks(90, 130)}${dt(55, 101, v + ' V')}${rH(220, 50, 'R₁ ' + a + ' kΩ')}${rV(460, 95, 'R₂ ' + b + ' kΩ')}${rV(600, 95, 'RL ' + load + ' kΩ')}${dot(460, 50)}${dt(530, 34, 'Vout')}${ground(370, 210)}`, 'Loaded voltage divider: lower resistor and load are in parallel');
}
function feedbackDiagram(controller, plant) {
    return drawing(`<path d="M40 105h75m40 0h45m115 0h60m170 0h125M620 105v105H135v-85"/><circle cx="135" cy="105" r="20"/><rect x="200" y="75" width="115" height="60" rx="4"/><rect x="375" y="65" width="170" height="80" rx="4"/>${dot(620, 105)}${dt(65, 87, 'r(t)')}${dt(665, 87, 'y(t)')}${dt(126, 109, '+')}${dt(151, 152, '−')}${dt(257, 110, controller)}${dt(460, 110, plant)}${dt(360, 237, 'Unity negative feedback')}`, 'Closed-loop control diagram with controller, plant and negative unity feedback');
}
function transformerDiagram(np, ns, extra='Ideal transformer') {
    let coils = '';
    for (let i = 0; i < 5; i++) {
        coils += `<path d="M290 ${60 + i * 25}a18 12.5 0 0 1 0 25M410 ${60 + i * 25}a18 12.5 0 0 0 0 25"/>`;
    }
    return drawing(`<path d="M140 90V60h150m0 125H140v-35M410 60h160v20m0 80v25H410M345 45v155m15 -155v155"/><circle cx="140" cy="120" r="30"/>${dt(140, 125, '~')}${coils}${extra.startsWith('No-load') ? `${dot(570, 80)}${dot(570, 160)}${dt(620, 125, 'Open')}` : rV(570, 80, 'Load')}${dt(240, 30, typeof np === 'number' ? 'Nₚ = ' + np : np)}${dt(460, 30, typeof ns === 'number' ? 'Nₛ = ' + ns : ns)}${dt(120, 200, 'Primary')}${dt(560, 210, 'Secondary')}${dt(360, 247, extra)}`, 'Transformer with separate primary and secondary windings, magnetic core and secondary load');
}
function pulseDiagram(duty, label) {
    const start = 100, width = 230, high = width * duty;
    let path = 'M100 175';
    for (let n = 0; n < 2; n++) {
        const x = start + n * width;
        path += `L${x} 70H${x + high}V175H${x + width}`;
    }
    return drawing(`<path d="M80 200V40M80 200h550" stroke="#aab9a0"/><path d="${path}"/>${dt(45, 75, 'HIGH')}${dt(45, 181, 'LOW')}${dt(360, 240, label)}${dt(640, 202, 't')}`, 'Two periods of a digital waveform; high duration is proportional to the specified duty cycle');
}
function digitalDiagram(mode, a, b, c) {
    if (mode === 'binary')
        return drawing(`${[...a].map((bit, i) => `<rect x="${110 + i * 70}" y="70" width="56" height="65" rx="4"/>${dt(138 + i * 70, 110, bit)}${dt(138 + i * 70, 166, '2^' + (a.length - 1 - i))}`).join('')}${dt(360, 225, 'Most significant bit on the left')}`, 'Binary word with place values labelled beneath each bit');
    if (mode === 'logic')
        return drawing(`<path d="M75 70h135M75 130h135M315 100h110M380 175h45M535 130h90"/><rect x="210" y="50" width="105" height="100" rx="3"/><path d="M425 80h60a50 50 0 0 1 0 100h-60z"/>${dt(263, 105, '=1')}${dt(75, 58, 'A = ' + a)}${dt(75, 155, 'B = ' + b)}${dt(368, 200, 'Enable = ' + c)}${dt(645, 135, 'Y = ?')}${dt(263, 190, 'XOR')}${dt(480, 210, 'AND')}`, 'XOR of A and B feeding an AND gate with Enable; IEC XOR symbol =1');
    if (mode === 'counter')
        return drawing(`<path d="M60 125h100m210 0h90m100 0h80"/><rect x="160" y="65" width="210" height="120" rx="5"/><path d="M160 110l20 15 -20 15"/><rect x="460" y="90" width="100" height="70" rx="4"/>${dt(265, 105, a + '-bit binary')}${dt(265, 140, 'counter')}${dt(90, 92, 'Clock')}${dt(510, 132, 'MSB')}${dt(360, 230, 'Most significant output toggles once per half-count cycle')}`, 'Clock driving a binary counter with its most significant output selected');
    if (mode === 'timing')
        return drawing(`<path d="M140 120h90m200 0h80M80 185v30h490v-30M80 215v20"/><rect x="35" y="65" width="105" height="120" rx="4"/><rect x="230" y="80" width="200" height="80" rx="4"/><rect x="510" y="65" width="105" height="120" rx="4"/>${dt(87, 105, 'Launch FF')}${dt(330, 115, 'Combinational')}${dt(330, 140, 'logic')}${dt(562, 105, 'Capture FF')}${dt(185, 55, 'tCQ = ' + a + ' ns')}${dt(330, 55, 'tpd = ' + b + ' ns')}${dt(570, 45, 'tsetup = ' + c + ' ns')}${dt(360, 248, 'Shared clock; specified skew margin is added to the timing budget')}`, 'Two flip-flops with a combinational logic path and common clock');
    return drawing(`<path d="M100 70h170M100 160h170M450 115h150"/><rect x="270" y="45" width="180" height="150" rx="5"/>${dt(175, 60, 'A = ' + a)}${dt(175, 185, 'B = ' + b)}${dt(360, 110, c + '-bit adder')}${dt(360, 145, 'Carry in = 0')}${dt(600, 102, 'Sum / carry')}${dt(360, 240, 'Unsigned addition; only the lowest N bits are stored')}`, 'Unsigned adder showing operands, word size and sum/carry outputs');
}
function coilDiagram(n, label) {
    return drawing(`<path d="M110 120v-5h95m124 0h170v65H110v-10"/>${coilH(205, 115, n)}<circle cx="110" cy="145" r="25"/>${dt(110, 151, 'I')}${dt(360, 220, label)}`, 'Coil with current supply; ideal lumped magnetic model');
}
function fluxDiagram(n, p1, p2, ms) {
    return drawing(`<path d="M105 195V35M105 195h500" stroke="#aab9a0"/><path d="M125 160L565 65"/><path d="M565 65v130M125 160H105" stroke-dasharray="5 5"/>${dt(70, 47, 'Φ')}${dt(70, 164, p1 + ' mWb')}${dt(590, 52, p2 + ' mWb')}${dt(565, 220, ms + ' ms')}${dt(125, 220, '0')}${dt(610, 198, 't')}${dt(330, 35, n + ' turns · flux change is linear')}`, 'Flux per turn increases linearly from the labelled initial value to the labelled final value over the stated interval');
}
function coreDiagram(n, l, g, area) {
    return drawing(`<path d="M200 50H490V100M490 126v84H200V50M245 90H445V100M445 126v44H245V90"/><path d="M445 100h45M445 126h45"/>${Array.from({length: 5}, (_, i) => `<path d="M180 ${80 + i * 22}h85"/>`).join('')}${dt(130, 140, n + ' turns')}${dt(585, 119, 'Gap ' + g + ' mm')}${dt(370, 30, 'Mean core length ' + l + ' m')}${dt(360, 248, 'Cross-section ' + area + ' cm² · no fringing')}`, 'Gapped magnetic core with a winding, labelled gap, mean core length and cross-sectional area');
}
function adcDiagram(n, vref, left='Vin') {
    return drawing(`<path d="M60 125h190m230 0h150M360 35v30"/><rect x="250" y="65" width="230" height="120" rx="5"/>${dt(125, 107, left)}${dt(365, 115, n + '-bit ADC')}${dt(365, 149, 'Ideal, unipolar')}${dt(360, 26, 'Vref = ' + vref + ' V')}${dt(585, 107, 'Digital code')}${dt(360, 235, 'Range 0 to Vref; one interval = Vref / 2ᴺ')}`, 'Unipolar analogue-to-digital converter with input, reference and code output');
}
function shuntDiagram(i, r) {
    return drawing(`<path d="M90 125h160m110 0h220M230 125V65h95m45 0h45v60"/>${rH(250, 125, 'Rsh = ' + r + ' mΩ')}<circle cx="347" cy="65" r="22"/>${dt(347, 71, 'V')}${dot(230, 125)}${dot(415, 125)}${dt(140, 105, 'I = ' + i + ' A')}${dt(360, 230, 'Voltmeter is connected across the shunt')}`, 'Series current shunt with an ideal voltmeter connected in parallel across it');
}
function bridgeDiagram(r, delta) {
    return drawing(`<path d="M170 35h360M170 35v15m0 80v10m0 80v15h360v-15m0 -80v-10m0 -80V35M170 135h70M530 135h-70"/>${rV(170, 50, 'R')}${rV(170, 140, 'R')}${rV(530, 50, 'R')}${rV(530, 140, 'R(1 + GF·ε)')}${dot(170, 135)}${dot(530, 135)}${dt(270, 140, 'VA')}${dt(425, 140, 'VB')}${dt(350, 25, 'Vexc')}${dt(350, 260, 'R = ' + r + ' Ω · strain = ' + delta + ' µε')}`, 'Wheatstone bridge with three equal resistors and one active strain gauge at the lower right', 280);
}
function acPowerDiagram(label) {
    return drawing(`<path d="M120 190h430v-125z"/><path d="M525 190v-25h25"/>${dt(335, 220, 'Real power P')}${dt(628, 136, 'Reactive Q')}${dt(320, 105, 'Apparent S')}${dt(145, 170, 'φ')}${dt(360, 35, label)}${dt(360, 252, 'Inductive load · diagram shows relationships, not scale')}`, 'Power triangle showing real power horizontal, reactive power vertical and apparent power on the hypotenuse');
}
function buckDiagram(vin, vout, l, f) {
    return drawing(`<path d="M65 100V60h100m80 0h45m124 0h126v50m0 18v82H65v-50M290 60v65m0 35v50M540 60h80v35m0 80v35H540"/><circle cx="65" cy="130" r="30"/>${dcMarks(65, 130)}${dt(65, 38, vin + ' V')}<path d="M165 60l70 -25"/>${dot(165, 60)}${dot(245, 60)}${coilH(290, 60, 'L = ' + l + ' mH')}<path d="M270 125h40M290 130l-20 30h40zM520 110h40m-40 18h40"/>${rV(620, 95, 'Load')}${dt(508, 43, typeof vout === 'number' ? vout + ' V' : vout)}${dt(470, 135, 'C')}${dt(360, 245, 'Ideal buck · continuous conduction · f = ' + f + ' kHz')}`, 'Buck converter with high-side switch, freewheel diode to ground, series inductor, output capacitor and load');
}
