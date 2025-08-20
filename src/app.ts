import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { setupRedis } from './lib/redis';
import watchlistsRoutes from './routes/watchlists';
import eventsRoutes from './routes/events';
import crypto from 'crypto';
import { prisma } from './lib/db';

const app: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. Configuración inicial
  fastify.log.info('Configurando plugins...');
  
  // 2. Plugins esenciales
  await fastify.register(fastifyCors, { 
    origin: process.env.NODE_ENV === 'production' ? /\.dominio\.com$/ : '*'
  });
  await fastify.register(fastifyHelmet);

  // 3. Redis con verificación de conexión
  try {
    await setupRedis(fastify);
    // Verificación real de conexión
    await fastify.redis.ping();
    fastify.log.info('✅ Redis conectado');
  } catch (err) {
    fastify.log.error({ error: err }, '❌ Error conectando a Redis');
    throw err;
  }

  // 5. Hooks
  fastify.addHook('onRequest', (request, reply, done) => {
    request.startTime = Date.now();
    request.id = crypto.randomUUID();
    request.log = request.log.child({ 
      correlationId: request.id,
      path: request.url // Usa request.url que siempre existe
    });
    done();
  });

  fastify.addHook("onRequest", (req, reply, done) => {
    req.startTime = Date.now();
    done();
  });

  fastify.addHook("onResponse", (req, reply, done) => {
    const elapsed = Date.now() - req.startTime;
    req.log.info({ elapsed }, "request completed");
    done();
  });

  // 6. Rutas
  await fastify.register(watchlistsRoutes, { prefix: '/api/watchlists' });
  await fastify.register(eventsRoutes, { prefix: '/api/events' });

  // 7. Health check mejorado
  fastify.get('/health', async () => {
    try {
      // Verificar Redis
      const redisPing = await fastify.redis.ping();
      const redisStatus = redisPing === 'PONG' ? 'connected' : 'unhealthy';
      
      // Verificar base de datos usando la instancia singleton de Prisma
      await prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'connected';
      
      return {
        status: 'ok',
        services: {
          redis: redisStatus,
          database: dbStatus,
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: {
            rss: process.memoryUsage().rss,
            heapTotal: process.memoryUsage().heapTotal,
            heapUsed: process.memoryUsage().heapUsed,
          },
          nodeVersion: process.version,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error({ error }, 'Health check failed');
      
      // Determinar qué servicio falló
      let failedService = 'unknown';
      try {
        await fastify.redis.ping();
      } catch (e) {
        failedService = 'redis';
      }
      
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (e) {
        failedService = failedService === 'unknown' ? 'database' : 'multiple';
      }

      return {
        status: 'unhealthy',
        error: 'Service unavailable',
        failedService,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
  });
};

export default app;