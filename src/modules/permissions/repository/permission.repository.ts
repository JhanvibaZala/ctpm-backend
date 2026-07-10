import { Pool, RowDataPacket } from "mysql2/promise";

export class PermissionRepository {
    constructor(private db: Pool) {}

    async getWorkspacePermissions(
        workspaceId: string,
        userId: string
    ): Promise<RowDataPacket[]> {

        const [rows] = await this.db.query<RowDataPacket[]>(
            `
            SELECT
                p.permission_name
            FROM workspace_members wm

            INNER JOIN role_permissions rp
                ON wm.role_id = rp.role_id

            INNER JOIN permissions p
                ON rp.permission_id = p.id

            WHERE
                wm.workspace_id = ?
            AND
                wm.user_id = ?
            `,
            [workspaceId, userId]
        );

        return rows;
    }
    async getProjectPermissions(
        workspaceId: string,
        projectId: string,
        userId: string
    ): Promise<RowDataPacket[]> {

        console.log("hwdkgwefk")

        const [rows] = await this.db.query<RowDataPacket[]>(
            `
            SELECT
                p.permission_name
            FROM workspace_members wm

            INNER JOIN role_permissions rp
                ON wm.role_id = rp.role_id

            INNER JOIN permissions p
                ON rp.permission_id = p.id

            WHERE
                wm.workspace_id = ?
            AND
                wm.user_id = ?

            UNION

            SELECT
                p.permission_name
            FROM project_members pm

            INNER JOIN role_permissions rp
                ON pm.role_id = rp.role_id

            INNER JOIN permissions p
                ON rp.permission_id = p.id

            WHERE
                pm.project_id = ?
            AND
                pm.user_id = ?
            `,
            [workspaceId, userId, projectId, userId]
        );

        return rows;
    }
}