import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Token inválido o expirado' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  const user = getUserFromRequest(request);
  if (user.role !== 'admin') {
    reply.status(403).send({ error: 'Forbidden', message: 'Se requieren permisos de administrador' });
  }
}

export function getUserFromRequest(request: FastifyRequest): { id: string; role: string; email: string } {
  return request.user as { id: string; role: string; email: string };
}
