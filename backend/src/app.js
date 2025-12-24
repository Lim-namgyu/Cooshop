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
// Render 배포 시 포트 충돌 방지: 백엔드는 내부 포트 4000 사용 (Nuxt가 3000/PORT 사용)
const PORT = process.env.BACKEND_PORT || 4000;

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
app.use(helmet({
    contentSecurityPolicy: false, // CSP 이슈 방지를 위해 일단 false 혹은 설정 완화
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' } // Referer 헤더 전송 허용
}));

// CORS 설정: 배포된 도메인과 로컬호스트 허용
const allowedOrigins = [
    'https://cooshop-backend.onrender.com', // Nuxt Frontend (Render)
    'http://localhost:3000', // Local Nuxt
    'http://localhost:3001'  // Local Nuxt (Dev)
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

// Routes
app.use('/api/products', productRoutes);
// 관리자 경로 난독화 + Brute Force 방지 Limiter 적용
app.use('/api/sys-admin-control', adminLimiter, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA 라우팅 제거 (Nuxt가 처리)

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
