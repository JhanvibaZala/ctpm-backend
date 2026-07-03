import { Router } from "express";
import {
  fetchWorkspaces,
  createWorkspace,
  showTestDashboard,
  joinWorkspace,
  deleteWorkspace,
  getTeamMembers,
  getTeamMemberDetails,
} from "../controller/workspaces.controller";
import { showDashboard } from "../../dashboard/controller/dashboard.controller";
import { getProjectByworkspaceId } from "../../projects/controller/project.controller";

import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
// import {authMiddleware} from "../../../middlewares/auth.middleware";
const router = Router({ mergeParams: true });

router.get("/:workspaceId/dashboard",checkWorkspacePermission("VIEW_TEAM_MEMBER_DASHBOARD"), showDashboard);
router.get("/:workspaceId/projects",checkWorkspacePermission("VIEW_PUBLIC_PROJECTS"), getProjectByworkspaceId);
router.get("/fetchWorkspaces",checkWorkspacePermission("VIEW_CURRENT_WORKSPACE"), fetchWorkspaces);
router.post("/createWorkspace", createWorkspace);
router.get("/test", showTestDashboard);
router.post("/joinWorkspace", joinWorkspace);
router.delete("/delete/:workspaceId",checkWorkspacePermission("DELETE_WORKSPACE"),deleteWorkspace)

// team
router.get("/:workspaceId/team", getTeamMembers);
router.get("/:workspaceId/team/:username", getTeamMemberDetails);
export default router;


