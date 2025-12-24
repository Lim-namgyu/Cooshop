import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로덕션 환경(Render)에서는 /data 디스크 사용, 개발 환경에서는 로컬 경로 사용
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const DB_DIR = isProduction ? '/data' : join(__dirname, '../../data');
const DB_PATH = join(DB_DIR, 'cooshop.db');

// 디렉토리가 없으면 생성 (개발 환경용)
if (!isProduction && !existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

/**
 * SQLite 데이터베이스 초기화
 * - products: 상품 메타 정보
 * - price_history: 가격 이력 (시계열 데이터)
 */
export const initDatabase = async () => {
  db = new Database(DB_PATH);

  // WAL 모드 활성화 (동시성 향상)
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      item_id TEXT,
      name TEXT NOT NULL,
      image_url TEXT,
      product_url TEXT,
      category_name TEXT,
      current_price INTEGER,
      min_price INTEGER,
      max_price INTEGER,
      avg_price INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      price INTEGER NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_price_history_product_id 
      ON price_history(product_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at 
      ON price_history(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_products_updated_at 
      ON products(updated_at);
  `);

  console.log('Database initialized successfully');
  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// 상품 관련 쿼리
export const productQueries = {
  upsert: (product) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO products (id, item_id, name, image_url, product_url, category_name, current_price, min_price, max_price, avg_price, updated_at)
      VALUES (@id, @item_id, @name, @image_url, @product_url, @category_name, @current_price, @min_price, @max_price, @avg_price, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        image_url = @image_url,
        product_url = @product_url,
        current_price = @current_price,
        min_price = MIN(min_price, @current_price),
        max_price = MAX(max_price, @current_price),
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(product);
  },

  findById: (id) => {
    return getDatabase().prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  findAll: (limit = 20, offset = 0) => {
    return getDatabase().prepare(`
      SELECT * FROM products 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  findOldestOne: () => {
    return getDatabase().prepare(`
      SELECT * FROM products 
      ORDER BY updated_at ASC 
      LIMIT 1
    `).get();
  },

  touch: (id) => {
    return getDatabase().prepare(`
      UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  },

  findByDiscountRate: (limit = 20) => {
    return getDatabase().prepare(`
      SELECT *, 
        CASE WHEN max_price > 0 
          THEN ROUND((1.0 - (current_price * 1.0 / max_price)) * 100, 1) 
          ELSE 0 
        END as discount_rate
      FROM products 
      WHERE max_price > 0 AND current_price < max_price
      ORDER BY discount_rate DESC 
      LIMIT ?
    `).all(limit);
  },

  count: () => {
    const result = getDatabase().prepare('SELECT COUNT(*) as count FROM products').get();
    return result.count;
  }
};

// 가격 이력 쿼리
export const priceHistoryQueries = {
  insert: (productId, price) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO price_history (product_id, price) VALUES (?, ?)
    `);
    return stmt.run(productId, price);
  },

  findByProductId: (productId, days = 30) => {
    return getDatabase().prepare(`
      SELECT price, recorded_at 
      FROM price_history 
      WHERE product_id = ? 
        AND recorded_at >= datetime('now', '-' || ? || ' days')
      ORDER BY recorded_at ASC
    `).all(productId, days);
  },

  getStats: (productId) => {
    return getDatabase().prepare(`
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(AVG(price)) as avg_price,
        COUNT(*) as count
      FROM price_history 
      WHERE product_id = ?
    `).get(productId);
  }
};
