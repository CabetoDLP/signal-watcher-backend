import 'fastify'

// En tu archivo de tipos (types/fastify.d.ts)
declare module 'fastify' {
  interface FastifyRequest {
    startTime: number;
    id: string;
  }
  
  interface FastifyReply {
    calculateElapsedTime(): string;
  }
}

// En tu app.ts
const app: FastifyPluginAsync = async (fastify) => {
  // ... otras configuraciones

  // 1. Decorador corregido
  fastify.decorateReply('elapsedTime', function (this: { request: FastifyRequest }) {
    return `${Date.now() - this.request.startTime}ms`;
  });

  // 2. Hook onRequest corregido
  fastify.addHook('onRequest', (request, reply, done) => {
    request.startTime = Date.now();
    request.id = crypto.randomUUID();
    request.log = request.log.child({
      correlationId: request.id,
      path: request.url // Usando request.url que siempre existe
    });
    done();
  });

  // 3. Hook onResponse corregido
  fastify.addHook('onResponse', (request, reply, done) => {
    request.log.info({
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime(), // Ahora reconocido correctamente
      method: request.method,
      path: request.url
    }, 'Request completed');
    done();
  });

};