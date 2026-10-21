# Math Practice Web Application — Specification

## Purpose and boundaries

Build a browser-only math practice application for children ages 7–12 as an individual university software development assignment. Demonstrate planning, implementation, testing, debugging, version control, deployment, and an understandable AI-assisted development process.

Required stack: React, TypeScript, Vite, CSS, React Router, browser localStorage, Vitest, and React Testing Library. No backend, database, authentication, or account registration.

## Arithmetic and setup

- Support addition, subtraction, multiplication, and division; allow one or more operations per session.
- Offer Beginner, Easy, Intermediate, and Advanced difficulty levels. Each level controls operand ranges and complexity.
- Offer 5, 10, 20 questions, or continuous practice.
- Define and document exact ranges, subtraction rules, division rules, and answer-option rules before implementing generation. These details have not yet been specified.

## Interactive question cards

- Show a math question with four multiple-choice answers and allow an answer selection.
- Include a flip button and smooth flip animation.
- The flipped card reveals the correct answer and the student's selected answer.
- Show “I Got It Right” and “I Got It Wrong” buttons. The student self-reports the result; selecting an option alone does not finalize the question.
- Record the self-reported result, then advance. Each question counts only once, including repeated clicks.
- Define how unanswered cards are handled before implementing the interaction.

## Practice sessions and summary

Track total attempted, correct, incorrect, and accuracy. Display a summary when a session ends. Provide a way to finish continuous practice. Define abandoned-session behavior during the session phase. Avoid undefined accuracy when no questions have been attempted.

## Mistakes and targeted review

Persist incorrect-question information: operation, operands, correct answer, difficulty, and number of incorrect attempts. Track recurring incorrect patterns between browser sessions.

Provide a dedicated mistake-review mode generating similar questions from stored mistakes. For example, a mistake on 8 × 7 = 56 could lead to 7 × 8, 8 × 6, 9 × 7, or 56 ÷ 7. Examples describe intended similarity, not an already implemented algorithm. Define similarity rules, compatible operation/difficulty constraints, and how review progress is measured during that phase.

## Statistics

Show total attempted, total correct, total incorrect, overall accuracy, breakdowns by operation and difficulty, recent practice sessions, and mistake-review progress. Update statistics as responses are recorded and avoid double counting.

## Persistence and settings

Use localStorage for practice history, sessions, incorrect-question patterns, statistics, and application settings. Preserve data across refreshes and browser restarts on the same browser and origin. Decide the settings fields during the settings phase. Design versioned storage and handle missing, malformed, or unavailable stored data. Local browser data is not synced across devices.

## Pages and navigation

Use React Router for:

1. Home
2. Practice Setup
3. Practice Session
4. Session Summary
5. Statistics
6. Settings

Also provide a dedicated mistake-review entry point. Its exact route will be decided during review implementation. Only home and a not-found fallback are included in initial setup.

## Interface and accessibility

Use welcoming bright colors, readable large text, clear navigation and feedback, large interactive buttons, responsive desktop/tablet/mobile layouts, and smooth card flips. Support keyboard navigation, accessible labels, visible focus indicators, readable contrast, reduced motion, and semantic HTML. Verify interactive states and focus handling when those features are added.

## Development and quality workflow

Implement one requested phase at a time. Explain the plan, inspect existing code, make focused changes, add appropriate tests, run checks, report verified behavior and limitations, update documentation, suggest a meaningful Git commit, and wait for the next instruction. Never push to GitHub automatically. Only mark tasks complete after implementation and verification. Maintain README.md, this specification, and TODO.md.

Tests should cover generation constraints, answer choices, card interactions, single-count behavior, session progression, summaries, persistence, mistakes/review, statistics, and routing as those features are introduced. Supplement automated tests with manual responsive and accessibility checks.

## Initial setup scope

Inspect the working directory; scaffold Vite React/TypeScript if empty; install dependencies; configure routing and tests; organize src; remove starter assets/content; show “Math Practice App”; create the three documentation files; run tests and a production build. Do not implement arithmetic, flashcards, statistics, or other application features in this phase.

## Final deliverables

- GitHub repository containing the application and documentation.
- Publicly deployed working application.
- A 2–3 page development report.
- Evidence of AI-assisted development interactions, including prompts, debugging, testing, and important decisions.
