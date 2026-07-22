# HireCheck Frontend (React + Vite)

API lives in the sibling repo `hirecheck-backend` (Spring Boot on Render).

## Local

```bash
# terminal 1 — API
cd ../hirecheck-backend && mvn spring-boot:run

# terminal 2 — UI
npm install
npm run dev
```

Vite proxies `/api` → `http://127.0.0.1:8080` when `VITE_API_URL` is empty.

## Vercel (recommended)

- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://your-api.onrender.com`
- Optional: `VITE_IMAGEKIT_PUBLIC_KEY`, `VITE_IMAGEKIT_URL_ENDPOINT`

## Docker (optional — nginx static)

```bash
docker build \
  --build-arg VITE_API_URL=https://your-api.onrender.com \
  -t hirecheck-web .
docker run -p 80:80 hirecheck-web
```

On Render set `FRONTEND_URL` to your Vercel (or Docker) origin — exact match for CORS.
