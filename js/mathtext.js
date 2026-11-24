/* LaTeX authoring helpers and the symbolic answer parser.
   Problem text uses $…$ (inline) and $$…$$ (display) and is rendered by KaTeX.
   Authoring tip: write strings with T`…` (String.raw) so backslashes survive. */
const T = String.raw;
/* Number → LaTeX, 5 significant figures, scientific notation as ×10^{n}: from ten million up (so 2.8075×10^{12},
   not 2807500000000) and below one millionth. */
function tf(n, sig=5) {
    if (!Number.isFinite(n)) return String(n);
    const r = Number(n.toPrecision(sig));
    const s = Math.abs(r) >= 1e7 ? r.toExponential(sig - 1).replace(/\.?0+e/, 'e') : r.toString();
    const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/);
    return m ? `${m[1]}\\times10^{${Number(m[2])}}` : s;
}
/* Complex number → LaTeX rectangular form with j. */
const tc = a => `${tf(a.re)} ${a.im < 0 ? '-' : '+'} j${tf(Math.abs(a.im))}`;

/* ---------- symbolic answer parser ----------
   Reads answers the way people write them on paper, in calculators, spreadsheets and code:
   • numbers: 0.5  .5  0,5 (decimal comma)  1.5e-3  1.5E3  1.5×10^-3  1.5x10⁻³  1.5·10³  mixed numbers 1 1/2
   • operators: + − – — × · ∙ * x / ÷ ⁄ ^ ** and unicode powers ² ³ ⁻¹ ⁽⁾, implicit multiplication 2pi 3(4) (2)(3)
   • brackets ( ) [ ] { }, absolute value |x| abs(x), postfix ! % ‰ ° (degrees inside trig, ignored as a unit)
   • fractions ½ ⅓ ¼ ¾ … and 1½; roots √ ∛ ∜ sqrt cbrt nthroot(x,n) root(x,n) x^(1/n)
   • constants pi π e tau τ phi φ (golden ratio); words: deg degrees rad percent
   • functions: exp ln log lg log10 log2 lb log_b(x) log₂(x), sin cos tan sec csc cosec cot cotan ctg,
     arcsin asin sin^-1 sin⁻¹ (and the same for every trig function), sinh cosh tanh sech csch coth,
     arsinh asinh arcsinh (and so on), abs, and sin^2(x) meaning (sin x)². */
const MathInput = (() => {
    const gamma = z => { // Lanczos approximation, for factorials of non-integers
        if (z < .5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
        const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        z -= 1;
        let x = c[0];
        for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
        const t = z + g + .5;
        return Math.sqrt(2 * Math.PI) * t ** (z + .5) * Math.exp(-t) * x;
    };
    const factorial = n => Number.isInteger(n) && n >= 0 && n <= 170 ? Array.from({length: n}, (_, i) => i + 1).reduce((a, b) => a * b, 1) : gamma(n + 1);
    const op = name => a => `\\operatorname{${name}}\\left(${a}\\right)`;
    const named = cmd => a => `\\${cmd}\\left(${a}\\right)`;
    const FUN = {
        sqrt: [Math.sqrt, a => `\\sqrt{${a}}`], cbrt: [Math.cbrt, a => `\\sqrt[3]{${a}}`], root4: [x => x ** .25, a => `\\sqrt[4]{${a}}`],
        exp: [Math.exp, a => `e^{${a}}`], ln: [Math.log, named('ln')], log: [Math.log10, a => `\\log_{10}\\left(${a}\\right)`], log2: [Math.log2, a => `\\log_{2}\\left(${a}\\right)`],
        abs: [Math.abs, a => `\\left|${a}\\right|`],
        sin: [Math.sin, named('sin')], cos: [Math.cos, named('cos')], tan: [Math.tan, named('tan')],
        sec: [x => 1 / Math.cos(x), named('sec')], csc: [x => 1 / Math.sin(x), named('csc')], cot: [x => 1 / Math.tan(x), named('cot')],
        asin: [Math.asin, named('arcsin')], acos: [Math.acos, named('arccos')], atan: [Math.atan, named('arctan')],
        asec: [x => Math.acos(1 / x), op('arcsec')], acsc: [x => Math.asin(1 / x), op('arccsc')], acot: [x => Math.atan(1 / x), op('arccot')],
        sinh: [Math.sinh, named('sinh')], cosh: [Math.cosh, named('cosh')], tanh: [Math.tanh, named('tanh')],
        sech: [x => 1 / Math.cosh(x), op('sech')], csch: [x => 1 / Math.sinh(x), op('csch')], coth: [x => 1 / Math.tanh(x), named('coth')],
        asinh: [Math.asinh, op('arsinh')], acosh: [Math.acosh, op('arcosh')], atanh: [Math.atanh, op('artanh')],
        asech: [x => Math.acosh(1 / x), op('arsech')], acsch: [x => Math.asinh(1 / x), op('arcsch')], acoth: [x => Math.atanh(1 / x), op('arcoth')]
    };
    const INVERSE = {sin: 'asin', cos: 'acos', tan: 'atan', sec: 'asec', csc: 'acsc', cot: 'acot', sinh: 'asinh', cosh: 'acosh', tanh: 'atanh', sech: 'asech', csch: 'acsch', coth: 'acoth'};
    const TRIG = new Set([...Object.keys(INVERSE), ...Object.values(INVERSE)]);
    const ALIAS = {
        arcsin: 'asin', arccos: 'acos', arctan: 'atan', arctg: 'atan', arcsec: 'asec', arccsc: 'acsc', arccosec: 'acsc', acosec: 'acsc', arccot: 'acot', arcctg: 'acot', arccotan: 'acot',
        cosec: 'csc', cotan: 'cot', ctg: 'cot', tg: 'tan',
        arsinh: 'asinh', arcsinh: 'asinh', argsinh: 'asinh', arcosh: 'acosh', arccosh: 'acosh', argcosh: 'acosh', artanh: 'atanh', arctanh: 'atanh', argtanh: 'atanh',
        arsech: 'asech', arcsech: 'asech', arcsch: 'acsch', arccsch: 'acsch', arcoth: 'acoth', arccoth: 'acoth',
        log10: 'log', lg: 'log', lb: 'log2', ld: 'log2', sqr: 'sqrt', squareroot: 'sqrt', cuberoot: 'cbrt', absolute: 'abs'
    };
    const MULTI = new Set(['nthroot', 'root']); // two-argument functions: nthroot(x, n)
    const CONST = {pi: [Math.PI, '\\pi'], tau: [2 * Math.PI, '\\tau'], phi: [(1 + Math.sqrt(5)) / 2, '\\varphi'], e: [Math.E, 'e']};
    const NAMES = [...Object.keys(FUN), ...Object.keys(ALIAS), ...MULTI, 'pi', 'tau', 'phi'].sort((a, b) => b.length - a.length);
    const VULGAR = {'½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅐': '1/7', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8', '⅑': '1/9', '⅒': '1/10'};
    const SUP = {'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '⁽': '(', '⁾': ')', 'ⁿ': 'n'};
    const SUB = {'₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'};
    /* Rewrite the many spellings into one canonical plain syntax before tokenising. */
    function normalise(src) {
        let s = src.normalize('NFC').trim();
        s = s.replace(/[−–—‐‒﹣－]/g, '-').replace(/[＋]/g, '+').replace(/[×✕✖⋅·∙•]/g, '*').replace(/[÷∶]/g, '/').replace(/[⁄∕]/g, '/');
        s = s.replace(/\*\*/g, '^').replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
        s = s.replace(/π/g, ' pi ').replace(/τ/g, ' tau ').replace(/[φϕ]/g, ' phi ').replace(/√/g, ' sqrt ').replace(/∛/g, ' cbrt ').replace(/∜/g, ' root4 ');
        s = s.replace(/(\d)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])/g, (m, d, f) => `(${d}+${VULGAR[f]})`).replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]/g, f => `(${VULGAR[f]})`);
        s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ⁿ]+/g, m => `^(${[...m].map(c => SUP[c]).join('')})`);
        s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, m => `_(${[...m].map(c => SUB[c]).join('')})`);
        s = s.replace(/\bpercent\b/gi, '%').replace(/\bper\s*mill?e?\b/gi, '‰');
        s = s.replace(/([\d.)])\s*(degrees|degree|degs|deg)\b/gi, '$1°').replace(/([\d.)])\s*(radians|radian|rads|rad)\b/gi, '$1').replace(/\s+(radians|radian|rads|rad)\s*$/i, '');
        s = s.replace(/([\d.)])\s*[xX]\s*(?=[\d.(])/g, '$1*'); // 3x4, 1.5x10^3: x between numbers means times
        // Mixed numbers: 1 1/2 and 2 3/4 (a whole number, a space, then a simple fraction) mean 1½ and 2¾.
        s = s.replace(/(^|[+\-*/(,])\s*(\d+)\s+\(\((\d+)\)\/\((\d+)\)\)/g, '$1($2+$3/$4)').replace(/(^|[+\-*/(,])\s*(\d+)\s+(\d+)\s*\/\s*(\d+)(?![\d.])/g, '$1($2+$3/$4)');
        return s;
    }
    function tokenize(src) {
        const s = normalise(src), out = [], stack = [];
        let i = 0;
        while (i < s.length) {
            const c = s[i];
            if (/\s/.test(c)) { i++; continue; }
            const inArgs = stack[stack.length - 1] === 'args';
            const num = s.slice(i).match(inArgs ? /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/ : /^(\d+(?:[.,]\d+)?|\d+\.|\.\d+)([eE][+-]?\d+)?/);
            if (num) { out.push({t: 'num', v: Number(num[0].replace(',', '.'))}); i += num[0].length; continue; }
            if (c === '(') { stack.push(out[out.length - 1]?.multi ? 'args' : 'p'); out.push({t: '('}); i++; continue; }
            if (c === ')') { stack.pop(); out.push({t: ')'}); i++; continue; }
            if ('+-*/^,_!%‰°|'.includes(c)) { out.push({t: c}); i++; continue; }
            if (/[a-zA-Z]/.test(c)) {
                // A name ending in a digit (log10) only matches when no further digit follows: log100 is log(100).
                const rest = s.slice(i).toLowerCase(), name = NAMES.find(n => rest.startsWith(n) && !(/\d$/.test(n) && /\d/.test(rest[n.length] || '')));
                if (name) {
                    if (CONST[name]) out.push({t: 'const', v: CONST[name][0], tex: CONST[name][1]});
                    else if (MULTI.has(name)) out.push({t: 'fn', v: 'nthroot', multi: true});
                    else out.push({t: 'fn', v: ALIAS[name] || name});
                    i += name.length;
                    continue;
                }
                if (rest[0] === 'e') { out.push({t: 'const', v: Math.E, tex: 'e'}); i++; continue; }
            }
            throw Error('Unexpected “' + c + '”');
        }
        return out;
    }
    function parse(src) {
        const tk = tokenize(src);
        if (!tk.length) throw Error('empty');
        let p = 0, bars = 0;
        const peek = () => tk[p], eat = t => { if (tk[p]?.t !== t) throw Error('Expected ' + t); return tk[p++]; };
        const startsAtom = x => x && (x.t === 'num' || x.t === 'const' || x.t === 'fn' || x.t === '(' || (x.t === '|' && bars === 0));
        function expr() {
            let n = term();
            while (peek()?.t === '+' || peek()?.t === '-') { const o = tk[p++].t; n = {op: o, a: n, b: term()}; }
            return n;
        }
        function term() {
            let n = unary();
            for (;;) {
                if (peek()?.t === '*' || peek()?.t === '/') { const o = tk[p++].t; n = {op: o, a: n, b: unary()}; }
                else if (startsAtom(peek())) n = {op: '*', a: n, b: power(), implicit: true};
                else return n;
            }
        }
        function unary() {
            if (peek()?.t === '-') { p++; return {op: 'neg', a: unary()}; }
            if (peek()?.t === '+') { p++; return unary(); }
            return power();
        }
        function power() {
            const base = postfix();
            if (peek()?.t === '^') { p++; return {op: '^', a: base, b: unary()}; }
            return base;
        }
        function postfix() {
            let n = atom();
            for (;;) {
                const t = peek()?.t;
                if (t === '!') { p++; n = {op: 'fact', a: n}; }
                else if (t === '%') { p++; n = {op: 'pct', a: n}; }
                else if (t === '‰') { p++; n = {op: 'pml', a: n}; }
                else if (t === '°') { p++; n = {op: 'deg', a: n}; }
                else return n;
            }
        }
        function argument() { // what a function applies to: (…) or the next power, e.g. sin 2x → sin(2)·x, ln2 → ln(2)
            if (peek()?.t === '(') { p++; const n = expr(); eat(')'); return {op: 'paren', a: n}; }
            return power();
        }
        function atom() {
            const x = peek();
            if (!x) throw Error('Incomplete expression');
            if (x.t === 'num') { p++; return {op: 'num', v: x.v}; }
            if (x.t === 'const') { p++; return {op: 'const', v: x.v, tex: x.tex}; }
            if (x.t === '(') { p++; const n = expr(); eat(')'); return {op: 'paren', a: n}; }
            if (x.t === '|') { p++; bars++; const n = expr(); eat('|'); bars--; return {op: 'fn', f: 'abs', a: n}; }
            if (x.t === 'fn') {
                p++;
                if (x.multi) { // nthroot(x, n) and root(x, n)
                    eat('(');
                    const a = expr();
                    eat(',');
                    const n = expr();
                    eat(')');
                    return {op: 'nthroot', a, n};
                }
                let f = x.v, base = null;
                if (peek()?.t === '_' && (f === 'log' || f === 'log2' || f === 'ln')) { p++; base = atom(); f = 'logb'; } // log_2(8), log₂8
                let exponent = null;
                if (peek()?.t === '^') { p++; exponent = unary(); } // sin^2(x), sin^-1(x)
                if (exponent && TRIG.has(f) && INVERSE[f] && Math.abs(value(exponent) + 1) < 1e-12) { f = INVERSE[f]; exponent = null; }
                const node = f === 'logb' ? {op: 'logb', base, a: argument()} : {op: 'fn', f, a: argument()};
                return exponent ? {op: '^', a: node, b: exponent} : node;
            }
            throw Error('Unexpected ' + x.t);
        }
        const tree = expr();
        if (p < tk.length) throw Error('Unexpected ' + tk[p].t);
        return tree;
    }
    /* Degrees: inside a function argument (sin 30°) they convert to radians; on their own (60°) they are the unit. */
    function value(n, inFn=false) {
        switch (n.op) {
            case 'num': case 'const': return n.v;
            case 'paren': return value(n.a, inFn);
            case 'neg': return -value(n.a, inFn);
            case '+': return value(n.a, inFn) + value(n.b, inFn);
            case '-': return value(n.a, inFn) - value(n.b, inFn);
            case '*': return value(n.a, inFn) * value(n.b, inFn);
            case '/': return value(n.a, inFn) / value(n.b, inFn);
            case '^': return Math.pow(value(n.a, inFn), value(n.b, inFn));
            case 'fn': return FUN[n.f][0](value(n.a, true));
            case 'logb': return Math.log(value(n.a, true)) / Math.log(value(n.base, true));
            case 'nthroot': { const x = value(n.a, true), k = value(n.n, true); return x < 0 && Math.round(k) % 2 === 1 ? -((-x) ** (1 / k)) : x ** (1 / k); }
            case 'fact': return factorial(value(n.a, inFn));
            case 'pct': return value(n.a, inFn) / 100;
            case 'pml': return value(n.a, inFn) / 1000;
            case 'deg': return inFn ? value(n.a, inFn) * Math.PI / 180 : value(n.a, inFn);
        }
    }
    const strip = n => n.op === 'paren' ? strip(n.a) : n;
    function tex(n) {
        switch (n.op) {
            case 'num': return tf(n.v, 12);
            case 'const': return n.tex;
            case 'paren': return `\\left(${tex(n.a)}\\right)`;
            case 'neg': return `-${tex(n.a)}`;
            case '+': return `${tex(n.a)}+${tex(n.b)}`;
            case '-': return `${tex(n.a)}-${tex(n.b)}`;
            case '*': {
                const b = strip(n.b), juxt = n.implicit && (b.op === 'const' || b.op === 'fn' || n.b.op === 'paren');
                return `${tex(n.a)}${juxt ? (b.op === 'const' && b.tex === 'e' ? '\\,' : '') : '\\cdot '}${tex(n.b)}`;
            }
            case '/': { const a = strip(n.a); return a.op === 'neg' ? `-\\frac{${tex(strip(a.a))}}{${tex(strip(n.b))}}` : `\\frac{${tex(a)}}{${tex(strip(n.b))}}`; }
            case '^': {
                const a = n.a, wrap = !['num', 'const', 'paren'].includes(a.op) || (a.op === 'num' && a.v < 0);
                return `{${wrap ? `\\left(${tex(a)}\\right)` : tex(a)}}^{${tex(strip(n.b))}}`;
            }
            case 'fn': return FUN[n.f][1](tex(strip(n.a)));
            case 'logb': return `\\log_{${tex(strip(n.base))}}\\left(${tex(strip(n.a))}\\right)`;
            case 'nthroot': return `\\sqrt[${tex(strip(n.n))}]{${tex(strip(n.a))}}`;
            case 'fact': return `${tex(n.a)}!`;
            case 'pct': return `${tex(n.a)}\\%`;
            case 'pml': return `${tex(n.a)}\\,\\text{‰}`;
            case 'deg': return `${tex(n.a)}^\\circ`;
        }
    }
    /* LaTeX produced by the MathLive editor → the plain syntax above. */
    const LATEX_FN = {ln: 'ln', log: 'log', lg: 'log', lb: 'log2', exp: 'exp', sin: 'sin', cos: 'cos', tan: 'tan', sec: 'sec', csc: 'csc', cot: 'cot', cosec: 'csc', arcsin: 'asin', arccos: 'acos', arctan: 'atan', arcsec: 'asec', arccsc: 'acsc', arccot: 'acot', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', sech: 'sech', csch: 'csch', coth: 'coth', arsinh: 'asinh', arcosh: 'acosh', artanh: 'atanh', arcsinh: 'asinh', arccosh: 'acosh', arctanh: 'atanh', abs: 'abs'};
    const LATEX_SYMBOL = {pi: 'pi', tau: 'tau', phi: 'phi', varphi: 'phi', degree: '°', circ: '°', '%': '%', cdot: '*', times: '*', ast: '*', div: '/', lbrack: '(', rbrack: ')', lbrace: '(', rbrace: ')', '{': '(', '}': ')', vert: '|', lvert: '|', rvert: '|', mid: '|', Vert: '|', exponentialE: 'e', Omega: 'Ω', mu: 'µ', degreeCelsius: '°C'};
    function fromLatex(latex) {
        let src = latex.replace(/\{,\}/g, '.').replace(/\\mathrm\{e\}|\\exponentialE/g, 'e').replace(/\\operatorname\{\\mathrm\{([a-z]+)\}\}/g, '\\operatorname{$1}');
        // a\tan, arc\cot, ar\sinh … : the editor splits some inverse-function names; rejoin them.
        src = src.replace(/(^|[^\\a-zA-Z])(?:arc|ar|a)\\(sin|cos|tan|sec|csc|cot)(h?)(?![a-z])/g, (m, pre, f, h) => `${pre}\\operatorname{a${f}${h}}`);
        src = src.replace(/\\log\s*(\d+)\s*(?=\(|\\left\()/g, '\\log_{$1}'); // log2(8) typed in the editor means log base 2
        src = src.replace(/\^\{([^{}]*)\}\s*\^\{([^{}]*)\}/g, '^{$1$2}').replace(/\^\{([^{}]*)\}\s*\^\{([^{}]*)\}/g, '^{$1$2}'); // 2^{-}^{1} → 2^{-1}
        src = src.replace(/\^\{?\\circ\}?/g, '\\degree');
        // A whole number written directly against a fraction is a mixed number, as in handwriting: 1½ → 1\frac12.
        // (Numeric fractions only; 2\frac{\pi}{4} stays 2·π/4.)
        src = src.replace(/(\d)\s*\\frac(\d)(\d)(?![\d}])/g, '$1\\,\\frac{$2}{$3}').replace(/(\d)\s*\\frac\{(\d+)\}\{(\d+)\}/g, '$1\\,\\frac{$2}{$3}');
        const tk = src.match(/\\[a-zA-Z]+|\\.|[^\s]|\s+/g) || [];
        let p = 0;
        const group = () => {
            while (p < tk.length && /^\s+$/.test(tk[p])) p++;
            if (p >= tk.length) throw Error('Incomplete expression');
            if (tk[p] === '{') {
                p++;
                let out = '';
                while (p < tk.length && tk[p] !== '}') out += item();
                if (tk[p++] !== '}') throw Error('Unbalanced braces');
                return out;
            }
            return item();
        };
        function item() {
            const t = tk[p++];
            if (/^\s+$/.test(t)) return ' ';
            if (t === '{') { p--; return '(' + group() + ')'; }
            if (t === '}') throw Error('Unbalanced braces');
            if (t === '^') return '^(' + group() + ')';
            if (t === '_') return '_(' + group() + ')';
            if (t[0] !== '\\') return t;
            const name = t.slice(1);
            if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') { const a = group(), b = group(); return `((${a})/(${b}))`; }
            if (name === 'sqrt') {
                while (p < tk.length && /^\s+$/.test(tk[p])) p++;
                if (tk[p] === '[') {
                    p++;
                    let n = '';
                    while (p < tk.length && tk[p] !== ']') n += item();
                    p++;
                    return `nthroot(${group()}, ${n})`;
                }
                return `sqrt(${group()})`;
            }
            if (name === 'surd') return 'sqrt '; // a bare √ symbol applies to the atom that follows it
            if (['left', 'right', 'bigl', 'bigr', 'Bigl', 'Bigr', 'big', 'Big'].includes(name)) {
                const d = tk[p++];
                return d === '|' || d === '\\vert' || d === '\\lvert' || d === '\\rvert' ? '|' : d === '.' ? '' : d === '\\{' || d === '[' || d === '\\lbrack' || d === '\\lbrace' ? '(' : d === '\\}' || d === ']' || d === '\\rbrack' || d === '\\rbrace' ? ')' : d;
            }
            if (LATEX_FN[name]) return ' ' + LATEX_FN[name] + ' ';
            if (LATEX_SYMBOL[name] !== undefined) return ' ' + LATEX_SYMBOL[name] + ' ';
            if (name === 'operatorname' || name === 'mathrm' || name === 'text' || name === 'mathit' || name === 'textrm') { const g = group().trim(); return ' ' + (LATEX_FN[g] || g) + ' '; }
            if ([',', ';', '!', ' ', ':', 'quad', 'qquad', 'thinspace', 'enspace'].includes(name)) return ' ';
            if (name === 'placeholder') { group(); throw Error('Fill in the empty box'); }
            throw Error('Unsupported symbol ' + t);
        }
        let out = '';
        while (p < tk.length) out += item();
        return out.replace(/\s+/g, ' ').trim();
    }
    /* Trailing units the reader may type: "2.5 mA", "60 degrees", "37.5 percent", "4.7 kohm". */
    const UNIT_WORDS = {'Ω': ['ω', 'ohm', 'ohms', 'Ω'], '°': ['°', 'deg', 'degs', 'degree', 'degrees'], '%': ['%', 'percent', 'pct'], 'µ': ['µ', 'μ', 'u', 'micro']};
    function stripUnit(text, unit) {
        if (!unit) return text;
        const norm = u => u.toLowerCase().replace(/[\s·*⋅]+/g, '').replace(/μ/g, 'µ');
        const variants = new Set([unit]);
        for (const [sym, words] of Object.entries(UNIT_WORDS)) if (unit.includes(sym)) for (const w of words) variants.add(unit.replace(sym, w));
        if (unit.includes('Ω')) for (const pre of ['k', 'M', 'm']) if (unit === pre + 'Ω') { variants.add(pre + 'ohm'); variants.add(pre + 'ohms'); }
        const t = text.trim(), tn = norm(t);
        for (const v of [...variants].sort((a, b) => b.length - a.length)) {
            const vn = norm(v);
            if (vn && tn.endsWith(vn) && tn.length > vn.length && /[a-zµΩ°%‰/]/i.test(v)) {
                let cut = t.length;
                for (let k = 0, kept = tn.length - vn.length; cut > 0; cut--) { if (norm(t.slice(0, cut)).length === kept) break; }
                const rawHead = t.slice(0, cut), head = rawHead.trim();
                if (/[a-zA-Z]$/.test(rawHead)) continue; // a letter touching the unit is a prefix: "4.7 kohm" is not "4.7 k" + Ω
                if (head && /[\d)a-zπ]$/i.test(head)) return head;
            }
        }
        return text;
    }
    return {
        read(src) {
            const tree = parse(src), v = value(tree);
            return {value: v, latex: tex(tree)};
        },
        fromLatex,
        stripUnit,
        readLatex(latex) {
            return this.read(fromLatex(latex));
        }
    };
})();
