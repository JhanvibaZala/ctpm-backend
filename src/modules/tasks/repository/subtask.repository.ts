import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../../../config/dbconfig";
import { ICreateSubtask } from "../interfaces/subtask.interface";
import { ICreateAttachments } from "../interfaces/attachments.interface";

export class SubtasksRepository {

    async createSubtask(task: ICreateSubtask): Promise<boolean> {
        try {
            const sql = `insert into project_tasks(id, project_id, parent_id, depends_on_task_id, task_name, description, status_id, priority_level, estimated_hours, start_date, due_at, completed_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
            const values = [
                task.id, 
                task.projectId, 
                task.parentId,
                task.dependsOnTaskId ?? null, 
                task.taskName, 
                task.description ?? null, 
                task.statusId, 
                task.priorityLevel ?? "Medium", 
                task.estimatedHours ?? null,
                task.startDate ?? null,
                task.dueDate ?? null, 
                task.completedAt ?? null
            ];
            const [result] = await db.execute<ResultSetHeader>(sql, values);
            console.log(result)
            return result.affectedRows > 0;
        } catch (error) {
            console.error("failed to create subtask");
            throw error;
        }
    }
}

