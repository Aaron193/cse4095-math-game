import { describe, expect, it } from 'vitest'
import { practiceData } from '../test/practiceData'
import {
  accuracy,
  calculateStatistics,
  recentSessions,
  sessionTotals,
} from './statisticsService'
import { operations } from './questionRules'

describe('statistics from canonical attempts', () => {
  it('handles a new user and zero attempts', () => {
    const stats = calculateStatistics([])
    expect(stats).toMatchObject({ attempted: 0, correct: 0, incorrect: 0 })
    expect(accuracy(stats)).toBe(0)
    for (const operation of operations)
      expect(accuracy(stats.byOperation[operation])).toBe(0)
  })
  it.each([true, false])(
    'calculates all-%s sessions and respects self-reports',
    (correct) => {
      const { attempts } = practiceData([
        {
          operation: 'addition',
          difficulty: 1,
          results: [correct, correct, correct],
        },
      ])
      // Deliberately disagree with the mathematical answer: self-report is authoritative.
      const stats = calculateStatistics(
        attempts.map((attempt) => ({
          ...attempt,
          selectedAnswer: attempt.correctAnswer === 0 ? 1 : 0,
        })),
      )
      expect(stats).toMatchObject({
        attempted: 3,
        correct: correct ? 3 : 0,
        incorrect: correct ? 0 : 3,
      })
      expect(accuracy(stats)).toBe(correct ? 100 : 0)
    },
  )
  it('groups every operation and difficulty and rounds accuracy consistently with summaries', () => {
    const { attempts } = practiceData(
      operations.map((operation, index) => ({
        operation,
        difficulty: (index + 1) as 1 | 2 | 3 | 4,
        results: [true, false, false],
      })),
    )
    const stats = calculateStatistics(attempts)
    expect(stats).toMatchObject({ attempted: 12, correct: 4, incorrect: 8 })
    expect(accuracy(stats)).toBe(33.3)
    for (const operation of operations)
      expect(stats.byOperation[operation]).toEqual({
        attempted: 3,
        correct: 1,
        incorrect: 2,
      })
    for (const difficulty of [1, 2, 3, 4] as const)
      expect(stats.byDifficulty[difficulty]).toEqual({
        attempted: 3,
        correct: 1,
        incorrect: 2,
      })
  })
  it('derives session totals from only its own attempts', () => {
    const data = practiceData([
      { operation: 'division', difficulty: 2, results: [false] },
      { operation: 'subtraction', difficulty: 3, results: [true, true] },
    ])
    for (const session of data.sessions)
      expect(
        sessionTotals({ ...session, attempted: 999 }, data.attempts),
      ).toEqual(session)
  })
  it('sorts recent sessions newest first, includes unfinished sessions, limits the list, and does not mutate input', () => {
    const { sessions } = practiceData()
    const original = [
      {
        ...sessions[0],
        id: 'old',
        startedAt: '2026-01-01T10:00:00Z',
        completedAt: '2026-01-01T10:01:00Z',
      },
      {
        ...sessions[0],
        id: 'unfinished',
        startedAt: '2026-03-01T10:00:00Z',
        completedAt: undefined,
      },
      {
        ...sessions[0],
        id: 'new',
        startedAt: '2026-02-01T10:00:00Z',
        completedAt: '2026-02-01T10:01:00Z',
      },
    ]
    expect(recentSessions(original, 2).map((session) => session.id)).toEqual([
      'unfinished',
      'new',
    ])
    expect(original[0].id).toBe('old')
  })
  it('calculates several thousand attempts without changing input', () => {
    const { attempts } = practiceData()
    const many = Array.from({ length: 6000 }, (_, i) => ({
      ...attempts[i % 2],
      id: `a-${i}`,
      questionId: `q-${i}`,
    }))
    expect(calculateStatistics(many)).toMatchObject({
      attempted: 6000,
      correct: 3000,
      incorrect: 3000,
    })
    expect(many[0]).toEqual({ ...attempts[0], id: 'a-0', questionId: 'q-0' })
  })
})
