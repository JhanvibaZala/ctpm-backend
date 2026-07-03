import { Router} from "express";
import { RegisterController } from "../controller/register.controller";
const router = Router()

router.post("/", RegisterController)

export default router