import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chamaRoutes from './routes/chamas.js';

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// only allow your frontend origins
const allowedOrigins = [
    process.env.CLIENT_URL,                    // http://localhost:5173 in dev
    process.env.CLIENT_URL_PRODUCTION          // https://chama-app.vercel.app in prod (fill with actual URL)
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true   // required for httpOnly cookie (refresh token)
}));
app.options('*', cors());

// rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: { error: 'Too many requests, please try again later' }
// });
// app.use('/api', limiter);


// Body parsing
app.use(express.json({ limit: '10kb' }));   // limit prevents payload bombs
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/chamas', chamaRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});


// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export default app;