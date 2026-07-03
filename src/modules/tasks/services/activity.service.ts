import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export type ActivityEventType =
  // Dev 2 owns these:
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'file_uploaded'
  | 'file_deleted'
  // Dev 1 owns these (listed for reference):
  | 'status_changed'
  | 'assignee_added'
  | 'assignee_removed'
  | 'priority_changed'
  | 'due_date_changed';

export interface ActivityLogEntry {
  task_id: string;
  actor_id: string;
  event_type: ActivityEventType;
  old_value?: string | null;
  new_value?: string | null;
}

/**
 * ActivityService
 *
 * Append-only log writer. Both Dev 1 and Dev 2 call ActivityService.log().
 * Neither dev touches task_activity_log directly.
 *
 * Rules:
 * - No UPDATE, no DELETE, no soft delete on this table — ever.
 * - old_value / new_value are plain strings; app layer casts on read.
 */
export class ActivityService {
  constructor(private readonly db: Pool) {}

  async log(entry: ActivityLogEntry): Promise<void> {
    await this.db.query(
      `INSERT INTO task_activity_log
         (id, task_id, actor_id, event_type, old_value, new_value, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        uuidv4(),
        entry.task_id,
        entry.actor_id,
        entry.event_type,
        entry.old_value ?? null,
        entry.new_value ?? null,
      ]
    );
  }
}