import { Router } from "express";
import { otpHandler, resendOTP} from "../controller/otp.controller";

const router = Router();

router.post("/", otpHandler);
router.post("/resend-otp", resendOTP);

export default router;