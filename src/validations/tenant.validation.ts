import Joi from 'joi';
import { password, slug } from './custom.validation';

const createTenant = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    slug: Joi.string().required().custom(slug)
  })
};

const getTenants = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getTenant = {
  params: Joi.object().keys({
    userId: Joi.number().integer()
  })
};

const updateTenant = {
  params: Joi.object().keys({
    userId: Joi.number().integer()
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string()
    })
    .min(1)
};

const deleteTenant = {
  params: Joi.object().keys({
    userId: Joi.number().integer()
  })
};

export default {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant
};
