import {Router} from "express";
import {createProject, fetchMembersInWorkspace, getAllProjects,  getProjectDetails, handleDeleteProject, handleUpdateProject } from "../controller/project.controller";
import { authorize } from "../../../middlewares/authorize";
import { PERMISSIONS } from "../../../constants/permissions";
import { loadProjectPermissions } from "../../../middlewares/loadProjectPermissions";
const router = Router({ mergeParams: true });


router.post("/", authorize(PERMISSIONS.CREATE_PROJECT), createProject);
router.get("/", getAllProjects)
router.get("/members", fetchMembersInWorkspace)
router.get("/:projectId", loadProjectPermissions, getProjectDetails);
router.delete("/:projectId", loadProjectPermissions, authorize(PERMISSIONS.DELETE_PROJECT), handleDeleteProject)
router.patch("/:projectId", loadProjectPermissions, authorize(PERMISSIONS.EDIT_PROJECT), handleUpdateProject)


export default router;                                                  
   


