import { success } from "zod";
import { Iproject, IprojectMEmber } from "../interfaces/project_obj.interface";
import { projectRepository } from "../repository/project.repository";
import { expectFailure } from "node:test";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ICreateProject } from "../interfaces/createProject.interface";
import {v4 as uuidv4} from "uuid"
import db from "../../../config/dbconfig";
import { mapProjects } from "../mapper/project.mapper";

export class ProjectService {
  private projectRepo = new projectRepository();

  async createProject(
    workspaceId: string,
    dto: CreateProjectDto,
    creatorId: string
  ) {
    const connection = await db.getConnection();
    try {
      
      await connection.beginTransaction();
      const projectId = uuidv4();
      const project: ICreateProject = {
        id: projectId,
        workspaceId,
        projectName: dto.name,
        priorityLevel: dto.priority,
        visibility: dto.visibility,
        ...(dto.description && {
          description: dto.description,
        }),

        ...(dto.deadlineAt && {
            deadlineAt: dto.deadlineAt,
        }),
      };

      const inserted =await this.projectRepo.insertProject(connection, project);
      if (!inserted) {
        return {
          success: false,
          message: "Unable to create project"
        };
      }

      const leadExists = await this.projectRepo.isWorkspaceMember(
        connection,
        workspaceId,
        dto.projectLeadId
      );
      if (!leadExists) {
        await connection.rollback();
        return {
          success: false,
          message: "Project lead must belong to workspace"
        };
      }

      //  Project Lead
      await this.projectRepo.insertProjectMember(
        connection,
        projectId,
        dto.projectLeadId,
        3
      );

      // Team Member

      for (const memberId of dto.memberIds) {

        if (memberId === dto.projectLeadId)
          continue;
        const exists =
          await this.projectRepo.isWorkspaceMember(
          connection,
            workspaceId,
            memberId
          );
        if (!exists)
          continue;
        await this.projectRepo.insertProjectMember(
          connection,
          projectId,
          memberId,
          4
        );

      }

      // Task Statuses
      const defaults = [
        {
          text: "Todo",
          level: 1
        },
        {
          text: "In Progress",
          level: 2
        },
        {
          text: "Review",
          level: 3
        },
        {
          text: "Done",
          level: 4
        }
      ];

      const statuses = dto.statuses.length > 0
        ? dto.statuses
        : defaults;

      for (const status of statuses) {
        await this.projectRepo.insertAllowedStatus(
          connection,
          projectId,
          status.text,
          status.level
        );
      }
      await connection.commit();
      return {
        success: true,
        projectId
      };
    }

    catch (error) {
      connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // fetch all the workspace members
  async fetchWorkspaceMembers(workspaceId: string) {
    try {
      const result = this.projectRepo.fetchWorkspaceMembers(workspaceId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async fetchAllProjectsInWorkspace(workspaceId: string) {
    try {
      const result = await this.projectRepo.fetchAllProjectsInWorkspace(workspaceId);
      return mapProjects(result);
    } catch (error) {
      throw error;
    }
  }


//   async insertProjectManager(project_id: string, user_id: string) {
//   try {
//     const role_id: number = 3;
//     const project_member_obj: IprojectMEmber = {
//       project_id,
//       user_id,
//       role_id,
//     };

//     const result =
//       await this.projectRepo.insertProjectMember(project_member_obj);
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }
//   async insertProjectMember(project_id: string, user_id: string) {
//   try {
//     const role_id: number = 4;
//     const project_member_obj: IprojectMEmber = {
//       project_id,
//       user_id,
//       role_id,
//     };

//     const result =
//       await this.projectRepo.insertProjectMember(project_member_obj);
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }
  async getUserByProjectId(project_id: string) {
  try {
    const result = await this.projectRepo.selectUSersByProjectId(project_id);
    return [result];

  } catch (error) {
    console.log(error);
    throw error;

  }
}
  async getPorjectByUserId(user_id: string) {
  try {
    const result = await this.projectRepo.selectProjectByuserId(user_id);
    return [result];

  } catch (error) {
    console.log(error);
    throw error;

  }
}
  async getPorjectByWorkspaceId(workspace_id: string) {
  try {
    const result = await this.projectRepo.selectUSersByProjectId(workspace_id);
    return [result];

  } catch (error) {
    console.log(error);
    throw error;

  }
}

  async checkUserRoleForProject(user_id: string, project_id: string, userRoles: string[]) {
  try {
    const projectRepo = new projectRepository()
    const [userRole] = await projectRepo.userRoleForProject(project_id, user_id);
    // console.log(userRole)
    if (userRole?.role_name == "Workspace Admin" ||
      userRole?.role_name == "Project Manager") {
      return true;
    } else {
      return false;
    }

  } catch (error) {
    throw error
  }
}
}
