import { z } from 'zod';

// ── POST /tasks/:taskId/comments ──────────────
export const createCommentSchema = z.object({
  body: z.object({
    comment_text: z
      .string({ 
        error: (iss) => iss.input === undefined ? 'comment_text is required' : 'Invalid input' 
      })
      .min(1, 'Comment cannot be empty')
      .max(10_000, 'Comment cannot exceed 10,000 characters')
      .trim(),
  }),
  params: z.object({
    taskId: z.string().uuid('taskId must be a valid UUID'),
  }),
});

// ── PATCH /tasks/:taskId/comments/:commentId ──
export const updateCommentSchema = z.object({
  body: z.object({
    comment_text: z
              .string({ 
        error: (iss) => iss.input === undefined ? 'comment_text is required' : 'Invalid input' 
      })
      .min(1, 'Comment cannot be empty')
      .max(10_000, 'Comment cannot exceed 10,000 characters')
      .trim(),
  }),
  params: z.object({
    taskId: z.string().uuid('taskId must be a valid UUID'),
    commentId: z.string().uuid('commentId must be a valid UUID'),
  }),
});

// ── DELETE /tasks/:taskId/comments/:commentId ─
export const deleteCommentSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('taskId must be a valid UUID'),
    commentId: z.string().uuid('commentId must be a valid UUID'),
  }),
});

// ── GET /tasks/:taskId/comments ───────────────
export const listCommentsSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('taskId must be a valid UUID'),
  }),
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 50))
      .pipe(z.number().int().min(1).max(100)),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ListCommentsInput = z.infer<typeof listCommentsSchema>;