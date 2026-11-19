import { Router } from "express";

import { ensureAuthenticated } from "../middlewares/auth";
import { GameController } from "../controllers/GameController";
import SteamService from "../services/steam/SteamService";
import GameService from "../services/games/GameService";
import AchievementsService from "../services/achievements/AchievementsService";
import { getSteamId } from "../middlewares/steamId";
import { getMe } from "../controllers/UserController";
import FollowService from "../services/follows/FollowService";
import { FollowController } from "../controllers/FollowController";
import TrackedGamesService from "../services/tracked/TrackedGamesService";
import { TrackedGamesController } from "../controllers/TrackedGamesController";
import NoteService from "../services/notes/NoteService";
import { NoteController } from "../controllers/NoteController";
import LinkService from "../services/links/LinkService";
import { LinkController } from "../controllers/LinkController";

const router = Router();

// si los servicios crecen, en vez de instanciar manualmente considera un refactor con inversión de control(IoC)
const steamService = new SteamService();
const gameService = new GameService(steamService);
const achievementsService = new AchievementsService(steamService);
const followController = new FollowController(new FollowService());
const trackedGamesController = new TrackedGamesController(new TrackedGamesService(gameService));
const noteController = new NoteController(new NoteService());
const linkService = new LinkService();
const guideController = new LinkController(linkService, "guide");
const videoController = new LinkController(linkService, "video");
const gamesController = new GameController(
  gameService,
  achievementsService
);

// The client uses it to know if there is a session (401 if there is none)
router.get(`/me`, ensureAuthenticated, getMe);
router.get(
  `/search`,
  ensureAuthenticated,
  getSteamId,
  gamesController.searchGame.bind(gamesController),
);
router.get(
  `/gameAchievements/:gameId`,
  ensureAuthenticated,
  getSteamId,
  gamesController.getGameAchievements.bind(gamesController),
);
router.post(
  `/gameAchievements/:gameId/refresh`,
  ensureAuthenticated,
  getSteamId,
  gamesController.refreshGameAchievements,
);
router.get(`/library`, ensureAuthenticated, getSteamId, gamesController.getLibraryStatus);
router.post(`/library/refresh`, ensureAuthenticated, getSteamId, gamesController.refreshLibrary);

// Followed achievements of the logged-in user (the achievement is its apiname)
router.get(`/follows/:gameId`, ensureAuthenticated, followController.list);
router.put(`/follows/:gameId/:achievement`, ensureAuthenticated, followController.follow);
router.delete(`/follows/:gameId/:achievement`, ensureAuthenticated, followController.unfollow);

// The logged-in user's note on an achievement (the achievement is its apiname)
router.get(`/notes/:gameId/:achievement`, ensureAuthenticated, noteController.get);
router.put(`/notes/:gameId/:achievement`, ensureAuthenticated, noteController.save);

// Guide and video links the logged-in user saved for an achievement
router.get(`/guides/:gameId/:achievement`, ensureAuthenticated, guideController.list);
router.post(`/guides/:gameId/:achievement`, ensureAuthenticated, guideController.add);
router.delete(`/guides/:gameId/:achievement/:linkId`, ensureAuthenticated, guideController.remove);
router.get(`/videos/:gameId/:achievement`, ensureAuthenticated, videoController.list);
router.post(`/videos/:gameId/:achievement`, ensureAuthenticated, videoController.add);
router.delete(`/videos/:gameId/:achievement/:linkId`, ensureAuthenticated, videoController.remove);

// Games the logged-in user tracks. Tracking needs the steamId to check the game is in their library
router.get(`/tracked-games`, ensureAuthenticated, trackedGamesController.list);
router.put(`/tracked-games/:gameId`, ensureAuthenticated, getSteamId, trackedGamesController.track);
router.delete(`/tracked-games/:gameId`, ensureAuthenticated, trackedGamesController.untrack);

export default router;
