import type { Question } from '../../types/question'
import type { SessionLength } from '../../types/session'
import { spokenQuestion } from '../../utils/questionAccessibility'
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
      <h3 className="math-question" aria-label={spokenQuestion(question)}>
        {question.displayText}
      </h3>
      <p id={`${revealId}-help`} className="answer-help">
        Use Tab, or press 1–4 to choose an answer.
      </p>
      <div
        className="answer-grid"
        role="group"
        aria-label="Answer choices"
        aria-describedby={`${revealId}-help`}
      >
        {question.choices.map((answer, index) => (
          <AnswerChoice
            key={answer}
            answer={answer}
            shortcut={index + 1}
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
