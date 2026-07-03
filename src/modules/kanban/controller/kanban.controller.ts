"use strict";

import { kanbanService } from "../service/kanban.service";
import { Request, Response } from "express";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";

/**
 * GET /:workspaceId/projects/:projectId/kanban
 * Renders the Kanban board EJS view.
 */
export async function renderBoard(req: AuthRequest, res: Response) {
  try {
    const { workspaceId, projectId }: any = req.params;

    //  const workspaceId = "2d34c7a8-2b3d-4da7-90f6-47fc4b40678f";
    // const  projectId  = "550e8400-e29b-41d4-a716-446655440000";

    const kanbanSer = new kanbanService();
    // const db = req.app.locals.db; // mysql2 promise pool attached at app startup

    const boardData = await kanbanSer.getBoardData(workspaceId, projectId);
   
    if (res.locals.syncedProjectStatus) {
      boardData.project.status = res.locals.syncedProjectStatus;
    }

    return res.render("kanban/board", {
      title: `${boardData.project.project_name} — Kanban`,
      workspace_id: workspaceId,
      project_id: projectId,
      project: boardData.project,
      columns: boardData.columns,
      user: req.user,
    });
  } catch (err) {
    // if (err) return res.status(404).send("errors/404");
    console.error("[kanbanController.renderBoard]", err);
    return res.status(500).render("errors/500");
  }
}

/**
 * PATCH /:workspaceId/projects/:projectId/kanban/tasks/:taskId/status
 * Body: { statusId: number }
 * JSON API — called by the drag-and-drop frontend.
 */
export async function updateTaskStatus(req: AuthRequest, res: Response) {
  try {
  
    const { workspaceId, projectId, taskId }: any = req.params;

    const { statusId } = req.body;
    console.log(statusId);
    const kanbanSer = new kanbanService();

    if (!statusId || isNaN(Number(statusId))) {
      return res
        .status(400)
        .json({ error: "statusId is required and must be a number" });
    }
    // Sync the project's overall status now that the task's completed_at has changed
    
    const result = await kanbanSer.moveTask(
      workspaceId,
      projectId,
      taskId,
      Number(statusId),
    );
    const syncedProjectStatus = await kanbanSer.syncProjectStatus(projectId);

    return res.json(result);
  } catch (err) {
    if (err) return res.status(400).json({ error: err });
    if (err) return res.status(404).json({ error: err });
    console.error("[kanbanController.updateTaskStatus]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
// http://localhost:4000/07b81525-e1c9-43e7-b496-bb548a37062e/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/kanban
