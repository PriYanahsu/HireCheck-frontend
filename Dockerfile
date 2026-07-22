# ── Build React/Vite ───────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY client ./client
COPY vite.config.ts tsconfig.json tailwind.config.ts postcss.config.js components.json ./

# Bake API URL at build time (Vercel does this via env; Docker needs ARG)
ARG VITE_API_URL=
ARG VITE_IMAGEKIT_PUBLIC_KEY=
ARG VITE_IMAGEKIT_URL_ENDPOINT=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_IMAGEKIT_PUBLIC_KEY=$VITE_IMAGEKIT_PUBLIC_KEY \
    VITE_IMAGEKIT_URL_ENDPOINT=$VITE_IMAGEKIT_URL_ENDPOINT

RUN npm run build

# ── Serve static with nginx ────────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
