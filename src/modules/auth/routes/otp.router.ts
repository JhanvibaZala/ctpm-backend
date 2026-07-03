import { Router } from "express";
import { otpHandler, showOtpPage , resendOTP} from "../controller/otp.controller";

const router = Router();

router.get("/", showOtpPage);
router.post("/", otpHandler);
router.post("/resend-otp", resendOTP);

export default router;