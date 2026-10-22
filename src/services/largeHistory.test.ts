import { expect, it } from 'vitest'
import { generateMultipleChoiceQuestion } from './questionGenerator'
import {
  emptyData,
  normalizeData,
  readStorage,
  writeStorage,
} from './storageService'
import { recentSessions } from './statisticsService'

it('round-trips 5,010 attempts, caps session metadata and preserves lifetime totals', () => {
  const data = emptyData()
  const question = generateMultipleChoiceQuestion('division', 3, () => 0.5)
  for (let index = 0; index < 501; index++) {
    const timestamp = new Date(
      Date.UTC(2026, 0, 1) + index * 60_000,
    ).toISOString()
    const sessionId = `session-${index}`
    data.sessions.push({
      id: sessionId,
      startedAt: timestamp,
      completedAt: timestamp,
      operations: ['division'],
      difficulty: 3,
      sessionLength: 10,
      attempted: 999,
      correct: 999,
      incorrect: 999,
    })
    for (let item = 0; item < 10; item++) {
      data.attempts.push({
        id: `attempt-${index}-${item}`,
        questionId: `question-${index}-${item}`,
        sessionId,
        attemptedAt: timestamp,
        operation: question.operation,
        difficulty: question.difficulty,
        firstOperand: question.firstOperand,
        secondOperand: question.secondOperand,
        correctAnswer: question.correctAnswer,
        selectedAnswer: question.choices[0],
        selfReportedCorrect: item !== 0,
        source: 'regular',
      })
    }
  }
  expect(writeStorage(normalizeData(data))).toBeNull()
  const restored = readStorage()
  expect(restored.warning).toBeNull()
  expect(restored.data.attempts).toHaveLength(5010)
  expect(restored.data.statistics).toMatchObject({
    attempted: 5010,
    correct: 4509,
    incorrect: 501,
  })
  expect(restored.data.statistics.byOperation.division.attempted).toBe(5010)
  expect(restored.data.statistics.byDifficulty[3].attempted).toBe(5010)
  expect(restored.data.sessions).toHaveLength(500)
  expect(
    restored.data.sessions.every(
      (s) => s.attempted === 10 && s.correct === 9 && s.incorrect === 1,
    ),
  ).toBe(true)
  expect(recentSessions(restored.data.sessions)).toHaveLength(20)
  expect(restored.data.mistakePatterns[0].incorrectCount).toBe(501)
})
