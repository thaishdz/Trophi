export interface Achievement {
  name: string;
  value: string;
  description: string;
  icon: string;
  achieved: number; // 0 = not achieved, 1 = achieved
}

export interface GameData {
  gameId: number;
  gameName: string;
  cover?: string; // portada vertical 600x900 (CDN de Steam)
  coverFallback?: string; // cabecera horizontal si la portada vertical no existe
  syncedAt?: string; // when the player's progress was last asked to Steam (ISO date)
  totalGameAchievements: number;
  achievements: Achievement[];
}
