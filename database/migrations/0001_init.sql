-- 0001_init — baseline schema.
-- The full DDL lives in ../schemas/01_schema.sql and ../schemas/02_auth_security.sql,
-- which the local Docker Postgres applies automatically. For managed/production
-- environments, this migration concatenates those files as the initial step.
--
-- Apply with: pnpm db:migrate
\i ../schemas/01_schema.sql
\i ../schemas/02_auth_security.sql
