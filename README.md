# Daily Engineer

A static web app with a new engineering problem every day, in the spirit of dailyintegral.com.

- **11 topics in two groups.** Electrical: circuits, electronics, signals, control, digital, electromagnetism, power, measurement. Mechanical & civil: statics/structures, dynamics/vibrations, thermo-fluids.
- **7 levels.**
  - **Levels 1–3 (Foundations, Applied, Intermediate)** are a hand-curated bank of 132 problems. Each is a crisp question with one key insight and an exact answer, such as $\tfrac{1+\sqrt5}{2}$, $\ln 2$ or $\tfrac{\pi^2}{6}$.
  - **Levels 4–7 (Advanced, Challenge, Expert, Mastery)** are generated multi-part problems whose values change daily, up to research-grade work that needs numerical methods.
- **LaTeX everywhere.** All problem text, hints and solutions are typeset with KaTeX, which is bundled in `vendor/katex/` (MIT licence), so the site needs no CDN.
- **A real maths editor for answers.** The answer box is a MathLive field (bundled in `vendor/mathlive/`, MIT licence; it shares KaTeX's fonts), so maths becomes typeset as you type:
  - `3/4` becomes a stacked fraction, `sqrt` a root, `pi` gives π, and `^` starts an exponent.
  - Typing follows plain-text reading: `(1+sqrt5)/2`, `sqrt(5)-1`, `3/4+1`, `2^10-1` and `ln2/2` mean what they would on paper. After a function (`ln`, `log`, `exp`, trig, hyperbolic) or a root, `/` makes the whole term the numerator, so `ln2/2` is (ln 2)/2 and `sqrt(2)/2` is √2/2. `log` is base 10. The `√` character, whether typed (Option+V) or pasted, becomes a real root. `→` steps out of a fraction, root or exponent; `Enter` checks the answer.
  - On phones a virtual maths keyboard appears.
  - The value of what you typed is shown underneath, and each problem allows 5 attempts.
  - If the editor fails to load, a plain text box that accepts `pi/4`, `ln(2)` or `sqrt(3)/2` is used instead.
- **Open educational material.** Several problems adapt figures from MIT OpenCourseWare 6.002 and James M. Fiore's open textbooks on Engineering LibreTexts (CC BY-NC-SA 4.0). Each one carries its source credit and licence. See `assets/open-materials/`.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Test

```bash
node tests/exercises.test.js
```

```bash
node tests/editor.test.js
```

`editor.test.js` needs Playwright with Chromium. It types 48 real expressions into the editor, such as `(1+sqrt5)/2` and `8sqrt2/pi^2`, and checks the maths each one produces.

The suite checks:
- Every topic × level for 120 days: each exercise is complete and every answer is finite.
- Every LaTeX fragment compiles with KaTeX in strict mode.
- Every curated exact form evaluates to its stored answer, and each problem's `verify()` function independently reproduces that answer numerically.
- The answer parser has unit tests.
- Generated Expert and Mastery answers are cross-checked: KCL residuals, the Riccati equation, the Kalata closed form, CRC long division, load-flow balance, truss equilibrium and the bridge zero.

## Adding a curated problem

Add an object to the relevant `bank(topic, level, [...])` list in `js/bank.js` (electrical) or `js/bank-mech.js` (mechanical & civil):

```js
{
    title: 'A ladder that never ends',
    text: T`Every resistor is $1\,\Omega$. Find $R_{AB}$.`,      // T`…` = String.raw, so backslashes survive
    parts: [ex(T`$R_{AB}$`, (1 + Math.sqrt(5)) / 2, T`\dfrac{1+\sqrt5}{2}`, 'Ω')],
    hints: [T`…`], steps: [T`…`], idea: '…', prereq: '…',
    verify: () => [/* independent numerical check of each part */]
}
```

## Layout

| File | Contents |
| --- | --- |
| `js/core.js` | Topics, levels, router `makeExercise` |
| `js/mathtext.js` | LaTeX helpers (`T`, `tf`, `tc`), the answer parser and the editor-LaTeX converter |
| `js/bank.js`, `js/bank-mech.js` | Curated Levels 1–3 |
| `js/hard.js` | Electrical Levels 4–5, open-source credits, complex-number helpers |
| `js/expert.js` | Electrical Levels 6–7 |
| `js/mechanical.js` | Mechanical & civil Levels 4–7 |
| `js/numerics.js` | Linear solve, matrix exponential, Jacobi eigenvalues, polynomial roots, bisection, Simpson |
| `js/diagrams.js` | SVG drawing helpers |
| `js/app.js` | UI, progress and attempts (localStorage), archive |

## Licence note

Adapted exercises keep the licence of their source (CC BY-NC-SA 4.0), which does not allow commercial use.
