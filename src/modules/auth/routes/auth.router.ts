
import { Router } from 'express';
import passport from '../../../config/passport';
import { refreshController } from '../controller/refreshTokens.controller';
import authMiddleware from '../../../middlewares/auth.middleware';

const router = Router();

// ── Page routes ────────────────────────────────────────────
// router.get('/login', showLoginPage);

// ── Password auth ──────────────────────────────────────────
// router.post('/login', login_user);

// ── Google OAuth ───────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=oauth_failed',
    session: false,
  }),
  refreshController.googleCallback
);

// ── Token management ───────────────────────────────────────
router.post('/refresh', refreshController.refreshToken);
router.post('/logout', authMiddleware, refreshController.logout);

export default router;