import {Router} from "express";
import {createProject, fetchMembersInWorkspace, getAllProjects,  getProjectDetails, handleDeleteProject } from "../controller/project.controller";
const router = Router({ mergeParams: true });


router.post("/", createProject);
router.get("/", getAllProjects)
router.get("/members", fetchMembersInWorkspace)
router.get("/:projectId", getProjectDetails);
router.delete("/:projectId", handleDeleteProject)


export default router;                                                  
   


