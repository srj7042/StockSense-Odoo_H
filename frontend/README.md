# StockSense Frontend

Next.js 16 App Router interface for StockSense Inventory Management System.

## Running Frontend

### 1. Local Development Mode

```bash
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Cloudflare Tunnel Mode (Production Build)

Use production mode when running over Cloudflare Tunnel (`cloudflared`) to avoid dev HMR WebSocket host header issues:

```bash
npx next build --webpack
npm run start -- -p 3000
```

Then in another terminal:
```bash
cloudflared tunnel --url http://localhost:3000
```

## Backend Connection

By default, `/api/*` requests automatically proxy to the FastAPI backend running on `http://127.0.0.1:8000`.

To point to a custom API URL, set:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api npm run dev
```
