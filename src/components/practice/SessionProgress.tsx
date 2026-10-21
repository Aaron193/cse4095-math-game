import type { PracticeSession } from '../../types/session'

export default function SessionProgress({
  session,
}: {
  session: PracticeSession
}) {
  return (
    <section aria-label="Session progress" className="session-progress">
      <h2>Your progress</h2>
      <dl className="session-totals">
        <div>
          <dt>Attempted</dt>
          <dd>{session.attempted}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{session.correct}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{session.incorrect}</dd>
        </div>
      </dl>
      {session.sessionLength !== 'continuous' && (
        <>
          <label htmlFor="session-progress">
            {session.attempted} of {session.sessionLength} questions completed
          </label>
          <progress
            id="session-progress"
            max={session.sessionLength}
            value={session.attempted}
            aria-label="Questions completed"
            aria-valuetext={`${session.attempted} of ${session.sessionLength} questions completed`}
          />
        </>
      )}
    </section>
  )
}
