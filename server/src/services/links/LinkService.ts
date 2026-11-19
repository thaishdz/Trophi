import { Types } from "mongoose";
import { AchievementLink, LinkKind } from "@/models/AchievementLink";

export interface LinkData {
  id: string;
  title: string;
  url: string;
}

// Which achievement and which kind of link (guide or video) the call is about
export interface LinkScope {
  userId: Types.ObjectId;
  gameId: number;
  achievement: string;
  kind: LinkKind;
}

type LinkDoc = { _id: Types.ObjectId; title: string; url: string };

const toLink = (doc: LinkDoc): LinkData => ({ id: String(doc._id), title: doc.title, url: doc.url });

class LinkService {
  // Oldest first, so a new link shows up at the end of the list
  async list(scope: LinkScope): Promise<LinkData[]> {
    const links = await AchievementLink.find(scope).sort({ createdAt: 1 }).lean();
    return links.map(toLink);
  }

  async add(scope: LinkScope, link: { title: string; url: string }): Promise<LinkData> {
    const created = await AchievementLink.create({ ...scope, ...link });
    return toLink(created);
  }

  // The scope in the filter keeps a user from deleting someone else's link
  async remove(scope: LinkScope, linkId: string): Promise<void> {
    await AchievementLink.deleteOne({ _id: linkId, ...scope });
  }
}

export default LinkService;
