import { NextFunction, Response } from "express";
import { AuthRequest } from "../common/interfaces/AuthRequest.interface";
import db from "../config/dbconfig";


const checkProjectPermission = (permission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const projectId = req.params.workspaceId;
            
            const workspaceId = req.params.workspaceId;
            

            if (!projectId) {
                return res.send("No project id provided")
            }

            const userId = req.user.id;

            if (!userId) {
                return res.send("No user id provided")
            }

            const query_work:any = `SELECT EXISTS (
                            SELECT 1
                            FROM workspace_members wm
                            JOIN role_permissions rp ON rp.role_id = wm.role_id
                            JOIN permissions p ON p.id = rp.permission_id
                            WHERE wm.workspace_id = ?
                            AND wm.user_id = ?
                            AND p.permission_name = ?
                            ) AS has_permission;`

            const values_work:any = [workspaceId, userId, permission]
            const [result_work] = await db.execute(query_work, values_work)
            const has_perm_work = (result_work as any)?.[0]?.has_permission



            const query = `SELECT EXISTS (
                            SELECT 1
                            FROM project_members pm
                            JOIN role_permissions rp ON rp.role_id = pm.role_id
                            JOIN permissions p ON p.id = rp.permission_id
                            WHERE pm.project_id = ?
                            AND pm.user_id = ?
                            AND p.permission_name = ?
                            ) AS has_permission;`

            const values = [projectId, userId, permission]
            const [result] = await db.execute(query, values)
            const has_perm = (result as any)?.[0]?.has_permission


            if (has_perm || has_perm_work) next();
            else return res.send("[PROJECT] you don't have necesary permissions for this particular action.")

        } catch (err) {
            console.error(err)
            return res.render('err', { err: err })
        }
    }
}

export default checkProjectPermission;
