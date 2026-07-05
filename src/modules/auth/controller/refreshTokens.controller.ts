
import type { Request, Response } from 'express';
import { ENV } from '../../../config/envConfig';
import { RefreshAccessService } from '../services/refreshAccess.service';
import type { AuthUser } from '../interfaces/auth.interface.ts';
import { AuthRequest } from '../../../common/interfaces/AuthRequest.interface';

const COOKIE_BASE = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

// Instantiate once — not inside every method
const refreshService = new RefreshAccessService();

export const refreshController = {

  // GET /auth/google/callback
  googleCallback: async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user;
    
    if (!user) {
      res.redirect(`${ENV.CLIENT_URL}/login?error=oauth_failed`);
      return;
    }

    try {
      const { accessToken, refreshToken } = await refreshService.issueTokens(
        user.id,
        user.email,   // ← pass these so payload stays consistent
        user.username
      );

          // ADD THIS

      // Match cookie names used everywhere else
      res.cookie('access_token', accessToken, {
        ...COOKIE_BASE,
        maxAge: 15 * 60 * 1000,           // 15 mins
      });
      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_BASE,
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      });

      res.redirect(`${ENV.CLIENT_URL}/dashboard/workspaces`);
    } catch {
      res.redirect(`${ENV.CLIENT_URL}/login?error=server_error`);
    }
  },

  // POST /auth/refresh
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    const token: string | undefined = req.cookies?.refresh_token;

    if (!token) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }

    try {
      const accessToken = await refreshService.rotateAccessToken(token);

      res.cookie('access_token', accessToken, {
        ...COOKIE_BASE,
        maxAge: 15 * 60 * 1000,
      });

      res.json({ message: 'Token refreshed' });
    } catch (err: any) {
      const isInvalid = err.message === 'INVALID_REFRESH_TOKEN';
      res.status(401).json({
        message: isInvalid
          ? 'Invalid refresh token'
          : 'Expired or invalid refresh token',
      });
    }
  },

  // POST /auth/logout
  logout: async (req: Request, res: Response): Promise<void> => {
    const token: string | undefined = req.cookies?.refresh_token;

    if (token) await refreshService.revokeTokens(token);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('resetToken');
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  },

};