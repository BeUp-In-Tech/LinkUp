import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { router } from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { NotFound } from './app/middlewares/NotFound';
import rateLimit from 'express-rate-limit';
import { safeSanitizeMiddleware } from './app/middlewares/mongoSanitizer';
import env from './app/config/env';
import expressSession from 'express-session';
import passport from 'passport';
import './app/config/passport.config';
import http from 'http';
import { initSocket } from './app/socket';
import { paymentControllers } from './app/modules/payments/payment.controller';
import { RedisStore } from 'connect-redis';
import { redisClient } from './app/config/redis.config';

const app = express();
const server = http.createServer(app);

// Init Socket connection
initSocket(server);

app.set('trust proxy', 1);
app.use(
  expressSession({
    store: new RedisStore({ client: redisClient }),
    secret: env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// STRIPE WEBHOOK ROUTES
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentControllers.handleWebHook
);
app.post(
  '/webhook_sponsored',
  express.raw({ type: 'application/json' }),
  paymentControllers.handleSponsoredWebHook
);

app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Create a session
app.use(express.json());
app.use(
  cors({
    origin: env.FRONTEND_URL || 'http://localhost:5173',
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(safeSanitizeMiddleware);

// THROTTLING
const limiter = rateLimit({
  windowMs: env.REQUEST_RATE_LIMIT_TIME * 60 * 1000, // Assuming time in minutes from env
  max: env.REQUEST_RATE_LIMIT,
  message: {
    success: false,
    statusCode: 400,
    message: 'Too many requests, please try again later.',
  },

  keyGenerator: (req) => {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.socket.remoteAddress ||
      '';

    // if proxy sends multiple IPs
    if (Array.isArray(ip)) ip = ip[0];

    // remove port if exists
    return String(ip).split(':').pop() as string;
  },
});

app.use(limiter);

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Congratulations! Your server is running</h1>');
});

// GLOBAL ROUTES
app.use('/api/v1', router);

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

// NO ROUTE MATCH
app.use(NotFound);

export default server;
