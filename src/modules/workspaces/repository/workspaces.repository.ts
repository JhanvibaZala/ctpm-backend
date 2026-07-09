import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";
import {
  AddWorkspaceMember,
  ICreateWorkspaceMember,
  IWorkspace,
  WorkspaceDetails,
} from "../interfaces/workspace.interface";
import { inviteCodeMapper, workspaceDetailsMapper, workspaceMapper } from "../mappers/workspace.mapper";
import {
  CreateInviteCode,
  InviteCode,
} from "../interfaces/inviteCode.interface";

export class WorkspacesRepository {
  async fetchUserWorkspaces(user_id: string) {
    try {
      const sql = `select w.id, w.workspace_name, w.description, w.owner_id, w.created_at, wm.role_id, wm.joined_at , wm.added_by, (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS total_members from workspace_members wm inner join workspaces w on wm.workspace_id = w.id where wm.user_id = ? order by w.created_at desc`;
      const [rows] = await db.execute<RowDataPacket[]>(sql, [user_id]);
      return rows.map(workspaceMapper);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // get role
  async getRole(
    connection: PoolConnection,
    roleName: string,
  ): Promise<RowDataPacket[]> {
    try {
      const sql = "select * from roles where role_name = ?";
      const [result] = await connection.execute<RowDataPacket[]>(sql, [
        roleName,
      ]);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // creation of workspace
  async insertWorkspace(
    connection: PoolConnection,
    workspace: IWorkspace,
  ): Promise<boolean> {
    try {
      const sql = `insert into workspaces (id, workspace_name, description, owner_id) values (?, ?, ?, ?)`;
      const values = [
        workspace.id,
        workspace.workspaceName,
        workspace.description,
        workspace.ownerId,
      ];
      const [result] = await connection.query<ResultSetHeader>(sql, values);
      return result.affectedRows > 0;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  // creation of workspace
  async insertWorkMember(
    connection: PoolConnection,
    member: ICreateWorkspaceMember
  ): Promise<boolean> {
    try {
      const sql = `insert into workspace_members (workspace_id, user_id, role_id, added_by) values (?, ?, ?, ?)`;
      const values = [
        member.workspaceId,
        member.userId,
        member.roleId,
        member.addedBy,
      ];
      const [result] = await connection.query<ResultSetHeader>(sql, values);
      return result.affectedRows > 0;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // create / insert invite code
  async insertInviteCode(data: CreateInviteCode): Promise<boolean> {
    try {
      const sql = `insert into workspace_invite_codes (id, workspace_id, invite_code, created_by, is_active, max_uses, used_count, expires_at, created_at) values (?, ?, ?, ?, 1, ?, 0, ?, NOW());`;
      const values = [
        data.id,
        data.workspaceId,
        data.inviteCode,
        data.createdBy,
        data.maxUses,
        data.expiresAt,
      ];
      const [result] = await db.execute<ResultSetHeader>(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  // find existing invite code
  async findActiveInviteCode(workspaceId: string): Promise<RowDataPacket[]> {
    try {
      const sql = `
                SELECT invite_code
                FROM workspace_invite_codes
                WHERE workspace_id = ?
                AND is_active = 1
                AND expires_at > NOW()
                LIMIT 1
            `;
      const [result] = await db.execute<RowDataPacket[]>(sql, [workspaceId]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // get workspace invite code data
  async getInviteCodeViaWorkspace(
    inviteCode: string,
  ): Promise<InviteCode | null> {
    try {
      const sql = `select * from workspace_invite_codes where invite_code = ?`;
      const [result] = await db.execute<RowDataPacket[]>(sql, [inviteCode]);
      if (result.length === 0 || typeof result == undefined) {
        return null;
      }
      return inviteCodeMapper(result[0]);
    } catch (error) {
      throw error;
    }
  }

  // check existing member
  async getWorkspaceMember(workspaceId: string, userId: string) {
    const sql = `
            SELECT *
            FROM workspace_members
            WHERE workspace_id = ?
            AND user_id = ?
        `;
    const [rows] = await db.execute<RowDataPacket[]>(sql, [
      workspaceId,
      userId,
    ]);
    return rows.length > 0;
  }

  // add member in workspace
  async addWorkspaceMember(data: AddWorkspaceMember) {
    const sql = `
            INSERT INTO workspace_members
            (
                workspace_id,
                user_id,
                role_id,
                joined_at,
                added_by
            )
            VALUES
            (?, ?, ?, NOW(), ?)
        `;

    await db.execute(sql, [
      data.workspaceId,
      data.userId,
      data.roleId,
      data.addedBy,
    ]);
  }

  // update the user count in invite codes of WS
  async incrementInviteUsage(inviteId: string) {
    const sql = `
          UPDATE workspace_invite_codes
          SET used_count = used_count + 1
          WHERE id = ?
      `;

    await db.execute(sql, [inviteId]);
  }

  // fetches the data for single workspace
  async fetchWorkspaceDetailsViaId(workspaceId: string, userId: string) {
    try {
      console.log("sdfaksfdbsdf")
      const sql = `
        SELECT w.id, w.workspace_name, w.description, w.created_at, r.role_name AS role,
          (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS totalMembers,
          COUNT(DISTINCT p.id) AS totalProjects,
          COUNT(DISTINCT t.id) AS totalTasks
        FROM workspaces w
        JOIN workspace_members wm
          ON wm.workspace_id = w.id
        JOIN roles r
          ON r.id = wm.role_id
        LEFT JOIN projects p
          ON p.workspace_id = w.id
        LEFT JOIN project_tasks t
          ON t.project_id = p.id
        WHERE
          w.id = ?
          AND wm.user_id = ?
        GROUP BY
          w.id,
          w.workspace_name,
          w.description,
          w.created_at,
          r.role_name;
      `
      const [result] = await db.execute<RowDataPacket[]>(sql, [workspaceId, userId]);
      if (result.length === 0) {
        return null;
      }
      return workspaceDetailsMapper(result[0]);

    } catch (error) {
      throw error;
    }
  }

  async selectUsersByWorkspaceId(workspace_id: string) {
    try {
      const sql =
        "select u.* from users u join workspace_members wm on u.user_id = wm.user_id where wm.workspace_id = ? ";
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

  async checkWorkspaceManagerByUserId(workspace_id: string, user_id: string) {
    try {
      const sql = `select wm.workspace_id,wm.user_id,r.role_name from workspace_members wm 
            inner join roles r on wm.role_id=r.id 
            where wm.workspace_id=? and wm.user_id=?;`;
      const [result] = await db.execute<RowDataPacket[]>(sql, [
        workspace_id,
        user_id,
      ]);
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
            `;
      const [result] = await db.execute<RowDataPacket[]>(sql, [workspaceId]);
      return result;
    } catch (error) {
      console.error("failed to fetch workspace members");
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
            `;
      const [result] = await db.execute<RowDataPacket[]>(sql, [workspaceId]);
      return result;
    } catch (error) {
      console.error("failed to fetch project members");
    }
  }

  // workspace.repository.ts

  async isWorkspaceMember(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const [rows] = await db.query(
      `
          SELECT 1
          FROM workspace_members
          WHERE workspace_id = ?
          AND user_id = ?
          LIMIT 1
          `,
      [workspaceId, userId]
    );

    return (rows as RowDataPacket[]).length > 0;
  }
}
