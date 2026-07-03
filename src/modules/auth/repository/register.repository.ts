import db from "../../../config/dbconfig";
import { IUser } from "../interfaces/user_obj.interface";
import { ResultSetHeader } from "mysql2";
export class RegisterRepository {
    async insertUser(user_obj: IUser): Promise<boolean> {
        try {
            const sql = `insert into users(id,username,first_name,last_name,email_id,hashed_password)
            values(?,?,?,?,?,?)`
            const values = [
                user_obj.id!,
                user_obj.username!,
                user_obj.firstName!,
                user_obj.lastName!,
                user_obj.email!,
                user_obj.hashedPassword!
            ]
            const [result] = await db.execute<ResultSetHeader>(sql, values)
            return result.affectedRows > 0;
        } catch (err) {
            throw err
        }
    }
}
