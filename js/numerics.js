/* Small numerical toolkit used to compute reference answers for the Expert and Mastery levels.
   Everything is deterministic and runs in the browser; no answers are hard-coded. */
const NUM = (() => {
    const solve = (A, b) => {
        const n = A.length, M = A.map((r, i) => [...r, b[i]]);
        for (let k = 0; k < n; k++) {
            let p = k;
            for (let i = k + 1; i < n; i++)
                if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
            [M[k], M[p]] = [M[p], M[k]];
            for (let i = k + 1; i < n; i++) {
                const f = M[i][k] / M[k][k];
                for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
            }
        }
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let s = M[i][n];
            for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
            x[i] = s / M[i][i];
        }
        return x;
    };
    const matMul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
    const matVec = (A, x) => A.map(r => r.reduce((s, v, k) => s + v * x[k], 0));
    const eye = n => Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => +(i === j)));
    const add = (A, B, s=1) => A.map((r, i) => r.map((v, j) => v + s * B[i][j]));
    const scale = (A, s) => A.map(r => r.map(v => v * s));
    // Matrix exponential by scaling and squaring with a Taylor series.
    const expm = A => {
        const norm = Math.max(...A.map(r => r.reduce((s, v) => s + Math.abs(v), 0)));
        const k = Math.max(0, Math.ceil(Math.log2(norm || 1)) + 2), As = scale(A, 2 ** -k);
        let term = eye(A.length), sum = eye(A.length);
        for (let i = 1; i < 25; i++) {
            term = scale(matMul(term, As), 1 / i);
            sum = add(sum, term);
        }
        for (let i = 0; i < k; i++) sum = matMul(sum, sum);
        return sum;
    };
    // Cyclic Jacobi eigen-decomposition of a real symmetric matrix; ascending eigenvalues.
    const eigSym = S => {
        const n = S.length, A = S.map(r => [...r]), V = eye(n);
        for (let sweep = 0; sweep < 100; sweep++) {
            let off = 0;
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
            if (off < 1e-22) break;
            for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
                if (Math.abs(A[p][q]) < 1e-300) continue;
                const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
                for (let k = 0; k < n; k++) {
                    const akp = A[k][p], akq = A[k][q];
                    A[k][p] = c * akp - s * akq;
                    A[k][q] = s * akp + c * akq;
                }
                for (let k = 0; k < n; k++) {
                    const apk = A[p][k], aqk = A[q][k];
                    A[p][k] = c * apk - s * aqk;
                    A[q][k] = s * apk + c * aqk;
                }
                for (let k = 0; k < n; k++) {
                    const vkp = V[k][p], vkq = V[k][q];
                    V[k][p] = c * vkp - s * vkq;
                    V[k][q] = s * vkp + c * vkq;
                }
            }
        }
        const order = A.map((r, i) => i).sort((a, b) => A[a][a] - A[b][b]);
        return {values: order.map(i => A[i][i]), vectors: order.map(i => V.map(r => r[i]))};
    };
    // Durand–Kerner roots of a real polynomial, coefficients highest power first.
    const polyRoots = coeffs => {
        const c = coeffs.map(v => v / coeffs[0]), n = c.length - 1;
        let z = Array.from({length: n}, (_, k) => cp(1.1, 360 * k / n + 17));
        const evalP = x => c.reduce((acc, v) => ca(cm(acc, x), cx(v)), cx(0));
        for (let it = 0; it < 500; it++) {
            z = z.map((zi, i) => {
                let den = cx(1);
                z.forEach((zj, j) => { if (j !== i) den = cm(den, cs(zi, zj)); });
                return cs(zi, cd(evalP(zi), den));
            });
        }
        return z.map(r => cx(Math.abs(r.re) < 1e-12 ? 0 : r.re, Math.abs(r.im) < 1e-9 * Math.max(1, cabs(r)) ? 0 : r.im));
    };
    const bisect = (f, a, b, n=200) => {
        let fa = f(a);
        for (let i = 0; i < n; i++) {
            const m = (a + b) / 2, fm = f(m);
            if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
        }
        return (a + b) / 2;
    };
    const simpson = (f, a, b, n=2000) => {
        const h = (b - a) / n;
        let s = f(a) + f(b);
        for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
        return s * h / 3;
    };
    return {solve, matMul, matVec, eye, add, scale, expm, eigSym, polyRoots, bisect, simpson};
})();
const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
/* Deterministic per-date variant selector shared by the new generators. */
function dailyVariant(date, salt, n=3) {
    const d = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
    let s = (Math.imul(d, 2654435761) ^ Math.imul(salt + 1, 40503)) >>> 0;
    s = (Math.imul(s ^ (s >>> 15), 2246822519) >>> 0);
    s = (Math.imul(s ^ (s >>> 13), 3266489917) >>> 0);
    return ((s ^ (s >>> 16)) >>> 0) % n;
}
/* A small seeded picker for generators that draw several independent values. */
function seededPicker(date, salt) {
    const d = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
    let seed = (Math.imul(d, 2654435761) + Math.imul(salt, 97531)) >>> 0;
    return a => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return a[Math.floor(seed / 4294967296 * a.length)];
    };
}
const hashString = s => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
