import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import usePracticeSession from './usePracticeSession'

describe('practice session hook', () => {
  it('guards duplicate callbacks synchronously before React rerenders', () => {
    const { result } = renderHook(() => usePracticeSession())
    act(() => {
      result.current.startSession({
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 5,
      })
    })
    const question = result.current.state!.question!
    const record = result.current.recordResult
    act(() => {
      record(question.id, true, question.choices[0])
      record(question.id, false, question.choices[0])
    })
    expect(result.current.state!.session).toMatchObject({
      attempted: 1,
      correct: 1,
      incorrect: 0,
    })
    expect(result.current.state!.attempts).toHaveLength(1)
  })
  it('rejects invalid setup and does not implicitly create or restart a session', () => {
    const { result, rerender } = renderHook(() => usePracticeSession())
    expect(result.current.state).toBeNull()
    act(() => {
      expect(
        result.current.startSession({
          operations: [],
          difficulty: 1,
          sessionLength: 5,
        }),
      ).toBe(false)
    })
    expect(result.current.state).toBeNull()
    act(() => {
      result.current.startSession({
        operations: ['division'],
        difficulty: 1,
        sessionLength: 'continuous',
      })
    })
    act(() => {
      result.current.endSession()
    })
    const completed = result.current.state
    rerender()
    expect(result.current.state).toBe(completed)
    expect(result.current.state!.isActive).toBe(false)
  })
})
