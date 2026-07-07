import { Router } from "express";
import {
  fetchWorkspaces,
  createWorkspace,
  joinWorkspace,
  // deleteWorkspace,
  // getTeamMembers,
  // getTeamMemberDetails,
  handleGenerateInviteCode,
} from "../controller/workspaces.controller";
// import { showDashboard } from "../../dashboard/controller/dashboard.controller";
// import { getProjectByworkspaceId } from "../../projects/controller/project.controller";

import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
const router = Router({ mergeParams: true });

// router.get("/:workspaceId/dashboard",checkWorkspacePermission("VIEW_TEAM_MEMBER_DASHBOARD"), showDashboard);
// router.get("/:workspaceId/projects",checkWorkspacePermission("VIEW_PUBLIC_PROJECTS"), getProjectByworkspaceId);
router.post("/join-workspace", joinWorkspace);
router.get("/", fetchWorkspaces);
router.post("/", createWorkspace);

// invite members
router.post("/:workspaceId/invite", handleGenerateInviteCode);
// router.delete("/delete/:workspaceId",checkWorkspacePermission("DELETE_WORKSPACE"),deleteWorkspace)

// team
// router.get("/:workspaceId/team", getTeamMembers);
// router.get("/:workspaceId/team/:username", getTeamMemberDetails);
export default router;


