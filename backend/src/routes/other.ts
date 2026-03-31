import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { authenticate, getUserFromRequest, requireAdmin } from '../middleware/auth.js';

const SprintSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1),
  goal: z.string().default(''),
  start_date: z.string(),
  end_date: z.string(),
  team_capacity: z.record(z.unknown()).optional(),
});

export async function sprintRoutes(fastify: FastifyInstance) {
  // GET /api/sprints?project_id=...
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { project_id, status } = request.query as { project_id?: string; status?: string };

    const conditions = ['1=1'];
    const params: unknown[] = [];
    let idx = 1;

    if (project_id) { conditions.push(`s.project_id = $${idx++}`); params.push(project_id); }
    if (status) { conditions.push(`s.status = $${idx++}`); params.push(status); }

    const sprints = await query(`
      SELECT s.*,
        COUNT(t.id) as task_count,
        COALESCE(SUM(t.cognitive_points) FILTER (WHERE t.status = 'done'), 0) as completed_pcc
      FROM sprints s LEFT JOIN tasks t ON t.sprint_id = s.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY s.id ORDER BY s.start_date DESC
    `, params);

    return reply.send({ sprints });
  });

  // POST /api/sprints
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      console.log('📥 POST /api/sprints request body:', request.body);
      const body = SprintSchema.parse(request.body);
      console.log('✅ Validation passed:', body);

      const result = await query(
        `INSERT INTO sprints (project_id, name, goal, start_date, end_date, team_capacity)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [body.project_id, body.name, body.goal, body.start_date, body.end_date,
         JSON.stringify(body.team_capacity || {})]
      );
      
      console.log('📊 Query result:', result);
      const [sprint] = result;
      console.log('✨ Sprint created:', sprint);

      return reply.status(201).send({ sprint });
    } catch (err) {
      console.error('❌ Error in POST /api/sprints:', err);
      throw err;
    }
  });

  // PATCH /api/sprints/:id
  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof SprintSchema> & { status: string }>;

    const allowed = ['name', 'goal', 'start_date', 'end_date', 'status', 'retrospective'];
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key as keyof typeof body] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        const val = body[key as keyof typeof body];
        values.push(typeof val === 'object' && !Array.isArray(val) ? JSON.stringify(val) : val);
      }
    }

    if (!updates.length) return reply.status(400).send({ error: 'No hay campos' });
    values.push(id);

    const [sprint] = await query(`UPDATE sprints SET ${updates.join(',')} WHERE id = $${idx} RETURNING *`, values);
    return reply.send({ sprint });
  });

  // POST /api/sprints/:sprint_id/reorder — Reorder tasks in sprint
  fastify.post('/:sprint_id/reorder', { preHandler: authenticate }, async (request, reply) => {
    const { sprint_id } = request.params as { sprint_id: string };
    const { task_ids } = request.body as { task_ids: string[] };

    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return reply.status(400).send({ error: 'task_ids debe ser un array no vacío' });
    }

    try {
      // Update display_order for each task
      for (let idx = 0; idx < task_ids.length; idx++) {
        await query(
          'UPDATE tasks SET display_order = $1 WHERE id = $2 AND sprint_id = $3',
          [idx, task_ids[idx], sprint_id]
        );
      }

      // Return updated tasks
      const tasks = await query(
        'SELECT * FROM tasks WHERE sprint_id = $1 ORDER BY display_order ASC',
        [sprint_id]
      );

      return reply.send({ tasks });
    } catch (err) {
      console.error('❌ Error reordering tasks:', err);
      return reply.status(500).send({ error: 'Error al reordenar tareas' });
    }
  });
}

export async function wellnessRoutes(fastify: FastifyInstance) {
  // GET /api/wellness/team?project_id=...
  fastify.get('/team', { preHandler: authenticate }, async (request, reply) => {
    const { project_id } = request.query as { project_id?: string };

    // Get team members with their ICC
    let membersQuery = `
      SELECT u.id, u.full_name, u.avatar_url, u.cognitive_profile,
        COALESCE(
          (SELECT AVG(cs.energy_level_start) FROM cognitive_sessions cs WHERE cs.user_id = u.id AND cs.started_at > NOW() - INTERVAL '7 days'),
          3
        ) as avg_energy_7d,
        COALESCE(
          (SELECT COUNT(*) FROM cognitive_sessions cs WHERE cs.user_id = u.id AND cs.flow_mode = TRUE AND cs.started_at > NOW() - INTERVAL '7 days'),
          0
        ) as flow_sessions_7d,
        COALESCE(
          (SELECT COUNT(*) FROM cognitive_sessions cs WHERE cs.user_id = u.id AND cs.started_at > NOW() - INTERVAL '7 days'),
          0
        ) as total_sessions_7d,
        COALESCE(
          (SELECT SUM(t.cognitive_points) FROM tasks t WHERE t.assignee_id = u.id AND t.status IN ('todo','in_progress','review')),
          0
        ) as active_pcc_load
      FROM users u
    `;

    const params: unknown[] = [];
    if (project_id) {
      membersQuery += ` JOIN project_members pm ON pm.user_id = u.id WHERE pm.project_id = $1`;
      params.push(project_id);
    } else {
      membersQuery += ` WHERE u.is_active = TRUE`;
    }

    const members = await query(membersQuery, params);

    // Get active alerts
    const alerts = await query(
      `SELECT ca.*, u.full_name FROM cognitive_alerts ca JOIN users u ON u.id = ca.user_id WHERE ca.resolved = FALSE ORDER BY ca.created_at DESC LIMIT 20`,
      []
    );

    return reply.send({ members, alerts });
  });

  // GET /api/wellness/me — Personal wellness data
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);

    const energyTrend = await query(`
      SELECT DATE(started_at) as date, AVG(energy_level_start) as avg_energy, COUNT(*) as sessions
      FROM cognitive_sessions WHERE user_id = $1 AND started_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(started_at) ORDER BY date
    `, [userId]);

    const cogTypeStats = await query(`
      SELECT t.cognitive_type, COUNT(*) as count, SUM(t.cognitive_points) as total_pcc
      FROM tasks t WHERE t.assignee_id = $1 AND t.status IN ('todo','in_progress','review','done')
      AND t.updated_at > NOW() - INTERVAL '30 days'
      GROUP BY t.cognitive_type
    `, [userId]);

    const flowStats = await queryOne(`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE flow_mode = TRUE) as flow_sessions,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))/3600)::numeric, 2) as avg_session_hours,
        COALESCE(AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL), 0) as avg_quality
      FROM cognitive_sessions WHERE user_id = $1 AND started_at > NOW() - INTERVAL '30 days'
    `, [userId]);

    const activeAlerts = await query(
      `SELECT * FROM cognitive_alerts WHERE user_id = $1 AND resolved = FALSE ORDER BY created_at DESC`,
      [userId]
    );

    return reply.send({ energy_trend: energyTrend, cognitive_stats: cogTypeStats, flow_stats: flowStats, active_alerts: activeAlerts });
  });

  // POST /api/wellness/alerts/:id/resolve
  fastify.post('/alerts/:id/resolve', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId } = getUserFromRequest(request);

    try {
      const result = await query(
        `UPDATE cognitive_alerts SET resolved = TRUE, resolved_at = NOW(), resolved_by = $1 WHERE id = $2 RETURNING *`,
        [userId, id]
      );

      if (!result || result.length === 0) {
        return reply.status(404).send({ error: 'Alerta no encontrada' });
      }

      return reply.send({ message: 'Alerta resuelta', alert: result[0] });
    } catch (err) {
      console.error('Error resolviendo alerta:', err);
      return reply.status(500).send({ error: 'Error al resolver alerta' });
    }
  });
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/dashboard
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);

    const [stats] = await query(`
      SELECT
        (SELECT COUNT(*) FROM projects p LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE p.status = 'active' AND (p.owner_id = $1 OR pm.user_id = $1)) as active_projects,
        (SELECT COALESCE(SUM(t.cognitive_points), 0) FROM tasks t
         JOIN sprints s ON s.id = t.sprint_id
         WHERE t.status = 'done' AND s.status = 'active' AND t.assignee_id = $1) as pcc_sprint,
        (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = $1 AND t.status = 'blocked') as blocked_tasks,
        (SELECT COUNT(*) FROM cognitive_alerts ca WHERE ca.user_id = $1 AND ca.resolved = FALSE) as active_alerts
    `, [userId]);

    // My tasks today (ordered by cognitive type suitability for current hour)
    const myTasks = await query(`
      SELECT t.*, u.full_name as assignee_name, p.name as project_name, sp.name as sprint_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN sprints sp ON sp.id = t.sprint_id
      WHERE t.assignee_id = $1 AND t.status IN ('todo','in_progress','review','blocked')
      ORDER BY CASE t.status WHEN 'in_progress' THEN 1 WHEN 'blocked' THEN 2 WHEN 'review' THEN 3 ELSE 4 END,
               CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
      LIMIT 8
    `, [userId]);

    // Recent activity
    const activity = await query(`
      SELECT 'task_update' as type, t.title, t.status, u.full_name as actor, t.updated_at as timestamp
      FROM tasks t LEFT JOIN users u ON u.id = t.created_by
      WHERE t.project_id IN (
        SELECT DISTINCT p.id FROM projects p LEFT JOIN project_members pm ON pm.project_id = p.id
        WHERE p.owner_id = $1 OR pm.user_id = $1
      )
      AND t.updated_at > NOW() - INTERVAL '7 days'
      ORDER BY t.updated_at DESC LIMIT 10
    `, [userId]);

    return reply.send({ stats, my_tasks: myTasks, activity });
  });
}

export async function knowledgeRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { project_id, node_type } = request.query as { project_id?: string; node_type?: string };
    const conds = ['1=1']; const params: unknown[] = []; let idx = 1;
    if (project_id) { conds.push(`kn.project_id = $${idx++}`); params.push(project_id); }
    if (node_type) { conds.push(`kn.node_type = $${idx++}`); params.push(node_type); }

    const nodes = await query(`
      SELECT kn.*, u.full_name as author_name FROM knowledge_nodes kn LEFT JOIN users u ON u.id = kn.author_id
      WHERE ${conds.join(' AND ')} ORDER BY kn.updated_at DESC
    `, params);
    return reply.send({ nodes });
  });

  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { id: authorId } = getUserFromRequest(request);
    const { project_id, title, content, node_type, tags } = request.body as {
      project_id: string; title: string; content: string; node_type?: string; tags?: string[];
    };
    const [node] = await query(
      `INSERT INTO knowledge_nodes (project_id, title, content, node_type, author_id, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [project_id, title, content, node_type || 'lesson', authorId, tags || []]
    );
    return reply.status(201).send({ node });
  });
}
