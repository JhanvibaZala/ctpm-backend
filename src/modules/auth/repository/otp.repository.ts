import { RowDataPacket } from "mysql2";
import db from "../../../config/dbconfig";

export class OtpRepository {

    async addOtp(otpId: string, email: string, hashedOtp: string, sessionId: string) {
        try {
            const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
            const sql = `INSERT INTO active_otps (id, user_email, hashed_otp, session_id, expires_at) VALUES (?, ?, ?, ?, ?)`;
            const result: any = await db.execute<RowDataPacket[]>(sql, [otpId, email, hashedOtp, sessionId, expiresAt]);
            if(result[0].affectedRows > 0) {
                return expiresAt
            }
            return null
        } catch (error) {
            console.error("failed to add otp details in repository");
            throw error;
        }
    }

    // Delete old OTPs for email before inserting new one
    async deleteOtpByEmail(email: string): Promise<void> {
        try {
            const sql = `DELETE FROM active_otps WHERE user_email = ?`;
            await db.execute(sql, [email]);
        } catch (error) {
            console.error("failed to delete otp in repository");
            throw error;
        }
    }

    async checkOtp(email: string) {
        try {
            const sql = `SELECT * FROM active_otps WHERE user_email = ? ORDER BY created_at DESC LIMIT 1`;
            const [result]: any = await db.execute<RowDataPacket[]>(sql, [email]);
            return result[0];
        } catch (error) {
            console.error("failed to get otp details in repository");
            throw error;
        }
    }

    // For rate limiting — count resend attempts in last 10 min
    async countRecentOtps(email: string): Promise<number> {
        try {
            const sql = `SELECT COUNT(*) as count FROM active_otps 
                         WHERE user_email = ? 
                         AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`;
            const [result]: any = await db.execute<RowDataPacket[]>(sql, [email]);
            return result[0].count;
        } catch (error) {
            console.error("failed to count otps in repository");
            throw error;
        }
    }
}