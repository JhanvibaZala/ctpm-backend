import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ICreateTasks, IUpdateTasks } from "../interfaces/tasks.interface";
import db from "../../../config/dbconfig";
import { ICreateAttachments, IDeleteAttachments } from "../interfaces/attachments.interface";
import { mapAttachment, mapTask } from "../../../utils/task.mapper";
import { ICheckIds } from "../interfaces/ws-project-id.interface";
import { ISubtask } from "../interfaces/subtask.interface";

export class TasksRepository {

    // check ids
    async validateIds(ids: ICheckIds): Promise<boolean> {
        try {
            const sql = `select id from projects where workspace_id = ? and id = ?;`
            const values = [ids.workspaceId, ids.projectId];
            const [result] = await db.execute<RowDataPacket[]>(sql, values);
            return result.length > 0;

        } catch (error) {
            console.error("failed to check id for ws and project");
            throw error;
        }
    }

    // creates a task in DB 
    async createTask(connection: PoolConnection, task: ICreateTasks): Promise<boolean> {
        try {
            const sql = `insert into project_tasks(id, project_id, depends_on_task_id, task_name, description, status_id, priority_level, estimated_hours, start_date, due_at, completed_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
            const values = [
                task.id, 
                task.projectId, 
                task.dependsOnTaskId == "" ? null: task.dependsOnTaskId, 
                task.taskName, 
                task.description ?? null, 
                task.statusId, 
                task.priorityLevel ?? "Medium", 
                task.estimatedHours ?? null,
                task.startDate ?? null,
                task.dueAt ?? null, 
                task.completedAt ?? null
            ];
            const [result] = await connection.query<ResultSetHeader>(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("failed to create task");
            throw error;
        }
    }

    // create attachements in DB
    async createAttachment(connection: PoolConnection, files: ICreateAttachments[]): Promise<boolean> {
        try {
            const sql = `insert into task_files(id, task_id, uploaded_by, file_name, file_path, file_size, mime_type) values ?;`
            const values = files.map(file => [
                file.id, 
                file.taskId,
                file.uploadedBy, 
                file.fileName,
                file.filePath,
                file.fileSize,
                file.mimeType
            ]); 
            const [result] = await connection.query<ResultSetHeader>(sql, [values]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("failed to add file in DB!");
            throw error;
        }
    } 

    // create assignee in DB
    async createAssignee(connection: PoolConnection, taskId: string, assignees: string[]): Promise<boolean> {
        try {
            if(assignees.length == 0) {
                return true;
            }

            // query
            const sql = `insert into task_members(task_id, user_id) values ?;`

            // values
            const values = assignees.map(userId => [
                taskId, userId
            ])
            const [result] = await connection.query<ResultSetHeader>(sql, [values]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("failed to add file in DB!");
            throw error;
        }
    } 

    async getTaskMembers(taskId:string): Promise<RowDataPacket[]>{
        try {
            const sql = `select u.id, u.username, u.email_id from users u inner join task_members tm on tm.user_id = u.id where tm.task_id=?;`;
                const [result]= await db.execute<RowDataPacket[]>(sql,[taskId]);
            return result;
        } catch (error) {
            console.error("Unable to fetch task members");
            throw error;
        }
    }

    // subtask

    // get status id from status table using project ID
    async getStatusId (connection: PoolConnection, projectId: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select id from allowed_task_statuses where project_id = ? order by created_at desc limit 1;`
            const [result] = await connection.execute<RowDataPacket[]>(sql, [projectId]);
            return result;
        } catch (error) {
            console.error("failed to retrieve status!");
            throw error;
        }
    }

    // update task
    async updateTask (taskObj: IUpdateTasks): Promise<boolean> {
        try {
            const sql = `
                update project_tasks 
                set task_name = ?, description = ?, priority_level = ?, estimated_hours = ?, start_date = ?, status_id = ?, due_at = ?, completed_at = ? 
                where id = ?;`
            const values = [
                taskObj.taskName, 
                taskObj.description ?? null,
                taskObj.priorityLevel,
                taskObj.estimatedHours ?? null,
                taskObj.startDate,
                taskObj.statusId,
                taskObj.dueAt ?? null,
                taskObj.completedAt ?? null,
                taskObj.id
            ];
            console.log("the bvaljasdfh: ",values)
            const [result] = await db.query<ResultSetHeader>(sql, values);
            console.log(result)
            return result.affectedRows > 0;
        } catch (error) {
            console.error("failed to update the task details");
            throw error;
        }
    }

    // delete the old attachments of the task
    async deleteAttachments(files: IDeleteAttachments[]): Promise<Boolean> {
        try {
            const sql = `delete from task_files where id = ? and task_id = ?;`
            // let deleted = false;
            for(const file of files) {
                await db.query<ResultSetHeader>(sql, [file.id, file.taskId]);
            }
            return true;
        } catch (error) {
            console.error("failed to update the task details");
            throw error;
        }
    }

    // delete assignees
    async deleteAssignees(taskId: string): Promise<Boolean> {
        try {
            const sql = `delete from task_members where task_id = ?;`
            await db.query<ResultSetHeader>(sql, [taskId]);
            return  true;
        } catch (error) {
            console.error("failed to update the task details");
            throw error;
        }
    }

    // get project details
    async getProjectDetails (projectId: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select * from projects where id = ?`;
            const [result] = await db.execute<RowDataPacket[]>(sql, [projectId]);
            return result;
        } catch (error) {
            console.error("failed to fetch project details from DB!");
            throw error;
        }
    } 
    // get status details
    async getTasks (projectId: string):Promise<RowDataPacket[]> {
        try {
            const sql = `
                select t.id, t.task_name, t.priority_level, t.estimated_hours, t.created_at, t.start_date, t.completed_at, t.due_at, s.status_text from project_tasks t 
                join allowed_task_statuses s 
                on t.status_id = s.id
                where t.project_id = ? and t.is_deleted = 0 and t.parent_id IS NULL 
                order by t.created_at desc`;
            const [rows] = await db.execute<RowDataPacket[]>(sql, [projectId]);
            return rows
        } catch (error) {
            console.error("failed to fetch tasks details from DB!");
            throw error;
        }
    } 

    // get status id from status table using project ID
    async getStatuses (projectId: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select * from allowed_task_statuses where project_id = ? order by created_at desc;`
            const [result] = await db.execute<RowDataPacket[]>(sql, [projectId]);
            return result;
        } catch (error) {
            console.error("failed to retrieve status!");
            throw error;
        }
    }

    // get assignees from project members using project id
    async getAssignees(projectId: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select u.id, u.username, u.email_id from project_members p join users u on p.user_id = u.id where p.project_id = ?;`
            const [result] = await db.execute<RowDataPacket[]>(sql, [projectId]);
            return result;
        } catch (error) {
            console.error("failed to retrieve assignees!");
            throw error;
        }
    }
    // get assignees from project members using project id
    async getDependencyTasks(projectId: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select id, task_name from project_tasks where project_id = ?;`
            const [result] = await db.execute<RowDataPacket[]>(sql, [projectId]);
            return result;
        } catch (error) {
            console.error("failed to retrieve assignees!");
            throw error;
        }
    }

    // get assignees from project members using task id
    async getAssigneesForTask(taskId: string): Promise<RowDataPacket[]> {
        try {
            const sql = `select u.id, u.username, u.email_id from task_members t join users u on t.user_id = u.id where t.task_id = ?;`
            const [result] = await db.execute<RowDataPacket[]>(sql, [taskId]);
            return result;
        } catch (error) {
            console.error("failed to retrieve assignees!");
            throw error;
        }
    }

    // get task details
    async getTask(taskId: string) {
        try {
            const sql = ` select t.*, s.status_text from project_tasks t 
                join allowed_task_statuses s 
                on t.status_id = s.id
                where t.id = ?`
            const [result] = await db.execute<RowDataPacket[]>(sql, [taskId]);
            return result.map(task => mapTask(task));
        } catch (error) {
            console.error("failed to retrieve task details!");
            throw error;
        }
    }

    // get task attachments
    async getTaskAttachments(taskId: string) {
        try {
            const sql = `select * from task_files where task_id = ?;`
            const [result] = await db.execute<RowDataPacket[]>(sql, [taskId]);
            return result.map(attachment => mapAttachment(attachment));
        } catch (error) {
            console.error("failed to retrieve attachments for task!");
            throw error;
        }
    }

    // delete the task
    async deleteTask(taskId: string): Promise<boolean> {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const sql = `
                WITH RECURSIVE task_tree AS (

                    -- Parent task
                    SELECT id
                    FROM project_tasks
                    WHERE id = ?

                    UNION ALL

                    SELECT pt.id
                    FROM project_tasks pt
                    INNER JOIN task_tree tt
                        ON pt.parent_id = tt.id

                )

                UPDATE project_tasks
                SET 
                    is_deleted = 1,
                    updated_at = NOW()
                WHERE id IN (
                    SELECT id 
                    FROM task_tree
                );
            `
            const [result] = await connection.execute<ResultSetHeader>(sql, [taskId]);
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            console.error("failed to delete task");
            return false;
        }
    }
    
    async getSubtasks(taskId: string) {
        try {
            const sql = `
                SELECT 
                    t.*, 
                    s.status_text 
                FROM project_tasks t 
                JOIN allowed_task_statuses s 
                    ON t.status_id = s.id
                WHERE 
                    t.parent_id = ?
                    AND t.parent_id IS NOT NULL
                    AND t.is_deleted = 0
                ORDER BY t.created_at DESC;
            ` 
            const [result] = await db.execute<RowDataPacket[]>(sql, [taskId]);
            return result.map(subtask => mapTask(subtask)); 
        } catch (error) {
            console.error("failed to fetch subtasks");
            return null;
        }
    }
    
    // get the max status level 
    async getMaxStatusLevel(taskId: string) {
        try {
            const sql =`select s.id from project_tasks t join allowed_task_statuses s on t.project_id = s.project_id where t.id = ? order by s.status_level desc limit 1;`
            const [result] = await db.execute<RowDataPacket[]>(sql, [taskId]);
            return result;
        } catch (error) {
            console.error("failed to fetch max status level");
            return null;
        }
    }
}   