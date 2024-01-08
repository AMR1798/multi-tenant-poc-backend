import express from 'express';
import auth from '../../middlewares/auth';
import metaController from '../../controllers/meta.controller';

const router = express.Router();

router.route('/access').get(auth(), metaController.listAccess);

export default router;
