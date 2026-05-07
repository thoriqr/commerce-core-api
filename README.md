# Commerce Core API

[![CI](https://github.com/thoriqr/commerce-core-api/actions/workflows/ci.yml/badge.svg)](https://github.com/thoriqr/commerce-core-api/actions/workflows/ci.yml)

Backend API for a modern e-commerce platform built with Node.js, Express, TypeScript, PostgreSQL, and Redis.

---

## Overview

This project focuses on building a production-oriented commerce backend with:

- Transactional checkout flow
- Payment webhook synchronization
- Variant-based products
- Snapshot-based order architecture
- Redis caching
- Integration testing
- CI automation with GitHub Actions

The system is designed to prioritize consistency, data integrity, and realistic commerce workflows.

---

## Features

### Admin Dashboard

The platform includes an admin dashboard for:

- Revenue monitoring
- Order analytics
- Recent order tracking
- Store activity overview
- Order management

The dashboard is designed to support future expansion for operational and analytics workflows.

---

### Authentication

- JWT authentication
- Access token + refresh token flow
- HttpOnly cookie authentication
- Role-based authorization
- Demo account restrictions
- Google OAuth login
- Automatic account linking across authentication providers
- Email verification flow for password-based registration

---

### Product Management

- Product variants
- Variant dimensions and options
- Product collections
- Product categories
- Product image signatures
- Variant image matching
- Inventory management

---

### Checkout System

- Checkout session snapshots
- Shipping cost calculation
- Cached shipping estimation workflow
- Expiration handling
- Atomic checkout confirmation
- Stock validation and reduction
- Order creation from checkout snapshots

---

### Order System

- Order snapshots
- Shipment records
- Order status lifecycle
- Payment status lifecycle
- Snap token reuse

---

### Payment Integration

Midtrans integration with:

- Snap token creation
- Payment webhook handling
- Duplicate webhook protection
- Payment status progression handling
- Downgrade protection
- Expired payment handling
- Failed payment handling

---

### Infrastructure

- PostgreSQL
- Redis caching
- Cloudflare R2 integration
- Scheduled jobs with node-cron
- GitHub Actions CI
- Swagger/OpenAPI documentation
- Zod runtime validation

---

## Tech Stack

| Layer             | Technology       |
| ----------------- | ---------------- |
| Runtime           | Node.js          |
| Backend Framework | Express.js       |
| Language          | TypeScript       |
| Database          | PostgreSQL       |
| Query Builder     | Knex.js          |
| Cache             | Redis            |
| Validation        | Zod              |
| Authentication    | JWT              |
| Testing           | Jest + Supertest |
| CI                | GitHub Actions   |
| Payment Gateway   | Midtrans         |
| Object Storage    | Cloudflare R2    |

---

## Commerce Architecture Highlights

### Snapshot-Based Checkout

Checkout data is persisted as immutable snapshots before order creation.

This prevents:

- Product name changes affecting existing orders
- Shipping changes affecting old transactions
- Variant changes corrupting historical order data

---

### Transactional Checkout Confirmation

Checkout confirmation uses database transactions to ensure:

- Stock consistency
- Atomic order creation
- Safe payment preparation
- Cart cleanup synchronization

---

### Payment Webhook Synchronization

Webhook processing includes:

- Signature verification
- Duplicate prevention
- Transaction progression handling
- Downgrade protection
- Payment state synchronization

---

### Runtime Validation

All request validation is handled using Zod.

This includes:

- req.body validation
- req.query validation
- req.params validation
- Type-safe request parsing

---

### Scheduled Jobs

The project uses node-cron for scheduled jobs such as:

- Expiring unpaid orders
- Cleaning abandoned guest carts
- Cleaning expired refresh tokens
- Cleaning orphan product images
- Cleaning orphan variant images
- Cleaning pending verifications

---

### Variant Image Matching

Products support image signature matching based on selected variant options.

Example:

- Color = Black
- Size = XL

The system automatically resolves the best matching product image.

---

### Hierarchical Category System

The platform supports scalable nested category structures.

Example category path:

```txt
menswear/men-clothes/men-t-shirts
```

The category system is designed to support:

- Deep nested storefront navigation
- Category-based product discovery
- Marketing banner targeting
- SEO-friendly category paths

---

### Marketing Banner Targeting

Homepage banners can target:

- Product collections
- Categories
- Nested category paths

This allows dynamic storefront navigation and promotional routing.

---

### Image Processing

The backend uses Sharp for:

- Image optimization
- Image resizing
- Image cropping
- Storage size reduction
- Variant image preparation

---

## Testing

The project includes integration tests covering:

### Checkout

- Successful checkout confirmation
- Stock validation
- Expired checkout sessions
- Invalid checkout state handling

### Payment

- Snap token generation
- Snap token reuse
- Midtrans webhook lifecycle
- Duplicate webhook handling
- Settlement progression
- Downgrade protection
- Expired payment handling
- Failed payment handling
- Invalid signature protection

---

## Continuous Integration

GitHub Actions automatically runs:

- Database migrations
- Full integration test suite

on every push and pull request.

---

## Deployment

The platform is deployed using:

- Railway for API hosting
- Neon PostgreSQL for serverless database infrastructure
- Upstash Redis for caching
- Cloudflare R2 for object storage

---

## Project Structure

```txt
src/
 ├── config/
 ├── constants/
 ├── docs/
 ├── errors/
 ├── infra/
 ├── libs/
 ├── middlewares/
 ├── modules/
 ├── shared/
 ├── types/
 ├── utils/
 ├── workers/
 ├── app.ts
 └── server.ts

tests/
 ├── admin/
 ├── auth/
 ├── payment/
 ├── user/
 ├── helpers/
 ├── types/
 └── setup.ts
```

---

## Environment Variables

Example:

```env
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
MIDTRANS_SERVER_KEY=
RAJAONGKIR_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

---

## Running Locally

### Install dependencies

```bash
npm install
```

### Run development migrations

```bash
npm run knex migrate:latest
```

### Start development server

```bash
npm run dev
```

### Start worker

```bash
npm run worker:dev
```

### Run tests

```bash
npm test
```

---

## API Documentation

API documentation is available via Swagger/OpenAPI.

Production docs:

[Swagger Docs](https://api.commerce.web.id/v1/docs)

---

## Future Improvements

Potential future improvements:

- Discount and promotion engine
- Best-selling product ranking
- Homepage recommendation sections
- Advanced shipment tracking
- Multi-warehouse inventory support
- Real-time analytics dashboard
- Search and filtering improvements
- Storefront personalization

---

## License

MIT
