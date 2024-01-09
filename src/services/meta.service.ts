import { AccessType } from '@prisma/client';
import { PaginatedData } from '../types/paginated-data';
import { paginate } from '../utils/pagination';
import { AuthedUser } from '../types/authed-user';
import { isAdmin } from '../utils/auth';
import { isMain } from '../utils/tenant';

const listAccessPaginated = async (
  user: AuthedUser,
  page = 1,
  take = 10
): Promise<PaginatedData<{ id: string; label: string }>> => {
  const access = [
    {
      id: AccessType.PRIVATE,
      label: AccessType.PRIVATE[0].toUpperCase() + AccessType.PRIVATE.slice(1).toLowerCase()
    },
    {
      id: AccessType.PUBLIC,
      label: AccessType.PUBLIC[0].toUpperCase() + AccessType.PUBLIC.slice(1).toLowerCase()
    },
    {
      id: AccessType.TENANT,
      label: AccessType.TENANT[0].toUpperCase() + AccessType.TENANT.slice(1).toLowerCase()
    }
  ];
  let filteredAccess;
  if (isAdmin(user) && isMain(user)) {
    filteredAccess = access.filter((e) => {
      return e.id !== AccessType.TENANT;
    });
  } else if (!isAdmin(user) && isMain(user)) {
    filteredAccess = access.filter((e) => {
      return e.id === AccessType.PRIVATE;
    });
  } else {
    filteredAccess = access.filter((e) => {
      return e.id !== AccessType.PUBLIC;
    });
  }

  return paginate(filteredAccess, page, take);
};

export default { listAccessPaginated };
