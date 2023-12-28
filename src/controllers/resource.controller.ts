import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { tenantService } from '../services';
import { User } from '@prisma/client';

const getResources = catchAsync(async (req, res) => {
  const { name, slug } = req.body;
  const user = await tenantService.createTenant(name, slug, req.user as User);
  res.status(httpStatus.CREATED).send(user);
});

const showResource = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  console.log(slug);
  const result = await tenantService.getEnabledTenantBySlug(slug);
  res.send({
    available: result ? false : true
  });
});

export default {};
