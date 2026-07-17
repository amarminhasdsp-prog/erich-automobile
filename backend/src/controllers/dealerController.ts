import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

// GET /api/dealers - Liste der Haendler (fuer Auswahl im Frontend, aktuell nur einer)
export async function listDealers(_req: Request, res: Response, next: NextFunction) {
  try {
    const dealers = await prisma.dealer.findMany();
    res.json(dealers);
  } catch (err) {
    next(err);
  }
}
