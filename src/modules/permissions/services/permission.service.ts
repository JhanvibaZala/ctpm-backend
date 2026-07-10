import { mapPermissions } from "../mapper/permission.mapper";
import { PermissionRepository } from "../repository/permission.repository";

export class PermissionService {

    constructor(
        private permissionRepo: PermissionRepository
    ){}

    async getWorkspacePermissions(
        workspaceId: string,
        userId: string
    ){

        const permissions =
            await this.permissionRepo.getWorkspacePermissions(
                workspaceId,
                userId
            );
            
        return mapPermissions(permissions);
    }
    async getProjectPermissions(
        workspaceId: string,
        projectId: string,
        userId: string
    ){

        const permissions =
            await this.permissionRepo.getProjectPermissions(
                workspaceId,
                projectId,
                userId,
            );
            
        return mapPermissions(permissions);
    }

}