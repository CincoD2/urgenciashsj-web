import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
neonConfig.fetchConnectionCache = true;
const pool = connectionString ? new Pool({ connectionString }) : undefined;
const adapter = pool ? new PrismaNeon(pool) : undefined;

const prismaClient = global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
