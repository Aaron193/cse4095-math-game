# Math Practice App

A React and TypeScript arithmetic practice app for children ages 7–12. Practice addition, subtraction, multiplication, and division at four difficulty levels, with multiple-choice cards, fixed or continuous sessions, mistake review, mastery tracking, and statistics. Results follow the student's **I Got It Right / I Got It Wrong** choices.

## Installation and development

Use Node.js 22.13+ on the Node 22 line (verified with 22.21.1) and npm. Netlify uses Node 22 through `netlify.toml`.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173. Stop with Ctrl+C.

## Verification and production build

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run preview
```

`npm run test:watch` runs tests interactively; `npm run format` applies Prettier. Preview serves `dist/` locally. The production output contains static HTML, CSS, JavaScript, and the Netlify routing file; tests, source maps, development tools, and project documentation are not published.

Final verification details and outstanding checks are recorded below and in [TODO.md](TODO.md). The [specification](specification.md) remains the requirements reference.

## Deploy to Netlify

No deployment, commit, or push has been performed.

### Manual deployment (no GitHub connection required)

1. Run `npm ci` and the verification commands above. `npm run build` creates `dist/`.
2. Sign in to Netlify and choose **Add new project → Deploy manually**, or open [Netlify Drop](https://app.netlify.com/drop).
3. Drag the **dist folder** into the deployment area. Upload only this folder, not the repository.
4. Open the assigned HTTPS site URL. Visit and refresh `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`. Without a saved session, `/practice/session` intentionally returns to setup.
5. Complete a short session, refresh, and confirm the saved statistics. Check narrow/tablet layouts and the browser console. These hosted checks remain outstanding until deployment.

### Deployment from GitHub (optional)

1. When you choose to do so, commit and push the verified files to your repository.
2. In Netlify, choose **Add new project → Import an existing project**, select GitHub, and select the repository and branch.
3. For this repository, leave the base directory at its root. Confirm build command **npm run build** and publish directory **dist**. `netlify.toml` supplies these settings and Node 22. No environment variables, backend, functions, or plugins are required.
4. Publish and perform the hosted checks in steps 4–5 above. Future pushes to the selected branch trigger builds.

`public/_redirects` is copied to `dist/_redirects` and contains `/* /index.html 200`. Netlify serves existing assets normally and rewrites application URLs to the app entry point, allowing React Router to handle nested links and refreshes. The rule works for both manual and Git-connected deployments. See [Netlify SPA routing](https://docs.netlify.com/build/configure-builds/javascript-spas/) and [build configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/).

## Local data and privacy

Settings, attempts, mistake patterns, statistics, and the active session/card are stored under `mathPractice.data` in browser `localStorage` with schema version 3. Statistics and mastery are rebuilt from validated attempts. The app requests no names, accounts, or other personal information and sends no practice data to external services. There are no analytics, advertisements, external fonts, or remote images. Hosting providers may retain ordinary web request logs independently of the app.

Progress belongs to this browser profile and site origin. It is not synchronized across devices, browsers, tabs, or domains; localhost data will not transfer to a Netlify URL. Clearing browser data, resetting the app, losing the profile, or ending a private-browsing session can erase progress. There is no cloud backup or export. Multiple simultaneous tabs can overwrite one another's changes.

Storage is finite. When writes fail or storage is blocked, the app warns and continues in memory; new progress may be lost on refresh. Attempts are retained for lifetime totals and mastery, session metadata is capped at 500 records, and recent history displays 20 sessions. Older attempts are not archived because replay is required for correct mastery; aggregate totals survive session-metadata pruning. At 5,000 attempts and 500 sessions, the measured snapshot was about 1.85 MB of UTF-8 JSON (3.69 MB as UTF-16 code units); browser quota accounting varies. Indefinitely growing histories can eventually exhaust storage.

## Final verification: Phases 20–22

- All **484 tests in 37 files pass**. TypeScript, ESLint (zero warnings), Prettier, and the production build pass. The first full run timed out one new integration case at the default five-second limit; its focused run passed, its timeout was set to 15 seconds, and the full rerun passed.
- Production Chrome smoke tests passed nested route handling, a keyboard-only session, reduced motion, summaries, and tablet/mobile overflow checks with no runtime/console errors. Axe reported no WCAG-tagged violations across main pages, card faces, and populated mobile statistics. Card-front contrast was incomplete automatically; reviewing its CSS text/background pairs gave ratios of at least 5.71:1. Final browser zoom testing was not repeated; earlier-phase verification is not a substitute for the remaining manual release checks.
- With 5,000 attempts, 500 sessions, and approximately 876 mistake patterns, statistics loaded in about 1.25 seconds with 4× CPU throttling (navigation/rendering including polling). View filters and the 20-session list worked. A browser storage write under throttling took about 40 ms. This is a synthetic check, not a physical-device benchmark.
- Existing coverage was reused. Five focused tests add complete mixed-operation sessions at all four difficulties using real generators and a 5,010-attempt storage round trip, including session retention, repaired counters, lifetime totals, and mistake counts.
- Storage normalization previously scanned all attempts for each session. Grouping by session reduced measured 5,000-attempt/500-session normalization from approximately 52–79 ms to 9–25 ms locally. Serialization plus normalization fell from approximately 33–48 ms to 15–24 ms (in-memory storage adapter; browser writes measured separately). These are observational timings, not test thresholds.
- Mistake statistics and sorted patterns are memoized across view changes. Overall totals are already derived on data changes, and question generation already happens in event handlers. Checkpoint saves intentionally update shared state and storage for recovery; no broad Context refactor was needed.
- The production JavaScript bundle is approximately 377 KB raw / 116 KB gzip; CSS is 12 KB raw / 3 KB gzip. Only React, React DOM, and React Router are runtime dependencies. Pages remain eagerly loaded: no measured loading problem justified additional splitting. Fonts are system fonts and there are no image assets to optimize.

Sound effects and step-by-step explanations remain visibly unavailable optional settings. No missing critical MVP functionality was found. Negative subtraction, remainders, accounts, and cloud synchronization are outside the initial release.

## Manual checks still required

Use a real screen reader to verify question, answer, progress, and dialog announcements. Confirm contrast where automated checks cannot resolve transformed card layers. Test Safari, Firefox, Edge, physical touch devices, and larger operating-system fonts. Emulation and automated checks do not establish full WCAG conformance. Hosted routing, persistence, responsive behavior, and console checks must be repeated after deployment.

## Project structure

`src/app` contains routing and providers; `src/pages` contains screens; `src/components` contains cards, selectors, layout, and statistics; `src/services` contains generators, persistence, recovery, and calculations. Shared models are in `src/types`; styles in `src/styles`; test helpers in `src/test`. Unit and component tests live beside their implementation. Vitest uses React Testing Library and jsdom.
