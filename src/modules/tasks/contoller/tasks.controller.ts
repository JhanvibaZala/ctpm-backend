import { Request, Response } from "express";
import { CreateTaskDto } from "../dto/create-task.dto";
import { TaskService } from "../services/tasks.service";
import { CreateAttachmentDto } from "../dto/create-attachments.dto";
// import { Request } from "../../../common/interfaces/Request.interface";
import { ICreateTasks, IUpdateTasks } from "../interfaces/tasks.interface";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";


// get tasks
export const getTasks = async(req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid project id",
      });
    }

    const service = new TaskService();
    const result = await service.getTasks(projectId);
    return res.status(200).json({
      success: true,
      message: "Fetched tasks successfully",
      data: result
    })
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// create task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid project id",
      });
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    const userId = req.user.id;

    const taskObj = req.body as ICreateTasks;

    const taskService = new TaskService();

    // validation
    const validation = await taskService.executeCreateTask(
      taskObj,
      files
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const completedAt =
      req.body.isCompleted
        ? new Date()
        : null;

    const dto: CreateTaskDto = {
      projectId,
      dependsOnTaskId: req.body.dependsOnTaskId,
      taskName: req.body.taskName,
      description: req.body.description,
      priorityLevel: req.body.priorityLevel,
      estimatedHours: req.body.estimatedHours,
      startDate: req.body.startDate,
      dueAt: req.body.dueAt,
      completedAt: completedAt,
    };

    const created = await taskService.createTask(
      dto,
      files,
      userId,
      req.body.assignees
    );

    if (!created) {
      return res.status(500).json({
        success: false,
        message: "Failed to create task",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// statuses
export const getCreateData = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "invalid project id",
      });
    }
    const taskService = new TaskService();
    const data = await taskService.getCreateData(projectId);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "no statuses or assignees found for this project id",
      });
    }
    return res.status(200).json({
      success: true,
      message: "fetched data",
      statuses: data.structuredStatus,
      assignees: data.structuredAssignees,
      dependencyTasks: data.structuredTasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// get assignees
// export const getAssignees = async (req: AuthRequest, res: Response) => {
//   const projectId = req.params.projectId;
//   try {
//     if (typeof projectId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "invalid project id",
//       });
//     }

//     const taskService = new TaskService();
//     const assignees = await taskService.getAssignees(projectId);

//     if (assignees.length == 0) {
//       return res.status(404).json({
//         success: false,
//         message: "no assignees found for this project id",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: assignees,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "internal server error",
//     });
//   }
// };

// get task by task id
export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    // check if project id and workspace id are valid
    const workspaceId = req.params.workspaceId;

    if (typeof workspaceId != "string") {
      res.status(400).json({
        success: false,
        message: "invalid workspace id",
      });
    }

    const projectId = req.params.projectId;
    if (typeof projectId != "string") {
      res.status(400).json({
        success: false,
        message: "invalid project id",
      });
    }

    // check id task id is valid
    const taskId = req.params.taskId;
    if (typeof taskId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid task id in url",
      });
    }

    // call service to fetch data of the task by task id
    const taskService = new TaskService();
    const taskDetails = await taskService.getTaskInfo(taskId);
    console.log(taskDetails)
    if (!taskDetails) {
      return res.status(400).json({
        success: false,
        message: "failed to fetch task",
      });
    }
    return res.status(200).render("tasks/getTask", {
      task: taskDetails.task[0],
      attachments: taskDetails.attachments,
      assignees: taskDetails.assignees,
      workspace_id: workspaceId,
      project_id: projectId,
      subtasks: taskDetails.subtasks,
      taskId,
      form: {},
      errors: [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// export const getEditTask = async (req: AuthRequest, res: Response) => {
//   try {
//     const workspaceId = req.params.workspaceId;
//     if (typeof workspaceId != "string") {
//       res.status(400).json({
//         success: false,
//         message: "invalid workspace id",
//       });
//     }

//     const projectId: any = req.params.projectId;
//     if (typeof projectId != "string") {
//       res.status(400).json({
//         success: false,
//         message: "invalid project id",
//       });
//     }

//     // check id task id is valid
//     const taskId = req.params.taskId;
//     if (typeof taskId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid task id in url",
//       });
//     }

//     const taskService = new TaskService();
//     const editData = await taskService.getEditData(projectId, taskId);
//     return res.status(200).json({
//       message: "Fetched successfully",
//       workspace_id: workspaceId,
//       project_id: projectId,
//       // taskId,
//       // data: {
//       task: editData.task[0],
//       attachments: editData.attachments,
//       statuses: editData.allStatuses,
//       assignees: editData.allAssignees,
//       selectedAssignees: editData.selectedAssignees,
//       // },
//       form: {},
//       errors: [],
//     });
//   } catch (error) {
//     console.error("Error in edit task controller:", error);
//     return res.status(500).json({
//       success: false,
//       message: "internal server error",
//     });
//   }
// };

// export const editTask = async (req: AuthRequest, res: Response) => {
//   try {
//     const {
//       dependsOnTaskId,
//       taskName,
//       description,
//       startDate,
//       dueDate,
//       priorityLevel,
//       statusId,
//       estimatedHours,
//       completed,
//       assignees,
//       deletedFiles,
//     } = req.body;

//     // 1. check type of workspace id
//     const workspaceId = req.params.workspaceId;
//     if (typeof workspaceId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid workspace ID",
//       });
//     }

//     // 2. check type of project Id
//     const projectId = req.params.projectId;
//     if (typeof projectId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid project ID",
//       });
//     }

//     // 3. check type of task Id
//     const taskId = req.params.taskId;
//     if (typeof taskId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid task ID",
//       });
//     }
//     // get data ready
//     const taskData: IUpdateTasks = {
//       id: taskId,
//       taskName: taskName,
//       statusId: statusId,
//       description: description,
//       priorityLevel: priorityLevel,
//       estimatedHours: estimatedHours,
//       startDate: startDate,
//       dueAt: dueDate,
//       completedAt: completed == 'true' ? new Date() : null,
//     };
//     const files = req.files as Express.Multer.File[];

//     const taskService = new TaskService();
//     // 4. validation
//     const isValid = await taskService.executeUpdateTask(taskData, files || []);
//     if (!isValid.success) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: isValid.errors,
//       });
//     }

//     // 5. edit task
//     const userId = req.user.id;
//     const isTaskUpdated = await taskService.updateTask(
//       taskData,
//       files,
//       deletedFiles,
//       assignees,
//       taskId,
//       userId,
//     );
//     if (!isTaskUpdated) {
//       return res.status(400).json({
//         success: false,
//         message: "failed to update details",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "updated",
//     });
//   } catch (error) {
//     console.error("Delete task controller error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId;
    if (typeof taskId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid task id",
      });
    }

    const taskService = new TaskService();
    const deleted = await taskService.deleteTask(taskId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Task not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
