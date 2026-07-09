import { NextFunction, Response } from "express";
import { PermissionRepository } from "../modules/permissions/repository/permission.repository";
import db from "../config/dbconfig";
import { PermissionService } from "../modules/permissions/services/permission.service";
import { AuthRequest } from "../common/interfaces/AuthRequest.interface";

const permissionRepo = new PermissionRepository(db);
const permissionService = new PermissionService(permissionRepo);

export async function loadWorkspacePermissions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const workspaceId = req.params.workspaceId;
        const userId = req.user.id;

        if (!workspaceId) {
            return next();
        }

        if(workspaceId == undefined || typeof workspaceId != "string") {
            return res.status(403).json({
                success: false,
                message: "Invalid workspace id",
            });
        }

        const permissions =
            await permissionService.getWorkspacePermissions(
                workspaceId,
                userId
            );

        req.permissions = permissions;

        next();
    } catch (error) {
        next(error);
    }
}