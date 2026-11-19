import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../config'

export type LibraryStatus = {
  total: number
  syncedAt: string // ISO date
}

const queryKey = ['library']

async function request(refresh: boolean): Promise<LibraryStatus> {
  const path = refresh ? 'library/refresh' : 'library'
  const res = await fetch(`${API_URL}${path}`, { method: refresh ? 'POST' : 'GET', credentials: 'include' })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'Could not load the library')
  return result.data
}

export function useLibraryStatus() {
  return useQuery({ queryKey, queryFn: () => request(false), staleTime: 8 * 60 * 60 * 1000 }) // same as the server cache of the library
}

export function useRefreshLibrary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request(true),
    onSuccess: (status) => queryClient.setQueryData(queryKey, status),
  })
}
