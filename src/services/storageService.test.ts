import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPracticeSession,
  endPracticeSession,
  recordSessionResult,
} from './practiceSession'
import {
  clearApplicationStorage,
  defaultSettings,
  emptyData,
  MAX_SESSION_RECORDS,
  normalizeData,
  readStorage,
  restoreCompletedSession,
  saveSession,
  STORAGE_KEY,
  writeStorage,
} from './storageService'

export function savedFixture() {
  let state = createPracticeSession({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 'continuous',
  })
  const q = state.question!
  state = recordSessionResult(state, q.id, false, q.choices[0])
  return saveSession(emptyData(), endPracticeSession(state))
}
afterEach(() => vi.restoreAllMocks())
describe('versioned local storage', () => {
  it('returns independent defaults for a new browser', () => {
    expect(readStorage()).toEqual({
      data: emptyData(),
      warning: null,
      writable: true,
    })
    const defaults = defaultSettings()
    defaults.defaultOperations.push('division')
    expect(defaultSettings().defaultOperations).toEqual(['addition'])
  })
  it('round-trips settings, session metadata, full attempts, and cached totals', () => {
    const data = savedFixture()
    data.settings.cardAnimationEnabled = false
    expect(writeStorage(data)).toBeNull()
    const read = readStorage()
    expect(read.warning).toBeNull()
    expect(read.data).toEqual(data)
    expect(read.data.attempts[0]).toMatchObject({
      selectedAnswer: expect.any(Number),
      selfReportedCorrect: false,
      operation: 'addition',
      difficulty: 1,
      sessionId: data.sessions[0].id,
      attemptedAt: expect.any(String),
    })
    expect(restoreCompletedSession(read.data)).toMatchObject({
      isActive: false,
      question: null,
      session: { attempted: 1, incorrect: 1 },
    })
  })
  it('persists each accepted result immediately and never restores an active card', () => {
    let state = createPracticeSession({
      operations: ['division'],
      difficulty: 2,
      sessionLength: 5,
    })
    const q = state.question!
    state = recordSessionResult(state, q.id, true, q.choices[0])
    writeStorage(saveSession(emptyData(), state))
    expect(readStorage().data.attempts).toHaveLength(1)
    expect(restoreCompletedSession(readStorage().data)).toBeNull()
  })
  it('deduplicates IDs and question IDs on repeated saves and reload', () => {
    const data = savedFixture(),
      state = restoreCompletedSession(data)!
    const repeated = saveSession(saveSession(data, state), state)
    repeated.attempts.push(
      { ...data.attempts[0], id: 'duplicate-question' },
      { ...data.attempts[0], questionId: 'duplicate-id' },
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repeated))
    expect(readStorage().data.attempts).toHaveLength(1)
    expect(readStorage().data.statistics.attempted).toBe(1)
    expect(readStorage().data.sessions[0].attempted).toBe(1)
  })
  it.each([undefined, 0])(
    'migrates schema %s without losing valid records',
    (version) => {
      const data = savedFixture()
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version }))
      expect(readStorage().data).toEqual(data)
      writeStorage(readStorage().data)
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(2)
    },
  )
  it('preserves unsupported schema data until an explicit clear', () => {
    const raw = JSON.stringify({ version: 99, attempts: ['new format'] })
    localStorage.setItem(STORAGE_KEY, raw)
    expect(readStorage()).toMatchObject({
      writable: false,
      warning: expect.stringContaining('different application version'),
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })
  it.each(['broken JSON', 'null', '[]'])(
    'recovers malformed JSON/document: %s',
    (raw) => {
      localStorage.setItem(STORAGE_KEY, raw)
      expect(readStorage().data).toEqual(emptyData())
      expect(readStorage().warning).toBeTruthy()
    },
  )
  it('repairs invalid settings and statistics without losing good attempts', () => {
    const data = savedFixture()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        settings: { defaultDifficulty: 99 },
        statistics: { attempted: 1000 },
        attempts: [
          ...data.attempts,
          {
            ...data.attempts[0],
            id: 'bad',
            questionId: 'bad',
            correctAnswer: -1,
          },
        ],
      }),
    )
    const read = readStorage()
    expect(read.warning).toBeTruthy()
    expect(read.data.settings).toEqual(defaultSettings())
    expect(read.data.statistics.attempted).toBe(1)
    expect(read.data.attempts).toHaveLength(1)
  })
  it.each([
    { selectedAnswer: -1 },
    { selectedAnswer: 0.5 },
    { selfReportedCorrect: 'yes' },
    { attemptedAt: 'yesterday' },
    { operation: 'power' },
    { secondOperand: -1 },
    { difficulty: 9 },
  ])('rejects invalid attempt fields: %j', (patch) => {
    const data = savedFixture()
    expect(
      normalizeData({ ...data, attempts: [{ ...data.attempts[0], ...patch }] })
        .attempts,
    ).toEqual([])
  })
  it('repairs session totals, filters invalid session metadata, and retains zero-attempt sessions', () => {
    const data = savedFixture()
    const normalized = normalizeData({
      ...data,
      sessions: [
        { ...data.sessions[0], attempted: 999 },
        { ...data.sessions[0], id: 'bad', startedAt: 'bad' },
        { ...data.sessions[0], id: 'zero' },
      ],
    })
    expect(normalized.sessions).toHaveLength(2)
    expect(
      normalized.sessions.find((s) => s.id === data.sessions[0].id)?.attempted,
    ).toBe(1)
    expect(normalized.sessions.find((s) => s.id === 'zero')?.attempted).toBe(0)
  })
  it('bounds older session metadata but retains attempts and lifetime totals', () => {
    const data = savedFixture()
    const sessions = Array.from(
      { length: MAX_SESSION_RECORDS + 5 },
      (_, i) => ({
        ...data.sessions[0],
        id: `session-${i}`,
        startedAt: new Date(Date.UTC(2026, 0, 1)).toISOString(),
        completedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      }),
    )
    const normalized = normalizeData({ ...data, sessions })
    expect(normalized.sessions).toHaveLength(MAX_SESSION_RECORDS)
    expect(normalized.sessions[0].id).toBe(`session-${MAX_SESSION_RECORDS + 4}`)
    expect(normalized.statistics.attempted).toBe(1)
    expect(normalized.attempts).toEqual(data.attempts)
  })
  it('survives storage getter/security failures and quota exhaustion', () => {
    const unavailable = () => {
      throw new DOMException('Denied', 'SecurityError')
    }
    expect(readStorage(unavailable).warning).toBeTruthy()
    expect(writeStorage(emptyData(), unavailable)).toBeTruthy()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    expect(writeStorage(savedFixture())).toContain('keep practicing')
  })
  it('clears only application-owned keys, including future mistake data', () => {
    localStorage.setItem('unrelated', 'keep')
    localStorage.setItem('mathPractice.mistakePatterns', 'old')
    writeStorage(savedFixture())
    expect(clearApplicationStorage()).toBeNull()
    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('unrelated')).toBe('keep')
    expect(readStorage().data).toEqual(emptyData())
  })
  it('reports deletion failures instead of crashing', () => {
    writeStorage(savedFixture())
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Denied')
    })
    expect(clearApplicationStorage()).toContain(
      'could not be completely erased',
    )
  })
})

it('validates optional review links and mastery completion metadata without discarding other valid records', () => {
  const data = savedFixture()
  for (const patch of [
    { mistakePatternId: '' },
    { mistakePatternId: 3 },
    { source: 'regular', mistakePatternId: 'parent' },
  ]) {
    const repaired = normalizeData({
      ...data,
      attempts: [{ ...data.attempts[0], ...patch }],
    })
    expect(repaired.attempts).toHaveLength(0)
    expect(repaired.mistakePatterns).toHaveLength(0)
  }
  const repaired = normalizeData({
    ...data,
    sessions: [{ ...data.sessions[0], completionReason: 'unknown' }],
  })
  expect(repaired.sessions).toHaveLength(0)
  expect(repaired.attempts).toHaveLength(1)
})
