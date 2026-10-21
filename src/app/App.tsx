import { Route, Routes } from 'react-router'
import AppLayout from '../components/AppLayout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import PlaceholderPage from '../pages/PlaceholderPage'
import PracticeSetupPage from '../pages/PracticeSetupPage'
import PracticeSessionPage from '../pages/PracticeSessionPage'
import PracticeConfigurationProvider from './PracticeConfigurationProvider'
import PracticeSessionProvider from './PracticeSessionProvider'

export default function App() {
  return (
    <PracticeConfigurationProvider>
      <PracticeSessionProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="practice/setup" element={<PracticeSetupPage />} />
            <Route path="practice/session" element={<PracticeSessionPage />} />
            <Route
              path="practice/summary"
              element={
                <PlaceholderPage
                  title="Session Summary"
                  description="After a practice session, you’ll see how you did here."
                />
              }
            />
            <Route
              path="statistics"
              element={
                <PlaceholderPage
                  title="Statistics"
                  description="Your practice progress and achievements will appear here."
                />
              }
            />
            <Route
              path="settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  description="Soon you’ll be able to choose your favorite practice settings here."
                />
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </PracticeSessionProvider>
    </PracticeConfigurationProvider>
  )
}
