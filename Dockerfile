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

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
