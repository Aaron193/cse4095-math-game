import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useSession } from '../../app/practiceSessionContext'
import type { PracticeSessionState } from '../../types/session'
import { useAppData } from '../../app/appDataContext'
import {
  difficultyOptions,
  operationOptions,
  sessionLengthOptions,
} from './practiceOptions'
import { spokenQuestion } from '../../utils/questionAccessibility'
import ErrorNotice from '../ErrorNotice'
import QuestionCard from './QuestionCard'
import SessionProgress from './SessionProgress'
import '../../styles/practice-session.css'

export default function PracticeSessionContent({
  state,
}: {
  state: PracticeSessionState
}) {
  const { recordResult, endSession, retryQuestion, updateCardState } =
    useSession()
  const {
    data: { settings },
    saveSettings,
  } = useAppData()
  const animationEnabled = settings.cardAnimationEnabled
  const heading = useRef<HTMLHeadingElement>(null)
  const { session, question, isActive } = state
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [question?.id, isActive])
  function requestEnd() {
    if (
      window.confirm(
        'End this practice session? Your completed answers will be saved in your practice history.',
      )
    )
      endSession()
  }
  return (
    <section className="welcome" aria-labelledby="session-heading">
      <p className="eyebrow">One question at a time!</p>
      <h1 id="session-heading">Practice Session</h1>
      <dl className="configuration-summary">
        <dt>Operations</dt>
        <dd>
          {operationOptions
            .filter((option) => session.operations.includes(option.value))
            .map((option) => option.label)
            .join(', ')}
        </dd>
        <dt>Difficulty</dt>
        <dd>
          {
            difficultyOptions.find(
              (option) => option.value === session.difficulty,
            )?.label
          }
        </dd>
        <dt>Practice length</dt>
        <dd>
          {
            sessionLengthOptions.find(
              (option) => option.value === session.sessionLength,
            )?.label
          }
        </dd>
      </dl>
      {session.mode === 'mistake-review' && (
        <p>Let’s grow your skills with mistake review!</p>
      )}
      <SessionProgress session={session} />
      <h2 ref={heading} tabIndex={-1} className="session-stage-heading">
        {isActive
          ? 'Your next question'
          : session.sessionLength !== 'continuous' &&
              session.attempted === session.sessionLength
            ? 'Session complete!'
            : 'Session ended'}
      </h2>
      <p className="sr-only" role="status">
        {isActive
          ? `Question ${state.currentQuestionIndex + 1}${session.sessionLength === 'continuous' ? '' : ` of ${session.sessionLength}`}. ${question ? spokenQuestion(question) : 'Loading a question.'}`
          : 'Practice finished.'}{' '}
        {session.attempted} attempted, {session.correct} correct,{' '}
        {session.incorrect} incorrect.
      </p>
      {(settings.feedbackEnabled ?? true) && (
        <p className="practice-feedback" role="status">
          {state.feedback ?? 'Take your time. Every practice step counts!'}
        </p>
      )}
      {isActive ? (
        <>
          <label className="animation-toggle">
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={(event) =>
                saveSettings({
                  ...settings,
                  cardAnimationEnabled: event.target.checked,
                })
              }
            />{' '}
            Show card animation
          </label>
          {state.error && (
            <ErrorNotice
              message={state.error}
              onRetry={retryQuestion}
              retryLabel="Try loading a question again"
            >
              <Link className="button button-secondary" to="/">
                Return home
              </Link>
            </ErrorNotice>
          )}
          {question && (
            <div
              className="session-question"
              data-motion={animationEnabled ? 'on' : 'off'}
              key={question.id}
            >
              <QuestionCard
                question={question}
                initialState={state.cardState}
                onInteractionChange={updateCardState}
                questionNumber={state.currentQuestionIndex + 1}
                totalQuestions={session.sessionLength}
                animationEnabled={animationEnabled}
                onResult={(correct, selectedAnswer) =>
                  recordResult(question.id, correct, selectedAnswer)
                }
              />
            </div>
          )}
          {isActive && (
            <button
              className="button button-secondary end-session"
              type="button"
              onClick={requestEnd}
            >
              End Session
            </button>
          )}
        </>
      ) : (
        <p>
          Nice work practicing! Your totals are shown above. A detailed session
          summary is coming in the next phase.
        </p>
      )}
      <div className="setup-actions">
        <Link className="button" to="/practice/setup">
          Change practice choices
        </Link>
        <Link className="button button-secondary" to="/">
          Back to home
        </Link>
      </div>
    </section>
  )
}
