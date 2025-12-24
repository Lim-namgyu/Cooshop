import coupangService from './coupang.js';
import { productQueries, priceHistoryQueries } from '../models/database.js';

// 주요 카테고리 ID 목록
const CATEGORIES = [
    { id: 1001, name: '여성패션' },
    { id: 1010, name: '뷰티' },
    { id: 1020, name: '식품' },
    { id: 1021, name: '주방용품' },
    { id: 1024, name: '생활용품' },
    { id: 1025, name: '홈인테리어' },
    { id: 1026, name: '가전디지털' },
    { id: 1029, name: '반려동물용품' }
];

const DELAY_MS = 2000; // 카테고리 간 2초 대기

/**
 * 초기 데이터 적재 실행
 */
export const initializeData = async () => {
    try {
        const count = productQueries.count();
        if (count > 10) {
            console.log(`[InitData] Data already exists (${count} products). Skipping initialization.`);
            return;
        }

        console.log('[InitData] Starting data initialization...');

        for (const category of CATEGORIES) {
            console.log(`[InitData] Fetching best products for: ${category.name} (${category.id})`);

            try {
                // 카테고리별 베스트 상품 20개 조회
                const products = await coupangService.getBestProducts(category.id, 20);

                let savedCount = 0;
                for (const product of products) {
                    const normalized = coupangService.normalizeProduct(product);
                    productQueries.upsert(normalized);
                    priceHistoryQueries.insert(normalized.id, normalized.current_price);
                    savedCount++;
                }

                console.log(`[InitData] Saved ${savedCount} products for ${category.name}`);

                // API 호출 제한 고려하여 대기
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));

            } catch (error) {
                console.error(`[InitData] Failed to fetch category ${category.name}:`, error.message);
            }
        }

        console.log('[InitData] Data initialization completed.');

    } catch (error) {
        console.error('[InitData] Fatal error during initialization:', error);
    }
};
