import { RowDataPacket } from "mysql2";

export interface ICurrentUserReponse extends RowDataPacket {
    id: string;
    username: string;
    email_id:string;
    first_name: string;
    last_name: string;
    profile_pic_path: string | null;
}

export interface ICurrentUser {
    id: string;
    username: string;
    email:string;
    firstName: string;
    lastName: string;
    profilePicPath: string | null;
}