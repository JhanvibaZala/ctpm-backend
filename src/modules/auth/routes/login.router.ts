import { Router } from "express";
import { getUserDetails, login_user, showLoginPage } from "../controller/login.controller";
import { Routes } from "../../../common/interfaces/index.interface";


const router = Router();

router.get("/", showLoginPage)
router.post("/", login_user)
router.get("/checkUser/:email", getUserDetails)

export default router;