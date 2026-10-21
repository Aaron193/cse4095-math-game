import { useState } from 'react'
import { Link } from 'react-router'
import type { MistakePattern } from '../../types/mistake'
import type { PracticeAttempt } from '../../types/session'
import {
  calculateMistakeStatistics,
  sortMistakePatterns,
} from '../../services/mistakeStatistics'
import { operationSymbols } from '../../services/questionRules'
import {
  difficultyOptions,
  operationOptions,
} from '../practice/practiceOptions'
import '../../styles/practice-setup.css'

const fact = (pattern: MistakePattern) =>
  `${pattern.firstOperand} ${operationSymbols[pattern.operation]} ${pattern.secondOperand} = ${pattern.correctAnswer}`
export default function MistakeStatistics({
  patterns,
  attempts,
  threshold,
}: {
  patterns: readonly MistakePattern[]
  attempts: readonly PracticeAttempt[]
  threshold: number
}) {
  const [view, setView] = useState<'active' | 'mastered' | 'all'>('active')
  const stats = calculateMistakeStatistics(patterns, attempts)
  const visible = sortMistakePatterns(patterns).filter(
    (pattern) =>
      view === 'all' ||
      (view === 'mastered' ? pattern.mastered : !pattern.mastered),
  )
  return (
    <section
      aria-labelledby="mistake-progress-heading"
      className="mistake-statistics"
    >
      <h2 id="mistake-progress-heading">Mistake-review progress</h2>
      <p>
        More practice helps these facts feel familiar. A missed review starts a
        fresh streak.
      </p>
      <dl className="statistics-totals">
        <div>
          <dt>Active patterns</dt>
          <dd>{stats.active}</dd>
        </div>
        <div>
          <dt>Mastered patterns</dt>
          <dd>{stats.mastered}</dd>
        </div>
        <div>
          <dt>Similar questions practiced</dt>
          <dd>{stats.reviewAttempted}</dd>
        </div>
        <div>
          <dt>Review questions marked correct</dt>
          <dd>{stats.reviewCorrect}</dd>
        </div>
      </dl>
      {patterns.length === 0 && (
        <p>No mistakes recorded yet. Keep exploring with regular practice!</p>
      )}
      <h3>Most missed operations</h3>
      {stats.mostMissedOperations.length ? (
        <p>
          {operationOptions
            .filter((operation) =>
              stats.mostMissedOperations.includes(operation.value),
            )
            .map((operation) => operation.label)
            .join(', ')}
          : {stats.mostMisses} {stats.mostMisses === 1 ? 'miss' : 'misses'}
          {stats.mostMissedOperations.length > 1 ? ' each (tied)' : ''}.
        </p>
      ) : (
        <p>No missed operations yet.</p>
      )}
      <h3>Facts with the most misses</h3>
      <p>Fact counts include misses on their related review questions.</p>
      {stats.topFacts.length ? (
        <>
          <ul>
            {stats.topFacts.slice(0, 5).map((pattern) => (
              <li key={pattern.id}>
                {fact(pattern)} ·{' '}
                {
                  difficultyOptions.find(
                    (difficulty) => difficulty.value === pattern.difficulty,
                  )?.label
                }{' '}
                · {pattern.incorrectCount}{' '}
                {pattern.incorrectCount === 1 ? 'miss' : 'misses'}
              </li>
            ))}
          </ul>
          {stats.topFacts.length > 1 && (
            <p>
              {stats.topFacts.length} facts are tied.{' '}
              {stats.topFacts.length > 5
                ? 'The five most recent are shown here; see pattern details for the full list.'
                : ''}
            </p>
          )}
        </>
      ) : (
        <p>No missed facts yet.</p>
      )}
      <h3>Pattern details</h3>
      <fieldset className="setup-group">
        <legend>Show mistake patterns</legend>
        <div className="choice-grid">
          {(['active', 'mastered', 'all'] as const).map((option) => (
            <label key={option} className="choice">
              <input
                type="radio"
                name="mistakeView"
                value={option}
                checked={view === option}
                onChange={() => setView(option)}
              />
              {option === 'active'
                ? 'Active patterns'
                : option === 'mastered'
                  ? 'Mastered patterns'
                  : 'All patterns'}
            </label>
          ))}
        </div>
      </fieldset>
      {visible.length ? (
        <ul className="recent-sessions" aria-label="Mistake pattern details">
          {visible.map((pattern) => (
            <li key={pattern.id} className="statistics-card">
              <h4>{fact(pattern)}</h4>
              <p>
                {pattern.mastered ? 'Mastered' : 'Active'} ·{' '}
                {
                  difficultyOptions.find(
                    (difficulty) => difficulty.value === pattern.difficulty,
                  )?.label
                }
              </p>
              <p>
                Misses (including related review):{' '}
                <strong>{pattern.incorrectCount}</strong>
              </p>
              <p>
                {pattern.similarCorrectCount} of {threshold} successful reviews
                since the last miss
              </p>
              <progress
                max={threshold}
                value={Math.min(threshold, pattern.similarCorrectCount)}
                aria-label={`Mastery for ${fact(pattern)}, level ${pattern.difficulty}`}
              />
              <p>
                Most recent miss:{' '}
                <time dateTime={pattern.lastIncorrectAt}>
                  {new Date(pattern.lastIncorrectAt).toLocaleString()}
                </time>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {view === 'mastered'
            ? 'No mastered patterns yet. Every review is a step forward!'
            : view === 'active' && patterns.length > 0
              ? 'All your recorded patterns are mastered. Nice practice!'
              : 'No patterns to show in this view.'}
        </p>
      )}
      <Link
        className="button button-secondary"
        to="/practice/setup?mode=mistake-review"
      >
        Practice Mistakes
      </Link>
    </section>
  )
}
