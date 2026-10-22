import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router'
import { useAppData } from '../app/appDataContext'
import { useSession } from '../app/practiceSessionContext'
import { usePracticeConfiguration } from '../app/practiceConfigurationContext'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import { sessionLengthOptions } from '../components/practice/practiceOptions'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeMode } from '../types/session'
import { operationOptions } from '../components/practice/practiceOptions'
import type { PracticeConfiguration, SessionLength } from '../types/session'
import '../styles/practice-setup.css'

export default function PracticeSetupPage() {
  const { configuration, setConfiguration } = usePracticeConfiguration()
  const {
    data: { settings, mistakePatterns },
  } = useAppData()
  const [search] = useSearchParams()
  const { state: navigationState } = useLocation()
  const activePatterns = mistakePatterns.filter((pattern) => !pattern.mastered)
  const initialMode =
    search.get('mode') === 'mistake-review'
      ? 'mistake-review'
      : (configuration?.mode ?? 'regular')
  const [mode, setMode] = useState<PracticeMode>(initialMode)
  const [navigateError, setNavigateError] = useState('')
  const navigate = useNavigate()
  const { startSession, state, startError } = useSession()
  const [operations, setOperations] = useState<MathOperation[]>(
    initialMode === 'mistake-review'
      ? operationOptions.map((op) => op.value)
      : (configuration?.operations ?? settings.defaultOperations),
  )
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(
    initialMode === 'mistake-review'
      ? (activePatterns[0]?.difficulty ?? settings.defaultDifficulty)
      : (configuration?.difficulty ?? settings.defaultDifficulty),
  )
  const [sessionLength, setSessionLength] = useState<SessionLength>(
    configuration?.sessionLength ?? settings.defaultSessionLength,
  )
  const matching = activePatterns.filter(
    (pattern) =>
      pattern.difficulty === difficulty &&
      operations.includes(pattern.operation),
  )
  function chooseMode(next: PracticeMode) {
    setMode(next)
    setNavigateError('')
    if (next === 'mistake-review' && activePatterns.length) {
      setOperations(operationOptions.map((op) => op.value))
      setDifficulty(activePatterns[0].difficulty)
    }
  }
  const feedback = [
    mode === 'mistake-review' && matching.length === 0
      ? 'No active mistakes match these choices. Choose another difficulty or operation, or try regular practice.'
      : '',
    operations.length === 0 ? 'Choose at least one operation.' : '',
    difficulty === null ? 'Choose one difficulty level.' : '',
    !sessionLengthOptions.some((option) => option.value === sessionLength)
      ? 'Choose one practice length.'
      : '',
  ].filter(Boolean)
  const isValid = feedback.length === 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid || difficulty === null) return
    if (
      state?.isActive &&
      !window.confirm(
        'Start a new session? Your current unfinished card will be replaced. Completed answers stay in your history.',
      )
    )
      return
    const nextConfiguration: PracticeConfiguration = {
      operations,
      difficulty,
      sessionLength,
      ...(mode === 'mistake-review' ? { mode } : {}),
    }
    if (!startSession(nextConfiguration)) {
      setNavigateError(
        'No active mistakes are ready to review. Try regular practice.',
      )
      return
    }
    setConfiguration(nextConfiguration)
    navigate('/practice/session')
  }

  return (
    <section className="welcome" aria-labelledby="setup-heading">
      <p className="eyebrow">Let’s get ready to practice!</p>
      <h1 id="setup-heading">Practice Setup</h1>
      <p>
        Choose your math adventure. Pick your operations, a difficulty, and how
        long you’d like to practice.
      </p>
      {navigationState?.missingSession === true && (
        <p className="configuration-feedback">
          There’s no unfinished session to continue. Choose your practice
          settings to get started.
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        aria-label="Practice configuration"
        aria-describedby="configuration-feedback"
      >
        <fieldset className="setup-group">
          <legend>Choose your practice mode</legend>
          <div className="choice-grid">
            <label className="choice">
              <input
                type="radio"
                name="practiceMode"
                value="regular"
                checked={mode === 'regular'}
                onChange={() => chooseMode('regular')}
              />
              Regular practice
            </label>
            <label className="choice">
              <input
                type="radio"
                name="practiceMode"
                value="mistake-review"
                checked={mode === 'mistake-review'}
                disabled={activePatterns.length === 0}
                aria-describedby="review-help"
                onChange={() => chooseMode('mistake-review')}
              />
              Mistake review
            </label>
          </div>
          <p id="review-help">
            {activePatterns.length} active mistake{' '}
            {activePatterns.length === 1 ? 'pattern' : 'patterns'}.{' '}
            {activePatterns.length === 0
              ? 'No active mistakes yet. Try regular practice first, or enjoy the facts you have mastered!'
              : 'Review uses active patterns at your selected difficulty and operations. Related questions can use any selected operation.'}
          </p>
          {mode === 'mistake-review' && (
            <p>
              {matching.length} patterns match these choices. Review finishes
              early if you master them all.
            </p>
          )}
        </fieldset>
        <OperationSelector selected={operations} onChange={setOperations} />
        <DifficultySelector selected={difficulty} onChange={setDifficulty} />
        <SessionLengthSelector
          selected={sessionLength}
          onChange={setSessionLength}
        />
        <p
          className="configuration-feedback"
          id="configuration-feedback"
          role="status"
        >
          {startError ||
            navigateError ||
            (isValid ? 'Ready when you are!' : feedback.join(' '))}
        </p>
        <div className="setup-actions">
          <button
            className="button"
            type="submit"
            disabled={!isValid}
            aria-describedby="configuration-feedback"
          >
            Start Session
          </button>
          <Link className="button button-secondary" to="/">
            Back to home
          </Link>
        </div>
      </form>
    </section>
  )
}
