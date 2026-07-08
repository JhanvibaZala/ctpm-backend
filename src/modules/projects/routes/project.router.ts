import {Router} from "express";
import {createProject, fetchMembersInWorkspace, getAllProjects,  getProjectDetails,  getProjectForEdit, handleDeleteProject, updateProject} from "../controller/project.controller";
import { getInviteTeamMember } from "../controller/teamMember.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
const router = Router({ mergeParams: true });


router.post("/", createProject);
router.get("/", getAllProjects)
router.get("/members", fetchMembersInWorkspace)
router.get("/:projectId", getProjectDetails);
router.delete("/:projectId", handleDeleteProject)


// NOT MINE =>
router.get("/getinvitemember",getInviteTeamMember)
// router.get("/",checkProjectPermission("VIEW_PUBLIC_PROJECTS"),    getProjectByworkspaceId)
router.get("/:projectId/getProject",checkProjectPermission("EDIT_PROJECT"),getProjectForEdit)
router.post("/:projectId/update",checkProjectPermission("EDIT_PROJECT"),updateProject)

export default router;                                                  
   


