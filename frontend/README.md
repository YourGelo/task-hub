# Task Hub frontend

Отдельный demo-client на Vite, React и TypeScript. Клиент работает с реальным
Task Hub REST API и не встраивается в Express.

## Локальный запуск

    npm install
    npm run dev

Frontend: http://localhost:7802

Backend URL задаётся через `VITE_API_BASE_URL`. Значение для локальной разработки:

    VITE_API_BASE_URL=http://localhost:7801

## Проверки

    npm run typecheck
    npm run lint
    npm run build
