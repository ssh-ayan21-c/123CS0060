import axios from 'axios';

export type Stack = 'backend' | 'frontend';
export type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type BackendPackage = 'cache' | 'controller' | 'cron_job' | 'db' | 'domain' | 'handler' | 'repository' | 'route' | 'service';
export type FrontendPackage = 'api' | 'component' | 'hook' | 'page' | 'state' | 'style';
export type CommonPackage = 'auth' | 'config' | 'middleware' | 'utils';

export type Package<S extends Stack> = S extends 'backend' 
  ? BackendPackage | CommonPackage 
  : FrontendPackage | CommonPackage;

const TEST_SERVER_URL = 'http://4.224.186.213/evaluation-service/logs';

let globalToken: string | null = null;

/**
 * Initialize the logging middleware with an authorization token.
 * This should be called once at application startup.
 */
export const initLog = (token: string) => {
  globalToken = token;
};

/**
 * Reusable Log function to send structured logs to the test server.
 */
export const Log = async <S extends Stack>(
  stack: S,
  level: Level,
  pkg: Package<S>,
  message: string
) => {
  if (!globalToken) {
    console.warn('Logging Middleware: Token is not initialized. Please call initLog(token) before logging.');
    return;
  }

  try {
    const response = await axios.post(
      TEST_SERVER_URL,
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          'Authorization': `Bearer ${globalToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // In a real scenario we might just let it succeed silently or log to local console in dev
    // console.log(`[Log Sent] ID: ${response.data.logID}`);
    return response.data;
  } catch (error: any) {
    console.error('Logging Middleware Error:', error.response?.data || error.message);
  }
};
