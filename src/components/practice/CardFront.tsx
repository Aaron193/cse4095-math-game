import type { Question } from '../../types/question'
import type { SessionLength } from '../../types/session'
import AnswerChoice from './AnswerChoice'

interface CardFrontProps {
  question: Question
  questionNumber: number
  totalQuestions: SessionLength
  selectedAnswer: number | null
  isCardFlipped: boolean
  revealId: string
  onSelect: (answer: number) => void
  onFlip: () => void
}

export default function CardFront({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isCardFlipped,
  revealId,
  onSelect,
  onFlip,
}: CardFrontProps) {
  return (
    <div
      className="card-face card-front"
      aria-hidden={isCardFlipped}
      inert={isCardFlipped}
    >
      <p className="card-progress">
        {totalQuestions === 'continuous'
          ? `Question ${questionNumber} · Continuous practice`
          : `Question ${questionNumber} of ${totalQuestions}`}
      </p>
      <h3 className="math-question">{question.displayText}</h3>
      <div className="answer-grid" role="group" aria-label="Answer choices">
        {question.choices.map((answer) => (
          <AnswerChoice
            key={answer}
            answer={answer}
            selected={selectedAnswer === answer}
            disabled={isCardFlipped}
            onSelect={onSelect}
          />
        ))}
      </div>
      <button
        className="button flip-button"
        type="button"
        disabled={selectedAnswer === null || isCardFlipped}
        aria-expanded={isCardFlipped}
        aria-controls={revealId}
        onClick={onFlip}
      >
        Flip Card
      </button>
    </div>
  )
}
