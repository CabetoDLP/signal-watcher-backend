// lib/db.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

// Función para verificar conexión que maneja el caso undefined
export const checkDbConnection = async () => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Asegurarnos de que la exportación no sea undefined
export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}