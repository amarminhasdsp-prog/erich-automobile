import { z } from 'zod';

// Validierungs-Schemas fuer Fahrzeug-Anlage/Bearbeitung.
// Enums entsprechen dem Prisma-Schema.

export const fuelTypeEnum = z.enum([
  'BENZIN',
  'DIESEL',
  'ELEKTRO',
  'HYBRID',
  'PLUGIN_HYBRID',
  'GAS_LPG',
  'GAS_CNG',
  'WASSERSTOFF',
]);

export const transmissionEnum = z.enum(['MANUELL', 'AUTOMATIK', 'HALBAUTOMATIK']);

export const categoryEnum = z.enum([
  'PKW',
  'SUV_GELAENDEWAGEN',
  'KOMBI',
  'LIMOUSINE',
  'KLEINWAGEN',
  'CABRIO',
  'TRANSPORTER',
  'MOTORRAD',
  'WOHNMOBIL',
]);

export const conditionEnum = z.enum(['NEU', 'GEBRAUCHT', 'JAHRESWAGEN', 'UNFALLFAHRZEUG', 'VORFUEHRWAGEN']);

export const statusEnum = z.enum(['VERFUEGBAR', 'RESERVIERT', 'VERKAUFT', 'ENTWURF']);

export const documentTypeEnum = z.enum([
  'TUEV_BERICHT',
  'FAHRZEUGSCHEIN',
  'FAHRZEUGBRIEF',
  'RECHNUNG',
  'SERVICEHEFT',
  'GUTACHTEN',
  'SONSTIGES',
]);

export const vehicleCreateSchema = z.object({
  dealerId: z.string().uuid(),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  variant: z.string().max(60).optional(),
  category: categoryEnum,
  condition: conditionEnum,
  status: statusEnum.optional(),

  price: z.number().int().nonnegative(),
  vatDeductible: z.boolean().optional(),

  firstRegistration: z.coerce.date(),
  mileageKm: z.number().int().nonnegative(),
  powerKw: z.number().int().nonnegative(),
  powerHp: z.number().int().nonnegative(),
  fuelType: fuelTypeEnum,
  transmission: transmissionEnum,
  cubicCapacity: z.number().int().nonnegative().optional(),
  cylinders: z.number().int().nonnegative().optional(),
  fuelConsumption: z.number().nonnegative().optional(),
  co2Emissions: z.number().int().nonnegative().optional(),
  emissionClass: z.string().max(20).optional(),
  numberOfDoors: z.number().int().nonnegative().optional(),
  numberOfSeats: z.number().int().nonnegative().optional(),
  previousOwners: z.number().int().nonnegative().optional(),

  exteriorColor: z.string().max(40).optional(),
  interiorColor: z.string().max(40).optional(),
  interiorMaterial: z.string().max(40).optional(),

  features: z.string().max(2000).optional(),

  title: z.string().min(1).max(150),
  description: z.string().min(1).max(5000),

  locationCity: z.string().max(80).optional(),
  locationPostalCode: z.string().max(10).optional(),

  vin: z.string().max(30).optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial().omit({ dealerId: true });

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;

// Validierungs-Schemas fuer Admin-Benutzerverwaltung (siehe AdminUser-Model).
export const adminRoleEnum = z.enum(['ADMIN', 'EDITOR']);

export const adminLoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

// Passwort-Mindestanforderungen: min. 12 Zeichen, mind. 1 Ziffer und 1 Buchstabe.
// Bewusst kein Sonderzeichen-Zwang (fuehrt in der Praxis oft zu schwaecheren,
// vorhersehbaren Mustern), dafuer eine hoehere Mindestlaenge.
const strongPassword = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein')
  .max(200)
  .regex(/[0-9]/, 'Passwort muss mindestens eine Ziffer enthalten')
  .regex(/[A-Za-z]/, 'Passwort muss mindestens einen Buchstaben enthalten');

export const adminUserCreateSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(100),
  password: strongPassword,
  role: adminRoleEnum,
});

export const adminUserUpdateSchema = z.object({
  email: z.string().email().max(200).optional(),
  name: z.string().min(1).max(100).optional(),
  password: strongPassword.optional(),
  role: adminRoleEnum.optional(),
});

export const adminUserChangeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: strongPassword,
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
