import catchAsync from '../utils/catchAsync';
import { tenantService } from '../services';
import { AccessType, ResourceType, Tenant } from '@prisma/client';
import resourceService from '../services/resource.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { create } from 'domain';
import { AuthedUser } from '../types/authed-user';

const listResources = catchAsync(async (req, res) => {
  let { page, limit } = req.query;
  const { sort, order } = req.query;
  const user = req.user as AuthedUser;
  if (!page) {
    page = '1';
  }

  if (!limit) {
    limit = '10';
  }

  const result = await resourceService.listResourcesPaginated(
    user,
    Number(page),
    Number(limit),
    sort as any,
    order as any
  );
  res.send(result);
});

const getResource = catchAsync(async (req, res) => {
  const { resourceId } = req.params;
  if (!resourceId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid resource id');
  }
  const user = req.user as AuthedUser;
  const result = await resourceService.getResource(Number(resourceId), user);
  // check if user are able to view the resource based on its tenant
  if (result.access === AccessType.TENANT && result.tenantId) {
    if (result.tenantId !== user.tenant?.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized to view the resource');
    }
  }
  res.send(result);
});

const createResource = catchAsync(async (req, res) => {
  const { type } = req.body;
  const user = req.user as AuthedUser;
  if (type === ResourceType.NOTE) {
    const { title, content, access, delta } = req.body;
    const result = await resourceService.createNote(
      title,
      content,
      delta,
      access ?? AccessType.PRIVATE,
      user
    );
    res.status(httpStatus.CREATED).send(result);
  } else {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, 'Resource type not yet implemented');
  }
});

const updateResource = catchAsync(async (req, res) => {
  const { type } = req.body;
  const { resourceId } = req.params;
  const user = req.user as AuthedUser;
  if (type === ResourceType.NOTE) {
    const { title, content, access, delta } = req.body;
    const result = await resourceService.updateNote(
      resourceId,
      title,
      content,
      delta,
      access ?? AccessType.PRIVATE,
      user
    );
    res.send(result);
  } else {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, 'Resource type not yet implemented');
  }
});

export default { listResources, getResource, createResource, updateResource };
