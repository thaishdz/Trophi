import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// One document per (user, game) with the apinames of the achievements the user follows
export interface IFollowedAchievements {
  userId: mongoose.Types.ObjectId;
  gameId: number;
  achievements: string[];
}

const followedAchievementsSchema = new Schema<IFollowedAchievements>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: Number,
    required: true
  },
  achievements: [{ type: String }]
}, {
  timestamps: true
});

followedAchievementsSchema.index({ userId: 1, gameId: 1 }, { unique: true });

export const FollowedAchievements = model<IFollowedAchievements>('FollowedAchievements', followedAchievementsSchema);
