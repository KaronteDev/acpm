import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { taskRoutes } from './routes/tasks.js';
import { userRoutes } from './routes/users.js';
import { sprintRoutes, wellnessRoutes, dashboardRoutes, knowledgeRoutes } from './routes/other.js';

async function main() {
  const fastify = Fastify({
    logger: process.env.NODE_ENV !== 'production',
  });

  // Plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'acpm_dev_secret_change_in_production',
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'ACPM API', version: '1.0.0' }));

  // Routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(projectRoutes, { prefix: '/api/projects' });
  fastify.register(taskRoutes, { prefix: '/api/tasks' });
  fastify.register(userRoutes, { prefix: '/api/users' });
  fastify.register(sprintRoutes, { prefix: '/api/sprints' });
  fastify.register(wellnessRoutes, { prefix: '/api/wellness' });
  fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
  fastify.register(knowledgeRoutes, { prefix: '/api/knowledge' });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Validación fallida', details: error.message });
    }
    reply.status(error.statusCode || 500).send({
      error: error.message || 'Error interno del servidor',
    });
  });

  // Start
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '127.0.0.1';

  try {
    await fastify.listen({ port, host });
    console.log(`🚀 ACPM API corriendo en http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
