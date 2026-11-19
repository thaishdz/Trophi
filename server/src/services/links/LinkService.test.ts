import { Types } from "mongoose";
import LinkService, { LinkScope } from "./LinkService";
import { AchievementLink } from "@/models/AchievementLink";

jest.mock("@/models/AchievementLink", () => ({
  AchievementLink: { find: jest.fn(), create: jest.fn(), deleteOne: jest.fn() },
}));

const mockedModel = AchievementLink as jest.Mocked<typeof AchievementLink>;

describe("LinkService", () => {
  const scope: LinkScope = { userId: new Types.ObjectId(), gameId: 1145360, achievement: "ACH_1", kind: "video" };
  const linkId = new Types.ObjectId();
  const link = { title: "No-hit run", url: "https://www.youtube.com/watch?v=abc" };
  let service: LinkService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LinkService();
  });

  it("lists the links of one kind for an achievement, oldest first", async () => {
    const sort = jest.fn(() => ({ lean: () => Promise.resolve([{ _id: linkId, ...link }]) }));
    mockedModel.find.mockReturnValue({ sort } as never);

    await expect(service.list(scope)).resolves.toEqual([{ id: String(linkId), ...link }]);
    expect(mockedModel.find).toHaveBeenCalledWith(scope);
    expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
  });

  it("adds a link", async () => {
    mockedModel.create.mockResolvedValue({ _id: linkId, ...link } as never);

    await expect(service.add(scope, link)).resolves.toEqual({ id: String(linkId), ...link });
    expect(mockedModel.create).toHaveBeenCalledWith({ ...scope, ...link });
  });

  it("removes only a link of the same user, achievement and kind", async () => {
    mockedModel.deleteOne.mockResolvedValue({ deletedCount: 1 } as never);

    await service.remove(scope, String(linkId));
    expect(mockedModel.deleteOne).toHaveBeenCalledWith({ _id: String(linkId), ...scope });
  });
});
