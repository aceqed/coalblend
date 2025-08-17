-- -- Create database if it doesn't exist
-- SELECT 'CREATE DATABASE coal_blend'
-- WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'coal_blend')\gexec

-- -- Grant privileges
-- GRANT ALL PRIVILEGES ON DATABASE coal_blend TO postgres;

-- -- Connect to the database
-- \c coal_blend;

-- -- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE coal_blend'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'coal_blend')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE coal_blend TO postgres;

-- Connect to new DB
\c coal_blend;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example: create a sample table
CREATE TABLE IF NOT EXISTS sample_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);
