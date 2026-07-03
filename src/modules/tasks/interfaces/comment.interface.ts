// ─────────────────────────────────────────────
// Domain entity — mirrors task_comments table
// ─────────────────────────────────────────────
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  comment_text: string;
  is_deleted: boolean;
  edited_at: Date | null;
  created_at: Date;
}

// Row returned to the client — joins author info
export interface CommentWithAuthor extends Comment {
  author_username: string;
  author_profile_pic: string | null;
  is_edited: boolean; // derived: edited_at IS NOT NULL
}

// ─────────────────────────────────────────────
// Request / Response shapes
// ─────────────────────────────────────────────
export interface CreateCommentDTO {
  comment_text: string;
}

export interface UpdateCommentDTO {
  comment_text: string;
}

export interface CommentListQuery {
  page?: number | undefined;     // default 1
  limit?:  number | undefined;    // default 50, max 100
}

export interface PaginatedComments {
  data: CommentWithAuthor[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

// ─────────────────────────────────────────────
// Mention entity — mirrors comment_mentions
// ─────────────────────────────────────────────
export interface CommentMention {
  comment_id: string;
  mentioned_user: string; // user_id
}

export interface ResolvedMention {
  user_id: string;
  username: string;
}

// ─────────────────────────────────────────────
// Repository contract
// All DB access goes through this interface —
// the service never touches the DB directly.
// ─────────────────────────────────────────────
export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findByTaskId(
    task_id: string,
    page: number,
    limit: number
  ): Promise<{ rows: CommentWithAuthor[]; total: number }>;
  create(data: {
    id: string;
    task_id: string;
    user_id: string;
    comment_text: string;
  }): Promise<Comment>;
  update(id: string, comment_text: string): Promise<Comment>;
  softDelete(id: string): Promise<void>;
  isAuthor(comment_id: string, user_id: string): Promise<boolean>;

  // Mentions
  insertMentions(comment_id: string, user_ids: string[]): Promise<void>;
  getMentionedUserIds(comment_id: string): Promise<string[]>;
  deleteMentions(comment_id: string, user_ids: string[]): Promise<void>;
}

// ─────────────────────────────────────────────
// Service contract
// ─────────────────────────────────────────────
export interface ICommentService {
  list(
    task_id: string,
    query: CommentListQuery
  ): Promise<PaginatedComments>;

  create(
    task_id: string,
    actor_id: string,
    dto: CreateCommentDTO
  ): Promise<CommentWithAuthor>;

  update(
    comment_id: string,
    actor_id: string,
    dto: UpdateCommentDTO
  ): Promise<CommentWithAuthor>;

  remove(
    comment_id: string,
    actor_id: string,
    actor_role: string
  ): Promise<void>;
}