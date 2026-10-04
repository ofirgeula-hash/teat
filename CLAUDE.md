# teat — two separate apps in one repo

| | Shopping list ("קניות ומשימות") | Fitness tracker |
|---|---|---|
| Code | repo root: `index.html`, `sw.js`, `manifest.json`, icons | `fitness/` (Next.js) |
| Hosting | GitHub Pages (`/teat/`) | Vercel project `teat` → `teat-flax.vercel.app` |
| Backend | Firebase (`functions/`, `firebase.json`, `.firebaserc`, `firebase-messaging-sw.js`) | none (localStorage) |
| Deploy | GitHub Pages on push to `main`; functions via `.github/workflows/deploy-functions.yml` | Vercel on push to `main` |
| Tests | `tests/`, `playwright.config.js` | `.github/workflows/fitness-check.yml` (build) |
| Other | `scripts/` (task report email) | — |

## Rules that keep them apart
- The Vercel project's root directory is `fitness/`. **All Vercel config goes in
  `fitness/vercel.json`.** Never add `vercel.json` or `.vercelignore` at the repo root:
  Vercel still reads them, and doing so has broken the fitness deploy before (a root
  `.vercelignore` that listed `fitness`, then a root `vercel.json` with `framework: null`).
  CI fails if either file appears.
- `fitness/vercel.json` has an `ignoreCommand` that skips the Vercel build when a commit
  doesn't touch `fitness/`, so shopping-list commits never create fitness deploys.
- The shopping list has no Vercel project. If one is ever added, give it its own root
  directory rather than sharing the repo root config.
- Fitness-specific context lives in `fitness/CLAUDE.md`.
