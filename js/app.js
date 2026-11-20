const $ = s => document.querySelector(s);
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shifted = (date, days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return localDate(d);
};
const GROUPS = [{id: 'electrical', name: 'Electrical'}, {id: 'mechanical', name: 'Mechanical & civil'}];
const MAX_ATTEMPTS = 5;
let today = localDate(), date = today, topic = 'circuits', level = 'foundations', group = 'electrical', view = 'today', hintCount = 0, solutionShown = false, exercise;
let progress = {}, attempts = {}, storageAvailable = true;
try {
    const saved = JSON.parse(localStorage.getItem('daily-engineer-v1') || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const [k, v] of Object.entries(saved)) {
            if (!v || !['solved', 'reviewed'].includes(v.status))
                continue;
            // Preserve the original records; old keys belong to Foundations.
            progress[k.split(':').length === 2 ? k + ':foundations' : k] = v;
        }
    }
    const a = JSON.parse(localStorage.getItem('daily-engineer-attempts') || '{}');
    if (a && typeof a === 'object' && !Array.isArray(a)) attempts = a;
    const preference = localStorage.getItem('daily-engineer-level');
    if (LEVELS.some(l => l.id === preference))
        level = preference;
    const g = localStorage.getItem('daily-engineer-group');
    if (GROUPS.some(x => x.id === g)) {
        group = g;
        topic = TOPICS.find(t => t.group === g).id;
    }
} catch {
    storageAvailable = false;
}
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const key = (t=topic, l=level) => `${date}:${t}:${l}`;
const activeRecords = () => Object.entries(progress).filter(([k]) => TOPICS.some(t => t.id === k.split(':')[1]) && LEVELS.some(l => l.id === k.split(':')[2]));
/* Typeset $…$ and $$…$$ with KaTeX (no-op if KaTeX failed to load). */
function renderMath(el) {
    if (el && window.renderMathInElement)
        renderMathInElement(el, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg']});
}
function save() {
    try {
        localStorage.setItem('daily-engineer-v1', JSON.stringify(progress));
        localStorage.setItem('daily-engineer-attempts', JSON.stringify(attempts));
    } catch {
        storageAvailable = false;
    }
    updateStorageNote();
}
function updateStorageNote() {
    $('.local-note').textContent = storageAvailable ? 'Your progress stays in this browser.' : 'Browser storage unavailable; progress lasts for this visit.';
}
function streak() {
    const days = new Set(activeRecords().filter(([k, v]) => v.status === 'solved' && v.daily).map(([k]) => k.split(':')[0]));
    let n = 0, d = days.has(today) ? today : shifted(today, -1);
    while (days.has(d)) {
        n++;
        d = shifted(d, -1);
    }
    return n;
}
function renderLevels() {
    $('#level-picker').innerHTML = `<div class="levels-heading"><span class="eyebrow">CHOOSE YOUR CHALLENGE</span><span>Levels 1–3: hand-picked problems with exact answers. Levels 4–7: multi-part problems that change daily.</span></div><div class="level-options">${LEVELS.map((l, i) => `<button class="level-option ${level === l.id ? 'selected' : ''} ${i >= 5 ? 'elite' : ''}" data-level="${l.id}" aria-pressed="${level === l.id}"><span class="level-top"><span>${l.tag}</span><span>${l.time}</span></span><strong>${l.name}</strong><span class="level-description">${l.description}</span><span class="level-completion">${progress[key(topic, l.id)]?.status === 'solved' ? '✓ Solved for this date' : progress[key(topic, l.id)]?.status === 'reviewed' ? 'Solution reviewed' : 'Ready to explore'}</span></button>`).join('')}</div>`;
    document.querySelectorAll('[data-level]').forEach(b => b.onclick = () => {
        level = b.dataset.level;
        remember('daily-engineer-level', level);
        renderChallenge();
    });
}
function renderTopics() {
    $('#groups').innerHTML = GROUPS.map(g => `<button role="tab" class="group-tab ${group === g.id ? 'selected' : ''}" data-group="${g.id}" aria-selected="${group === g.id}">${g.name}</button>`).join('');
    $('#topics').innerHTML = TOPICS.filter(t => t.group === group).map(t => `<button class="topic ${topic === t.id ? 'selected' : ''}" data-topic="${t.id}" aria-pressed="${topic === t.id}"><span class="topic-icon" aria-hidden="true">${t.icon}</span><span><strong>${t.name}</strong><small>${t.sub}</small></span><span class="topic-done" aria-label="${progress[key(t.id)]?.status === 'solved' ? 'Solved' : ''}">${progress[key(t.id)]?.status === 'solved' ? '✓' : ''}</span></button>`).join('');
    $('#streak').textContent = streak();
    updateStorageNote();
    document.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => {
        topic = b.dataset.topic;
        renderChallenge();
    });
    document.querySelectorAll('[data-group]').forEach(b => b.onclick = () => {
        if (group === b.dataset.group) return;
        group = b.dataset.group;
        remember('daily-engineer-group', group);
        topic = TOPICS.find(t => t.group === group).id;
        renderChallenge();
    });
}
const used = () => attempts[key()] || 0;
const locked = () => progress[key()]?.status !== 'solved' && used() >= MAX_ATTEMPTS;
function attemptsLabel() {
    const s = progress[key()]?.status;
    return s === 'solved' ? 'Solved' : `Attempts ${used()}/${MAX_ATTEMPTS}`;
}
function renderChallenge() {
    hintCount = 0;
    solutionShown = progress[key()]?.status === 'reviewed';
    exercise = makeExercise(topic, date, level);
    const t = TOPICS.find(t => t.id === topic), e = exercise, record = progress[key()], curated = CURATED_LEVELS.includes(level);
    group = t.group;
    renderTopics();
    renderLevels();
    const exactParts = e.parts.some(p => p.exact);
    $('#challenge').innerHTML = `<div class="challenge-top"><div class="challenge-tags"><span class="tag">${t.name}</span><span class="tag level">${e.level}</span></div><span class="challenge-date">${date === today ? 'TODAY’S CHALLENGE' : 'FROM THE ARCHIVE'}</span></div><div class="challenge-body ${curated ? 'curated' : ''}"><div class="problem-meta"><span id="status-line">${record?.status === 'solved' ? '✓ COMPLETED' : record?.status === 'reviewed' ? 'SOLUTION REVIEWED' : e.parts.length > 1 ? `${e.parts.length} CONNECTED PARTS` : 'ONE KEY INSIGHT'}</span><span>${e.minutes}</span></div><h3>${e.title}</h3><div class="problem-text">${e.text}</div>${e.diagram ? `<div class="diagram-toolbar"><span>DIAGRAM</span><button type="button" id="enlarge-diagram" class="text-button" aria-haspopup="dialog">Enlarge</button></div><div class="diagram">${e.diagram}</div>` : ''}${e.givens?.length ? `<div class="givens">${e.givens.map(g => `<span class="given">${g}</span>`).join('')}</div>` : ''}<details class="prerequisites"><summary>What you’ll need</summary><p>${e.prerequisites}</p></details><form id="answer-form" novalidate><div class="answers">${e.parts.map((p, i) => `<div class="answer-part"><label class="answer-label" for="answer-${i}">${e.parts.length > 1 ? String.fromCharCode(65 + i) + '. ' : ''}${p.label}</label><div class="input-wrap"><input id="answer-${i}" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" placeholder="${p.exact ? 'e.g. pi/4 or ln(2)' : 'Enter a value'}" aria-describedby="answer-help part-feedback-${i}" required>${p.unit ? `<span>${p.unit}</span>` : ''}</div><div class="preview" id="preview-${i}" aria-hidden="true"></div><div id="part-feedback-${i}" class="part-feedback" role="status"></div></div>`).join('')}</div><p class="input-help" id="answer-help">${exactParts ? 'Exact forms welcome: <code>pi/4</code>, <code>ln(2)</code>, <code>sqrt(3)/2</code>, <code>(1+sqrt5)/2</code>, <code>e^-1</code>. Decimals need 4 significant figures.' : 'Numbers, fractions and expressions such as <code>2e-3</code> or <code>sqrt(2)*10</code> are accepted. Tolerance: 1% unless stated; counts must be exact.'}</p><div class="submit-row"><button class="primary" type="submit" id="check">${e.parts.length > 1 ? 'Check all answers' : 'Check answer'}</button><span id="attempts">${attemptsLabel()}</span></div><div class="feedback ${record?.status === 'solved' ? 'success' : ''}" id="feedback" role="status">${record?.status === 'solved' ? 'You’ve solved this challenge. You can revisit your reasoning below.' : ''}</div></form></div><div class="challenge-actions"><button id="hint" class="text-button">☼ &nbsp; Get a hint <span id="hint-count">(0/${e.hints.length})</span></button><button id="solution" class="text-button" aria-expanded="${solutionShown}">${solutionShown ? 'Hide solution' : 'Reveal solution'}</button></div><div id="hints" class="hint-content" hidden></div><div id="solution-content" class="solution" ${solutionShown ? '' : 'hidden'}>${solutionHTML()}</div>${sourceHTML(e.source)}`;
    renderMath($('#challenge'));
    if (e.diagram)
        $('#enlarge-diagram').onclick = () => {
            $('#diagram-title').textContent = e.title;
            $('#large-diagram').innerHTML = e.diagram;
            $('#diagram-dialog').showModal();
        };
    e.parts.forEach((p, i) => $(`#answer-${i}`).addEventListener('input', () => preview(i)));
    $('#answer-form').onsubmit = checkAnswer;
    $('#hint').onclick = showHint;
    $('#solution').onclick = showSolution;
    applyLock();
}
function applyLock() {
    const on = locked();
    exercise.parts.forEach((p, i) => { $(`#answer-${i}`).disabled = on; });
    $('#check').disabled = on;
    if (on && !$('#feedback').textContent) {
        $('#feedback').className = 'feedback error';
        $('#feedback').textContent = 'Out of attempts for this problem. Reveal the solution to see the reasoning, or come back tomorrow.';
    }
}
function preview(i) {
    const out = $(`#preview-${i}`), src = $(`#answer-${i}`).value.trim();
    if (!src) { out.innerHTML = ''; return; }
    try {
        const r = MathInput.read(src);
        if (!Number.isFinite(r.value)) throw Error();
        const tex = '\\displaystyle ' + (/^-?[\d.]+$/.test(src) ? r.latex : `${r.latex} \\approx ${tf(r.value, 6)}`);
        if (window.katex) katex.render(tex, out, {throwOnError: false}); else out.textContent = tex;
        out.classList.remove('invalid');
    } catch {
        out.textContent = '…';
        out.classList.add('invalid');
    }
}
function sourceHTML(s) {
    if (s?.reading)
        return `<div class="source-credit"><span>ORIGINAL DAILY ENGINEER EXERCISE</span><p>Further reading (open textbook): <a href="${s.reading.url}" target="_blank" rel="noopener">${s.reading.title}</a>.</p></div>`;
    return s ? `<div class="source-credit"><span>ADAPTED OPEN EDUCATIONAL MATERIAL</span><p>Based on <a href="${s.url}" target="_blank" rel="noopener">${s.title}</a> by ${s.author || 'Tony R. Kuphaldt, All About Circuits'} · <a href="${s.licenseUrl || 'https://creativecommons.org/licenses/by/1.0/'}" target="_blank" rel="noopener">${s.license || 'CC BY 1.0'}</a>. ${s.changes || 'Wording and values changed; diagrams redrawn; guided steps added.'} Adapted exercise content uses the same license.</p></div>` : '<div class="source-credit"><span>ORIGINAL DAILY ENGINEER EXERCISE</span></div>';
}
function renderSourceCollection() {
    const entries = [['thevenin', 'circuits', 'university', 'Dependent-source Thévenin', 'mit-dependent-source.png'], ['nodal', 'circuits', 'challenge', 'Complex nodal analysis', 'fiore-nodal.png'], ['threeSource', 'circuits', 'expert', 'Three sources, conjugate match', 'fiore-three-source.png'], ['jfet', 'electronics', 'university', 'Nonlinear JFET bias', 'fiore-jfet.png'], ['nonlinear', 'electronics', 'challenge', 'Piecewise amplifier cascade', 'mit-nonlinear-amplifier.png'], ['convolution', 'signals', 'university', 'Repeated-pole convolution', null], ['crossover', 'signals', 'challenge', 'Third-order crossover', 'fiore-woofer.png'], ['rcLadder', 'signals', 'expert', 'Wien-bridge transmission zero', 'fiore-rc-ladder.png']];
    $('#source-cards').innerHTML = entries.map(([id, t, l, title, img]) => `<article class="source-card">${img ? `<img src="assets/open-materials/${img}" alt="Source diagram for ${title}" loading="lazy">` : '<div class="source-math">$x[n] * h_1[n] * h_2[n]$</div>'}<div><span class="eyebrow">${LEVELS.find(x => x.id === l).name}</span><h3>${title}</h3><p>${OPEN_SOURCES[id].title}</p><button class="text-button" data-practice-topic="${t}" data-practice-level="${l}">Practice this problem</button> · <a href="${OPEN_SOURCES[id].url}" target="_blank" rel="noopener">Original source</a></div></article>`).join('');
    renderMath($('#source-cards'));
    document.querySelectorAll('[data-practice-topic]').forEach(b => b.onclick = () => {
        topic = b.dataset.practiceTopic;
        level = b.dataset.practiceLevel;
        remember('daily-engineer-level', level);
        setView('today');
        $('#challenge').scrollIntoView({behavior: 'smooth', block: 'start'});
    });
}
function answerLine(p) {
    const val = p.exact ? p.exact : tf(p.answer);
    return `<li>${p.label}: $${val}$${p.unit ? ' ' + p.unit : ''}${p.exact && !/^-?\d+$/.test(p.exact) ? ` <span class="approx">(≈ ${tf(p.answer)})</span>` : ''}</li>`;
}
function solutionHTML() {
    return `<strong>The reasoning</strong><ol>${exercise.steps.map(s => `<li>${s}</li>`).join('')}</ol><strong>Answer</strong><ul class="answer-list">${exercise.parts.map(answerLine).join('')}</ul><strong>Take this with you</strong><p>${exercise.idea}</p>`;
}
function parseAnswer(text) {
    try {
        return MathInput.read(text).value;
    } catch {
        return NaN;
    }
}
function answerMatches(value, p) {
    return Number.isFinite(value) && Math.abs(value - p.answer) <= Math.max(Math.abs(p.answer) * p.tolerance, p.abs || 0, 1e-9);
}
function checkAnswer(event) {
    event.preventDefault();
    if (locked()) return applyLock();
    let correct = 0, unreadable = false;
    exercise.parts.forEach((p, i) => {
        const field = $(`#answer-${i}`), out = $(`#part-feedback-${i}`), value = parseAnswer(field.value), ok = answerMatches(value, p);
        if (ok)
            correct++;
        if (!Number.isFinite(value)) unreadable = true;
        field.setAttribute('aria-invalid', String(!ok));
        out.className = 'part-feedback ' + (ok ? 'correct' : 'incorrect');
        out.textContent = ok ? '✓ Correct' : !Number.isFinite(value) ? 'Could not read this. Try forms like −2.5, 1/3, 2e-3, pi/4 or sqrt(2).' : 'Not quite. Check the sign, units and relationships in this part.';
    });
    const f = $('#feedback'), previous = progress[key()] || {};
    if (correct === exercise.parts.length) {
        const status = previous.status === 'solved' ? 'solved' : solutionShown || previous.status === 'reviewed' ? 'reviewed' : 'solved';
        progress[key()] = {status, daily: previous.daily || date === today, hints: Math.max(hintCount, previous.hints || 0), attempts: used() + 1};
        if (previous.status !== 'solved') attempts[key()] = used() + 1;
        save();
        renderTopics();
        renderLevels();
        f.className = 'feedback success';
        f.textContent = status === 'solved' ? `All correct. Solved at ${exercise.level} level in ${used()} attempt${used() === 1 ? '' : 's'}.` : 'All correct. Saved as reviewed because the solution was revealed.';
        $('#status-line').textContent = status === 'solved' ? '✓ COMPLETED' : 'SOLUTION REVIEWED';
    } else {
        if (previous.status !== 'solved' && !unreadable) {
            attempts[key()] = used() + 1;
            save();
        }
        f.className = 'feedback error';
        const left = MAX_ATTEMPTS - used();
        f.textContent = previous.status === 'solved' ? `${correct} of ${exercise.parts.length} correct.` : unreadable ? 'Some answers could not be read, so no attempt was used.' : `${correct} of ${exercise.parts.length} correct. ${left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left.` : ''}`;
        applyLock();
    }
    $('#attempts').textContent = attemptsLabel();
}
function showHint() {
    if (hintCount >= exercise.hints.length)
        return;
    hintCount++;
    $('#hints').hidden = false;
    $('#hints').innerHTML = exercise.hints.slice(0, hintCount).map((h, i) => `<p><strong>Hint ${i + 1}.</strong> ${h}</p>`).join('');
    renderMath($('#hints'));
    $('#hint-count').textContent = `(${hintCount}/${exercise.hints.length})`;
    $('#hint').disabled = hintCount === exercise.hints.length;
}
function showSolution() {
    const panel = $('#solution-content');
    panel.hidden = !panel.hidden;
    $('#solution').textContent = panel.hidden ? 'Reveal solution' : 'Hide solution';
    $('#solution').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
        solutionShown = true;
        if (progress[key()]?.status !== 'solved') {
            progress[key()] = {status: 'reviewed', daily: date === today, hints: hintCount};
            save();
            renderLevels();
            $('#status-line').textContent = 'SOLUTION REVIEWED';
        }
    }
}
function renderProgress() {
    const entries = activeRecords(), solved = entries.filter(([k, v]) => v.status === 'solved').length, reviewed = entries.filter(([k, v]) => v.status === 'reviewed').length;
    $('#progress-view').innerHTML = `<div class="stats"><div class="stat"><b>${solved}</b><span>Challenges solved</span></div><div class="stat"><b>${streak()}</b><span>Day streak</span></div><div class="stat"><b>${reviewed}</b><span>Solutions reviewed</span></div></div><div class="progress-topics"><h2>Your learning, by level.</h2><div class="progress-table-wrap"><table class="progress-table"><thead><tr><th>Discipline</th>${LEVELS.map(l => `<th>${l.name}</th>`).join('')}</tr></thead><tbody>${GROUPS.map(g => `<tr class="group-row"><th colspan="${LEVELS.length + 1}">${g.name}</th></tr>` + TOPICS.filter(t => t.group === g.id).map(t => `<tr><th>${t.name}</th>${LEVELS.map(l => `<td>${entries.filter(([k, v]) => k.split(':')[1] === t.id && k.split(':')[2] === l.id && v.status === 'solved').length} solved</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div></div><p class="progress-note">Solve at least one of today’s challenges at any level to build your streak. Archive practice adds to your totals. Progress is stored in this browser; clearing browser data removes it.</p>`;
}
function setView(v) {
    view = v;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('#archive-bar').hidden = v !== 'archive';
    $('#practice').hidden = v === 'progress';
    $('#level-picker').hidden = v === 'progress';
    $('#progress-view').hidden = v !== 'progress';
    $('#view-label').textContent = v === 'progress' ? 'YOUR LEARNING LOG' : v === 'archive' ? 'KEEP EXPLORING' : 'YOUR DAILY PRACTICE';
    $('#view-title').textContent = v === 'progress' ? 'Small steps add up.' : v === 'archive' ? 'A good idea is worth revisiting.' : 'Find your frequency.';
    $('#open-collection').hidden = v === 'progress';
    if (v === 'today')
        date = today;
    if (v === 'archive') {
        date = shifted(today, -1);
        $('#archive-date').value = date;
    }
    if (v === 'progress')
        renderProgress();
    else
        renderChallenge();
    renderDate();
}
function renderDate() {
    $('#date-label').textContent = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'});
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
$('#back-today').onclick = () => setView('today');
$('#archive-date').min = shifted(today, -30);
$('#archive-date').max = shifted(today, -1);
$('#archive-date').onchange = e => {
    if (e.target.value >= shifted(today, -30) && e.target.value < today) {
        date = e.target.value;
        renderChallenge();
        renderDate();
    } else
        e.target.value = date;
};
for (const id of ['#about', '#about-footer'])
    $(id).onclick = () => $('#about-dialog').showModal();
$('#close-dialog').onclick = () => $('#about-dialog').close();
$('#start-practice').onclick = () => $('#about-dialog').close();
$('#about-dialog').onclick = e => {
    if (e.target === $('#about-dialog')) {
        const r = e.target.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
            e.target.close();
    }
};
document.querySelectorAll('.brand').forEach(a => a.onclick = e => {
    e.preventDefault();
    setView('today');
    window.scrollTo({top: 0, behavior: 'smooth'});
});
function tick() {
    const now = new Date(), next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const s = Math.floor((next - now) / 1000);
    $('#countdown').textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
    const current = localDate();
    if (current !== today) {
        today = current;
        $('#archive-date').min = shifted(today, -30);
        $('#archive-date').max = shifted(today, -1);
        if (view === 'today')
            setView('today');
        else if (view === 'progress')
            renderProgress();
    }
}
$('#close-diagram').onclick = () => $('#diagram-dialog').close();
renderSourceCollection();
renderMath($('#about-dialog'));
setView('today');
tick();
setInterval(tick, 1000);
