import { useState } from 'react'
import type { PracticeConfiguration } from '../../types/session'
import type { AppSettings } from '../../types/settings'
import { generateMultipleChoiceQuestion } from '../../services/questionGenerator'
import QuestionCard from './QuestionCard'

export default function QuestionCardPreview({
  configuration,
}: {
  configuration: PracticeConfiguration
}) {
  const [preview] = useState(() => {
    try {
      return {
        question: generateMultipleChoiceQuestion(
          configuration.operations,
          configuration.difficulty,
        ),
        error: false,
      }
    } catch {
      return { question: null, error: true }
    }
  })
  const [animationEnabled, setAnimationEnabled] =
    useState<AppSettings['cardAnimationEnabled']>(true)
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <section className="card-preview" aria-labelledby="preview-heading">
      <h2 id="preview-heading">Try a question card</h2>
      <p>This is one preview card. Full practice sessions are coming soon.</p>
      {preview.error || !preview.question ? (
        <p role="alert">
          We couldn’t load a question. Please go back to setup and try again.
        </p>
      ) : (
        <>
          <label className="animation-toggle">
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={(event) => setAnimationEnabled(event.target.checked)}
            />{' '}
            Show card animation
          </label>
          <QuestionCard
            question={preview.question}
            questionNumber={1}
            totalQuestions={configuration.sessionLength}
            animationEnabled={animationEnabled}
            onResult={() => setAcknowledged(true)}
          />
          <p role="status">
            {acknowledged ? 'Thanks for trying this card!' : ''}
          </p>
        </>
      )}
    </section>
  )
}
