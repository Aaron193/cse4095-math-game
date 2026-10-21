import type { MathOperation } from '../../types/question'
import { operationOptions } from './practiceOptions'

interface OperationSelectorProps {
  selected: MathOperation[]
  onChange: (operations: MathOperation[]) => void
}

export default function OperationSelector({
  selected,
  onChange,
}: OperationSelectorProps) {
  function toggleOperation(operation: MathOperation) {
    onChange(
      selected.includes(operation)
        ? selected.filter((value) => value !== operation)
        : [...selected, operation],
    )
  }

  return (
    <fieldset className="setup-group" aria-describedby="operations-help">
      <legend>Choose your operations</legend>
      <p id="operations-help">Pick one or more kinds of math to practice.</p>
      <button
        className="button button-secondary select-all"
        type="button"
        onClick={() => onChange(operationOptions.map((option) => option.value))}
      >
        Select All
      </button>
      <div className="choice-grid">
        {operationOptions.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="checkbox"
              name="operations"
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => toggleOperation(option.value)}
            />
            <span>
              {option.label} ({option.symbol})
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
