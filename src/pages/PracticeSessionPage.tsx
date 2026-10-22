import { Navigate } from 'react-router'
import { useSession } from '../app/practiceSessionContext'
import PracticeSessionContent from '../components/practice/PracticeSessionContent'
import { isPracticeConfiguration } from '../services/practiceSession'

export default function PracticeSessionPage() {
  const { state } = useSession()
  if (!state || !isPracticeConfiguration(state.session))
    return (
      <Navigate to="/practice/setup" replace state={{ missingSession: true }} />
    )
  if (!state.isActive) return <Navigate to="/practice/summary" replace />
  return <PracticeSessionContent state={state} />
}
