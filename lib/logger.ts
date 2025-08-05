import pino from 'pino';

// Use pino-pretty in development for readable logs, plain pino in production
const isDev = process.env.NODE_ENV !== 'production';

const logger = isDev
  ? pino({ transport: { target: 'pino-pretty', options: { colorize: true } } })
  : pino();

export default logger;
