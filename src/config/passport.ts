import prisma from '../client';
import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from 'passport-jwt';
import config from './config';
import { Tenant, TokenType } from '@prisma/client';
import { JwtPayload } from '../types/jwt-payload';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback = async (payload: JwtPayload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('Invalid token type');
    }
    const userId = Number(payload.sub);
    const tenantSlug = payload.tenant;
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true
      },
      where: { id: userId }
    });
    if (!user) {
      return done(null, false);
    }
    let tenant;
    if (tenantSlug) {
      tenant = await prisma.tenant.findFirst({
        where: {
          slug: tenantSlug
        },
        include: {
          TenantUser: {
            where: {
              userId: userId
            }
          }
        }
      });
      // tenantUser = await prisma.tenantUser
      // if tenant does not exist for user (not part of tenant)
      if (!tenant || !tenant.enable) {
        return done(null, false);
      }
    } else {
    }
    done(null, {
      ...user,
      role: tenant ? tenant.TenantUser[0].role : user.role,
      tenant: tenant
    });
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
