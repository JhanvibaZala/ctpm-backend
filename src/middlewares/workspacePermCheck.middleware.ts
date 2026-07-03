import { NextFunction, Response } from "express";
import { AuthRequest } from "../common/interfaces/AuthRequest.interface";
import db from "../config/dbconfig";


const checkWorkspacePermission = (permission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const workspaceId = req.params.workspaceId;

            if (!workspaceId) {
                return res.send("No workspace id provided")
            }

            const userId = req.user.id;

            if (!userId) {
                return res.send("No user id provided")
            }

            const query = `SELECT EXISTS (
                            SELECT 1
                            FROM workspace_members wm
                            JOIN role_permissions rp ON rp.role_id = wm.role_id
                            JOIN permissions p ON p.id = rp.permission_id
                            WHERE wm.workspace_id = ?
                            AND wm.user_id = ?
                            AND p.permission_name = ?
                            ) AS has_permission;`

            const values = [workspaceId, userId, permission]
            const [result] = await db.execute(query, values)
            const has_perm = (result as any)?.[0]?.has_permission


            if (has_perm) next();
            else res.send("[WORKSPACE] you don't have necesary permissions for this particular action.")

        } catch (err) {
            console.log(err)
            return res.render('err', { err: err })
        }
    }
}

export default checkWorkspacePermission;
