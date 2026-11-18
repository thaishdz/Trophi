import { GameData } from '../types/game'
import { progressColor } from '../lib/progress'
import GameCover from './GameCover'
import SaveButton from './SaveButton'

// A search result as a small data sheet: cover, name, progress and the save bookmark on the right corner
function GameRow({ game }: { game: GameData }) {
  const total = game.totalGameAchievements
  const pending = game.achievements.length
  const unlocked = total - pending
  const pct = total ? Math.round((unlocked / total) * 100) : 0
  const color = progressColor(pct)
  const saveable = { gameId: game.gameId, gameName: game.gameName, cover: game.cover, coverFallback: game.coverFallback }

  return (
    <li className="relative">
      <a
        href={`/games/${game.gameId}`}
        className="flex items-center gap-4 rounded-2xl border border-(--p-line) bg-(--p-surface) p-3 transition-colors hover:border-(--p-accent)"
      >
        <GameCover
          game={{ ...saveable, total: 0, unlocked: 0 }}
          className="aspect-[2/3] w-20 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1 pr-8">
          <p className="font-display text-2xl font-semibold leading-tight text-balance">{game.gameName}</p>
          {total > 0 ? (
            <>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold tabular-nums" style={{ color }}>{pct}%</span>
                <span className="text-sm text-muted">{unlocked} de {total} logros</span>
              </div>
              <div
                role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                aria-label={`Progreso de ${game.gameName}`}
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/40"
              >
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {pending ? `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}` : 'Completado'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Este juego no tiene logros</p>
          )}
        </div>
      </a>
      <SaveButton game={saveable} variant="row" />
    </li>
  )
}

export default GameRow
