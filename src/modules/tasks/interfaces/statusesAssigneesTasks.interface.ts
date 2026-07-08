export interface Statuses {
    id: string;
    projectId: string;
    statusText: string;
    statusLevel: number;
    createdAt: Date;
}
export interface Assignees {
    id: string;
    username: string;
    email: string; 
}
export interface DependencyTasks {
    id: string;
    name: string;
}