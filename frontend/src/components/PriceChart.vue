<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

const props = defineProps<{
  history: PriceHistory[]
  stats: Stats
  currentPrice: number
}>()

const selectedPeriod = ref<'7' | '30' | '90'>('30')

// 기간에 따른 데이터 필터링
const filteredHistory = computed(() => {
  const days = parseInt(selectedPeriod.value)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  return props.history.filter(h => new Date(h.date) >= cutoff)
})

// 차트 데이터
const chartData = computed(() => ({
  labels: filteredHistory.value.map(h => {
    const date = new Date(h.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }),
  datasets: [
    {
      label: '가격',
      data: filteredHistory.value.map(h => h.price),
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 6
    }
  ]
}))

// 차트 옵션
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.parsed.y.toLocaleString()}원`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value: number) => `${(value / 10000).toFixed(0)}만`
      }
    }
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price)
}
</script>

<template>
  <div class="price-chart">
    <div class="chart-header">
      <h3>📈 가격 변동 그래프</h3>
      <div class="period-selector">
        <button
          v-for="period in ['7', '30', '90']"
          :key="period"
          :class="['period-btn', { active: selectedPeriod === period }]"
          @click="selectedPeriod = period as '7' | '30' | '90'"
        >
          {{ period === '7' ? '1주' : period === '30' ? '1개월' : '3개월' }}
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">현재가</span>
        <span class="stat-value current">{{ formatPrice(currentPrice) }}원</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">역대 최저가</span>
        <span class="stat-value lowest">{{ formatPrice(stats.min_price) }}원</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">역대 최고가</span>
        <span class="stat-value">{{ formatPrice(stats.max_price) }}원</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">평균가</span>
        <span class="stat-value">{{ formatPrice(stats.avg_price) }}원</span>
      </div>
    </div>

    <div class="chart-container">
      <Line 
        v-if="filteredHistory.length > 0" 
        :data="chartData" 
        :options="chartOptions" 
      />
      <div v-else class="no-data">
        가격 이력이 없습니다.
      </div>
    </div>
  </div>
</template>

<style scoped>
.price-chart {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
}

.period-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-color);
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
}

.stat-value.current {
  color: var(--primary-color);
}

.stat-value.lowest {
  color: #28a745;
}

.chart-container {
  height: 300px;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
