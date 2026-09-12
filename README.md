# CommerceCore — Reliable E-Commerce Backend

CommerceCore is a production-oriented e-commerce backend built with **NestJS** and **MongoDB**.  
The project is designed as a **modular monolith** with a separate background worker for asynchronous processing and reliability-focused infrastructure.

## Architecture

```text
                         ┌──────────────────────┐
                         │       Client         │
                         └──────────┬───────────┘
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │     NestJS API       │
                         │                      │
                         │ Auth / Users /       │
                         │ Categories / ...     │
                         └───────┬──────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              ┌───────────┐             ┌───────────┐
              │  MongoDB  │             │   Redis   │
              │           │             │           │
              │ Business  │             │  BullMQ   │
              │  Data +   │             │   Queue   │
              │  Outbox   │             └─────┬─────┘
              └───────────┘                   │
                                             │ Jobs
                                             ▼
                                    ┌──────────────────┐
                                    │   Worker Process │
                                    │                  │
                                    │ Email Processor  │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ SMTP / Email│
                                      └─────────────┘
```

## Key Features

### Authentication & Authorization

- User signup with DTO validation.
- Email verification using OTP.
- Password hashing and secure credential validation.
- JWT-based access-token authentication.
- Role-based authorization with an `ADMIN` guard.
- Deleted users are excluded from normal authentication.
- Short-lived access tokens are used for authenticated API requests.
- Refresh-token rotation and session-based authentication are planned as the next authentication layer.

### Transactional Outbox

The project uses the **Transactional Outbox Pattern** to reliably publish domain events.

```text
Business Operation
       │
       ├── Update business data
       │
       └── Create Outbox Event
                │
                ▼
             COMMIT
                │
                ▼
        Outbox Publisher
                │
                ▼
             BullMQ
```

This prevents the classic failure scenario where the database operation succeeds but publishing the asynchronous event fails.

The outbox publisher includes:

- Atomic event claiming.
- `PENDING`, `PROCESSING`, `PROCESSED`, and `FAILED` states.
- Crash recovery for stale `PROCESSING` events.
- Exponential retry backoff.
- Maximum automatic retry attempts.
- Manual recovery of permanently failed events.

### Asynchronous Processing

The API process and Worker process are separated.

```text
API
 │
 └── Publish Job → Redis / BullMQ
                       │
                       ▼
                    Worker
                       │
                       ▼
                 Email Service
                       │
                       ▼
                      SMTP
```

The Worker owns the email processor, keeping background processing independent from the HTTP API.

### Idempotent Consumer

Processed outbox events are tracked using a dedicated `ProcessedEvent` collection.

This protects the consumer against processing the same event more than once when jobs are retried or redelivered.

The system follows an **at-least-once delivery model**. External side effects such as SMTP email delivery cannot be guaranteed to be exactly-once solely through the database.

### Database Transactions

MongoDB transactions are supported through a dedicated `TransactionService`.

Repositories receive the same `ClientSession` so multiple database operations can participate in one transaction.

## Reliability Model

The current email-verification flow is:

```text
User Signup
    │
    ▼
MongoDB Transaction
    │
    ├── Create User
    ├── Create OTP
    └── Create Outbox Event
            │
            ▼
          COMMIT
            │
            ▼
     Outbox Publisher
            │
            ▼
        BullMQ / Redis
            │
            ▼
      Email Worker
            │
            ▼
      SMTP Provider
```

If Redis is temporarily unavailable:

```text
Outbox Event
     │
     ▼
Publisher fails
     │
     ▼
PENDING
     │
     ▼
Exponential Backoff
     │
     ▼
Retry
```

If the maximum publishing attempts are exhausted:

```text
PENDING
   │
   ▼
PROCESSING
   │
   ▼
Repeated failures
   │
   ▼
FAILED
   │
   ▼
Admin Recovery
   │
   ▼
PENDING
   │
   ▼
Normal Publisher Flow
```

## Project Structure

```text
src/
├── auth/
├── users/
├── categories/
├── sub-categories/
│
├── common/
│   ├── database/
│   ├── outbox/
│   └── idempotency/
│
└── ...
```

The project follows a modular structure where business modules own their domain logic while cross-cutting infrastructure is kept under `common`.

## Tech Stack

- **NestJS**
- **TypeScript**
- **MongoDB**
- **Mongoose**
- **JWT**
- **Passport**
- **BullMQ**
- **Redis**
- **Nodemailer**
- **SMTP**
- **Docker**
- **MongoDB Transactions**

## Design Patterns & Concepts

The project intentionally applies backend engineering concepts beyond basic CRUD:

- Modular Monolith Architecture
- Repository Pattern
- DTO Validation
- JWT Authentication
- Role-Based Authorization
- MongoDB Transactions
- Transactional Outbox Pattern
- Atomic Event Claiming
- Exponential Backoff
- Background Workers
- Queue-Based Asynchronous Processing
- Idempotent Consumers
- At-Least-Once Delivery
- Failure Recovery
- Separation of API and Worker Processes

## Reliability Guarantees

The architecture is designed around the following guarantees:

- Business data and outbox events are committed atomically.
- Failed event publication can be retried.
- Multiple publisher instances cannot simultaneously claim the same outbox event.
- Stale processing locks can be recovered after a publisher crash.
- Failed events can be manually recovered by administrators.
- Duplicate asynchronous delivery is handled at the consumer level.
- Email delivery remains at-least-once rather than falsely claiming exactly-once delivery.

## Roadmap

- Refresh Token Sessions
- Refresh Token Rotation
- Refresh Token Reuse Detection
- Secure Logout and Session Revocation
- Product Management
- Category & Subcategory Management
- Cart
- Orders
- Payment Integration
- Inventory Management
- Redis Caching
- Observability and Metrics
- Automated Testing
- API Documentation
