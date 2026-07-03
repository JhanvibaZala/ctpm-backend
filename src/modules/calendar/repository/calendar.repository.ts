import db from "../../../config/dbconfig";
import { CalendarTask } from "../interfaces/task.interface";


export class CalendarRepository {



    async fetchProjectTasks(project_id: string): Promise<CalendarTask[]> {

    const query = `
        SELECT 
            pt.id,
            pt.project_id,
            pt.task_name,
            pt.description,
            pt.status_id,
            ast.status_text,
            pt.priority_level,
            pt.start_date,
            pt.due_at,
            pt.completed_at

        FROM project_tasks pt

        JOIN allowed_task_statuses ast
        ON ast.id = pt.status_id

        WHERE pt.project_id = ?
        AND pt.is_deleted = 0

        ORDER BY pt.due_at ASC
    `;

    const [rows] = await db.execute<CalendarTask[]>(
        query,
        [project_id]
    );

    return rows;
}

    async fetchProjectStatuses(project_id: string) {

        const query = `
            SELECT *
            FROM allowed_task_statuses
            WHERE project_id = ?
        `;

        const values = [project_id];

        const [queryResult] =
            await db.execute(query, values);

        return queryResult;
    }



    async fetchTaskDetails(
 taskId:string,
 projectId:string
){

const query = `

SELECT
 pt.id,
 pt.task_name,
 pt.description,
 pt.priority_level,
 pt.start_date,
 pt.due_at,

 ps.status_text,

 JSON_ARRAYAGG(
   JSON_OBJECT(
     'id',u.id,
     'username',u.username
   )
 ) AS assignees


FROM project_tasks pt


JOIN project_statuses ps
ON ps.id = pt.status_id


LEFT JOIN task_members tm
ON tm.task_id = pt.id


LEFT JOIN users u
ON u.id = tm.user_id


WHERE pt.id = ?
AND pt.project_id = ?
AND pt.is_deleted = 0


GROUP BY pt.id;

`;


const [rows]:any =
 await db.execute(
   query,
   [
    taskId,
    projectId
   ]
 );


return rows[0];

}
}