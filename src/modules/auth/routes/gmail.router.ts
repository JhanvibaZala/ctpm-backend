import { Router } from "express";
import { showGmailPage } from "../controller/gmail.controller";


const router = Router();

router.get("/:otp", showGmailPage)

export default router;