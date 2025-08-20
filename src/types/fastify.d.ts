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

