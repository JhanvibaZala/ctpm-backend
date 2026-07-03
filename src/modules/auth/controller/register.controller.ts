import { Request, Response } from "express";
import { IUser } from "../interfaces/user_obj.interface";
import { RegisterService } from "../services/register.service";
import { IUserDto } from "../dto/register.dto";

export async function RegisterController(req: Request, res: Response) {
    const userObj = req.body as IUserDto; // Extract this early so the catch block can use it

    try {
        const registerService = new RegisterService();
        const validateRegister = await registerService.executeRegistration(userObj);

        if (!validateRegister.success) {
            return res.status(400).json({
                success: false,
                errors: validateRegister.errors,
            });
        }

        // add user to db
        const isUserCreated = await registerService.createUser(userObj);
        if (!isUserCreated.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to create account, please try again later",
            });
        }

        // Success
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (err: any) {
        if (err.errno === 1062) {
            if (err.message.includes("email")) {
                return res.status(409).json({
                    success: false,

                    errors: [
                        {
                            field: "email",

                            message: "Email already exists",
                        },
                    ],
                });
            }

            if (err.message.includes("username")) {
                return res.status(409).json({
                    success: false,

                    errors: [
                        {
                            field: "username",

                            message: "Username already exists",
                        },
                    ],
                });
            }
        }

        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
