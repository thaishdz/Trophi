import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export interface IUser {
  displayName: string;
  avatar?: string; // Steam avatar URL, refreshed on every login
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  displayName: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema);
