import { User, Role, Prisma, Tenant } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import { encryptPassword } from '../utils/encryption';
import tenantService from './tenant.service';
import { AuthedUser } from '../types/authed-user';
import { PaginatedData } from '../types/paginated-data';
import { calcNumPages } from '../utils/pagination';
import exclude from '../utils/exclude';
import pick from '../utils/pick';

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (
  email: string,
  password: string,
  name?: string,
  tenant?: Tenant,
  role: Role = Role.USER
): Promise<User> => {
  const existing = await getUserByEmail(email);
  if (existing && tenant) {
    if (await tenantService.isPartOfTenant(tenant.id, existing.id)) {
      throw new ApiError(400, 'User already registered to this tenant');
    } else {
      // not part of tenant, add
      await tenantService.addUserToTenant(tenant.id, existing.id);
      return existing;
    }
  }

  if (existing && !tenant) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: await encryptPassword(password),
      role
    }
  });
  if (tenant) {
    await tenantService.addUserToTenant(tenant.id, user.id);
  }

  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async <Key extends keyof User>(
  user: AuthedUser,
  filter: Record<string, any>,
  options: {
    limit?: number;
    page?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  },
  keys: Key[] = [
    'id',
    'email',
    'name',
    'role',
    'isEmailVerified',
    'createdAt',
    'updatedAt',
    'deletedAt'
  ] as Key[]
): Promise<PaginatedData<Pick<User, Key>>> => {
  const tenant = user.tenant;
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sort = options.sort;
  const order = options.order ?? 'desc';
  const skip = (page - 1) * limit;
  const select = {
    ...keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    ...(tenant
      ? {
          TenantUser: {
            select: {
              role: true,
              deletedAt: true
            },
            where: {
              tenantId: tenant.id // Filter TenantUser records by tenantId,
            }
          }
        }
      : {})
  } as Prisma.UserSelect;
  // for role filter handling
  const filterPick = pick(filter, ['role']);
  const where = {
    ...(tenant
      ? {
          ...exclude(filter, ['role']),
          TenantUser: {
            some: {
              tenantId: tenant.id,
              ...filterPick
            }
          }
        }
      : { ...filter })
  };
  const result = await prisma.$transaction(async (_prisma) => {
    const count = await _prisma.user.count({
      where
    });

    const users = await prisma.user.findMany({
      where,
      select: {
        ...select
      },
      skip,
      take: limit,
      orderBy: sort ? { [sort]: order } : undefined
    });

    return {
      total: count,
      data: users.map((u) => {
        return exclude(
          {
            ...u,
            role: u.TenantUser?.length ? u.TenantUser[0].role : u.role,
            deletedAt: u.TenantUser?.length ? u.TenantUser[0].deletedAt : u.deletedAt
          },
          ['TenantUser']
        ) as Pick<User, Key>;
      }),
      page,
      nextPage: page + 1,
      pages: calcNumPages(count, limit),
      limit
    } as PaginatedData<Pick<User, Key>>;
  });
  return result;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserById = async <Key extends keyof User>(
  id: number,
  keys: Key[] = [
    'id',
    'email',
    'name',
    'password',
    'role',
    'isEmailVerified',
    'createdAt',
    'updatedAt'
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  }) as Promise<Pick<User, Key> | null>;
};

/**
 * Get user by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserByEmail = async <Key extends keyof User>(
  email: string,
  keys: Key[] = [
    'id',
    'email',
    'name',
    'password',
    'role',
    'isEmailVerified',
    'createdAt',
    'updatedAt'
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  return prisma.user.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  }) as Promise<Pick<User, Key> | null>;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async <Key extends keyof User>(
  userId: number,
  updateBody: Prisma.UserUpdateInput,
  keys: Key[] = ['id', 'email', 'name', 'role'] as Key[]
): Promise<Pick<User, Key> | null> => {
  const user = await getUserById(userId, ['id', 'email', 'name']);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  });
  return updatedUser as Pick<User, Key> | null;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: number): Promise<User> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await prisma.user.delete({ where: { id: user.id } });
  return user;
};

const disableUserById = async (id: number): Promise<void> => {
  try {
    await prisma.user.updateMany({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    });
  } catch (e) {
    throw new ApiError(500, 'failed to disable user');
  }
};

const enableUserById = async (id: number): Promise<void> => {
  try {
    await prisma.user.updateMany({
      where: {
        id
      },
      data: {
        deletedAt: null
      }
    });
  } catch (e) {
    throw new ApiError(500, 'failed to enable user');
  }
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  disableUserById,
  enableUserById
};
