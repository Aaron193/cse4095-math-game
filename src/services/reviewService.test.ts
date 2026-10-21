import { afterEach, describe, expect, it, vi } from 'vitest'
import { mistakeAttempt as attempt } from '../test/mistakeData'
import { deriveMistakePatterns, mistakeId } from './mistakeService'
import {
  eligibleReviewPatterns,
  reviewPriority,
  selectReviewPattern,
} from './reviewService'
import {
  createPracticeSession,
  endPracticeSession,
  isPracticeConfiguration,
  recordSessionResult,
} from './practiceSession'
import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session'
import { normalizeData, emptyData, saveSession } from './storageService'
import { operations } from './questionRules'
import { validateQuestion } from '../utils/validation'

import * as similar from './similarQuestionGenerator'

afterEach(() => vi.restoreAllMocks())

const history = { attempts: [attempt(0)], masteryThreshold: 3 }
const config: PracticeConfiguration = {
  mode: 'mistake-review',
  operations: [...operations],
  difficulty: 2,
  sessionLength: 5,
}
function record(state: PracticeSessionState, correct: boolean) {
  return recordSessionResult(
    state,
    state.question!.id,
    correct,
    state.question!.choices[0],
    history,
  )
}
describe('review priority and eligibility', () => {
  it('prioritizes frequency, recency and little successful review independently', () => {
    const base = deriveMistakePatterns(history.attempts)[0]
    const now = Date.parse(base.lastIncorrectAt)
    const score = reviewPriority(base, 3, now)
    expect(
      reviewPriority({ ...base, incorrectCount: 3 }, 3, now),
    ).toBeGreaterThan(score)
    expect(
      reviewPriority(
        { ...base, lastIncorrectAt: '2026-09-01T00:00:00Z' },
        3,
        now,
      ),
    ).toBeLessThan(score)
    expect(
      reviewPriority({ ...base, similarCorrectCount: 2 }, 3, now),
    ).toBeLessThan(score)
  })
  it('randomizes similar priorities, favors the top group and avoids consecutive parent patterns when possible', () => {
    const base = deriveMistakePatterns(history.attempts)[0]
    const patterns = [
      { ...base, id: 'first', incorrectCount: 5 },
      { ...base, id: 'second', incorrectCount: 5 },
      { ...base, id: 'lower' },
      { ...base, id: 'mastered', incorrectCount: 100, mastered: true },
    ]
    expect(selectReviewPattern(patterns, 3, () => 0).id).toBe('first')
    expect(selectReviewPattern(patterns, 3, () => 0.999).id).toBe('second')
    expect(selectReviewPattern(patterns, 3, () => 0, 'first').id).toBe('second')
    expect(() => selectReviewPattern([], 3)).toThrow()
  })
  it('filters by selected operations and difficulty and excludes mastered patterns', () => {
    expect(eligibleReviewPatterns(config, history)).toHaveLength(1)
    expect(
      eligibleReviewPatterns({ ...config, difficulty: 1 }, history),
    ).toHaveLength(0)
    expect(
      eligibleReviewPatterns({ ...config, operations: ['division'] }, history),
    ).toHaveLength(0)
    const id = mistakeId(attempt(0))
    const mastered = [1, 2, 3].map((i) =>
      attempt(i, {
        source: 'mistake-review',
        mistakePatternId: id,
        selfReportedCorrect: true,
      }),
    )
    expect(eligibleReviewPatterns(config, history, mastered)).toHaveLength(0)
  })
})
describe('review sessions reuse session progression', () => {
  it('refuses missing/empty review data and invalid mode without replacing a session', () => {
    expect(() => createPracticeSession(config)).toThrow()
    expect(() =>
      createPracticeSession(config, { ...history, attempts: [] }),
    ).toThrow()
    expect(isPracticeConfiguration({ ...config, mode: 'unknown' })).toBe(false)
  })
  it.each([5, 10, 20] as const)(
    'supports %s fixed questions, source metadata, progress and duplicate guards',
    (length) => {
      let state = createPracticeSession(
        { ...config, sessionLength: length },
        history,
      )
      const ids = new Set<string>()
      for (let i = 0; i < length; i++) {
        const q = state.question!
        expect(() => validateQuestion(q, ids)).not.toThrow()
        ids.add(q.id)
        expect(q.source).toBe('mistake-review')
        expect(q.mistakePatternId).toBe(mistakeId(attempt(0)))
        const next = record(state, false)
        expect(
          recordSessionResult(next, q.id, true, q.choices[0], history),
        ).toBe(next)
        expect(next.session.attempted).toBe(i + 1)
        state = next
      }
      expect(state).toMatchObject({
        isActive: false,
        question: null,
        session: {
          attempted: length,
          incorrect: length,
          correct: 0,
          completedAt: expect.any(String),
        },
      })
      expect(
        state.attempts.every(
          (a) => a.mistakePatternId === mistakeId(attempt(0)),
        ),
      ).toBe(true)
      const data = saveSession(
        normalizeData({ ...emptyData(), attempts: history.attempts }),
        state,
      )
      expect(data.statistics.attempted).toBe(length + 1)
      expect(data.mistakePatterns).toHaveLength(1)
      expect(data.mistakePatterns[0].incorrectCount).toBe(length + 1)
    },
  )
  it('finishes early when the last selected pattern is mastered without an extra question or attempt', () => {
    let state = createPracticeSession(config, history)
    for (let i = 0; i < 3; i++) state = record(state, true)
    expect(state).toMatchObject({
      isActive: false,
      question: null,
      error: null,
      session: { attempted: 3, correct: 3, completionReason: 'mastered' },
    })
    expect(endPracticeSession(state)).toBe(state)
    const patterns = deriveMistakePatterns([
      ...history.attempts,
      ...state.attempts,
    ])
    expect(patterns[0]).toMatchObject({
      mastered: true,
      similarCorrectCount: 3,
    })
  })
  it('supports continuous review, ignores unfinished cards, and ends only once', () => {
    let state = createPracticeSession(
      { ...config, sessionLength: 'continuous' },
      history,
    )
    for (let i = 0; i < 25; i++) state = record(state, false)
    expect(state.isActive).toBe(true)
    const ended = endPracticeSession(state)
    expect(ended.session.attempted).toBe(25)
    expect(endPracticeSession(ended)).toBe(ended)
  })
  it('mixes parents in one session and never selects already mastered patterns', () => {
    const multiple = {
      ...history,
      attempts: [
        attempt(0),
        attempt(1, { firstOperand: 6, correctAnswer: 42 }),
      ],
    }
    let state = createPracticeSession(config, multiple)
    const first = state.question!.mistakePatternId
    state = recordSessionResult(
      state,
      state.question!.id,
      true,
      state.question!.choices[0],
      multiple,
    )
    expect(state.question!.mistakePatternId).not.toBe(first)
  })
})

it('rejects a reused review question ID while retaining the accepted attempt', () => {
  const state = createPracticeSession(config, history)
  const question = state.question!
  vi.spyOn(similar, 'generateSimilarQuestion').mockReturnValueOnce(question)
  const next = record(state, false)
  expect(next.attempts).toHaveLength(1)
  expect(next.question).toBeNull()
  expect(next.error).toBeTruthy()
})
