import { Router } from "express";
import { forgotPasswordHandler } from "../controller/forgotPassword.controller";

const router = Router();

router.post("/", forgotPasswordHandler);

export default router;