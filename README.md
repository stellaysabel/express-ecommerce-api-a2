# Express E‑commerce REST API (PostgreSQL / AWS‑ready)

Minimal Express API with JWT auth and a PostgreSQL datastore.
Designed to run locally via Docker Compose and in AWS EC2 against Amazon RDS.

## Features
- Public product listing and retrieval; simple product creation (left public for seeding).
- JWT auth for customers; register/login/me.
- Orders require auth; transactionally creates order + lines and decrements stock.
- PostgreSQL via `knex` (compatible with Amazon RDS).
- Programmatic migrations at container start.

## Quick start (local)
```bash
cp .env.example .env
docker compose up --build -d
# API -> http://localhost:3000
```

## Endpoints
- `GET /health`
- `GET /api/products` | `GET /api/products/:id` | `POST /api/products`
- `POST /api/customers/register` | `POST /api/customers/login` | `GET /api/customers/me` (auth)
- `POST /api/orders` (auth) | `GET /api/orders/my` (auth) | `GET /api/orders/:id` (auth)

## AWS EC2 + RDS deployment (high level)
1. **Create RDS (PostgreSQL)**: pick engine version, instance class, create DB and master user.
2. **Networking**: In RDS security group, allow inbound from your EC2's security group on 5432.
3. **On EC2** (Docker installed):
   - Set environment variables: `JWT_SECRET`, `DATABASE_URL`, `DB_SSL=true` (if your RDS requires TLS).

     Example: `DATABASE_URL=postgres://USER:PASSWORD@your-rds-endpoint:5432/DBNAME`

   - Copy project files (or use the zip below), then build and run:
     ```bash
     docker build -t ecommerce-api .
     docker run -d --name ecommerce-api -p 3000:3000 \
       -e JWT_SECRET=$JWT_SECRET \
       -e DATABASE_URL=$DATABASE_URL \
       -e DB_SSL=true \
       ecommerce-api
     ```
   - The container will auto-run migrations on boot.

4. **Health check**: `curl http://EC2_PUBLIC_IP:3000/health`

## Seeding products
Use `POST /api/products` to add initial products.

Example:
```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{ "name":"Coffee Mug", "sku":"MUG-COFFEE", "price":12.99, "stock":50, "description":"Ceramic mug 350ml" }'
```

## Environment variables
- `JWT_SECRET` (required)

- `DATABASE_URL` e.g. `postgres://user:pass@host:5432/db`

- `DB_SSL` set to `true` when connecting to RDS that enforces TLS

- `PORT` (default 3000)

---
