import { Request, Response } from "express";
// import { Request } from "../../../common/interfaces/Request.interface";
import {
  Iproject,
  IProjectTaskStatus,
} from "../interfaces/project_obj.interface";
import { projectService } from "../services/project.service";
import { LoginService } from "../../auth/services/login.service";
import { projectRepository } from "../repository/project.repository";
import { insertProjectAllowedTasksStatus } from "../repository/project.task.repository";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";

export async function creatProject(req: AuthRequest, res: Response) {
  try {
    const projectSer = new projectService();
    const authSer = new LoginService();
    const project = req.body as Iproject;
    const user_id = req.user.id;

    const project_id = await projectSer.createProject(project);
    if (project_id == null) {
      return;
    }

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

    const addprojectLead = await projectSer.insertProjectManager(
      project_id,
      projectLead_id,
    );

    for (let i = 0; i < teamMembers.length; i++) {
      console.log(teamMembers[i]);
      if (teamMembers[i] == undefined) {
        continue;
      }
      console.log(teamMembers[i]);
      const addprojectMember = await projectSer.insertProjectMember(
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

    res.redirect(`/api/workspaces/${project.workspace_id}/projects`);
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard/workspaces");
  }
}

export async function getUserByProjectId(req: AuthRequest, res: Response) {
  try {
    const projectSer = new projectService();

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
    const projectSer = new projectService();

    const user_id = req.user.id;

    const projects = await projectSer.getPorjectByUserId(user_id);
    console.log(projects);

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
}

// this controller show project list page
export async function getProjectByworkspaceId(req: AuthRequest, res: Response) {
  try {
    const projectSer = new projectService();

    const workspace_id: string = req.params.workspaceId as string;


    const projectRepo = new projectRepository();
    const projects = await projectRepo.selectProjectByworkspaceId(workspace_id);
    console.log(projects);
    res.render("dashboard/projects_list", { projects, workspace_id });
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
}

// delete project controller

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const user_id = req.user.id;
    const project_id = req.params.projectId?.toLocaleString();
    console.log(user_id, project_id)
    if (!user_id || !project_id)
      return res
        .status(401)
        .json({ msg: "something went wrong user data not provided" });

    const projectRepo = new projectRepository();
    const projectServ = new projectService()

    // if(userRole?.role_name != "Project Manager" || userRole?.role_name != "Workspace Admin") return res.send("according to your role you are not eligible to delete project")
    const isValidRole = await projectServ.checkUserRoleForProject(user_id, project_id, ["Project Manage", "Workspace Admin"])
    if (isValidRole) {
      const result = await projectRepo.deleteProjectByProjectId(project_id);
    } else {
      return res
        .status(400)
        .json({ msg: "your role is not eligible to delete project" });
    }

    return res.status(200).json({ msg: "successfully delete" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: "something went wrong project is not deleted" });
  }
}

export async function getProjectForEdit(req: AuthRequest, res: Response) {
  try {
    console.log("getproject")
    const user_id = req.user.id;
    const project_id = req.params.projectId?.toLocaleString();
    console.log(user_id, project_id)
    if (!user_id || !project_id)
      return res
        .status(401)
        .json({ msg: "something went wrong user data not provided" });

    const projectRepo = new projectRepository();
    const projectServ = new projectService()
    const [projectManager] = await projectRepo.SelectProjectManagerByProjectId(project_id)
    // console.log(projectManager)
    // if(userRole?.role_name != "Project Manager" || userRole?.role_name != "Workspace Admin") return res.send("according to your role you are not eligible to delete project")
    const isValidRole = await projectServ.checkUserRoleForProject(user_id, project_id, ["Project Manage", "Workspace Admin"])
    if (isValidRole) {
      const result = await projectRepo.getProjectById(project_id);
      // console.log(result)
      return res.status(200).json({ projectData: result ,projectManager});
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
    console.log("getproject")
    const user_id = req.user.id;
    const project_id = req.params.projectId?.toLocaleString();
    const workspace_id = req.params.workspaceId;
    console.log(user_id, project_id)
    if (!user_id || !project_id)
      return res
        .status(401)
        .json({ msg: "something went wrong user data not provided" });

    const projectRepo = new projectRepository();
    const projectServ = new projectService()
    const authSer = new LoginService();

    // if(userRole?.role_name != "Project Manager" || userRole?.role_name != "Workspace Admin") return res.send("according to your role you are not eligible to delete project")
    const isValidRole = await projectServ.checkUserRoleForProject(user_id, project_id, ["Project Manage", "Workspace Admin"])
    if (isValidRole) {
      const project = req.body as Iproject
      project.project_id = project_id
      const result = await projectRepo.updateProjectByProjectId(project);
      const deleteMemberResult = await projectRepo.deleteProjectMembers(project_id)
      console.log("delete members",deleteMemberResult)
      const deleteAllowedTaskResult = await projectRepo.deleteAllowedTaskStatuses(project_id)
      console.log("delete tasks",deleteAllowedTaskResult)



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
      return res.redirect(`/api/workspaces/${workspace_id}/dashboard`)
    } else {
      return res
        .status(400)
        .json({ msg: "your role is not eligible to edit project" });
    }
  } catch (err) {
    console.log(err)
    return res
      .status(500)
      .json({ msg: "something went wrong project is not deleted" });
  }
}


