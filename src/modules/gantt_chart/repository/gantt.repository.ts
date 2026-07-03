import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";

export class GanttRepository {
    // check if email exists in the database
    async fetchProjectTasks(project_id: number) {
        const query = `SELECT id, parent_id, depends_on_task_id, task_name, description,
                       status_id, priority_level, estimated_hours,
                       start_date, due_at, completed_at
                       FROM project_tasks
                       WHERE project_id = ? AND is_deleted = 0
                       ORDER BY start_date ASC;`

        const values = [project_id]

        const [queryResult] = await db.execute(query, values);

        return queryResult;
    }

    async fetchProjectStatuses(project_id: number) {
        const query = `SELECT * FROM allowed_task_statuses WHERE project_id = ?`
        const values = [project_id]
        const [queryResult] = await db.execute(query, values)
        return queryResult;
    }
}