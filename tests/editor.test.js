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
server.listen(0, async () => {
    const url = `http://localhost:${server.address().port}/`, browser = await chromium.launch(), page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    let failures = 0;
    try {
        // A fixed date keeps the run reproducible.
        await page.clock.setFixedTime(new Date(2026, 1, 1, 12));
        await page.emulateMedia({reducedMotion: 'reduce'}); // navigation is instant; the swoosh gets its own checks below
        const step = (name, ok, detail='') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`); };
        const go = async hash => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(150); };
        const shown = id => page.evaluate(i => !document.getElementById(i).hidden, id);
        // Navigation: the wiring diagram, one click to a problem, the level track, shortcuts, and back again.
        await page.goto(url);
        await page.waitForTimeout(600);
        step('Today shows every discipline as a card', await page.locator('#home .card').count() === 11);
        step('the Today tab is marked as the current page', await page.getAttribute('.tabs a[data-tab="today"]', 'aria-current') === 'page');
        const card = await page.evaluate(() => { const c = document.querySelector('#home .card[data-topic="control"]'); return {status: c.querySelector('.card-status').textContent, cta: c.querySelector('.card-cta').textContent, levels: c.querySelectorAll('.lvl').length}; });
        step('each card says its status, offers four levels and what clicking does', card.status === 'Not done yet today' && /Start level 1/.test(card.cta) && card.levels === 4, JSON.stringify(card));
        step('a first visit explains how it works', await page.locator('#home .intro').count() === 1);
        await page.click('#dismiss-intro'); await page.reload(); await page.waitForTimeout(400);
        step('“Got it” hides the explanation for good', await page.locator('#home .intro').count() === 0);
        // Category filter: All, Electrical or Mechanical & civil, remembered between visits.
        const visibleCards = () => page.evaluate(() => [...document.querySelectorAll('#home .card')].filter(c => c.offsetParent).map(c => c.dataset.topic));
        await page.click('[data-filter="mechanical"]'); await page.waitForTimeout(100);
        step('the Mechanical & civil filter shows only its 3 disciplines', (await visibleCards()).join() === 'statics,dynamics,thermo' && await page.getAttribute('[data-filter="mechanical"]', 'aria-pressed') === 'true');
        await page.reload(); await page.waitForTimeout(400);
        step('the chosen category is remembered', (await visibleCards()).length === 3);
        await page.click('[data-filter="electrical"]'); await page.waitForTimeout(100);
        step('the Electrical filter shows its 8 disciplines', (await visibleCards()).length === 8 && !(await visibleCards()).includes('thermo'));
        await page.click('[data-filter="all"]'); await page.waitForTimeout(100);
        step('All shows every discipline again', (await visibleCards()).length === 11);
        // The swoosh: clicking a level orb zooms into it before the problem opens.
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.click('#home .card[data-topic="electronics"] .lvl:nth-of-type(3)'); await page.waitForTimeout(60);
        const mid = await page.evaluate(() => ({veils: document.querySelectorAll('.swoosh').length, label: document.querySelector('.swoosh-label')?.textContent, hash: location.hash}));
        step('clicking a level orb starts the swoosh from that orb', mid.veils === 1 && mid.label === '3' && mid.hash !== '#/electronics/level-3', JSON.stringify(mid));
        await page.waitForFunction(() => location.hash === '#/electronics/level-3' && !document.querySelector('.swoosh'), null, {timeout: 4000});
        step('a level button on a card opens that level once the swoosh ends', await page.locator('#problem math-field').count() > 0);
        await page.emulateMedia({reducedMotion: 'reduce'});
        await page.goBack(); await page.waitForTimeout(400);
        await page.click('#home .card[data-topic="signals"] .lvl:nth-of-type(2)'); await page.waitForTimeout(60);
        step('with reduced motion a level opens at once, without the swoosh', await page.evaluate(() => location.hash === '#/signals/level-2' && !document.querySelector('.swoosh')));
        await page.goBack(); await page.waitForTimeout(400);
        await page.click('#home .card[data-topic="circuits"] .card-cta', {force: true});
        await page.waitForSelector('#problem math-field');
        step('one click opens the problem at Level 1', await page.evaluate(() => location.hash) === '#/circuits/level-1');
        const trackIds = await page.locator('#problem-bar .level-tab').evaluateAll(as => as.map(a => a.dataset.level));
        step('labelled tabs offer levels 1–4', trackIds.join() === 'level-1,level-2,level-3,level-4', trackIds.join());
        step('a breadcrumb shows where you are', /Today\s*\/\s*Circuit analysis/.test(await page.textContent('#problem-bar .crumbs')));
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
        step('Escape goes back to Today', await shown('home'));
        step('Today remembers the level used for a discipline', await page.getAttribute('#home .card[data-topic="circuits"] .card-link', 'href') === '#/circuits/level-2' && /Start level 2/.test(await page.textContent('#home .card[data-topic="circuits"] .card-cta')));
        step('home offers to continue the last problem', await page.getAttribute('#home .resume', 'href') === '#/circuits/level-2');
        await go('#/circuits');
        step('a bare discipline address opens its remembered level', await page.evaluate(() => location.hash) === '#/circuits/level-2');
        await page.click('#back-link'); await page.waitForTimeout(150);
        step('the breadcrumb link returns to Today', await page.evaluate(() => location.hash) === '#/' && await shown('home'));
        await page.click('.tabs a[data-tab="archive"]'); await page.waitForTimeout(200);
        step('the Archive tab opens the archive of the last discipline', await page.evaluate(() => location.hash) === '#/circuits/archive' && await shown('archive') && await page.getAttribute('.tabs a[data-tab="archive"]', 'aria-current') === 'page');
        await page.click('#archive .pick:has-text("Thermo")'); await page.waitForTimeout(150);
        step('the archive switches discipline from its picker', await page.evaluate(() => location.hash) === '#/thermo/archive');
        await go('#/nowhere/at-all');
        step('an unknown address falls back to Today', await shown('home'));
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
        await go('#/');
        await page.waitForTimeout(1300);
        step('Today marks the discipline done with its streak', await page.evaluate(() => { const c = document.querySelector('#home .card[data-topic="circuits"]'); return c.classList.contains('done') && /Done today · 3-day streak/.test(c.querySelector('.card-status').textContent); }));
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
        if (errors.length) { failures++; console.log('FAIL page errors', errors); }
    } finally {
        await browser.close();
        server.close();
    }
    console.log(`${cases.length} typed expressions, ${failures} failures`);
    process.exit(failures ? 1 : 0);
});
