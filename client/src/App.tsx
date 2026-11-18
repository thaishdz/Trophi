import GamesLibrary from './components/GamesLibrary'
import Layout from './components/Layout'
import LoginView from './components/LoginView'
import { useSession } from './hooks/useSession'

function App() {
  const { data: user, isPending, isError } = useSession()

  if (isPending) return <div className="p-6">Cargando…</div>
  if (isError) return <div className="p-6">Could not connect to the server</div>
  if (!user) return <LoginView />

  return (
    <Layout>
      <GamesLibrary />
    </Layout>
  )
}

export default App
