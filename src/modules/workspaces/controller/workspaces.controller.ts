import { Response } from "express";
import { WorkspacesRepository } from "../repository/workspaces.repository";
import { WorkspaceService } from "../services/workSpace.service";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";
import { CreateWorkspaceDto } from "../dto/workspace.dto";

export async function createWorkspace(req: AuthRequest, res: Response) {
  try {
    // user data
    const userId = req.user.id;
    // workspace object
    const workspaceObj = req.body as CreateWorkspaceDto;
    
    // create workspace by calling service for WS
    const workspaceSer = new WorkspaceService();
    const result = await workspaceSer.createWorkspace(userId, workspaceObj);
    if(!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to create workspace"
      })
    }

    return res.status(201).json({
      success: true,
      message: `${req.body.name} Created`,
      // workspaceId: result.wsId
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }

}

export async function fetchWorkspaces(req: AuthRequest, res: Response) {
  try {
    const userId = req.user.id
    const workspaceService = new WorkspaceService();

    const workspaces = await workspaceService.fetchAllUserWorkspaces(userId);
    console.log(workspaces)
    return res.status(200).json({
      success: true,
      message: "Fetched all the workspaces",
      data: workspaces
    });
  } catch (err) {
    console.error("Error fetching workspaces:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}

export async function handleGenerateInviteCode(req:AuthRequest, res:Response) {
  try {
    const { workspaceId } = req.params;
    if(typeof workspaceId != "string" || workspaceId == undefined) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID"
      })
    }
    const userId = req.user.id;
    const workspaceService = new WorkspaceService();
    const isInviteCodeGenerated = await workspaceService.generateInviteCode(workspaceId, userId);
    if(!isInviteCodeGenerated.success || isInviteCodeGenerated.inviteCode == null) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invite code",
      })
    }
    return res.status(201).json({
      success: true,
      message: "Invite code generated",
      inviteCode: isInviteCodeGenerated.inviteCode
    })
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

export async function joinWorkspace(req: AuthRequest, res: Response) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;
    
    const workspaceService = new WorkspaceService();
    await workspaceService.addWorkspaceMemberViaCode(userId, inviteCode);
    

    return res.status(200).json({
      success: true,
      message: "Joined Workspace successfully!",
    })

  } catch (err) {
    console.error(err);
    if(err instanceof Error) {
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }

}

export async function fetchWorkspaceDetails(req:AuthRequest, res: Response) {
  console.log(" HEloohvgvgh")
  try {
    const {workspaceId} = req.params;
    const userId = req.user.id;

    if(typeof workspaceId != "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace Id"
      })
    }
    const wsService = new WorkspaceService();
    const workspace = await wsService.fetchWorkspaceDetails(workspaceId, userId);
    if(!workspace.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch workspace details"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Fetch Data",
      data: workspace.data,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}


export async function deleteWorkspace(req: AuthRequest, res: Response) {
  try {
    console.log("delete workspace")
    const user_id = req.user.id;
    const workspace_id = req.params.workspaceId?.toLocaleString();
    console.log(user_id, workspace_id)
    if (!user_id || !workspace_id) {
      return res.status(401).json({ msg: "something went wrong user data not provided" });
    }

    const workspaceRepo = new WorkspacesRepository()

    const [result] = await workspaceRepo.checkWorkspaceManagerByUserId(workspace_id, user_id)

    if (result?.role_name == "Workspace Admin") {
      const result = workspaceRepo.deleteWorkspaceByWorkspaceId(workspace_id);
      return res.status(200).json({ msg: "workspace delete successfully" })
    } else {
      return res.status(400).json({ msg: "your are not eligible to delete workspace" })
    }

  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: "something went wrong" })
  }
}

// get team members
export async function getTeamMembers(req: AuthRequest, res: Response) {
  try {
    // get workspace id from params
    const workspaceId = req.params.workspaceId;

    // check ws id
    if (typeof workspaceId != "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid workspace id"
      })
    }
    // call service
    const wsService = new WorkspaceService();
    const teamMembers: any = await wsService.getTeamMembers(workspaceId);
    console.log(teamMembers)
    return res.status(200).render("team/team", { wsMembers: teamMembers.wsMembers, prjMembers: teamMembers.prjMembers, workspace_id: workspaceId });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to get team members"
    })
  }
}

export async function getTeamMemberDetails(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.params.workspaceId;
    const username = req.params.username;

    // Validate workspaceId and username
    if (!workspaceId || !username) {
      return res.status(400).json({ message: "Workspace ID and username are required" });
    }

    if (typeof workspaceId !== "string" || typeof username !== "string") {
      return res.status(400).json({ message: "Invalid Workspace ID or username" });
    }

    const wsService = new WorkspaceService();
    const memberDetails = await wsService.getTeamMemberDetails(workspaceId, username);

    if (!memberDetails) {
      return res.status(404).json({ message: "Member not found in the specified workspace" });
    }
    console.log("Member details fetched successfully:", memberDetails);
    return res.status(200).json({
      success: true,
      member: memberDetails
    });
  } catch (error) {
    console.error("Error fetching team member details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
