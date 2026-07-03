import jwt from "jsonwebtoken"
import dotEnv from "dotenv"
dotEnv.config();
export function generateResetToken (payload: string) {
    try {
        const resetTokenKey = process.env.RESET_SECRET_KEY || "your-secret-reset-key";
        if(typeof payload !== "string") {
            throw new Error ("payload must be string");
        }
        const resetToken = jwt.sign({email: payload}, resetTokenKey, {
            expiresIn: "20m"
        })
        return resetToken; 
    } catch (error) {
        throw error;
    }
}

export function verifyResetToken(token: string) {
    try {
        
        if(!token) {
            throw new Error("Reset token in missing")
        }
        const resetTokenKey = process.env.RESET_SECRET_KEY || "your-secret-reset-key";
        return jwt.verify(token, resetTokenKey)
    } catch (error) {
        if(error instanceof jwt.TokenExpiredError) {
            throw new Error("Reset token expired");
        }
        throw error;
    }
}