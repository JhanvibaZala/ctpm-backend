import { v4 as uuidv4 } from 'uuid';
import pool from '../../../config/dbconfig';
import type { RefreshTokenRow } from "../interfaces/auth.interface";


export class RefreshRepository{

    async storeRefreshToken (userId: string, hashedToken: string, expires_at: Date) {
        try {
            const id = uuidv4();
            await pool.query(
              `INSERT INTO refresh_tokens (id, user_id, hashed_token, expires_at)
               VALUES (?, ?, ?, ?)`,
              [id, userId, hashedToken,expires_at]
            );
        } catch (error) {
            console.log("Error storing the refresh tokens");
            throw error;
        }

    }

   async getValidRefreshTokens (userId: string){
    try {
        const [rows] = await pool.query<any[]>(
      `SELECT * FROM refresh_tokens
       WHERE user_id = ? AND expires_at > UTC_TIMESTAMP()`,
      [userId]
    );
    return rows;
    } catch (error) {
        console.log("Error validating the refresh tokens");
        throw error;
    }

  }

   async deleteAllRefreshTokens (userId: string){
    try {
        await  pool.query(
      `DELETE FROM refresh_tokens WHERE user_id = ?`,
      [userId]
    );
    } catch (error) {
        console.log("Error deleting the refresh tokens");
        throw error;
    }

  }
}