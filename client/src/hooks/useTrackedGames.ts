import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../config'

export type TrackedGame = {
  gameId: number
  gameName: string
  cover?: string
  coverFallback?: string
}

const queryKey = ['tracked-games']

async function request<T>(method: 'GET' | 'PUT' | 'DELETE', gameId?: number): Promise<T> {
  const path = gameId ? `tracked-games/${gameId}` : 'tracked-games'
  const res = await fetch(`${API_URL}${path}`, { method, credentials: 'include' })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not update the tracked games')
  return result.data
}

// Most recently tracked first
export function useTrackedGames() {
  return useQuery({ queryKey, queryFn: () => request<TrackedGame[]>('GET') })
}

export function useTrackGame(gameId: number) {
  const queryClient = useQueryClient()
  const { data = [] } = useTrackedGames()
  const tracked = data.some((g) => g.gameId === gameId)

  const mutation = useMutation({
    mutationFn: ({ track }: { game: TrackedGame; track: boolean }) => request(track ? 'PUT' : 'DELETE', gameId),
    // Optimistic update: the button reacts at once and rolls back if the request fails
    onMutate: async ({ game, track }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TrackedGame[]>(queryKey) ?? []
      const others = previous.filter((g) => g.gameId !== gameId)
      queryClient.setQueryData(queryKey, track ? [game, ...others] : others)
      return { previous }
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(queryKey, context?.previous ?? []),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const toggle = (game: TrackedGame) => mutation.mutate({ game, track: !tracked })

  return { tracked, toggle, failed: mutation.isError }
}
