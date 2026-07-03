import {WorkspacesRepository} from "../repository/workspaces.repository"
import {Iworkspace , IworkMember} from "../interfaces/workspace_obj.interface"

export class workspaceService{
    private workspaceRepo = new WorkspacesRepository;

    async createWorkspace(workspace_obj:Iworkspace){
        try{
            const result = await this.workspaceRepo.insertWorkspace(workspace_obj);
          
            return result ;

          } catch (error) {
            console.log(error)
            throw error;
        }
    }
    async insertWorkspaceMember(workspace_id:string,user_id:string,role_id:number){
        try{
            const checkMember = await this.workspaceRepo.checkWorkMember(workspace_id,user_id);
          
            if(checkMember[0] && checkMember[0][0] && checkMember[0][0].length > 0){

                return null;
            }else{   

                const result = await this.workspaceRepo.insertWorkMember(workspace_id,user_id,role_id);
                return result
            }
        }catch (error) {
            console.log(error)
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