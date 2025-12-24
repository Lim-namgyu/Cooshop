import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import productRoutes from './routes/products.js';
import { initDatabase } from './models/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


// Rate Limiter 설정 (15분에 100회 요청 제한)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

// Middleware
// CORS 설정: 배포된 도메인과 로컬호스트 허용
const allowedOrigins = [
    'https://cooshop-backend.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // origin이 없으면(서버간 통신 등) 허용
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// API 라우트에만 Rate Limit 적용
app.use('/api', limiter);
app.use(express.json());

// 프론트엔드 정적 파일 서빙 (프로덕션)
const frontendPath = join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA 라우팅 - API가 아닌 모든 요청은 index.html로
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(join(frontendPath, 'index.html'));
    }
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
