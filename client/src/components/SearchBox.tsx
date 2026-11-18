import { FormEvent, useState } from 'react'
import { API_URL } from '../config'
import { GameData } from '../types/game'
import { recordSearch } from '../lib/searchHistory'


type Props = {
  onSearchResults: (games: GameData[]) => void
  onError: (message: string) => void
  className?: string
}

function SearchBox({ className = 'w-full sm:w-80', ...props }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const url = `${API_URL}search?game=${encodeURIComponent(query)}`

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(result => {
        if (!result.success) {
          props.onError(result.message)
          return
        }
        const games: GameData[] = result.data ?? []
        // The dashboard shows the first match as the current game
        if (games.length) recordSearch(query, games[0])
        props.onSearchResults(games)
      })
      .catch(() => props.onError('No se pudo conectar con el servidor'))
      .finally(() => setLoading(false))
  }

  return (
    <div className={className}>
      <form onSubmit={handleSearch} role="search" className="relative w-full">
        {/* The icon is the submit button, so Enter and a click both search. z-10 keeps it above the input, whose backdrop blur would otherwise paint over it */}
        <button
          className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-text/70 hover:text-text ${loading ? 'animate-pulse opacity-50 cursor-wait' : 'cursor-pointer'}`}
          type="submit"
          aria-label="Buscar"
          disabled={loading}>
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round" d="M21 21l-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
          </svg>
        </button>
        <input
          className="w-full h-12 pl-12 pr-5 rounded-full bg-[color-mix(in_srgb,var(--p-surface,rgb(0_0_0/0.35))_55%,transparent)] border border-[var(--p-line,var(--color-line))] text-text placeholder:text-muted backdrop-blur-sm focus:border-[var(--p-accent,var(--color-gold))] focus:outline-none focus:ring-1 focus:ring-[var(--p-accent,var(--color-gold))]"
          type="search"
          aria-label="Buscar en tu biblioteca"
          placeholder={loading ? 'Buscando…' : 'Buscar juego…'}
          value={query}
          aria-busy={loading}
          onChange={(e) => setQuery(e.target.value)}/>
      </form>
    </div>
  )
}

export default SearchBox
