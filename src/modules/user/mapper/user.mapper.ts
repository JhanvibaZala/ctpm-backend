import { ICurrentUser, ICurrentUserReponse } from "../interfaces/user.interface";

export class UserMapper {
    static toUser(data: ICurrentUserReponse): ICurrentUser {
        return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email_id,
            username: data.username,
            profilePicPath: data.profile_pic_path,
        }
    }
}