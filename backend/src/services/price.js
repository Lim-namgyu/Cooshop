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

    const savedProducts = [];
    for (const product of products) {
        const normalized = coupangService.normalizeProduct(product);
        productQueries.upsert(normalized);
        priceHistoryQueries.insert(normalized.id, normalized.current_price);

        // UUID 포함된 최신 정보 조회 (외부 노출용 id 매핑)
        const saved = productQueries.findById(normalized.id);
        if (saved) {
            savedProducts.push({
                ...saved,
                id: saved.uuid // 내부 ID 대신 UUID 반환
            });
        }
    }

    return savedProducts;
};

/**
 * 상품 상세 정보 조회 (가격 이력 포함)
 * @param {string} idOrUuid - 상품 ID (내부 ID 또는 UUID)
 */
export const getProductWithHistory = (idOrUuid, days = 30) => {
    // 1. UUID로 먼저 조회
    let product = productQueries.findByUuid(idOrUuid);

    // 2. 없으면 내부 ID로 조회 (하위 호환성)
    if (!product) {
        product = productQueries.findById(idOrUuid);
    }

    if (!product) {
        return null;
    }

    // 내부 로직은 실제 ID 사용
    const internalId = product.id;

    const history = priceHistoryQueries.findByProductId(internalId, days);
    const stats = priceHistoryQueries.getStats(internalId);

    // 할인율 계산
    const discountRate = stats?.max_price > 0
        ? Math.round((1 - product.current_price / stats.max_price) * 100)
        : 0;

    return {
        ...product,
        id: product.uuid, // 외부 노출용 ID는 무조건 UUID 사용
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

/**
 * 상품명으로 검색하여 가격 업데이트 (스케줄러용)
 */
export const updatePriceByName = async (product) => {
    // 1. 상품명으로 검색 (API 제한으로 인해 최대 40자)
    const keyword = product.name.length > 40 ? product.name.substring(0, 40) : product.name;
    const searchResults = await coupangService.searchProducts(keyword);

    // 2. 검색 결과에서 ID가 일치하는 상품 찾기
    const targetItem = searchResults.find(item => String(item.productId) === product.id);

    if (targetItem) {
        const normalized = coupangService.normalizeProduct(targetItem);

        // 3. 가격이 변동되었으면 업데이트 (혹은 항상 업데이트하여 latest_check 갱신)
        productQueries.upsert(normalized);
        priceHistoryQueries.insert(normalized.id, normalized.current_price);

        return normalized;
    }

    return null;
};

export default {
    updateProductPrice,
    searchAndSaveProducts,
    getProductWithHistory,
    getTopDiscountProducts,
    updatePriceByName
};
