import { Route, Routes } from 'react-router'
import SessionNavigationSafety from '../components/SessionNavigationSafety'
import AppLayout from '../components/AppLayout'
import StatisticsPage from '../pages/StatisticsPage'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import SettingsPage from '../pages/SettingsPage'
import PracticeSetupPage from '../pages/PracticeSetupPage'
import PracticeSessionPage from '../pages/PracticeSessionPage'
import SessionSummaryPage from '../pages/SessionSummaryPage'
import AppDataProvider from './AppDataProvider'
import { useAppData } from './appDataContext'
import PracticeConfigurationProvider from './PracticeConfigurationProvider'
import PracticeSessionProvider from './PracticeSessionProvider'

function ApplicationRoutes() {
  const { resetKey } = useAppData()
  return (
    <PracticeConfigurationProvider key={resetKey}>
      <PracticeSessionProvider>
        <SessionNavigationSafety />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="practice/setup" element={<PracticeSetupPage />} />
            <Route path="practice/session" element={<PracticeSessionPage />} />
            <Route path="practice/summary" element={<SessionSummaryPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </PracticeSessionProvider>
    </PracticeConfigurationProvider>
  )
}

export default function App() {
  return (
    <AppDataProvider>
      <ApplicationRoutes />
    </AppDataProvider>
  )
}
