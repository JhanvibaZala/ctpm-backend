export interface IProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: string;
  visibility: "Private" | "Public";
  deadlineAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}