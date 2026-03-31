import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { Project } from '../types/index.js';
import { authenticate, getUserFromRequest } from '../middleware/auth.js';

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  project_type: z.enum(['exploration', 'delivery', 'research', 'maintenance', 'innovation']),
  methodology: z.enum(['kanban_aacc', 'adaptive_sprint', 'async_deep', 'hybrid']),
  cognitive_complexity: z.number().int().min(1).max(10).default(5),
  start_date: z.string().optional(),
  target_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function projectRoutes(fastify: FastifyInstance) {
  // GET /api/projects
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const { status } = request.query as { status?: string };

    let whereClause = `WHERE (p.owner_id = $1 OR pm.user_id = $1)`;
    const params: unknown[] = [userId];
    if (status) {
      params.push(status);
      whereClause += ` AND p.status = $${params.length}`;
    }

    const projects = await query<Project>(`
      SELECT DISTINCT
        p.*,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'cancelled') as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
        COALESCE(
          ROUND(
            COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::numeric /
            NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'cancelled'), 0) * 100
          ), 0
        ) as progress
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN users u ON u.id = p.owner_id
      LEFT JOIN tasks t ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id, u.full_name, u.avatar_url
      ORDER BY p.updated_at DESC
    `, params);

    return reply.send({ projects });
  });

  // POST /api/projects
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const body = CreateProjectSchema.parse(request.body);

    const [project] = await query<Project>(
      `INSERT INTO projects (name, description, project_type, methodology, cognitive_complexity, start_date, target_date, owner_id, settings, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
       RETURNING *`,
      [body.name, body.description, body.project_type, body.methodology, body.cognitive_complexity,
       body.start_date, body.target_date, userId, JSON.stringify(body.settings || {}), body.tags || []]
    );

    // Add owner as member
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, userId, 'architect_lead']
    );

    return reply.status(201).send({ project });
  });

  // GET /api/projects/:id
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId } = getUserFromRequest(request);

    const project = await queryOne<Project>(`
      SELECT p.*, u.full_name as owner_name,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'cancelled') as task_count,
        COALESCE(ROUND(
          COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::numeric /
          NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'cancelled'), 0) * 100
        ), 0) as progress
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
      GROUP BY p.id, u.full_name
    `, [id, userId]);

    if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });

    // Get members
    const members = await query(`
      SELECT u.id, u.full_name, u.avatar_url, u.role as global_role, pm.role as project_role, pm.joined_at
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
    `, [id]);

    return reply.send({ project: { ...project, members } });
  });

  // PATCH /api/projects/:id
  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<z.infer<typeof CreateProjectSchema> & { status: string }>;

    const allowed = ['name', 'description', 'project_type', 'methodology', 'status', 'cognitive_complexity', 'start_date', 'target_date', 'tags', 'settings'];
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

    if (updates.length === 0) return reply.status(400).send({ error: 'No hay campos para actualizar' });

    values.push(id);
    const [project] = await query<Project>(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return reply.send({ project });
  });

  // GET /api/projects/:id/members
  fastify.get('/:id/members', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const members = await query(`
      SELECT u.id, u.full_name, u.email, u.avatar_url, u.role, pm.role as project_role, pm.joined_at,
             u.cognitive_profile
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1 ORDER BY pm.joined_at
    `, [id]);
    return reply.send({ members });
  });

  // POST /api/projects/:id/members
  fastify.post('/:id/members', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { user_id, role } = request.body as { user_id: string; role: string };

    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [id, user_id, role]
    );

    return reply.status(201).send({ message: 'Miembro añadido' });
  });

  // GET /api/projects/:id/stats
  fastify.get('/:id/stats', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [taskStats] = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status != 'cancelled') as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as done_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
        SUM(cognitive_points) FILTER (WHERE status = 'done') as completed_pcc,
        SUM(cognitive_points) FILTER (WHERE status != 'cancelled') as total_pcc,
        AVG(cognitive_points) as avg_pcc
      FROM tasks WHERE project_id = $1
    `, [id]);

    const cogTypeDistribution = await query(`
      SELECT cognitive_type, COUNT(*) as count
      FROM tasks WHERE project_id = $1 AND status != 'cancelled'
      GROUP BY cognitive_type
    `, [id]);

    return reply.send({ stats: taskStats, cognitive_distribution: cogTypeDistribution });
  });
}
