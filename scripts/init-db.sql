-- Initialize database with pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS campaigns;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set up initial user for development
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'ai_defense_user') THEN
        CREATE USER ai_defense_user WITH PASSWORD 'ai_defense_password';
    END IF;
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO ai_defense_user;
GRANT USAGE ON SCHEMA campaigns TO ai_defense_user;
GRANT USAGE ON SCHEMA content TO ai_defense_user;
GRANT USAGE ON SCHEMA analytics TO ai_defense_user;
