import { Router } from "express"
import { handleCurrentUser } from "../controller/user.controller";

const router = Router();

router.get("/", handleCurrentUser);

export default router;
