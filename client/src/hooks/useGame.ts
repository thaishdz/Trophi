import { useQuery } from '@tanstack/react-query'
import { API_URL } from '../config'
import { GameData } from '../types/game'

async function fetchGame(gameId: number): Promise<GameData> {
  const res = await fetch(`${API_URL}gameAchievements/${gameId}`, { credentials: 'include' })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not load the achievements')
  return result.data
}

// Shared by the game page and the dashboard so both reuse the same cached request
export function useGame(gameId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGame(gameId),
    staleTime: 5 * 60 * 1000, // same cooldown the server applies per (user, game)
    enabled: options?.enabled ?? true,
  })
}
