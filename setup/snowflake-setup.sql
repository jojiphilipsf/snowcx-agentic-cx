/*
 * SnowCX — Agentic CX Intelligence
 * Snowflake Infrastructure Setup
 *
 * Run this script as ACCOUNTADMIN (or a role with CREATE DATABASE, CREATE WAREHOUSE,
 * CREATE COMPUTE POOL, CREATE IMAGE REPOSITORY privileges).
 *
 * What it creates:
 *   1. Database & Schema   — TELECOM_CX.DATA
 *   2. Warehouse           — TELECOM_CX_WH (X-Small)
 *   3. Application Role    — TELECOM_CX_DEMO_RL
 *   4. Compute Pool        — TELECOM_CX_POOL  (for SPCS deployment)
 *   5. Image Repository    — TELECOM_CX.DATA.TELECOM_CX_REPO
 *   6. Grants for the demo role
 */

-- ============================================================
-- 1. Database & Schema
-- ============================================================
USE ROLE ACCOUNTADMIN;

CREATE DATABASE IF NOT EXISTS TELECOM_CX;
CREATE SCHEMA IF NOT EXISTS TELECOM_CX.DATA;

-- ============================================================
-- 2. Warehouse
-- ============================================================
CREATE WAREHOUSE IF NOT EXISTS TELECOM_CX_WH
  WITH WAREHOUSE_SIZE = 'X-SMALL'
  AUTO_SUSPEND = 120
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE;

-- ============================================================
-- 3. Application Role
-- ============================================================
CREATE ROLE IF NOT EXISTS TELECOM_CX_DEMO_RL;
GRANT ROLE TELECOM_CX_DEMO_RL TO ROLE SYSADMIN;

-- ============================================================
-- 4. Grants
-- ============================================================
GRANT USAGE ON DATABASE TELECOM_CX         TO ROLE TELECOM_CX_DEMO_RL;
GRANT USAGE ON SCHEMA   TELECOM_CX.DATA    TO ROLE TELECOM_CX_DEMO_RL;
GRANT SELECT ON ALL TABLES IN SCHEMA TELECOM_CX.DATA TO ROLE TELECOM_CX_DEMO_RL;
GRANT SELECT ON FUTURE TABLES IN SCHEMA TELECOM_CX.DATA TO ROLE TELECOM_CX_DEMO_RL;
GRANT USAGE ON WAREHOUSE TELECOM_CX_WH     TO ROLE TELECOM_CX_DEMO_RL;

-- Grant Cortex LLM access
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE TELECOM_CX_DEMO_RL;

-- ============================================================
-- 5. Compute Pool (for SPCS — optional, skip if not deploying to SPCS)
-- ============================================================
CREATE COMPUTE POOL IF NOT EXISTS TELECOM_CX_POOL
  MIN_NODES = 1
  MAX_NODES = 1
  INSTANCE_FAMILY = CPU_X64_XS
  AUTO_RESUME = TRUE
  AUTO_SUSPEND_SECS = 300;

GRANT USAGE ON COMPUTE POOL TELECOM_CX_POOL TO ROLE SYSADMIN;
GRANT USAGE ON COMPUTE POOL TELECOM_CX_POOL TO ROLE TELECOM_CX_DEMO_RL;

-- ============================================================
-- 6. Image Repository (for SPCS — optional)
-- ============================================================
USE SCHEMA TELECOM_CX.DATA;
CREATE IMAGE REPOSITORY IF NOT EXISTS TELECOM_CX_REPO;
GRANT READ ON IMAGE REPOSITORY TELECOM_CX_REPO TO ROLE TELECOM_CX_DEMO_RL;

-- ============================================================
-- Done! Next step: run the data generator to populate tables.
-- ============================================================
SELECT 'Snowflake infrastructure setup complete!' AS STATUS;
