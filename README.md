# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Phases 1–7 are complete: shared layout/navigation, practice setup, validated math/multiple-choice generation, interactive cards, and functional practice sessions. Sessions support 5, 10, 20, or continuous questions, self-reported results, live totals, accessible progress, and a simple completion message. Results remain in React state only. The detailed Session Summary page, persistent history, aggregate statistics, mistake tracking, and full Settings page belong to later phases.

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

Phase 7 verification: `npm test` passed all 295 tests in 15 files, including 33 new session tests; `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, and `npm run build` passed.

Tests cover all selectors, repeated Select All, multiple operation choices, exclusive difficulty/length choices, the 10-question default, native keyboard interactions, invalid submission, configuration handoff for each length, returning to setup, missing configuration, and existing navigation. The former setup-placeholder assertion now checks the functional setup page.

During Phase 3, Chrome verification passed at 1280, 768, 375, and 320 pixels wide, with no horizontal overflow and choice targets at least 48 pixels high. Desktop/mobile screenshots were visually inspected. Browser checks covered validation, Select All, radio exclusivity, configuration transfer without reloading, return-to-setup choices, Tab/Space/arrow keys, Enter submission, visible focus, and the safe state after refresh. No runtime or console errors were reported. No new browser checks were performed for Phases 4–5 because the interface was unchanged; existing component/navigation tests still pass. Other browsers and screen readers have not been tested.

### Practice configuration design

Each reusable selector is a controlled component using native checkboxes or radio buttons, grouped by fieldsets and legends. Descriptions follow specification section 7. Selections are visible through the native checkmark/radio indicator as well as color. Feedback is announced through a status region and describes why Start Session is disabled.

The setup page keeps draft choices in React state. Initially no operation or difficulty is selected, and length defaults to 10 questions. Submitting valid choices stores a `PracticeConfiguration` in a small React Context and navigates to `/practice/session`. This type uses `Pick<PracticeSession, 'operations' | 'difficulty' | 'sessionLength'>`, reusing the existing model instead of duplicating its fields. Submitting setup now also explicitly starts a session. Its separate Context stores a snapshot of those choices; returning to setup restores the last submitted choices.

Configuration is held in memory only. Refreshing or reopening clears it; a direct session visit without valid session data redirects to setup. Draft changes that have not been submitted are not retained after leaving setup. Saved settings, session recovery, and localStorage belong to later phases. No session or question is generated in Phase 3.

### Manual interface check

1. Run `npm run dev`, open the printed URL, and select **Start Practice**.
2. Check all four operations, four difficulty descriptions, and four lengths. **10 questions** should be selected, and **Start Session** disabled.
3. Select a difficulty alone: Start Session remains disabled. Select an operation: it becomes enabled. Clear the last operation: it becomes disabled and feedback explains why.
4. Select multiple operations, then try **Select All**. Toggle individual operations. Try every difficulty and length; each radio group should have at most one selection.
5. Pick operations, difficulty, and length, then select **Start Session**. The session page should display those exact choices, zero totals, a generated card, and fixed progress when applicable. Use **Change practice choices** to return and confirm they are restored.
6. Refresh the session page: it should redirect to setup because session recovery is a later phase.
7. Use Tab/Space for checkboxes, arrow keys for radio options, and Enter on Start Session. Check the visible focus indicators.
8. Resize to desktop, tablet, and mobile widths, including 320 pixels. Choices should stack on small screens without horizontal scrolling.
9. Check Home, Statistics, Settings, browser Back/Forward, and the unknown-route fallback still work.

## Arithmetic generation (Phase 4)

```ts
import { generateQuestion } from './src/services/questionGenerator'

const addition = generateQuestion('addition', 1)
const mixed = generateQuestion(['addition', 'division'], 3)
```

`generateQuestion` still returns `ArithmeticQuestion = Omit<Question, 'choices'>`. The existing arithmetic API and tests remain unchanged. The Phase 5 `generateMultipleChoiceQuestion` API completes this data with real choices and returns the existing `Question` interface.

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

`validateArithmeticQuestion(value, existingIds?)` checks supported operations/levels, nonnegative safe-integer operands, exact arithmetic, difficulty ranges, whole-number division, matching question text, nonempty IDs, and basic source metadata. A supplied `ReadonlySet` detects duplicate IDs without mutating the set. Callers managing a question history can add each accepted ID themselves. The Phase 5 `validateQuestion` validator also checks the completed answer choices, as described below.

`createQuestionId` uses `crypto.randomUUID()` for UUIDs across page reloads; HTTPS or localhost is required. It throws a descriptive error if secure UUID generation is unavailable. Invalid ranges, random samples, operations, difficulties, and empty selections throw explicit errors. The unified generator validates its output before returning it and wraps unexpected failures in an error retaining the original `cause`; retry/fallback behavior is deferred to the later error-handling phase.

### Generation verification

Tests include 4,000 seeded generated questions covering all 16 operation/difficulty combinations, 500 mixed-operation samples, deterministic minimum/maximum boundaries, carrying/borrowing cases, both multiplication digit forms, invalid inputs, malformed questions, zero/fractional division, supplied duplicate IDs, 1,000 UUID calls, and unavailable secure-ID handling. Randomized checks assert invariants without requiring a particular result to appear.

Examples produced in deterministic tests: `58 + 67 = 125`, `52 − 27 = 25`, `8 × 7 = 56`, and `144 ÷ 1 = 144`.

## Multiple-choice generation (Phase 5)

```ts
import { generateMultipleChoiceQuestion } from './src/services/questionGenerator'
import { withAnswerChoices } from './src/services/answerChoices'

const question = generateMultipleChoiceQuestion('multiplication', 2)
const mixed = generateMultipleChoiceQuestion(['addition', 'division'], 3)
// Existing arithmetic generators remain usable:
const completed = withAnswerChoices(addition)
```

Here `addition` is the arithmetic question from the earlier example. `withAnswerChoices` returns a new complete question, preserving its ID, operands, difficulty, source, and optional mistake-pattern metadata. It does not modify the input. The session service uses this complete-question API for every new card.

### Distractor strategies and termination

`generateDistractors` returns three unique incorrect numbers. Addition uses nearby sums and missed-carry errors; subtraction uses nearby differences and missed-borrow errors; multiplication uses neighboring multiplication facts, an addition-instead-of-multiplication error, and nearby products. Division uses related facts from neighboring divisors and nearby quotients, discarding fractional values.

All candidates are filtered to exclude the correct answer, duplicates, negatives, unsafe/noninteger numbers, and values above the operation/difficulty answer ceiling. Those ceilings reuse `questionRules.ts`: twice the operand maximum for addition, the operand maximum for subtraction, the maximum factor product for multiplication, and the permitted quotient maximum for division (also constrained by its divisor and dividend cap).

Candidate sampling stops after `MAX_DISTRACTOR_ATTEMPTS` (24 draws). If fewer than three distinct distractors are available from those draws, a deterministic fallback checks the three nearest distances below/above the answer. The existing answer domains always contain at least four possible integers, so this bounded fallback supplies enough alternatives even for zero or the maximum answer. Invalid random samples still throw rather than silently masking an invalid random source.

### Shuffling and complete validation

The correct answer and three distractors are passed to the existing Fisher–Yates `shuffleArray` utility. With the normal random source, the correct answer has no fixed position; tests deliberately exercise all four positions without relying on chance. A particular shuffle is allowed to leave its initial ordering unchanged.

`validateQuestion(value, existingIds?)` first applies all arithmetic validation and then requires exactly four unique, nonnegative safe integers within the choice ceiling, with the correct answer present exactly once. Missing values, sparse arrays, fractional choices, duplicates, and invalid arithmetic are rejected. The completed question is validated before being returned. The new generator retains unexpected choice-generation failures as the error `cause`; invalid data is never returned as a successful question.

### Verified examples and tests

These complete examples are produced by deterministic tests. Production order and distractors vary.

| Question   | Choices        | Correct answer |
| ---------- | -------------- | -------------- |
| 7 + 8 = ?  | 5, 14, 16, 15  | 15             |
| 15 − 7 = ? | 18, 7, 9, 8    | 8              |
| 8 × 7 = ?  | 48, 55, 57, 56 | 56             |
| 56 ÷ 7 = ? | 7, 9, 6, 8     | 8              |

The new tests cover operation-specific mistakes, zeros/ones and maximum answers, repeated/unusable random draws, bounded fallback, immutable completion, every correct-answer position, malformed choices, arithmetic/difficulty preservation, error handling, and compatibility with every existing generator. Repeated checks generate 4,000 seeded complete questions across all 16 operation/difficulty combinations and 200 mixed questions with default randomness. Assertions check invariants rather than expecting a rare random arrangement to appear.

## Interactive question cards (Phase 6)

`AnswerChoice`, `CardFront`, and `CardBack` are small presentation components. `QuestionCard` owns selection and flip state, accepts a completed `Question`, displays question number/length (including continuous mode), and calls `onResult(selfReportedCorrect, selectedAnswer)` at most once. A synchronous ref guard plus disabled buttons prevents both responses or repeated clicks from invoking it twice. A new question ID remounts the interaction to reset selection, flip state, and callback lock; rerendering the same question preserves them.

The two faces share a CSS grid area and use a 550ms 3D rotation with hidden back faces. Native answer buttons show a selected marker and `aria-pressed`. The inactive face is `aria-hidden`, inert, and disabled. Flip remains disabled until an answer is selected. Revealing locks the answer, focuses the reveal heading, and announces both answers. Tab, Space, and Enter use native behavior; number-key shortcuts belong to a later accessibility phase.

**Show card animation** remains a local control typed from `AppSettings.cardAnimationEnabled`. Disabling it or requesting reduced motion removes motion without preventing answer reveal. Persistent settings remain deferred. The standalone Phase 6 `QuestionCardPreview` and its tests remain available for isolated component verification; the application route now uses the functional session flow below.

## Practice sessions (Phase 7)

### State and lifecycle

`PracticeSessionProvider` owns the `usePracticeSession` hook above the routes, retaining the current session across client navigation. The typed state reuses `PracticeSession`, `PracticeAttempt`, `Question`, and `PracticeConfiguration`, adding the current question index, active flag, current question, attempts, and a recoverable loading error. No data is written to localStorage or a server.

Only a valid **Start Session** submission creates a session, UUID, start timestamp, copied configuration, and first question. Rendering, navigating back, toggling animation, or returning to a completed session cannot implicitly start another one. Submitting setup again intentionally replaces the previous session. Refreshing/reopening loses all in-memory results and redirects session URLs to setup. Only the current session is retained; multi-session history is a later feature.

### Attempts and progression

The card enforces selection and flipping before its callback. The session transition additionally checks that the callback question ID matches the current question, has not already been recorded, and contains an allowed selected answer. The hook updates a synchronous ref alongside React state so duplicate callbacks within one React batch also see the latest state. Timestamps, IDs, random generation, and transitions run in explicit event handlers, outside render and state-updater functions.

Each accepted result creates a complete `PracticeAttempt`, increments attempted and the self-reported correct/incorrect count, and loads the next question. A student marking an actually incorrect selection as right still counts as right, as the specification requires self-reporting. The next card's new ID resets answer/flip state. Focus moves to the session heading for the next question, and a live region announces progress and totals.

The next-question helper tries at most eight candidate draws to avoid an immediately identical operation/operand expression, ignoring choice order and UUID differences. A stuck random source may still produce a repeated expression after that bounded limit; it cannot hang the session. Already-used question IDs are rejected. If generation fails, the accepted attempt and totals remain recorded; retry loads the missing question without recording another attempt. The error screen also offers **End Session**.

### Progress and completion

`SessionProgress` displays attempted, correct, and incorrect totals. Fixed sessions show a labeled native progress bar from 0 to the selected count; continuous sessions show current question number and totals without fixed progress. At 5, 10, or 20 accepted answers, the session becomes inactive, records its completion timestamp, removes the card, and stops requesting questions. A simple completion message and totals are shown on the same route; the detailed Phase 8 summary page remains a placeholder.

Continuous practice keeps generating questions until **End Session** is confirmed using the browser's native confirmation dialog. Cancel leaves the session unchanged. Confirm clears the unfinished card without counting it and displays an end message with completed-answer totals. Ending a session twice or responding after it ended cannot change its counts.

New questions have a short 150ms fade, disabled by the animation control and reduced-motion CSS. The existing card animation remains unchanged. Responsive totals stack on very narrow screens so labels stay readable.

### Verification

The 33 new tests cover configuration validation, session creation and IDs, typed attempts, true/false self-reporting, duplicate/stale callbacks including same-batch calls, all three finite lengths, continuous practice beyond 20 questions, ending before any answer, repeat avoidance and its bound, initial/subsequent generation failure and retry, actual card resets, accessible progress, completion/re-entry, explicit restart, and cancel/confirm ending. Existing tests pass; two missing-session expectations were updated from the former placeholder to the required setup redirect. The Phase 6 card and preview tests were retained.

Chrome completed a real five-question session with three right and two wrong self-reports, verified every progress update and card reset, and confirmed completion remained stable after leaving and returning. Continuous practice was checked with both native-dialog cancel and confirm, unchanged counts for the discarded card, no fixed progress bar, no localStorage writes, and a safe redirect after full page reload. Desktop/tablet/mobile widths of 1280, 768, 375, and 320 pixels had no horizontal overflow. Desktop/mobile screenshots and the narrow-screen completion view were visually inspected. No runtime or console errors appeared on the final run. The temporary browser script needed a quoted numeric selector and boolean DOM check; those automation issues were corrected before the successful final run.

### Manual verification

1. Run `npm run dev`, open the printed URL, and select operations, difficulty, and **5 questions** in setup.
2. Start Session. Confirm all totals are zero, the card says **Question 1 of 5**, and progress starts at 0 of 5.
3. Select an answer, flip, and mark it right or wrong. Confirm one attempt is added, the matching total increases, and the next card has no selected answer and a disabled Flip Card button.
4. Complete five questions, reporting three right and two wrong. Confirm totals are **5 attempted / 3 correct / 2 incorrect**, progress is full, and no new card appears. Repeat with 10 or 20 questions if desired.
5. Go home and use browser Back to return to the completed session. Confirm it stays completed. Use setup and **Start Session** to intentionally start a fresh session.
6. Start continuous practice. Complete a few questions, select **End Session**, and cancel: the session should continue unchanged. End again and confirm: only completed questions should appear in the totals.
7. Test keyboard controls, animation on/off, reduced motion, and mobile widths. Refreshing clears the React-only session and returns to setup, as expected before persistence/recovery are implemented.

## Structure

```text
src/
  app/          Routes, configuration/session providers, and navigation tests
  components/   Layout, selectors, cards, session content/progress, preview, and tests
  hooks/        Session state/transition hook and tests
  pages/        Home, setup/session pages and tests, other placeholders, and fallback
  services/     Generators, distractors, rules, session transitions, and unit tests
  styles/       Global, setup, card, and responsive session/progress styles
  test/         Shared test setup and DOM cleanup
  types/        Shared question, attempt/session, mistake, statistics, and settings models
  utils/        Random integers, shuffling, IDs, arithmetic validation, and unit tests
  main.tsx      React entry point and BrowserRouter
```

Shared models follow specification sections 8 and 10. Settings fields represent the preferences in section 6.7; they define data only and do not implement settings behavior. Session lengths retain the specification’s `number | "continuous"` type; the setup form limits choices to 5, 10, 20, or continuous. Session configuration is validated at session creation; persisted-data validation belongs to later phases. Add feature modules and storage helpers when their phases require them. The repository root contains Vite, TypeScript, and lint configuration, the npm lockfile, and project documentation.

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
