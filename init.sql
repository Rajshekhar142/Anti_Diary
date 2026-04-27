-- -- ==========================================
-- -- 1. AUTHENTICATION DOMAIN (Better Auth)
-- -- ==========================================

-- CREATE TABLE "user" (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     email TEXT NOT NULL UNIQUE,
--     emailVerified BOOLEAN NOT NULL,
--     image TEXT,
--     createdAt TIMESTAMP NOT NULL,
--     updatedAt TIMESTAMP NOT NULL
-- );

-- CREATE TABLE session (
--     id TEXT PRIMARY KEY,
--     expiresAt TIMESTAMP NOT NULL,
--     ipAddress TEXT,
--     userAgent TEXT,
--     userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
-- );

-- CREATE TABLE account (
--     id TEXT PRIMARY KEY,
--     accountId TEXT NOT NULL,
--     providerId TEXT NOT NULL,
--     userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
--     accessToken TEXT,
--     refreshToken TEXT,
--     idToken TEXT,
--     expiresAt TIMESTAMP,
--     password TEXT
-- );

-- ==========================================
-- 2. CORE DOMAIN (LT-2.0 Logging)
-- ==========================================

CREATE TABLE time_logs (
    id SERIAL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    category TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    log_text TEXT
);

-- The Magic: Convert standard table to TimescaleDB Hypertable
SELECT create_hypertable('time_logs','start_time');
-- /home/irwin/codes/monitoring_app/init.sql
-- docker run -v /home/irwin/codes/monitoring_app :/pgdata -e PGDATA=/pgdata \
--     -d --name timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb:latest-pg18