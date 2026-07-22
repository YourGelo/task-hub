# Task Hub

Task Hub — REST API сервис для учёта задач.

Сервис предоставляет API для создания, просмотра, обновления и soft-delete удаления задач. Архитектура проекта рассчитана на дальнейшее подключение внешних систем через отдельный интеграционный слой, не смешанный с основной бизнес-логикой задач.

## Стек

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- Zod
- Docker

На текущем этапе реализован базовый HTTP-каркас и health-check.

## Запуск в режиме разработки

Установить зависимости:

```bash
npm install
```

Запустить сервер:

```bash
npm run dev
```

Проверить health-check:

```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "service": "task-hub"
}
```

## Скрипты

### `npm run dev`

Запуск приложения в режиме разработки через `tsx watch`.

### `npm run typecheck`

Проверка типов TypeScript без сборки.

### `npm run build`

Сборка проекта в директорию `dist`.

### `npm run start`

Запуск собранного приложения.

## Документация

- `docs/requirements.md` — функциональные требования и принятые правила.
- `docs/api-decisions.md` — решения по API-контракту.
- `docs/architecture.md` — архитектурный подход и будущие интеграции.
