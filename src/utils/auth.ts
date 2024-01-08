import { Role } from '@prisma/client';
import { AuthedUser } from '../types/authed-user';

function isAdmin(user: AuthedUser): boolean {
  return [Role.SUPERADMIN, Role.ADMIN].includes(user.role as 'SUPERADMIN' | 'ADMIN');
}

export { isAdmin };
