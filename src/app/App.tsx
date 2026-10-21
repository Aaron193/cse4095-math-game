import { Route, Routes } from 'react-router'
import AppLayout from '../components/AppLayout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import PlaceholderPage from '../pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="practice/setup"
          element={
            <PlaceholderPage
              title="Practice Setup"
              description="Soon you’ll choose your operations, difficulty, and practice length here."
            />
          }
        />
        <Route
          path="practice/session"
          element={
            <PlaceholderPage
              title="Practice Session"
              description="Your math questions and answer cards will appear here."
            />
          }
        />
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
  )
}
