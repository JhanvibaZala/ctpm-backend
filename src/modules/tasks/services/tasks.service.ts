import { v4 as uuidv4 } from "uuid";
import { ICreateTasks, IUpdateTasks } from "../interfaces/tasks.interface";
import { TasksRepository } from "../repository/tasks.repository";
import { CreateTaskDto } from "../dto/create-task.dto";
import { ICreateAttachments, IDeleteAttachments } from "../interfaces/attachments.interface";
import { Express } from "express";
import { validateAttachments, validateDescription, validateDueDate, validateEstimatedHours, validateStartDate, validateTaskName } from "../validation/validations";
import db from "../../../config/dbconfig";
import { mapAssignees, mapStatuses } from "../mapper/statusMapper";
import { mapTasksList } from "../mapper/taskListView";

export class TaskService {
    private tasksRepo = new TasksRepository();
    // create task in db
    async createTask(
    taskDto: CreateTaskDto,
    files: Express.Multer.File[],
    userId: string,
    assignees: string[]
): Promise<boolean> {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        // fetch default status
        const statusRows = await this.tasksRepo.getStatusId(
            connection,
            taskDto.projectId
        );

        if (statusRows.length === 0) {
            await connection.rollback();
            return false;
        }

        const statusId = statusRows[0].id;

        const taskId = uuidv4();

        const task: ICreateTasks = {
            id: taskId,
            projectId: taskDto.projectId,
            dependsOnTaskId: taskDto.dependsOnTaskId ?? null,
            taskName: taskDto.taskName,
            description: taskDto.description ?? null,
            statusId,
            priorityLevel: taskDto.priorityLevel ?? "Medium",
            estimatedHours: taskDto.estimatedHours ?? null,
            startDate: taskDto.startDate ?? null,
            dueAt: taskDto.dueAt ?? null,
            completedAt: taskDto.completedAt ?? null,
        };

        // Create Task
        const taskCreated = await this.tasksRepo.createTask(
            connection,
            task
        );

        if (!taskCreated) {
            await connection.rollback();
            return false;
        }

        // Attachments
        if (files.length > 0) {

            const attachments: ICreateAttachments[] = files.map(file => ({
                id: uuidv4(),
                taskId,
                uploadedBy: userId,
                fileName: file.filename,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
            }));

            const attached = await this.tasksRepo.createAttachment(
                connection,
                attachments
            );

            if (!attached) {
                await connection.rollback();
                return false;
            }
        }

        // Assignees


        const assigneeInserted =
            await this.tasksRepo.createAssignee(
                connection,
                taskId,
                assignees
            );

        if (!assigneeInserted) {
            await connection.rollback();
            return false;
        }

        await connection.commit();

        return true;

    } catch (error) {

        await connection.rollback();
        throw error;

    } finally {

        connection.release();

    }
}

    // get status text
    async getCreateData(projectId: string) {
        try {
            const statuses = await this.tasksRepo.getStatuses(projectId);
            const assignees = await this.tasksRepo.getAssignees(projectId);
            const tasks = await this.tasksRepo.getDependencyTasks(projectId);
            const structuredStatus = mapStatuses(statuses);
            const structuredAssignees = mapAssignees(assignees);
            const structuredTasks = mapAssignees(tasks);
            return {
                structuredAssignees,
                structuredStatus,
                structuredTasks
            }
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }

    // validate
    async executeCreateTask(taskObj: ICreateTasks, files: any[]) {
        try {
            const errors = [];
            // task name
            const taskName = await validateTaskName(taskObj.taskName || "");
            if (!taskName.isValid) {
                errors.push({ field: "taskName", message: taskName.message });
            }

            // start date
            const startDateString = taskObj.startDate ? new Date(taskObj.startDate).toISOString() : "";
            const startDate = await validateStartDate(startDateString || "");
            if (!startDate.isValid) {
                errors.push({ field: "startDate", message: startDate.message });
            }

            // due date
            const dueDateString = taskObj.dueAt ? new Date(taskObj.dueAt).toISOString() : "";
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


    // get all tasks
    async getTasks (projectId: string) {
        try {
            const tasks = await this.tasksRepo.getTasks(projectId);
            return mapTasksList(tasks);
        } catch (error) {
            throw error;
        }
    }

    // get assignees
    // async getAssignees(projectId: string) {
    //     try {
    //         const getAssignees = await this.tasksRepo.getAssignees(projectId);
    //         return getAssignees;
    //     } catch (error) {
    //         console.error("error in task service!");
    //         throw error;
    //     }
    // }

    // show task
    async getTaskInfo(taskId: string) {
        try {
            const task = await this.tasksRepo.getTask(taskId);
            if (!task) {
                throw new Error("Task not found")
            }
            const attachments = await this.tasksRepo.getTaskAttachments(taskId);
            const assignees = await this.tasksRepo.getAssigneesForTask(taskId);
            const subtasks = await this.tasksRepo.getSubtasks(taskId);
            return {
                task,
                attachments,
                assignees,
                subtasks
            }
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }

    // // delete task - soft delete
    // async deleteTask(taskId: string): Promise<boolean> {
    //     try {
    //         const deleted = await this.tasksRepo.deleteTask(taskId);
    //         return deleted;
    //     } catch(error){
    //         console.error("Error in delete task service:", error);
    //         throw error;
    //     }
    // }

    // // get edit data for task
    // async getEditData(projectId: string, taskId: string) {
    //     try {
    //         const allStatuses = await this.tasksRepo.getStatuses(projectId);
    //         const allAssignees = await this.tasksRepo.getAssignees(projectId);
    //         const selectedAssignees = await this.tasksRepo.getTaskMembers(taskId);

    //         const task = await this.tasksRepo.getTask(taskId);
    //         if(!task) {
    //             throw new Error("Task not found")
    //         }
    //         const attachments = await this.tasksRepo.getTaskAttachments(taskId);
    //         return {
    //             task,
    //             attachments,
    //             allStatuses,
    //             allAssignees,
    //             selectedAssignees
    //         }
    //     } catch (error) {
    //         console.error("error in task service!");
    //         throw error;
    //     }
    // }

    // // edit task details
    // async updateTask(task: IUpdateTasks, addFiles:  Express.Multer.File[], deletedFiles: string, assignees: string, taskId: string, userId: string): Promise<boolean> {
    //     try {
    //         // find max id for status and then complete the task accordingly
    //         const maxStatus = await this.tasksRepo.getMaxStatusLevel(task.id);
    //         const maxStatusId = (maxStatus as any)[0].id;
    //         maxStatusId == task.statusId ? task.completedAt = new Date() : null;

    //         // if checkbox checked then set status level to max too
    //         if(task.completedAt != null) {
    //             task.statusId = maxStatusId;
    //         }

    //         // 1. edit task details 
    //         const isTaskUpdated = await this.tasksRepo.updateTask(task);
    //         if(!isTaskUpdated) return false;

    //         // 2. delete the old files by id
    //         let attachmentsToDelete: IDeleteAttachments[] = [];
    //         if(deletedFiles && deletedFiles.trim() !== "") {
    //             attachmentsToDelete = deletedFiles.split(",").map((id: string) => ({
    //                 id,
    //                 taskId
    //             }));
    //             const isAttachmentsDeleted = await this.tasksRepo.deleteAttachments(attachmentsToDelete);
    //             if(!isAttachmentsDeleted) return false;
    //         }

    //         // 3. add the new files
    //         if(addFiles && addFiles.length > 0) {
    //             const attachments: ICreateAttachments[] = addFiles.map((file) => {
    //                 return {
    //                     id: uuidv4(),
    //                     taskId: taskId,
    //                     uploadedBy: userId,
    //                     fileName: file.filename,
    //                     filePath: file.path,
    //                     fileSize: file.size,
    //                     mimeType: file.mimetype
    //                 }
    //             })
    //             const isAttachmentsAdded = await this.tasksRepo.createAttachment(attachments);
    //             if(!isAttachmentsAdded) return false;
    //         }

    //         // 4. delete task members or assignees
    //         const isAssigneesDeleted = await this.tasksRepo.deleteAssignees(task.id);

    //         if(!isAssigneesDeleted) return false;


    //         // 5. add task members or assignees
    //         let assigneeArray: string[] = [];
    //         if(assignees && assignees.length > 0) {
    //             assigneeArray = assignees.split(",");
    //         }
    //         const isAssigneesAdded = await this.tasksRepo.createAssignee(task.id, assigneeArray);
    //         if(!isAssigneesAdded) return false;

    //         return true;
    //     } catch (error) {
    //         console.error("error in task service edit");
    //         throw error;
    //     }
    // }

    // // validate
    // async executeUpdateTask(taskObj: IUpdateTasks, files: any[]) {
    //     try {
    //         const errors = [];
    //         // task name
    //         const taskName = await validateTaskName(taskObj.taskName || "");
    //         if (!taskName.isValid) {
    //             errors.push({ field: "taskName", message: taskName.message });
    //         }

    //         // start date
    //         // const startDateString = taskObj.startDate ? new Date(taskObj.startDate).toISOString() : "";
    //         // const startDate = await validateStartDate(startDateString || "");
    //         // if(!startDate.isValid) {
    //         //     errors.push({field: "startDate", message: startDate.message});
    //         // }

    //         // due date
    //         // const dueDateString = taskObj.dueAt ? new Date(taskObj.dueAt).toISOString() : "";
    //         // const dueDate = await validateDueDate(dueDateString || "", startDateString || "");
    //         // if(!dueDate.isValid) {
    //         //     errors.push({field: "dueDate", message: dueDate.message});
    //         // }

    //         // estimated hours
    //         const estimatedHours = await validateEstimatedHours(taskObj.estimatedHours || "");
    //         if(!estimatedHours.isValid) {
    //             errors.push({field: "estimatedHours", message: estimatedHours.message});
    //         }

    //         // description 
    //         const description = await validateDescription(taskObj.description || "");
    //         if(!description.isValid) {
    //             errors.push({field: "description", message: description.message});
    //         }

    //         // ============= Files validation =============

    //         // attachments
    //         const attachments = await validateAttachments(files);
    //         if(!attachments.isValid) {
    //             errors.push({field: "attachments", message: attachments.message});
    //         }
    //         // console.log(errors)
    //         if(errors.length > 0) {
    //             return {success: false, errors};
    //         }
    //         return {success: true};

    //     } catch (error) {
    //         console.error(error);
    //         throw error;
    //     }
    // }

}