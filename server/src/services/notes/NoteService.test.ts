import { Types } from "mongoose";
import NoteService from "./NoteService";
import { AchievementNote } from "../../models/AchievementNote";

jest.mock("../../models/AchievementNote", () => ({
  AchievementNote: { findOne: jest.fn(), findOneAndUpdate: jest.fn(), deleteOne: jest.fn() },
}));

const mockedModel = AchievementNote as jest.Mocked<typeof AchievementNote>;
// The service chains .lean() after each query
const resolves = (value: unknown) => ({ lean: () => Promise.resolve(value) }) as never;

describe("NoteService", () => {
  const userId = new Types.ObjectId();
  const gameId = 1145360;
  const achievement = "ACH_1";
  const filter = { userId, gameId, achievement };
  const updatedAt = new Date("2026-11-19T10:00:00Z");
  let service: NoteService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NoteService();
  });

  it("returns the note of an achievement", async () => {
    mockedModel.findOne.mockReturnValue(resolves({ text: "Use the shield", updatedAt }));

    await expect(service.getNote(userId, gameId, achievement)).resolves.toEqual({ text: "Use the shield", updatedAt });
    expect(mockedModel.findOne).toHaveBeenCalledWith(filter);
  });

  it("returns an empty note when there is none yet", async () => {
    mockedModel.findOne.mockReturnValue(resolves(null));

    await expect(service.getNote(userId, gameId, achievement)).resolves.toEqual({ text: "", updatedAt: null });
  });

  it("saves the note with an upsert", async () => {
    mockedModel.findOneAndUpdate.mockReturnValue(resolves({ text: "Use the shield", updatedAt }));

    await expect(service.saveNote(userId, gameId, achievement, "Use the shield")).resolves.toEqual({ text: "Use the shield", updatedAt });
    expect(mockedModel.findOneAndUpdate).toHaveBeenCalledWith(
      filter,
      { $set: { text: "Use the shield" } },
      { upsert: true, returnDocument: "after" },
    );
  });

  it("deletes the note when it is saved blank", async () => {
    mockedModel.deleteOne.mockResolvedValue({ deletedCount: 1 } as never);

    await expect(service.saveNote(userId, gameId, achievement, "   ")).resolves.toEqual({ text: "", updatedAt: null });
    expect(mockedModel.deleteOne).toHaveBeenCalledWith(filter);
    expect(mockedModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
