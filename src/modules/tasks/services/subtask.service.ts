import { CreateSubtaskDto } from "../dto/create-subtask.dto";
import { ICreateAttachments } from "../interfaces/attachments.interface";
import { ICreateSubtask } from "../interfaces/subtask.interface";
import { SubtasksRepository } from "../repository/subtask.repository";
import { TasksRepository } from "../repository/tasks.repository";
import { validateAttachments, validateDescription, validateDueDate, validateEstimatedHours, validateStartDate, validateTaskName } from "../validation/validations";
import { v4 as uuid } from "uuid"

export class SubtaskService {
    private subtasksRepo = new SubtasksRepository();
    private tasksRepo = new TasksRepository();

    // get data for statuses and assignees 
    async getDataForSubtask(projectId: string, taskId: string) {
        try {
            // get assignees
            const getAssignees = await this.tasksRepo.getAssigneesForTask(taskId);

            // get statuses
            const getStatuses = await this.tasksRepo.getStatuses(projectId);

            return {
                success: true,
                getAssignees,
                getStatuses
            }
        } catch (error) {
            return { success: false }
        }
    }

    // validate
    async executeCreateSubtask(taskObj: ICreateSubtask, files: any[]) {
        try {
            const errors = [];
            // task name
            const taskName = await validateTaskName(taskObj.taskName || "");
            if (!taskName.isValid) {
                errors.push({ field: "taskName", message: taskName.message });
            }

            // start date
            const startDateString = taskObj.startDate ? new Date(taskObj.startDate).toISOString() : null;
            const startDate = await validateStartDate(startDateString || "");
            console.log(startDateString)
            if (!startDate.isValid) {
                errors.push({ field: "startDate", message: startDate.message });
            }

            // due date
            const dueDateString = taskObj.dueDate ? new Date(taskObj.dueDate).toISOString() : null;
            console.log(dueDateString)
            const dueDate = await validateDueDate(dueDateString || "", startDateString || "");
            if (!dueDate.isValid) {
                errors.push({ field: "dueDate", message: dueDate.message });
            }

            // estimated hours
            const estimatedHours = await validateEstimatedHours(taskObj.estimatedHours || "");
            if (!estimatedHours.isValid) {
                errors.push({ field: "estimatedHours", message: estimatedHours.message });
            }

            // description 
            const description = await validateDescription(taskObj.description || "");
            if (!description.isValid) {
                errors.push({ field: "description", message: description.message });
            }

            // ============= Files validation =============

            // attachments
            const attachments = await validateAttachments(files);
            if (!attachments.isValid) {
                errors.push({ field: "attachments", message: attachments.message });
            }

            // console.log(errors)
            if (errors.length > 0) {
                return { success: false, errors };
            }
            return { success: true };

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // add subtask
    async createSubtask(subtaskDto: CreateSubtaskDto, files: any, userId: string, assignees: string) {
        try {
            // generate uuid
            const subtaskId = uuid();
            console.log("subtaskID: ", subtaskId);

            // make object
            const subtaskObj: ICreateSubtask = {
                id: subtaskId,
                parentId: subtaskDto.parentId,
                projectId: subtaskDto.projectId,
                statusId: subtaskDto.statusId,
                taskName: subtaskDto.taskName,
                completedAt: subtaskDto.completedAt || null,
                
                ...(subtaskDto.dependsOnTaskId && {
                    dependsOnTaskId: subtaskDto.dependsOnTaskId
                }),

                ...(subtaskDto.description && {
                    description: subtaskDto.description
                }),
               ...(subtaskDto.dueDate && {
                    dueDate: subtaskDto.dueDate
                }),
                ...(subtaskDto.estimatedHours !== undefined && {
                    estimatedHours: subtaskDto.estimatedHours
                }),
                ...(subtaskDto.priorityLevel && {
                    priorityLevel: subtaskDto.priorityLevel
                }),
                ...(subtaskDto.startDate && {
                    startDate: subtaskDto.startDate
                }),

            }

            // add task 
            const createTask = await this.subtasksRepo.createSubtask(subtaskObj);
            if (!createTask) {
                return {success: false};
            }

            // add attachments if any
            if (files && files.length > 0) {
                const attachments: ICreateAttachments[] = files.map((file: any) => {
                    return {
                        id: uuid(),
                        taskId: subtaskId,
                        uploadedBy: userId,
                        fileName: file.filename,
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype
                    }
                })
                const isAttached = await this.tasksRepo.createAttachment(attachments);
                if (!isAttached) {
                    return {success: false};
                }
            }

            // add assignees if any
            let assigneeArray: string[] = [];
            if (assignees && assignees.length > 0) {
                assigneeArray = assignees.split(",");
            }
            const assigneeAdded = await this.tasksRepo.createAssignee(subtaskId, assigneeArray);
            if (!assigneeAdded) {
                return {success: false};
            }
            return {success: true};

        } catch (error) {
            return { success: false }
        }
    }
}