export interface Iproject{
    project_id?:string,
    workspace_id?: string,
    project_name?: string,
    description?: string,
    priority_level?: string,
    status?:string,
    visibility?:string,
    deadline_at: Date,
}
export interface IprojectMEmber{
    project_id?:string,
    user_id?:string,
    role_id?:number
}

export interface IProjectTaskStatus{
    project_id?:string,
    text?:string,
    level?:string,
}