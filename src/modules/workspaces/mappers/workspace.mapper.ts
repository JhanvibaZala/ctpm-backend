import { RowDataPacket } from "mysql2";
import { Workspace, WorkspaceDetails } from "../interfaces/workspace.interface";
import { InviteCode } from "../interfaces/inviteCode.interface";

export const workspaceMapper = (
    row: RowDataPacket
): Workspace => {

    return {
        id: row.id,
        name: row.workspace_name,
        description: row.description,
        ownerId: row.owner_id,
        createdAt: row.created_at,
        totalMembers: row.total_members,

        member: {
            roleId: row.role_id,
            joinedAt: row.joined_at,
            addedBy: row.added_by,
        },
    };
};
export const workspaceDetailsMapper = (
    row: RowDataPacket
): WorkspaceDetails => {

    return {
        id: row.id,
        workspaceName: row.workspace_name,
        description: row.description,
        createdAt: row.created_at,
        role: row.role,
        totalMembers: row.totalMembers,
        totalProjects: row.totalProjects,
        totalTasks: row.totalTasks,
    };
};

export const inviteCodeMapper = (
    row: RowDataPacket
): InviteCode => {

    return {
        id: row.id,
        workspaceId: row.workspace_id,
        inviteCode: row.invite_code,
        createdBy: row.created_by,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        isActive: row.is_active,
        maxUses: row.max_uses,
        usedCount: row.used_count,
    };
};