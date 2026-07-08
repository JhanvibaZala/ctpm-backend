import { RowDataPacket } from "mysql2";
import { IProject, ProjectDetailsResponse } from "../interfaces/project.interface";

export function mapProject(row: RowDataPacket): IProject {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.project_name,
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

export function mapProjectDetails(
  projectRows: RowDataPacket[],
  members: RowDataPacket[],
  statuses: RowDataPacket[]
): ProjectDetailsResponse {
  const project = projectRows[0];
  if (!project) {
    throw new Error("Project not found");
  }
  return {
    project: {
      id: project.id,
      workspaceId: project.workspace_id,
      name: project.project_name,
      description: project.description,
      priority: project.priority_level,
      status: project.status,
      visibility: project.visibility,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      deadlineAt: project.deadline_at,
      completedAt: project.completed_at,
    },

    members: members.map(member => ({
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      username: member.username,
      email: member.email_id,
      role: member.role_name,
      joinedAt: member.joined_at,
    })),

    statuses: statuses
      .map(status => ({
        id: status.id,
        text: status.status_text,
        level: status.status_level,
      }))
      .sort((a, b) => a.level - b.level),
  };
}