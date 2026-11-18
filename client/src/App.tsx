import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import GameDetail from './components/GameDetail'
import GamesLibrary from './components/GamesLibrary'
import Layout from './components/Layout'
import LoginView from './components/LoginView'
import { useSession } from './hooks/useSession'

function App() {
  const { data: user, isPending, isError } = useSession()

  if (isPending) return <div className="p-6">Cargando…</div>
  if (isError) return <div className="p-6">No se pudo conectar con el servidor</div>
  if (!user) return <LoginView />

  // No router yet: the sidebar links are plain anchors, so the path picks the view
  const path = window.location.pathname

  // /games/:id is the page of a single game
  const gameId = Number(path.match(/^\/games\/(\d+)\/?$/)?.[1])

  return (
    <Layout>
      {gameId ? <GameDetail gameId={gameId} /> : path.startsWith('/games') ? <GamesLibrary /> : path.startsWith('/profile') ? <Profile /> : <Dashboard />}
    </Layout>
  )
}

export default App
