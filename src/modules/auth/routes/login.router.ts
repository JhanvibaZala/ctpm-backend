import { Router } from "express";
import { getUserDetails, loginUser } from "../controller/login.controller";


const router = Router();

router.post("/", loginUser)
router.get("/checkUser/:email", getUserDetails)

export default router;