<template>
  <div id="app">
    <NuxtPage />
    
    <!-- 쿠팡 파트너스 고지 푸터 -->
    <footer class="coupang-disclaimer">
      <p>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
      <p class="copyright">© 2024 Cooshop. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.coupang-disclaimer {
  margin-top: auto;
  padding: 20px;
  background-color: #f8f9fa;
  text-align: center;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #eee;
}

.coupang-disclaimer .copyright {
  margin-top: 8px;
  color: #999;
}
</style>
