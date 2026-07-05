import { MeRepository } from "../repository/user.repository";

export class MeService {
    private meRepo = new MeRepository();

    async getCurrentUser (userId:string) {
        try {
            const user = await this.meRepo.getCurrentUser(userId);
            if(!user) {
                return null;
            }
            return user;
        } catch (error) {
            console.error(error)
            return null;
        }
    }
}