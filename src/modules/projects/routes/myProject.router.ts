import {Router} from "express";
import { getMyProjects } from "../controller/project.controller";
const router = Router({ mergeParams: true });

router.get("/", getMyProjects)

export default router;                                                  
   


