import { useEffect, useRef } from 'react'
import type { Question } from '../../types/question'

interface CardBackProps {
  question: Question
  selectedAnswer: number | null
  isCardFlipped: boolean
  reported: boolean
  revealId: string
  onResult: (correct: boolean) => void
}

export default function CardBack({
  question,
  selectedAnswer,
  isCardFlipped,
  reported,
  revealId,
  onResult,
}: CardBackProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (isCardFlipped) headingRef.current?.focus({ preventScroll: true })
  }, [isCardFlipped])

  return (
    <div
      id={revealId}
      className="card-face card-back"
      aria-hidden={!isCardFlipped}
      inert={!isCardFlipped}
    >
      <h3 ref={headingRef} tabIndex={-1}>
        Answer revealed
      </h3>
      <p className="math-question">
        {question.displayText.replace('?', String(question.correctAnswer))}
      </p>
      <p className="answer-reveal">
        Correct answer: <strong>{question.correctAnswer}</strong>
      </p>
      <p className="answer-reveal">
        Your answer: <strong>{selectedAnswer ?? 'No answer selected'}</strong>
      </p>
      <p>How did you do? You decide.</p>
      <div className="card-result-actions">
        <button
          className="button"
          type="button"
          disabled={!isCardFlipped || reported}
          onClick={() => onResult(true)}
        >
          I Got It Right
        </button>
        <button
          className="button button-tertiary"
          type="button"
          disabled={!isCardFlipped || reported}
          onClick={() => onResult(false)}
        >
          I Got It Wrong
        </button>
      </div>
    </div>
  )
}
