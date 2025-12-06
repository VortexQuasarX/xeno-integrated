# Deployment Guide for Xeno

This guide provides step-by-step instructions to deploy the Xeno application components to free-tier hosting services.

## Backend Deployment (Render / Railway)

We recommend **Render** for the backend + database as it offers a free tier for both web services and PostgreSQL.

### 1. Database (PostgreSQL)
1. Create a new **PostgreSQL** database on Render or Railway.
2. Copy the `Internal Database URL` (for internal networking) and `External Database URL` (for local access/migrations).

### 2. Backend Service (`xeno-backend`)
1. Create a new **Web Service** on Render connected to your GitHub repo.
2. **Root Directory**: `xeno-backend`
3. **Build Command**: `npm install && npx prisma generate`
4. **Start Command**: `npm start`
5. **Environment Variables**:
    - `DATABASE_URL`: Your Render/Railway connection string.
    - `JWT_SECRET`: A secure random string.
    - `PORT`: `10000` (Render default) or `5000`.
6. Deploy the service.
7. **Important**: Once deployed, go back to your local machine (or use the Render shell) to run migrations using the *External Database URL*:
   ```bash
   DATABASE_URL="your_external_db_url" npx prisma migrate deploy
   ```

## Frontend Deployment (Vercel)

1. Go to Vercel and **Add New Project**.
2. Import your GitHub repository.
3. **Framework Preset**: Next.js
4. **Root Directory**: `xeno-frontend`
5. **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://xeno-backend.onrender.com/api`).
6. Deploy.

## Post-Deployment Verification
1. Open the Vercel deployment URL.
2. Try to Register/Login.
3. If successful, the Dashboard will load, fetching data from your deployed backend.
