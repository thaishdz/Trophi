import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../config'

// The achievement is identified by its apiname (Achievement.value), not by its display name
async function request(gameId: number, method: 'GET' | 'PUT' | 'DELETE', achievement?: string): Promise<string[]> {
  const path = achievement ? `${gameId}/${encodeURIComponent(achievement)}` : `${gameId}`
  const res = await fetch(`${API_URL}follows/${path}`, { method, credentials: 'include' })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not update the followed achievements')
  return result.data.achievements
}

// Read-only: the apinames in the order they were followed (the last one is the most recent)
export function useFollowedList(gameId: number) {
  return useQuery({ queryKey: ['follows', gameId], queryFn: () => request(gameId, 'GET') })
}

export function useFollowedAchievements(gameId: number) {
  const queryClient = useQueryClient()
  const queryKey = ['follows', gameId]

  const { data = [] } = useFollowedList(gameId)

  const mutation = useMutation({
    mutationFn: ({ achievement, follow }: { achievement: string; follow: boolean }) =>
      request(gameId, follow ? 'PUT' : 'DELETE', achievement),
    // Optimistic update: the button reacts at once and rolls back if the request fails
    onMutate: async ({ achievement, follow }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<string[]>(queryKey) ?? []
      const next = follow ? [...previous.filter((a) => a !== achievement), achievement] : previous.filter((a) => a !== achievement)
      queryClient.setQueryData(queryKey, next)
      return { previous }
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(queryKey, context?.previous ?? []),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const followed = new Set(data)
  const toggle = (achievement: string) => mutation.mutate({ achievement, follow: !followed.has(achievement) })

  return { followed, toggle, failed: mutation.isError }
}
