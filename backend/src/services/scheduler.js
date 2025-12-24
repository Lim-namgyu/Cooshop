import priceService from './price.js';
import { productQueries } from '../models/database.js';

let isRunning = false;

// 설정
const DELAY_MS = 3000; // 3초 대기 (분당 20회 호출)

/**
 * 하나의 상품을 업데이트하는 함수
 */
const updateOneProduct = async () => {
    try {
        // 1. 가장 오랫동안 업데이트되지 않은 상품 조회
        // (productQueries에 findOldestOne 추가 필요)
        const product = productQueries.findOldestOne();

        if (!product) {
            console.log('No products to update. Waiting...');
            return;
        }

        console.log(`[Scheduler] Updating product: ${product.name} (${product.id})`);

        // 2. 상품명으로 검색하여 가격 업데이트
        // (priceService.updatePriceByName 메서드 추가 필요)
        const updated = await priceService.updatePriceByName(product);

        if (updated) {
            console.log(`[Scheduler] Updated: ${updated.current_price}원`);
        } else {
            console.log('[Scheduler] Price not changed or product not found in search results.');
            // 업데이트 날짜만 갱신해서 순서 뒤로 보내기
            productQueries.touch(product.id);
        }

    } catch (error) {
        console.error('[Scheduler] Error updating product:', error);
    }
};

/**
 * 무한 루프 스케줄러
 */
export const startScheduler = async () => {
    if (isRunning) return;
    isRunning = true;
    console.log('[Scheduler] Started continuous price update scheduler.');

    while (isRunning) {
        await updateOneProduct();
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
};

export const stopScheduler = () => {
    isRunning = false;
    console.log('[Scheduler] Stopped.');
};
