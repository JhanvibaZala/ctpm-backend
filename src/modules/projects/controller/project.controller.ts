import {  Response } from "express";
import { ProjectService } from "../services/project.service";
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const { workspaceId } = req.params;
    if (typeof workspaceId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID"
      })
    }
    const service = new ProjectService();
    const result = await service.fetchAllProjectsInWorkspace(
      workspaceId,
      page,
      limit,
    );
    console.log(result)
    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: result.projects,
      page: result.page,
      limit: result.limit,
      totalProjects: result.total,
      totalPages: result.totalPages,
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
      .json({ success: false, message: "Internal server error" });
  }
}

// update project 
export async function handleUpdateProject(req: AuthRequest, res: Response) {
   try {
    const userId = req.user.id;
    const {projectId, workspaceId} = req.params;
    if (typeof workspaceId != "string") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid workspace ID"
      });
    }
    if (typeof projectId != "string") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid project ID"
      });
    }

    const dto = req.body as CreateProjectDto;
    
    const service = new ProjectService();
    const isUpdated = await service.updateProject(workspaceId, projectId, dto);
    if(!isUpdated.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to update project"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Updated succcessfully"
    })
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server Error"
      })
  }
}

// get all my projects 
export async function getMyProjects(req: AuthRequest, res:Response) {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const projectService = new ProjectService();
    const projects = await projectService.getMyProjectDetails(
      userId,
      limit,
      page
    );
    console.log(projects)
    return res.status(200).json({
      success: true,
      message: "Fetched user projects successfully",
      data: projects
    })
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
  
}