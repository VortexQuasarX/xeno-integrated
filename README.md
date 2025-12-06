# Xeno - Data Ingestion & Insights Application

## Project Overview
Xeno is a comprehensive data ingestion and insights platform designed to seamlessly integrate with Shopify stores. It captures real-time data, processes it, and presents actionable insights through a modern, responsive dashboard.

## Components
- **Frontend (`xeno-frontend`)**: Built with Next.js 16 (App Router), React 19, and TailwindCSS.
- **Backend (`xeno-backend`)**: Built with Express.js, Prisma ORM, and PostgreSQL.
- **Shopify App (`xeno-shopify-app`)**: Remix-based application for Shopify integration.

## Architecture

```mermaid
graph TD
    User[User] -->|Browser| FE[Frontend (Next.js)]
    FE -->|API Requests| BE[Backend (Express.js)]
    BE -->|Query/Mutate| DB[(PostgreSQL)]
    Shopify[Shopify Store] -->|Webhooks| BE
    Shopify -->|App Proxy| ShopifyApp[Shopify App (Remix)]
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Shopify Partner Account (for app integration)

### Backend Setup
1. Navigate to `xeno-backend`:
   ```bash
   cd xeno-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up `.env` file (see `.env.example` or required variables below):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   JWT_SECRET="your_jwt_secret"
   SHOPIFY_API_SECRET="your_shopify_secret"
   ```
4. Run Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
5. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to `xeno-frontend`:
   ```bash
   cd xeno-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login user

### Dashboard
- `GET /api/dashboard/stats`: Get overview statistics
- `GET /api/dashboard/chart`: Get revenue chart data

### Webhooks
- `POST /api/webhooks/shopify/orders/create`: Handle order creation
- `POST /api/webhooks/shopify/products/update`: Handle product updates

## Database Schema (Prisma)
- **User**: Stores user credentials and store info.
- **Store**: Details about the connected Shopify store.
- **Order**: Ingested order data.
- **Product**: Ingested product data.
- **Customer**: Customer details from orders.

## Known Limitations & Assumptions
- **Authentication**: Usage of JWT for session management.
- **Data Sync**: Webhooks are the primary method for real-time updates; initial sync is manual.
- **Security**: Basic implementation; production usage would require deeper security headers and rate limiting.
