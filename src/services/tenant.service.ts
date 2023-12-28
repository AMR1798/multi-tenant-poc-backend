import { Prisma, Role, Tenant, TenantUser, User } from '@prisma/client';
import prisma from '../client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { PaginatedData } from '../types/paginated-data';
import { tenant } from '../middlewares/tenant';
import exclude from '../utils/exclude';

/**
 * Get enabled tenant by slug
 * @param {String} slug
 * @returns {Promise<Tenant| null>}
 */
const getEnabledTenantBySlug = async (slug: string): Promise<Tenant | null> => {
  return prisma.tenant.findFirst({
    where: {
      slug: slug,
      enable: true
    }
  });
};

/**
 * Create tenant
 * @param name string
 * @param slug string
 * @param user User
 * @returns {Promise<Tenant>}
 */
const createTenant = async (name: string, slug: string, user: User): Promise<Tenant> => {
  if (await getEnabledTenantBySlug(slug)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tenant already taken');
  }

  // create tenant
  const tenant = await prisma.tenant.create({
    data: { name, slug, enable: true, updatedAt: new Date(), createdBy: user.id }
  });

  // insert user as part of tenant
  addUserToTenant(tenant.id, user.id);
  return tenant;
};

/**
 * Create tenant
 * @param tenantId number
 * @param userId number
 * @returns {Promise<void>}
 */
const addUserToTenant = async (tenantId: number, userId: number): Promise<void> => {
  // insert user as part of tenant
  await prisma.tenantUser.create({
    data: {
      tenantId,
      userId
    }
  });
};

/**
 * Check if user is part of tenant
 * @param tenantId number
 * @param userId number
 * @returns {Promise<Boolean>}
 */
const isPartOfTenant = async (tenantId: number, userId: number): Promise<boolean> => {
  const res = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId
    }
  });
  if (!res) {
    return false;
  }
  return true;
};

/**
 * Get user tenant role
 * @param tenantId number
 * @param userId number
 * @returns {Promise<String>}
 */
const getUserTenantRole = async (tenantId: number, userId: number): Promise<Role> => {
  const res = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId
    }
  });
  if (!res) {
    return Role.USER;
  }
  return res.role;
};

const listUserTenantPaginated = async (
  userId: number,
  page = 1,
  take = 10,
  _sort = 'id',
  _order: Prisma.SortOrder = 'asc'
): Promise<
  PaginatedData<
    Omit<Tenant, 'createdAt' | 'updatedAt' | 'createdBy'> & Pick<TenantUser, 'role' | 'joinedAt'>
  >
> => {
  const skip = (page - 1) * take;
  let sort = (_sort ?? 'tenantId').toString();

  if (['id'].includes(sort)) {
    sort = 'tenantId';
  }
  const order = _order ?? 'asc';
  const orderBy = { [sort]: order };
  const res = await prisma.$transaction([
    prisma.tenantUser.count({
      where: {
        userId
      }
    }),
    prisma.tenantUser.findMany({
      take,
      skip,
      where: {
        userId
      },
      include: {
        tenant: true
      },
      orderBy
    })
  ]);
  const mapped = res[1].map((e) => {
    return {
      role: e.role,
      joinedAt: e.joinedAt,
      ...exclude(e.tenant as Tenant, ['createdAt', 'updatedAt', 'createdBy'])
    };
  });

  return {
    total: res[0],
    data: mapped,
    page,
    nextPage: page + 1,
    limit: take
  };
};

export default {
  getEnabledTenantBySlug,
  createTenant,
  isPartOfTenant,
  addUserToTenant,
  getUserTenantRole,
  listUserTenantPaginated
};
