-- =============================================================================
-- ONE-TIME: wipe the public schema and Supabase migration history, then re-apply
-- migrations from this repo (001 → 002 → 003).
--
-- WARNING: Destroys ALL tables, views, functions, and types in `public`.
-- Does NOT delete auth.users (accounts live in auth.*).
-- Run in Supabase Dashboard → SQL Editor (or psql) on the project you want to reset.
-- =============================================================================

-- 1) Remove everything in public (legacy assessment tables, old org tables, etc.)
DROP SCHEMA IF EXISTS public CASCADE;

-- 2) Recreate empty public schema
CREATE SCHEMA public;

-- 3) Restore standard Supabase role access (required for PostgREST, RLS, and CLI)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 4) Clear CLI migration history so `supabase db push` will apply 001–003 again.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations'
      AND table_name = 'schema_migrations'
  ) THEN
    TRUNCATE TABLE supabase_migrations.schema_migrations;
  END IF;
END $$;
