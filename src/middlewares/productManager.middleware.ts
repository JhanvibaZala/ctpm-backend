import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../common/interfaces/AuthRequest.interface';
import { Iproject } from '../modules/projects/interfaces/project_obj.interface';
import { commonService } from '../modules/common/services/comman.service';
import { number } from 'zod';

export const managerPermissionMiddileware = async (req:AuthRequest,res:Response,next:NextFunction)=>{
    const user_id = req.user.id;
    const workspace_id =req.params.workspace_id as string;
    const managerRole_id = 3;
    const adminRole_id = 2;
    const middilewareService = new commonService;

    const result = await middilewareService.checkManager(user_id,workspace_id,managerRole_id,adminRole_id);

        
    if (!result){
        const error = "you are not authorized to access";
        res.redirect("/dashboard");
    } 

    next();
}