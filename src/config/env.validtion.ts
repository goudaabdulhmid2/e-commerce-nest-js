import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // =========================
  // Application
  // =========================

  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(3000),

  // =========================
  // MongoDB
  // =========================

    DB_URL: Joi.string()
    .required(),

  // =========================
  // Redis
  // =========================

  REDIS_HOST: Joi.string()
    .required(),

  REDIS_PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(6379),

  // =========================
  // Email
  // =========================

  MAIL_HOST: Joi.string()
    .required(),

  MAIL_PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(587),

  MAIL_SECURE: Joi.boolean()
    .default(false),

  MAIL_USER: Joi.string()
    .email()
    .required(),

  MAIL_PASSWORD: Joi.string()
    .required(),

  MAIL_FROM: Joi.string()
    .email()
    .required(),

  // =========================
  // OTP
  // =========================

 OTP_EXPIRATION_MINUTES: Joi.number()
    .integer()
    .positive()
    .default(5),

 OTP_LENGTH: Joi.number()
    .integer()
    .positive()
    .default(6)
,

  MAX_ATTEMPTS: Joi.number()
    .integer()
    .positive()
    .default(5),

  // =========================
  // ENCRYPTION
  // =========================
  ENCRYPTION_KEY: Joi.string()
  .hex()
  .length(64)
  .required(),

});