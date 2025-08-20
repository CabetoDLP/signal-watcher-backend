// src/server.ts
import fastify from 'fastify';
import app from './app';

const start = async () => {
  const server = fastify({ logger: true });

  // registra el plugin que exportas en app.ts
  server.register(app);

  try {
    const address = await server.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    server.log.info(`Server running on ${address}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
