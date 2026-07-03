import { Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";

import { AuthRequest } from "../common/interfaces/AuthRequest.interface";
import { JwtPayload } from "../interfaces/jwt";

// ==============================
// Environment Variables
// ==============================

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is missing.");
}

if (!REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is missing.");
}

// ==============================
// Auth Middleware
// ==============================

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    // ==============================
    // No Tokens
    // ==============================

    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ==============================
    // Verify Access Token
    // ==============================

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          ACCESS_SECRET
        ) as JwtPayload;

        req.user = decoded;
        return next();
      } catch (error) {
        // If token is invalid for any reason other than expiration,
        // immediately reject the request.

        if (!(error instanceof TokenExpiredError)) {
          return res.status(401).json({
            success: false,
            message: "Invalid access token.",
          });
        }

        // If expired, continue to refresh token verification.
      }
    }

    // ==============================
    // Refresh Token Missing
    // ==============================

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // ==============================
    // Verify Refresh Token
    // ==============================

    try {
      const decodedRefresh = jwt.verify(
        refreshToken,
        REFRESH_SECRET
      ) as JwtPayload;

      // ==========================================
      // TODO
      // Check hashed refresh token from database
      // using RefreshRepository.
      // ==========================================

      const newAccessToken = jwt.sign(
        {
          id: decodedRefresh.id,
          email: decodedRefresh.email,
          username: decodedRefresh.username,
        },
        ACCESS_SECRET,
        {
          expiresIn: "15m",
        }
      );

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      req.user = decodedRefresh;

      return next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }
  } catch (error) {
    console.error("Authentication Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export default authMiddleware;