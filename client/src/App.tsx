import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import GameDetail from './components/GameDetail'
import AchievementDetail from './components/AchievementDetail'
import GamesLibrary from './components/GamesLibrary'
import Layout from './components/Layout'
import LoginView from './components/LoginView'
import { useSession } from './hooks/useSession'
import { parseRoute, Route } from './lib/route'

function App() {
  const { data: user, isPending, isError } = useSession()

  if (isPending) return <div className="p-6">Cargando…</div>
  if (isError) return <div className="p-6">No se pudo conectar con el servidor</div>
  if (!user) return <LoginView />

  return <Layout>{renderView(parseRoute(window.location.pathname))}</Layout>
}

function renderView(route: Route) {
  switch (route.view) {
    case 'achievement': return <AchievementDetail gameId={route.gameId} achievementId={route.achievementId} />
    case 'game': return <GameDetail gameId={route.gameId} />
    case 'library': return <GamesLibrary />
    case 'profile': return <Profile />
    case 'dashboard': return <Dashboard />
  }
}

export default App
