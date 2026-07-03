import { NextFunction, Request, Response } from "express";
import { TasksRepository } from "../modules/tasks/repository/tasks.repository";
import { ICheckIds } from "../modules/tasks/interfaces/ws-project-id.interface";

export const validateProjectAccess = async (req:Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.params.workspaceId;
        const projectId = req.params.projectId;


        if(!workspaceId || !projectId){

            return res.status(400).json({
                success:false,
                message:"Workspace id or project id missing"
            });

        }

        if(
            typeof workspaceId !== "string" ||
            typeof projectId !== "string"
        ){
            return res.status(400).json({
                success:false,
                message:"Invalid ids"
            });
        }


        const taskRepo = new TasksRepository();

        const obj: ICheckIds = {
            workspaceId: workspaceId,
            projectId: projectId
        }
        const exists = await taskRepo.validateIds(obj);

        // check
        if(!exists) {
            return res.status(400).json({
                success: false,
                message: "Project doesn't belong to this workspace"
            })
        }
        next();
    } catch (error) {
        return res.status(404).json({
            success:false,
            message:"Project does not belong to this workspace"
        });
    }
}