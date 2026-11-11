# apps/yt-server/Dockerfile
FROM node:20-alpine

# Python, pip ve ffmpeg kurulumu
RUN apk add --no-cache python3 py3-pip ffmpeg

# yt-dlp'yi Alpine uyumlu saf Python paketi olarak kur (--break-system-packages Alpine 3.19+ için gereklidir)
RUN pip3 install --no-cache-dir --break-system-packages -U yt-dlp

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/yt-server/package.json ./apps/yt-server/

RUN pnpm install --filter ./apps/yt-server --frozen-lockfile

COPY apps/yt-server ./apps/yt-server

RUN mkdir -p /app/apps/yt-server/public/videos /app/apps/yt-server/public/audio

WORKDIR /app/apps/yt-server

EXPOSE 3000
CMD ["pnpm", "dev"]

