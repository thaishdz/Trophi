import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export interface IGameLibraryEntry {
  gameId: number;
  gameName: string;
}

export interface IGameLibrary {
  steamId: string;
  games: IGameLibraryEntry[];
  syncedAt: Date;
}

const gameLibrarySchema = new Schema<IGameLibrary>({
  steamId: {
    type: String,
    required: true,
    unique: true
  },
  games: [{
    _id: false,
    gameId: { type: Number, required: true },
    gameName: { type: String, required: true }
  }],
  syncedAt: {
    type: Date,
    required: true
  }
});

export const GameLibrary = model<IGameLibrary>('GameLibrary', gameLibrarySchema);
