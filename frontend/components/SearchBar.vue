<script setup lang="ts">
const emit = defineEmits<{
  search: [keyword: string]
}>()

const keyword = ref('')
const isLoading = ref(false)

const popularKeywords = ['에어팟', '아이폰', '맥북', '갤럭시', '다이슨', '닌텐도']

const handleSearch = async () => {
  const trimmedKeyword = keyword.value.trim()
  if (!trimmedKeyword) return
  
  emit('search', trimmedKeyword)
}

const searchWithKeyword = (kw: string) => {
  keyword.value = kw
  handleSearch()
}
</script>

<template>
  <div class="search-container">
    <form @submit.prevent="handleSearch" class="search-form">
      <input
        v-model="keyword"
        type="text"
        placeholder="쿠팡 URL 또는 상품명을 입력하세요"
        class="search-input"
        :disabled="isLoading"
      />
      <button type="submit" class="search-button" :disabled="isLoading">
        <span v-if="isLoading">검색 중...</span>
        <span v-else>🔍 검색</span>
      </button>
    </form>
    
    <div class="popular-keywords">
      <span class="label">인기 검색어:</span>
      <button
        v-for="kw in popularKeywords"
        :key="kw"
        @click="searchWithKeyword(kw)"
        class="keyword-tag"
      >
        {{ kw }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.search-form {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4a6cf7;
}

.search-button {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #4a6cf7;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover:not(:disabled) {
  background-color: #3a5ac7;
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.popular-keywords {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.label {
  color: #888;
  font-size: 0.875rem;
}

.keyword-tag {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: #333;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.keyword-tag:hover {
  background-color: #4a6cf7;
  color: white;
  border-color: #4a6cf7;
}
</style>
