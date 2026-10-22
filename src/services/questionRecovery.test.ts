import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPracticeSession,
  MAX_GENERATION_ATTEMPTS,
  recordSessionResult,
  retrySessionQuestion,
} from './practiceSession'
import * as generator from './questionGenerator'
import * as recovery from './questionRecovery'
import * as similar from './similarQuestionGenerator'
import { operations } from './questionRules'
import { validateQuestion } from '../utils/validation'
import { mistakeAttempt } from '../test/mistakeData'
import { mistakeId } from './mistakeService'
import { normalizeSettings } from './storageService'
import { reportDevelopmentError } from './developmentErrors'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})
describe('bounded generation recovery', () => {
  it.each(
    operations.flatMap((operation) =>
      ([1, 2, 3, 4] as const).map((difficulty) => ({ operation, difficulty })),
    ),
  )(
    'uses a valid $operation level $difficulty fallback after exactly three failed attempts',
    ({ operation, difficulty }) => {
      const primary = vi
        .spyOn(generator, 'generateMultipleChoiceQuestion')
        .mockImplementation(() => {
          throw new Error('unavailable')
        })
      const state = createPracticeSession({
        operations: [operation],
        difficulty,
        sessionLength: 5,
      })
      expect(primary).toHaveBeenCalledTimes(MAX_GENERATION_ATTEMPTS)
      expect(state.error).toBeNull()
      expect(() => validateQuestion(state.question)).not.toThrow()
      expect(state.question).toMatchObject({
        operation,
        difficulty,
        source: 'regular',
      })
      expect(state.attempts).toHaveLength(0)
    },
  )
  it('rejects a valid question for the wrong configuration before using a safe fallback', () => {
    const wrong = generator.generateMultipleChoiceQuestion('division', 1)
    vi.spyOn(generator, 'generateMultipleChoiceQuestion').mockReturnValue(wrong)
    const state = createPracticeSession({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
    })
    expect(state.question?.operation).toBe('addition')
    expect(state.question?.id).not.toBe(wrong.id)
  })
  it('rejects malformed choices, keeps a recorded answer once, and avoids immediate fallback repeats', () => {
    const malformed = generator.generateMultipleChoiceQuestion('addition', 1)
    vi.spyOn(generator, 'generateMultipleChoiceQuestion').mockReturnValue({
      ...malformed,
      choices: [1, 1, 1, 1],
    })
    const first = createPracticeSession({
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 5,
      }),
      q = first.question!
    const next = recordSessionResult(first, q.id, true, q.choices[0])
    expect(next.session.attempted).toBe(1)
    expect(next.question?.displayText).not.toBe(q.displayText)
    expect(() => validateQuestion(next.question, new Set([q.id]))).not.toThrow()
    expect(recordSessionResult(next, q.id, true, q.choices[0])).toBe(next)
  })
  it('preserves review similarity, source and parent metadata in its fallback path', () => {
    vi.spyOn(similar, 'generateSimilarQuestion').mockImplementation(() => {
      throw new Error('unavailable')
    })
    const history = { attempts: [mistakeAttempt(0)], masteryThreshold: 3 }
    const state = createPracticeSession(
      {
        mode: 'mistake-review',
        operations: [...operations],
        difficulty: 2,
        sessionLength: 5,
      },
      history,
    )
    expect(state.question).toMatchObject({
      source: 'mistake-review',
      mistakePatternId: mistakeId(history.attempts[0]),
      difficulty: 2,
    })
    expect(() => validateQuestion(state.question)).not.toThrow()
  })
  it('stops when both paths fail and offers an explicit retry without creating attempts', () => {
    const normal = vi
      .spyOn(generator, 'generateMultipleChoiceQuestion')
      .mockImplementation(() => {
        throw new Error('failed')
      })
    const fallback = vi
      .spyOn(recovery, 'generateFallbackQuestion')
      .mockImplementation(() => {
        throw new Error('failed')
      })
    const state = createPracticeSession({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
    })
    expect(normal).toHaveBeenCalledTimes(3)
    expect(fallback).toHaveBeenCalledTimes(1)
    expect(state.question).toBeNull()
    expect(state.error).toContain('answers are safe')
    normal.mockRestore()
    fallback.mockRestore()
    expect(retrySessionQuestion(state)).toMatchObject({
      error: null,
      session: { attempted: 0 },
      attempts: [],
    })
  })
  it('repairs individual preferences and preserves valid defaults when one field is malformed', () => {
    expect(
      normalizeSettings({
        cardAnimationEnabled: false,
        feedbackEnabled: false,
        defaultOperations: ['division', 'bad', 'division'],
        defaultDifficulty: 4,
        defaultSessionLength: -1,
        masteryThreshold: 2,
      }),
    ).toMatchObject({
      cardAnimationEnabled: false,
      feedbackEnabled: false,
      defaultOperations: ['division'],
      defaultDifficulty: 4,
      defaultSessionLength: 10,
      masteryThreshold: 2,
    })
  })
  it('logs useful diagnostics only in development, without exposing them to the UI', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('DEV', true)
    vi.stubEnv('MODE', 'development')
    reportDevelopmentError('generation problem', new Error('details'))
    expect(warn).toHaveBeenCalledWith(
      'Math Practice: generation problem',
      expect.any(Error),
    )
    vi.stubEnv('DEV', false)
    reportDevelopmentError('hidden', new Error('details'))
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
