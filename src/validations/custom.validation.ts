import Joi from 'joi';

export const password: Joi.CustomValidator<string> = (value, helpers) => {
  if (value.length < 8) {
    return helpers.error('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error('password must contain at least 1 letter and 1 number');
  }
  return value;
};

//^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,14}[a-zA-Z0-9])?$
export const slug: Joi.CustomValidator<string> = (value, helpers) => {
  const slugRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,13}[a-zA-Z0-9])?$/; // Update the regex pattern here

  if (value.length > 15) {
    return helpers.error('slug should not be more than 15 characters'); // Updated character limit
  }

  if (!slugRegex.test(value)) {
    return helpers.error('slug should only contain letters, numbers, and dashes'); // Updated error message
  }

  return value;
};
