import {Router} from "express";
import {createProject, fetchMembersInWorkspace, getAllProjects,  getProjectDetails, handleDeleteProject, handleUpdateProject } from "../controller/project.controller";
import { authorize } from "../../../middlewares/authorize";
import { PERMISSIONS } from "../../../constants/permissions";
const router = Router({ mergeParams: true });


router.post("/", authorize(PERMISSIONS.CREATE_PROJECT), createProject);
router.get("/", getAllProjects)
router.get("/members", fetchMembersInWorkspace)
router.get("/:projectId", getProjectDetails);
router.delete("/:projectId", authorize(PERMISSIONS.DELETE_PROJECT), handleDeleteProject)
router.patch("/:projectId", authorize(PERMISSIONS.EDIT_PROJECT), handleUpdateProject)


export default router;                                                  
   


