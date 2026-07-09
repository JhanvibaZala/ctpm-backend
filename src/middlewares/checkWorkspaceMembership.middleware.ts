import { NextFunction, Response } from "express";
import { AuthRequest } from "../common/interfaces/AuthRequest.interface";
import { WorkspaceService } from "../modules/workspaces/services/workSpace.service";

export async function checkWorkspaceMembership(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const workspaceId = req.params.workspaceId;
        const userId = req.user.id;
        const workspaceService = new WorkspaceService();
        if(workspaceId == undefined || typeof workspaceId != "string") {
            return res.status(403).json({
                success: false,
                message: "Invalid workspace id",
            });
        }
        const isMember =
            await workspaceService.isWorkspaceMember(
                workspaceId,
                userId
            );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this workspace.",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}