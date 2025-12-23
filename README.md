# Cooshop - 쿠팡 가격 추적 서비스

쿠팡 상품의 가격 변동을 추적하고, 가격 이력 그래프를 제공하여 사용자가 최적의 구매 시점을 판단할 수 있도록 돕는 서비스입니다.

## 기술 스택

- **Frontend**: Vue 3 + TypeScript + Vite + Chart.js
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **API**: 쿠팡 파트너스 API

## 시작하기

### 1. 백엔드 설정

```bash
cd backend
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 쿠팡 파트너스 API 키 입력

# 데이터 폴더 생성
mkdir data

# 서버 실행
npm run dev
```

### 2. 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

### 3. 브라우저에서 접속

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/products/search?q=키워드 | 상품 검색 |
| GET | /api/products/:id | 상품 상세 (가격 이력 포함) |
| GET | /api/products | 최근 업데이트 상품 |
| GET | /api/products/top/discounts | 할인율 높은 상품 |
| GET | /api/products/goldbox | 골드박스 특가 |

## 환경변수

### Backend (.env)
```
COUPANG_ACCESS_KEY=your_access_key
COUPANG_SECRET_KEY=your_secret_key
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```
