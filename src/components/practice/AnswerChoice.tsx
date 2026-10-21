interface AnswerChoiceProps {
  answer: number
  selected: boolean
  disabled: boolean
  onSelect: (answer: number) => void
}

export default function AnswerChoice({
  answer,
  selected,
  disabled,
  onSelect,
}: AnswerChoiceProps) {
  return (
    <button
      className="answer-choice"
      type="button"
      aria-label={`Answer ${answer}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(answer)}
    >
      <span>{answer}</span>
      <span className="answer-selection">
        {selected ? '✓ Selected' : 'Choose answer'}
      </span>
    </button>
  )
}
