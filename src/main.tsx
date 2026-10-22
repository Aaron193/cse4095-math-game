import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import ApplicationErrorPage from './pages/ApplicationErrorPage'
import App from './app/App'
import './styles/global.css'

const router = createBrowserRouter([
  { path: '*', element: <App />, errorElement: <ApplicationErrorPage /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
