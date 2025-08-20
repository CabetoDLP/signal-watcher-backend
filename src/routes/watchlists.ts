import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/db';

// 1. Definir tipos para los parámetros
interface IParams {
  id: string;
}

// 2. Esquemas de validación con Zod
const watchlistIdParamsSchema = z.object({
  id: z.string().uuid()
});

const createWatchlistSchema = z.object({
  name: z.string().min(3).max(50)
});

// 3. Esquemas JSON para Fastify
const fastifySchemas = {
  createWatchlistBody: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 50 }
    }
  },
  watchlistResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  watchlistWithEventsResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            aiSummary: { type: 'string', nullable: true },
            aiSeverity: { 
              type: 'string', 
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              nullable: true 
            },
            aiAction: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  watchlistArrayResponse: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

export default async (app: FastifyInstance) => {
  // POST /api/watchlists - Crear nueva watchlist
  app.post('/', {
    schema: {
      body: fastifySchemas.createWatchlistBody,
      response: {
        201: fastifySchemas.watchlistResponse,
        400: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'array' } } },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } }
      }
    }
  }, async (req, reply) => {
    try {
      const { name } = createWatchlistSchema.parse(req.body);
      const watchlist = await prisma.watchlist.create({
        data: { name },
        select: { id: true, name: true, createdAt: true, updatedAt: true }
      });
      return reply.code(201).send(watchlist);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'Watchlist name already exists' });
      }
      throw error;
    }
  });

  // GET /api/watchlists - Listar todas las watchlists
  app.get('/', {
    schema: {
      response: {
        200: fastifySchemas.watchlistArrayResponse,
        500: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } }
      }
    }
  }, async (req, reply) => {
    try {
      const watchlists = await prisma.watchlist.findMany({
        select: { id: true, name: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send(watchlists);
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve watchlists'
      });
    }
  });

  // GET /api/watchlists/:id - Obtener watchlist con eventos
  app.get<{Params: IParams}>('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      response: {
        200: fastifySchemas.watchlistWithEventsResponse,
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = watchlistIdParamsSchema.parse(req.params);
      const watchlist = await prisma.watchlist.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          events: {
            select: {
              id: true,
              description: true,
              aiSummary: true,
              aiSeverity: true,
              aiAction: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });
      return reply.send(watchlist);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Not Found', message: 'Watchlist not found' });
      }
      throw error;
    }
  });

  // PUT /api/watchlists/:id - Actualizar watchlist
  app.put<{Params: IParams}>('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      body: fastifySchemas.createWatchlistBody,
      response: {
        200: fastifySchemas.watchlistResponse,
        400: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'array' } } },
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = watchlistIdParamsSchema.parse(req.params);
      const { name } = createWatchlistSchema.parse(req.body);
      const updated = await prisma.watchlist.update({
        where: { id },
        data: { name },
        select: { id: true, name: true, createdAt: true, updatedAt: true }
      });
      return reply.send(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Not Found', message: 'Watchlist not found' });
      }
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'Watchlist name already exists' });
      }
      throw error;
    }
  });

  // DELETE /api/watchlists/:id - Eliminar watchlist
  app.delete<{Params: IParams}>('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = watchlistIdParamsSchema.parse(req.params);
      await prisma.watchlist.delete({ where: { id } });
      return reply.code(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Not Found', message: 'Watchlist not found' });
      }
      throw error;
    }
  });
};