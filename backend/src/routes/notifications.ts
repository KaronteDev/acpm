import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool.js';
import { Notification } from '../types/index.js';
import { authenticate, getUserFromRequest } from '../middleware/auth.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // GET /api/notifications - Get user's notifications
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const { unread } = request.query as { unread?: string };

    let sql = `
      SELECT 
        n.*,
        u.full_name as related_user_name, u.avatar_url as related_user_avatar,
        c.content as comment_content,
        t.title as task_title
      FROM notifications n
      LEFT JOIN users u ON u.id = n.related_user_id
      LEFT JOIN comments c ON c.id = n.comment_id
      LEFT JOIN tasks t ON t.id = n.task_id
      WHERE n.user_id = $1
    `;
    const params: any[] = [userId];

    if (unread === 'true') {
      sql += ` AND n.is_read = FALSE`;
    }

    sql += ` ORDER BY n.created_at DESC LIMIT 50`;

    const notifications = await query<Notification>(sql, params);

    return reply.send({ notifications });
  });

  // GET /api/notifications/unread-count - Get count of unread notifications
  fastify.get('/unread-count', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);

    const [result] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return reply.send({ unread_count: result ? parseInt(result.count as string) : 0 });
  });

  // PATCH /api/notifications/:id/read - Mark notification as read
  fastify.patch('/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const { id: notificationId } = request.params as { id: string };

    const notification = await queryOne(
      `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (!notification) {
      return reply.status(404).send({ error: 'Notificación no encontrada' });
    }

    const [updated] = await query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 RETURNING *`,
      [notificationId]
    );

    return reply.send({ notification: updated });
  });

  // PATCH /api/notifications/mark-all-read - Mark all notifications as read
  fastify.patch('/mark-all-read', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);

    await query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return reply.send({ success: true });
  });

  // DELETE /api/notifications/:id - Delete a notification
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = getUserFromRequest(request);
    const { id: notificationId } = request.params as { id: string };

    const notification = await queryOne(
      `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (!notification) {
      return reply.status(404).send({ error: 'Notificación no encontrada' });
    }

    await query(`DELETE FROM notifications WHERE id = $1`, [notificationId]);

    return reply.send({ success: true });
  });
}
