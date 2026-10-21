import type { OperationStatistics } from '../../types/statistics'
import { accuracy } from '../../services/statisticsService'

export default function StatisticsTotals({
  totals,
}: {
  totals: OperationStatistics
}) {
  return (
    <dl className="statistics-totals">
      <div>
        <dt>Attempted</dt>
        <dd>{totals.attempted}</dd>
      </div>
      <div>
        <dt>Correct</dt>
        <dd>{totals.correct}</dd>
      </div>
      <div>
        <dt>Incorrect</dt>
        <dd>{totals.incorrect}</dd>
      </div>
      <div>
        <dt>Accuracy</dt>
        <dd>{accuracy(totals)}%</dd>
      </div>
    </dl>
  )
}
