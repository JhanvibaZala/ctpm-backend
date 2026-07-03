import {Router} from "express";
import {creatProject, deleteProject, getProjectByworkspaceId, getProjectForEdit, updateProject} from "../controller/project.controller";
import { getInviteTeamMember } from "../controller/teamMember.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
const router = Router({ mergeParams: true });


router.post("/creatProject", checkProjectPermission("CREATE_PROJECT"),creatProject);
router.get("/getinvitemember",getInviteTeamMember)
router.delete("/:projectId/delete",checkProjectPermission("DELETE_PROJECT"),deleteProject)
router.get("/",checkProjectPermission("VIEW_PUBLIC_PROJECTS"),    getProjectByworkspaceId)
router.get("/:projectId/getProject",checkProjectPermission("EDIT_PROJECT"),getProjectForEdit)
router.post("/:projectId/update",checkProjectPermission("EDIT_PROJECT"),updateProject)

export default router;                                                  
   


