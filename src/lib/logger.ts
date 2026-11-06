type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(payload: LogPayload): string {
    return `[${payload.timestamp}] [${payload.level.toUpperCase()}]${payload.context ? ` [${payload.context}]` : ''
      } ${payload.message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown) {
    const payload: LogPayload = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.isProduction && level === 'debug') {
      return;
    }

    const formatted = this.formatMessage(payload);

    switch (level) {
      case 'error':
        if (data !== undefined) {
          console.error(formatted, data);
        } else {
          console.error(formatted);
        }
        break;
      case 'warn':
        if (data !== undefined) {
          console.warn(formatted, data);
        } else {
          console.warn(formatted);
        }
        break;
      case 'debug':
        if (data !== undefined) {
          console.debug(formatted, data);
        } else {
          console.debug(formatted);
        }
        break;
      case 'info':
      default:
        if (data !== undefined) {
          console.info(formatted, data);
        } else {
          console.info(formatted);
        }
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown) {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown) {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown) {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown) {
    this.log('error', message, context, data);
  }
}

export const logger = new Logger();
