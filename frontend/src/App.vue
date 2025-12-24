<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
    <footer class="footer">
      <p class="disclaimer">
        "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
      </p>
      <p class="copyright">© 2025 Cooshop. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #dc3545;
  --primary-hover: #c82333;
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --text-color: #212529;
  --text-muted: #6c757d;
  --border-color: #dee2e6;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.footer {
  text-align: center;
  padding: 2rem 1rem;
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.disclaimer {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.copyright {
  font-size: 0.75rem;
  color: #adb5bd;
}
</style>
