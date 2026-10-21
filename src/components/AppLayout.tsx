import { Outlet } from 'react-router'
import { useAppData } from '../app/appDataContext'
import Header from './layout/Header'
import PageContainer from './layout/PageContainer'

export default function AppLayout() {
  const { warning } = useAppData()
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <PageContainer>
        {warning && <p role="alert">{warning}</p>}
        <Outlet />
      </PageContainer>
      <footer>One step at a time. Every step counts.</footer>
    </>
  )
}
