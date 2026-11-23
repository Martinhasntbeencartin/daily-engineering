# Daily Engineer

A static web app with a new engineering problem every day, in the spirit of dailyintegral.com.

- **Easy to find your way:** thin white lines on black with one red accent, plain words and familiar patterns.
  - **Tabs:** Menu, Archive and Progress sit in the top bar, with the coin balance and a Help button. On phones they become a bottom tab bar.
  - **Main menu (`#/`):**
    - Today at a glance: disciplines done (with a progress bar), coins and best current streak.
    - A three-step explanation on the first visit, which "Got it" dismisses for good.
    - Four category tiles, **Electrical**, **Mechanical & civil**, **Robotics & mechatronics** and **Communications & RF**, each listing its disciplines, how many are done today and its best streak.
    - **Continue** (your last problem), **Archive**, **Progress** and **How it works**.
    - Arrow keys move through the menu; Enter opens.
  - **Category pages (`#/electrical`, `#/mechanical`, `#/robotics`, `#/comms`):** a breadcrumb back to the menu, a switch between the four categories, and a card per discipline. Each card shows its name, a description, a plain status ("Done today · 3-day streak", "Solve today to keep your 5-day streak"), the four level buttons, and a button that says what clicking does ("Start level 1 →"). The card opens the level you last used there.
  - **Problems:**
    - A breadcrumb ("← Electrical / Circuit analysis") with the discipline's streak status.
    - Labelled level tabs ("Level 2 · Advanced · 30–50 min", "✓ Solved").
    - The problem, with the answer panel beside it ("Your answer", "4 attempts left"); it stays in view on wide screens.
    - Right under **Check answer**: **Show a hint**, which opens the hint in place, and **Reveal solution**.
    - Once you finish, the panel offers the next level and the next discipline not yet done today.
  - **Archive** is its own tab: a coin summary, a discipline picker, then today and the last 30 days with unlock buttons.
  - **Shortcuts** (when not typing in an answer box; listed under Help):
    - <kbd>1</kbd>–<kbd>4</kbd> switch level.
    - <kbd>H</kbd> shows a hint.
    - <kbd>Enter</kbd> jumps to the answer box.
    - <kbd>Esc</kbd> goes back: problem, then category, then menu.
  - **Addresses:** every screen has one (`#/`, `#/electrical`, `#/robotics`, `#/circuits/level-2`, `#/circuits/level-2/2026-11-20`, `#/archive`, `#/circuits/archive`, `#/progress`; a bare `#/circuits` opens its remembered level). The browser's Back button works, and links can be shared or bookmarked.
- **Streaks, coins and a locked archive.**
  - **Streaks per discipline:** solving any one level of a discipline counts it as done for the day and keeps that discipline's streak alive. Each discipline has its own streak, which stays alive through yesterday until midnight.
  - **Coin rewards:** streak milestones pay coins once per streak: 3 days +10, 7 +20, 10 +30, 15 +50, 1 month (30 days) +100, 2 months +200, 6 months +500, 1 year +1000. A broken streak can earn them again. Rewards are paid when you solve, or on the next visit for streaks reached earlier, and announced in a pop-up.
  - **Locked archive:** today is always open. Each past day of a discipline costs 10 coins and unlocks all four of its levels; days you already played stay open. A locked day's address shows an unlock screen. Archive solves count toward totals but not streaks.
  - **Where to see it:** the coin balance sits in the top line. The progress page lists each discipline's current and best streak and next reward, the reward ladder, and a coin log. The constants (`MILESTONES`, `UNLOCK_COST`) are at the top of the streak section in `js/app.js`.
- **19 topics in four groups.**
  - **Electrical:** circuits, electronics, signals, control, digital, electromagnetism, power, measurement.
  - **Mechanical & civil:** statics/structures, dynamics/vibrations, thermo-fluids.
  - **Robotics & mechatronics:** robot kinematics (inverse kinematics, Jacobians, redundancy), robot dynamics & control (PD and computed torque, flexible joints, simulation), motors & drives (DC and brushless motors, field weakening), sensors & estimation (encoders, complementary and Kalman filters, trilateration).
  - **Communications & RF:** information theory (entropy, Huffman, capacity, water-filling), modulation & coding (QAM, Hamming and convolutional codes, fading and diversity), antennas & link budgets (path loss, noise, two-ray, arrays), RF circuits & matching (transmission lines, stubs, amplifier stability, multisection transformers).
- **Four levels.**
  - **Level 1 (Insight)** is a rotation of 76 hand-picked problems. Each is a crisp question with one key insight and an exact answer, such as $\tfrac{1+\sqrt5}{2}$, $\ln 2$ or $\tfrac{\pi^2}{6}$.
  - **Levels 2–4 (Advanced, Challenge, Expert)** are multi-part problems whose values change daily. Level 4 alternates between graduate-level problems and research-grade work that needs numerical methods.
  - Internally the generators work on five difficulty *tiers* (`TIERS` in `js/core.js`); each public level maps to one or more tiers, so the levels can be regrouped without changing any problem.
- **The full working once you finish.** Solving a problem, or using all five attempts, opens its worked solution: each answer (exact form and decimal) beside the one you gave, the approach, every step of the working and the key idea. Your last answers are kept, so the comparison is still there when you come back (also in the Archive). Revealing the solution before finishing marks the problem as reviewed.
- **Gentle motion (anime.js).** When a problem opens, its diagram draws itself line by line in under a second, with dashed guides, dots and labels fading in; afterwards the figure is exactly as authored. On category pages the discipline cards fade up one after another. Nothing moves when the system's "reduce motion" setting is on. The library (anime.js 4.5.0, MIT licence) is bundled in `vendor/animejs/`; the code is the Motion section of `js/app.js` (`drawDiagram`, `cascade`).
- **LaTeX everywhere.** All problem text, hints and solutions are typeset with KaTeX, which is bundled in `vendor/katex/` (MIT licence), so the site needs no CDN.
- **A real maths editor for answers.** The answer box is a MathLive field (bundled in `vendor/mathlive/`, MIT licence; it shares KaTeX's fonts), so maths becomes typeset as you type:
  - `3/4` becomes a stacked fraction, `sqrt` a root, `pi` gives π, and `^` starts an exponent.
  - Typing follows plain-text reading: `(1+sqrt5)/2`, `sqrt(5)-1`, `3/4+1`, `2^10-1` and `ln2/2` mean what they would on paper. After a function (`ln`, `log`, `exp`, trig, hyperbolic) or a root, `/` makes the whole term the numerator, so `ln2/2` is (ln 2)/2 and `sqrt(2)/2` is √2/2. `log` is base 10. The `√` character, whether typed (Option+V) or pasted, becomes a real root. `→` steps out of a fraction, root or exponent; `Enter` checks the answer.
  - Every common way of writing maths is understood, in the editor and in the plain-text fallback:
    - roots: `√` `∛` `∜` `cbrt` `nthroot`/`root` `x^(1/n)`;
    - powers: `^` `**` `²` `⁻¹`;
    - fractions: `½`, mixed numbers `1 1/2` and `1½`;
    - scientific notation: `1.5e-3` `1.5E-3` `1.5x10^-3` `1.5·10⁻³`, and a decimal comma `0,5`;
    - `°`, `deg`, `%`, `‰`, `!`, `|x|` and `abs`, brackets `[ ]` `{ }`;
    - constants: `pi` `π` `tau` `τ` `phi` `φ` `e`;
    - logs: `ln`, `log`/`lg` (base 10), `log2`, `log_2(8)`, `log₂8`;
    - trig: `sec` `csc` `cot` and their inverses as `asin`, `arcsin` or `sin^-1`; hyperbolic and inverse-hyperbolic functions; `sin^2(x)`.
    - A "How to type answers" guide sits under every answer box.
  - A unit typed after the number is accepted (`2.5 mA`, `60 degrees`, `4.7 kohm`). A different unit gets a hint to use the expected one.
  - On phones a virtual maths keyboard appears.
  - The value of what you typed is shown underneath, and each problem allows 5 attempts.
  - If the editor fails to load, a plain text box that accepts `pi/4`, `ln(2)` or `sqrt(3)/2` is used instead.
- **Open educational material.** Several problems adapt figures from MIT OpenCourseWare 6.002 and James M. Fiore's open textbooks on Engineering LibreTexts (CC BY-NC-SA 4.0). Each one carries its source credit and licence. See `assets/open-materials/`. Generated problems link to open further reading (LibreTexts books, and MIT OpenCourseWare courses for robotics and communications).

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Updating the live site

GitHub Pages lets browsers reuse files for up to 10 minutes. To make sure visitors get new code straight after a deploy, every `css/` and `js/` link in `index.html` carries a fingerprint of the file contents (`?v=…`). After changing any of those files, run:

```bash
node tools/stamp.js
```

`tests/exercises.test.js` fails if the stamp is out of date.

## Test

```bash
node tests/exercises.test.js
```

```bash
node tests/editor.test.js
```

`editor.test.js` needs Playwright with Chromium. It walks the navigation (the main menu and first-visit intro, both category pages and their switch, level buttons, the breadcrumbs and level tabs, the tabs, the archive picker, Back, the 1–4/H/Enter/Esc and arrow-key shortcuts, remembered levels, unknown addresses), checks the motion on pages with a running clock (a diagram draws and then matches its source, cards cascade and leave no styles behind, and with reduced motion nothing animates), types 104 real expressions into the editor, such as `(1+sqrt5)/2` and `8sqrt2/pi^2`, and checks the maths each one produces, then checks the worked solution after solving and after five wrong attempts.

The suite checks:
- Every topic × level, and every topic × tier, for 120 days: each exercise is complete and every answer is finite.
- Every LaTeX fragment compiles with KaTeX in strict mode.
- Every curated exact form evaluates to its stored answer, and each problem's `verify()` function independently reproduces that answer numerically.
- The answer parser has unit tests.
- Generated Level 4 answers (Expert and Mastery tiers) are cross-checked: KCL residuals, the Riccati equation, the Kalata closed form, CRC long division, load-flow balance, truss equilibrium and the bridge zero.
- Robotics and communications answers are cross-checked by independent methods: forward kinematics and J·q̇ = v, the Euler–Lagrange equations by finite differences, a direct simulation of a motor start, both field-weakening limits, the least-squares gradient, Blahut–Arimoto, the water-filling budget, Viterbi by brute force, a second quadrature for fading, the closed-form array directivity, the stub match, and transducer gain = maximum available gain.

## Adding a curated problem

Add an object to the topic’s Level 1 list, `bank(topic, 'advanced', [...])`, in `js/bank.js` (electrical), `js/bank-mech.js` (mechanical & civil), `js/robotics.js` or `js/comms.js`:

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
| `js/core.js` | Topics, tiers, levels, router `makeExercise` / `makeTierExercise` |
| `js/mathtext.js` | LaTeX helpers (`T`, `tf`, `tc`), the answer parser and the editor-LaTeX converter |
| `js/bank.js`, `js/bank-mech.js` | Curated Level 1 |
| `js/hard.js` | Electrical Levels 2–3, open-source credits, complex-number helpers |
| `js/expert.js` | Electrical Level 4 |
| `js/mechanical.js` | Mechanical & civil Levels 2–4 |
| `js/robotics.js` | Robotics & mechatronics: curated Level 1 and generated Levels 2–4 |
| `js/comms.js` | Communications & RF: curated Level 1 and generated Levels 2–4 |
| `js/numerics.js` | Linear solve, matrix exponential, Jacobi eigenvalues, polynomial roots, bisection, Simpson |
| `js/diagrams.js` | SVG drawing helpers |
| `js/app.js` | Screens and hash routes, the answer editor, progress and attempts (localStorage), archive |

## Licence note

Adapted exercises keep the licence of their source (CC BY-NC-SA 4.0), which does not allow commercial use.
