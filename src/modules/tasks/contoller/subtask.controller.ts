import { Request, Response } from "express";
import { SubtaskService } from "../services/subtask.service";
import { CreateSubtaskDto } from "../dto/create-subtask.dto";
import { CreateAttachmentDto } from "../dto/create-attachments.dto";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";

// create subtasks
export const addSubtask = async (req: AuthRequest, res: Response) => {
  try {
    // 1. get all data from body
    const {
        dependsOnTaskId,
        taskName,
        assignees,
        description,
        statuses,
        priorityLevel,
        estimatedHours,
        startDate,
        dueDate,
        isCompleted,
    } = req.body;
    
    // 2. validate the ids for workspace, project and the task 
    const workspaceId = req.params.workspaceId;
    if(typeof workspaceId !== "string") {
       return res.status(400).json({
            success: false,
            message: "invalid workspace id"
        })  
    }
    const projectId = req.params.projectId;
    if(typeof projectId !== "string") {
        return res.status(400).json({
            success: false,
            message: "invalid project id"
        })
    }

    const taskId = req.params.taskId;
    if(typeof taskId !== "string") {
        return res.status(400).json({
            success: false,
            message: "invalid task id"
        })
    }
    // format data
    const subtaskObj: CreateSubtaskDto = {
        statusId: statuses,
        taskName: taskName,
        parentId: taskId,
        projectId: projectId,
        completedAt: isCompleted === "on" ||isCompleted === "true" ? new Date() : null,
        dependsOnTaskId: dependsOnTaskId || null,
        description: description || "",
        dueDate: dueDate,
        startDate: startDate,
        estimatedHours: estimatedHours,
        priorityLevel: priorityLevel
    } 
    
    const files = req.files as Express.Multer.File[] || [];
    console.log(subtaskObj)
    console.log(files)
    console.log(assignees)
    
    // 3. validate the form
    const subtaskService = new SubtaskService();
    const validate = await subtaskService.executeCreateSubtask(req.body, files)
    
    if(!validate.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validate.errors
        })
    }
    

    // get currently logged in user id
    const userId = req.user.id;

    // 4. add the details for subtasks
    const isCreated = await subtaskService.createSubtask(subtaskObj, files, userId, assignees);
    
    if(!isCreated.success) {
        return res.status(400).json({
            success: false,
            message: "Failed to create subtask, Please try again later."
        })
    }
    
    return res.status(200).json({
        success: true,
        message: "Subtask added successfully"
    })

  } catch (error) {
    console.error("add subtask controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export const getDataForSubtasks = async(req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId;
        if(typeof projectId !== "string") {
            return res.status(400).json({
                success: false,
                message: "invalid project id"
            })
        }

        const taskId = req.params.taskId;
        if(typeof taskId !== "string") {
            return res.status(400).json({
                success: false,
                message: "invalid task id"
            })
        }
        
        // get data from the service
        const taskService = new SubtaskService();
        const data = await taskService.getDataForSubtask(projectId, taskId);
        if(!data.success) {
            return res.status(400).json({
                success: false,
                message: "failed to fetch details"
            })
        }
        return res.status(200).json({
            assignees : data.getAssignees,
            statuses: data.getStatuses
        })
    } catch (error) {
    console.error("add subtask controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}