



import express from "express";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";
import {
  showCalendar,
  // getTasksAPI,
  // getTaskById,
} from "../controller/calendar.controller";

const router = express.Router({ mergeParams: true });

router.get("/",checkProjectPermission("VIEW_MY_PROJECT"), showCalendar);

// router.get("/tasks", getTasksAPI);

// router.get("/tasks/:id", getTaskById);



export default router;