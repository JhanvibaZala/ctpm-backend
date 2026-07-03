import { Router } from 'express';
import { Pool } from 'mysql2/promise';
import { CommentController } from '../contoller/comments.controller';
import { CommentService } from '../services/comments.service';
import { CommentRepository } from '../repository/comments.repository';
import { MentionService } from '../services/mention.service';
import { NotificationService } from '../services/notification.service';
import { ActivityService } from '../services/activity.service';
import authMiddleware from '../../../middlewares/auth.middleware';
import { resolveTask } from '../../../middlewares/resolveTask.middleware';
import { validate } from '../../../middlewares/validate.middleware';
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  listCommentsSchema,
} from '../schema/comment.schema';

/**
 * createCommentRouter
 *
 * Factory function — receives the DB pool and external service
 * dependencies (ws push, job queues) and wires up the full DI chain.
 *
 * All routes are scoped under /tasks/:taskId/comments.
 * Mount with: app.use('/tasks', createCommentRouter(db, deps))
 */
export function createCommentRouter(
  db: Pool,
  deps: {
    wsPush: (userId: string, event: object) => void;
    enqueueEmail: (data: object) => Promise<void>;
    enqueueSlack: (data: object) => Promise<void>;
  }
): Router {
  const router = Router({ mergeParams: true });

  // ── Dependency injection chain ─────────────────────────────
  const commentRepo    = new CommentRepository(db);
  const mentionSvc     = new MentionService(db);
  const activitySvc    = new ActivityService(db);
  const notificationSvc = new NotificationService(
    db,
    deps.wsPush,
    deps.enqueueEmail,
    deps.enqueueSlack
  );
  const commentSvc = new CommentService(
    commentRepo,
    mentionSvc,
    notificationSvc,
    activitySvc
  );
  const controller = new CommentController(commentSvc);

  // ── Middleware stack applied to all routes below ───────────
  // authenticate  → verify JWT, attach req.user
  // resolveTask   → verify task exists + user has access, attach req.task
  router.use(authMiddleware, resolveTask);

  // ── GET /tasks/:taskId/comments ────────────────────────────
  router.get(
    '/',
    validate(listCommentsSchema),
    controller.list
  );

  // ── POST /tasks/:taskId/comments ───────────────────────────
  router.post(
    '/',
    validate(createCommentSchema),
    controller.create
  );

  // ── PATCH /tasks/:taskId/comments/:commentId ───────────────
  router.patch(
    '/:commentId',
    validate(updateCommentSchema),
    controller.update
  );

  // ── DELETE /tasks/:taskId/comments/:commentId ──────────────
  router.delete(
    '/:commentId',
    validate(deleteCommentSchema),
    controller.remove
  );

  return router;
}