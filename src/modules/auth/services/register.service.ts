import { RegisterRepository } from "../repository/register.repository";
import bcrypt from "bcrypt"
import { IUser } from '../interfaces/user_obj.interface'
import { validateEmail, validateName, validatePassword, validateUsername } from "../validation/validations";
import { IUserDto } from "../dto/register.dto";
import { v4 as uuidv4 } from "uuid";


export class RegisterService {
    private registerRepo = new RegisterRepository();

    // check the credentials of user
    async executeRegistration(userObj: IUserDto) {
        try {
            const errors: {
                field: keyof IUserDto;
                message: string | null
            }[] = [];

            const isFirstNameValid = await validateName(userObj.firstName || "");
            if (!isFirstNameValid.isValid) {
                errors.push({ field: "firstName", message: isFirstNameValid.message });
            }

            const isLastNameValid = await validateName(userObj.lastName || "");
            if (!isLastNameValid.isValid) {
                errors.push({ field: "lastName", message: isLastNameValid.message });
            }

            const isUsernameValid = await validateUsername(userObj.username || "");
            if (!isUsernameValid.isValid) {
                errors.push({ field: "username", message: isUsernameValid.message });
            }

            const isEmailValid = await validateEmail(userObj.email || "");
            if (!isEmailValid.isValid) {
                errors.push({ field: "email", message: isEmailValid.message });
            }

            const isPasswordValid = await validatePassword(userObj.password || "");
            if (!isPasswordValid.isValid) {
                errors.push({ field: "password", message: isPasswordValid.message });
            }

            if (errors.length > 0) {
                return { success: false, errors };
            }

            return { success: true };
        } catch (error) {
            console.log(error)
            throw error;
        }
    }

    // add database
    async createUser(userObj: IUserDto) {
        try {
            // hash password
            const hashedPassword = await bcrypt.hash(userObj.password, 10);

            const user: IUser = {
                id: uuidv4(),
                firstName: userObj.firstName,
                lastName: userObj.lastName,
                email: userObj.email,
                username: userObj.username,
                hashedPassword: hashedPassword,
            }
            const addUser = await this.registerRepo.insertUser(user);
            if(!addUser) {
                return {success: false}
            }
            return {success: true}
        } catch (error) {
            console.log(error)
            throw error;
        }
    }

}