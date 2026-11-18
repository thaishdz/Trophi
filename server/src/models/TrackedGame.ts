import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// A game the user saves to track it, one document per (user, game)
export interface ITrackedGame {
  userId: mongoose.Types.ObjectId;
  gameId: number;
  gameName: string;
  createdAt: Date;
}

const trackedGameSchema = new Schema<ITrackedGame>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: Number,
    required: true
  },
  gameName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

trackedGameSchema.index({ userId: 1, gameId: 1 }, { unique: true });

export const TrackedGame = model<ITrackedGame>('TrackedGame', trackedGameSchema);
