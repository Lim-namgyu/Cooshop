// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-12-01',
    devtools: { enabled: true },

    // 개발 서버 포트 (백엔드 3000과 충돌 방지)
    devServer: {
        port: 3001
    },

    // SSR 활성화 (기본값이지만 명시)
    ssr: true,

    // 런타임 설정 (환경 변수)
    runtimeConfig: {
        // 서버만 접근 가능 (비공개)
        backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
        // 클라이언트도 접근 가능 (공개)
        public: {
            apiBase: '/api'
        }
    },

    // 전역 CSS
    css: ['~/assets/css/main.css'],

    // 앱 설정
    app: {
        head: {
            title: 'Cooshop - 쿠팡 가격 추적',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: '쿠팡 상품 가격 변동을 추적하고 최저가로 구매하세요!' }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
            ]
        }
    },

    // Nitro 서버 설정 (API 프록시)
    nitro: {
        routeRules: {
            // 백엔드 API 프록시 (개발용)
            '/api/**': {
                proxy: process.env.BACKEND_URL || 'http://localhost:3000/api/**'
            }
        }
    }
});
