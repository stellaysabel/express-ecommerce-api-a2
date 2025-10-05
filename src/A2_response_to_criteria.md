# A2 – Response to Criteria (n12540285 – Estella)

## Core – First data persistence service (S3)
- **Service**: Amazon S3 (bucket `n12540285-test`)
- **Usage**: Stores user-uploaded files. App issues **pre-signed URLs** so clients upload/download directly. The server never stores blobs locally.
- **Why S3**: Durable object storage, cheap, scales, perfect for unstructured files.

## Core – Second data persistence service (RDS/PostgreSQL)
- **Service**: RDS PostgreSQL (shared DB `cohort_2025`)
- **Usage**: All app data (`products`, `customers`, `orders`, `order_lines`) via Knex.
- **Why RDS**: Strong consistency, relational queries & constraints, fits transactional ecommerce data.

## Core – Statelessness
All persistent data lives in **RDS** and **S3**. The API has no local-only state; instance restarts do not lose data. JWT auth is stateless. Pre-signed URLs remove file I/O from the server. Therefore the app can be restarted/replaced without losing application state.

## Core – Authentication with Cognito
App currently uses JWT with server-side auth. (Planned next: Cognito user pool for sign-up/confirm/login and using ID tokens to auth API.)

## Core – DNS with Route53
**Not attempted** (instance is accessed privately via Session Manager; public DNS not available in my setup).

## Additional – S3 Pre-signed URLs
Implemented `/api/s3/presign-upload` and `/api/s3/presign-download`. The video shows:
1) API returns a pre-signed PUT URL,
2) client PUTs file directly to S3,
3) API returns a pre-signed GET URL to download it.

## Additional – In-memory cache
**Not attempted**.

## Additional – Parameter Store
**Not attempted**.

## Additional – Secrets Manager
**Not attempted**.

## Additional – Infrastructure as Code
**Not attempted**.

## Additional – Persistent connections
**Not applicable** (no websockets/SSE in app).

## Notes / How to run
- `npm install`
- set `.env` (DB_HOST etc.) on EC2 (not committed)
- `npm start`

## Comment
- i think this assignment is too big for someone who is working all alone. I couldn't finish everything in time...