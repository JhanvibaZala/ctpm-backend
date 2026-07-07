import { RowDataPacket } from "mysql2";

export interface IWorkspace {
    id: string;
    workspaceName: string;
    description?: string;
    ownerId: string;
}

export interface ICreateWorkspaceMember{
    workspaceId:string;
    userId:string;
    roleId:number;
    addedBy: string;
}

export interface Workspace {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: Date;
    totalMembers: number;

    member: {
        roleId: number;
        joinedAt: Date;
        addedBy: string;
    };
}
          
export interface AddWorkspaceMember {
    workspaceId: string;
    userId: string;
    roleId: number;
    addedBy: string;

}

export interface WorkspaceDetails {
    id: string;
    workspaceName: string;
    description: string;
    role: string;
    totalMembers: number;
    totalProjects: number;
    totalTasks: number;
    createdAt: string;
}