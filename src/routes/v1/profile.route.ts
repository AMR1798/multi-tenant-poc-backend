import express from 'express';
import auth from '../../middlewares/auth';
import profileController from '../../controllers/profile.controller';

const router = express.Router();

router.route('/tenants').get(auth(), profileController.getUserTenantList);

export default router;
