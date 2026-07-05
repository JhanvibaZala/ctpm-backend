import { Response } from "express";
import { WorkspacesRepository } from "../repository/workspaces.repository";
import { workspaceService } from "../services/workSpace.service";
import { Iworkspace } from "../interfaces/workspace_obj.interface";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";

export async function createWorkspace(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    const workspace_obj = req.body as Iworkspace;
    const workspaceSer = new workspaceService();
    const result = await workspaceSer.createWorkspace(workspace_obj);
    const insertId: string = result;
    const roleId = 2;
    const user_id = user.id;
    const workMemberResult = await workspaceSer.insertWorkspaceMember(
      insertId,
      user_id,
      roleId,
    );

    res.redirect("/dashboard/workspaces");
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }

}

export async function fetchWorkspaces(req: AuthRequest, res: Response) {
  try {
    const workspaceRepository = new WorkspacesRepository();

    const workspaces = await workspaceRepository.fetch_user_workspaces(
      req.user.id
    );


    res.json(workspaces);
  } catch (err) {
    console.error("Error fetching workspaces:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
export async function joinWorkspace(req: AuthRequest, res: Response) {
  try {
    console.log("inside join controller");
    const workspace_invite = req.body.invite_code;
    console.log(workspace_invite);
    const user_id = req.user.id;
    const roleId = 4;
    const workspaceSer = new workspaceService();

    const workMemberResult = await workspaceSer.insertWorkspaceMember(
      workspace_invite,
      user_id,
      roleId,
    );

    res.redirect("/dashboard");

  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
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
    const wsService = new workspaceService();
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

    const wsService = new workspaceService();
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
