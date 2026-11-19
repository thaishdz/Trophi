import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Achievement progress of a player in a game, cached per (steamId, game) (GetPlayerAchievements)
export interface IPlayerAchievements {
  steamId: string;
  gameId: number;
  gameName: string;
  totalGameAchievements: number;
  achievements: {
    apiname: string;
    achieved: 0 | 1;
    unlocktime: number;
  }[];
  syncedAt: Date;
}

const playerAchievementsSchema = new Schema<IPlayerAchievements>({
  steamId: {
    type: String,
    required: true
  },
  gameId: {
    type: Number,
    required: true
  },
  gameName: {
    type: String,
    default: ''
  },
  totalGameAchievements: {
    type: Number,
    required: true
  },
  achievements: [{
    _id: false,
    apiname: { type: String, required: true },
    achieved: { type: Number, required: true },
    unlocktime: { type: Number, default: 0 }
  }],
  syncedAt: {
    type: Date,
    required: true
  }
});

playerAchievementsSchema.index({ steamId: 1, gameId: 1 }, { unique: true });

export const PlayerAchievements = model<IPlayerAchievements>('PlayerAchievements', playerAchievementsSchema);
