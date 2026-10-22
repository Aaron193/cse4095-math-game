import { useEffect, useId, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import type { QuestionCardState, SessionLength } from '../../types/session'
import type { AppSettings } from '../../types/settings'
import CardFront from './CardFront'
import CardBack from './CardBack'
import '../../styles/question-card.css'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: SessionLength
  initialState?: QuestionCardState
  onInteractionChange?: (
    questionId: string,
    cardState: QuestionCardState,
  ) => void
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
  initialState,
  onInteractionChange,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    initialState?.selectedAnswer ?? null,
  )
  const [isCardFlipped, setIsCardFlipped] = useState(
    initialState?.isCardFlipped ?? false,
  )
  const [reported, setReported] = useState(false)
  const reportedRef = useRef(false)
  const revealId = useId()
  const card = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        isCardFlipped ||
        reportedRef.current
      )
        return
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
        )
      )
        return
      const index = ['1', '2', '3', '4'].indexOf(event.key)
      if (index < 0) return
      event.preventDefault()
      setSelectedAnswer(question.choices[index])
      onInteractionChange?.(question.id, {
        selectedAnswer: question.choices[index],
        isCardFlipped: false,
      })
      card.current
        ?.querySelectorAll<HTMLButtonElement>('.answer-choice')
        [index]?.focus()
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [question, isCardFlipped, onInteractionChange])

  function selectAnswer(answer: number) {
    if (!isCardFlipped) {
      setSelectedAnswer(answer)
      onInteractionChange?.(question.id, {
        selectedAnswer: answer,
        isCardFlipped: false,
      })
    }
  }
  function flipCard() {
    if (selectedAnswer !== null) {
      setIsCardFlipped(true)
      onInteractionChange?.(question.id, {
        selectedAnswer,
        isCardFlipped: true,
      })
    }
  }
  function reportResult(correct: boolean) {
    if (!isCardFlipped || selectedAnswer === null || reportedRef.current) return
    reportedRef.current = true
    setReported(true)
    onResult(correct, selectedAnswer)
  }

  return (
    <div
      ref={card}
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
