import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';
import { analyzeEvent } from '../lib/ai';

export default async (app: FastifyInstance) => {
  app.post('/create', async (req, reply) => {
    const { watchlistId, description } = req.body as { 
      watchlistId: string;
      description: string 
    };

    const aiAnalysis = await analyzeEvent(description);

    const event = await prisma.event.create({
      data: {
        watchlistId,
        description,
        aiSummary: aiAnalysis.summary,
        aiSeverity: aiAnalysis.severity,
        aiAction: aiAnalysis.suggestedAction
      }
    });

    return reply.code(201).send(event);
  });

  app.get('/:watchlistId', async (req, reply) => {
    const { watchlistId } = req.params as { watchlistId: string };
    return prisma.event.findMany({ where: { watchlistId } });
  });
};