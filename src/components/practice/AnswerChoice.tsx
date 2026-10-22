interface AnswerChoiceProps {
  shortcut?: number
  answer: number
  selected: boolean
  disabled: boolean
  onSelect: (answer: number) => void
}

export default function AnswerChoice({
  shortcut,
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
      aria-keyshortcuts={shortcut ? String(shortcut) : undefined}
      disabled={disabled}
      onClick={() => onSelect(answer)}
    >
      {shortcut && (
        <span className="answer-shortcut" aria-hidden="true">
          Key {shortcut}
        </span>
      )}
      <span>{answer}</span>
      <span className="answer-selection">
        {selected ? '✓ Selected' : 'Choose answer'}
      </span>
    </button>
  )
}
