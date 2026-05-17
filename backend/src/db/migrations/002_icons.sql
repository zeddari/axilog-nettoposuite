-- ─────────────────────────────────────────────────────────────────────────────
--  Migration 002 — node icon customisation
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add custom_icon column to topology_nodes (safe: ignore error if already exists)
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'topology_nodes'
    AND COLUMN_NAME  = 'custom_icon'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE topology_nodes ADD COLUMN custom_icon VARCHAR(512) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Uploaded / built-in icon catalogue
CREATE TABLE IF NOT EXISTS node_icons (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  category     VARCHAR(50)  NOT NULL DEFAULT 'custom',
  icon_key     VARCHAR(100) NULL     COMMENT 'For built-in icons: the key used in the registry',
  file_path    VARCHAR(512) NULL     COMMENT 'Server-relative path for uploaded files',
  mime_type    VARCHAR(50)  NOT NULL DEFAULT 'image/svg+xml',
  uploaded_by  VARCHAR(36)  NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
