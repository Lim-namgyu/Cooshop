<script setup lang="ts">
interface Product {
  id: string
  name: string
  image_url: string
  current_price: number
  min_price: number
  max_price: number
  avg_price: number
}

// SEO 메타 태그
useHead({
  title: 'Cooshop - 쿠팡 가격 추적',
  meta: [
    { name: 'description', content: '쿠팡 상품 가격 변동을 추적하고 최적의 구매 시점을 찾아보세요!' }
  ]
})

const products = ref<Product[]>([])
const isLoading = ref(false)
const error = ref('')
const hasSearched = ref(false)

const config = useRuntimeConfig()

const handleSearch = async (keyword: string) => {
  isLoading.value = true
  error.value = ''
  hasSearched.value = true

  try {
    const { data, error: fetchError } = await useFetch<{ success: boolean; data: Product[] }>(
      `/api/products/search?q=${encodeURIComponent(keyword)}`
    )

    if (fetchError.value) {
      error.value = '검색 중 오류가 발생했습니다.'
    } else if (data.value?.success) {
      products.value = data.value.data
    } else {
      error.value = '검색 결과를 불러올 수 없습니다.'
    }
  } catch (err) {
    console.error('Search error:', err)
    error.value = '서버와 연결할 수 없습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="home">
    <header class="hero">
      <h1>🛒 Cooshop</h1>
      <p class="tagline">쿠팡 가격 변동을 추적하고 최적의 구매 시점을 찾아보세요</p>
      
      <SearchBar @search="handleSearch" />
    </header>

    <main class="content">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>상품을 검색하는 중...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>⚠️ {{ error }}</p>
      </div>

      <div v-else-if="hasSearched && products.length === 0" class="no-results">
        <p>검색 결과가 없습니다.</p>
      </div>

      <div v-else-if="products.length > 0" class="results">
        <h2>검색 결과 ({{ products.length }}개)</h2>
        <div class="product-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>

      <div v-else class="welcome">
        <div class="features">
          <div class="feature">
            <span class="icon">📊</span>
            <h3>가격 변동 추적</h3>
            <p>상품의 가격 이력을 그래프로 확인하세요</p>
          </div>
          <div class="feature">
            <span class="icon">💰</span>
            <h3>최저가 알림</h3>
            <p>역대 최저가에 가까워지면 알려드려요</p>
          </div>
          <div class="feature">
            <span class="icon">🔥</span>
            <h3>할인 상품 발굴</h3>
            <p>할인율 높은 상품을 쉽게 찾아보세요</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 3rem 1rem;
  text-align: center;
}

.hero h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.tagline {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #ddd;
  border-top-color: #4a6cf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error, .no-results {
  text-align: center;
  padding: 4rem;
  color: #888;
}

.error p {
  color: #dc3545;
}

.results h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.welcome {
  padding: 2rem 0;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature {
  text-align: center;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature .icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.feature h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.feature p {
  color: #888;
}
</style>
