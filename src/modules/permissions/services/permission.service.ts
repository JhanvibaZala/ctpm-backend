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

}