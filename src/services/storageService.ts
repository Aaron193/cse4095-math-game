import type { MistakePattern } from '../types/mistake'
import {
  DEFAULT_MASTERY_THRESHOLD,
  deriveMistakePatterns,
} from './mistakeService'
import type { AppSettings } from '../types/settings'
import type {
  PracticeAttempt,
  PracticeSession,
  PracticeSessionState,
} from '../types/session'
import type { AppStatistics } from '../types/statistics'
import { isPracticeConfiguration } from './practiceSession'
import {
  getAnswerChoiceMax,
  isMathOperation,
  operationSymbols,
} from './questionRules'
import { validateArithmeticQuestion } from '../utils/validation'
import {
  calculateStatistics,
  recentSessions,
  sessionTotals,
} from './statisticsService'

export const STORAGE_KEY = 'mathPractice.data'
export const SCHEMA_VERSION = 2
// Retain all attempts for lifetime totals; bound only older session metadata.
export const MAX_SESSION_RECORDS = 500
export interface StoredData {
  version: typeof SCHEMA_VERSION
  settings: AppSettings
  sessions: PracticeSession[]
  attempts: PracticeAttempt[]
  statistics: AppStatistics
  mistakePatterns: MistakePattern[]
}
export interface StorageResult {
  data: StoredData
  warning: string | null
  writable: boolean
}
export function defaultSettings(): AppSettings {
  return {
    soundEnabled: false,
    cardAnimationEnabled: true,
    showExplanations: false,
    defaultSessionLength: 10,
    defaultDifficulty: 1,
    defaultOperations: ['addition'],
    masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
  }
}
export function emptyData(): StoredData {
  return {
    version: SCHEMA_VERSION,
    settings: defaultSettings(),
    sessions: [],
    attempts: [],
    statistics: calculateStatistics([]),
    mistakePatterns: [],
  }
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const identifier = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const timestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value))

export function isAppSettings(value: unknown): value is AppSettings {
  if (!object(value)) return false
  return (
    ['soundEnabled', 'cardAnimationEnabled', 'showExplanations'].every(
      (key) => typeof value[key] === 'boolean',
    ) &&
    isPracticeConfiguration({
      operations: value.defaultOperations,
      difficulty: value.defaultDifficulty,
      sessionLength: value.defaultSessionLength,
    }) &&
    new Set(value.defaultOperations as unknown[]).size ===
      (value.defaultOperations as unknown[]).length &&
    Number.isSafeInteger(value.masteryThreshold) &&
    (value.masteryThreshold as number) > 0
  )
}
function isAttempt(value: unknown): value is PracticeAttempt {
  if (
    !object(value) ||
    !identifier(value.id) ||
    !identifier(value.questionId) ||
    !identifier(value.sessionId) ||
    !timestamp(value.attemptedAt) ||
    typeof value.selfReportedCorrect !== 'boolean' ||
    (value.mistakePatternId !== undefined &&
      (!identifier(value.mistakePatternId) ||
        value.source !== 'mistake-review')) ||
    !isMathOperation(value.operation)
  )
    return false
  try {
    const question = {
      ...value,
      id: value.questionId,
      displayText: `${value.firstOperand} ${operationSymbols[value.operation]} ${value.secondOperand} = ?`,
    }
    validateArithmeticQuestion(question)
    return (
      typeof value.selectedAnswer === 'number' &&
      Number.isSafeInteger(value.selectedAnswer) &&
      value.selectedAnswer >= 0 &&
      value.selectedAnswer <= getAnswerChoiceMax(question)
    )
  } catch {
    return false
  }
}
function isSession(value: unknown): value is PracticeSession {
  return (
    object(value) &&
    identifier(value.id) &&
    timestamp(value.startedAt) &&
    (value.completedAt === undefined ||
      (timestamp(value.completedAt) &&
        Date.parse(value.completedAt) >= Date.parse(value.startedAt))) &&
    (value.completionReason === undefined ||
      (value.completionReason === 'mastered' &&
        value.mode === 'mistake-review' &&
        timestamp(value.completedAt))) &&
    isPracticeConfiguration(value)
  )
}
export function uniqueAttempts(attempts: readonly PracticeAttempt[]) {
  const ids = new Set<string>(),
    questions = new Set<string>()
  return attempts.filter((attempt) => {
    if (ids.has(attempt.id) || questions.has(attempt.questionId)) return false
    ids.add(attempt.id)
    questions.add(attempt.questionId)
    return true
  })
}
/** Repair independent sections and recompute cached totals rather than trusting JSON counters. */
export function normalizeData(value: unknown): StoredData {
  const data = object(value) ? value : {}
  const attempts = uniqueAttempts(
    Array.isArray(data.attempts) ? data.attempts.filter(isAttempt) : [],
  )
  const sessions = new Map<string, PracticeSession>()
  if (Array.isArray(data.sessions))
    for (const session of data.sessions.filter(isSession)) {
      sessions.set(session.id, sessionTotals(session, attempts))
    }
  const settings = isAppSettings(data.settings)
    ? {
        ...data.settings,
        defaultOperations: [...data.settings.defaultOperations],
      }
    : defaultSettings()
  // These two features have no implementation yet; do not retain a misleading enabled preference.
  settings.soundEnabled = false
  settings.showExplanations = false
  return {
    version: SCHEMA_VERSION,
    settings,
    attempts,
    sessions: recentSessions([...sessions.values()], MAX_SESSION_RECORDS),
    statistics: calculateStatistics(attempts),
    mistakePatterns: deriveMistakePatterns(attempts, settings.masteryThreshold),
  }
}
function browserStorage(): Storage {
  return window.localStorage
}
const unavailable =
  'Your progress could not be saved. You can keep practicing, but new progress may be lost when you close or refresh this page.'
/** Missing-version/version-0/version-1 snapshots share today's fields; add future migrations here. */
function migrate(value: unknown): unknown {
  if (!object(value)) throw new Error('Invalid storage document')
  if (value.version === undefined || value.version === 0 || value.version === 1)
    return { ...value, version: SCHEMA_VERSION }
  return value
}
export function readStorage(
  getStorage: () => Storage = browserStorage,
): StorageResult {
  const initial = emptyData()
  let raw: string | null
  try {
    raw = getStorage().getItem(STORAGE_KEY)
  } catch {
    return { data: initial, warning: unavailable, writable: true }
  }
  if (raw === null) return { data: initial, warning: null, writable: true }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      object(parsed) &&
      parsed.version !== undefined &&
      parsed.version !== 0 &&
      parsed.version !== 1 &&
      parsed.version !== SCHEMA_VERSION
    ) {
      return {
        data: initial,
        warning:
          'This progress was saved by a different application version. Saved data will be kept unchanged. Clear all application data only if you want to start over.',
        writable: false,
      }
    }
    const data = normalizeData(migrate(parsed))
    const repaired = JSON.stringify(data) !== JSON.stringify(parsed)
    return {
      data,
      warning: repaired
        ? 'Some saved data needed repair. Valid practice records have been kept.'
        : null,
      writable: true,
    }
  } catch {
    return {
      data: initial,
      warning:
        'Saved progress could not be read. You can keep practicing with fresh data.',
      writable: true,
    }
  }
}
export function writeStorage(
  data: StoredData,
  getStorage: () => Storage = browserStorage,
): string | null {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)))
    return null
  } catch {
    return unavailable
  }
}
export function clearApplicationStorage(
  getStorage: () => Storage = browserStorage,
): string | null {
  try {
    const storage = getStorage()
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index),
    )
    for (const key of keys)
      if (key?.startsWith('mathPractice.')) storage.removeItem(key)
    return null
  } catch {
    return 'Saved data could not be completely erased. Check your browser storage permissions and try again.'
  }
}
export function saveSession(
  data: StoredData,
  state: PracticeSessionState,
): StoredData {
  return normalizeData({
    ...data,
    attempts: uniqueAttempts([...data.attempts, ...state.attempts]),
    sessions: [
      ...data.sessions.filter((session) => session.id !== state.session.id),
      state.session,
    ],
  })
}
export function restoreCompletedSession(
  data: StoredData,
): PracticeSessionState | null {
  const session = recentSessions(
    data.sessions.filter((item) => item.completedAt),
  )[0]
  return session
    ? {
        session,
        attempts: data.attempts.filter(
          (attempt) => attempt.sessionId === session.id,
        ),
        question: null,
        isActive: false,
        currentQuestionIndex: Math.max(0, session.attempted - 1),
        error: null,
      }
    : null
}
