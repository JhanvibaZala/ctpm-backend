// import { Request,Response,NextFunction } from "express"
// import { AuthRequest } from "../common/interfaces/AuthRequest.interface";
// import { TasksRepository } from "../modules/tasks/repository/tasks.repository";

// export const resolveTaskMiddleware = async (req:AuthRequest,res:Response,next:NextFunction) =>{
//     try {
//         const taskRepo=new TasksRepository();
//         const taskId= (req.params.taskId) as string;
//         console.log(req.user);
//         const members=await taskRepo.getTaskMembers(taskId);
//         console.log(members);  
//         members.forEach(function(user){
//             if(user.email_id === req.user?.email){
//                 next();   
//             }
//         })
         
//     } catch (error) {
//         console.log(error);
//         throw error
//     }
// }

import { Request, Response, NextFunction } from 'express';

/**
 * resolveTask — stub for Dev 2 to work against independently.
 *
 * Dev 1 owns the real implementation. This stub attaches the
 * agreed req.task shape so Dev 2's routes compile and test
 * without depending on Dev 1's branch being merged first.
 *
 * Replace this entire file with Dev 1's real middleware once
 * feature/tasks-core merges into develop.
 *
 * Agreed req.task contract:
 *   { id, project_id, status, is_deleted, parent_id, task_name }
 *
 * Agreed req.taskMembership contract:
 *   { role_name: string } | null
 */
export async function resolveTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { taskId } = req.params;

  // ── STUB — swap for real DB lookup once Dev 1 merges ──────────
  // Real implementation queries:
  //   SELECT pt.*, pm.role_name
  //   FROM project_tasks pt
  //   LEFT JOIN project_members pm
  //     ON pm.project_id = pt.project_id AND pm.user_id = $userId
  //   WHERE pt.id = $taskId AND pt.is_deleted = 0
  //
  // Returns 404 if task not found or soft-deleted.
  // Returns 403 if user is not a project member and not workspace admin.
  // ───────────────────────────────────────────────────────────────

  if (!taskId) {
    res.status(400).json({ status: 'error', message: 'taskId is required' });
    return;
  }

  // Stub passes through — real middleware attaches these
  (req as any).task = {
    id: taskId,
    project_id: 'stub-project-id',
    status: 'Active',
    is_deleted: false,
    parent_id: null,
    task_name: 'Stub task',
  };

  (req as any).taskMembership = {
    role_name: 'Contributor',
  };

  next();
}