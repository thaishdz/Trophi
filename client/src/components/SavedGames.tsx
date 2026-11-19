import { useGame } from '../hooks/useGame'
import { TrackedGame, useTrackedGames } from '../hooks/useTrackedGames'
import GameTile from './GameTile'

// Progress comes from the game's achievements, which are requested per tile and cached for 30 minutes
function SavedTile({ game }: { game: TrackedGame }) {
  const { data } = useGame(game.gameId)
  const progress = data?.totalGameAchievements
    ? Math.round(((data.totalGameAchievements - data.achievements.length) / data.totalGameAchievements) * 100)
    : null
  return <GameTile game={game} progress={progress} />
}

function SavedGames() {
  const { data: games, isPending, error } = useTrackedGames()

  if (isPending) return <p className="mt-10" role="status">Cargando tus juegos…</p>
  if (error) return <p className="mt-10" role="alert">No se pudieron cargar tus juegos guardados.</p>

  if (!games.length) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-(--p-line) px-6 py-16 text-center">
        <p className="font-display text-3xl font-semibold">Todavía no has guardado ningún juego</p>
        <p className="mt-2 text-muted">Busca un juego y guárdalo con el marcador para tenerlo aquí.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,11rem))] gap-4">
      {games.map((game) => (<SavedTile key={game.gameId} game={game} />))}
    </div>
  )
}

export default SavedGames
