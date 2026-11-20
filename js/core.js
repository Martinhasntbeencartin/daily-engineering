/* Topics, levels and the router that picks the generator for a (topic, date, level) selection. */
const TOPICS = [
    {id: 'circuits', name: 'Circuit analysis', sub: 'Networks, transients & phasors', icon: '⌁', group: 'electrical'},
    {id: 'electronics', name: 'Electronics', sub: 'Devices, amplifiers & oscillators', icon: '⋈', group: 'electrical'},
    {id: 'signals', name: 'Signals & systems', sub: 'Transforms, filters & sampling', icon: '∿', group: 'electrical'},
    {id: 'control', name: 'Control systems', sub: 'Feedback, stability & optimal control', icon: '⊞', group: 'electrical'},
    {id: 'digital', name: 'Digital logic', sub: 'Boolean algebra, codes & timing', icon: '01', group: 'electrical'},
    {id: 'fields', name: 'Electromagnetism', sub: 'Fields, waves & antennas', icon: 'Φ', group: 'electrical'},
    {id: 'power', name: 'Power systems', sub: 'AC power, machines & grids', icon: 'ϟ', group: 'electrical'},
    {id: 'measurement', name: 'Measurement', sub: 'Noise, uncertainty & estimation', icon: '⊙', group: 'electrical'},
    {id: 'statics', name: 'Statics & structures', sub: 'Equilibrium, beams & stress', icon: '△', group: 'mechanical'},
    {id: 'dynamics', name: 'Dynamics & vibrations', sub: 'Motion, oscillation & modes', icon: '≋', group: 'mechanical'},
    {id: 'thermo', name: 'Thermo & fluids', sub: 'Cycles, flow & heat transfer', icon: '♨', group: 'mechanical'}
];
const LEVELS = [
    {id: 'foundations', name: 'Foundations', tag: 'Level 1', description: 'One key insight, an exact answer.', time: '10–20 min'},
    {id: 'applied', name: 'Applied', tag: 'Level 2', description: 'A classic result you derive yourself.', time: '15–25 min'},
    {id: 'advanced', name: 'Intermediate', tag: 'Level 3', description: 'Optimisation, transforms and elegant tricks.', time: '20–40 min'},
    {id: 'university', name: 'Advanced', tag: 'Level 4', description: 'Derive models. Solve coupled equations.', time: '30–50 min'},
    {id: 'challenge', name: 'Challenge', tag: 'Level 5', description: 'Nonlinear systems and design constraints.', time: '45–75 min'},
    {id: 'expert', name: 'Expert', tag: 'Level 6', description: 'Graduate qualifying-exam depth.', time: '60–90 min'},
    {id: 'mastery', name: 'Mastery', tag: 'Level 7', description: 'Research grade, with numerical methods.', time: '90–150 min'}
];
const CURATED_LEVELS = ['foundations', 'applied', 'advanced'];
const fmt = n => Number(n.toPrecision(5)).toString();
/* tolerance is relative; abs is an optional absolute floor for answers that can be close to zero. */
const part = (label, answer, unit, tolerance=.01, abs=0) => ({label, answer, unit, tolerance, abs});

function makeExercise(topic, date, level='foundations') {
    if (!TOPICS.some(t => t.id === topic) || !LEVELS.some(l => l.id === level))
        throw Error('Unknown challenge selection');
    if (CURATED_LEVELS.includes(level))
        return makeBankExercise(topic, date, level);
    if (TOPICS.find(t => t.id === topic).group === 'mechanical')
        return makeMechExercise(topic, date, level);
    if (level === 'expert' || level === 'mastery')
        return makeExpertExercise(topic, date, level);
    return makeHardExercise(topic, date, level);
}
