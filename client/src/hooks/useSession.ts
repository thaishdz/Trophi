import { useQuery } from '@tanstack/react-query'
import { API_URL } from '../config'

export type SessionUser = { displayName: string };

// Returns the session user, or null when there is no session (401)
async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch(`${API_URL}me`, { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error('Could not check the session')
  const result = await res.json()
  return result.data
}

export function useSession() {
  return useQuery({ queryKey: ['session'], queryFn: fetchSession, retry: false })
}
