import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { authenticate, getUserFromRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';

const PreferencesSchema = z.object({
  theme_preference: z.enum(['light', 'high_contrast', 'colorblind', 'dark']).optional(),
  text_to_speech_enabled: z.boolean().optional(),
  tts_voice: z.string().optional(),
  tts_rate: z.number().min(0.5).max(2.0).optional(),
  font_size_preference: z.enum(['small', 'normal', 'large', 'extra_large']).optional(),
});

export async function currentUserRoutes(fastify: FastifyInstance) {
  // GET /api/user/preferences - Get current user preferences
  fastify.get('/preferences', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);

    const user = await queryOne<User & {
      theme_preference: string;
      text_to_speech_enabled: boolean;
      tts_voice: string;
      tts_rate: number;
      font_size_preference: string;
    }>(
      `SELECT 
        id, email, full_name, role, 
        theme_preference, 
        text_to_speech_enabled, 
        tts_voice, 
        tts_rate,
        font_size_preference 
      FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      theme_preference: user.theme_preference || 'light',
      text_to_speech_enabled: user.text_to_speech_enabled || false,
      tts_voice: user.tts_voice || 'default',
      tts_rate: user.tts_rate || 1.0,
      font_size_preference: user.font_size_preference || 'normal',
    });
  });

  // PATCH /api/user/preferences - Update current user preferences
  fastify.patch('/preferences', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const body = PreferencesSchema.parse(request.body);

    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (body.theme_preference !== undefined) {
      updates.push(`theme_preference = $${paramIndex}`);
      values.push(body.theme_preference);
      paramIndex++;
    }

    if (body.text_to_speech_enabled !== undefined) {
      updates.push(`text_to_speech_enabled = $${paramIndex}`);
      values.push(body.text_to_speech_enabled);
      paramIndex++;
    }

    if (body.tts_voice !== undefined) {
      updates.push(`tts_voice = $${paramIndex}`);
      values.push(body.tts_voice);
      paramIndex++;
    }

    if (body.tts_rate !== undefined) {
      updates.push(`tts_rate = $${paramIndex}`);
      values.push(body.tts_rate);
      paramIndex++;
    }

    if (body.font_size_preference !== undefined) {
      updates.push(`font_size_preference = $${paramIndex}`);
      values.push(body.font_size_preference);
      paramIndex++;
    }

    if (updates.length === 0) {
      return reply.send({ message: 'No preferences to update' });
    }

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1`,
      values
    );

    // Return updated preferences
    const user = await queryOne<User & {
      theme_preference: string;
      text_to_speech_enabled: boolean;
      tts_voice: string;
      tts_rate: number;
      font_size_preference: string;
    }>(
      `SELECT 
        id, email, full_name, role,
        theme_preference, 
        text_to_speech_enabled, 
        tts_voice, 
        tts_rate,
        font_size_preference 
      FROM users WHERE id = $1`,
      [userId]
    );

    return reply.send({
      message: 'Preferences updated',
      preferences: {
        theme_preference: user?.theme_preference || 'light',
        text_to_speech_enabled: user?.text_to_speech_enabled || false,
        tts_voice: user?.tts_voice || 'default',
        tts_rate: user?.tts_rate || 1.0,
        font_size_preference: user?.font_size_preference || 'normal',
      },
    });
  });

  // GET /api/user/profile - Get current user profile
  fastify.get('/profile', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);

    const user = await queryOne<User & {
      theme_preference: string;
      text_to_speech_enabled: boolean;
      tts_voice: string;
      tts_rate: number;
      font_size_preference: string;
    }>(
      `SELECT 
        id, email, full_name, role, is_active, created_at,
        theme_preference, 
        text_to_speech_enabled, 
        tts_voice, 
        tts_rate,
        font_size_preference 
      FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send(user);
  });
}
