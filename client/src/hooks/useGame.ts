import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../config'
import { GameData } from '../types/game'

async function fetchGame(gameId: number, { refresh = false } = {}): Promise<GameData> {
  const path = refresh ? `gameAchievements/${gameId}/refresh` : `gameAchievements/${gameId}`
  const res = await fetch(`${API_URL}${path}`, { method: refresh ? 'POST' : 'GET', credentials: 'include' })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not load the achievements')
  return result.data
}

// Shared by the game page and the dashboard so both reuse the same cached request
export function useGame(gameId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGame(gameId),
    staleTime: 30 * 60 * 1000, // same as the server cache of the player's progress
    enabled: options?.enabled ?? true,
  })
}

// The user asks Steam again for their progress in the game; the answer replaces the cached one
export function useRefreshGame(gameId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchGame(gameId, { refresh: true }),
    onSuccess: (game) => queryClient.setQueryData(['game', gameId], game),
  })
}
