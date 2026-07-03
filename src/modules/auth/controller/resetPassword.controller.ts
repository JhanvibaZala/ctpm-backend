import { Request, Response } from "express";
import { LoginService } from "../services/login.service";
import { IResetPassword } from "../interfaces/reset_obj.interface";

// reset password page
export const showResetPasswordPage = async (req:Request, res: Response) => {
    return res.status(200).render("auth/resetPassword");
}

// reset password 
export const resetPasswordHandler = async (req: Request, res: Response) => {
    const passwords = req.body;
    try {
        const loginService = new LoginService();
        if(!req.cookies.resetToken) {
            return res.status(400).render("auth/resetPassword", {
                errors: "Reset token expired, forgot password again",
            });
        }
        const obj: IResetPassword = {
            token: req.cookies.resetToken, 
            password: passwords.password, 
            confirmPassword: passwords.confirmPassword
        }
        const resetPassword = await loginService.resetPassword(obj);
        if(!resetPassword.success) {
            return res.status(400).render("auth/resetPassword", {
                errors: resetPassword.errors
            });
        }
        res.clearCookie('resetToken');
        return res.status(200).redirect("/login")
        
    } catch (error: any) {
        console.log(error);
        // Generic Server Error
        return res.status(500).render("auth/register", { 
            errors: "Something went wrong on our end."
        });
    }

}