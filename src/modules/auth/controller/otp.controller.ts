import { Request, Response } from "express";
import { LoginService } from "../services/login.service";
import { verifyResetToken } from "../../../utils/jwt.utils";
import bcrypt from 'bcrypt';
import crypto from "crypto";

export const showOtpPage = async (req: Request, res: Response) => {
    res.render("auth/otpPage");
}

export const otpHandler = async (req: Request, res: Response) => {
    const otp = req.body.otp;

    try {
        const loginService = new LoginService();
        // get email id from cookie
        const resetToken = req.cookies.resetToken;
        const decoded: any = verifyResetToken(resetToken);
        const email = decoded.email;

        // check otp
        const otpCheck = await loginService.verifyOtp(email, otp);
        if (!otpCheck) {
            return res.status(401).render("auth/otpPage", {
                error: "Invalid otp",
                form: { otp: otp } // Restored: Keep the user's input!
            })
        }
        return res.redirect("/reset-password")
    } catch (error) {
        console.log(error);

        // Never send raw err.message to the frontend in a 500 crash
        return res.status(500).render("/login", {
            error: "Something went wrong on our end. Please try again."
        });
    }
}


export const resendOTP = async (req: Request, res: Response) => {
    try {
        const loginService = new LoginService();

        // Get email from reset token cookie (same as otpHandler)
        const resetToken = req.cookies.resetToken;
        if (!resetToken) {
            return res.status(401).json({ success: false, message: "Session expired. Please start again." });
        }

        const decoded: any = verifyResetToken(resetToken);
        const email = decoded.email;

        //  Rate limit — max 4 OTPs per 10 min window
        const recentCount = await loginService.countRecentOtps(email);
        if (recentCount >= 4) {
            return res.status(429).json({
                success: false,
                message: "Too many OTP requests. Please wait 10 minutes before trying again."
            });
        }

        // Generate new OTP (createOtp now deletes old one first)
        const otp = crypto.randomInt(100000, 1000000).toString();
        (req.session as any).otp = otp;
        const otpSessionId = req.sessionID;
        const hashedOtp = await bcrypt.hash(otp, 10);

        const created = await loginService.createOtp(email, hashedOtp, otpSessionId);
        if (!created) {
            return res.status(500).json({ success: false, message: "Failed to resend OTP." });
        }

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully.",
            data: { otp } // remove in production
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
}