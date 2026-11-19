import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../config'

export type LinkKind = 'guides' | 'videos'

export interface SavedLink {
  id: string
  title: string
  url: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include', ...init })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not update the links')
  return result.data
}

// Guide or video links the user saved for an achievement (identified by its apiname)
export function useAchievementLinks(kind: LinkKind, gameId: number, achievement: string) {
  const queryClient = useQueryClient()
  const queryKey = [kind, gameId, achievement]
  const base = `${kind}/${gameId}/${encodeURIComponent(achievement)}`

  const query = useQuery({
    queryKey,
    queryFn: () => request<{ links: SavedLink[] }>(base).then((data) => data.links),
  })

  const add = useMutation({
    mutationFn: (link: { title: string; url: string }) =>
      request<SavedLink>(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(link) }),
    onSuccess: (link) => queryClient.setQueryData<SavedLink[]>(queryKey, (links = []) => [...links, link]),
  })

  const remove = useMutation({
    mutationFn: (linkId: string) => request<null>(`${base}/${linkId}`, { method: 'DELETE' }),
    onSuccess: (_data, linkId) => queryClient.setQueryData<SavedLink[]>(queryKey, (links = []) => links.filter((l) => l.id !== linkId)),
  })

  return { ...query, add, remove }
}
