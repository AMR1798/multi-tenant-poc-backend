import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
// import docsRoute from './docs.route';
import indexRoute from './index.route';
import config from '../../config/config';
import tenantRoute from './tenant.route';
import profileRoute from './profile.route';
import resourceRoute from './resource.route';
import metaRoute from './meta.route';

const router = express.Router();
const apiRouter = express.Router();
const adminApiRouter = express.Router();
const docsRouter = express.Router();

const apiRoutes = [
  {
    path: '',
    route: indexRoute
  },
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/tenants',
    route: tenantRoute
  },
  {
    path: '/profile',
    route: profileRoute
  },
  {
    path: '/resources',
    route: resourceRoute
  },
  {
    path: '/meta',
    route: metaRoute
  }
];
const adminRoutes = [
  {
    path: '/users',
    route: userRoute
  }
];

// const devRoutes = [
//   // routes available only in development mode
//   {
//     path: '/docs',
//     route: docsRoute
//   }
// ];

apiRoutes.forEach((route) => {
  apiRouter.use(route.path, route.route);
});

adminRoutes.forEach((route) => {
  adminApiRouter.use(route.path, route.route);
});

// /* istanbul ignore next */
// if (config.env === 'development') {
//   devRoutes.forEach((route) => {
//     docsRouter.use(route.path, route.route);
//   });
// }

router.use('/admin', adminApiRouter);
router.use('/api', apiRouter);
router.use(docsRouter);

export default router;
