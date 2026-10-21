import type { SessionLength } from '../../types/session'
import { sessionLengthOptions } from './practiceOptions'

interface SessionLengthSelectorProps {
  selected: SessionLength
  onChange: (length: SessionLength) => void
}

export default function SessionLengthSelector({
  selected,
  onChange,
}: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-group" aria-describedby="session-length-help">
      <legend>Choose your practice length</legend>
      <p id="session-length-help">
        Pick a question count, or practice until you decide to stop.
      </p>
      <div className="choice-grid">
        {sessionLengthOptions.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name="sessionLength"
              value={option.value}
              checked={selected === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
