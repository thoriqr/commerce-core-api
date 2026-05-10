# Commerce Core API

[![CI](https://github.com/thoriqr/commerce-core-api/actions/workflows/ci.yml/badge.svg)](https://github.com/thoriqr/commerce-core-api/actions/workflows/ci.yml)

Backend API for an e-commerce system including authentication, product management, checkout, and order processing.

---

## Features

### Admin Dashboard

- Revenue and order analytics
- Recent order tracking
- Order management
- Store overview

### Authentication

- JWT authentication
- Access token and refresh token flow
- HttpOnly cookie authentication
- Role-based authorization
- Google OAuth login
- Automatic account linking across authentication providers
- Email verification for password-based registration

### Product Management

- Product and variant management
- Variant dimensions and options
- Product collections and categories
- Product images

### Checkout System

- Checkout session handling
- Shipping cost calculation
- Redis caching for shipping estimation
- Checkout expiration handling
- Stock validation during checkout confirmation
- Order creation from checkout data

### Order System

- Order snapshots
- Shipment records
- Order status handling
- Payment status handling

### Payment Integration

Midtrans integration with:

- Snap token creation and reuse
- Payment webhook handling
- Duplicate webhook protection
- Payment status validation
- Expired and failed payment handling

---

## Tech Stack

| Layer             | Technology       |
| ----------------- | ---------------- |
| Runtime           | Node.js          |
| Backend Framework | Express.js       |
| Language          | TypeScript       |
| Database          | PostgreSQL       |
| Database Tools    | Knex.js          |
| Cache             | Redis            |
| Validation        | Zod              |
| Authentication    | JWT              |
| Testing           | Jest + Supertest |
| CI                | GitHub Actions   |
| Payment Gateway   | Midtrans         |
| Object Storage    | Cloudflare R2    |

---

## Technical Details

### Snapshot-Based Checkout

Checkout data is stored as immutable snapshots before order creation to preserve historical order data.

### Transactional Checkout Confirmation

Checkout confirmation uses database transactions for stock validation, order creation, and cart cleanup.

### Payment Webhook Handling

Payment webhooks include signature verification, duplicate prevention, and payment status validation.

### Scheduled Jobs

Background jobs are used for:

- Expiring unpaid orders
- Cleaning expired refresh tokens
- Cleaning abandoned guest carts
- Cleaning unused product images

### Nested Categories

Supports nested category structures such as:

```txt
menswear/men-clothes/men-t-shirts
```

---

## Testing

Integration tests cover flows such as:

### Authentication

- Register
- Login and logout
- Token refresh flow
- Email verification

### Checkout

- Checkout confirmation
- Stock validation
- Expired checkout sessions
- Invalid checkout handling

### Payment

- Snap token generation and reuse
- Midtrans webhook handling
- Duplicate webhook prevention
- Payment status validation
- Expired and failed payment handling
- Invalid signature handling

---

## Continuous Integration

GitHub Actions runs:

- Database migrations
- Integration tests

on every push and pull request.

---

## Deployment

Services used in deployment:

- Railway (API hosting)
- Neon PostgreSQL (database)
- Upstash Redis (caching)
- Cloudflare R2 (object storage)

---

## Running Locally

1. Create a `.env` file based on `.env.example`.

2. Install dependencies:

```bash
npm install
```

3. Run database migrations:

```bash
npm run knex migrate:latest
```

4. Start the development server:

```bash
npm run dev
```

5. Start the worker:

```bash
npm run worker:dev
```

6. Run tests:

```bash
npm test
```

---

## API Documentation

Swagger/OpenAPI documentation:

[Swagger Docs](https://api.commerce.web.id/v1/docs)

---

## Future Improvements

- Discount and promotion system
- Best-selling product features
- Improved product filtering and search
- Multi-warehouse stock support
- Better dashboard analytics
- Shipment tracking improvements

---

## License

MIT
