import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { tenantService } from '../services';
import { User } from '@prisma/client';
import { AuthedUser } from '../types/authed-user';

const getUserTenantList = catchAsync(async (req, res) => {
  let { page, limit } = req.query;
  const { sort, order } = req.query;
  const user = req.user as AuthedUser;
  if (!page) {
    page = '1';
  }

  if (!limit) {
    limit = '10';
  }

  const result = await tenantService.listUserTenantPaginated(
    user.id,
    Number(page),
    Number(limit),
    sort as any,
    order as any
  );
  res.send(result);
});

export default {
  getUserTenantList
};
