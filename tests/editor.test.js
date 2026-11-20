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
    ['((1+sqrt5)/2)^2', ((1 + Math.sqrt(5)) / 2) ** 2], ['sqrt(1+sqrt(4))', Math.sqrt(3)], ['2e-3', .002]
];
server.listen(0, async () => {
    const url = `http://localhost:${server.address().port}/`, browser = await chromium.launch(), page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    let failures = 0;
    try {
        await page.goto(url);
        await page.waitForSelector('math-field');
        for (const [keys, want] of cases) {
            await page.evaluate(() => { const m = document.getElementById('answer-0'); m.value = ''; m.focus(); });
            await page.waitForTimeout(200);
            await page.keyboard.type(keys, {delay: 20});
            await page.waitForTimeout(60);
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
