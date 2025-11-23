import Joi from 'joi';


const schema = Joi.object({
  //APP CONFIG
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().required(),

  //DATABASE CONFIG
  DB_DIALECT: Joi.string().valid('postgres').required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // REDIS CONFIG
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  //AWS CONFIG
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),

  //OPENAI CONFIG
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().required(),

  //APIFY CONFIG
  // APIFY_TOKEN: Joi.string().required(),

  //APPLE CONFIG
  APPLE_CLIENT_ID: Joi.string().required(),

  //GOOGLE CONFIG
  GOOGLE_CLIENT_ID: Joi.string().required(),

  //REVENUE CAT CONFIG
  // REVENUECAT_WEBHOOK_SECRET: Joi.string().required(),

  //AUTH CONFIG
  JWT_SECRET: Joi.string().required(),
});

export function validateEnv() {
  const { error } = schema.validate(process.env, { abortEarly: false, allowUnknown: true });

  if (error) {
    console.error('❌ Invalid environment variables:\n');
    for (const detail of error.details) {
      console.error(`• ${detail.message}`);
    }
    process.exit(1);
  }
}
