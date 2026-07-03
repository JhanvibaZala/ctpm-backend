import { RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig"; // adjust to your DB connection

export interface Project {
    id: string;
    project_name: string;
    created_at: Date;
    deadline_at: Date | null;
    priority_level:string;
}

export interface TaskCompletionRow extends RowDataPacket {
    date: string;
    completed_count: number;
}

export class BurnupBurndownRepository {

    async getProjectById(projectId: string): Promise<Project | null> {
        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT id, project_name, created_at, deadline_at,priority_level 
       FROM projects
       WHERE id = ?`,
            [projectId]
        );
        if (!rows.length) return null;
        const r = rows[0];

        if (!r) {
            throw new Error("zero rows returned")
        }

        return {
            id: r.id,
            priority_level:r.priority_level,
            project_name: r.project_name,
            created_at: new Date(r.created_at),
            deadline_at: r.deadline_at ? new Date(r.deadline_at) : null,
        };
    }

    async getTotalTasks(projectId: string): Promise<number> {
        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) AS total
       FROM project_tasks
       WHERE project_id = ? AND is_deleted = 0`,
            [projectId]
        );
        // mysql2 returns COUNT as string — always coerce to Number
        return Number(rows[0]?.total ?? 0);
    }

    async getCompletedTasksByDate(projectId: string): Promise<TaskCompletionRow[]> {
        const [rows] = await db.execute<TaskCompletionRow[]>(
            `SELECT
  DATE_FORMAT(completed_at, '%Y-%m-%d') AS date,
  COUNT(*) AS completed_count
FROM project_tasks
WHERE project_id = ?
  AND completed_at IS NOT NULL
  AND is_deleted = 0
GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
ORDER BY date ASC`,
            [projectId]
        );
        return rows;
    }

    // burnup_burndown.repository.ts
    async getEarliestTaskDate(projectId: string): Promise<Date | null> {
        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT DATE(MIN(start_date)) AS earliest
     FROM project_tasks
     WHERE project_id = ? AND is_deleted = 0`,
            [projectId]
        );
        return rows[0]?.earliest ? new Date(rows[0].earliest) : null;
    }
}