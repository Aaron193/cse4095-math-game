import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePracticeConfiguration } from '../app/practiceConfigurationContext'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import { sessionLengthOptions } from '../components/practice/practiceOptions'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeConfiguration, SessionLength } from '../types/session'
import '../styles/practice-setup.css'

export default function PracticeSetupPage() {
  const { configuration, setConfiguration } = usePracticeConfiguration()
  const navigate = useNavigate()
  const [operations, setOperations] = useState<MathOperation[]>(
    configuration?.operations ?? [],
  )
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(
    configuration?.difficulty ?? null,
  )
  const [sessionLength, setSessionLength] = useState<SessionLength>(
    configuration?.sessionLength ?? 10,
  )
  const feedback = [
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
    const nextConfiguration: PracticeConfiguration = {
      operations,
      difficulty,
      sessionLength,
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
      <form
        onSubmit={handleSubmit}
        aria-label="Practice configuration"
        aria-describedby="configuration-feedback"
      >
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
          {isValid ? 'Ready when you are!' : feedback.join(' ')}
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
