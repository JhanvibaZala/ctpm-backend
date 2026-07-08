import { Request, Response } from "express";
// import { Request } from "../../../common/interfaces/Request.interface";
import {
  Iproject,
  IProjectTaskStatus,
} from "../interfaces/project_obj.interface";
import { ProjectService } from "../services/project.service";
import { LoginService } from "../../auth/services/login.service";
import { projectRepository } from "../repository/project.repository";
import { insertProjectAllowedTasksStatus } from "../repository/project.task.repository";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";
import { CreateProjectDto } from "../dto/createProject.dto";

// create project
export async function createProject(req: AuthRequest, res: Response) {
  try {
    console.log(req.body)
    const dto = req.body as CreateProjectDto;
    const service = new ProjectService();
    const { workspaceId } = req.params;
    if (typeof workspaceId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID"
      })
    }

    if (!dto.projectLeadId) {
      return res.status(400).json({
        success: false,
        message: "Project lead is required"
      });
    }
    const result = await service.createProject(workspaceId, dto, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      projectId: result.projectId,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
// get members for create modal
export async function fetchMembersInWorkspace(req: AuthRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    if (typeof workspaceId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID"
      })
    }
    const service = new ProjectService();
    const result = await service.fetchWorkspaceMembers(workspaceId);
    return res.status(201).json({
      success: true,
      message: "Members fetched successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// get all projects via workspace id 
export async function getAllProjects(req: AuthRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    if (typeof workspaceId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID"
      })
    }
    const service = new ProjectService();
    const result = await service.fetchAllProjectsInWorkspace(workspaceId);
    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// get project details
export async function getProjectDetails(
  req: AuthRequest,
  res: Response
) {
  try {
    const { workspaceId, projectId } = req.params;
    if (typeof workspaceId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID"
      })
    }
    if (typeof projectId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      })
    }

    const service = new ProjectService();

    const project = await service.getProjectDetails(
      workspaceId,
      projectId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// delete project controller
export async function handleDeleteProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.user.id;
    const {projectId} = req.params;
    console.log(userId, projectId);
    if (typeof projectId != "string")
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid project ID"
        });

    const service = new ProjectService();
    const isDeleted = await service.deleteProject(projectId);
    if(!isDeleted.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete project"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Deleted successfully"
    })
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: "something went wrong project is not deleted" });
  }
}


// NOT MINE =>

export async function getUserByProjectId(req: AuthRequest, res: Response) {
  try {
    const projectSer = new ProjectService();

    const project_id = req.params.project_id as string;

    const users = await projectSer.getUserByProjectId(project_id);
    console.log(users);

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
}

export async function getProjectByUserId(req: AuthRequest, res: Response) {
  try {
    const projectSer = new ProjectService();

    const user_id = req.user.id;

    const projects = await projectSer.getPorjectByUserId(user_id);
    console.log(projects);

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
}

export async function getProjectForEdit(req: AuthRequest, res: Response) {
  try {
    console.log("getproject");
    const user_id = req.user.id;
    const project_id = req.params.projectId?.toLocaleString();
    console.log(user_id, project_id);
    if (!user_id || !project_id)
      return res
        .status(401)
        .json({ msg: "something went wrong user data not provided" });

    const projectRepo = new projectRepository();
    const projectServ = new ProjectService();
    const [projectManager] =
      await projectRepo.SelectProjectManagerByProjectId(project_id);
    // console.log(projectManager)
    // if(userRole?.role_name != "Project Manager" || userRole?.role_name != "Workspace Admin") return res.send("according to your role you are not eligible to delete project")
    const isValidRole = await projectServ.checkUserRoleForProject(
      user_id,
      project_id,
      ["Project Manage", "Workspace Admin"],
    );
    if (isValidRole) {
      const result = await projectRepo.getProjectById(project_id);
      // console.log(result)
      return res.status(200).json({ projectData: result, projectManager });
    } else {
      return res
        .status(400)
        .json({ msg: "your role is not eligible to edit project" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: "something went wrong project is not deleted" });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    console.log("getproject");
    const user_id = req.user.id;
    const project_id = req.params.projectId?.toLocaleString();
    const workspace_id = req.params.workspaceId;
    console.log(user_id, project_id);
    if (!user_id || !project_id)
      return res
        .status(401)
        .json({ msg: "something went wrong user data not provided" });

    const projectRepo = new projectRepository();
    const projectServ = new ProjectService();
    const authSer = new LoginService();

    // if(userRole?.role_name != "Project Manager" || userRole?.role_name != "Workspace Admin") return res.send("according to your role you are not eligible to delete project")
    const isValidRole = await projectServ.checkUserRoleForProject(
      user_id,
      project_id,
      ["Project Manage", "Workspace Admin"],
    );
    if (isValidRole) {
      const project = req.body as Iproject;
      project.project_id = project_id;
      const result = await projectRepo.updateProjectByProjectId(project);
      const deleteMemberResult =
        await projectRepo.deleteProjectMembers(project_id);
      console.log("delete members", deleteMemberResult);
      const deleteAllowedTaskResult =
        await projectRepo.deleteAllowedTaskStatuses(project_id);
      console.log("delete tasks", deleteAllowedTaskResult);

      //insert project memebers and allowed task statues
      const teamMembers = req.body.team_members[1]
        ? JSON.parse(req.body.team_members[1])
        : "";
      console.log("team members : ", teamMembers);
      const taskStatus = req.body.task_statuses
        ? JSON.parse(req.body.task_statuses)
        : "";
      console.log("task status : ", taskStatus);
      const projectLeadEmail = req.body.projectLeadEmail;

      const [projectLead]: any = await authSer.getUserByEmail(projectLeadEmail);
      console.log("project lead : ", projectLead);
      if (!projectLead || !projectLead[0].id)
        return res.send("project lead email is invalid");
      const projectLead_id = projectLead[0].id;

      const addprojectLead = await projectServ.insertProjectManager(
        project_id,
        projectLead_id,
      );

      for (let i = 0; i < teamMembers.length; i++) {
        console.log(teamMembers[i]);
        if (teamMembers[i] == undefined) {
          continue;
        }
        console.log(teamMembers[i]);
        const addprojectMember = await projectServ.insertProjectMember(
          project_id,
          teamMembers[i],
        );
      }

      for (let i = 0; i < taskStatus.length; i++) {
        const status_obj = {
          project_id,
          text: taskStatus[i].text,
          level: taskStatus[i].level,
        };
        const result = await insertProjectAllowedTasksStatus(status_obj);
      }

      // console.log(result)
      return res.redirect(`/api/workspaces/${workspace_id}/dashboard`);
    } else {
      return res
        .status(400)
        .json({ msg: "your role is not eligible to edit project" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: "something went wrong project is not deleted" });
  }
}
