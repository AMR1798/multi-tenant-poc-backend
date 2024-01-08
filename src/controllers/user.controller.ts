import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { tenantService, userService } from '../services';
import { AuthedUser } from '../types/authed-user';

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const user = await userService.createUser(email, password, name, role);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const user = req.user as AuthedUser;
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sort', 'order', 'limit', 'page']);
  const result = await userService.queryUsers(user, filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const disableUser = catchAsync(async (req, res) => {
  const user = req.user as AuthedUser;

  if (!user.tenant) {
    await userService.disableUserById(req.params.userId);
  } else {
    await tenantService.disableUser(Number(req.params.userId), user.tenant.id);
  }

  res.status(httpStatus.NO_CONTENT).send();
});

const enableUser = catchAsync(async (req, res) => {
  const user = req.user as AuthedUser;

  if (!user.tenant) {
    await userService.enableUserById(req.params.userId);
  } else {
    await tenantService.enableUser(Number(req.params.userId), user.tenant.id);
  }

  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  disableUser,
  enableUser
};
