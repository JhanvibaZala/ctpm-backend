import { NextFunction, Response } from "express";
import { PermissionRepository } from "../modules/permissions/repository/permission.repository";
import db from "../config/dbconfig";
import { PermissionService } from "../modules/permissions/services/permission.service";
import { AuthRequest } from "../common/interfaces/AuthRequest.interface";

const permissionRepo = new PermissionRepository(db);
const permissionService = new PermissionService(permissionRepo);

export async function loadProjectPermissions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const {workspaceId, projectId} = req.params;
        const userId = req.user.id;
        
        if (!projectId || !workspaceId) {
            return next();
        }
        
        if(workspaceId == undefined || typeof workspaceId != "string") {
            return res.status(403).json({
                success: false,
                message: "Invalid workspace id",
            });
        }
        if(projectId == undefined || typeof projectId != "string") {
            return res.status(403).json({
                success: false,
                message: "Invalid project id",
            });
        }

        const permissions =
            await permissionService.getProjectPermissions(
                workspaceId,
                projectId,
                userId,
            );
        req.permissions = permissions;

        next();
    } catch (error) {
        next(error);
    }
}