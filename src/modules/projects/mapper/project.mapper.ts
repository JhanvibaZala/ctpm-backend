import { RowDataPacket } from "mysql2";
import { IProject } from "../interfaces/project.interface";

export function mapProject(row: RowDataPacket): IProject {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    priority: row.priority,
    status: row.status,
    visibility: row.visibility,
    deadlineAt: row.deadline_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProjects(rows: RowDataPacket[]): IProject[] {
  return rows.map(mapProject);
}