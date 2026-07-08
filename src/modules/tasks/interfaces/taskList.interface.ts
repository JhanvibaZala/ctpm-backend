export interface TaskListItem {
    id:string;
    taskName: string;
    priorityLevel: "Low" | "Medium" | "High" | "Urgent";
    estimatedHours: number | null;
    createdAt: Date;
    startDate: Date | null;
    completedAt: Date | null;
    dueAt: Date | null;
    statusText: string;
}