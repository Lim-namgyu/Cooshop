import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import productRoutes from './routes/products.js';
import adminRoutes from './routes/admin.js';
import { initDatabase } from './models/database.js';
import { startScheduler } from './services/scheduler.js';
import { initializeData } from './services/initData.js';
import { checkReferer } from './middleware/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiter 설정 (API 전체: 15분에 100회)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

// 관리자 로그인 시도 제한 (10분에 10회 - Brute Force 방지)
const adminLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again after 10 minutes.' }
});

// Middleware
app.use(helmet()); // 보안 헤더 설정 (XSS 보호, 등)

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

// API 라우트에만 Rate Limit 및 Referer 체크 적용
app.use('/api', limiter, checkReferer);
app.use(express.json());

// 프론트엔드 정적 파일 서빙 (프로덕션)
const frontendPath = join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Routes
app.use('/api/products', productRoutes);
// 관리자 경로 난독화 + Brute Force 방지 Limiter 적용
app.use('/api/sys-admin-control', adminLimiter, adminRoutes);

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

        // 초기 데이터 적재 (비동기 실행)
        initializeData();

        // 스케줄러 시작 (백그라운드에서 가격 업데이트)
        startScheduler();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
