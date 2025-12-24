import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { productQueries, getDatabase } from '../models/database.js';
import fs from 'fs';
import { join } from 'path';

const router = Router();

// 모든 관리자 라우트에 인증 적용
router.use(adminAuth);

/**
 * 대시보드 통계 조회
 */
router.get('/stats', (req, res) => {
    try {
        const db = getDatabase();

        // 1. 전체 상품 수
        const totalProducts = productQueries.count();

        // 2. 오늘 업데이트된 상품 수
        const todayUpdated = db.prepare(`
            SELECT COUNT(*) as count FROM products 
            WHERE date(updated_at, 'localtime') = date('now', 'localtime')
        `).get().count;

        // 3. 최근 24시간 내 가격 변동(히스토리) 수
        const recentPriceChanges = db.prepare(`
            SELECT COUNT(*) as count FROM price_history 
            WHERE recorded_at >= datetime('now', '-1 day')
        `).get().count;

        // 4. DB 파일 크기 확인 (Render Disk 모니터링용)
        // 프로덕션/개발 환경에 따라 경로가 다름 (app.js 등 참고하여 추정)
        // 실제 DB 파일 경로는 database.js에서 관리하지만 여기서는 파일명으로 유추
        let dbSize = 'Unknown';
        try {
            const dbPath = db.name; // better-sqlite3는 .name 속성에 경로가 있음
            const stats = fs.statSync(dbPath);
            dbSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB';
        } catch (e) {
            console.warn('Failed to get DB file size:', e);
        }

        res.json({
            totalProducts,
            todayUpdated,
            recentPriceChanges,
            dbSize,
            serverTime: new Date().toLocaleString()
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * 관리자용 상품 목록 조회 (페이징, 검색)
 */
router.get('/products', (req, res) => {
    try {
        const { page = 1, limit = 50, q } = req.query;
        const offset = (page - 1) * limit;
        const db = getDatabase();

        let query = `
            SELECT p.*, 
            (SELECT COUNT(*) FROM price_history ph WHERE ph.product_id = p.id) as history_count 
            FROM products p
        `;
        let countQuery = 'SELECT COUNT(*) as count FROM products';
        let params = [];

        if (q) {
            const where = ' WHERE name LIKE ? OR category_name LIKE ?';
            query += where;
            countQuery += where;
            params = [`%${q}%`, `%${q}%`];
        }

        query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';

        const products = db.prepare(query).all(...params, limit, offset);
        const total = db.prepare(countQuery).get(...params).count;

        res.json({
            data: products,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Admin products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router;
