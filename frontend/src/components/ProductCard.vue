<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Product {
  id: string
  name: string
  image_url: string
  current_price: number
  min_price: number
  max_price: number
  avg_price: number
  product_url?: string
}

const props = defineProps<{
  product: Product
}>()

const router = useRouter()

// 할인율 계산
const discountRate = computed(() => {
  if (!props.product.max_price || props.product.max_price <= 0) return 0
  const rate = Math.round((1 - props.product.current_price / props.product.max_price) * 100)
  return Math.max(0, rate)
})

// 가격 포맷
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price)
}

// 라벨 타입
const priceLabel = computed(() => {
  if (props.product.current_price <= props.product.min_price) {
    return { text: '역대최저가', class: 'label-lowest' }
  }
  const diff = props.product.current_price - props.product.min_price
  const range = props.product.max_price - props.product.min_price
  if (range > 0 && diff / range < 0.1) {
    return { text: '최저가근접', class: 'label-near' }
  }
  return null
})

const goToDetail = () => {
  router.push({ name: 'product', params: { id: props.product.id } })
}
</script>

<template>
  <div class="product-card" @click="goToDetail">
    <div class="badge-container">
      <span v-if="discountRate > 0" class="discount-badge">
        {{ discountRate }}%
      </span>
      <span v-if="priceLabel" :class="['price-label', priceLabel.class]">
        {{ priceLabel.text }}
      </span>
    </div>
    
    <div class="image-container">
      <img 
        :src="product.image_url" 
        :alt="product.name"
        loading="lazy"
        @error="($event.target as HTMLImageElement).src = '/placeholder.png'"
      />
    </div>
    
    <div class="info">
      <h3 class="name">{{ product.name }}</h3>
      
      <div class="price-info">
        <span class="current-price">{{ formatPrice(product.current_price) }}원</span>
        <span v-if="discountRate > 0" class="original-price">
          {{ formatPrice(product.max_price) }}원
        </span>
      </div>
      
      <div class="stats">
        <span>평균 {{ formatPrice(product.avg_price) }}원</span>
        <span>최저 {{ formatPrice(product.min_price) }}원</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  position: relative;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.badge-container {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.discount-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background-color: var(--primary-color);
  border-radius: 4px;
}

.price-label {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
}

.label-lowest {
  color: white;
  background-color: #28a745;
}

.label-near {
  color: white;
  background-color: #17a2b8;
}

.image-container {
  width: 100%;
  aspect-ratio: 1;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.info {
  padding: 1rem;
}

.name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.current-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-color);
}

.original-price {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
