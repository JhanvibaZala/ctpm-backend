// dto/updateProject.dto.ts

import { CreateStatusDto } from "./createProject.dto";

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  visibility?: "Public" | "Private";
  deadlineAt?: string;
  projectLeadId?: string;
  memberIds?: string[];
  statuses?: CreateStatusDto[];
}