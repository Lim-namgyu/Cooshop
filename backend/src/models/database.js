import { randomUUID } from 'crypto';
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

export const initDatabase = async () => {
  db = new Database(DB_PATH);

  // WAL 모드 활성화 (동시성 향상)
  db.pragma('journal_mode = WAL');

  // Products 테이블: uuid 컬럼 추가
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      uuid TEXT UNIQUE,  -- 외부 노출용 난독화 ID
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
    -- ... (rest of tables)
  `);

  // 마이그레이션: uuid 컬럼이 없는 경우 추가 (기존 DB 호환)
  try {
    const tableInfo = db.pragma('table_info(products)');
    const hasUuid = tableInfo.some(col => col.name === 'uuid');
    if (!hasUuid) {
      console.log('Migrating: Adding uuid column to products table...');
      // SQLite에서는 ADD COLUMN에 UNIQUE 제약조건을 바로 걸 수 없음
      db.exec('ALTER TABLE products ADD COLUMN uuid TEXT');
    }

    // 마이그레이션: uuid가 NULL인 레코드 업데이트
    const rows = db.prepare('SELECT id FROM products WHERE uuid IS NULL').all();
    if (rows.length > 0) {
      console.log(`Migrating: Generating UUIDs for ${rows.length} products...`);
      const updateStmt = db.prepare('UPDATE products SET uuid = ? WHERE id = ?');
      const transaction = db.transaction((items) => {
        for (const item of items) {
          updateStmt.run(randomUUID(), item.id);
        }
      });
      transaction(rows);
    }

    // 인덱스 생성을 통해 유일성 보장
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_uuid ON products(uuid)');

  } catch (err) {
    console.error('Migration failed:', err);
  }

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
    // UUID 생성 (없을 경우)
    const uuid = product.uuid || randomUUID();

    const stmt = getDatabase().prepare(`
      INSERT INTO products (id, uuid, item_id, name, image_url, product_url, category_name, current_price, min_price, max_price, avg_price, updated_at)
      VALUES (@id, @uuid, @item_id, @name, @image_url, @product_url, @category_name, @current_price, @min_price, @max_price, @avg_price, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        image_url = @image_url,
        product_url = @product_url,
        current_price = @current_price,
        min_price = MIN(min_price, @current_price),
        max_price = MAX(max_price, @current_price),
        updated_at = CURRENT_TIMESTAMP
        -- uuid는 업데이트하지 않음 (영구 유지)
    `);
    return stmt.run({ ...product, uuid });
  },

  findById: (id) => {
    return getDatabase().prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  // 외부 노출용 (UUID로 조회)
  findByUuid: (uuid) => {
    return getDatabase().prepare('SELECT * FROM products WHERE uuid = ?').get(uuid);
  },

  findAll: (limit = 20, offset = 0) => {
    // 보안: 최대 20개로 제한. id 대신 uuid 반환
    const safeLimit = Math.min(limit, 20);
    return getDatabase().prepare(`
      SELECT uuid as id, name, image_url, product_url, category_name, current_price, min_price, max_price, avg_price, updated_at
      FROM products 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `).all(safeLimit, offset);
  },

  // ... (나머지 그대로)


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
    // 보안: 최대 20개로 제한
    const safeLimit = Math.min(limit, 20);
    return getDatabase().prepare(`
      SELECT uuid as id, name, image_url, product_url, category_name, current_price, min_price, max_price, avg_price, updated_at, 
        CASE WHEN max_price > 0 
          THEN ROUND((1.0 - (current_price * 1.0 / max_price)) * 100, 1) 
          ELSE 0 
        END as discount_rate
      FROM products 
      WHERE max_price > 0 AND current_price < max_price
      ORDER BY discount_rate DESC 
      LIMIT ?
    `).all(safeLimit);
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
