import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession } from '../app/practiceSessionContext'
import { usePracticeConfiguration } from '../app/practiceConfigurationContext'
import SessionProgress from '../components/practice/SessionProgress'
import {
  difficultyOptions,
  operationOptions,
} from '../components/practice/practiceOptions'
import { sessionAccuracy } from '../utils/sessionSummary'
import '../styles/session-summary.css'
import '../styles/practice-session.css'

export default function SessionSummaryPage() {
  const { state, startSession } = useSession()
  const { setConfiguration } = usePracticeConfiguration()
  const navigate = useNavigate()
  const heading = useRef<HTMLHeadingElement>(null)
  const [reviewMessage, setReviewMessage] = useState('')
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [state?.session.id, state?.isActive])
  const completed = state && !state.isActive && state.session.completedAt

  function practiceAgain() {
    if (!state || state.isActive) return
    const configuration = {
      operations: [...state.session.operations],
      difficulty: state.session.difficulty,
      sessionLength: state.session.sessionLength,
      ...(state.session.mode ? { mode: state.session.mode } : {}),
    }
    if (startSession(configuration)) {
      setConfiguration(configuration)
      navigate('/practice/session')
    } else
      setReviewMessage(
        'All selected mistakes are mastered. Choose regular practice or other active patterns in Practice Setup.',
      )
  }

  return (
    <section
      className="welcome session-summary"
      aria-labelledby="summary-heading"
    >
      <p className="eyebrow">Every practice step helps you learn!</p>
      <h1 id="summary-heading" ref={heading} tabIndex={-1}>
        Session Summary
      </h1>
      {completed ? (
        <>
          <p>Nice work making time to practice! Here’s how you did.</p>
          {state.session.mode === 'mistake-review' && (
            <p>Mistake-review session</p>
          )}
          {state.session.completionReason === 'mastered' && (
            <p>
              You mastered every selected pattern! This review finished early.
              Great practice!
            </p>
          )}
          <SessionProgress session={state.session} />
          <dl className="summary-highlights">
            <div>
              <dt>Accuracy</dt>
              <dd>{sessionAccuracy(state.session)}%</dd>
            </div>
            <div>
              <dt>Mistake-review questions completed</dt>
              <dd>
                {
                  state.attempts.filter(
                    (attempt) => attempt.source === 'mistake-review',
                  ).length
                }
              </dd>
            </div>
          </dl>
          <dl className="configuration-summary">
            <dt>Operations</dt>
            <dd>
              {operationOptions
                .filter((option) =>
                  state.session.operations.includes(option.value),
                )
                .map((option) => option.label)
                .join(', ')}
            </dd>
            <dt>Difficulty</dt>
            <dd>
              {
                difficultyOptions.find(
                  (option) => option.value === state.session.difficulty,
                )?.label
              }
            </dd>
          </dl>
          <div className="summary-actions">
            <button className="button" type="button" onClick={practiceAgain}>
              Practice Again
            </button>
            <button
              className="button button-tertiary"
              type="button"
              onClick={() => navigate('/practice/setup?mode=mistake-review')}
            >
              Practice Mistakes
            </button>
            <Link className="button button-secondary" to="/practice/setup">
              Change Settings
            </Link>
            <Link className="button button-secondary" to="/statistics">
              View Statistics
            </Link>
            <Link className="button button-secondary" to="/">
              Return Home
            </Link>
          </div>
          <p role="status">{reviewMessage}</p>
        </>
      ) : (
        <>
          <p>
            {state?.isActive
              ? 'Finish your current session to see its summary.'
              : 'There’s no completed session to show yet. Choose your practice settings to get started.'}
          </p>
          <div className="summary-actions">
            {state?.isActive && (
              <Link className="button" to="/practice/session">
                Continue Session
              </Link>
            )}
            <Link className="button button-secondary" to="/practice/setup">
              Go to Practice Setup
            </Link>
            <Link className="button button-secondary" to="/">
              Return Home
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
