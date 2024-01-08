import { Role } from '@prisma/client';
import { AuthedUser } from '../types/authed-user';

function isMain(user: AuthedUser): boolean {
  return user.tenant ? false : true;
}

export { isMain };
