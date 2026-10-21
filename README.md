# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Phases 1–4 are complete: shared layout/navigation, a home page, practice configuration, six routes, shared types, and development tooling. Practice Setup provides operation, difficulty, and length selectors with accessible validation. Start Session opens a placeholder displaying the selected choices. Session Summary, Statistics, and Settings remain placeholders. Background arithmetic generation is implemented and tested. Answer choices, flashcards, session progress, persistence, statistics calculations, and settings behavior are not implemented. The Practice Session page still displays only the selected configuration.

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

Phase 4 verification: `npm test` passed all 178 tests in 7 files, including all 37 earlier setup/navigation tests; `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, and `npm run build` passed.

Tests cover all selectors, repeated Select All, multiple operation choices, exclusive difficulty/length choices, the 10-question default, native keyboard interactions, invalid submission, configuration handoff for each length, returning to setup, missing configuration, and existing navigation. The former setup-placeholder assertion now checks the functional setup page.

During Phase 3, Chrome verification passed at 1280, 768, 375, and 320 pixels wide, with no horizontal overflow and choice targets at least 48 pixels high. Desktop/mobile screenshots were visually inspected. Browser checks covered validation, Select All, radio exclusivity, configuration transfer without reloading, return-to-setup choices, Tab/Space/arrow keys, Enter submission, visible focus, and the safe state after refresh. No runtime or console errors were reported. No new browser checks were needed for Phase 4 because the interface was unchanged. Other browsers and screen readers have not been tested.

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

## Arithmetic generation (Phase 4)

```ts
import { generateQuestion } from './src/services/questionGenerator'

const addition = generateQuestion('addition', 1)
const mixed = generateQuestion(['addition', 'division'], 3)
```

`generateQuestion` returns `ArithmeticQuestion = Omit<Question, 'choices'>`. The complete `Question` interface is unchanged; no fake choices are created. In Phase 5, distractor generation and shuffling will extend this arithmetic data with real `choices`, returning a full `Question`, and add choice validation. The shuffle utility is tested now but does not generate choices.

The four operation-specific functions in `arithmeticGenerators.ts` also accept a difficulty level. Generators, random integers, shuffling, and operation selection accept an optional random-source function for reproducible tests; production defaults to `Math.random`. Mixed selection samples distinct chosen operations uniformly without mutating the input.

### Difficulty rules and implementation decisions

| Level        | Addition/subtraction operands | Multiplication factors | Division                           |
| ------------ | ----------------------------- | ---------------------- | ---------------------------------- |
| Beginner     | 0–10                          | 0–5 × 0–5              | Divisor 1–5, quotient 0–5          |
| Easy         | 0–50                          | 0–10 × 0–10            | Divisor 1–10, quotient 0–10        |
| Intermediate | 0–100                         | 0–9 × 0–99             | Divisor 1–12, dividend at most 144 |
| Advanced     | 0–1,000                       | 10–99 × 0–99           | Divisor 1–99, quotient 0–99        |

All bounds are inclusive. The first multiplication factor enforces the required digit count; the second range includes both specified one-digit/two-digit forms. Advanced addition/subtraction allow the complete nonnegative range up to 1,000, including multi-digit operands. Intermediate addition/subtraction can require carrying/borrowing; tests demonstrate those cases without requiring every generated question to have them.

The specification does not fix Beginner/Easy quotient limits or an Advanced division cap. This implementation chooses quotients 0–5 and 0–10 respectively, and Advanced quotients 0–99 with divisors 1–99 (maximum dividend 9,801). Intermediate quotients are selected from 0 through `floor(144 / divisor)`, so the dividend never exceeds 144. These choices live in `questionRules.ts` and can be adjusted later without changing the specification.

Subtraction sorts the operands to prevent negative results at every level. Division generates the divisor and whole-number quotient first, then multiplies to obtain the dividend; zero divisors and fractional answers cannot be produced through those ranges. Addition has maximum answers 20 and 100 at the first two levels.

### Validation, IDs, and errors

`validateArithmeticQuestion(value, existingIds?)` checks supported operations/levels, nonnegative safe-integer operands, exact arithmetic, difficulty ranges, whole-number division, matching question text, nonempty IDs, and basic source metadata. A supplied `ReadonlySet` detects duplicate IDs without mutating the set. Callers managing a question history can add each accepted ID themselves. Answer-choice validation is intentionally deferred to Phase 5.

`createQuestionId` uses `crypto.randomUUID()` for UUIDs across page reloads; HTTPS or localhost is required. It throws a descriptive error if secure UUID generation is unavailable. Invalid ranges, random samples, operations, difficulties, and empty selections throw explicit errors. The unified generator validates its output before returning it and wraps unexpected failures in an error retaining the original `cause`; retry/fallback behavior is deferred to the later error-handling phase.

### Generation verification

Tests include 4,000 seeded generated questions covering all 16 operation/difficulty combinations, 500 mixed-operation samples, deterministic minimum/maximum boundaries, carrying/borrowing cases, both multiplication digit forms, invalid inputs, malformed questions, zero/fractional division, supplied duplicate IDs, 1,000 UUID calls, and unavailable secure-ID handling. Randomized checks assert invariants without requiring a particular result to appear.

Examples produced in deterministic tests: `58 + 67 = 125`, `52 − 27 = 25`, `8 × 7 = 56`, and `144 ÷ 1 = 144`.

## Structure

```text
src/
  app/          Routes, configuration Context/provider, and navigation tests
  components/   Shared layout and reusable practice selectors/options
  pages/        Home, practice setup/tests, session preview, other placeholders, and fallback
  services/     Arithmetic generators, difficulty rules, unified API, and unit tests
  styles/       Global CSS and practice setup styles
  test/         Shared test setup and DOM cleanup
  types/        Shared question, attempt/session, mistake, statistics, and settings models
  utils/        Random integers, shuffling, IDs, arithmetic validation, and unit tests
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
