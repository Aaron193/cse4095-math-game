# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Phases 1–3 are complete: shared layout/navigation, a home page, practice configuration, six routes, shared types, and development tooling. Practice Setup provides operation, difficulty, and length selectors with accessible validation. Start Session opens a placeholder displaying the selected choices. Session Summary, Statistics, and Settings remain placeholders. Question generation, flashcards, session progress, persistence, statistics calculations, and settings behavior are not implemented.

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

Phase 3 verification: `npm test` passed all 37 tests (22 setup/configuration tests and 15 earlier shell/navigation tests); `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, and `npm run build` passed.

Tests cover all selectors, repeated Select All, multiple operation choices, exclusive difficulty/length choices, the 10-question default, native keyboard interactions, invalid submission, configuration handoff for each length, returning to setup, missing configuration, and existing navigation. The former setup-placeholder assertion now checks the functional setup page.

Chrome verification passed at 1280, 768, 375, and 320 pixels wide, with no horizontal overflow and choice targets at least 48 pixels high. Desktop/mobile screenshots were visually inspected. Browser checks covered validation, Select All, radio exclusivity, configuration transfer without reloading, return-to-setup choices, Tab/Space/arrow keys, Enter submission, visible focus, and the safe state after refresh. No runtime or console errors were reported. Other browsers and screen readers have not been tested.

### Practice configuration design

Each reusable selector is a controlled component using native checkboxes or radio buttons, grouped by fieldsets and legends. Descriptions follow specification section 7. Selections are visible through the native checkmark/radio indicator as well as color. Feedback is announced through a status region and describes why Start Session is disabled.

The setup page keeps draft choices in React state. Initially no operation or difficulty is selected, and length defaults to 10 questions. Submitting valid choices stores a `PracticeConfiguration` in a small React Context and navigates to `/practice/session`. This type uses `Pick<PracticeSession, 'operations' | 'difficulty' | 'sessionLength'>`, reusing the existing model instead of duplicating its fields. The session placeholder reads the same Context; returning to setup restores the last submitted choices.

Configuration is held in memory only. Refreshing or reopening clears it; a direct session visit without configuration explains what to do and links to setup. Draft changes that have not been submitted are not retained after leaving setup. Saved settings, session recovery, and localStorage belong to later phases. No session or question is generated in Phase 3.

### Manual interface check

1. Run `npm run dev`, open the printed URL, and select **Start Practice**.
2. Check all four operations, four difficulty descriptions, and four lengths. **10 questions** should be selected, and **Start Session** disabled.
3. Select a difficulty alone: Start Session remains disabled. Select an operation: it becomes enabled. Clear the last operation: it becomes disabled and feedback explains why.
4. Select multiple operations, then try **Select All**. Toggle individual operations. Try every difficulty and length; each radio group should have at most one selection.
5. Pick operations, difficulty, and length, then select **Start Session**. The session placeholder should display those exact choices. Use **Change practice choices** to return and confirm they are restored.
6. Refresh the session page: it should show the missing-configuration explanation and a setup link.
7. Use Tab/Space for checkboxes, arrow keys for radio options, and Enter on Start Session. Check the visible focus indicators.
8. Resize to desktop, tablet, and mobile widths, including 320 pixels. Choices should stack on small screens without horizontal scrolling.
9. Check Home, Statistics, Settings, browser Back/Forward, and the unknown-route fallback still work.

## Structure

```text
src/
  app/          Routes, configuration Context/provider, and navigation tests
  components/   Shared layout and reusable practice selectors/options
  pages/        Home, practice setup/tests, session preview, other placeholders, and fallback
  styles/       Global CSS and practice setup styles
  test/         Shared test setup and DOM cleanup
  types/        Shared question, attempt/session, mistake, statistics, and settings models
  main.tsx      React entry point and BrowserRouter
```

Shared models follow specification sections 8 and 10. Settings fields represent the preferences in section 6.7; they define data only and do not implement settings behavior. Session lengths retain the specification’s `number | "continuous"` type; the setup form limits choices to 5, 10, 20, or continuous. General storage/session validation belongs to later phases. Add feature modules and storage helpers when their phases require them. The repository root contains Vite, TypeScript, and lint configuration, the npm lockfile, and project documentation.

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
