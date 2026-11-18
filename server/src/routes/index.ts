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

const router = Router();

// si los servicios crecen, en vez de instanciar manualmente considera un refactor con inversión de control(IoC)
const steamService = new SteamService();
const gameService = new GameService(steamService);
const achievementsService = new AchievementsService(steamService);
const followController = new FollowController(new FollowService());
const trackedGamesController = new TrackedGamesController(new TrackedGamesService(gameService));
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

// Followed achievements of the logged-in user (the achievement is its apiname)
router.get(`/follows/:gameId`, ensureAuthenticated, followController.list);
router.put(`/follows/:gameId/:achievement`, ensureAuthenticated, followController.follow);
router.delete(`/follows/:gameId/:achievement`, ensureAuthenticated, followController.unfollow);

// Games the logged-in user tracks. Tracking needs the steamId to check the game is in their library
router.get(`/tracked-games`, ensureAuthenticated, trackedGamesController.list);
router.put(`/tracked-games/:gameId`, ensureAuthenticated, getSteamId, trackedGamesController.track);
router.delete(`/tracked-games/:gameId`, ensureAuthenticated, trackedGamesController.untrack);

export default router;
