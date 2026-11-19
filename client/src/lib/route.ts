// No router yet: the sidebar links are plain anchors, so the path picks the view
export type Route =
  | { view: 'achievement'; gameId: number; achievementId: string }
  | { view: 'game'; gameId: number }
  | { view: 'library' }
  | { view: 'profile' }
  | { view: 'dashboard' }

// /library lists the games; /library/:id is the page of a single game; /library/:id/achievements/:apiname, one of its achievements
const GAME_PATH = /^\/library\/(\d+)(?:\/achievements\/([^/]+))?\/?$/

export function parseRoute(path: string): Route {
  const [, gameMatch, achievementMatch] = path.match(GAME_PATH) ?? []
  const gameId = Number(gameMatch)

  if (gameId && achievementMatch) return { view: 'achievement', gameId, achievementId: decodeURIComponent(achievementMatch) }
  if (gameId) return { view: 'game', gameId }
  if (path.startsWith('/library')) return { view: 'library' }
  if (path.startsWith('/profile')) return { view: 'profile' }
  return { view: 'dashboard' }
}
