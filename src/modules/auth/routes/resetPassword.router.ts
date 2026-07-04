import { Router } from "express";
import { resetPasswordHandler } from "../controller/resetPassword.controller";

const router = Router();

router.post("/", resetPasswordHandler);


export default router;