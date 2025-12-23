import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
const DOMAIN = 'https://api-gateway.coupang.com';

/**
 * HMAC 서명 생성 (쿠팡 파트너스 공식 예제 기반)
 * 
 * 날짜 형식: yyMMdd'T'HHmmss'Z' (2자리 연도)
 * 메시지: datetime + method + uri
 */
const generateAuthorization = (method, uri, accessKey, secretKey) => {
    const now = new Date();

    // 2자리 연도 형식: yyMMddTHHmmssZ
    const year = String(now.getUTCFullYear()).slice(-2);
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const min = String(now.getUTCMinutes()).padStart(2, '0');
    const sec = String(now.getUTCSeconds()).padStart(2, '0');

    const datetime = `${year}${month}${day}T${hour}${min}${sec}Z`;

    // path와 queryString 분리
    const [path, queryString] = uri.includes('?')
        ? uri.split('?')
        : [uri, ''];

    // 메시지: datetime + method + path + queryString (? 제외)
    const message = datetime + method + path + queryString;

    console.log('HMAC datetime:', datetime);
    console.log('HMAC path:', path);
    console.log('HMAC queryString:', queryString);
    console.log('HMAC message:', message);

    // HMAC-SHA256 서명
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('hex');

    // Authorization 헤더
    return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
};

/**
 * 쿠팡 파트너스 API 호출
 */
const callCoupangApi = async (method, path, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const uri = queryString ? `${path}?${queryString}` : path;

    const authorization = generateAuthorization(method, uri, ACCESS_KEY, SECRET_KEY);

    console.log('=== Coupang API Call ===');
    console.log('URL:', `${DOMAIN}${uri}`);
    console.log('Authorization:', authorization);

    const response = await fetch(`${DOMAIN}${uri}`, {
        method,
        headers: {
            'Authorization': authorization,
            'Content-Type': 'application/json;charset=UTF-8'
        }
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText.substring(0, 500));

    if (!response.ok) {
        throw new Error(`Coupang API Error: ${response.status} - ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error(`Invalid JSON: ${responseText}`);
    }
};

// ==================== API 함수들 ====================

/**
 * 상품 검색 API
 */
export const searchProducts = async (keyword, limit = 10) => {
    const result = await callCoupangApi(
        'GET',
        '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search',
        { keyword, limit: Math.min(limit, 10) }
    );

    if (result.rCode !== '0') {
        throw new Error(`Search failed: ${result.rMessage}`);
    }

    return result.data?.productData || [];
};

/**
 * 베스트 상품 조회 API
 */
export const getBestProducts = async (categoryId = 0, limit = 20) => {
    const result = await callCoupangApi(
        'GET',
        '/v2/providers/affiliate_open_api/apis/openapi/v1/products/bestcategories',
        { categoryId, limit: Math.min(limit, 100) }
    );

    if (result.rCode !== '0') {
        throw new Error(`Best products failed: ${result.rMessage}`);
    }

    return result.data || [];
};

/**
 * 골드박스 (특가) 상품 조회
 */
export const getGoldboxProducts = async () => {
    const result = await callCoupangApi(
        'GET',
        '/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox',
        {}
    );

    if (result.rCode !== '0') {
        throw new Error(`Goldbox failed: ${result.rMessage}`);
    }

    return result.data || [];
};

/**
 * 상품 데이터 정규화
 */
export const normalizeProduct = (product) => ({
    id: String(product.productId),
    item_id: String(product.itemId || ''),
    name: product.productName,
    image_url: product.productImage,
    product_url: product.productUrl,
    category_name: product.categoryName || '',
    current_price: product.productPrice,
    min_price: product.productPrice,
    max_price: product.productPrice,
    avg_price: product.productPrice
});

export default {
    searchProducts,
    getBestProducts,
    getGoldboxProducts,
    normalizeProduct
};
