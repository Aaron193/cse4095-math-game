# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Phases 1 and 2 are complete: shared page layout and header navigation, a welcoming home page with three navigation actions, six application routes, a not-found fallback, shared TypeScript models, and development tooling. Practice Setup, Practice Session, Session Summary, Statistics, and Settings currently show descriptive placeholders with a way home. Question generation, flashcards, session behavior, storage, statistics calculations, and settings behavior are not implemented.

## Technology

React, TypeScript, Vite, React Router (declarative routing), and plain CSS. Tests use Vitest, React Testing Library, jest-dom, user-event, and jsdom. ESLint provides JavaScript/TypeScript and React checks; Prettier provides consistent formatting. Future persistence will use browser localStorage; no backend, database, authentication, or registration is required.

## Run locally

Use Node.js 22.13 or newer on the Node 22 line, or a supported newer LTS release, with npm. Initial verification uses Node 22.21.1.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). Stop the server with Ctrl+C.

## Checks

```sh
npm test               # Run tests once
npm run test:watch     # Watch tests during development
npm run typecheck     # Check application and tool configuration types
npm run lint          # Check source with ESLint
npm run format        # Apply Prettier formatting
npm run format:check  # Verify formatting without changing files
npm run build         # Type-check and produce dist/
npm run preview       # Serve the production build locally
```

Phase 2 verification: `npm test` passed all 15 tests, including the original three Phase 1 tests; `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, and `npm run build` passed.

Tests cover the shell, skip-link keyboard access, all three home actions by click and keyboard, all five placeholder routes and their home links, header navigation/current-page state, and unknown-route recovery. All pages use the existing nested React Router layout. Navigation actions are links styled as buttons, preserving link semantics and client navigation. The five unfinished pages reuse one placeholder component to keep this phase small.

Chrome browser verification passed at 1280, 768, 375, and 320 pixels wide with no horizontal overflow and home action targets at least 48 pixels high. Desktop and mobile screenshots were visually inspected. Real Tab/Enter activation, visible focus, navigation without a document reload, browser Back/Forward, direct visits, refresh, and return-home navigation were checked. No runtime or console errors were reported. These checks cover Chrome, not all supported browsers.

### Manual interface check

1. Run `npm run dev` and open the URL Vite prints.
2. At `/`, select **Start Practice**, **View Statistics**, and **Settings**, returning home between each. Check their headings and placeholder messages.
3. Use the header links to move between Home, Practice, Statistics, and Settings. Check the current navigation item is highlighted.
4. Directly open and refresh `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`. Each should show its placeholder and **Back to home** link.
5. Visit `/unknown-page` and use **Back to home**. Try the browser Back and Forward buttons.
6. Reload home, press Tab to reveal the skip link, then use Tab and Enter to reach and open each home action. Check focus is clearly visible.
7. Resize to tablet/mobile widths (including 320 pixels). Home actions should stack, navigation should wrap, and text should remain readable without horizontal scrolling.

## Structure

```text
src/
  app/          Route definitions and application integration tests
  components/   Existing layout plus layout/Header, Navigation, and PageContainer
  pages/        Home, reusable placeholder, and not-found pages
  styles/       Global CSS
  test/         Shared test setup and DOM cleanup
  types/        Shared question, attempt/session, mistake, statistics, and settings models
  main.tsx      React entry point and BrowserRouter
```

Shared models follow specification sections 8 and 10. Settings fields represent the preferences in section 6.7; they define data only and do not implement settings behavior. Session lengths retain the specification’s `number | "continuous"` type; allowed values and other runtime validation belong to later phases. Add feature modules and storage helpers when their phases require them. The repository root contains Vite, TypeScript, and lint configuration, the npm lockfile, and project documentation.

Prettier excludes the authoritative `specification.md` and `TODO.md` so routine formatting preserves those reference documents. ESLint and Prettier run separately; `eslint-config-prettier` disables conflicting style rules.

## Requirements and workflow

See [specification.md](specification.md) for requirements and [TODO.md](TODO.md) for the phased plan. Each phase includes explanation, focused implementation, appropriate tests, checks, documentation, a suggested commit, and a pause for the next instruction. Keep prompts, debugging decisions, test output, and milestone commits as evidence for the final 2–3 page development report. Do not commit private information in interaction records.

Deployment is a later phase. The production output is static files in `dist/`. A host using BrowserRouter must rewrite application URLs to `index.html` for direct links and refreshes. No deployment or GitHub push has been performed during setup.

## Official references

- [Vite guide](https://vite.dev/guide/)
- [React Router declarative setup](https://reactrouter.com/start/declarative/installation)
- [Vitest guide](https://vitest.dev/guide/)
- [TypeScript ESLint setup](https://typescript-eslint.io/getting-started/)
- [Prettier configuration](https://prettier.io/docs/configuration)
