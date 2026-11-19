import { TrackedGame } from '../hooks/useTrackedGames'
import { progressColor } from '../lib/progress'
import GameCover from './GameCover'
import SaveButton from './SaveButton'

type GameTileProps = {
  game: TrackedGame
  // Completion percentage, or null while it is not known yet
  progress: number | null
}

// Cover tile that opens the game page, with a save bookmark over its corner
function GameTile({ game, progress }: GameTileProps) {
  const color = progress === null ? undefined : progressColor(progress)

  return (
    <div className="relative">
      <a
        href={`/library/${game.gameId}`}
        aria-label={`Ver logros de ${game.gameName}`}
        className="group relative isolate block aspect-[3/4] overflow-hidden rounded-2xl border border-(--p-line) bg-(--p-surface) text-left text-text"
      >
        <GameCover
          game={{ ...game, total: 0, unlocked: 0 }}
          className="absolute inset-0 -z-10 h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        {progress !== null && (
          <span
            className="absolute left-2.5 top-3 rounded-full border bg-black/60 px-2.5 py-1 text-sm font-semibold tabular-nums backdrop-blur-sm"
            style={{ borderColor: color, color }}
          >
            {progress}%
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <p className="font-display text-xl font-semibold leading-tight line-clamp-2">{game.gameName}</p>
        </div>
      </a>
      <SaveButton game={game} />
    </div>
  )
}

export default GameTile
