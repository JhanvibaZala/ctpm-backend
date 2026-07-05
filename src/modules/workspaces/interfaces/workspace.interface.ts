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

          