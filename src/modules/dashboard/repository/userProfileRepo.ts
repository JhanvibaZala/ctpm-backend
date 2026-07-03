import { RowDataPacket } from "mysql2";
import { IUser } from "../../auth/interfaces/user_obj.interface";
import db from "../../../config/dbconfig";

export class UserProfileRepo {
    async updateUser(user: IUser): Promise<RowDataPacket[]> {
        if (user.profile_pic_path != null) {
            const sql = "update users set first_name=?,last_name=?,bio=?,profile_pic_path=? where id=?"
            const values = [user.first_name ?? null, user.last_name ?? null, user.bio ?? null, user.profile_pic_path ?? null, user.id ?? null]
            const [row] = await db.execute<RowDataPacket[]>(sql, values)
            return row
        } else {
            const sql = "update users set first_name=?,last_name=?,bio=? where id=?"
            const values = [user.first_name ?? null, user.last_name ?? null, user.bio ?? null, user.id ?? null]
            const [row] = await db.execute<RowDataPacket[]>(sql, values)
            return row
        }
    }
}