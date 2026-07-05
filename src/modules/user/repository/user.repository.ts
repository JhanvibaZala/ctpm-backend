import { RowDataPacket } from "mysql2"
import db from "../../../config/dbconfig"
import { UserMapper } from "../mapper/user.mapper";
import { ICurrentUser, ICurrentUserReponse } from "../interfaces/user.interface";

export class MeRepository {
    async getCurrentUser(userId: string): Promise<ICurrentUser | null> {
        try {
            const sql = `SELECT id, username, first_name, last_name, email_id, profile_pic_path FROM users WHERE id = ?`
            const [result] = await db.execute<ICurrentUserReponse[]>(sql, [userId]);
            if(result.length === 0) return null;
            console.log(result)
            return UserMapper.toUser(result[0]);
        } catch (error) {
            console.error(error)
            throw error;
        }
    }
}