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
        // The Level 3 circuit on this local date asks for resistance in ohms.
        await page.clock.setFixedTime(new Date(2026, 1, 1, 12));
        await page.addInitScript(() => localStorage.setItem('daily-engineer-level', 'foundations'));
        await page.goto(url);
        const levels = await page.locator('[data-level]').evaluateAll(buttons => buttons.map(b => b.dataset.level));
        if (levels.join(',') !== 'advanced,university,challenge,expert' ||
            await page.locator('[data-level][aria-pressed="true"]').getAttribute('data-level') !== 'advanced') {
            failures++; console.log('FAIL four-level picker or retired-level fallback');
        }
        await page.waitForSelector('math-field');
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
        await page.waitForSelector('math-field');
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
        if (errors.length) { failures++; console.log('FAIL page errors', errors); }
    } finally {
        await browser.close();
        server.close();
    }
    console.log(`${cases.length} typed expressions, ${failures} failures`);
    process.exit(failures ? 1 : 0);
});
