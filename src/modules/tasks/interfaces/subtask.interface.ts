export interface ISubtask {
    id: string;
    projectId: string;
    parentId: string;
    dependsOnTaskId?: string;
    taskName: string;
    description: string;
    statusId: number;
    priorityLevel: string;
    estimatedHours: number;
    createdAt: Date;
    startDate: Date;
    dueAt: Date;
    completedAt: Date;
    updatedAt: Date;
    statusText: string
}

export interface ICreateSubtask {
    id: string;
    parentId: string;
    projectId: string;
    taskName: string;
    statusId: number;
    dependsOnTaskId?: string;
    description?:string;
    priorityLevel?: "Low" | "Medium" | "High" | "Urgent";
    estimatedHours?: string;
    startDate?: Date;
    dueDate?: Date;
    completedAt?: Date | null;
}