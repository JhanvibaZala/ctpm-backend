import {WorkspacesRepository} from "../repository/workspaces.repository"
import { CreateWorkspaceDto } from "../dto/workspace.dto";
import { ICreateWorkspaceMember, IWorkspace } from "../interfaces/workspace.interface";
import {v4 as uuidv4} from "uuid"
import db from "../../../config/dbconfig";

export class WorkspaceService{
    private workspaceRepo = new WorkspacesRepository;

    async createWorkspace(userId: string,workspaceObj:CreateWorkspaceDto){
        // create connection to manage transaction
        const connection = await db.getConnection();
        try{
            // start transaction 
            await connection.beginTransaction();
            const wsId = uuidv4();
            const workspace: IWorkspace = {
                id: wsId,
                ownerId: userId,
                workspaceName: workspaceObj.name,
                description: workspaceObj.description,
            }
            const isWsCreated = await this.workspaceRepo.insertWorkspace(connection, workspace);
            if(!isWsCreated) {
                return {success: false, wsId: null}
            }
            // get role
            const roleData: any = await this.workspaceRepo.getRole(connection, "Workspace Admin")
            if(roleData.length === 0) {
                return { success: false, wsId: null }
            }   

            // add member
            const member: ICreateWorkspaceMember = {
                roleId: roleData[0].id,
                userId: userId,
                workspaceId: wsId,
                addedBy: userId
            }
            const isMemberAdded = await this.workspaceRepo.insertWorkMember(connection, member);
            if(!isMemberAdded) {
                return {success: false, wsId: null}
            }
            // now commit 
            await connection.commit()
            return {success: true, wsId: wsId}
            
        } catch (error) {
            console.log(error)
            await connection.rollback()
            throw error;
        } finally {
            connection.release();
        }
    
    }

    // team members of ws and project
    async getTeamMembers(workspaceId: string) {
        try {
            const wsMembers = await this.workspaceRepo.getAllWorkspaceMembers(workspaceId)
            const prjMembers = await this.workspaceRepo.getAllProjectMembers(workspaceId)
            return {
                wsMembers,
                prjMembers
            }
        } catch (error) {
            return false;
        }
    }

    // get details of a specific team member
    async getTeamMemberDetails(workspaceId: string, username: string) {
        try {
            const memberDetails = await this.workspaceRepo.getTeamMemberDetails(workspaceId, username);
            console.log("Member details fetched successfully:", memberDetails);
            return memberDetails;
        } catch (error) {
            console.error("Error fetching team member details:", error);
            return false;
        }
    }
}