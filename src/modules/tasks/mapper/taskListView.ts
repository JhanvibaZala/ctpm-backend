import { RowDataPacket } from "mysql2";
import { TaskListItem } from "../interfaces/taskList.interface";

export function mapTaskList(row: RowDataPacket): TaskListItem {
    return {
        id: row.id,
        taskName: row.task_name,
        priorityLevel: row.priority_level,
        estimatedHours: row.estimated_hours,
        createdAt: row.created_at,
        startDate: row.start_date,
        completedAt: row.completed_at,
        dueAt: row.due_at,
        statusText: row.status_text,
    };
}

export function mapTasksList(rows: RowDataPacket[]): TaskListItem[] {
    return rows.map(mapTaskList);
}