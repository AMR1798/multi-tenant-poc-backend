import express from 'express';
import auth from '../../middlewares/auth';
import resourceController from '../../controllers/resource.controller';
import validate from '../../middlewares/validate';
import resourceValidation from '../../validations/resource.validation';
import { tenantAuth } from '../../middlewares/tenant';

const router = express.Router();

router
  .route('/')
  .get(auth(true), resourceController.listResources)
  .post(auth(), validate(resourceValidation.createResource), resourceController.createResource);

router
  .route('/:resourceId')
  .get(auth(true), resourceController.getResource)
  .patch(auth(), validate(resourceValidation.updateResource), resourceController.updateResource);

export default router;
