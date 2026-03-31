import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { User } from '../types/index.js';
import { authenticate, requireAdmin, getUserFromRequest } from '../middleware/auth.js';

const UpdateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'architect_lead', 'deep_contributor', 'connector', 'flow_guardian', 'product_visionary', 'devops_integrator', 'quality_auditor', 'stakeholder']).optional(),
  is_active: z.boolean().optional(),
  timezone: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
  cognitive_profile: z.record(z.unknown()).optional(),
  aacc_indicators: z.record(z.unknown()).optional(),
});

const PreferencesSchema = z.object({
  theme_preference: z.enum(['light', 'high_contrast', 'colorblind']).optional(),
  text_to_speech_enabled: z.boolean().optional(),
  tts_voice: z.string().optional(),
  tts_rate: z.number().min(0.5).max(2.0).optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/search - Search users for mentions (authenticated only)
  fastify.get('/search', { preHandler: authenticate }, async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q || q.length < 2) {
      return reply.send({ users: [] });
    }

    const users = await query<User>(`
      SELECT id, full_name, avatar_url, email
      FROM users
      WHERE is_active = TRUE AND (full_name ILIKE $1 OR email ILIKE $2)
      ORDER BY full_name
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);

    return reply.send({ users });
  });

  // GET /api/users (admin only)
  fastify.get('/', { preHandler: requireAdmin }, async (request, reply) => {
    const { role, is_active, search } = request.query as { role?: string; is_active?: string; search?: string };
    
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (role) {
      conditions.push(`u.role = $${idx++}`);
      params.push(role);
    }

    if (is_active !== undefined) {
      conditions.push(`u.is_active = $${idx++}`);
      params.push(is_active === 'true');
    }

    if (search) {
      conditions.push(`(u.full_name ILIKE $${idx++} OR u.email ILIKE $${idx++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = await query<User>(`
      SELECT id, email, full_name, avatar_url, role, timezone, is_active, created_at, last_seen_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `, params);

    return reply.send({ users });
  });

  // GET /api/users/:id (admin only)
  fastify.get('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await queryOne<User>(
      `SELECT id, email, full_name, avatar_url, role, cognitive_profile, aacc_indicators, timezone, is_active, created_at, last_seen_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (!user) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    return reply.send({ user });
  });

  // PATCH /api/users/:id (admin only)
  fastify.patch('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateUserSchema.parse(request.body);

    const allowed = ['full_name', 'email', 'role', 'is_active', 'timezone', 'avatar_url', 'cognitive_profile', 'aacc_indicators'];
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key as keyof typeof body] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        const val = body[key as keyof typeof body];
        values.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
      }
    }

    if (updates.length === 0) {
      return reply.status(400).send({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    const [user] = await query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, avatar_url, role, cognitive_profile, aacc_indicators, timezone, is_active, created_at, last_seen_at`,
      values
    );

    return reply.send({ user });
  });

  // DELETE /api/users/:id (admin only)
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: currentUserId } = getUserFromRequest(request);

    // Prevent self-deletion
    if (id === currentUserId) {
      return reply.status(400).send({ error: 'No puede eliminar su propia cuenta' });
    }

    // Check if user exists
    const user = await queryOne(`SELECT id FROM users WHERE id = $1`, [id]);
    if (!user) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    // Delete user (cascade will handle related records)
    await query(`DELETE FROM users WHERE id = $1`, [id]);

    return reply.send({ message: 'Usuario eliminado correctamente' });
  });

  // POST /api/users/:id/reset-password (admin only) - to send password reset
  fastify.post('/:id/reset-password', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { new_password } = request.body as { new_password: string };

    if (!new_password || new_password.length < 6) {
      return reply.status(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hash = await bcrypt.hash(new_password, 10);

    const [user] = await query<User>(
      `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email, full_name, role`,
      [hash, id]
    );

    if (!user) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    return reply.send({ message: 'Contraseña actualizada' });
  });
}
