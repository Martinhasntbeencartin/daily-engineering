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
/* Difficulty tiers, easiest first. The generators and the curated bank are keyed on these ids, and the
   ids seed each day's choice, so they never change even when the public levels below regroup them. */
const TIERS = ['advanced', 'university', 'challenge', 'expert', 'mastery'];
const CURATED_TIER = 'advanced';
/* The four levels people choose from. A level with several tiers rotates through them day by day. */
const LEVELS = [
    {id: 'level-1', tag: 'Level 1', name: 'Insight', tiers: ['advanced'], description: 'Elegant tricks, transforms and optimisation. Exact answers.', time: '20–40 min'},
    {id: 'level-2', tag: 'Level 2', name: 'Advanced', tiers: ['university'], description: 'Derive models. Solve coupled equations.', time: '30–50 min'},
    {id: 'level-3', tag: 'Level 3', name: 'Challenge', tiers: ['challenge'], description: 'Nonlinear systems and design constraints.', time: '45–75 min'},
    {id: 'level-4', tag: 'Level 4', name: 'Expert', tiers: ['expert', 'mastery'], description: 'Qualifying-exam to research grade, with numerical methods.', time: '60–150 min', elite: true}
];
/* The public level that serves a tier (used to link older saved progress and source cards). */
const levelOfTier = tier => LEVELS.find(l => l.tiers.includes(tier));
const fmt = n => Number(n.toPrecision(5)).toString();
/* tolerance is relative; abs is an optional absolute floor for answers that can be close to zero. */
const part = (label, answer, unit, tolerance=.01, abs=0) => ({label, answer, unit, tolerance, abs});

/* Builds the problem for one tier. Exposed separately so tests can reach every tier on every date. */
function makeTierExercise(topic, date, tier) {
    if (!TOPICS.some(t => t.id === topic) || !TIERS.includes(tier))
        throw Error('Unknown challenge selection');
    if (tier === CURATED_TIER)
        return makeBankExercise(topic, date, tier);
    if (TOPICS.find(t => t.id === topic).group === 'mechanical')
        return makeMechExercise(topic, date, tier);
    if (tier === 'expert' || tier === 'mastery')
        return makeExpertExercise(topic, date, tier);
    return makeHardExercise(topic, date, tier);
}
/* Today's problem for a (topic, level). Topics are offset so a rotating level mixes its tiers on any one day. */
function makeExercise(topic, date, level='level-1') {
    const L = LEVELS.find(l => l.id === level);
    if (!L || !TOPICS.some(t => t.id === topic))
        throw Error('Unknown challenge selection');
    const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000), tier = L.tiers[((day + hashString(topic)) % L.tiers.length + L.tiers.length) % L.tiers.length];
    return {...makeTierExercise(topic, date, tier), level: `${L.tag} · ${L.name}`, minutes: L.time, curated: tier === CURATED_TIER};
}
