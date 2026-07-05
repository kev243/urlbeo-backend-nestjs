'use strict';

// New Relic agent configuration
const appName = process.env.NEW_RELIC_APP_NAME || 'urlbeo-backend';

module.exports = {
  app_name: [appName],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  distributed_tracing: {
    enabled: true,
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.authorization',
      'request.headers.cookie',
      'response.headers.authorization',
      'response.headers.cookie',
      'request.parameters.password',
      'request.parameters.token',
      'request.parameters.accessToken',
      'request.parameters.refreshToken',
    ],
  },
};
