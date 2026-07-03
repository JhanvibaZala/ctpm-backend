import { success } from "zod";
import { Iproject, IprojectMEmber } from "../interfaces/project_obj.interface";
import { projectRepository } from "../repository/project.repository";
import { v4 as uuidv4 } from "uuid";
import { expectFailure } from "node:test";

export class projectService {
  private projectRepo = new projectRepository();

  async createProject(project_obj: Iproject) {
    try {
      const project_id = uuidv4();
      project_obj.project_id = project_id;

      const result = await this.projectRepo.insertProject(project_obj);

      if (result != success) {
        console.error("backend error");
        return null;
      }

      return project_id;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async insertProjectManager(project_id: string, user_id: string) {
    try {
      const role_id: number = 3;
      const project_member_obj: IprojectMEmber = {
        project_id,
        user_id,
        role_id,
      };

      const result =
        await this.projectRepo.insertProjectMember(project_member_obj);
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async insertProjectMember(project_id: string, user_id: string) {
    try {
      const role_id: number = 4;
      const project_member_obj: IprojectMEmber = {
        project_id,
        user_id,
        role_id,
      };

      const result =
        await this.projectRepo.insertProjectMember(project_member_obj);
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
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
