<script setup lang="ts">
// 관리자 페이지: 클라이언트 사이드 전용 (SSR 불필요)
definePageMeta({
  ssr: false // 관리자 페이지는 SSR 비활성화
});

const isAuthenticated = ref(false);
const password = ref('');
const error = ref('');

// Data
const stats = ref<any>(null);
const products = ref<any[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);

onMounted(() => {
  const stored = localStorage.getItem('admin_pwd');
  if (stored) {
    password.value = stored;
    fetchStats();
    isAuthenticated.value = true;
  }
});

const login = async () => {
  if (!password.value) return;
  
  const ok = await fetchStats();
  if (ok) {
    localStorage.setItem('admin_pwd', password.value);
    isAuthenticated.value = true;
    error.value = '';
  } else {
    error.value = '비밀번호가 올바르지 않거나 서버 오류입니다.';
  }
};

const logout = () => {
  localStorage.removeItem('admin_pwd');
  isAuthenticated.value = false;
  password.value = '';
  stats.value = null;
  products.value = [];
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Admin-Password': password.value
});

const fetchStats = async () => {
  try {
    const res = await fetch(`/api/sys-admin-control/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error(res.statusText);
    stats.value = await res.json();
    fetchProducts();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const fetchProducts = async (pageNum = 1) => {
  loading.value = true;
  try {
    const res = await fetch(`/api/sys-admin-control/products?page=${pageNum}`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      products.value = data.data;
      page.value = data.page;
      totalPages.value = data.totalPages;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

const formatPrice = (price: number) => {
  return price?.toLocaleString() + '원';
};
</script>

<template>
  <div class="admin-container">
    <!-- Login Screen -->
    <div v-if="!isAuthenticated" class="login-screen">
      <div class="login-box">
        <h2>Admin Login</h2>
        <form @submit.prevent="login">
          <input 
            type="password" 
            v-model="password" 
            placeholder="Enter Admin Password"
            class="form-input"
          />
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button type="submit" class="btn-primary">Access Dashboard</button>
        </form>
      </div>
    </div>

    <!-- Dashboard Screen -->
    <div v-else class="dashboard">
      <header class="header">
        <h1>Cooshop Admin</h1>
        <div class="header-right">
            <span v-if="stats" class="server-time">🕒 Server: {{ stats.serverTime }}</span>
            <button @click="logout" class="btn-secondary">Logout</button>
        </div>
      </header>

      <main class="content">
        <!-- Stats Cards -->
        <div class="stats-grid" v-if="stats">
          <div class="stat-card">
            <h3>Total Products</h3>
            <p class="stat-value">{{ stats.totalProducts.toLocaleString() }}</p>
          </div>
          <div class="stat-card">
            <h3>Updated Today</h3>
            <p class="stat-value">{{ stats.todayUpdated.toLocaleString() }}</p>
          </div>
          <div class="stat-card">
            <h3>Price Changes (24h)</h3>
            <p class="stat-value">{{ stats.recentPriceChanges.toLocaleString() }}</p>
          </div>
          <div class="stat-card">
            <h3>DB Disk Usage</h3>
            <p class="stat-value">{{ stats.dbSize }}</p>
          </div>
        </div>

        <!-- Products Table -->
        <div class="table-section">
          <h2>Product List <button @click="fetchProducts(page)" class="refresh-btn">🔄</button></h2>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Logs</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in products" :key="p.id">
                  <td>{{ p.id }}</td>
                  <td><img :src="p.image_url" alt="" class="thumb" /></td>
                  <td class="name-col"><a :href="p.product_url" target="_blank">{{ p.name }}</a></td>
                  <td>{{ formatPrice(p.current_price) }}</td>
                  <td>
                    <span v-if="p.max_price > p.current_price" class="badge-discount">
                        {{ Math.round((1 - p.current_price / p.max_price) * 100) }}%
                    </span>
                  </td>
                  <td>{{ p.history_count || 0 }}</td>
                  <td>{{ formatDate(p.updated_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button :disabled="page <= 1" @click="fetchProducts(page - 1)">Prev</button>
            <span>Page {{ page }} of {{ totalPages }}</span>
            <button :disabled="page >= totalPages" @click="fetchProducts(page + 1)">Next</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f3f4f6;
  font-family: sans-serif;
}

/* Login */
.login-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}
.form-input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Dashboard */
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}
.header {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.server-time {
    font-size: 0.9rem;
    color: #666;
    margin-right: 1rem;
}
.content {
  padding: 2rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2563eb;
}

/* Table */
.table-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.table-container {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}
th {
  background-color: #f8fafc;
  font-weight: 600;
}
.thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.name-col {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.name-col a {
    color: #333;
    text-decoration: none;
}
.name-col a:hover {
    text-decoration: underline;
    color: #2563eb;
}
.badge-discount {
    background: #def7ec;
    color: #03543f;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
button {
  cursor: pointer;
}
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
}
.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}
.error-msg {
  color: #dc2626;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.refresh-btn {
    border: none;
    background: none;
    font-size: 1.2rem;
}
</style>
