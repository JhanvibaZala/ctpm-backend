import { Router} from "express";
import { handleRegister } from "../controller/register.controller";
const router = Router()

router.post("/", handleRegister)

export default router