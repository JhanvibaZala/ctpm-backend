// src/middlewares/authorize.middleware.ts

import { NextFunction, Response } from "express";
import { AuthRequest } from "../common/interfaces/AuthRequest.interface";

export function authorize(permission: string) {
    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {

        if (!req.permissions) {
            return res.status(403).json({
                success: false,
                message: "Permissions not loaded."
            });
        }

        if (!req.permissions.includes(permission)){
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action."
            });
        }

        next();
    };
}