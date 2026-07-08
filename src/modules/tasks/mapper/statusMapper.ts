import { RowDataPacket } from "mysql2";
import { Assignees, DependencyTasks, Statuses } from "../interfaces/statusesAssigneesTasks.interface";

// Statuses
export function mapStatuses(rows: RowDataPacket[]): Statuses[] {
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    statusText: row.status_text,
    statusLevel: row.status_level,
    createdAt: row.created_at,
  }));
}

// Assignees
export function mapAssignees(rows: RowDataPacket[]): Assignees[] {
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email_id,
  }));
}

// Dependency Tasks
export function mapDependencyTasks(
  rows: RowDataPacket[]
): DependencyTasks[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.task_name,
  }));
}