import { Request, Response } from "express";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";
import { TeamMemberRepo } from "../repository/teamMember.repository";

export async function getInviteTeamMember(req : AuthRequest, res : Response) {
    try{
        const userid = req.user.id;

        if(!userid) return res.status(401).json({message : "invalid access"})

        const teamMemberRepo = new TeamMemberRepo()

        const teamList = await teamMemberRepo.getTeamMember(userid)

        return res.status(200).json({teamList})
        
    }catch(err){
        console.log(err)
        return res.status(500).json({message : "something went wrong"})
    }
}