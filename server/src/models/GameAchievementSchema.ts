import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Achievement schema of a game, cached once for every user (GetSchemaForGame)
export interface IGameAchievementSchema {
  gameId: number;
  achievements: {
    name: string;
    value: string;
    description: string;
    icon: string;
  }[];
  syncedAt: Date;
}

const gameAchievementSchemaSchema = new Schema<IGameAchievementSchema>({
  gameId: {
    type: Number,
    required: true,
    unique: true
  },
  achievements: [{
    _id: false,
    name: { type: String, required: true },
    value: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' }
  }],
  syncedAt: {
    type: Date,
    required: true
  }
});

export const GameAchievementSchema = model<IGameAchievementSchema>('GameAchievementSchema', gameAchievementSchemaSchema);
