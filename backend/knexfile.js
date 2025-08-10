const path = require('path');
require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'linkedin_headshot_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'seeds')
    },
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      propagateCreateError: false
    },
    acquireConnectionTimeout: 30000,
    asyncStackTraces: true
  },

  testing: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME_TEST || 'linkedin_headshot_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: path.join(__dirname, 'migrations')
    },
    pool: {
      min: 1,
      max: 2
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: path.join(__dirname, 'migrations')
    },
    pool: {
      min: 10,
      max: 50,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 900000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      propagateCreateError: false
    },
    acquireConnectionTimeout: 60000,
    asyncStackTraces: false // Disabled in production for performance
  }
};