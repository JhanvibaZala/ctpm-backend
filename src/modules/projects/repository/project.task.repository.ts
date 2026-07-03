import { QueryResult, RowDataPacket } from "mysql2";
import { IProjectTaskStatus } from "../interfaces/project_obj.interface";
import db from "../../../config/dbconfig";


export async function insertProjectAllowedTasksStatus(projectTaskStatus : IProjectTaskStatus){
    try{
        const sql = "insert into allowed_task_statuses(project_id,status_text,status_level) values(?,?,?);"

        const values = [
            projectTaskStatus.project_id || "",
            projectTaskStatus.text || "",
            projectTaskStatus.level || ""
        ]

        const result = await db.execute<QueryResult>(sql,values)
    }catch(err){
        throw err
    }
}