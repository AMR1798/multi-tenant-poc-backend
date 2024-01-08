import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService, emailService, tenantService } from '../services';
import exclude from '../utils/exclude';
import { TokenType, User } from '@prisma/client';
import ApiError from '../utils/ApiError';

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const tenant = res.locals.TENANT;
  const user = await userService.createUser(email, password, name, tenant);
  const userWithoutPassword = exclude(user, ['password', 'createdAt', 'updatedAt']);
  const tokens = await tokenService.generateAuthTokens(user, tenant);
  res.status(httpStatus.CREATED).send({ user: userWithoutPassword, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const tenant = res.locals.TENANT;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  // check if user are part of tenant
  if (tenant) {
    if (!(await tenantService.isPartOfTenant(tenant.id, user.id))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User is not part of tenant');
    }
  } else {
    if (user.deletedAt) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User disabled');
    }
  }
  const tokens = await tokenService.generateAuthTokens(user, tenant);
  res.send({ user: exclude(user, ['createdAt', 'updatedAt']), tokens });
});

const me = catchAsync(async (req, res) => {
  const user = req.user as User;
  const tenant = res.locals.TENANT;
  let role = user.role;
  if (tenant) {
    // override this user's role to tenant level role
    role = await tenantService.getUserTenantRole(tenant.id, user.id);
  }
  res.send({
    ...user,
    role
  });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tenant = res.locals.TENANT;
  const tokens = await authService.refreshAuth(req.body.refreshToken, tenant);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(
    req.body.email,
    resetPasswordToken,
    res.locals.TENANT?.slug
  );
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User;
  // check existing verify token
  const existingToken = await tokenService.getCurrentTokenByUserAndTokenType(
    user,
    TokenType.VERIFY_EMAIL
  );

  if (!existingToken) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken, res.locals.TENANT?.slug);
  }

  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.body.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  me
};
