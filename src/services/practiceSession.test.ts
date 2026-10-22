import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Question } from '../types/question'
import type { PracticeConfiguration } from '../types/session'
import * as recovery from './questionRecovery'
import * as generator from './questionGenerator'
import {
  createPracticeSession,
  endPracticeSession,
  isPracticeConfiguration,
  MAX_REPEAT_ATTEMPTS,
  recordSessionResult,
  retrySessionQuestion,
} from './practiceSession'

const configuration: PracticeConfiguration = {
  operations: ['addition'],
  difficulty: 1,
  sessionLength: 5,
}
function question(index: number): Question {
  const answer = index % 11
  return {
    id: `question-${index}`,
    operation: 'addition',
    difficulty: 1,
    firstOperand: answer,
    secondOperand: 0,
    correctAnswer: answer,
    displayText: `${answer} + 0 = ?`,
    choices: [answer, answer + 1, answer + 2, answer + 3],
    source: 'regular',
  }
}
let generated = 0
beforeEach(() => {
  generated = 0
  vi.spyOn(generator, 'generateMultipleChoiceQuestion').mockImplementation(() =>
    question(++generated),
  )
})
afterEach(() => vi.restoreAllMocks())

describe('practice configuration validation', () => {
  it.each([
    null,
    undefined,
    {},
    { ...configuration, operations: [] },
    { ...configuration, operations: ['power'] },
    { ...configuration, operations: Array(1) },
    { ...configuration, difficulty: 5 },
    { ...configuration, difficulty: '1' },
    { ...configuration, sessionLength: 0 },
    { ...configuration, sessionLength: 7 },
  ])('rejects invalid configuration %j', (value) => {
    expect(isPracticeConfiguration(value)).toBe(false)
    expect(() => createPracticeSession(value as PracticeConfiguration)).toThrow(
      TypeError,
    )
  })
  it.each([5, 10, 20, 'continuous'] as const)(
    'accepts supported length %s',
    (sessionLength) => {
      expect(isPracticeConfiguration({ ...configuration, sessionLength })).toBe(
        true,
      )
    },
  )
})

describe('practice session transitions', () => {
  it('creates a distinct ID, configuration snapshot, first question and zero totals', () => {
    const state = createPracticeSession(configuration)
    expect(state.session).toMatchObject({
      ...configuration,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    })
    expect(state.session.id).not.toBe(
      createPracticeSession(configuration).session.id,
    )
    expect(state.session.operations).not.toBe(configuration.operations)
    expect(Number.isNaN(Date.parse(state.session.startedAt))).toBe(false)
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.isActive).toBe(true)
    expect(state.question).not.toBeNull()
    expect(state.attempts).toEqual([])
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledWith(
      ['addition'],
      1,
    )
  })
  it('records complete typed attempts and uses self-report rather than selected-answer correctness', () => {
    const first = createPracticeSession(configuration)
    const initial = first.question!
    const second = recordSessionResult(
      first,
      initial.id,
      false,
      initial.correctAnswer,
    )
    expect(second.session).toMatchObject({
      attempted: 1,
      correct: 0,
      incorrect: 1,
    })
    expect(second.attempts[0]).toMatchObject({
      questionId: initial.id,
      sessionId: first.session.id,
      operation: initial.operation,
      firstOperand: initial.firstOperand,
      secondOperand: initial.secondOperand,
      selectedAnswer: initial.correctAnswer,
      correctAnswer: initial.correctAnswer,
      selfReportedCorrect: false,
      difficulty: 1,
      source: 'regular',
    })
    expect(Number.isNaN(Date.parse(second.attempts[0].attemptedAt))).toBe(false)
    expect(second.currentQuestionIndex).toBe(1)
    expect(second.question?.id).not.toBe(initial.id)
    const third = recordSessionResult(
      second,
      second.question!.id,
      true,
      second.question!.choices[1],
    )
    expect(third.session).toMatchObject({
      attempted: 2,
      correct: 1,
      incorrect: 1,
    })
    expect(first.session.attempted).toBe(0)
    expect(first.attempts).toHaveLength(0)
  })
  it('ignores stale IDs, duplicate callbacks, invalid choices and invalid result values', () => {
    const first = createPracticeSession(configuration)
    expect(recordSessionResult(first, 'unknown', true, 1)).toBe(first)
    expect(recordSessionResult(first, first.question!.id, true, -1)).toBe(first)
    expect(
      recordSessionResult(
        first,
        first.question!.id,
        'yes' as unknown as boolean,
        first.question!.choices[0],
      ),
    ).toBe(first)
    const second = recordSessionResult(
      first,
      first.question!.id,
      true,
      first.question!.choices[0],
    )
    expect(
      recordSessionResult(
        second,
        first.question!.id,
        false,
        first.question!.choices[0],
      ),
    ).toBe(second)
    expect(second.attempts).toHaveLength(1)
  })
  it.each([5, 10, 20])(
    'stops at exactly %s attempts without generating an extra question',
    (length) => {
      let state = createPracticeSession({
        ...configuration,
        sessionLength: length,
      })
      for (let index = 0; index < length; index++) {
        const current = state.question!
        state = recordSessionResult(
          state,
          current.id,
          index % 2 === 0,
          current.choices[0],
        )
      }
      expect(state.session.attempted).toBe(length)
      expect(state.session.correct + state.session.incorrect).toBe(length)
      expect(state.attempts).toHaveLength(length)
      expect(
        new Set(state.attempts.map((attempt) => attempt.questionId)).size,
      ).toBe(length)
      expect(state.isActive).toBe(false)
      expect(state.question).toBeNull()
      expect(state.session.completedAt).toBeDefined()
      expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(
        length,
      )
      expect(
        recordSessionResult(state, state.attempts.at(-1)!.questionId, true, 0),
      ).toBe(state)
      expect(retrySessionQuestion(state)).toBe(state)
      expect(endPracticeSession(state)).toBe(state)
    },
  )
  it('continues beyond 20 questions and ignores unanswered cards when ending', () => {
    let state = createPracticeSession({
      ...configuration,
      sessionLength: 'continuous',
    })
    for (let index = 0; index < 25; index++)
      state = recordSessionResult(
        state,
        state.question!.id,
        true,
        state.question!.choices[0],
      )
    expect(state.session.attempted).toBe(25)
    expect(state.isActive).toBe(true)
    expect(state.question).not.toBeNull()
    const ended = endPracticeSession(state)
    expect(ended.isActive).toBe(false)
    expect(ended.question).toBeNull()
    expect(ended.session.attempted).toBe(25)
    expect(ended.attempts).toHaveLength(25)
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(26)
    expect(
      recordSessionResult(
        ended,
        state.question!.id,
        true,
        state.question!.choices[0],
      ),
    ).toBe(ended)
  })
  it('can end continuous practice before any answer', () => {
    const state = endPracticeSession(
      createPracticeSession({ ...configuration, sessionLength: 'continuous' }),
    )
    expect(state.session).toMatchObject({
      attempted: 0,
      correct: 0,
      incorrect: 0,
    })
    expect(state.isActive).toBe(false)
  })
  it('retries an exact consecutive expression even when the IDs differ', () => {
    const initial = question(1)
    vi.mocked(generator.generateMultipleChoiceQuestion)
      .mockReset()
      .mockReturnValueOnce(initial)
      .mockReturnValueOnce({ ...initial, id: 'repeat-id' })
      .mockReturnValueOnce(question(2))
    const first = createPracticeSession(configuration)
    const second = recordSessionResult(
      first,
      initial.id,
      true,
      initial.choices[0],
    )
    expect(second.question?.displayText).toBe(question(2).displayText)
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(3)
  })
  it('bounds repeat retries instead of hanging when randomness keeps repeating', () => {
    let index = 0
    vi.mocked(generator.generateMultipleChoiceQuestion).mockImplementation(
      () => ({ ...question(1), id: `repeat-${index++}` }),
    )
    const first = createPracticeSession(configuration)
    const second = recordSessionResult(
      first,
      first.question!.id,
      true,
      first.question!.choices[0],
    )
    expect(second.question?.displayText).toBe(first.question?.displayText)
    expect(second.isActive).toBe(true)
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(
      1 + MAX_REPEAT_ATTEMPTS,
    )
  })
  it('automatically retries a transient initial failure without creating attempts', () => {
    vi.mocked(generator.generateMultipleChoiceQuestion).mockImplementationOnce(
      () => {
        throw new Error('failed')
      },
    )
    const first = createPracticeSession(configuration)
    expect(first.error).toBeNull()
    expect(first.question).not.toBeNull()
    const recovered = retrySessionQuestion(first)
    expect(recovered.error).toBeNull()
    expect(recovered.question).not.toBeNull()
    expect(recovered.session.attempted).toBe(0)
  })
  it('retains a recorded attempt if loading the following question fails', () => {
    const first = createPracticeSession(configuration)
    vi.mocked(generator.generateMultipleChoiceQuestion).mockImplementation(
      () => {
        throw new Error('failed')
      },
    )
    const fallback = vi
      .spyOn(recovery, 'generateFallbackQuestion')
      .mockImplementation(() => {
        throw new Error('fallback failed')
      })
    const second = recordSessionResult(
      first,
      first.question!.id,
      true,
      first.question!.choices[0],
    )
    expect(second.error).not.toBeNull()
    expect(second.session.attempted).toBe(1)
    expect(second.question).toBeNull()
    expect(recordSessionResult(second, first.question!.id, false, 0)).toBe(
      second,
    )
    vi.mocked(generator.generateMultipleChoiceQuestion).mockImplementation(() =>
      question(++generated),
    )
    fallback.mockRestore()
    const recovered = retrySessionQuestion(second)
    expect(recovered.session.attempted).toBe(1)
    expect(recovered.attempts).toHaveLength(1)
    expect(recovered.question).not.toBeNull()
  })
})
