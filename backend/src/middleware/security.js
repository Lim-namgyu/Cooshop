export const checkReferer = (req, res, next) => {
    // 프로덕션 환경이 아니면 패스 (로컬 개발 편의성)
    if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
        return next();
    }

    const referer = req.headers['referer'] || req.headers['referrer'];
    const origin = req.headers['origin'];

    // 허용된 도메인 목록
    const ALLOWED_DOMAINS = [
        'https://cooshop-backend.onrender.com',
        'http://localhost:5173', // 혹시 모를 로컬 테스트용
        'http://localhost:3000'
    ];

    // Origin 또는 Referer 검사
    const checkSource = (source) => {
        if (!source) return false;
        return ALLOWED_DOMAINS.some(domain => source.startsWith(domain));
    };

    // 1. Origin 검사 (CORS와 유사하지만 미들웨어 레벨에서 강제 차단)
    if (origin && !checkSource(origin)) {
        console.warn(`[Security] Blocked request from invalid origin: ${origin}`);
        return res.status(403).json({ error: 'Access denied' });
    }

    // 2. Referer 검사 (브라우저 직접 입력 방지 및 타 사이트 링크 방지)
    // 단, API 직접 호출(curl 등)은 Referer가 없을 수 있음 -> 차단
    if (!referer) {
        console.warn(`[Security] Blocked request with no referer: ${req.ip}`);
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!checkSource(referer)) {
        console.warn(`[Security] Blocked request from invalid referer: ${referer}`);
        return res.status(403).json({ error: 'Access denied' });
    }

    next();
};
