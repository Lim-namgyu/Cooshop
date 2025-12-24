/**
 * Nuxt Server Route: API Proxy
 * 모든 /api/* 요청을 백엔드 Express 서버로 전달합니다.
 * 이렇게 하면 브라우저에서 직접 백엔드 API를 호출하지 않고,
 * Nuxt 서버가 중간에서 처리하므로 API 주소가 숨겨집니다.
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const backendUrl = config.backendUrl || 'http://localhost:3000';

    // 요청 경로에서 /api 프리픽스 유지
    const path = event.path;

    // 요청 메서드
    const method = event.method;

    // 요청 헤더 (인증 등)
    const headers: Record<string, string> = {};
    const adminPassword = getHeader(event, 'x-admin-password');
    if (adminPassword) {
        headers['X-Admin-Password'] = adminPassword;
    }
    headers['Content-Type'] = 'application/json';

    // 요청 본문 (POST 등)
    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
        body = await readBody(event);
    }

    try {
        // 백엔드로 요청 전달
        const response = await $fetch(`${backendUrl}${path}`, {
            method,
            headers,
            body,
        });

        return response;
    } catch (error: any) {
        // 에러 처리
        console.error(`[API Proxy] Error: ${path}`, error.message);

        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Internal Server Error',
            data: error.data || { error: 'Backend request failed' }
        });
    }
});
