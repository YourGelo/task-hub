FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

COPY tsconfig.json ./
COPY openapi.json ./
COPY src ./src

ENV DATABASE_URL="postgresql://task_hub:task_hub_password@localhost:5432/task_hub?schema=public"

RUN npx prisma generate
RUN npm run build

EXPOSE 7801

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:7801/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
