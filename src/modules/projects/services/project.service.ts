import { success } from "zod";
import { Iproject, IprojectMEmber } from "../interfaces/project_obj.interface";
import { projectRepository } from "../repository/project.repository";
import { expectFailure } from "node:test";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ICreateProject } from "../interfaces/createProject.interface";
import { v4 as uuidv4 } from "uuid"
import db from "../../../config/dbconfig";
import { mapMyProjects, mapProjectDetails, mapProjects } from "../mapper/project.mapper";
import { MyProjectsResponse } from "../interfaces/project.interface";
import { UpdateProjectDto } from "../dto/updateProject.dto";

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

      const inserted = await this.projectRepo.insertProject(connection, project);
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

  async fetchAllProjectsInWorkspace(workspaceId: string, page: number, limit: number) {
    try {
      const paginationPages: any = await this.projectRepo.countProjectsInWorkspace(workspaceId);
      const total = paginationPages[0].total;
      const offset = (page - 1) * limit;

      const result = await this.projectRepo.fetchAllProjectsInWorkspace(workspaceId, limit, offset);
      const totalPages = Math.ceil(total / limit);
      return {
        projects: mapProjects(result),
        page,
        limit,
        total,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  // fetch project details
  async getProjectDetails(workspaceId: string, projectId: string) {
    try {
      const project = await this.projectRepo.fetchProject(workspaceId, projectId);

      if (!project) {
        return null;
      }

      const members = await this.projectRepo.fetchProjectMembers(projectId);

      const statuses = await this.projectRepo.fetchAllowedStatuses(projectId);

      return mapProjectDetails(
        project,
        members,
        statuses
      );
    } catch (error) {
      throw error;
    }
  }

  // delete project
  async deleteProject(projectId: string) {
    const connection = await db.getConnection();
    try {
      connection.beginTransaction();
      await this.projectRepo.deleteAllowedTaskStatuses(
        connection,
        projectId
      );

      await this.projectRepo.deleteProjectMembers(
        connection,
        projectId
      );

      const deleted =
        await this.projectRepo.deleteProjectByProjectId(
          connection,
          projectId
        );

      if (!deleted) {
        await connection.rollback();

        return {
          success: false,
          message: "Project not found",
        };
      }

      await connection.commit();

      return {
        success: true,
        message: "Project deleted successfully",
      };
    } catch (error) {
      await connection.rollback()
      throw error;
    } finally {
      connection.release();
    }
  }

  // update project via projevct id
  async updateProject(
    workspaceId: string,
    projectId: string,
    dto: UpdateProjectDto
) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
        // Check project exists
        const exists = await this.projectRepo.projectExists(
            connection,
            workspaceId,
            projectId
        );

        if (!exists) {
            await connection.rollback();
            return {
                success: false,
                message: "Project not found",
            };
        }

        // Update project
        const updated = await this.projectRepo.updateProject(
            connection,
            projectId,
            dto
        );

        if (!updated) {
            await connection.rollback();
            return {
                success: false,
                message: "Unable to update project",
            };
        }

        // Validate project lead
        if(dto.projectLeadId) {

          const leadExists = await this.projectRepo.isWorkspaceMember(
            connection,
            workspaceId,
            dto.projectLeadId
          );
          if (!leadExists) {
              await connection.rollback();
  
              return {
                  success: false,
                  message: "Project lead must belong to workspace",
              };
          }
        }

        // Insert members
        if (dto.memberIds !== undefined && dto.projectLeadId !== undefined) {
          // Delete old members
          await this.projectRepo.deleteProjectMembers(
              connection,
              projectId
          );
          // Insert project lead
          await this.projectRepo.insertProjectMember(
              connection,
              projectId,
              dto.projectLeadId,
              3
          );
          
          for (const memberId of dto.memberIds) {
            
            if (memberId === dto.projectLeadId)
              continue;
            
            const exists = await this.projectRepo.isWorkspaceMember(
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
        }

        
        // Insert new statuses
        if(dto.statuses) {
          // Delete old statuses
          await this.projectRepo.deleteAllowedTaskStatuses(
              connection,
              projectId
          );
          for (const status of dto.statuses) {
  
              await this.projectRepo.insertAllowedStatus(
                  connection,
                  projectId,
                  status.text,
                  status.level
              );
          }
        }

        await connection.commit();

        return {
            success: true,
            message: "Project updated successfully",
        };

    } catch (error) {

        await connection.rollback();
        throw error;

    } finally {

        connection.release();

    }
  }
  // get my projects
  async getMyProjectDetails(userId: string, limit: number, page: number): Promise<MyProjectsResponse> {
    try {

      console.log("fgsvf")
      const result: any = await this.projectRepo.getMyProjectsCount(userId);
      const totalProjects = result[0].totalProjects;
      const offset = (page - 1) * limit;
      const projects = await this.projectRepo.getMyProjects(userId, limit, offset);
      
      return {
        projects: mapMyProjects(projects),
        page,
        limit,
        hasMore: offset + projects.length < totalProjects
      }
    } catch (error) {
      throw error;
    }
  }

}
