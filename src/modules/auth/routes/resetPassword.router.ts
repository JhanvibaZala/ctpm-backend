import { Router } from "express";
import { showResetPasswordPage, resetPasswordHandler } from "../controller/resetPassword.controller";
import { Routes } from "../../../common/interfaces/index.interface";


const router = Router();

router.get("/", showResetPasswordPage);
router.post("/", resetPasswordHandler);


export default router;