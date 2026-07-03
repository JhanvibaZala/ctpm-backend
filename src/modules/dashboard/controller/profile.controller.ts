import { Request, Response } from "express";
// import { Request } from "../../../common/interfaces/Request.interface";
import { LoginRepository } from "../../auth/repository/login.repository";
import { IUser } from "../../auth/interfaces/user_obj.interface";
import { UserProfileRepo } from "../repository/userProfileRepo";
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";

export async function showViewProfile(req: AuthRequest, res: Response) {
  try {
    const workspace_id: string = req.params.workspaceId as string;
    console.log("this is wid",workspace_id)
    const loginRepo = new LoginRepository();
    const mail = req.user.email;
    const rows = await loginRepo.fetchUserDetails(mail);

    if (rows.length < 1) {
      return res.status(401).render("auth/login", {
        error: "Invalid email or password.",
        form: { mail },
      });
    }
    const error = req.flash("profile_error");
    console.log(error);
    return res.render("dashboard/view_profile", {
      workspace_id,
      user: rows[0],
      error: error.length > 0 ? error[0] : null,
    });
  } catch (error) {
    console.log("Error displaying the view profile", error);
    return res.status(401).render("auth/login", {
      error: "Invalid email or password.",
    });
  }
}

export async function showEditProfile(req: AuthRequest, res: Response) {
  try {
    const loginRepo = new LoginRepository();
    const mail = req.user.email;
    const rows = await loginRepo.fetchUserDetails(mail);

    if (rows.length < 1) {
      return res.status(401).render("auth/login", {
        error: "Invalid email or password.",
        form: { mail },
      });
    }

    return res.render("dashboard/edit_profile", { user: rows[0] });
  } catch (error) {
    console.log("Error displaying the view profile", error);
    return res.status(401).render("auth/login", {
      error: "Invalid email or password.",
    });
  }
}

//update user profile
export async function updateUserProfile(req: AuthRequest, res: Response) {
  try {
    console.log("update profile");
    console.log(req.body);
    const user = req.body as IUser;

    const userProfileRepo = new UserProfileRepo();
    if (req.file) {
      console.log(req.file);
      const profile_pic_path = "/images/user_profile/" + req.file.originalname;
      user.profile_pic_path = profile_pic_path;
    }
    user.id = req.user.id;
    const result = await userProfileRepo.updateUser(user);
    console.log("profile update successfully");
    res.redirect("/dashboard/profile");
  } catch (err) {
    console.log("error in update profile : ", err);
    req.flash("profile_error", "something went wrong to update your profile");
    return res.redirect("/dashboard/profile");
  }
}
