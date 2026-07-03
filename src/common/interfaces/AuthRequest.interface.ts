import { Request } from 'express';
import { AuthUser } from './AuthUser.interface';

// export interface AuthRequest extends Request {
//   user?: any;
//   file?: any;
// }



export interface AuthRequest extends Request {
    user: AuthUser;
    taskMembership: { role_name: string } | null;
}

// Extend Express Request type
// declare global {
//   namespace Express {
//     interface Request {
//       user: AuthUser;
//       file?: any;
//       task: {
//         id: string;
//         project_id: string;
//         status: string;
//         is_deleted: boolean;
//         parent_id: string | null;
//         task_name: string;
//       };
//       taskMembership: { role_name: string } | null;
//     }
//   }
// }