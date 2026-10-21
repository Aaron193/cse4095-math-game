import { Outlet } from 'react-router'
import Header from './layout/Header'
import PageContainer from './layout/PageContainer'

export default function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <PageContainer>
        <Outlet />
      </PageContainer>
      <footer>One step at a time. Every step counts.</footer>
    </>
  )
}
