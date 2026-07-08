export interface ICreateProject {
    id?: string;
    workspaceId: string;
    projectName: string;
    description?: string;
    priorityLevel: "Low" | "Medium" | "High" | "Urgent";
    status?: "Pending" | "WIP" | "On Hold" | "Completed";
    visibility: "Public" | "Private";
    deadlineAt?: Date;
    createdAt?: Date;
    completedAt?: Date;
    updatedAt?: Date;
}
