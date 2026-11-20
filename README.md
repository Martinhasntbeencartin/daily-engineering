# Daily Engineer

A static web app with a new engineering exercise every day, in the spirit of dailyintegral.com.

- **11 topics in two groups.** Electrical: circuits, electronics, signals, control, digital, electromagnetism, power, measurement. Mechanical & civil: statics/structures, dynamics/vibrations, thermo-fluids.
- **7 levels.** Foundations → Applied → Intermediate → Advanced → Challenge → **Expert** (graduate qualifying-exam depth) → **Mastery** (research grade; numerical methods expected).
- Problems are generated deterministically from the date, so everyone gets the same problem each day. Answers are computed from the model in the browser, then checked per part with hints and worked solutions.
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

The test generates every topic × level for 120 days. It checks that each exercise is complete and every answer is finite. It also cross-checks the Expert and Mastery answers by independent methods: KCL residuals, the Riccati equation, the Kalata closed form, CRC long division, load-flow balance and truss equilibrium.

## Layout

| File | Contents |
| --- | --- |
| `js/diagrams.js` | SVG drawing helpers |
| `js/foundations.js` | Electrical topics, Level 1 |
| `js/levels.js` | Level definitions, Levels 2–3 for circuits/electronics/signals/control |
| `js/extra.js` | Digital/fields/power/measurement Levels 1–3, router `makeExercise` |
| `js/hard.js` | Levels 4–5 (electrical), open-source credits |
| `js/numerics.js` | Linear solve, matrix exponential, Jacobi eigen, polynomial roots, bisection, Simpson |
| `js/expert.js` | Levels 6–7 (electrical) |
| `js/mechanical.js` | Mechanical & civil topics, all 7 levels |
| `js/app.js` | UI, progress (localStorage), archive |

## Licence note

Adapted exercises keep the licence of their source (CC BY-NC-SA 4.0), which does not allow commercial use.
