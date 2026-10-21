# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Initial setup only: a responsive application shell, a routed home page, an unknown-route fallback, and automated tests. Question generation, flashcards, sessions, storage, statistics, and settings are planned and are not implemented.

## Technology

React, TypeScript, Vite, React Router (declarative routing), and plain CSS. Tests use Vitest, React Testing Library, jest-dom, user-event, and jsdom. Oxlint provides lint checks. Future persistence will use browser localStorage; no backend, database, authentication, or registration is required.

## Run locally

Use Node.js 22.12 or newer on the Node 22 line, or a supported newer LTS release, with npm. Initial verification uses Node 22.21.1.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). Stop the server with Ctrl+C.

## Checks

```sh
npm test               # Run tests once
npm run test:watch     # Watch tests during development
npm run lint          # Check source with Oxlint
npm run build         # Type-check and produce dist/
npm run preview       # Serve the production build locally
```

Initial setup verification: 3 tests passed, lint passed, and the production build passed including strict TypeScript checks. A development-server HTTP smoke check passed for the app HTML and transformed React entry point. Port 5173 was occupied during verification, so the smoke check used an automatically assigned free port. Vite normally selects the next available port; follow its printed URL.

Tests cover the home shell, navigation home from an unknown URL, and keyboard access to the skip link. jsdom tests do not verify visual layout in a real browser. For a manual check, open the home page, resize the window, press Tab to see the skip link, and visit `/missing-page` and follow “Back to home”.

## Structure

```text
src/
  app/          Route definitions and application integration tests
  components/   Shared application layout
  pages/        Home and not-found pages
  styles/       Global CSS
  test/         Shared test setup and DOM cleanup
  main.tsx      React entry point and BrowserRouter
```

Add feature modules, shared types, and storage helpers when their phases require them. The repository root contains Vite, TypeScript, and lint configuration, the npm lockfile, and project documentation.

## Requirements and workflow

See [specification.md](specification.md) for requirements and [TODO.md](TODO.md) for the phased plan. Each phase includes explanation, focused implementation, appropriate tests, checks, documentation, a suggested commit, and a pause for the next instruction. Keep prompts, debugging decisions, test output, and milestone commits as evidence for the final 2–3 page development report. Do not commit private information in interaction records.

Deployment is a later phase. The production output is static files in `dist/`. A host using BrowserRouter must rewrite application URLs to `index.html` for direct links and refreshes. No deployment or GitHub push has been performed during setup.

## Official references

- [Vite guide](https://vite.dev/guide/)
- [React Router declarative setup](https://reactrouter.com/start/declarative/installation)
- [Vitest guide](https://vitest.dev/guide/)
