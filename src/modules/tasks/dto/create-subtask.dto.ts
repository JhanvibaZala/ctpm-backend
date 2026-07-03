export interface CreateSubtaskDto {
    taskName: string;
    statusId: number;
    projectId: string;
    parentId: string;
    dependsOnTaskId?: string;
    description?:string;
    priorityLevel?: "Low" | "Medium" | "High" | "Urgent";
    estimatedHours?: string;
    startDate?: Date;
    dueDate?: Date;
    completedAt?: Date | null;
}