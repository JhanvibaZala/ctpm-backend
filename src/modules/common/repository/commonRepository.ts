
import { RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";

export class commonRepository{
    async checkManagerRole(user_id:string,workspace_id:string,managerRole_id:number,adminRole_id:number){
        const result = await db.execute<RowDataPacket[]>("select * from workspace_members where user_id = ? and workspace_id = ? and role_id = ? or role_id =?",[
            user_id,
            workspace_id,
            managerRole_id,
            adminRole_id

        ]);
        return [result];

    }
}