import {WorkspacesRepository} from "../repository/workspaces.repository"
import { CreateWorkspaceDto } from "../dto/workspace.dto";
import { ICreateWorkspaceMember, IWorkspace } from "../interfaces/workspace.interface";
import {v4 as uuidv4} from "uuid"
import db from "../../../config/dbconfig";
import crypto from "crypto"
import { CreateInviteCode, InviteCode } from "../interfaces/inviteCode.interface";

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
            await connection.commit();
            
            return {success: true, wsId: wsId}
            
        } catch (error) {
            console.log(error)
            await connection.rollback()
            throw error;
        } finally {
            connection.release();
        }
    
    }

    // generate invite code 
    async generateInviteCode(workspaceId: string, userId: string) {
        try {

            // check is the code already exist for that workspace
            const isThereActiveInviteCode = await this.workspaceRepo.findActiveInviteCode(workspaceId);
            if(isThereActiveInviteCode.length > 0) {
                const existingInviteCode = isThereActiveInviteCode[0].invite_code;
                return {
                    success: true,
                    inviteCode: existingInviteCode 
                }
            }
            
            const inviteCode =
            crypto.randomBytes(3).toString("hex").toUpperCase()
            +
            "-"
            +
            crypto.randomBytes(2).toString("hex").toUpperCase();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);     // expires in 7 days
            const inviteCodeObj: CreateInviteCode = {
                id: uuidv4(),
                workspaceId: workspaceId,
                createdBy: userId,
                expiresAt: expiresAt,
                inviteCode: inviteCode,
                maxUses: 20,
            } 
            const isInviteCodeAdded = await this.workspaceRepo.insertInviteCode(inviteCodeObj);
            if(!isInviteCodeAdded) {
                return {success: false, inviteCode: null}
            }
            return {
                success: true,
                inviteCode: inviteCode,
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // join workspace members
    async addWorkspaceMemberViaCode(userId: string, inviteCode: string) {
        const invite = await this.workspaceRepo.getInviteCodeViaWorkspace(inviteCode);
        if (!invite) {
            throw new Error("Invalid invite code.");
        }

        // 2. Active?
        if (!invite.isActive) {
            throw new Error("Invite code is inactive.");
        }

        // 3. Expired?
        if (new Date(invite.expiresAt) < new Date()) {
            throw new Error("Invite code has expired.");
        }

        // 4. Usage limit
        if (invite.usedCount >= invite.maxUses) {
            throw new Error("Invite code has reached its maximum usage.");
        }

        // 5. Already joined?
        const member =
            await this.workspaceRepo.getWorkspaceMember(
                invite.workspaceId,
                userId
            )

        if (member) {
            throw new Error("You are already a member of this workspace.");
        }

        // 6. Add member
        const MEMBER_ROLE_ID = 4;
        await this.workspaceRepo.addWorkspaceMember({
            workspaceId: invite.workspaceId,
            userId,
            roleId: MEMBER_ROLE_ID,
            addedBy: invite.createdBy
        });

        // 7. Increase used count
        await this.workspaceRepo.incrementInviteUsage(invite.id);
        
    }

    // get all workspaces that user is a part of
    async fetchAllUserWorkspaces(userId: string) {
        try {
            const workspaces = await this.workspaceRepo.fetchUserWorkspaces(userId);
            return workspaces;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // get workspace details
    async fetchWorkspaceDetails(workspaceId: string, userId: string) {
        try {
            console.log("asdhsdb")
            console.log(userId)
            const workspace = await this.workspaceRepo.fetchWorkspaceDetailsViaId(workspaceId, userId);

            if (!workspace) {
                return {
                    success: false,
                    message: "Workspace not found",
                };
            }
            console.log(workspace)

            return {
                success: true,
                data: workspace,
            };
        } catch (error) {
            throw error;
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

    // workspace.service.ts

    async isWorkspaceMember(
        workspaceId: string,
        userId: string
    ): Promise<boolean> {
        return this.workspaceRepo.isWorkspaceMember(
            workspaceId,
            userId
        );
    }
}