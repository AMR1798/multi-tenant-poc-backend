import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import tenantValidation from '../../validations/tenant.validation';
import tenantController from '../../controllers/tenant.controller';
import { tenant, tenantAuth } from '../../middlewares/tenant';
import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import exclude from '../../utils/exclude';

const router = express.Router();

router.route('/').get(
  catchAsync(async (req, res) => {
    if (!res.locals.TENANT) {
      throw new ApiError(httpStatus.NOT_IMPLEMENTED, 'Tenant Not Enabled');
    }
    res.send({
      message: `Hello from ${res.locals.TENANT.name}`,
      data: exclude(res.locals.TENANT, ['createdBy', 'createdAt', 'updatedAt'])
    });
  })
);
router.route('/slug-check/:slug').get(auth(), tenantController.checkSlug);

router.route('/view').get(tenantAuth(), async (req, res) => {
  res.send({
    message: `Hello from ${res.locals.TENANT.name}`
  });
});
router
  .route('/create')
  .post(auth(), validate(tenantValidation.createTenant), tenantController.createTenant);

export default router;
