import { QueryClient } from '@tanstack/react-query'

const MINUTE = 60 * 1000

// Defaults for every query, so moving between pages reuses what is already loaded instead of calling the API again.
// Hooks with data cached longer on the server (library, game) keep their own staleTime.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data loaded less than 5 minutes ago is served from the cache. Our own mutations update the cache themselves
      // (setQueryData or invalidateQueries), so it never shows stale data after a change made in the app.
      staleTime: 5 * MINUTE,
      // Unused data is kept as long as the longest staleTime (the library's 8 h); otherwise it would be dropped
      // after 5 minutes off screen and asked for again even while still fresh.
      gcTime: 8 * 60 * MINUTE,
      retry: 1,
      // Coming back to the tab does not reload every query; the Refresh buttons are there for that
      refetchOnWindowFocus: false,
    },
  },
})
