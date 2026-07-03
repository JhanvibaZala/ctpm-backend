import { Request, Response } from "express";
// import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";
import { LoginRepository } from "../../auth/repository/login.repository";
import { WorkspacesRepository } from "../../workspaces/repository/workspaces.repository";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";
import { WorkspaceRepo } from "../repository/workspace.repository";


export async function showDashboard(req : AuthRequest,res : Response){

    const workspaceRepo = new WorkspaceRepo()
    const workspace_id:string = req.params.workspaceId as string;
    
    const stats = await workspaceRepo.fetchWorkspaceStats(workspace_id)
    const workspaceInfo = await workspaceRepo.fetchWorkspaceInfo(workspace_id)


    res.render("dashboard/dashboard",{
        workspace_id,
        stats,
        workspaceInfo
    })
}
export async function showWrokspaces(req: AuthRequest, res: Response) {
    try {
        const loginRepo = new LoginRepository();
        const mail = req.user.email;
        const rows = await loginRepo.fetchUserDetails(mail);

        if (rows.length < 1) {
            return res.status(401).render("auth/login", {
                error: "Invalid email or password.",
                form: { mail }
            });
        }

        const workspaceRepo = new WorkspacesRepository()
        const workspaces = await workspaceRepo.fetch_user_workspaces(req.user.id)
        console.log(workspaces)

        res.render("dashboard/workspace_list", { user: rows[0],workspaces})
    } catch (error) {
        console.log("Error displaying the dashboard");
        throw error
    }

    // res.render("dashboard/dashboard")
}



// this showProjects is not longer in use. so you can ignore it
export async function showProjects(req: AuthRequest, res: Response) {
    const workspcaeId = req.params.id;
    //write a code here to fetch the projects where workspaceId is this

    res.render("dashboard/projects_list")
}

//this controller is made for sidebar so it can get user data to show in sidebar using fetch method
export async function getUser(req: AuthRequest, res: Response) {
    try {
        const email = req.user.email

        const loginRepo = new LoginRepository()
        const row = await loginRepo.fetchUserDetails(email)

        if (row.length < 1) {
            return res.status(401).render("auth/login", {
                error: "Invalid email or password."
            });
        }

        const user = row[0]

        return res.status(200).json({ user })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: "server error" })
    }
}

