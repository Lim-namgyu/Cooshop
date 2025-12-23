import { productQueries, priceHistoryQueries } from '../models/database.js';
import coupangService from './coupang.js';

/**
 * 상품 가격 업데이트 및 이력 저장
 */
export const updateProductPrice = async (productId) => {
    const product = productQueries.findById(productId);

    if (!product) {
        throw new Error(`Product not found: ${productId}`);
    }

    // 가격 이력 저장
    priceHistoryQueries.insert(productId, product.current_price);

    // 통계 업데이트
    const stats = priceHistoryQueries.getStats(productId);
    if (stats) {
        productQueries.upsert({
            ...product,
            min_price: stats.min_price,
            max_price: stats.max_price,
            avg_price: stats.avg_price
        });
    }

    return product;
};

/**
 * 상품 검색 및 저장
 */
export const searchAndSaveProducts = async (keyword) => {
    const products = await coupangService.searchProducts(keyword);

    const savedProducts = products.map(product => {
        const normalized = coupangService.normalizeProduct(product);
        productQueries.upsert(normalized);
        priceHistoryQueries.insert(normalized.id, normalized.current_price);
        return normalized;
    });

    return savedProducts;
};

/**
 * 상품 상세 정보 조회 (가격 이력 포함)
 */
export const getProductWithHistory = (productId, days = 30) => {
    const product = productQueries.findById(productId);

    if (!product) {
        return null;
    }

    const history = priceHistoryQueries.findByProductId(productId, days);
    const stats = priceHistoryQueries.getStats(productId);

    // 할인율 계산
    const discountRate = stats?.max_price > 0
        ? Math.round((1 - product.current_price / stats.max_price) * 100)
        : 0;

    return {
        ...product,
        history: history.map(h => ({
            price: h.price,
            date: h.recorded_at
        })),
        stats: {
            ...stats,
            discount_rate: discountRate
        }
    };
};

/**
 * 할인율 높은 상품 조회
 */
export const getTopDiscountProducts = (limit = 20) => {
    return productQueries.findByDiscountRate(limit);
};

export default {
    updateProductPrice,
    searchAndSaveProducts,
    getProductWithHistory,
    getTopDiscountProducts
};
