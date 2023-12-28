import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import tenantService from '../services/tenant.service';
import { Tenant, User } from '@prisma/client';
import passport from 'passport';
import { JwtPayload } from '../types/jwt-payload';
import { AuthedUser } from '../types/authed-user';

const verifyCallback =
  (req: any, res: any, resolve: (value?: unknown) => void, reject: (reason?: unknown) => void) =>
  async (err: unknown, user: AuthedUser | false, info: any) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;

    if (!res.locals.TENANT) {
      return reject(new ApiError(httpStatus.NOT_IMPLEMENTED, 'Tenant Not Enabled'));
    }
    if (res.locals.TENANT.slug !== user.tenant) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token for tenant'));
    }
    resolve();
  };

const tenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    res.locals.TENANT = undefined;
    const s = req.subdomains.pop();
    if (!s) {
      resolve();
      return;
    }
    const tenant = await tenantService.getEnabledTenantBySlug(s as string);

    if (!tenant) {
      return reject(new ApiError(httpStatus.NOT_IMPLEMENTED, 'Tenant Not Enabled'));
    }
    res.locals.TENANT = tenant;
    resolve();
  })
    .then(() => next())
    .catch((err) => next(err));
};

const tenantAuth = () => async (req: Request, res: Response, next: NextFunction) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, res, resolve, reject))(
      req,
      res,
      next
    );
  })
    .then(() => next())
    .catch((err) => next(err));
};

// export default auth;

export { tenantAuth, tenant };
