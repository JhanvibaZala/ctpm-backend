import { QueryResult, RowDataPacket } from "mysql2/promise";
import db from "../../../config/dbconfig";
import { Iproject, IprojectMEmber } from "../interfaces/project_obj.interface";
import { success } from "zod";

export class projectRepository {
  async insertProject(project_obj: Iproject) {
    try {
      const sql =
        "insert into projects (id,workspace_id,project_name,description,priority_level,status,visibility,deadline_at) values (?,?,?,?,?,?,?,?)";
      console.log("project insert module : ", project_obj);
      const values = [
        project_obj.project_id,
        project_obj.workspace_id,
        project_obj.project_name,
        project_obj.description,
        project_obj.priority_level,
        project_obj.status,
        project_obj.visibility,
        project_obj.deadline_at,
      ];
      const result = await db.query(sql, values);
      console.log("insert project successfully");
      return success;
    } catch (err) {
      console.log("failed to insert project", err);
      throw err;
    }
  }
  async insertProjectMember(projectmember_obj: IprojectMEmber) {
    try {
      const sql =
        "insert into project_members(project_id,user_id,role_id) values (?,?,?)";
      const values = [
        projectmember_obj.project_id,
        projectmember_obj.user_id,
        projectmember_obj.role_id,
      ];
      const result = await db.query(sql, values);
    } catch (err) {
      console.log(err);
      throw err;
    }
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
