interface IUser {
    id?: string;
    firstName: string,
    lastName: string,
    username: string,
    hashedPassword:string,
    email:string,
    bio?:string,
    profilePicPath?:string
}

export {type IUser}