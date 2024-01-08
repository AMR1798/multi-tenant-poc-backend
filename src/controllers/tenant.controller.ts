import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { tenantService } from '../services';
import { User } from '@prisma/client';

const createTenant = catchAsync(async (req, res) => {
  const { name, slug } = req.body;
  const user = await tenantService.createTenant(name, slug, req.user as User);
  res.status(httpStatus.CREATED).send(user);
});

const checkSlug = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  const result = await tenantService.getEnabledTenantBySlug(slug);
  res.send({
    available: result ? false : true
  });
});

// const getTenants = catchAsync(async (req, res) => {
//   const filter = pick(req.query, ['name', 'role']);
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await tenantService.queryTenants(filter, options);
//   res.send(result);
// });

// const getTenant = catchAsync(async (req, res) => {
//   const user = await tenantService.getTenantById(req.params.userId);
//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found');
//   }
//   res.send(user);
// });

// const updateTenant = catchAsync(async (req, res) => {
//   const user = await tenantService.updateTenantById(req.params.userId, req.body);
//   res.send(user);
// });

// const deleteTenant = catchAsync(async (req, res) => {
//   await tenantService.deleteTenantById(req.params.userId);
//   res.status(httpStatus.NO_CONTENT).send();
// });

export default {
  createTenant,
  checkSlug
  // getTenants,
  // getTenant,
  // updateTenant,
  // deleteTenant
};
