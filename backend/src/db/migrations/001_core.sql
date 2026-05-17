-- ─────────────────────────────────────────────────────────────────────────────
--  Migration 001 — Core schema
--  Run once: mysql -u root -p topology < 001_core.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  display_name  VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NULL,
  role          ENUM('admin','operator','service_manager','viewer') NOT NULL DEFAULT 'viewer',
  provider      ENUM('local','keycloak') NOT NULL DEFAULT 'local',
  external_id   VARCHAR(255)  NULL,           -- Keycloak sub claim
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  api_tokens    JSON          NULL,           -- [{id, hash, label, createdAt}]
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_users_email    (email),
  INDEX idx_users_provider (provider, external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Topology Definitions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topology_definitions (
  id                   VARCHAR(36)  NOT NULL PRIMARY KEY,
  topo_uuid            VARCHAR(64)  NOT NULL UNIQUE,
  name                 VARCHAR(255) NOT NULL,
  type                 ENUM('IP_MPLS','5G_CORE','5G_RAN','TRANSPORT','ACCESS','CUSTOM') NOT NULL DEFAULT 'CUSTOM',
  description          TEXT         NULL,
  connectors           JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  node_mapping         JSON         NOT NULL DEFAULT (JSON_OBJECT()),
  edge_mapping         JSON         NOT NULL DEFAULT (JSON_OBJECT()),
  layout_algorithm     VARCHAR(64)  NOT NULL DEFAULT 'ELK_LAYERED',
  auto_refresh_seconds INT UNSIGNED NOT NULL DEFAULT 30,
  is_active            TINYINT(1)  NOT NULL DEFAULT 1,
  graph_hash           VARCHAR(64)  NULL,
  created_by           VARCHAR(36)  NULL,
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_topodef_type (type),
  INDEX idx_topodef_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Topology Nodes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topology_nodes (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  node_uuid     VARCHAR(64)  NOT NULL UNIQUE,
  topology_id   VARCHAR(36)  NOT NULL,
  label         VARCHAR(255) NOT NULL,
  type          VARCHAR(64)  NOT NULL,
  status        ENUM('UP','DOWN','DEGRADED','UNKNOWN','MAINTENANCE') NOT NULL DEFAULT 'UNKNOWN',
  ip_address    VARCHAR(64)  NULL,
  vendor        VARCHAR(128) NULL,
  model         VARCHAR(128) NULL,
  properties    JSON         NOT NULL DEFAULT (JSON_OBJECT()),
  pos_x         FLOAT        NULL,
  pos_y         FLOAT        NULL,
  layer         VARCHAR(64)  NULL,
  discovered_at DATETIME(3)  NULL,
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_node_topology (topology_id),
  INDEX idx_node_status   (status),
  INDEX idx_node_ip       (ip_address),
  CONSTRAINT fk_node_topology FOREIGN KEY (topology_id) REFERENCES topology_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Topology Links ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topology_links (
  id               VARCHAR(36)  NOT NULL PRIMARY KEY,
  link_uuid        VARCHAR(64)  NOT NULL UNIQUE,
  topology_id      VARCHAR(36)  NOT NULL,
  source_node_id   VARCHAR(36)  NOT NULL,
  target_node_id   VARCHAR(36)  NOT NULL,
  label            VARCHAR(255) NULL,
  status           ENUM('UP','DOWN','DEGRADED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  bandwidth_mbps   FLOAT        NULL,
  utilization_pct  FLOAT        NULL,
  properties       JSON         NOT NULL DEFAULT (JSON_OBJECT()),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_link_topology (topology_id),
  INDEX idx_link_source   (source_node_id),
  INDEX idx_link_target   (target_node_id),
  CONSTRAINT fk_link_topology FOREIGN KEY (topology_id)    REFERENCES topology_definitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_link_source   FOREIGN KEY (source_node_id) REFERENCES topology_nodes(id)       ON DELETE CASCADE,
  CONSTRAINT fk_link_target   FOREIGN KEY (target_node_id) REFERENCES topology_nodes(id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Alarms ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alarms (
  id               VARCHAR(36)  NOT NULL PRIMARY KEY,
  alarm_uuid       VARCHAR(64)  NOT NULL UNIQUE,
  topology_id      VARCHAR(36)  NULL,
  node_id          VARCHAR(36)  NULL,
  severity         ENUM('CRITICAL','MAJOR','MINOR','WARNING','CLEARED') NOT NULL,
  title            VARCHAR(512) NOT NULL,
  description      TEXT         NULL,
  source           VARCHAR(128) NOT NULL DEFAULT 'SYSTEM',
  is_acknowledged  TINYINT(1)  NOT NULL DEFAULT 0,
  acknowledged_by  VARCHAR(36)  NULL,
  acknowledged_at  DATETIME(3)  NULL,
  is_cleared       TINYINT(1)  NOT NULL DEFAULT 0,
  cleared_at       DATETIME(3)  NULL,
  properties       JSON         NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_alarm_severity  (severity),
  INDEX idx_alarm_cleared   (is_cleared),
  INDEX idx_alarm_topology  (topology_id),
  INDEX idx_alarm_node      (node_id),
  INDEX idx_alarm_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Discovery Targets ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discovery_targets (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  type          ENUM('SNMP','GRPC','ZABBIX','NRF') NOT NULL,
  host          VARCHAR(255) NULL,
  port          INT UNSIGNED NULL,
  topology_id   VARCHAR(36)  NULL,
  credentials   JSON         NULL,    -- AES-256-GCM encrypted values
  config        JSON         NULL,
  schedule      VARCHAR(64)  NULL,    -- cron expression e.g. "*/5 * * * *"
  last_run_at   DATETIME(3)  NULL,
  last_status   VARCHAR(64)  NULL,
  is_enabled    TINYINT(1)  NOT NULL DEFAULT 1,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_disc_type    (type),
  INDEX idx_disc_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Catalogue Services ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogue_services (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  service_uuid  VARCHAR(64)  NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(128) NULL,
  status        ENUM('active','inactive','maintenance','deprecated') NOT NULL DEFAULT 'active',
  health        ENUM('healthy','degraded','critical','unknown') NOT NULL DEFAULT 'unknown',
  description   TEXT         NULL,
  owner         VARCHAR(255) NULL,
  sla_target    FLOAT        NULL,
  topology_id   VARCHAR(36)  NULL,
  meta          JSON         NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FULLTEXT INDEX ft_service_search (name, description),
  INDEX idx_service_status   (status),
  INDEX idx_service_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Service Flows ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_flows (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  service_id   VARCHAR(36)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  flow_data    JSON         NOT NULL,    -- React Flow nodes + edges
  version      INT UNSIGNED NOT NULL DEFAULT 1,
  is_published TINYINT(1)  NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_flow_service (service_id),
  CONSTRAINT fk_flow_service FOREIGN KEY (service_id) REFERENCES catalogue_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: default admin account ───────────────────────────────────────────────
-- Password: Admin@Axilog123  (bcrypt $2b$12$ — CHANGE IMMEDIATELY)
INSERT IGNORE INTO users (id, email, display_name, password_hash, role, provider)
VALUES (
  'admin-seed-00000000-0000-0000-0001',
  'admin@axilog.local',
  'Axilog Admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdpPW2yYA9pAzO6',
  'admin',
  'local'
);
