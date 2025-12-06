#!/bin/bash
# Database initialization script
# This script runs automatically when PostgreSQL container starts for the first time

set -e

echo "🚀 Initializing Sealevel Studio database..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 1
done

echo "✅ PostgreSQL is ready!"

# The schema files will be automatically executed by postgres init system
# Files in /docker-entrypoint-initdb.d/ are executed in alphabetical order

echo "📋 Database initialization complete!"
echo "   - Schema files will be loaded automatically"
echo "   - Database: $POSTGRES_DB"
echo "   - User: $POSTGRES_USER"

