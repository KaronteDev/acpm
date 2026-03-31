import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { Task } from '../types/index.js';
import { authenticate, getUserFromRequest } from '../middleware/auth.js';

const CreateTaskSchema = z.object({
  project_id: z.string().uuid(),
  parent_task_id: z.string().uuid().optional(),
  sprint_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(400),
  description: z.string().optional(),
  task_type: z.enum(['implementation', 'research', 'spike', 'review', 'experiment', 'documentation', 'bug', 'refactor']),
  cognitive_type: z.enum(['deep_focus', 'creative', 'routine', 'collaborative', 'exploratory']),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'someday']).default('medium'),
  cognitive_points: z.number().refine(n => [1,2,3,5,8,13,21].includes(n), { message: 'PCC debe ser Fibonacci (1,2,3,5,8,13,21)' }),
  estimated_hours: z.number().optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  strategic_context: z.string().optional(),
  definition_of_done: z.array(z.object({ text: z.string(), done: z.boolean() })).optional(),
  tags: z.array(z.string()).optional(),
});

const TaskQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  sprint_id: z.string().refine(s => s === 'null' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s), { message: 'sprint_id debe ser UUID o "null"' }).optional(),
  status: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  cognitive_type: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

export async function taskRoutes(fastify: FastifyInstance) {
  // GET /api/tasks
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const q = TaskQuerySchema.parse(request.query);

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let idx = 1;

    if (q.project_id) { conditions.push(`t.project_id = $${idx++}`); params.push(q.project_id); }
    if (q.sprint_id) {
      if (q.sprint_id === 'null') conditions.push('t.sprint_id IS NULL');
      else { conditions.push(`t.sprint_id = $${idx++}`); params.push(q.sprint_id); }
    }
    if (q.status) { conditions.push(`t.status = $${idx++}`); params.push(q.status); }
    if (q.assignee_id) { conditions.push(`t.assignee_id = $${idx++}`); params.push(q.assignee_id); }
    if (q.cognitive_type) { conditions.push(`t.cognitive_type = $${idx++}`); params.push(q.cognitive_type); }

    params.push(q.limit, q.offset);

    const tasks = await query<Task>(`
      SELECT t.*,
        u.full_name as assignee_name, u.avatar_url as assignee_avatar, u.role as assignee_role,
        cu.full_name as creator_name,
        p.name as project_name,
        COUNT(st.id) as subtask_count,
        COUNT(st.id) FILTER (WHERE st.status = 'done') as completed_subtasks,
        (SELECT row_to_json(cs.*) FROM cognitive_sessions cs WHERE cs.task_id = t.id AND cs.ended_at IS NULL LIMIT 1) as active_session
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users cu ON cu.id = t.created_by
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN tasks st ON st.parent_task_id = t.id
      WHERE ${conditions.join(' AND ')} AND t.parent_task_id IS NULL
      GROUP BY t.id, u.full_name, u.avatar_url, u.role, cu.full_name, p.name
      ORDER BY
        CASE WHEN t.sprint_id IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN t.sprint_id IS NOT NULL THEN t.display_order ELSE NULL END,
        CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
        t.updated_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `, params);

    return reply.send({ tasks });
  });

  // POST /api/tasks
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const body = CreateTaskSchema.parse(request.body);

    const [task] = await query<Task>(
      `INSERT INTO tasks (project_id, parent_task_id, sprint_id, title, description, task_type, cognitive_type,
        priority, cognitive_points, estimated_hours, assignee_id, strategic_context, definition_of_done, tags, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [body.project_id, body.parent_task_id, body.sprint_id, body.title, body.description,
       body.task_type, body.cognitive_type, body.priority, body.cognitive_points, body.estimated_hours,
       body.assignee_id, body.strategic_context, JSON.stringify(body.definition_of_done || []),
       body.tags || [], userId]
    );

    return reply.status(201).send({ task });
  });

  // GET /api/tasks/:id
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const task = await queryOne<Task>(`
      SELECT t.*,
        u.full_name as assignee_name, u.avatar_url as assignee_avatar,
        cu.full_name as creator_name,
        sp.name as sprint_name,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users cu ON cu.id = t.created_by
      LEFT JOIN sprints sp ON sp.id = t.sprint_id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.id = $1
    `, [id]);

    if (!task) return reply.status(404).send({ error: 'Tarea no encontrada' });

    // Get subtasks
    const subtasks = await query<Task>(
      `SELECT t.*, u.full_name as assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.parent_task_id = $1 ORDER BY t.created_at`,
      [id]
    );

    // Get sessions
    const sessions = await query(
      `SELECT cs.*, u.full_name, u.avatar_url FROM cognitive_sessions cs JOIN users u ON u.id = cs.user_id WHERE cs.task_id = $1 ORDER BY cs.started_at DESC LIMIT 20`,
      [id]
    );

    // Get comments
    const comments = await query(
      `SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar FROM comments c JOIN users u ON u.id = c.author_id WHERE c.task_id = $1 AND c.parent_id IS NULL ORDER BY c.created_at`,
      [id]
    );

    return reply.send({ task: { ...task, subtasks, sessions, comments } });
  });

  // PATCH /api/tasks/:id
  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<Task>;

    const allowed = ['title', 'description', 'task_type', 'cognitive_type', 'status', 'priority',
      'cognitive_points', 'estimated_hours', 'actual_hours', 'assignee_id', 'sprint_id',
      'strategic_context', 'definition_of_done', 'tags', 'blocked_reason', 'display_order'];

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key as keyof typeof body] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        const val = body[key as keyof typeof body];
        values.push(Array.isArray(val) && key === 'definition_of_done' ? JSON.stringify(val) : val);
      }
    }

    if (updates.length === 0) return reply.status(400).send({ error: 'No hay campos' });

    values.push(id);
    const [task] = await query<Task>(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return reply.send({ task });
  });

  // DELETE /api/tasks/:id
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await query(`UPDATE tasks SET status = 'cancelled' WHERE id = $1`, [id]);
    return reply.send({ message: 'Tarea cancelada' });
  });

  // POST /api/tasks/:id/sessions — Start cognitive session
  fastify.post('/:id/sessions', { preHandler: authenticate }, async (request, reply) => {
    const { id: taskId } = request.params as { id: string };
    const { id: userId } = getUserFromRequest(request);
    const { energy_level_start, flow_mode } = request.body as { energy_level_start: number; flow_mode?: boolean };

    // Close any open session
    await query(
      `UPDATE cognitive_sessions SET ended_at = NOW() WHERE user_id = $1 AND ended_at IS NULL`,
      [userId]
    );

    // Update task status to in_progress if it was todo
    await query(
      `UPDATE tasks SET status = 'in_progress' WHERE id = $1 AND status = 'todo'`,
      [taskId]
    );

    const [session] = await query(
      `INSERT INTO cognitive_sessions (user_id, task_id, energy_level_start, flow_mode)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, taskId, energy_level_start, flow_mode || false]
    );

    return reply.status(201).send({ session });
  });

  // PATCH /api/tasks/:id/sessions/:sessionId — End session
  fastify.patch('/:id/sessions/:sessionId', { preHandler: authenticate }, async (request, reply) => {
    const { sessionId } = request.params as { id: string; sessionId: string };
    const { energy_level_end, quality_rating, notes, interruptions_count } = request.body as {
      energy_level_end?: number; quality_rating?: number; notes?: string; interruptions_count?: number;
    };

    const [session] = await query(
      `UPDATE cognitive_sessions
       SET ended_at = NOW(), energy_level_end = $1, quality_rating = $2, notes = $3, interruptions_count = COALESCE($4, interruptions_count)
       WHERE id = $5 RETURNING *`,
      [energy_level_end, quality_rating, notes, interruptions_count, sessionId]
    );

    return reply.send({ session });
  });

  // POST /api/tasks/:id/comments
  fastify.post('/:id/comments', { preHandler: authenticate }, async (request, reply) => {
    const { id: taskId } = request.params as { id: string };
    const { id: authorId } = getUserFromRequest(request);
    const { content, is_thinking, parent_id } = request.body as { content: string; is_thinking?: boolean; parent_id?: string };

    const [comment] = await query(
      `INSERT INTO comments (task_id, author_id, content, is_thinking, parent_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [taskId, authorId, content, is_thinking || false, parent_id]
    );

    const withAuthor = await queryOne(
      `SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1`,
      [comment.id as string]
    );

    // Extract mentions from content (@username format)
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex)?.map(m => m.slice(1)) || [];

    if (mentions.length > 0) {
      // Get mentioned users
      const mentionedUsers = await query(
        `SELECT id, full_name FROM users WHERE full_name ILIKE ANY($1) AND id != $2`,
        [mentions.map(m => `%${m}%`), authorId]
      );

      // Create notifications for mentioned users
      for (const user of mentionedUsers) {
        const author = await queryOne(`SELECT full_name FROM users WHERE id = $1`, [authorId]);
        await query(
          `INSERT INTO notifications (user_id, notification_type, related_user_id, comment_id, task_id, message) VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            user.id,
            'mention',
            authorId,
            comment.id,
            taskId,
            `${author.full_name} te mencionó en un comentario`
          ]
        );
      }
    }

    return reply.status(201).send({ comment: withAuthor });
  });

  // PATCH /api/tasks/:id/comments/:commentId — Edit comment
  fastify.patch('/:id/comments/:commentId', { preHandler: authenticate }, async (request, reply) => {
    const { commentId } = request.params as { id: string; commentId: string };
    const { id: userId } = getUserFromRequest(request);
    const { content, reason } = request.body as { content: string; reason?: string };

    // Verify ownership
    const comment = await queryOne(
      `SELECT * FROM comments WHERE id = $1`,
      [commentId]
    );

    if (!comment) {
      return reply.status(404).send({ error: 'Comentario no encontrado' });
    }

    if (comment.author_id !== userId) {
      return reply.status(403).send({ error: 'No puedes editar este comentario' });
    }

    // Save edit history - store the original content before updating
    await query(
      `INSERT INTO comment_edits (comment_id, original_content, edited_by, reason) VALUES ($1, $2, $3, $4)`,
      [commentId, comment.content, userId, reason || null]
    );

    // Update comment with new content and increment edit count
    const [updated] = await query(
      `UPDATE comments SET content = $1, updated_at = NOW(), edit_count = COALESCE(edit_count, 0) + 1 WHERE id = $2 RETURNING *`,
      [content, commentId]
    );

    const withAuthor = await queryOne(
      `SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1`,
      [commentId]
    );

    return reply.send({ comment: withAuthor });
  });

  // GET /api/tasks/:id/comments/:commentId/edits — Get comment edit history
  fastify.get('/:id/comments/:commentId/edits', { preHandler: authenticate }, async (request, reply) => {
    const { commentId } = request.params as { id: string; commentId: string };

    // Get all edits for this comment with editor info
    const edits = await query(
      `SELECT 
        ce.id, 
        ce.original_content, 
        ce.edited_by, 
        ce.edited_at,
        ce.reason,
        u.full_name as editor_name,
        u.avatar_url as editor_avatar
      FROM comment_edits ce
      JOIN users u ON u.id = ce.edited_by
      WHERE ce.comment_id = $1
      ORDER BY ce.edited_at DESC`,
      [commentId]
    );

    // Also get current content
    const comment = await queryOne(
      `SELECT content, updated_at FROM comments WHERE id = $1`,
      [commentId]
    );

    if (!comment) {
      return reply.status(404).send({ error: 'Comentario no encontrado' });
    }

    return reply.send({
      edits,
      current: {
        content: comment.content,
        updated_at: comment.updated_at
      }
    });
  });

  // DELETE /api/tasks/:id/comments/:commentId — Delete comment
  fastify.delete('/:id/comments/:commentId', { preHandler: authenticate }, async (request, reply) => {
    const { commentId } = request.params as { id: string; commentId: string };
    const { id: userId } = getUserFromRequest(request);

    // Verify ownership
    const comment = await queryOne(
      `SELECT * FROM comments WHERE id = $1`,
      [commentId]
    );

    if (!comment) {
      return reply.status(404).send({ error: 'Comentario no encontrado' });
    }

    if (comment.author_id !== userId) {
      return reply.status(403).send({ error: 'No puedes eliminar este comentario' });
    }

    await query(`DELETE FROM comments WHERE id = $1`, [commentId]);

    return reply.send({ success: true });
  });
}
