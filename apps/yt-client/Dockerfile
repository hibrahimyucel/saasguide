# apps/yt-client/Dockerfile
# 1. Aşama: Derleme (Build)
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/yt-client/package.json ./apps/yt-client/

RUN pnpm install --filter ./apps/yt-client... --filter . --frozen-lockfile


COPY apps/yt-client ./apps/yt-client

WORKDIR /app/apps/yt-client
RUN pnpm build

# 2. Aşama: Sunum (Production Nginx)
FROM nginx:alpine

# Derlenen dosyaları Nginx dizinine kopyala
COPY --from=builder /app/apps/yt-client/dist /usr/share/nginx/html

# Özel Nginx ayarını kopyala
COPY apps/yt-client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

