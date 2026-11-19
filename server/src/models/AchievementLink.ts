import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const LINK_KINDS = ['guide', 'video'] as const;
export type LinkKind = typeof LINK_KINDS[number];

// A link the user saved for an achievement: a guide or a video. One document per link; the achievement is its apiname
export interface IAchievementLink {
  userId: mongoose.Types.ObjectId;
  gameId: number;
  achievement: string;
  kind: LinkKind;
  title: string;
  url: string;
  createdAt?: Date;
}

const achievementLinkSchema = new Schema<IAchievementLink>({
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
  kind: {
    type: String,
    enum: LINK_KINDS,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

achievementLinkSchema.index({ userId: 1, gameId: 1, achievement: 1, kind: 1, createdAt: 1 });

export const AchievementLink = model<IAchievementLink>('AchievementLink', achievementLinkSchema);
