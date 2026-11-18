import { useGame } from '../hooks/useGame'
import { TrackedGame, useTrackedGames } from '../hooks/useTrackedGames'
import { progressColor } from '../lib/progress'
import GameCover from './GameCover'

// Progress comes from the game's achievements, which are requested per tile and cached for 5 minutes
function ProgressPill({ gameId }: { gameId: number }) {
  const { data: game } = useGame(gameId)
  if (!game || !game.totalGameAchievements) return null

  const unlocked = game.totalGameAchievements - game.achievements.length
  const pct = Math.round((unlocked / game.totalGameAchievements) * 100)
  const color = progressColor(pct)
  return (
    <span
      className="absolute right-2.5 top-2.5 rounded-full border bg-black/60 px-2.5 py-1 text-sm font-semibold tabular-nums text-text backdrop-blur-sm"
      style={{ borderColor: color, color }}
    >
      {pct}%
    </span>
  )
}

function TrackedTile({ game }: { game: TrackedGame }) {
  return (
    <a
      href={`/games/${game.gameId}`}
      aria-label={`Ver logros de ${game.gameName}`}
      className="group relative isolate aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-panel text-left text-text"
    >
      <GameCover
        game={{ ...game, total: 0, unlocked: 0 }}
        className="absolute inset-0 -z-10 h-full w-full transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <ProgressPill gameId={game.gameId} />
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className="font-display text-xl font-semibold leading-tight line-clamp-2">{game.gameName}</p>
      </div>
    </a>
  )
}

function TrackedGames() {
  const { data: games, isPending, error } = useTrackedGames()

  if (isPending) return <p className="mt-10" role="status">Cargando tus juegos…</p>
  if (error) return <p className="mt-10" role="alert">No se pudieron cargar tus juegos trackeados.</p>

  if (!games.length) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-ink-text/40 px-6 py-16 text-center">
        <p className="font-display text-3xl font-semibold">Todavía no trackeas ningún juego</p>
        <p className="mt-2 text-ink-text/75">Abre un juego y pulsa «Trackear juego» para tenerlo aquí.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,11rem))] gap-4">
      {games.map((game) => (<TrackedTile key={game.gameId} game={game} />))}
    </div>
  )
}

export default TrackedGames
