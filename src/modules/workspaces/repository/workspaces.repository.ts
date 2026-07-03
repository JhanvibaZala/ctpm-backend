import { RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";
import { v4 as uuidv4 } from "uuid";
import { IworkMember, Iworkspace } from "../interfaces/workspace_obj.interface"

export class WorkspacesRepository {
    // check if email exists in the database
    async fetch_user_workspaces(user_id: string) {
        const sql = `select * from workspace_members wm inner join workspaces w on wm.workspace_id = w.id where wm.user_id = ?`;
        const [rows] = await db.execute<RowDataPacket[]>(sql, [user_id]);
        return rows;
    }
    async insertWorkspace(workspace_obj: Iworkspace) {
        try {
            const sql = "insert into workspaces (id,workspace_name,description) values (?,?,?)";
            const insertId = uuidv4();
            const values = [
                insertId,
                workspace_obj.workspace_name,
                workspace_obj.description
            ]
            const result = await db.query(sql, values);
            return insertId;
        } catch (err) {
            console.log(err);
            throw err;

        }
    }
    async insertWorkMember(workspace_id: string, user_id: string, role_id: number) {
        try {
            const sql = "insert into workspace_members (workspace_id,user_id,role_id) values (?,?,?)";
            const result = await db.query(sql, [
                workspace_id,
                user_id,
                role_id
            ]);
            return [result];
        }
        catch (err) {
            console.log(err);
            throw err;

        }
    }
    async checkWorkMember(workspace_id: string, user_id: string) {
        try {
            const result = await db.query<RowDataPacket[]>("select * from workspace_members where workspace_id = ? and user_id = ?", [
                workspace_id, user_id
            ]);
            return [result];

        }
        catch (err) {
            console.log(err);
            throw err;

        }
    }

    async selectUsersByWorkspaceId(workspace_id: string) {
        try {
            const sql = "select u.* from users u join workspace_members wm on u.user_id = wm.user_id where wm.workspace_id = ? ";
            const result = await db.query(sql, [workspace_id]);
            return [result];
        } catch (err) {
            console.log(err);
            throw err;

        }
    }

    async deleteWorkspaceByWorkspaceId(workspace_id: string) {
        try {
            const sql = "delete from workspaces where id=?";
            const [result] = await db.execute(sql, [workspace_id]);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async checkWorkspaceManagerByUserId(workspace_id: string,user_id : string) {
        try {
            const sql = `select wm.workspace_id,wm.user_id,r.role_name from workspace_members wm 
            inner join roles r on wm.role_id=r.id 
            where wm.workspace_id=? and wm.user_id=?;`;
            const [result] = await db.execute<RowDataPacket[]>(sql, [workspace_id,user_id]);
            return result;
        } catch (err) {
            throw err;
        }
    }

    // all team members of workspace using the workspace id
    async getAllWorkspaceMembers(workspaceId: string) {
        try {
            const sql = `
                SELECT 
                wm.workspace_id,
                u.*,
                r.role_name
            FROM workspace_members wm
            JOIN users u 
                ON wm.user_id = u.id
            JOIN roles r
                ON wm.role_id = r.id
            WHERE wm.workspace_id = ?;
            `
            const [result] = await db.execute<RowDataPacket[]>(sql,[workspaceId]);
            return result;
        } catch (error) {
            console.error("failed to fetch workspace members")
        }
    }
    // all team members of project using the workspace id
    async getAllProjectMembers(workspaceId: string) {
        try {
            const sql = `
                SELECT 
                u.*,
                r.role_name,
                p.*
            FROM projects p
            JOIN project_members pm
                ON p.id = pm.project_id
            JOIN users u
                ON pm.user_id = u.id
            JOIN roles r
                ON pm.role_id = r.id
            WHERE p.workspace_id = ?;
            `
            const [result] = await db.execute<RowDataPacket[]>(sql,[workspaceId]);
            return result;
        } catch (error) {
            console.error("failed to fetch project members")
        }
    }

    async getTeamMemberDetails(workspaceId: string, username: string) {
        try {
            const sql = `
                SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.email_id,
    u.profile_pic_path,
    r.role_name,
    'Workspace Member' AS member_type,
    NULL AS project_name
FROM workspace_members wm
JOIN users u 
    ON wm.user_id = u.id
JOIN roles r
    ON wm.role_id = r.id
WHERE wm.workspace_id = ?
AND u.username = ?


UNION


SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.email_id,
    u.profile_pic_path,
    r.role_name,
    'Project Member' AS member_type,
    p.project_name
FROM project_members pm
JOIN projects p
    ON pm.project_id = p.id
JOIN users u
    ON pm.user_id = u.id
JOIN roles r
    ON pm.role_id = r.id
WHERE p.workspace_id = ?
AND u.username = ?;
            `
            const [result] = await db.execute<RowDataPacket[]>(sql,[workspaceId, username, workspaceId, username]);
            console.log("repo")
            console.log(workspaceId, username)
            console.log("Team member details fetched successfully:", result);
            return result;
        } catch (error) {
            console.error("failed to fetch team member details")
            throw error;
        }
    }

}