import SearchBox from './SearchBox'
import ErrorModal from './ErrorModal'
import SavedGames from './SavedGames'
import SearchResultsDialog from './SearchResultsDialog'
import TintedPage from './TintedPage'
import { useState } from 'react'
import { useSearchHistory } from '../lib/searchHistory'
import { GameData } from '../types/game'

function GamesLibrary() {
  const [results, setResults] = useState<GameData[]>([])
  const [resultsOpen, setResultsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = useSearchHistory()[0]

  return (
    <TintedPage game={current?.game}>
      <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight leading-none">Biblioteca</h1>
        <SearchBox onSearchResults={(found) => { setResults(found); setResultsOpen(true) }} onError={setError} />
      </header>

      <ErrorModal message={error} onClose={() => setError(null)} />

      {/* The page itself is the saved library, so the section has no visible title */}
      <section aria-label="Juegos guardados" className="mt-8">
        <SavedGames />
      </section>

      <SearchResultsDialog open={resultsOpen} games={results} onClose={() => setResultsOpen(false)} />
    </TintedPage>
  )
}

export default GamesLibrary
