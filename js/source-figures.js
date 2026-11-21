/* Vector adaptations of the seven MIT and Fiore figures credited in OPEN_SOURCES. */
const sourceDrawings = {
    thevenin() {
        return drawing(element('I', 100, 225, 100, 80) + dt(65, 157, 'I₀') +
            wire('M100 80H315l38 -23 38 23 -38 23 -38 -23M391 80H612M100 225H612') +
            dt(337, 86, '−') + dt(368, 86, '+') + dt(353, 39, 'αi') +
            element('R', 225, 80, 225, 225, 'R₁') + arrow(195, 125, 195, 175) + dt(182, 153, 'i') +
            element('R', 503, 80, 503, 225, 'R₂') + dot(225, 80) + dot(503, 80) +
            ring(617, 80, 5) + ring(617, 225, 5) + dt(642, 86, '+') + dt(642, 231, '−') + ground(225, 225),
            'Thévenin port across R₂. A dependent voltage rise αi connects the top of R₁ to the positive port.');
    },
    nodal() {
        return drawing(element('I', 112, 295, 112, 120) + dt(80, 213, 'I₁') + wire('M112 120H235M112 120V52H235M462 52H590V120H462M112 295H590') +
            element('I', 235, 52, 462, 52, 'I₃') + element('R', 235, 120, 462, 120, '22 Ω') +
            element('C', 235, 120, 235, 295, '−j20 Ω') + element('L', 462, 120, 462, 210, 'j15 Ω') +
            element('R', 462, 210, 462, 295, '39 Ω') + element('I', 590, 295, 590, 120, 'I₂') +
            dot(235, 120) + dt(235, 105, 'a') + dot(462, 120) + dt(462, 105, 'b') +
            dot(462, 210) + dt(444, 217, 'c') + ground(235, 295), 'Three-node AC circuit with I₁ and I₂ injected upward and I₃ directed from a to b.', 330);
    },
    crossover() {
        return drawing(element('AC', 105, 80, 105, 212, 'E') +
            element('L', 105, 80, 340, 80, 'L₁') + element('L', 340, 80, 550, 80, 'L₂') +
            element('C', 340, 80, 340, 212, 'C') + element('R', 550, 80, 550, 212, '8 Ω') +
            wire('M105 212H550') + ground(105, 212) + dot(340, 80) + dt(340, 56, 'a') +
            dot(550, 80) + dt(550, 56, 'b'), 'Loudspeaker crossover with two series inductors, shunt capacitor at a and loudspeaker load at b.');
    },
    rcLadder() {
        return drawing(wire('M110 55H540M110 310H540M215 190H310') +
            element('AC', 110, 55, 110, 310, 'E') + element('C', 310, 55, 310, 120, 'C₁') +
            element('R', 310, 120, 310, 190, 'R₁') + element('R', 215, 190, 215, 310, 'R₂') +
            element('C', 310, 190, 310, 310, 'C₂') + element('R', 310, 190, 540, 190, 'R₃') +
            element('R', 540, 55, 540, 190, 'R₄') + element('R', 540, 190, 540, 310, 'R₅') +
            dot(310, 55) + dt(310, 36, 'a') + dot(310, 190) + dt(287, 180, 'b') +
            dot(540, 190) + dt(562, 192, 'c') + ground(110, 310), 'Bridged RC network. R₃ connects output nodes b and c.', 350);
    },
    threeSource() {
        return drawing(wire('M90 169V46H189M496 46V169H602M90 338H602M90 169H208') +
            element('I', 189, 46, 496, 46, 'I') + element('R', 90, 110, 307, 110, '200 Ω') +
            element('L', 307, 110, 496, 110, 'j300 Ω') + dot(307, 110) + dt(307, 98, 'e') +
            element('C', 208, 169, 496, 169, '−j400 Ω') + element('C', 90, 169, 90, 338, '−j600 Ω') +
            element('R', 208, 169, 208, 252, '100 Ω') + element('DC', 208, 252, 208, 338, 'E₁') +
            element('L', 496, 169, 496, 338, 'j500 Ω') + element('R', 602, 169, 602, 252, '1 kΩ') +
            element('DC', 602, 252, 602, 338, 'E₂') + dot(208, 169) + dt(208, 156, 'a') +
            dot(496, 169) + dt(520, 157, 'b') + dot(208, 252) + dt(234, 255, 'c') +
            dot(602, 252) + dt(628, 255, 'd') + dot(90, 110) + dot(496, 110) + ground(208, 338),
            'Three-source phasor circuit with a current source directed from a to b and positive voltage terminals at c and d.', 376);
    },
    jfet() {
        return drawing(element('AC', 78, 180, 78, 282) + dt(48, 236, 'vᵢₙ') + ground(78, 282) +
            element('C', 78, 180, 220, 180, 'Cᵢₙ') + element('R', 220, 180, 220, 282, 'Rɢ') + ground(220, 282) +
            arrow(220, 180, 325, 180) + wire('M325 153v53M325 153h17v-42M325 206h17v22h106') +
            dot(220, 180) + dot(342, 111) + dot(342, 228) + element('R', 342, 38, 342, 111, 'Rᴅ') +
            dt(342, 28, '+Vᴅᴅ') + element('R', 342, 228, 342, 305, 'Rₛ') + ground(342, 305) +
            element('C', 448, 228, 448, 305, 'Cₛ') + ground(448, 305) +
            element('C', 342, 111, 569, 111, 'Cₒᵤₜ') + element('R', 569, 111, 569, 250, 'Rʟ') + ground(569, 250),
            'Self-biased n-channel JFET with gate return, source bypass capacitor and AC-coupled load.', 345);
    },
    nonlinear() {
        return drawing(dt(197, 30, 'One stage A') + element('R', 175, 67, 175, 148, 'R') + dt(175, 58, 'Vₛ') +
            wire('M175 148v15l-20 27 20 27 20 -27 -20 -27M175 217v16M175 148h110') +
            arrow(175, 179, 175, 201) + ground(175, 233) + dt(71, 196, 'i(vᵢₙ)') + dot(175, 148) + dt(273, 135, 'vₒᵤₜ') +
            guide('M330 45v200') + dt(505, 30, 'Cascade B') +
            arrow(375, 145, 412, 145) + wire('M412 107v76l68 -38z') + dt(434, 151, 'A') +
            arrow(480, 145, 522, 145) + wire('M522 107v76l68 -38z') + dt(544, 151, 'A') +
            arrow(590, 145, 650, 145) + dt(381, 123, 'vᵢₙ') + dt(645, 123, 'vₒᵤₜ'),
            'Pull-up resistor and input-controlled current sink in stage A. Cascade B connects two identical A stages.');
    }
};
