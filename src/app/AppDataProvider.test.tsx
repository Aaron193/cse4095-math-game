import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppDataProvider from './AppDataProvider'
import { useAppData } from './appDataContext'
import {
  createPracticeSession,
  endPracticeSession,
  recordSessionResult,
} from '../services/practiceSession'
import { readStorage, STORAGE_KEY } from '../services/storageService'

afterEach(() => vi.restoreAllMocks())
function resultState() {
  let state = createPracticeSession({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 'continuous',
  })
  state = recordSessionResult(
    state,
    state.question!.id,
    true,
    state.question!.choices[0],
  )
  return endPracticeSession(state)
}
describe('application data integration', () => {
  it('saves once per question even across batched/repeated callbacks and remounts', () => {
    const state = resultState()
    const first = renderHook(useAppData, { wrapper: AppDataProvider })
    act(() => {
      first.result.current.saveSession(state)
      first.result.current.saveSession(state)
    })
    expect(first.result.current.data.statistics.attempted).toBe(1)
    first.unmount()
    const reopened = renderHook(useAppData, { wrapper: AppDataProvider })
    expect(reopened.result.current.data.attempts).toEqual(state.attempts)
    expect(reopened.result.current.data.sessions[0]).toEqual(state.session)
    act(() => reopened.result.current.saveSession(state))
    expect(readStorage().data.statistics.attempted).toBe(1)
  })
  it('persists valid settings and rejects invalid settings', () => {
    const first = renderHook(useAppData, { wrapper: AppDataProvider })
    act(() =>
      first.result.current.saveSettings({
        ...first.result.current.data.settings,
        cardAnimationEnabled: false,
        defaultDifficulty: 4,
        defaultSessionLength: 20,
        defaultOperations: ['division'],
      }),
    )
    expect(readStorage().data.settings).toMatchObject({
      cardAnimationEnabled: false,
      defaultDifficulty: 4,
      defaultOperations: ['division'],
      defaultSessionLength: 20,
    })
    act(() =>
      first.result.current.saveSettings({
        ...first.result.current.data.settings,
        defaultOperations: [],
      }),
    )
    expect(first.result.current.data.settings.defaultOperations).toEqual([
      'division',
    ])
  })
  it('keeps results in memory when saving fails', () => {
    const first = renderHook(useAppData, { wrapper: AppDataProvider })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Full')
    })
    act(() => first.result.current.saveSession(resultState()))
    expect(first.result.current.data.statistics.attempted).toBe(1)
    expect(first.result.current.warning).toContain('keep practicing')
  })
  it('does not overwrite unknown schema versions', () => {
    const raw = '{"version":99,"future":"keep"}'
    localStorage.setItem(STORAGE_KEY, raw)
    const first = renderHook(useAppData, { wrapper: AppDataProvider })
    act(() => first.result.current.saveSession(resultState()))
    expect(first.result.current.data.statistics.attempted).toBe(1)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    expect(first.result.current.warning).toContain(
      'different application version',
    )
  })
})
