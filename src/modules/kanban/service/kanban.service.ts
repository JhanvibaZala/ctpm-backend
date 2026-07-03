"use strict";

import { kanbanRepository } from "../repository/kanban.repository";
import {
  RawDBTask,
  TaskStatus,
  HydratedTask,
  TaskMember,
} from "../interfaces/kanban.interface";

/**
 * Build the full board data structure consumed by the EJS view.
 * Returns: { project, columns: [{ id, status_text, status_level, tasks: [...] }] }
 */
export class kanbanService {
  private kanbanRepo = new kanbanRepository();

  async getBoardData(workspaceId: string, projectId: string) {
    const project = await this.kanbanRepo.getProjectById(
      projectId,
      workspaceId,
    );

    if (!project) {
      const err = new Error("Project not found");
      throw err;
    }

    const [statuses, tasks]: [TaskStatus[], RawDBTask[]] = await Promise.all([
      this.kanbanRepo.getStatusesByProject(projectId),
      this.kanbanRepo.getTasksByProject(projectId),
    ]);

    // Group tasks under their status column
    const taskMap = new Map<string, HydratedTask[]>(
      statuses.map((s) => [s.id, []]),
    );

    for (const task of tasks) {
      // Hydrate assignee arrays from comma-separated GROUP_CONCAT output
      const members: TaskMember[] = task.member_ids
        ? task.member_ids.split(",").map((id, i) => ({
            id,
            name: (task.member_names || "").split(",")[i] || "",
          }))
        : [];

      delete task.member_ids;
      delete task.member_names;

      const statusGroup = taskMap.get(task.status_id);
      if (statusGroup) {
        statusGroup.push(task);
      }
    }

    const columns = statuses.map((s) => ({
      ...s,
      tasks: taskMap.get(s.id) || [],
    }));

    return { project, columns };
  }

  /**
   * Move a task to a new status column.
   * Validates ownership before writing.
   */

  async moveTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    newStatusId: number,
  ) {
    // 1. Confirm project is in workspace
    const project = await this.kanbanRepo.getProjectById(
      projectId,
      workspaceId,
    );
    if (!project) {
      const err = new Error("Project not found");

      throw err;
    }

    // 2. Confirm target status belongs to this project
    const valid = await this.kanbanRepo.verifyStatusBelongsToProject(
      newStatusId,
      projectId,
    );
    if (!valid) {
      const err = new Error("Invalid target status for this project");

      throw err;
    }
    // 3. Determine whether newStatusId is the highest status_level for this project.
  //    Landing on the highest level means the task is "done" -> completed_at = NOW().
  //    Any other level -> completed_at = NULL.
  const maxStatus = await this.kanbanRepo.getMaxLevelStatus(projectId);
  const isMaxLevel = !!maxStatus && Number(maxStatus.id) === Number(newStatusId);

    // 3. Perform update
    const updated = await this.kanbanRepo.updateTaskStatus(
      taskId,
      newStatusId,
      projectId,
      isMaxLevel
    );
    if (!updated) {
      const err = new Error("Task not found or already deleted");

      throw err;
    }

    return { success: true };
  }

  async syncProjectStatus(projectId:string) {
    console.log("this is inside sync pro service")
  const { total, completed } = await this.kanbanRepo.getRootTaskCompletionCounts(projectId);
console.log(total,completed);
  let nextStatus = null;

  if (total === 0) {
    nextStatus = 'Pending';
    

  } else if (completed === total) {
    nextStatus = 'Completed';
  } else {
    // Not all tasks are done — only step down out of 'Completed'.
    const project = await this.kanbanRepo.getProjectStatusOnly(projectId);
    if (project && project.status === 'Completed') {
      nextStatus = 'Pending';
    }
  }
console.log(nextStatus);
  if (nextStatus) {
    await this.kanbanRepo.updateProjectStatus(projectId, nextStatus);
  }

  return nextStatus;
}
}

// module.exports = { getBoardData, moveTask };
