import { Router } from 'express';
import { productQueries } from '../models/database.js';
import priceService from '../services/price.js';
import coupangService from '../services/coupang.js';

const router = Router();

/**
 * 상품 검색
 * GET /api/products/search?q=키워드&limit=20
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: '검색어를 입력해주세요.' });
        }

        const products = await priceService.searchAndSaveProducts(q.trim());

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
    }
});

/**
 * 상품 상세 조회 (가격 이력 포함)
 * GET /api/products/:id?days=30
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { days = 30 } = req.query;

        const product = priceService.getProductWithHistory(id, parseInt(days));

        if (!product) {
            return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Product detail error:', error);
        res.status(500).json({ error: '상품 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 최근 업데이트 상품 목록
 * GET /api/products?limit=20&offset=0
 */
router.get('/', async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const products = productQueries.findAll(
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Products list error:', error);
        res.status(500).json({ error: '상품 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 할인율 높은 상품
 * GET /api/products/top/discounts?limit=20
 */
router.get('/top/discounts', async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const products = priceService.getTopDiscountProducts(parseInt(limit));

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Top discounts error:', error);
        res.status(500).json({ error: '할인 상품 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 골드박스 (특가) 상품
 * GET /api/products/goldbox
 */
router.get('/goldbox', async (req, res) => {
    try {
        const products = await coupangService.getGoldboxProducts();

        // 상품 저장
        for (const product of products) {
            const normalized = coupangService.normalizeProduct(product);
            productQueries.upsert(normalized);
        }

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Goldbox error:', error);
        res.status(500).json({ error: '골드박스 조회 중 오류가 발생했습니다.' });
    }
});

export default router;
