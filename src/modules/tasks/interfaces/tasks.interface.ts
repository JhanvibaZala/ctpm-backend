export interface ITask {
    id: string,
    projectId: string,
    parentId?: string,
    dependsOnTaskId?: string,
    taskName: string,
    description: string,
    statusId: number,
    priorityLevel: string,
    estimatedHours: number,
    createdAt: Date,
    startDate: Date,
    dueAt: Date,
    completedAt: Date,
    updatedAt: Date,
    statusText: string
}

export interface ICreateTasks {
    id: string,
    projectId: string,
    taskName: string,
    statusId: number,
    dependsOnTaskId?: string;
    description?:string;
    priorityLevel?: "Low" | "Medium" | "High" | "Urgent";
    estimatedHours?: string;
    startDate?: Date;
    dueAt?: Date;
    completedAt?: Date | null;
}


export interface IAddComments {
    id:string;
    taskId:string;
    userId:string;
    commentText:string;
    isDeleted?:number;
    editedAt?: Date;
    createdAt?: Date;
    dependsOnTaskId?: string,
    description?:string,
    priorityLevel?: "Low" | "Medium" | "High" | "Urgent",
    estimatedHours?: string,
    startDate?: Date,
    dueAt?: Date,
    completedAt?: Date,
}

export interface IUpdateTasks {
    id: string,
    taskName: string,
    statusId: number,
    dependsOnTaskId?: string,
    description?: string,
    priorityLevel?: "Low" | "Medium" | "High" | "Urgent",
    estimatedHours?: string,
    startDate?: Date,
    dueAt?: Date,
    completedAt?: Date | null,
}