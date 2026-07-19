import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { ApiError } from '../middleware/errorHandler';
import { vehicleCreateSchema, vehicleUpdateSchema } from '../utils/validation';

// GET /api/vehicles - Liste mit Suche/Filter (wie mobile.de Fahrzeugsuche)
// includeDrafts=true erlaubt Admin-Routen, auch ENTWURF-Inserate zu sehen.
// Die oeffentliche Route ruft diese Funktion ohne includeDrafts auf, damit
// Entwuerfe niemals auf der oeffentlichen Seite erscheinen - unabhaengig
// vom uebergebenen status-Filter.
export async function listVehicles(req: Request, res: Response, next: NextFunction, includeDrafts = false) {
  try {
    const {
      make,
      model,
      category,
      fuelType,
      transmission,
      status,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      maxMileage,
      q, // Freitextsuche in title/description
      page = '1',
      pageSize = '20',
    } = req.query as Record<string, string>;

    const where: any = {};
    if (make) where.make = { contains: make };
    if (model) where.model = { contains: model };
    if (category) where.category = category;
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;
    if (status) where.status = status;

    if (!includeDrafts) {
      // Entwuerfe sind nie oeffentlich sichtbar, auch wenn explizit nach
      // status=ENTWURF gefiltert wuerde (Ergebnis ist dann bewusst leer).
      if (where.status === 'ENTWURF') {
        where.status = '__none__'; // erzwingt 0 Treffer, ohne Sonderfall im Query-Builder
      } else {
        where.NOT = { status: 'ENTWURF' };
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (minYear || maxYear) {
      where.firstRegistration = {};
      if (minYear) where.firstRegistration.gte = new Date(`${minYear}-01-01`);
      if (maxYear) where.firstRegistration.lte = new Date(`${maxYear}-12-31`);
    }

    if (maxMileage) {
      where.mileageKm = { lte: Number(maxMileage) };
    }

    if (q) {
      where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 20));

    // Performance: Fuer die Listen-Ansicht werden nur die Felder selektiert,
    // die VehicleCard/VehicleListPage im Frontend tatsaechlich anzeigen -
    // nicht das komplette Vehicle-Objekt (description, vin, alle Detail-
    // Felder). Fotos werden ueber "select" statt "include" direkt in der
    // selben Query mitgeladen (kein N+1-Problem), aber ebenfalls auf die
    // fuer die Kachel-Darstellung noetigen Felder reduziert.
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        select: {
          id: true,
          make: true,
          model: true,
          variant: true,
          category: true,
          condition: true,
          status: true,
          price: true,
          vatDeductible: true,
          firstRegistration: true,
          mileageKm: true,
          powerKw: true,
          powerHp: true,
          fuelType: true,
          transmission: true,
          title: true,
          locationCity: true,
          createdAt: true,
          photos: {
            select: { id: true, filename: true, isMain: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
            where: { isMain: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
      prisma.vehicle.count({ where }),
    ]);

    // Response-Caching: Die oeffentliche Fahrzeugliste aendert sich nicht
    // sekuendlich, ein kurzes Cache-Fenster reduziert wiederholte
    // DB-Roundtrips bei Navigation/Reload deutlich. "public" ist bewusst
    // gewaehlt, da die Liste keine ENTWURF-Fahrzeuge oder sonstige
    // nutzerspezifischen Daten enthaelt (siehe includeDrafts-Filter oben).
    res.set('Cache-Control', 'public, max-age=60');

    res.json({
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/vehicles/:id (oeffentlich, ENTWURF ist nicht abrufbar)
// GET /api/admin/vehicles/:id (Admin, ENTWURF ist abrufbar)
export async function getVehicle(req: Request, res: Response, next: NextFunction, includeDrafts = false) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        documents: true,
        dealer: true,
      },
    });
    if (!vehicle) throw new ApiError(404, 'Fahrzeug nicht gefunden');
    if (!includeDrafts && vehicle.status === 'ENTWURF') {
      // Entwurf existiert, ist aber ueber die oeffentliche Route nicht sichtbar.
      throw new ApiError(404, 'Fahrzeug nicht gefunden');
    }
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
}

// POST /api/vehicles
export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = vehicleCreateSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data });
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
}

// PUT /api/vehicles/:id
export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = vehicleUpdateSchema.parse(req.body);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Fahrzeug nicht gefunden');

    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/vehicles/:id
export async function deleteVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Fahrzeug nicht gefunden');

    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
