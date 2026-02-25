# Docker PostgreSQL Setup

## Start PostgreSQL Database

```bash
docker run --name gnex-db \
  -e POSTGRES_USER=gnex \
  -e POSTGRES_PASSWORD=gnex \
  -e POSTGRES_DB=gnex360 \
  -p 5432:5432 -d postgres:17
```

## Useful Docker Commands

```bash
# Stop the database
docker stop gnex-db

# Start the database
docker start gnex-db

# View logs
docker logs gnex-db

# Remove the container
docker rm gnex-db

# Connect to PostgreSQL
docker exec -it gnex-db psql -U gnex -d gnex360
```
