import { PoolConnection, QueryResult, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";
import { Iproject, IprojectMEmber } from "../interfaces/project_obj.interface";
import { success } from "zod";
import { ICreateProject } from "../interfaces/createProject.interface";

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
  async fetchAllProjectsInWorkspace(workspaceId: string): Promise<RowDataPacket[]> {
    const sql = `
      SELECT * 
      FROM projects 
      WHERE workspace_id = ?;
    `
    const [rows] = await db.execute<RowDataPacket[]>(sql, [workspaceId]);
    return rows;
  }


  
  async selectProjectByuserId(user_id: string) {
    try {
      const sql =
        "select p.* from projects p join project_members pm on p.id = pm.project_id where pm.user_id = ?";
      const result = await db.query(sql, [user_id]);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async selectProjectByworkspaceId(workspace_id: string) {
    try {
      const sql =
        "select *,date_format(deadline_at, '%b %d %Y') AS format_deadline from projects where workspace_id = ?";
      const [result] = await db.execute<RowDataPacket[]>(sql, [workspace_id]);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async selectUSersByProjectId(project_id: string) {
    try {
      const sql =
        "select u.* from users u join project_members pm on u.user_id = pm.user_id where pm.project_id = ? ";
      const result = await db.query(sql, [project_id]);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async getProjectById(project_id: string) {
    try {
      const sql = "select * from projects where id = ?";
      const [result] = await db.execute<RowDataPacket[]>(sql, [project_id]);
      return result[0];
    } catch (err) {
      throw err;
    }
  }

  async SelectProjectManagerByProjectId(project_id : string){
    try{
      const sql = `select pm.project_id,pm.user_id,r.role_name,u.email_id from project_members pm
       inner join roles r 
       on pm.role_id=r.id 
       inner join users u 
       on pm.user_id=u.id 
       where pm.project_id=? and r.role_name='project Manager';`

       const [result] = await db.execute<RowDataPacket[]>(sql,[project_id])

       return result
      
    }catch(err){
      throw err;
    }
  }

  // this function use to check user is eligible to delete project or not
  async userRoleForProject(project_id: string, user_id: string) {
    try {
      const sql = `select pm.project_id,pm.user_id,pm.role_id,r.role_name from project_members pm
            left join roles r on pm.role_id=r.id 
            where pm.project_id=? && pm.user_id=?;`;

      const [result] = await db.execute<RowDataPacket[]>(sql, [
        project_id,
        user_id,
      ]);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async deleteProjectByProjectId(project_id: string) {
    try {
      const sql = "delete from projects where id=?";
      const [result] = await db.execute(sql, [project_id]);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async updateProjectByProjectId(project_obj: Iproject) {
    try {
      const sql = `
      UPDATE projects
      SET
        project_name = ?,
        description = ?,
        priority_level = ?,
        status = ?,
        visibility = ?,
        deadline_at = ?
      WHERE id = ?
    `;

      const values = [
        project_obj.project_name,
        project_obj.description,
        project_obj.priority_level,
        project_obj.status,
        project_obj.visibility,
        project_obj.deadline_at,
        project_obj.project_id, // used in WHERE clause
      ];

      const [result] = await db.query(sql, values);
      return result;
    } catch (err) {
      console.log("Failed to update project", err);
      throw err;
    }
  }

  async deleteProjectMembers(project_id : string){
    try{
      const sql = "delete from project_members where project_id = ?"
      const [result] = await db.execute(sql,[project_id])
      return result;
    }catch(err){
      console.log("failed to delete project members")
      throw err
    }
  }

  async deleteAllowedTaskStatuses(project_id : string){
    try{
      const sql = "delete from allowed_task_statuses where project_id = ?"
      const [result] = await db.execute(sql,[project_id])
      return result;
    }catch(err){
      console.log("failed to delete allowed task statuses")
      throw err
    }
  }
}
