import dotenv from 'dotenv';
dotenv.config();

interface EnvInterfaces {
  PORT: string;
  MONGO_URI: string;
  NODE_ENV: 'development' | 'production';
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;
  BCRYPT_SALT_ROUND: string;

  OTP_JWT_ACCESS_EXPIRATION: string;
  OTP_JWT_ACCESS_SECRET: string;

  FRONTEND_URL: string;

  TWILIO_AUTH_TOKEN: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_MESSAGING_SERVICE_SID: string;
  TWILIO_PHONE_NUMBER: string;

  CLOUDINARY_SECRET: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_NAME: string;

  ADMIN_GMAIL: string;
  ADMIN_PASSWORD: string;

  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_USERNAME: string;
  REDIS_PASSWORD: string;

  REQUEST_RATE_LIMIT: number;
  REQUEST_RATE_LIMIT_TIME: number;

  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;

  GOOGLE_OAUTH_ID: string;
  GOOGLE_OAUTH_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  GOOGLE_MAP_API_KEY: string;

  EXPRESS_SESSION_SECRET: string;
  BACKEND_URL: string;

  TYPE: string;
  PROJECT_ID: string;
  PRIVATE_KEY_ID: string;
  PRIVATE_KEY: string;
  CLIENT_EMAIL: string;
  CLIENT_ID: string;
  AUTH_URI: string;
  TOKEN_URI: string;
  AUTH_PROVIDER_X509_CERT_URL: string;
  CLIENT_X509_CERT_URL: string;
  UNIVERSE_DOMAIN: string;

  STRIPE_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SPONSORED_WEBHOOK_SECRET: string;
}

const loadEnvVarbles = (): EnvInterfaces => {
  const requireEnvVariables: string[] = [
    'PORT',
    'MONGO_URI',
    'JWT_ACCESS_SECRET',
    'NODE_ENV',
    'JWT_ACCESS_SECRET',
    'JWT_ACCESS_EXPIRATION',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRATION',
    'BCRYPT_SALT_ROUND',

    'OTP_JWT_ACCESS_SECRET',
    'OTP_JWT_ACCESS_EXPIRATION',

    'FRONTEND_URL',

    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_MESSAGING_SERVICE_SID',
    'TWILIO_PHONE_NUMBER',

    'CLOUDINARY_NAME',
    'CLOUDINARY_SECRET',
    'CLOUDINARY_API_KEY',

    'ADMIN_PASSWORD',
    'ADMIN_GMAIL',

    'REQUEST_RATE_LIMIT',
    'REQUEST_RATE_LIMIT_TIME',

    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_USERNAME',
    'REDIS_PASSWORD',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',

    'GOOGLE_OAUTH_SECRET',
    'GOOGLE_OAUTH_ID',
    'GOOGLE_CALLBACK_URL',
    'GOOGLE_MAP_API_KEY',

    'EXPRESS_SESSION_SECRET',
    'BACKEND_URL',

    'TYPE',
    'PROJECT_ID',
    'PRIVATE_KEY_ID',
    'PRIVATE_KEY',
    'CLIENT_EMAIL',
    'CLIENT_ID',
    'AUTH_URI',
    'TOKEN_URI',
    'AUTH_PROVIDER_X509_CERT_URL',
    'CLIENT_X509_CERT_URL',
    'UNIVERSE_DOMAIN',

    'STRIPE_SECRET',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_SPONSORED_WEBHOOK_SECRET',
  ];

  requireEnvVariables.forEach((KEY) => {
    if (!process.env[KEY]) {
      throw new Error(`Missing required env variable ${KEY}`);
    }
  });

  return {
    MONGO_URI: process.env.MONGO_URI as string,
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production',
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION as string,

    OTP_JWT_ACCESS_EXPIRATION: process.env.OTP_JWT_ACCESS_EXPIRATION as string,
    OTP_JWT_ACCESS_SECRET: process.env.OTP_JWT_ACCESS_SECRET as string,

    FRONTEND_URL: process.env.FRONTEND_URL as string,

    TWILIO_AUTH_TOKEN: process.env.AUTH_TOKEN as string,
    TWILIO_ACCOUNT_SID: process.env.ACCOUNT_SID as string,
    TWILIO_MESSAGING_SERVICE_SID: process.env
      .TWILIO_MESSAGING_SERVICE_SID as string,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER as string,

    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET as string,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,

    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
    ADMIN_GMAIL: process.env.ADMIN_GMAIL as string,

    REQUEST_RATE_LIMIT_TIME: Number(
      process.env.REQUEST_RATE_LIMIT_TIME
    ) as number,
    REQUEST_RATE_LIMIT: Number(process.env.REQUEST_RATE_LIMIT) as number,

    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: process.env.REDIS_PORT as string,
    REDIS_USERNAME: process.env.REDIS_USERNAME as string,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,

    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD as string,
    EMAIL_USER: process.env.EMAIL_USER as string,
    EMAIL_PORT: process.env.EMAIL_PORT as string,
    EMAIL_HOST: process.env.EMAIL_HOST as string,

    GOOGLE_OAUTH_ID: process.env.GOOGLE_OAUTH_ID as string,
    GOOGLE_OAUTH_SECRET: process.env.GOOGLE_OAUTH_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY as string,

    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    BACKEND_URL: process.env.BACKEND_URL as string,

    TYPE: process.env.TYPE as string,
    PROJECT_ID: process.env.PROJECT_ID as string,
    PRIVATE_KEY_ID: process.env.PRIVATE_KEY_ID as string,
    PRIVATE_KEY: process.env.PRIVATE_KEY as string,
    CLIENT_EMAIL: process.env.CLIENT_EMAIL as string,
    CLIENT_ID: process.env.CLIENT_ID as string,
    AUTH_URI: process.env.AUTH_URI as string,
    TOKEN_URI: process.env.TOKEN_URI as string,
    AUTH_PROVIDER_X509_CERT_URL: process.env
      .AUTH_PROVIDER_X509_CERT_URL as string,
    CLIENT_X509_CERT_URL: process.env.CLIENT_X509_CERT_URL as string,
    UNIVERSE_DOMAIN: process.env.UNIVERSE_DOMAIN as string,

    STRIPE_SECRET: process.env.STRIPE_SECRET as string,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    STRIPE_SPONSORED_WEBHOOK_SECRET: process.env
      .STRIPE_SPONSORED_WEBHOOK_SECRET as string,
  };
};

export default loadEnvVarbles();
