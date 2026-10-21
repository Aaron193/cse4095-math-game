# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Phase 1 setup is complete: a responsive application shell, a routed home page, an unknown-route fallback, shared TypeScript models, ESLint/Prettier tooling, and automated tests. Question generation, flashcards, sessions, storage, statistics, and settings are planned and are not implemented.

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

Phase 1 alignment verification: `npm test` passed all 3 component tests; `npm run typecheck`, `npm run lint` (ESLint, zero warnings), `npm run format:check`, and `npm run build` passed. A development-server HTTP smoke check passed for the app HTML, transformed React entry point, and App module on an automatically assigned free port. Visual browser checks have not been performed. Follow the URL printed by Vite when starting the app.

Tests cover the home shell, navigation home from an unknown URL, and keyboard access to the skip link. jsdom tests do not verify visual layout in a real browser. For a manual check, open the home page, resize the window, press Tab to see the skip link, and visit `/missing-page` and follow “Back to home”.

## Structure

```text
src/
  app/          Route definitions and application integration tests
  components/   Shared application layout
  pages/        Home and not-found pages
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
