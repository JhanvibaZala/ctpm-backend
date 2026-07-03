 
import { isValid } from "zod/v3";
import {commonRepository} from "../repository/commonRepository"
export class commonService {
    private commonRepo = new commonRepository;

    async checkManager(user_id:string,workspace_id:string,managerRole_id:number,adminRole_id:number){
        try{
            const result = await this.commonRepo.checkManagerRole(user_id,workspace_id,managerRole_id,adminRole_id);

            let isvalid = true;

            if(result[0] && result[0][0] && result[0][0].length == 0){
                isvalid = false;
            }
            
            return isvalid;
        
        }catch(err){
            console.log(err);
        }
    }
}