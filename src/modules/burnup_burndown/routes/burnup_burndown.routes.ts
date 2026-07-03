import { Router } from "express";
import { generateCharts, getPage } from "../controller/burnup_burndown.controller";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
const router = Router({mergeParams:true});


// GET /projects/:projectId/burnup-burndown
// router.get('/', getPage)
router.get("/",checkProjectPermission("VIEW_MY_PROJECT"), generateCharts);

export default router;