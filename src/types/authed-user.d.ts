import { User } from '@prisma/client';

export type AuthedUser = User & { tenant?: string };
