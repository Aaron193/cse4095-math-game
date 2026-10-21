import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppData } from '../app/appDataContext'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import '../styles/practice-setup.css'
import '../styles/data-pages.css'

export default function SettingsPage() {
  const { data, warning, saveSettings, clearAll } = useAppData()
  const [draft, setDraft] = useState(data.settings)
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()
  const valid = draft.defaultOperations.length > 0
  function update(patch: Partial<typeof draft>) {
    setDraft({ ...draft, ...patch })
    setSaved(false)
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    saveSettings(draft)
    setSaved(true)
  }
  function erase() {
    if (
      window.confirm(
        'Clear ALL application data? This permanently removes practice history, statistics, settings, and any saved mistake data. This cannot be undone.',
      )
    ) {
      clearAll()
      navigate('/')
    }
  }
  return (
    <section className="welcome" aria-labelledby="settings-heading">
      <p className="eyebrow">Make practice feel right for you!</p>
      <h1 id="settings-heading">Settings</h1>
      <p>
        Choose your favorites, then save. You can still pick different choices
        for each practice session.
      </p>
      <form aria-label="Application settings" onSubmit={save}>
        <fieldset className="setup-group">
          <legend>Practice preferences</legend>
          <div className="preference-list">
            <label className="choice">
              <input
                type="checkbox"
                checked={draft.cardAnimationEnabled}
                onChange={(event) =>
                  update({ cardAnimationEnabled: event.target.checked })
                }
              />
              Card animations
            </label>
            <label className="choice">
              <input
                type="checkbox"
                checked={false}
                disabled
                aria-describedby="sound-unavailable"
              />
              Sound effects
            </label>
            <p id="sound-unavailable" className="coming-soon">
              Sound effects are unavailable in this version.
            </p>
            <label className="choice">
              <input
                type="checkbox"
                checked={false}
                disabled
                aria-describedby="explanations-unavailable"
              />
              Show explanations
            </label>
            <p id="explanations-unavailable" className="coming-soon">
              Step-by-step explanations are unavailable in this version.
              Flipping a card still reveals the correct answer.
            </p>
          </div>
        </fieldset>
        <h2>Default practice choices</h2>
        <OperationSelector
          selected={draft.defaultOperations}
          onChange={(defaultOperations) => update({ defaultOperations })}
        />
        <DifficultySelector
          selected={draft.defaultDifficulty}
          onChange={(defaultDifficulty) => update({ defaultDifficulty })}
        />
        <SessionLengthSelector
          selected={draft.defaultSessionLength}
          onChange={(defaultSessionLength) => update({ defaultSessionLength })}
        />
        <p id="settings-feedback" role="status">
          {!valid
            ? 'Choose at least one default operation.'
            : saved
              ? warning
                ? 'Settings applied for now. See the storage message above.'
                : 'Settings saved!'
              : 'Save your choices to use them next time.'}
        </p>
        <div className="setup-actions">
          <button
            type="submit"
            className="button"
            disabled={!valid}
            aria-describedby="settings-feedback"
          >
            Save Settings
          </button>
          <Link className="button button-secondary" to="/">
            Back to home
          </Link>
        </div>
      </form>
      <section className="data-reset" aria-labelledby="clear-heading">
        <h2 id="clear-heading">Start fresh</h2>
        <p>
          All progress is stored only in this browser on this device. Clearing
          browser data also erases it. This button removes all saved application
          data and restores the default settings.
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={erase}
        >
          Clear All Application Data
        </button>
      </section>
    </section>
  )
}
