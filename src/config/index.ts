/**
 * Parse configuration from environment (`.env` is supported).
 * Fallback to default value if not available.
 * @packageDocumentation
 */

/**
 * Parse string from environment variable
 * @param key - Environment key
 */
const parseEnvString = (key: string): string | undefined => {
  return process.env[key];
};

/**
 * Parse number from environment variable
 * @param key - Environment key
 */
const parseEnvNumber = (key: string): number | undefined => {
  if (process.env[key]) {
    return Number(process.env[key]);
  } else {
    return undefined;
  }
};

/**
 * Parse boolean from environment variable
 * @param key - Environment key
 */
const parseEnvBoolean = (key: string): boolean | undefined => {
  if (process.env[key]) {
    String(process.env[key]).toLowerCase() === 'true';
  } else {
    return undefined;
  }
};

export interface ConfigProps {
  MAINTENANCE: boolean;
  GRAPH_API: string;
  APP_SECRET: string;
  PAGE_ACCESS_TOKEN: string;
  PAGE_VERIFY_TOKEN: string;
  MAX_MESSAGE_LENGTH: number;
  APP_NAME: string;
  HEROKU_API_KEY: string;
  MONGO_URI: string;
  HAS_POST_LOG: boolean;
  POST_LOG_ID: string;
  POST_LOG_P1: string;
  POST_LOG_P2: string;
  POST_LOG_NAME1: string;
  POST_LOG_NAME2: string;
  REPORT_LINK: string;
  MAX_PEOPLE_IN_WAITROOM: number;
  MAX_WAIT_TIME_MINUTES: number;
  ADMIN_PASSWORD: string;
  MAX_SESSION_MINUTES: number;
  DEV_ID: string;
  VERSION: string;
}

export default {
  // Maintenance mode
  MAINTENANCE: parseEnvBoolean('MAINTENANCE') || false,

  // Graph API
  GRAPH_API: parseEnvString('GRAPH_API') || 'https://graph.facebook.com/v7.0',

  // App secret
  APP_SECRET: parseEnvString('APP_SECRET') || '',

  // Page access token
  PAGE_ACCESS_TOKEN: parseEnvString('PAGE_ACCESS_TOKEN') || '',

  // Page verify token
  PAGE_VERIFY_TOKEN: parseEnvString('PAGE_VERIFY_TOKEN') || '',

  // Maximum length of text message
  MAX_MESSAGE_LENGTH: parseEnvNumber('MAX_MESSAGE_LENGTH') || 2000,

  // App name (must be the same on Heroku)
  APP_NAME: parseEnvString('APP_NAME') || 'ptnkchat',

  // Heroku API key
  HEROKU_API_KEY: parseEnvString('HEROKU_API_KEY') || '',

  // URI to MongoDB server
  MONGO_URI: parseEnvString('MONGO_URI') || '',

  // Logging stuffs
  HAS_POST_LOG: parseEnvBoolean('HAS_POST_LOG') || false,
  POST_LOG_ID: parseEnvString('POST_LOG_ID') || '',
  POST_LOG_P1: parseEnvString('POST_LOG_P1') || '',
  POST_LOG_P2: parseEnvString('POST_LOG_P2') || '',
  POST_LOG_NAME1: parseEnvString('POST_LOG_NAME1') || '',
  POST_LOG_NAME2: parseEnvString('POST_LOG_NAME2') || '',

  // Link to Google Form for reporting
  REPORT_LINK: parseEnvString('REPORT_LINK') || 'https://example.com',

  // Maximum number of people in wait room
  MAX_PEOPLE_IN_WAITROOM: parseEnvNumber('MAX_PEOPLE_IN_WAITROOM') || 20,

  // Maximum amount of time in wait room
  // 0 for unlimited
  MAX_WAIT_TIME_MINUTES: parseEnvNumber('MAX_WAIT_TIME_MINUTES') || 60,

  // Password to log into admin page
  ADMIN_PASSWORD: parseEnvString('ADMIN_PASSWORD') || '',

  // Maximum amount of time of a session
  // 0 for unlimited
  MAX_SESSION_MINUTES: parseEnvNumber('MAX_SESSION_MINUTES') || 30, // Thời gian 1 session

  // ID of developer's Facebook account
  DEV_ID: parseEnvString('DEV_ID') || '',

  // Project version. You don't need to set this.
  VERSION: require('../../package.json').version
} as ConfigProps;
