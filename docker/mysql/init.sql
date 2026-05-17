-- ─────────────────────────────────────────────────────────────────────────────
--  MySQL init script — runs before schema migration
--  Creates the Keycloak database if SSO profile is enabled.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS keycloak
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON keycloak.* TO 'topology_user'@'%';
FLUSH PRIVILEGES;
