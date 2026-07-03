import { v4 as uuidv4 } from "uuid";
import { ICreateTasks, IUpdateTasks } from "../interfaces/tasks.interface";
import { TasksRepository } from "../repository/tasks.repository";
import { CreateTaskDto } from "../dto/create-task.dto";
import { ICreateAttachments, IDeleteAttachments } from "../interfaces/attachments.interface";
import { Express } from "express";
import { validateAttachments, validateDescription, validateDueDate, validateEstimatedHours, validateStartDate, validateTaskName } from "../validation/validations";

export class TaskService {
    private tasksRepo = new TasksRepository();
    // create task in db
    async createTask(taskDto: CreateTaskDto, files: Express.Multer.File[], userId: string, assignees: string): Promise<boolean> {
        try {
            // get status id from project id
            const getStatusRow: any = await this.tasksRepo.getStatusId(taskDto.projectId);
            const statusId = getStatusRow[0].id;

            // make uuid
            const taskId = uuidv4();
            const obj: ICreateTasks = {
                id: taskId,
                projectId: taskDto.projectId,
                dependsOnTaskId: taskDto.dependsOnTaskId,
                taskName: taskDto.taskName,
                description: taskDto.description,
                statusId: statusId,
                priorityLevel: taskDto.priorityLevel,
                estimatedHours: taskDto.estimatedHours,
                startDate: taskDto.startDate,
                dueAt: taskDto.dueAt,
                completedAt: taskDto.completedAt
            }

            // add task 
            const createTask = await this.tasksRepo.createTask(obj);
            if(!createTask) {
                return false;
            }
            
            // add attachments if any
            if(files && files.length > 0) {
                const attachments: ICreateAttachments[] = files.map((file) => {
                    return {
                        id: uuidv4(),
                        taskId: taskId,
                        uploadedBy: userId,
                        fileName: file.filename,
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype
                    }
                })
                const isAttached = await this.tasksRepo.createAttachment(attachments);    
                if(!isAttached) {
                    return false;
                }
            }

            // add assignees if any
            let assigneeArray: string[] = [];
            if(assignees && assignees.length > 0) {
                assigneeArray = assignees.split(",");
            }
            const assigneeAdded = await this.tasksRepo.createAssignee(taskId, assigneeArray);
            if(!assigneeAdded) {
                return false;
            }
            return true;
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }

    // get project details
    async getProject(projectId: string) {
        try {
            const project = await this.tasksRepo.getProjectDetails(projectId);
            return project;
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }
    
    // get status details
    async getTaskDetails(projectId: string) {
        try {
            const getTaskDetails = await this.tasksRepo.getTasks(projectId);
            return getTaskDetails;
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }

    // get status text
    async getStatuses(projectId: string) {
        try {
            const getStatuses = await this.tasksRepo.getStatuses(projectId);
            return getStatuses;
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
            if(!startDate.isValid) {
                errors.push({field: "startDate", message: startDate.message});
            }
            
            // due date
            const dueDateString = taskObj.dueAt ? new Date(taskObj.dueAt).toISOString() : "";
            const dueDate = await validateDueDate(startDateString || "", dueDateString || "");
            if(!dueDate.isValid) {
                errors.push({field: "dueDate", message: dueDate.message});
            }

            // estimated hours
            const estimatedHours = await validateEstimatedHours(taskObj.estimatedHours || "");
            if(!estimatedHours.isValid) {
                errors.push({field: "estimatedHours", message: estimatedHours.message});
            }

            // description 
            const description = await validateDescription(taskObj.description || "");
            if(!description.isValid) {
                errors.push({field: "description", message: description.message});
            }

            // ============= Files validation =============
            
            // attachments
            const attachments = await validateAttachments(files);
            if(!attachments.isValid) {
                errors.push({field: "attachments", message: attachments.message});
            }
            // console.log(errors)
            if(errors.length > 0) {
                return {success: false, errors};
            }
            return {success: true};

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // get assignees
    async getAssignees(projectId: string) {
        try {
            const getAssignees = await this.tasksRepo.getAssignees(projectId);
            return getAssignees;
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }

    // show task
    async getTaskInfo(taskId: string) {
        try {
            const task = await this.tasksRepo.getTask(taskId);
            if(!task) {
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

    // delete task - soft delete
    async deleteTask(taskId: string): Promise<boolean> {
        try {
            const deleted = await this.tasksRepo.deleteTask(taskId);
            return deleted;
        } catch(error){
            console.error("Error in delete task service:", error);
            throw error;
        }
    }

    // get edit data for task
    async getEditData(projectId: string, taskId: string) {
        try {
            const allStatuses = await this.tasksRepo.getStatuses(projectId);
            const allAssignees = await this.tasksRepo.getAssignees(projectId);
            const selectedAssignees = await this.tasksRepo.getTaskMembers(taskId);

            const task = await this.tasksRepo.getTask(taskId);
            if(!task) {
                throw new Error("Task not found")
            }
            const attachments = await this.tasksRepo.getTaskAttachments(taskId);
            return {
                task,
                attachments,
                allStatuses,
                allAssignees,
                selectedAssignees
            }
        } catch (error) {
            console.error("error in task service!");
            throw error;
        }
    }

    // edit task details
    async updateTask(task: IUpdateTasks, addFiles:  Express.Multer.File[], deletedFiles: string, assignees: string, taskId: string, userId: string): Promise<boolean> {
        try {

            // find max id for status and then complete the task accordingly
            const maxStatus = await this.tasksRepo.getMaxStatusLevel(task.id);
            const maxStatusId = (maxStatus as any)[0].id;
            maxStatusId == task.statusId ? task.completedAt = new Date() : null;

            // if checkbox checked then set status level to max too
            if(task.completedAt != null) {
                task.statusId = maxStatusId;
            }

            // 1. edit task details 
            const isTaskUpdated = await this.tasksRepo.updateTask(task);
            if(!isTaskUpdated) return false;
            
            // 2. delete the old files by id
            let attachmentsToDelete: IDeleteAttachments[] = [];
            if(deletedFiles && deletedFiles.trim() !== "") {
                attachmentsToDelete = deletedFiles.split(",").map((id: string) => ({
                    id,
                    taskId
                }));
                const isAttachmentsDeleted = await this.tasksRepo.deleteAttachments(attachmentsToDelete);
                if(!isAttachmentsDeleted) return false;
            }
            
            // 3. add the new files
            if(addFiles && addFiles.length > 0) {
                const attachments: ICreateAttachments[] = addFiles.map((file) => {
                    return {
                        id: uuidv4(),
                        taskId: taskId,
                        uploadedBy: userId,
                        fileName: file.filename,
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype
                    }
                })
                const isAttachmentsAdded = await this.tasksRepo.createAttachment(attachments);
                if(!isAttachmentsAdded) return false;
            }
            
            // 4. delete task members or assignees
            const isAssigneesDeleted = await this.tasksRepo.deleteAssignees(task.id);

            if(!isAssigneesDeleted) return false;
            
            
            // 5. add task members or assignees
            let assigneeArray: string[] = [];
            if(assignees && assignees.length > 0) {
                assigneeArray = assignees.split(",");
            }
            const isAssigneesAdded = await this.tasksRepo.createAssignee(task.id, assigneeArray);
            if(!isAssigneesAdded) return false;
            
            return true;
        } catch (error) {
            console.error("error in task service edit");
            throw error;
        }
    }

    // validate
    async executeUpdateTask(taskObj: IUpdateTasks, files: any[]) {
        try {
            const errors = [];
            // task name
            const taskName = await validateTaskName(taskObj.taskName || "");
            if (!taskName.isValid) {
                errors.push({ field: "taskName", message: taskName.message });
            }

            // start date
            // const startDateString = taskObj.startDate ? new Date(taskObj.startDate).toISOString() : "";
            // const startDate = await validateStartDate(startDateString || "");
            // if(!startDate.isValid) {
            //     errors.push({field: "startDate", message: startDate.message});
            // }
            
            // due date
            // const dueDateString = taskObj.dueAt ? new Date(taskObj.dueAt).toISOString() : "";
            // const dueDate = await validateDueDate(dueDateString || "", startDateString || "");
            // if(!dueDate.isValid) {
            //     errors.push({field: "dueDate", message: dueDate.message});
            // }

            // estimated hours
            const estimatedHours = await validateEstimatedHours(taskObj.estimatedHours || "");
            if(!estimatedHours.isValid) {
                errors.push({field: "estimatedHours", message: estimatedHours.message});
            }

            // description 
            const description = await validateDescription(taskObj.description || "");
            if(!description.isValid) {
                errors.push({field: "description", message: description.message});
            }

            // ============= Files validation =============
            
            // attachments
            const attachments = await validateAttachments(files);
            if(!attachments.isValid) {
                errors.push({field: "attachments", message: attachments.message});
            }
            // console.log(errors)
            if(errors.length > 0) {
                return {success: false, errors};
            }
            return {success: true};

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

}