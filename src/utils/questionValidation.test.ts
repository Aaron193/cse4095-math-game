import { describe, expect, it } from 'vitest'
import type { Question } from '../types/question'
import { validateQuestion } from './validation'

function fixture(): Question {
  return {
    id: 'complete-fixture',
    operation: 'addition',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 15,
    difficulty: 1,
    displayText: '7 + 8 = ?',
    source: 'regular',
    choices: [14, 15, 16, 17],
  }
}

describe('complete question validation', () => {
  it('accepts complete data and preserves the question and supplied IDs', () => {
    const question = Object.freeze({
      ...fixture(),
      choices: Object.freeze([14, 15, 16, 17]),
    })
    const ids = new Set<string>()
    expect(() => validateQuestion(question, ids)).not.toThrow()
    expect(ids.size).toBe(0)
    expect(question.choices).toEqual([14, 15, 16, 17])
  })
  it.each(
    [
      undefined,
      null,
      '14,15,16,17',
      [],
      [15],
      [14, 15, 16],
      [13, 14, 15, 16, 17],
    ].map((choices) => ({ choices })),
  )('rejects missing/nonarray/wrong-length choices %j', ({ choices }) => {
    expect(() => validateQuestion({ ...fixture(), choices })).toThrow(
      'exactly four',
    )
  })
  it.each(
    [
      [15, 15, 16, 17],
      [14, 15, 14, 17],
      [15, 15, 15, 15],
    ].map((choices) => ({ choices })),
  )(
    'rejects duplicates, including repeated correct answers: %j',
    ({ choices }) => {
      expect(() => validateQuestion({ ...fixture(), choices })).toThrow(
        'unique',
      )
    },
  )
  it('rejects a set of unique choices with no correct answer', () => {
    expect(() =>
      validateQuestion({ ...fixture(), choices: [1, 2, 3, 4] }),
    ).toThrow('exactly once')
  })
  it.each([
    -1,
    2.5,
    NaN,
    Infinity,
    '14',
    null,
    undefined,
    true,
    Number.MAX_SAFE_INTEGER + 1,
  ])('rejects invalid numeric choice %s', (choice) => {
    expect(() =>
      validateQuestion({ ...fixture(), choices: [choice, 15, 16, 17] }),
    ).toThrow('nonnegative whole numbers')
  })
  it('rejects sparse arrays rather than ignoring missing entries', () => {
    const choices = [14, 15, 16, 17]
    delete choices[0]
    expect(() => validateQuestion({ ...fixture(), choices })).toThrow(
      'nonnegative whole numbers',
    )
  })
  it('enforces operation-specific answer ceilings at the selected level', () => {
    const fixtures: Question[] = [
      { ...fixture(), choices: [15, 16, 17, 21] },
      {
        ...fixture(),
        operation: 'subtraction',
        firstOperand: 10,
        secondOperand: 2,
        correctAnswer: 8,
        displayText: '10 − 2 = ?',
        choices: [8, 9, 10, 11],
      },
      {
        ...fixture(),
        operation: 'multiplication',
        firstOperand: 5,
        secondOperand: 5,
        correctAnswer: 25,
        displayText: '5 × 5 = ?',
        choices: [23, 24, 25, 26],
      },
      {
        ...fixture(),
        operation: 'division',
        firstOperand: 25,
        secondOperand: 5,
        correctAnswer: 5,
        displayText: '25 ÷ 5 = ?',
        choices: [3, 4, 5, 6],
      },
      {
        ...fixture(),
        operation: 'division',
        difficulty: 3,
        firstOperand: 144,
        secondOperand: 12,
        correctAnswer: 12,
        displayText: '144 ÷ 12 = ?',
        choices: [10, 11, 12, 13],
      },
    ]
    for (const question of fixtures)
      expect(() => validateQuestion(question)).toThrow('difficulty range')
  })
  it('retains arithmetic, difficulty, ID, and source validation', () => {
    expect(() => validateQuestion(null)).toThrow()
    expect(() => validateQuestion({ ...fixture(), correctAnswer: 14 })).toThrow(
      'mathematically incorrect',
    )
    expect(() => validateQuestion({ ...fixture(), difficulty: 5 })).toThrow(
      'Difficulty',
    )
    expect(() => validateQuestion({ ...fixture(), firstOperand: 11 })).toThrow()
    expect(() => validateQuestion({ ...fixture(), source: 'invalid' })).toThrow(
      'source',
    )
    expect(() =>
      validateQuestion(fixture(), new Set(['complete-fixture'])),
    ).toThrow('already been used')
  })
  it('rejects fractional division even when its four choices are whole numbers', () => {
    expect(() =>
      validateQuestion({
        ...fixture(),
        operation: 'division',
        firstOperand: 5,
        secondOperand: 2,
        correctAnswer: 2,
        displayText: '5 ÷ 2 = ?',
        choices: [1, 2, 3, 4],
      }),
    ).toThrow('whole-number')
  })
  it('accepts zero as a correct answer without negative distractors', () => {
    expect(() =>
      validateQuestion({
        ...fixture(),
        firstOperand: 0,
        secondOperand: 0,
        correctAnswer: 0,
        displayText: '0 + 0 = ?',
        choices: [3, 1, 0, 2],
      }),
    ).not.toThrow()
  })
})
