import { Router } from "express";
import { forgotPasswordHandler, showForgotPasswordPage } from "../controller/forgotPassword.controller";


const router = Router();


router.get("/", showForgotPasswordPage);
router.post("/", forgotPasswordHandler);


export default router;