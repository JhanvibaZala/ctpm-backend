import { LoginRepository } from "../repository/login.repository";
import bcrypt from "bcrypt"
import {v4 as uuidv4, v4} from "uuid"
import { OtpRepository } from "../repository/otp.repository";
import { validatePassword } from "../validation/validations";
import { verifyResetToken } from "../../../utils/jwt.utils";
import { IResetPassword } from "../interfaces/reset_obj.interface";

export class LoginService { 
    private loginRepo = new LoginRepository();
    private otpRepo = new OtpRepository();

    // check the credentials of user
    async authenticateUser(email: string, password: string) {
        try {
            const user_details = await this.loginRepo.findUserByEmail(email);

            if(user_details.length === 0) {
                return null 
            }
            
            // check password
            const validPassword = await bcrypt.compare(password, (user_details as any)[0].hashed_password);
            if(!validPassword) {
                return null
            }

            return user_details[0];

        } catch (error) {
           console.error(error)
            throw error;
        }
    }
    async getUserByEmail(email:string){
        try{
            const user_details = await this.loginRepo.findUserByEmail(email);
              if(user_details.length < 1) {
                return []
            }
            return [user_details];

        }catch (error) {
           console.error(error)
            throw error;
        }
    }


    // In LoginService — change check_email to return the user row
    async findUserByEmail(emailOrUsername: string): Promise<{ email_id: string } | null> {
        return await this.loginRepo.findByEmailOrUsername(emailOrUsername);
    }


    // create otp for user using email id 
    async createOtp(email: string, hashedOtp: string, sessionId: string) {
        try {
            await this.otpRepo.deleteOtpByEmail(email);
            // generate uuid
            const otpId = v4();
            return await this.otpRepo.addOtp(otpId, email, hashedOtp, sessionId);
        } catch (error) {
           console.error(error);
            throw error;
        }
    }
    
    // check otp is correct or not
    async verifyOtp(email: string, otp: string) : Promise<Boolean> {
        try {
            // check if otp exists for the email
            const otpRow = await this.otpRepo.checkOtp(email);
            if(!otpRow) return false;
            
            // check if the otp is correct or not
            const isOtpCorrect = await bcrypt.compare(otp, otpRow.hashed_otp);
            const otpExpiration = new Date(otpRow.expires_at);
            const now = new Date();
            if(!isOtpCorrect || now > otpExpiration) {
                return false;
            }
            return true;
            
        } catch (error) {
           console.error(error);
            throw error;
        }
    }

    // for rate limiting check in resend
    async countRecentOtps(email: string): Promise<number> {
        try {
            return await this.otpRepo.countRecentOtps(email);
        } catch (error) {
            throw error;
        }
    }

    // check if passwords match
    async resetPassword(reset_obj: IResetPassword) {
        try {
            const errors = [];
            if(!reset_obj.password || !reset_obj.confirmPassword) {
                errors.push("Password and confirm Password are required!");
            }

            const isPasswordValid = await validatePassword(reset_obj.password || "");
            if(!isPasswordValid.isValid) {
                errors.push({field: "password", message: isPasswordValid.message});
            }
            
            const isConfirmPasswordValid = await validatePassword(reset_obj.confirmPassword || "");
            if(!isConfirmPasswordValid.isValid) {
                errors.push({field: "confirmPassword", message: isConfirmPasswordValid.message});
            }

            if(reset_obj.password !== reset_obj.confirmPassword) {
                errors.push({field: "confirmPassword", message: "Passwords do not match!"});
            }

            if(errors.length > 0) {
                return {success: false, errors};
            }

            // verify token 
            const decoded: any = verifyResetToken(reset_obj.token || "");

            // get user
            const user: any = await this.loginRepo.findUserByEmail(decoded.email);

            // compare the old password
            const isSame = await bcrypt.compare(reset_obj.password || "", user[0].hashed_password);
            if(isSame) {
                return {success: false, errors : [
                    {
                        field:"password",
                        message: "Password is same as old password"
                    }]
                }
            }

            // hash password and save in database
            const hashedPassword = await bcrypt.hash(reset_obj.password || "", 10);
            const setNewPassword = await this.loginRepo.resetPassword(decoded.email, hashedPassword);

            if(!setNewPassword) {
                return {success: false, errors: [
                    {
                        field:"password",
                        message: "failed to reset password!"
                    }]
                };
            }
            return {success: true};

        } catch (error) {
           console.error(error);
            throw error;
        }
    }

}