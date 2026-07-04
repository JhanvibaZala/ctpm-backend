import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";
import { IUser } from "../interfaces/user_obj.interface";

export class LoginRepository {
    // check if email exists in the database
    async findUserByEmail(email: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select * from users where email_id = ?`;
            const [rows] = await db.execute<RowDataPacket[]>(sql, [email]);
          
            return rows as RowDataPacket[];
        } catch (error) {
            console.error("failed to check login details in repository");
            throw error;
        }
    }
    // check if email exists in the database
    async resetPassword(email: string, password: string): Promise<Boolean> {
        try {
            const sql = `update users set hashed_password = ? where email_id = ? or username = ?;`;
            const [rows] = await db.execute<ResultSetHeader>(sql, [password, email, email]);
            return rows.affectedRows > 0;
        } catch (error) {
            console.error("failed to check login details in repository");
            throw error;
        }
    }

    // In your repository
    async findByEmailOrUsername(input: string): Promise<{ email_id: string } | null> {
        const [rows]: any = await db.query(
            `SELECT email_id FROM users WHERE email_id = ? OR username = ? LIMIT 1`,
            [input, input]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}