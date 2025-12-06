# Database Setup Guide

This guide explains how to set up the PostgreSQL database for Sealevel Studio.

## Overview

Sealevel Studio uses PostgreSQL for:
- **Wallet Recovery**: Storing encrypted wallet keys linked to email addresses
- **Transaction Logging**: Tracking user transactions per feature
- **Rate Limiting**: Managing recovery request limits
- **Email Verification**: Storing verification tokens

## Quick Start

### Option 1: Using Docker (Recommended)

The easiest way to set up the database is using Docker Compose:

```bash
# Start PostgreSQL (and other services)
docker-compose up -d postgres

# Wait for PostgreSQL to be ready (about 10-15 seconds)
docker-compose ps

# The database schema will be automatically initialized on first start
```

The database will be automatically initialized with all required tables when the container starts for the first time.

### Option 2: Manual Setup

If you prefer to run PostgreSQL manually or use an existing database:

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@16
   brew services start postgresql@16
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create the database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE sealevelstudio;
   
   # Exit psql
   \q
   ```

3. **Set up environment variables**:
   ```bash
   # Copy template
   cp env.template .env.local
   
   # Edit .env.local and set:
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sealevelstudio
   ```

4. **Run the setup script**:
   ```bash
   npm run setup:database
   ```

## Environment Variables

Add these to your `.env.local` file:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sealevelstudio

# Optional: Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Database URL Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Examples:
- **Local Docker**: `postgresql://postgres:postgres@localhost:5432/sealevelstudio`
- **Local PostgreSQL**: `postgresql://postgres:yourpassword@localhost:5432/sealevelstudio`
- **Production (Railway)**: `postgresql://user:pass@host.railway.app:5432/railway`
- **Production (Vercel)**: Use Vercel's environment variables

## Docker Configuration

The `docker-compose.yml` includes a PostgreSQL service with:

- **Image**: `postgres:16-alpine`
- **Port**: `5432`
- **Default Database**: `sealevelstudio`
- **Default User**: `postgres`
- **Default Password**: `postgres` (change in production!)

### Customizing Docker Database

Edit `docker-compose.yml` or set environment variables:

```bash
# Set custom credentials
export POSTGRES_USER=myuser
export POSTGRES_PASSWORD=mypassword
export POSTGRES_DB=mydatabase

# Start with custom settings
docker-compose up -d postgres
```

## Database Schema

The database includes the following tables:

### Wallet Recovery Tables

- **wallet_email_mappings**: Links email addresses to encrypted wallet keys
- **recovery_tokens**: Temporary tokens for wallet recovery
- **recovery_rate_limits**: Rate limiting for recovery requests
- **email_verification_tokens**: Email verification tokens

### Transaction Logging Tables

- **feature_transactions**: Logs all user transactions per feature

See the schema files for details:
- `app/lib/database/schema.sql` - Wallet recovery schema
- `app/lib/database/transactions-schema.sql` - Transaction logging schema

## Verification

After setup, verify the database is working:

```bash
# Check connection
npm run setup:database

# Or manually connect
psql postgresql://postgres:postgres@localhost:5432/sealevelstudio

# List tables
\dt

# Check table contents
SELECT COUNT(*) FROM wallet_email_mappings;
SELECT COUNT(*) FROM feature_transactions;
```

## Troubleshooting

### Database Connection Failed

1. **Check if PostgreSQL is running**:
   ```bash
   # Docker
   docker-compose ps postgres
   
   # Local
   pg_isready -U postgres
   ```

2. **Check connection string**:
   - Verify `DATABASE_URL` in `.env.local`
   - Ensure credentials are correct
   - Check port (default: 5432)

3. **Check logs**:
   ```bash
   # Docker logs
   docker-compose logs postgres
   
   # Local PostgreSQL logs
   # macOS: /usr/local/var/log/postgres.log
   # Linux: /var/log/postgresql/
   ```

### Tables Not Created

If tables are missing:

```bash
# Re-run setup script
npm run setup:database

# Or manually execute SQL files
psql postgresql://postgres:postgres@localhost:5432/sealevelstudio < app/lib/database/schema.sql
psql postgresql://postgres:postgres@localhost:5432/sealevelstudio < app/lib/database/transactions-schema.sql
```

### Permission Errors

If you get permission errors:

```bash
# Grant permissions (as postgres superuser)
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE sealevelstudio TO postgres;
\q
```

### Port Already in Use

If port 5432 is already in use:

1. **Change Docker port** in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

2. **Update DATABASE_URL**:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/sealevelstudio
   ```

## Production Deployment

For production, use a managed PostgreSQL service:

### Railway

1. Create a PostgreSQL service in Railway
2. Copy the `DATABASE_URL` from Railway dashboard
3. Add to your environment variables

### Vercel

1. Use Vercel Postgres or external provider
2. Add `DATABASE_URL` in Vercel project settings
3. Ensure SSL is enabled (automatic with Vercel)

### Other Providers

- **Supabase**: Free tier available
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Enterprise-grade
- **DigitalOcean**: Managed databases

## Backup and Restore

### Backup

```bash
# Backup database
pg_dump postgresql://postgres:postgres@localhost:5432/sealevelstudio > backup.sql

# Or using Docker
docker-compose exec postgres pg_dump -U postgres sealevelstudio > backup.sql
```

### Restore

```bash
# Restore from backup
psql postgresql://postgres:postgres@localhost:5432/sealevelstudio < backup.sql

# Or using Docker
docker-compose exec -T postgres psql -U postgres sealevelstudio < backup.sql
```

## Maintenance

### Cleanup Old Data

The `feature_transactions` table automatically cleans up data older than 6 months via a cleanup function.

To manually run cleanup:

```sql
SELECT cleanup_old_transactions();
```

### Monitor Database Size

```sql
SELECT 
  pg_size_pretty(pg_database_size('sealevelstudio')) AS database_size;
```

### Check Table Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Best Practices

1. **Change default password** in production
2. **Use SSL** for remote connections
3. **Limit database access** to application servers only
4. **Regular backups** (daily recommended)
5. **Monitor access logs** for suspicious activity
6. **Encrypt sensitive data** (wallet keys are encrypted before storage)

## Next Steps

After database setup:

1. ✅ Verify connection with `npm run setup:database`
2. ✅ Test wallet recovery feature
3. ✅ Check transaction logging
4. ✅ Set up backups (production)
5. ✅ Monitor database performance

For more information, see:
- [Wallet Recovery Setup](./WALLET_RECOVERY_SETUP.md)
- [Transaction Logging](./TRANSACTION_LOGGING.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)

