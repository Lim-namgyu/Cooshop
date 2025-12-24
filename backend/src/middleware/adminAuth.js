import dotenv from 'dotenv';
dotenv.config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const adminAuth = (req, res, next) => {
    // 환경변수에 비밀번호가 설정되지 않았으면 보안상 접근 차단
    if (!ADMIN_PASSWORD) {
        console.error('ADMIN_PASSWORD environment variable is not set.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const requestPassword = req.headers['x-admin-password'];

    if (!requestPassword || requestPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Invalid password' });
    }

    next();
};
