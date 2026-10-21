# Implementation plan

Work on one requested phase at a time. Check items only after implementation and verification. Every phase requires appropriate tests/checks, documentation updates, a change summary, a suggested commit, and a pause for the next instruction.

## Phase 1 — Initial setup

- [x] Inspect the directory and initialize Vite with React and TypeScript.
- [x] Install dependencies and configure React Router.
- [x] Configure Vitest, React Testing Library, DOM matchers, and cleanup.
- [x] Organize src and remove Vite starter content/assets.
- [x] Display “Math Practice App” within a basic responsive application shell.
- [x] Create README.md, specification.md, and a phased TODO.md.
- [x] Verify shell/routing tests, lint, TypeScript checks, and production build.

Verification: `npm test` passed 3 tests; `npm run lint` passed; `npm run build` passed including strict TypeScript checks. Development-server HTTP smoke check passed on an automatically assigned port (5173 was occupied). Visual browser checks remain part of manual verification.

## Phase 2 — Question model and generation

- [ ] Agree operand ranges and complexity for all four difficulty levels.
- [ ] Define typed operations, difficulties, questions, and answers.
- [ ] Generate addition, subtraction, multiplication, and division questions.
- [ ] Define subtraction/division edge cases and generate four unique answer choices with exactly one correct answer.
- [ ] Verify arithmetic validity, ranges, and answer-choice constraints with unit tests.

## Phase 3 — Practice setup

- [ ] Build the Practice Setup page and route.
- [ ] Select one or more operations, difficulty, and 5/10/20/continuous length.
- [ ] Validate configuration and pass it to the session entry point.
- [ ] Test form interactions and invalid configurations.

## Phase 4 — Flashcards and sessions

- [ ] Build Practice Session page with question cards and selectable answers.
- [ ] Implement flipping, correct/selected answer reveal, and reduced motion.
- [ ] Add “I Got It Right” / “I Got It Wrong” self-report controls.
- [ ] Record each question once and advance; test repeated clicks.
- [ ] Track attempts, correct, incorrect, and accuracy during sessions.
- [ ] Support finite completion and ending continuous practice.
- [ ] Define and test unanswered/abandoned-session behavior and keyboard/focus handling.

## Phase 5 — Summary and persistence

- [ ] Build Session Summary page with session results.
- [ ] Define versioned localStorage schema and typed storage helpers.
- [ ] Persist history, sessions, and per-question results used for statistics.
- [ ] Restore data across refreshes; handle missing, corrupted, or unavailable storage.
- [ ] Test summaries, persistence, recovery, and double-count prevention.

## Phase 6 — Mistakes and review

- [ ] Persist incorrect patterns including operation, operands, answer, difficulty, and incorrect-attempt count.
- [ ] Define similar-question generation and mistake-review progress rules.
- [ ] Add dedicated mistake-review mode, including an empty state.
- [ ] Persist review progress and test repeat mistakes and related question validity.

## Phase 7 — Statistics

- [ ] Build Statistics page and route.
- [ ] Show totals/accuracy and breakdowns by operation and difficulty.
- [ ] Show recent sessions and mistake-review progress.
- [ ] Update results after each recorded response and verify consistency across reloads.
- [ ] Test calculations, empty states, and duplicate prevention.

## Phase 8 — Settings and complete navigation

- [ ] Define application settings and build Settings page and route.
- [ ] Persist preferences and apply them to subsequent practice sessions.
- [ ] Finish Home page and navigation to implemented pages.
- [ ] Test settings persistence and navigation flows.

## Phase 9 — Accessibility, responsive polish, and regression

- [ ] Manually verify desktop, tablet, and mobile layouts.
- [ ] Check keyboard-only usage, labels, focus, contrast, and reduced motion.
- [ ] Verify complete practice/review flows and refresh behavior.
- [ ] Run full automated tests, lint, and production build; resolve failures.
- [ ] Update installation, usage, and verification documentation.

## Phase 10 — Deployment and assignment evidence

- [ ] Prepare static hosting with correct SPA routing and base path.
- [ ] Deploy publicly when requested; verify direct links, refresh, and localStorage on the deployed origin.
- [ ] Finalize GitHub repository milestones and README deployment link.
- [ ] Collect AI interaction evidence and important decisions.
- [ ] Write and review the 2–3 page development report.
