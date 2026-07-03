import { Request, Response } from "express";
import { LoginService } from "../services/login.service";
import { RefreshRepository } from "../repository/refreshTokens.repository";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { LoginDto } from "../dto/login.dto";

const ACCESS_SECRET=process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET=process.env.JWT_REFRESH_SECRET as string;

export const loginUser = async (req: Request, res: Response) => {
    // Extract early so we can pass the email back to the view on failure
    const { email, password, rememberMe }: LoginDto = req.body;

    try {
        const loginService = new LoginService();
        const refreshRepo =new RefreshRepository();

        // 1. Validate credentials (Logic Layer)
        // Remember: Our service returns the user object on success, or null on failure
        const user = await loginService.authenticateUser(email, password);
        // 3. Handle Failure
        if (!user) {
            return res.status(401).json({
                success: false,
                errors: [{
                    field:"password",
                    message: "Invalid email or password"
                }]
            });
        }


        const payload = {
            id: user!.id,
            email: user!.email_id,
            username: user!.username
        }

        const isRemembered = rememberMe === "on";
        const refreshExpiry = isRemembered ? "30d" : "7d";
        const refreshCookieAge = isRemembered
            ? 30 * 24 * 60 * 60 * 1000   // 30 days
            : 7 * 24 * 60 * 60 * 1000;   // 7 days

            // 2. Generate short-lived Access Token (e.g., 15 minutes)
        const accessToken = jwt.sign(
          payload,
          ACCESS_SECRET,
          { expiresIn: '15m' }
        );

        // 3. Generate long-lived Refresh Token (e.g., 7 days)
        const refreshToken = jwt.sign(
          payload,
          REFRESH_SECRET,
          { expiresIn: refreshExpiry }
        );

        const expiresAt = isRemembered
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const hashed_ref_token = await bcrypt.hash(refreshToken,10);
        // OPTIONAL BUT RECOMMENDED: Save refresh token to DB via Repository
        await refreshRepo.storeRefreshToken(user!.id as string, hashed_ref_token, expiresAt);

        // 4. Set Access Token Cookie
        res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 mins
        });

        // 5. Set Refresh Token Cookie
        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: refreshCookieAge, // 7 days
        });


        return res.status(200).json({
            success: true,
            message: "Login successfully",
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        })

    } catch (err) {
        console.log(err);
        
        // Never send raw err.message to the frontend in a 500 crash
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const getUserDetails = async (req: Request, res: Response) => {
    const email = req.params.email 
    try {
        const loginService = new LoginService();
        if(typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "invalid email"
            })
        }
        const user = await loginService.findUserByEmail(email);
        if(!user) {
            console.log("not found")
            return res.status(401).json({
                message: "user not found!"
            });
        }
        console.log("found")
        return res.status(200).json({
            message: "user found!"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "failed to fetch data of user"
        })
    }
}

