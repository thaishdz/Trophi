import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// One free-text note per (user, game, achievement). The achievement is its apiname
export interface IAchievementNote {
  userId: mongoose.Types.ObjectId;
  gameId: number;
  achievement: string;
  text: string;
  updatedAt?: Date;
}

const achievementNoteSchema = new Schema<IAchievementNote>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: Number,
    required: true
  },
  achievement: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

achievementNoteSchema.index({ userId: 1, gameId: 1, achievement: 1 }, { unique: true });

export const AchievementNote = model<IAchievementNote>('AchievementNote', achievementNoteSchema);
