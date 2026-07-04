import { Request, Response } from "express";
import { LoginService } from "../services/login.service";
import bcrypt from 'bcrypt';
import crypto from "crypto";
import { generateResetToken } from "../../../utils/jwt.utils";

export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const input = req.body.email; // could be email OR username

    try {
        const loginService = new LoginService();

        if (typeof input !== "string" || !input.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email or username."
            });
        }

        // ✅ Returns the actual user row, not just true/false
        const user: any = await loginService.findUserByEmail(input);
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "OTP sent to your registered email address",
                data: { otp: 1, expiresIn: Date.now() + 1000 * 60 * 2, resendAfter: 30 } 
            });
        }

        const actualEmail = user.email_id; // ✅ always a real email from DB

        // Set reset token using actual email
        const resetToken = generateResetToken(actualEmail);
        res.cookie("resetToken", resetToken, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 20 * 60 * 1000
        });

        // Generate OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        // (req.session as any).otp = otp;
        const otpSessionId = req.sessionID;

        const hashedOtp = await bcrypt.hash(otp, 10);

        // ✅ Pass actualEmail — guaranteed to exist in users.email_id
        const createOtp = await loginService.createOtp(actualEmail, hashedOtp, otpSessionId);

        if (!createOtp) {
            return res.status(500).json({
                success: false,
                message: "Failed to create OTP!"
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to your registered email address.", // ✅ clean message
            data: { otp: otp, expiresIn: createOtp.getTime(), resendAfter: 30 } // remove this in production, only for dev/testing
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}