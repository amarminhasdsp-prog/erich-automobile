import { PrismaClient } from '@prisma/client';

// Ein einzelner PrismaClient fuer die gesamte App (empfohlenes Muster)
export const prisma = new PrismaClient();
