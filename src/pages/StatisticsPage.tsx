import { Link } from 'react-router'
import { useAppData } from '../app/appDataContext'
import MistakeStatistics from '../components/statistics/MistakeStatistics'
import StatisticsTotals from '../components/statistics/StatisticsTotals'
import {
  difficultyOptions,
  operationOptions,
} from '../components/practice/practiceOptions'
import { recentSessions } from '../services/statisticsService'
import '../styles/data-pages.css'

export default function StatisticsPage() {
  const { data, resetStatistics } = useAppData()
  const recent = recentSessions(data.sessions)
  function reset() {
    if (
      window.confirm(
        'Are you sure you want to erase all practice history and statistics? Your settings will be kept. This cannot be undone.',
      )
    )
      resetStatistics()
  }
  return (
    <section className="welcome" aria-labelledby="statistics-heading">
      <p className="eyebrow">Every answer is a step forward!</p>
      <h1 id="statistics-heading">Statistics</h1>
      <p>
        These results follow your “I Got It Right” and “I Got It Wrong” choices.
      </p>
      <section aria-labelledby="overall-heading">
        <h2 id="overall-heading">Overall progress</h2>
        <StatisticsTotals totals={data.statistics} />
        {data.attempts.length === 0 && (
          <p>
            No practice history yet. Start a practice session and watch your
            progress grow!
          </p>
        )}
      </section>
      <MistakeStatistics
        patterns={data.mistakePatterns}
        attempts={data.attempts}
        threshold={data.settings.masteryThreshold}
      />
      <h2>By operation</h2>
      <div className="statistics-grid">
        {operationOptions.map((operation) => (
          <section
            className="statistics-card"
            key={operation.value}
            aria-labelledby={`stats-${operation.value}`}
          >
            <h3 id={`stats-${operation.value}`}>{operation.label}</h3>
            <StatisticsTotals
              totals={data.statistics.byOperation[operation.value]}
            />
          </section>
        ))}
      </div>
      <h2>By difficulty</h2>
      <div className="statistics-grid">
        {difficultyOptions.map((difficulty) => (
          <section
            className="statistics-card"
            key={difficulty.value}
            aria-labelledby={`level-${difficulty.value}`}
          >
            <h3 id={`level-${difficulty.value}`}>
              Level {difficulty.value}: {difficulty.label}
            </h3>
            <StatisticsTotals
              totals={data.statistics.byDifficulty[difficulty.value]}
            />
          </section>
        ))}
      </div>
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading">Recent sessions</h2>
        <p>Your 20 most recent sessions are shown, newest first.</p>
        {recent.length === 0 ? (
          <p>
            No sessions yet. Your next math adventure starts in Practice Setup.
          </p>
        ) : (
          <ol className="recent-sessions">
            {recent.map((session) => (
              <li key={session.id} className="statistics-card">
                <p>
                  <time dateTime={session.completedAt ?? session.startedAt}>
                    {new Date(
                      session.completedAt ?? session.startedAt,
                    ).toLocaleString()}
                  </time>{' '}
                  · {session.completedAt ? 'Completed' : 'Unfinished'}
                </p>
                <p>
                  {operationOptions
                    .filter((op) => session.operations.includes(op.value))
                    .map((op) => op.label)
                    .join(', ')}{' '}
                  ·{' '}
                  {
                    difficultyOptions.find(
                      (d) => d.value === session.difficulty,
                    )?.label
                  }
                </p>
                <StatisticsTotals totals={session} />
              </li>
            ))}
          </ol>
        )}
      </section>
      <div className="setup-actions">
        <Link className="button" to="/practice/setup">
          Start Practice
        </Link>
        <Link className="button button-secondary" to="/">
          Back to home
        </Link>
      </div>
      <section className="data-reset" aria-labelledby="reset-heading">
        <h2 id="reset-heading">Reset your progress</h2>
        <p>
          This erases practice history, mistake progress, and statistics. Your
          saved settings stay the same.
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={reset}
        >
          Reset Statistics
        </button>
      </section>
    </section>
  )
}
