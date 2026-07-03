import db from "../../../config/dbconfig"

export class TeamMemberRepo {
    async getTeamMember(userid : string){
        const sql = "select * from users where id!=?"

        const [rows] = await db.execute(sql,[userid])

        return rows;
    }
}