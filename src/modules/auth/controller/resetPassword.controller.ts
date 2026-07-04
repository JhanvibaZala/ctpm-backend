import { Request, Response } from "express";
import { LoginService } from "../services/login.service";
import { IResetPassword } from "../interfaces/reset_obj.interface";

// reset password 
export const resetPasswordHandler = async (req: Request, res: Response) => {
    const passwords = req.body;
    try {
        const loginService = new LoginService();
        if(!req.cookies.resetToken) {
            return res.status(400).json({
                success: false,
                message: "Token Expired, retry by forgot password again"
            })
        }
        const obj: IResetPassword = {
            token: req.cookies.resetToken, 
            password: passwords.password, 
            confirmPassword: passwords.confirmPassword
        }
        const resetPassword = await loginService.resetPassword(obj);
        if(!resetPassword.success) {
            return res.status(400).json({
                success: false,
                errors: resetPassword.errors
            });
        }
        res.clearCookie('resetToken');
        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        })
        
    } catch (error: any) {
        console.error(error);
        // Generic Server Error
        return res.status(500).json({
            success: false,
            message: "Internal server error, Please try again later!"
        })
    }

}