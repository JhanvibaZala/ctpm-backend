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

export interface ProjectMemberResponse {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  joinedAt: Date;
}

export interface AllowedStatusResponse {
  id: number;
  text: string;
  level: number;
}

export interface ProjectDetailsResponse {
  
  project: Project,
  members: ProjectMemberResponse[];
  statuses: AllowedStatusResponse[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Pending" | "WIP" | "On Hold" | "Completed";
  visibility: "Public" | "Private";
  createdAt: Date;
  updatedAt: Date | null;
  deadlineAt: Date | null;
  completedAt: Date | null;
}


// my project details
export interface MyProjectsDetailsResponse {  
  id: string;
  workspaceId: string;
  role: string;
  projectName: string;
  priorityLevel: string;
  status: string;
  visibility: string;
  createdAt: Date;
  deadline: Date;
}

export interface MyProjectsArray {
  projects: MyProjectsDetailsResponse[];
}

export interface MyProjectsResponse {
  projects: MyProjectsDetailsResponse[];
  page: number;
  limit: number;
  hasMore: boolean;
}