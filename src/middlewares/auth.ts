import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import { AuthedUser } from '../types/authed-user';
import UnauthedError from '../utils/errors/UnauthedError';

const verifyCallback =
  (
    req: Request,
    res: Response,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void,
    requiredRights: string[]
  ) =>
  async (err: unknown, user: AuthedUser | false, info: unknown) => {
    if (err || info || !user) {
      return reject(new UnauthedError());
    }
    req.user = user as AuthedUser;

    // only check for the token to be valid for right tenant. if main, dont do validation on the auth.
    if (res.locals.TENANT) {
      // make sure the authed is for the right tenant
      if (res.locals.TENANT.id !== user.tenant?.id) {
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Auth: Mismatch token for tenant'));
      }
    }

    if (requiredRights.length) {
      const userRights = roleRights.get(user.role) ?? [];
      const hasRequiredRights = requiredRights.every((requiredRight) =>
        userRights.includes(requiredRight)
      );
      if (!hasRequiredRights && Number(req.params.userId) !== user.id) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const auth =
  (allowPublic = false, ...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (allowPublic && !res.locals.TENANT && !req.headers.authorization) {
      // tenant request should never be made public
      // create fake public user
      req.user = {
        id: 0,
        email: '',
        name: 'public',
        role: 'USER',
        isEmailVerified: false
      };
      return next();
    }
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, res, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
