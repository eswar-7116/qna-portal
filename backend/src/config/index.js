const dotenv = require('dotenv');

dotenv.config();

const getEnvVariable = (key) => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`ENVIRONMENT VARIABLE '${key}' NOT SPECIFIED.`);
  }
  return value;
};

const config = {
  DB: {
    HOST: getEnvVariable('HOST'),
    PORT: getEnvVariable('DATABASE_PORT'),
    DB_USER: getEnvVariable('DB_USER'),
    DATABASE: getEnvVariable('DATABASE'),
    PASSWORD: getEnvVariable('PASSWORD'),
  },
  JWT: {
    SECRET: getEnvVariable('JWT_SECRET'),
    EXPIRES_IN: +getEnvVariable('JWT_EXPIRES_IN'),
  },
};

module.exports = config;
