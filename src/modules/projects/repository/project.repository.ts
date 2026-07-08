import { PoolConnection, QueryResult, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";
import { Iproject, IprojectMEmber } from "../interfaces/project_obj.interface";
import { success } from "zod";
import { ICreateProject } from "../interfaces/createProject.interface";
import { CreateProjectDto } from "../dto/createProject.dto";

export class projectRepository {
  async insertProject(connection: PoolConnection, project: ICreateProject): Promise<boolean> {
    const sql = `
      INSERT INTO projects
      (
          id,
          workspace_id,
          project_name,
          description,
          priority_level,
          status,
          visibility,
          deadline_at
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      project.id,
      project.workspaceId,
      project.projectName,
      project.description ?? null,
      project.priorityLevel,
      "Pending",
      project.visibility,
      project.deadlineAt ?? null
    ];

    const [result] = await connection.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
  }

  async insertProjectMember(
    connection: PoolConnection,
    projectId: string,
    userId: string,
    roleId: number
  ) {

    const sql = `
    INSERT INTO project_members
    (
        project_id,
        user_id,
        role_id
    )
    VALUES (?, ?, ?)
    `;

    await connection.execute(sql, [
      projectId,
      userId,
      roleId
    ]);
  }

  // INSERT ALLOWED STATUES IN TASKS
  async insertAllowedStatus(
    connection: PoolConnection,
    projectId: string,
    text: string,
    level: number
  ) {

    const sql = `
    INSERT INTO allowed_task_statuses
    (
        project_id,
        status_text,
        status_level
    )
    VALUES (?, ?, ?)
    `;

    await connection.execute(sql, [
      projectId,
      text,
      level
    ]);
  }
  async isWorkspaceMember(
    connection: PoolConnection,
    workspaceId: string,
    userId: string
  ): Promise<boolean> {

    const sql = `
    SELECT *
    FROM workspace_members
    WHERE workspace_id=?
    AND user_id=?
    `;

    const [rows] = await connection.execute<RowDataPacket[]>(sql, [
      workspaceId,
      userId
    ]);

    return rows.length > 0;
  }

  async fetchWorkspaceMembers(
    workspaceId: string
  ) {
    const sql = `
    SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email_id
    FROM workspace_members wm
    INNER JOIN users u
        ON wm.user_id=u.id
    WHERE wm.workspace_id=?
    `;
    const [rows] =
      await db.execute<RowDataPacket[]>(sql, [
        workspaceId
      ]);
    return rows;
  }

  // gets all the projects in the workspace
  async fetchAllProjectsInWorkspace(workspaceId: string, limit: number, offset: number): Promise<RowDataPacket[]> {
    const sql = `SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at desc LIMIT ${limit} OFFSET ${offset};`
    console.log(workspaceId, limit, offset)
    const [rows] = await db.execute<RowDataPacket[]>(sql, [workspaceId]);
    return rows;
  }

  // count total pages
  async countProjectsInWorkspace(workspaceId: string): Promise<RowDataPacket[]> {
    const sql = `
      SELECT COUNT(*) AS total
      FROM projects
      WHERE workspace_id = ?;
    `
    const [rows] = await db.execute<RowDataPacket[]>(sql, [workspaceId]);
    return rows;
  }

  // get project details 
  async fetchProject(workspaceId: string, projectId: string): Promise<RowDataPacket[]> {
    const sql = `
      SELECT
        p.id,
        p.workspace_id,
        p.project_name,
        p.description,
        p.priority_level,
        p.status,
        p.visibility,
        p.created_at,
        p.deadline_at,
        p.completed_at,
        p.updated_at
    FROM projects p
    WHERE
        p.workspace_id = ?
        AND p.id = ?;
    `
    const [rows] = await db.execute<RowDataPacket[]>(sql, [workspaceId, projectId]);
    return rows;
  }

  // get project members from project id
  async fetchProjectMembers(projectId: string): Promise<RowDataPacket[]> {
    const sql = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        u.email_id,
        u.profile_pic_path,
        pm.joined_at,
        r.id AS role_id,
        r.role_name
      FROM project_members pm
      INNER JOIN users u
        ON pm.user_id = u.id
      INNER JOIN roles r
        ON pm.role_id = r.id
      WHERE
        pm.project_id = ?
      ORDER BY
        r.id,
        u.first_name;
      `
    const [rows] = await db.execute<RowDataPacket[]>(sql, [projectId]);
    return rows;
  }

  // allowed statuses
  async fetchAllowedStatuses(projectId: string): Promise<RowDataPacket[]> {
    const sql = `
      SELECT
        id,
        status_text,
        status_level
      FROM allowed_task_statuses
      WHERE project_id = ?
      ORDER BY status_level;
    `
    const [rows] = await db.execute<RowDataPacket[]>(sql, [projectId]);
    return rows;
  }

  // delete project stuff
  async deleteProjectMembers(connection: PoolConnection, projectId: string) {
    const sql = "delete from project_members where project_id = ?"
    await connection.execute(sql, [projectId])
  }

  async deleteAllowedTaskStatuses(connection: PoolConnection, projectId: string) {
    const sql = "delete from allowed_task_statuses where project_id = ?"
    await connection.execute(sql, [projectId])
  }

  async deleteProjectByProjectId(connection: PoolConnection, projectId: string): Promise<boolean> {
    const sql = "DELETE FROM projects WHERE id = ?";
    const [result] = await connection.execute<ResultSetHeader>(sql, [projectId]);
    return result.affectedRows > 0;
  }

  // edit stuff
  async updateProject(
    connection: PoolConnection,
    projectId: string,
    dto: CreateProjectDto
  ): Promise<boolean> {

    const sql = `
        UPDATE projects
        SET
            project_name = ?,
            description = ?,
            priority_level = ?,
            visibility = ?,
            deadline_at = ?,
            updated_at = NOW()
        WHERE id = ?
    `;

    const values = [
      dto.name,
      dto.description ?? null,
      dto.priority,
      dto.visibility,
      dto.deadlineAt ?? null,
      projectId,
    ];

    const [result] =
      await connection.query<ResultSetHeader>(
        sql,
        values
      );

    return result.affectedRows > 0;
  }

  async projectExists(
    connection: PoolConnection,
    workspaceId: string,
    projectId: string
  ): Promise<boolean> {

    const sql = `
          SELECT id
          FROM projects
          WHERE id = ?
          AND workspace_id = ?
      `;

    const [rows] =
      await connection.query<RowDataPacket[]>(
        sql,
        [projectId, workspaceId]
      );

    return rows.length > 0;
  }

  // async selectProjectByuserId(user_id: string) {
  //   try {
  //     const sql =
  //       "select p.* from projects p join project_members pm on p.id = pm.project_id where pm.user_id = ?";
  //     const result = await db.query(sql, [user_id]);
  //     return result;
  //   } catch (err) {
  //     console.log(err);
  //     throw err;
  //   }
  // }
  // async selectProjectByworkspaceId(workspace_id: string) {
  //   try {
  //     const sql =
  //       "select *,date_format(deadline_at, '%b %d %Y') AS format_deadline from projects where workspace_id = ?";
  //     const [result] = await db.execute<RowDataPacket[]>(sql, [workspace_id]);
  //     return result;
  //   } catch (err) {
  //     console.log(err);
  //     throw err;
  //   }
  // }
  // async selectUSersByProjectId(project_id: string) {
  //   try {
  //     const sql =
  //       "select u.* from users u join project_members pm on u.user_id = pm.user_id where pm.project_id = ? ";
  //     const result = await db.query(sql, [project_id]);
  //     return result;
  //   } catch (err) {
  //     console.log(err);
  //     throw err;
  //   }
  // }
  // async getProjectById(project_id: string) {
  //   try {
  //     const sql = "select * from projects where id = ?";
  //     const [result] = await db.execute<RowDataPacket[]>(sql, [project_id]);
  //     return result[0];
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  // async SelectProjectManagerByProjectId(project_id : string){
  //   try{
  //     const sql = `select pm.project_id,pm.user_id,r.role_name,u.email_id from project_members pm
  //      inner join roles r 
  //      on pm.role_id=r.id 
  //      inner join users u 
  //      on pm.user_id=u.id 
  //      where pm.project_id=? and r.role_name='project Manager';`

  //      const [result] = await db.execute<RowDataPacket[]>(sql,[project_id])

  //      return result

  //   }catch(err){
  //     throw err;
  //   }
  // }

  // // this function use to check user is eligible to delete project or not
  // async userRoleForProject(project_id: string, user_id: string) {
  //   try {
  //     const sql = `select pm.project_id,pm.user_id,pm.role_id,r.role_name from project_members pm
  //           left join roles r on pm.role_id=r.id 
  //           where pm.project_id=? && pm.user_id=?;`;

  //     const [result] = await db.execute<RowDataPacket[]>(sql, [
  //       project_id,
  //       user_id,
  //     ]);
  //     return result;
  //   } catch (err) {
  //     throw err;
  //   }
  // }



  // async updateProjectByProjectId(project_obj: Iproject) {
  //   try {
  //     const sql = `
  //     UPDATE projects
  //     SET
  //       project_name = ?,
  //       description = ?,
  //       priority_level = ?,
  //       status = ?,
  //       visibility = ?,
  //       deadline_at = ?
  //     WHERE id = ?
  //   `;

  //     const values = [
  //       project_obj.project_name,
  //       project_obj.description,
  //       project_obj.priority_level,
  //       project_obj.status,
  //       project_obj.visibility,
  //       project_obj.deadline_at,
  //       project_obj.project_id, // used in WHERE clause
  //     ];

  //     const [result] = await db.query(sql, values);
  //     return result;
  //   } catch (err) {
  //     console.log("Failed to update project", err);
  //     throw err;
  //   }
  // }


}
