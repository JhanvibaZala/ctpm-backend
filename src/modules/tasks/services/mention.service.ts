import { Pool } from 'mysql2/promise';
import { ResolvedMention } from '../interfaces/comment.interface';
import { string } from 'zod';

export class MentionService {
  constructor(private readonly db: Pool) {}

  /**
   * Extract all unique @username tokens from comment text.
   * Returns lowercase deduplicated array.
   */
  parse(text: string): string[] {
    const pattern = /@([a-zA-Z0-9_]+)/g;
    const matches = [...text.matchAll(pattern)];
    return [...new Set(
        matches
        .map((m) => m[1])
        .filter((val):val is string => !!val)
        .map((uname)=>uname.toLowerCase())
    )
];
  }

  /**
   * Resolve parsed usernames → active user_id + username pairs.
   * Silently drops usernames that don't exist or are inactive.
   * Also filters out the commenter themselves (no self-notification).
   */
  async resolve(
    usernames: string[],
    actorId: string
  ): Promise<ResolvedMention[]> {
    if (!usernames.length) return [];

    const placeholders = usernames.map(() => '?').join(', ');
    const [rows] = await this.db.query<any[]>(
      `SELECT id AS user_id, username
       FROM users
       WHERE username IN (${placeholders})
         AND account_status = 'Active'`,
      usernames
    );

    // Filter out the person who wrote the comment
    return (rows as ResolvedMention[]).filter((u) => u.user_id !== actorId);
  }

  /**
   * Diff old mention set vs new mention set.
   * Returns user_ids to add and user_ids to remove.
   *
   * Used on comment edits to avoid re-notifying existing mentions
   * and to clean up removed mentions.
   */
  diff(
    existingUserIds: string[],
    freshUserIds: string[]
  ): { toAdd: string[]; toRemove: string[] } {
    const existingSet = new Set(existingUserIds);
    const freshSet = new Set(freshUserIds);

    return {
      toAdd: [...freshSet].filter((id) => !existingSet.has(id)),
      toRemove: [...existingSet].filter((id) => !freshSet.has(id)),
    };
  }
}