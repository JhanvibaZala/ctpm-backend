export interface CreateProjectDto {
    workspaceId: string;
    name: string;
    description?: string;
    priority: "Low" | "Medium" | "High" | "Urgent";
    visibility: "Public" | "Private";
    deadlineAt?: Date;
    projectLeadId: string;
    memberIds: string[];
    statuses: CreateStatusDto[];
}

export interface CreateStatusDto {
    text: string;
    level: number;
}
