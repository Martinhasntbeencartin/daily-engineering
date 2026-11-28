/* Browser test for the answer editor: types real keystrokes into the MathLive field and checks
   the resulting maths. Needs Playwright with Chromium: `node tests/editor.test.js`. */
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const root = path.join(__dirname, '..');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml'};
const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
});
const cases = [
    ['3/4', .75], ['pi/4', Math.PI / 4], ['1/sqrt2', Math.SQRT1_2], ['e^-pi', Math.exp(-Math.PI)],
    ['(1+sqrt5)/2', (1 + Math.sqrt(5)) / 2], ['(sqrt5-1)/2', (Math.sqrt(5) - 1) / 2], ['(3/4)', .75], ['sqrt(2)', Math.SQRT2],
    ['sqrt(5)-1', Math.sqrt(5) - 1], ['3/4+1', 1.75], ['2^10-1', 1023], ['10^-3', 1e-3], ['e^(-1)+1', Math.exp(-1) + 1],
    ['2^(2/5)', 2 ** .4], ['1/(2pi)+1', 1 / (2 * Math.PI) + 1], ['8sqrt2/pi^2', 8 * Math.SQRT2 / Math.PI ** 2],
    ['(ln2)/2', Math.LN2 / 2], ['ln2/2', Math.LN2 / 2], ['ln(2)/2', Math.LN2 / 2], ['25ln10/2', 25 * Math.log(10) / 2],
    ['sin(pi/6)/2', .25], ['log100/2', 1], ['atan(1)/pi', .25], ['ln2/2+1', Math.LN2 / 2 + 1], ['ln(2/3)', Math.log(2 / 3)],
    ['1/ln2', 1 / Math.LN2], ['sqrt2/2', Math.SQRT1_2], ['25ln10', 25 * Math.log(10)],
    ['sqrt(2)/2', Math.SQRT1_2], ['sqrt(1+1)/2', Math.SQRT1_2], ['sqrt(3)/2+1', Math.sqrt(3) / 2 + 1], ['3sqrt2/2', 3 * Math.SQRT1_2],
    ['2sqrt(3)/3', 2 * Math.sqrt(3) / 3], ['sqrt(pi)/2', Math.sqrt(Math.PI) / 2], ['sqrt(2)^2', 2], ['sqrt(2/3)', Math.sqrt(2 / 3)],
    ['sqrt(sqrt(16))/2', 1], ['√2/2', Math.SQRT1_2], ['3√2/2', 3 * Math.SQRT1_2], ['5-2sqrt6', 5 - 2 * Math.sqrt(6)], ['-1/6', -1 / 6],
    ['pi^2/6', Math.PI ** 2 / 6], ['(5/6)^(7/2)', (5 / 6) ** 3.5], ['sqrt(1-1/4)', Math.sqrt(.75)], ['ln(49/48)', Math.log(49 / 48)],
    ['((1+sqrt5)/2)^2', ((1 + Math.sqrt(5)) / 2) ** 2], ['sqrt(1+sqrt(4))', Math.sqrt(3)], ['2e-3', .002],
    // every common notation: roots, powers, mixed numbers, scientific notation, degrees, %, !, |x|, logs, inverse trig, constants
    ['cbrt8', 2], ['cbrt(27)', 3], ['root3{Tab}8', 2], ['nthroot5{Tab}32', 2], ['∛8', 2], ['∜16', 2], ['2**3', 8], ['2**10-1', 1023], ['2²', 4], ['2³+1', 9],
    ['½', .5], ['1½', 1.5], ['1 1/2', 1.5], ['2 3/4', 2.75], ['2x3', 6], ['1.5x10^3', 1500], ['1.5*10^3', 1500], ['1.5×10^-3', .0015], ['1E-3', .001], ['1.5e3', 1500],
    ['10⁻³', .001], ['2⁻¹', .5], ['2÷4', .5], ['0,5', .5], ['sin(30°)', .5], ['sin(30deg)', .5], ['cos(60degrees)', .5], ['50%', .5], ['5!', 120], ['3!+1', 7],
    ['|-3|', 3], ['abs-3', 3], ['[1+2]', 3], ['log_2(8)', 3], ['log2(8)', 3], ['lg100', 2], ['sin^-1(1)', Math.PI / 2], ['tan^-1(1)', Math.PI / 4], ['arcsin(1)', Math.PI / 2],
    ['asinh(0)', 0], ['acosh(1)', 0], ['arccot(1)', Math.PI / 4], ['sec(0)', 1], ['csc(pi/2)', 1], ['cosec(pi/2)', 1], ['cot(pi/4)', 1], ['sinh(0)', 0],
    ['phi', (1 + Math.sqrt(5)) / 2], ['φ^2-φ', 1], ['tau/2', Math.PI], ['τ/2', Math.PI], ['π/4', Math.PI / 4], ['e^(1)', Math.E], ['exp(1)', Math.E], ['ln(e)', 1], ['sin²(30°)', .25]
];
/* Type a string; {Tab} moves to the next box, and | is sent as text (as phones and most layouts do). */
async function typeKeys(page, keys) {
    for (const piece of keys.split(/(\{Tab\}|\|)/)) {
        if (piece === '{Tab}') await page.keyboard.press('Tab');
        else if (piece === '|') await page.keyboard.insertText('|');
        else if (piece) await page.keyboard.type(piece, {delay: 20});
        await page.waitForTimeout(15);
    }
}
/* Check real browser text metrics. Exercise generators vary both the geometry
   and the printed values, including between tiers within the same level. */
function checkFigureLayouts() {
    const host = document.createElement('div'), seen = new Set(), issues = new Set();
    host.className = 'diagram';
    document.body.append(host);
    try {
        for (let day = 0; day < 32; day++) {
            const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
            for (const topic of TOPICS) for (const tier of TIERS) {
                const {diagram, title} = makeTierExercise(topic.id, date, tier);
                if (seen.has(diagram)) continue;
                seen.add(diagram);
                host.innerHTML = diagram;
                const svg = host.querySelector('svg'), view = svg.viewBox.baseVal, bounds = svg.getBBox();
                if (bounds.x < view.x - 1 || bounds.y < view.y - 1 ||
                    bounds.x + bounds.width > view.x + view.width + 1 || bounds.y + bounds.height > view.y + view.height + 1)
                    issues.add(`${topic.id}: ${title} extends past the viewBox`);
                const labels = [...svg.querySelectorAll('text')].filter(el => el.textContent)
                    .map(el => ({name: el.textContent, box: el.getBoundingClientRect()}));
                const scale = svg.getScreenCTM().a;
                for (const [i, a] of labels.entries()) for (const b of labels.slice(i + 1)) {
                    const w = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
                    const h = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
                    if (w > 2 * scale && h > 3 * scale) issues.add(`${title}: labels “${a.name}” and “${b.name}” overlap`);
                }
            }
        }
    } finally { host.remove(); }
    return {count: seen.size, issues: [...issues]};
}

server.listen(0, async () => {
    // The main run freezes the clock; anime.js times itself with Date.now, so this page asks for reduced motion
    // (nothing animates and the logic is checked). The motion itself is checked further down on pages with a running clock.
    const url = `http://localhost:${server.address().port}/`, browser = await chromium.launch(), page = await browser.newPage({reducedMotion: 'reduce'}), errors = [];
    await page.addInitScript(() => { try { localStorage.setItem('daily-engineer-board-tour', '1'); } catch {} }); // the whiteboard tour counts as seen, except where it is tested
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    let failures = 0;
    try {
        // A fixed date keeps the run reproducible.
        await page.clock.setFixedTime(new Date(2026, 1, 1, 12));
        const step = (name, ok, detail='') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`); };
        const go = async hash => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(150); };
        const shown = id => page.evaluate(i => !document.getElementById(i).hidden, id);
        // Navigation: the main menu, a category, one click to a problem, the level tabs, shortcuts, and back again.
        await page.goto(url);
        await page.waitForTimeout(600);
        const figures = await page.evaluate(checkFigureLayouts);
        step(`${figures.count} exercise diagrams fit their viewBox and have distinct labels`, !figures.issues.length, figures.issues.join(' / '));
        const menu = await page.evaluate(() => [...document.querySelectorAll('#home [data-menu]')].map(a => a.dataset.menu));
        step('the main menu offers all four categories, the archive, progress and help', menu.join() === 'circuits-electronics,signals-control,power-em,comms,archive,progress,help', menu.join());
        step('the Menu tab is marked as the current page', await page.getAttribute('.tabs a[data-tab="menu"]', 'aria-current') === 'page');
        step('the menu shows today at a glance', /0\s*\/14/.test(await page.textContent('#home .menu-stats')) && /coins/.test(await page.textContent('#home .menu-stats')));
        step('a first visit explains how it works', await page.locator('#home .intro').count() === 1);
        await page.click('#dismiss-intro'); await page.reload(); await page.waitForTimeout(400);
        step('“Got it” hides the explanation for good', await page.locator('#home .intro').count() === 0);
        await page.click('#menu-help'); await page.waitForTimeout(100);
        step('“How it works” opens the help', await page.evaluate(() => document.getElementById('about-dialog').open));
        await page.click('#close-dialog');
        await page.click('#home [data-menu="power-em"]'); await page.waitForTimeout(200);
        const pem = await page.evaluate(() => ({hash: location.hash, cards: [...document.querySelectorAll('#category .card')].map(c => c.dataset.topic)}));
        step('choosing Power & electromagnetics shows its 3 disciplines', pem.hash === '#/power-em' && pem.cards.join() === 'power,motors,fields', JSON.stringify(pem));
        await page.click('#category .switch-opt:has-text("Circuits")'); await page.waitForTimeout(200);
        step('the switch moves to Circuits & electronics and its 4 disciplines', await page.evaluate(() => location.hash === '#/circuits-electronics' && [...document.querySelectorAll('#category .card')].map(c => c.dataset.topic).join() === 'circuits,electronics,digital,measurement'));
        const card = await page.evaluate(() => { const c = document.querySelector('#category .card[data-topic="digital"]'); return {status: c.querySelector('.card-status').textContent, cta: c.querySelector('.card-cta').textContent, levels: c.querySelectorAll('.lvl').length}; });
        step('each card says its status, offers four levels and what clicking does', card.status === 'Not done yet today' && /Start level 1/.test(card.cta) && card.levels === 4, JSON.stringify(card));
        await page.click('#category .card[data-topic="electronics"] .lvl:nth-of-type(3)'); await page.waitForTimeout(150);
        step('a level button on a card opens that level straight away (no animation)', await page.evaluate(() => location.hash === '#/electronics/level-3' && !document.querySelector('.swoosh')));
        await page.goBack(); await page.waitForTimeout(300);
        await page.click('#category .card[data-topic="circuits"] .card-cta', {force: true});
        await page.waitForSelector('#problem math-field');
        step('one click opens the problem at Level 1', await page.evaluate(() => location.hash) === '#/circuits/level-1');
        const trackIds = await page.locator('#problem-bar .level-tab').evaluateAll(as => as.map(a => a.dataset.level));
        step('labelled tabs offer levels 1–4', trackIds.join() === 'level-1,level-2,level-3,level-4', trackIds.join());
        step('a breadcrumb shows where you are', /Circuits & electronics\s*\/\s*Circuit analysis/.test(await page.textContent('#problem-bar .crumbs')));
        await page.click('#problem-bar .level-tab[data-level="level-3"]'); await page.waitForTimeout(150);
        step('the tabs switch level in place', await page.evaluate(() => location.hash === '#/circuits/level-3' && level === 'level-3'));
        await page.goBack(); await page.waitForTimeout(150);
        step('browser Back returns to the previous level', await page.evaluate(() => location.hash === '#/circuits/level-1' && level === 'level-1'));
        await page.click('.problem-title'); // focus out of the answer box, so keys are shortcuts
        await page.keyboard.press('2'); await page.waitForTimeout(150);
        step('key 2 switches to Level 2', await page.evaluate(() => location.hash) === '#/circuits/level-2');
        await page.click('.problem-title');
        await page.keyboard.press('h'); await page.waitForTimeout(100);
        step('key H shows a hint', await shown('hints') && /1\//.test(await page.textContent('#hint-count')));
        await page.keyboard.press('Enter'); await page.waitForTimeout(100);
        step('Enter jumps to the first answer box', await page.evaluate(() => document.activeElement?.id) === 'answer-0');
        await page.click('.problem-title');
        await page.keyboard.press('Escape'); await page.waitForTimeout(150);
        step('Escape goes back to the category', await page.evaluate(() => location.hash) === '#/circuits-electronics' && await shown('category'));
        step('the category remembers the level used for a discipline', await page.getAttribute('#category .card[data-topic="circuits"] .card-link', 'href') === '#/circuits/level-2' && /Start level 2/.test(await page.textContent('#category .card[data-topic="circuits"] .card-cta')));
        await page.keyboard.press('Escape'); await page.waitForTimeout(150);
        step('Escape again goes back to the main menu', await shown('home'));
        step('the menu offers to continue the last problem', await page.getAttribute('#home [data-menu="continue"]', 'href') === '#/circuits/level-2');
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
        step('arrow keys move through the menu', await page.evaluate(() => document.activeElement?.dataset.menu) === 'signals-control');
        await go('#/circuits');
        step('a bare discipline address opens its remembered level', await page.evaluate(() => location.hash) === '#/circuits/level-2');
        await page.click('#back-link'); await page.waitForTimeout(150);
        step('the breadcrumb link returns to the category', await page.evaluate(() => location.hash) === '#/circuits-electronics' && await shown('category'));
        await page.click('#cat-back'); await page.waitForTimeout(150);
        step('the category breadcrumb returns to the main menu', await page.evaluate(() => location.hash) === '#/' && await shown('home'));
        await page.click('.tabs a[data-tab="archive"]'); await page.waitForTimeout(200);
        step('the Archive tab opens the archive of the last discipline', await page.evaluate(() => location.hash) === '#/circuits/archive' && await shown('archive') && await page.getAttribute('.tabs a[data-tab="archive"]', 'aria-current') === 'page');
        await page.click('#archive .pick:has-text("Power systems")'); await page.waitForTimeout(150);
        step('the archive switches discipline from its picker', await page.evaluate(() => location.hash) === '#/power/archive');
        await go('#/nowhere/at-all');
        step('an unknown address falls back to the main menu', await shown('home'));
        await go('#/circuits/level-1');
        await page.waitForSelector('#problem math-field');
        for (const [keys, want] of cases) {
            await page.evaluate(() => { const m = document.getElementById('answer-0'); m.value = ''; m.focus(); });
            await page.waitForTimeout(200);
            await typeKeys(page, keys);
            await page.waitForTimeout(80);
            const [latex, got] = await page.evaluate(() => { const m = document.getElementById('answer-0'); try { return [m.value, MathInput.readLatex(m.value).value]; } catch (e) { return [m.value, NaN]; } });
            const ok = Math.abs(got - want) <= 1e-9 * Math.max(1, Math.abs(want));
            if (!ok) failures++;
            console.log(`${ok ? 'ok  ' : 'FAIL'} ${keys.padEnd(18)} → ${latex}`);
        }
        // A real √ key press (as Option+V sends) and a pasted √ both become proper roots.
        const rootChecks = [
            ['√ key then 2/2', async () => { await page.evaluate(() => document.getElementById('answer-0').dispatchEvent(new KeyboardEvent('keydown', {key: '√', bubbles: true, composed: true, cancelable: true}))); await page.waitForTimeout(60); await page.keyboard.type('2/2', {delay: 20}); }, Math.SQRT1_2],
            ['pasted √3', async () => { await page.evaluate(() => { const m = document.getElementById('answer-0'); m.insert('√3', {format: 'text'}); m.dispatchEvent(new Event('input')); }); }, Math.sqrt(3)]
        ];
        for (const [name, act, want] of rootChecks) {
            await page.evaluate(() => { const m = document.getElementById('answer-0'); m.value = ''; m.focus(); });
            await page.waitForTimeout(200);
            await act();
            await page.waitForTimeout(80);
            const [latex, got] = await page.evaluate(() => { const m = document.getElementById('answer-0'); try { return [m.value, MathInput.readLatex(m.value).value]; } catch (e) { return [m.value, NaN]; } });
            const ok = Math.abs(got - want) < 1e-9 && latex.includes('\\sqrt');
            if (!ok) failures++;
            console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(18)} → ${latex}`);
        }
        // A unit typed after the answer is accepted; a different unit gets a clear hint.
        await page.evaluate(() => localStorage.clear());
        // Use a date whose first answer is in Ω (from the archive if today's isn't).
        const ohmDate = await page.evaluate(() => { for (let back = 0; back <= 30; back++) { const d = shifted(today, -back); if (makeExercise('circuits', d, 'level-1').parts[0].unit === 'Ω') return back ? d : ''; } return null; });
        if (ohmDate) await page.evaluate(d => localStorage.setItem('daily-engineer-coins', JSON.stringify({earned: {}, unlocked: {[`circuits:${d}`]: {cost: 0, at: today}}})), ohmDate); // past days are locked
        await go(`#/circuits/level-1${ohmDate ? '/' + ohmDate : ''}`);
        await page.reload();
        await page.waitForSelector('#problem math-field');
        for (const [keys, want] of [['1.618 ohm', 1.618], ['(1+sqrt5)/2 Ω', (1 + Math.sqrt(5)) / 2], ['1.618 kohm', NaN]]) {
            await page.evaluate(() => { const m = document.getElementById('answer-0'); m.value = ''; m.focus(); });
            await page.waitForTimeout(200);
            await typeKeys(page, keys);
            await page.waitForTimeout(80);
            const got = await page.evaluate(() => readField(0).value);
            const ok = Number.isNaN(want) ? Number.isNaN(got) : Math.abs(got - want) < 1e-9;
            if (!ok) failures++;
            console.log(`${ok ? 'ok  ' : 'FAIL'} unit: ${keys.padEnd(14)} → ${got}`);
        }
        await page.click('#check'); await page.waitForTimeout(100);
        const hint = await page.textContent('#part-feedback-0');
        if (!/Give the value in Ω/.test(hint)) { failures++; console.log('FAIL wrong-unit hint:', hint); } else console.log('ok   wrong-unit hint:', hint);
        await page.evaluate(() => localStorage.clear());
        // Enter submits the form.
        await page.evaluate(() => { const m = document.getElementById('answer-0'); m.value = ''; m.focus(); });
        await page.keyboard.type('1', {delay: 20});
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
        if (!/correct|attempt/i.test(await page.textContent('#feedback'))) { failures++; console.log('FAIL Enter did not submit'); }
        // Progress saved by the seven-level version moves to the level that now serves its tier.
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('daily-engineer-v1', JSON.stringify({[`${today}:circuits:mastery`]: {status: 'solved', daily: true}, [`${today}:circuits:foundations`]: {status: 'solved', daily: true}}));
            localStorage.setItem('daily-engineer-attempts', JSON.stringify({[`${today}:circuits:challenge`]: 3}));
        });
        await go('#/circuits/level-3');
        await page.reload();
        await page.waitForSelector('#problem-bar .level-tab');
        const moved = await page.evaluate(() => ({attempts: attempts[`${today}:circuits:level-3`], solved: [...document.querySelectorAll('#problem-bar .level-tab')].map(o => `${o.dataset.level}:${o.classList.contains('solved')}`)}));
        const movedOk = moved.attempts === 3 && moved.solved.join() === 'level-1:false,level-2:false,level-3:false,level-4:true';
        if (!movedOk) failures++;
        console.log(`${movedOk ? 'ok  ' : 'FAIL'} saved progress moved to new levels:`, JSON.stringify(moved));
        await page.evaluate(() => localStorage.clear());
        // The whiteboard: opens on request, draws, undoes, keeps each problem's working, full screen, and W toggles it.
        await page.evaluate(() => localStorage.clear());
        await go('#/circuits/level-1'); await page.reload(); await page.waitForSelector('#board-open');
        step('the whiteboard starts closed', await page.evaluate(() => document.getElementById('board').hidden && !document.getElementById('board-closed').hidden));
        await page.click('#board-open'); await page.waitForTimeout(150);
        const bb = await page.locator('#board-canvas').boundingBox();
        for (const [y0, y1] of [[40, 90], [120, 140]]) { await page.mouse.move(bb.x + 40, bb.y + y0); await page.mouse.down(); await page.mouse.move(bb.x + 160, bb.y + y1, {steps: 8}); await page.mouse.up(); }
        step('drawing on the whiteboard records strokes', await page.evaluate(() => board.strokes.length === 2 && board.strokes[0].p.length >= 4));
        await page.click('#board-undo');
        step('undo removes the last stroke', await page.evaluate(() => board.strokes.length === 1));
        await page.reload(); await page.waitForSelector('#board-canvas');
        step('the working is still there after a reload', await page.evaluate(() => !document.getElementById('board').hidden && board.strokes.length === 1));
        await go('#/circuits/level-2');
        step('each problem has its own board', await page.evaluate(() => board.strokes.length === 0 && board.id.endsWith(':circuits:level-2')));
        await go('#/circuits/level-1');
        await page.click('#board-full'); await page.waitForTimeout(100);
        step('full screen covers the window', await page.evaluate(() => document.getElementById('board').classList.contains('full') && document.body.classList.contains('board-full')));
        await page.keyboard.press('Escape'); await page.waitForTimeout(100);
        step('Esc leaves full screen without leaving the problem', await page.evaluate(() => !document.getElementById('board').classList.contains('full') && location.hash === '#/circuits/level-1'));
        // shapes and text: R draws a box by dragging, T places text with quick symbols, and both are kept
        await page.evaluate(() => document.getElementById('board-canvas').scrollIntoView({block: 'start'}));
        const sb = await page.locator('#board-canvas').boundingBox();
        await page.keyboard.press('r'); await page.mouse.move(sb.x + 200, sb.y + 40); await page.mouse.down(); await page.mouse.move(sb.x + 320, sb.y + 110, {steps: 6}); await page.mouse.up();
        step('the box tool draws a box', await page.evaluate(() => board.strokes.at(-1).k === 'rect' && board.strokes.at(-1).p.length === 4));
        await page.keyboard.press('t'); await page.mouse.click(sb.x + 60, sb.y + 180); await page.waitForTimeout(100);
        await page.keyboard.type('X = \\omega L, R_1'); await page.keyboard.press('Enter');
        step('the text tool writes text with symbols', await page.evaluate(() => board.strokes.at(-1).k === 'text' && board.strokes.at(-1).t === 'X = ωL, R₁' && !document.querySelector('.board-text')));
        // select: V picks it, a click on the box selects it, dragging moves it as one undoable step, Delete removes it
        await page.keyboard.press('v'); await page.mouse.click(sb.x + 320, sb.y + 80);
        step('the select tool picks the box', await page.evaluate(() => board.sel[0]?.k === 'rect' && !document.getElementById('board-sel').hidden));
        await page.mouse.move(sb.x + 320, sb.y + 80); await page.mouse.down(); await page.mouse.move(sb.x + 420, sb.y + 120, {steps: 6}); await page.mouse.up();
        step('dragging moves it', await page.evaluate(k => { const s = board.strokes.at(-1); return s.k === 'rect' && Math.abs(Math.min(s.p[0], s.p[2]) - (200 + 100) / k) < 3; }, (await page.locator('#board-canvas').boundingBox()).width / 1600));
        await page.click('#board-undo');
        step('undo moves it back', await page.evaluate(k => board.strokes.some(s => s.k === 'rect' && Math.abs(Math.min(s.p[0], s.p[2]) - 200 / k) < 3), sb.width / 1600));
        await page.click('#board-redo');
        const grips = await page.evaluate(() => [...document.querySelectorAll('.board-handle')].filter(h => !h.hidden).map(h => { const r = h.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }));
        step('a selected box has four resize handles', grips.length === 4);
        const wide = () => page.evaluate(() => { const s = board.strokes.find(s => s.k === 'rect'); return Math.abs(s.p[2] - s.p[0]); }), w0 = await wide();
        await page.mouse.move(...grips[3]); await page.mouse.down(); await page.mouse.move(grips[3][0] + 60, grips[3][1] + 30, {steps: 6}); await page.mouse.up();
        const kk = (await page.locator('#board-canvas').boundingBox()).width / 1600;
        step('dragging a corner handle resizes the box', Math.abs(await wide() - w0 - 60 / kk) < 3);
        await page.keyboard.press('Control+z');
        step('undo takes the resize back', Math.abs(await wide() - w0) < 1);
        await page.keyboard.press('Delete');
        step('Delete removes the selected item', await page.evaluate(() => !board.strokes.some(s => s.k === 'rect') && !board.sel[0]));
        await page.keyboard.press('Control+z');
        // several at once: Ctrl+A, a selection box around what lies wholly inside it, and one nudge for the group
        await page.keyboard.press('Control+a');
        step('Ctrl+A selects everything on the board', await page.evaluate(() => board.sel.length >= 3 && board.sel.length === board.strokes.filter(s => s.c >= 0).length));
        await page.keyboard.press('ArrowRight');
        step('a nudge moves the whole selection as one step', await page.evaluate(() => board.undo.at(-1).type === 'move' && board.undo.at(-1).list.length === board.sel.length));
        await page.keyboard.press('Control+z'); await page.keyboard.press('Escape');
        await page.evaluate(() => document.getElementById('board-canvas').scrollIntoView({block: 'start'}));
        const mb = await page.locator('#board-canvas').boundingBox();
        await page.mouse.move(mb.x + 40, mb.y + 160); await page.mouse.down(); await page.mouse.move(mb.x + 340, mb.y + 250, {steps: 6}); await page.mouse.up();
        step('a selection box selects what lies wholly inside it', await page.evaluate(() => board.sel.length === 1 && board.sel[0].k === 'text'));
        await page.keyboard.down('Shift'); await page.mouse.click(mb.x + 320, mb.y + 80); await page.keyboard.up('Shift');
        step('Shift-click adds to the selection', await page.evaluate(() => board.sel.length === 2 && board.sel.some(s => s.k === 'rect')));
        // copy, paste and duplicate: Ctrl+C keeps the board as it is; Ctrl+V and Ctrl+D add selected copies, each one undo step
        const count = () => page.evaluate(() => board.strokes.length), c0 = await count();
        await page.keyboard.press('Control+c');
        step('Ctrl+C copies the selection without changing the board', await count() === c0 && await page.evaluate(() => JSON.parse(localStorage.getItem('daily-engineer-board-clip')).items.length === 2 && !document.getElementById('board-paste').disabled));
        await page.mouse.move(2, 2); await page.keyboard.press('Control+v');
        step('Ctrl+V pastes selected copies beside the originals', await count() === c0 + 2 && await page.evaluate(() => board.sel.length === 2 && board.sel.every(s => board.strokes.slice(-2).includes(s)) && board.undo.at(-1).type === 'paste'));
        await page.keyboard.press('Control+d');
        step('Ctrl+D duplicates the selection', await count() === c0 + 4);
        await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z');
        step('undo takes pastes and duplicates away', await count() === c0);
        // double-click text with Select to edit it in place; Enter keeps the edit as one undo step
        await page.mouse.dblclick(mb.x + 80, mb.y + 190); // (nothing is selected here, so Esc would mean 'go back')
        step('double-clicking text opens it for editing', await page.evaluate(() => document.activeElement?.classList.contains('board-text') && document.activeElement.value === 'X = ωL, R₁'));
        await page.keyboard.type(' = 5'); await page.keyboard.press('Enter');
        step('Enter keeps the edit in place', await count() === c0 && await page.evaluate(() => board.strokes.some(s => s.t === 'X = ωL, R₁ = 5') && board.undo.at(-1).type === 'replace'));
        await page.keyboard.press('Control+z');
        step('undo restores the text', await page.evaluate(() => board.strokes.some(s => s.t === 'X = ωL, R₁')));
        // the eraser removes whole items it crosses, as one undo step, and leaves no marks of its own
        await page.keyboard.press('e'); await page.mouse.move(mb.x + 360, mb.y + 60); await page.mouse.down(); await page.mouse.move(mb.x + 360, mb.y + 170, {steps: 8}); await page.mouse.up();
        step('the eraser removes the whole box it crosses', await count() === c0 - 1 && await page.evaluate(() => !board.strokes.some(s => s.k === 'rect') && !board.strokes.some(s => s.c < 0) && board.undo.at(-1).type === 'delete'));
        await page.keyboard.press('Control+z');
        step('undo brings the erased box back', await count() === c0 && await page.evaluate(() => board.strokes.some(s => s.k === 'rect')));
        // [ sends the selection to the back and ] brings it to the front, each one undo step
        await page.keyboard.press('v'); await page.mouse.click(mb.x + 360, mb.y + 80);
        await page.keyboard.press('[');
        step('[ sends the selected box to the back', await page.evaluate(() => board.strokes[0].k === 'rect' && board.undo.at(-1).type === 'order'));
        await page.keyboard.press(']');
        step('] brings it to the front', await page.evaluate(() => board.strokes.at(-1).k === 'rect' && board.sel[0] === board.strokes.at(-1)));
        await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z');
        await page.keyboard.press('p');
        await page.reload(); await page.waitForSelector('#board-canvas'); await page.waitForTimeout(150);
        step('shapes and text are still there after a reload', await page.evaluate(() => board.strokes.some(s => s.k === 'rect') && board.strokes.some(s => s.k === 'text')));
        // the first-time tour: once, when the board is first opened on request; steps through; Esc ends it; the Tour button replays it
        await page.keyboard.press('w'); await page.waitForTimeout(100);
        await page.evaluate(() => localStorage.removeItem('daily-engineer-board-tour'));
        await page.click('#board-open'); await page.waitForTimeout(300);
        step('the first time the board is opened, a short tour starts', await page.evaluate(() => /1 of 5/.test(document.querySelector('.board-tour')?.textContent || '') && document.activeElement?.dataset.tour === 'next'));
        await page.click('.board-tour [data-tour="next"]');
        step('Next steps through it, highlighting each part', await page.evaluate(() => /2 of 5/.test(document.querySelector('.board-tour').textContent) && document.querySelector('.board-tour-target')?.getAttribute('aria-label') === 'Tool'));
        await page.keyboard.press('Escape');
        step('Esc ends the tour and stays on the problem', await page.evaluate(() => !document.querySelector('.board-tour') && location.hash === '#/circuits/level-1'));
        await page.keyboard.press('w'); await page.waitForTimeout(100); await page.click('#board-open'); await page.waitForTimeout(300);
        step('the tour does not come back by itself', await page.evaluate(() => !document.querySelector('.board-tour')));
        await page.click('#board-tour');
        step('the Tour button shows it again', await page.evaluate(() => /1 of 5/.test(document.querySelector('.board-tour')?.textContent || '')));
        await page.click('.board-tour [data-tour="skip"]');
        await page.keyboard.press('w'); await page.waitForTimeout(100);
        step('W hides the whiteboard', await page.evaluate(() => document.getElementById('board').hidden));
        await page.evaluate(() => localStorage.clear());
        // Finishing a problem opens the full worked solution: solving it, or using all five attempts.
        const panelState = () => page.evaluate(() => {
            const panel = document.getElementById('solution-content');
            return {open: !panel.hidden, verdict: panel.querySelector('.solution-verdict')?.textContent || '', ok: panel.querySelectorAll('.answer-review li.ok').length,
                miss: panel.querySelectorAll('.answer-review li.miss').length, steps: panel.querySelectorAll('ol.steps li').length, katexErrors: panel.querySelectorAll('.katex-error').length,
                parts: exercise.parts.length, wantSteps: exercise.steps.length, button: document.getElementById('solution').textContent, status: document.getElementById('status-line').textContent,
                prefilled: document.getElementById('answer-0').value, next: document.getElementById('next-steps').textContent};
        });
        const fill = wrong => page.evaluate(w => exercise.parts.forEach((p, i) => { document.getElementById(`answer-${i}`).value = w ? '12345' : String(p.answer); }), wrong);
        const report = (name, ok, state) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}:`, JSON.stringify(state)); };
        await go('#/circuits/level-2');
        await page.reload();
        await page.waitForSelector('#problem math-field');
        let st = await panelState();
        report('solution hidden before finishing', !st.open && st.button === 'Reveal solution', st);
        await fill(false); await page.click('#check'); await page.waitForTimeout(150);
        st = await panelState();
        report('solving opens the worked solution', st.open && /Solved in 1 attempt/.test(st.verdict) && st.ok === st.parts && st.miss === 0 && st.steps === st.wantSteps && !st.katexErrors, st);
        report('a solved problem points to the next level and discipline', /Next: Level 3 · Challenge/.test(st.next) && /Next discipline: Electronics/.test(st.next), st.next);
        await page.reload();
        await page.waitForSelector('math-field');
        st = await panelState();
        report('still open after reload, with your answers', st.open && st.ok === st.parts && st.prefilled !== '' && st.button === 'Hide solution', st);
        await page.click('#problem-bar .level-tab[data-level="level-3"]');
        await page.waitForTimeout(150);
        await page.waitForSelector('#problem math-field');
        for (let attempt = 1; attempt <= 5; attempt++) {
            st = await panelState();
            if (st.open) { report(`solution stayed closed before attempt ${attempt}`, false, st); break; }
            await fill(true); await page.click('#check'); await page.waitForTimeout(100);
        }
        st = await panelState();
        report('five wrong attempts open the worked solution', st.open && /No attempts left/.test(st.verdict) && st.miss === st.parts && st.steps === st.wantSteps && st.status === 'SOLUTION REVIEWED' && !st.katexErrors, st);
        // Streaks and coins: one level a day keeps a discipline's own streak, milestones pay once, coins unlock archive days.
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('daily-engineer-v1', JSON.stringify({[`${shifted(today, -1)}:circuits:level-1`]: {status: 'solved', daily: true}, [`${shifted(today, -2)}:circuits:level-3`]: {status: 'solved', daily: true}}));
        });
        await go('#/circuits/archive');
        await page.reload();
        await page.waitForSelector('#archive .arch-list');
        const arch = await page.evaluate(() => ({locked: document.querySelectorAll('#archive li.locked').length, disabled: [...document.querySelectorAll('#archive [data-unlock]')].every(b => b.disabled), coins: document.getElementById('coin-count').textContent}));
        step('the archive starts locked, apart from days already played', arch.locked === 28 && arch.disabled && arch.coins === '0', JSON.stringify(arch));
        await go(`#/circuits/level-2/${await page.evaluate(() => shifted(today, -5))}`);
        step('a locked day shows the unlock screen instead of the problem', await page.locator('.locked-panel').count() === 1 && await page.locator('#problem math-field').count() === 0 && /need 10 more coins/.test(await page.textContent('.locked-panel')));
        await go('#/circuits/level-2');
        await page.waitForSelector('#problem math-field');
        await fill(false); await page.click('#check'); await page.waitForTimeout(200);
        const paid = await page.evaluate(() => ({coins: document.getElementById('coin-count').textContent, feedback: document.getElementById('feedback').textContent, toast: document.getElementById('toast').hidden ? '' : document.getElementById('toast').textContent, circuits: topicStreak('circuits').length, electronics: topicStreak('electronics').length}));
        step('one level today makes a 3-day streak and pays 10 coins', paid.coins === '10' && /streak: 3 days\. \+10 coins/.test(paid.feedback) && /3-day streak · Circuit analysis\+10/.test(paid.toast), JSON.stringify(paid));
        step('each discipline keeps its own streak', paid.circuits === 3 && paid.electronics === 0);
        step('the next reward is announced', /Next reward at 7 days \(\+20\)/.test(paid.feedback));
        await page.reload(); await page.waitForTimeout(200);
        step('a milestone pays only once', await page.textContent('#coin-count') === '10');
        await go('#/circuits-electronics');
        await page.waitForTimeout(1300);
        step('the category marks the discipline done with its streak', await page.evaluate(() => { const c = document.querySelector('#category .card[data-topic="circuits"]'); return c.classList.contains('done') && /Done today · 3-day streak/.test(c.querySelector('.card-status').textContent); }));
        await go('#/circuits/archive');
        await page.click(`#archive [data-unlock="${await page.evaluate(() => shifted(today, -5))}"]`); await page.waitForTimeout(150);
        const opened = await page.evaluate(() => ({coins: document.getElementById('coin-count').textContent, nodes: document.querySelectorAll('#archive .arch-list li:nth-child(6) .arch-node').length, disabled: [...document.querySelectorAll('#archive [data-unlock]')].every(b => b.disabled)}));
        step('10 coins unlock one past day, all four levels', opened.coins === '0' && opened.nodes === 4 && opened.disabled, JSON.stringify(opened));
        await page.click('#archive .arch-list li:nth-child(6) .arch-node:nth-child(2)');
        await page.waitForSelector('#problem math-field');
        step('an unlocked day opens its problem', await page.evaluate(() => date === shifted(today, -5) && level === 'level-2' && /from the archive/i.test(document.querySelector('.bar-date').textContent)));
        await go('#/progress');
        step('progress lists streaks, the reward ladder and the coin log', await page.locator('.progress-table.streaks').count() === 1 && await page.locator('.ladder li').count() === 8 && await page.locator('.coin-log li').count() === 2);
        await page.evaluate(() => localStorage.clear());
        // Motion, on fresh pages with a running clock: diagrams draw themselves, cards cascade, reduced motion stays still.
        // Problems change daily, so use today's first problem whose diagram has dashed guides to check they survive drawing.
        let dashed = '#/linkbudget/level-3';
        for (const route of [dashed, ...await page.evaluate(() => TOPICS.flatMap(t => LEVELS.map(l => `#/${t.id}/${l.id}`)))]) {
            await go(route);
            if (await page.evaluate(() => /stroke-dasharray/.test(exercise.diagram || ''))) { dashed = route; break; }
        }
        for (const reducedMotion of ['no-preference', 'reduce']) {
            const mp = await browser.newPage({reducedMotion});
            mp.on('pageerror', e => errors.push(`motion: ${e.message}`));
            await mp.goto(url + dashed); await mp.waitForSelector('#problem .diagram svg');
            const probe = () => mp.evaluate(() => {
                const svg = document.querySelector('#challenge .diagram svg'), lines = [...svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')];
                return {loaded: typeof anime === 'object', drawing: lines.filter(el => el.hasAttribute('pathLength') || el.hasAttribute('draw')).length, hidden: [...svg.querySelectorAll('text')].filter(t => t.style.opacity !== '').length,
                    guides: [...svg.querySelectorAll('[stroke-dasharray]')].map(el => el.getAttribute('stroke-dasharray')).join('|') === (exercise.diagram.match(/stroke-dasharray="[^"]*"/g) || []).map(m => m.slice(18, -1)).join('|'), authored: (exercise.diagram.match(/stroke-dasharray/g) || []).length};
            });
            const early = await probe();
            await mp.waitForTimeout(2500);
            const late = await probe();
            if (reducedMotion === 'reduce') step('reduced motion: the diagram appears at once, nothing animates', early.loaded && early.drawing === 0 && early.hidden === 0, JSON.stringify(early));
            else {
                step('a diagram draws itself when the problem opens', early.loaded && early.drawing > 0 && early.hidden > 0, JSON.stringify(early));
                step('after drawing, the diagram is exactly as authored (dashed guides intact)', late.drawing === 0 && late.hidden === 0 && late.guides && late.authored > 0, JSON.stringify(late));
            }
            await mp.evaluate(() => { location.hash = '#/comms'; }); await mp.waitForTimeout(60);
            const cards = () => mp.evaluate(() => [...document.querySelectorAll('#category .card')].map(c => c.style.opacity));
            const c0 = await cards();
            await mp.waitForTimeout(1200);
            const c1 = await cards();
            if (reducedMotion === 'reduce') step('reduced motion: the cards appear at once', c0.every(o => o === ''), JSON.stringify(c0));
            else {
                step('category cards fade in one after another', c0.length === 4 && Number(c0[3]) < 1, JSON.stringify(c0));
                step('the cascade leaves no inline styles behind, so hover still works', c1.every(o => o === '') && await mp.evaluate(() => [...document.querySelectorAll('#category .card')].every(c => !c.style.transform)), JSON.stringify(c1));
            }
            // Solving: "All correct." decodes and ticks draw (or appear at once with reduced motion).
            await mp.goto(url + '#/linkbudget/level-3'); await mp.waitForSelector('#problem math-field'); await mp.waitForTimeout(200);
            await mp.evaluate(() => exercise.parts.forEach((p, i) => { document.getElementById(`answer-${i}`).value = String(p.answer); }));
            await mp.click('#check'); await mp.waitForTimeout(80);
            const sol0 = await mp.evaluate(() => ({verdict: document.querySelector('.verdict-word')?.textContent, ticks: document.querySelectorAll('.part-feedback .tick').length, drawing: document.querySelectorAll('.part-feedback .tick [pathLength]').length}));
            await mp.waitForTimeout(1500);
            const sol1 = await mp.evaluate(() => ({verdict: document.querySelector('.verdict-word')?.textContent, drawing: document.querySelectorAll('.part-feedback .tick [pathLength]').length}));
            if (reducedMotion === 'reduce') step('reduced motion: the verdict and ticks appear at once', sol0.verdict === 'All correct.' && sol0.ticks > 0 && sol0.drawing === 0, JSON.stringify(sol0));
            else step('“All correct.” decodes and each correct part gets a drawn tick, then both settle', sol0.verdict !== 'All correct.' && sol0.drawing > 0 && sol1.verdict === 'All correct.' && sol1.drawing === 0, JSON.stringify([sol0, sol1]));
            // Walk-through: one step at a time, labels named in the step light up, "Show all" returns to the full working.
            await mp.click('[data-walk]'); await mp.waitForTimeout(100);
            const w1 = await mp.evaluate(() => ({count: document.querySelector('.walk-count').textContent, later: document.querySelectorAll('.steps .later').length, n: exercise.steps.length}));
            await mp.click('[data-walk-next]'); await mp.waitForTimeout(450);
            const w2 = await mp.evaluate(() => ({count: document.querySelector('.walk-count').textContent, current: document.querySelectorAll('.steps li.current').length, styled: [...document.querySelectorAll('.steps li')].some(li => li.style.opacity || li.style.transform)}));
            await mp.click('[data-walk-all]'); await mp.waitForTimeout(100);
            const w3 = await mp.evaluate(() => ({walk: !!document.querySelector('.walk'), dimmed: document.querySelectorAll('.steps .later, .steps .current').length, button: !!document.querySelector('[data-walk]')}));
            step(`${reducedMotion}: the walk-through shows one step at a time and returns to the full working`, w1.count === `Step 1 of ${w1.n}` && w1.later === w1.n - 1 && w2.count === `Step 2 of ${w1.n}` && w2.current === 1 && !w2.styled && !w3.walk && w3.dimmed === 0 && w3.button, JSON.stringify([w1, w2, w3]));
            if (reducedMotion === 'no-preference') {
                // Category switch: the highlight glides to the new category, then the glider is removed.
                await mp.goto(url + '#/circuits-electronics'); await mp.waitForTimeout(600);
                await mp.click('.switch-opt:has-text("Comms")'); await mp.waitForTimeout(80);
                const g0 = await mp.evaluate(() => !!document.querySelector('.switch .glider') && document.querySelector('.switch').classList.contains('gliding'));
                await mp.waitForTimeout(600);
                step('the category switch highlight glides, then tidies up', g0 && await mp.evaluate(() => !document.querySelector('.switch .glider') && !document.querySelector('.switch').classList.contains('gliding')));
                // Coins count up; the reward toast springs in and counts its amount.
                await mp.evaluate(() => { wallet.earned['circuits:test:3'] = {amount: 30, at: today}; announceRewards([{days: 3, topic: TOPICS[0], amount: 30}]); });
                await mp.waitForTimeout(120);
                const k0 = await mp.evaluate(() => ({chip: Number(document.getElementById('coin-count').textContent), toast: Number(document.querySelector('#toast [data-count]').textContent), moving: !!document.getElementById('toast').style.transform}));
                await mp.waitForTimeout(1400);
                const k1 = await mp.evaluate(() => ({chip: document.getElementById('coin-count').textContent, toast: document.querySelector('#toast [data-count]').textContent, style: document.getElementById('toast').style.transform}));
                step('coins count up, and the reward toast springs in while its amount counts', k0.chip < 30 && k0.toast < 30 && k0.moving && k1.chip === '30' && k1.toast === '30' && !k1.style, JSON.stringify([k0, k1]));
                // Menu bar and progress bars fill.
                await mp.goto(url + '#/'); await mp.waitForTimeout(60);
                const b0 = parseFloat(await mp.evaluate(() => document.querySelector('#home .goal-bar span').style.width));
                await mp.waitForTimeout(1100);
                const b1 = parseFloat(await mp.evaluate(() => document.querySelector('#home .goal-bar span').style.width));
                step('the done-today bar grows to its value', b0 < b1 && Math.abs(b1 - 100 / 14) < .1, `${b0} → ${b1}`);
                await mp.goto(url + '#/progress'); await mp.waitForTimeout(1500);
                step('streak bars fill on the progress page', await mp.evaluate(() => document.querySelector('.streaks tr:has(a[href="#/linkbudget"]) .streak-bar span').style.width) === '33.3%');
            }
            await mp.close();
        }
        // Worked solutions are answers and working only: every discipline shows the answers, the steps and the key idea,
        // with no interactive figures, animations or 3D views (and no 3D library is ever requested).
        {
            const sp = await browser.newPage({viewport: {width: 1280, height: 900}}), requested = [], issues = [];
            sp.on('pageerror', e => errors.push(`solutions: ${e.message}`));
            sp.on('request', r => { if (/three|scenes3d|explore-ee/.test(r.url())) requested.push(r.url()); });
            await sp.goto(url); await sp.evaluate(() => localStorage.setItem('daily-engineer-intro', 'done'));
            for (const t of await sp.evaluate(() => TOPICS.map(x => x.id))) for (const level of ['level-1', 'level-3']) {
                await sp.goto(url + `#/${t}/${level}`); await sp.waitForSelector('#problem math-field'); await sp.click('#solution'); await sp.waitForTimeout(150);
                const got = await sp.evaluate(() => {
                    const box = document.getElementById('solution-content');
                    return {answers: box.querySelectorAll('.answer-review li').length === exercise.parts.length && exercise.parts.length, steps: box.querySelectorAll('.steps li').length,
                        idea: /Take this with you/.test(box.textContent), figures: box.querySelectorAll('.explore, .concept, .view3d, canvas, .view3d-open, .concept-play').length};
                });
                if (!got.answers || !got.steps || !got.idea || got.figures) issues.push(`${t}/${level} ${JSON.stringify(got)}`);
            }
            step('every worked solution shows the answers, the working and the key idea, and no figures', !issues.length && !requested.length, [...issues, ...requested].join(' / '));
            await sp.close();
        }
        if (errors.length) { failures++; console.log('FAIL page errors', errors); }
    } finally {
        await browser.close();
        server.close();
    }
    console.log(`${cases.length} typed expressions, ${failures} failures`);
    process.exit(failures ? 1 : 0);
});
