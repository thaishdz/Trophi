import { Types } from "mongoose";
import { AchievementNote } from "../../models/AchievementNote";

export interface NoteData {
  text: string;
  updatedAt: Date | null;
}

const EMPTY_NOTE: NoteData = { text: "", updatedAt: null };

class NoteService {
  async getNote(userId: Types.ObjectId, gameId: number, achievement: string): Promise<NoteData> {
    const stored = await AchievementNote.findOne({ userId, gameId, achievement }).lean();
    return stored ? { text: stored.text, updatedAt: stored.updatedAt ?? null } : EMPTY_NOTE;
  }

  // Saving a blank note deletes it, so the collection only holds notes with content
  async saveNote(userId: Types.ObjectId, gameId: number, achievement: string, text: string): Promise<NoteData> {
    const filter = { userId, gameId, achievement };
    if (!text.trim()) {
      await AchievementNote.deleteOne(filter);
      return EMPTY_NOTE;
    }
    const saved = await AchievementNote.findOneAndUpdate(
      filter,
      { $set: { text } },
      { upsert: true, returnDocument: "after" },
    ).lean();
    return { text: saved?.text ?? text, updatedAt: saved?.updatedAt ?? null };
  }
}

export default NoteService;
