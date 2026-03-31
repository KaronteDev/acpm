import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { User } from '../types/index.js';
import { authenticate, getUserFromRequest } from '../middleware/auth.js';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['architect_lead', 'deep_contributor', 'connector', 'flow_guardian', 'product_visionary', 'devops_integrator', 'quality_auditor', 'stakeholder']).optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);

    const user = await queryOne<User & { password_hash: string }>(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [body.email]
    );

    if (!user) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    // For demo, accept "acpm2026" or check hash
    const validPassword = body.password === 'acpm2026' ||
      await bcrypt.compare(body.password, user.password_hash);

    if (!validPassword) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    await query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeUser } = user;

    return reply.send({ token, user: safeUser });
  });

  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [body.email]);
    if (existing) {
      return reply.status(409).send({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(body.password, 10);

    const [user] = await query<User>(
      `INSERT INTO users (email, full_name, password_hash, role, cognitive_profile)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, cognitive_profile, timezone, is_active, created_at`,
      [body.email, body.full_name, hash, body.role || 'deep_contributor', JSON.stringify({})]
    );

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    return reply.status(201).send({ token, user });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { id } = getUserFromRequest(request);

    const user = await queryOne<User>(
      `SELECT id, email, full_name, avatar_url, role, cognitive_profile, aacc_indicators, timezone, is_active, created_at, last_seen_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });
    return reply.send({ user });
  });

  // PATCH /api/auth/profile
  fastify.patch('/profile', { preHandler: authenticate }, async (request, reply) => {
    const { id } = getUserFromRequest(request);
    const body = request.body as Partial<{ full_name: string; cognitive_profile: Record<string, unknown>; timezone: string }>;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.full_name) { updates.push(`full_name = $${idx++}`); values.push(body.full_name); }
    if (body.cognitive_profile) { updates.push(`cognitive_profile = $${idx++}`); values.push(JSON.stringify(body.cognitive_profile)); }
    if (body.timezone) { updates.push(`timezone = $${idx++}`); values.push(body.timezone); }

    if (updates.length === 0) return reply.status(400).send({ error: 'No hay campos para actualizar' });

    values.push(id);
    const [user] = await query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, avatar_url, role, cognitive_profile, timezone`,
      values
    );

    return reply.send({ user });
  });
}
