import { Router } from "express";
import { showGanttChart, showGanttPage } from "../controller/gantt.controller";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
const router = Router({ mergeParams: true });

// router.get('/', showGanttPage)
router.get("/",checkProjectPermission("VIEW_MY_PROJECT"), showGanttChart);

export default router;
