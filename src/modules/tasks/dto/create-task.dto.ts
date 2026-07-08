export interface CreateTaskDto {
    projectId: string;
    taskName: string;
    dependsOnTaskId: string;
    description: string;
    priorityLevel: "Low" | "Medium" | "High" | "Urgent";
    estimatedHours: string;
    startDate: Date;
    dueAt: Date;
    completedAt: Date | null;
}