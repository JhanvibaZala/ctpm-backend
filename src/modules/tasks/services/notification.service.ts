import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationPayload {
  type: string;
  to_user_id: string;
  actor_id: string;
  task_id: string;
  payload: Record<string, unknown>;
}

/**
 * NotificationService
 *
 * Central fanout for all notification events in the system.
 * Pipeline: DB INSERT → WebSocket push → email/Slack job enqueue
 *
 * Dev 1 calls push({ type: 'task_assigned' | 'task_unassigned', ... })
 * Dev 2 calls push({ type: 'comment_mention' | 'status_changed', ... })
 */
export class NotificationService {
  constructor(
    private readonly db: Pool,
    // Injected at startup — real ws.service and job queue
    private readonly wsPush: (userId: string, event: object) => void,
    private readonly enqueueEmail: (data: object) => Promise<void>,
    private readonly enqueueSlack: (data: object) => Promise<void>
  ) {}

  async push(notif: NotificationPayload): Promise<void> {
    const { type, to_user_id, actor_id, task_id, payload } = notif;

    // ── 1. Write to DB first — source of truth ────────────────
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO notifications (id, user_id, type, payload, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [id, to_user_id, type, JSON.stringify({ task_id, actor_id, ...payload })]
    );

    // ── 2. WebSocket push — best effort, never throws ─────────
    try {
      this.wsPush(to_user_id, { type, notification_id: id, task_id, payload });
    } catch {
      // User offline or socket error — DB row covers them on reconnect
    }

    // ── 3. Route to email / Slack based on user preferences ───
    const prefs = await this.getPrefs(to_user_id, type);

    if (prefs.email_enabled) {
      await this.enqueueEmail({ to_user_id, type, payload }).catch((err) =>
        console.error('Email enqueue failed', err)
      );
    }

    if (prefs.slack_enabled) {
      await this.enqueueSlack({ to_user_id, type, payload }).catch((err) =>
        console.error('Slack enqueue failed', err)
      );
    }
  }

  private async getPrefs(
    user_id: string,
    notif_type: string
  ): Promise<{ in_app_enabled: boolean; email_enabled: boolean; slack_enabled: boolean }> {
    const [rows] = await this.db.query<any[]>(
      `SELECT in_app_enabled, email_enabled, slack_enabled
       FROM notification_preferences
       WHERE user_id = ? AND notif_type = ?
       LIMIT 1`,
      [user_id, notif_type]
    );

    // Default: in-app ON, email OFF, slack OFF
    return (
      rows[0] ?? { in_app_enabled: true, email_enabled: false, slack_enabled: false }
    );
  }
}