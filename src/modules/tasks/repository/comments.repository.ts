import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ICreateTasks ,IAddComments } from "../interfaces/tasks.interface";
import db from "../../../config/dbconfig";
import { ICreateAttachments } from "../interfaces/attachments.interface";


// export class CommentsRepository {
//     // creates a task in DB 
//     async insertComment(comment: IAddComments): Promise<boolean> {
//         try {
//             const sql = `insert into task_comments(id, task_id, user_id, comment_text, is_deleted , edited_at) values(?, ?, ?, ?, ?, ?);`
//             const values = [
//                 comment.id, 
//                 comment.taskId, 
//                 comment.userId, 
//                 comment.commentText, 
//                 comment.isDeleted ?? null,
//                 comment.editedAt ?? null
//             ];
//             const [result] = await db.execute<ResultSetHeader>(sql, values);
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.log("failed to add comment");
//             throw error;
//         }
//     }
// }


import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import {
  ICommentRepository,
  Comment,
  CommentWithAuthor,
} from '../interfaces/comment.interface';

export class CommentRepository implements ICommentRepository {
  constructor(private readonly db: Pool) {}

  // ─── Reads ────────────────────────────────────────────────────

  async findById(id: string): Promise<Comment | null> {
    const [rows] = await this.db.query<any[]>(
      `SELECT id, task_id, user_id, comment_text,
              is_deleted, edited_at, created_at
       FROM task_comments
       WHERE id = ? AND is_deleted = 0
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByTaskId(
    task_id: string,
    page: number,
    limit: number
  ): Promise<{ rows: CommentWithAuthor[]; total: number }> {
    const offset = (page - 1) * limit;

    // Total count for pagination metadata
    const [countRows] = await this.db.query<any[]>(
      `SELECT COUNT(*) AS total
       FROM task_comments
       WHERE task_id = ? AND is_deleted = 0`,
      [task_id]
    );
    const total: number = countRows[0].total;

    // Paginated rows joined with author info
    const [rows] = await this.db.query<any[]>(
      `SELECT
         tc.id,
         tc.task_id,
         tc.user_id,
         tc.comment_text,
         tc.is_deleted,
         tc.edited_at,
         tc.created_at,
         u.username        AS author_username,
         u.profile_pic_path AS author_profile_pic,
         (tc.edited_at IS NOT NULL) AS is_edited
       FROM task_comments tc
       JOIN users u ON u.id = tc.user_id
       WHERE tc.task_id = ? AND tc.is_deleted = 0
       ORDER BY tc.created_at ASC
       LIMIT ? OFFSET ?`,
      [task_id, limit, offset]
    );

    return { rows, total };
  }

  // ─── Writes ───────────────────────────────────────────────────

  async create(data: {
    id: string;
    task_id: string;
    user_id: string;
    comment_text: string;
  }): Promise<Comment> {
    await this.db.query(
      `INSERT INTO task_comments
         (id, task_id, user_id, comment_text, is_deleted, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [data.id, data.task_id, data.user_id, data.comment_text]
    );

    // Return the fresh row
    const created = await this.findById(data.id);
    if (!created) throw new Error('Comment insert failed');
    return created;
  }

  async update(id: string, comment_text: string): Promise<Comment> {
    await this.db.query(
      `UPDATE task_comments
       SET comment_text = ?, edited_at = CURRENT_TIMESTAMP
       WHERE id = ? AND is_deleted = 0`,
      [comment_text, id]
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error('Comment update failed');
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE task_comments SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
  }

  // ─── Auth helpers ─────────────────────────────────────────────

  async isAuthor(comment_id: string, user_id: string): Promise<boolean> {
    const [rows] = await this.db.query<any[]>(
      `SELECT 1 FROM task_comments
       WHERE id = ? AND user_id = ? AND is_deleted = 0
       LIMIT 1`,
      [comment_id, user_id]
    );
    return rows.length > 0;
  }

  // ─── Mentions ─────────────────────────────────────────────────

  async insertMentions(comment_id: string, user_ids: string[]): Promise<void> {
    if (!user_ids.length) return;

    const placeholders = user_ids.map(() => '(?, ?)').join(', ');
    const values = user_ids.flatMap((uid) => [comment_id, uid]);

    await this.db.query(
      // INSERT IGNORE handles race conditions and duplicate PKs gracefully
      `INSERT IGNORE INTO comment_mentions (comment_id, mentioned_user)
       VALUES ${placeholders}`,
      values
    );
  }

  async getMentionedUserIds(comment_id: string): Promise<string[]> {
    const [rows] = await this.db.query<any[]>(
      `SELECT mentioned_user FROM comment_mentions WHERE comment_id = ?`,
      [comment_id]
    );
    return rows.map((r) => r.mentioned_user);
  }

  async deleteMentions(comment_id: string, user_ids: string[]): Promise<void> {
    if (!user_ids.length) return;

    const placeholders = user_ids.map(() => '?').join(', ');
    await this.db.query(
      `DELETE FROM comment_mentions
       WHERE comment_id = ? AND mentioned_user IN (${placeholders})`,
      [comment_id, ...user_ids]
    );
  }
}