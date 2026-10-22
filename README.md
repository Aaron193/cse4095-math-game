# Math Practice App

A university software development project for children ages 7–12 to practice addition, subtraction, multiplication, and division. Development proceeds through approved phases with AI assistance.

## Current status

Phases 1–19 are complete: shared navigation, configurable practice, validated multiple-choice questions, interactive cards, fixed/continuous sessions, summaries, persistent history, statistics, and application settings. Results are self-reported. Browser localStorage preserves attempts, session metadata, the active card/selection/flip state, mistake patterns, statistics, and preferences. Mistake tracking, related-question review, mastery, and mistake statistics are implemented. Keyboard accessibility, responsive refinements, active-session recovery, navigation safety, and friendly error recovery are implemented. Phases 20–22 have not begun. Sound and step-by-step explanations are visibly unavailable; card animations work and can be disabled.

## Technology

React, TypeScript, Vite, React Router (declarative routing), and plain CSS. Tests use Vitest, React Testing Library, jest-dom, user-event, and jsdom. ESLint provides JavaScript/TypeScript and React checks; Prettier provides consistent formatting. Persistence uses browser localStorage; no backend, database, authentication, or registration is required.

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

Current verification (Phases 16–19): 479 tests in 35 files pass, along with TypeScript, ESLint (zero warnings), formatting, and the production build. Chrome/audit coverage and remaining limitations are described below.

Phases 9–11 verification: all 369 tests in 22 files passed, along with TypeScript, ESLint (zero warnings), formatting, and the production build. Each phase was checked before the next began; Chrome persistence and reset checks are described below.

Phase 8 verification: `npm test` passed all 322 tests in 17 files, including 27 new summary/calculation tests; `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, and `npm run build` passed.

Tests cover all selectors, repeated Select All, multiple operation choices, exclusive difficulty/length choices, the 10-question default, native keyboard interactions, invalid submission, configuration handoff for each length, returning to setup, missing configuration, and existing navigation. The former setup-placeholder assertion now checks the functional setup page.

During Phase 3, Chrome verification passed at 1280, 768, 375, and 320 pixels wide, with no horizontal overflow and choice targets at least 48 pixels high. Desktop/mobile screenshots were visually inspected. Browser checks covered validation, Select All, radio exclusivity, configuration transfer without reloading, return-to-setup choices, Tab/Space/arrow keys, Enter submission, visible focus, and the safe state after refresh. No runtime or console errors were reported. No new browser checks were performed for Phases 4–5 because the interface was unchanged; existing component/navigation tests still pass. Other browsers and screen readers have not been tested.

### Practice configuration design

Each reusable selector is a controlled component using native checkboxes or radio buttons, grouped by fieldsets and legends. Descriptions follow specification section 7. Selections are visible through the native checkmark/radio indicator as well as color. Feedback is announced through a status region and describes why Start Session is disabled.

The setup page keeps draft choices in React state. The initial defaults are Addition, Beginner, and 10 questions; saved defaults replace these on later visits. Submitting valid choices stores a `PracticeConfiguration` in a small React Context and navigates to `/practice/session`. This type uses `Pick<PracticeSession, 'operations' | 'difficulty' | 'sessionLength' | 'mode'>`, reusing the existing model instead of duplicating its fields. Submitting setup now also explicitly starts a session. Its separate Context stores a snapshot of those choices; returning to setup restores the last submitted choices unless application defaults have since changed.

Per-session overrides and unsaved drafts remain in memory. Saved default choices persist and initialize setup after reload. Starting a session generates its first question. The active card, selected answer, and flipped face now restore after reload, with totals rebuilt from canonical attempts. When no active checkpoint exists, the most recent completed summary can be restored.

### Manual interface check

1. Run `npm run dev`, open the printed URL, and select **Start Practice**.
2. Check all four operations, four difficulty descriptions, and four lengths. **Addition**, **Beginner**, and **10 questions** should initially be selected, with **Start Session** enabled (or your saved defaults applied).
3. Clear the last operation: Start Session becomes disabled and feedback explains why. Select an operation: it becomes enabled again.
4. Select multiple operations, then try **Select All**. Toggle individual operations. Try every difficulty and length; each radio group should have at most one selection.
5. Pick operations, difficulty, and length, then select **Start Session**. The session page should display those exact choices, zero totals, a generated card, and fixed progress when applicable. Use **Change practice choices** to return and confirm they are restored.
6. Refresh: completed answers remain in statistics. The unfinished card and selected/flipped state resume exactly; completed sessions show their summary instead.
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

`createQuestionId` uses `crypto.randomUUID()` for UUIDs across page reloads; HTTPS or localhost is required. It throws a descriptive error if secure UUID generation is unavailable. Invalid ranges, random samples, operations, difficulties, and empty selections throw explicit errors. The unified generator validates its output before returning it and wraps unexpected failures in an error retaining the original `cause`; session-level bounded retry/fallback behavior is now implemented in Phase 19.

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

The two faces share a CSS grid area and use a 550ms 3D rotation with hidden back faces. Native answer buttons show a selected marker and `aria-pressed`. The inactive face is `aria-hidden`, inert, and disabled. Flip remains disabled until an answer is selected. Revealing locks the answer, focuses the reveal heading, and announces both answers. Tab, Space, and Enter use native behavior; keys 1–4 select answer choices while avoiding form inputs, editing controls, modifiers, held keys, and flipped cards.

**Show card animation** uses the persisted `AppSettings.cardAnimationEnabled` preference. Disabling it or requesting reduced motion removes motion without preventing answer reveal. The standalone Phase 6 `QuestionCardPreview` and its tests remain available for isolated component verification; the application route now uses the functional session flow below.

## Practice sessions (Phase 7)

### State and lifecycle

`PracticeSessionProvider` owns the `usePracticeSession` hook above the routes, retaining the current session across client navigation. The typed state reuses `PracticeSession`, `PracticeAttempt`, `Question`, and `PracticeConfiguration`, adding the current question index, active flag, current question, attempts, and a recoverable loading error. Accepted attempts and session metadata are now written through `AppDataProvider` to localStorage. No data is sent to a server.

Only a valid **Start Session** submission creates a session, UUID, start timestamp, copied configuration, and first question. Rendering, navigating back, toggling animation, or returning to a completed session cannot implicitly start another one. Submitting setup again intentionally replaces the previous session after confirmation when it is still unfinished. Refreshing/reopening preserves accepted answers and session history. The unfinished card restores without generating a replacement question. Completed summaries restore as inactive sessions.

### Attempts and progression

The card enforces selection and flipping before its callback. The session transition additionally checks that the callback question ID matches the current question, has not already been recorded, and contains an allowed selected answer. The hook updates a synchronous ref alongside React state so duplicate callbacks within one React batch also see the latest state. Timestamps, IDs, random generation, and transitions run in explicit event handlers, outside render and state-updater functions.

Each accepted result creates a complete `PracticeAttempt`, increments attempted and the self-reported correct/incorrect count, and loads the next question. A student marking an actually incorrect selection as right still counts as right, as the specification requires self-reporting. The next card's new ID resets answer/flip state. Focus moves to the session heading for the next question, and a live region announces progress and totals.

The next-question helper tries at most eight candidate draws to avoid an immediately identical operation/operand expression, ignoring choice order and UUID differences. A stuck random source may still produce a repeated expression after that bounded limit; it cannot hang the session. Already-used question IDs are rejected. If generation fails, the accepted attempt and totals remain recorded; retry loads the missing question without recording another attempt. The error screen also offers **End Session**.

### Progress and completion

`SessionProgress` displays attempted, correct, and incorrect totals. Fixed sessions show a labeled native progress bar from 0 to the selected count; continuous sessions show current question number and totals without fixed progress. At 5, 10, or 20 accepted answers, the session becomes inactive, records its completion timestamp, removes the card, and stops requesting questions. The completed session now redirects to the Phase 8 summary page with the same retained state and timestamp; no additional question is generated.

Continuous practice keeps generating questions until **End Session** is confirmed using the browser's native confirmation dialog. Cancel leaves the session unchanged. Confirm clears the unfinished card without counting it and navigates to the summary with completed-answer totals. Ending a session twice or responding after it ended cannot change its counts.

New questions have a short 150ms fade, disabled by the animation control and reduced-motion CSS. The existing card animation remains unchanged. Responsive totals stack on very narrow screens so labels stay readable.

### Verification

The 33 new tests cover configuration validation, session creation and IDs, typed attempts, true/false self-reporting, duplicate/stale callbacks including same-batch calls, all three finite lengths, continuous practice beyond 20 questions, ending before any answer, repeat avoidance and its bound, initial/subsequent generation failure and retry, actual card resets, accessible progress, completion/re-entry, explicit restart, and cancel/confirm ending. Existing tests pass; two missing-session expectations were updated from the former placeholder to the required setup redirect. The Phase 6 card and preview tests were retained.

Chrome completed a real five-question session with three right and two wrong self-reports, verified every progress update and card reset, and confirmed completion remained stable after leaving and returning. Continuous practice was checked with both native-dialog cancel and confirm, unchanged counts for the discarded card, no fixed progress bar, no localStorage writes, and a safe redirect after full page reload. Desktop/tablet/mobile widths of 1280, 768, 375, and 320 pixels had no horizontal overflow. Desktop/mobile screenshots and the narrow-screen completion view were visually inspected. No runtime or console errors appeared on the final run. The temporary browser script needed a quoted numeric selector and boolean DOM check; those automation issues were corrected before the successful final run.

### Manual verification

1. Run `npm run dev`, open the printed URL, and select operations, difficulty, and **5 questions** in setup.
2. Start Session. Confirm all totals are zero, the card says **Question 1 of 5**, and progress starts at 0 of 5.
3. Select an answer, flip, and mark it right or wrong. Confirm one attempt is added, the matching total increases, and the next card has no selected answer and a disabled Flip Card button.
4. Complete five questions, reporting three right and two wrong. Confirm navigation to **Session Summary**, totals of **5 attempted / 3 correct / 2 incorrect**, **60% accuracy**, and no new card. Repeat with 10 or 20 questions if desired.
5. Use **Return Home** and browser Back to return to the summary. Confirm it stays completed. Use setup and **Start Session** to intentionally start a fresh session.
6. Start continuous practice. Complete a few questions, select **End Session**, and cancel: the session should continue unchanged. End again and confirm: only completed questions should appear in the totals.
7. Test keyboard controls, animation on/off, reduced motion, and mobile widths. Refreshing keeps accepted answers, preferences, and the current card/selection/flip state.

## Session summary (Phase 8)

Fixed sessions automatically navigate to `/practice/summary` after their final answer; continuous sessions navigate there after confirming **End Session**. The session page redirects inactive sessions with React Router `Navigate` using replacement navigation. Completion detection, stopping generation, timestamps, and duplicate guards continue to use the existing Phase 7 service. Navigating to the summary only reads the retained Context state and never generates a question or restarts a session.

`SessionSummaryPage` reuses `SessionProgress` for attempted/correct/incorrect totals and finished fixed progress. It shows the selected operations and difficulty, accuracy, and completed mistake-review count. The count is derived from attempt sources and remains zero for all currently available regular practice. Regular questions have source `regular`; review questions now carry source `mistake-review` and a parent pattern ID. Both feed the same totals.

`sessionAccuracy` calculates `correct / attempted × 100`, rounded to one decimal place when needed. Zero attempts returns 0%, avoiding division by zero. Invalid numeric totals are rejected by the calculation helper. Results reflect self-reported correctness, consistent with the session/card behavior.

### Summary actions

- **Practice Again** explicitly creates a new session using a copy of the completed configuration, resets attempts/totals/index, generates a new question with a fresh ID, and opens the session route. The old attempt list and scores are not reused. Random arithmetic facts may naturally recur; session state and question objects are newly generated.
- **Practice Mistakes** opens `/practice/setup?mode=mistake-review`, selecting review mode and a difficulty with active patterns when possible. With no active mistakes, setup explains this and offers regular practice.
- **Change Settings** returns to practice setup to change the session choices; application preferences have their own Settings page.
- **View Statistics** opens the statistics page backed by persisted attempts.
- **Return Home** navigates home while retaining the current completed session in memory.

One current session is held in React state, while previous sessions and their attempts persist in history. Starting again replaces the current card without deleting history. Refreshing restores the most recent saved completed summary. Opening the summary without any completed session shows a friendly message and setup/home links. If an unfinished session exists, the summary instead explains that it must be finished and offers **Continue Session**. No partial session is presented as completed, and these cases do not create a session automatically.

### Phase 8 verification and manual review

New tests cover valid/invalid accuracy calculations and rounding, zero-attempt continuous sessions, all displayed totals/metadata, review-source counting, summary actions, missing/active-session handling, automatic fixed/continuous navigation, retained results, no extra question after completion, and fresh Practice Again behavior. The prior session/navigation tests retain their scenarios with updated expectations for the real summary route, title, and home action. The first run caught a definition-list test helper reading the wrong value and a misplaced route comparison in a test; both were corrected before all checks passed.

Chrome completed a five-question session and confirmed 5 attempted / 3 correct / 2 incorrect / 60% accuracy. Summary screenshots were inspected at desktop/mobile widths; layout checks passed at 1280, 768, 375, and 320 pixels with no horizontal overflow. All five actions, browser Back restoring the summary, keyboard activation of Practice Again, fresh zero totals/card reset, continuous cancel/confirm ending at zero and two attempts, 0%/50% accuracy respectively, and missing-data behavior on direct summary visits were verified. No browser runtime or console errors appeared. Browser data remained unwritten; cross-browser and actual screen-reader testing remain for later verification.

To verify manually:

1. Run `npm run dev` and start a five-question session. Mark three answers right and two wrong. Confirm automatic navigation to **Session Summary** with totals **5 / 3 / 2**, **60% accuracy**, your operations/difficulty, and **0** mistake-review questions.
2. Check **Practice Mistakes** opens review setup. Try **View Statistics**, **Change Settings**, and **Return Home**; use browser Back to confirm the finished results remain available.
3. Select **Practice Again**. Confirm the same operations/difficulty/length, zero totals, Question 1, and a card with no selected answer. Complete it normally to produce another summary.
4. Start continuous practice and end immediately: summary totals and accuracy should all be zero. Repeat with one right and one wrong result: expect 2 attempted and 50% accuracy. Canceling the end confirmation should keep practicing.
5. Refresh the summary: its results should remain. In a browser with no saved completed session, check the helpful missing-session message and setup/home links.
6. Check mobile widths and keyboard navigation. Summary actions stack on smaller screens, and focus moves to the summary heading after navigation.

## Persistence, statistics, and settings (Phases 9–11)

`AppDataProvider` owns the saved snapshot. The existing session hook notifies it only from explicit transitions: starting, accepting an answer, ending, or retrying. A synchronous ref merges consecutive updates without stale React state. Attempt IDs and question IDs are deduplicated on both save and load. Aggregate and per-session totals are rebuilt from accepted attempt records, using self-reported correctness, so statistics and summaries share one source of truth. The cached statistics in storage are never trusted when loading.

### Storage and retention

- The single `mathPractice.data` JSON key atomically stores schema version 3, settings, session metadata, an active-card checkpoint, attempts, derived mistake patterns, and statistics. This follows the specification's versioning requirement while avoiding partial writes across its suggested separate keys.
- Missing-version/version-0/version-1/version-2 snapshots migrate to version 3, backfilling mistake patterns and adding an empty checkpoint when older history has none. The migrated snapshot is written on the next explicit save. Unknown versions remain untouched and show a warning rather than being overwritten by this version of the app.
- Invalid JSON falls back to fresh data. Invalid sections/rows are repaired or discarded independently; valid attempts are retained. Loaded attempts reuse arithmetic/difficulty validation, validate selected answers, IDs, dates, and self-reports, and are deduplicated.
- The newest 500 session metadata records are retained; the statistics page displays the newest 20. All attempts remain available for lifetime totals, including attempts whose older session metadata has been pruned. No attempt history is silently discarded to make space.
- Missing/unavailable storage and quota/write failures do not crash practice. New results remain in React state with a friendly warning that unsaved changes may be lost. Successful later writes retry the current snapshot.
- Accepted answers persist even in unfinished sessions. The current unfinished card, selection, and flip state restore from the same saved snapshot; malformed card data offers a retry without deleting valid attempts. The latest completed session can be restored for its summary.
- Data belongs to this browser profile and origin. Clearing browser data erases it. Concurrent editing in multiple tabs is not synchronized; use one practice tab at a time.

### Statistics and resets

The Statistics page shows overall, operation, and difficulty totals/accuracy, plus dated recent sessions with their configuration and performance. Zero attempts yields 0%, using the same one-decimal accuracy helper as summaries. Unfinished sessions are labeled. Empty states guide new users to setup. The mistake-review section now also shows active/mastered patterns, review counts, frequent missed operations/facts, and filterable pattern details.

**Reset Statistics** requires a native browser confirmation and clears sessions, attempts, derived mistake patterns/mastery, totals, and the current in-memory session. Saved settings remain. **Clear All Application Data** requires a stronger confirmation, clears all `mathPractice.*` keys (including future/legacy mistake data), restores defaults, and returns home. Neither action deletes unrelated localStorage keys. If browser permissions prevent deletion, a visible warning explains the failure.

### Settings

Save Settings persists animation and default operations/difficulty/length. At least one default operation is required. Defaults start with Addition, Beginner, 10 questions, and animations enabled. Existing setup selectors are reused; session overrides never overwrite saved defaults. Changing defaults invalidates remembered setup choices without resetting an active session. The session's animation checkbox updates this same preference immediately, preserving the current card and reduced-motion behavior. Sound/explanation controls are disabled with descriptions explaining their unavailability. Mastery uses the validated `settings.masteryThreshold` field; its default is a code constant, and no new settings control is added in this cycle.

### Verification and manual review

Automated tests cover serialization, migrations, repair, unsupported schemas, deduplication, blocked/full storage, history retention, provider reloads, statistics grouping/accuracy (including thousands of attempts), summary consistency, settings/default overrides, animation application, and cancellation/confirmation of both resets. The previous setup tests now expect the valid application defaults while preserving validation and keyboard coverage.

Chrome verification completed a fixed session (5 attempted / 3 correct / 2 incorrect / 60%), checked matching summary/statistics, refreshed, and fully closed/reopened Chrome using the same profile. Results remained correct without duplicates. It also verified a continuous session, saved defaults, animation toggling, both reset actions with cancel/confirm, settings retention after Reset Statistics, defaults after Clear All, and preservation of unrelated keys. Statistics/settings layouts had no horizontal overflow at 1280, 768, 375, and 320 pixels; desktop/mobile screenshots were inspected. No runtime or console errors appeared. Cross-browser and actual screen-reader checks remain for later testing.

To verify manually:

1. Run `npm run dev`. Complete five questions, marking three right and two wrong. Compare the summary (60%) with Statistics, including the operation/difficulty cards and recent session.
2. Refresh, then close/reopen the same browser profile and URL. Check saved results and the completed summary remain.
3. Save new defaults in Settings and disable animations. Open setup, confirm those defaults, override them for one session, and check saved defaults stay unchanged. Flip a card with animation disabled; also try the session animation checkbox.
4. Cancel Reset Statistics and check nothing changed. Confirm it and check attempts, sessions, and totals are cleared while preferences remain, including after refresh.
5. Cancel Clear All Application Data and check nothing changed. Confirm it and check navigation home, empty statistics, default preferences, and no completed summary after refresh.
6. Test keyboard controls, native dialogs, reduced motion, and mobile widths. Sound and explanations should clearly say they are unavailable.

## Mistake practice (Phases 12–15)

### History, pattern identity, and mastery

`mistakeService.ts` derives patterns by replaying deduplicated attempts in chronological order (with insertion order breaking timestamp ties). The identity is operation + difficulty + ordered operands; reversed addition/multiplication facts remain related but distinct records. IDs are deterministic, so replaying history, retrying a save, or reloading cannot create duplicate patterns. A regular self-reported miss creates or updates its pattern, increments the incorrect count, saves the latest miss date, and resets review progress.

Review attempts persist `mistakePatternId`. A linked review answer updates its original pattern rather than creating another pattern for every nearby expression. A review miss increments the parent's miss count, updates its date, and resets progress. The actual question and operation remain in the attempt, so operation statistics still reflect what the child answered. A correct ordinary answer does not increase review mastery. Historical review records without a parent link still count in overall/review statistics; they cannot grant mastery to an unidentified parent.

Three distinct correct related reviews since the last miss mark a pattern mastered. A later regular miss on that original fact, or a linked review miss, reactivates it. `DEFAULT_MASTERY_THRESHOLD` in `mistakeService.ts` configures the default for new settings. Services also accept a threshold explicitly, and the app uses the validated per-profile `settings.masteryThreshold`; changing the default constant does not overwrite existing saved preferences. Counters and cached patterns are rebuilt from canonical history, so corrupted pattern caches cannot invent or erase practice results.

### Related questions

`similarQuestionGenerator.ts` builds a finite candidate set using:

- nearby operands (division adjusts quotient/divisor and reconstructs a divisible dividend);
- reversed addition/multiplication operands;
- addition/subtraction and multiplication/division inverse fact families.

Every candidate must pass the existing arithmetic/difficulty validator. Inverse or reversed forms outside that difficulty are discarded, including zero divisors and fractional/negative answers. The original expression is excluded. The generator chooses among available strategies, prefers expressions outside the most recent six attempts, and uses a bounded fallback that avoids the immediate previous expression when alternatives exist. It then calls the existing distractor/shuffle service, assigns a fresh UUID, and returns a validated complete `Question` with its source and parent ID. Session generation also rejects IDs already used in that session.

### Review sessions

Setup offers Regular practice and Mistake review. With no active patterns, review is disabled with an explanation; direct review links also remain safe. Entering review selects all operations and an available difficulty to avoid an empty initial filter. Students can change these choices. Only active parent patterns matching the selected operations/difficulty are eligible; inverse review questions must also use a selected operation and the same difficulty.

`reviewService.ts` prioritizes frequent misses, recent misses, and low successful-review progress, randomizing patterns within two priority points of the best score. When multiple parents remain, it avoids selecting the previous parent consecutively. The existing session hook obtains fresh canonical history through the saved-data provider; it includes the just-completed attempt before choosing the next question. No separate review session engine or card system is introduced.

All existing lengths, progress, ending confirmation, duplicate guards, summary counts, retries, and persistence apply to review. A fixed session ends at its selected length; any review session ends earlier if every selected pattern is mastered. The summary explicitly explains early completion. **Practice Again** preserves review mode when eligible patterns remain; otherwise it shows a helpful message instead of starting an empty session. **Practice Mistakes** on summaries/statistics opens review setup.

### Mistake statistics

`mistakeStatistics.ts` calculates active/mastered totals, similar questions attempted/correct, most-missed operations (from actual attempt operations), and frequent facts (including related review misses). Tied operations/facts are retained, with facts sorted by miss count, latest date, then ID. The overview shows up to five top tied facts and explains when more are available in details. Active, Mastered, and All filters show original expressions, difficulty, miss counts, successful-review streaks, progress bars, and last-miss dates. Zero-history and fully-mastered states use encouraging messages. Both history reset and Clear All remove derived mistake progress with its source records.

### Verification and manual review

Each phase was verified before proceeding: Phase 12 passed 381 tests, Phase 13 passed 405, and Phase 14 passed 424, together with TypeScript, ESLint, formatting, and production builds. Final verification passed 434 tests in 28 files and those same checks. Generation tests include 1,600 seeded similar questions across all operation/difficulty combinations, explicit inverse/reversal cases, zero/maximum boundaries, and repeat/failure behavior. Further tests cover migrations, damaged caches, duplicate saves, mastery/reset/reactivation, priority, all fixed lengths, continuous practice, real-card review flows, summary counts, reloads, ranking ties, filtering, and reset consistency.

An older statistics test counted every `time` element on the page; mistake dates correctly increased that count. Its assertion now targets only Recent sessions. A reused-review-ID regression test now verifies automatic recovery while preserving the accepted attempt rather than displaying an unanswerable duplicate card.

Chrome completed regular practice with a missed question, followed the summary action into review, mastered the pattern after three linked answers, and verified matching summary/statistics (4 attempted, 3 correct, 1 incorrect, 75%). Refresh and a full Chrome close/reopen preserved mastery and disabled the empty queue. A controlled random stream generated the original fact again through the regular generator; missing it reactivated the same pattern with no duplicate. A continuous review miss updated the parent once, cancel/confirm ending preserved exact counts, and history reset erased mistake progress too. Desktop/mobile screenshots were inspected; layouts fit 1280, 768, 375, and 320 pixels with no horizontal overflow or runtime/console errors. Other browsers and actual screen-reader checks remain outside this cycle.

To verify manually:

1. Run `npm run dev`. Start continuous regular practice, complete one question with **I Got It Wrong**, and confirm **End Session**.
2. Select **Practice Mistakes** on the summary. Check review mode and matching patterns, choose 5 questions, and start.
3. Mark three related questions right. With one active pattern, review should finish early and explain mastery. Check the summary shows 3 completed review questions.
4. Open Statistics. Compare overall totals with regular + review attempts. Toggle Active/Mastered/All and inspect the original fact, streak, count, and date. Refresh or reopen the browser to confirm persistence.
5. Try a missed review: it should update the same original pattern, reset its streak, and count once in overall/review totals. A later regular miss on the original expression should reactivate a mastered pattern.
6. Test a different difficulty/operation filter with no matches, empty review after resetting history, fixed lengths, and continuous ending confirmation. No empty session should start. Reset Statistics should clear mistake progress while keeping preferences; Clear All should restore defaults too.

Files introduced: `mistakeService.ts`, `similarQuestionGenerator.ts`, `reviewService.ts`, and `mistakeStatistics.ts` with unit tests; `MistakeStatistics.tsx`; `MistakeReview.test.tsx`, `MistakeStatistics.test.tsx`, and the shared `mistakeData.ts` fixture. Existing session types/engine/hook/providers, storage/schema tests, setup, session content, summary/actions, statistics, responsive styles, README, and TODO were extended. No dependencies, specification changes, commits, pushes, or Phase 16 work were introduced.

## Usability and reliability (Phases 16–19)

### Accessibility and responsive practice

The existing native controls, visible focus outlines, inert hidden card faces, reduced-motion CSS, and reveal focus/live region are reused. Answer buttons now show their 1–4 shortcuts and expose `aria-keyshortcuts`. Shortcuts ignore form/editing controls and modifier/repeated keys and cannot change a flipped answer. Questions have spoken operator labels (for example, “8 multiplied by 7 equals what?”), and the live session announcement includes the new question, number/length, and totals. Ordinary page navigation focuses the page heading; session/reveal/summary keep their existing focus behavior. Practice navigation remains marked current throughout practice routes.

The mobile navigation uses font-aware columns that stack as text grows. Controls, headings, values, and buttons reflow; tablet cards remain centered, and statistics continue using responsive cards. Answer buttons and selectors have stronger boundaries for non-text contrast. The home page no longer calls working activities “coming soon.” Positive/supportive text feedback is chosen only after an accepted result, without extra animations or sound, and can be disabled with the saved **Encouraging feedback** preference. Feedback falls back to a fixed message if randomness fails so it can never block recording an answer.

### Recovery and navigation

Schema version 3 adds an `activeSession` checkpoint containing session ID, the complete current question (including its original choice order and review parent), and `QuestionCardState` (selected answer and flipped state). Session metadata and attempts remain canonical; the checkpoint does not duplicate their counters or history. Event handlers save answer selection, flipping, accepted results, and the next card synchronously in one localStorage snapshot. Restoration does not generate questions, report results, or run random generation during render. Zero-valued answers are valid selections.

Loaded checkpoints are checked against session configuration, question validation, prior question IDs, and active review parents. A damaged selection resets only selection; a damaged/already-recorded question keeps its session and valid attempts with a retry action. Attempted totals/index are rebuilt from canonical attempts. Exhausted fixed sessions are repaired as completed even if their completion timestamp is missing. Ending or completing clears the checkpoint, preventing completed sessions from restarting. An unfinished session is offered through **Continue Practice** when returning elsewhere in the app.

React Router's public `useBlocker` API needs a data router, so `main.tsx` now uses `createBrowserRouter`/`RouterProvider` around the existing route tree. Application integration tests use an equivalent `createMemoryRouter` helper. Routes/components were not rewritten. A native modal dialog protects in-app navigation, including browser Back/Forward, with **Keep Practicing**, **Save and Leave**, or **End Session and Leave**. The last option ends after the requested destination commits, avoiding a race with the summary redirect. Native modal behavior is supplemented with explicit first/last-button Tab wrapping; Escape keeps practicing. Refresh/close uses the browser's generic `beforeunload` warning, which browsers may suppress without prior interaction. Intentionally ending/completing removes that warning. Starting a replacement session also requires confirmation.

### Error handling

Each question load retries generation at most three times. Existing immediate-repeat avoidance is separately bounded at eight draws. A deterministic backup path then uses existing arithmetic/choice utilities, or validated related candidates for review, retaining difficulty/source/parent rules and fresh IDs. The fallback does not silently replace review with unrelated regular practice. If both paths fail, completed results remain and a reusable `ErrorNotice` offers retry, home, and intentional ending. Manual retry starts another bounded operation; there is no automatic infinite retry. Failed session/attempt ID creation also receives a useful recovery message, without counting an unrecorded answer.

Stored preferences are repaired field by field, preserving valid choices when one preference is invalid. Invalid attempt/session rows are filtered, totals/patterns are rebuilt, malformed cards are repaired independently, and unrelated storage keys remain untouched. **Try saving again** retries the current in-memory snapshot after a storage failure. Unknown schema versions remain protected from overwrites. Missing session URLs explain how to start practice. The browser router has a friendly error boundary with reload/home actions instead of a technical stack trace; development-only console diagnostics retain details for debugging.

### Verification, issues fixed, and limits

Phases were checked sequentially: Phase 16 passed 440 tests; Phase 17 passed 442; Phase 18 passed 451; final verification passes 479 tests across 35 files. Each phase passed TypeScript, ESLint, formatting, and production builds before moving on. New coverage includes shortcut isolation, keyboard card completion, feedback preferences, active checkpoints, selected/flipped restoration, duplicate guards, canonical completion repair, Back/stay/save/end confirmations, bounded failures/fallbacks at all 16 operation/difficulty combinations, partial preference repair, save retry, failed starts/attempts, and the friendly route boundary. Earlier navigation tests now explicitly choose Save and Leave; generation tests distinguish transient automatic recovery from failure of both normal and backup paths.

Chrome verified full keyboard-only sessions, desktop/tablet portrait/tablet landscape/mobile layouts (including 320px), large touch targets, all main pages, native modal focus wrapping/Escape, reduced motion with animation enabled/disabled, actual 200% browser zoom, and actual 32px default browser fonts in an isolated profile. Refresh and fully closing/reopening Chrome retained the exact question, selection, flip state, and review parent without duplicate attempts. Ending cleared recovery. Injected corrupt JSON/rows/preferences/cards, failed randomness, and unavailable IDs recovered with valid history intact and useful actions.

Axe-core was installed only under `/tmp` for browser auditing; it is not a project dependency. Audited home/setup/session-front/session-back/summary/statistics/settings/error-message/navigation-dialog states reported no WCAG-tagged violations. The 3D card front and modal sometimes produced an incomplete automated contrast check. Manual color calculations supplement this: primary text pairs are at least 5.71:1, focus indicators at least 6.37:1, and strengthened control boundaries at least 3.62:1 against their adjacent backgrounds. Automated audits do not establish full WCAG conformance. Actual screen-reader output, other browser engines, physical touch hardware, and operating-system font settings have not been tested; browser font/zoom and device emulation were used.

Behavior issues were caught and fixed: ending during blocked navigation could let the automatic summary redirect override the chosen destination, and native modal Tab navigation could move focus into browser chrome after the final button. Navigation-commit ordering and explicit Tab boundaries now have regression checks. Visual inspection also caught overlapping mobile navigation labels with 32px browser fonts; adaptive columns and rendered-text overlap assertions now cover that case. One browser harness needed the proper Escape virtual-key code, and a browser-run approval review timed out once; retrying the verification in smaller steps succeeded. Neither remains a product limitation.

Storage must be available and have capacity to preserve the latest snapshot. When it is not, practice remains usable in memory with a warning, and saving can be retried. Multiple-tab editing is still not synchronized. Sound/explanations remain explicitly unavailable. No tasks in Phases 20–22 were marked complete or begun.

To verify manually:

1. Run `npm run dev`. Start five questions, press 1–4 to choose, Tab to Flip Card, Enter to reveal, then Tab/Space to self-report. Check focus and question/progress announcements; try a screen reader if available.
2. Select an answer and refresh before flipping; then flip and refresh again. Check the exact card, answer order, selection, and face restore. Report once and check one attempt is added. Close/reopen the browser profile and continue through **Continue Practice**.
3. Navigate Home/Statistics or use Back while practicing. Try Keep Practicing, Save and Leave/resume, and End Session and Leave. Confirm completion/end causes no extra navigation warning. Try replacing an unfinished session from setup.
4. Disable animations and feedback in Settings. Also enable reduced motion in browser tools or the OS. Confirm cards remain usable. Check desktop/mobile, 200% zoom, and larger browser font preferences.
5. Review statistics and reset actions. In a disposable profile, try damaged localStorage data or blocked writes; check friendly messages, working retries, and preservation of valid history. Clear All remains an explicit confirmed action.

Files added: `RouteFocus.tsx`, `questionAccessibility.ts`, keyboard tests, `feedback.ts` and tests, feedback page tests, `SessionNavigationSafety.tsx`, `TestRouter.tsx`, recovery service/page tests, `ErrorNotice.tsx`, `ApplicationErrorPage.tsx`, `questionRecovery.ts` and tests, `developmentErrors.ts`, and error-handling page tests. Existing card/session/hook/provider/storage/types, setup/summary/settings/home, navigation/layout/router entry, styles, integration fixtures, README, and TODO were extended. No runtime or project testing dependencies were added; no commit or push was performed.

## Structure

```text
src/
  app/          Routes, saved-data/configuration/session providers, and navigation tests
  components/   Layout, selectors, cards, session content/progress, preview, and tests
  hooks/        Session state/transition hook and tests
  pages/        Home, setup/session/summary, statistics, settings, their tests, and fallback
  services/     Generators, rules, session transitions, storage, statistics, and unit tests
  styles/       Global, setup, card, session/progress, and responsive summary styles
  test/         Shared test setup and DOM cleanup
  types/        Shared question, attempt/session, mistake, statistics, and settings models
  utils/        Random integers, shuffling, IDs, validation, session accuracy, and unit tests
  main.tsx      React entry point, browser data router, and friendly route boundary
```

Shared models follow specification sections 8 and 10. Settings follow section 6.7 and are validated before persistence; unavailable sound/explanation options are disabled and labeled. Session lengths retain the specification’s `number | "continuous"` type; the setup form limits choices to 5, 10, 20, or continuous. Session configuration is validated at session creation; persisted-data validation belongs to `storageService.ts`. Add feature modules and storage helpers when their phases require them. The repository root contains Vite, TypeScript, and lint configuration, the npm lockfile, and project documentation.

Prettier excludes the authoritative `specification.md` and `TODO.md` so routine formatting preserves those reference documents. ESLint and Prettier run separately; `eslint-config-prettier` disables conflicting style rules.

## Requirements and workflow

See [specification.md](specification.md) for requirements and [TODO.md](TODO.md) for the phased plan. Each phase includes explanation, focused implementation, appropriate tests, checks, documentation, a suggested commit, and a pause for the next instruction. Keep prompts, debugging decisions, test output, and milestone commits as evidence for the final 2–3 page development report. Do not commit private information in interaction records.

Deployment is a later phase. The production output is static files in `dist/`. A host using browser-history routing must rewrite application URLs to `index.html` for direct links and refreshes. No deployment or GitHub push has been performed during setup.

## Official references

- [Vite guide](https://vite.dev/guide/)
- [React Router declarative setup](https://reactrouter.com/start/declarative/installation)
- [Vitest guide](https://vitest.dev/guide/)
- [TypeScript ESLint setup](https://typescript-eslint.io/getting-started/)
- [Prettier configuration](https://prettier.io/docs/configuration)
