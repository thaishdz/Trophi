import GameCard from './GameCard'
import SearchBox from './SearchBox'
import GameStatusTabs from './GameStatusTabs'
import ErrorModal from './ErrorModal'
import { useState } from 'react'
import { GameData } from '../types/game'


function GamesLibrary() {
  const [games, setGames] = useState<GameData[]>([])
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight leading-none">Games Library</h1>
        <SearchBox onSearchResults={setGames} onError={setError} />
      </header>

      <ErrorModal message={error} onClose={() => setError(null)} />

      <GameStatusTabs activeStatus="All" onStatusChange={() => {}} />

      {games.length ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map(game => (<GameCard key={game.gameId} game={game} />))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-ink-text/40 px-6 py-16 text-center">
          <p className="font-display text-3xl font-semibold">Nada en pantalla todavía</p>
          <p className="mt-2 text-ink-text/75">Busca un juego de tu biblioteca para ver los logros que te faltan.</p>
        </div>
      )}
    </>
  )
}

export default GamesLibrary
