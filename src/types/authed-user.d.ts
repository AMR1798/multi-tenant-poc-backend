import { Tenant, User } from '@prisma/client';

export type AuthedUser = User & { tenant?: Tenant };
