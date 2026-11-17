import { Router } from "express";
import { passport } from "../config/passport";
import config from "../config";

const router = Router();

// Redirects the user to Steam to log in
router.get('/steam', passport.authenticate('steam-openid'));

// Steam redirects back here after login; then we redirect to the dashboard
router.get('/steam/return',
  passport.authenticate('steam-openid', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(`${config.FRONTEND_URL}/dashboard`);
  }
);


export default router;
