import Joi from 'joi';
import { AccessType, ResourceType } from '@prisma/client';

const createResource = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
    delta: Joi.object().required(),
    type: Joi.string().valid(ResourceType.NOTE),
    access: Joi.string().valid(AccessType.PRIVATE, AccessType.PUBLIC, AccessType.TENANT)
  })
};

const updateResource = {
  params: Joi.object().keys({
    resourceId: Joi.number().integer()
  }),
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
    delta: Joi.object().required(),
    type: Joi.string().valid(ResourceType.NOTE),
    access: Joi.string().valid(AccessType.PRIVATE, AccessType.PUBLIC, AccessType.TENANT)
  })
};

export default {
  createResource,
  updateResource
};
