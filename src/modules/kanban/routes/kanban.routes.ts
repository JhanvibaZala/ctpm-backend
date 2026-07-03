"use strict";

import { Router } from "express";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
const router = Router({
    mergeParams: true
});
import { renderBoard, updateTaskStatus } from "../controller/kanban.controller";

// GET  /:workspaceId/projects/:projectId/kanban
router.get("/",checkProjectPermission("VIEW_MY_PROJECT"), renderBoard);
// PATCH /:workspaceId/projects/:projectId/kanban/tasks/:taskId/status
router.patch("/tasks/:taskId/status",checkProjectPermission("MARK_TASK_COMPLETE"), updateTaskStatus);
export default router;

/* ---------------------------------------------------------------
   Mount this router in your main app.js / routes/index.js like:

   const kanbanRoutes = require('./kanban/routes/kanbanRoutes');
   app.use('/:workspaceId/projects/:projectId/kanban', kanbanRoutes);
--------------------------------------------------------------- */

