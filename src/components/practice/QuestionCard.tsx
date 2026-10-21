import { useId, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import type { SessionLength } from '../../types/session'
import type { AppSettings } from '../../types/settings'
import CardFront from './CardFront'
import CardBack from './CardBack'
import '../../styles/question-card.css'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: SessionLength
  animationEnabled?: AppSettings['cardAnimationEnabled']
  onResult: (selfReportedCorrect: boolean, selectedAnswer: number) => void
}

/** A new question ID remounts the interaction, clearing selection, flip, and callback lock. */
export default function QuestionCard(props: QuestionCardProps) {
  return <CardInteraction key={props.question.id} {...props} />
}

function CardInteraction({
  question,
  questionNumber,
  totalQuestions,
  animationEnabled = true,
  onResult,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [reported, setReported] = useState(false)
  const reportedRef = useRef(false)
  const revealId = useId()

  function selectAnswer(answer: number) {
    if (!isCardFlipped) setSelectedAnswer(answer)
  }
  function flipCard() {
    if (selectedAnswer !== null) setIsCardFlipped(true)
  }
  function reportResult(correct: boolean) {
    if (!isCardFlipped || selectedAnswer === null || reportedRef.current) return
    reportedRef.current = true
    setReported(true)
    onResult(correct, selectedAnswer)
  }

  return (
    <div
      className="question-card"
      data-animation={animationEnabled ? 'on' : 'off'}
    >
      <div className={`card-rotator${isCardFlipped ? ' is-flipped' : ''}`}>
        <CardFront
          question={question}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          selectedAnswer={selectedAnswer}
          isCardFlipped={isCardFlipped}
          revealId={revealId}
          onSelect={selectAnswer}
          onFlip={flipCard}
        />
        <CardBack
          question={question}
          selectedAnswer={selectedAnswer}
          isCardFlipped={isCardFlipped}
          reported={reported}
          revealId={revealId}
          onResult={reportResult}
        />
      </div>
      <p className="sr-only" role="status">
        {isCardFlipped
          ? `Answer revealed. Correct answer: ${question.correctAnswer}. Your answer: ${selectedAnswer}.`
          : ''}
      </p>
    </div>
  )
}
