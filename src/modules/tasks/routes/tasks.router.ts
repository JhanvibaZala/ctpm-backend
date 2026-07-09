import { Router } from "express";
import { createTask,  deleteTask,  getCreateData, getTasks } from "../contoller/tasks.controller";
import { upload } from "../../../middlewares/multer.middleware";
import { handleMulterError } from "../../../middlewares/handleMulterError";
import { addSubtask, getDataForSubtasks } from "../contoller/subtask.controller";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";

const router = Router({
    mergeParams: true
});

// tasks
router.get("/", getTasks);
router.post("/", upload.array("attachments", 10), handleMulterError, createTask);
router.get("/get-data", getCreateData)
router.delete("/:taskId", deleteTask);
// router.get("/statuses/get",checkProjectPermission("VIEW_PUBLIC_PROJECTS"), getStatuses);
// router.get("/members",checkProjectPermission("INVITE_TEAM_MEMBER_IN_PROJECT"), getAssignees);
// router.get("/:taskId",checkProjectPermission("VIEW_PUBLIC_PROJECTS") ,getTask);
// router.get("/:taskId/edit-data",checkProjectPermission("EDIT_TASK"), getEditTask);
// router.patch("/:taskId", upload.array("attachments", 10),checkProjectPermission("EDIT_TASK"), handleMulterError, editTask);


// subtasks
router.post("/:taskId/subtasks", upload.array("attachments", 10),checkProjectPermission("CREATE_TASK"), handleMulterError, addSubtask)
router.get("/:taskId/get-data",checkProjectPermission("VIEW_PUBLIC_PROJECTS"), getDataForSubtasks)

export default router;




