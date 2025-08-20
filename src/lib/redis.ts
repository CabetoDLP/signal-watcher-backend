// lib/redis.ts
import fastifyRedis, { FastifyRedis } from '@fastify/redis';
import type { FastifyInstance } from 'fastify';

export async function setupRedis(app: FastifyInstance) {
  try {
    const redisConfig: any = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      socket: {
        connectTimeout: 5000,
        keepAlive: 5000
      }
    };

    // Add password if provided in environment variables
    if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== '') {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    await app.register(fastifyRedis as any, redisConfig);

    // Verificación de conexión
    await app.redis.ping();

    app.log.info('✅ Redis connected successfully');
  } catch (err) {
    app.log.error({ err }, '❌ Failed to connect to Redis');
    throw err;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: FastifyRedis;
  }
}