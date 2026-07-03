import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../common/interfaces/AuthRequest.interface';
import { AuthUser } from '../common/interfaces/AuthUser.interface';


// Secret keys from environment variables
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {


    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    // 1. Block request if no tokens exist at all
    if (!accessToken && !refreshToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // 2. Try validating the Access Token first
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, ACCESS_SECRET);
        req.user = decoded as AuthUser;
        return next();
      } catch (accessError) {
        // If access token is invalid but not expired, or if no refresh token exists, fail early
        if (!refreshToken) {
          return res.status(401).json({ message: 'Invalid or expired access token' });
        }
        // If expired, the catch block passes execution down to the refresh token logic below
      }
    }

    // 3. Handle token rotation using the Refresh Token
    try {
      // Verify the refresh token
      const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET) as any;
      
      // OPTIONAL: Check your database here to ensure the refresh token wasn't revoked
      // const isRevoked = await checkDbForRevokedToken(refreshToken);
      // if (isRevoked) return res.status(401).json({ message: 'Session expired' });

      // Generate a brand new access token
      const newAccessToken = jwt.sign(
        { id: decodedRefresh.id, email: decodedRefresh.email , username: decodedRefresh.username }, // Mirror your payload structure
        ACCESS_SECRET,
        { expiresIn: '15m' } // Access tokens should be short-lived
      );

      // 4. Attach the new access token to cookies for subsequent requests
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000, // Match 5 minutes expiration
      });

      // Attach user payload to the request object and proceed
      req.user = decodedRefresh;
      next();

    } catch (refreshError) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};


export default authMiddleware
