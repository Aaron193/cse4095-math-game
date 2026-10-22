import { describe, expect, it } from 'vitest'
import {
  createPracticeSession,
  endPracticeSession,
  recordSessionResult,
  retrySessionQuestion,
} from './practiceSession'
import {
  emptyData,
  normalizeData,
  readStorage,
  restoreSavedSession,
  saveSession,
  writeStorage,
} from './storageService'
import type { PracticeSessionState } from '../types/session'

function start() {
  return createPracticeSession({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
  })
}
function checkpoint(state: PracticeSessionState) {
  const data = saveSession(emptyData(), state)
  writeStorage(data)
  return restoreSavedSession(readStorage().data)!
}
describe('active session checkpoints', () => {
  it('restores the same question, choice order, selection and flipped face without counting an answer', () => {
    const state = start()
    state.cardState = {
      selectedAnswer: state.question!.choices[2],
      isCardFlipped: true,
    }
    const restored = checkpoint(state)
    expect(restored).toMatchObject({
      session: state.session,
      question: state.question,
      cardState: state.cardState,
      currentQuestionIndex: 0,
      attempts: [],
      isActive: true,
    })
    expect(readStorage().data.statistics.attempted).toBe(0)
  })
  it('restores progress and the new unselected card after an answer, ignoring stale duplicate callbacks', () => {
    const first = start(),
      q = first.question!
    const state = recordSessionResult(first, q.id, false, q.choices[0])
    const restored = checkpoint(state)
    expect(restored).toMatchObject({
      session: { attempted: 1, incorrect: 1 },
      cardState: { selectedAnswer: null, isCardFlipped: false },
      currentQuestionIndex: 1,
      question: state.question,
    })
    expect(recordSessionResult(restored, q.id, false, q.choices[0])).toBe(
      restored,
    )
    writeStorage(saveSession(readStorage().data, restored))
    expect(readStorage().data.statistics.attempted).toBe(1)
    expect(readStorage().data.mistakePatterns[0].incorrectCount).toBe(1)
  })
  it('repairs an invalid selection without discarding the question or unrelated history', () => {
    const data = saveSession(emptyData(), start())
    const repaired = normalizeData({
      ...data,
      activeSession: {
        ...data.activeSession,
        cardState: { selectedAnswer: -999, isCardFlipped: true },
      },
    })
    expect(repaired.activeSession?.question).toEqual(
      data.activeSession?.question,
    )
    expect(repaired.activeSession?.cardState).toEqual({
      selectedAnswer: null,
      isCardFlipped: false,
    })
  })
  it('keeps accepted answers while replacing a corrupt or already-recorded card with a retry action', () => {
    const first = start(),
      q = first.question!
    const state = recordSessionResult(first, q.id, true, q.choices[0])
    const data = saveSession(emptyData(), state)
    for (const question of [{ ...state.question, choices: [1, 1] }, q]) {
      const repaired = normalizeData({
        ...data,
        activeSession: { ...data.activeSession, question },
      })
      const restored = restoreSavedSession(repaired)!
      expect(restored.question).toBeNull()
      expect(restored.error).toContain('answers are safe')
      expect(restored.session.attempted).toBe(1)
      expect(retrySessionQuestion(restored).question).not.toBeNull()
    }
  })
  it('clears checkpoints on completion/end and never resurrects a completed session as active', () => {
    let state = start()
    for (let i = 0; i < 5; i++)
      state = recordSessionResult(
        state,
        state.question!.id,
        true,
        state.question!.choices[0],
      )
    const data = saveSession(emptyData(), state)
    expect(data.activeSession).toBeNull()
    expect(restoreSavedSession(data)?.isActive).toBe(false)
    expect(
      saveSession(emptyData(), endPracticeSession(start())).activeSession,
    ).toBeNull()
    expect(
      normalizeData({
        ...data,
        activeSession: {
          sessionId: state.session.id,
          question: start().question,
        },
      }).activeSession,
    ).toBeNull()
  })
  it('repairs a missing completion timestamp once the canonical fixed length is exhausted', () => {
    let state = start()
    for (let i = 0; i < 5; i++)
      state = recordSessionResult(
        state,
        state.question!.id,
        true,
        state.question!.choices[0],
      )
    const data = saveSession(emptyData(), state)
    const repaired = normalizeData({
      ...data,
      sessions: data.sessions.map((session) => ({
        ...session,
        completedAt: undefined,
      })),
      activeSession: {
        sessionId: state.session.id,
        question: start().question,
      },
    })
    expect(repaired.activeSession).toBeNull()
    expect(restoreSavedSession(repaired)?.session.attempted).toBe(5)
    expect(restoreSavedSession(repaired)?.isActive).toBe(false)
  })
})
