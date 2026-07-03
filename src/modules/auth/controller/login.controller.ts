import { Request, Response } from "express";
import { LoginService } from "../services/login.service";
import { RefreshRepository } from "../repository/refreshTokens.repository";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

const ACCESS_SECRET=process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET=process.env.JWT_REFRESH_SECRET as string;

export const showLoginPage = async (req: Request, res: Response) => {
    res.render("auth/login",{ query: req.query, error: null, form: {} })
}

export const login_user = async (req: Request, res: Response) => {
    // Extract early so we can pass the email back to the view on failure
    const { email, password ,remember_me} = req.body;

    try {
        const loginService = new LoginService();
        const refreshRepo =new RefreshRepository();

        // 1. Basic sanity check (Traffic Layer)
        if (typeof email !== "string" || !email) {
            return res.status(400).render("auth/login", {
                error: "Please provide a valid email format.",
                form: { email } // Notice we only pass the email back, NOT the password
            });
        }

        // 2. Validate credentials (Logic Layer)
        // Remember: Our service returns the user object on success, or null on failure
        const valid_user = await loginService.check_credentials(email, password);
        // 3. Handle Failure
        if (!valid_user) {
            return res.status(401).render("auth/login", {
                error: "Invalid email or password.", 
                form: { email } 
            });
        }

        const valid_user_obj = valid_user[0]

        const payload = {
            id: valid_user_obj!.id,
            email: valid_user_obj!.email_id,
            username: valid_user_obj!.username
        }

        const isRemembered = remember_me === "on";
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

        const hashed_ref_token=await bcrypt.hash(refreshToken,10);
        // OPTIONAL BUT RECOMMENDED: Save refresh token to DB via Repository
        await refreshRepo.storeRefreshToken(valid_user_obj!.id as string, hashed_ref_token, expiresAt);

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


        return res.redirect("/dashboard/workspaces");

    } catch (err) {
        console.log(err);
        
        // Never send raw err.message to the frontend in a 500 crash
        return res.status(500).render("auth/login", {
            error: "Something went wrong on our end. Please try again.",
            form: { email }
        });
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
        const user = await loginService.check_email(email);
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

