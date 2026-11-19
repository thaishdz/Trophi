import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../config'

export interface AchievementNote {
  text: string
  updatedAt: string | null // ISO date; null when the achievement has no note yet
}

// Same limit as the server
export const MAX_NOTE_LENGTH = 5000

async function request(gameId: number, achievement: string, text?: string): Promise<AchievementNote> {
  const saving = text !== undefined
  const res = await fetch(`${API_URL}notes/${gameId}/${encodeURIComponent(achievement)}`, {
    method: saving ? 'PUT' : 'GET',
    credentials: 'include',
    headers: saving ? { 'Content-Type': 'application/json' } : undefined,
    body: saving ? JSON.stringify({ text }) : undefined,
  })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not load the note')
  return result.data
}

// The user's free-text note on an achievement (identified by its apiname)
export function useAchievementNote(gameId: number, achievement: string) {
  const queryClient = useQueryClient()
  const queryKey = ['note', gameId, achievement]

  const query = useQuery({ queryKey, queryFn: () => request(gameId, achievement) })

  const save = useMutation({
    mutationFn: (text: string) => request(gameId, achievement, text),
    onSuccess: (note) => queryClient.setQueryData(queryKey, note),
  })

  return { ...query, save }
}
