import { Request, Response } from "express";

export const showGmailPage = async (req: Request, res: Response) => {
    const otp = req.params.otp;
    // console.log(otp)
    return res.status(200).render("auth/emailPage", {
        otp
    })
}