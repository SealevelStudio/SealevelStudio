# Database Quick Start

Get your database up and running in 3 steps!

## Step 1: Start PostgreSQL with Docker

```bash
docker-compose up -d postgres
```

This will:
- Start PostgreSQL on port 5432
- Create the `sealevelstudio` database
- Automatically initialize all tables

## Step 2: Set Environment Variable

Add to your `.env.local` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sealevelstudio
```

## Step 3: Verify Setup

```bash
npm run setup:database
```

You should see:
```
✅ Database connection successful
✅ Successfully executed: app/lib/database/schema.sql
✅ Successfully executed: app/lib/database/transactions-schema.sql
✅ Database setup complete!
```

## That's it! 🎉

Your database is now ready to use. The application will automatically connect when you run:

```bash
npm run dev
```

## Troubleshooting

**Port already in use?**
- Change the port in `docker-compose.yml`: `"5433:5432"`
- Update `DATABASE_URL` to use port 5433

**Connection refused?**
- Wait a few seconds for PostgreSQL to start: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

**Need more help?**
See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for detailed instructions.

