import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useSession } from '../../app/practiceSessionContext'
import type { PracticeSessionState } from '../../types/session'
import type { AppSettings } from '../../types/settings'
import {
  difficultyOptions,
  operationOptions,
  sessionLengthOptions,
} from './practiceOptions'
import QuestionCard from './QuestionCard'
import SessionProgress from './SessionProgress'
import '../../styles/practice-session.css'

export default function PracticeSessionContent({
  state,
}: {
  state: PracticeSessionState
}) {
  const { recordResult, endSession, retryQuestion } = useSession()
  const [animationEnabled, setAnimationEnabled] =
    useState<AppSettings['cardAnimationEnabled']>(true)
  const heading = useRef<HTMLHeadingElement>(null)
  const { session, question, isActive } = state
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [question?.id, isActive])
  function requestEnd() {
    if (
      window.confirm(
        'End this practice session? Your completed answers will remain visible until you start a new session or refresh.',
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
          ? `Question ${state.currentQuestionIndex + 1}.`
          : 'Practice finished.'}{' '}
        {session.attempted} attempted, {session.correct} correct,{' '}
        {session.incorrect} incorrect.
      </p>
      {isActive ? (
        <>
          <label className="animation-toggle">
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={(event) => setAnimationEnabled(event.target.checked)}
            />{' '}
            Show card animation
          </label>
          {state.error && (
            <div role="alert">
              <p>{state.error}</p>
              <button className="button" type="button" onClick={retryQuestion}>
                Try loading a question again
              </button>
            </div>
          )}
          {question && (
            <div
              className="session-question"
              data-motion={animationEnabled ? 'on' : 'off'}
              key={question.id}
            >
              <QuestionCard
                question={question}
                questionNumber={state.currentQuestionIndex + 1}
                totalQuestions={session.sessionLength}
                animationEnabled={animationEnabled}
                onResult={(correct, selectedAnswer) =>
                  recordResult(question.id, correct, selectedAnswer)
                }
              />
            </div>
          )}
          {(session.sessionLength === 'continuous' || state.error) && (
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
