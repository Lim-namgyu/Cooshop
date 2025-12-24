<script setup lang="ts">
interface PriceHistory {
  price: number
  date: string
}

interface Stats {
  min_price: number
  max_price: number
  avg_price: number
  discount_rate: number
}

interface Product {
  id: string
  name: string
  image_url: string
  product_url: string
  current_price: number
  min_price: number
  max_price: number
  avg_price: number
  history: PriceHistory[]
  stats: Stats
}

const route = useRoute()
const productId = route.params.id as string

// SSR: 서버 사이드에서 데이터 페칭
const { data: response, pending, error } = await useFetch<{ success: boolean; data: Product }>(
  `/api/products/${productId}`
)

const product = computed(() => response.value?.data || null)

// SEO: 동적 메타 태그
useHead({
  title: computed(() => product.value ? `${product.value.name} - Cooshop` : 'Cooshop'),
  meta: [
    { 
      name: 'description', 
      content: computed(() => product.value 
        ? `${product.value.name} 가격 변동 추적. 현재가 ${formatPrice(product.value.current_price)}원`
        : '쿠팡 상품 가격 추적'
      )
    }
  ]
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price)
}

const goToCoupang = () => {
  if (product.value?.product_url) {
    window.open(product.value.product_url, '_blank')
  }
}

const goBack = () => {
  navigateTo('/')
}
</script>

<template>
  <div class="product-view">
    <header class="header">
      <button class="back-btn" @click="goBack">← 뒤로</button>
    </header>

    <div v-if="pending" class="loading">
      <div class="spinner"></div>
      <p>상품 정보를 불러오는 중...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>⚠️ 상품을 불러올 수 없습니다.</p>
      <button @click="goBack">홈으로 돌아가기</button>
    </div>

    <div v-else-if="product" class="product-detail">
      <div class="product-info">
        <div class="image-container">
          <img :src="product.image_url" :alt="product.name" />
        </div>
        
        <div class="info">
          <h1 class="name">{{ product.name }}</h1>
          
          <div class="price-section">
            <div class="current-price">
              <span class="label">현재가</span>
              <span class="value">{{ formatPrice(product.current_price) }}원</span>
            </div>
            
            <div class="price-compare">
              <div class="price-item">
                <span class="label">역대 최저가</span>
                <span class="value lowest">{{ formatPrice(product.stats.min_price) }}원</span>
              </div>
              <div class="price-item">
                <span class="label">평균가</span>
                <span class="value">{{ formatPrice(product.stats.avg_price) }}원</span>
              </div>
            </div>
          </div>

          <button class="coupang-btn" @click="goToCoupang">
            💰 쿠팡에서 구매하기
          </button>
        </div>
      </div>

      <PriceChart
        :history="product.history"
        :stats="product.stats"
        :currentPrice="product.current_price"
      />
    </div>
  </div>
</template>

<style scoped>
.product-view {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  background: white;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.back-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f8f9fa;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #ddd;
  border-top-color: #4a6cf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.product-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.product-info {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.image-container {
  aspect-ratio: 1;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 1.5rem;
}

.price-section {
  flex: 1;
}

.current-price {
  margin-bottom: 1rem;
}

.current-price .label {
  display: block;
  font-size: 0.875rem;
  color: #888;
  margin-bottom: 0.25rem;
}

.current-price .value {
  font-size: 2rem;
  font-weight: 700;
  color: #4a6cf7;
}

.price-compare {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.price-item .label {
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.25rem;
}

.price-item .value {
  font-weight: 600;
}

.price-item .value.lowest {
  color: #28a745;
}

.coupang-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #e31837 0%, #c01633 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.coupang-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
}

@media (max-width: 768px) {
  .product-info {
    grid-template-columns: 1fr;
  }
  
  .image-container {
    max-width: 300px;
    margin: 0 auto;
  }
}
</style>
