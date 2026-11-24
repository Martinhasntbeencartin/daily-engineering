# Daily Engineer

A static web app with a new electrical engineering problem every day, in the spirit of dailyintegral.com.

- **Easy to find your way:** thin white lines on black with one red accent, plain words and familiar patterns.
  - **Tabs:** Menu, Archive and Progress sit in the top bar, with the coin balance and a Help button. On phones they become a bottom tab bar.
  - **Main menu (`#/`):**
    - Today at a glance: disciplines done (with a progress bar), coins and best current streak.
    - A three-step explanation on the first visit, which "Got it" dismisses for good.
    - Four category tiles, **Circuits & electronics**, **Signals & control**, **Power & electromagnetics** and **Communications & RF**, each listing its disciplines, how many are done today and its best streak.
    - **Continue** (your last problem), **Archive**, **Progress** and **How it works**.
    - Arrow keys move through the menu; Enter opens.
  - **Category pages (`#/circuits-electronics`, `#/signals-control`, `#/power-em`, `#/comms`):** a breadcrumb back to the menu, a switch between the four categories, and a card per discipline. Each card shows its name, a description, a plain status ("Done today · 3-day streak", "Solve today to keep your 5-day streak"), the four level buttons, and a button that says what clicking does ("Start level 1 →"). The card opens the level you last used there.
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
  - **Addresses:** every screen has one (`#/`, `#/circuits-electronics`, `#/comms`, `#/circuits/level-2`, `#/circuits/level-2/2026-11-20`, `#/archive`, `#/circuits/archive`, `#/progress`; a bare `#/circuits` opens its remembered level). The browser's Back button works, and links can be shared or bookmarked.
- **Streaks, coins and a locked archive.**
  - **Streaks per discipline:** solving any one level of a discipline counts it as done for the day and keeps that discipline's streak alive. Each discipline has its own streak, which stays alive through yesterday until midnight.
  - **Coin rewards:** streak milestones pay coins once per streak: 3 days +10, 7 +20, 10 +30, 15 +50, 1 month (30 days) +100, 2 months +200, 6 months +500, 1 year +1000. A broken streak can earn them again. Rewards are paid when you solve, or on the next visit for streaks reached earlier, and announced in a pop-up.
  - **Locked archive:** today is always open. Each past day of a discipline costs 10 coins and unlocks all four of its levels; days you already played stay open. A locked day's address shows an unlock screen. Archive solves count toward totals but not streaks.
  - **Where to see it:** the coin balance sits in the top line. The progress page lists each discipline's current and best streak and next reward, the reward ladder, and a coin log. The constants (`MILESTONES`, `UNLOCK_COST`) are at the top of the streak section in `js/app.js`.
- **14 electrical engineering disciplines in four groups.**
  - **Circuits & electronics:** circuit analysis, electronics, digital logic, measurement.
  - **Signals & control:** signals & systems, control systems, sensors & estimation (encoders, complementary and Kalman filters, trilateration).
  - **Power & electromagnetics:** power systems, motors & drives (DC and brushless motors, field weakening), electromagnetism.
  - **Communications & RF:** information theory (entropy, Huffman, capacity, water-filling), modulation & coding (QAM, Hamming and convolutional codes, fading and diversity), antennas & link budgets (path loss, noise, two-ray, arrays), RF circuits & matching (transmission lines, stubs, amplifier stability, multisection transformers).
- **Four levels.**
  - **Level 1 (Insight)** is a rotation of 56 hand-picked problems. Each is a crisp question with one key insight and an exact answer, such as $\tfrac{1+\sqrt5}{2}$, $\ln 2$ or $\tfrac{\pi^2}{6}$.
  - **Levels 2–4 (Advanced, Challenge, Expert)** are multi-part problems with fresh values every day. Level 4 alternates between graduate-level problems and research-grade work that needs numerical methods.
  - **No repeats within a year at Levels 2–4.** Each generator varies two to six of its quantities over a grid of hundreds to millions of combinations. It then walks that grid in a fixed shuffled order, one step per day (`dayGrid` in `js/numerics.js`, a keyed permutation), so any 365 consecutive days give 365 different problems. Each discipline and level has its own order. Grids are filtered so every problem stays physically sensible (for example the motor operating point stays inside the inverter's voltage, the ladder circuit always overshoots, the array never shows a grating lobe), and drawings show the day's values. `tests/exercises.test.js` checks a full year for every discipline and level.
  - Internally the generators work on five difficulty *tiers* (`TIERS` in `js/core.js`); each public level maps to one or more tiers, so the levels can be regrouped without changing any problem.
- **The full working once you finish.** Solving a problem, or using all five attempts, opens its worked solution: each answer (exact form and decimal) beside the one you gave, the approach, every step of the working and the key idea. Your last answers are kept, so the comparison is still there when you come back (also in the Archive). Revealing the solution before finishing marks the problem as reviewed.
- **Motion and interactive figures (anime.js 4.5.0, MIT, in `vendor/animejs/`; code in `js/motion.js`).**
  - **Automatic, and never with the system's "reduce motion" setting:**
    - a problem's diagram draws itself line by line in under a second, then is exactly as authored;
    - category cards fade up one after another;
    - coins count up in the top bar and on the Progress page;
    - the done-today bars on the main menu and category pages grow to their value;
    - a tick draws itself beside each correct answer, and a wrong answer gets a small side-to-side nudge;
    - the reward toast settles with a soft spring and its coin amount counts up;
    - "All correct." decodes from binary noise;
    - the category switch and the archive picker slide their highlight to the new choice;
    - streak bars on the Progress page fill as they scroll into view.
  - **Started by you (they never play on their own):**
    - **Walk through it step by step:** the worked solution one step at a time (Next, Back, Show all), beside a copy of the diagram whose labels light up when the step names them (for example R₁, q₂, I₀). With reduced motion the steps change without animation.
    - **See it move (Play):**
      - circuits: charge flowing round a series loop;
      - power and signals: a rotating phasor tracing a sine wave;
      - signals: a Fourier series building a square wave from rotating circles, with the Gibbs overshoot;
      - control systems: a step response morphing as damping grows;
      - sensors & estimation: a live Kalman filter whose ±2σ band tightens as readings arrive;
      - information theory: a Huffman tree building itself, merge by merge;
      - modulation & coding: a constellation growing from QPSK to 64-QAM, and an eye diagram closing as noise rises;
      - RF circuits: Γ turning on a Smith chart as the line lengthens, using the problem's own load.
    - **Explore (drag, slide or click):**
      - circuits: charging a capacitor (R, C, τ), with a Charge button;
      - electronics: op-amp gain and clipping at the ±12 V rails, inverting or non-inverting;
      - digital logic: Y = A·B + Ā·C with gate delays and a live timing diagram, showing a static hazard (a one-delay glitch);
      - measurement: averaging noisy readings, the error shrinking as σ/√N;
      - signals: sampling and aliasing;
      - signals and control: poles and zeros you drag on the s-plane, with the Bode magnitude and step response following;
      - power systems: power-factor phasors with capacitor correction;
      - antennas & link budgets: a steerable antenna array with beamwidth, directivity and grating-lobe readouts.
      - Points and knobs also move with the arrow keys.
- **3D views (three.js 0.187.0, MIT, in `vendor/three/`; code in `js/scenes3d.js`).** An **Explore in 3D** section in the worked solution, loaded only when you press **Open the 3D view** (about 140 KB, once per visit). Orbit with the mouse or a finger; nothing moves on its own.
  - **Antenna radiation pattern** (antennas & link budgets, electromagnetism): the short dipole's doughnut, and a line array whose steered beam is a cone around the array axis; change the element count, spacing and steering.
  - **|H(s)| as a landscape** (signals, control): poles as peaks and zeros as pits, with the jω-axis cut (the Bode magnitude) in red. It follows the poles and zeros dragged in the explorer.
  - **An electromagnetic wave** (electromagnetism): E and H travelling together. Press Play, then set the phase and amplitude between the two E components for linear, circular or elliptical polarisation.
  - **The rotating magnetic field** (motors & drives, power systems): three coil fields adding to one turning vector; Play, scrub the angle, or swap two phases to reverse it.
  - **Inside a waveguide** (electromagnetism, RF circuits): the TE₁₀ field in a WR-90 guide travelling along it, and dying away below cutoff, with fc, λg and the phase and group velocities.
  - **Field lines in 3D** (electromagnetism): two point charges (set the second one's charge) or the closed magnetic field lines of a current loop.
  - The bundle is tree-shaken to the parts in `tools/three-entry.js`. To rebuild it, in any folder run `npm install --no-save three@0.187.0 esbuild`, then `node /path/to/daily-engineering/tools/build-three.mjs`.
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
- **Open educational material.** Several problems adapt figures from MIT OpenCourseWare 6.002 and James M. Fiore's open textbooks on Engineering LibreTexts (CC BY-NC-SA 4.0). Each one carries its source credit and licence. See `assets/open-materials/`. Generated problems link to open further reading (LibreTexts books, and MIT OpenCourseWare courses for motors, sensors and communications).

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

`editor.test.js` needs Playwright with Chromium. It walks the navigation (the main menu and first-visit intro, both category pages and their switch, level buttons, the breadcrumbs and level tabs, the tabs, the archive picker, Back, the 1–4/H/Enter/Esc and arrow-key shortcuts, remembered levels, unknown addresses), checks every motion feature on pages with a running clock (the diagram draw, card cascade, decoding verdict and drawn ticks, walk-through, dragging and arrow keys on an explore figure, Play, the switch glide, counting coins and the reward toast, the growing bars), and again with reduced motion, where nothing animates but the walk-through and explore figures still work. It opens every figure in every discipline (each explore figure must react to its controls, each Play animation must change its drawing, each 3D view must open and play), and checks that the |H(s)| landscape follows the dragged poles. It also opens the 3D views: three.js downloads only when a view is opened, the elbow arm starts on its target, the antenna view shows a cone and a doughnut, and leaving the page frees WebGL. The main run freezes the clock (anime.js times itself with `Date.now`), so it runs with reduced motion; types 104 real expressions into the editor, such as `(1+sqrt5)/2` and `8sqrt2/pi^2`, and checks the maths each one produces, then checks the worked solution after solving and after five wrong attempts.

The suite checks:
- Every topic × level, and every topic × tier, for 120 days: each exercise is complete and every answer is finite.
- Every LaTeX fragment compiles with KaTeX in strict mode.
- Every curated exact form evaluates to its stored answer, and each problem's `verify()` function independently reproduces that answer numerically.
- The answer parser has unit tests.
- Generated Level 4 answers (Expert and Mastery tiers) are cross-checked: KCL residuals, the Riccati equation, the Kalata closed form, CRC long division, load-flow balance and the bridge zero.
- Motors, sensors and communications answers are cross-checked by independent methods: a direct simulation of a motor start, both field-weakening limits, the least-squares gradient, Blahut–Arimoto, the water-filling budget, Viterbi by brute force, a second quadrature for fading, the closed-form array directivity, the stub match, and transducer gain = maximum available gain.

## Adding a curated problem

Add an object to the topic’s Level 1 list, `bank(topic, 'advanced', [...])`, in `js/bank.js`, `js/motors-sensors.js` (motors & drives, sensors & estimation) or `js/comms.js` (communications & RF):

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
| `js/bank.js` | Curated Level 1, and the picker for today's curated problem |
| `js/hard.js` | Levels 2–3 for circuits, electronics, signals, control, digital, electromagnetism, power and measurement; open-source credits; complex-number helpers |
| `js/expert.js` | Level 4 for the same disciplines |
| `js/motors-sensors.js` | Motors & drives and sensors & estimation: curated Level 1 and generated Levels 2–4 |
| `js/comms.js` | Communications & RF: curated Level 1 and generated Levels 2–4 |
| `js/numerics.js` | Linear solve, matrix exponential, Jacobi eigenvalues, polynomial roots, bisection, Simpson; `dayGrid` (the daily shuffled walk through each generator's value grid), `product` and `steps` |
| `js/diagrams.js` | SVG drawing helpers |
| `js/explore-ee.js` | The electrical explore figures and Play animations (pole–zero, sampling, logic, RC, op-amp, averaging, power factor; Fourier, Kalman, eye, Huffman) |
| `js/motion.js` | Motion (anime.js): diagram drawing, cascades, counters, ticks, toast, glides; the walk-through, concept animations and explore figures |
| `js/scenes3d.js` | 3D views with three.js (radiation patterns, |H(s)|, EM wave, rotating field, waveguide, field lines), loaded on demand |
| `tools/build-three.mjs`, `tools/three-entry.js` | Build the tree-shaken three.js bundle in `vendor/three/` |
| `js/app.js` | Screens and hash routes, the answer editor, progress and attempts (localStorage), archive |

## Licence note

Adapted exercises keep the licence of their source (CC BY-NC-SA 4.0), which does not allow commercial use.
