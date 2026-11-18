import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import GamesLibrary from './components/GamesLibrary'
import Layout from './components/Layout'
import LoginView from './components/LoginView'
import { useSession } from './hooks/useSession'

function App() {
  const { data: user, isPending, isError } = useSession()

  if (isPending) return <div className="p-6">Cargando…</div>
  if (isError) return <div className="p-6">Could not connect to the server</div>
  if (!user) return <LoginView />

  // No router yet: the sidebar links are plain anchors, so the path picks the view
  const path = window.location.pathname

  return (
    <Layout>
      {path.startsWith('/games') ? <GamesLibrary /> : path.startsWith('/profile') ? <Profile /> : <Dashboard />}
    </Layout>
  )
}

export default App
