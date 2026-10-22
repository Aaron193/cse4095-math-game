import type { MistakePattern } from '../types/mistake'
import {
  DEFAULT_MASTERY_THRESHOLD,
  deriveMistakePatterns,
} from './mistakeService'
import type { AppSettings } from '../types/settings'
import type {
  ActiveSessionSnapshot,
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
import {
  validateArithmeticQuestion,
  validateQuestion,
} from '../utils/validation'
import {
  calculateStatistics,
  recentSessions,
  sessionTotals,
} from './statisticsService'

export const STORAGE_KEY = 'mathPractice.data'
export const SCHEMA_VERSION = 3
// Retain all attempts for lifetime totals; bound only older session metadata.
export const MAX_SESSION_RECORDS = 500
export interface StoredData {
  version: typeof SCHEMA_VERSION
  settings: AppSettings
  sessions: PracticeSession[]
  attempts: PracticeAttempt[]
  statistics: AppStatistics
  mistakePatterns: MistakePattern[]
  activeSession: ActiveSessionSnapshot | null
}
export interface StorageResult {
  data: StoredData
  warning: string | null
  writable: boolean
}
export function defaultSettings(): AppSettings {
  return {
    feedbackEnabled: true,
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
    activeSession: null,
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
    (value.feedbackEnabled === undefined ||
      typeof value.feedbackEnabled === 'boolean') &&
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
export function normalizeSettings(value: unknown): AppSettings {
  const settings = defaultSettings()
  if (!object(value)) return settings
  for (const key of ['cardAnimationEnabled', 'feedbackEnabled'] as const)
    if (typeof value[key] === 'boolean') settings[key] = value[key]
  if ([1, 2, 3, 4].includes(value.defaultDifficulty as number))
    settings.defaultDifficulty =
      value.defaultDifficulty as AppSettings['defaultDifficulty']
  if (
    [5, 10, 20, 'continuous'].includes(
      value.defaultSessionLength as number | string,
    )
  )
    settings.defaultSessionLength =
      value.defaultSessionLength as AppSettings['defaultSessionLength']
  if (Array.isArray(value.defaultOperations)) {
    const operations = [
      ...new Set(value.defaultOperations.filter(isMathOperation)),
    ]
    if (operations.length) settings.defaultOperations = operations
  }
  if (
    Number.isSafeInteger(value.masteryThreshold) &&
    (value.masteryThreshold as number) > 0
  )
    settings.masteryThreshold = value.masteryThreshold as number
  return settings
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
  // Group once rather than scanning the entire history for every saved session.
  const attemptsBySession = new Map<string, PracticeAttempt[]>()
  for (const attempt of attempts) {
    const records = attemptsBySession.get(attempt.sessionId)
    if (records) records.push(attempt)
    else attemptsBySession.set(attempt.sessionId, [attempt])
  }
  const sessions = new Map<string, PracticeSession>()
  if (Array.isArray(data.sessions))
    for (const session of data.sessions.filter(isSession)) {
      sessions.set(
        session.id,
        sessionTotals(session, attemptsBySession.get(session.id) ?? []),
      )
    }
  const settings = normalizeSettings(data.settings)
  // These two features have no implementation yet; do not retain a misleading enabled preference.
  settings.soundEnabled = false
  settings.showExplanations = false
  const mistakePatterns = deriveMistakePatterns(
    attempts,
    settings.masteryThreshold,
  )
  // An exhausted fixed session is completed even if its old active checkpoint survived corruption.
  for (const [id, session] of sessions) {
    if (
      !session.completedAt &&
      session.sessionLength !== 'continuous' &&
      session.attempted >= session.sessionLength
    ) {
      const latest =
        attemptsBySession.get(id)?.at(-1)?.attemptedAt ?? session.startedAt
      sessions.set(id, {
        ...session,
        completedAt: new Date(
          Math.max(Date.parse(latest), Date.parse(session.startedAt)),
        ).toISOString(),
      })
    }
  }
  const activeSession = normalizeActiveSession(
    data.activeSession,
    sessions,
    attempts,
    mistakePatterns,
  )
  let retained = recentSessions([...sessions.values()], MAX_SESSION_RECORDS)
  if (
    activeSession &&
    !retained.some((session) => session.id === activeSession.sessionId)
  )
    retained = [
      ...retained.slice(0, MAX_SESSION_RECORDS - 1),
      sessions.get(activeSession.sessionId)!,
    ]
  return {
    version: SCHEMA_VERSION,
    settings,
    attempts,
    sessions: retained,
    statistics: calculateStatistics(attempts),
    mistakePatterns,
    activeSession,
  }
}
/** Repair only a damaged card/selection, preserving valid attempts and its unfinished session. */
function normalizeActiveSession(
  value: unknown,
  sessions: ReadonlyMap<string, PracticeSession>,
  attempts: readonly PracticeAttempt[],
  patterns: readonly MistakePattern[],
): ActiveSessionSnapshot | null {
  if (!object(value) || !identifier(value.sessionId)) return null
  const session = sessions.get(value.sessionId)
  if (!session || session.completedAt) return null
  let question = null
  try {
    validateQuestion(
      value.question,
      new Set(attempts.map((attempt) => attempt.questionId)),
    )
    const candidate = value.question
    if (
      candidate.difficulty !== session.difficulty ||
      !session.operations.includes(candidate.operation)
    )
      throw new Error('Mismatched checkpoint')
    if (session.mode === 'mistake-review') {
      if (
        candidate.source !== 'mistake-review' ||
        !patterns.some(
          (pattern) =>
            pattern.id === candidate.mistakePatternId &&
            !pattern.mastered &&
            pattern.difficulty === session.difficulty &&
            session.operations.includes(pattern.operation),
        )
      )
        throw new Error('Invalid review checkpoint')
    } else if (candidate.source !== 'regular')
      throw new Error('Invalid regular checkpoint')
    question = candidate
  } catch {
    /* Keep the session with a recoverable question-loading action. */
  }
  const rawCard = object(value.cardState) ? value.cardState : {}
  const selectedAnswer =
    typeof rawCard.selectedAnswer === 'number' &&
    question?.choices.includes(rawCard.selectedAnswer)
      ? rawCard.selectedAnswer
      : null
  return {
    sessionId: session.id,
    question,
    cardState: {
      selectedAnswer,
      isCardFlipped: selectedAnswer !== null && rawCard.isCardFlipped === true,
    },
  }
}

export function restoreSavedSession(
  data: StoredData,
): PracticeSessionState | null {
  const checkpoint = data.activeSession
  const session =
    checkpoint &&
    data.sessions.find(
      (item) => item.id === checkpoint.sessionId && !item.completedAt,
    )
  if (!checkpoint || !session) return restoreCompletedSession(data)
  return {
    session,
    attempts: data.attempts.filter(
      (attempt) => attempt.sessionId === session.id,
    ),
    question: checkpoint.question,
    cardState: checkpoint.cardState,
    currentQuestionIndex: session.attempted,
    isActive: true,
    error: checkpoint.question
      ? null
      : 'Your answers are safe. We need to load your next question again.',
  }
}

function browserStorage(): Storage {
  return window.localStorage
}
const unavailable =
  'Your progress could not be saved. You can keep practicing, but new progress may be lost when you close or refresh this page.'
/** Missing-version/version-0/version-1/version-2 snapshots share today's fields; add future migrations here. */
function migrate(value: unknown): unknown {
  if (!object(value)) throw new Error('Invalid storage document')
  if (
    value.version === undefined ||
    value.version === 0 ||
    value.version === 1 ||
    value.version === 2
  )
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
      parsed.version !== 2 &&
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
    activeSession: state.isActive
      ? {
          sessionId: state.session.id,
          question: state.question,
          cardState: state.cardState ?? {
            selectedAnswer: null,
            isCardFlipped: false,
          },
        }
      : null,
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
