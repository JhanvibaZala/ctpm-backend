import { CreateTaskDto } from "../dto/create-task.dto";
import { addComment } from "../dto/add-comment.dto";
import { TaskService } from "../services/tasks.service";
import { CommentService } from "../services/comments.service";

// export const list = async (req: AuthRequest, res: Response) => {

//     const comment_text =req.body.comment;
//     const taskId = (req.params.taskId) as string;
//     try {
//         console.log("Now we can add our comment ");
        
//         const commentService = new CommentService();


//             const dto: addComment={
//                 task_id:taskId,
//                 user_id:req.user.id,
//                 comment_text:comment_text
//             }

//         const isCreated = await commentService.insertServiceComment(dto);
//         if(!isCreated) {
//             return res.status(400).json({
//                 success: true,
//                 message: "failed to add comment!"
//             })
//         }
        
//         return res.status(200).json({
//             success: true,
//             message: "comment added successfully."
//         })

//     } catch (error) {
//         console.log(error);
//         // Never send raw err.message to the frontend in a 500 crash
//         return res.status(500).render("auth/login", {
//             error: "Something went wrong on our end. Please try again.",
//             form: { data: req.body }
//         });
//     }
// }

import { Request, Response, NextFunction } from 'express';
import { ICommentService } from '../interfaces/comment.interface';
import { AppError } from '../services/comments.service';
import { AuthRequest } from "../../../common/interfaces/AuthRequest.interface";

/**
 * CommentController
 *
 * Thin HTTP layer — no business logic here.
 * Responsibilities:
 *   1. Extract validated inputs from req
 *   2. Call the service
 *   3. Map service result → HTTP response
 *   4. Forward unexpected errors to Express error handler
 */
export class CommentController {
  constructor(private readonly commentService: ICommentService) {}

  // ── GET /tasks/:taskId/comments ───────────────────────────────
  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const  taskId = req.params.taskId as string;
      const { page, limit } = req.query as { page?: string; limit?: string };

      const result = await this.commentService.list(taskId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  // ── POST /tasks/:taskId/comments ──────────────────────────────
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const  taskId  = req.params.taskId as string;
      const { comment_text } = req.body;

      const comment = await this.commentService.create(
        taskId,
        req.user.id,
        { comment_text }
      );

      res.status(201).json({
        status: 'success',
        data: comment,
      });
    } catch (err) {
      next(err);
    }
  };

  // ── PATCH /tasks/:taskId/comments/:commentId ──────────────────
  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const  commentId  = req.params.commentId as string;
      const { comment_text } = req.body;

      const comment = await this.commentService.update(
        commentId,
        req.user.id,
        { comment_text }
      );

      res.status(200).json({
        status: 'success',
        data: comment,
      });
    } catch (err) {
      next(err);
    }
  };

  // ── DELETE /tasks/:taskId/comments/:commentId ─────────────────
  remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const  commentId  = req.params.commentId as string;

      const actorRole = req.taskMembership?.role_name ?? 'Contributor';

      await this.commentService.remove(commentId, req.user.id, actorRole);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
  
}