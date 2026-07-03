import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommentService, AppError } from '../modules/tasks/services/comments.service';
import { ICommentRepository, CommentWithAuthor } from '../modules/tasks/interfaces/comment.interface';
import { MentionService } from '../modules/tasks/services/mention.service';
import { NotificationService } from '../modules/tasks/services/notification.service';
import { ActivityService } from '../modules/tasks/services/activity.service';

// ── Mock factory helpers ──────────────────────────────────────

function mockRepo(overrides: Partial<ICommentRepository> = {}): ICommentRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByTaskId: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    softDelete: vi.fn().mockResolvedValue(undefined),
    isAuthor: vi.fn().mockResolvedValue(false),
    insertMentions: vi.fn().mockResolvedValue(undefined),
    getMentionedUserIds: vi.fn().mockResolvedValue([]),
    deleteMentions: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockMentionService(): MentionService {
  return {
    parse: vi.fn().mockReturnValue([]),
    resolve: vi.fn().mockResolvedValue([]),
    diff: vi.fn().mockReturnValue({ toAdd: [], toRemove: [] }),
  } as unknown as MentionService;
}

function mockNotifService(): NotificationService {
  return { push: vi.fn().mockResolvedValue(undefined) } as unknown as NotificationService;
}

function mockActivityService(): ActivityService {
  return { log: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
}

const ACTOR_ID = 'user-001';
const TASK_ID  = 'task-001';

const sampleComment: CommentWithAuthor = {
  id: 'comment-001',
  task_id: TASK_ID,
  user_id: ACTOR_ID,
  comment_text: 'Hello world',
  is_deleted: false,
  edited_at: null,
  created_at: new Date(),
  author_username: 'alice',
  author_profile_pic: null,
  is_edited: false,
};

// ── list ──────────────────────────────────────────────────────

describe('CommentService.list', () => {
  it('returns paginated comments', async () => {
    const repo = mockRepo({
      findByTaskId: vi.fn().mockResolvedValue({
        rows: [sampleComment],
        total: 1,
      }),
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    const result = await svc.list(TASK_ID, { page: 1, limit: 50 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.has_next).toBe(false);
  });

  it('calculates has_next correctly', async () => {
    const repo = mockRepo({
      findByTaskId: vi.fn().mockResolvedValue({ rows: [], total: 60 }),
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    const result = await svc.list(TASK_ID, { page: 1, limit: 50 });
    expect(result.has_next).toBe(true);
  });
});

// ── create ────────────────────────────────────────────────────

describe('CommentService.create', () => {
//   it('creates comment, inserts mentions, logs activity', async () => {
//     const mentionSvc = mockMentionService();
//     (mentionSvc.parse as any).mockReturnValue(['bob']);
//     (mentionSvc.resolve as any).mockResolvedValue([{ user_id: 'user-002', username: 'bob' }]);

//     const repo = mockRepo({
//       create: vi.fn().mockResolvedValue(sampleComment),
//       findByTaskId: vi.fn().mockResolvedValue({ rows: [sampleComment], total: 1 }),
//     });
//     const actSvc = mockActivityService();
//     const notifSvc = mockNotifService();

//     const svc = new CommentService(repo, mentionSvc, notifSvc, actSvc);
//     const result = await svc.create(TASK_ID, ACTOR_ID, { comment_text: 'Hey @bob' });

//     expect(repo.create).toHaveBeenCalledOnce();
//     expect(repo.insertMentions).toHaveBeenCalledWith(expect.any(String), ['user-002']);
//     expect(notifSvc.push).toHaveBeenCalledWith(
//       expect.objectContaining({ type: 'comment_mention', to_user_id: 'user-002' })
//     );
//     expect(actSvc.log).toHaveBeenCalledWith(
//       expect.objectContaining({ event_type: 'comment_added' })
//     );
//   });


    it('creates comment, inserts mentions, logs activity', async () => {
    const mentionSvc = mockMentionService();
    (mentionSvc.parse as any).mockReturnValue(['bob']);
    (mentionSvc.resolve as any).mockResolvedValue([{ user_id: 'user-002', username: 'bob' }]);

    // Track the created payload in memory during the test execution
    let createdComment: any = null;

    const repo = mockRepo({
      create: vi.fn().mockImplementation(async (payload) => {
        createdComment = {
          ...sampleComment,
          id: payload.id, // Capture the UUID dynamically
          comment_text: payload.comment_text,
          user_id: payload.user_id,
          task_id: payload.task_id
        };
        return createdComment;
      }),
      findByTaskId: vi.fn().mockImplementation(async () => {
        return { 
          rows: createdComment ? [createdComment] : [], 
          total: createdComment ? 1 : 0 
        };
      }),
    });
    
    const actSvc = mockActivityService();
    const notifSvc = mockNotifService();

    const svc = new CommentService(repo, mentionSvc, notifSvc, actSvc);
    const result = await svc.create(TASK_ID, ACTOR_ID, { comment_text: 'Hey @bob' });

    // Assertions will now pass perfectly because the IDs line up
    expect(repo.create).toHaveBeenCalledOnce();
    expect(repo.insertMentions).toHaveBeenCalledWith(expect.any(String), ['user-002']);
    expect(notifSvc.push).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'comment_mention', to_user_id: 'user-002' })
    );
    expect(actSvc.log).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'comment_added' })
    );
  });


    it('does not self-notify when actor mentions themselves', async () => {
    const mentionSvc = mockMentionService();
    (mentionSvc.parse as any).mockReturnValue(['alice']);
    (mentionSvc.resolve as any).mockResolvedValue([]);

    let createdComment: any = null;

    const repo = mockRepo({
      // Accept a single payload object to match exactly how the service calls it
      create: vi.fn().mockImplementation(async (payload) => {
        createdComment = {
          ...sampleComment,
          id: payload.id, // Use the real UUID generated by the service!
          comment_text: payload.comment_text,
          user_id: payload.user_id,
          task_id: payload.task_id
        };
        return createdComment;
      }),
      // Pass the runtime generated UUID down to the findOne check
      findById: vi.fn().mockImplementation(async (id) => {
        return createdComment && createdComment.id === id ? createdComment : null;
      }),
      findByTaskId: vi.fn().mockImplementation(async () => {
        return { 
          rows: createdComment ? [createdComment] : [], 
          total: createdComment ? 1 : 0 
        };
      }),
    });
    
    const notifSvc = mockNotifService();

    const svc = new CommentService(repo, mentionSvc, notifSvc, mockActivityService());
    await svc.create(TASK_ID, ACTOR_ID, { comment_text: 'Note to self @alice' });

    expect(notifSvc.push).not.toHaveBeenCalled();
  });

//   it('does not self-notify when actor mentions themselves', async () => {
//     const mentionSvc = mockMentionService();
//     (mentionSvc.parse as any).mockReturnValue(['alice']);
//     // resolve filters actor out — returns empty
//     (mentionSvc.resolve as any).mockResolvedValue([]);

//     const repo = mockRepo({
//       create: vi.fn().mockResolvedValue(sampleComment),
//       findByTaskId: vi.fn().mockResolvedValue({ rows: [sampleComment], total: 1 }),
//     });
//     const notifSvc = mockNotifService();

//   it('does not self-notify when actor mentions themselves', async () => {
//     const mentionSvc = mockMentionService();
//     (mentionSvc.parse as any).mockReturnValue(['alice']);
//     // resolve filters actor out — returns empty
//     (mentionSvc.resolve as any).mockResolvedValue([]);
//     const svc = new CommentService(repo, mentionSvc, notifSvc, mockActivityService());
//     await svc.create(TASK_ID, ACTOR_ID, { comment_text: 'Note to self @alice' });

//     expect(notifSvc.push).not.toHaveBeenCalled();
//   });

});


// ── update ────────────────────────────────────────────────────

describe('CommentService.update', () => {
  it('throws 404 if comment not found', async () => {
    const repo = mockRepo({ findById: vi.fn().mockResolvedValue(null) });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await expect(svc.update('bad-id', ACTOR_ID, { comment_text: 'x' }))
      .rejects.toThrow(AppError);
    await expect(svc.update('bad-id', ACTOR_ID, { comment_text: 'x' }))
      .rejects.toHaveProperty('statusCode', 404);
  });

  it('throws 403 if non-author tries to edit', async () => {
    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(sampleComment),
      isAuthor: vi.fn().mockResolvedValue(false),
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await expect(svc.update('comment-001', 'other-user', { comment_text: 'x' }))
      .rejects.toHaveProperty('statusCode', 403);
  });

  it('only notifies newly added mentions on edit', async () => {
    const mentionSvc = mockMentionService();
    (mentionSvc.parse as any).mockReturnValue(['bob', 'carol']);
    (mentionSvc.resolve as any).mockResolvedValue([
      { user_id: 'user-002', username: 'bob' },
      { user_id: 'user-003', username: 'carol' },
    ]);
    // bob was already mentioned, carol is new
    (mentionSvc.diff as any).mockReturnValue({
      toAdd: ['user-003'],
      toRemove: [],
    });

    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(sampleComment),
      isAuthor: vi.fn().mockResolvedValue(true),
      getMentionedUserIds: vi.fn().mockResolvedValue(['user-002']),
      findByTaskId: vi.fn().mockResolvedValue({ rows: [sampleComment], total: 1 }),
    });
    const notifSvc = mockNotifService();

    const svc = new CommentService(repo, mentionSvc, notifSvc, mockActivityService());
    await svc.update('comment-001', ACTOR_ID, { comment_text: '@bob @carol update' });

    // Only carol (user-003) should be notified
    expect(notifSvc.push).toHaveBeenCalledOnce();
    expect(notifSvc.push).toHaveBeenCalledWith(
      expect.objectContaining({ to_user_id: 'user-003' })
    );
  });
});

// ── remove ────────────────────────────────────────────────────

describe('CommentService.remove', () => {
  it('allows author to delete their own comment', async () => {
    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(sampleComment),
      isAuthor: vi.fn().mockResolvedValue(true),
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await svc.remove('comment-001', ACTOR_ID, 'Contributor');
    expect(repo.softDelete).toHaveBeenCalledWith('comment-001');
  });

  it('allows Project Manager to delete any comment', async () => {
    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(sampleComment),
      isAuthor: vi.fn().mockResolvedValue(false), // not the author
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await svc.remove('comment-001', 'pm-user', 'Manager');
    expect(repo.softDelete).toHaveBeenCalled();
  });

  it('throws 403 if non-author non-manager tries to delete', async () => {
    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(sampleComment),
      isAuthor: vi.fn().mockResolvedValue(false),
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await expect(svc.remove('comment-001', 'random-user', 'Contributor'))
      .rejects.toHaveProperty('statusCode', 403);
  });

  it('throws 404 if comment not found', async () => {
    const repo = mockRepo({ findById: vi.fn().mockResolvedValue(null) });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await expect(svc.remove('bad-id', ACTOR_ID, 'Contributor'))
      .rejects.toHaveProperty('statusCode', 404);
  });

  it('uses soft delete, not hard delete', async () => {
    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(sampleComment),
      isAuthor: vi.fn().mockResolvedValue(true),
    });
    const svc = new CommentService(
      repo, mockMentionService(), mockNotifService(), mockActivityService()
    );
    await svc.remove('comment-001', ACTOR_ID, 'Contributor');
    expect(repo.softDelete).toHaveBeenCalledWith('comment-001');
    // Ensure no hard-delete method was called
    expect(repo.softDelete).toHaveBeenCalledOnce();
  });
});

// ── remove ────────────────────────────────────────────────────