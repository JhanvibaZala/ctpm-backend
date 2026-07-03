
import { IAddComments, ICreateTasks } from "../interfaces/tasks.interface";
import { TasksRepository } from "../repository/tasks.repository";
// import { CommentsRepository } from "../repository/comments.repository";
import { CreateTaskDto } from "../dto/create-task.dto";
import { addComment } from "../dto/add-comment.dto";

// export class CommentService {
//     private commentsRepo = new CommentsRepository();

//     async insertServiceComment(dto: addComment) {
//         try {

//             // // make uuid
//             const commentId = uuidv4();
//             const obj: IAddComments = {
//                 id: commentId,
//                 taskId : dto.task_id,
//                 userId : dto.user_id,
//                 commentText : dto.comment_text
//             }


//             const insertComment= await this.commentsRepo.insertComment(obj);
//             return insertComment;

//         } catch (error) {
//             console.error("error in comment service!");
//             throw error;
//         }
//     }
// }


import { v4 as uuidv4 } from 'uuid';
import {
  ICommentService,
  ICommentRepository,
  CommentWithAuthor,
  PaginatedComments,
  CreateCommentDTO,
  UpdateCommentDTO,
  CommentListQuery,
} from '../interfaces/comment.interface';
import { MentionService } from './mention.service';
import { NotificationService } from './notification.service';
import { ActivityService } from './activity.service';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class CommentService implements ICommentService {
  constructor(
    private readonly repo: ICommentRepository,
    private readonly mentionService: MentionService,
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService
  ) {}

  // ─── List ─────────────────────────────────────────────────────

  async list(
    task_id: string,
    query: CommentListQuery
  ): Promise<PaginatedComments> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const { rows, total } = await this.repo.findByTaskId(task_id, page, limit);

    return {
      data: rows,
      total,
      page,
      limit,
      has_next: page * limit < total,
    };
  }

  // ─── Create ───────────────────────────────────────────────────

  async create(
    task_id: string,
    actor_id: string,
    dto: CreateCommentDTO
  ): Promise<CommentWithAuthor> {
    const id = uuidv4();

    // 1. Persist the comment row
    await this.repo.create({ id, task_id, user_id: actor_id, comment_text: dto.comment_text });

    // 2. Mention pipeline — parse → resolve → INSERT → notify
    await this.handleMentions({
      comment_id: id,
      task_id,
      actor_id,
      text: dto.comment_text,
      mode: 'create',
    });

    // 3. Immutable activity log entry
    await this.activityService.log({
      task_id,
      actor_id,
      event_type: 'comment_added',
      new_value: id, // store comment_id for reference
    });

    // 4. Return the full comment with author join
    const created = await this.repo.findByTaskId(task_id, 1, 1);
    const fresh = await this.findOneWithAuthor(id, task_id);
    return fresh;
  }

  // ─── Update ───────────────────────────────────────────────────

  async update(
    comment_id: string,
    actor_id: string,
    dto: UpdateCommentDTO
  ): Promise<CommentWithAuthor> {
    // 1. Verify the comment exists and is not deleted
    const existing = await this.repo.findById(comment_id);
    if (!existing) {
      throw new AppError(404, 'Comment not found');
    }

    // 2. Only the author can edit
    const isAuthor = await this.repo.isAuthor(comment_id, actor_id);
    if (!isAuthor) {
      throw new AppError(403, 'Only the comment author can edit this comment');
    }

    // 3. Update the row
    await this.repo.update(comment_id, dto.comment_text);

    // 4. Mention diff — only notify NEW mentions, delete removed ones
    await this.handleMentions({
      comment_id,
      task_id: existing.task_id,
      actor_id,
      text: dto.comment_text,
      mode: 'edit',
    });

    // 5. Activity log
    await this.activityService.log({
      task_id: existing.task_id,
      actor_id,
      event_type: 'comment_edited',
      old_value: comment_id,
    });

    return this.findOneWithAuthor(comment_id, existing.task_id);
  }

  // ─── Remove ───────────────────────────────────────────────────

  async remove(
    comment_id: string,
    actor_id: string,
    actor_role: string
  ): Promise<void> {
    const existing = await this.repo.findById(comment_id);
    if (!existing) {
      throw new AppError(404, 'Comment not found');
    }

    const isAuthor = await this.repo.isAuthor(comment_id, actor_id);
    const isManager = actor_role === 'Manager';

    if (!isAuthor && !isManager) {
      throw new AppError(
        403,
        'Only the comment author or a Project Manager can delete this comment'
      );
    }

    // Soft delete — never hard delete (activity log refs this row)
    await this.repo.softDelete(comment_id);

    await this.activityService.log({
      task_id: existing.task_id,
      actor_id,
      event_type: 'comment_deleted',
      old_value: comment_id,
    });
  }

  // ─── Private helpers ──────────────────────────────────────────

  private async handleMentions(opts: {
    comment_id: string;
    task_id: string;
    actor_id: string;
    text: string;
    mode: 'create' | 'edit';
  }): Promise<void> {
    const { comment_id, task_id, actor_id, text, mode } = opts;

    const usernames = this.mentionService.parse(text);
    const resolved = await this.mentionService.resolve(usernames, actor_id);
    const freshUserIds = resolved.map((u) => u.user_id);

    if (mode === 'create') {
      // All mentions are new — insert + notify all
      await this.repo.insertMentions(comment_id, freshUserIds);
      await this.notifyMentions(resolved, actor_id, task_id, comment_id);
    } else {
      // Edit — diff old vs new
      const existingUserIds = await this.repo.getMentionedUserIds(comment_id);
      const { toAdd, toRemove } = this.mentionService.diff(existingUserIds, freshUserIds);

      await this.repo.insertMentions(comment_id, toAdd);
      await this.repo.deleteMentions(comment_id, toRemove);

      // Only notify the newly added mentions — never re-notify existing
      const newlyMentioned = resolved.filter((u) => toAdd.includes(u.user_id));
      await this.notifyMentions(newlyMentioned, actor_id, task_id, comment_id);
    }
  }

  private async notifyMentions(
    users: { user_id: string; username: string }[],
    actor_id: string,
    task_id: string,
    comment_id: string
  ): Promise<void> {
    await Promise.allSettled(
      users.map((u) =>
        this.notificationService.push({
          type: 'comment_mention',
          to_user_id: u.user_id,
          actor_id,
          task_id,
          payload: { comment_id },
        })
      )
    );
  }

  // Re-fetch a single comment with author join after write
  private async findOneWithAuthor(
    comment_id: string,
    task_id: string
  ): Promise<CommentWithAuthor> {
    // Fetch page 1 and filter — in production replace with a findByIdWithAuthor repo method
    const { rows } = await this.repo.findByTaskId(task_id, 1, 1000);
    const found = rows.find((r) => r.id === comment_id);
    if (!found) throw new AppError(500, 'Failed to retrieve comment after write');
    return found;
  }
}