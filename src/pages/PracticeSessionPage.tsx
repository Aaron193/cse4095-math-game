import { Link } from 'react-router'
import QuestionCardPreview from '../components/practice/QuestionCardPreview'
import { usePracticeConfiguration } from '../app/practiceConfigurationContext'
import {
  difficultyOptions,
  operationOptions,
  sessionLengthOptions,
} from '../components/practice/practiceOptions'

export default function PracticeSessionPage() {
  const { configuration } = usePracticeConfiguration()
  return (
    <section className="welcome" aria-labelledby="session-heading">
      <p className="eyebrow">
        {configuration ? 'Question card preview' : 'Coming soon'}
      </p>
      <h1 id="session-heading">Practice Session</h1>
      {configuration ? (
        <>
          <p>Your choices are ready! Try one question below.</p>
          <dl className="configuration-summary">
            <dt>Operations</dt>
            <dd>
              {operationOptions
                .filter((option) =>
                  configuration.operations.includes(option.value),
                )
                .map((option) => option.label)
                .join(', ')}
            </dd>
            <dt>Difficulty</dt>
            <dd>
              {
                difficultyOptions.find(
                  (option) => option.value === configuration.difficulty,
                )?.label
              }
            </dd>
            <dt>Practice length</dt>
            <dd>
              {
                sessionLengthOptions.find(
                  (option) => option.value === configuration.sessionLength,
                )?.label
              }
            </dd>
          </dl>
          <QuestionCardPreview configuration={configuration} />
        </>
      ) : (
        <p>
          No practice choices yet. Visit Practice Setup to choose your
          operations, difficulty, and practice length.
        </p>
      )}
      <div className="setup-actions">
        <Link className="button" to="/practice/setup">
          {configuration ? 'Change practice choices' : 'Go to Practice Setup'}
        </Link>
        <Link className="button button-secondary" to="/">
          Back to home
        </Link>
      </div>
    </section>
  )
}
