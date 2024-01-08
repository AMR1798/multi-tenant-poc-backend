import { AccessType, Note, Prisma, Resource, ResourceType, Role, Tenant } from '@prisma/client';
import prisma from '../client';
import { PaginatedData } from '../types/paginated-data';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { NoteResource } from '../types/note-resource';
import { tenant } from '../middlewares/tenant';
import { access } from 'fs';
import exclude from '../utils/exclude';
import pick from '../utils/pick';
import { AuthedUser } from '../types/authed-user';
import { calcNumPages } from '../utils/pagination';
import { decodeHTMLString } from '../utils/html';
import { isAdmin } from '../utils/auth';

const enabledType = [ResourceType.NOTE];

const getResource = async (id: number, user: AuthedUser): Promise<NoteResource> => {
  const tenantWhere = {
    id,
    type: {
      in: enabledType
    },
    tenantId: user.tenant ? user.tenant.id : undefined,
    access: user.tenant ? AccessType.TENANT : AccessType.PUBLIC, // fallback to public resource if access is without tenant
    deletedAt: null
  };

  const privateWhere = {
    id,
    type: {
      in: enabledType
    },
    access: AccessType.PRIVATE, // if done correctly, should be impossible to have PUBLIC access without tenantId
    tenantId: user.tenant ? user.tenant.id : undefined,
    createdBy: user?.id,
    deletedAt: null
  };
  const resource = await prisma.resource.findFirst({
    where: {
      OR: [tenantWhere, privateWhere]
    },
    include: {
      user: true
    }
  });

  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  if (resource.type == ResourceType.NOTE) {
    const data = await getNote(resource.id);
    if (!data) {
      throw new ApiError(404, `Resource of type ${resource.type} not found'`);
    }
    return {
      ...resource,
      note: data,
      user: pick(resource.user, ['id', 'name'])
    };
  } else {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, 'Resource type not yet implemented');
  }
};

const getNote = async (resourceId: number): Promise<Note | null> => {
  return await prisma.note.findFirst({
    where: {
      resourceId
    }
  });
};

const listResourcesPaginated = async (
  user: AuthedUser,
  page = 1,
  take = 10,
  _sort = 'createdAt',
  _order: Prisma.SortOrder = 'desc'
): Promise<PaginatedData<NoteResource>> => {
  const skip = (page - 1) * take;
  let sort = (_sort ?? 'createdAt').toString();

  if (['id'].includes(sort)) {
    sort = 'tenantId';
  }
  const order = _order ?? 'desc';
  const orderBy = { [sort]: order };

  const tenantWhere = {
    type: {
      in: enabledType
    },
    tenantId: user.tenant ? user.tenant.id : undefined,
    access: user.tenant ? AccessType.TENANT : AccessType.PUBLIC, // fallback to public resource if access is without tenant
    deletedAt: null
  };

  const privateWhere = {
    type: {
      in: enabledType
    },
    access: AccessType.PRIVATE, // if done correctly, should be impossible to have PUBLIC access without tenantId
    tenantId: user.tenant ? user.tenant.id : undefined,
    createdBy: user?.id,
    deletedAt: null
  };

  const allWhere = {
    OR: [tenantWhere, privateWhere]
  };
  const res = await prisma.$transaction([
    prisma.resource.count({
      where: allWhere
    }),
    prisma.resource.findMany({
      take,
      skip,
      where: allWhere,
      include: {
        note: true,
        user: true
      },
      orderBy
    })
  ]);

  return {
    total: res[0],
    data: res[1].map((e) => {
      return {
        ...e,
        user: pick(e.user, ['id', 'name'])
      };
    }),
    page,
    nextPage: page + 1,
    pages: calcNumPages(res[0], take),
    limit: take
  };
};

const createNote = async (
  title: string,
  content: string,
  delta: object,
  access: AccessType,
  user: AuthedUser
): Promise<NoteResource> => {
  // use transaction to make sure insert on resource and note table are both successful
  // to avoid creating empty resource

  // Start a transaction
  try {
    const tenant = user.tenant;
    const result = await prisma.$transaction(async (_prisma) => {
      const res = await _prisma.resource.create({
        data: {
          title,
          createdBy: user.id,
          type: ResourceType.NOTE,
          pinned: false,
          tenantId: tenant?.id,
          access
        }
      });
      const data = await _prisma.note.create({
        data: {
          resourceId: res.id,
          content: decodeHTMLString(content), // need to cleanup encoded html string
          delta
        }
      });

      return {
        ...res,
        note: data,
        user: pick(user, ['id', 'name'])
      };
    });
    return result;
  } catch (e) {
    // rollback handled by _prisma
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating note');
  }
};

const updateNote = async (
  id: number,
  title: string,
  content: string,
  delta: object,
  access: AccessType,
  user: AuthedUser
): Promise<NoteResource> => {
  // use transaction to make sure insert on resource and note table are both successful
  // to avoid creating empty resource

  // do validation on this level?
  const resource = await prisma.resource.findFirst({
    where: {
      id
    }
  });

  if (!isAdmin(user) && resource?.createdBy === user.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized to perform action on resource');
  }
  // Start a transaction
  try {
    const result = await prisma.$transaction(async (_prisma) => {
      const res = await _prisma.resource.update({
        where: { id },
        data: {
          title,
          updatedAt: new Date(),
          type: ResourceType.NOTE,
          access
        }
      });
      const data = await _prisma.note.update({
        where: { resourceId: id },
        data: {
          content: decodeHTMLString(content),
          delta
        }
      });

      return {
        ...res,
        note: data,
        user: pick(user, ['id', 'name'])
      };
    });
    return result;
  } catch (e) {
    // rollback handled by _prisma
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating note');
  }
};

export default { listResourcesPaginated, getResource, createNote, updateNote };
