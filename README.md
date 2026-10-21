# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds one approved phase at a time with AI assistance.

## Current status

Phases 1–6 are complete: shared layout/navigation, a home page, practice configuration, six routes, shared types, and development tooling. Practice Setup provides operation, difficulty, and length selectors with accessible validation. Start Session opens the selected configuration and a single interactive question-card preview. Session Summary, Statistics, and Settings remain placeholders. Background arithmetic and multiple-choice generation are implemented and tested. Question cards support answer selection, flipping, and one self-report callback per question. Session progression, scoring, persistence, statistics calculations, and the full settings page remain unimplemented.

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

Phase 6 verification: `npm test` passed all 262 tests in 12 files: 13 new card/preview tests and all 249 earlier tests; `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, and `npm run build` passed.

Tests cover all selectors, repeated Select All, multiple operation choices, exclusive difficulty/length choices, the 10-question default, native keyboard interactions, invalid submission, configuration handoff for each length, returning to setup, missing configuration, and existing navigation. The former setup-placeholder assertion now checks the functional setup page.

During Phase 3, Chrome verification passed at 1280, 768, 375, and 320 pixels wide, with no horizontal overflow and choice targets at least 48 pixels high. Desktop/mobile screenshots were visually inspected. Browser checks covered validation, Select All, radio exclusivity, configuration transfer without reloading, return-to-setup choices, Tab/Space/arrow keys, Enter submission, visible focus, and the safe state after refresh. No runtime or console errors were reported. No new browser checks were performed for Phases 4–5 because the interface was unchanged; existing component/navigation tests still pass. Other browsers and screen readers have not been tested.

### Practice configuration design

Each reusable selector is a controlled component using native checkboxes or radio buttons, grouped by fieldsets and legends. Descriptions follow specification section 7. Selections are visible through the native checkmark/radio indicator as well as color. Feedback is announced through a status region and describes why Start Session is disabled.

The setup page keeps draft choices in React state. Initially no operation or difficulty is selected, and length defaults to 10 questions. Submitting valid choices stores a `PracticeConfiguration` in a small React Context and navigates to `/practice/session`. This type uses `Pick<PracticeSession, 'operations' | 'difficulty' | 'sessionLength'>`, reusing the existing model instead of duplicating its fields. The session page and preview read the same Context; returning to setup restores the last submitted choices.

Configuration is held in memory only. Refreshing or reopening clears it; a direct session visit without configuration explains what to do and links to setup. Draft changes that have not been submitted are not retained after leaving setup. Saved settings, session recovery, and localStorage belong to later phases. No session or question is generated in Phase 3.

### Manual interface check

1. Run `npm run dev`, open the printed URL, and select **Start Practice**.
2. Check all four operations, four difficulty descriptions, and four lengths. **10 questions** should be selected, and **Start Session** disabled.
3. Select a difficulty alone: Start Session remains disabled. Select an operation: it becomes enabled. Clear the last operation: it becomes disabled and feedback explains why.
4. Select multiple operations, then try **Select All**. Toggle individual operations. Try every difficulty and length; each radio group should have at most one selection.
5. Pick operations, difficulty, and length, then select **Start Session**. The session page should display those exact choices and one generated preview card. Use **Change practice choices** to return and confirm they are restored.
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

Here `addition` is the arithmetic question from the earlier example. `withAnswerChoices` returns a new complete question, preserving its ID, operands, difficulty, source, and optional mistake-pattern metadata. It does not modify the input. The Phase 6 preview uses this complete-question API while keeping session progression deferred.

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

The session page now demonstrates one generated card using the submitted operations and difficulty. `QuestionCardPreview` generates a question during state initialization, so selecting an answer, toggling animation, or invoking a result callback does not replace the question. React Strict Mode may invoke initializers twice in development; only one question is committed to the preview. If generation fails, a friendly message appears and the existing setup/home links remain available.

`AnswerChoice`, `CardFront`, and `CardBack` are small presentation components. `QuestionCard` owns selection and flip state, accepts a completed `Question`, displays question number/length (including continuous mode), and calls `onResult(selfReportedCorrect, selectedAnswer)` at most once. The callback reflects the student's self-report rather than calculating a score. A synchronous ref guard plus disabled buttons prevents both responses or repeated clicks from invoking it twice. A new question ID remounts the interaction to reset selection, flip state, and callback lock; a normal rerender of the same question preserves them.

The preview callback only displays “Thanks for trying this card!” It records no attempt, statistics, or localStorage data and does not advance to another question. Returning to setup and starting again creates a fresh preview. The question count is presentation data from the configured length, not session progression.

### Animation and accessibility

The two faces occupy the same CSS grid area and use a 550ms CSS 3D rotation with hidden back faces, keeping them aligned and readable. Each answer is a native button with a visible selected marker and `aria-pressed`. The inactive face has both `aria-hidden` and `inert`, and its controls are disabled. The flip button remains disabled until a selection exists. After flipping, answer selection is locked, focus moves to the reveal heading, and a live status region announces the correct and selected answers. Tab, Space, and Enter use native button behavior; number-key shortcuts belong to the later accessibility phase.

**Show card animation** is a local preview setting typed from the existing `AppSettings.cardAnimationEnabled` field. Turning it off removes the transition without affecting selection or reveal behavior. CSS also disables the transition under `prefers-reduced-motion`, regardless of the checkbox. This phase does not add persistent preferences or implement the Settings page.

### Phase 6 verification and manual review

New automated tests cover front/progress rendering, selection/change, flip gating, correct/selected answers, zero-valued answers, locked selection after reveal, one callback for either response, question-ID resets, same-question rerenders, continuous labels, keyboard interaction, animation toggling, stable generation, no storage writes, and generation failure handling. All prior tests remain unchanged and pass.

Chrome checks passed at 1280, 768, 375, and 320 pixels wide for the front, with no horizontal overflow and answer targets over 48 pixels high. The back was checked at desktop/mobile widths down to 320 pixels. Both faces were visually inspected using desktop and mobile screenshots. Real Tab/Space/Enter interaction, focus transfer/visible focus, hidden-face accessibility-tree exclusion, callback locking, the animation toggle, and emulated reduced-motion were checked. No browser runtime or console errors appeared on the successful run. The first browser run timed out before setup rendered; a clean rerun passed. Other browsers and actual screen-reader speech have not been verified.

To review manually:

1. Run `npm run dev`, open the printed URL, choose practice operations/difficulty/length, and select **Start Session**.
2. Confirm **Flip Card** is disabled. Select an answer, then a different one; only the current answer should show “Selected”.
3. Flip the card. Confirm the equation, correct answer, and your selected answer appear; answer choices should no longer be available for editing.
4. Select either result button. Both should disable and a thank-you message should appear. No new question or score should appear.
5. Return to setup and start again. Turn off **Show card animation** and repeat. Then enable your browser/system reduced-motion preference and repeat with the checkbox on; reveal should still work without motion.
6. Use Tab, Space, and Enter to complete the interaction. Focus should move to “Answer revealed” after flipping, then Tab should reach the result buttons.
7. Resize to desktop/tablet/mobile widths. Check readable math, stacked mobile choices/result buttons, and no horizontal scrolling. Refreshing still returns to the existing missing-configuration explanation.

## Structure

```text
src/
  app/          Routes, configuration Context/provider, and navigation tests
  components/   Shared layout, practice selectors, card faces/interaction, preview, and tests
  pages/        Home, practice setup/tests, session preview, other placeholders, and fallback
  services/     Arithmetic/choice generators, distractors, rules, APIs, and unit tests
  styles/       Global CSS, practice setup, and responsive question-card animation styles
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
