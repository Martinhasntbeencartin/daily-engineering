/* LaTeX authoring helpers and the symbolic answer parser.
   Problem text uses $…$ (inline) and $$…$$ (display) and is rendered by KaTeX.
   Authoring tip: write strings with T`…` (String.raw) so backslashes survive. */
const T = String.raw;
/* Number → LaTeX, 5 significant figures, scientific notation as ×10^{n}. */
function tf(n, sig=5) {
    if (!Number.isFinite(n)) return String(n);
    const s = Number(n.toPrecision(sig)).toString();
    const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/);
    return m ? `${m[1]}\\times10^{${Number(m[2])}}` : s;
}
/* Complex number → LaTeX rectangular form with j. */
const tc = a => `${tf(a.re)} ${a.im < 0 ? '-' : '+'} j${tf(Math.abs(a.im))}`;

/* ---------- symbolic answer parser ----------
   Accepts numbers, + − × · / ^, parentheses, implicit multiplication (2pi, 3sqrt(2)),
   constants pi π e, and sqrt √ ln log (base 10) exp sin cos tan asin acos atan sinh cosh tanh abs. */
const MathInput = (() => {
    const FUN = {
        sqrt: [Math.sqrt, a => `\\sqrt{${a}}`], ln: [Math.log, a => `\\ln\\left(${a}\\right)`], log: [Math.log10, a => `\\log_{10}\\left(${a}\\right)`],
        exp: [Math.exp, a => `e^{${a}}`], sin: [Math.sin, a => `\\sin\\left(${a}\\right)`], cos: [Math.cos, a => `\\cos\\left(${a}\\right)`], tan: [Math.tan, a => `\\tan\\left(${a}\\right)`],
        asin: [Math.asin, a => `\\arcsin\\left(${a}\\right)`], acos: [Math.acos, a => `\\arccos\\left(${a}\\right)`], atan: [Math.atan, a => `\\arctan\\left(${a}\\right)`],
        sinh: [Math.sinh, a => `\\sinh\\left(${a}\\right)`], cosh: [Math.cosh, a => `\\cosh\\left(${a}\\right)`], tanh: [Math.tanh, a => `\\tanh\\left(${a}\\right)`], abs: [Math.abs, a => `\\left|${a}\\right|`]
    };
    const ALIAS = {arcsin: 'asin', arccos: 'acos', arctan: 'atan', log10: 'log', sqr: 'sqrt'};
    const NAMES = [...Object.keys(FUN), ...Object.keys(ALIAS), 'pi'].sort((a, b) => b.length - a.length);
    function tokenize(src) {
        const s = src.replace(/[−–]/g, '-').replace(/[×·∙]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\*\*/g, '^').replace(/(\d),(\d)/g, '$1.$2');
        const out = [];
        let i = 0;
        while (i < s.length) {
            const c = s[i];
            if (/\s/.test(c)) { i++; continue; }
            const num = s.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
            if (num) { out.push({t: 'num', v: Number(num[0])}); i += num[0].length; continue; }
            if ('+-*/^()'.includes(c)) { out.push({t: c}); i++; continue; }
            if (/[a-zA-Z]/.test(c)) {
                // A name ending in a digit (log10) only matches when no further digit follows: log100 is log(100).
                const rest = s.slice(i).toLowerCase(), name = NAMES.find(n => rest.startsWith(n) && !(/\d$/.test(n) && /\d/.test(rest[n.length] || '')));
                if (name) { out.push(name === 'pi' ? {t: 'const', v: Math.PI, tex: '\\pi'} : {t: 'fn', v: ALIAS[name] || name}); i += name.length; continue; }
                if (rest[0] === 'e') { out.push({t: 'const', v: Math.E, tex: 'e'}); i++; continue; }
            }
            throw Error('Unexpected “' + c + '”');
        }
        return out;
    }
    function parse(src) {
        const tk = tokenize(src);
        if (!tk.length) throw Error('empty');
        let p = 0;
        const peek = () => tk[p], eat = t => { if (tk[p]?.t !== t) throw Error('Expected ' + t); return tk[p++]; };
        const startsAtom = x => x && (x.t === 'num' || x.t === 'const' || x.t === 'fn' || x.t === '(');
        function expr() {
            let n = term();
            while (peek()?.t === '+' || peek()?.t === '-') { const op = tk[p++].t; n = {op, a: n, b: term()}; }
            return n;
        }
        function term() {
            let n = unary();
            for (;;) {
                if (peek()?.t === '*' || peek()?.t === '/') { const op = tk[p++].t; n = {op, a: n, b: unary()}; }
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
            const base = atom();
            if (peek()?.t === '^') { p++; return {op: '^', a: base, b: unary()}; }
            return base;
        }
        function atom() {
            const x = peek();
            if (!x) throw Error('Incomplete expression');
            if (x.t === 'num') { p++; return {op: 'num', v: x.v}; }
            if (x.t === 'const') { p++; return {op: 'const', v: x.v, tex: x.tex}; }
            if (x.t === '(') { p++; const n = expr(); eat(')'); return {op: 'paren', a: n}; }
            if (x.t === 'fn') {
                p++;
                if (peek()?.t === '(') { p++; const n = expr(); eat(')'); return {op: 'fn', f: x.v, a: n}; }
                return {op: 'fn', f: x.v, a: power()};
            }
            throw Error('Unexpected ' + x.t);
        }
        const tree = expr();
        if (p < tk.length) throw Error('Unexpected ' + tk[p].t);
        return tree;
    }
    function value(n) {
        switch (n.op) {
            case 'num': case 'const': return n.v;
            case 'paren': return value(n.a);
            case 'neg': return -value(n.a);
            case '+': return value(n.a) + value(n.b);
            case '-': return value(n.a) - value(n.b);
            case '*': return value(n.a) * value(n.b);
            case '/': return value(n.a) / value(n.b);
            case '^': return Math.pow(value(n.a), value(n.b));
            case 'fn': return FUN[n.f][0](value(n.a));
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
        }
    }
    /* LaTeX produced by the MathLive editor → the plain syntax above.
       Handles \frac, \sqrt[n]{}, ^{}, \left(…\right), \cdot, \times, \pi, function names and spacing. */
    const LATEX_FN = {ln: 'ln', log: 'log', exp: 'exp', sin: 'sin', cos: 'cos', tan: 'tan', arcsin: 'asin', arccos: 'acos', arctan: 'atan', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh'};
    function fromLatex(latex) {
        const src = latex.replace(/\{,\}/g, '.').replace(/\\mathrm\{e\}|\\exponentialE/g, 'e').replace(/(^|[^\\a-zA-Z])a\\(sin|cos|tan)/g, '$1\\arc$2').replace(/(^|[^\\a-zA-Z])arc\\(sin|cos|tan)/g, '$1\\arc$2');
        const tk = src.match(/\\[a-zA-Z]+|\\.|[^\s]/g) || [];
        let p = 0;
        const group = () => {
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
            if (t === '{') { p--; return '(' + group() + ')'; }
            if (t === '}') throw Error('Unbalanced braces');
            if (t === '^') return '^(' + group() + ')';
            if (t[0] !== '\\') return t;
            const name = t.slice(1);
            if (name === 'frac' || name === 'dfrac' || name === 'tfrac') { const a = group(), b = group(); return `((${a})/(${b}))`; }
            if (name === 'sqrt') {
                if (tk[p] === '[') {
                    p++;
                    let n = '';
                    while (p < tk.length && tk[p] !== ']') n += item();
                    p++;
                    return `((${group()})^(1/(${n})))`;
                }
                return `sqrt(${group()})`;
            }
            if (name === 'left' || name === 'right' || name === 'bigl' || name === 'bigr') {
                const d = tk[p++];
                return d === '|' ? (name === 'left' ? 'abs(' : ')') : d === '.' ? '' : d === '\\{' ? '(' : d === '\\}' ? ')' : d;
            }
            if (name === 'cdot' || name === 'times' || name === 'ast') return '*';
            if (name === 'div') return '/';
            if (name === 'pi') return 'pi';
            if (LATEX_FN[name]) return LATEX_FN[name];
            if (name === 'operatorname' || name === 'mathrm' || name === 'text') { const g = group(); return LATEX_FN[g] || g; }
            if ([',', ';', '!', ' ', ':', 'quad', 'qquad'].includes(name)) return '';
            if (name === 'placeholder') { group(); throw Error('Fill in the empty box'); }
            throw Error('Unsupported symbol ' + t);
        }
        let out = '';
        while (p < tk.length) out += item();
        return out;
    }
    return {
        read(src) {
            const tree = parse(src), v = value(tree);
            return {value: v, latex: tex(tree)};
        },
        fromLatex,
        readLatex(latex) {
            return this.read(fromLatex(latex));
        }
    };
})();
