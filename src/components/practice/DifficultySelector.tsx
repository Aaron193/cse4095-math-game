import type { DifficultyLevel } from '../../types/question'
import { difficultyOptions } from './practiceOptions'

interface DifficultySelectorProps {
  selected: DifficultyLevel | null
  onChange: (difficulty: DifficultyLevel) => void
}

export default function DifficultySelector({
  selected,
  onChange,
}: DifficultySelectorProps) {
  return (
    <fieldset className="setup-group" aria-describedby="difficulty-help">
      <legend>Choose your difficulty</legend>
      <p id="difficulty-help">
        Choose one level. Division answers will be whole numbers, and
        subtraction starts without negative answers.
      </p>
      <div className="choice-grid">
        {difficultyOptions.map((option) => (
          <label className="choice difficulty-choice" key={option.value}>
            <input
              type="radio"
              name="difficulty"
              value={option.value}
              checked={selected === option.value}
              onChange={() => onChange(option.value)}
              aria-labelledby={`difficulty-${option.value}-label`}
              aria-describedby={`difficulty-${option.value}-description`}
            />
            <span>
              <strong id={`difficulty-${option.value}-label`}>
                {option.label}
              </strong>
              <span
                className="choice-description"
                id={`difficulty-${option.value}-description`}
              >
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
