"use strict";
import db from "../../../config/dbconfig";
import { RowDataPacket } from "mysql2/promise";
import { RawDBTask, TaskStatus } from "../interfaces/kanban.interface";

/**
 * kanbanRepository.js
 * Raw DB queries for the Kanban board.
 * Depends on a `db` pool/promise wrapper passed in (mysql2/promise).
 */

export class kanbanRepository {
  async getStatusesByProject(projectId: string): Promise<TaskStatus[]> {
    const [rows] = await db.query(
      `SELECT id, status_text, status_level
     FROM allowed_task_statuses
     WHERE project_id = ?
     ORDER BY status_level ASC`,
      [projectId],
    );
    return rows as TaskStatus[];
  }

  /**
   * Fetch all non-deleted tasks for a project with their status info.
   *
   */
  async getTasksByProject(projectId: string): Promise<RawDBTask[]> {
    const [rows] = await db.query(
      `SELECT
        pt.id,
        pt.task_name,
        pt.description,
        pt.status_id,
        pt.priority_level,
        pt.due_at,
        pt.estimated_hours,
        pt.created_at,
        pt.parent_id,
        ats.status_text,
        ats.status_level,
        GROUP_CONCAT(DISTINCT u.id ORDER BY u.id SEPARATOR ',')         AS member_ids,
        GROUP_CONCAT(DISTINCT u.username ORDER BY u.id SEPARATOR ',')  AS member_names
     FROM project_tasks pt
     JOIN allowed_task_statuses ats ON ats.id = pt.status_id
     LEFT JOIN task_members tm ON tm.task_id = pt.id
     LEFT JOIN users u          ON u.id = tm.user_id
     WHERE pt.project_id = ?
       AND pt.is_deleted  = 0 
       AND pt.parent_id  IS NULL
        GROUP BY pt.id
     ORDER BY ats.status_level ASC, pt.created_at ASC`,
      [projectId],
    );
    return rows as RawDBTask[];
  }

  /**
 * Update the status of a single task.
 * Returns true when exactly one row was affected.
 
//  *    - safety guard: only update tasks in this project
 */
  async updateTaskStatus(
    taskId: string,
    newStatusId: number,
    projectId: string,
    isMaxLevel: Boolean,
  ) {
    const [result] = await db.query(
      `UPDATE project_tasks
     SET status_id  = ?,
     completed_at = ${isMaxLevel ? "NOW()" : "NULL"},
         updated_at = NOW()
     WHERE id         = ?
       AND project_id = ?
       AND is_deleted = 0`,
      [newStatusId, taskId, projectId],
    );
    // return result.affectedRows === 1;
    return result;
  }

  // Get the highest status_level for a project, and the status id that owns it.
  //  * Used to determine whether a task move means "completed".

  async getMaxLevelStatus(projectId: String) {
    const [rows]: any = await db.query(
      `SELECT id, status_level
     FROM allowed_task_statuses
     WHERE project_id = ?
     ORDER BY status_level DESC
     LIMIT 1`,
      [projectId],
    );
    return rows[0] || null;
  }
  /**
 * Verify that a status belongs to the given project (prevents cross-project moves).
 
 */
  async verifyStatusBelongsToProject(statusId: number, projectId: string) {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id FROM allowed_task_statuses
     WHERE id = ? AND project_id = ?`,
      [statusId, projectId],
    );
    return rows.length === 1;
    // return rows;
  }

  // Check completion state of all ROOT tasks (parent_id IS NULL, not deleted) in a project.
  //  * Returns counts needed to decide the project's overall status.
  async getRootTaskCompletionCounts(projectId: string) {
    const [rows]: any = await db.query(
      `SELECT
        COUNT(*)                                         AS total,
        SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed
     FROM project_tasks
     WHERE project_id = ?
       AND is_deleted  = 0
       AND parent_id  IS NULL`,
      [projectId],
    );
    const row = rows[0] || { total: 0, completed: 0 };
    return { total: Number(row.total), completed: Number(row.completed) };
  }

  /**
 * Lightweight fetch of just a project's current status (used by status-sync logic
 * to decide whether a 'Completed' -> 'Pending' downgrade is appropriate).

 */
  async getProjectStatusOnly(projectId: string) {
    const [rows]: any = await db.query(
      `SELECT status FROM projects WHERE id = ?`,
      [projectId],
    );
    return rows[0] || null;
  }

  /**
   * Update a project's status column directly (used by the status-sync middleware).
   * Also sets projects.completed_at to NOW() when transitioning to 'Completed',
   * and clears it back to NULL otherwise (mirrors projects.completed_at semantics).
   */
  async updateProjectStatus(projectId: string, newStatus: string) {
    const [result]: any = await db.query(
      `UPDATE projects
     SET status       = ?,
         completed_at = CASE WHEN ? = 'Completed' THEN NOW() ELSE NULL END,
         updated_at   = NOW()
     WHERE id = ?`,
      [newStatus, newStatus, projectId],
    );
    return result.affectedRows === 1;
  }

  /**
   * Fetch a single project (for page title / meta).
   */
  async getProjectById(projectId: string, workspaceId: string) {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, project_name, description, priority_level, status, deadline_at
     FROM projects
     WHERE id = ? AND workspace_id = ?`,
      [projectId, workspaceId],
    );
    return rows[0] || null;
  }
}

// module.exports = {
//   getStatusesByProject,
//   getTasksByProject,
//   updateTaskStatus,
//   verifyStatusBelongsToProject,
//   getProjectById,
// };
