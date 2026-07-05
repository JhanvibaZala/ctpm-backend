import { Response } from "express";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";
import { MeService } from "../services/user.service";

export async function handleCurrentUser(req:AuthRequest, res: Response) {
    try {
        const userId = req.user.id;

        // call service
        const meService = new MeService();
        const user = await meService.getCurrentUser(userId);
        if(user == null) {
            return res.status(400).json({
                success: false,
                message: "Failed to fetch user details"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Fetched the user details successfully",
            data: user
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}