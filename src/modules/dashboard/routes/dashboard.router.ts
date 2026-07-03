import { Router } from "express";
import { showWrokspaces, showProjects, getUser, showDashboard } from "../controller/dashboard.controller";
import { showViewProfile, showEditProfile, updateUserProfile } from "../controller/profile.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import multer, { FileFilterCallback, Multer } from "multer"
import path from "path";
import { getProjectByworkspaceId } from "../../projects/controller/project.controller";
import checkWorkspacePermission from "../../../middlewares/workspacePermCheck.middleware";
import checkProjectPermission from "../../../middlewares/projectPermCheck.middleware";

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, path.join(__dirname, "../../../../public/images/user_profile"))
    },
    filename(req, file, callback) {
        callback(null, file.originalname)
    }
})

const fileFilter = (req : Express.Request, file : Express.Multer.File, callback : FileFilterCallback) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error("Only image files are allowed."));
    }
};

const upload = multer({ storage,fileFilter,limits : {fileSize : 5 * 1024 * 1024} })

const router = Router()

router.get("/workspaces",showWrokspaces)
router.get("/test_dashboard", showWrokspaces)
router.get("/profile", showViewProfile)
router.get("/profile/edit",showEditProfile)
router.get("/getuser", getUser) //get the user for sidebar
router.post("/profile/update", upload.single("profile_picture"), updateUserProfile)
// router.get("/profile",showProfile)
// router.get("/projects/:id",showProjects)
export default router;

